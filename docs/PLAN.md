# Customer Pulse: product & visual plan

> Status: concept / pre-build. Mockups live in [`design/project/`](../design/project/) (Design canvas). Agent build prompts live in [`prompts/`](../prompts/).

## 1. The idea in one line

Every customer is a **player card**: Salesforce account data, the current support case and any live operational event touching that customer, fused into one object that can be read at four depths by six different roles.

The problems it solves:

- During an incident, nobody can quickly answer *which customers is this hurting, how much do they matter, and what have we promised them?*
- Account teams find out about outages from the customer.
- Executives get risk as a spreadsheet the next morning.
- Engineers don't see which tenant, tier or SLA sits behind the errors they're debugging.

## 2. The card object

| # | Zone | Source | Always visible? |
|---|------|--------|-----------------|
| 1 | **Identity strip**: name, tier, entitlement, industry, ARR, renewal countdown | Salesforce Account, Opportunity, Entitlement | yes |
| 2 | **Pulse score** 0–100 + 24h delta | computed (see §5) | yes |
| 3 | **Active case**: highest-severity open case, age, SLA clock, next promised update | Salesforce Case, Milestones | while a Sev1/Sev2 is open |
| 4 | **Live operational risk band** | incident tool + service catalog mapping | while an event touches their footprint |
| 5 | **Stat line**: four role-specific stats | mixed | yes, swapped per role |
| 6 | **Next move**: one recommended action, with owner | rules engine (later: LLM-assisted) | yes |

The frame of the card carries the risk verdict: **Critical** (solid filled), **High** (solid outline), **Watch** (dashed outline), **Healthy** (blue). Status never depends on hue alone. The Aether palette's red, yellow and green are all ambers, so fill, line style and labels carry the meaning.

## 3. Four zoom levels

| Level | Name | Density | Typical surface |
|-------|------|---------|-----------------|
| **L0** | Chip | name, pulse, verdict, live marker | portfolio grid, binder, wallboard (50+ on screen) |
| **L1** | Card front | the six zones | default card |
| **L2** | Card back | 12-week pulse history, Salesforce fields, case list, contacts, SLOs | flip (`F`) |
| **L3** | Dossier | blast-radius map, merged timeline, linked traces/runbooks, comms log, next-move checklist | full page |

Zoom only goes deeper into the same customer. A role preset decides where you land, never what you're allowed to reach (RBAC is separate, see §8).

## 4. Six lenses (role presets)

| Role | Lands on | Question | Hero metric | Stat line | Collapsed | Alerts |
|------|----------|----------|-------------|-----------|-----------|--------|
| Executive | L0 roster → L1 | Is revenue at risk; do I need to call someone? | ARR at risk | Sev1 count, live incidents, sentiment, renewal stage, last exec touch | case IDs, SLA clocks, service names | Sev1 on Tier 1, ARR at risk > $1M |
| Account team | L1 → L2 | What do I tell this customer today? | Pulse | open cases, CSAT, opportunity, comms sent, next update | deploys, error budgets, traces | Sev1/Sev2 on owned accounts, sentiment drop > 10 |
| Service owner | L1 filtered by service | Which customers is my service hurting? | service error rate / SLO burn | customers hit, rank, calls failing, linked cases, region | renewal, opportunity | SLO burn > 2×, any Tier 1 impacted |
| Key leader | L0 → L1 | Where do I put people? | time to SLA breach | engaged people, IC, accounts in incident, escalations, comms cadence | raw logs, case text | breach < 2h, escalation ≥ E2, many accounts on one incident |
| Engineer | L3 | What's the blast radius, what changed? | services hit | error signature, deploy correlation, p99, traces, runbook | ARR, renewal, sentiment | page on SLO burn; opens straight to dossier |
| Support | L2 → L3 | What have we promised, what's next? | time to next promised update | case, age, last contact, linked incident, workaround | revenue, opportunity | update due < 15m, customer reply, linked incident change |

See the **PersonaLadder** artboard: the same customer at the same moment through all six lenses.

## 5. Pulse score (v1, explainable by design)

```
penalties =
    20 × open Sev1   (×1.2 if Tier 1)
  +  6 × open Sev2   (cap 12)
  +  1 × open Sev3   (cap 3)
  + 15 × share of the customer's services affected by a live event
  +  5 if any case milestone breaches within 2h
  +  3 per 0.5 drop in 90-day CSAT (rounded)
  +  adoption penalty (0–5, from usage trend)
if renewal ≤ 90 days: penalties × 1.15
pulse = floor(clamp(100 − penalties, 0, 100))
bands: <45 Critical · 45–59 High · 60–74 Watch · ≥75 Healthy
```

Worked example (Halcyon Freight, the mockup hero): Sev1 on Tier 1 24 + one Sev2 6 + two Sev3 2 + INC-2291 hitting 3 of 5 services 9 + resolution breach in 1h12m 5 + CSAT 3.7→3.1 4 = **50**; renewal in 74 days ×1.15 = **57.5**; pulse = floor(42.5) = **42**, verdict Critical. This is a required unit test.

Rules:

1. Every score shows its breakdown on click. No black-box numbers.
2. The 24h delta is stored, not recomputed, so history is auditable.
3. Weights live in config, not code, and are versioned.

## 6. Data model & sources

