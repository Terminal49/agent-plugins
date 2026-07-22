# Terminal49 plugin

This plugin connects an agent to Terminal49's hosted MCP server and supplies a
shared skill for reliable container-tracking workflows. It is published from
the [Terminal49/agent-plugins](https://github.com/Terminal49/agent-plugins)
marketplace — see that README for installation instructions.

## Authentication

The MCP client should open an OAuth authorization flow when Terminal49 tools are
first used. Authenticate in the browser and return to the client. Do not paste
API keys, access tokens, or one-time codes into chat.

## Included skill

`container-tracking` covers:

- finding an existing container or shipment from a business identifier
- starting a new tracking request when the user intends to do so
- inspecting container, shipment, terminal, event, and route details
- querying fleets with filters and pagination
- presenting dates, holds, missing information, and paid-feature boundaries

The Terminal49 API and MCP implementation live in
[Terminal49/API](https://github.com/Terminal49/API).
