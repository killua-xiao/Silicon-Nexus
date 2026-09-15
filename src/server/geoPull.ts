import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  getSiteBySlug,
  getSiteContent,
  listSiteContent,
  recordSitePull,
  upsertSite,
  upsertSiteContent,
} from './store.ts';

const MAX_PAGES = 20;
const MAX_BYTES = 1_500_000;
const FETCH_MS = 12_000;
const USER_AGENT = 'SiliconNexus-GEO/1.3 (+https://silinex.xyz)';

export type SitePullResult = {
  ok: boolean;
  slug: string;
  sitemapUrl: string | null;
  fetched: number;
  upserted: number;
  skipped: number;
  errors: string[];
  note: string;
};

export function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const parts = ip.split('.').map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (v === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fe80:') || normalized.startsWith('fec0:')) return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('::ffff:')) {
      return isBlockedIp(normalized.slice('::ffff:'.length));
    }
    return false;
  }
  return false;
}

export function hostnameLooksUnsafe(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host.endsWith('.internal') || host.endsWith('.lan')) return true;
  if (isIP(host) && isBlockedIp(host)) return true;
  return false;
}

export function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const value = match[1].trim();
    if (value) locs.push(value);
  }
  return [...new Set(locs)];
}

export function htmlToMarkdown(html: string): { title: string; body: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  let title = decodeEntities(stripTags(titleMatch?.[1] || ogMatch?.[1] || '')).trim().slice(0, 300);
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h([1-6])[^>]*>/gi, (_, n) => `\n${'#'.repeat(Number(n))} `);
  text = decodeEntities(stripTags(text));
  text = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 80_000);
  if (!title) {
    const heading = text.match(/^#{1,3}\s+(.+)$/m);
    const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean);
    title = (heading?.[1] || firstLine || 'Untitled').slice(0, 300);
  }
  return { title, body: text || title };
}

export function slugFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const raw =
      parsed.pathname
        .replace(/\/+$/, '')
        .split('/')
        .filter(Boolean)
        .pop() || parsed.hostname;
    const cleaned = raw
      .replace(/\.(html?|php|aspx?|xml|md)$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return cleaned || `page-${Math.abs(hashString(url)).toString(36)}`;
  } catch {
    return `page-${Math.abs(hashString(url)).toString(36)}`;
  }
}

export async function assertSafeHttpsUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only https URLs are allowed');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with credentials are not allowed');
  }
  if (hostnameLooksUnsafe(parsed.hostname)) {
    throw new Error('Host is not allowed');
  }
  const { address } = await lookup(parsed.hostname, { all: false });
  if (isBlockedIp(address)) {
    throw new Error('Host resolves to a private or reserved address');
  }
  return parsed;
}

