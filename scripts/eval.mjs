// Runs the plugin evals without shipping them in the plugin folder.
// `claude plugin eval` reads cases only from inside the plugin root, and the
// Anthropic directory reviews every file in plugins/terminal49. This script
// copies the plugin and evals/terminal49 into .eval-stage/terminal49, runs the
// evals there, and copies the results back to evals/terminal49/results.
//
// Usage: node scripts/eval.mjs [claude plugin eval options]
import { spawnSync } from "node:child_process";
import { cp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const pluginDir = resolve(root, "plugins/terminal49");
const evalsDir = resolve(root, "evals/terminal49");
const stage = resolve(root, ".eval-stage/terminal49");

await rm(stage, { recursive: true, force: true });
await cp(pluginDir, stage, { recursive: true });
await cp(evalsDir, resolve(stage, "evals"), {
  recursive: true,
  filter: (source) => !source.startsWith(resolve(evalsDir, "results")),
});

const result = spawnSync("claude", ["plugin", "eval", stage, ...process.argv.slice(2)], { stdio: "inherit" });

const stagedResults = resolve(stage, "evals/results");
if (existsSync(stagedResults)) await cp(stagedResults, resolve(evalsDir, "results"), { recursive: true });

process.exit(result.status ?? 1);
