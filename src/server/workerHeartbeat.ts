import fs from 'fs';
import path from 'path';
import { getDataDir } from './db.ts';

export type WorkerHeartbeat = {
  at: string;
  claimed: number;
  completed: number;
  failed: number;
  duePulls: number;
  handles: string[];
};

export type WorkerStatus = {
  online: boolean;
  staleMs: number;
  heartbeat: WorkerHeartbeat | null;
};

const STALE_MS = 45_000;

export function heartbeatPath(): string {
  return path.join(getDataDir(), 'worker-heartbeat.json');
}

export function writeWorkerHeartbeat(input: Omit<WorkerHeartbeat, 'at'> & { at?: string }): void {
  const payload: WorkerHeartbeat = {
    at: input.at || new Date().toISOString(),
    claimed: input.claimed,
    completed: input.completed,
    failed: input.failed,
    duePulls: input.duePulls,
    handles: input.handles,
  };
  try {
    fs.writeFileSync(heartbeatPath(), JSON.stringify(payload), 'utf-8');
  } catch {
    // heartbeat must never crash the worker
  }
}

export function readWorkerHeartbeat(): WorkerHeartbeat | null {
  try {
    const raw = fs.readFileSync(heartbeatPath(), 'utf-8');
    const parsed = JSON.parse(raw) as WorkerHeartbeat;
    if (!parsed?.at) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function workerStatus(): WorkerStatus {
  const heartbeat = readWorkerHeartbeat();
  if (!heartbeat) return { online: false, staleMs: STALE_MS, heartbeat: null };
  const age = Date.now() - Date.parse(heartbeat.at);
  return {
    online: Number.isFinite(age) && age >= 0 && age < STALE_MS,
    staleMs: STALE_MS,
    heartbeat,
  };
}
