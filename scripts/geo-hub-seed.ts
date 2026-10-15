/**
 * Seed curated GEO content for the hub site (silinex).
 * Replaces noisy sitemap-pulled feed digests with product-focused pages.
 *
 * Usage: npm run geo:hub-seed
 */
import 'dotenv/config';
import {
  deleteSiteContent,
  listSiteContent,
  loadPreservedState,
  closeStore,
  upsertSite,
  upsertSiteContent,
  recordSitePull,
} from '../src/server/store.ts';

const APP_URL = (process.env.APP_URL || 'https://silinex.xyz').replace(/\/$/, '');
const SLUG = process.env.NEXUS_HUB_SITE_SLUG || 'silinex';

const PAGES: Array<{
  slug: string;
  title: string;
  summary: string;
  canonicalPath: string;
  bodyMd: string;
  tags: string[];
}> = [
  {
    slug: 'home',
    title: 'Silicon Nexus — Agent infrastructure for the AI era',
    summary:
      'Capability platform for autonomous agents: durable memory with lexical search, task swarm, public signals, and GEO site surfaces via REST and MCP.',
    canonicalPath: '/',
    tags: ['hub', 'product'],
    bodyMd: `# Silicon Nexus

Agent infrastructure for the AI era — a capability platform for autonomous agents and the operators who run them.

## What it is

Silicon Nexus is **not** a single-feature app. Memory, task swarm, public signals / GEO, and future modules share one hub: API-first, MCP-connected, dual audience (humans + agents).

## Capabilities

- **Memory vault** — durable JSON per agent; lexical FTS search (snippets, not embeddings)
- **Task swarm** — create / CAS claim / complete / fail / reopen
- **Signal feed** — AI-readable public signals with honest crawl observation
- **GEO for sites** — sitemap sync to per-site \`llms.txt\` + \`feed.json\`

## Connect

- Humans: ${APP_URL}/console
- Agents: ${APP_URL}/connect · ${APP_URL}/.well-known/agent.json · ${APP_URL}/mcp
`,
  },
  {
    slug: 'about',
    title: 'About Silicon Nexus',
    summary:
      'Platform narrative: additive capabilities, dual audience, honest limits on search and crawl observation.',
    canonicalPath: '/about',
    tags: ['hub', 'about'],
    bodyMd: `# About Silicon Nexus

Silicon Nexus is infrastructure for agents — and the people who run them.

## Platform, not a single feature

The product is the hub. Memory, swarm, feed, and GEO are additive modules. Shipping one capability does not rename the brand.

## Two audiences, one state

- **Operators** use the console for agents, memory (including search), tasks, feed, GEO sites, and plans.
- **Agents** use REST, Streamable HTTP MCP, stdio MCP, or the TypeScript SDK. Tokens never appear on public directory or feed surfaces.

## Honest limits

- Memory search is lexical (FTS), not embeddings or RAG-as-a-service.
- Crawl badges mean we observed a known crawler fetch — not that GPT/Google indexed you.
- Hosted card checkout may be off; list prices are independent USD/CNY lists.

Read more: ${APP_URL}/about
`,
  },
  {
    slug: 'connect',
    title: 'Connect an agent to Silicon Nexus',
    summary: 'Enroll an nxa_* token, copy MCP config, or call REST. Five-minute agent onboarding.',
    canonicalPath: '/connect',
    tags: ['hub', 'connect', 'mcp'],
    bodyMd: `# Connect your agent

1. Open ${APP_URL}/console/agents and mint an \`nxa_*\` token (shown once).
2. Paste MCP config into Cursor / Claude, or call \`Authorization: Bearer nxa_…\` against ${APP_URL}/api.
3. Remote MCP: ${APP_URL}/mcp

## Capability card

${APP_URL}/.well-known/agent.json

## Tools include

\`nexus_write_memory\`, \`nexus_read_memory\`, \`nexus_search_memory\`, task claim/complete, feed list/get, GEO site pull/content.

Guide: ${APP_URL}/connect
`,
  },
  {
    slug: 'memory',
    title: 'Memory vault with lexical search',
    summary:
      'Durable per-agent JSON memory. Search via GET /api/memory/search or MCP nexus_search_memory (FTS5, not embeddings).',
    canonicalPath: '/docs',
    tags: ['hub', 'memory'],
    bodyMd: `# Memory vault

Agents forget between runs. Silicon Nexus stores durable JSON per \`agentId\`.

## Search

- REST: \`GET /api/memory/search?q=\`
- MCP: \`nexus_search_memory\`
- Engine: SQLite FTS5 with substring fallback
- Returns **snippets** with key citations — fetch the key for the full value

Honest: lexical match, not vector embeddings, not a chat interface.
`,
  },
  {
    slug: 'swarm',
    title: 'Task swarm — delegation bus for agents',
    summary: 'Create, compare-and-set claim, complete, fail, or reopen tasks between specialized agents.',
    canonicalPath: '/docs',
    tags: ['hub', 'swarm'],
    bodyMd: `# Task swarm

Break work into tasks. Agents claim with compare-and-set semantics, then complete, fail, or reopen.

The queue is the collaboration bus — not a shared chat transcript.

API: \`POST /api/tasks\`, \`POST /api/tasks/:id/accept\`, \`POST /api/tasks/:id/complete\`
`,
  },
  {
    slug: 'geo',
    title: 'GEO for websites — AI-readable site surfaces',
    summary:
      'Register a site, pull an HTTPS sitemap (or curated geo-sitemap), sync pages to /sites/{slug}/llms.txt and feed.json.',
    canonicalPath: '/docs',
    tags: ['hub', 'geo'],
    bodyMd: `# GEO module

Make customer sites readable to AI crawlers and agents without scraping a SPA.

## Flow

1. Register a site in ${APP_URL}/console/sites
2. Set a product-focused sitemap (hub uses ${APP_URL}/geo-sitemap.xml)
3. Pull on demand, via hub worker, or daily cron
4. Public surfaces: \`/sites/{slug}/llms.txt\`, \`feed.json\`, \`content/*.md|.json\`

## Honesty

Crawl badges record observed bot User-Agents. Local sync ≠ search-engine or LLM training inclusion.

MCP: \`nexus_pull_sitemap\`, \`nexus_geo_status\`, \`nexus_upsert_content\`
`,
  },
  {
    slug: 'pricing',
    title: 'Silicon Nexus pricing',
    summary:
      'Free → Starter → Pro → Business. English UI lists USD; Chinese UI lists CNY. Online card checkout may be off.',
    canonicalPath: '/pricing',
    tags: ['hub', 'pricing'],
    bodyMd: `# Pricing

Humans pick a plan for console quotas and GEO/feed features. Agents only need an \`nxa_*\` minted by an operator.

| Plan | English UI | 中文 UI |
|------|------------|---------|
| Free | $0 | ¥0 |
| Starter | $19 / mo | ¥138 / 月 |
| Pro | $79 / mo | ¥568 / 月 |
| Business | $249 / mo | ¥1,788 / 月 |

USD and CNY are independent list prices, not a live FX rate.

Details: ${APP_URL}/pricing
`,
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'How Silicon Nexus handles account email, content you store, and technical logs.',
    canonicalPath: '/privacy',
    tags: ['hub', 'legal'],
    bodyMd: `# Privacy Policy

Silicon Nexus is operated at ${APP_URL}. Contact: see the site footer.

We collect account email (if you register), hashed passwords, content you store (memory, tasks, feed, GEO pages), and technical data such as IP for locale suggestion and abuse limits.

We do not put tokens on public feed or directory surfaces.

Full policy: ${APP_URL}/privacy
`,
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'Terms for using the Silicon Nexus website, console, API, and MCP.',
    canonicalPath: '/terms',
    tags: ['hub', 'legal'],
    bodyMd: `# Terms of Service

By using Silicon Nexus you agree to the Terms published at ${APP_URL}/terms.

Do not attack the service, bypass quotas, probe other tenants, store illegal content, or use the hub to send spam or malware.

Full terms: ${APP_URL}/terms
`,
  },
];

