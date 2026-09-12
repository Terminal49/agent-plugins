import { readFile } from "node:fs/promises";
import process from "node:process";

const resultPath = process.argv[2];

if (!resultPath) {
  console.error("Usage: node evals/check-delta.mjs <aggregate-result.json>");
  process.exit(2);
}

let result;
try {
  result = JSON.parse(await readFile(resultPath, "utf8"));
} catch (error) {
  console.error(`Could not read eval result: ${error.message}`);
  process.exit(2);
}

const failures = [];

if (result.partial) {
  failures.push(`eval run is partial: ${result.partialReason ?? "unknown reason"}`);
}

for (const evalCase of result.cases ?? []) {
  const delta = evalCase.aggregates?.delta;
  if (typeof delta !== "number" || delta <= 0) {
    failures.push(`${evalCase.name}: expected positive delta, got ${delta ?? "none"}`);
  }
}

const meanDelta = result.aggregates?.meanDelta;
if (typeof meanDelta !== "number" || meanDelta <= 0) {
  failures.push(`expected positive mean delta, got ${meanDelta ?? "none"}`);
}

if (failures.length > 0) {
  console.error("Eval delta gate failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Eval delta gate passed for ${result.cases.length} cases (mean delta ${meanDelta.toFixed(2)}).`,
);
