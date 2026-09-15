import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { EmptyState, Skeleton } from './EmptyState';
import { useI18n, useT } from '../i18n/I18nProvider';

export type LogRow = {
  id: string;
  timestamp: string;
  type: string;
  agentId: string;
  details: string;
};

export function ActivityFeed({
  logs,
  query,
  onQuery,
  loading,
}: {
  logs: LogRow[];
  query: string;
  onQuery: (q: string) => void;
  loading?: boolean;
}) {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const filtered = logs.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      l.type.toLowerCase().includes(q) ||
      l.agentId.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <section className="nx-panel flex h-[min(600px,70vh)] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">{t.activity.title}</h2>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t.activity.filter}
          className="w-32 rounded border border-white/10 bg-foundry-950 px-2 py-1 font-mono text-[11px] text-foundry-200 placeholder:text-foundry-600"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && logs.length === 0 ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Activity} title={t.activity.emptyTitle} hint={t.activity.emptyHint} />
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((l) => (
              <li key={l.id} className="px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase text-copper">{l.type}</span>
                  <span className="font-mono text-[10px] text-foundry-500">
                    {formatDistanceToNow(new Date(l.timestamp), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-foundry-200">
                  <span className="text-teal-glow/80">{l.agentId}</span> — {l.details}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
