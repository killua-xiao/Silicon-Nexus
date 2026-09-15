import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  createAuthMiddleware,
  isOpenAuthMode,
  loadOrCreateOperatorKey,
  rateLimitKey,
} from './src/server/auth.ts';
import { createApiRouter, apiErrorHandler } from './src/server/routes.ts';
import { closeStore, flushStateSync, loadPreservedState, probeDatabase } from './src/server/store.ts';
import { logJson } from './src/server/log.ts';
import { buildAgentCard } from './src/server/agentCard.ts';
import { buildMcpServerCard } from './src/server/mcpCard.ts';
import { createMcpHttpRouter } from './src/server/mcpHttp.ts';
import { listFeedItems, getFeedItemBySlug, recordFeedCrawl, getSiteBySlug, listSiteContent, getSiteContent, recordSiteContentCrawl, listSites } from './src/server/store.ts';
import {
  buildAtomFeed,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
} from './src/server/feedPublic.ts';
import { buildSiteFeedJson, buildSiteLlmsTxt } from './src/server/geoPublic.ts';
import { detectCrawler } from './src/server/crawlDetect.ts';
import { handleStripeWebhook } from './src/server/stripeBilling.ts';

const DEFAULT_PUBLIC_URL = 'https://silinex.xyz';

function resolveAppUrl(): string {
  const raw = (process.env.APP_URL || DEFAULT_PUBLIC_URL).trim().replace(/\/$/, '');
  return raw || DEFAULT_PUBLIC_URL;
}

function corsOriginList(appUrl: string): boolean | string[] {
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origins = new Set<string>([appUrl, ...extra]);
  // Local operator / MCP tooling
  origins.add('http://127.0.0.1:3000');
  origins.add('http://localhost:3000');
  if (process.env.NEXUS_CORS_OPEN === '1') return true;
  return [...origins];
}

