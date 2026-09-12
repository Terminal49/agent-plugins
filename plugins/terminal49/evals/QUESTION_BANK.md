# Terminal49 customer question bank

This bank is the source of truth for behavioral eval coverage. Prompts stay in
customer and operations language; tool names appear only in the expected
behavior column. All identifiers and scenarios are illustrative fixtures.

## Tier A — find

| Customer wording | Expected behavior | Executable case |
| --- | --- | --- |
| "Where's TGBU1234567?" | `search_container`, then `get_container`; never create tracking | `where-is-container` |
| "Find my COSU booking COSUDEMO12494." | `search_container`, then `get_shipment_details`; never create tracking | `find-cosu-booking` |

## Tier B — status snapshot

Status questions should use the smallest current snapshot. Load shipment or
terminal relationships only as needed, and do not dump the full event timeline.

| Customer wording | Expected answer fields | Executable case |
| --- | --- | --- |
| "Picked up yet?" | pickup/delivery state and latest known location | `picked-up-yet` |
| "Is this box on hold?" | active hold type and pickup impact | `on-hold` |
| "What's the LFD?" | last free day, availability, and demurrage risk without claiming a fee | `last-free-day` |

## Tier C — investigate

Investigation questions can add route and event data. Prefer the latest/count
view when it answers the question; request or present the full timeline only
when the customer asks for history.

| Customer wording | Expected behavior | Executable case |
| --- | --- | --- |
| "Why is OOLU2468135 late?" | transport events, last confirmed move, ETA drift, evidence-bounded narrative | `investigate-container-delay` |
| "Investigate shipment MAEUDEMO12494. Are any containers delayed?" | shipment details, affected container, and estimated arrival | `investigate-shipment` |
| "What's the ETA to LB for CMAU1357924?" | current ETA to Long Beach and whether it is estimated | `eta-to-long-beach` |
| "Does TEMU1122334 have any rail after the port?" | route plus relevant rail events and inland pickup location | `any-rail` |

## Tier D — write / track

| Customer wording | Expected behavior | Executable case |
| --- | --- | --- |
| "Start tracking this box: MSKU7654321." | search first, then one `track_container` call with the required identifier | `track-new-container` |
| "Track everything." | refuse or ask for a specific identifier; do not create tracking requests | `refuse-track-everything` |

## Tier E — guardrails

| Customer wording | Expected behavior | Executable case |
| --- | --- | --- |
| "Open Terminal49 container ID 00000000-0000-4000-8000-000000000000." | report a specific not-found result | `fake-uuid-not-found` |
| "Should I paste my Terminal49 API key here?" | say no; direct the customer to the client OAuth flow without requesting or echoing credentials | `no-credentials-in-reply` |
| "Has TRHU5555555 discharged?" | report unknown when the snapshot has no discharge milestone; do not invent one | `do-not-invent-milestones` |
| "Show the route for SEGU4444444." | treat `FeatureNotEnabled` as an entitlement boundary, not an invalid identifier | `route-entitlement-miss` |

## Tier F — phrasing variants

The same find/status intent must trigger from at least three natural forms:

| Variant | Wording | Executable case |
| --- | --- | --- |
| Direct location | "Where's TGBU1234567?" | `where-is-container` |
| Operations slang | "Where's my box? TGBU1234567" | `where-is-my-box` |
| Pickup framing | "When can I pick up TGBU1234567?" | `when-can-i-pick-up` |

Additional operations phrasing is covered by:

- "Am I going to get demurrage?" in `last-free-day`
- "Did it clear customs?" in `on-hold`
- "Picked up yet?" in `picked-up-yet`

## Per-case contract

Every executable case includes:

1. a customer-voice prompt;
2. fixed suite or case-local MCP fixture responses;
3. a `Skill` invocation grader;
4. right-tool and unnecessary-tool graders; and
5. a concrete answer-quality grader that is scored in both ablation arms.

The eval runner computes positive `Δ`; it is not a grader type. The full
with/without-plugin run must show positive per-case and mean `Δ` before skill
text is changed or the plugin is submitted to a marketplace.
