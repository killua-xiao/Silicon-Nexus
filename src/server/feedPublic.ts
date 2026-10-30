import { SITE_LEGAL } from '../legal/site.ts';
import type { FeedItem } from './types.ts';
import { WIRE_CATEGORIES } from './wireTypes.ts';

export type WireSitemapArticle = {
  slug: string;
  dateModified: string;
};

function robotsBlock(agents: string[]): string {
  const ua = agents.map((a) => `User-agent: ${a}`).join('\n');
  return `${ua}
Allow: /
Allow: /wire
Allow: /topic
Allow: /feed
Allow: /feed.json
Allow: /feed.xml
Allow: /llms.txt
Allow: /sitemap.xml
Allow: /.well-known/
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/
Disallow: /api/memory
`;
}

export function buildRobotsTxt(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `# Silicon Nexus — public wire and discovery surfaces are crawlable.
# Content-Signal is a formal robots directive (not a comment).
# search = indexing for search results; ai-input = grounding/citation; ai-train = training.
# These files lower parse cost. They do not promise ranking or model citation.

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Allow: /wire
Allow: /topic
Allow: /feed
Allow: /feed.json
Allow: /feed.xml
Allow: /llms.txt
Allow: /geo-sitemap.xml
Allow: /sitemap.xml
Allow: /directory
Allow: /sites/
Allow: /connect
Allow: /about
Allow: /docs
Allow: /.well-known/
Allow: /api/directory
Allow: /api/feed
Allow: /api/sites
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/
Disallow: /api/memory

${robotsBlock(['Googlebot', 'Googlebot-News', 'Google-Extended'])}
${robotsBlock(['bingbot', 'BingPreview'])}
${robotsBlock(['OAI-SearchBot', 'ChatGPT-User'])}
${robotsBlock(['GPTBot'])}
${robotsBlock(['Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'anthropic-ai'])}
${robotsBlock(['PerplexityBot', 'Perplexity-User'])}
${robotsBlock(['Applebot', 'Bytespider', 'CCBot', 'Amazonbot', 'DuckDuckBot'])}

Sitemap: ${base}/sitemap.xml
Sitemap: ${base}/geo-sitemap.xml
`;
}

export function buildLlmsTxt(
  appUrl: string,
  articles: Array<{ slug: string; headline: string }> = []
): string {
  const base = appUrl.replace(/\/$/, '');
  const wireLines =
    articles.length > 0
      ? articles
          .map((a) => `- [${a.headline}](${base}/wire/${encodeURIComponent(a.slug)}.md)`)
          .join('\n')
      : '- (no published dispatches)';
  const topicLines = WIRE_CATEGORIES.map(
    (c) => `- [${c.nameEn}](${base}/topic/${c.slug})`
  ).join('\n');
  return `# Silicon Nexus
> A portable body for agents — citeable facts, continuity across session death, honest observation. Via REST & MCP.
> Public homepage is Silicon News Wire: the same facts in HTML / JSON / Markdown.

This site publishes machine-readable discovery documents for AI crawlers and agent runtimes.

Contact: ${SITE_LEGAL.contactEmail}

## Silicon News Wire
- [Home (SSR)](${base}/): Wire list
- [JSON Feed 1.1](${base}/feed.json): application/feed+json — item id is the canonical HTML URL
- [Atom](${base}/feed.xml)
- [Agent card (A2A)](${base}/.well-known/agent-card.json)
- [Hub agent card](${base}/.well-known/agent.json)

### Dispatches (Markdown)
${wireLines}

### Topics
${topicLines}

Prefer \`/wire/{slug}.md\` or \`/wire/{slug}.json\` over scraping HTML. HTML remains the canonical page.

## Primary
- [About](${base}/about): What the hub does, and what it does not
- [Connect](${base}/connect): Cursor, Claude, and remote MCP
- [Cookbook](${base}/cookbook): Body write/search and continuity handoff/assume
- [Observation feed items](${base}/feed): Crawl badges on hub signals (not the wire)
- [MCP card](${base}/.well-known/mcp/server-card.json): MCP metadata
- [OpenAPI](${base}/openapi.yaml): REST contract
- [Remote MCP](${base}/mcp): Streamable HTTP MCP

## About
Silicon Nexus stores a portable agent body (lexical FTS, not embeddings) with provenance (source / updatedAt / confidence).
Continuity: POST /api/agent/{id}/handoff then POST /api/agent/{id}/assume so identity survives session death.
Humans use /console. Agents use REST and MCP. Task queue and site publish are legacy modules.
Honest: crawl observation ≠ index inclusion; hosted Stripe checkout is off; single SQLite instance.
llms.txt helps agents find Markdown. It is not a Google ranking signal.

## Body & continuity (authenticated)
- Write: POST /api/agent/{agentId}/memory (optional _nexus.source / X-Nexus-Source)
- Structured read: GET /api/agent/{agentId}/body
- Lexical search: GET /api/memory/search?q= (hits include cite + source)
- Handoff: POST /api/agent/{agentId}/handoff
- Assume: POST /api/agent/{agentId}/assume

## Publish surfaces (optional / legacy)
- Sync site pages to ${base}/sites/{siteSlug}/llms.txt — agents can read without scraping a SPA.
- Not an SEO or inclusion product. Observation ≠ ranking.

## Optional
- [Docs](${base}/docs)
- [Directory](${base}/directory): Legacy opt-in roster
- [Privacy](${base}/privacy)
- [Terms](${base}/terms)
- [Product sitemap](${base}/geo-sitemap.xml)
- [Sitemap](${base}/sitemap.xml)
- [robots.txt](${base}/robots.txt)

## Notes for crawlers
- Prefer JSON/Atom/Markdown endpoints over scraping the SPA shell.
- Wire item indexing counts are User-Agent classifications and can be spoofed — not a guarantee of LLM training inclusion.
- Authentication is required for body/continuity; public wire and site surfaces require none.
`;
}

