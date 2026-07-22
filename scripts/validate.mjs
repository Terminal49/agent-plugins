import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];
const connectorUrl = "https://mcp.terminal49.com";

const paths = {
  cursorMarketplace: ".cursor-plugin/marketplace.json",
  claudeMarketplace: ".claude-plugin/marketplace.json",
  codexMarketplace: ".agents/plugins/marketplace.json",
  cursorPlugin: "plugins/terminal49/.cursor-plugin/plugin.json",
  claudePlugin: "plugins/terminal49/.claude-plugin/plugin.json",
  codexPlugin: "plugins/terminal49/.codex-plugin/plugin.json",
  mcp: "plugins/terminal49/.mcp.json",
  cursorMcp: "plugins/terminal49/mcp.json",
  skill: "plugins/terminal49/skills/terminal49-mcp/SKILL.md",
};

async function readJson(relativePath) {
  try {
    const source = await readFile(resolve(root, relativePath), "utf8");
    const value = JSON.parse(source);
    const formatted = `${JSON.stringify(value, null, 2)}\n`;
    if (source !== formatted) {
      errors.push(`${relativePath} is not consistently formatted`);
    }
    return value;
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

async function requireFile(relativePath) {
  try {
    await access(resolve(root, relativePath));
  } catch {
    errors.push(`${relativePath} is missing`);
  }
}

const [cursorMarketplace, claudeMarketplace, codexMarketplace, cursorPlugin, claudePlugin, codexPlugin, mcp, cursorMcp] =
  await Promise.all([
    readJson(paths.cursorMarketplace),
    readJson(paths.claudeMarketplace),
    readJson(paths.codexMarketplace),
    readJson(paths.cursorPlugin),
    readJson(paths.claudePlugin),
    readJson(paths.codexPlugin),
    readJson(paths.mcp),
    readJson(paths.cursorMcp),
  ]);

await Promise.all(["README.md", "LICENSE", "AGENTS.md", "CONTRIBUTING.md", paths.skill].map(requireFile));

const plugins = [cursorPlugin, claudePlugin, codexPlugin].filter(Boolean);
const names = new Set(plugins.map((plugin) => plugin.name));
const versions = new Set(plugins.map((plugin) => plugin.version));
const descriptions = new Set(plugins.map((plugin) => plugin.description));

if (plugins.length !== 3) errors.push("all three plugin manifests must parse");
if (names.size !== 1 || !names.has("terminal49")) errors.push("plugin manifest names must all be terminal49");
if (versions.size !== 1) errors.push("plugin manifest versions must match");
if (descriptions.size !== 1) errors.push("plugin manifest descriptions must match");

for (const [label, marketplace] of [
  ["Cursor", cursorMarketplace],
  ["Claude", claudeMarketplace],
]) {
  if (!marketplace) continue;
  if (marketplace.name !== "terminal49") errors.push(`${label} marketplace name must be terminal49`);
  const entry = marketplace.plugins?.find((plugin) => plugin.name === "terminal49");
  if (!entry) {
    errors.push(`${label} marketplace is missing terminal49`);
    continue;
  }
  if (entry.source !== "./plugins/terminal49") errors.push(`${label} marketplace source is incorrect`);
  if (entry.version !== plugins[0]?.version) errors.push(`${label} marketplace version must match plugin version`);
}

const codexEntry = codexMarketplace?.plugins?.find((plugin) => plugin.name === "terminal49");
if (!codexEntry) {
  errors.push("Codex marketplace is missing terminal49");
} else {
  if (codexEntry.source?.source !== "local" || codexEntry.source?.path !== "./plugins/terminal49") {
    errors.push("Codex marketplace source is incorrect");
  }
  if (codexEntry.policy?.installation !== "AVAILABLE") errors.push("Codex installation policy must be AVAILABLE");
  if (codexEntry.policy?.authentication !== "ON_INSTALL") errors.push("Codex authentication policy must be ON_INSTALL");
}

for (const [label, plugin] of [
  ["Claude", claudePlugin],
  ["Codex", codexPlugin],
]) {
  if (!plugin) continue;
  if (plugin.skills !== "./skills/") errors.push(`${label} plugin must use the shared skills directory`);
  if (plugin.mcpServers !== "./.mcp.json") errors.push(`${label} plugin must use the shared MCP config`);
  if (plugin.license !== "Apache-2.0") errors.push(`${label} plugin license must be Apache-2.0`);
}

if (cursorPlugin?.skills !== "./skills/") errors.push("Cursor plugin must use the shared skills directory");
if (cursorPlugin?.mcpServers !== "./mcp.json") errors.push("Cursor plugin must use the Cursor MCP config");
if (cursorPlugin?.license !== "Apache-2.0") errors.push("Cursor plugin license must be Apache-2.0");

if (mcp?.mcpServers?.terminal49?.type !== "http") errors.push("Terminal49 MCP transport must be http");
if (mcp?.mcpServers?.terminal49?.url !== connectorUrl) {
  errors.push(`Terminal49 MCP URL must be exactly ${connectorUrl}`);
}
if (JSON.stringify(cursorMcp) !== JSON.stringify(mcp)) {
  errors.push("Cursor and Claude/Codex MCP configurations must match");
}

try {
  const skill = await readFile(resolve(root, paths.skill), "utf8");
  if (!skill.startsWith("---\n")) errors.push("skill must start with YAML frontmatter");
  if (!/^name: terminal49-mcp$/m.test(skill)) errors.push("skill name must be terminal49-mcp");
  if (!/^description: .+$/m.test(skill)) errors.push("skill must have a description");
  if (!skill.includes("search_container")) errors.push("skill must explain search_container");
  if (!skill.includes("track_container")) errors.push("skill must explain track_container");
} catch (error) {
  errors.push(`${paths.skill}: ${error.message}`);
}

if (errors.length > 0) {
  console.error("Plugin validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated Terminal49 plugin ${plugins[0].version} for Cursor, Claude Code, Codex, and Copilot CLI.`);
