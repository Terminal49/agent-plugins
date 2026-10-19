import { readFile, readdir, access, lstat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
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
  skillsDir: "plugins/terminal49/skills",
  skill: "plugins/terminal49/skills/container-tracking/SKILL.md",
  tradeSkill: "plugins/terminal49/skills/trade-intelligence/SKILL.md",
  recordSkill: "plugins/terminal49/skills/record-updates/SKILL.md",
  pluginDir: "plugins/terminal49",
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

await Promise.all(
  ["README.md", "LICENSE", "AGENTS.md", "CONTRIBUTING.md", "plugins/terminal49/README.md", paths.skill, paths.tradeSkill, paths.recordSkill].map(
    requireFile,
  ),
);

const skillNames = await readdir(resolve(root, paths.skillsDir), { withFileTypes: true })
  .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))
  .catch((error) => {
    errors.push(`${paths.skillsDir}: ${error.message}`);
    return [];
  });
const skillPaths = skillNames.map((name) => `${paths.skillsDir}/${name}/SKILL.md`);

const plugins = [cursorPlugin, claudePlugin, codexPlugin].filter(Boolean);
const pluginVersion = claudePlugin?.version ?? cursorPlugin?.version ?? codexPlugin?.version;
const names = new Set(plugins.map((plugin) => plugin.name));
const versions = new Set(plugins.map((plugin) => plugin.version));
const descriptions = new Set(plugins.map((plugin) => plugin.description));
const displayNames = new Set([
  cursorPlugin?.displayName,
  claudePlugin?.displayName,
  codexPlugin?.interface?.displayName,
]);
const homepages = new Set(plugins.map((plugin) => plugin.homepage));
const repositories = new Set(plugins.map((plugin) => plugin.repository));
const authors = new Set(plugins.map((plugin) => plugin.author?.name));
const keywords = new Set(plugins.map((plugin) => JSON.stringify(plugin.keywords)));

if (plugins.length !== 3) errors.push("all three plugin manifests must parse");
if (names.size !== 1 || !names.has("terminal49")) errors.push("plugin manifest names must all be terminal49");
if (versions.size !== 1) errors.push("plugin manifest versions must match");
if (descriptions.size !== 1) errors.push("plugin manifest descriptions must match");
if (displayNames.size !== 1 || !displayNames.has("Terminal49")) {
  errors.push("plugin display names must all be Terminal49");
}
if (homepages.size !== 1) errors.push("plugin manifest homepages must match");
if (repositories.size !== 1) errors.push("plugin manifest repositories must match");
if (authors.size !== 1) errors.push("plugin manifest author names must match");
if (keywords.size !== 1) errors.push("plugin manifest keywords must match");
if (codexPlugin && "displayName" in codexPlugin) {
  errors.push("Codex displayName must be inside interface, not at the manifest root");
}

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
  if (pluginVersion) {
    if (entry.version !== pluginVersion) errors.push(`${label} marketplace version must match plugin version`);
    if (marketplace.metadata?.version !== pluginVersion) {
      errors.push(`${label} marketplace metadata.version must match plugin version`);
    }
  }
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

if (cursorPlugin?.logo) await requireFile(`plugins/terminal49/${cursorPlugin.logo}`);

