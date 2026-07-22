---
name: container-tracking
description: Find, track, and investigate ocean container shipments with Terminal49 MCP tools, written for logistics operators. Use when a user provides a container number, bill of lading, booking, or reference number, or asks about container status, location, pickup readiness, terminal holds, last free day, ETAs or ETA changes, dwell time, rail moves, inland destinations, transport events, routes, delays, tracking requests, carrier support, or demurrage and detention risk.
---

# Container tracking (Terminal49 MCP)

Use the Terminal49 MCP server for container and shipment questions. The user is
usually a logistics operator, not a developer: answer in plain operational
language, lead with what they should do or know, and prefer the smallest tool
sequence that answers the question. Preserve the difference between observed
data and inference.

A bare identifier with no question ("CAIU1234567", "where is MSCU…") means:
find it and report current status, location, and anything that needs attention.

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
| Multi-leg route, rail leg, transshipment, or itinerary | `search_container`, then `get_container_route` |
| Containers or shipments matching operational filters | `list_containers` or `list_shipments` |
| Tracking-request status or audit | `list_tracking_requests` |
| Supported carrier or SCAC lookup | `get_supported_shipping_lines` |

Use the `terminal49://docs/mcp-query-guidance` resource when available for the
server's current intent-to-tool playbooks. Use
`terminal49://docs/milestone-glossary` when event terminology needs explanation.

## What matters at each state

Which attributes are worth reporting depends on where the container is in its
lifecycle. Lead with the fields for the current state; skip fields that are not
yet meaningful.

| State | Lead with |
| --- | --- |
| Booked, before departure | ETD, POL, vessel and voyage, whether carrier data has started flowing |
| On the water | POD ETA and any change to it, current vessel, transshipment ports |
| Arrived at POD, not yet discharged | Actual arrival vs the last ETA, discharge status, holds already visible |
| Discharged at the POD terminal | Availability, holds, last free day, days since discharge, terminal name |
| Moving inland by rail | Rail departure and arrival events, destination ramp and its ETA, that pickup happens inland |
| Available for pickup | Pickup location, LFD and remaining free days, confirmation that holds are cleared |
| Picked up (full out) | Delivery status, empty-return deadline, whether the empty has been returned |

## Risk signals to surface

Check for these whenever the data is already in hand, and lead the answer with
any that apply — even if the user only asked "where is it":

- **ETA change** — the current ETA differs from earlier estimates in the
  transport events. Report old vs new and the cumulative drift.
- **Long dwell** — discharged 3 or more days ago and not picked up. State the
  day count; treat it as urgent when the LFD is past or unknown.
- **LFD pressure** — last free day is today, tomorrow, or past. This outranks
  everything else in the summary.
- **Active holds** — customs, freight, or terminal holds block pickup even when
  the container shows as available. Name each hold type.
- **Rolled or transshipped** — events show discharge and reload at an
  intermediate port, or the vessel changed mid-route.
- **Detention risk** — picked up but the empty has not been returned and the
  return deadline is near or past.

Label anything inferred (for example, dwell computed from a discharge date) as
computed, and never present a risk as a confirmed charge.

## Where pickup happens

Do not assume pickup is at the port of discharge. Check the shipment
destination and route:

- If the shipment has an inland destination or the route/events show a rail
  leg, pickup happens at the inland ramp or destination terminal — report that
  location and the rail arrival ETA, not the POD availability.
- If the container terminates at the POD, use `pod_terminal` data for
  availability, holds, and LFD.
- When it is unclear which applies, say so and check
  `get_container_route` or the transport events for rail milestones before
  answering.

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
- For "what needs attention" requests, rank results by the risk signals above:
  LFD pressure first, then holds, then dwell, then ETA changes.

## Interpret and present results

1. Lead with the operational answer: status, location, readiness, or risk —
   then supporting detail.
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
3. Determine the lifecycle state and where pickup happens (POD or inland).
4. Summarize status, location, availability, holds, relevant dates, and any
   risk signals.
5. If the state is unclear, call `get_container_transport_events` for context.

### Delay investigation

1. Resolve the identifier.
2. Call `get_container_transport_events`.
3. Order events chronologically and compare estimates with actuals.
4. Identify the last confirmed movement and the first material divergence.
5. Describe likely causes as hypotheses unless the data explicitly names one.

### Demurrage-risk review

1. Use `list_containers` with the narrowest known operational filters.
2. Fetch `get_container` with `pod_terminal` for the candidates that need
   detail.
3. Prioritize known pickup LFDs, active terminal holds, discharge state,
   availability, and dwell days since discharge.
4. Do not calculate fees unless the required tariff and timing inputs are
   present. Label any risk assessment separately from an actual charge.
