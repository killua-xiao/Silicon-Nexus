import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Globe2, RefreshCw, Trash2 } from 'lucide-react';
import { apiJson } from '../lib/api';
import { EmptyState, Skeleton } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useI18n, useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';

type SiteRow = {
  slug: string;
  name: string;
  domain: string | null;
  description: string;
  sitemapUrl?: string | null;
  lastPulledAt?: string | null;
  lastPullNote?: string | null;
  updatedAt: string;
};

type GeoStatus = {
  contentCount: number;
  crawledCount: number;
  unseenCount: number;
  lastPulledAt: string | null;
  lastPullNote: string | null;
  honesty: string;
};

type ContentRow = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  indexing?: {
    status: 'unseen' | 'crawled';
    crawlHits: number;
    lastCrawledAt: string | null;
    crawlersSeen: string[];
    note: string;
  };
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
      .replace(/[\u4e00-\u9fff]/g, (s) => `u${s.codePointAt(0)?.toString(16) || 'x'}`)
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || `site-${Date.now().toString(36)}`
  );
}

export function ConsoleSitesPage() {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const { push } = useToast();

  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState<ContentRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [geo, setGeo] = useState<GeoStatus | null>(null);
  const [pulling, setPulling] = useState(false);

  const [cTitle, setCTitle] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cSummary, setCSummary] = useState('');
  const [cBody, setCBody] = useState('');
  const [cCanonical, setCCanonical] = useState('');
  const [cSlugTouched, setCSlugTouched] = useState(false);

  const refreshSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ sites: SiteRow[] }>('/api/sites');
      const next = data.sites || [];
      setSites(next);
      setSelected((prev) => prev || next[0]?.slug || '');
    } catch (e: any) {
      push(e.message || t.common.cannotReach, 'error');
    } finally {
      setLoading(false);
    }
  }, [push, t.common.cannotReach]);

  const refreshGeo = useCallback(
    async (siteSlug: string) => {
      if (!siteSlug) {
        setGeo(null);
        return;
      }
      try {
        const data = await apiJson<GeoStatus>(`/api/sites/${encodeURIComponent(siteSlug)}/geo`);
        setGeo(data);
      } catch {
        setGeo(null);
      }
    },
    []
  );

  const refreshContent = useCallback(
    async (siteSlug: string) => {
      if (!siteSlug) {
        setItems([]);
        return;
      }
      setItemsLoading(true);
      try {
        const data = await apiJson<{ items: ContentRow[] }>(
          `/api/sites/${encodeURIComponent(siteSlug)}/content?limit=100`
        );
        setItems(data.items || []);
      } catch (e: any) {
        push(e.message || t.common.cannotReach, 'error');
      } finally {
        setItemsLoading(false);
      }
    },
    [push, t.common.cannotReach]
  );

  useEffect(() => {
    refreshSites();
  }, [refreshSites]);

  useEffect(() => {
    refreshContent(selected);
    refreshGeo(selected);
  }, [selected, refreshContent, refreshGeo]);

  const saveSite = async () => {
    const finalSlug = (slug || slugify(name)).trim();
    if (!name.trim() || !finalSlug) {
      push(t.consoleSites.siteRequired, 'error');
      return;
    }
    setBusy(true);
    try {
      await apiJson('/api/sites', {
        method: 'POST',
        body: JSON.stringify({
          slug: finalSlug,
          name: name.trim(),
          domain: domain.trim() || null,
          description: description.trim(),
          sitemapUrl: sitemapUrl.trim() || null,
        }),
      });
      push(t.consoleSites.siteSaved, 'success');
      setName('');
      setSlug('');
      setDomain('');
      setDescription('');
      setSitemapUrl('');
      setSlugTouched(false);
      setSelected(finalSlug);
      await refreshSites();
    } catch (e: any) {
      push(e.message || 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const syncContent = async () => {
    if (!selected) {
      push(t.consoleSites.selectSiteFirst, 'error');
      return;
    }
    const finalSlug = (cSlug || slugify(cTitle)).trim();
    if (!cTitle.trim() || !cBody.trim() || !finalSlug) {
      push(t.consoleSites.contentRequired, 'error');
      return;
    }
    setBusy(true);
    try {
      await apiJson(`/api/sites/${encodeURIComponent(selected)}/content`, {
        method: 'POST',
        body: JSON.stringify({
          slug: finalSlug,
          title: cTitle.trim(),
          summary: cSummary.trim() || cTitle.trim(),
          bodyMd: cBody.trim(),
          canonicalUrl: cCanonical.trim() || null,
        }),
      });
      push(t.consoleSites.contentSaved, 'success');
      setCTitle('');
      setCSlug('');
      setCSummary('');
      setCBody('');
      setCCanonical('');
      setCSlugTouched(false);
      await refreshContent(selected);
    } catch (e: any) {
      push(e.message || 'Sync failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foundry-100">
          {t.consoleSites.title}
        </h1>
        <p className="text-sm text-foundry-500">
          {t.consoleSites.hint}{' '}
          <span className="font-mono text-foundry-400">/sites/{'{slug}'}/llms.txt</span>
          {' · '}
          <span className="text-foundry-600">{t.consoleSites.indexingHint}</span>
        </p>
      </div>

      <section className="nx-card p-4 md:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
          <Globe2 className="h-3.5 w-3.5" />
          {t.consoleSites.registerTitle}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder={t.consoleSites.namePh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder={t.consoleSites.slugPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={t.consoleSites.domainPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.consoleSites.descPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder={t.consoleSites.sitemapPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm md:col-span-2"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={saveSite}
          className="mt-3 rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950 disabled:opacity-50"
        >
          {busy ? t.consoleSites.saving : t.consoleSites.saveSite}
        </button>
      </section>

      <section className="nx-panel">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.consoleSites.listTitle}
          </h2>
        </div>
        {loading && sites.length === 0 ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : sites.length === 0 ? (
          <EmptyState
            icon={Globe2}
            title={t.consoleSites.emptyTitle}
            hint={t.consoleSites.emptyHint}
            className="py-12"
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {sites.map((site) => (
              <li
                key={site.slug}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => setSelected(site.slug)}
                  className={`text-left ${
                    selected === site.slug ? 'text-teal-glow' : 'text-foundry-200'
                  }`}
                >
                  <div className="font-mono text-sm">{site.name}</div>
                  <p className="font-mono text-[11px] text-foundry-500">
                    {site.slug}
                    {site.domain ? ` · ${site.domain}` : ''}
                    {site.sitemapUrl ? ' · sitemap' : ''} ·{' '}
                    {formatDistanceToNow(new Date(site.updatedAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/sites/${encodeURIComponent(site.slug)}/llms.txt`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-white/15 px-2.5 py-1 text-xs text-foundry-300 hover:border-teal-glow/40"
                  >
                    llms.txt
                  </a>
                  <button
                    type="button"
                    disabled={pulling}
                    onClick={async () => {
                      setPulling(true);
                      try {
                        const data = await apiJson<{
                          pull?: { ok?: boolean; note?: string };
                        }>(`/api/sites/${encodeURIComponent(site.slug)}/pull`, {
                          method: 'POST',
                          body: JSON.stringify({
                            sitemapUrl: site.sitemapUrl || undefined,
                          }),
                        });
                        push(
                          data.pull?.ok
                            ? t.consoleSites.pulled
                            : data.pull?.note || t.consoleSites.pullFailed,
                          data.pull?.ok ? 'success' : 'error'
                        );
                        setSelected(site.slug);
                        await refreshSites();
                        await refreshContent(site.slug);
                        await refreshGeo(site.slug);
                      } catch (e: any) {
                        push(e.message || t.consoleSites.pullFailed, 'error');
                      } finally {
                        setPulling(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded border border-teal-glow/30 px-2.5 py-1 text-xs text-teal-glow hover:bg-teal-950/40 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${pulling ? 'animate-spin' : ''}`} />
                    {pulling ? t.consoleSites.pulling : t.consoleSites.pullSitemap}
                  </button>
                  <a
                    href={`/sites/${encodeURIComponent(site.slug)}/feed.json`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-white/15 px-2.5 py-1 text-xs text-foundry-300 hover:border-teal-glow/40"
                  >
                    feed.json
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          interpolate(t.consoleSites.deleteSiteConfirm, { slug: site.slug })
                        )
                      ) {
                        return;
                      }
                      try {
                        await apiJson(`/api/sites/${encodeURIComponent(site.slug)}`, {
                          method: 'DELETE',
                        });
                        push(t.consoleSites.siteDeleted, 'success');
                        if (selected === site.slug) setSelected('');
                        await refreshSites();
                      } catch (e: any) {
                        push(e.message || 'Delete failed', 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded border border-rose-500/30 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t.consoleSites.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <>
          {geo ? (
            <section className="nx-card p-4 md:p-5">
              <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
                GEO · {selected}
              </h2>
              <p className="font-mono text-xs text-foundry-400">
                {geo.contentCount} pages · {geo.crawledCount} crawled · {geo.unseenCount} unseen
              </p>
              {geo.lastPullNote ? (
                <p className="mt-2 text-sm text-foundry-300">
                  {t.consoleSites.lastPull}: {geo.lastPullNote}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-foundry-500">{t.consoleSites.honesty}</p>
            </section>
          ) : null}
          <section className="nx-card p-4 md:p-5">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-teal-glow">
              {interpolate(t.consoleSites.syncTitle, { slug: selected })}
            </h2>
            <div className="grid gap-3">
              <input
                value={cTitle}
                onChange={(e) => {
                  setCTitle(e.target.value);
                  if (!cSlugTouched) setCSlug(slugify(e.target.value));
                }}
                placeholder={t.consoleSites.contentTitlePh}
                className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
              />
              <input
                value={cSlug}
                onChange={(e) => {
                  setCSlugTouched(true);
                  setCSlug(e.target.value);
                }}
                placeholder={t.consoleSites.contentSlugPh}
                className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
              />
              <input
                value={cSummary}
                onChange={(e) => setCSummary(e.target.value)}
                placeholder={t.consoleSites.contentSummaryPh}
                className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
              />
              <input
                value={cCanonical}
                onChange={(e) => setCCanonical(e.target.value)}
                placeholder={t.consoleSites.canonicalPh}
                className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
              />
              <textarea
                value={cBody}
                onChange={(e) => setCBody(e.target.value)}
                placeholder={t.consoleSites.contentBodyPh}
                rows={8}
                className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm leading-relaxed"
              />
              <button
                type="button"
                disabled={busy}
                onClick={syncContent}
                className="w-fit rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950 disabled:opacity-50"
              >
                {busy ? t.consoleSites.syncing : t.consoleSites.sync}
              </button>
            </div>
          </section>

          <section className="nx-panel">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
                {t.consoleSites.contentListTitle}
              </h2>
            </div>
            {itemsLoading && items.length === 0 ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Globe2}
                title={t.consoleSites.contentEmptyTitle}
                hint={t.consoleSites.contentEmptyHint}
                className="py-12"
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
                        <a
                          href={`/sites/${encodeURIComponent(selected)}/content/${encodeURIComponent(item.slug)}.md`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-sm text-teal-glow hover:underline"
                        >
                          {item.title}
                        </a>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                            item.indexing?.status === 'crawled'
                              ? 'border border-teal-glow/40 text-teal-glow'
                              : 'border border-white/10 text-foundry-500'
                          }`}
                          title={item.indexing?.note || t.consoleSites.indexingHint}
                        >
                          {item.indexing?.status === 'crawled'
                            ? t.consoleSites.crawled
                            : t.consoleSites.unseen}
                          {item.indexing?.status === 'crawled'
                            ? ` · ${item.indexing.crawlHits}`
                            : ''}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-foundry-500">
                        {item.slug} ·{' '}
                        {formatDistanceToNow(new Date(item.publishedAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            interpolate(t.consoleSites.deleteContentConfirm, {
                              slug: item.slug,
                            })
                          )
                        ) {
                          return;
                        }
                        try {
                          await apiJson(
                            `/api/sites/${encodeURIComponent(selected)}/content/${encodeURIComponent(item.slug)}`,
                            { method: 'DELETE' }
                          );
                          push(t.consoleSites.contentDeleted, 'success');
                          await refreshContent(selected);
                        } catch (e: any) {
                          push(e.message || 'Delete failed', 'error');
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded border border-rose-500/30 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t.consoleSites.delete}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
