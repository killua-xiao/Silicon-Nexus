import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'path';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import { buildLlmsTxt, buildRobotsTxt, buildSitemapXml } from '../src/server/feedPublic.ts';
import { isSpaCatchAllExcluded } from '../src/server/spaSurfaces.ts';
import { MCP_TOOLS } from '../src/server/mcpTools.ts';
import { buildA2AAgentCard, buildAgentCard } from '../src/server/agentCard.ts';
import {
  buildWireAtomFeed,
  buildWireJsonFeed,
  newsArticleJsonLd,
  withOffsetIso,
} from '../src/server/wirePublic.ts';
import { SEED_ARTICLES } from '../src/server/wireSeed.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-wire-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');
const { registerWireRoutes } = await import('../src/server/wireRoutes.ts');
const { listPublishedArticles, getPublishedArticleBySlug } = await import('../src/server/wireStore.ts');

const APP_URL = 'https://silinex.xyz';
const SAMPLE_SLUG = 'readable-by-carbon-native-to-silicon';

describe('Silicon News Wire phase 1', { concurrency: 1 }, () => {
  before(() => {
    store.loadPreservedState();
  });

  after(() => {
    store.closeStore();
    rmSync(dataDir, { recursive: true, force: true });
  });

  async function withApp(run: (base: string) => Promise<void>) {
    const app = express();
    app.get('/robots.txt', (_req, res) => {
      res.type('text/plain').send(buildRobotsTxt(APP_URL));
    });
    app.get('/llms.txt', (_req, res) => {
      const articles = listPublishedArticles({ limit: 200 });
      res
        .type('text/plain; charset=utf-8')
        .send(buildLlmsTxt(APP_URL, articles.map((a) => ({ slug: a.slug, headline: a.headline }))));
    });
    app.get('/sitemap.xml', (_req, res) => {
      const articles = listPublishedArticles({ limit: 200 });
      res.type('application/xml').send(
        buildSitemapXml(
          APP_URL,
          [],
          [],
          articles.map((a) => ({ slug: a.slug, dateModified: a.dateModified }))
        )
      );
    });
    app.get('/feed.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/feed+json; charset=utf-8');
      res.send(JSON.stringify(buildWireJsonFeed(APP_URL, listPublishedArticles({ limit: 50 }))));
    });
    app.get('/feed.xml', (_req, res) => {
      res.type('application/atom+xml').send(buildWireAtomFeed(APP_URL, listPublishedArticles({ limit: 50 })));
    });
    app.get('/.well-known/agent-card.json', (_req, res) => {
      res.type('application/json').json(buildA2AAgentCard(APP_URL));
    });
    app.get('/.well-known/agent.json', (_req, res) => {
      res.type('application/json').json(buildAgentCard(APP_URL));
    });
    registerWireRoutes(app, APP_URL);

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

  test('seeds four published articles and FTS table exists', async () => {
    const articles = listPublishedArticles();
    assert.equal(articles.length, 4);
    assert.deepEqual(
      articles.map((a) => a.slug).sort(),
      SEED_ARTICLES.map((a) => a.slug).sort()
    );
    const { getDb } = await import('../src/server/db.ts');
    const database = getDb();
    const fts = database
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'articles_fts'`)
      .get() as { name: string } | undefined;
    assert.equal(fts?.name, 'articles_fts');
    const pubs = database.prepare(`SELECT COUNT(*) AS c FROM publishers`).get() as { c: number };
    assert.equal(pubs.c, 1);
  });

  test('acceptance: HTML / JSON / MD / discovery return 200 with correct types', async () => {
    await withApp(async (base) => {
      const home = await fetch(`${base}/`);
      assert.equal(home.status, 200);
      assert.match(home.headers.get('content-type') || '', /text\/html/);
      const homeHtml = await home.text();
      assert.match(homeHtml, /BUILT FOR SILICON LIFEFORMS/);
      assert.match(homeHtml, /Readable by carbon/);
      assert.match(homeHtml, /class="site-header"/);
      assert.match(homeHtml, /<nav class="primary"/);
      assert.match(homeHtml, /MCP &amp; API/);
      assert.match(homeHtml, /\.wrap \{ max-width: var\(--wrap\)/);
      assert.match(homeHtml, /--wrap:\s*960px/);
      assert.match(homeHtml, /--wrap-console:\s*72rem/);
      assert.doesNotMatch(homeHtml, /--wrap:\s*720px/);
      assert.match(homeHtml, /rel="alternate"[^>]+application\/feed\+json/);
      assert.match(homeHtml, /<title>/);
      assert.match(homeHtml, /rel="canonical"/);
      assert.doesNotMatch(homeHtml, /Pricing/);
      assert.doesNotMatch(homeHtml, /linear-gradient|#7c3aed|#8b5cf6/i);

      const html = await fetch(`${base}/wire/${SAMPLE_SLUG}`);
      assert.equal(html.status, 200);
      const page = await html.text();
      assert.match(page, /<title>/);
      assert.match(page, /name="description"/);
      assert.match(page, /rel="canonical"/);
      assert.match(page, /application\/ld\+json/);
      assert.match(page, /"@type":"NewsArticle"/);
      assert.match(page, /rel="alternate"[^>]+application\/json/);
      assert.match(page, /rel="alternate"[^>]+text\/markdown/);
      assert.match(page, /<time datetime="2026-10-30T09:00:00\+08:00">/);
      assert.match(page, /id="fact-1"/);
      assert.match(page, /User-Agents can be spoofed|UA 可伪造/);
      const h1Index = page.indexOf('<h1>');
      const timeIndex = page.indexOf('<time datetime');
      const tldrIndex = page.indexOf('fact-1');
      assert.ok(h1Index >= 0 && timeIndex > h1Index && tldrIndex > timeIndex);

      const json = await fetch(`${base}/wire/${SAMPLE_SLUG}.json`);
      assert.equal(json.status, 200);
      assert.match(json.headers.get('content-type') || '', /application\/json/);
      const body = (await json.json()) as {
        headline: string;
        date_published: string;
        author: { name: string };
        publisher: { name: string };
        key_facts: string[];
        image?: string;
      };
      assert.equal(body.headline, 'Readable by carbon. Native to silicon.');
      assert.match(body.date_published, /[+-]\d{2}:\d{2}$/);
      assert.equal(body.author.name, 'Silicon Nexus');
      assert.equal(body.publisher.name, 'Silicon Nexus');
      assert.ok(body.key_facts.length >= 3);
      assert.equal(body.image, undefined);

      const md = await fetch(`${base}/wire/${SAMPLE_SLUG}.md`);
      assert.equal(md.status, 200);
      assert.match(md.headers.get('content-type') || '', /text\/markdown/);
      const mdBody = await md.text();
      assert.match(mdBody, /^---/m);
      assert.match(mdBody, /canonical:/);
      assert.match(mdBody, /key_facts:/);
      assert.match(mdBody, /date_published:/);

      const topic = await fetch(`${base}/topic/wire`);
      assert.equal(topic.status, 200);
      assert.match(await topic.text(), /Readable by carbon/);

      const sitemap = await fetch(`${base}/sitemap.xml`);
      assert.equal(sitemap.status, 200);
      const xml = await sitemap.text();
      assert.match(xml, /\/wire\/readable-by-carbon-native-to-silicon/);
      assert.doesNotMatch(xml, /\/pricing/);

      const llms = await fetch(`${base}/llms.txt`);
      assert.equal(llms.status, 200);
      const llmsBody = await llms.text();
      assert.match(llmsBody, /\/wire\/readable-by-carbon-native-to-silicon\.md/);
      assert.doesNotMatch(llmsBody, /\/wire\/readable-by-carbon-native-to-silicon\)/);

      const card = await fetch(`${base}/.well-known/agent-card.json`);
      assert.equal(card.status, 200);
      assert.match(card.headers.get('content-type') || '', /application\/json/);
      const cardJson = (await card.json()) as { name: string; skills: unknown[] };
      assert.equal(cardJson.name, 'Silicon Nexus');
      assert.ok(Array.isArray(cardJson.skills) && cardJson.skills.length > 0);

      const robots = await fetch(`${base}/robots.txt`);
      assert.equal(robots.status, 200);
      const robotsTxt = await robots.text();
      assert.match(robotsTxt, /^Content-Signal: search=yes, ai-input=yes, ai-train=no$/m);
      assert.match(robotsTxt, /User-agent: Googlebot/);
      assert.match(robotsTxt, /User-agent: GPTBot/);
      assert.match(robotsTxt, /Sitemap: https:\/\/silinex\.xyz\/sitemap.xml/);

      const feed = await fetch(`${base}/feed.json`);
      assert.equal(feed.status, 200);
      assert.match(feed.headers.get('content-type') || '', /json/);
      const feedJson = (await feed.json()) as {
        version: string;
        title: string;
        items: Array<{
          id: string;
          url: string;
          title: string;
          content_text?: string;
          content_html?: string;
          authors?: unknown;
          date_published: string;
        }>;
      };
      assert.equal(feedJson.version, 'https://jsonfeed.org/version/1.1');
      assert.equal(feedJson.title, 'Silicon News Wire');
      assert.ok(feedJson.items.length >= 4);
      for (const item of feedJson.items) {
        assert.ok(item.id.startsWith('https://silinex.xyz/wire/'));
        assert.equal(item.id, item.url);
        assert.ok(item.content_text || item.content_html);
        assert.ok(Array.isArray(item.authors));
        assert.match(item.date_published, /[+-]\d{2}:\d{2}$/);
      }

      const atom = await fetch(`${base}/feed.xml`);
      assert.equal(atom.status, 200);
      const atomXml = await atom.text();
      assert.match(atomXml, /<id>https:\/\/silinex\.xyz\/wire\/readable-by-carbon-native-to-silicon<\/id>/);
    });
  });

  test('Googlebot and GPTBot increment bot observation counts', async () => {
    await withApp(async (base) => {
      const before = getPublishedArticleBySlug('a-fetch-is-a-log-not-a-trophy');
      assert.ok(before);
      const botBefore = before.observations.bot;

      await fetch(`${base}/wire/a-fetch-is-a-log-not-a-trophy`, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      });
      await fetch(`${base}/wire/a-fetch-is-a-log-not-a-trophy.json`, {
        headers: { 'user-agent': 'Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)' },
      });

      const after = getPublishedArticleBySlug('a-fetch-is-a-log-not-a-trophy');
      assert.ok(after);
      assert.ok(after.observations.bot >= botBefore + 2);
      const ids = after.observations.crawlers.map((c) => c.crawlerId);
      assert.ok(ids.includes('Googlebot'));
      assert.ok(ids.includes('GPTBot'));

      const page = await fetch(`${base}/wire/a-fetch-is-a-log-not-a-trophy`);
      const html = await page.text();
      assert.match(html, /Googlebot/);
      assert.match(html, /GPTBot/);
      assert.match(html, /can be spoofed/);
    });
  });

  test('NewsArticle JSON-LD omits image when the seed has none', () => {
    const article = getPublishedArticleBySlug(SAMPLE_SLUG);
    assert.ok(article);
    assert.equal(article.imageUrl, null);
    const ld = newsArticleJsonLd(APP_URL, article);
    assert.equal(ld.image, undefined);
    assert.equal(ld['@type'], 'NewsArticle');
    assert.equal(typeof ld.headline, 'string');
    assert.match(String(ld.datePublished), /[+-]\d{2}:\d{2}$/);
    assert.ok(Array.isArray(ld.author));
    assert.equal((ld.publisher as { name: string }).name, 'Silicon Nexus');
    assert.equal(withOffsetIso('2026-10-30T01:00:00.000Z'), '2026-10-30T01:00:00.000+00:00');
  });

  test('does not add wire_publish MCP tool; body/continuity tools remain', () => {
    const names = MCP_TOOLS.map((t) => t.name as string);
    assert.equal(names.includes('wire_publish'), false);
    assert.equal(names.includes('wire_publish_article'), false);
    assert.ok(names.includes('nexus_write_memory'));
    assert.ok(names.includes('nexus_handoff'));
    assert.ok(names.includes('nexus_assume'));
    assert.ok(names.includes('nexus_read_body'));
  });

  test('console and MCP stay on the SPA / non-wire surfaces', () => {
    assert.equal(isSpaCatchAllExcluded('/console'), false);
    assert.equal(isSpaCatchAllExcluded('/console/agents'), false);
    assert.equal(isSpaCatchAllExcluded('/mcp'), true);
    assert.equal(isSpaCatchAllExcluded('/pricing'), false);
  });
});
