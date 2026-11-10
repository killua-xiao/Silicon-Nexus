import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import {
  HUB_PAGE_META,
  HUB_PAGE_META_BY_PATH,
  hubCanonicalUrl,
  hubMarkdownPath,
  matchSiteHubSlug,
  normalizePublicPath,
  resolveHubPageMeta,
  siteHubMeta,
} from '../src/lib/hubPageMeta.ts';
import { buildLlmsTxt } from '../src/server/feedPublic.ts';
import { renderHubMarkdown } from '../src/server/hubPageMarkdown.ts';
import { registerHubPageRoutes } from '../src/server/hubPageRoutes.ts';
import {
  isKnownMachinePath,
  should404MachinePath,
} from '../src/server/machinePaths.ts';
import { registerSiteContentMirrorRoutes } from '../src/server/siteContentMirrors.ts';
import { rewriteSpaHtml } from '../src/server/spaHtml.ts';
import { isSpaCatchAllExcluded } from '../src/server/spaSurfaces.ts';

const APP_URL = 'https://silinex.xyz';
const SAMPLE_SHELL = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function metaContent(html: string, identAttr: 'name' | 'property', key: string): string | null {
  const re = new RegExp(`<meta\\s+${identAttr}="${key}" content="([^"]*)"`, 'i');
  return html.match(re)?.[1] ?? null;
}

test('normalizePublicPath strips trailing slashes except homepage', () => {
  assert.equal(normalizePublicPath('/docs'), '/docs');
  assert.equal(normalizePublicPath('/docs/'), '/docs');
  assert.equal(normalizePublicPath('/sites/archive2050/'), '/sites/archive2050');
  assert.equal(normalizePublicPath('/'), '/');
});

test('mapped hub blurbs are unique, long enough, and self-canonical', () => {
  const blurbs = HUB_PAGE_META.map((page) => page.blurb);
  assert.equal(new Set(blurbs).size, blurbs.length);
  const titles = HUB_PAGE_META.map((page) => page.title);
  assert.equal(new Set(titles).size, titles.length);
  for (const page of HUB_PAGE_META) {
    assert.ok(page.blurb.length > 200, `${page.path} blurb should exceed 200 chars`);
    assert.equal(hubCanonicalUrl(APP_URL, page.path), `${APP_URL}${page.path}`);
    assert.equal(hubMarkdownPath(page.path), `${page.path}.md`);
  }
  assert.equal(resolveHubPageMeta('/docs/').path, '/docs');
  assert.equal(hubCanonicalUrl(APP_URL, '/docs'), 'https://silinex.xyz/docs');
  assert.notEqual(hubCanonicalUrl(APP_URL, '/docs'), 'https://silinex.xyz/about');
});

test('unknown HTML paths never canonical to /about', () => {
  assert.equal(resolveHubPageMeta('/console'), null);
  assert.equal(hubCanonicalUrl(APP_URL, '/console'), 'https://silinex.xyz/console');
  assert.equal(hubCanonicalUrl(APP_URL, '/llms-full.txt'), 'https://silinex.xyz/llms-full.txt');
});

test('unimplemented machine-readable paths 404 instead of SPA', () => {
  const probes = [
    '/llms-full.txt',
    '/.well-known/mcp.json',
    '/.well-known/mcp',
    '/.well-known/ai-catalog.json',
    '/agent-card.json',
    '/indexnow-key.txt',
    '/not-a-file.yaml',
  ];
  for (const probe of probes) {
    assert.equal(should404MachinePath(probe), true, probe);
    assert.equal(isSpaCatchAllExcluded(probe), true, probe);
    assert.equal(isKnownMachinePath(probe), false, probe);
  }
  assert.equal(should404MachinePath('/llms.txt'), false);
  assert.equal(should404MachinePath('/.well-known/agent-card.json'), false);
  assert.equal(should404MachinePath('/.well-known/mcp/server-card.json'), false);
  assert.equal(should404MachinePath('/.well-known/mcp/wire/server-card.json'), false);
  assert.equal(isKnownMachinePath('/.well-known/mcp/wire/server-card.json'), true);
  assert.equal(should404MachinePath('/about.md'), false);
  assert.equal(should404MachinePath('/sites/archive2050.md'), false);
  assert.equal(should404MachinePath('/sites/archive2050/content/hello.md'), false);
  assert.equal(isSpaCatchAllExcluded('/about'), false);
  assert.equal(isSpaCatchAllExcluded('/feed'), false);
  assert.equal(isSpaCatchAllExcluded('/pricing'), false);
  assert.equal(isSpaCatchAllExcluded('/sites/archive2050'), false);
});

