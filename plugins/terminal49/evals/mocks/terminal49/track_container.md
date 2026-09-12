---
expect:
  number: /MSKU7654321/
---

{
  "tracking_request": {
    "id": "44444444-4444-4444-8444-444444444444",
    "number": "{{input.number}}",
    "status": "pending"
  },
  "message": "Tracking request created. Carrier data is pending."
}
