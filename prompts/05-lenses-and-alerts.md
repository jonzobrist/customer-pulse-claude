# Agent brief 05 — Lenses (role presets), next moves and alerts

You are making Customer Pulse role-aware. Styles A–D exist (briefs 01–04, merged). Your job is to make each of the six roles land in the right place, see the right fields, get the right "next move", and get alerted only when it matters.

Read `prompts/README.md` (house rules) first, then `docs/PLAN.md §4` (the lens table is the spec) and `design/project/PersonaLadder.dc.html`, which shows the same customer through all six lenses at once. The ladder's `renderVals()` has the exact hero metric, stat rows, band text, next move, collapsed fields and alert rules for each lens.

## Build (in `app/src/lenses/`, `app/src/alerts/`, plus small wiring edits in views, each listed in your PR)

1. **Lens config** (`lenses/*.ts`, one per role): landing route and zoom, hero metric selector, stat-line selectors (4–5), risk-band copy template, collapsed fields, and allowed views. Replace the foundation's stub configs. A lens picker in the top bar, persisted per user.
2. **Field visibility:** a `visibleFields(lens, user)` policy. Lenses decide what is shown by default; a separate `permissions` input (stubbed now; agent 06 backs it with Salesforce field-level security) decides what is allowed. Collapsed fields stay reachable unless permissions forbid them. Test that the engineer lens never renders commercial fields even when expanded.
3. **Next-move engine:** `nextMove(card, lens) → NextMove`, as ordered, declarative rules (YAML or TS objects) with tests for each of the six lenses on Halcyon that reproduce the ladder's next moves. Each rule names an owner role.
4. **Alert rules:** a declarative rule set per lens (see the ladder's "Alerts" lines), evaluated on store changes. Output goes through an `AlertSink` interface with two implementations:
   - an in-app toast and inbox (bell icon with unread count; toasts are dismissable and never stack more than three);
   - a desktop notification via the Notifications API, only after explicit opt-in.

   Debounce rules: one alert per account per rule per 30 min, and at most one Sev1 alert per incident per user. Under `?replay=1` a test asserts the exact alerts each lens receives.
5. **Exec morning digest:** a scheduled job interface (`DigestScheduler`, with a no-op and a local cron implementation) that renders `/roster/digest` to HTML for email. Sending is out of scope; produce the HTML file.
6. **Ladder page:** `/ladder/:accountId` renders the six lenses side by side, like the artboard. It is a great demo and a regression test, so screenshot it.

## Acceptance

- `/ladder/<Halcyon id>` matches the PersonaLadder artboard in content in both themes.
- Replay test: the exact expected alert list per lens, no duplicates.
- The rules are data, not code paths: adding a lens rule needs no component change, and a test proves it by adding a rule in the test.

## Not in scope

Email/Slack delivery (agent 06 provides sinks) and LLM-drafted messages (a later phase).