```
Account (SF) ─┬─ Opportunity (SF)      renewal date, stage, amount
              ├─ Entitlement (SF)      tier, response SLAs
              ├─ Contact (SF)          roles: exec sponsor, ops lead
              ├─ Case (SF) ── CaseMilestone (SF) ── linked Incident
              └─ Footprint (service catalog)
                    tenant → region/cell → services → shared dependencies
Incident / Maintenance / Degradation (PagerDuty | incident.io | Statuspage | in-house)
    └─ affects: services[], regions[] → joined to Footprint → impacted Accounts
Deploys / Changes (CI/CD, change mgmt) → shown on L3 timeline for correlation
```

The **Footprint join** is the core of the product: *event → services/regions → tenants → accounts*. If the service catalog can't map tenants to services, that's the first piece of work, before any UI.

The canonical TypeScript contract is in [`contracts/types.ts`](../contracts/types.ts). A shared fixture with the mockup's scenario is in [`data/fixtures/portfolio.json`](../data/fixtures/portfolio.json). Every agent builds against those two files.

### Freshness targets

| Data | Mechanism | Target latency |
|------|-----------|----------------|
| Cases, milestones | Salesforce Change Data Capture / Pub/Sub API | < 30 s |
| Account, opportunity | nightly + CDC on key fields | < 15 min |
| Incidents | webhook from incident tool | < 10 s |
| SLO / error rate | metrics query on a 30 s poll | < 60 s |
| Pulse | recomputed on any input change | < 5 s after input |

## 7. Four display styles

| Style | Look | Best for | Strength | Risk |
|-------|------|----------|----------|------|
| **A · Trading Card** | Collectible card, front/back, attribute bars, binder of L0 chips | Account teams, support | memorable, personal ownership ("my binder") | low density; not for 50+ accounts |
| **B · Live Scoreboard** | Broadcast: LIVE bug, score tiles, players on the field, event ticker | Service owners, leaders, wallboards | instant incident framing, very legible from distance | only meaningful during events; needs a calm-state design |
| **C · Roster Board** | Draft-board grid, KPI strip, ARR-by-status bar | Executives, leaders | portfolio at a glance, sorts by money × risk | can feel like a report if the cards aren't punchy |
| **D · Field Dossier** | Terminal/HUD three-pane: tenant, blast radius + timeline, next moves | Engineers, support | where work happens; deploy correlation | densest; must not leak commercial data to wide audiences |

**Recommendation:** ship **C + A** first. They share one card component at different densities, cover the exec and account audiences who feel the pain most, and prove the Footprint join. **B** follows as an alternate layout of the same data for incident bridges. **D** goes last because it needs the deepest integrations (traces, deploys).

## 8. Cross-cutting requirements

- **Theme**: dark by default, light toggle, plus `system`. Tokens are generated from the user's Omarchy theme (`~/.local/state/omarchy/current/theme/colors.toml`) by `scripts/omarchy-theme-to-css.sh`, with a checked-in Aether fallback at [`design/tokens/aether.css`](../design/tokens/aether.css). Typeface: JetBrains Mono (UI and numbers), Inter for long prose.
- **Accessibility**: text ≥ 4.5:1 in both themes; status uses fill, line style and label, never hue alone; all controls are real buttons/links ≥ 44px; full keyboard (`/` search, `F` flip, `1–4` zoom levels, `[` `]` previous/next card).
- **RBAC**: lenses are presets, not permissions. Commercial fields (ARR, opportunity) are field-level-secured per Salesforce profile; L3 dossier never shows commercial fields to roles without them.
- **Motion**: a pulse drop of 10 or more animates the frame once (≤ 600 ms), honouring `prefers-reduced-motion`. No perpetual blinking except the LIVE dot.
- **Calm state**: when nothing is wrong, cards say so plainly ("Healthy · no open Sev1/2 · next QBR Nov 19"). An empty scoreboard is a feature.

## 9. Phased roadmap

| Phase | Scope | Exit criteria |
|-------|-------|---------------|
| 0 · Foundations | contracts, fixtures, theme tokens, card component at L0/L1/L2, pulse engine with explanations | Storybook-style gallery renders the fixture in both themes; unit tests on scoring |
| 1 · Roster + Card (C, A) | exec roster, account binder, role presets, mock adapter | usability test with 3 execs and 5 AEs |
| 2 · Live data | Salesforce adapter (CDC), incident webhook, Footprint join | Halcyon-style scenario replayed from real sandboxes end-to-end < 30 s |
| 3 · Scoreboard (B) | service-owner and leader views, wallboard mode | used on a real incident bridge |
| 4 · Dossier (D) | blast-radius map, merged timeline, traces/deploys | engineers choose it over their current tab set in one game-day |
| 5 · Alerts & next moves | role-tuned notifications, next-move rules, then LLM-drafted customer updates | alert precision > 80% (survey) |

## 10. Open questions

1. Is there a reliable tenant → service → dependency map today, or does it need to be built?
2. Which incident tool is the source of truth (PagerDuty, incident.io, in-house)?
3. Do Salesforce field-level permissions match the lens model, or do we need our own policy layer?
4. Who owns the pulse weights: CS ops or a cross-functional council?
5. Wallboard hardware for Style B: which resolution and viewing distance?
