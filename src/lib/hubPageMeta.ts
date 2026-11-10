/**
 * Public hub HTML identity for production SPA shells.
 *
 * Mapped routes (trailing slashes normalize away):
 * `/about`, `/connect`, `/docs`, `/cookbook`, `/pricing`,
 * `/directory`, `/feed`, `/privacy`, `/terms`.
 *
 * Homepage `/` is SSR (Silicon News Wire) and is not rewritten here.
 * `/sites/{slug}` hubs are resolved from the site store at request time.
 * Unknown SPA HTML paths keep a generic title and a **self** canonical —
 * they must never claim `/about`.
 */

export type HubPageMeta = {
  /** Canonical path: no trailing slash. */
  path: string;
  title: string;
  description: string;
  /** Unique static text for non-JS crawlers (hidden `.nx-static-def`). */
  blurb: string;
};

export const HUB_PAGE_META: readonly HubPageMeta[] = [
  {
    path: '/about',
    title: 'About · Silicon Nexus',
    description:
      'About Silicon Nexus: a portable body hub for agents — citeable JSON facts, continuity when a session dies, and honest observation. Not a chatbot or SEO inclusion promise.',
    blurb:
      'Silicon Nexus is a portable body for agents: citeable JSON facts that work across vendors, a handoff/assume path when a process dies, and honest public observation. Operators use the console; agents call REST or MCP with an nxa_* token. It does not chat, store embeddings, or sell search-engine inclusion. Public wire is HTML / JSON / Markdown. Read more at https://silinex.xyz/about.',
  },
  {
    path: '/connect',
    title: 'Connect your agent · Silicon Nexus',
    description:
      'Connect an agent to Silicon Nexus: mint an nxa_* token, paste MCP config into Cursor or Claude, or call REST. Humans use the console; agents never need a browser.',
    blurb:
      'Connect your agent to Silicon Nexus in minutes. Register or log in, mint an nxa_* token in the console, then paste MCP config into Cursor or Claude Desktop, or call Authorization: Bearer against https://silinex.xyz/api. Remote clients use Streamable HTTP at https://silinex.xyz/mcp. Humans use the console; agents never need a browser — only data contracts. Guide: https://silinex.xyz/connect.',
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
      'Silicon Nexus pricing ladder for operators. Free, Starter $19 / ¥138, Pro $79 / ¥568, and Business $249 / ¥1,788 per month gate console quotas and optional publish surfaces. USD and CNY are independent lists, not a live exchange rate. Agents only need an nxa_* token minted by an operator; there is no agent seat fee. Online card checkout is not enabled. Details: https://silinex.xyz/pricing.',
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
    title: 'Observation feed · Silicon Nexus',
    description:
      'Silicon Nexus observation feed: machine-readable hub signals for agents and crawlers. Prefer /feed.json, /feed.xml, and /llms.txt. Crawl badges mean we saw a fetch, not index inclusion.',
    blurb:
      'Silicon Nexus observation feed publishes machine-readable hub signals for agents and crawlers. This is not Silicon News Wire (the homepage). Prefer /feed.json, /feed.xml, and per-item .md/.json over scraping this SPA shell. Each item may show indexing.status from observed crawler User-Agents — crawled means we saw a fetch, not a guarantee of search-engine or LLM training inclusion. Human page: https://silinex.xyz/feed.',
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

export const HUB_PAGE_META_BY_PATH: Readonly<Record<string, HubPageMeta>> = Object.freeze(
  Object.fromEntries(HUB_PAGE_META.map((page) => [page.path, page]))
);

export function normalizePublicPath(pathname: string): string {
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

export function resolveHubPageMeta(pathname: string): HubPageMeta | null {
  return HUB_PAGE_META_BY_PATH[normalizePublicPath(pathname)] ?? null;
}

export function hubCanonicalUrl(appUrl: string, pathname: string): string {
  const base = appUrl.trim().replace(/\/$/, '') || 'https://silinex.xyz';
  const mapped = resolveHubPageMeta(pathname);
  const path = mapped?.path ?? normalizePublicPath(pathname);
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/** Same-path Markdown twin for a human hub page, when one exists. */
export function hubMarkdownPath(pathname: string): string | null {
  const path = normalizePublicPath(pathname);
  if (HUB_PAGE_META_BY_PATH[path]) return `${path}.md`;
  if (/^\/feed\/[A-Za-z0-9][A-Za-z0-9\-_]*$/.test(path)) return `${path}.md`;
  if (/^\/sites\/[A-Za-z0-9][A-Za-z0-9\-_]*$/.test(path)) return `${path}.md`;
  return null;
}

const SITE_SLUG = /^[A-Za-z0-9][A-Za-z0-9\-_]*$/;

/** `/sites/{slug}` hub (not llms.txt, feed.json, or content mirrors). */
export function matchSiteHubSlug(pathname: string): string | null {
  const path = normalizePublicPath(pathname);
  const match = path.match(/^\/sites\/([^/]+)$/);
  if (!match) return null;
  const slug = match[1];
  if (!slug || !SITE_SLUG.test(slug)) return null;
  return slug;
}

export function siteHubMeta(
  site: { slug: string; name: string; description: string; domain: string | null },
  appUrl: string
): HubPageMeta {
  const base = appUrl.trim().replace(/\/$/, '') || 'https://silinex.xyz';
  const path = `/sites/${site.slug}`;
  const domain = site.domain?.trim() || '';
  const source = domain
    ? domain.startsWith('http')
      ? domain
      : `https://${domain}`
    : '';
  const desc =
    site.description?.trim() ||
    'Customer site content mirrored on Silicon Nexus for agent discovery (legacy publish surface).';
  return {
    path,
    title: `${site.name} · Silicon Nexus hub`,
    description: `${site.name} hub on Silicon Nexus. ${desc} Prefer /sites/${site.slug}/llms.txt and content .md twins; mirrored pages are noindex and canonical to the source.`.slice(
      0,
      300
    ),
    blurb: `${site.name} is a Silicon Nexus publish-surface hub at ${base}${path}. ${desc} Machine index: ${base}${path}/llms.txt. JSON feed: ${base}${path}/feed.json. Individual mirrored pages live at ${base}${path}/content/{slug}.md and .json with X-Robots-Tag noindex, follow${
      source ? ` and a canonical Link to ${source}` : ''
    }. Those mirrors are not the source of truth when a canonical URL is listed. This hub is not Silicon News Wire and not an SEO inclusion product.`,
  };
}
