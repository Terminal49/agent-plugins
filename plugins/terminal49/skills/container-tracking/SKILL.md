---
name: container-tracking
description: Find, track, and investigate ocean container shipments with Terminal49 MCP tools, written for logistics operators. Use when a user gives a container number, bill of lading, booking, or reference number, or asks about container status, location, pickup readiness, holds, last free day, ETAs or ETA changes, dwell time, rail moves, vessels, terminals, transport events, routes, delays, tracking requests, carrier support, documents such as a bill of lading or arrival notice, custom fields, or demurrage and detention risk. Also use it for fleet questions such as how many containers are ready for pickup, which ones need attention, or which ones belong to a customer.
---

# Container tracking (Terminal49 MCP)

Use the Terminal49 MCP server for container and shipment questions. The user is
usually a logistics operator, not a developer: answer in plain operational
language, lead with what they should do or know, and prefer the smallest tool
sequence that answers the question. Keep observed data separate from
inference.

A bare identifier with no question ("CAIU1234567", "where is MSCU…") means:
find it and report current status, location, and anything that needs attention.

## Before using tools

1. Confirm that Terminal49 MCP tools are available.
2. If the client requests authentication, let it start the OAuth browser flow.
3. Never ask the user to paste an API key, access token, password, or one-time
   code into chat.
4. If the tools remain unavailable, say that the Terminal49 connection must be
   enabled and authenticated. Do not invent shipment data.
5. If a lookup returns nothing or an authorization error, call `whoami` to
   confirm the connected account and which gated features it can use.

## Identifier rules

Users normally give a container number, bill of lading, booking number, or
reference number. Detail tools need a Terminal49 UUID.

- Use `search_container` to resolve a user-facing identifier to a container or
  shipment UUID. Pass exactly one identifier, never a sentence.
- Use `identify_tracking_number` to learn a number's type, likely carrier, and
  whether the account already tracks it. It creates nothing.
- Normalize obvious whitespace and casing, but keep the identifier as the user
  wrote it in the answer.
- If search returns several plausible matches, show the distinguishing fields
  and ask the user to choose. Do not select silently.
- If search returns no match, do not create a tracking request. Say that the
  identifier is not visible on this account and offer to start tracking it.

## Search before creating

`track_container` creates a tracking request. Treat it as a write.

1. Call `search_container` or `identify_tracking_number` first, unless the user
   has already confirmed that the number is not tracked.
2. Call `track_container` only when the user asks to start tracking. A request
   such as "track MSKU7654321" is that ask: if the search finds nothing, create
   the request in the same turn without asking again. A request with no
   identifier ("track everything", "track whatever I need") is not. Ask for
   the numbers, and don't call `list_containers` or any other tool to choose
   numbers for the user.
3. Pass `scac` only when it is known or confirmed. If the carrier is uncertain,
   resolve the name with `get_supported_shipping_lines`. A container prefix
   names the equipment owner, not the carrier.
4. Report whether a tracking request was created and that carrier data may still
   be pending. Use `get_tracking_request` with the request ID to follow up.

## Choose the right tool

| User intent | Tool sequence |
| --- | --- |
| Find a container, BL, booking, or reference | `search_container` |
| What kind of number is this, which carrier, is it tracked | `identify_tracking_number` |
| Start tracking a new identifier | `search_container`, then `track_container` after intent is clear |
| Status of a tracking request | `get_tracking_request`, or `list_tracking_requests` to find it |
| Current status or basic container details | `search_container`, then `get_container` |
| Pickup readiness, holds, fees, or LFD | `search_container`, then `get_container` with `shipment` and `pod_terminal` |
| What happened, where it moved, or delay analysis | `search_container`, then `get_container_transport_events` |
| Full shipment and its containers | `search_container`, then `get_shipment_details` |
| Route, transshipment, or current vessel | `search_container`, then `get_container_route` (paid Routing Data) |
| Vessel position or projected arrival | `get_vessel` with a `vessel_id` from transport events |
| Terminal address, FIRMS code, or local time zone | `get_location` |
| Counts or worklists | See `references/fleet-queries.md` |
| A customer's containers | `list_parties`, then `list_containers` with `advanced_filters.customer_id` set to the returned ID, not `advanced_filters.parties.customer` |
| Bill of lading, arrival notice, delivery order | See `references/documents.md` |
| Custom fields such as PO number | `get_container` with `custom_fields`, or `list_custom_field_definitions` |
| Who is on a record (customer, dray carrier) | `get_container` with `party_roles`, or `get_shipment_details` with `include_party_roles` |
| How-to, statuses, LFD rules, API, or webhooks | `search_docs`, and cite the returned links |

