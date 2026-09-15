import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Newspaper, Trash2 } from 'lucide-react';
import { apiJson } from '../lib/api';
import { EmptyState, Skeleton } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useI18n, useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';

type FeedRow = {
  slug: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  indexing?: {
    status: 'unseen' | 'crawled';
    crawlHits: number;
    lastCrawledAt: string | null;
    crawlersSeen: string[];
    note: string;
  };
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/[\u4e00-\u9fff]/g, (s) => `u${s.codePointAt(0)?.toString(16) || 'x'}`)
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `signal-${Date.now().toString(36)}`;
}

export function ConsoleFeedPage() {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const { push } = useToast();
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [tags, setTags] = useState('signal');
  const [slugTouched, setSlugTouched] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ items: FeedRow[] }>('/api/feed?limit=100');
      setItems(data.items || []);
    } catch (e: any) {
      push(e.message || t.common.cannotReach, 'error');
    } finally {
      setLoading(false);
    }
  }, [push, t.common.cannotReach]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const publish = async () => {
    const finalSlug = (slug || slugify(title)).trim();
    if (!title.trim() || !bodyMd.trim() || !finalSlug) {
      push(t.consoleFeed.required, 'error');
      return;
    }
    setBusy(true);
    try {
      await apiJson('/api/feed', {
        method: 'POST',
        body: JSON.stringify({
          slug: finalSlug,
          title: title.trim(),
          summary: summary.trim() || title.trim(),
          bodyMd: bodyMd.trim(),
          tags: tags
            .split(/[,，\s]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 12),
          source: 'operator',
        }),
      });
      push(t.consoleFeed.published, 'success');
      setTitle('');
      setSlug('');
      setSummary('');
      setBodyMd('');
      setTags('signal');
      setSlugTouched(false);
      await refresh();
    } catch (e: any) {
      push(e.message || 'Publish failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foundry-100">
          {t.consoleFeed.title}
        </h1>
        <p className="text-sm text-foundry-500">
          {t.consoleFeed.hint}{' '}
          <Link to="/feed" className="text-teal-glow hover:underline">
            /feed
          </Link>
          {' · '}
          <span className="text-foundry-600">{t.consoleFeed.indexingHint}</span>
        </p>
      </div>

      <section className="nx-card p-4 md:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
          <Newspaper className="h-3.5 w-3.5" />
          {t.consoleFeed.publishTitle}
        </h2>
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder={t.consoleFeed.titlePh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder={t.consoleFeed.slugPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t.consoleFeed.summaryPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t.consoleFeed.tagsPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            placeholder={t.consoleFeed.bodyPh}
            rows={10}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={publish}
              className="rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950 disabled:opacity-50"
            >
              {busy ? t.consoleFeed.publishing : t.consoleFeed.publish}
            </button>
            <a
              href="/feed.json"
              target="_blank"
              rel="noreferrer"
              className="rounded-sm border border-white/15 px-4 py-2 text-sm text-foundry-200 hover:border-teal-glow/40"
            >
              feed.json
            </a>
          </div>
        </div>
      </section>

      <section className="nx-panel">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.consoleFeed.listTitle}
          </h2>
        </div>
        {loading && items.length === 0 ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={t.consoleFeed.emptyTitle}
            hint={t.consoleFeed.emptyHint}
            className="py-16"
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <li
                key={item.slug}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/feed/${encodeURIComponent(item.slug)}`}
                      className="font-mono text-sm text-teal-glow hover:underline"
                    >
                      {item.title}
                    </Link>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        item.indexing?.status === 'crawled'
                          ? 'border border-teal-glow/40 text-teal-glow'
                          : 'border border-white/10 text-foundry-500'
                      }`}
                      title={item.indexing?.note || t.consoleFeed.indexingHint}
                    >
                      {item.indexing?.status === 'crawled'
                        ? t.consoleFeed.crawled
                        : t.consoleFeed.unseen}
                      {item.indexing?.status === 'crawled'
                        ? ` · ${item.indexing.crawlHits}`
                        : ''}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-foundry-500">
                    {item.slug} · {item.source} ·{' '}
                    {formatDistanceToNow(new Date(item.publishedAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                    {item.indexing?.crawlersSeen?.length
                      ? ` · ${item.indexing.crawlersSeen.join(', ')}`
                      : ''}
                    {item.indexing?.lastCrawledAt
                      ? ` · ${t.consoleFeed.lastCrawl} ${formatDistanceToNow(
                          new Date(item.indexing.lastCrawledAt),
                          { addSuffix: true, locale: dateLocale }
                        )}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        interpolate(t.consoleFeed.deleteConfirm, { slug: item.slug })
                      )
                    ) {
                      return;
                    }
                    try {
                      await apiJson(`/api/feed/${encodeURIComponent(item.slug)}`, {
                        method: 'DELETE',
                      });
                      push(t.consoleFeed.deleted, 'success');
                      await refresh();
                    } catch (e: any) {
                      push(e.message || 'Delete failed', 'error');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded border border-rose-500/30 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3 w-3" />
                  {t.consoleFeed.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
