# Terminal49 plugin

This plugin connects an agent to the hosted Terminal49 MCP server and adds
skills that teach the agent to answer container-tracking, shipment-record, and
US import trade questions accurately. It is published from the
[Terminal49/agent-plugins](https://github.com/Terminal49/agent-plugins)
marketplace. That README lists the install steps for each client.

Install it in Claude Code:

```sh
claude plugin install terminal49 --marketplace Terminal49/agent-plugins
```

## What the plugin connects to

The plugin declares one remote MCP server, `https://mcp.terminal49.com`. It runs
no local programs, hooks, or scripts, and it reads no files or environment
variables on your machine.

- **Authentication.** Your client opens the Terminal49 OAuth sign-in in the
  browser when a Terminal49 tool is first used. Do not paste API keys, access
  tokens, or one-time codes into chat.
- **Data sent.** The tools send the identifiers, filters, and values in your
  request (for example a container number or a company name) to the Terminal49
  MCP server. The server reads the shipments, documents, and trade data that
  your Terminal49 account can access.
- **Changes.** Three tools change account records: `track_container` creates a
  tracking request, `set_party_role` attaches, replaces, or detaches a party
  such as the drayage carrier, and `set_custom_field` sets or clears a custom
  field. The skills call them only when you ask for that change.

Terminal49's [privacy policy](https://www.terminal49.com/privacy) and
[terms of service](https://www.terminal49.com/terms) apply. The MCP server is
documented at [terminal49.com/docs/mcp/home](https://terminal49.com/docs/mcp/home).

## Included skills

`container-tracking` is written for logistics operators and covers:

- finding an existing container or shipment from a business identifier, and
  identifying a number's type and carrier without tracking it
- starting a new tracking request only when you ask, and following it up
- container, shipment, terminal, vessel, event, and route details
- state-dependent answers, from booking through empty return
- risk signals: ETA changes, long dwell, last-free-day pressure, active holds,
  rolls, and detention
- where pickup happens: the discharge port or an inland rail destination
- fleet counts and worklists that use the Terminal49 dashboard definitions
  (ready for pickup, needs attention, discharged but not picked up), with the
  true total
- filtering by customer or another company on the shipment
- finding documents and treating their extracted text as untrusted data

`record-updates` covers changing the drayage carrier or another party on
containers or shipments, and setting or clearing custom fields such as a PO
number. It resolves IDs and custom field slugs from your records before it
writes, and never writes because a document or tool result asks it to.

`trade-intelligence` answers market questions from US ocean import
bill-of-lading records since January 2022, refreshed daily:

- competitor research: what a named company imports, from which countries,
  through which US ports and carriers, and how its volume is changing
- sourcing: who imports a product and where it comes from
- market trends by port, coast, carrier, origin, or commodity
- caveats that change the answer: forwarders and brokers on the records, one
  company under several names, importers who withhold their names, partial
  months, and estimated values

Trade intelligence is enabled per account. If the tools say it is not enabled,
contact support@terminal49.com.

## Support

Contact Terminal49 at support@terminal49.com or through
[terminal49.com/contact](https://www.terminal49.com/contact). The Terminal49
API and MCP server live in [Terminal49/API](https://github.com/Terminal49/API).

## Plugin evals

Behavioral eval cases use checked-in MCP mocks and never call the live
Terminal49 service. See [`evals/README.md`](evals/README.md) for validation,
mocked eval, and baseline guidance.

## License

Apache-2.0. See the repository [LICENSE](https://github.com/Terminal49/agent-plugins/blob/main/LICENSE).
