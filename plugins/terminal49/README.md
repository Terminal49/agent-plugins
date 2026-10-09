# Terminal49 plugin

This plugin connects an agent to Terminal49's hosted MCP server and supplies
shared skills for reliable container-tracking workflows and trade-intelligence
research. It is published from
the [Terminal49/agent-plugins](https://github.com/Terminal49/agent-plugins)
marketplace — see that README for installation instructions.

## Authentication

The MCP client should open an OAuth authorization flow when Terminal49 tools are
first used. Authenticate in the browser and return to the client. Do not paste
API keys, access tokens, or one-time codes into chat.

### Trade intelligence API key

The `trade-intelligence` skill calls the Terminal49 REST API with your
Terminal49 API key and needs Python 3. Create a key at
https://app.terminal49.com/developers/api-keys, then save it in your own
terminal (bash or zsh). Never paste it into chat:

```sh
printf 'Terminal49 API key: '; read -rs K; echo; (umask 077; touch ~/.t49_api_key; chmod 600 ~/.t49_api_key; printf %s "$K" > ~/.t49_api_key); unset K
```

Alternatively, set `T49_API_KEY` in the environment your agent runs in.
Trade intelligence is enabled per account. If requests return HTTP 403, contact
support@terminal49.com.

## Included skills

`container-tracking` is written for logistics operators and covers:

- finding an existing container or shipment from a business identifier
- starting a new tracking request when the user intends to do so
- inspecting container, shipment, terminal, event, and route details
- state-dependent answers: which attributes matter at each lifecycle stage,
  from booking through empty return
- surfacing risk signals: ETA changes, long terminal dwell, last-free-day
  pressure, active holds, rolls, and detention
- determining where pickup happens — the discharge port or an inland rail
  destination
- querying fleets with filters and pagination
- presenting dates, holds, missing information, and paid-feature boundaries

`trade-intelligence` answers market questions from US ocean import
bill-of-lading records since 2022, refreshed daily:

- competitor research: what a named company imports, from which countries,
  through which US ports and carriers, and how its volume is trending
- sourcing: who imports a product and where it comes from
- market trends by port, coast, carrier, origin, or commodity
- caveats that change the answer: forwarders and brokers on the records, one
  company under several names, importers who withhold their names, partial
  months, and estimated values

The Terminal49 API and MCP implementation live in
[Terminal49/API](https://github.com/Terminal49/API).

## Plugin evals

Behavioral eval cases cover `container-tracking`, use checked-in MCP mocks,
and never require the live Terminal49 service. See [`evals/README.md`](evals/README.md) for validation,
mocked eval, baseline, and marketplace-submission guidance.