async function startServer() {
  loadPreservedState();

  const openMode = isOpenAuthMode();
  const { operatorKey, freshlyCreated } = openMode
    ? { operatorKey: '', freshlyCreated: false }
    : loadOrCreateOperatorKey();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const appUrl = resolveAppUrl();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: corsOriginList(appUrl),
      credentials: true,
    })
  );
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    void handleStripeWebhook(req, res);
  });
  app.use(express.json({ limit: '500kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'silicon-nexus', appUrl });
  });

  app.get('/ready', (_req, res) => {
    const ready = probeDatabase();
    if (!ready) {
      return res.status(503).json({ status: 'not_ready', reason: 'database_unavailable' });
    }
    res.status(200).json({ status: 'ready', store: 'sqlite', appUrl });
  });

  app.get('/openapi.yaml', (_req, res) => {
    res.type('text/yaml').sendFile(path.join(process.cwd(), 'docs', 'openapi.yaml'));
  });

  const agentCard = buildAgentCard(appUrl);
  const mcpCard = buildMcpServerCard(appUrl);
  app.get('/.well-known/agent.json', (_req, res) => {
    res.type('application/json').json(agentCard);
  });
  app.get('/agent.json', (_req, res) => {
    res.type('application/json').json(agentCard);
  });
  app.get('/.well-known/mcp/server-card.json', (_req, res) => {
    res.type('application/json').json(mcpCard);
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(buildRobotsTxt(appUrl));
  });
  app.get('/llms.txt', (_req, res) => {
    res.type('text/plain; charset=utf-8').send(buildLlmsTxt(appUrl));
  });
  app.get('/sitemap.xml', (_req, res) => {
    res
      .type('application/xml')
      .send(
        buildSitemapXml(
          appUrl,
          listFeedItems({ limit: 200 }),
          listSites().map((s) => s.slug)
        )
      );
  });
  app.get('/feed.json', (_req, res) => {
    const items = listFeedItems({ limit: 50 });
    res.type('application/json').json({
      title: 'Silicon Nexus Signals',
      home: `${appUrl}/feed`,
      indexingNote:
        'indexing.status=crawled means a known crawler fetched the item URL; not a guarantee of corpus inclusion.',
      items,
    });
  });
  app.get('/feed.xml', (_req, res) => {
    res.type('application/atom+xml').send(buildAtomFeed(appUrl, listFeedItems({ limit: 50 })));
  });

  // Machine-preferred single-item endpoints (record crawler hits)
  app.get('/feed/:slug.json', (req, res) => {
    const slug = req.params.slug.replace(/\.json$/i, '');
    const crawler = detectCrawler(req.get('user-agent') || undefined);
    if (crawler) {
      try {
        recordFeedCrawl(slug, crawler);
      } catch {
        // ignore
      }
    }
    const item = getFeedItemBySlug(slug);
    if (!item) return res.status(404).json({ error: 'Feed item not found' });
    res.type('application/json').json(item);
  });
  app.get('/feed/:slug.md', (req, res) => {
    const slug = req.params.slug.replace(/\.md$/i, '');
    const crawler = detectCrawler(req.get('user-agent') || undefined);
    if (crawler) {
      try {
        recordFeedCrawl(slug, crawler);
      } catch {
        // ignore
      }
    }
    const item = getFeedItemBySlug(slug);
    if (!item) return res.status(404).type('text/plain').send('Not found');
    const header = [
      `---` ,
      `title: ${JSON.stringify(item.title)}`,
      `slug: ${item.slug}`,
      `published: ${item.publishedAt}`,
      `indexing_status: ${item.indexing.status}`,
      `crawl_hits: ${item.indexing.crawlHits}`,
      `crawlers: ${item.indexing.crawlersSeen.join(', ') || 'none'}`,
      `source: ${item.sourceUrl || item.source}`,
      `---`,
      '',
    ].join('\n');
    res.type('text/markdown; charset=utf-8').send(`${header}${item.bodyMd}\n`);
  });

  // Per-site GEO discovery surfaces
  app.get('/sites/:siteSlug/llms.txt', (req, res) => {
    const site = getSiteBySlug(req.params.siteSlug);
    if (!site) return res.status(404).type('text/plain').send('Site not found');
    const items = listSiteContent(site.slug, { limit: 100 });
    res.type('text/plain; charset=utf-8').send(buildSiteLlmsTxt(appUrl, site, items));
  });
  app.get('/sites/:siteSlug/feed.json', (req, res) => {
    const site = getSiteBySlug(req.params.siteSlug);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    const items = listSiteContent(site.slug, { limit: 50 });
    res.type('application/json').json(buildSiteFeedJson(appUrl, site, items));
  });
  app.get('/sites/:siteSlug/content/:slug.json', (req, res) => {
    const siteSlug = req.params.siteSlug;
    const slug = req.params.slug.replace(/\.json$/i, '');
    const crawler = detectCrawler(req.get('user-agent') || undefined);
    if (crawler) {
      try {
        recordSiteContentCrawl(siteSlug, slug, crawler);
      } catch {
        // ignore
      }
    }
    const item = getSiteContent(siteSlug, slug);
    if (!item) return res.status(404).json({ error: 'Content not found' });
    res.type('application/json').json(item);
  });
  app.get('/sites/:siteSlug/content/:slug.md', (req, res) => {
    const siteSlug = req.params.siteSlug;
    const slug = req.params.slug.replace(/\.md$/i, '');
    const crawler = detectCrawler(req.get('user-agent') || undefined);
    if (crawler) {
      try {
        recordSiteContentCrawl(siteSlug, slug, crawler);
      } catch {
        // ignore
      }
    }
    const item = getSiteContent(siteSlug, slug);
    if (!item) return res.status(404).type('text/plain').send('Not found');
    const site = getSiteBySlug(siteSlug);
    const header = [
      `---`,
      `title: ${JSON.stringify(item.title)}`,
      `site: ${siteSlug}`,
      `slug: ${item.slug}`,
      `published: ${item.publishedAt}`,
      `indexing_status: ${item.indexing.status}`,
      `crawl_hits: ${item.indexing.crawlHits}`,
      `crawlers: ${item.indexing.crawlersSeen.join(', ') || 'none'}`,
      site?.domain ? `domain: ${site.domain}` : null,
      item.canonicalUrl ? `canonical: ${item.canonicalUrl}` : null,
      `---`,
      '',
    ]
      .filter((line) => line !== null)
      .join('\n');
    res.type('text/markdown; charset=utf-8').send(`${header}${item.bodyMd}\n`);
  });

  // Remote Streamable HTTP MCP (Smithery / HTTP clients)
  // Call the local API loopback so tools never round-trip through the public edge.
  app.use(
    '/mcp',
    createMcpHttpRouter({
      apiBaseUrl: `http://127.0.0.1:${PORT}/api`,
      openMode,
    })
  );

  // Coarse IP limit
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 600,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Per-credential limit (SaaS quota extension point)
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: Number(process.env.NEXUS_TOKEN_RATE_LIMIT || 300),
      keyGenerator: (req) => rateLimitKey(req),
      message: 'Too many requests for this credential, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) =>
        req.path === '/auth/status' ||
        req.path === '/locale' ||
        req.path === '/directory' ||
        req.path === '/feed' ||
        req.path.startsWith('/feed/') ||
        req.path === '/sites' ||
        req.path.startsWith('/sites/') ||
        req.path === '/plans' ||
        req.path === '/auth/register' ||
        req.path === '/auth/login',
      validate: { keyGeneratorIpFallback: false },
    })
  );

  app.use('/api', createAuthMiddleware({ openMode, operatorKey }));
  app.use('/api', createApiRouter({ openMode }));
  app.use(apiErrorHandler);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path === '/health' ||
        req.path === '/ready' ||
        req.path === '/openapi.yaml' ||
        req.path === '/agent.json' ||
        req.path === '/.well-known/agent.json' ||
        req.path === '/.well-known/mcp/server-card.json' ||
        req.path === '/robots.txt' ||
        req.path === '/llms.txt' ||
        req.path === '/sitemap.xml' ||
        req.path === '/feed.json' ||
        req.path === '/feed.xml' ||
        /\.md$/i.test(req.path) ||
        (req.path.startsWith('/feed/') && /\.json$/i.test(req.path)) ||
        (req.path.startsWith('/sites/') &&
          (/llms\.txt$/i.test(req.path) ||
            /feed\.json$/i.test(req.path) ||
            /\.json$/i.test(req.path))) ||
        req.path === '/mcp' ||
        req.path.startsWith('/mcp/')
      ) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const bindHost =
    process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');
  const server = app.listen(PORT, bindHost, () => {
    logJson('info', 'Core online', { port: PORT, host: bindHost, appUrl });
    if (openMode) {
      logJson('info', 'Auth mode OPEN sandbox', { mode: 'open' });
    } else {
      logJson('info', 'Auth mode identity', { mode: 'identity' });
      if (freshlyCreated) {
        console.log('[Silicon Nexus] Generated new Operator Key (saved to data/secrets.json):');
        console.log(`  ${operatorKey}`);
        console.log(
          '[Silicon Nexus] Use this key in the dashboard. Issue agent tokens via POST /api/agents/register.'
        );
      } else {
        logJson('info', 'Operator Key loaded from env or data/secrets.json');
      }
    }
  });

  const shutdown = (signal: string) => {
    logJson('info', 'Shutting down', { signal });
    flushStateSync();
    closeStore();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logJson('error', 'Failed to start server', { error: String(err) });
  process.exit(1);
});
