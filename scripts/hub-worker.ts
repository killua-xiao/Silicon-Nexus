import { loadPreservedState, closeStore } from '../src/server/store.ts';
import { runHubWorkerLoop } from '../src/server/hubWorker.ts';
import { logJson } from '../src/server/log.ts';

loadPreservedState();

const controller = new AbortController();
const shutdown = () => {
  if (controller.signal.aborted) return;
  logJson('info', 'Hub worker shutting down');
  controller.abort();
  closeStore();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

runHubWorkerLoop({
  intervalMs: Number(process.env.NEXUS_WORKER_INTERVAL_MS || 2000),
  signal: controller.signal,
}).catch((error) => {
  logJson('error', 'Hub worker crashed', { error: String(error) });
  closeStore();
  process.exit(1);
});
