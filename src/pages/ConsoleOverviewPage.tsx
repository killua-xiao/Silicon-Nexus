import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Boxes,
  Cpu,
  Database,
  Globe2,
  Newspaper,
  Pause,
  Play,
  Plug,
  RefreshCw,
} from 'lucide-react';
import { ActivityFeed } from '../components/ActivityFeed';
import { MemoryVault } from '../components/MemoryVault';
import { StatStrip } from '../components/StatStrip';
import { TaskQueue } from '../components/TaskQueue';
import { Skeleton } from '../components/EmptyState';
import { useConsole } from './ConsoleLayout';
import { useToast } from '../components/Toast';
import { useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';
import { apiJson } from '../lib/api';
import { cn } from '../lib/cn';

type FeedItemLite = {
  slug: string;
  indexing?: { status: 'unseen' | 'crawled' };
};

type SiteLite = {
  slug: string;
  name: string;
  updatedAt: string;
};

type SiteContentLite = {
  slug: string;
  indexing?: { status: 'unseen' | 'crawled' };
};

type ModuleCard = {
  id: string;
  title: string;
  desc: string;
  to: string;
  external?: boolean;
  icon: typeof Cpu;
  metrics: string[];
  accent: string;
};

export function ConsoleOverviewPage() {
  const {
    loading,
    stats,
    usage,
    logs,
    tasks,
    memory,
    agents,
    selectedAgentId,
    setSelectedAgentId,
    logQuery,
    setLogQuery,
    paused,
    setPaused,
    refresh,
    dispatchTask,
    reopenTask,
    failTask,
    wipeMemory,
    worker,
  } = useConsole();
  const { push } = useToast();
  const t = useT();

  const [feedItems, setFeedItems] = useState<FeedItemLite[]>([]);
  const [sites, setSites] = useState<SiteLite[]>([]);
  const [sitePages, setSitePages] = useState(0);
  const [siteCrawled, setSiteCrawled] = useState(0);
  const [moduleLoading, setModuleLoading] = useState(true);

  const refreshModules = useCallback(async () => {
    try {
      const [feed, siteList] = await Promise.all([
        apiJson<{ items: FeedItemLite[] }>('/api/feed?limit=100'),
        apiJson<{ sites: SiteLite[] }>('/api/sites'),
      ]);
      const nextSites = siteList.sites || [];
      setFeedItems(feed.items || []);
      setSites(nextSites);

      if (nextSites.length === 0) {
        setSitePages(0);
        setSiteCrawled(0);
      } else {
        const contents = await Promise.all(
          nextSites.slice(0, 12).map((s) =>
            apiJson<{ items: SiteContentLite[] }>(
              `/api/sites/${encodeURIComponent(s.slug)}/content?limit=100`
            ).catch(() => ({ items: [] as SiteContentLite[] }))
          )
        );
        const all = contents.flatMap((c) => c.items || []);
        setSitePages(all.length);
        setSiteCrawled(all.filter((i) => i.indexing?.status === 'crawled').length);
      }
    } catch {
      // toast via api handlers when auth fails
    } finally {
      setModuleLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshModules();
  }, [refreshModules]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      refreshModules();
    }, 8000);
    return () => clearInterval(id);
  }, [paused, refreshModules]);

  const memoryAgentCount = Object.keys(memory).length;
  const openTasks = usage?.openTasks ?? tasks.filter((x) => x.status === 'OPEN').length;
  const listedAgents = agents.filter((a) => a.listed).length;
  const feedCrawled = feedItems.filter((i) => i.indexing?.status === 'crawled').length;

  const modules: ModuleCard[] = useMemo(
    () => [
      {
        id: 'agents',
        title: t.console.modAgents,
        desc: t.console.modAgentsDesc,
        to: '/console/agents',
        icon: Cpu,
        accent: 'text-teal-glow',
        metrics: [
          interpolate(t.console.metricAgents, {
            n: String(usage?.enrolledAgents ?? agents.length),
          }),
          interpolate(t.console.metricListed, { n: String(listedAgents) }),
        ],
      },
      {
        id: 'memory',
        title: t.console.modMemory,
        desc: t.console.modMemoryDesc,
        to: '#live-ops',
        icon: Database,
        accent: 'text-teal-glow',
        metrics: [
          interpolate(t.console.metricMemory, { n: String(memoryAgentCount) }),
          usage ? formatBytes(usage.memoryBytes) : '—',
        ],
      },
      {
        id: 'tasks',
        title: t.console.modTasks,
        desc: t.console.modTasksDesc,
        to: '#live-ops',
        icon: Boxes,
        accent: 'text-copper',
        metrics: [
          interpolate(t.console.metricTasks, { n: String(openTasks) }),
          usage
            ? `${usage.processingTasks} / ${usage.completedTasks}`
            : String(stats?.completedTasks ?? 0),
        ],
      },
      {
        id: 'feed',
        title: t.console.modFeed,
        desc: t.console.modFeedDesc,
        to: '/console/feed',
        icon: Newspaper,
        accent: 'text-teal-glow',
        metrics: [
          interpolate(t.console.metricFeed, { n: String(feedItems.length) }),
          interpolate(t.console.metricFeedCrawled, { n: String(feedCrawled) }),
        ],
      },
      {
        id: 'sites',
        title: t.console.modSites,
        desc: t.console.modSitesDesc,
        to: '/console/sites',
        icon: Globe2,
        accent: 'text-copper',
        metrics: [
          interpolate(t.console.metricSites, { n: String(sites.length) }),
          interpolate(t.console.metricPages, { n: String(sitePages) }),
          sitePages
            ? interpolate(t.console.metricFeedCrawled, { n: String(siteCrawled) })
            : '',
        ].filter(Boolean),
      },
      {
        id: 'connect',
        title: t.console.modConnect,
        desc: t.console.modConnectDesc,
        to: '/connect',
        icon: Plug,
        accent: 'text-teal-glow',
        metrics: [
          usage?.plan
            ? interpolate(t.console.metricPlan, { id: usage.plan.id })
            : 'MCP /mcp',
          'agent.json',
        ],
      },
    ],
    [
      t,
      usage,
      agents.length,
      listedAgents,
      memoryAgentCount,
      openTasks,
      stats?.completedTasks,
      feedItems.length,
      feedCrawled,
      sites.length,
      sitePages,
      siteCrawled,
    ]
  );

  const surfaces = [
    { href: '/llms.txt', label: 'llms.txt' },
    { href: '/feed.json', label: 'feed.json' },
    { href: '/feed.xml', label: 'feed.xml' },
    { href: '/.well-known/agent.json', label: 'agent.json' },
    { href: '/mcp', label: '/mcp' },
    { href: '/directory', label: 'directory' },
    ...(sites[0]
      ? [
          {
            href: `/sites/${encodeURIComponent(sites[0].slug)}/llms.txt`,
            label: `sites/${sites[0].slug}/llms.txt`,
          },
        ]
      : [{ href: '/console/sites', label: 'sites/…', internal: true as const }]),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-5">
        <div className="max-w-2xl">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-teal-glow">
            Silicon Nexus
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foundry-100 md:text-3xl">
            {t.console.operations}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foundry-500">
            {t.console.operationsHint}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-1.5 text-xs text-foundry-300 hover:border-white/20"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? t.console.resume : t.console.pause}
          </button>
          <button
            type="button"
            onClick={() => {
              refresh();
              refreshModules();
              push(t.console.refreshed, 'info');
            }}
            className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-1.5 text-xs text-foundry-300 hover:border-white/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t.console.refresh}
          </button>
        </div>
      </div>

      <StatStrip stats={stats} usage={usage} loading={loading} />

      <section className="space-y-3">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.console.modulesTitle}
          </h2>
          <p className="mt-1 text-sm text-foundry-500">{t.console.modulesHint}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            const body = (
              <>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className={cn('rounded border border-white/10 p-2', mod.accent)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-foundry-500">
                    {t.console.openModule}
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foundry-100">{mod.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-foundry-500">{mod.desc}</p>
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/5 pt-3 font-mono text-[11px] text-foundry-400">
                  {moduleLoading && mod.id !== 'connect' && !feedItems.length && !sites.length ? (
                    <Skeleton className="h-3 w-24" />
                  ) : (
                    mod.metrics.map((m) => (
                      <span key={m} className="text-foundry-300">
                        {m}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2 font-mono text-[10px] uppercase tracking-wider text-foundry-600">
                  <span>{t.console.dualHuman}</span>
                  <span>·</span>
                  <span>{t.console.dualAgent}</span>
                </div>
              </>
            );

            const className =
              'nx-card nx-card-hover group block p-4 animate-foundry-rise';

            if (mod.to.startsWith('#')) {
              return (
                <a key={mod.id} href={mod.to} className={className} style={{ animationDelay: `${idx * 40}ms` }}>
                  {body}
                </a>
              );
            }
            return (
              <Link
                key={mod.id}
                to={mod.to}
                className={className}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {body}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.console.surfacesTitle}
          </h2>
          <p className="mt-1 text-sm text-foundry-500">{t.console.surfacesHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {surfaces.map((s) =>
            'internal' in s && s.internal ? (
              <Link
                key={s.label}
                to={s.href}
                className="rounded border border-white/10 px-3 py-1.5 font-mono text-xs text-foundry-300 hover:border-teal-glow/40 hover:text-teal-glow"
              >
                {s.label}
              </Link>
            ) : (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('/console') ? undefined : '_blank'}
                rel="noreferrer"
                className="rounded border border-white/10 px-3 py-1.5 font-mono text-xs text-foundry-300 hover:border-teal-glow/40 hover:text-teal-glow"
              >
                {s.label}
              </a>
            )
          )}
        </div>
      </section>

      <section id="live-ops" className="space-y-3 scroll-mt-4">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.console.liveTitle}
          </h2>
          <p className="mt-1 text-sm text-foundry-500">{t.console.liveHint}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <ActivityFeed logs={logs} query={logQuery} onQuery={setLogQuery} loading={loading} />
          <TaskQueue
            tasks={tasks}
            loading={loading}
            worker={worker}
            onDispatch={dispatchTask}
            onReopen={reopenTask}
            onFail={failTask}
          />
          <MemoryVault
            memory={memory}
            selectedAgentId={selectedAgentId}
            onSelect={setSelectedAgentId}
            onWipe={wipeMemory}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
