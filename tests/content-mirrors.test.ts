import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import { buildGeoSitemapXml, buildLlmsTxt, buildSitemapXml } from '../src/server/feedPublic.ts';
import {
  applySiteContentMirrorHeaders,
  buildSiteFeedJson,
  buildSiteLlmsTxt,
  resolveSiteContentCanonical,
} from '../src/server/geoPublic.ts';
import type { FeedItem, Site, SiteContent } from '../src/server/types.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-mirrors-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');
const { registerSiteContentMirrorRoutes } = await import('../src/server/siteContentMirrors.ts');

const sampleItem: Pick<SiteContent, 'canonicalUrl' | 'slug'> = {
  slug: '20261018-02-the-question-that-opened-the-night',
  canonicalUrl: 'https://archive2050.xyz/20261018-02-the-question-that-opened-the-night',
};

function fakeFeedItem(slug: string): FeedItem {
  return {
    id: `fi_${slug}`,
    workspaceId: 'default',
    slug,
    title: slug,
    summary: slug,
    bodyMd: slug,
    tags: [],
    source: 'test',
    sourceUrl: null,
    externalId: null,
    publishedAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T12:00:00.000Z',
    indexing: {
      status: 'unseen',
      crawlHits: 0,
      lastCrawledAt: null,
      crawlersSeen: [],
      note: '',
    },
  };
}

test('canonical prefers stored frontmatter URL over domain+slug', () => {
  assert.equal(
    resolveSiteContentCanonical(sampleItem, { domain: 'archive2050.xyz' }),
    'https://archive2050.xyz/20261018-02-the-question-that-opened-the-night'
  );
});

test('canonical composes https://{domain}/{slug} when frontmatter is missing', () => {
  assert.equal(
    resolveSiteContentCanonical({ slug: 'hello-world', canonicalUrl: null }, { domain: 'archive2050.xyz' }),
    'https://archive2050.xyz/hello-world'
  );
  assert.equal(
    resolveSiteContentCanonical(
      { slug: 'hello-world', canonicalUrl: null },
      { domain: 'https://archive2050.xyz' }
    ),
    'https://archive2050.xyz/hello-world'
  );
});

test('canonical joins a relative frontmatter path onto the site origin', () => {
  assert.equal(
    resolveSiteContentCanonical({ slug: 'ignored', canonicalUrl: '/posts/hello' }, { domain: 'example.com' }),
    'https://example.com/posts/hello'
  );
});

test('canonical is omitted when neither frontmatter nor domain exist', () => {
  assert.equal(resolveSiteContentCanonical({ slug: 'hello', canonicalUrl: null }, { domain: null }), null);
});

test('mirror headers set Link + X-Robots-Tag', () => {
  const headers: Record<string, string> = {};
  const canonical = applySiteContentMirrorHeaders(
    { setHeader(name, value) { headers[name] = value; } },
    sampleItem,
    { domain: 'archive2050.xyz' }
  );
  assert.equal(canonical, sampleItem.canonicalUrl);
  assert.equal(headers['X-Robots-Tag'], 'noindex, follow');
  assert.equal(
    headers.Link,
    '<https://archive2050.xyz/20261018-02-the-question-that-opened-the-night>; rel="canonical"'
  );
});

test('Google sitemap omits site content mirrors and keeps llms/feed discovery', () => {
  const xml = buildSitemapXml('https://silinex.xyz', [fakeFeedItem('signal-1')], ['archive2050']);
  assert.equal(xml.includes('/sites/archive2050/content/'), false);
  assert.match(xml, /\/sites\/archive2050\/llms\.txt/);
  assert.match(xml, /\/sites\/archive2050\/feed\.json/);
  assert.match(xml, /\/llms\.txt/);
  assert.match(xml, /\/feed\.json/);
  assert.match(xml, /\/feed\/signal-1\.md/);
  assert.doesNotMatch(xml, /changefreq/);
  assert.doesNotMatch(xml, /priority/);
  assert.doesNotMatch(xml, /lastmod>2026-10-21/);
});

