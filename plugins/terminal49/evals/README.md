# Terminal49 plugin evals

These cases follow Anthropic's
[plugin eval format](https://code.claude.com/docs/en/plugin-evals). They test
natural logistics questions against fixed Terminal49 MCP responses. The
identifiers and shipment data are illustrative fixtures, not customer data.

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

Then run the full default three-run, with/without-plugin comparison before
shipping.

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

Submit this plugin to the Anthropic community marketplace only after
`claude plugin validate .` passes and the full mocked eval has a green,
positive `Δ` against the no-plugin baseline.
