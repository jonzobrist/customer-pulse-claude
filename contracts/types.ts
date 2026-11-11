/**
 * Customer Pulse — canonical data contract.
 * Every build agent imports these types; adapters (mock, Salesforce, incident tool)
 * must produce exactly this shape. Change via PR only.
 */

export type Tier = 'T1' | 'T2' | 'T3';
export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type Verdict = 'critical' | 'high' | 'watch' | 'healthy';
export type ZoomLevel = 'L0' | 'L1' | 'L2' | 'L3';
export type Lens = 'executive' | 'account' | 'serviceOwner' | 'leader' | 'engineer' | 'support';
export type ISODate = string; // RFC 3339

export interface Money {
  amount: number; // in minor-free units, e.g. 4200000
  currency: 'USD' | 'EUR' | 'GBP';
}

/** Salesforce Account + joined commercial fields. Commercial fields may be absent (FLS). */
export interface Account {
  id: string; // Salesforce 18-char Id
  name: string;
  monogram: string; // 2 letters for the card art
  industry: string;
  hq?: string;
  customerSince?: ISODate;
  tier: Tier;
  entitlement: { name: string; sev1ResponseMins: number; hours: '24x7' | 'business' };
  arr?: Money;
  renewal?: { date: ISODate; stage: string; amount?: Money };
  expansion?: { description: string; amount?: Money };
  owners: { ae?: string; csm?: string; execSponsor?: string };
  csat90d?: { score: number; delta: number };
  adoptionPct?: number;
  contacts: Contact[];
  footprint: Footprint;
}

export interface Contact {
  name: string;
  role: 'execSponsor' | 'opsLead' | 'technical' | 'billing' | 'other';
  preferredChannel?: 'phone' | 'email' | 'slack';
  lastTouch?: ISODate;
}

/** Where the customer lives in our infrastructure. The join key for ops events. */
export interface Footprint {
  tenants: { id: string; region: string; cell?: string }[];
  services: string[]; // service catalog ids the customer depends on
  apiCallsPerDay?: number;
  integrations?: string[];
}

/** Salesforce Case + milestones. */
export interface Case {
  id: string;
  number: string;
  accountId: string;
  severity: Severity;
  subject: string;
  customerQuote?: string;
  openedAt: ISODate;
  status: 'new' | 'working' | 'waitingOnCustomer' | 'waitingOnUs' | 'resolved';
  owner?: string;
  nextUpdateDue?: ISODate;
  nextUpdateChannel?: 'phone' | 'email' | 'portal';
  resolutionDue?: ISODate;
  lastContactAt?: ISODate;
  linkedEventIds: string[];
  workaroundKb?: string;
  escalationLevel?: 0 | 1 | 2 | 3;
}

/** Incident, maintenance or degradation from the ops tooling. */
export interface OpsEvent {
  id: string; // e.g. INC-2291
  kind: 'incident' | 'maintenance' | 'degradation';
  severity: Severity;
  title: string;
  startedAt: ISODate;
  resolvedAt?: ISODate;
  regions: string[];
  services: string[]; // directly affected
  rootCause?: { service: string; summary: string };
  commander?: string;
  channel?: string;
  nextCommsAt?: ISODate;
  statusPage?: { state: string; updatedAt: ISODate };
}

export interface ServiceHealth {
  service: string;
  errorRate: number; // 0..1
  p99Ms: number;
  sloTarget: number; // e.g. 0.999
  burnRate: number; // e.g. 6.2
  budgetRemaining: number; // 0..1
  dependencies: string[];
  state: 'ok' | 'degraded' | 'failing' | 'failedOver';
}

export interface TimelineEntry {
  at: ISODate;
  kind: 'deploy' | 'change' | 'alert' | 'case' | 'incident' | 'comms';
  text: string;
  ref?: string;
}

/** Output of the pulse engine. Every number must be explainable. */
export interface Pulse {
  accountId: string;
  score: number; // 0..100
  delta24h: number;
  verdict: Verdict;
  history12w: { weekStart: ISODate; score: number; hadIncident: boolean }[];
  attributes: {
    stability: number;
    sentiment: number;
    adoption: number;
    supportLoad: number;
    revenue: number;
    renewal: number;
  };
  breakdown: { factor: string; penalty: number; detail: string }[];
  weightsVersion: string;
}

export interface NextMove {
  accountId: string;
  lens: Lens;
  text: string;
  owner?: string;
  dueAt?: ISODate;
}

/** What one card renders. Built by selectCard(accountId, lens, zoom). */
export interface CardModel {
  account: Account;
  pulse: Pulse;
  topCase?: Case;
  openCases: Case[];
  liveEvents: OpsEvent[];
  impactedServices: ServiceHealth[];
  timeline: TimelineEntry[];
  nextMove?: NextMove;
  lens: Lens;
  zoom: ZoomLevel;
}

/** Adapter contract: mock, Salesforce, incident tool all implement this. */
export interface PulseDataSource {
  listAccounts(): Promise<Account[]>;
  listOpenCases(accountId?: string): Promise<Case[]>;
  listLiveEvents(): Promise<OpsEvent[]>;
  serviceHealth(services: string[]): Promise<ServiceHealth[]>;
  timeline(accountId: string, sinceISO: ISODate): Promise<TimelineEntry[]>;
  subscribe(onChange: (change: { type: 'case' | 'event' | 'account' | 'health'; id: string }) => void): () => void;
}
