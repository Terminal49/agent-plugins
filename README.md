# Terminal49 agent plugins

Install Terminal49 container-tracking tools, trade-intelligence research, and
workflow guidance in Grok Bot, Cursor, Claude Code, Codex, and GitHub Copilot
CLI.

This marketplace currently publishes one plugin:

- **Terminal49** — connects to the hosted Terminal49 MCP server and teaches
  agents how to search, track, and investigate container shipments, and how to
  research US ocean imports with Terminal49 trade intelligence.

## What the plugin provides

- OAuth connection to `https://mcp.terminal49.com`
- A `container-tracking` skill for choosing and sequencing MCP tools: status,
  pickup readiness, holds, ETAs, routes, delays, demurrage risk, fleet counts
  that match the Terminal49 dashboard, customer filters, and documents
- A `record-updates` skill for changing the drayage carrier, other parties, and
  custom fields, only when you ask
- A `trade-intelligence` skill for competitor research, sourcing, and market
  trends from US ocean import bill-of-lading records since 2022 (for accounts
  with trade intelligence enabled)
- Guardrails around tracking requests and other writes, credentials, untrusted
  document text, dates, and missing data

The plugin contains no API keys, scripts, or customer data. Every Terminal49
call goes through the MCP client's OAuth flow.

## Install

### Grok Bot (Cursor Agents / Grok Bot)

In Grok Bot: **Plugins** → search **Terminal49** → **Add** →
**Authenticate**. Or tell any bot: “Install the Terminal49 plugin.”

If the plugin is unavailable, ask the bot to add a custom MCP at
`https://mcp.terminal49.com`, then authorize.

1. **Plugins** → search **Terminal49**
2. **Add** → **Authenticate** with your Terminal49 account
3. Otherwise, add the custom connector `https://mcp.terminal49.com`

### Cursor

In Cursor chat, run:

```text
/add-plugin https://github.com/Terminal49/agent-plugins
```

Then select and install **Terminal49**. Cursor will prompt you to connect the
MCP server when the plugin first needs it.

### Claude Code

```sh
claude plugin marketplace add Terminal49/agent-plugins
claude plugin install terminal49@terminal49
```

### Codex

```sh
codex plugin marketplace add Terminal49/agent-plugins
codex plugin add terminal49@terminal49
```

### GitHub Copilot CLI

Copilot CLI can read the Claude-compatible marketplace included in this
repository:

```sh
copilot plugin marketplace add Terminal49/agent-plugins
copilot plugin install terminal49@terminal49
```

## Try it

After connecting your Terminal49 account, ask your agent:

- “Where is container ABCU1234567?”
- “Is this container ready for pickup, and are there any holds?”
- “Explain what changed in this container's journey.”
- “How many of my containers are ready for pickup?”
- “Set the drayage carrier on ABCU1234567 to Example Trucking.”
- “Who are the largest US importers of office chairs, and where do they source
  them?”

The example identifier is illustrative. Results depend on the shipments visible
to the authenticated Terminal49 account. Trade-intelligence questions need an
account with trade intelligence enabled.

## Repository layout

```text
.
├── .agents/plugins/marketplace.json  # Codex marketplace
├── .claude-plugin/marketplace.json   # Claude Code and Copilot marketplace
├── .cursor-plugin/marketplace.json   # Cursor marketplace
├── openai/review.json                # OpenAI directory review cases, merged into the ZIP
├── openai/listing.json               # OpenAI package name, version, category, and MCP URL for the existing plugin
├── scripts/
│   ├── build-openai-zip.mjs          # Builds the OpenAI directory ZIP
│   └── validate.mjs
└── plugins/terminal49/
    ├── .claude-plugin/plugin.json
    ├── .codex-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    ├── .mcp.json                     # Claude and Codex MCP adapter
    ├── mcp.json                      # Cursor MCP adapter
    ├── README.md
    ├── assets/
    │   ├── icon.svg                  # Square icon for the directories
    │   └── logo.svg                  # Referenced by the Cursor manifest
    ├── evals/                        # Mocked behavioral evals
    └── skills/
        ├── container-tracking/
        │   ├── SKILL.md
        │   └── references/           # Fleet queries and documents
        ├── record-updates/SKILL.md
        └── trade-intelligence/
            ├── SKILL.md
            └── references/data-guide.md
```

The skills are shared. Each platform-specific manifest and MCP file is a thin
adapter around that shared content, with validation keeping the endpoint in
sync.

## Development

Requires Node.js 22 or newer.

```sh
npm run validate
npm run build:openai-zip   # writes dist/terminal49-openai-<openai version>.zip
```

CI runs the same validation on every push and pull request via
[`.github/workflows/validate.yml`](.github/workflows/validate.yml).

See [CONTRIBUTING.md](CONTRIBUTING.md) before changing the shared skill or
platform manifests.

## License

Apache-2.0. See [LICENSE](LICENSE).
