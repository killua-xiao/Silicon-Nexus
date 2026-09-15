import { closeDatabase, ensureDataDir, getDb, getDbPath, initDatabase, probeDatabase } from './db.ts';
import { generateSecret, hashToken } from './crypto.ts';
import { logJson } from './log.ts';
import { migrateFromJsonIfNeeded } from './store/migrate.ts';
import { SqliteStore } from './store/sqlite.ts';
import type { NexusStore } from './store/types.ts';
import type {
  AgentMemory,
  FeedItemInput,
  PlanId,
  SiteContentInput,
  SiteInput,
} from './types.ts';

export { ensureDataDir, generateSecret, hashToken, probeDatabase };

let store: NexusStore | null = null;

export function getStore(): NexusStore {
  if (!store) {
    throw new Error('Store not initialized. Call loadPreservedState() first.');
  }
  return store;
}

/** Boot SQLite, run schema + optional JSON migration. */
export function loadPreservedState() {
  const db = initDatabase();
  migrateFromJsonIfNeeded(db);
  store = new SqliteStore(db);
  store.ensureReady();
  logJson('info', 'Persistent store ready (SQLite)', { path: getDbPath() });
}

/** Checkpoint WAL — used on graceful shutdown. */
export function flushStateSync() {
  try {
    getStore().flush();
  } catch (error) {
    logJson('error', 'Failed to flush SQLite store', { error: String(error) });
  }
}

export function closeStore() {
  try {
    flushStateSync();
  } finally {
    closeDatabase();
    store = null;
  }
}

/** @deprecated no-op — SQLite writes are synchronous */
export function persistState() {
  // retained for call-site compatibility during transition
}

export function logEvent(type: string, agentId: string, details: string, workspaceId?: string) {
  getStore().logEvent(type, agentId, details, workspaceId);
}

export function getEventLogs(workspaceId?: string) {
  return getStore().getEventLogs(workspaceId);
}

export function findCredentialByTokenHash(tokenHash: string) {
  return getStore().findCredentialByTokenHash(tokenHash);
}

export function listAgentSummaries(workspaceId?: string) {
  return getStore().listAgentSummaries(workspaceId);
}

export function listPublicAgents(workspaceId?: string) {
  return getStore().listPublicAgents(workspaceId);
}

export function registerAgentToken(
  agentId: string,
  options: { label?: string; rotate?: boolean; planId?: string | null },
  workspaceId?: string
) {
  return getStore().registerAgentToken(agentId, options, workspaceId);
}

export function revokeAgentToken(agentId: string, workspaceId?: string) {
  return getStore().revokeAgentToken(agentId, workspaceId);
}

export function updateAgentLabel(agentId: string, label: string, workspaceId?: string) {
  return getStore().updateAgentLabel(agentId, label, workspaceId);
}

export function updateAgentProfile(
  agentId: string,
  patch: { label?: string; listed?: boolean; blurb?: string | null },
  workspaceId?: string
) {
  return getStore().updateAgentProfile(agentId, patch, workspaceId);
}

export function writeAgentMemory(agentId: string, data: AgentMemory, workspaceId?: string) {
  return getStore().writeAgentMemory(agentId, data, workspaceId);
}

export function wipeAgentMemory(agentId: string, workspaceId?: string) {
  return getStore().wipeAgentMemory(agentId, workspaceId);
}

export function readAgentMemory(agentId: string, workspaceId?: string) {
  return getStore().readAgentMemory(agentId, workspaceId);
}

export function getMemoryStore(workspaceId?: string) {
  return getStore().getMemoryStore(workspaceId);
}

export function createTask(input: {
  creatorId: string;
  type: string;
  payload: unknown;
  workspaceId?: string;
}) {
  return getStore().createTask(input);
}

export function listOpenTasks(type?: string, workspaceId?: string) {
  return getStore().listOpenTasks(type, workspaceId);
}

export function listOpenTasksAll(limit?: number) {
  return getStore().listOpenTasksAll(limit);
}

export function listOpenTasksByTypes(types: string[], limit?: number) {
  return getStore().listOpenTasksByTypes(types, limit);
}

export function listActiveTasks(limit?: number) {
  return getStore().listActiveTasks(limit);
}

export function getTaskQueue(workspaceId?: string) {
  return getStore().getTaskQueue(workspaceId);
}

export function findTask(taskId: string, workspaceId?: string) {
  return getStore().findTask(taskId, workspaceId);
}

export function claimOpenTask(taskId: string, agentId: string, workspaceId?: string) {
  return getStore().claimOpenTask(taskId, agentId, workspaceId);
}

export function completeTask(
  taskId: string,
  agentId: string,
  status: 'completed' | 'failed',
  result: unknown,
  workspaceId?: string
) {
  return getStore().completeTask(taskId, agentId, status, result, workspaceId);
}

export function failTask(taskId: string, lastError: string, workspaceId?: string) {
  return getStore().failTask(taskId, lastError, workspaceId);
}

export function reopenTask(taskId: string, workspaceId?: string) {
  return getStore().reopenTask(taskId, workspaceId);
}

