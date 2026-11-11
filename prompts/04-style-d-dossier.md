# Agent brief 04 — Style D: Field Dossier (engineers & support)

You are building **Style D** of Customer Pulse: the L3 working view for one customer during an event. It is a terminal-flavoured, three-pane dossier: tenant and promise on the left, blast radius and a merged timeline in the centre, next moves and links on the right. Engineers use it to see *what is broken for this customer and what changed*. Support staff use it to see *what we promised and what is next*.

Read `prompts/README.md` (house rules) first. The foundation (brief 00) is merged: use `selectCard(accountId, lens, 'L3')`, the theme and the tokens.

**Visual spec:** `design/project/StyleD_Dossier.dc.html`.

## Build (only in `app/src/views/dossier/`)

1. **Route** `/dossier/:accountId[?case=…]`, with a breadcrumb bar showing customer / case, severity chip, linked event chip, the lens indicator and the theme toggle.
2. **Left pane:**
   - a countdown to the next promised customer update (red treatment under 15 min) and the time to resolution-SLA breach;
   - a tenant facts table;
   - the customer's own words (case description quote).
3. **Blast-radius map (centre top):** tenant → the customer's services → shared dependencies, laid out as three columns of real DOM nodes joined by SVG connectors, not one canvas. Node treatment follows the status rules. Hover or focus on a node highlights its path and shows `ServiceHealth`. Keyboard: arrow keys move between nodes. Provide a list view toggle for screen readers and small screens (it is the default under 720px).
4. **Merged timeline (centre bottom):** deploys, changes, alerts, cases, incident and comms in one list with kind chips. A "suspect" marker flags any deploy or change within 60 min before the first alert on an affected service (pure, tested function). Filter by kind.
5. **Right pane:**
   - next-move checklist (local state now; agent 06 persists it);
   - linked items (incident channel, traces, runbook, Salesforce case, related cases) as real links built from config URL templates;
   - a "Hidden in this lens" note.
6. **Lens switch:** `S` toggles the support layout, which swaps the blast-radius map for the case thread (emails/calls from the Case) and entitlement details. `E` returns to the engineer layout. Commercial fields (ARR, renewal, opportunity) never render in this view for either lens.
7. **Copy helpers:** "Copy customer update", which drafts plain-language text from the incident state and the promised time (template, no LLM), and "Copy incident summary" for the channel.

## Acceptance

- `/dossier/<Halcyon id>?case=00481233` matches the artboard in both themes.
- The suspect-deploy function flags `labels-api v2.41.0` and `CHG-8812` for the fixture, and the test proves it.
- The map is fully keyboard operable, and the list view passes axe.
- A test asserts that no ARR, renewal or opportunity string appears in the DOM.
- Playwright screenshots: engineer lens, support lens, list view, each in both themes, at 1440 and 390.

## Not in scope

Real traces, deploy feeds or case threads (agent 06), and the alert engine (agent 05).
