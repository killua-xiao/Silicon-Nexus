import type { Express, Request, Response } from 'express';
import { matchSiteHubSlug } from '../lib/hubPageMeta.ts';
import { renderHubMarkdown, renderSiteHubMarkdown } from './hubPageMarkdown.ts';
import { machine404ContentType, should404MachinePath } from './machinePaths.ts';
import { getSiteBySlug } from './store.ts';

function lookupSite(slug: string) {
  try {
    return getSiteBySlug(slug);
  } catch {
    return null;
  }
}

function sendMarkdown(res: Response, body: string): void {
  res.status(200).type('text/markdown; charset=utf-8').send(body);
}

export function sendMachine404(res: Response, pathname: string): void {
  if (machine404ContentType(pathname) === 'json') {
    res.status(404).type('application/json').json({ error: 'Not found' });
    return;
  }
  res.status(404).type('text/plain; charset=utf-8').send('Not found');
}

/** Hub Markdown twins + true 404s for unimplemented machine-readable probes. */
export function registerHubPageRoutes(app: Express, appUrl: string): void {
  const pages = [
    '/about.md',
    '/docs.md',
    '/connect.md',
    '/cookbook.md',
    '/feed.md',
    '/pricing.md',
    '/directory.md',
    '/privacy.md',
    '/terms.md',
  ];
  for (const path of pages) {
    app.get(path, (_req, res) => {
      const body = renderHubMarkdown(path, appUrl);
      if (!body) return sendMachine404(res, path);
      sendMarkdown(res, body);
    });
  }

  app.get('/sites/:siteSlug.md', (req, res) => {
    const slug = String(req.params.siteSlug || '').replace(/\.md$/i, '');
    const site = lookupSite(slug);
    if (!site) return sendMachine404(res, req.path);
    sendMarkdown(res, renderSiteHubMarkdown(appUrl, site));
  });

  app.use((req: Request, res: Response, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (should404MachinePath(req.path)) {
      return sendMachine404(res, req.path);
    }
    const hubSlug = matchSiteHubSlug(req.path);
    if (hubSlug && !lookupSite(hubSlug)) {
      return sendMachine404(res, req.path);
    }
    next();
  });
}
