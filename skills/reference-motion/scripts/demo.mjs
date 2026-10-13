import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { makeDemoAudio } from "./demo-audio.mjs";
import { renderManifest } from "./render.mjs";
const here = dirname(fileURLToPath(import.meta.url)),
  out = resolve(process.argv[2] ?? "runs/reference-motion-demo");
await mkdir(out, { recursive: true });
await makeDemoAudio(resolve(out, "original-score.wav"));
const config = {
  scene: relative(out, resolve(here, "../assets/starter/scene.mjs")),
  width: 1280,
  height: 720,
  fps: 30,
  duration: 8,
  posterTime: 6.8,
  audio: { path: "original-score.wav", mode: "aac" },
};
const manifest = resolve(out, "film.json");
await writeFile(manifest, JSON.stringify(config, null, 2) + "\n");
console.log(
  JSON.stringify(
    await renderManifest(manifest, resolve(out, "reference-motion-demo.mp4")),
    null,
    2,
  ),
);
