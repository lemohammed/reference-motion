import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { renderManifest } from "../skills/reference-motion/scripts/render.mjs";
import { loadConfig } from "../skills/reference-motion/scripts/config.mjs";
import { makeDemoAudio } from "../skills/reference-motion/scripts/demo-audio.mjs";
const dir = resolve("runs/test-media");
await mkdir(dir, { recursive: true });
const manifest = resolve(dir, "film.json"),
  scene = resolve(dir, "scene.mjs"),
  output = resolve(dir, "test.mp4");
await writeFile(
  scene,
  `export function createScene(){return {renderFrame(ctx,t){ctx.fillStyle=t<.5?'#cdb9e6':'#8abcb0';ctx.fillRect(0,0,64,64)}}}`,
);
const config = {
  scene: "scene.mjs",
  width: 64,
  height: 64,
  fps: 6,
  duration: 1,
};
await writeFile(manifest, JSON.stringify(config));
test("renders the full frame budget and preserves the last good file after a scene failure", async () => {
  const result = await renderManifest(manifest, output);
  assert.equal(result.frames, 6);
  assert.equal(result.duration, 1);
  assert.equal(result.audio, null);
  const before = await readFile(output);
  await writeFile(
    resolve(dir, "failing.mjs"),
    `export function createScene(){return {renderFrame(ctx,t){if(t>.2)throw Error('intentional scene failure');ctx.fillRect(0,0,64,64)}}}`,
  );
  await writeFile(
    resolve(dir, "failing.json"),
    JSON.stringify({ ...config, scene: "failing.mjs" }),
  );
  await assert.rejects(
    renderManifest(resolve(dir, "failing.json"), output),
    /intentional scene failure/,
  );
  assert.deepEqual(await readFile(output), before);
  await assert.rejects(access(output + ".pending.mp4"));
});
test("rejects unsupported dimensions and short audio before rendering", async () => {
  const invalid = resolve(dir, "invalid.json");
  await writeFile(invalid, JSON.stringify({ ...config, width: 63 }));
  await assert.rejects(loadConfig(invalid), /even integer/);
  await makeDemoAudio(resolve(dir, "short.wav"), 0.1);
  const short = resolve(dir, "short.json");
  await writeFile(
    short,
    JSON.stringify({ ...config, audio: { path: "short.wav", mode: "aac" } }),
  );
  await assert.rejects(
    renderManifest(short, resolve(dir, "short.mp4")),
    /shorter than the film/,
  );
});
