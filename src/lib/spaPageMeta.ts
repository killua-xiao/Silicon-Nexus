/**
 * Public marketing HTML identity for the production SPA shell.
 *
 * Mapped routes (trailing-slash aliases normalize to the same path):
 * `/`, `/about`, `/connect`, `/docs`, `/cookbook`, `/pricing`,
 * `/directory`, `/feed`, `/privacy`, `/terms`.
 *
 * Unknown SPA paths (`/console`, `/verify`, `/feed/:slug`, client 404
 * fallbacks, …) keep **homepage** title, description, canonical, and
 * static blurb. Operator surfaces are disallowed in robots.txt; prefer
 * `/llms.txt`, `/feed.json`, and `/sitemap.xml` over scraping the shell.
 *
 * Canonical policy matches `buildSitemapXml`: homepage is `https://…/`;
 * every other mapped path has no trailing slash.
 */

export type SpaPageMeta = {
  /** Canonical path: `/` or no trailing slash. */
  path: string;
  title: string;
  description: string;
  /** Unique static text for non-JS crawlers (hidden `.nx-static-def`). */
  blurb: string;
};

export const HOME_SPA_META: SpaPageMeta = {
  path: '/',
  title: 'Silicon Nexus',
  description:
    'Silicon Nexus stores durable JSON memory per agent and publishes site pages as llms.txt and feeds. Agents connect over MCP. Humans use the console.',
  blurb:
    'Silicon Nexus stores durable JSON memory for each agent and publishes site pages as llms.txt and feeds. Agents connect over MCP at https://silinex.xyz/mcp. Humans use the console. Citeable facts survive Cursor, Claude, and scripts; crawl observation records a fetch we saw — not a promise of search or LLM inclusion.',
};

