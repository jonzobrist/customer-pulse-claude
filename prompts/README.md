# Agent build prompts

Each file in this folder is a complete, self-contained brief for one build agent (Claude Code or similar). Paste the whole file as the agent's first message, from the repo root.

## Order & parallelism

```
00-foundation ──┬── 01-style-a-trading-card ─┐
   (must land   ├── 02-style-b-scoreboard   ├── 05-lenses-and-alerts ── 06-live-integrations
    first)      ├── 03-style-c-roster       │
                └── 04-style-d-dossier ─────┘
```

| Prompt | Depends on | Can run in parallel with | Writes only to |
|--------|------------|--------------------------|----------------|
| 00 Foundation | — | — | `app/` skeleton, `app/src/{theme,pulse,data,components/card,gallery}` |
| 01 Trading Card | 00 | 02, 03, 04 | `app/src/views/binder/`, `app/src/components/card/back/` |
| 02 Scoreboard | 00 | 01, 03, 04 | `app/src/views/scoreboard/` |
| 03 Roster | 00 | 01, 02, 04 | `app/src/views/roster/` |
| 04 Dossier | 00 | 01, 02, 03 | `app/src/views/dossier/` |
| 05 Lenses & alerts | 01–04 merged | — | `app/src/lenses/`, `app/src/alerts/`, small wiring edits in views |
| 06 Live integrations | 05 | — | `app/src/data/adapters/{salesforce,incidents,metrics}/`, `server/` |

Agents 01–04 own disjoint folders, so they can run in separate worktrees at the same time. Any change one of them needs in a shared file (`contracts/`, `app/src/components/card/*`, `app/src/theme/*`) goes in a separate small PR, flagged in its summary. Agents never edit shared files silently.

## House rules (every agent)

1. **Read first:** `docs/PLAN.md`, `contracts/types.ts`, `data/fixtures/portfolio.json`, `design/tokens/aether.css`, and the artboard for your style in `design/project/*.dc.html`. The artboards are the visual spec. Their `renderVals()` blocks hold the exact copy and numbers.
2. **Stack:** Vite + React 18 + TypeScript (strict), plain CSS with the `--cp-*` custom properties. No UI kit, no Tailwind, no CSS-in-JS runtime. Fonts: JetBrains Mono (UI, numbers) and Inter (prose) from Google Fonts or self-hosted.
3. **Theme:** dark by default; `light` and `system` via `data-theme` on `<html>`, persisted in `localStorage` (wrapped in try/catch). Never hard-code a hex value in a component; use tokens. `npm run theme:omarchy` regenerates `app/src/theme/omarchy.css` from the user's live Omarchy theme.
4. **Status is never hue alone:** Critical = filled, High = solid outline, Watch = dashed outline, Healthy = blue outline, and always a text label. Use the `.cp-status--*` classes.
5. **Accessibility:** real `<button>`/`<a>`; targets ≥ 44px; visible focus ring in `--cp-accent`; text ≥ 4.5:1 in both themes; `prefers-reduced-motion` respected; every chart has a text equivalent.
6. **Data only through the contract:** components get a `CardModel` (or lists of them) from selectors. They never read the fixture or an adapter directly.
7. **No invented numbers in the UI:** everything rendered comes from the fixture via selectors. If the fixture lacks something, extend the fixture *and* the contract in a flagged PR.
8. **Done means verified:** `npm run typecheck && npm test && npm run e2e` pass. Playwright screenshots at 1440×900 and 390×844, dark and light, go in `app/e2e/__screenshots__/`. Compare them against the artboard and list differences in your PR description.
9. **Commits:** small, conventional (`feat(roster): …`), on your own branch. Open a PR when done; never push to `main`.
