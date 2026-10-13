import { createRequire } from "node:module";
import { mkdir, writeFile, rename, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { loadConfig } from "./config.mjs";
import { probeMedia, verifyMedia } from "./verify-media.mjs";
const require = createRequire(import.meta.url);

export async function renderManifest(manifest, output) {
  const config = await loadConfig(manifest),
    target = resolve(output),
    pending = target + ".pending.mp4";
  const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
  for (const font of config.fonts)
    if (!GlobalFonts.registerFromPath(font.path, font.family))
      throw new Error(`Unable to load font: ${font.family}`);
  if (config.audio) {
    const media = probeMedia(config.audio.path),
      track = media.streams.find((s) => s.codec_type === "audio");
    if (!track) throw new Error("Audio input has no audio stream.");
    if (config.audio.mode === "copy" && track.codec_name !== "aac")
      throw new Error("Use mode aac to encode non-AAC input.");
    if (
      Number(track.duration ?? media.format.duration) <
      config.frames / config.fps - 0.05
    )
      throw new Error("Audio input is shorter than the film.");
  }
  const module = await import(pathToFileURL(config.scene).href);
  if (typeof module.createScene !== "function")
    throw new Error("Scene must export createScene().");
  const snapshot = (canvas) => loadImage(canvas.toBuffer("image/png"));
  const scene = await module.createScene({
    config,
    createCanvas,
    loadImage,
    snapshot,
  });
  if (typeof scene.renderFrame !== "function")
    throw new Error("createScene must return renderFrame().");
  await mkdir(dirname(target), { recursive: true });
  const canvas = createCanvas(config.width, config.height),
    ctx = canvas.getContext("2d");
  const inputs = config.audio
    ? ["-i", config.audio.path, "-map", "0:v:0", "-map", "1:a:0"]
    : ["-map", "0:v:0"];
  const audio = config.audio
    ? config.audio.mode === "copy"
      ? ["-c:a", "copy"]
      : ["-c:a", "aac", "-b:a", "256k", "-ar", "48000"]
    : [];
  let child, finished, inputError, poster;
  try {
    child = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pixel_format",
        "rgba",
        "-video_size",
        `${config.width}x${config.height}`,
        "-framerate",
        String(config.fps),
        "-i",
        "pipe:0",
        ...inputs,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        ...audio,
        "-t",
        String(config.frames / config.fps),
        "-movflags",
        "+faststart",
        pending,
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + chunk).slice(-16000);
    });
    finished = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`FFmpeg failed (${code}): ${stderr}`)),
      );
    });
    finished.catch(() => {});
    child.stdin.on("error", (error) => {
      inputError = error;
    });
    const posterFrame = Math.round(config.posterTime * config.fps);
    for (let frame = 0; frame < config.frames; frame++) {
      if (inputError) throw inputError;
      ctx.save();
      try {
        await scene.renderFrame(ctx, frame / config.fps);
      } finally {
        ctx.restore();
      }
      if (frame === posterFrame) poster = canvas.toBuffer("image/png");
      const data = ctx.getImageData(0, 0, config.width, config.height).data;
      if (
        !child.stdin.write(
          Buffer.from(data.buffer, data.byteOffset, data.byteLength),
        )
      )
        await once(child.stdin, "drain");
    }
    child.stdin.end();
    await finished;
    const receipt = await verifyMedia(pending, config);
    await rename(pending, target);
    receipt.file = target;
    if (poster) await writeFile(target + ".poster.png", poster);
    await writeFile(
      target + ".verification.json",
      JSON.stringify(receipt, null, 2) + "\n",
    );
    return receipt;
  } catch (error) {
    if (child && child.exitCode === null) {
      child.stdin.destroy();
      child.kill("SIGTERM");
    }
    if (finished) await finished.catch(() => {});
    await rm(pending, { force: true });
    throw error;
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [manifest, output] = process.argv.slice(2);
  if (!manifest || !output)
    throw new Error("Usage: render.mjs MANIFEST OUTPUT.mp4");
  console.log(JSON.stringify(await renderManifest(manifest, output), null, 2));
}
