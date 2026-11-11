# Agent brief 06 — Live integrations: Salesforce, incidents, metrics

You are replacing Customer Pulse's mock data with real sources, without changing any component. Everything goes through `PulseDataSource` (`contracts/types.ts`). If a view needs to change, the contract was wrong; raise that in a flagged PR instead.

Read `prompts/README.md` (house rules) first, then `docs/PLAN.md §6` (data model, the Footprint join, freshness targets) and `§10` (open questions). Ask the user to answer §10 Q1–Q3 before you write adapter code. Record their answers in `docs/decisions/`.

## Build (in `server/` and `app/src/data/adapters/`)

1. **Server** (`server/`, Node 20 + TypeScript, Fastify): it holds credentials and pushes changes to the browser over Server-Sent Events. The browser never talks to Salesforce or the incident tool directly.
2. **Salesforce adapter:**
   - OAuth 2.0 JWT bearer flow with a connected app; credentials only from the environment or a secret manager, never committed.
   - Initial load through REST/Composite for Account, Opportunity (renewal), Entitlement, Contact, Case, CaseMilestone.
   - Live updates through the Pub/Sub API (Change Data Capture) on Case, CaseMilestone and Opportunity.
   - Respect field-level security: query as the integration user, then filter per viewer using their profile's FLS (cache 10 min). This backs the `permissions` input from brief 05.
   - Map to the contract in pure, unit-tested functions. Record and replay sandbox responses as test fixtures, with PII scrubbed.
3. **Incident adapter:** a webhook receiver with signature verification for the chosen tool (PagerDuty, incident.io or Statuspage). Normalize to `OpsEvent` and keep the last 7 days.
4. **Footprint join:** a service-catalog adapter (Backstage or a YAML file in the repo) that maps tenant → region/cell → services → dependencies. A pure function `impactedAccounts(event, footprints)` with exhaustive tests. This is the heart of the product.
5. **Metrics adapter:** `ServiceHealth` from Prometheus or Datadog on a 30 s poll, only for services touched by live events or by followed accounts.
6. **Pulse recompute:** run on any input change, store `Pulse` history (SQLite for dev, Postgres for prod), and keep `delta24h` from stored history.
7. **Sinks for brief 05:** a Slack DM `AlertSink` and an email `DigestSender`, both behind feature flags and off by default.
8. **Ops:** health endpoint, structured logs, and a freshness metric per source with a UI badge when a source is stale ("Salesforce data 6 min old").

## Acceptance

- The Halcyon scenario reproduced from sandbox data (a sandbox case plus a test incident) shows on the roster, scoreboard and dossier within the `PLAN.md` freshness targets, measured in an e2e test against recorded traffic.
- No credentials in the repo (a gitleaks check in CI).
- Every adapter mapping function is unit-tested against recorded payloads.
- The runbook is written: `docs/runbook.md`, covering how to rotate credentials, replay a webhook, and what happens when each source is down.

## Not in scope

Writing back to Salesforce (read-only in v1) and LLM features.
