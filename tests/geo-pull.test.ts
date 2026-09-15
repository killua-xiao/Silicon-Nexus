import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hostnameLooksUnsafe,
  htmlToMarkdown,
  isBlockedIp,
  parseSitemapLocs,
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

test('htmlToMarkdown keeps title and strips scripts', () => {
  const { title, body } = htmlToMarkdown(`
    <html><head><title>Hello GEO</title></head>
    <body>
      <script>alert(1)</script>
      <h1>Visible</h1>
      <p>Page body</p>
    </body></html>
  `);
  assert.equal(title, 'Hello GEO');
  assert.match(body, /Visible/);
  assert.match(body, /Page body/);
  assert.equal(body.includes('alert'), false);
});

test('slugFromUrl uses the last path segment', () => {
  assert.equal(slugFromUrl('https://example.com/docs/about.html'), 'about');
});

test('htmlToMarkdown falls back to first markdown heading', () => {
  const { title, body } = htmlToMarkdown('# HN digest\n\nSome links');
  assert.equal(title, 'HN digest');
  assert.match(body, /Some links/);
});
