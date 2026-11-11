# Agent brief 00 — Foundation: app shell, theme, pulse engine, card component

You are building the foundation of **Customer Pulse**, a player-card style app that shows each customer's Salesforce status, current support case and live operational risk. Four display styles will later be built on top of what you make here, by other agents working in parallel, so your interfaces must be stable and documented.

Read `prompts/README.md` (house rules) first, then `docs/PLAN.md`, `contracts/types.ts`, `data/fixtures/portfolio.json`, `design/tokens/aether.css`, and the artboards `design/project/Main.dc.html` and `design/project/PersonaLadder.dc.html`.

## Build

1. **App skeleton** in `app/`: Vite + React 18 + TS strict, Vitest, Playwright, ESLint. Scripts: `dev`, `build`, `typecheck`, `test`, `e2e`, `theme:omarchy` (runs `../scripts/omarchy-theme-to-css.sh > src/theme/omarchy.css`, falling back to copying `design/tokens/aether.css`). Path alias `@contracts` → `../contracts`.
2. **Theme** in `app/src/theme/`: import tokens, a `ThemeProvider` with `dark | light | system`, a `ThemeToggle` button (44px, icon + label, `aria-pressed`), keyboard shortcut `T`. Dark is the default. Persist in `localStorage` inside try/catch.
3. **Data layer** in `app/src/data/`: `PulseDataSource` mock adapter that serves `data/fixtures/portfolio.json`, with a `subscribe()` that can replay a scripted timeline (`?replay=1` speeds the Halcyon scenario up 60×). A small store (Zustand or `useSyncExternalStore`, your choice; justify it in the PR) and selectors:
   - `selectCard(accountId, lens, zoom): CardModel`
   - `selectPortfolio(filter, sort): CardModel[]` (default sort: verdict band, then pulse ascending, then ARR descending)
   - `selectImpactedByService(service): CardModel[]`
   - `selectImpactedByEvent(eventId): CardModel[]`
4. **Pulse engine** in `app/src/pulse/`: a pure function `computePulse(inputs, weights) → Pulse` that implements `docs/PLAN.md §5` exactly, with weights in `pulse/weights.v1.json`. Required unit test: the Halcyon Freight fixture gives **42, critical**, and the breakdown sums to 57.5. Add property tests: score is always in 0–100, adding a Sev1 never raises the score, and resolving an event never lowers it.
5. **Card component** in `app/src/components/card/`: `<PulseCard model zoom="L0|L1|L2" variant="default|compact" />`.
   - L0 chip: monogram, name, pulse, status treatment, LIVE marker.
   - L1 front: the six zones from `PLAN.md §2`. The stat line and hero come from a `lensConfig` prop (stub the six lens configs; agent 05 will refine them).
   - L2 back: an empty slot with a documented props interface. Agent 01 builds the real back.
   - Frame treatment per verdict, using the status classes. A one-time 600 ms frame pulse when `delta24h ≤ −10`, off under reduced motion.
   - Clicking the pulse number opens a breakdown popover (`Pulse.breakdown`) as a real dialog with focus trap.
6. **Gallery** at `/gallery`: every card zoom × all 12 fixture accounts × both themes, plus the six lens variants of Halcyon side by side (it should visibly echo the PersonaLadder artboard).
7. **Routing shell**: `/roster`, `/binder`, `/scoreboard`, `/dossier/:accountId`, each rendering a "coming soon" placeholder that other agents replace. A top bar with the lens picker (stub), theme toggle and search (`/` focuses it).

## Acceptance

- `npm run typecheck && npm test && npm run e2e` all pass.
- Gallery screenshots in both themes at 1440 and 390 width are committed.
- `app/src/components/card/README.md` documents props, the lens config shape and the L2 slot contract, so agents 01–04 can build without asking you.
- The Halcyon card at L1 matches `Main.dc.html`'s sample card in content and hierarchy. List any intentional differences.

## Not in scope

Real integrations, alerts, the four style views, and authentication.
