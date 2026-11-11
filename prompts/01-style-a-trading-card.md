# Agent brief 01 — Style A: Trading Card (account teams & support)

You are building **Style A** of Customer Pulse: a collectible-card experience where each customer is a trading card with a front (how are they?) and a back (why?), collected into a personal **binder**. The audience is account executives, CSMs and support engineers who each own 10–60 customers and should know them by heart.

Read `prompts/README.md` (house rules) first. The foundation (brief 00) is merged: use `PulseCard`, the selectors, the theme and the tokens. Do not modify them except through a flagged PR.

**Visual spec:** `design/project/StyleA_TradingCard.dc.html` (front, back, binder chips and design notes). Match its hierarchy, proportions (400×700 card, 8px frame) and copy. Fonts and colors come from tokens, never from the artboard's literal hex values.

## Build (only in `app/src/views/binder/` and `app/src/components/card/back/`)

1. **Card back (L2)** that fills the foundation's L2 slot:
   - a 12-week pulse bar chart with incident weeks highlighted, plus a hidden `<table>` equivalent for screen readers;
   - a 2×3 Salesforce field grid (owner, CSM, opportunity, expansion, entitlement, CSAT);
   - open cases (max 4, "+N more") with severity chips;
   - key contacts with preferred channel.
2. **Flip interaction:** `F` key or the flip button; a 3D rotate (≤ 450 ms) that becomes a crossfade under reduced motion. Both faces are in the DOM and the hidden one is `inert`. Same footprint, so grids never reflow.
3. **Attribute bars:** six bars (Stability, Sentiment, Adoption, Support load, Revenue, Renewal). Clicking a bar shows its formula and inputs from `Pulse.breakdown` and `Pulse.attributes`.
4. **Binder view** at `/binder`:
   - a "following" list (persist follows locally for now, behind an interface agent 06 can back with a server);
   - a grid of L1 cards with the critical ones first, and a toggle to the L0 chip layout (`1` / `2` keys);
   - a filter chip row: All · Needs attention · Renewing ≤ 90d · In incident;
   - `[` / `]` to move focus between cards, `Enter` to open the dossier route.
5. **Strategic trim:** accounts flagged strategic get a second inner rule in `--cp-accent`. Add `strategic?: boolean` to the contract in a flagged PR.
6. **Empty / calm states:** a binder with nothing at risk shows a calm summary ("All 14 followed customers healthy · next renewal …"), not an empty grid.

## Acceptance

- Halcyon's front and back match the artboard content one-to-one in dark and light.
- Flip works by mouse, keyboard and touch; axe reports no violations; reduced-motion path is tested.
- At 390px wide the binder is one column and the card scales without horizontal scroll.
- Playwright screenshots: binder grid, chip layout, Halcyon front, Halcyon back, each in both themes.
- Your PR description lists every deviation from the artboard, with the reason.

## Not in scope

The roster, scoreboard and dossier views, real data, and alerts.
