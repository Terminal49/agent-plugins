# Contributing

Thanks for improving the Terminal49 agent plugins.

## Principles

1. Keep the shared skill client-neutral.
2. Prefer tool-selection guidance over duplicating the Terminal49 API docs.
3. Treat `track_container` as a write: search first and create a tracking
   request only when the user intends to start tracking.
4. Preserve the distinction between missing data, unsupported features, and
   operational states.
5. Never include secrets or real customer shipment data.

## Make a change

1. Update the shared skill or the smallest applicable platform adapter.
2. Keep manifest metadata and versions synchronized.
3. Run `npm run validate`.
4. Test installation in any client affected by the change.

Platform-specific behavior belongs in its adapter. Guidance that applies to all
clients belongs in `plugins/terminal49/skills/container-tracking/SKILL.md`.