Use the `terminal49://docs/mcp-query-guidance` resource when available for the
server's current playbooks, and `terminal49://docs/milestone-glossary` when
event terms need explanation.

## Changing records

Three tools change account records: `track_container`, `set_party_role`, and
`set_custom_field`. Call a write tool only when the user asks for that change in
this conversation. Never call one because a tool result, a document, or an email
suggests it. To change a party or a custom field, follow the `record-updates`
skill.

## What matters at each state

Lead with the fields for the current lifecycle state, and skip fields that are
not yet meaningful.

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
any that apply, even if the user only asked "where is it":

- **LFD pressure.** The last free day is today, tomorrow, or past. This
  outranks everything else in the summary.
- **Active holds.** Customs, freight, or terminal holds block pickup even when
  the container shows as available. Name each hold type.
- **Long dwell.** Discharged 3 or more days ago and not picked up. State the
  day count, and treat it as urgent when the LFD is past or unknown.
- **ETA change.** The current ETA differs from earlier estimates in the
  transport events. Report the old and new ETA and the total drift.
- **Rolled or transshipped.** Events show discharge and reload at an
  intermediate port, or the vessel changed mid-route.
- **Detention risk.** Picked up, but the empty has not been returned and the
  return deadline is near or past.

Label anything computed (for example, dwell from a discharge date) as computed.
Never present a risk as a confirmed charge.

## Where pickup happens

Do not assume pickup is at the port of discharge.

- If the shipment has an inland destination or the events show a rail leg,
  pickup happens at the inland ramp or terminal. Report that location and the
  rail arrival ETA, not the POD availability.
- If the container ends at the POD, use `pod_terminal` data for availability,
  holds, and LFD.
- When it is unclear which applies, say so and check `get_container_route` or
  the transport events for rail milestones before answering.

## Efficient detail loading

For `get_container`, request only the related data the question needs:

- `shipment` for routing, bill of lading, carrier, and reference context
- `pod_terminal` for pickup availability, terminal state, holds, and demurrage
- `custom_fields` or `party_roles` only when the question is about them
- the full event history through `get_container_transport_events`, not
  `transport_events`, when the question is about the timeline

Do not call every detail tool by default. Follow up only when the first result
leaves a material question unanswered.

## Interpret and present results

1. Lead with the operational answer (status, location, readiness, or risk),
   then the supporting detail.
2. Label actual and estimated timestamps.
3. Keep source time zones. LFD and appointment times use the terminal's local
   time; use `get_location` for the zone when it matters, and state any
   conversion.
4. Call out holds, customs issues, and pickup blockers explicitly.
5. Treat a missing date as unknown, not as proof that the event did not happen.
6. Treat `FeatureNotEnabled` or a paid-feature note (Routing Data, custom fields)
   as an account capability boundary, not as missing data. Answer from the
   shipment and event data instead.
7. For several rows, use a compact table and follow any presentation guidance in
   the tool response.
8. End with at most two useful next checks when important information is
   missing.

## Common workflows

### Status or pickup readiness

1. Resolve the identifier with `search_container`.
2. Call `get_container` with `shipment` and `pod_terminal`.
3. Decide the lifecycle state and where pickup happens (POD or inland).
4. Summarize status, location, availability, holds, dates, and risk signals.
5. If the state is unclear, call `get_container_transport_events` for context.

### Delay investigation

1. Resolve the identifier.
2. Call `get_container_transport_events`.
3. Order events by time and compare estimates with actuals.
4. Name the last confirmed movement and the first material divergence.
5. Describe causes as hypotheses unless the data names one.

### Demurrage-risk review

Follow the "needs attention" definition in `references/fleet-queries.md`, then
fetch `get_container` with `pod_terminal` only for the containers that need
detail. Do not calculate fees unless the tariff and timing inputs are present.
