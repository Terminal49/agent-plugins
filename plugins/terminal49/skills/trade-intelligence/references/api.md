# Trade intelligence API reference

All calls go through `scripts/ti.py <endpoint> '<json body>'`, which calls the Terminal49 API at
`https://api.terminal49.com` with the user's Terminal49 API key and prints the JSON.

## Contents
- Endpoints at a glance
- companies/search
- companies/profile
- commodities/search
- importers/top
- trends
- breakdown
- Filters and dimensions (trends, breakdown)
- Errors

## Endpoints at a glance

| Endpoint | Use it to | Speed |
|---|---|---|
| `meta` | See the data window: the 12-month search window, how far back history goes, the partial month | ms |
| `companies/search` | Find importers by (fuzzy) name and/or what they import, or list the largest importers matching filters | ~100 ms |
| `companies/profile` | Everything about one importer: totals, monthly trend, ports, origins, carriers, destinations, HS4 mix | ~100 ms |
| `commodities/search` | Turn a product description into HS4 codes | ~100 ms |
| `importers/top` | Rank importers by containers for an HS4, port, and/or origin | ~100 ms |
| `trends` | Time series (month/quarter/year), split by up to 2 dimensions, any filters | ~100 ms |
| `breakdown` | Nested totals with subtotals (e.g. region > country > port) | ~100 ms |

Rate limit: about 120 requests a minute per API key. Plenty for a conversation; don't loop over hundreds of companies.

## companies/search

```json
{"name": "home depot", "imports": "frozen shrimp", "state": "FL", "port_of_discharge": "Long Beach",
 "origin_country": "Vietnam", "min_containers": 100, "limit": 10}
```
All fields optional; `limit` 1–50 (default 10). `name` is fuzzy (typos and partial names are fine). `imports` is
semantic ("frozen shrimp", "office chairs"). With neither, it lists the largest importers matching the filters.

Each result: `company_name`, `company_state` (may be null or a Canadian province), `containers` (12 months, as
consignee or notify party), `containers_as_consignee`, `containers_as_notify_party`, `teus`, `estimated_value`,
`reefer_share`, `first_month`, `last_month`, `top_ports`, `top_origins`, `top_carriers`, `top_commodities` (HS4 with
description, value, containers), `score`. The response also carries `index` (same as `meta`).

**Results are ordered by match score, not size.** The same company appears once per state it imports under
(`HOME DEPOT` in GA, again in FL, again in CA, …). Read the whole list before answering.

## companies/profile

```json
{"company_name": "HOME DEPOT", "company_state": "GA", "months": 12}
```
`company_name` must be the exact string from `companies/search`. Omit `company_state` to combine every state row for
that name (usually what you want for "how much does X import"). `months` 1–60, full calendar months ending last month.

Returns `since`, `until`, `found`, `totals` (`containers`, `containers_as_consignee`, `containers_as_notify_party`,
`teus`, `states`), `monthly[]`, `ports_of_discharge[]`, `origin_countries[]`, `carriers[]`, `destination_states[]`,
`commodities_hs4[]` (with `estimated_value`), `notes[]`. If `found` is false, the name didn't match exactly: search
again.

## commodities/search

```json
{"query": "office chairs", "limit": 10}
```
`query` is a product description or an HS code prefix ("9401", "94"). Returns HS4 codes with `description`,
`common_goods` (wording seen on bills of lading), 12-month `estimated_value`, number of `companies`, and `score`.
Check `common_goods` to confirm the code really is the user's product: HS descriptions are terse and often truncated.

## importers/top

```json
{"hs4": "9401", "port_of_discharge": "savannah", "origin_country": "vietnam", "months": 12, "limit": 20}
```
Any combination of filters; `limit` 1–100. Ranked by containers; includes `estimated_value` when `hs4` is given.
Each importer: `company_name`, `states[]`, `containers`, `teus`, `estimated_value`. The ranking combines a company's
state rows. It does **not** say whether a company is a consignee or notify party; for that, look the company up in
one `companies/search` call (see "How to work" in `SKILL.md`).

