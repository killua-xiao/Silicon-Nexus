import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import { DEFAULT_WORKSPACE_ID } from '../types.ts';
import { getDataDir } from '../db.ts';
import { logJson } from '../log.ts';

type LegacyState = {
  memoryStore?: Record<string, Record<string, unknown>>;
  taskQueue?: Array<{
    id: string;
    creatorId: string;
    type: string;
    payload: unknown;
    status: string;
    assignedTo?: string;
    result?: unknown;
    createdAt: string;
    updatedAt: string;
    claimVersion?: number;
  }>;
  agentCredentials?: Array<{
    agentId: string;
    tokenHash: string;
    createdAt: string;
    label?: string;
  }>;
};

/**
 * One-time migration from legacy flat-file `data/db.json` into SQLite.
 * Marks completion in meta table and renames the JSON file to `.migrated`.
 */
export function migrateFromJsonIfNeeded(db: Database.Database): void {
  const done = db.prepare(`SELECT value FROM meta WHERE key = 'json_migrated'`).get() as
    | { value: string }
    | undefined;
  if (done?.value === '1') return;

  const jsonPath = path.join(getDataDir(), 'db.json');
  if (!fs.existsSync(jsonPath)) {
    db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('json_migrated', '1')`).run();
    return;
  }

  let legacy: LegacyState;
  try {
    legacy = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (error) {
    logJson('error', 'Failed to parse legacy db.json; skipping migration', { error: String(error) });
    db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('json_migrated', '1')`).run();
    return;
  }

  const ws = DEFAULT_WORKSPACE_ID;
  const now = new Date().toISOString();

  const insertAgent = db.prepare(
    `INSERT OR IGNORE INTO agents (agent_id, workspace_id, token_hash, created_at, rotated_at, label)
     VALUES (?, ?, ?, ?, NULL, ?)`
  );
  const insertMemory = db.prepare(
    `INSERT OR REPLACE INTO memory (workspace_id, agent_id, data_json, updated_at)
     VALUES (?, ?, ?, ?)`
  );
  const insertTask = db.prepare(
    `INSERT OR IGNORE INTO tasks (
       id, workspace_id, creator_id, type, payload_json, status, assigned_to, result_json,
       created_at, updated_at, claim_version, attempts, last_error
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)`
  );

  const tx = db.transaction(() => {
    for (const cred of legacy.agentCredentials || []) {
      insertAgent.run(
        cred.agentId,
        ws,
        cred.tokenHash,
        cred.createdAt || now,
        cred.label ?? null
      );
    }

    for (const [agentId, data] of Object.entries(legacy.memoryStore || {})) {
      insertMemory.run(ws, agentId, JSON.stringify(data || {}), now);
    }

    for (const task of legacy.taskQueue || []) {
      insertTask.run(
        task.id,
        ws,
        task.creatorId,
        task.type,
        JSON.stringify(task.payload ?? null),
        task.status,
        task.assignedTo ?? null,
        task.result !== undefined ? JSON.stringify(task.result) : null,
        task.createdAt || now,
        task.updatedAt || now,
        task.claimVersion || 0
      );
    }

    db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('json_migrated', '1')`).run();
  });

  tx();

  try {
    fs.renameSync(jsonPath, `${jsonPath}.migrated`);
  } catch {
    // non-fatal
  }

  logJson('info', 'Migrated legacy db.json into SQLite', {
    agents: (legacy.agentCredentials || []).length,
    memories: Object.keys(legacy.memoryStore || {}).length,
    tasks: (legacy.taskQueue || []).length,
  });
}
