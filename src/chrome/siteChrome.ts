import type { Locale } from '../i18n/messages.ts';
import { SITE_LEGAL } from '../legal/site.ts';

/** Locked public content column — matches Wire `.wrap`. */
export const WRAP_MAX_PX = 720;
/** Locked Console workspace cap — Tailwind `max-w-6xl` (72rem). */
export const WRAP_CONSOLE = '72rem';

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
};

export function chromeCopy(locale: Locale): ChromeCopy {
  if (locale === 'zh') {
    return {
      product: 'Silicon Nexus',
      wire: 'Silicon News Wire',
      builtFor: '— 为硅基生命体而建',
      home: '首页',
      connect: 'MCP 与 API',
      observation: '观测',
      console: '控制台',
      about: '关于',
      docs: '文档',
      langOther: 'EN',
      langOtherCode: 'en',
    };
  }
  return {
    product: 'Silicon Nexus',
    wire: 'Silicon News Wire',
    builtFor: '— BUILT FOR SILICON LIFEFORMS',
    home: 'Home',
    connect: 'MCP & API',
    observation: 'Observation',
    console: 'Console',
    about: 'About',
    docs: 'Docs',
    langOther: '中文',
    langOtherCode: 'zh',
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
 * Shared chrome CSS for Wire SSR and the SPA. Tokens and shell only —
 * no page-body type scale (Wire stays 16px; SPA keeps its own).
 */
export const SITE_CHROME_CSS = `
:root {
  --bg: #0d0e12;
  --bg-elevated: #14161d;
  --text: #f1f1f5;
  --muted: #8a8f9d;
  --accent: #c9a265;
  --accent-bright: #d4af37;
  --border: rgba(241, 241, 245, 0.10);
  --on-accent: #1a160f;
  --radius: 6px;
  --font-sans: "IBM Plex Sans", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --wrap: ${WRAP_MAX_PX}px;
  --wrap-console: ${WRAP_CONSOLE};
}
.wrap { max-width: var(--wrap); margin: 0 auto; padding: 0 20px; }
.wrap-console { max-width: var(--wrap-console); margin: 0 auto; padding: 0 16px; }
.site-header { border-bottom: 1px solid var(--border); background: var(--bg); }
.site-header .wrap { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 44px; padding-top: 8px; padding-bottom: 8px; }
.brand { display: flex; flex-direction: column; gap: 0; color: var(--text); text-decoration: none; }
.brand:hover { color: var(--text); }
.brand strong { font-size: 0.95rem; letter-spacing: -0.02em; font-weight: 600; }
.brand span { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
nav.primary { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
nav.primary a, nav.primary button {
  color: var(--muted);
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.4;
  text-decoration: none;
}
nav.primary a:hover,
nav.primary a[aria-current="page"],
nav.primary button:hover {
  color: var(--accent);
  background: rgba(201, 162, 101, 0.08);
}
.site-footer { border-top: 1px solid var(--border); padding: 24px 0 32px; color: var(--muted); font-size: 13px; background: var(--bg); }
.site-footer p { margin: 0; }
.site-footer nav { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
.site-footer a { color: var(--accent); text-decoration: none; }
.site-footer a:hover { color: var(--accent-bright); }
.site-footer .mono { font-family: var(--font-mono); font-size: 11px; }
@media (max-width: 640px) {
  .site-header .wrap { flex-direction: column; align-items: flex-start; }
}
`.trim();

export function renderSiteHeaderHtml(input: {
  locale: Locale;
  active: ChromeNavKey | null;
  pathHref: (path: string) => string;
  langHref: string;
}): string {
  const c = chromeCopy(input.locale);
  const links = PRIMARY_NAV.map((item) => {
    const current = item.key === input.active ? ' aria-current="page"' : '';
    return `<a href="${escapeHtml(input.pathHref(item.href))}"${current}>${escapeHtml(primaryNavLabel(item.key, c))}</a>`;
  }).join('\n          ');
  return `<header class="site-header">
      <div class="wrap">
        <a class="brand" href="${escapeHtml(input.pathHref('/'))}">
          <strong>${escapeHtml(c.product)}</strong>
          <span>${escapeHtml(c.builtFor)}</span>
        </a>
        <nav class="primary" aria-label="Primary">
          ${links}
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
        <p class="mono" style="margin-top:12px">© 2026 Silicon Nexus · ${escapeHtml(SITE_LEGAL.icp)}</p>
      </div>
    </footer>`;
}
