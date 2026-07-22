# Terminal49 agent plugins

Install Terminal49 container-tracking tools and workflow guidance in Cursor,
Claude Code, Codex, and GitHub Copilot CLI.

This marketplace currently publishes one plugin:

- **Terminal49** — connects to the hosted Terminal49 MCP server and teaches
  agents how to search, track, and investigate container shipments.

## What the plugin provides

- OAuth connection to `https://mcp.terminal49.com`
- A shared `terminal49-mcp` skill for choosing and sequencing MCP tools
- Guidance for status, pickup readiness, holds, ETAs, routes, delays, and
  demurrage-risk questions
- Guardrails around tracking-request creation, credentials, dates, and missing
  data

The plugin does not contain API keys or customer data. Authentication happens
through the MCP client's OAuth flow.

## Install

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
- “Show containers updated since yesterday and group them by status.”

The example identifier is illustrative. Results depend on the shipments visible
to the authenticated Terminal49 account.

## Repository layout

```text
.
├── .agents/plugins/marketplace.json  # Codex marketplace
├── .claude-plugin/marketplace.json   # Claude Code and Copilot marketplace
├── .cursor-plugin/marketplace.json   # Cursor marketplace
└── plugins/terminal49/
    ├── .claude-plugin/plugin.json
    ├── .codex-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    ├── .mcp.json                     # Claude and Codex MCP adapter
    ├── mcp.json                      # Cursor MCP adapter
    ├── README.md
    ├── assets/logo.svg               # Referenced by the Cursor manifest
    └── skills/terminal49-mcp/SKILL.md
```

The skill is shared. Each platform-specific manifest and MCP file is a thin
adapter around that shared content, with validation keeping the endpoint in
sync.

## Development

Requires Node.js 22 or newer.

```sh
npm run validate
```

CI runs the same validation on every push and pull request via
[`.github/workflows/validate.yml`](.github/workflows/validate.yml).

See [CONTRIBUTING.md](CONTRIBUTING.md) before changing the shared skill or
platform manifests.

## License

Apache-2.0. See [LICENSE](LICENSE).