for (const docPath of ["README.md", "CONTRIBUTING.md", "AGENTS.md", "plugins/terminal49/README.md", ...skillPaths]) {
  try {
    const text = await readFile(resolve(root, docPath), "utf8");
    const suffixed = text.match(/mcp\.terminal49\.com\/[^\s)`"']*/);
    if (suffixed) {
      errors.push(`${docPath} must reference ${connectorUrl} with no path (found ${suffixed[0]})`);
    }
  } catch {
    // missing docs are reported by requireFile above
  }
}

for (const [index, name] of skillNames.entries()) {
  const skillPath = skillPaths[index];
  try {
    const skill = await readFile(resolve(root, skillPath), "utf8");
    if (!skill.startsWith("---\n")) errors.push(`${skillPath} must start with YAML frontmatter`);
    if (skill.match(/^name: (.+)$/m)?.[1] !== name) errors.push(`${skillPath} name must be ${name}`);
    if (!/^description: .+$/m.test(skill)) errors.push(`${skillPath} must have a description`);
    const bundled = new Set(Array.from(skill.matchAll(/`((?:references|scripts)\/[^`\s]+)/g), (match) => match[1]));
    await Promise.all([...bundled].map((file) => requireFile(`${paths.skillsDir}/${name}/${file}`)));
  } catch (error) {
    errors.push(`${skillPath}: ${error.message}`);
  }
}

try {
  const skill = await readFile(resolve(root, paths.skill), "utf8");
  if (!skill.includes("search_container")) errors.push("skill must explain search_container");
  if (!skill.includes("track_container")) errors.push("skill must explain track_container");
} catch (error) {
  errors.push(`${paths.skill}: ${error.message}`);
}

try {
  const skill = await readFile(resolve(root, paths.tradeSkill), "utf8");
  if (!/never ask the user to paste an API key/i.test(skill)) {
    errors.push("trade-intelligence skill must forbid pasting API keys into chat");
  }
  if (!skill.includes("support@terminal49.com")) {
    errors.push("trade-intelligence skill must send accounts without access to support@terminal49.com");
  }
} catch (error) {
  errors.push(`${paths.tradeSkill}: ${error.message}`);
}

try {
  const skill = await readFile(resolve(root, paths.recordSkill), "utf8");
  for (const tool of ["set_party_role", "set_custom_field", "party_roles"]) {
    if (!skill.includes(tool)) errors.push(`record-updates skill must explain ${tool}`);
  }
  if (!/only when the user asks/i.test(skill)) {
    errors.push("record-updates skill must restrict writes to explicit user requests");
  }
} catch (error) {
  errors.push(`${paths.recordSkill}: ${error.message}`);
}

// Agent Skills spec: https://agentskills.io/specification
for (const skillPath of skillPaths) {
  try {
    const skill = await readFile(resolve(root, skillPath), "utf8");
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
    const name = frontmatter.match(/^name: (.+)$/m)?.[1] ?? "";
    const description = frontmatter.match(/^description: (.+)$/m)?.[1] ?? "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      errors.push(`${skillPath} name must be 1-64 lowercase letters, digits, and single hyphens`);
    }
    if (description.length > 1024) errors.push(`${skillPath} description must be at most 1024 characters`);
    const keys = Array.from(frontmatter.matchAll(/^([A-Za-z_-]+):/gm), (match) => match[1]);
    const portable = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
    for (const key of keys) {
      if (!portable.has(key)) errors.push(`${skillPath} frontmatter key ${key} is not portable to claude.ai and ChatGPT`);
    }
  } catch {
    // reported above
  }
}

// Anthropic directory listing fields: https://code.claude.com/docs/en/plugins-reference#directory-listing-fields
const listingFields = {
  supportUrl: "supportURL",
  privacyPolicyUrl: "privacyPolicyURL",
  termsOfServiceUrl: "termsOfServiceURL",
};
for (const field of ["documentationUrl", ...Object.keys(listingFields)]) {
  if (!/^https:\/\//.test(claudePlugin?.[field] ?? "")) errors.push(`Claude plugin ${field} must be an https URL`);
}
for (const [claudeField, codexField] of Object.entries(listingFields)) {
  if (codexPlugin?.interface?.[codexField] !== claudePlugin?.[claudeField]) {
    errors.push(`Codex interface.${codexField} must match Claude ${claudeField}`);
  }
}
for (const icon of [claudePlugin?.icon, codexPlugin?.interface?.logo, codexPlugin?.interface?.composerIcon]) {
  if (!icon) errors.push("Claude icon and Codex logo and composerIcon are required");
  else await requireFile(`${paths.pluginDir}/${icon}`);
}

// OpenAI directory limits: https://developers.openai.com/apps-sdk/deploy/submission
const codexInterface = codexPlugin?.interface ?? {};
if ((codexInterface.displayName ?? "").length > 30) errors.push("Codex interface.displayName must be at most 30 characters");
if ((codexInterface.shortDescription ?? "").length > 30) {
  errors.push("Codex interface.shortDescription must be at most 30 characters");
}
const prompts = codexInterface.defaultPrompt ?? [];
if (prompts.length > 3 || prompts.some((prompt) => prompt.length > 128)) {
  errors.push("Codex interface.defaultPrompt must have at most 3 prompts of at most 128 characters");
}

// Directory checks on the plugin folder: https://claude.com/docs/plugins/pre-submission-checklist
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const credentialRead = /T49_API_KEY|\.t49_api_key|process\.env|os\.environ|getenv\(/;
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.name === "results" && directory.endsWith("evals")) continue;
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}
const pluginFiles = await walk(resolve(root, paths.pluginDir));
if (pluginFiles.length > 512) errors.push(`plugin folder has ${pluginFiles.length} files; the directory holds more than 512 for review`);
for (const file of pluginFiles) {
  const path = relative(root, file);
  const stats = await lstat(file);
  if (stats.isSymbolicLink()) errors.push(`${path} is a symbolic link; commit a regular file`);
  if (stats.size > 256 * 1024) errors.push(`${path} is larger than 256 KiB`);
  if (/(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/.test(path)) errors.push(`${path} is a system file`);
  if (imageExtensions.has(extname(file))) continue;
  const bytes = await readFile(file);
  if (bytes.includes(0)) {
    errors.push(`${path} is a binary file; only images may be binary`);
    continue;
  }
  if (credentialRead.test(bytes.toString("utf8"))) {
    errors.push(`${path} reads a credential from the user's machine; use the MCP server's OAuth connection instead`);
  }
}

if (errors.length > 0) {
  console.error("Plugin validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated Terminal49 plugin ${pluginVersion} for Cursor, Claude Code, and Codex. Copilot CLI installs via the Claude marketplace.`,
);
