/**
 * Ingest AI / frontier / silicon digests into Silicon News Wire (bilingual).
 *
 * Usage:
 *   npm run wire:ingest
 *   WIRE_INGEST_LIMIT=5 npm run wire:ingest
 */
import 'dotenv/config';
import { loadPreservedState, closeStore } from '../src/server/store.ts';
import { ingestWireFeeds } from '../src/server/wireIngest.ts';
import { logJson } from '../src/server/log.ts';

async function main() {
  loadPreservedState();
  const perSource = Number(process.env.WIRE_INGEST_LIMIT || 4);
  const { results, created, updated, scrubbed } = await ingestWireFeeds({ perSource });
  logJson('info', 'Wire ingest complete', { created, updated, scrubbed, sources: results });
  console.log(`[wire:ingest] created=${created} updated=${updated} scrubbed=${scrubbed}`);
  closeStore();
}

main().catch((err) => {
  console.error(err);
  try {
    closeStore();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
