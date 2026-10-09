---
name: trade-intelligence
description: Research US ocean imports with Terminal49 trade intelligence — bill-of-lading records for every US ocean import since 2022, refreshed daily. Use it to see what a competitor or any named company imports (volumes, origin countries, US ports, carriers, products, trend), to find who imports a product and where it's sourced from, and to track market trends by port, coast, carrier, origin, or commodity. Use this whenever someone asks about another company's imports, top importers of a product, sourcing countries or lanes for a product, port or carrier volumes, or how US import volumes are changing — even if they don't say "trade intelligence".
---

# Trade intelligence (Terminal49 API)

Terminal49 trade intelligence covers US ocean imports from bill-of-lading records: every import since 2022,
refreshed daily. This skill answers market questions from it through the Terminal49 REST API.

The person you're helping is usually in logistics, procurement, or sales at an importer, forwarder, or broker. They
want to understand a competitor, a product's supply chain, or a market well enough to make a decision. Give them the
answer and the few numbers that support it, not a data dump.

## Setup

Run `scripts/ti.py <endpoint> '<json>'` (Python 3, no dependencies). It needs a Terminal49 API key in `T49_API_KEY`
or `~/.t49_api_key`. Keys are at https://app.terminal49.com/developers/api-keys.

Never ask the user to paste an API key, access token, or password into chat, and never print the key. If no key is
set, ask the user to save theirs by running this in their own terminal (bash or zsh):

```bash
printf 'Terminal49 API key: '; read -rs K; echo; (umask 077; touch ~/.t49_api_key; chmod 600 ~/.t49_api_key; printf %s "$K" > ~/.t49_api_key); unset K
```

Trade intelligence is enabled per account. If calls return 403, tell the user their account doesn't have it yet and
that they can contact support@terminal49.com to turn it on; don't keep retrying. Do not invent trade data when calls
fail.

`references/api.md` has every endpoint's parameters, response fields, filter names, and errors. Read it before your
first call in a conversation.

## What the data is (and isn't)

These shape whether an answer is right, so keep them in mind when reading results and explain the relevant ones to
the user:

- **It covers US ocean imports only**: no air freight, exports, or domestic moves. Canadian ports such as Vancouver
  BC appear for US-bound cargo.
- **Volume is physical containers**, each box counted once even if it appears on several bills of lading. TEUs are
  available too.
- **Companies are the consignee or notify party on the bill of lading.** Large importers usually appear under their
  own name. Forwarders and customs brokers appear as well, so a company's own freight can sit partly under its
  forwarder's name, and a "top importers" list can include forwarders. A high `containers_as_notify_party` share
  usually means a logistics provider.
- **One company can appear under several names and locations.** A retailer may show up as its distribution
  centers and divisions (`DOLLAR TREE DISTRIBUTION`, `DOLLAR TREE MERCHANDISING`, …) and once per US state it imports
  into. Search results are ordered by match quality, not size, so look at every row. Profile each name that belongs to
  the company (without a state, which combines its locations), add them up, and tell the user which names you
  included.
- **Missing volume doesn't mean small.** Importers can ask US Customs to keep their name off shipping manifests, and
  much big-retail freight is booked under forwarders or suppliers. If a well-known company shows far less than its
  size suggests, say the records are incomplete for it and present the figures as a floor, not as its true volume.
- **Values are estimates in USD**, not declared customs values. Call them "estimated value".
- **Time windows differ by endpoint.** Profiles and rankings use the last N full months; trends and breakdowns
  default to windows that include the current, partial month. Always state the period, and use full months when
  comparing periods.
- **Don't add up across products or across companies.** A container carrying several products counts once per
  product code, and companies can share containers. For market totals use `trends` or `breakdown` without a company
  filter. The API states these caveats in `notes`.
- **Shipment-level details aren't available here**: no shipper names or individual bills of lading, only volumes by
  company, product, lane, port, and carrier.

**Speak the user's language, not the API's.** Field names and data mechanics don't belong in the answer. Say
"listed as the party to notify on the shipping documents, which is usually a forwarder or customs broker" rather than
"notify party share", "the company imports under several US locations" rather than "state rows", and never describe
API limits ("the API only returns the top 10"); if a limit affects the answer, say what's missing in plain terms.

## How to work

1. **Resolve the company or product first.** Company → `companies/search` with `name`, then use the exact
   `company_name` it returns. Product → `commodities/search`; check `common_goods` to confirm the HS4 code is really
   the user's product, then use `hs4`. If more than one company or code could be meant, say which you used, or ask
   when the choice changes the answer.
2. **Use the endpoint that answers the question directly**: one company → `companies/profile`; "who imports X" →
   `importers/top`; "how has X changed" → `trends`; "what's the mix" → `breakdown`. Most answers take 2–5 calls.
   - **One company's trend:** `companies/profile` with `months: 24` gives its monthly series for a year-over-year
     comparison. Avoid `trends` with `filters.company` for this: it matches every company whose name contains the
     text.
   - **History goes back to January 2022.** Trends default to the last 24 months; pass `since` for a longer view, and
     don't describe the default window as the start of the data.
   - **Importer lists don't say who's a forwarder.** When forwarders or brokers matter (they usually do in "who
     imports X"), check the top names with one `companies/search` each and use the notify-party share.
3. **Sanity-check before presenting.** A sudden collapse in the latest month is usually a partial month; a company
   much smaller than expected may be split across names, shipping under a forwarder's name, or keeping its name off
   the records. Carriers come under several spellings (two MSCs, `CMA CGM` and `CMA CGM AMERICA LLC`); merge them
   before computing shares. Look again before reporting.
4. **Answer first.** Lead with the takeaway in one to three sentences (caveats come after, not in the lead), then a
   compact table. Round (`87k containers`,
   `$290M est.`), name the period, and keep caveats to the ones that change the conclusion.

## Common questions

### Competitor research: "what does <company> import?"

Search the name, then `companies/profile` with `months: 24` (no state): the monthly series shows direction against
the same months a year earlier. Cover: volume and trend vs a year earlier; top origin countries; US ports and
destination states; carriers and their shares; main products (HS4 with estimated value); and anything notable, such
as a shift between ports or carriers, a new origin country, or seasonality. If the company looks smaller than the
user expects, mention that some of its freight may be booked under a forwarder.

### Sourcing: "who imports <product>, and where does it come from?"

`commodities/search` for the HS4 code, then:
- importers: `importers/top` with `hs4` (add `port_of_discharge` or `origin_country` to narrow);
- origins and lanes: `breakdown` with `dims: ["origin_country", "pod"]` and `filters.hs4`, or `trends` grouped by
  `origin_country` to show shifts (e.g. China to Vietnam) over time.

### Market trends: ports, carriers, lanes, products

`trends` for change over time (pick `interval` to fit the span: month for a year or less, quarter for two to three
years) and `breakdown` for share at a point in time. Give chart-ready tables (period × series), the filters used, and
a short read of what changed. Use full months, and compare like periods (the same months a year earlier) to avoid
seasonality.