test('geo-sitemap stays product-only with no content mirrors', () => {
  const xml = buildGeoSitemapXml('https://silinex.xyz');
  assert.doesNotMatch(xml, /\/sites\/.*\/content\//);
  assert.match(xml, /<loc>https:\/\/silinex\.xyz\/about<\/loc>/);
});

test('hub and site agent surfaces still list content mirrors', () => {
  const hub = buildLlmsTxt('https://silinex.xyz');
  assert.match(hub, /\/llms\.txt/);
  assert.match(hub, /\/sites\/\{siteSlug\}\/llms\.txt/);

  const site: Site = {
    id: 's1',
    workspaceId: 'default',
    slug: 'archive2050',
    name: 'Archive 2050',
    domain: 'archive2050.xyz',
    description: 'Test',
    sitemapUrl: null,
    lastPulledAt: null,
    lastPullNote: null,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  };
  const item: SiteContent = {
    id: 'sc1',
    siteId: 's1',
    workspaceId: 'default',
    slug: sampleItem.slug,
    title: 'The question',
    summary: 'Night',
    bodyMd: 'Body',
    canonicalUrl: sampleItem.canonicalUrl,
    tags: [],
    publishedAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-21T00:00:00.000Z',
    indexing: {
      status: 'unseen',
      crawlHits: 0,
      lastCrawledAt: null,
      crawlersSeen: [],
      note: '',
    },
  };
  const llms = buildSiteLlmsTxt('https://silinex.xyz', site, [item]);
  assert.match(llms, /\/sites\/archive2050\/content\/20261018-02-the-question-that-opened-the-night\.md/);
  assert.match(llms, /canonical: https:\/\/archive2050\.xyz\//);

  const feed = buildSiteFeedJson('https://silinex.xyz', site, [item]);
  assert.equal(feed.llmsTxt, 'https://silinex.xyz/sites/archive2050/llms.txt');
  assert.equal(
    feed.items[0]?.urls.md,
    'https://silinex.xyz/sites/archive2050/content/20261018-02-the-question-that-opened-the-night.md'
  );
});

describe('content mirror HTTP handlers', { concurrency: 1 }, () => {
  before(() => {
    store.loadPreservedState();
    const site = store.upsertSite({
      slug: 'archive2050',
      name: 'Archive 2050',
      domain: 'archive2050.xyz',
    });
    assert.equal(site.ok, true);
    const content = store.upsertSiteContent('archive2050', {
      slug: sampleItem.slug,
      title: 'The question that opened the night',
      bodyMd: 'A mirrored plate.',
      canonicalUrl: sampleItem.canonicalUrl,
    });
    assert.equal(content.ok, true);
  });

  after(() => {
    store.closeStore();
    rmSync(dataDir, { recursive: true, force: true });
  });

  async function withApp(run: (base: string) => Promise<void>) {
    const app = express();
    registerSiteContentMirrorRoutes(app);
    app.get('/sites/:siteSlug/llms.txt', (req, res) => {
      const site = store.getSiteBySlug(req.params.siteSlug);
      if (!site) return res.status(404).type('text/plain').send('Site not found');
      const items = store.listSiteContent(site.slug, { limit: 100 });
      res.type('text/plain; charset=utf-8').send(buildSiteLlmsTxt('https://silinex.xyz', site, items));
    });
    app.get('/llms.txt', (_req, res) => {
      res.type('text/plain; charset=utf-8').send(buildLlmsTxt('https://silinex.xyz'));
    });
    app.get('/sitemap.xml', (_req, res) => {
      res
        .type('application/xml')
        .send(buildSitemapXml('https://silinex.xyz', [], store.listSites().map((s) => s.slug)));
    });

    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    const base = `http://127.0.0.1:${port}`;
    try {
      await run(base);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  }

  test('md and json mirrors emit Link canonical + X-Robots-Tag', async () => {
    await withApp(async (base) => {
      const mdPath = `/sites/archive2050/content/${sampleItem.slug}.md`;
      const md = await fetch(`${base}${mdPath}`);
      assert.equal(md.status, 200);
      assert.match(md.headers.get('content-type') || '', /text\/markdown/);
      assert.equal(md.headers.get('x-robots-tag'), 'noindex, follow');
      assert.equal(
        md.headers.get('link'),
        `<${sampleItem.canonicalUrl}>; rel="canonical"`
      );
      const mdBody = await md.text();
      assert.match(mdBody, /canonical: https:\/\/archive2050\.xyz\//);
      assert.doesNotMatch(mdBody, /<!doctype html>/i);

      const json = await fetch(`${base}/sites/archive2050/content/${sampleItem.slug}.json`);
      assert.equal(json.status, 200);
      assert.match(json.headers.get('content-type') || '', /application\/json/);
      assert.equal(json.headers.get('x-robots-tag'), 'noindex, follow');
      assert.equal(
        json.headers.get('link'),
        `<${sampleItem.canonicalUrl}>; rel="canonical"`
      );
    });
  });

  test('generated sitemap has no archive content md/json; llms stays reachable', async () => {
    await withApp(async (base) => {
      const sitemap = await fetch(`${base}/sitemap.xml`);
      assert.equal(sitemap.status, 200);
      const xml = await sitemap.text();
      assert.equal((xml.match(/sites\/archive2050\/content\/.*\.md/g) || []).length, 0);
      assert.equal((xml.match(/sites\/archive2050\/content\/.*\.json/g) || []).length, 0);
      assert.match(xml, /\/sites\/archive2050\/llms\.txt/);
      assert.match(xml, /\/sites\/archive2050\/feed\.json/);

      const siteLlms = await fetch(`${base}/sites/archive2050/llms.txt`);
      assert.equal(siteLlms.status, 200);
      assert.match(await siteLlms.text(), /\/sites\/archive2050\/content\//);

      const hubLlms = await fetch(`${base}/llms.txt`);
      assert.equal(hubLlms.status, 200);
      assert.match(await hubLlms.text(), /^# Silicon Nexus/m);
    });
  });
});
