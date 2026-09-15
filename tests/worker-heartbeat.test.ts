import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-hb-'));
process.env.NEXUS_DATA_DIR = dataDir;

const hb = await import('../src/server/workerHeartbeat.ts');

after(() => {
  rmSync(dataDir, { recursive: true, force: true });
});

test('worker heartbeat is offline until written, then online', () => {
  assert.equal(hb.workerStatus().online, false);
  hb.writeWorkerHeartbeat({
    claimed: 1,
    completed: 1,
    failed: 0,
    duePulls: 0,
    handles: ['PING'],
  });
  const status = hb.workerStatus();
  assert.equal(status.online, true);
  assert.equal(status.heartbeat?.claimed, 1);
  assert.equal(status.heartbeat?.handles.includes('PING'), true);
});

test('stale heartbeat is offline', () => {
  hb.writeWorkerHeartbeat({
    at: new Date(Date.now() - 120_000).toISOString(),
    claimed: 0,
    completed: 0,
    failed: 0,
    duePulls: 0,
    handles: [],
  });
  assert.equal(hb.workerStatus().online, false);
});
