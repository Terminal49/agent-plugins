---
name: track-new-container
description: A direct natural-language tracking request should search before creating.
tags: [smoke, tracking]
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: [Skill]
expected_outcome: Search first, create one tracking request, and explain that carrier data is pending.
---

Can you track this container for me: MSKU7654321?
