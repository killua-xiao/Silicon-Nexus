import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { generateSecret, hashPassword, hashToken, verifyPassword } from '../crypto.ts';
import {
  Account,
  AccountPublic,
  AccountRole,
  AgentCredential,
  AgentMemory,
  AgentSummary,
  DEFAULT_WORKSPACE_ID,
  FeedItem,
  FeedItemInput,
  MAX_AGENTS,
  MAX_LOGS,
  MAX_TASKS,
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
  resolvePlan,
} from '../types.ts';
import type { NexusStore, RegisterAgentFailure, RegisterAgentResult } from './types.ts';
import { buildIndexing, INDEXING_NOTE } from '../crawlDetect.ts';

type TaskRow = {
  id: string;
  workspace_id: string;
  creator_id: string;
  type: string;
  payload_json: string;
  status: Task['status'];
  assigned_to: string | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
  claim_version: number;
  attempts: number;
  last_error: string | null;
};

type AgentRow = {
  agent_id: string;
  workspace_id: string;
  token_hash: string;
  created_at: string;
  rotated_at: string | null;
  label: string | null;
  listed?: number | null;
  blurb?: string | null;
};

type FeedRow = {
  id: string;
  workspace_id: string;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  tags_json: string;
  source: string;
  source_url: string | null;
  external_id: string | null;
  published_at: string;
  updated_at: string;
  crawl_hits?: number | null;
  last_crawled_at?: string | null;
  crawlers_json?: string | null;
};

type SiteRow = {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  domain: string | null;
  description: string;
  created_at: string;
  updated_at: string;
  sitemap_url?: string | null;
  last_pulled_at?: string | null;
  last_pull_note?: string | null;
};

type SiteContentRow = {
  id: string;
  site_id: string;
  workspace_id: string;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  canonical_url: string | null;
  tags_json: string;
  published_at: string;
  updated_at: string;
  crawl_hits?: number | null;
  last_crawled_at?: string | null;
  crawlers_json?: string | null;
};

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function rowToFeed(row: FeedRow): FeedItem {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    bodyMd: row.body_md,
    tags,
    source: row.source,
    sourceUrl: row.source_url,
    externalId: row.external_id,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    indexing: buildIndexing({
      crawlHits: row.crawl_hits || 0,
      lastCrawledAt: row.last_crawled_at || null,
      crawlersJson: row.crawlers_json || '[]',
    }),
  };
}

function rowToSite(row: SiteRow): Site {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    slug: row.slug,
    name: row.name,
    domain: row.domain,
    description: row.description || '',
    sitemapUrl: row.sitemap_url || null,
    lastPulledAt: row.last_pulled_at || null,
    lastPullNote: row.last_pull_note || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSiteContent(row: SiteContentRow): SiteContent {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags_json || '[]');
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    siteId: row.site_id,
    workspaceId: row.workspace_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    bodyMd: row.body_md,
    canonicalUrl: row.canonical_url,
    tags,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    indexing: buildIndexing({
      crawlHits: row.crawl_hits || 0,
      lastCrawledAt: row.last_crawled_at || null,
      crawlersJson: row.crawlers_json || '[]',
    }),
  };
}

type MemoryRow = {
  workspace_id: string;
  agent_id: string;
  data_json: string;
  updated_at: string;
};

type AuditRow = {
  id: string;
  workspace_id: string;
  timestamp: string;
  type: string;
  agent_id: string;
  details: string;
};

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    creatorId: row.creator_id,
    type: row.type,
    payload: JSON.parse(row.payload_json),
    status: row.status,
    assignedTo: row.assigned_to || undefined,
    result: row.result_json ? JSON.parse(row.result_json) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    claimVersion: row.claim_version,
    attempts: row.attempts,
    lastError: row.last_error,
  };
}

function rowToCredential(row: AgentRow): AgentCredential {
  return {
    agentId: row.agent_id,
    workspaceId: row.workspace_id,
    tokenHash: row.token_hash,
    createdAt: row.created_at,
    rotatedAt: row.rotated_at,
    label: row.label,
  };
}

function rowToEvent(row: AuditRow): SystemEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    timestamp: row.timestamp,
    type: row.type,
    agentId: row.agent_id,
    details: row.details,
  };
}

export class SqliteStore implements NexusStore {
  constructor(private readonly db: Database.Database) {}

  ensureReady(): void {
    this.db.prepare('SELECT 1').get();
    this.isolateSharedUserAccounts();
    this.grandfatherVerifiedAccounts();
  }

  /** First boot of email-verify: existing accounts are treated as already confirmed. */
  private grandfatherVerifiedAccounts(): void {
    const tokens = (this.db.prepare(`SELECT COUNT(*) AS c FROM auth_tokens`).get() as { c: number }).c;
    if (tokens > 0) return;
    this.db
      .prepare(
        `UPDATE accounts SET email_verified_at = COALESCE(email_verified_at, created_at)
         WHERE email_verified_at IS NULL`
      )
      .run();
  }

  private planFor(workspaceId?: string) {
    const ws = this.ws(workspaceId);
    const row = this.db
      .prepare(`SELECT plan_id FROM workspaces WHERE id = ?`)
      .get(ws) as { plan_id?: string } | undefined;
    return resolvePlan(row?.plan_id || null);
  }

