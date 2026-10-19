# Agent instructions

This is a public, cross-platform plugin marketplace for Terminal49.

## Safety

- Never commit API keys, OAuth tokens, internal URLs, customer identifiers, or
  customer shipment data.
- Use placeholders or clearly illustrative identifiers in examples.
- Keep the production connector URL exactly
  `https://mcp.terminal49.com`. Do not add `/mcp` to it; the origin is the OAuth
  resource identifier.
- Do not ask users to paste credentials into chat. Let the client initiate its
  OAuth connection flow.
- Nothing in `plugins/terminal49` may read a credential from the user's
  machine (environment variables or home-directory files). Every Terminal49
  call goes through the MCP server's OAuth connection. The Anthropic directory
  holds plugins that read local credentials for review, and `npm run validate`
  rejects them.

## Shared source of truth

- The skills under `plugins/terminal49/skills/` are the shared behavioral
  guidance for all clients:
  - `container-tracking/SKILL.md` covers container and shipment questions with
    the Terminal49 MCP tools.
  - `record-updates/SKILL.md` covers the `set_party_role` and
    `set_custom_field` write tools.
  - `trade-intelligence/SKILL.md` covers US import market research with the
    Terminal49 MCP trade intelligence tools.
- Base skill guidance on the production MCP server's tool descriptions and
  server instructions in
  [Terminal49/API](https://github.com/Terminal49/API) (`packages/mcp/src`).
- `plugins/terminal49/.mcp.json` and `plugins/terminal49/mcp.json` are the MCP
  adapters for Claude/Codex and Cursor respectively. Keep their server entries
  identical.
- `.cursor-plugin`, `.claude-plugin`, and `.codex-plugin` manifests are thin
  platform adapters. Keep their shared fields in sync: `name`, `version`,
  `description`, `author`, `homepage`, `repository`, `license`,
  `keywords`, and the skills/MCP paths (`npm run validate` enforces this).
  Platform-only fields may diverge: Cursor's `logo` and `category`, and Codex's
  `interface` block. Keep `displayName` at the manifest root for Cursor and
  Claude, and inside `interface` for Codex. The values must match.
- Marketplace files must continue to point to `./plugins/terminal49`.

## Validation

Run `npm run validate` after every change. CI runs the same script on every
push and pull request (`.github/workflows/validate.yml`). When a supported
client is installed, also use its native validator before publishing.

## Releases

Bump the version in all three plugin manifests and both versioned marketplace
files for every release. Keep releases small and document user-visible changes.

## Directory submissions

- Anthropic's directory reads `plugins/terminal49` from this repository and
  publishes each new commit on the tracked branch after its checks. Keep
  `plugins/terminal49` free of symbolic links, binary files other than images,
  and files over 256 KiB.
- The OpenAI plugin directory takes a ZIP. Build it with
  `npm run build:openai-zip`, which writes `dist/terminal49-openai-<version>.zip`
  from the Codex manifest, the skills, and the icon. Upload a new ZIP whenever
  the skills or listing metadata change.
