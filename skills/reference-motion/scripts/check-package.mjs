import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const plugin = JSON.parse(await readFile(resolve(root, "plugin.json"), "utf8"));
const skill = await readFile(
  resolve(root, "skills/reference-motion/SKILL.md"),
  "utf8",
);
if (
  plugin.name !== "reference-motion" ||
  !/^---\nname: reference-motion\ndescription: .+\n---/m.test(skill)
)
  throw new Error("Package/skill metadata do not agree.");
for (const path of [
  "LICENSE",
  "README.md",
  "skills/reference-motion/agents/openai.yaml",
])
  await readFile(resolve(root, path));
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) await check(path);
    else if (entry.name.endsWith(".mjs"))
      execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
  }
}
await check(resolve(root, "skills"));
await check(resolve(root, "tests"));
console.log("Skill metadata, required files and JavaScript syntax checked.");