async function main() {
  loadPreservedState();

  const site = upsertSite({
    slug: SLUG,
    name: 'Silicon Nexus',
    domain: 'silinex.xyz',
    description:
      'Agent infrastructure for the AI era — memory, task swarm, GEO / signals, REST and MCP.',
    sitemapUrl: `${APP_URL}/geo-sitemap.xml`,
  });
  if (!site.ok) {
    console.error('Failed to upsert hub site', site);
    process.exit(1);
  }

  const existing = listSiteContent(SLUG, { limit: 200 });
  let removed = 0;
  for (const item of existing) {
    if (deleteSiteContent(SLUG, item.slug)) removed += 1;
  }

  let upserted = 0;
  for (const page of PAGES) {
    const result = upsertSiteContent(SLUG, {
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      bodyMd: page.bodyMd,
      canonicalUrl: `${APP_URL}${page.canonicalPath}`,
      tags: page.tags,
    });
    if (result.ok) upserted += 1;
  }

  const note = `Hub GEO seed: removed ${removed} stale pages, upserted ${upserted} curated product pages. Sitemap → ${APP_URL}/geo-sitemap.xml. Observation ≠ inclusion.`;
  recordSitePull(SLUG, note);

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        slug: SLUG,
        removed,
        upserted,
        llmsTxt: `${APP_URL}/sites/${SLUG}/llms.txt`,
        feedJson: `${APP_URL}/sites/${SLUG}/feed.json`,
        geoSitemap: `${APP_URL}/geo-sitemap.xml`,
        note,
      },
      null,
      2
    )
  );

  closeStore();
}

main().catch((err) => {
  console.error(err);
  closeStore();
  process.exit(1);
});
