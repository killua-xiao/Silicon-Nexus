import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  HOME_SPA_META,
  SPA_PAGE_META_BY_PATH,
  normalizeSpaPath,
  resolveSpaPageMeta,
  spaCanonicalUrl,
} from '../src/lib/spaPageMeta.ts';
import { rewriteSpaHtml } from '../src/server/spaHtml.ts';

const APP_URL = 'https://silinex.xyz';
const SAMPLE_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="description"
      content="Silicon Nexus stores durable JSON memory per agent and publishes site pages as llms.txt and feeds. Agents connect over MCP. Humans use the console."
    />
    <link rel="canonical" href="https://silinex.xyz/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://silinex.xyz/" />
    <meta property="og:title" content="Silicon Nexus" />
    <meta
      property="og:description"
      content="Silicon Nexus stores durable memory per agent and publishes llms.txt and feeds so engines can read a site. Connect over MCP."
    />
    <meta property="og:image" content="https://silinex.xyz/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Silicon Nexus" />
    <meta
      name="twitter:description"
      content="Silicon Nexus stores durable memory per agent and publishes llms.txt and feeds so engines can read a site. Connect over MCP."
    />
    <meta name="twitter:image" content="https://silinex.xyz/og.png" />
    <title>Silicon Nexus</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Silicon Nexus",
        "url": "https://silinex.xyz/",
        "description": "homepage description"
      }
    </script>
  </head>
  <body>
    <p class="nx-static-def">Homepage static blurb.</p>
    <div id="root"></div>
  </body>
</html>
`;

function metaContent(html: string, identAttr: 'name' | 'property', key: string): string | null {
  const re = new RegExp(
    `<meta\\s+${identAttr}="${key}" content="([^"]*)"`,
    'i'
  );
  return html.match(re)?.[1] ?? null;
}

test('normalizeSpaPath strips trailing slashes except homepage', () => {
  assert.equal(normalizeSpaPath('/docs'), '/docs');
  assert.equal(normalizeSpaPath('/docs/'), '/docs');
  assert.equal(normalizeSpaPath('/docs/?q=1'), '/docs');
  assert.equal(normalizeSpaPath('/'), '/');
  assert.equal(normalizeSpaPath('//about//'), '/about');
});

test('mapped marketing blurbs are unique and long enough for non-JS crawlers', () => {
  const blurbs = Object.values(SPA_PAGE_META_BY_PATH).map((page) => page.blurb);
  assert.equal(new Set(blurbs).size, blurbs.length);
  for (const page of Object.values(SPA_PAGE_META_BY_PATH)) {
    assert.ok(page.blurb.length > 200, `${page.path} blurb should exceed 200 chars`);
    assert.notEqual(page.title, '');
    assert.notEqual(page.description, '');
  }
});

test('unknown SPA routes keep homepage defaults', () => {
  assert.equal(resolveSpaPageMeta('/console').path, '/');
  assert.equal(resolveSpaPageMeta('/feed/some-slug').title, HOME_SPA_META.title);
  assert.equal(spaCanonicalUrl(APP_URL, '/not-a-page'), `${APP_URL}/`);
});

test('rewrites /docs identity on a sample index.html', () => {
  const docs = resolveSpaPageMeta('/docs');
  const out = rewriteSpaHtml(SAMPLE_SHELL, '/docs', APP_URL);

  assert.match(out, /<title>API quickstart · Silicon Nexus<\/title>/);
  assert.equal(metaContent(out, 'name', 'description'), docs.description);
  assert.match(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/docs" \/>/);
  assert.equal(metaContent(out, 'property', 'og:url'), 'https://silinex.xyz/docs');
  assert.equal(metaContent(out, 'property', 'og:title'), docs.title);
  assert.equal(metaContent(out, 'property', 'og:description'), docs.description);
  assert.equal(metaContent(out, 'name', 'twitter:title'), docs.title);
  assert.equal(metaContent(out, 'name', 'twitter:description'), docs.description);
  assert.equal(metaContent(out, 'property', 'og:image'), 'https://silinex.xyz/og.png');
  assert.equal(metaContent(out, 'name', 'twitter:image'), 'https://silinex.xyz/og.png');
  assert.match(out, /<p class="nx-static-def">[\s\S]*API quickstart[\s\S]*<\/p>/);
  assert.match(out, /"url":"https:\/\/silinex\.xyz\/docs"/);
  assert.doesNotMatch(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/" \/>/);
  assert.doesNotMatch(out, /<title>Silicon Nexus<\/title>/);
});

test('/docs/ trailing slash matches /docs identity', () => {
  const a = rewriteSpaHtml(SAMPLE_SHELL, '/docs', APP_URL);
  const b = rewriteSpaHtml(SAMPLE_SHELL, '/docs/', APP_URL);
  assert.equal(a, b);
});

test('rewrites the real index.html shell for /docs', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const docs = resolveSpaPageMeta('/docs');
  const out = rewriteSpaHtml(html, '/docs', APP_URL);

  assert.match(out, /<title>API quickstart · Silicon Nexus<\/title>/);
  assert.equal(metaContent(out, 'name', 'description'), docs.description);
  assert.match(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/docs" \/>/);
  assert.equal(metaContent(out, 'property', 'og:url'), 'https://silinex.xyz/docs');
  assert.equal(metaContent(out, 'property', 'og:title'), docs.title);
  assert.equal(metaContent(out, 'property', 'og:description'), docs.description);
  assert.equal(metaContent(out, 'name', 'twitter:title'), docs.title);
  assert.equal(metaContent(out, 'name', 'twitter:description'), docs.description);
  assert.equal(metaContent(out, 'property', 'og:image'), 'https://silinex.xyz/og.png');
  assert.match(out, new RegExp(`<p class="nx-static-def">${docs.blurb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>`));
});

test('homepage rewrite keeps apex canonical with trailing slash', () => {
  const out = rewriteSpaHtml(SAMPLE_SHELL, '/', `${APP_URL}/`);
  assert.match(out, /<title>Silicon Nexus<\/title>/);
  assert.match(out, /<link rel="canonical" href="https:\/\/silinex\.xyz\/" \/>/);
  assert.equal(metaContent(out, 'property', 'og:url'), 'https://silinex.xyz/');
});
