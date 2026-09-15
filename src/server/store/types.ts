import {
  AgentCredential,
  AgentMemory,
  AgentSummary,
  Account,
  AccountPublic,
  FeedItem,
  FeedItemInput,
  PlanId,
  PublicAgentEntry,
  Site,
  SiteContent,
  SiteContentInput,
  SiteGeoStatus,
  SiteInput,
  SystemEvent,
  Task,
  UsageSnapshot,
} from '../types.ts';

export interface RegisterAgentResult {
  ok: true;
  token: string;
  rotated: boolean;
}

export interface RegisterAgentFailure {
  ok: false;
  code: 'capacity' | 'exists' | 'plan_limit';
}

export interface NexusStore {
  ensureReady(): void;
  flush(): void;
  ping(): boolean;

  logEvent(type: string, agentId: string, details: string, workspaceId?: string): void;
  getEventLogs(workspaceId?: string, limit?: number): SystemEvent[];

  findCredentialByTokenHash(tokenHash: string): AgentCredential | undefined;
  listAgentSummaries(workspaceId?: string): AgentSummary[];
  listPublicAgents(workspaceId?: string): PublicAgentEntry[];
  registerAgentToken(
    agentId: string,
    options: { label?: string; rotate?: boolean; planId?: string | null },
    workspaceId?: string
  ): RegisterAgentResult | RegisterAgentFailure;
  revokeAgentToken(agentId: string, workspaceId?: string): boolean;
  updateAgentLabel(agentId: string, label: string, workspaceId?: string): boolean;
  updateAgentProfile(
    agentId: string,
    patch: { label?: string; listed?: boolean; blurb?: string | null },
    workspaceId?: string
  ): boolean;

  writeAgentMemory(
    agentId: string,
    data: AgentMemory,
    workspaceId?: string
  ): { ok: true; storedKeys: string[] } | { ok: false; code: 'capacity' | 'plan_limit' };
  wipeAgentMemory(agentId: string, workspaceId?: string): boolean;
  readAgentMemory(agentId: string, workspaceId?: string): AgentMemory;
  getMemoryStore(workspaceId?: string): Record<string, AgentMemory>;

  createTask(input: {
    creatorId: string;
    type: string;
    payload: unknown;
    workspaceId?: string;
  }): Task | { ok: false; code: 'plan_limit' };
  listOpenTasks(type?: string, workspaceId?: string): Task[];
  listOpenTasksAll(limit?: number): Task[];
  listOpenTasksByTypes(types: string[], limit?: number): Task[];
  listActiveTasks(limit?: number): Task[];
  getTaskQueue(workspaceId?: string): Task[];
  findTask(taskId: string, workspaceId?: string): Task | undefined;
  claimOpenTask(
    taskId: string,
    agentId: string,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' | 'not_open' };
  completeTask(
    taskId: string,
    agentId: string,
    status: 'completed' | 'failed',
    result: unknown,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' | 'forbidden' };
  failTask(
    taskId: string,
    lastError: string,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' };
  reopenTask(
    taskId: string,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' | 'not_reopenable' };

  dashboardStats(workspaceId?: string): {
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    enrolledAgents: number;
  };
  usageSnapshot(workspaceId?: string): UsageSnapshot;
  incrementUsage(metric: string, amount?: number, workspaceId?: string): void;

  listFeedItems(options?: { limit?: number; since?: string; workspaceId?: string }): FeedItem[];
  getFeedItemBySlug(slug: string, workspaceId?: string): FeedItem | undefined;
  upsertFeedItem(
    input: FeedItemInput,
    workspaceId?: string
  ): { ok: true; item: FeedItem } | { ok: false; code: 'invalid' };
  deleteFeedItem(slug: string, workspaceId?: string): boolean;
  recordFeedCrawl(
    slug: string,
    crawlerId: string,
    workspaceId?: string
  ): FeedItem | undefined;

  listSites(workspaceId?: string): Site[];
  listSitesDueForPull(staleMs?: number, limit?: number): Site[];
  listSitesWithSitemap(limit?: number): Site[];
  getSiteBySlug(slug: string, workspaceId?: string): Site | undefined;
  upsertSite(
    input: SiteInput,
    workspaceId?: string
  ): { ok: true; site: Site } | { ok: false; code: 'invalid' | 'slug_taken' };
  recordSitePull(slug: string, note: string, workspaceId?: string): Site | undefined;
  deleteSite(slug: string, workspaceId?: string): boolean;
  listSiteContent(
    siteSlug: string,
    options?: { limit?: number; workspaceId?: string }
  ): SiteContent[];
  getSiteContent(
    siteSlug: string,
    contentSlug: string,
    workspaceId?: string
  ): SiteContent | undefined;
  upsertSiteContent(
    siteSlug: string,
    input: SiteContentInput,
    workspaceId?: string
  ): { ok: true; item: SiteContent } | { ok: false; code: 'invalid' | 'site_not_found' };
  deleteSiteContent(siteSlug: string, contentSlug: string, workspaceId?: string): boolean;
  recordSiteContentCrawl(
    siteSlug: string,
    contentSlug: string,
    crawlerId: string,
    workspaceId?: string
  ): SiteContent | undefined;
  siteGeoStatus(siteSlug: string, appUrl: string, workspaceId?: string): SiteGeoStatus | undefined;

  findAccountByTokenHash(tokenHash: string): Account | undefined;
  findAccountByEmail(email: string): Account | undefined;
  getAccountById(id: string): Account | undefined;
  getAccountByStripeCustomerId(customerId: string): Account | undefined;
  listAccounts(): AccountPublic[];
  registerAccount(input: {
    email: string;
    password: string;
  }):
    | { ok: true; account: AccountPublic; token: string }
    | { ok: false; code: 'invalid' | 'exists' };
  loginAccount(input: {
    email: string;
    password: string;
  }):
    | { ok: true; account: AccountPublic; token: string }
    | { ok: false; code: 'invalid' };
  setAccountPlan(accountId: string, planId: PlanId): AccountPublic | undefined;
  setAccountStripeIds(
    accountId: string,
    customerId: string | null,
    subscriptionId: string | null
  ): Account | undefined;
  setAccountPassword(accountId: string, password: string): boolean;
  checkAccountPassword(accountId: string, password: string): boolean;
  markEmailVerified(accountId: string): AccountPublic | undefined;
  issueAuthToken(
    accountId: string,
    purpose: 'verify' | 'reset',
    ttlMs: number
  ): { token: string; expiresAt: string } | undefined;
  consumeAuthToken(
    token: string,
    purpose: 'verify' | 'reset'
  ): Account | undefined;
  countSites(workspaceId?: string): number;
}
