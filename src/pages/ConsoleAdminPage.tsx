import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/EmptyState';
import { useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';
import { cn } from '../lib/cn';

type AdminTenant = {
  workspaceId: string;
  planId: string;
  account: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    planId: string;
    workspaceId: string;
    emailVerified: boolean;
    createdAt: string;
  } | null;
  enrolledAgents: number;
  listedAgents: number;
  memoryAgents: number;
  memoryBytes: number;
  sites: number;
  totalTasks: number;
  openTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  today: {
    day: string;
    apiRequests: number;
    memoryWrites: number;
    tasksCreated: number;
    memorySearches: number;
  };
  lastAgentAt: string | null;
  lastActivityAt: string | null;
};

type AdminOverview = {
  at: string;
  summary: {
    accounts: number;
    users: number;
    admins: number;
    verifiedAccounts: number;
    agents: number;
    listedAgents: number;
    memoryAgents: number;
    memoryBytes: number;
    sites: number;
    openTasks: number;
    workspaces: number;
    today: {
      day: string;
      apiRequests: number;
      memoryWrites: number;
      tasksCreated: number;
      memorySearches: number;
    };
    byPlan: Record<string, number>;
  };
  tenants: AdminTenant[];
  note: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ConsoleAdminPage() {
  const t = useT();
  const { push } = useToast();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await apiFetch('/api/admin/overview');
      const body = (await res.json().catch(() => ({}))) as AdminOverview & {
        error?: string;
        message?: string;
      };
      if (res.status === 403) {
        setForbidden(true);
        setData(null);
        return;
      }
      if (!res.ok) {
        throw new Error(body.error || body.message || `Request failed (${res.status})`);
      }
      setData(body);
    } catch (e: any) {
      push(String(e?.message || t.common.cannotReach), 'error');
    } finally {
      setLoading(false);
    }
  }, [push, t.common.cannotReach]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const plans = useMemo(() => {
    if (!data) return [] as string[];
    return Object.keys(data.summary.byPlan).sort();
  }, [data]);

  const tenants = useMemo(() => {
    if (!data) return [] as AdminTenant[];
    const q = query.trim().toLowerCase();
    return data.tenants.filter((row) => {
      if (planFilter !== 'all' && row.planId !== planFilter) return false;
      if (!q) return true;
      const hay = [
        row.account?.email || '',
        row.account?.id || '',
        row.workspaceId,
        row.planId,
        row.account?.role || '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, planFilter]);

  if (forbidden) {
    return (
      <div className="nx-panel p-8">
        <h1 className="text-xl font-semibold text-foundry-100">{t.admin.title}</h1>
        <p className="mt-3 text-sm text-foundry-400">{t.admin.forbidden}</p>
        <Link to="/console/account" className="nx-btn nx-btn-ghost mt-6 inline-flex">
          {t.nav.account}
        </Link>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="nx-kicker mb-1">{t.admin.eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foundry-100">{t.admin.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-foundry-400">{t.admin.intro}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="nx-btn nx-btn-ghost inline-flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          {t.admin.refresh}
        </button>
      </div>

      {s ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t.admin.statAccounts, value: String(s.accounts) },
            { label: t.admin.statUsers, value: String(s.users) },
            { label: t.admin.statAgents, value: String(s.agents) },
            { label: t.admin.statSites, value: String(s.sites) },
            { label: t.admin.statMemory, value: formatBytes(s.memoryBytes) },
            { label: t.admin.statOpenTasks, value: String(s.openTasks) },
            {
              label: t.admin.statTodayApi,
              value: String(s.today.apiRequests),
            },
            {
              label: t.admin.statVerified,
              value: `${s.verifiedAccounts}/${s.accounts}`,
            },
          ].map((card) => (
            <div key={card.label} className="nx-card p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-foundry-500">
                {card.label}
              </p>
              <p className="mt-2 font-mono text-2xl text-foundry-100">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {s && Object.keys(s.byPlan).length > 0 ? (
        <p className="text-xs text-foundry-500">
          {t.admin.byPlan}:{' '}
          {Object.entries(s.byPlan)
            .map(([plan, n]) => `${plan} ${n}`)
            .join(' · ')}
          {' · '}
          {interpolate(t.admin.todayLine, {
            day: s.today.day,
            api: String(s.today.apiRequests),
            writes: String(s.today.memoryWrites),
            tasks: String(s.today.tasksCreated),
            searches: String(s.today.memorySearches),
          })}
        </p>
      ) : null}

      <section className="nx-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.admin.searchPh}
            className="min-w-[12rem] flex-1 rounded border border-white/10 bg-foundry-950 px-3 py-1.5 font-mono text-xs text-foundry-100"
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded border border-white/10 bg-foundry-950 px-2 py-1.5 font-mono text-xs"
          >
            <option value="all">{t.admin.allPlans}</option>
            {plans.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="font-mono text-[11px] text-foundry-500">
            {interpolate(t.admin.showing, { n: String(tenants.length) })}
          </span>
        </div>

        {tenants.length === 0 ? (
          <p className="px-4 py-8 text-sm text-foundry-500">{t.admin.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/5 font-mono text-[11px] uppercase tracking-wider text-foundry-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t.admin.colUser}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colPlan}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colAgents}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colMemory}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colSites}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colTasks}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colToday}</th>
                  <th className="px-4 py-2 font-medium">{t.admin.colActivity}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenants.map((row) => (
                  <tr key={row.workspaceId} className="align-top text-foundry-300">
                    <td className="px-4 py-3">
                      {row.account ? (
                        <>
                          <div className="font-mono text-sm text-foundry-100">{row.account.email}</div>
                          <p className="mt-0.5 font-mono text-[11px] text-foundry-500">
                            {row.account.role}
                            {' · '}
                            {row.account.emailVerified
                              ? t.admin.verified
                              : t.admin.unverified}
                            {' · '}
                            {row.workspaceId}
                          </p>
                          <p className="font-mono text-[11px] text-foundry-600">
                            {t.admin.registered}: {formatWhen(row.account.createdAt)}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="font-mono text-sm text-foundry-100">
                            {t.admin.unboundWorkspace}
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-foundry-500">
                            {row.workspaceId}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-teal-glow">{row.planId}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.enrolledAgents}
                      {row.listedAgents > 0 ? (
                        <span className="text-foundry-500">
                          {' '}
                          ({row.listedAgents} {t.admin.listed})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatBytes(row.memoryBytes)}
                      <span className="block text-foundry-500">
                        {row.memoryAgents} {t.admin.memoryAgents}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.sites}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.totalTasks}
                      <span className="block text-foundry-500">
                        {row.openTasks} open · {row.processingTasks} proc
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-foundry-400">
                      API {row.today.apiRequests}
                      <br />
                      mem {row.today.memoryWrites} · task {row.today.tasksCreated}
                      <br />
                      search {row.today.memorySearches}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-foundry-500">
                      {formatWhen(row.lastActivityAt)}
                      {row.lastAgentAt ? (
                        <span className="mt-1 block">
                          {t.admin.lastAgent}: {formatWhen(row.lastAgentAt)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-foundry-600">
        {data?.note}{' '}
        <Link to="/console/account" className="text-teal-glow hover:underline">
          {t.admin.upgradeHint}
        </Link>
        {data?.at ? (
          <span className="ml-2 font-mono">
            {t.admin.asOf} {formatWhen(data.at)}
          </span>
        ) : null}
      </p>
    </div>
  );
}
