import { useState } from 'react';
import { Boxes, Filter, RotateCcw, Send, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { EmptyState, Skeleton } from './EmptyState';
import { cn } from '../lib/cn';
import { useI18n, useT } from '../i18n/I18nProvider';

export type TaskRow = {
  id: string;
  creatorId: string;
  type: string;
  status: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  attempts?: number;
  lastError?: string | null;
  payload?: unknown;
  result?: unknown;
};

export type WorkerStatusLite = {
  online: boolean;
  staleMs?: number;
  heartbeat?: { at?: string } | null;
};

function formatTaskResult(result: unknown): string {
  if (result == null) return '';
  if (typeof result === 'string') return result;
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}

export function TaskQueue({
  tasks,
  loading,
  worker,
  onDispatch,
  onReopen,
  onFail,
}: {
  tasks: TaskRow[];
  loading?: boolean;
  worker?: WorkerStatusLite | null;
  onDispatch: (input: { creatorId: string; type: string; payload: unknown }) => Promise<void>;
  onReopen: (taskId: string) => Promise<void>;
  onFail: (taskId: string, lastError: string) => Promise<void>;
}) {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const [filter, setFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [creator, setCreator] = useState('Operator');
  const [type, setType] = useState('PING');
  const [payload, setPayload] = useState('{\n  "note": "hub-worker handles PING, ECHO, GEO_PULL_SITEMAP"\n}');
  const [busy, setBusy] = useState(false);

  const filtered =
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status.toUpperCase() === filter);

  const submit = async () => {
    setBusy(true);
    try {
      const parsed = JSON.parse(payload);
      await onDispatch({ creatorId: creator, type, payload: parsed });
      setShowForm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="nx-panel flex h-[min(600px,70vh)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">{t.tasks.title}</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] text-foundry-500">
            <Filter className="h-3 w-3" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-white/10 bg-foundry-950 px-1.5 py-0.5 text-foundry-200"
            >
              {['ALL', 'OPEN', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 rounded-sm bg-teal-deep/80 px-2 py-1 text-[11px] font-medium text-teal-50 hover:bg-teal-deep"
          >
            <Send className="h-3 w-3" />
            {t.tasks.dispatch}
          </button>
        </div>
      </div>

      {worker ? (
        <p
          className={cn(
            'border-b border-white/5 px-3 py-1.5 text-[10px] leading-relaxed',
            worker.online ? 'text-teal-glow/90' : 'text-copper'
          )}
        >
          {worker.online ? t.tasks.workerOnline : t.tasks.workerOffline}
        </p>
      ) : null}

      {showForm ? (
        <div className="space-y-2 border-b border-white/5 bg-foundry-950/50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="rounded border border-white/10 bg-foundry-950 px-2 py-1.5 font-mono text-xs"
              placeholder="creatorId"
            />
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded border border-white/10 bg-foundry-950 px-2 py-1.5 font-mono text-xs"
              placeholder="type"
            />
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            className="w-full rounded border border-white/10 bg-foundry-950 px-2 py-1.5 font-mono text-xs"
          />
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-sm bg-teal-glow px-3 py-1.5 text-xs font-semibold text-foundry-950 disabled:opacity-50"
          >
            {busy ? t.tasks.sending : t.tasks.create}
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {loading && tasks.length === 0 ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Boxes} title={t.tasks.emptyTitle} hint={t.tasks.emptyHint} />
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered
              .slice()
              .reverse()
              .map((task) => (
                <li key={task.id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'font-mono text-[10px] uppercase tracking-wide',
                            task.status === 'open' && 'text-teal-glow',
                            task.status === 'processing' && 'text-copper',
                            task.status === 'completed' && 'text-foundry-300',
                            task.status === 'failed' && 'text-rose-400'
                          )}
                        >
                          {task.status}
                        </span>
                        <span className="truncate font-mono text-xs text-foundry-100">
                          {task.type}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-foundry-500">
                        {task.id} · {task.creatorId}
                        {task.assignedTo ? ` → ${task.assignedTo}` : ''}
                        {task.attempts ? ` · attempts ${task.attempts}` : ''}
                      </p>
                      {task.lastError ? (
                        <p className="mt-1 flex items-start gap-1 text-[10px] text-rose-300/90">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                          {task.lastError}
                        </p>
                      ) : null}
                      {task.result != null ? (
                        <p className="mt-1 line-clamp-2 font-mono text-[10px] text-foundry-400">
                          {t.tasks.result}: {formatTaskResult(task.result)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-mono text-[10px] text-foundry-500">
                        {formatDistanceToNow(new Date(task.updatedAt || task.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                      {(task.status === 'failed' || task.status === 'processing') && (
                        <button
                          type="button"
                          onClick={() => onReopen(task.id)}
                          className="inline-flex items-center gap-1 text-[10px] text-teal-glow hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {t.tasks.reopen}
                        </button>
                      )}
                      {(task.status === 'open' || task.status === 'processing') && (
                        <button
                          type="button"
                          onClick={() => onFail(task.id, t.tasks.failReason)}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          {t.tasks.fail}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
