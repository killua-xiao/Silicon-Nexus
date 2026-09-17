import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import {
  extractSnippet,
  flattenMemoryValue,
  sanitizeFtsQuery,
} from '../src/server/memorySearch.ts';
import { searchMemoryQuerySchema } from '../src/server/schemas.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-memsearch-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');

before(() => {
  store.loadPreservedState();
});

after(() => {
  store.closeStore();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('memory search helpers', { concurrency: 1 }, () => {
  test('flattens nested JSON including keys', () => {
    const body = flattenMemoryValue('decisions', {
      billing: { provider: 'manual', note: 'Stripe paused' },
    });
    assert.match(body, /decisions/);
    assert.match(body, /billing/);
    assert.match(body, /Stripe paused/);
  });

  test('sanitizes FTS operators into quoted tokens', () => {
    const match = sanitizeFtsQuery('pricing AND stripe* OR "drop table"');
    assert.ok(match);
    assert.equal(match.includes('AND AND'), false);
    assert.match(match!, /"pricing"/);
    assert.match(match!, /"stripe"/);
    assert.equal(sanitizeFtsQuery('***'), null);
  });

  test('extracts a window around the first term', () => {
    const snippet = extractSnippet('aaa ' + 'x'.repeat(80) + ' chosen Stripe later ' + 'y'.repeat(80), 'Stripe');
    assert.match(snippet, /Stripe/);
    assert.ok(snippet.length < 280);
  });

  test('search schema rejects empty q', () => {
    assert.throws(() => searchMemoryQuerySchema.parse({ q: '  ' }));
    const parsed = searchMemoryQuerySchema.parse({ q: 'sector', limit: '5', agentId: '' });
    assert.equal(parsed.limit, 5);
    assert.equal(parsed.agentId, undefined);
  });
});

describe('memory search store', { concurrency: 1 }, () => {
  test('finds nested values and key names without returning the full blob', () => {
    const created = store.registerAccount({
      email: 'memory-search@example.com',
      password: 'password1',
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const ws = created.account.workspaceId;

    store.writeAgentMemory(
      'alpha',
      {
        mission: 'map sector B',
        decisions: { billing: 'postpone Stripe', checkout: 'manual for now' },
      },
      ws
    );
    store.writeAgentMemory('alpha', { 备注: '本周决定继续用手动账单' }, ws);

    const byValue = store.searchAgentMemory('sector', { workspaceId: ws, agentId: 'alpha' });
    assert.ok(byValue.hits.some((h) => h.agentId === 'alpha' && h.key === 'mission'));
    const mission = byValue.hits.find((h) => h.key === 'mission');
    assert.ok(mission);
    if (!mission) return;
    assert.match(mission.snippet, /sector/i);
    assert.equal(JSON.stringify(mission).includes('postpone Stripe'), false);

    const byNested = store.searchAgentMemory('manual', { workspaceId: ws });
    assert.ok(byNested.hits.some((h) => h.key === 'decisions'));

    const byChinese = store.searchAgentMemory('手动账单', { workspaceId: ws });
    assert.ok(byChinese.hits.some((h) => h.key === '备注'));
    assert.ok(byChinese.engine === 'fts5' || byChinese.engine === 'substring');
    assert.match(byChinese.note, /Not embeddings/i);
  });

  test('wipe removes keys from the search index', () => {
    const created = store.registerAccount({
      email: 'memory-wipe-search@example.com',
      password: 'password1',
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const ws = created.account.workspaceId;
    store.writeAgentMemory('beta', { secretToken: 'unique-wipe-token-xyz' }, ws);
    assert.ok(store.searchAgentMemory('unique-wipe-token-xyz', { workspaceId: ws }).hits.length >= 1);
    store.wipeAgentMemory('beta', ws);
    assert.equal(store.searchAgentMemory('unique-wipe-token-xyz', { workspaceId: ws }).hits.length, 0);
  });

  test('search does not leak across workspaces', () => {
    const alice = store.registerAccount({ email: 'ms-alice@example.com', password: 'password1' });
    const bob = store.registerAccount({ email: 'ms-bob@example.com', password: 'password1' });
    assert.equal(alice.ok && bob.ok, true);
    if (!alice.ok || !bob.ok) return;

    store.writeAgentMemory('alice-bot', { secret: 'alice-only-needle' }, alice.account.workspaceId);
    store.writeAgentMemory('bob-bot', { secret: 'bob-only-needle' }, bob.account.workspaceId);

    const aliceHits = store.searchAgentMemory('bob-only-needle', {
      workspaceId: alice.account.workspaceId,
    });
    const bobHits = store.searchAgentMemory('alice-only-needle', {
      workspaceId: bob.account.workspaceId,
    });
    assert.equal(aliceHits.hits.length, 0);
    assert.equal(bobHits.hits.length, 0);

    const aliceOwn = store.searchAgentMemory('alice-only-needle', {
      workspaceId: alice.account.workspaceId,
    });
    assert.equal(aliceOwn.hits[0]?.agentId, 'alice-bot');
  });
});
