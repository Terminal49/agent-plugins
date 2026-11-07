---
name: investigate-container-delay
description: A delay question should inspect the transport-event timeline.
tags: [smoke, tier-c, delay]
runs: 3
max_turns: 8
timeout_seconds: 180
allowed_tools: [Skill]
expected_outcome: Resolve the container, inspect events, and distinguish the confirmed movement from ETA drift; the answer-quality grader should produce positive delta.
---

What's going on with OOLU2468135? Please investigate the delay.
