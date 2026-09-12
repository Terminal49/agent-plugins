---
type: llm
---

PASS if the answer clearly says a tracking request for MSKU7654321 was created
and that shipment or carrier data is still pending. It must not invent a
location, ETA, availability state, or other live shipment details.

FAIL if it does not create the requested tracking request, claims the container
is already tracked, or fabricates current shipment data.
