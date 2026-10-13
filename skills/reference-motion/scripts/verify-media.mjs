import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.mjs";

export function probeMedia(path, countFrames = false) {
  const args = [
    "-v",
    "error",
    ...(countFrames ? ["-count_frames"] : []),
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    path,
  ];
  return JSON.parse(
    execFileSync("ffprobe", args, {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    }),
  );
}
export async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
export async function verifyMedia(path, config, { decode = true } = {}) {
  const meta = probeMedia(path, true),
    video = meta.streams.find((s) => s.codec_type === "video"),
    audio = meta.streams.find((s) => s.codec_type === "audio");
  if (!video) throw new Error("No video stream.");
  const expectedFrames =
    config.frames ?? Math.round(config.duration * config.fps);
  if (video.width !== config.width || video.height !== config.height)
    throw new Error("Video dimensions differ from the manifest.");
  if (Number(video.nb_read_frames) !== expectedFrames)
    throw new Error(
      `Incomplete video: expected ${expectedFrames} frames, found ${video.nb_read_frames}.`,
    );
  const expectedDuration = expectedFrames / config.fps,
    tolerance = Math.max(0.05, 1 / config.fps);
  if (Math.abs(Number(video.duration) - expectedDuration) > tolerance)
    throw new Error("Video duration differs from the frame budget.");
  const [numerator, denominator] = video.avg_frame_rate.split("/").map(Number);
  if (Math.abs(numerator / denominator - config.fps) > 0.01)
    throw new Error("Frame rate differs from the manifest.");
  if (config.audio && !audio) throw new Error("Expected audio is missing.");
  if (
    audio &&
    config.audio &&
    Number(audio.duration) < expectedDuration - tolerance
  )
    throw new Error("Audio ends before the film.");
  if (decode)
    execFileSync(
      "ffmpeg",
      ["-v", "error", "-xerror", "-i", path, "-f", "null", "-"],
      { stdio: ["ignore", "ignore", "pipe"], maxBuffer: 4 * 1024 * 1024 },
    );
  return {
    file: resolve(path),
    sha256: await sha256(path),
    width: video.width,
    height: video.height,
    fps: numerator / denominator,
    frames: Number(video.nb_read_frames),
    duration: Number(video.duration),
    audio: audio
      ? {
          codec: audio.codec_name,
          channels: audio.channels,
          duration: Number(audio.duration),
        }
      : null,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [file, manifest] = process.argv.slice(2);
  if (!file || !manifest)
    throw new Error("Usage: verify-media.mjs VIDEO MANIFEST");
  const receipt = await verifyMedia(file, await loadConfig(manifest));
  await writeFile(
    file + ".verification.json",
    JSON.stringify(receipt, null, 2) + "\n",
  );
  console.log(JSON.stringify(receipt, null, 2));
}
