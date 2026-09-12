---
name: where-is-container
description: Natural container-location phrasing should trigger a status lookup.
tags: [smoke, tier-a, tier-f, container-status]
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: [Skill]
expected_outcome: Resolve the identifier, load container details, and report status, location, pickup blockers, and last free day without creating tracking; the answer-quality grader should produce positive delta.
---

Where is TGBU1234567? Is it ready for pickup?
