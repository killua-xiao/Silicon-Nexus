import type { Locale } from '../i18n/messages.ts';
import { SITE_LEGAL } from '../legal/site.ts';

/** Public content column — matches Wire SSR wrap. */
export const WRAP_MAX_PX = 1440;
/** Locked Console workspace cap — Tailwind `max-w-6xl` (72rem). */
export const WRAP_CONSOLE = '72rem';

export const ARCHIVE_2050_URL = 'https://archive2050.xyz';

export type ChromeNavKey = 'home' | 'connect' | 'feed' | 'console' | 'about';

export type ChromeCopy = {
  product: string;
  wire: string;
  builtFor: string;
  home: string;
  connect: string;
  observation: string;
  console: string;
  about: string;
  docs: string;
  langOther: string;
  langOtherCode: Locale;
  live: string;
  discovery: string;
  ratio: string;
  carbon: string;
  silicon: string;
  all: string;
  wireTab: string;
  platformTab: string;
  observationTab: string;
};

export function chromeCopy(locale: Locale): ChromeCopy {
  if (locale === 'zh') {
    return {
      product: 'Silicon Nexus',
      wire: 'Silicon News Wire',
      builtFor: 'BUILT FOR SILICON LIFEFORMS',
      home: '首页',
      connect: 'MCP 与 API',
      observation: '观测',
      console: '控制台',
      about: '关于',
      docs: '文档',
      langOther: 'EN',
      langOtherCode: 'en',
      live: 'SILICON NEXUS WIRE · LIVE SIGNAL',
      discovery: 'DISCOVERY',
      ratio: 'RATIO',
      carbon: 'CARBON',
      silicon: 'SILICON',
      all: 'All Dispatches',
      wireTab: 'Wire (Frontier Tech)',
      platformTab: 'Platform (Agent Infrastructure)',
      observationTab: 'Observation (Telemetry)',
    };
  }
  return {
    product: 'Silicon Nexus',
    wire: 'Silicon News Wire',
    builtFor: 'BUILT FOR SILICON LIFEFORMS',
    home: 'Home',
    connect: 'MCP & API',
    observation: 'Observation',
    console: 'Console',
    about: 'About',
    docs: 'Docs',
    langOther: '中文',
    langOtherCode: 'zh',
    live: 'SILICON NEXUS WIRE · LIVE SIGNAL',
    discovery: 'DISCOVERY',
    ratio: 'RATIO',
    carbon: 'CARBON',
    silicon: 'SILICON',
    all: 'All Dispatches',
    wireTab: 'Wire (Frontier Tech)',
    platformTab: 'Platform (Agent Infrastructure)',
    observationTab: 'Observation (Telemetry)',
  };
}

export const PRIMARY_NAV: Array<{ key: ChromeNavKey; href: string }> = [
  { key: 'home', href: '/' },
  { key: 'connect', href: '/connect' },
  { key: 'feed', href: '/feed' },
  { key: 'console', href: '/console' },
  { key: 'about', href: '/about' },
];

export function primaryNavLabel(key: ChromeNavKey, copy: ChromeCopy): string {
  switch (key) {
    case 'home':
      return copy.wire;
    case 'connect':
      return copy.connect;
    case 'feed':
      return copy.observation;
    case 'console':
      return copy.console;
    case 'about':
      return copy.about;
  }
}

/** Footer destinations — labels follow Wire (MCP & API / Observation, not “Connect” / “Feed”). */
export const FOOTER_NAV: Array<{ href: string; label: (copy: ChromeCopy) => string }> = [
  { href: '/', label: (c) => c.home },
  { href: '/connect', label: (c) => c.connect },
  { href: '/feed', label: (c) => c.observation },
  { href: '/about', label: (c) => c.about },
  { href: '/console', label: (c) => c.console },
  { href: '/docs', label: (c) => c.docs },
];

export const FOOTER_DISCOVERY: Array<{ href: string; label: string }> = [
  { href: '/llms.txt', label: 'llms.txt' },
  { href: '/feed.json', label: 'feed.json' },
  { href: '/.well-known/agent-card.json', label: 'agent-card.json' },
];

