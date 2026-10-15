import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { BODY_META_KEY, buildBodyCells, splitMemoryWritePayload } from '../src/server/bodyMeta.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-continuity-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');

before(() => {
  store.loadPreservedState();
});

after(() => {
  store.closeStore();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('body provenance', { concurrency: 1 }, () => {
  test('splitMemoryWritePayload stamps _nexus and strips meta key', () => {
    const { data, options } = splitMemoryWritePayload({
      mission: { goal: 'map' },
      _nexus: { source: 'cursor-session', confidence: 'asserted' },
      [BODY_META_KEY]: { should: 'ignore' },
    });
    assert.equal(options.source, 'cursor-session');
    assert.equal(options.confidence, 'asserted');
    assert.equal(data.mission && typeof data.mission, 'object');
    assert.equal(BODY_META_KEY in data, false);
    assert.equal('_nexus' in data, false);
  });

  test('write stamps meta; search hits include cite and source', () => {
    const created = store.registerAccount({
      email: 'body-meta@example.com',
      password: 'password1',
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const ws = created.account.workspaceId;

    store.writeAgentMemory(
      'body-1',
      { mission: 'map sector B' },
      ws,
      { source: 'cursor-session', confidence: 'asserted' }
    );

    const memory = store.readAgentMemory('body-1', ws);
    const cells = buildBodyCells(memory, new Date().toISOString());
    assert.equal(cells.mission?.source, 'cursor-session');
    assert.equal(cells.mission?.confidence, 'asserted');
    assert.ok(cells.mission?.updatedAt);

    const hits = store.searchAgentMemory('sector', { workspaceId: ws, agentId: 'body-1' });
    assert.ok(hits.hits.length >= 1);
    const hit = hits.hits.find((h) => h.key === 'mission');
    assert.ok(hit);
    assert.equal(hit!.source, 'cursor-session');
    assert.match(hit!.cite, /\/api\/agent\/body-1\/memory\/mission/);
    assert.equal(JSON.stringify(hits.hits).includes(BODY_META_KEY), false);
  });
});

describe('continuity handoff / assume', { concurrency: 1 }, () => {
  test('handoff snapshots body; assume restores drift and rotates token', () => {
    const created = store.registerAccount({
      email: 'continuity@example.com',
      password: 'password1',
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const ws = created.account.workspaceId;

    const enrolled = store.registerAgentToken('cont-1', { label: 'continuity' }, ws);
    assert.equal(enrolled.ok, true);
    if (!enrolled.ok) return;
    const oldToken = enrolled.token;

    store.writeAgentMemory(
      'cont-1',
      { mission: 'stay alive', constraints: ['no secrets in feed'] },
      ws,
      { source: 'claude-desktop', confidence: 'asserted' }
    );

    const handoff = store.createHandoff('cont-1', { note: 'session ending' }, ws);
    assert.equal(handoff.ok, true);
    if (!handoff.ok) return;
    assert.match(handoff.handoff.id, /^hof_/);
    assert.ok(handoff.handoff.digest.length === 64);
    assert.ok(handoff.handoff.keys.includes('mission'));

    // Drift: wipe a key the next session must restore.
    store.writeAgentMemory('cont-1', { mission: 'corrupted' }, ws, {
      source: 'bug',
      confidence: 'unknown',
    });

    const assumed = store.assumeHandoff(
      'cont-1',
      handoff.handoff.id,
      { rotateToken: true, planId: created.account.planId },
      ws
    );
    assert.equal(assumed.ok, true);
    if (!assumed.ok) return;
    assert.equal(assumed.rotated, true);
    assert.ok(assumed.token);
    assert.notEqual(assumed.token, oldToken);
    assert.ok(assumed.diff.missing.includes('mission'));

    const body = store.readAgentMemory('cont-1', ws);
    assert.equal(body.mission, 'stay alive');
    assert.deepEqual(body.constraints, ['no secrets in feed']);

    const again = store.assumeHandoff(
      'cont-1',
      handoff.handoff.id,
      { rotateToken: false },
      ws
    );
    assert.equal(again.ok, false);
    if (!again.ok) assert.equal(again.code, 'already_assumed');
  });
});
