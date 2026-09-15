/**
 * Fail leftover demo / unhandled swarm tasks (COMPUTE, DATA_EXTRACTION, TEST, or stale).
 *
 *   npm run tasks:fail-abandoned
 */
import 'dotenv/config';
import { closeStore, loadPreservedState } from '../src/server/store.ts';
import { failAbandonedHubTasks } from '../src/server/hubWorker.ts';
import { logJson } from '../src/server/log.ts';

loadPreservedState();
const abandoned = failAbandonedHubTasks();
logJson('info', 'Abandoned leftover tasks failed', { abandoned });
closeStore();
