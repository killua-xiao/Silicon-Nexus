import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  contentFromResponse,
  expandSitemapPageUrls,
  hostnameLooksUnsafe,
  htmlToMarkdown,
  isBlockedIp,
  parseSitemapLocs,
  prioritizePageUrls,
  shouldSkipGeoUrl,
  slugFromUrl,
} from '../src/server/geoPull.ts';

test('blocks private and reserved IPs', () => {
  assert.equal(isBlockedIp('127.0.0.1'), true);
  assert.equal(isBlockedIp('10.0.0.4'), true);
  assert.equal(isBlockedIp('192.168.1.9'), true);
  assert.equal(isBlockedIp('169.254.169.254'), true);
  assert.equal(isBlockedIp('172.16.0.2'), true);
  assert.equal(isBlockedIp('::1'), true);
  assert.equal(isBlockedIp('8.8.8.8'), false);
});

test('rejects localhost-style hosts before DNS', () => {
  assert.equal(hostnameLooksUnsafe('localhost'), true);
  assert.equal(hostnameLooksUnsafe('foo.local'), true);
  assert.equal(hostnameLooksUnsafe('127.0.0.1'), true);
  assert.equal(hostnameLooksUnsafe('example.com'), false);
});

test('parses sitemap loc entries', () => {
  const locs = parseSitemapLocs(`
    <urlset>
      <url><loc>https://example.com/a</loc></url>
      <url><loc>https://example.com/b</loc></url>
    </urlset>
  `);
  assert.deepEqual(locs, ['https://example.com/a', 'https://example.com/b']);
});

test('skips feed and discovery noise from GEO pulls', () => {
  assert.equal(shouldSkipGeoUrl('https://silinex.xyz/feed/hn-1.md'), true);
  assert.equal(shouldSkipGeoUrl('https://silinex.xyz/feed.json'), true);
  assert.equal(shouldSkipGeoUrl('https://silinex.xyz/.well-known/agent.json'), true);
  assert.equal(shouldSkipGeoUrl('https://silinex.xyz/sites/silinex/llms.txt'), true);
  assert.equal(shouldSkipGeoUrl('https://silinex.xyz/about'), false);
  assert.equal(shouldSkipGeoUrl('https://silinex.xyz/connect'), false);
});

test('prioritizes product paths', () => {
  const ranked = prioritizePageUrls([
    'https://example.com/blog/long-tail',
    'https://example.com/about',
    'https://example.com/',
    'https://example.com/connect',
  ]);
  assert.equal(ranked[0], 'https://example.com/');
  assert.ok(ranked.indexOf('https://example.com/about') < ranked.indexOf('https://example.com/blog/long-tail'));
});

test('expands sitemap index into page URLs', async () => {
  const files: Record<string, string> = {
    'https://example.com/sitemap.xml': `
      <sitemapindex>
        <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
      </sitemapindex>
    `,
    'https://example.com/sitemap-pages.xml': `
      <urlset>
        <url><loc>https://example.com/about</loc></url>
        <url><loc>https://example.com/feed/noise.md</loc></url>
        <url><loc>https://example.com/connect</loc></url>
      </urlset>
    `,
  };
  const expanded = await expandSitemapPageUrls(
    'https://example.com/sitemap.xml',
    async (url) => {
      const xml = files[url];
      if (!xml) throw new Error(`missing ${url}`);
      return xml;
    }
  );
  assert.equal(expanded.fetched, 2);
  assert.deepEqual(expanded.pageUrls, [
    'https://example.com/about',
    'https://example.com/connect',
  ]);
  assert.equal(expanded.skippedNoise, 1);
});

test('htmlToMarkdown keeps title, meta description, and strips scripts', () => {
  const { title, body, summary } = htmlToMarkdown(`
    <html><head>
      <title>Hello GEO</title>
      <meta name="description" content="A short GEO summary" />
    </head>
    <body>
      <nav>Ignore nav</nav>
      <main>
        <script>alert(1)</script>
        <h1>Visible</h1>
        <p>Page body</p>
      </main>
      <footer>Ignore footer</footer>
    </body></html>
  `);
  assert.equal(title, 'Hello GEO');
  assert.match(body, /Visible/);
  assert.match(body, /Page body/);
  assert.match(body, /A short GEO summary/);
  assert.match(summary, /A short GEO summary/);
  assert.equal(body.includes('alert'), false);
  assert.equal(body.includes('Ignore nav'), false);
});

test('markdown responses strip front matter', () => {
  const parsed = contentFromResponse(
    'https://example.com/page.md',
    '---\ntitle: "X"\n---\n# Real title\n\nBody here\n',
    'text/markdown'
  );
  assert.equal(parsed.title, 'Real title');
  assert.match(parsed.body, /Body here/);
  assert.equal(parsed.body.includes('title:'), false);
});

test('slugFromUrl uses the last path segment', () => {
  assert.equal(slugFromUrl('https://example.com/docs/about.html'), 'about');
});

test('htmlToMarkdown falls back to first markdown heading', () => {
  const { title, body } = htmlToMarkdown('# HN digest\n\nSome links');
  assert.equal(title, 'HN digest');
  assert.match(body, /Some links/);
});
