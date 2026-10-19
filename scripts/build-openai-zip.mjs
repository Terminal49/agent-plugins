// Builds the ZIP that the OpenAI plugin directory accepts at
// https://platform.openai.com/plugins (Codex package format):
// https://developers.openai.com/plugins/deploy/submission
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const pluginDir = resolve(root, "plugins/terminal49");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const manifest = await readJson(join(pluginDir, ".codex-plugin/plugin.json"));
const mcp = await readJson(join(pluginDir, ".mcp.json"));
const { review, publication } = await readJson(resolve(root, "openai/review.json"));
// The plugin already exists in the OpenAI dashboard. Uploads must keep its
// package name and raise its version, which is separate from the repo version.
const listing = await readJson(resolve(root, "openai/listing.json"));

const stage = resolve(root, "dist/terminal49-openai");
const zipPath = resolve(root, `dist/terminal49-openai-${listing.version}.zip`);
await rm(stage, { recursive: true, force: true });
await rm(zipPath, { force: true });

async function writeStaged(path, contents) {
  await mkdir(dirname(join(stage, path)), { recursive: true });
  await writeFile(join(stage, path), contents);
}

const icons = new Set([manifest.interface.logo, manifest.interface.composerIcon]);
await writeStaged(
  ".codex-plugin/plugin.json",
  `${JSON.stringify({ ...manifest, name: listing.name, version: listing.version, interface: { ...manifest.interface, category: listing.category }, extensions: { "com.openai": { review, publication } } }, null, 2)}\n`,
);
// The Codex-format .mcp.json in the submission guide names only the url.
const servers = Object.fromEntries(Object.entries(mcp.mcpServers).map(([name, { url }]) => [name, { url }]));
await writeStaged(".mcp.json", `${JSON.stringify({ mcpServers: servers }, null, 2)}\n`);
await cp(join(pluginDir, "skills"), join(stage, "skills"), { recursive: true });
for (const icon of icons) await cp(join(pluginDir, icon), join(stage, icon));
await cp(join(pluginDir, "README.md"), join(stage, "README.md"));

async function list(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? list(join(directory, entry.name)) : [join(directory, entry.name)])),
  );
  return nested.flat();
}
const files = (await list(stage)).map((file) => relative(stage, file)).sort();

const fixedTime = new Date("2026-01-01T00:00:00Z");
for (const file of files) await utimes(join(stage, file), fixedTime, fixedTime);
execFileSync("zip", ["-X", "-q", zipPath, ...files], { cwd: stage });

const zipped = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" }).trim().split("\n").sort();
const errors = [];
if (JSON.stringify(zipped) !== JSON.stringify(files)) errors.push("ZIP contents differ from the staged files");
const allowed = [
  /^\.codex-plugin\/plugin\.json$/,
  /^\.mcp\.json$/,
  /^README\.md$/,
  /^assets\/[^/]+\.svg$/,
  /^skills\/[a-z0-9-]+\/SKILL\.md$/,
  /^skills\/[a-z0-9-]+\/references\/[^/]+\.md$/,
];
for (const file of zipped) {
  if (!allowed.some((pattern) => pattern.test(file))) errors.push(`${file} is not an allowed ZIP entry`);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(listing.name ?? "") || listing.name.length > 64) {
  errors.push("openai/listing.json name must be the OpenAI package name");
}
if (!listing.category) errors.push("openai/listing.json category must match the dashboard category title");
if (!/^\d+\.\d+\.\d+$/.test(listing.version ?? "")) errors.push("openai/listing.json version must be semver");
if (Object.keys(servers).length !== 1) errors.push("the ZIP must declare exactly one MCP server");
if (manifest.apps || manifest.hooks) errors.push("the OpenAI directory rejects apps and lifecycle hooks");
const cases = review?.test_cases ?? {};
if (cases.positive?.length !== 5 || cases.negative?.length !== 3) {
  errors.push("initial MCP review needs exactly five positive and three negative test cases");
}
if (typeof review?.commerce !== "boolean") errors.push("review.commerce must be true or false");
if (!publication?.release_notes) errors.push("publication.release_notes is required");

if (errors.length > 0) {
  console.error("OpenAI ZIP check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Wrote ${relative(root, zipPath)} with ${zipped.length} files:`);
for (const file of zipped) console.log(`  ${file}`);