## trends

```json
{"measure": "containers", "group_by": ["origin_country"], "filters": {"hs4": "9401"},
 "interval": "quarter", "since": "2024-01", "until": "2026-09", "top": 5}
```
- `measure`: `containers` (default), `teus`, `estimated_value`.
- `group_by`: up to 2 dimensions; keeps the `top` groups (1–50, default 10) by total over the range.
- `interval`: `month` (default), `quarter`, `year`.
- `since` / `until`: `YYYY-MM`, inclusive. Default: the last 24 months up to the current month, which is partial
  and flagged `partial`. **Set `until` to the last full month for any comparison**, or the latest period looks like
  a collapse.

Returns `series[]` of `{period, <dimension values>, value}` plus `fact` (which table answered) and `notes[]`.

## breakdown

```json
{"dims": ["origin_region", "origin_country", "pod"], "measure": "containers", "filters": {"hs2": "03"},
 "since": "2025-10", "until": "2026-09", "top": 5}
```
A rollup over 1–3 nested dimensions, outermost first. `rows[]` holds a grand total (`level: 0`), then subtotals per
level, keeping the top N children under each parent. Default window: the last 12 months **including the partial
current month**; pass `since`/`until` for clean full months.

## Filters and dimensions (trends, breakdown)

Dimensions (for `group_by`, `dims`) and filters share names:

| Name | Meaning | Filter match |
|---|---|---|
| `company`, `company_state` | Importer (consignee/notify party) and its state | company: substring; state: exact |
| `hs4`, `hs2` | Commodity code (`"9401"`, `"94"`) | exact, digits only |
| `carrier`, `scac` | Ocean carrier name / SCAC code | carrier: substring; scac: exact |
| `origin_country`, `origin_region` | Where the goods come from | substring |
| `pol`, `pol_country` | Foreign port of lading and its country | substring |
| `pod`, `pod_coast` | US port of discharge; coast `EAST`, `WEST`, `GULF` | pod: substring; coast: exact |
| `dest_state` | Final US destination state | exact |
| `container_type`, `reefer` | Equipment type; refrigerated (`true`/`false`) | substring; exact |

**The `company` filter is a substring match.** `{"company": "IKEA"}` also matches `IKEA SUPPLY AG` and any other name
containing IKEA. For one company's own trend, use `companies/profile` with `months: 24` (exact name, monthly series);
use the filter only when you mean every name containing the text. `group_by: ["company"]` has no such problem.

**Carrier names come in variants**: MSC appears under more than one spelling, `CMA CGM` alongside `CMA CGM AMERICA
LLC`, and COSCO alongside `CHINA OCEAN SHIPPING`. Merge variants of the same carrier before computing shares, and
say you did.

Names use the data's spelling: China is `PEOPLES REP OF CHINA`, so filter `origin_country: "china"` (substring)
rather than the full name. Ports are upper case (`LOS ANGELES`, `LONG BEACH`, `NEW YORK`, `SAVANNAH`, `HOUSTON`, `VANCOUVER BC`).

Lane dimensions (`pol`, `pol_country`, `container_type`) can't be combined with company or HS dimensions (as
dimensions or filters) in one query, and `estimated_value` isn't available by them; the API answers 400 with the
reason if you try.

## Errors

| Status | Meaning | What to do |
|---|---|---|
| 400 / 422 | The request was wrong; the body says why (e.g. `hs4 must be a 4-digit HS code`) | Fix the request and retry |
| 401 | API key rejected | Ask the user to save a valid key in their own terminal (never in chat) |
| 403 | Trade intelligence isn't enabled for this account | Tell the user to contact support@terminal49.com; don't retry |
| 429 | Rate limit | `ti.py` waits and retries automatically |
| 502 / 504 | Service unavailable or timed out | Retry once, then tell the user |
