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
- The `trade-intelligence` skill reads a Terminal49 API key that the user saves
  in their own terminal (`T49_API_KEY` or `~/.t49_api_key`). Never put a real
  key in examples, logs, or chat.

## Shared source of truth

- The skills under `plugins/terminal49/skills/` are the shared behavioral
  guidance for all clients:
  - `container-tracking/SKILL.md` covers container and shipment questions with
    the Terminal49 MCP tools.
  - `trade-intelligence/SKILL.md` covers US import market research through the
    Terminal49 REST API, using its bundled `scripts/ti.py` client and
    `references/api.md`.
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