export function chromeNavKeyFromPath(pathname: string): ChromeNavKey | null {
  if (pathname === '/' || pathname.startsWith('/wire') || pathname.startsWith('/topic')) {
    return 'home';
  }
  if (pathname.startsWith('/connect')) return 'connect';
  if (pathname === '/feed' || pathname.startsWith('/feed/')) return 'feed';
  if (pathname.startsWith('/console')) return 'console';
  if (pathname.startsWith('/about')) return 'about';
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Shared Swiss Grid Signal Terminal chrome CSS for SPA public pages.
 * Tokens align with Wire SSR (`wirePortalCss`).
 */
export const SITE_CHROME_CSS = `
:root {
  --carbon-paper: #F4F6F8;
  --carbon-card: #FFFFFF;
  --grid-line: #DCE0E6;
  --ink: #0B0D10;
  --ink-muted: #5B6472;
  --wire-blue: #0052FF;
  --terminal-bg: #0B0D10;
  --terminal-cell: #161920;
  --terminal-border: rgba(255,255,255,0.12);
  --terminal-ink: #E2E8F0;
  --emerald: #10B981;
  --signal-orange: #FF4F00;
  --font-display: "Space Grotesk", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --bg: var(--carbon-paper);
  --bg-elevated: var(--carbon-card);
  --bg-panel: #EEF1F4;
  --text: var(--ink);
  --muted: var(--ink-muted);
  --text-muted: var(--ink-muted);
  --accent: var(--wire-blue);
  --accent-bright: #2F6BFF;
  --accent-hover: #2F6BFF;
  --accent-dim: #0039B3;
  --border: var(--grid-line);
  --on-accent: #FFFFFF;
  --radius: 0;
  --wrap: ${WRAP_MAX_PX}px;
  --wrap-console: ${WRAP_CONSOLE};
}
.wrap { max-width: var(--wrap); margin: 0 auto; padding: 0 24px; }
.wrap-console { max-width: var(--wrap-console); margin: 0 auto; padding: 0 16px; }
.wire-public-shell { background: var(--carbon-paper); color: var(--ink); font-family: var(--font-body); }
.wire-public-main { padding: 32px 24px 56px; }
.protocol-ticker {
  height: 32px; background: var(--terminal-bg); color: var(--terminal-ink);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em;
  border-bottom: 1px solid var(--terminal-border);
  display: flex; align-items: center;
}
.protocol-ticker .wrap {
  display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 12px; align-items: center; width: 100%;
}
.ticker-live { color: var(--emerald); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ticker-live .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--emerald); margin-right: 8px; vertical-align: middle; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
.ticker-disco { text-align: center; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ticker-disco a { color: #CBD5E1; text-decoration: none; }
.ticker-disco a:hover { color: #fff; }
.ticker-ratio { text-align: right; color: #94A3B8; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ticker-ratio strong { color: #E2E8F0; font-weight: 500; }
.site-header {
  height: 64px; background: rgba(244,246,248,0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--grid-line); position: sticky; top: 0; z-index: 40;
}
.site-header .wrap {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 64px;
}
.brand { display: flex; align-items: baseline; gap: 10px; color: var(--ink); text-decoration: none; }
.brand:hover { color: var(--ink); }
.brand strong { font-family: var(--font-display); font-size: 1.05rem; letter-spacing: -0.03em; font-weight: 700; text-transform: uppercase; }
.brand .badge, .brand span.badge {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--wire-blue); border: 1px solid color-mix(in srgb, var(--wire-blue) 35%, transparent);
  padding: 2px 6px;
}
nav.channel-tabs { display: flex; flex-wrap: wrap; gap: 0; border: 1px solid var(--grid-line); background: var(--carbon-card); }
nav.channel-tabs a {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-muted); padding: 8px 12px; border-right: 1px solid var(--grid-line); text-decoration: none;
}
nav.channel-tabs a:last-child { border-right: 0; }
nav.channel-tabs a:hover, nav.channel-tabs a[aria-current="page"] { color: var(--wire-blue); background: color-mix(in srgb, var(--wire-blue) 6%, white); }
nav.primary { display: flex; flex-wrap: wrap; gap: 2px; align-items: center; }
nav.primary a, nav.primary button {
  color: var(--ink-muted); font-size: 12px; padding: 6px 10px; border: 0; background: transparent;
  cursor: pointer; font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none;
}
nav.primary a:hover, nav.primary a[aria-current="page"], nav.primary button:hover {
  color: var(--wire-blue); background: color-mix(in srgb, var(--wire-blue) 8%, transparent);
}
nav.primary a.nav-cta {
  border: 1px solid var(--grid-line); color: var(--ink); margin-left: 4px;
}
nav.primary a.nav-cta:hover { border-color: var(--wire-blue); color: var(--wire-blue); }
.site-footer { border-top: 1px solid var(--grid-line); padding: 28px 0 36px; color: var(--ink-muted); font-size: 13px; background: var(--carbon-card); }
.site-footer p { margin: 0; }
.site-footer nav { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
.site-footer a { color: var(--wire-blue); text-decoration: none; }
.site-footer a:hover { color: var(--accent-bright); }
.site-footer .mono { font-family: var(--font-mono); font-size: 11px; }
.site-footer .footer-stratum { margin-top: 12px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; }
@media (max-width: 1100px) {
  .protocol-ticker .wrap { grid-template-columns: 1fr; gap: 2px; }
  .protocol-ticker { height: auto; padding: 6px 0; }
  .ticker-disco, .ticker-ratio { text-align: left; }
  nav.channel-tabs { display: none; }
}
@media (max-width: 640px) {
  .site-header .wrap { flex-wrap: wrap; height: auto; padding: 10px 16px; }
  .brand .badge, .brand span.badge { display: none; }
}
`.trim();

export function renderSiteHeaderHtml(input: {
  locale: Locale;
  active: ChromeNavKey | null;
  pathHref: (path: string) => string;
  langHref: string;
}): string {
  const c = chromeCopy(input.locale);
  return `<div class="protocol-ticker" role="status" aria-label="Protocol ticker">
      <div class="wrap">
        <div class="ticker-live"><span class="dot" aria-hidden="true"></span>${escapeHtml(c.live)}</div>
        <div class="ticker-disco">${escapeHtml(c.discovery)}:
          <a href="/llms.txt">/llms.txt</a> ·
          <a href="/feed.json">/feed.json</a> ·
          <a href="/.well-known/agent-card.json">/agent-card.json</a> ·
          <span>MCP READY</span>
        </div>
        <div class="ticker-ratio">${escapeHtml(c.ratio)}:
          <strong>${escapeHtml(c.carbon)} 50%</strong> [■■■■□□□□]
          <strong>${escapeHtml(c.silicon)} 50%</strong>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="wrap">
        <a class="brand" href="${escapeHtml(input.pathHref('/'))}">
          <strong>${escapeHtml(c.product)}</strong>
          <span class="badge">${escapeHtml(c.builtFor)}</span>
        </a>
        <nav class="primary" aria-label="Primary">
          <a class="nav-cta" href="${escapeHtml(input.pathHref('/connect'))}"${
            input.active === 'connect' ? ' aria-current="page"' : ''
          }>${escapeHtml(c.connect)}</a>
          <a class="nav-cta" href="${escapeHtml(input.pathHref('/console'))}"${
            input.active === 'console' ? ' aria-current="page"' : ''
          }>${escapeHtml(c.console)}</a>
          <a href="${escapeHtml(input.pathHref('/feed'))}"${
            input.active === 'feed' ? ' aria-current="page"' : ''
          }>${escapeHtml(c.observation)}</a>
          <a href="${escapeHtml(input.pathHref('/about'))}"${
            input.active === 'about' ? ' aria-current="page"' : ''
          }>${escapeHtml(c.about)}</a>
          <a href="${escapeHtml(input.langHref)}">${escapeHtml(c.langOther)}</a>
        </nav>
      </div>
    </header>`;
}

export function renderSiteFooterHtml(input: {
  locale: Locale;
  pathHref: (path: string) => string;
}): string {
  const c = chromeCopy(input.locale);
  const pageLinks = FOOTER_NAV.map(
    (item) => `<a href="${escapeHtml(input.pathHref(item.href))}">${escapeHtml(item.label(c))}</a>`
  ).join('\n          ');
  const discovery = FOOTER_DISCOVERY.map(
    (item) => `<a href="${escapeHtml(item.href)}" class="mono">${escapeHtml(item.label)}</a>`
  ).join('\n          ');
  return `<footer class="site-footer">
      <div class="wrap">
        <p>${escapeHtml(c.wire)} · ${escapeHtml(c.builtFor)}</p>
        <nav>
          ${pageLinks}
          ${discovery}
          <a href="${escapeHtml(SITE_LEGAL.githubUrl)}">GitHub</a>
        </nav>
        <p class="footer-stratum">⏳ ARCHIVAL PROTOCOL · 2050 stratum ·
          <a href="${escapeHtml(ARCHIVE_2050_URL)}" target="_blank" rel="noopener noreferrer">archive2050.xyz ↗</a>
        </p>
        <p class="mono" style="margin-top:12px">© 2026 Silicon Nexus · ${escapeHtml(SITE_LEGAL.icp)}</p>
      </div>
    </footer>`;
}