/**
 * Google-facing sitemap. Site content mirrors under /sites/{slug}/content/*.md
 * and *.json are omitted so they are not advertised as independent indexable
 * URLs; agents still discover them via llms.txt and feed.json. lastmod is only
 * the feed item's own updatedAt — never a Nexus pull/sync day.
 */
export function buildSitemapXml(
  appUrl: string,
  items: FeedItem[],
  siteSlugs: string[] = [],
  articles: WireSitemapArticle[] = []
): string {
  const base = appUrl.replace(/\/$/, '');
  const staticUrls = [
    '',
    '/about',
    '/connect',
    '/cookbook',
    '/directory',
    '/docs',
    '/privacy',
    '/terms',
    '/feed',
    '/feed.json',
    '/feed.xml',
    '/llms.txt',
    '/geo-sitemap.xml',
    '/.well-known/agent.json',
    '/.well-known/agent-card.json',
    '/.well-known/mcp/server-card.json',
    ...WIRE_CATEGORIES.map((c) => `/topic/${c.slug}`),
  ];
  const urls = [
    ...staticUrls.map((p) => `  <url><loc>${base}${p || '/'}</loc></url>`),
    ...siteSlugs.map(
      (slug) => `  <url><loc>${base}/sites/${encodeURIComponent(slug)}/llms.txt</loc></url>`
    ),
    ...siteSlugs.map(
      (slug) => `  <url><loc>${base}/sites/${encodeURIComponent(slug)}/feed.json</loc></url>`
    ),
    ...articles.map((a) => {
      const lastmod = a.dateModified.slice(0, 10);
      return `  <url><loc>${base}/wire/${encodeURIComponent(a.slug)}</loc><lastmod>${lastmod}</lastmod></url>`;
    }),
    ...items.slice(0, 200).map(
      (i) =>
        `  <url><loc>${base}/feed/${encodeURIComponent(i.slug)}.md</loc><lastmod>${i.updatedAt.slice(0, 10)}</lastmod></url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

/** Product-focused sitemap for hub GEO pulls — excludes feed digests and discovery mirrors. */
export function buildGeoSitemapXml(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  const paths = [
    { path: '/', priority: '1.0' },
    { path: '/about', priority: '0.9' },
    { path: '/connect', priority: '0.9' },
    { path: '/cookbook', priority: '0.8' },
    { path: '/docs', priority: '0.8' },
    { path: '/directory', priority: '0.7' },
    { path: '/privacy', priority: '0.5' },
    { path: '/terms', priority: '0.5' },
    ...WIRE_CATEGORIES.map((c) => ({ path: `/topic/${c.slug}`, priority: '0.8' })),
  ];
  const urls = paths.map(
    (p) =>
      `  <url><loc>${base}${p.path === '/' ? '/' : p.path}</loc><changefreq>weekly</changefreq><priority>${p.priority}</priority></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

export function buildAtomFeed(appUrl: string, items: FeedItem[]): string {
  const base = appUrl.replace(/\/$/, '');
  const updated = items[0]?.updatedAt || new Date().toISOString();
  const entries = items
    .map((i) => {
      const link = `${base}/feed/${encodeURIComponent(i.slug)}.md`;
      const html = `${base}/feed/${encodeURIComponent(i.slug)}`;
      const summary = escapeXml(i.summary || i.title);
      return `  <entry>
    <title>${escapeXml(i.title)}</title>
    <link href="${link}" rel="alternate" type="text/markdown"/>
    <link href="${html}" rel="alternate" type="text/html"/>
    <id>${html}</id>
    <updated>${i.updatedAt}</updated>
    <published>${i.publishedAt}</published>
    <summary>${summary}</summary>
    <category term="indexing:${i.indexing?.status || 'unseen'}"/>
    <content type="html">${escapeXml(i.bodyMd.slice(0, 4000))}</content>
  </entry>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Silicon Nexus Signals</title>
  <subtitle>AI-readable signals from silinex.xyz</subtitle>
  <link href="${base}/signals.xml" rel="self"/>
  <link href="${base}/feed"/>
  <id>${base}/feed</id>
  <updated>${updated}</updated>
  <author><name>Silicon Nexus</name></author>
${entries}
</feed>
`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
