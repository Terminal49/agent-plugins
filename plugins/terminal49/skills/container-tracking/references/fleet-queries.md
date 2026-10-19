# Fleet queries

Use these rules for counts, worklists, and company-scoped questions across many
containers or shipments.

## Pick the tool

| Question | Tool |
| --- | --- |
| "How many…", "break down by…" | `summarize_containers`, grouped by terminal, status, carrier, POD, hold type, LFD date, or arrival date |
| "Which containers…", a worklist | `list_containers` |
| Shipment-level lists | `list_shipments` |
| Tracking-request lists | `list_tracking_requests` |

## Use the dashboard definitions

Users mean the Terminal49 dashboard views when they ask these questions. Use the
same filter, and report `meta.total` for that set before any narrowing:

| User wording | `list_containers` filter |
| --- | --- |
| Ready for pickup, available | `current_status` `available` |
| Needs attention, at risk of demurrage, containers at risk | `requires_attention` `true`, sorted by `attention_priority` |
| Discharged but not picked up | `current_status` `available,not_available,grounded,awaiting_inland_transfer` |

- Add other conditions (an LFD window, fees, holds) only when the user asks for
  them, and present the result as a subset of the dashboard total.
- Lists and counts include only actively tracked containers, like the
  dashboard. Set `include_stopped_tracking` only for history over a past period,
  such as pickups or dwell last month.

## Report totals honestly

- A page holds at most 25 rows. `meta.total` is the size of the whole set.
  Report it, and never present the number of rows on one page as the total.
- If `links.next` exists, the results are partial. Fetch the next page with the
  same filters and sort, or say that the list shows only the first page.
- When `summarize_containers` returns `truncated` `true`, say that more than 200
  groups exist.
- In `summarize_containers`, `hold_type` counts each hold, so a container with
  two holds counts twice. A null key means the container has no value.
- State the filters and time window you used.

## Filter by a company

1. Resolve the company name to an ID with `list_parties` (`search` takes a name
   or part of one).
2. For a customer, filter with `advanced_filters.customer_id` set to the
   returned ID, not `advanced_filters.parties` with a `customer` key. The
   `customer_id` filter accepts a customer account ID or a customer party ID,
   and `list_parties` can return either.
3. For other roles (shipper, consignee, customs broker, freight forwarder,
   pickup dray carrier), filter with `advanced_filters.parties` keyed by role,
   for example `{ "pickup_dray_carrier": "<id>" }`.
4. If several parties match the name, show them and ask which one the user
   means.

Never pass conversation text or a company name into an ID or filter field.

## Rank a worklist

For "what needs attention" requests, order the rows by LFD pressure first, then
active holds, then dwell since discharge, then ETA changes. Fetch
`get_container` with `pod_terminal` only for rows that need more detail.
