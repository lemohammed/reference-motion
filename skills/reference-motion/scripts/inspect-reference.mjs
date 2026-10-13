import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { probeMedia, sha256 } from "./verify-media.mjs";
const [input, directory] = process.argv.slice(2);
if (!input || !directory)
  throw new Error("Usage: inspect-reference.mjs LOCAL_VIDEO OUTPUT_DIRECTORY");
const source = resolve(input),
  out = resolve(directory),
  media = probeMedia(source),
  duration = Number(media.format.duration);
if (!Number.isFinite(duration) || duration <= 0)
  throw new Error("Cannot determine reference duration.");
await mkdir(out, { recursive: true });
const interval = duration / 24;
execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  source,
  "-vf",
  `fps=1/${interval},scale=320:-2,tile=6x4`,
  "-frames:v",
  "1",
  resolve(out, "reference-contact-sheet.jpg"),
]);
await writeFile(
  resolve(out, "reference-metadata.json"),
  JSON.stringify(
    {
      source,
      sha256: await sha256(source),
      duration,
      sampling_interval_seconds: interval,
      streams: media.streams.map((s) => ({
        type: s.codec_type,
        codec: s.codec_name,
        width: s.width,
        height: s.height,
        fps: s.avg_frame_rate,
        channels: s.channels,
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Saved reference contact sheet and metadata in ${out}`);