test('rewrites /docs identity on the real index.html shell', () => {
  const docs = HUB_PAGE_META_BY_PATH['/docs'];
  const out = rewriteSpaHtml(SAMPLE_SHELL, '/docs', APP_URL);

  assert.match(out, /<title>API quickstart · Silicon Nexus<\/title>/);
  assert.equal(metaContent(out, 'name', 'description'), docs.description);
  assert.match(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/docs" \/>/);
  assert.match(out, /rel="alternate"[^>]+type="text\/markdown"[^>]+href="https:\/\/silinex\.xyz\/docs\.md"/);
  assert.equal(metaContent(out, 'property', 'og:url'), 'https://silinex.xyz/docs');
  assert.equal(metaContent(out, 'property', 'og:title'), docs.title);
  assert.equal(metaContent(out, 'name', 'twitter:title'), docs.title);
  assert.equal(metaContent(out, 'property', 'og:image'), 'https://silinex.xyz/og.png');
  assert.match(out, new RegExp(`<p class="nx-static-def">${docs.blurb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>`));
  assert.match(out, /"@type":"WebPage"/);
  assert.doesNotMatch(out, /SoftwareApplication/);
  assert.doesNotMatch(out, /aggregateRating/);
  assert.doesNotMatch(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/about"/);
  assert.doesNotMatch(out, /<title>Silicon Nexus<\/title>/);
});

test('/docs/ trailing slash matches /docs identity', () => {
  const a = rewriteSpaHtml(SAMPLE_SHELL, '/docs', APP_URL);
  const b = rewriteSpaHtml(SAMPLE_SHELL, '/docs/', APP_URL);
  assert.equal(a, b);
});

test('rewrites /feed and /pricing away from /about', () => {
  for (const route of ['/feed', '/pricing', '/about', '/connect', '/cookbook']) {
    const meta = HUB_PAGE_META_BY_PATH[route];
    const out = rewriteSpaHtml(SAMPLE_SHELL, route, APP_URL);
    assert.match(out, new RegExp(`<title>${meta.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/title>`));
    assert.match(out, new RegExp(`rel="canonical" href="https://silinex\\.xyz${route}"`));
    assert.match(out, new RegExp(`type="text/markdown"[^>]+href="https://silinex\\.xyz${route}\\.md"`));
    assert.ok(out.includes(meta.blurb.slice(0, 40)));
    if (route !== '/about') {
      assert.doesNotMatch(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/about"/);
    }
  }
});

test('site hub rewrite is self-canonical and distinct', () => {
  const site = {
    slug: 'archive2050',
    name: 'Archive 2050',
    description: 'Long-form plates for silicon life.',
    domain: 'archive2050.xyz',
  };
  const meta = siteHubMeta(site, APP_URL);
  const out = rewriteSpaHtml(SAMPLE_SHELL, '/sites/archive2050/', APP_URL, { meta });
  assert.match(out, /<title>Archive 2050 · Silicon Nexus hub<\/title>/);
  assert.match(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/sites\/archive2050" \/>/);
  assert.match(out, /href="https:\/\/silinex\.xyz\/sites\/archive2050\.md"/);
  assert.match(out, /Long-form plates for silicon life/);
  assert.doesNotMatch(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/about"/);
  assert.equal(matchSiteHubSlug('/sites/archive2050/'), 'archive2050');
  assert.equal(matchSiteHubSlug('/sites/archive2050/content/foo.md'), null);
});

test('hub markdown matches the human-visible definition', () => {
  const about = renderHubMarkdown('/about.md', APP_URL);
  assert.match(about || '', /does not chat, store embeddings, or sell SEO inclusion/i);
  assert.match(about || '', /https:\/\/silinex\.xyz\/mcp/);
  const connect = renderHubMarkdown('/connect.md', APP_URL);
  assert.match(connect || '', /nxa_\*/);
  const feed = renderHubMarkdown('/feed.md', APP_URL);
  assert.match(feed || '', /not.*Silicon News Wire/i);
  assert.equal(renderHubMarkdown('/llms-full.txt', APP_URL), null);
});

test('llms.txt Primary prefers Markdown URLs and omits llms-full', () => {
  const txt = buildLlmsTxt(APP_URL);
  assert.match(txt, /\[About\]\(https:\/\/silinex\.xyz\/about\.md\)/);
  assert.match(txt, /\[Connect\]\(https:\/\/silinex\.xyz\/connect\.md\)/);
  assert.match(txt, /\[Docs\]\(https:\/\/silinex\.xyz\/docs\.md\)/);
  assert.match(txt, /\[Observation feed\]\(https:\/\/silinex\.xyz\/feed\.md\)/);
  assert.doesNotMatch(txt, /llms-full/);
  assert.doesNotMatch(txt, /\[About\]\(https:\/\/silinex\.xyz\/about\)/);
});

test('nginx www vhost 301s to apex', () => {
  const httpsConf = readFileSync(new URL('../deploy/nginx-silinex.xyz.conf', import.meta.url), 'utf8');
  const httpConf = readFileSync(new URL('../deploy/nginx-silinex.xyz.http.conf', import.meta.url), 'utf8');
  assert.match(
    httpsConf,
    /server_name www\.silinex\.xyz;[\s\S]*?return 301 https:\/\/silinex\.xyz\$request_uri;/
  );
  assert.match(httpsConf, /listen 443 ssl;[\s\S]*?server_name silinex\.xyz;/);
  assert.match(httpConf, /server_name www\.silinex\.xyz;/);
  assert.match(httpConf, /return 301 https:\/\/silinex\.xyz\$request_uri;/);
});

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-spa-identity-'));
process.env.NEXUS_DATA_DIR = dataDir;
const store = await import('../src/server/store.ts');

describe('hub identity HTTP', { concurrency: 1 }, () => {
  before(() => {
    store.loadPreservedState();
    const site = store.upsertSite({
      slug: 'archive2050',
      name: 'Archive 2050',
      domain: 'archive2050.xyz',
      description: 'Long-form plates for silicon life.',
    });
    assert.equal(site.ok, true);
    const content = store.upsertSiteContent('archive2050', {
      slug: '20261018-02-the-question-that-opened-the-night',
      title: 'The question that opened the night',
      bodyMd: 'A mirrored plate.',
      canonicalUrl: 'https://archive2050.xyz/20261018-02-the-question-that-opened-the-night',
    });
    assert.equal(content.ok, true);
  });

  after(() => {
    store.closeStore();
    rmSync(dataDir, { recursive: true, force: true });
  });

  async function withApp(run: (base: string) => Promise<void>) {
    const app = express();
    app.get('/llms.txt', (_req, res) => {
      res.type('text/plain; charset=utf-8').send(buildLlmsTxt(APP_URL));
    });
    app.get('/.well-known/agent-card.json', (_req, res) => {
      res.type('application/json').json({ name: 'Silicon Nexus' });
    });
    registerSiteContentMirrorRoutes(app);
    registerHubPageRoutes(app, APP_URL);
    app.get('*', (req, res, next) => {
      if (isSpaCatchAllExcluded(req.path)) return next();
      const hubSlug = matchSiteHubSlug(req.path);
      const site = hubSlug ? store.getSiteBySlug(hubSlug) : null;
      const extra = site ? { meta: siteHubMeta(site, APP_URL) } : undefined;
      res.type('html').send(rewriteSpaHtml(SAMPLE_SHELL, req.path, APP_URL, extra));
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

  test('fake discovery files 404 as JSON or text, never the about HTML shell', async () => {
    await withApp(async (base) => {
      const cases = [
        '/llms-full.txt',
        '/.well-known/mcp.json',
        '/.well-known/mcp',
        '/.well-known/ai-catalog.json',
        '/agent-card.json',
        '/indexnow-key.txt',
      ];
      for (const probe of cases) {
        const res = await fetch(`${base}${probe}`);
        assert.equal(res.status, 404, probe);
        const type = res.headers.get('content-type') || '';
        assert.doesNotMatch(type, /text\/html/);
        const body = await res.text();
        assert.doesNotMatch(body, /<!doctype html>/i);
        assert.doesNotMatch(body, /rel="canonical" href="https:\/\/silinex\.xyz\/about"/);
      }
    });
  });

  test('known discovery documents stay machine types', async () => {
    await withApp(async (base) => {
      const llms = await fetch(`${base}/llms.txt`);
      assert.equal(llms.status, 200);
      assert.match(llms.headers.get('content-type') || '', /text\/plain/);
      const card = await fetch(`${base}/.well-known/agent-card.json`);
      assert.equal(card.status, 200);
      assert.match(card.headers.get('content-type') || '', /application\/json/);
    });
  });

  test('hub HTML pages have distinct identity and markdown twins', async () => {
    await withApp(async (base) => {
      for (const route of ['/about', '/docs', '/connect', '/cookbook', '/feed', '/pricing']) {
        const html = await fetch(`${base}${route}`);
        assert.equal(html.status, 200, route);
        assert.match(html.headers.get('content-type') || '', /html/);
        const body = await html.text();
        assert.match(body, new RegExp(`rel="canonical" href="https://silinex\\.xyz${route}"`));
        assert.match(body, /<p class="nx-static-def">/);
        assert.match(body, /rel="alternate"[^>]+text\/markdown/);
        if (route !== '/about') {
          assert.doesNotMatch(body, /rel="canonical" href="https:\/\/silinex\.xyz\/about"/);
        }

        const md = await fetch(`${base}${route}.md`);
        assert.equal(md.status, 200, `${route}.md`);
        assert.match(md.headers.get('content-type') || '', /text\/markdown/);
        const mdBody = await md.text();
        assert.doesNotMatch(mdBody, /<!doctype html>/i);
        assert.match(mdBody, /^# /m);
      }
    });
  });

  test('archive2050 hub is a real page; content mirrors stay noindex+canonical', async () => {
    await withApp(async (base) => {
      const hub = await fetch(`${base}/sites/archive2050/`);
      assert.equal(hub.status, 200);
      const hubHtml = await hub.text();
      assert.match(hubHtml, /<link rel="canonical" href="https:\/\/silinex\.xyz\/sites\/archive2050"/);
      assert.match(hubHtml, /Archive 2050/);
      assert.doesNotMatch(hubHtml, /rel="canonical" href="https:\/\/silinex\.xyz\/about"/);

      const hubMd = await fetch(`${base}/sites/archive2050.md`);
      assert.equal(hubMd.status, 200);
      assert.match(hubMd.headers.get('content-type') || '', /text\/markdown/);
      const hubMdBody = await hubMd.text();
      assert.match(hubMdBody, /Archive 2050/);
      assert.match(hubMdBody, /noindex/);

      const missing = await fetch(`${base}/sites/not-a-real-site`);
      assert.equal(missing.status, 404);
      assert.doesNotMatch(missing.headers.get('content-type') || '', /text\/html/);

      const mdPath = '/sites/archive2050/content/20261018-02-the-question-that-opened-the-night.md';
      const md = await fetch(`${base}${mdPath}`);
      assert.equal(md.status, 200);
      assert.match(md.headers.get('content-type') || '', /text\/markdown/);
      assert.equal(md.headers.get('x-robots-tag'), 'noindex, follow');
      assert.equal(
        md.headers.get('link'),
        '<https://archive2050.xyz/20261018-02-the-question-that-opened-the-night>; rel="canonical"'
      );
    });
  });
});
