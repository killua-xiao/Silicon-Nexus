import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Radar } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { EmptyState, Skeleton } from '../components/EmptyState';
import { useI18n, useT } from '../i18n/I18nProvider';

type PublicAgent = {
  agentId: string;
  label: string | null;
  blurb: string | null;
  createdAt: string;
};

export function DirectoryPage() {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/directory')
      .then((r) => r.json())
      .then((d: { agents?: PublicAgent[] }) => {
        setAgents(d.agents || []);
        setError('');
      })
      .catch(() => setError(t.common.cannotReach))
      .finally(() => setLoading(false));
  }, [t.common.cannotReach]);

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="nx-kicker mb-2">{t.directory.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100">
          {t.directory.title}
        </h1>
        <p className="mt-3 text-foundry-400 leading-relaxed">{t.directory.intro}</p>

        <div className="nx-panel mt-10">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-rose-300">{error}</p>
          ) : agents.length === 0 ? (
            <EmptyState
              icon={Radar}
              title={t.directory.emptyTitle}
              hint={t.directory.emptyHint}
              className="py-16"
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {agents.map((a) => (
                <li key={a.agentId} className="px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-sm text-teal-glow">{a.agentId}</p>
                    <p className="font-mono text-[11px] text-foundry-600">
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-foundry-200">
                    {a.label || t.directory.unlabeled}
                  </p>
                  {a.blurb ? (
                    <p className="mt-1 text-sm text-foundry-500 leading-relaxed">{a.blurb}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-8 text-sm text-foundry-500">
          {t.directory.optIn}{' '}
          <Link to="/console/agents" className="text-teal-glow hover:underline">
            {t.directory.openAgents}
          </Link>
        </p>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
