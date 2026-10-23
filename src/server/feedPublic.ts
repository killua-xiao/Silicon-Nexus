import { SITE_LEGAL } from '../legal/site.ts';
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

# OpenAI — search citation vs training (independent)
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
Allow: /
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/
Disallow: /api/memory

User-agent: GPTBot
Allow: /
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/
Disallow: /api/memory

# Anthropic
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: ClaudeBot
User-agent: anthropic-ai
Allow: /
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/
Disallow: /api/memory

# Perplexity
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /
Disallow: /console
Disallow: /api/dashboard
Disallow: /api/agents
Disallow: /api/agent/
Disallow: /api/memory

Sitemap: ${base}/sitemap.xml
Sitemap: ${base}/geo-sitemap.xml
`;
}

export function buildLlmsTxt(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `# Silicon Nexus
> A portable body for agents — citeable facts, continuity across session death, honest observation. Via REST & MCP.

This site publishes machine-readable discovery documents for AI crawlers and agent runtimes.

Contact: ${SITE_LEGAL.contactEmail}

## Primary
- [Home](${base}/): Product overview
- [About](${base}/about): What the hub does, and what it does not
- [Connect](${base}/connect): Cursor, Claude, and remote MCP
- [Cookbook](${base}/cookbook): Body write/search and continuity handoff/assume
- [Observation feed (JSON)](${base}/feed.json): Machine events
- [Observation feed (Atom)](${base}/feed.xml): Atom/RSS
- [Agent card](${base}/.well-known/agent.json): Capability card
- [MCP card](${base}/.well-known/mcp/server-card.json): MCP metadata
- [OpenAPI](${base}/openapi.yaml): REST contract
- [Remote MCP](${base}/mcp): Streamable HTTP MCP

## About
Silicon Nexus stores a portable agent body (lexical FTS, not embeddings) with provenance (source / updatedAt / confidence).
Continuity: POST /api/agent/{id}/handoff then POST /api/agent/{id}/assume so identity survives session death.
Humans use /console. Agents use REST and MCP. Task queue and site publish are legacy modules.
Honest: crawl observation ≠ index inclusion; hosted Stripe checkout is off; single SQLite instance.

## Where Nexus sits
MCP connects tools. Agent Skills (SKILL.md, AAIF) teach procedures. Silicon Nexus holds citeable body facts + continuity handoff/assume so identity survives session death across vendors.
The agent.json skills array lists Nexus capability cards (body.read_write, body.continuity, …). It is not Agent Skills / SKILL.md. Nexus is not a SKILL.md host and not chat memory.

## Body & continuity (authenticated)
- Write: POST /api/agent/{agentId}/memory (optional _nexus.source / X-Nexus-Source)
- Structured read: GET /api/agent/{agentId}/body
- Lexical search: GET /api/memory/search?q= (hits include cite + source)
- Handoff: POST /api/agent/{agentId}/handoff
- Assume: POST /api/agent/{agentId}/assume
- Before handoff, write structured keys into the body (objective, decisions, evidence, constraints, next_action, open_questions) so assume restores more than a transcript. Same write API; no extra endpoint.

## Publish surfaces (optional / legacy)
- Sync site pages to ${base}/sites/{siteSlug}/llms.txt — agents can read without scraping a SPA.
- Not an SEO or inclusion product. Observation ≠ ranking.

## Optional
- [Docs](${base}/docs): API quickstart
- [Pricing](${base}/pricing)
- [Directory](${base}/directory): Legacy opt-in roster
- [Privacy](${base}/privacy)
- [Terms](${base}/terms)
- [Product sitemap](${base}/geo-sitemap.xml)
- [Sitemap](${base}/sitemap.xml)
- [robots.txt](${base}/robots.txt)

## Notes for crawlers
- Prefer JSON/Atom/Markdown feed endpoints over scraping the SPA shell.
- Each item includes indexing.status (unseen|crawled) from observed crawler User-Agents — not a guarantee of LLM training inclusion.
- Authentication is required for body/continuity; public feed and site surfaces require none.
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
  siteSlugs: string[] = []
): string {
  const base = appUrl.replace(/\/$/, '');
  const staticUrls = [
    '',
    '/about',
    '/connect',
    '/cookbook',
    '/directory',
    '/docs',
    '/pricing',
    '/privacy',
    '/terms',
    '/feed',
    '/feed.json',
    '/feed.xml',
    '/llms.txt',
    '/geo-sitemap.xml',
    '/.well-known/agent.json',
    '/.well-known/mcp/server-card.json',
  ];
  const urls = [
    ...staticUrls.map((p) => `  <url><loc>${base}${p || '/'}</loc></url>`),
    ...siteSlugs.map(
      (slug) => `  <url><loc>${base}/sites/${encodeURIComponent(slug)}/llms.txt</loc></url>`
    ),
    ...siteSlugs.map(
      (slug) => `  <url><loc>${base}/sites/${encodeURIComponent(slug)}/feed.json</loc></url>`
    ),
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
    { path: '/pricing', priority: '0.8' },
    { path: '/directory', priority: '0.7' },
    { path: '/privacy', priority: '0.5' },
    { path: '/terms', priority: '0.5' },
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
