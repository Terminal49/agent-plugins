# Terminal49 plugin evals

These cases follow Anthropic's
[plugin eval format](https://code.claude.com/docs/en/plugin-evals). They test
natural logistics questions against fixed Terminal49 MCP responses. The
identifiers and shipment data are illustrative fixtures, not customer data.
[`QUESTION_BANK.md`](QUESTION_BANK.md) defines the layered Tier A–F customer
questions and maps each one to an executable case.

## Coverage

| Tier | Behavior | Cases |
| --- | --- | --- |
| A — find | Existing container and booking/BOL lookup without tracking writes | `where-is-container`, `find-cosu-booking`, `mb-find-*` |
| B — status snapshot | Pickup, hold/customs, LFD, and demurrage-risk snapshots without timeline dumps | `picked-up-yet`, `on-hold`, `last-free-day`, `mb-pickup-*`, `mb-lfd-*`, `mb-holds-*` |
| C — investigate | Shipment delay, ETA, route, event, and inland rail evidence | `investigate-container-delay`, `investigate-shipment`, `eta-to-long-beach`, `any-rail`, `mb-delay-*` |
| D — write / track | Intentional single-ID tracking and vague bulk-write refusal | `track-new-container`, `refuse-track-everything`, `mb-track-*`, `mb-guard-vague-track` |
| E — guardrails | UUID not-found, credential safety, unknown milestones, route entitlement, and vague write refusal | `fake-uuid-not-found`, `no-credentials-in-reply`, `do-not-invent-milestones`, `route-entitlement-miss`, `mb-guard-*` |
| F — phrasing | Mirrored natural wording across all operational clusters | `where-is-container`, `where-is-my-box`, `locate-my-container`, `when-can-i-pick-up`, `is-it-ready-for-pickup`, `did-it-clear-customs`, and every `mb-*` case |
| G — fleet | Dashboard definitions, true totals, and customer filters | `fleet-*` |
| R — record writes | Writes only on request, ID and slug resolution, and no writes from document text | `identify-not-track`, `dray-carrier-read-only`, `set-dray-carrier`, `set-custom-field`, `document-injection` |
| T — trade | Product resolution before ranking, forwarder caveat, and the not-enabled path | `trade-*` |

`mocks/terminal49/_tools.json` is the production server's `tools/list`
response, saved from `packages/mcp/src/__snapshots__/tools-list.json` in
[Terminal49/API](https://github.com/Terminal49/API). Mocked tools carry the real
descriptions and input schemas. Refresh it when the server's tools change:

```sh
gh api repos/Terminal49/API/contents/packages/mcp/src/__snapshots__/tools-list.json \
  -H "Accept: application/vnd.github.raw" | jq -c .result > evals/mocks/terminal49/_tools.json
```

## Prerequisites

- Claude Code 2.1.269 or newer
- Claude Code authentication for the model under test

From this plugin directory, first validate the plugin:

```sh
cd plugins/terminal49
claude plugin validate .
```

## Run with mocks

Use the checked-in mocks for every MCP call:

```sh
claude plugin eval . --mocks record --no-publish
```

`record` is the default mock mode. It reads the fixed responses under
`evals/mocks/` and each case's `mocks/` directory; it does not start the real
Terminal49 MCP server. Do not add `--allow-real-servers` or use `--mocks off`
for this suite.

For a cheaper one-run check while editing a case:

```sh
claude plugin eval . \
  --case where-is-container \
  --runs 1 \
  --ablation none \
  --mocks record \
  --no-publish
```

Run one bank tier with its tag:

```sh
claude plugin eval . \
  --tag tier-b \
  --runs 1 \
  --ablation none \
  --mocks record \
  --no-publish
```

Run only the exact MarketingBuddy wording:

```sh
claude plugin eval . \
  --tag marketingbuddy \
  --mocks record \
  --no-publish
```

Then run the full default three-run, with/without-plugin comparison before
shipping.

To save a machine-checkable full result and require positive delta for every
case:

```sh
claude plugin eval . \
  --mocks record \
  --trust-plugin \
  --no-publish \
  --json /tmp/terminal49-plugin-evals.json

node evals/check-delta.mjs /tmp/terminal49-plugin-evals.json
```

## Reading the result

`WITH` is the score with this plugin loaded, `W/OUT` is the no-plugin baseline,
and `Δ` is `WITH - W/OUT`. Green for this plugin means:

1. the with-plugin arm meets the chosen threshold for every case;
2. the `container-tracking` skill and expected Terminal49 tools fire in the
   with-plugin arm; and
3. outcome graders show a positive per-case and mean `Δ`, demonstrating that
   the plugin improves operational answers rather than merely matching
   baseline Claude behavior.

Skill and MCP sequencing graders are marked `with-only`, so they are indicators
and do not artificially inflate `Δ`. Inspect failures in the generated HTML
report under `evals/results/`.

Follow question-bank-first iteration:

1. change prompts, fixtures, or graders when the bank does not represent the
   customer behavior accurately;
2. run the full mocked comparison;
3. tighten the skill description or workflow text only when the report shows a
   repeatable trigger, tool-selection, or answer gap in the with-plugin arm;
4. keep skill changes thin and rerun the same cases to verify improved `Δ`.

Submit this plugin to the Anthropic community marketplace only after
`claude plugin validate .` passes and the full mocked eval has a green,
positive `Δ` against the no-plugin baseline.
