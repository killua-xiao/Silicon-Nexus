/**
 * Refresh every registered GEO sitemap (HTTPS pull, honest local sync).
 *
 *   npm run geo:daily
 */
import 'dotenv/config';
import { closeStore, listSitesWithSitemap, loadPreservedState } from '../src/server/store.ts';
import { pullSiteFromSitemap } from '../src/server/geoPull.ts';
import { logJson } from '../src/server/log.ts';

loadPreservedState();

const sites = listSitesWithSitemap(50);
logJson('info', 'GEO daily pull starting', { sites: sites.length });

for (const site of sites) {
  try {
    const result = await pullSiteFromSitemap({
      slug: site.slug,
      workspaceId: site.workspaceId,
      sitemapUrl: site.sitemapUrl,
    });
    logJson('info', 'GEO daily site pulled', {
      slug: site.slug,
      ok: result.ok,
      upserted: result.upserted,
    });
  } catch (error) {
    logJson('error', 'GEO daily site failed', { slug: site.slug, error: String(error) });
  }
}

closeStore();