export async function pullSiteFromSitemap(input: {
  slug: string;
  workspaceId?: string;
  sitemapUrl?: string | null;
  maxPages?: number;
}): Promise<SitePullResult> {
  const site = getSiteBySlug(input.slug, input.workspaceId);
  if (!site) {
    return {
      ok: false,
      slug: input.slug,
      sitemapUrl: null,
      fetched: 0,
      upserted: 0,
      skipped: 0,
      errors: ['site_not_found'],
      note: 'Site not found in this workspace.',
    };
  }

  const sitemapUrl =
    (input.sitemapUrl || site.sitemapUrl || inferSitemapUrl(site.domain) || '').trim() || null;
  if (!sitemapUrl) {
    const note = 'No sitemap URL. Set sitemapUrl or a public https domain first.';
    recordSitePull(site.slug, note, site.workspaceId);
    return {
      ok: false,
      slug: site.slug,
      sitemapUrl: null,
      fetched: 0,
      upserted: 0,
      skipped: 0,
      errors: ['sitemap_missing'],
      note,
    };
  }

  if (input.sitemapUrl && input.sitemapUrl !== site.sitemapUrl) {
    upsertSite(
      {
        slug: site.slug,
        name: site.name,
        domain: site.domain,
        description: site.description,
        sitemapUrl: input.sitemapUrl,
      },
      site.workspaceId
    );
  }

  const errors: string[] = [];
  let fetched = 0;
  let upserted = 0;
  let skipped = 0;
  const maxPages = Math.min(Math.max(input.maxPages ?? MAX_PAGES, 1), MAX_PAGES);

  try {
    const sitemapXml = await fetchText(sitemapUrl);
    fetched += 1;
    const locs = parseSitemapLocs(sitemapXml).filter((loc) => !loc.toLowerCase().endsWith('.xml'));
    const pageUrls = locs.slice(0, maxPages);
    if (!pageUrls.length) {
      const note = `Sitemap fetched but no page <loc> entries (index-only or empty). Crawl observation ≠ inclusion.`;
      recordSitePull(site.slug, note, site.workspaceId);
      return {
        ok: true,
        slug: site.slug,
        sitemapUrl,
        fetched,
        upserted,
        skipped,
        errors,
        note,
      };
    }

    for (const pageUrl of pageUrls) {
      try {
        const html = await fetchText(pageUrl);
        fetched += 1;
        const { title, body } = htmlToMarkdown(html);
        if (!body.trim()) {
          skipped += 1;
          continue;
        }
        const result = upsertSiteContent(
          site.slug,
          {
            slug: uniqueSlug(site.slug, slugFromUrl(pageUrl), pageUrl),
            title,
            summary: body.slice(0, 180).replace(/\s+/g, ' '),
            bodyMd: body,
            canonicalUrl: pageUrl,
            tags: ['sitemap-pull'],
          },
          site.workspaceId
        );
        if (result.ok) upserted += 1;
        else skipped += 1;
      } catch (error: any) {
        skipped += 1;
        errors.push(`${pageUrl}: ${error?.message || String(error)}`);
      }
    }
  } catch (error: any) {
    const note = `Sitemap pull failed: ${error?.message || String(error)}`;
    recordSitePull(site.slug, note, site.workspaceId);
    return {
      ok: false,
      slug: site.slug,
      sitemapUrl,
      fetched,
      upserted,
      skipped,
      errors: [error?.message || String(error)],
      note,
    };
  }

  const note = `Pulled ${upserted} pages from sitemap (${skipped} skipped). This is local sync + crawl observation, not proof of search/LLM inclusion.`;
  recordSitePull(site.slug, note, site.workspaceId);
  return {
    ok: upserted > 0 || errors.length === 0,
    slug: site.slug,
    sitemapUrl,
    fetched,
    upserted,
    skipped,
    errors: errors.slice(0, 8),
    note,
  };
}

function inferSitemapUrl(domain: string | null): string | null {
  if (!domain) return null;
  const host = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  if (!host || hostnameLooksUnsafe(host)) return null;
  return `https://${host}/sitemap.xml`;
}

function uniqueSlug(siteSlug: string, base: string, canonicalUrl?: string): string {
  if (canonicalUrl) {
    const existing = listSiteContent(siteSlug, { limit: 200 }).find(
      (item) => item.canonicalUrl === canonicalUrl
    );
    if (existing) return existing.slug;
  }
  if (!getSiteContent(siteSlug, base)) return base;
  return `${base}-${Math.abs(hashString(canonicalUrl || base)).toString(36).slice(0, 6)}`;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ');
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

async function fetchText(rawUrl: string): Promise<string> {
  let current = rawUrl;
  for (let hop = 0; hop < 4; hop += 1) {
    const safe = await assertSafeHttpsUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_MS);
    try {
      const response = await fetch(safe.toString(), {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/*,application/xml,application/json' },
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`Redirect without Location (${response.status})`);
        current = new URL(location, safe).toString();
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const length = Number(response.headers.get('content-length') || 0);
      if (length > MAX_BYTES) throw new Error('Response too large');
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_BYTES) throw new Error('Response too large');
      return buffer.toString('utf8');
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Too many redirects');
}