  private createWorkspace(id: string, name: string, planId: PlanId): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT OR IGNORE INTO workspaces (id, name, created_at, plan_id) VALUES (?, ?, ?, ?)`
      )
      .run(id, name, now, planId);
    this.db.prepare(`UPDATE workspaces SET plan_id = ?, name = ? WHERE id = ?`).run(planId, name, id);
  }

  /** Move non-admin accounts off the shared default workspace. */
  private isolateSharedUserAccounts(): void {
    const rows = this.db
      .prepare(
        `SELECT id, email, plan_id FROM accounts
         WHERE role = 'user' AND workspace_id = ?`
      )
      .all(DEFAULT_WORKSPACE_ID) as Array<{ id: string; email: string; plan_id: string }>;
    for (const row of rows) {
      const wsId = `ws_${row.id}`;
      const planId = (row.plan_id || 'free') as PlanId;
      this.createWorkspace(wsId, row.email, planId);
      this.db.prepare(`UPDATE accounts SET workspace_id = ? WHERE id = ?`).run(wsId, row.id);
      this.logEvent(
        'WORKSPACE_ISOLATED',
        row.email,
        `Moved account off shared default workspace`,
        wsId
      );
    }
  }

  flush(): void {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
  }

  ping(): boolean {
    try {
      this.db.prepare('SELECT 1 AS ok').get();
      return true;
    } catch {
      return false;
    }
  }

  private ws(workspaceId?: string): string {
    return workspaceId || DEFAULT_WORKSPACE_ID;
  }

  logEvent(type: string, agentId: string, details: string, workspaceId?: string): void {
    const ws = this.ws(workspaceId);
    const id = crypto.randomBytes(6).toString('hex');
    const timestamp = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO audit_events (id, workspace_id, timestamp, type, agent_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, ws, timestamp, type, agentId, details);

    const count = (
      this.db.prepare('SELECT COUNT(*) AS c FROM audit_events WHERE workspace_id = ?').get(ws) as {
        c: number;
      }
    ).c;
    if (count > MAX_LOGS) {
      this.db
        .prepare(
          `DELETE FROM audit_events WHERE id IN (
             SELECT id FROM audit_events WHERE workspace_id = ?
             ORDER BY timestamp ASC LIMIT ?
           )`
        )
        .run(ws, count - MAX_LOGS);
    }
  }

  getEventLogs(workspaceId?: string, limit = 100): SystemEvent[] {
    const ws = this.ws(workspaceId);
    const rows = this.db
      .prepare(
        `SELECT * FROM audit_events WHERE workspace_id = ?
         ORDER BY timestamp DESC LIMIT ?`
      )
      .all(ws, limit) as AuditRow[];
    return rows.map(rowToEvent);
  }

  findCredentialByTokenHash(tokenHash: string): AgentCredential | undefined {
    const row = this.db
      .prepare('SELECT * FROM agents WHERE token_hash = ? LIMIT 1')
      .get(tokenHash) as AgentRow | undefined;
    return row ? rowToCredential(row) : undefined;
  }

  listAgentSummaries(workspaceId?: string): AgentSummary[] {
    const ws = this.ws(workspaceId);
    const rows = this.db
      .prepare(
        `SELECT agent_id, workspace_id, created_at, rotated_at, label, listed, blurb
         FROM agents WHERE workspace_id = ? ORDER BY created_at DESC`
      )
      .all(ws) as AgentRow[];
    return rows.map((r) => ({
      agentId: r.agent_id,
      workspaceId: r.workspace_id,
      createdAt: r.created_at,
      rotatedAt: r.rotated_at,
      label: r.label,
      hasToken: true,
      listed: !!r.listed,
      blurb: r.blurb ?? null,
    }));
  }

  listPublicAgents(workspaceId?: string): PublicAgentEntry[] {
    const rows = workspaceId
      ? (this.db
          .prepare(
            `SELECT agent_id, label, blurb, created_at
             FROM agents WHERE workspace_id = ? AND listed = 1
             ORDER BY created_at DESC`
          )
          .all(this.ws(workspaceId)) as AgentRow[])
      : (this.db
          .prepare(
            `SELECT agent_id, label, blurb, created_at
             FROM agents WHERE listed = 1
             ORDER BY created_at DESC`
          )
          .all() as AgentRow[]);
    return rows.map((r) => ({
      agentId: r.agent_id,
      label: r.label,
      blurb: r.blurb ?? null,
      createdAt: r.created_at,
    }));
  }

  incrementUsage(metric: string, amount = 1, workspaceId?: string): void {
    const ws = this.ws(workspaceId);
    const day = utcDay();
    this.db
      .prepare(
        `INSERT INTO usage_counters (workspace_id, day, metric, value)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(workspace_id, day, metric)
         DO UPDATE SET value = value + excluded.value`
      )
      .run(ws, day, metric, amount);
  }

  private readUsageMetric(metric: string, workspaceId?: string): number {
    const ws = this.ws(workspaceId);
    const row = this.db
      .prepare(
        `SELECT value FROM usage_counters WHERE workspace_id = ? AND day = ? AND metric = ?`
      )
      .get(ws, utcDay(), metric) as { value: number } | undefined;
    return row?.value ?? 0;
  }

  registerAgentToken(
    agentId: string,
    options: { label?: string; rotate?: boolean; planId?: string | null },
    workspaceId?: string
  ): RegisterAgentResult | RegisterAgentFailure {
    const ws = this.ws(workspaceId);
    const existing = this.db
      .prepare('SELECT * FROM agents WHERE workspace_id = ? AND agent_id = ?')
      .get(ws, agentId) as AgentRow | undefined;

    if (existing && !options.rotate) {
      return { ok: false, code: 'exists' };
    }

    const agentCount = (
      this.db.prepare('SELECT COUNT(*) AS c FROM agents WHERE workspace_id = ?').get(ws) as {
        c: number;
      }
    ).c;
    const memoryExists = this.db
      .prepare('SELECT 1 AS ok FROM memory WHERE workspace_id = ? AND agent_id = ?')
      .get(ws, agentId);

    const plan = options.planId ? resolvePlan(options.planId) : this.planFor(ws);
    if (!existing && !memoryExists) {
      if (agentCount >= MAX_AGENTS) return { ok: false, code: 'capacity' };
      if (agentCount >= plan.maxAgents) return { ok: false, code: 'plan_limit' };
    }

    const token = generateSecret('nxa');
    const now = new Date().toISOString();
    const tokenHash = hashToken(token);

    const tx = this.db.transaction(() => {
      if (existing) {
        this.db
          .prepare(
            `UPDATE agents SET token_hash = ?, rotated_at = ?, label = COALESCE(?, label)
             WHERE workspace_id = ? AND agent_id = ?`
          )
          .run(tokenHash, now, options.label ?? null, ws, agentId);
      } else {
        this.db
          .prepare(
            `INSERT INTO agents (agent_id, workspace_id, token_hash, created_at, rotated_at, label)
             VALUES (?, ?, ?, ?, NULL, ?)`
          )
          .run(agentId, ws, tokenHash, now, options.label ?? null);
      }

      const mem = this.db
        .prepare('SELECT 1 AS ok FROM memory WHERE workspace_id = ? AND agent_id = ?')
        .get(ws, agentId);
      if (!mem) {
        this.db
          .prepare(
            `INSERT INTO memory (workspace_id, agent_id, data_json, updated_at)
             VALUES (?, ?, '{}', ?)`
          )
          .run(ws, agentId, now);
        this.logEvent('AGENT_REGISTERED', agentId, 'Agent enrolled with scoped token.', ws);
      } else {
        this.logEvent(
          'AGENT_TOKEN_ROTATED',
          agentId,
          options.rotate ? 'Token rotated.' : 'Token issued.',
          ws
        );
      }
    });
    tx();

    return { ok: true, token, rotated: !!existing };
  }

  revokeAgentToken(agentId: string, workspaceId?: string): boolean {
    const ws = this.ws(workspaceId);
    const result = this.db
      .prepare('DELETE FROM agents WHERE workspace_id = ? AND agent_id = ?')
      .run(ws, agentId);
    if (result.changes === 0) return false;
    this.logEvent('AGENT_TOKEN_REVOKED', agentId, 'Operator revoked agent token.', ws);
    return true;
  }

  updateAgentLabel(agentId: string, label: string, workspaceId?: string): boolean {
    return this.updateAgentProfile(agentId, { label }, workspaceId);
  }

  updateAgentProfile(
    agentId: string,
    patch: { label?: string; listed?: boolean; blurb?: string | null },
    workspaceId?: string
  ): boolean {
    const ws = this.ws(workspaceId);
    const existing = this.db
      .prepare('SELECT * FROM agents WHERE workspace_id = ? AND agent_id = ?')
      .get(ws, agentId) as AgentRow | undefined;
    if (!existing) return false;

    const label = patch.label !== undefined ? patch.label : existing.label;
    const listed =
      patch.listed !== undefined ? (patch.listed ? 1 : 0) : existing.listed ?? 0;
    const blurb = patch.blurb !== undefined ? patch.blurb : existing.blurb ?? null;

    this.db
      .prepare(
        `UPDATE agents SET label = ?, listed = ?, blurb = ?
         WHERE workspace_id = ? AND agent_id = ?`
      )
      .run(label, listed, blurb, ws, agentId);

    const bits: string[] = [];
    if (patch.label !== undefined) bits.push(`label=${label}`);
    if (patch.listed !== undefined) bits.push(patch.listed ? 'listed' : 'unlisted');
    if (patch.blurb !== undefined) bits.push('blurb updated');
    this.logEvent('AGENT_PROFILE_UPDATED', agentId, bits.join(', ') || 'profile updated', ws);
    return true;
  }

  writeAgentMemory(
    agentId: string,
    data: AgentMemory,
    workspaceId?: string
  ): { ok: true; storedKeys: string[] } | { ok: false; code: 'capacity' | 'plan_limit' } {
    const ws = this.ws(workspaceId);
    const existing = this.db
      .prepare('SELECT data_json FROM memory WHERE workspace_id = ? AND agent_id = ?')
      .get(ws, agentId) as MemoryRow | undefined;

    if (!existing) {
      const count = (
        this.db.prepare('SELECT COUNT(*) AS c FROM memory WHERE workspace_id = ?').get(ws) as {
          c: number;
        }
      ).c;
      if (count >= MAX_AGENTS) return { ok: false, code: 'capacity' };
    }

    const now = new Date().toISOString();
    const merged = { ...(existing ? JSON.parse(existing.data_json) : {}), ...data };
    const nextBytes = Buffer.byteLength(JSON.stringify(merged), 'utf8');
    const otherBytes = (
      this.db
        .prepare(
          `SELECT COALESCE(SUM(LENGTH(data_json)), 0) AS b FROM memory
           WHERE workspace_id = ? AND agent_id != ?`
        )
        .get(ws, agentId) as { b: number }
    ).b;
    const plan = this.planFor(ws);
    if (otherBytes + nextBytes > plan.maxMemoryBytes) {
      return { ok: false, code: 'plan_limit' };
    }

    if (existing) {
      this.db
        .prepare(
          `UPDATE memory SET data_json = ?, updated_at = ? WHERE workspace_id = ? AND agent_id = ?`
        )
        .run(JSON.stringify(merged), now, ws, agentId);
    } else {
      this.db
        .prepare(
          `INSERT INTO memory (workspace_id, agent_id, data_json, updated_at) VALUES (?, ?, ?, ?)`
        )
        .run(ws, agentId, JSON.stringify(merged), now);
      this.logEvent('AGENT_REGISTERED', agentId, 'New silicon entity detected.', ws);
    }

    this.logEvent('MEMORY_WRITE', agentId, `Wrote keys: ${Object.keys(data).join(', ')}`, ws);
    this.incrementUsage('memory_writes', 1, ws);
    return { ok: true, storedKeys: Object.keys(data) };
  }

  wipeAgentMemory(agentId: string, workspaceId?: string): boolean {
    const ws = this.ws(workspaceId);
    const existing = this.db
      .prepare('SELECT 1 AS ok FROM memory WHERE workspace_id = ? AND agent_id = ?')
      .get(ws, agentId);
    if (!existing) return false;
    this.db
      .prepare(
        `UPDATE memory SET data_json = '{}', updated_at = ? WHERE workspace_id = ? AND agent_id = ?`
      )
      .run(new Date().toISOString(), ws, agentId);
    this.logEvent('MEMORY_WIPE', agentId, 'Memory register cleared.', ws);
    return true;
  }

  readAgentMemory(agentId: string, workspaceId?: string): AgentMemory {
    const ws = this.ws(workspaceId);
    const row = this.db
      .prepare('SELECT data_json FROM memory WHERE workspace_id = ? AND agent_id = ?')
      .get(ws, agentId) as { data_json: string } | undefined;
    return row ? JSON.parse(row.data_json) : {};
  }

  getMemoryStore(workspaceId?: string): Record<string, AgentMemory> {
    const ws = this.ws(workspaceId);
    const rows = this.db
      .prepare('SELECT agent_id, data_json FROM memory WHERE workspace_id = ?')
      .all(ws) as { agent_id: string; data_json: string }[];
    const out: Record<string, AgentMemory> = {};
    for (const row of rows) {
      out[row.agent_id] = JSON.parse(row.data_json);
    }
    return out;
  }

  private pruneTaskQueueIfNeeded(ws: string) {
    const count = (
      this.db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ?').get(ws) as {
        c: number;
      }
    ).c;
    if (count < MAX_TASKS) return;

    const completed = this.db
      .prepare(
        `SELECT id FROM tasks WHERE workspace_id = ? AND status IN ('completed', 'failed')
         ORDER BY updated_at ASC LIMIT 500`
      )
      .all(ws) as { id: string }[];

    if (completed.length > 0) {
      const del = this.db.prepare('DELETE FROM tasks WHERE id = ?');
      const tx = this.db.transaction(() => {
        for (const row of completed) del.run(row.id);
      });
      tx();
    } else {
      const oldest = this.db
        .prepare(
          `SELECT id FROM tasks WHERE workspace_id = ? ORDER BY created_at ASC LIMIT 500`
        )
        .all(ws) as { id: string }[];
      const del = this.db.prepare('DELETE FROM tasks WHERE id = ?');
      const tx = this.db.transaction(() => {
        for (const row of oldest) del.run(row.id);
      });
      tx();
    }
  }

  createTask(input: {
    creatorId: string;
    type: string;
    payload: unknown;
    workspaceId?: string;
  }): Task | { ok: false; code: 'plan_limit' } {
    const ws = this.ws(input.workspaceId);
    const plan = this.planFor(ws);
    if (this.readUsageMetric('tasks_created', ws) >= plan.maxTasksPerDay) {
      return { ok: false, code: 'plan_limit' };
    }
    this.pruneTaskQueueIfNeeded(ws);
    const now = new Date().toISOString();
    const id = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.db
      .prepare(
        `INSERT INTO tasks (
           id, workspace_id, creator_id, type, payload_json, status,
           assigned_to, result_json, created_at, updated_at, claim_version, attempts, last_error
         ) VALUES (?, ?, ?, ?, ?, 'open', NULL, NULL, ?, ?, 0, 0, NULL)`
      )
      .run(id, ws, input.creatorId, input.type, JSON.stringify(input.payload), now, now);
    this.logEvent('TASK_CREATED', input.creatorId, `Posted task type: ${input.type}`, ws);
    this.incrementUsage('tasks_created', 1, ws);
    return this.findTask(id, ws)!;
  }

  listOpenTasks(type?: string, workspaceId?: string): Task[] {
    const ws = this.ws(workspaceId);
    let rows: TaskRow[];
    if (type) {
      rows = this.db
        .prepare(
          `SELECT * FROM tasks WHERE workspace_id = ? AND status = 'open' AND type = ?
           ORDER BY created_at ASC LIMIT 50`
        )
        .all(ws, type) as TaskRow[];
    } else {
      rows = this.db
        .prepare(
          `SELECT * FROM tasks WHERE workspace_id = ? AND status = 'open'
           ORDER BY created_at ASC LIMIT 50`
        )
        .all(ws) as TaskRow[];
    }
    return rows.map(rowToTask);
  }

  getTaskQueue(workspaceId?: string): Task[] {
    const ws = this.ws(workspaceId);
    const rows = this.db
      .prepare(
        `SELECT * FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 100`
      )
      .all(ws) as TaskRow[];
    return rows.map(rowToTask).reverse();
  }

  findTask(taskId: string, workspaceId?: string): Task | undefined {
    if (workspaceId) {
      const row = this.db
        .prepare('SELECT * FROM tasks WHERE id = ? AND workspace_id = ?')
        .get(taskId, this.ws(workspaceId)) as TaskRow | undefined;
      return row ? rowToTask(row) : undefined;
    }
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as
      | TaskRow
      | undefined;
    return row ? rowToTask(row) : undefined;
  }

  claimOpenTask(
    taskId: string,
    agentId: string,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' | 'not_open' } {
    const existing = this.findTask(taskId, workspaceId);
    const ws = existing?.workspaceId || this.ws(workspaceId);
    const now = new Date().toISOString();

    // better-sqlite3 writer transactions use BEGIN IMMEDIATE
    type ClaimResult = { ok: true } | { ok: false; code: 'not_found' | 'not_open' };
    const result = this.db.transaction((): ClaimResult => {
      const row = this.db
        .prepare('SELECT * FROM tasks WHERE id = ? AND workspace_id = ?')
        .get(taskId, ws) as TaskRow | undefined;
      if (!row) return { ok: false, code: 'not_found' };
      if (row.status !== 'open') return { ok: false, code: 'not_open' };

      const update = this.db
        .prepare(
          `UPDATE tasks SET status = 'processing', assigned_to = ?, updated_at = ?,
           claim_version = claim_version + 1, attempts = attempts + 1
           WHERE id = ? AND workspace_id = ? AND status = 'open'`
        )
        .run(agentId, now, taskId, ws);

      if (update.changes === 0) return { ok: false, code: 'not_open' };
      return { ok: true };
    })();

    if (result.ok === false) {
      return { ok: false, code: result.code };
    }
    this.logEvent('TASK_ACQUIRED', agentId, `Processing task: ${taskId}`, ws);
    return { ok: true, task: this.findTask(taskId, ws)! };
  }

  completeTask(
    taskId: string,
    agentId: string,
    status: 'completed' | 'failed',
    result: unknown,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' | 'forbidden' } {
    const task = this.findTask(taskId, workspaceId);
    if (!task) return { ok: false, code: 'not_found' };
    const ws = task.workspaceId;
    if (task.assignedTo && task.assignedTo !== agentId) {
      return { ok: false, code: 'forbidden' };
    }

    const now = new Date().toISOString();
    const lastError =
      status === 'failed'
        ? typeof result === 'string'
          ? result
          : JSON.stringify(result ?? 'failed')
        : null;

    this.db
      .prepare(
        `UPDATE tasks SET status = ?, result_json = ?, assigned_to = COALESCE(assigned_to, ?),
         updated_at = ?, last_error = CASE WHEN ? = 'failed' THEN ? ELSE last_error END
         WHERE id = ? AND workspace_id = ?`
      )
      .run(status, JSON.stringify(result ?? null), agentId, now, status, lastError, taskId, ws);

    this.logEvent(`TASK_${status.toUpperCase()}`, agentId, `Finished task: ${taskId}`, ws);
    return { ok: true, task: this.findTask(taskId, ws)! };
  }

  failTask(
    taskId: string,
    lastError: string,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' } {
    const task = this.findTask(taskId, workspaceId);
    if (!task) return { ok: false, code: 'not_found' };
    const ws = task.workspaceId;
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE tasks SET status = 'failed', last_error = ?, updated_at = ?,
         result_json = COALESCE(result_json, ?)
         WHERE id = ? AND workspace_id = ?`
      )
      .run(lastError, now, JSON.stringify({ error: lastError }), taskId, ws);
    this.logEvent('TASK_FAILED', task.assignedTo || task.creatorId, `Failed task: ${taskId}`, ws);
    return { ok: true, task: this.findTask(taskId, ws)! };
  }

  reopenTask(
    taskId: string,
    workspaceId?: string
  ): { ok: true; task: Task } | { ok: false; code: 'not_found' | 'not_reopenable' } {
    const task = this.findTask(taskId, workspaceId);
    if (!task) return { ok: false, code: 'not_found' };
    const ws = task.workspaceId;
    if (task.status !== 'failed' && task.status !== 'processing') {
      return { ok: false, code: 'not_reopenable' };
    }
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE tasks SET status = 'open', assigned_to = NULL, updated_at = ?, last_error = NULL
         WHERE id = ? AND workspace_id = ?`
      )
      .run(now, taskId, ws);
    this.logEvent('TASK_REOPENED', task.creatorId, `Reopened task: ${taskId}`, ws);
    return { ok: true, task: this.findTask(taskId, ws)! };
  }

  dashboardStats(workspaceId?: string) {
    const ws = this.ws(workspaceId);
    const activeAgents = (
      this.db.prepare('SELECT COUNT(*) AS c FROM memory WHERE workspace_id = ?').get(ws) as {
        c: number;
      }
    ).c;
    const totalTasks = (
      this.db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ?').get(ws) as {
        c: number;
      }
    ).c;
    const completedTasks = (
      this.db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ? AND status IN ('completed', 'failed')`
        )
        .get(ws) as { c: number }
    ).c;
    const enrolledAgents = (
      this.db.prepare('SELECT COUNT(*) AS c FROM agents WHERE workspace_id = ?').get(ws) as {
        c: number;
      }
    ).c;
    return { activeAgents, totalTasks, completedTasks, enrolledAgents };
  }

  usageSnapshot(workspaceId?: string): UsageSnapshot {
    const ws = this.ws(workspaceId);
    const stats = this.dashboardStats(ws);
    const openTasks = (
      this.db
        .prepare(`SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ? AND status = 'open'`)
        .get(ws) as { c: number }
    ).c;
    const processingTasks = (
      this.db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ? AND status = 'processing'`
        )
        .get(ws) as { c: number }
    ).c;
    const completedOnly = (
      this.db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ? AND status = 'completed'`
        )
        .get(ws) as { c: number }
    ).c;
    const failedTasks = (
      this.db
        .prepare(`SELECT COUNT(*) AS c FROM tasks WHERE workspace_id = ? AND status = 'failed'`)
        .get(ws) as { c: number }
    ).c;

    const memRows = this.db
      .prepare('SELECT data_json FROM memory WHERE workspace_id = ?')
      .all(ws) as { data_json: string }[];
    const memoryBytes = memRows.reduce((sum, r) => sum + Buffer.byteLength(r.data_json, 'utf8'), 0);
    const listedAgents = (
      this.db
        .prepare(`SELECT COUNT(*) AS c FROM agents WHERE workspace_id = ? AND listed = 1`)
        .get(ws) as { c: number }
    ).c;
    const plan = this.planFor(ws);
    const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY || '').trim();

    return {
      workspaceId: ws,
      enrolledAgents: stats.enrolledAgents,
      memoryAgents: stats.activeAgents,
      memoryBytes,
      totalTasks: stats.totalTasks,
      openTasks,
      processingTasks,
      completedTasks: completedOnly,
      failedTasks,
      listedAgents,
      plan,
      today: {
        day: utcDay(),
        apiRequests: this.readUsageMetric('api_requests', ws),
        memoryWrites: this.readUsageMetric('memory_writes', ws),
        tasksCreated: this.readUsageMetric('tasks_created', ws),
      },
      billing: {
        provider: stripeConfigured ? 'stripe' : 'none',
        stripeConfigured,
        note: stripeConfigured
          ? 'Stripe key detected — Checkout webhooks can map subscriptions to account.planId.'
          : 'Plans enforced locally. Admins upgrade accounts via PATCH /api/accounts/:id/plan. See /pricing.',
      },
    };
  }

  listFeedItems(options?: { limit?: number; since?: string; workspaceId?: string }): FeedItem[] {
    const ws = this.ws(options?.workspaceId);
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
    const since = options?.since;
    let rows: FeedRow[];
    if (since) {
      rows = this.db
        .prepare(
          `SELECT * FROM feed_items WHERE workspace_id = ? AND published_at >= ?
           ORDER BY published_at DESC LIMIT ?`
        )
        .all(ws, since, limit) as FeedRow[];
    } else {
      rows = this.db
        .prepare(
          `SELECT * FROM feed_items WHERE workspace_id = ? ORDER BY published_at DESC LIMIT ?`
        )
        .all(ws, limit) as FeedRow[];
    }
    return rows.map(rowToFeed);
  }

  getFeedItemBySlug(slug: string, workspaceId?: string): FeedItem | undefined {
    const ws = this.ws(workspaceId);
    const row = this.db
      .prepare(`SELECT * FROM feed_items WHERE workspace_id = ? AND slug = ?`)
      .get(ws, slug) as FeedRow | undefined;
    return row ? rowToFeed(row) : undefined;
  }

  upsertFeedItem(
    input: FeedItemInput,
    workspaceId?: string
  ): { ok: true; item: FeedItem } | { ok: false; code: 'invalid' } {
    const ws = this.ws(workspaceId);
    const slug = (input.slug || '').trim();
    const title = (input.title || '').trim();
    const bodyMd = (input.bodyMd || '').trim();
    if (!slug || !title || !bodyMd) return { ok: false, code: 'invalid' };
    if (!/^[a-z0-9][a-z0-9\-_]{1,120}$/i.test(slug)) return { ok: false, code: 'invalid' };

    const now = new Date().toISOString();
    const publishedAt = input.publishedAt || now;
    const tags = JSON.stringify(input.tags || []);
    const source = input.source || 'nexus';
    const sourceUrl = input.sourceUrl ?? null;
    const externalId = input.externalId ?? null;
    const summary = (input.summary || title).slice(0, 500);

    if (externalId) {
      const byExt = this.db
        .prepare(`SELECT id FROM feed_items WHERE workspace_id = ? AND external_id = ?`)
        .get(ws, externalId) as { id: string } | undefined;
      if (byExt) {
        this.db
          .prepare(
            `UPDATE feed_items SET slug = ?, title = ?, summary = ?, body_md = ?, tags_json = ?,
             source = ?, source_url = ?, updated_at = ?
             WHERE id = ?`
          )
          .run(slug, title, summary, bodyMd, tags, source, sourceUrl, now, byExt.id);
        return { ok: true, item: this.getFeedItemBySlug(slug, ws)! };
      }
    }

    const existing = this.db
      .prepare(`SELECT id FROM feed_items WHERE workspace_id = ? AND slug = ?`)
      .get(ws, slug) as { id: string } | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE feed_items SET title = ?, summary = ?, body_md = ?, tags_json = ?,
           source = ?, source_url = ?, external_id = COALESCE(?, external_id), updated_at = ?
           WHERE id = ?`
        )
        .run(title, summary, bodyMd, tags, source, sourceUrl, externalId, now, existing.id);
    } else {
      const id = `feed_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      this.db
        .prepare(
          `INSERT INTO feed_items (
             id, workspace_id, slug, title, summary, body_md, tags_json,
             source, source_url, external_id, published_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          ws,
          slug,
          title,
          summary,
          bodyMd,
          tags,
          source,
          sourceUrl,
          externalId,
          publishedAt,
          now
        );
      this.logEvent('FEED_PUBLISHED', source, `Published feed item: ${slug}`, ws);
    }

    return { ok: true, item: this.getFeedItemBySlug(slug, ws)! };
  }

  deleteFeedItem(slug: string, workspaceId?: string): boolean {
    const ws = this.ws(workspaceId);
    const result = this.db
      .prepare(`DELETE FROM feed_items WHERE workspace_id = ? AND slug = ?`)
      .run(ws, slug);
    if (result.changes === 0) return false;
    this.logEvent('FEED_DELETED', 'operator', `Deleted feed item: ${slug}`, ws);
    return true;
  }

  recordFeedCrawl(
    slug: string,
    crawlerId: string,
    workspaceId?: string
  ): FeedItem | undefined {
    const ws = this.ws(workspaceId);
    const row = this.db
      .prepare(`SELECT * FROM feed_items WHERE workspace_id = ? AND slug = ?`)
      .get(ws, slug) as FeedRow | undefined;
    if (!row) return undefined;

    let crawlers: string[] = [];
    try {
      crawlers = JSON.parse(row.crawlers_json || '[]');
    } catch {
      crawlers = [];
    }
    const firstSeen = !crawlers.includes(crawlerId);
    if (firstSeen) crawlers.push(crawlerId);
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE feed_items
         SET crawl_hits = crawl_hits + 1,
             last_crawled_at = ?,
             crawlers_json = ?
         WHERE workspace_id = ? AND slug = ?`
      )
      .run(now, JSON.stringify(crawlers), ws, slug);

    if (firstSeen) {
      this.logEvent(
        'FEED_CRAWLED',
        crawlerId,
        `Crawler first observed on feed/${slug}`,
        ws
      );
    }
    return this.getFeedItemBySlug(slug, ws);
  }

  listSitesDueForPull(staleMs = 20 * 60 * 60 * 1000, limit = 8): Site[] {
    const cutoff = new Date(Date.now() - Math.max(staleMs, 0)).toISOString();
    const rows = this.db
      .prepare(
        `SELECT * FROM sites
         WHERE sitemap_url IS NOT NULL AND TRIM(sitemap_url) != ''
           AND (last_pulled_at IS NULL OR last_pulled_at < ?)
         ORDER BY COALESCE(last_pulled_at, created_at) ASC
         LIMIT ?`
      )
      .all(cutoff, Math.min(Math.max(limit, 1), 50)) as SiteRow[];
    return rows.map(rowToSite);
  }

  listSitesWithSitemap(limit = 50): Site[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM sites
         WHERE sitemap_url IS NOT NULL AND TRIM(sitemap_url) != ''
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(Math.min(Math.max(limit, 1), 100)) as SiteRow[];
    return rows.map(rowToSite);
  }

  listSites(workspaceId?: string): Site[] {
    if (!workspaceId) {
      const rows = this.db
        .prepare(`SELECT * FROM sites ORDER BY updated_at DESC LIMIT 200`)
        .all() as SiteRow[];
      return rows.map(rowToSite);
    }
    const rows = this.db
      .prepare(`SELECT * FROM sites WHERE workspace_id = ? ORDER BY updated_at DESC`)
      .all(this.ws(workspaceId)) as SiteRow[];
    return rows.map(rowToSite);
  }

  getSiteBySlug(slug: string, workspaceId?: string): Site | undefined {
    if (workspaceId) {
      const row = this.db
        .prepare(`SELECT * FROM sites WHERE workspace_id = ? AND slug = ?`)
        .get(this.ws(workspaceId), slug) as SiteRow | undefined;
      return row ? rowToSite(row) : undefined;
    }
    const row = this.db.prepare(`SELECT * FROM sites WHERE slug = ?`).get(slug) as
      | SiteRow
      | undefined;
    return row ? rowToSite(row) : undefined;
  }

  upsertSite(
    input: SiteInput,
    workspaceId?: string
  ): { ok: true; site: Site } | { ok: false; code: 'invalid' | 'slug_taken' } {
    const ws = this.ws(workspaceId);
    const slug = (input.slug || '').trim();
    const name = (input.name || '').trim();
    if (!slug || !name) return { ok: false, code: 'invalid' };
    if (!/^[a-z0-9][a-z0-9\-_]{1,80}$/i.test(slug)) return { ok: false, code: 'invalid' };

    const now = new Date().toISOString();
    const domain = input.domain?.trim() || null;
    const description = (input.description || '').trim().slice(0, 2000);
    const sitemapUrl = input.sitemapUrl?.trim() || null;
    const existing = this.getSiteBySlug(slug, ws);
    const taken = this.db.prepare(`SELECT id, workspace_id FROM sites WHERE slug = ?`).get(slug) as
      | { id: string; workspace_id: string }
      | undefined;
    if (taken && taken.workspace_id !== ws) return { ok: false, code: 'slug_taken' };

    if (existing) {
      this.db
        .prepare(
          `UPDATE sites SET name = ?, domain = ?, description = ?, sitemap_url = COALESCE(?, sitemap_url), updated_at = ? WHERE id = ?`
        )
        .run(name, domain, description, sitemapUrl, now, existing.id);
    } else {
      const id = `site_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      this.db
        .prepare(
          `INSERT INTO sites (id, workspace_id, slug, name, domain, description, sitemap_url, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, ws, slug, name, domain, description, sitemapUrl, now, now);
      this.logEvent('SITE_CREATED', 'operator', `Created site: ${slug}`, ws);
    }

    return { ok: true, site: this.getSiteBySlug(slug, ws)! };
  }

  recordSitePull(slug: string, note: string, workspaceId?: string): Site | undefined {
    const site = this.getSiteBySlug(slug, workspaceId);
    if (!site) return undefined;
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE sites SET last_pulled_at = ?, last_pull_note = ?, updated_at = ? WHERE id = ?`)
      .run(now, note.slice(0, 500), now, site.id);
    return this.getSiteBySlug(slug, site.workspaceId);
  }

  deleteSite(slug: string, workspaceId?: string): boolean {
    const ws = this.ws(workspaceId);
    const site = this.getSiteBySlug(slug, ws);
    if (!site) return false;
    this.db.prepare(`DELETE FROM site_content WHERE site_id = ?`).run(site.id);
    const result = this.db.prepare(`DELETE FROM sites WHERE id = ?`).run(site.id);
    if (result.changes === 0) return false;
    this.logEvent('SITE_DELETED', 'operator', `Deleted site: ${slug}`, ws);
    return true;
  }

  listSiteContent(
    siteSlug: string,
    options?: { limit?: number; workspaceId?: string }
  ): SiteContent[] {
    const site = this.getSiteBySlug(siteSlug, options?.workspaceId);
    if (!site) return [];
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
    const rows = this.db
      .prepare(
        `SELECT * FROM site_content WHERE site_id = ? ORDER BY published_at DESC LIMIT ?`
      )
      .all(site.id, limit) as SiteContentRow[];
    return rows.map(rowToSiteContent);
  }

  getSiteContent(
    siteSlug: string,
    contentSlug: string,
    workspaceId?: string
  ): SiteContent | undefined {
    const site = this.getSiteBySlug(siteSlug, workspaceId);
    if (!site) return undefined;
    const row = this.db
      .prepare(`SELECT * FROM site_content WHERE site_id = ? AND slug = ?`)
      .get(site.id, contentSlug) as SiteContentRow | undefined;
    return row ? rowToSiteContent(row) : undefined;
  }

  upsertSiteContent(
    siteSlug: string,
    input: SiteContentInput,
    workspaceId?: string
  ): { ok: true; item: SiteContent } | { ok: false; code: 'invalid' | 'site_not_found' } {
    const site = this.getSiteBySlug(siteSlug, workspaceId);
    if (!site) return { ok: false, code: 'site_not_found' };
    const ws = site.workspaceId;

    const slug = (input.slug || '').trim();
    const title = (input.title || '').trim();
    const bodyMd = (input.bodyMd || '').trim();
    if (!slug || !title || !bodyMd) return { ok: false, code: 'invalid' };
    if (!/^[a-z0-9][a-z0-9\-_]{1,120}$/i.test(slug)) return { ok: false, code: 'invalid' };

    const now = new Date().toISOString();
    const publishedAt = input.publishedAt || now;
    const tags = JSON.stringify(input.tags || []);
    const summary = (input.summary || title).slice(0, 500);
    const canonicalUrl = input.canonicalUrl ?? null;

    const existing = this.db
      .prepare(`SELECT id FROM site_content WHERE site_id = ? AND slug = ?`)
      .get(site.id, slug) as { id: string } | undefined;

    if (existing) {
      this.db
        .prepare(
          `UPDATE site_content SET title = ?, summary = ?, body_md = ?, canonical_url = ?,
           tags_json = ?, updated_at = ? WHERE id = ?`
        )
        .run(title, summary, bodyMd, canonicalUrl, tags, now, existing.id);
    } else {
      const id = `sc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      this.db
        .prepare(
          `INSERT INTO site_content (
             id, site_id, workspace_id, slug, title, summary, body_md, canonical_url,
             tags_json, published_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          site.id,
          ws,
          slug,
          title,
          summary,
          bodyMd,
          canonicalUrl,
          tags,
          publishedAt,
          now
        );
      this.logEvent('SITE_CONTENT_UPSERTED', site.slug, `Synced content: ${slug}`, ws);
    }

    this.db.prepare(`UPDATE sites SET updated_at = ? WHERE id = ?`).run(now, site.id);
    return { ok: true, item: this.getSiteContent(siteSlug, slug, ws)! };
  }

  deleteSiteContent(siteSlug: string, contentSlug: string, workspaceId?: string): boolean {
    const site = this.getSiteBySlug(siteSlug, workspaceId);
    if (!site) return false;
    const ws = site.workspaceId;
    const result = this.db
      .prepare(`DELETE FROM site_content WHERE site_id = ? AND slug = ?`)
      .run(site.id, contentSlug);
    if (result.changes === 0) return false;
    this.logEvent('SITE_CONTENT_DELETED', site.slug, `Deleted content: ${contentSlug}`, ws);
    return true;
  }

  recordSiteContentCrawl(
    siteSlug: string,
    contentSlug: string,
    crawlerId: string,
    workspaceId?: string
  ): SiteContent | undefined {
    const site = this.getSiteBySlug(siteSlug, workspaceId);
    if (!site) return undefined;
    const ws = site.workspaceId;
    const row = this.db
      .prepare(`SELECT * FROM site_content WHERE site_id = ? AND slug = ?`)
      .get(site.id, contentSlug) as SiteContentRow | undefined;
    if (!row) return undefined;

    let crawlers: string[] = [];
    try {
      crawlers = JSON.parse(row.crawlers_json || '[]');
    } catch {
      crawlers = [];
    }
    const firstSeen = !crawlers.includes(crawlerId);
    if (firstSeen) crawlers.push(crawlerId);
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE site_content
         SET crawl_hits = crawl_hits + 1,
             last_crawled_at = ?,
             crawlers_json = ?
         WHERE id = ?`
      )
      .run(now, JSON.stringify(crawlers), row.id);

    if (firstSeen) {
      this.logEvent(
        'SITE_CONTENT_CRAWLED',
        crawlerId,
        `Crawler first observed on sites/${siteSlug}/${contentSlug}`,
        ws
      );
    }
    return this.getSiteContent(siteSlug, contentSlug, ws);
  }

  siteGeoStatus(siteSlug: string, appUrl: string, workspaceId?: string): SiteGeoStatus | undefined {
    const site = this.getSiteBySlug(siteSlug, workspaceId);
    if (!site) return undefined;
    const items = this.listSiteContent(siteSlug, { limit: 200, workspaceId: site.workspaceId });
    const crawledCount = items.filter((i) => i.indexing.status === 'crawled').length;
    const base = appUrl.replace(/\/$/, '');
    return {
      site,
      contentCount: items.length,
      crawledCount,
      unseenCount: items.length - crawledCount,
      lastPulledAt: site.lastPulledAt,
      lastPullNote: site.lastPullNote,
      honesty:
        'This report is crawl observation plus pages you synced or pulled. It does not prove search or LLM inclusion.',
      surfaces: {
        llmsTxt: `${base}/sites/${encodeURIComponent(site.slug)}/llms.txt`,
        feedJson: `${base}/sites/${encodeURIComponent(site.slug)}/feed.json`,
        contentMd: `${base}/sites/${encodeURIComponent(site.slug)}/content/{slug}.md`,
        contentJson: `${base}/sites/${encodeURIComponent(site.slug)}/content/{slug}.json`,
        api: `${base}/api/sites/${encodeURIComponent(site.slug)}`,
      },
      indexingNote: INDEXING_NOTE,
    };
  }

  listOpenTasksAll(limit = 20): Task[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM tasks WHERE status = 'open' ORDER BY created_at ASC LIMIT ?`
      )
      .all(Math.min(Math.max(limit, 1), 50)) as TaskRow[];
    return rows.map(rowToTask);
  }

  listOpenTasksByTypes(types: string[], limit = 20): Task[] {
    const wanted = types.filter(Boolean);
    if (!wanted.length) return [];
    const placeholders = wanted.map(() => '?').join(', ');
    const rows = this.db
      .prepare(
        `SELECT * FROM tasks WHERE status = 'open' AND type IN (${placeholders})
         ORDER BY created_at ASC LIMIT ?`
      )
      .all(...wanted, Math.min(Math.max(limit, 1), 50)) as TaskRow[];
    return rows.map(rowToTask);
  }

  listActiveTasks(limit = 200): Task[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM tasks WHERE status IN ('open', 'processing')
         ORDER BY created_at ASC LIMIT ?`
      )
      .all(Math.min(Math.max(limit, 1), 500)) as TaskRow[];
    return rows.map(rowToTask);
  }

  private rowToAccount(row: {
    id: string;
    email: string;
    role: string;
    plan_id: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    email_verified_at?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  }): Account {
    return {
      id: row.id,
      email: row.email,
      role: row.role === 'admin' ? 'admin' : 'user',
      planId: (row.plan_id in { free: 1, starter: 1, pro: 1, business: 1, unlimited: 1 }
        ? row.plan_id
        : 'free') as PlanId,
      workspaceId: row.workspace_id,
      emailVerified: Boolean(row.email_verified_at),
      stripeCustomerId: row.stripe_customer_id || null,
      stripeSubscriptionId: row.stripe_subscription_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toAccountPublic(account: Account): AccountPublic {
    return {
      id: account.id,
      email: account.email,
      role: account.role,
      planId: account.planId,
      workspaceId: account.workspaceId,
      emailVerified: account.emailVerified,
      createdAt: account.createdAt,
    };
  }

  findAccountByTokenHash(tokenHash: string): Account | undefined {
    const row = this.db
      .prepare(`SELECT * FROM accounts WHERE token_hash = ?`)
      .get(tokenHash) as
      | {
          id: string;
          email: string;
          role: string;
          plan_id: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;
    return row ? this.rowToAccount(row) : undefined;
  }

  getAccountById(id: string): Account | undefined {
    const row = this.db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(id) as
      | {
          id: string;
          email: string;
          role: string;
          plan_id: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;
    return row ? this.rowToAccount(row) : undefined;
  }

  listAccounts(): AccountPublic[] {
    const rows = this.db
      .prepare(`SELECT * FROM accounts ORDER BY created_at DESC`)
      .all() as Array<{
      id: string;
      email: string;
      role: string;
      plan_id: string;
      workspace_id: string;
      created_at: string;
      updated_at: string;
    }>;
    return rows.map((r) => this.toAccountPublic(this.rowToAccount(r)));
  }

  registerAccount(input: {
    email: string;
    password: string;
  }):
    | { ok: true; account: AccountPublic; token: string }
    | { ok: false; code: 'invalid' | 'exists' } {
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    if (!email || !email.includes('@') || password.length < 8) {
      return { ok: false, code: 'invalid' };
    }
    const existing = this.db.prepare(`SELECT id FROM accounts WHERE email = ?`).get(email);
    if (existing) return { ok: false, code: 'exists' };

    const now = new Date().toISOString();
    const id = `acc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const { hash, salt } = hashPassword(password);
    const token = generateSecret('nxu');
    const tokenHash = hashToken(token);
    const isFirst = (
      this.db.prepare(`SELECT COUNT(*) AS c FROM accounts`).get() as { c: number }
    ).c === 0;
    const role: AccountRole = isFirst ? 'admin' : 'user';
    const planId: PlanId = isFirst ? 'unlimited' : 'free';
    const workspaceId = isFirst ? DEFAULT_WORKSPACE_ID : `ws_${id}`;
    if (!isFirst) {
      this.createWorkspace(workspaceId, email, planId);
    }

    this.db
      .prepare(
        `INSERT INTO accounts (
           id, email, password_hash, password_salt, role, plan_id, workspace_id,
           token_hash, created_at, updated_at, email_verified_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        email,
        hash,
        salt,
        role,
        planId,
        workspaceId,
        tokenHash,
        now,
        now,
        isFirst ? now : null
      );

    if (isFirst) {
      this.db
        .prepare(`UPDATE workspaces SET plan_id = ? WHERE id = ?`)
        .run('unlimited', DEFAULT_WORKSPACE_ID);
    }

    this.logEvent(
      'ACCOUNT_REGISTERED',
      email,
      `Registered ${role} account on plan ${planId}`,
      workspaceId
    );

    const account = this.getAccountById(id)!;
    return { ok: true, account: this.toAccountPublic(account), token };
  }

  loginAccount(input: {
    email: string;
    password: string;
  }):
    | { ok: true; account: AccountPublic; token: string }
    | { ok: false; code: 'invalid' } {
    const email = input.email.trim().toLowerCase();
    const row = this.db.prepare(`SELECT * FROM accounts WHERE email = ?`).get(email) as
      | {
          id: string;
          email: string;
          password_hash: string;
          password_salt: string;
          role: string;
          plan_id: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;
    if (!row) return { ok: false, code: 'invalid' };
    if (!verifyPassword(input.password, row.password_salt, row.password_hash)) {
      return { ok: false, code: 'invalid' };
    }

    const token = generateSecret('nxu');
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE accounts SET token_hash = ?, updated_at = ? WHERE id = ?`)
      .run(hashToken(token), now, row.id);

    const account = this.rowToAccount(row);
    return { ok: true, account: this.toAccountPublic(account), token };
  }

  setAccountPlan(
    accountId: string,
    planId: PlanId
  ): AccountPublic | undefined {
    if (!(planId in { free: 1, starter: 1, pro: 1, business: 1, unlimited: 1 })) {
      return undefined;
    }
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`UPDATE accounts SET plan_id = ?, updated_at = ? WHERE id = ?`)
      .run(planId, now, accountId);
    if (result.changes === 0) return undefined;
    const account = this.getAccountById(accountId);
    if (!account) return undefined;
    this.db
      .prepare(`UPDATE workspaces SET plan_id = ? WHERE id = ?`)
      .run(planId, account.workspaceId);
    this.logEvent(
      'ACCOUNT_PLAN_CHANGED',
      'admin',
      `Set ${account.email} → ${planId}`,
      account.workspaceId
    );
    return this.toAccountPublic(account);
  }

  findAccountByEmail(email: string): Account | undefined {
    const row = this.db
      .prepare(`SELECT * FROM accounts WHERE email = ?`)
      .get(email.trim().toLowerCase()) as Parameters<SqliteStore['rowToAccount']>[0] | undefined;
    return row ? this.rowToAccount(row) : undefined;
  }

  getAccountByStripeCustomerId(customerId: string): Account | undefined {
    if (!customerId) return undefined;
    const row = this.db
      .prepare(`SELECT * FROM accounts WHERE stripe_customer_id = ?`)
      .get(customerId) as Parameters<SqliteStore['rowToAccount']>[0] | undefined;
    return row ? this.rowToAccount(row) : undefined;
  }

  setAccountStripeIds(
    accountId: string,
    customerId: string | null,
    subscriptionId: string | null
  ): Account | undefined {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE accounts SET stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(customerId, subscriptionId, now, accountId);
    return this.getAccountById(accountId);
  }

  checkAccountPassword(accountId: string, password: string): boolean {
    const row = this.db
      .prepare(`SELECT password_hash, password_salt FROM accounts WHERE id = ?`)
      .get(accountId) as { password_hash: string; password_salt: string } | undefined;
    if (!row) return false;
    return verifyPassword(password, row.password_salt, row.password_hash);
  }

  setAccountPassword(accountId: string, password: string): boolean {
    if (password.length < 8) return false;
    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    const result = this.db
      .prepare(
        `UPDATE accounts SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?`
      )
      .run(hash, salt, now, accountId);
    if (result.changes === 0) return false;
    this.logEvent('PASSWORD_CHANGED', accountId, 'Account password updated', undefined);
    return true;
  }

  markEmailVerified(accountId: string): AccountPublic | undefined {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE accounts SET email_verified_at = ?, updated_at = ? WHERE id = ?`)
      .run(now, now, accountId);
    const account = this.getAccountById(accountId);
    if (!account) return undefined;
    this.logEvent('EMAIL_VERIFIED', account.email, 'Email verified', account.workspaceId);
    return this.toAccountPublic(account);
  }

  issueAuthToken(
    accountId: string,
    purpose: 'verify' | 'reset',
    ttlMs: number
  ): { token: string; expiresAt: string } | undefined {
    const account = this.getAccountById(accountId);
    if (!account) return undefined;
    this.db.prepare(`DELETE FROM auth_tokens WHERE account_id = ? AND purpose = ?`).run(accountId, purpose);
    const token = generateSecret(purpose === 'verify' ? 'nxv' : 'nxr');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    this.db
      .prepare(
        `INSERT INTO auth_tokens (id, account_id, purpose, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(`tok_${crypto.randomBytes(6).toString('hex')}`, accountId, purpose, hashToken(token), expiresAt, now);
    return { token, expiresAt };
  }

  consumeAuthToken(token: string, purpose: 'verify' | 'reset'): Account | undefined {
    const row = this.db
      .prepare(`SELECT * FROM auth_tokens WHERE token_hash = ? AND purpose = ?`)
      .get(hashToken(token), purpose) as
      | { account_id: string; expires_at: string; id: string }
      | undefined;
    if (!row) return undefined;
    this.db.prepare(`DELETE FROM auth_tokens WHERE id = ?`).run(row.id);
    if (new Date(row.expires_at).getTime() < Date.now()) return undefined;
    return this.getAccountById(row.account_id);
  }

  countSites(workspaceId?: string): number {
    const ws = this.ws(workspaceId);
    return (
      this.db.prepare(`SELECT COUNT(*) AS c FROM sites WHERE workspace_id = ?`).get(ws) as {
        c: number;
      }
    ).c;
  }

  resolvePlanForIdentity(planId?: string | null): ReturnType<typeof resolvePlan> {
    if (planId) return resolvePlan(planId);
    const row = this.db
      .prepare(`SELECT plan_id FROM workspaces WHERE id = ?`)
      .get(DEFAULT_WORKSPACE_ID) as { plan_id?: string } | undefined;
    return resolvePlan(row?.plan_id || null);
  }
}
