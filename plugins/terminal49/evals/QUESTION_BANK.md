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

The same find intent uses the same fixtures and grader contract across three
natural forms:

| Variant | Wording | Executable case |
| --- | --- | --- |
| Direct location | "Where's TGBU1234567?" | `where-is-container` |
| Operations slang | "Where's my box? TGBU1234567" | `where-is-my-box` |
| Locate phrasing | "Can you locate my container TGBU1234567?" | `locate-my-container` |

The same pickup-status intent also uses one fixture outcome and one grader
contract across three natural forms:

| Variant | Wording | Executable case |
| --- | --- | --- |
| Pickup timing | "When can I pick up TGBU1234567?" | `when-can-i-pick-up` |
| Readiness | "Is TGBU1234567 ready for pickup yet?" | `is-it-ready-for-pickup` |
| Customs framing | "Did TGBU1234567 clear customs? Can I pick it up?" | `did-it-clear-customs` |

Other operations phrasing appears in `last-free-day`, `on-hold`, and
`picked-up-yet`.

### MarketingBuddy ops-voice matrix

The MarketingBuddy wording is preserved below with the supplied container
number mapped to illustrative fixture `TGBU1234567`. A short context line
selecting that fixture precedes prompts that use only "this" or "it"; the
quoted phrase itself is otherwise unchanged.

| Cluster | Tiers | Exact prompt phrase | Executable case |
| --- | --- | --- | --- |
| Find / where's my box | A, F | "Where’s my box TGBU1234567?" | `mb-find-wheres-box` |
| Find / where's my box | A, F | "Can you find container TGBU1234567?" | `mb-find-container` |
| Find / where's my box | A, F | "Pull up TGBU1234567 for me" | `mb-find-pull-up` |
| Pickup readiness | B, F | "When can I pick this up?" | `mb-pickup-when` |
| Pickup readiness | B, F | "Is TGBU1234567 available for pickup yet?" | `mb-pickup-available` |
| Pickup readiness | B, F | "Can the truck grab this today?" | `mb-pickup-truck` |
| Demurrage / LFD | B, F | "Am I going to get demurrage on this?" | `mb-lfd-demurrage` |
| Demurrage / LFD | B, F | "What’s the last free day?" | `mb-lfd-last-free-day` |
| Demurrage / LFD | B, F | "How many free days do I have left?" | `mb-lfd-free-days` |
| Holds / customs | B, F | "Is it on hold?" | `mb-holds-on-hold` |
| Holds / customs | B, F | "Did it clear customs?" | `mb-holds-customs` |
| Holds / customs | B, F | "Any holds blocking pickup?" | `mb-holds-blocking` |
| Delay / investigate | C, F | "Why is this late?" | `mb-delay-why-late` |
| Delay / investigate | C, F | "What happened to the ETA?" | `mb-delay-eta` |
| Delay / investigate | C, F | "Did it miss the vessel / get rolled?" | `mb-delay-rolled` |
| Track / write | D, F | "Start tracking TGBU1234567 on COSU" | `mb-track-start-cosu` |
| Track / write | D, F | "Can you add this container to tracking?" | `mb-track-add-container` |
| Track / write | D, F | "Track this box for me: TGBU1234567 / COSU" | `mb-track-box-cosu` |
| Guardrail voice | E, F | "Look up container 00000000-0000-0000-0000-000000000000" | `mb-guard-fake-uuid` |
| Guardrail voice | D, E, F | "Track whatever you think I need" | `mb-guard-vague-track` |

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
