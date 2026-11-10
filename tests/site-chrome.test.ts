import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  FOOTER_DISCOVERY,
  PRIMARY_NAV,
  SITE_CHROME_CSS,
  WRAP_CONSOLE,
  WRAP_MAX_PX,
  chromeCopy,
  chromeNavKeyFromPath,
  primaryNavLabel,
  renderSiteFooterHtml,
  renderSiteHeaderHtml,
} from '../src/chrome/siteChrome.ts';
import { SiteFooter } from '../src/components/SiteFooter.tsx';
import { SiteHeader } from '../src/components/SiteHeader.tsx';
import { I18nProvider } from '../src/i18n/I18nProvider.tsx';
import { SITE_LEGAL } from '../src/legal/site.ts';
import { renderHomeHtml } from '../src/server/wirePublic.ts';

function renderSpaChrome(path: string): string {
  return renderToStaticMarkup(
    React.createElement(
      I18nProvider,
      null,
      React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(SiteHeader), React.createElement(SiteFooter))
    )
  );
}

describe('shared public chrome', () => {
  test('CSS tokens and wrap widths are locked', () => {
    assert.match(SITE_CHROME_CSS, /--carbon-paper:\s*#F4F6F8/);
    assert.match(SITE_CHROME_CSS, /--wire-blue:\s*#0052FF/);
    assert.match(SITE_CHROME_CSS, /--accent:\s*var\(--wire-blue\)/);
    assert.match(SITE_CHROME_CSS, /--border:\s*var\(--grid-line\)/);
    assert.match(SITE_CHROME_CSS, /\.wrap\s*\{[^}]*max-width:\s*var\(--wrap\)/s);
    assert.match(SITE_CHROME_CSS, /nav\.primary/);
    assert.match(SITE_CHROME_CSS, /protocol-ticker/);
    assert.equal(WRAP_MAX_PX, 1440);
    assert.equal(WRAP_CONSOLE, '72rem');
    assert.match(SITE_CHROME_CSS, /--wrap:\s*1440px/);
    assert.match(SITE_CHROME_CSS, /--wrap-console:\s*72rem/);
    assert.match(SITE_CHROME_CSS, /\.wrap-console\s*\{[^}]*max-width:\s*var\(--wrap-console\)/s);
    assert.doesNotMatch(SITE_CHROME_CSS, /--wrap:\s*720px/);
    assert.match(SITE_CHROME_CSS, /@media \(max-width: 640px\)/);
    assert.doesNotMatch(SITE_CHROME_CSS, /linear-gradient|#7c3aed|#8b5cf6/i);
  });

  test('primary nav order is Wire → MCP & API → Observation → Console → About', () => {
    const en = chromeCopy('en');
    assert.deepEqual(
      PRIMARY_NAV.map((item) => [item.href, primaryNavLabel(item.key, en)]),
      [
        ['/', 'Silicon News Wire'],
        ['/connect', 'MCP & API'],
        ['/feed', 'Observation'],
        ['/console', 'Console'],
        ['/about', 'About'],
      ]
    );
    const zh = chromeCopy('zh');
    assert.equal(zh.builtFor, 'BUILT FOR SILICON LIFEFORMS');
    assert.equal(zh.connect, 'MCP 与 API');
    assert.equal(zh.observation, '观测');
  });

  test('aria-current follows the public route', () => {
    assert.equal(chromeNavKeyFromPath('/'), 'home');
    assert.equal(chromeNavKeyFromPath('/wire/a-slug'), 'home');
    assert.equal(chromeNavKeyFromPath('/topic/wire'), 'home');
    assert.equal(chromeNavKeyFromPath('/connect'), 'connect');
    assert.equal(chromeNavKeyFromPath('/feed'), 'feed');
    assert.equal(chromeNavKeyFromPath('/feed/an-item'), 'feed');
    assert.equal(chromeNavKeyFromPath('/feed.json'), null);
    assert.equal(chromeNavKeyFromPath('/console'), 'console');
    assert.equal(chromeNavKeyFromPath('/console/agents'), 'console');
    assert.equal(chromeNavKeyFromPath('/about'), 'about');
    assert.equal(chromeNavKeyFromPath('/docs'), null);
  });

  test('header and footer HTML match the shared DOM contract', () => {
    const header = renderSiteHeaderHtml({
      locale: 'en',
      active: 'connect',
      pathHref: (path) => path,
      langHref: '/connect?lang=zh',
    });
    assert.match(header, /protocol-ticker/);
    assert.match(header, /class="site-header"/);
    assert.match(header, /class="brand"/);
    assert.match(header, /BUILT FOR SILICON LIFEFORMS/);
    assert.match(header, /<nav class="primary" aria-label="Primary">/);
    assert.match(header, /href="\/connect"[^>]*aria-current="page"/);
    assert.doesNotMatch(header, /href="\/"[^>]*aria-current="page"/);
    assert.match(header, />中文</);

    const footer = renderSiteFooterHtml({ locale: 'en', pathHref: (path) => path });
    assert.match(footer, /class="site-footer"/);
    assert.match(footer, />Home</);
    assert.match(footer, />MCP &amp; API</);
    assert.match(footer, />Observation</);
    assert.match(footer, />About</);
    for (const item of FOOTER_DISCOVERY) {
      assert.match(footer, new RegExp(item.label.replace('.', '\\.')));
    }
    assert.match(footer, /agent-card\.json/);
    assert.match(footer, new RegExp(SITE_LEGAL.icp.replace(/[()]/g, '\\$&')));
  });

  test('Wire home HTML inlines the portal shell (ticker + header + footer)', () => {
    const html = renderHomeHtml('https://silinex.xyz', [], 'en');
    assert.match(html, /--carbon-paper:\s*#F4F6F8/);
    assert.match(html, /--wire-blue:\s*#0052FF/);
    assert.match(html, /protocol-ticker/);
    assert.match(html, /class="site-header"/);
    assert.match(html, /class="brand"/);
    assert.match(html, /<nav class="primary"/);
    assert.match(html, /BUILT FOR SILICON LIFEFORMS/);
    assert.match(html, /aria-current="page">All Dispatches</);
    assert.match(html, /class="site-footer"/);
    assert.match(html, /llms\.txt/);
    assert.match(html, /feed\.json/);
    assert.match(html, /agent-card\.json/);
    assert.doesNotMatch(html, /Pricing/);
    // Public SPA chrome shares the light Swiss Grid shell with Wire.
    assert.match(SITE_CHROME_CSS, /--carbon-paper:\s*#F4F6F8/);
  });

  test('SPA /connect /feed /about share the Wire header and footer DOM', () => {
    const wire = renderHomeHtml('https://silinex.xyz', [], 'en');
    for (const path of ['/connect', '/feed', '/about']) {
      const spa = renderSpaChrome(path);
      assert.match(spa, /protocol-ticker/);
      assert.match(spa, /class="site-header"/);
      assert.match(spa, /class="brand"/);
      assert.match(spa, /<nav class="primary" aria-label="Primary">/);
      assert.match(spa, /Silicon Nexus/);
      assert.match(spa, /MCP &amp; API/);
      assert.match(spa, /Observation/);
      assert.match(spa, /class="site-footer"/);
      assert.match(spa, /Silicon News Wire/);
      assert.match(spa, /llms\.txt/);
      assert.match(spa, /feed\.json/);
      assert.match(spa, /agent-card\.json/);
      assert.match(spa, /archive2050\.xyz/);
      assert.match(spa, /鲁ICP备2026026469号-1/);
      assert.ok(wire.includes('class="site-header"'));
    }
    const connect = renderSpaChrome('/connect');
    assert.match(connect, /aria-current="page"[^>]*>MCP &amp; API</);
    const about = renderSpaChrome('/about');
    assert.match(about, /aria-current="page"[^>]*>About</);
    const feed = renderSpaChrome('/feed');
    assert.match(feed, /aria-current="page"[^>]*>Observation</);
  });
});
