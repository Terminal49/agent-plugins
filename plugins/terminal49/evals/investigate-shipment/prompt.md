---
name: investigate-shipment
description: A shipment-level investigation should load shipment details.
tags: [smoke, tier-c, shipment-status]
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: [Skill]
expected_outcome: Resolve the booking, inspect the shipment, and summarize its containers and ETA risk; the answer-quality grader should produce positive delta.
---

Investigate shipment MAEUDEMO12494. What's its status and are any containers delayed?
