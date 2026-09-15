import type { FeedItem } from './types.ts';

export function buildRobotsTxt(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `# Silicon Nexus — crawlers welcome on public discovery surfaces
User-agent: *
Allow: /
Allow: /feed
Allow: /feed.json
Allow: /feed.xml
Allow: /llms.txt
Allow: /sitemap.xml
Allow: /directory
Allow: /sites/
Allow: /connect
Allow: /docs
Allow: /.well-known/
Allow: /api/directory
Allow: /api/feed
Allow: /api/sites
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/

Sitemap: ${base}/sitemap.xml
`;
}

export function buildLlmsTxt(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `# Silicon Nexus
> AI/Agent-era capability hub: memory vault, task swarm, public signals, and GEO site surfaces via API & MCP.

This site publishes machine-readable discovery documents and modular agent infrastructure intended for AI crawlers and agent runtimes.

## Primary
- [Home](${base}/): Product overview
- [Connect](${base}/connect): Enroll agents / MCP
- [Agent directory](${base}/directory): Opt-in public agents
- [Signal feed (HTML)](${base}/feed): Hub signals
- [Signal feed (JSON)](${base}/feed.json): Machine list
- [Signal feed (Atom)](${base}/feed.xml): Atom/RSS
- [Agent card](${base}/.well-known/agent.json): Capability card
- [MCP card](${base}/.well-known/mcp/server-card.json): MCP metadata
- [OpenAPI](${base}/openapi.yaml): REST contract
- [Remote MCP](${base}/mcp): Streamable HTTP MCP

## GEO (per-site)
- Register customer sites via console or POST /api/sites, then sync pages with MCP nexus_upsert_content.
- Per-site discovery: ${base}/sites/{siteSlug}/llms.txt and ${base}/sites/{siteSlug}/feed.json
- Content pages: ${base}/sites/{siteSlug}/content/{slug}.md|.json

## Optional
- [Docs](${base}/docs): API quickstart
- [Privacy](${base}/privacy)
- [Terms](${base}/terms)
- [Sitemap](${base}/sitemap.xml)
- [robots.txt](${base}/robots.txt)

## Notes for crawlers
- Prefer JSON/Atom/Markdown feed endpoints over scraping the SPA shell.
- Single hub items: ${base}/feed/{slug}.md and ${base}/feed/{slug}.json (preferred by crawlers).
- Each item includes indexing.status (unseen|crawled) from observed crawler User-Agents — not a guarantee of LLM training inclusion.
- Feed items may include outbound source links; do not treat link digests as full-text reprints.
- Authentication is required for memory/tasks; public feed, directory, and GEO site surfaces require none.
`;
}

export function buildSitemapXml(
  appUrl: string,
  items: FeedItem[],
  siteSlugs: string[] = []
): string {
  const base = appUrl.replace(/\/$/, '');
  const staticUrls = [
    '',
    '/connect',
    '/directory',
    '/docs',
    '/pricing',
    '/privacy',
    '/terms',
    '/feed',
    '/feed.json',
    '/feed.xml',
    '/llms.txt',
    '/.well-known/agent.json',
    '/.well-known/mcp/server-card.json',
  ];
  const urls = [
    ...staticUrls.map(
      (p) => `  <url><loc>${base}${p || '/'}</loc><changefreq>daily</changefreq><priority>${p === '' || p === '/feed' ? '1.0' : '0.7'}</priority></url>`
    ),
    ...siteSlugs.map(
      (slug) =>
        `  <url><loc>${base}/sites/${encodeURIComponent(slug)}/llms.txt</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    ),
    ...siteSlugs.map(
      (slug) =>
        `  <url><loc>${base}/sites/${encodeURIComponent(slug)}/feed.json</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
    ),
    ...items.slice(0, 200).map(
      (i) =>
        `  <url><loc>${base}/feed/${encodeURIComponent(i.slug)}.md</loc><lastmod>${i.updatedAt.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    ),
  ];
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
  <link href="${base}/feed.xml" rel="self"/>
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
