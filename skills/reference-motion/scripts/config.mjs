import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function loadConfig(filename) {
  const path = resolve(filename),
    base = dirname(path),
    value = JSON.parse(await readFile(path, "utf8"));
  for (const key of ["width", "height"])
    if (!Number.isInteger(value[key]) || value[key] < 2 || value[key] % 2)
      throw new Error(`${key} must be a positive even integer.`);
  for (const key of ["fps", "duration"])
    if (!Number.isFinite(value[key]) || value[key] <= 0)
      throw new Error(`${key} must be positive.`);
  if (typeof value.scene !== "string" || !value.scene)
    throw new Error("A trusted scene module is required.");
  const config = {
    ...value,
    scene: resolve(base, value.scene),
    frames: Math.round(value.duration * value.fps),
    assets: {},
    fonts: [],
  };
  if (config.frames < 1)
    throw new Error("The film must contain at least one frame.");
  await access(config.scene);
  for (const [key, file] of Object.entries(value.assets ?? {})) {
    if (typeof file !== "string")
      throw new Error(`Asset ${key} must be a local path.`);
    config.assets[key] = resolve(base, file);
    await access(config.assets[key]);
  }
  for (const font of value.fonts ?? []) {
    if (typeof font.path !== "string" || typeof font.family !== "string")
      throw new Error("Fonts need path and family.");
    const path = resolve(base, font.path);
    await access(path);
    config.fonts.push({ ...font, path });
  }
  if (value.audio) {
    if (
      typeof value.audio.path !== "string" ||
      !["copy", "aac"].includes(value.audio.mode ?? "aac")
    )
      throw new Error("Audio needs a path and copy/aac mode.");
    config.audio = {
      ...value.audio,
      path: resolve(base, value.audio.path),
      mode: value.audio.mode ?? "aac",
    };
    await access(config.audio.path);
  }
  config.posterTime = Math.min(
    (config.frames - 1) / config.fps,
    Math.max(0, Number(value.posterTime ?? 0)),
  );
  if (!Number.isFinite(config.posterTime))
    throw new Error("posterTime must be finite.");
  return config;
}
