export const DEFAULT_WORKSPACE_ID = 'default';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface AgentMemory {
  [key: string]: unknown;
}

export type MemorySearchEngine = 'fts5' | 'substring';

export interface MemorySearchHit {
  agentId: string;
  key: string;
  snippet: string;
  rank: number;
  updatedAt: string;
}

export interface MemorySearchResult {
  query: string;
  engine: MemorySearchEngine;
  note: string;
  hits: MemorySearchHit[];
}

export interface Task {
  id: string;
  workspaceId: string;
  creatorId: string;
  type: string;
  payload: unknown;
  status: 'open' | 'processing' | 'completed' | 'failed';
  assignedTo?: string;
  result?: unknown;
  createdAt: string;
  updatedAt: string;
  /** Incremented on each successful claim; useful for clients detecting stale views. */
  claimVersion?: number;
  /** Number of claim attempts / reopen cycles. */
  attempts?: number;
  lastError?: string | null;
}

export interface AgentCredential {
  agentId: string;
  workspaceId: string;
  tokenHash: string;
  createdAt: string;
  rotatedAt?: string | null;
  label?: string | null;
}

export type NexusRole = 'operator' | 'agent' | 'anonymous';

export interface NexusIdentity {
  role: NexusRole;
  agentId?: string;
  workspaceId?: string;
  accountId?: string;
  accountRole?: AccountRole;
  planId?: PlanId;
}

export interface SystemEvent {
  id: string;
  workspaceId: string;
  timestamp: string;
  type: string;
  agentId: string;
  details: string;
}

export const MAX_TASKS = 5000;
export const MAX_AGENTS = 1000;
export const MAX_LOGS = 500;

export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'unlimited';

export interface PlanLimits {
  id: PlanId;
  maxAgents: number;
  maxMemoryBytes: number;
  maxTasksPerDay: number;
  maxApiRequestsPerDay: number;
  maxSites: number;
}

export type AccountRole = 'admin' | 'user';

export interface Account {
  id: string;
  email: string;
  role: AccountRole;
  planId: PlanId;
  workspaceId: string;
  emailVerified: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPublic {
  id: string;
  email: string;
  role: AccountRole;
  planId: PlanId;
  workspaceId: string;
  emailVerified: boolean;
  createdAt: string;
}

export type AuthTokenPurpose = 'verify' | 'reset';

export interface UsageCounters {
  day: string;
  apiRequests: number;
  memoryWrites: number;
  tasksCreated: number;
}

export interface UsageSnapshot {
  workspaceId: string;
  enrolledAgents: number;
  memoryAgents: number;
  memoryBytes: number;
  totalTasks: number;
  openTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  plan: PlanLimits;
  today: UsageCounters;
  listedAgents: number;
  billing: {
    provider: 'none' | 'stripe';
    stripeConfigured: boolean;
    note: string;
  };
}

export interface AgentSummary {
  agentId: string;
  workspaceId: string;
  createdAt: string;
  rotatedAt?: string | null;
  label: string | null;
  hasToken: boolean;
  listed: boolean;
  blurb: string | null;
}

/** Public directory entry — never includes tokens or hashes. */
export interface PublicAgentEntry {
  agentId: string;
  label: string | null;
  blurb: string | null;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  workspaceId: string;
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  tags: string[];
  source: string;
  sourceUrl: string | null;
  externalId: string | null;
  publishedAt: string;
  updatedAt: string;
  /** Crawl observation for humans + agents. */
  indexing: {
    status: 'unseen' | 'crawled';
    crawlHits: number;
    lastCrawledAt: string | null;
    crawlersSeen: string[];
    note: string;
  };
}

export interface FeedItemInput {
  slug: string;
  title: string;
  summary?: string;
  bodyMd: string;
  tags?: string[];
  source?: string;
  sourceUrl?: string | null;
  externalId?: string | null;
  publishedAt?: string;
}

/** Customer website registered for GEO content surfaces. */
export interface Site {
  id: string;
  workspaceId: string;
  /** Public path id used in /sites/{slug}/… */
  slug: string;
  name: string;
  domain: string | null;
  description: string;
  sitemapUrl: string | null;
  lastPulledAt: string | null;
  lastPullNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteInput {
  slug: string;
  name: string;
  domain?: string | null;
  description?: string;
  sitemapUrl?: string | null;
}

export interface SiteContent {
  id: string;
  siteId: string;
  workspaceId: string;
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  canonicalUrl: string | null;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  indexing: {
    status: 'unseen' | 'crawled';
    crawlHits: number;
    lastCrawledAt: string | null;
    crawlersSeen: string[];
    note: string;
  };
}

export interface SiteContentInput {
  slug: string;
  title: string;
  summary?: string;
  bodyMd: string;
  canonicalUrl?: string | null;
  tags?: string[];
  publishedAt?: string;
}

export interface SiteGeoStatus {
  site: Site;
  contentCount: number;
  crawledCount: number;
  unseenCount: number;
  lastPulledAt: string | null;
  lastPullNote: string | null;
  honesty: string;
  surfaces: {
    llmsTxt: string;
    feedJson: string;
    contentMd: string;
    contentJson: string;
    api: string;
  };
  indexingNote: string;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    maxAgents: 3,
    maxMemoryBytes: 2 * 1024 * 1024,
    maxTasksPerDay: 50,
    maxApiRequestsPerDay: 1_000,
    maxSites: 0,
  },
  starter: {
    id: 'starter',
    maxAgents: 25,
    maxMemoryBytes: 20 * 1024 * 1024,
    maxTasksPerDay: 500,
    maxApiRequestsPerDay: 10_000,
    maxSites: 3,
  },
  pro: {
    id: 'pro',
    maxAgents: 250,
    maxMemoryBytes: 200 * 1024 * 1024,
    maxTasksPerDay: 10_000,
    maxApiRequestsPerDay: 250_000,
    maxSites: 25,
  },
  business: {
    id: 'business',
    maxAgents: 1000,
    maxMemoryBytes: 2 * 1024 * 1024 * 1024,
    maxTasksPerDay: 100_000,
    maxApiRequestsPerDay: 1_000_000,
    maxSites: 100,
  },
  unlimited: {
    id: 'unlimited',
    maxAgents: MAX_AGENTS,
    maxMemoryBytes: Number.MAX_SAFE_INTEGER,
    maxTasksPerDay: Number.MAX_SAFE_INTEGER,
    maxApiRequestsPerDay: Number.MAX_SAFE_INTEGER,
    maxSites: Number.MAX_SAFE_INTEGER,
  },
};

/** Resolve plan for metering. Prefer explicit planId (from identity), then env. */
export function resolvePlan(planId?: string | null): PlanLimits {
  if (planId) {
    const id = planId.trim().toLowerCase();
    const mapped = id === 'admin' ? 'unlimited' : id;
    if (mapped in PLAN_LIMITS) return PLAN_LIMITS[mapped as PlanId];
  }
  const raw = (process.env.NEXUS_PLAN || 'free').trim().toLowerCase();
  if (raw === 'starter' || raw === 'pro' || raw === 'business' || raw === 'unlimited' || raw === 'admin') {
    const id = raw === 'admin' ? 'unlimited' : (raw as PlanId);
    return PLAN_LIMITS[id];
  }
  return PLAN_LIMITS.free;
}

declare global {
  namespace Express {
    interface Request {
      nexus?: NexusIdentity;
    }
  }
}
