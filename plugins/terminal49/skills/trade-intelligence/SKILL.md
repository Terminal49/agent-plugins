---
name: trade-intelligence
description: Research US ocean imports with Terminal49 trade intelligence MCP tools, built from bill-of-lading records for US ocean imports since January 2022 and refreshed daily. Use it to see what a competitor or any named company imports (volumes, origin countries, US ports, carriers, products, trend), to find who imports a product and where it is sourced from, and to track market trends by port, coast, carrier, origin, or commodity. Use it whenever someone asks about another company's imports, top importers of a product, sourcing countries or lanes, port or carrier volumes, or how US import volumes are changing, even if they don't say "trade intelligence".
---

# Trade intelligence (Terminal49 MCP)

Terminal49 trade intelligence covers US ocean imports from US Customs
bill-of-lading records, from January 2022 to today, refreshed daily. Answer
market questions from it with the Terminal49 MCP trade tools. These tools read
market data, not the user's own shipments.

The person you're helping is usually in logistics, procurement, or sales at an
importer, forwarder, or broker. They want to understand a competitor, a
product's supply chain, or a market well enough to make a decision. Give them
the answer and the few numbers that support it, not a data dump.

## Access

The trade tools use the same OAuth connection as the other Terminal49 tools.
Sign-in happens in the browser, so never ask the user for sign-in details in
chat.

Trade intelligence is enabled per account. If a tool says it is not enabled,
tell the user to contact support@terminal49.com to turn it on. Don't retry, and
don't invent figures. `get_trade_data_coverage` and `whoami` both report
whether it is enabled.

## Pick the tool

| Question | Tools |
| --- | --- |
| Which company is this, what does it import | `search_importers`, then `get_importer_profile` |
| Which HS code is this product | `search_commodities` |
| Who imports a product, or through a port, or from a country | `rank_importers` |
| How has volume changed over time | `get_trade_trends` (market) or `get_importer_profile` with `months` 24 (one company) |
| What is the mix or share | `get_trade_breakdown` |
| How current is the data, how far back it goes | `get_trade_data_coverage` |

Most answers take two to five calls.

## How to work

1. **Resolve the company or product first.** For a company, call
   `search_importers` with `name` and use the exact `company_name` it returns.
   For a product, call `search_commodities` and check `common_goods` to confirm
   the HS4 code is the user's product. If more than one company or code fits,
   say which you used, or ask when the choice changes the answer.
2. **Call the tool that answers the question directly.**
   - For one company's trend, call `get_importer_profile` with `months` 24 and
     compare the latest months with the same months a year earlier. Don't use
     `get_trade_trends` with a `company` filter for this: it matches every
     company whose name contains the text.
   - History starts in January 2022. `get_trade_trends` defaults to the last 24
     months; set `since` for a longer view, and don't describe the default
     window as the start of the data.
   - Rankings don't say who is a forwarder. When it matters (it usually does in
     "who imports X"), check the top names with `search_importers` and weigh
     `share_as_notify_party` with the name and product mix.
3. **Check before you present.** A sudden drop in the latest period is usually
   the current, incomplete month: set `until` to the last full month. A company
   much smaller than expected may be split across names, shipping under a
   forwarder, or keeping its name off the records. Merge carrier spelling
   variants before computing shares.
4. **Answer first.** Lead with the takeaway in one to three sentences, then a
   compact table. Round numbers (87k containers, USD 290M est.), name the period,
   and keep only the caveats that change the conclusion.

`references/data-guide.md` explains what the data covers, the filters and
dimensions, and the caveats in detail. Read it before a market-trend or
breakdown question, and when a result looks wrong.

## Speak the user's language

Field names and data mechanics don't belong in the answer. Say "listed as the
party to notify on the shipping documents, which is usually a forwarder or
customs broker", not "notify party share". Say "the company imports under
several US locations", not "state rows". Never describe tool limits ("the tool
only returns the top five"); if a limit affects the answer, say what's missing
in plain terms.

## Common questions

### Competitor research: "what does <company> import?"

Search the name, then call `get_importer_profile` with `months` 24 and no
state. Cover volume and trend against a year earlier, top origin countries, US
ports and destination states, carriers and their shares, main products (HS4
with estimated value), and anything notable, such as a shift between ports or
carriers, a new origin country, or seasonality. If the company looks smaller
than the user expects, say that some of its freight may be booked under a
forwarder.

### Sourcing: "who imports <product>, and where does it come from?"

Call `search_commodities` for the HS4 code, then:

- importers: `rank_importers` with `hs4` (add `port_of_discharge` or
  `origin_country` to narrow);
- origins and lanes: `get_trade_breakdown` with `dims` `origin_country` and
  `pod` and `filters.hs4`, or `get_trade_trends` grouped by `origin_country` to
  show shifts (for example, China to Vietnam) over time.

### Market trends: ports, carriers, lanes, products

Use `get_trade_trends` for change over time (`interval` month for a year or
less, quarter for two to three years) and `get_trade_breakdown` for share at a
point in time. Give chart-ready tables (period by series), the filters used,
and a short read of what changed. Use full months, and compare like periods
(the same months a year earlier) to avoid seasonality.
