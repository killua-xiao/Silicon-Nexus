import { pullSiteFromSitemap } from './geoPull.ts';
import {
  claimOpenTask,
  completeTask,
  failTask,
  listActiveTasks,
  listOpenTasksByTypes,
  listSitesDueForPull,
} from './store.ts';
import { logJson } from './log.ts';
import { writeWorkerHeartbeat } from './workerHeartbeat.ts';

export const HUB_WORKER_ID = 'hub-worker';

const HANDLED_TYPES = new Set(['PING', 'ECHO', 'GEO_PULL_SITEMAP']);

/** Demo / leftover types the built-in worker will never claim. Fail immediately. */
export const ABANDONED_TASK_TYPES = new Set(['COMPUTE', 'DATA_EXTRACTION', 'TEST']);

const STALE_UNHANDLED_MS = 7 * 24 * 60 * 60 * 1000;

export type WorkerTickResult = {
  claimed: number;
  completed: number;
  failed: number;
  duePulls: number;
  abandoned: number;
};

export async function processOpenTasks(limit = 10): Promise<WorkerTickResult> {
  const open = listOpenTasksByTypes([...HANDLED_TYPES], limit);
  const result: WorkerTickResult = { claimed: 0, completed: 0, failed: 0, duePulls: 0, abandoned: 0 };

  for (const task of open) {
    const claimed = claimOpenTask(task.id, HUB_WORKER_ID, task.workspaceId);
    if (claimed.ok === false) continue;
    result.claimed += 1;
    try {
      const payload = (task.payload || {}) as Record<string, unknown>;
      const output = await runTask(task.type, payload, task.workspaceId);
      const done = completeTask(task.id, HUB_WORKER_ID, 'completed', output, task.workspaceId);
      if (done.ok) result.completed += 1;
      else result.failed += 1;
    } catch (error: any) {
      completeTask(
        task.id,
        HUB_WORKER_ID,
        'failed',
        { error: error?.message || String(error) },
        task.workspaceId
      );
      result.failed += 1;
    }
  }

  return result;
}

async function runTask(
  type: string,
  payload: Record<string, unknown>,
  workspaceId: string
): Promise<unknown> {
  if (type === 'PING') {
    return { pong: true, at: new Date().toISOString(), worker: HUB_WORKER_ID };
  }
  if (type === 'ECHO') {
    return { echo: payload, at: new Date().toISOString() };
  }
  if (type === 'GEO_PULL_SITEMAP') {
    const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
    if (!slug) throw new Error('GEO_PULL_SITEMAP requires payload.slug');
    const sitemapUrl = typeof payload.sitemapUrl === 'string' ? payload.sitemapUrl : undefined;
    return pullSiteFromSitemap({ slug, workspaceId, sitemapUrl });
  }
  throw new Error(`Unsupported task type: ${type}`);
}

export function failAbandonedHubTasks(options?: {
  staleMs?: number;
  limit?: number;
}): number {
  const staleMs = options?.staleMs ?? STALE_UNHANDLED_MS;
  const cutoff = Date.now() - Math.max(staleMs, 0);
  const active = listActiveTasks(options?.limit ?? 200);
  let failed = 0;
  for (const task of active) {
    if (HANDLED_TYPES.has(task.type)) continue;
    const abandoned = ABANDONED_TASK_TYPES.has(task.type);
    const updated = Date.parse(task.updatedAt || task.createdAt);
    const stale = Number.isFinite(updated) && updated < cutoff;
    if (!abandoned && !stale) continue;
    const lastError = abandoned
      ? `Abandoned leftover type ${task.type}: hub worker only handles PING, ECHO, GEO_PULL_SITEMAP.`
      : `Stale unhandled type ${task.type}: open/processing longer than ${Math.round(staleMs / 86400000)}d.`;
    const done = failTask(task.id, lastError, task.workspaceId);
    if (done.ok) failed += 1;
  }
  return failed;
}

export async function processDueSitePulls(limit = 2): Promise<number> {
  const due = listSitesDueForPull(20 * 60 * 60 * 1000, limit);
  let pulled = 0;
  for (const site of due) {
    try {
      const result = await pullSiteFromSitemap({
        slug: site.slug,
        workspaceId: site.workspaceId,
        sitemapUrl: site.sitemapUrl,
      });
      if (result.ok) pulled += 1;
    } catch (error) {
      logJson('error', 'Scheduled GEO pull failed', {
        slug: site.slug,
        error: String(error),
      });
    }
  }
  return pulled;
}

export async function runHubWorkerLoop(options?: { intervalMs?: number; signal?: AbortSignal }) {
  const intervalMs = options?.intervalMs ?? 2000;
  const dueEveryMs = Number(process.env.NEXUS_GEO_DUE_MS || 15 * 60 * 1000);
  logJson('info', 'Hub worker started', { intervalMs, handles: [...HANDLED_TYPES] });
  let lastDue = 0;
  writeWorkerHeartbeat({
    claimed: 0,
    completed: 0,
    failed: 0,
    duePulls: 0,
    handles: [...HANDLED_TYPES],
  });
  const firstSweep = failAbandonedHubTasks();
  if (firstSweep > 0) {
    logJson('info', 'Failed abandoned leftover tasks', { abandoned: firstSweep });
  }
  while (!options?.signal?.aborted) {
    try {
      const tick = await processOpenTasks();
      if (Date.now() - lastDue >= dueEveryMs) {
        tick.duePulls = await processDueSitePulls(2);
        tick.abandoned = failAbandonedHubTasks();
        lastDue = Date.now();
      }
      writeWorkerHeartbeat({
        claimed: tick.claimed,
        completed: tick.completed,
        failed: tick.failed,
        duePulls: tick.duePulls,
        handles: [...HANDLED_TYPES],
      });
      if (tick.claimed > 0 || tick.duePulls > 0 || tick.abandoned > 0) {
        logJson('info', 'Hub worker tick', tick);
      }
    } catch (error) {
      logJson('error', 'Hub worker tick failed', { error: String(error) });
    }
    await sleep(intervalMs, options?.signal);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
