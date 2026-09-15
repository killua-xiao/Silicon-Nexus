#!/usr/bin/env npx tsx
/**
 * Consistent SQLite snapshot (plus secrets.json) into data/backups/.
 * Keeps the newest 14 runs. Safe to run while the server is up (backup API).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const KEEP = Number(process.env.NEXUS_BACKUP_KEEP || 14);
const dataDir = (process.env.NEXUS_DATA_DIR || '').trim()
  ? path.resolve(process.env.NEXUS_DATA_DIR!)
  : path.join(process.cwd(), 'data');
const srcDb = path.join(dataDir, 'nexus.sqlite');
const backupsRoot = path.join(dataDir, 'backups');

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function rotate(dir: string, keep: number) {
  const names = fs
    .readdirSync(dir)
    .filter((name) => name.startsWith('nexus-') && fs.statSync(path.join(dir, name)).isDirectory())
    .sort();
  const extra = names.slice(0, Math.max(0, names.length - keep));
  for (const name of extra) {
    fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  }
  return { kept: names.length - extra.length, removed: extra.length };
}

async function main() {
  if (!fs.existsSync(srcDb)) {
    console.error(`[backup] missing ${srcDb}`);
    process.exit(1);
  }
  fs.mkdirSync(backupsRoot, { mode: 0o700, recursive: true });
  try {
    fs.chmodSync(backupsRoot, 0o700);
  } catch {
    /* ignore */
  }

  const destDir = path.join(backupsRoot, `nexus-${stamp()}`);
  fs.mkdirSync(destDir, { mode: 0o700 });
  const destDb = path.join(destDir, 'nexus.sqlite');

  const db = new Database(srcDb, { fileMustExist: true, readonly: true });
  try {
    await db.backup(destDb);
  } finally {
    db.close();
  }
  fs.chmodSync(destDb, 0o600);

  const secrets = path.join(dataDir, 'secrets.json');
  if (fs.existsSync(secrets)) {
    const destSecrets = path.join(destDir, 'secrets.json');
    fs.copyFileSync(secrets, destSecrets);
    fs.chmodSync(destSecrets, 0o600);
  }

  const rotation = rotate(backupsRoot, KEEP);
  console.log(
    JSON.stringify({
      ok: true,
      dest: destDir,
      bytes: fs.statSync(destDb).size,
      keep: KEEP,
      ...rotation,
    })
  );
}

main().catch((error) => {
  console.error('[backup] failed', error);
  process.exit(1);
});
