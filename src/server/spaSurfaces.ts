/** Paths that must never fall through to the production SPA index.html. */
export function isSpaCatchAllExcluded(path: string): boolean {
  return (
    path.startsWith('/api') ||
    path === '/health' ||
    path === '/ready' ||
    path === '/openapi.yaml' ||
    path === '/openapi.json' ||
    path === '/agent.json' ||
    path === '/.well-known/agent.json' ||
    path === '/.well-known/llms.txt' ||
    path === '/.well-known/mcp/server-card.json' ||
    path === '/.well-known/openapi.json' ||
    path === '/.well-known/openapi.yaml' ||
    path === '/robots.txt' ||
    path === '/llms.txt' ||
    path === '/sitemap.xml' ||
    path === '/geo-sitemap.xml' ||
    path === '/feed.json' ||
    path === '/feed.xml' ||
    /\.md$/i.test(path) ||
    (path.startsWith('/feed/') && /\.json$/i.test(path)) ||
    (path.startsWith('/sites/') &&
      (/llms\.txt$/i.test(path) || /feed\.json$/i.test(path) || /\.json$/i.test(path))) ||
    path === '/mcp' ||
    path.startsWith('/mcp/')
  );
}
