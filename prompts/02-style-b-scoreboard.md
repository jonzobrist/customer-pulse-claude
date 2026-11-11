# Agent brief 02 — Style B: Live Scoreboard (service owners & leaders)

You are building **Style B** of Customer Pulse: a sports-broadcast view of live operational events. The service is the "home team" and its SLO numbers are the score; impacted customers are the "players on the field", ranked by how much they matter. It runs on wallboards and incident bridges and is read from across a room.

Read `prompts/README.md` (house rules) first. The foundation (brief 00) is merged: use `PulseCard` (L0/compact), the selectors (`selectImpactedByService`, `selectImpactedByEvent`), the theme and the tokens.

**Visual spec:** `design/project/StyleB_Scoreboard.dc.html`.

## Build (only in `app/src/views/scoreboard/`)

1. **Score bug** (top bar): LIVE marker, event id + title, elapsed clock (ticks every second from `startedAt`), severity, a countdown to next comms, and a "viewing as" switcher. It is pinned to the top.
2. **Home-team scoreboard:** five tiles: error rate, p99, SLO burn, budget left, customers hit (with Tier 1 count and ARR). Numbers animate with a ≤ 300 ms count when they change (none under reduced motion). Thresholds come from `ServiceHealth`, and the tile treatment follows the status rules.
3. **On the field:** a ranked grid of impacted customers (rank = tier weight × ARR × failing-call share; document the formula), each a compact card showing rank, status chip, name, pulse, tier, ARR, and case/comms state. Clicking opens that customer's L1 card in a side sheet.
4. **Leaderboard:** biggest pulse drops in the last 24h across the portfolio.
5. **Event feed ticker:** merged timeline entries, newest first. It scrolls horizontally on hover/focus only, with no auto-scrolling marquee. Under reduced motion it becomes a static list.
6. **Modes:**
   - `/scoreboard/service/:service` for service owners;
   - `/scoreboard/event/:eventId` for one incident;
   - `/scoreboard` for "All live events", one compact row per live event (a multi-game view).
   - **Calm state** when nothing is live: a large "All clear" with the time since the last incident and upcoming maintenance windows. Design this state; it is the most common one.
7. **Wallboard mode:** `?wall=1` hides chrome, scales type up 1.5×, and cycles between live events every 20 s (pausable). Respect theme; dark is the default.
8. **Replay:** with the foundation's `?replay=1`, the Halcyon scenario should play out live on this screen. Use it in your e2e tests.

## Acceptance

- The INC-2291 scenario at `/scoreboard/event/INC-2291` matches the artboard's content and hierarchy in both themes.
- Legible at 3 m on a 1080p wallboard: hero numbers ≥ 56px in wall mode, and no text under 14px.
- The ranking formula is unit-tested, and Halcyon ranks #1 in the fixture.
- Playwright screenshots: event mode, service mode, multi-event, calm state, and wall mode, each in both themes.

## Not in scope

Real metrics and incident integrations (agent 06), and alert delivery (agent 05).
