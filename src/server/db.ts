import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { DEFAULT_WORKSPACE_ID } from './types.ts';

function resolveDataDir(): string {
  const fromEnv = (process.env.NEXUS_DATA_DIR || '').trim();
  return fromEnv ? path.resolve(fromEnv) : path.join(process.cwd(), 'data');
}

let db: Database.Database | null = null;

export function getDataDir(): string {
  return resolveDataDir();
}

export function ensureDataDir() {
  const dir = resolveDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDbPath(): string {
  return path.join(resolveDataDir(), 'nexus.sqlite');
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): Database.Database {
  ensureDataDir();
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrateSchema(db);
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/** Lightweight readiness probe — returns false if DB cannot read/write. */
export function probeDatabase(): boolean {
  try {
    const database = getDb();
    database.prepare('SELECT 1 AS ok').get();
    database.prepare('INSERT INTO _health_probe (id, checked_at) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET checked_at = excluded.checked_at').run(
      new Date().toISOString()
    );
    return true;
  } catch {
    return false;
  }
}

function migrateSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agents (
      agent_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      rotated_at TEXT,
      label TEXT,
      PRIMARY KEY (workspace_id, agent_id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_agents_token_hash ON agents(token_hash);

    CREATE TABLE IF NOT EXISTS memory (
      workspace_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      data_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (workspace_id, agent_id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT,
      result_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      claim_version INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status ON tasks(workspace_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_open ON tasks(workspace_id, status, type) WHERE status = 'open';

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      details TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_workspace_time ON audit_events(workspace_id, timestamp DESC);

    CREATE TABLE IF NOT EXISTS _health_probe (
      id INTEGER PRIMARY KEY,
      checked_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_counters (
      workspace_id TEXT NOT NULL,
      day TEXT NOT NULL,
      metric TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (workspace_id, day, metric),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_counters_day
      ON usage_counters(workspace_id, day);

    CREATE TABLE IF NOT EXISTS feed_items (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      body_md TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'nexus',
      source_url TEXT,
      external_id TEXT,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (workspace_id, slug),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_feed_published
      ON feed_items(workspace_id, published_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_external
      ON feed_items(workspace_id, external_id)
      WHERE external_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (workspace_id, slug),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sites_workspace
      ON sites(workspace_id, updated_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_slug_global
      ON sites(slug);

    CREATE TABLE IF NOT EXISTS site_content (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      body_md TEXT NOT NULL,
      canonical_url TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      crawl_hits INTEGER NOT NULL DEFAULT 0,
      last_crawled_at TEXT,
      crawlers_json TEXT NOT NULL DEFAULT '[]',
      UNIQUE (site_id, slug),
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_site_content_published
      ON site_content(site_id, published_at DESC);

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      plan_id TEXT NOT NULL DEFAULT 'free',
      workspace_id TEXT NOT NULL,
      token_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_token
      ON accounts(token_hash)
      WHERE token_hash IS NOT NULL;
  `);

  ensureColumn(database, 'agents', 'listed', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(database, 'agents', 'blurb', 'TEXT');
  ensureColumn(database, 'feed_items', 'crawl_hits', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(database, 'feed_items', 'last_crawled_at', 'TEXT');
  ensureColumn(database, 'feed_items', 'crawlers_json', "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(database, 'workspaces', 'plan_id', "TEXT NOT NULL DEFAULT 'free'");
  ensureColumn(database, 'sites', 'sitemap_url', 'TEXT');
  ensureColumn(database, 'sites', 'last_pulled_at', 'TEXT');
  ensureColumn(database, 'sites', 'last_pull_note', 'TEXT');
  ensureColumn(database, 'accounts', 'email_verified_at', 'TEXT');
  ensureColumn(database, 'accounts', 'stripe_customer_id', 'TEXT');
  ensureColumn(database, 'accounts', 'stripe_subscription_id', 'TEXT');

  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_account
      ON auth_tokens(account_id, purpose);
  `);

  migrateMemorySearchSchema(database);

  const existing = database
    .prepare('SELECT id FROM workspaces WHERE id = ?')
    .get(DEFAULT_WORKSPACE_ID) as { id: string } | undefined;

  if (!existing) {
    database
      .prepare('INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)')
      .run(DEFAULT_WORKSPACE_ID, 'Default Workspace', new Date().toISOString());
  }
}

function migrateMemorySearchSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS memory_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      mem_key TEXT NOT NULL,
      body TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (workspace_id, agent_id, mem_key)
    );
    CREATE INDEX IF NOT EXISTS idx_memory_index_ws_agent
      ON memory_index(workspace_id, agent_id);
  `);

  try {
    database.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
        body,
        content='memory_index',
        content_rowid='id',
        tokenize='unicode61 remove_diacritics 2'
      );
      CREATE TRIGGER IF NOT EXISTS memory_index_ai AFTER INSERT ON memory_index BEGIN
        INSERT INTO memory_fts(rowid, body) VALUES (new.id, new.body);
      END;
      CREATE TRIGGER IF NOT EXISTS memory_index_ad AFTER DELETE ON memory_index BEGIN
        INSERT INTO memory_fts(memory_fts, rowid, body) VALUES('delete', old.id, old.body);
      END;
      CREATE TRIGGER IF NOT EXISTS memory_index_au AFTER UPDATE ON memory_index BEGIN
        INSERT INTO memory_fts(memory_fts, rowid, body) VALUES('delete', old.id, old.body);
        INSERT INTO memory_fts(rowid, body) VALUES (new.id, new.body);
      END;
    `);
  } catch {
    // FTS5 unavailable — substring search still works off memory_index.
  }
}

function ensureColumn(
  database: Database.Database,
  table: string,
  column: string,
  ddl: string
) {
  const cols = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}
