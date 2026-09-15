import { Activity, CheckCircle2, Cpu, Database } from 'lucide-react';
import { Skeleton } from './EmptyState';
import { useT } from '../i18n/I18nProvider';

export type Stats = {
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  enrolledAgents?: number;
};

export type Usage = {
  memoryBytes: number;
  openTasks: number;
  processingTasks: number;
  failedTasks: number;
  completedTasks: number;
  enrolledAgents: number;
  listedAgents?: number;
  plan?: {
    id: string;
    maxAgents: number;
    maxMemoryBytes: number;
    maxTasksPerDay: number;
    maxApiRequestsPerDay: number;
  };
  today?: {
    day: string;
    apiRequests: number;
    memoryWrites: number;
    tasksCreated: number;
  };
  billing?: {
    provider: string;
    stripeConfigured: boolean;
    note: string;
  };
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function StatStrip({
  stats,
  usage,
  loading,
}: {
  stats: Stats | null;
  usage: Usage | null;
  loading?: boolean;
}) {
  const t = useT();
  const plan = usage?.plan;
  const cards = [
    {
      label: t.stats.enrolled,
      value: plan
        ? `${usage?.enrolledAgents ?? 0} / ${plan.maxAgents}`
        : String(usage?.enrolledAgents ?? stats?.enrolledAgents ?? 0),
      icon: Cpu,
    },
    {
      label: t.stats.memory,
      value: usage
        ? plan
          ? `${formatBytes(usage.memoryBytes)} / ${formatBytes(plan.maxMemoryBytes)}`
          : formatBytes(usage.memoryBytes)
        : '—',
      icon: Database,
    },
    {
      label: t.stats.openProcessing,
      value: usage ? `${usage.openTasks} / ${usage.processingTasks}` : '—',
      icon: Activity,
    },
    {
      label: t.stats.apiToday,
      value: usage?.today
        ? plan
          ? `${usage.today.apiRequests} / ${plan.maxApiRequestsPerDay}`
          : String(usage.today.apiRequests)
        : usage
          ? `${usage.completedTasks} / ${usage.failedTasks}`
          : String(stats?.completedTasks ?? 0),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="nx-card px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-foundry-500">
              <c.icon className="h-3.5 w-3.5 text-teal-glow/80" />
              {c.label}
            </div>
            {loading && !stats && !usage ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="font-mono text-xl font-medium text-foundry-100">{c.value}</div>
            )}
          </div>
        ))}
      </div>
      {plan ? (
        <p className="font-mono text-[11px] text-foundry-600">
          {t.stats.plan}: <span className="text-teal-glow">{plan.id}</span>
          {usage?.billing?.note ? ` · ${usage.billing.note}` : ''}
        </p>
      ) : null}
    </div>
  );
}
