import type { Express } from 'express';
import { detectCrawler } from './crawlDetect.ts';
import { applySiteContentMirrorHeaders, renderSiteContentMarkdown } from './geoPublic.ts';
import { getSiteBySlug, getSiteContent, recordSiteContentCrawl } from './store.ts';

/** Public /sites/:site/content/:slug.(md|json) mirrors — Link canonical + noindex, still crawlable. */
export function registerSiteContentMirrorRoutes(app: Express): void {
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
    const site = getSiteBySlug(siteSlug);
    applySiteContentMirrorHeaders(res, item, site);
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
    applySiteContentMirrorHeaders(res, item, site);
    res.type('text/markdown; charset=utf-8').send(renderSiteContentMarkdown(item, siteSlug, site));
  });
}
