/**
 * Enrich existing wire digests into readable paraphrased briefs.
 *
 * Usage:
 *   npm run wire:enrich
 *   WIRE_ENRICH_LIMIT=20 npm run wire:enrich
 */
import 'dotenv/config';
import { loadPreservedState, closeStore } from '../src/server/store.ts';
import { enrichExistingWireBriefs } from '../src/server/wireIngest.ts';
import { logJson } from '../src/server/log.ts';

async function main() {
  loadPreservedState();
  const limit = Number(process.env.WIRE_ENRICH_LIMIT || 40);
  const { enriched, skipped } = await enrichExistingWireBriefs({ limit });
  logJson('info', 'Wire enrich complete', { enriched, skipped, limit });
  console.log(`[wire:enrich] enriched=${enriched} skipped=${skipped}`);
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
