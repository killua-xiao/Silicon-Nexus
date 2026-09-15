import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Radio } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { EmptyState, Skeleton } from '../components/EmptyState';
import { useI18n, useT } from '../i18n/I18nProvider';

type FeedItem = {
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  tags: string[];
  source: string;
  sourceUrl: string | null;
  publishedAt: string;
  indexing?: {
    status: 'unseen' | 'crawled';
    crawlHits: number;
    lastCrawledAt: string | null;
    crawlersSeen: string[];
    note: string;
  };
};

export function FeedPage() {
  const t = useT();
  const { locale } = useI18n();
  const { slug } = useParams();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const [items, setItems] = useState<FeedItem[]>([]);
  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const url = slug ? `/api/feed/${encodeURIComponent(slug)}` : '/api/feed?limit=40';
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (slug) setItem(d as FeedItem);
        else setItems((d.items || []) as FeedItem[]);
        setError('');
      })
      .catch(() => setError(t.common.cannotReach))
      .finally(() => setLoading(false));
  }, [slug, t.common.cannotReach]);

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="nx-kicker mb-2">{t.feed.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100">
          {slug ? item?.title || t.feed.title : t.feed.title}
        </h1>
        <p className="mt-3 text-foundry-400 leading-relaxed">{t.feed.intro}</p>
        <p className="mt-2 text-xs text-foundry-600">{t.feed.indexingHint}</p>
        <p className="mt-3 font-mono text-[11px] text-foundry-600">
          <a className="text-teal-glow/80 hover:underline" href="/feed.json">
            feed.json
          </a>
          {' · '}
          <a className="text-teal-glow/80 hover:underline" href="/feed.xml">
            feed.xml
          </a>
          {' · '}
          <a className="text-teal-glow/80 hover:underline" href="/llms.txt">
            llms.txt
          </a>
          {' · '}
          <a className="text-teal-glow/80 hover:underline" href="/sitemap.xml">
            sitemap.xml
          </a>
        </p>

        {slug ? (
          <div className="nx-card mt-10 p-5">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : error || !item ? (
              <p className="text-sm text-rose-300">{error || t.feed.missing}</p>
            ) : (
              <>
                <p className="font-mono text-[11px] text-foundry-500">
                  <span
                    className={
                      item.indexing?.status === 'crawled' ? 'text-teal-glow' : 'text-foundry-500'
                    }
                  >
                    {item.indexing?.status === 'crawled' ? t.feed.crawled : t.feed.unseen}
                    {item.indexing?.crawlersSeen?.length
                      ? ` (${item.indexing.crawlersSeen.join(', ')})`
                      : ''}
                  </span>
                  {' · '}
                  {item.source}
                  {item.sourceUrl ? (
                    <>
                      {' · '}
                      <a
                        href={item.sourceUrl}
                        className="text-teal-glow/80 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.feed.source}
                      </a>
                    </>
                  ) : null}
                  {' · '}
                  {formatDistanceToNow(new Date(item.publishedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </p>
                <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foundry-200">
                  {item.bodyMd}
                </pre>
                <Link to="/feed" className="mt-6 inline-block text-sm text-teal-glow hover:underline">
                  {t.feed.back}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="nx-panel mt-10">
            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : error ? (
              <p className="p-6 text-sm text-rose-300">{error}</p>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Radio}
                title={t.feed.emptyTitle}
                hint={t.feed.emptyHint}
                className="py-16"
              />
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((a) => (
                  <li key={a.slug} className="px-4 py-4">
                    <Link
                      to={`/feed/${encodeURIComponent(a.slug)}`}
                      className="font-mono text-sm text-teal-glow hover:underline"
                    >
                      {a.title}
                    </Link>
                    <span
                      className={`ml-2 font-mono text-[10px] uppercase ${
                        a.indexing?.status === 'crawled' ? 'text-teal-glow' : 'text-foundry-600'
                      }`}
                    >
                      {a.indexing?.status === 'crawled' ? t.feed.crawled : t.feed.unseen}
                    </span>
                    <p className="mt-1 text-sm text-foundry-400">{a.summary}</p>
                    <p className="mt-1 font-mono text-[11px] text-foundry-600">
                      {a.source} ·{' '}
                      {formatDistanceToNow(new Date(a.publishedAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