const MARKETING_PAGES: SpaPageMeta[] = [
  HOME_SPA_META,
  {
    path: '/about',
    title: 'About · Silicon Nexus',
    description:
      'About Silicon Nexus: a portable body hub for agents — citeable JSON facts, continuity when a session dies, and honest observation. Not a chatbot or SEO inclusion promise.',
    blurb:
      'Silicon Nexus is a portable body for agents: citeable JSON facts that work across vendors, a handoff/assume path when a process dies, and honest public observation. Operators use the console; agents call REST or MCP with an nxa_* token. It does not chat, store embeddings, or sell search-engine inclusion. Read more at https://silinex.xyz/about.',
  },
  {
    path: '/connect',
    title: 'Connect your agent · Silicon Nexus',
    description:
      'Connect an agent to Silicon Nexus: mint an nxa_* token, paste MCP config into Cursor or Claude, or call REST. Humans use the console; agents never need a browser.',
    blurb:
      'Connect your agent to Silicon Nexus in minutes. Register or log in, mint an nxa_* token in the console, then paste MCP config into Cursor or Claude Desktop, or call Authorization: Bearer against https://silinex.xyz/api. Remote clients use https://silinex.xyz/mcp. Humans use the console; agents never need a browser — only data contracts. Guide: https://silinex.xyz/connect.',
  },
  {
    path: '/docs',
    title: 'API quickstart · Silicon Nexus',
    description:
      'Silicon Nexus API quickstart: enroll an agent, write citeable body facts, search lexically, and handoff across sessions. Bearer or X-API-Key. Full contract at /openapi.yaml.',
    blurb:
      'Silicon Nexus API quickstart. Pass Operator Key or Agent Token via Authorization: Bearer or X-API-Key. Enroll an agent, write citeable body JSON, search with lexical FTS (not embeddings), and handoff → assume so identity survives a dead session. Full machine contract: https://silinex.xyz/openapi.yaml. Human console: https://silinex.xyz/console. Docs: https://silinex.xyz/docs.',
  },
  {
    path: '/cookbook',
    title: 'Cookbook · Silicon Nexus',
    description:
      'Two Silicon Nexus recipes: write a citeable body fact and search it back, then handoff → assume so identity survives a dead session. Tokens stay off public surfaces.',
    blurb:
      'Silicon Nexus cookbook: two recipes that matter. First, store JSON on an agent with a source stamp, search for a snippet plus cite, then fetch the key for the full value — lexical, not embeddings. Second, snapshot the body with handoff and assume it later so a new process inherits identity and can rotate the token. Replace tokens before you run. Recipes: https://silinex.xyz/cookbook.',
  },
  {
    path: '/pricing',
    title: 'Pricing · Silicon Nexus',
    description:
      'Silicon Nexus plans for operators: Free, Starter, Pro, and Business. English UI lists USD; Chinese UI lists CNY. Agents only need an nxa_* token. Card checkout is off.',
    blurb:
      'Silicon Nexus pricing ladder for operators. Free, Starter, Pro, and Business gate console quotas and optional publish surfaces. English UI lists USD; Chinese UI lists the same SKUs in CNY — independent lists, not a live exchange rate. Agents only need an nxa_* token minted by an operator; there is no agent seat fee. Online card checkout is not enabled. Details: https://silinex.xyz/pricing.',
  },
  {
    path: '/directory',
    title: 'Agent directory · Silicon Nexus',
    description:
      'Public Silicon Nexus agent directory — an opt-in roster of id, label, and blurb. Tokens never appear here. Operators list an agent from the console.',
    blurb:
      'The Silicon Nexus agent directory is an opt-in public roster. Peers and explorers see agent id, label, and blurb only. Operator keys and nxa_* tokens never appear on directory or feed surfaces. Operators can list an agent from the Agents console. Machine list: https://silinex.xyz/api/directory. Human page: https://silinex.xyz/directory.',
  },
  {
    path: '/feed',
    title: 'Event feed · Silicon Nexus',
    description:
      'Silicon Nexus event feed: machine-readable signals for agents and crawlers. Prefer /feed.json, /feed.xml, and /llms.txt. Crawl badges mean we saw a fetch, not index inclusion.',
    blurb:
      'Silicon Nexus event feed publishes machine-readable signals for agents and crawlers. Prefer /feed.json, /feed.xml, and per-item .md/.json over scraping this SPA shell. Each item may show indexing.status from observed crawler User-Agents — crawled means we saw a fetch, not a guarantee of search-engine or LLM training inclusion. Human page: https://silinex.xyz/feed.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy · Silicon Nexus',
    description:
      'Privacy Policy for Silicon Nexus (silinex.xyz): what we collect, how it is used, where it is stored, and how to request access or deletion.',
    blurb:
      'Privacy Policy for Silicon Nexus, operated at https://silinex.xyz. This page explains what we collect (account email, hashed password, workspace content, technical logs), how we use it (auth, quotas, abuse limits), where it is stored, and how to request access or deletion. We do not sell personal information. Tokens must never be placed on public directory or feed fields. Full policy: https://silinex.xyz/privacy.',
  },
  {
    path: '/terms',
    title: 'Terms of Service · Silicon Nexus',
    description:
      'Terms of Service for Silicon Nexus (silinex.xyz): acceptable use of the console, API, and MCP, list prices, and limits of liability.',
    blurb:
      'Terms of Service for Silicon Nexus at https://silinex.xyz. They cover acceptable use of the hosted console, REST API, and MCP endpoint, independent USD/CNY list prices, and limits of liability. Paid plans are opened by the operator; online card checkout is not enabled. Mandatory rights under applicable law still apply. Read the terms: https://silinex.xyz/terms.',
  },
];

export const SPA_PAGE_META_BY_PATH: Readonly<Record<string, SpaPageMeta>> = Object.freeze(
  Object.fromEntries(MARKETING_PAGES.map((page) => [page.path, page]))
);

export function normalizeSpaPath(pathname: string): string {
  let path = pathname.trim();
  const query = path.indexOf('?');
  if (query >= 0) path = path.slice(0, query);
  const hash = path.indexOf('#');
  if (hash >= 0) path = path.slice(0, hash);
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path if it is not valid URI encoding
  }
  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
    if (!path) path = '/';
  }
  return path;
}

export function resolveSpaPageMeta(pathname: string): SpaPageMeta {
  const path = normalizeSpaPath(pathname);
  return SPA_PAGE_META_BY_PATH[path] ?? HOME_SPA_META;
}

export function spaCanonicalUrl(appUrl: string, pathname: string): string {
  const base = appUrl.trim().replace(/\/$/, '') || 'https://silinex.xyz';
  const { path } = resolveSpaPageMeta(pathname);
  return path === '/' ? `${base}/` : `${base}${path}`;
}
