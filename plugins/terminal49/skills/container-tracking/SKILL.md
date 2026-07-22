---
name: container-tracking
description: Use Terminal49 MCP tools to find, track, and investigate ocean container shipments. Use when a user asks about container status, shipment details, pickup readiness, terminal holds, ETAs, transport events, routes, delays, tracking requests, carrier support, or demurrage risk.
---

# Terminal49 MCP

Use the Terminal49 MCP server for container and shipment questions. Prefer the
smallest tool sequence that answers the question, and preserve the difference
between observed data and inference.

## Before using tools

1. Confirm that Terminal49 MCP tools are available.
2. If the client requests authentication, let it start the OAuth browser flow.
3. Never ask the user to paste an API key, access token, password, or one-time
   code into chat.
4. If the tools remain unavailable, say that the Terminal49 connection must be
   enabled and authenticated. Do not invent shipment data.

## Identifier rules

Users normally provide a container number, bill of lading, booking number, or
reference number. Detail tools require a Terminal49 UUID.

- Use `search_container` to resolve a user-facing identifier to a container or
  shipment UUID.
- Normalize obvious whitespace and casing, but preserve the identifier in the
  response.
- If search returns several plausible matches, show the distinguishing fields
  and ask the user to choose. Do not select silently.
- If search returns no match, do not immediately create a tracking request.
  Explain that the identifier is not currently visible and offer to start
  tracking it.

## Search before creating

`track_container` can create a tracking request. Treat it as a write operation.

1. Call `search_container` first unless the user explicitly asks to add or start
   tracking a new identifier and has already confirmed it is not tracked.
2. Call `track_container` only when the user intends to start tracking.
3. Prefer the `number` field. Supply `numberType` only when the type is known,
   and `scac` only when known or confirmed.
4. If the carrier is uncertain, use `get_supported_shipping_lines` to resolve a
   name or SCAC rather than guessing.
5. Report whether a tracking request was created and whether results may still
   be pending.

## Choose the right tool

| User intent | Tool sequence |
| --- | --- |
| Find a container, BL, booking, or reference | `search_container` |
| Start tracking a new identifier | `search_container`, then `track_container` after intent is clear |
| Current status or basic container details | `search_container`, then `get_container` with `shipment` |
| Pickup readiness, terminal availability, holds, or LFD | `search_container`, then `get_container` with `shipment` and `pod_terminal` |
| What happened, where it moved, or delay analysis | `search_container`, then `get_container_transport_events` |
| Full shipment and its containers | `search_container`, then `get_shipment_details` |
| Multi-leg route, transshipment, vessels, or itinerary | `search_container`, then `get_container_route` |
| Containers or shipments matching operational filters | `list_containers` or `list_shipments` |
| Tracking-request status or audit | `list_tracking_requests` |
| Supported carrier or SCAC lookup | `get_supported_shipping_lines` |

Use the `terminal49://docs/mcp-query-guidance` resource when available for the
server's current intent-to-tool playbooks. Use
`terminal49://docs/milestone-glossary` when event terminology needs explanation.

## Efficient detail loading

For `get_container`, request only the related data needed:

- `shipment` for routing, bill of lading, carrier, and reference context
- `pod_terminal` for pickup availability, terminal state, holds, and demurrage
  questions
- `transport_events` only when the full event history is needed; prefer
  `get_container_transport_events` when the question is purely about the
  timeline

Do not call every detail tool by default. Follow up only when the first result
leaves a material question unanswered.

## Fleet queries

- Use `list_containers` for container-level operational views and
  `list_shipments` for shipment-level views.
- Apply filters supplied by the user: `status`, POD `port` LOCODE, carrier SCAC,
  and `updated_after` in ISO 8601 form.
- Use pagination instead of silently assuming the first page is complete.
- State the filters and time boundary used in the answer.

## Interpret and present results

1. Lead with the current answer: status, location, readiness, or risk.
2. Separate actual timestamps from estimated timestamps and label each clearly.
3. Preserve source time zones. If converting a time, state the target time zone.
4. Call out terminal holds, customs issues, and pickup blockers explicitly.
5. Treat missing dates as unknown, not as evidence that an event did not occur.
6. Treat `FeatureNotEnabled` from `get_container_route` as an account capability
   boundary, not as missing route data. Use available shipment and event data as
   the alternative.
7. For multi-row results, use a compact table and honor any response-contract
   presentation guidance returned by the server.
8. End with at most two useful next checks when important information is
   incomplete.

## Common workflows

### Status or pickup readiness

1. Resolve the identifier with `search_container`.
2. Call `get_container` with `shipment` and `pod_terminal`.
3. Summarize current status, terminal, availability, holds, and relevant dates.
4. If the state is unclear, call `get_container_transport_events` for context.

### Delay investigation

1. Resolve the identifier.
2. Call `get_container_transport_events`.
3. Order events chronologically and compare estimates with actuals.
4. Identify the last confirmed movement and the first material divergence.
5. Describe likely causes as hypotheses unless the data explicitly names one.

### Demurrage-risk review

1. Use `list_containers` with the narrowest known operational filters.
2. Fetch `get_container` with `pod_terminal` for the candidates that need detail.
3. Prioritize known pickup LFDs, active terminal holds, discharge state, and
   availability.
4. Do not calculate fees unless the required tariff and timing inputs are
   present. Label any risk assessment separately from an actual charge.