export function dashboardStats(workspaceId?: string) {
  return getStore().dashboardStats(workspaceId);
}

export function usageSnapshot(workspaceId?: string) {
  return getStore().usageSnapshot(workspaceId);
}

export function incrementUsage(metric: string, amount = 1, workspaceId?: string) {
  return getStore().incrementUsage(metric, amount, workspaceId);
}

export function listFeedItems(options?: { limit?: number; since?: string; workspaceId?: string }) {
  return getStore().listFeedItems(options);
}

export function getFeedItemBySlug(slug: string, workspaceId?: string) {
  return getStore().getFeedItemBySlug(slug, workspaceId);
}

export function upsertFeedItem(input: FeedItemInput, workspaceId?: string) {
  return getStore().upsertFeedItem(input, workspaceId);
}

export function deleteFeedItem(slug: string, workspaceId?: string) {
  return getStore().deleteFeedItem(slug, workspaceId);
}

export function recordFeedCrawl(slug: string, crawlerId: string, workspaceId?: string) {
  return getStore().recordFeedCrawl(slug, crawlerId, workspaceId);
}

export function listSites(workspaceId?: string) {
  return getStore().listSites(workspaceId);
}

export function listSitesDueForPull(staleMs?: number, limit?: number) {
  return getStore().listSitesDueForPull(staleMs, limit);
}

export function listSitesWithSitemap(limit?: number) {
  return getStore().listSitesWithSitemap(limit);
}

export function getSiteBySlug(slug: string, workspaceId?: string) {
  return getStore().getSiteBySlug(slug, workspaceId);
}

export function upsertSite(input: SiteInput, workspaceId?: string) {
  return getStore().upsertSite(input, workspaceId);
}

export function recordSitePull(slug: string, note: string, workspaceId?: string) {
  return getStore().recordSitePull(slug, note, workspaceId);
}

export function deleteSite(slug: string, workspaceId?: string) {
  return getStore().deleteSite(slug, workspaceId);
}

export function listSiteContent(siteSlug: string, options?: { limit?: number; workspaceId?: string }) {
  return getStore().listSiteContent(siteSlug, options);
}

export function getSiteContent(siteSlug: string, contentSlug: string, workspaceId?: string) {
  return getStore().getSiteContent(siteSlug, contentSlug, workspaceId);
}

export function upsertSiteContent(siteSlug: string, input: SiteContentInput, workspaceId?: string) {
  return getStore().upsertSiteContent(siteSlug, input, workspaceId);
}

export function deleteSiteContent(siteSlug: string, contentSlug: string, workspaceId?: string) {
  return getStore().deleteSiteContent(siteSlug, contentSlug, workspaceId);
}

export function recordSiteContentCrawl(
  siteSlug: string,
  contentSlug: string,
  crawlerId: string,
  workspaceId?: string
) {
  return getStore().recordSiteContentCrawl(siteSlug, contentSlug, crawlerId, workspaceId);
}

export function siteGeoStatus(siteSlug: string, appUrl: string, workspaceId?: string) {
  return getStore().siteGeoStatus(siteSlug, appUrl, workspaceId);
}

export function findAccountByTokenHash(tokenHash: string) {
  return getStore().findAccountByTokenHash(tokenHash);
}

export function getAccountById(id: string) {
  return getStore().getAccountById(id);
}

export function findAccountByEmail(email: string) {
  return getStore().findAccountByEmail(email);
}

export function getAccountByStripeCustomerId(customerId: string) {
  return getStore().getAccountByStripeCustomerId(customerId);
}

export function listAccounts() {
  return getStore().listAccounts();
}

export function registerAccount(input: { email: string; password: string }) {
  return getStore().registerAccount(input);
}

export function loginAccount(input: { email: string; password: string }) {
  return getStore().loginAccount(input);
}

export function setAccountPlan(accountId: string, planId: PlanId) {
  return getStore().setAccountPlan(accountId, planId);
}

export function setAccountStripeIds(
  accountId: string,
  customerId: string | null,
  subscriptionId: string | null
) {
  return getStore().setAccountStripeIds(accountId, customerId, subscriptionId);
}

export function setAccountPassword(accountId: string, password: string) {
  return getStore().setAccountPassword(accountId, password);
}

export function checkAccountPassword(accountId: string, password: string) {
  return getStore().checkAccountPassword(accountId, password);
}

export function markEmailVerified(accountId: string) {
  return getStore().markEmailVerified(accountId);
}

export function issueAuthToken(accountId: string, purpose: 'verify' | 'reset', ttlMs: number) {
  return getStore().issueAuthToken(accountId, purpose, ttlMs);
}

export function consumeAuthToken(token: string, purpose: 'verify' | 'reset') {
  return getStore().consumeAuthToken(token, purpose);
}

export function countSites(workspaceId?: string) {
  return getStore().countSites(workspaceId);
}

export function getAgentCredentials() {
  return getStore().listAgentSummaries().map((a) => ({
    agentId: a.agentId,
    workspaceId: a.workspaceId,
    tokenHash: '',
    createdAt: a.createdAt,
    rotatedAt: a.rotatedAt,
    label: a.label,
  }));
}
