import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-iso-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');
const worker = await import('../src/server/hubWorker.ts');

before(() => {
  store.loadPreservedState();
});

after(() => {
  store.closeStore();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('tenant isolation', { concurrency: 1 }, () => {
test('registered users get isolated workspaces', async () => {
  const alice = store.registerAccount({ email: 'alice@example.com', password: 'password1' });
  const bob = store.registerAccount({ email: 'bob@example.com', password: 'password2' });
  assert.equal(alice.ok, true);
  assert.equal(bob.ok, true);
  if (!alice.ok || !bob.ok) return;

  assert.notEqual(alice.account.workspaceId, bob.account.workspaceId);
  assert.equal(alice.account.role, 'admin');
  assert.equal(bob.account.role, 'user');
  assert.notEqual(bob.account.workspaceId, 'default');

  store.writeAgentMemory('alice-bot', { secret: 'alice' }, alice.account.workspaceId);
  store.writeAgentMemory('bob-bot', { secret: 'bob' }, bob.account.workspaceId);

  const aliceMem = store.getMemoryStore(alice.account.workspaceId);
  const bobMem = store.getMemoryStore(bob.account.workspaceId);
  assert.equal(aliceMem['alice-bot']?.secret, 'alice');
  assert.equal(bobMem['bob-bot']?.secret, 'bob');
  assert.equal(aliceMem['bob-bot'], undefined);
  assert.equal(bobMem['alice-bot'], undefined);

  const aliceSite = store.upsertSite({ slug: 'alice-site', name: 'Alice' }, alice.account.workspaceId);
  const bobSite = store.upsertSite({ slug: 'bob-site', name: 'Bob' }, bob.account.workspaceId);
  assert.equal(aliceSite.ok, true);
  assert.equal(bobSite.ok, true);

  const steal = store.upsertSite({ slug: 'alice-site', name: 'Steal' }, bob.account.workspaceId);
  assert.equal(steal.ok, false);
  if (!steal.ok) assert.equal(steal.code, 'slug_taken');

  const bobSites = store.listSites(bob.account.workspaceId);
  assert.equal(bobSites.some((s) => s.slug === 'alice-site'), false);
  assert.equal(bobSites.some((s) => s.slug === 'bob-site'), true);
  assert.equal(store.getSiteBySlug('alice-site', bob.account.workspaceId), undefined);

  store.createTask({
    creatorId: 'alice',
    type: 'PING',
    payload: { from: 'alice' },
    workspaceId: alice.account.workspaceId,
  });
  store.createTask({
    creatorId: 'bob',
    type: 'PING',
    payload: { from: 'bob' },
    workspaceId: bob.account.workspaceId,
  });
  assert.equal(store.listOpenTasks(undefined, bob.account.workspaceId).length, 1);
  assert.equal(store.listOpenTasks(undefined, alice.account.workspaceId).length >= 1, true);
});

test('hub worker completes PING in the task workspace', async () => {
  const created = store.createTask({
    creatorId: 'tester',
    type: 'PING',
    payload: {},
    workspaceId: 'default',
  });
  assert.equal('id' in created, true);
  if (!('id' in created)) return;

  const tick = await worker.processOpenTasks(20);
  assert.equal(tick.claimed >= 1, true);
  const done = store.findTask(created.id, 'default');
  assert.equal(done?.status, 'completed');
  assert.equal((done?.result as { pong?: boolean } | null)?.pong, true);
});

test('hub worker fails leftover COMPUTE and DATA_EXTRACTION tasks', () => {
  const ws = store.registerAccount({
    email: 'abandoned-tasks@example.com',
    password: 'password1',
  });
  assert.equal(ws.ok, true);
  if (!ws.ok) return;
  const workspaceId = ws.account.workspaceId;
  const compute = store.createTask({
    creatorId: 'tester',
    type: 'COMPUTE',
    payload: { leftover: true },
    workspaceId,
  });
  const extract = store.createTask({
    creatorId: 'tester',
    type: 'DATA_EXTRACTION',
    payload: { target: 'https://site-1.com' },
    workspaceId,
  });
  const ping = store.createTask({
    creatorId: 'tester',
    type: 'PING',
    payload: {},
    workspaceId,
  });
  assert.equal('id' in compute && 'id' in extract && 'id' in ping, true);
  if (!('id' in compute) || !('id' in extract) || !('id' in ping)) return;

  const failed = worker.failAbandonedHubTasks();
  assert.equal(failed >= 2, true);
  assert.equal(store.findTask(compute.id, workspaceId)?.status, 'failed');
  assert.equal(store.findTask(extract.id, workspaceId)?.status, 'failed');
  assert.equal(store.findTask(ping.id, workspaceId)?.status, 'open');
});

test('sites due for pull skip missing sitemaps and fresh pulls', () => {
  const created = store.registerAccount({
    email: 'due-pull@example.com',
    password: 'password1',
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const ws = created.account.workspaceId;
  store.upsertSite(
    { slug: 'due-site', name: 'Due', sitemapUrl: 'https://example.com/sitemap.xml' },
    ws
  );
  store.upsertSite({ slug: 'no-map', name: 'No map' }, ws);

  const due = store.listSitesDueForPull(20 * 60 * 60 * 1000, 50);
  assert.equal(due.some((s) => s.slug === 'due-site'), true);
  assert.equal(due.some((s) => s.slug === 'no-map'), false);

  store.recordSitePull('due-site', 'manual test', ws);
  const after = store.listSitesDueForPull(20 * 60 * 60 * 1000, 50);
  assert.equal(after.some((s) => s.slug === 'due-site'), false);

  const withMap = store.listSitesWithSitemap(50);
  assert.equal(withMap.some((s) => s.slug === 'due-site'), true);
});
});
