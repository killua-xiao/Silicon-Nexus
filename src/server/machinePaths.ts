import { normalizePublicPath } from '../lib/hubPageMeta.ts';

const KNOWN_EXACT = new Set([
  '/openapi.yaml',
  '/openapi.json',
  '/agent.json',
  '/.well-known/agent.json',
  '/.well-known/agent-card.json',
  '/.well-known/llms.txt',
  '/.well-known/mcp/server-card.json',
  '/.well-known/openapi.json',
  '/.well-known/openapi.yaml',
  '/robots.txt',
  '/llms.txt',
  '/feed.json',
  '/signals.json',
  '/about.md',
  '/docs.md',
  '/connect.md',
  '/cookbook.md',
  '/feed.md',
  '/pricing.md',
  '/directory.md',
  '/privacy.md',
  '/terms.md',
]);

const HUB_MD = /^\/(about|docs|connect|cookbook|feed|pricing|directory|privacy|terms)\.md$/i;
const WIRE_TWIN = /^\/wire\/[^/]+\.(json|md)$/i;
const TOPIC_JSON = /^\/topic\/[^/]+\.json$/i;
const FEED_TWIN = /^\/feed\/[^/]+\.(json|md)$/i;
const SITE_LLMS = /^\/sites\/[^/]+\/llms\.txt$/i;
const SITE_FEED = /^\/sites\/[^/]+\/feed\.json$/i;
const SITE_CONTENT = /^\/sites\/[^/]+\/content\/[^/]+\.(json|md)$/i;
const SITE_HUB_MD = /^\/sites\/[^/]+\.md$/i;

/** Paths crawlers treat as documents: .txt/.json/.yaml/.md and /.well-known/*. */
export function isMachineReadableProbe(pathname: string): boolean {
  const path = normalizePublicPath(pathname);
  if (path === '/.well-known' || path.startsWith('/.well-known/')) return true;
  return /\.(txt|json|ya?ml|md)$/i.test(path);
}

export function isKnownMachinePath(pathname: string): boolean {
  const path = normalizePublicPath(pathname);
  if (KNOWN_EXACT.has(path) || HUB_MD.test(path)) return true;
  return (
    WIRE_TWIN.test(path) ||
    TOPIC_JSON.test(path) ||
    FEED_TWIN.test(path) ||
    SITE_LLMS.test(path) ||
    SITE_FEED.test(path) ||
    SITE_CONTENT.test(path) ||
    SITE_HUB_MD.test(path)
  );
}

/** Unimplemented machine-readable probes must 404 — never the SPA HTML shell. */
export function should404MachinePath(pathname: string): boolean {
  return isMachineReadableProbe(pathname) && !isKnownMachinePath(pathname);
}

export function machine404ContentType(pathname: string): 'json' | 'text' {
  const path = normalizePublicPath(pathname);
  if (/\.json$/i.test(path)) return 'json';
  return 'text';
}
