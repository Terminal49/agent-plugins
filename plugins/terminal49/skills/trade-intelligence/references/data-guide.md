# Trade intelligence data guide

## What the data is, and isn't

These points decide whether an answer is right. Keep them in mind when you read
results, and explain the relevant ones to the user.

- **US ocean imports only.** No air freight, exports, or domestic moves.
  Canadian ports such as Vancouver BC appear for US-bound cargo.
- **Volume is physical containers.** Each box counts once, even if it appears on
  several bills of lading. TEUs are available too.
- **Companies are the consignee or notify party on the bill of lading.** Large
  importers usually appear under their own name. Forwarders and customs brokers
  appear as well, so a company's freight can sit partly under its forwarder's
  name, and a "top importers" list can include forwarders. A high
  `share_as_notify_party` is a clue, not proof: large cargo owners can also be
  listed mostly as notify party. Also weigh the name (LOGISTICS, FREIGHT,
  SHIPPING, CUSTOMS, BROKERAGE) and the product mix before calling a company a
  forwarder.
- **One company can appear under several names and locations.** A retailer can
  show up as its distribution centers and divisions, and once per US state it
  imports into. `search_importers` orders results by match quality, not size,
  so read every row. Profile each name that belongs to the company without a
  state, which combines its locations, and tell the user which names you
  included.
- **Missing volume doesn't mean small.** Importers can ask US Customs to keep
  their name off shipping manifests, and much big-retail freight is booked under
  forwarders or suppliers. If a well-known company shows far less than its size
  suggests, say the records are incomplete for it and present the figures as a
  floor.
- **Values are estimates in USD**, not declared customs values. Call them
  "estimated value".
- **Time windows differ by tool.** `get_importer_profile` and `rank_importers`
  use full calendar months ending last month. `search_importers` covers a
  12-month window that can end a month or two before the last full month.
  `get_trade_trends` and `get_trade_breakdown` default to windows that include
  the current, incomplete month. Always state the period, and use full months
  when you compare periods.
- **Don't add up across products or companies.** A container carrying several
  products counts once per product code, and companies can share containers.
  For market totals, use `get_trade_trends` or `get_trade_breakdown` without a
  company filter.
- **No shipment-level details.** No shipper names or individual bills of
  lading, only volumes by company, product, lane, port, and carrier.

## Filters and dimensions

`get_trade_trends` (`group_by`, `filters`) and `get_trade_breakdown` (`dims`,
`filters`) share these names. Name-like fields match a case-insensitive
substring; codes, states, and `pod_coast` match exactly.

| Name | Meaning |
| --- | --- |
| `company`, `company_state` | Importer (consignee or notify party) and its state |
| `hs4`, `hs2` | Commodity code, such as `9401` or `94` |
| `carrier`, `scac` | Ocean carrier name and SCAC code |
| `origin_country`, `origin_region` | Where the goods come from |
| `pol`, `pol_country` | Foreign port of lading and its country |
| `pod`, `pod_coast` | US port of discharge; coast `EAST`, `WEST`, or `GULF` |
| `dest_state` | Final US destination state |
| `container_type`, `reefer` | Equipment type; refrigerated or not |

- **The `company` filter is a substring match.** `IKEA` also matches
  `IKEA SUPPLY AG`. For one company's trend, use `get_importer_profile`.
  Grouping by `company` has no such problem.
- **Names use the records' spelling.** China is `PEOPLES REP OF CHINA`, so
  filter `origin_country` with `china`. Ports are upper case, such as
  `LOS ANGELES`, `LONG BEACH`, `SAVANNAH`, and `VANCOUVER BC`.
- **Carriers come in spelling variants.** MSC appears under more than one
  spelling, `CMA CGM` beside `CMA CGM AMERICA LLC`, and COSCO beside
  `CHINA OCEAN SHIPPING`. Merge them before computing shares, and say you did.
- **Lane dimensions have limits.** `pol`, `pol_country`, and `container_type`
  can't be combined with company or HS dimensions or filters in one query, and
  estimated value isn't available by them. The tool returns the reason when a
  query breaks this rule.

## Windows and partial periods

- `get_trade_trends` defaults to the 24 months ending with the current month.
  Its last point is marked partial. Set `until` to the last full month before
  you compare periods.
- `get_trade_breakdown` defaults to the 12 months ending with the current,
  incomplete month. For an annual total, set `since` and `until` to 12 full
  months.
- Call `get_trade_data_coverage` for the last full month and the latest build
  before you quote a period.
