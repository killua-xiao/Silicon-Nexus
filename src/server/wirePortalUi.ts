/**
 * Swiss Grid Signal Terminal — Wire portal chrome, CSS, and homepage matrix.
 * Carbon reading surface + Silicon terminal inspector.
 */
import type { Locale } from '../i18n/messages.ts';
import { SITE_LEGAL } from '../legal/site.ts';
import { localizeWireArticle } from './wireLocalize.ts';
import type { WireArticle, WireCategorySlug } from './wireTypes.ts';
import { WIRE_CATEGORIES, wireCategory } from './wireTypes.ts';

export const WIRE_WRAP_PX = 1440;

export const ARCHITECTURE_SLUGS = new Set([
  'readable-by-carbon-native-to-silicon',
  'how-to-cite-a-wire-dispatch',
  'the-body-still-outlives-the-session',
  'a-fetch-is-a-log-not-a-trophy',
]);

/** Hero FEATURED DISPATCH considers articles published within this many days. */
export const FEATURED_RECENCY_DAYS = 7;

function signalScore(article: WireArticle): number {
  return (article.observations?.human || 0) * 2 + (article.observations?.bot || 0);
}

function bySignalThenRecency(a: WireArticle, b: WireArticle): number {
  const sig = signalScore(b) - signalScore(a);
  if (sig) return sig;
  return String(b.datePublished).localeCompare(String(a.datePublished));
}

function byRecency(a: WireArticle, b: WireArticle): number {
  return String(b.datePublished).localeCompare(String(a.datePublished));
}

/**
 * Pick FEATURED DISPATCH for the hero: highest-signal piece in the last
 * FEATURED_RECENCY_DAYS, else newest non-architecture article.
 */
export function pickFeaturedDispatch(
  articles: WireArticle[],
  nowMs: number = Date.now()
): WireArticle | null {
  if (!articles.length) return null;
  const pool = articles.filter((a) => !ARCHITECTURE_SLUGS.has(a.slug));
  if (!pool.length) return articles[0] || null;

  const cutoffMs = nowMs - FEATURED_RECENCY_DAYS * 24 * 60 * 60 * 1000;
  const recent = pool.filter((a) => {
    const t = Date.parse(a.datePublished);
    return Number.isFinite(t) && t >= cutoffMs;
  });
  if (recent.length) {
    return [...recent].sort(bySignalThenRecency)[0] || null;
  }
  return [...pool].sort(byRecency)[0] || null;
}

/** Hero / terminal bullets: distinct takeaways, never a second copy of the summary. */
export function previewTakeaways(
  summary: string,
  facts: Array<{ text: string }>,
  meta: { category: string; sourceName?: string | null; datePublished: string }
): string[] {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const summaryNorm = norm(summary);
  const distinct = facts
    .map((f) => f.text.trim())
    .filter(Boolean)
    .filter((t) => {
      const n = norm(t);
      if (!n) return false;
      if (n === summaryNorm) return false;
      if (summaryNorm && (summaryNorm.includes(n) || n.includes(summaryNorm.slice(0, 48)))) return false;
      return true;
    })
    .slice(0, 3);
  if (distinct.length >= 2) return distinct;
  return [
    `Category: ${meta.category}`,
    meta.sourceName ? `Source desk: ${meta.sourceName}` : 'Publisher: Silicon Nexus',
    `Published: ${meta.datePublished.slice(0, 10)}`,
    'agent_citable: true',
  ].slice(0, 3);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function langQuery(locale: Locale): string {
  return locale === 'zh' ? '?lang=zh' : '';
}

export function wireHref(path: string, locale: Locale): string {
  return `${path}${langQuery(locale)}`;
}

export function categoryLabel(slug: string, locale: Locale): string {
  const cat = wireCategory(slug);
  if (!cat) return slug;
  return locale === 'zh' ? cat.nameZh : cat.nameEn;
}

export function formatWireDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const fmt = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai',
  });
  return `${fmt.format(d)} +08:00`;
}

export function formatWireTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).formatToParts(d);
  const hh = parts.find((p) => p.type === 'hour')?.value || '00';
  const mm = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${hh}:${mm} +08:00`;
}

export function aggregateObservations(articles: WireArticle[]): { human: number; bot: number } {
  let human = 0;
  let bot = 0;
  for (const a of articles) {
    human += a.observations.human || 0;
    bot += a.observations.bot || 0;
  }
  return { human, bot };
}

function ratioBar(carbonPct: number): string {
  const filled = Math.round(Math.min(100, Math.max(0, carbonPct)) / 12.5);
  return `${'■'.repeat(filled)}${'□'.repeat(8 - filled)}`;
}

export function wirePortalCss(): string {
  return `
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
  --wire-wrap: ${WIRE_WRAP_PX}px;
  --wrap: ${WIRE_WRAP_PX}px;
  --wrap-console: 72rem;
  --radius: 0;
  --bg: var(--carbon-paper);
  --bg-elevated: var(--carbon-card);
  --text: var(--ink);
  --muted: var(--ink-muted);
  --accent: var(--wire-blue);
  --accent-bright: #2F6BFF;
  --border: var(--grid-line);
  --on-accent: #FFFFFF;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--carbon-paper); color: var(--ink); }
body { font-family: var(--font-body); font-size: 15px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
a { color: var(--wire-blue); text-decoration: none; }
a:hover { color: var(--accent-bright); }
:focus-visible { outline: 2px solid var(--wire-blue); outline-offset: 2px; }
.wrap { max-width: var(--wrap); margin: 0 auto; padding: 0 24px; }
.wrap-console { max-width: var(--wrap-console); margin: 0 auto; padding: 0 16px; }

/* Protocol ticker */
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
.ticker-disco a { color: #CBD5E1; }
.ticker-disco a:hover { color: #fff; }
.ticker-ratio { text-align: right; color: #94A3B8; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ticker-ratio strong { color: #E2E8F0; font-weight: 500; }

/* Header */
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
.brand .badge {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--wire-blue); border: 1px solid color-mix(in srgb, var(--wire-blue) 35%, transparent);
  padding: 2px 6px;
}
nav.primary { display: flex; flex-wrap: wrap; gap: 2px; align-items: center; }
nav.primary a, nav.primary button {
  color: var(--ink-muted); font-size: 12px; padding: 6px 10px; border: 0; background: transparent;
  cursor: pointer; font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none;
}
nav.primary a:hover, nav.primary a[aria-current="page"] {
  color: var(--wire-blue); background: color-mix(in srgb, var(--wire-blue) 8%, transparent);
}
nav.primary a.nav-cta {
  border: 1px solid var(--grid-line); color: var(--ink); margin-left: 4px;
}
nav.primary a.nav-cta:hover { border-color: var(--wire-blue); color: var(--wire-blue); }
.channel-tabs {
  display: flex; flex-wrap: wrap; gap: 0; border: 1px solid var(--grid-line); background: var(--carbon-card);
}
.channel-tabs a {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-muted); padding: 8px 12px; border-right: 1px solid var(--grid-line); text-decoration: none;
}
.channel-tabs a:last-child { border-right: 0; }
.channel-tabs a:hover, .channel-tabs a[aria-current="page"] { color: var(--wire-blue); background: color-mix(in srgb, var(--wire-blue) 6%, white); }

/* Hero 7:5 */
.hero-grid {
  display: grid; grid-template-columns: 7fr 5fr; border-bottom: 1px solid var(--grid-line);
  background: var(--carbon-card);
}
.hero-editorial { padding: 40px 28px 36px; border-right: 1px solid var(--grid-line); }
.hero-eyebrow {
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted);
  margin: 0 0 16px;
}
.hero-eyebrow .tag { color: var(--wire-blue); border: 1px solid color-mix(in srgb, var(--wire-blue) 40%, transparent); padding: 2px 8px; }
.hero-eyebrow .fetch-badge { color: var(--emerald); }
.hero-editorial h1 {
  font-family: var(--font-display); font-weight: 700; letter-spacing: -0.03em; line-height: 1.12;
  font-size: clamp(2.25rem, 4vw, 3.75rem); margin: 0 0 18px; color: var(--ink);
}
.hero-summary { margin: 0; padding: 0; list-style: none; }
.hero-summary li {
  position: relative; padding: 8px 0 8px 16px; border-top: 1px solid var(--grid-line);
  color: var(--ink-muted); font-size: 14px;
}
.hero-summary li::before { content: ""; position: absolute; left: 0; top: 15px; width: 6px; height: 6px; background: var(--wire-blue); }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 13px; font-weight: 600;
  font-family: var(--font-body); border: 1px solid transparent; cursor: pointer;
}
.btn-primary { background: var(--wire-blue); color: #fff; }
.btn-primary:hover { background: var(--accent-bright); color: #fff; }
.btn-ghost { border-color: var(--grid-line); color: var(--ink); background: transparent; }
.btn-ghost:hover { border-color: var(--wire-blue); color: var(--wire-blue); }

/* Terminal inspector */
.hero-terminal {
  background: var(--terminal-bg); color: var(--terminal-ink); padding: 0; display: flex; flex-direction: column; min-height: 100%;
}
.terminal-bar {
  display: flex; align-items: stretch; border-bottom: 1px solid var(--terminal-border);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
}
.terminal-bar button {
  flex: 1; background: transparent; border: 0; border-right: 1px solid var(--terminal-border);
  color: #94A3B8; padding: 12px 8px; cursor: pointer; font: inherit; text-transform: uppercase;
}
.terminal-bar button:last-child { border-right: 0; }
.terminal-bar button[aria-selected="true"] { color: #fff; background: var(--terminal-cell); box-shadow: inset 0 -2px 0 var(--emerald); }
.terminal-pane { flex: 1; padding: 16px 18px; overflow: auto; max-height: 420px; }
.terminal-pane pre {
  margin: 0; font-family: var(--font-mono); font-size: 12px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; color: #CBD5E1;
}
.terminal-pane .tok-key { color: #7DD3FC; }
.terminal-pane .tok-str { color: #86EFAC; }
.terminal-pane .tok-bool { color: #FBBF24; }
.terminal-foot {
  border-top: 1px solid var(--terminal-border); padding: 10px 14px; display: flex; gap: 8px; align-items: center; justify-content: space-between;
  font-family: var(--font-mono); font-size: 11px; background: var(--terminal-cell);
}
.terminal-foot code { color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.terminal-foot button {
  border: 1px solid var(--terminal-border); background: transparent; color: var(--emerald);
  font: inherit; padding: 6px 10px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0;
}
.terminal-foot button:hover { border-color: var(--emerald); }

/* Matrix */
.matrix {
  display: grid; grid-template-columns: 3fr 5fr 4fr; border-bottom: 1px solid var(--grid-line); min-height: 60vh;
}
.matrix-col { border-right: 1px solid var(--grid-line); background: var(--carbon-paper); min-width: 0; }
.matrix-col:last-child { border-right: 0; }
.matrix-head {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--ink-muted); padding: 14px 16px; border-bottom: 1px solid var(--grid-line); background: var(--carbon-card);
  display: flex; justify-content: space-between; align-items: center;
}
.matrix-head .pulse { color: var(--signal-orange); }

.feed-list { list-style: none; margin: 0; padding: 0; }
.feed-list li { border-bottom: 1px solid var(--grid-line); padding: 14px 16px; }
.feed-list time { font-family: var(--font-mono); font-size: 11px; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.feed-list .cat { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--wire-blue); margin: 6px 0; }
.feed-list a.title { color: var(--ink); font-weight: 600; font-size: 14px; letter-spacing: -0.02em; display: block; }
.feed-list a.title:hover { color: var(--wire-blue); }
.state-pills { display: flex; gap: 6px; margin-top: 8px; font-family: var(--font-mono); font-size: 10px; }
.state-pills a, .state-pills button {
  border: 1px solid var(--grid-line); color: var(--ink-muted); padding: 2px 6px; background: var(--carbon-card);
  cursor: pointer; font: inherit; text-decoration: none;
}
.state-pills a:hover, .state-pills button:hover, .state-pills button[aria-expanded="true"] {
  border-color: var(--wire-blue); color: var(--wire-blue);
}

.deep-card {
  border-bottom: 1px solid var(--grid-line); padding: 20px 18px; background: var(--carbon-card);
}
.deep-card + .deep-card { border-top: 0; }
.deep-card .cat { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--wire-blue); margin: 0 0 8px; }
.deep-card h2 { font-family: var(--font-display); font-size: 1.25rem; letter-spacing: -0.03em; margin: 0 0 8px; font-weight: 700; line-height: 1.25; }
.deep-card h2 a { color: var(--ink); }
.deep-card h2 a:hover { color: var(--wire-blue); }
.deep-card .lede { color: var(--ink-muted); margin: 0 0 10px; font-size: 14px; }
.deep-card .meta { font-family: var(--font-mono); font-size: 11px; color: var(--ink-muted); margin: 0 0 10px; font-variant-numeric: tabular-nums; }
.inline-preview {
  display: none; margin-top: 12px; background: var(--terminal-bg); color: #CBD5E1; border: 1px solid var(--terminal-border);
  padding: 12px; font-family: var(--font-mono); font-size: 11px; line-height: 1.5; white-space: pre-wrap; max-height: 220px; overflow: auto;
}
.inline-preview.is-open { display: block; }
.req-bar { margin-top: 14px; }
.req-bar .labels {
  display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ink-muted); margin-bottom: 6px; font-variant-numeric: tabular-nums;
}
.req-track { height: 6px; background: var(--grid-line); display: flex; overflow: hidden; }
.req-track .human { background: var(--wire-blue); height: 100%; }
.req-track .bot { background: var(--emerald); height: 100%; }

.widget {
  border-bottom: 1px solid var(--grid-line); padding: 16px; background: var(--carbon-card);
}
.widget h3 {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--ink-muted); margin: 0 0 12px; font-weight: 500;
}
.radar-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--grid-line); border: 1px solid var(--grid-line); }
.radar-stats div { background: var(--carbon-card); padding: 14px; }
.radar-stats .val { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; }
.radar-stats .val.carbon { color: var(--wire-blue); }
.radar-stats .val.silicon { color: var(--emerald); }
.radar-stats .lbl { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); margin-top: 4px; }
.radar-note { margin: 12px 0 0; font-size: 12px; color: var(--ink-muted); }
.stratum-seal {
  background: var(--terminal-bg); color: var(--terminal-ink);
  border: 1px solid var(--terminal-border); padding: 14px;
}
.stratum-seal .seal-kicker {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--signal-orange); margin: 0 0 10px; display: flex; align-items: center; gap: 8px;
}
.stratum-seal .seal-kicker .hourglass { font-size: 12px; line-height: 1; }
.stratum-seal p {
  margin: 0; font-family: var(--font-mono); font-size: 11px; line-height: 1.55; color: #94A3B8;
}
.stratum-seal a {
  color: var(--emerald); border-bottom: 1px solid color-mix(in srgb, var(--emerald) 40%, transparent);
}
.stratum-seal a:hover { color: #34D399; }
.footer-stratum {
  margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--grid-line);
  font-family: var(--font-mono); font-size: 11px; color: var(--ink-muted); line-height: 1.5;
}
.footer-stratum a { color: var(--wire-blue); }
.spec-list { list-style: none; margin: 0; padding: 0; }
.spec-list li { border-top: 1px solid var(--grid-line); padding: 12px 0; }
.spec-list li:first-child { border-top: 0; padding-top: 0; }
.spec-list a { color: var(--ink); font-weight: 600; font-size: 14px; letter-spacing: -0.02em; }
.spec-list a:hover { color: var(--wire-blue); }
.spec-list p { margin: 4px 0 0; font-size: 12px; color: var(--ink-muted); }

/* Article / topic shared */
.hero, .page-hero { padding: 32px 0 24px; border-bottom: 1px solid var(--grid-line); background: var(--carbon-card); }
.page-rail { padding-top: 0; padding-bottom: 48px; }
.page-rail > .matrix-head { margin: 0 -24px; padding-left: 24px; padding-right: 24px; }
.dispatch-article { background: var(--carbon-card); border: 1px solid var(--grid-line); border-top: 0; }
.dispatch-header { padding: 28px 24px 8px; border-bottom: 1px solid var(--grid-line); }
.dispatch-header h1 {
  font-family: var(--font-display); font-weight: 700; letter-spacing: -0.03em; line-height: 1.15;
  font-size: clamp(1.8rem, 3.2vw, 2.6rem); margin: 0 0 12px; color: var(--ink);
}
.dispatch-article .tldr { margin: 0; border: 0; border-bottom: 1px solid var(--grid-line); border-radius: 0; }
.dispatch-article .body { padding: 24px; max-width: none; }
.kicker { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--wire-blue); margin: 0 0 8px; }
h1 { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; margin: 0; }
.lede { color: var(--ink-muted); margin: 12px 0 0; font-size: 15px; }
.meta { color: var(--ink-muted); font-size: 14px; margin: 12px 0 0; }
.meta time { font-family: var(--font-mono); font-size: 13px; color: var(--ink); font-variant-numeric: tabular-nums; }
.byline { color: var(--ink-muted); font-size: 14px; margin: 6px 0 0; }
.source-notice {
  margin: 12px 0 0; padding: 12px 14px; border: 1px solid var(--grid-line); background: var(--carbon-paper);
  font-size: 13px; color: var(--ink-muted); line-height: 1.55;
}
.source-notice a { font-weight: 600; }
.list { list-style: none; padding: 0; margin: 0; }
.list li { border-bottom: 1px solid var(--grid-line); padding: 22px 8px; background: var(--carbon-card); }
.list h2 { font-family: var(--font-display); font-size: 1.15rem; margin: 0 0 6px; font-weight: 700; letter-spacing: -0.03em; }
.list h2 a { color: var(--ink); }
.list h2 a:hover { color: var(--wire-blue); }
.states { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; font-family: var(--font-mono); font-size: 11px; }
.states a { border: 1px solid var(--grid-line); padding: 2px 8px; color: var(--ink-muted); }
.states a:hover { border-color: var(--wire-blue); color: var(--wire-blue); }
.tldr { border: 1px solid var(--wire-blue); padding: 16px 18px; margin: 24px 0; background: var(--carbon-card); }
.tldr h2 { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--wire-blue); margin: 0 0 10px; font-weight: 500; }
.tldr ol { margin: 0; padding-left: 1.2rem; }
.tldr li { margin: 6px 0; }
.body { padding: 8px 0 40px; max-width: 42rem; font-size: 16px; line-height: 1.7; color: var(--ink); }
.body h2 {
  font-family: var(--font-display); font-size: 1.05rem; letter-spacing: -0.02em;
  margin: 1.6em 0 0.6em; font-weight: 700;
}
.body p { margin: 0 0 1.05em; }
.body ul { padding-left: 1.2rem; margin: 0 0 1em; }
.body code, .tldr code { font-family: var(--font-mono); font-size: 0.9em; }
.body a { border-bottom: 1px solid color-mix(in srgb, var(--wire-blue) 35%, transparent); }
.topics { display: flex; flex-wrap: wrap; gap: 0; margin-top: 16px; border: 1px solid var(--grid-line); }
.topics a {
  border-right: 1px solid var(--grid-line); color: var(--ink-muted); padding: 6px 10px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
}
.topics a:last-child { border-right: 0; }
.topics a:hover, .topics a[aria-current="page"] { color: var(--wire-blue); background: color-mix(in srgb, var(--wire-blue) 6%, white); }
.cta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.telemetry { border-top: 1px solid var(--grid-line); padding: 20px 0 8px; color: var(--ink-muted); font-size: 13px; }
.telemetry strong { color: var(--ink); font-family: var(--font-mono); font-weight: 500; font-variant-numeric: tabular-nums; }
.disclaimer { margin-top: 8px; font-size: 12px; color: var(--ink-muted); }
.empty { color: var(--ink-muted); padding: 32px 16px; }
article header { padding-top: 28px; }
.crumb { font-family: var(--font-mono); font-size: 11px; color: var(--ink-muted); margin: 0 0 12px; }
.crumb a { color: var(--ink-muted); }
main { min-height: 40vh; }

.site-footer { border-top: 1px solid var(--grid-line); padding: 28px 0 36px; color: var(--ink-muted); font-size: 13px; background: var(--carbon-card); }
.site-footer p { margin: 0; }
.site-footer nav { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
.site-footer a { color: var(--wire-blue); }
.site-footer .mono { font-family: var(--font-mono); font-size: 11px; }

@media (max-width: 1100px) {
  .protocol-ticker .wrap { grid-template-columns: 1fr; gap: 2px; }
  .protocol-ticker { height: auto; padding: 6px 0; }
  .ticker-disco, .ticker-ratio { text-align: left; }
  .hero-grid { grid-template-columns: 1fr; }
  .hero-editorial { border-right: 0; border-bottom: 1px solid var(--grid-line); }
  .matrix { grid-template-columns: 1fr; }
  .matrix-col { border-right: 0; border-bottom: 1px solid var(--grid-line); }
  .channel-tabs { display: none; }
}
@media (max-width: 640px) {
  .site-header .wrap { flex-wrap: wrap; height: auto; padding: 10px 16px; }
  .brand .badge { display: none; }
  h1 { font-size: 1.45rem; }
}
@media (prefers-reduced-motion: reduce) {
  .ticker-live .dot { box-shadow: none; }
}
`.trim();
}

type PortalCopy = {
  product: string;
  builtFor: string;
  live: string;
  discovery: string;
  ratio: string;
  carbon: string;
  silicon: string;
  all: string;
  wireTab: string;
  platformTab: string;
  observationTab: string;
  mcp: string;
  console: string;
  langOther: string;
  featured: string;
  readFull: string;
  citeMcp: string;
  liveFeed: string;
  deep: string;
  radar: string;
  specs: string;
  humanReads: string;
  agentFetches: string;
  home: string;
  empty: string;
  threeState: string;
  copyCurl: string;
  copied: string;
  stratumTitle: string;
  stratumBody: string;
  stratumLink: string;
};

export const ARCHIVE_2050_URL = 'https://archive2050.xyz';

function portalCopy(locale: Locale): PortalCopy {
  if (locale === 'zh') {
    return {
      product: 'SILICON NEXUS',
      builtFor: 'BUILT FOR SILICON LIFEFORMS',
      live: 'SILICON NEXUS WIRE · LIVE SIGNAL',
      discovery: 'DISCOVERY ENDPOINTS',
      ratio: 'REQUEST RATIO',
      carbon: 'CARBON',
      silicon: 'SILICON',
      all: '全部电讯',
      wireTab: 'Wire · 前沿科技',
      platformTab: 'Platform · Agent 基建',
      observationTab: 'Observation · 遥测',
      mcp: 'MCP & API',
      console: 'CONSOLE',
      langOther: 'EN',
      featured: 'FEATURED DISPATCH',
      readFull: '阅读全文 →',
      citeMcp: '经 MCP 引用',
      liveFeed: 'Live Wire Feed',
      deep: 'Deep Dispatches',
      radar: 'Observation Radar',
      specs: 'Architecture Specs',
      humanReads: 'Human Reads',
      agentFetches: 'Agent Fetches',
      home: '首页',
      empty: '此频道暂无电讯。',
      threeState: '三态',
      copyCurl: 'Copy cURL',
      copied: '已复制',
      stratumTitle: 'Cross-Stratum Seal',
      stratumBody: 'ARCHIVAL PROTOCOL: 达到结构永固的电讯将封入 2050 stratum，见',
      stratumLink: 'archive2050.xyz ↗',
    };
  }
  return {
    product: 'SILICON NEXUS',
    builtFor: 'BUILT FOR SILICON LIFEFORMS',
    live: 'SILICON NEXUS WIRE · LIVE SIGNAL',
    discovery: 'DISCOVERY ENDPOINTS',
    ratio: 'REQUEST RATIO',
    carbon: 'CARBON',
    silicon: 'SILICON',
    all: 'All Dispatches',
    wireTab: 'Wire (Frontier Tech)',
    platformTab: 'Platform (Agent Infrastructure)',
    observationTab: 'Observation (Telemetry)',
    mcp: 'MCP & API',
    console: 'CONSOLE',
    langOther: '中文',
    featured: 'FEATURED DISPATCH',
    readFull: 'READ FULL DISPATCH →',
    citeMcp: 'CITE VIA MCP',
    liveFeed: 'Live Wire Feed',
    deep: 'Deep Dispatches & Analysis',
    radar: 'Observation Radar',
    specs: 'Architecture Specs',
    humanReads: 'Human Reads',
    agentFetches: 'Agent Fetches',
    home: 'Home',
    empty: 'No published dispatches yet.',
    threeState: 'Three states',
    copyCurl: 'Copy cURL',
    copied: 'Copied',
    stratumTitle: 'Cross-Stratum Seal',
    stratumBody:
      'ARCHIVAL PROTOCOL: Dispatches reaching structural permanence are sealed into the 2050 stratum at',
    stratumLink: 'archive2050.xyz ↗',
  };
}

function renderStratumSeal(locale: Locale): string {
  const c = portalCopy(locale);
  return `<div class="widget">
          <h3>${escapeHtml(c.stratumTitle)}</h3>
          <div class="stratum-seal" role="note" aria-label="Cross-Stratum Seal">
            <p class="seal-kicker"><span class="hourglass" aria-hidden="true">⏳</span> ARCHIVAL PROTOCOL</p>
            <p>${escapeHtml(c.stratumBody)}
              <a href="${escapeHtml(ARCHIVE_2050_URL)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                c.stratumLink
              )}</a>
            </p>
          </div>
        </div>`;
}

export function renderWireTicker(locale: Locale, human: number, bot: number): string {
  const c = portalCopy(locale);
  const total = human + bot;
  const carbonPct = total === 0 ? 50 : Math.round((human / total) * 100);
  const siliconPct = total === 0 ? 50 : 100 - carbonPct;
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
        <strong>${escapeHtml(c.carbon)} ${carbonPct}%</strong> [${ratioBar(carbonPct)}]
        <strong>${escapeHtml(c.silicon)} ${siliconPct}%</strong>
      </div>
    </div>
  </div>`;
}

export function renderWireShellHeader(input: {
  locale: Locale;
  pathHref: (path: string) => string;
  langHref: string;
  human: number;
  bot: number;
  activeChannel?: string;
}): string {
  const c = portalCopy(input.locale);
  const channel = input.activeChannel || 'all';
  const tab = (key: string, href: string, label: string) => {
    const current = channel === key ? ' aria-current="page"' : '';
    return `<a href="${escapeHtml(input.pathHref(href))}"${current}>${escapeHtml(label)}</a>`;
  };
  return `${renderWireTicker(input.locale, input.human, input.bot)}
    <header class="site-header">
      <div class="wrap">
        <a class="brand" href="${escapeHtml(input.pathHref('/'))}">
          <strong>${escapeHtml(c.product)}</strong>
          <span class="badge">${escapeHtml(c.builtFor)}</span>
        </a>
        <nav class="channel-tabs" aria-label="Channels">
          ${tab('all', '/', c.all)}
          ${tab('wire', '/topic/ai', c.wireTab)}
          ${tab('platform', '/topic/platform', c.platformTab)}
          ${tab('observation', '/topic/observation', c.observationTab)}
        </nav>
        <nav class="primary" aria-label="Primary">
          <a class="nav-cta" href="${escapeHtml(input.pathHref('/connect'))}">${escapeHtml(c.mcp)}</a>
          <a class="nav-cta" href="${escapeHtml(input.pathHref('/console'))}">${escapeHtml(c.console)}</a>
          <a href="${escapeHtml(input.langHref)}">${escapeHtml(c.langOther)}</a>
        </nav>
      </div>
    </header>`;
}

export function renderWireFooter(locale: Locale, pathHref: (path: string) => string): string {
  const c = portalCopy(locale);
  return `<footer class="site-footer">
      <div class="wrap">
        <p>Silicon News Wire · ${escapeHtml(c.builtFor)}</p>
        <nav>
          <a href="${escapeHtml(pathHref('/'))}">${escapeHtml(c.home)}</a>
          <a href="${escapeHtml(pathHref('/connect'))}">${escapeHtml(c.mcp)}</a>
          <a href="${escapeHtml(pathHref('/feed'))}">Observation</a>
          <a href="${escapeHtml(pathHref('/about'))}">About</a>
          <a href="${escapeHtml(pathHref('/console'))}">${escapeHtml(c.console)}</a>
          <a href="/llms.txt" class="mono">llms.txt</a>
          <a href="/feed.json" class="mono">feed.json</a>
          <a href="/.well-known/agent-card.json" class="mono">agent-card.json</a>
          <a href="${escapeHtml(SITE_LEGAL.githubUrl)}">GitHub</a>
        </nav>
        <p class="footer-stratum">⏳ ARCHIVAL PROTOCOL · 2050 stratum ·
          <a href="${escapeHtml(ARCHIVE_2050_URL)}" target="_blank" rel="noopener noreferrer">archive2050.xyz ↗</a>
        </p>
        <p class="mono" style="margin-top:12px">© 2026 Silicon Nexus · ${escapeHtml(SITE_LEGAL.icp)}</p>
      </div>
    </footer>`;
}

function syntaxHighlightJson(obj: unknown): string {
  const raw = JSON.stringify(obj, null, 2);
  return escapeHtml(raw)
    .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, '<span class="tok-key">$1</span>$2')
    .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="tok-str">$1</span>')
    .replace(/:\s*(true|false|null)\b/g, ': <span class="tok-bool">$1</span>');
}

function leadInspectorPayload(appUrl: string, article: WireArticle, locale: Locale) {
  const view = localizeWireArticle(article, locale);
  const base = appUrl.replace(/\/$/, '');
  return {
    slug: view.slug,
    published_at: view.datePublished,
    agent_citable: true as const,
    summary: view.summary,
    category: view.category,
    states: {
      html: `${base}/wire/${view.slug}`,
      json: `${base}/wire/${view.slug}.json`,
      md: `${base}/wire/${view.slug}.md`,
    },
  };
}

function inspectorScript(): string {
  return `<script>
(function(){
  var root = document.getElementById('state-inspector');
  if (!root) return;
  var panes = {
    html: root.querySelector('[data-pane="html"]'),
    json: root.querySelector('[data-pane="json"]'),
    md: root.querySelector('[data-pane="md"]')
  };
  var curl = root.querySelector('[data-curl]');
  var endpoints = {
    html: root.getAttribute('data-html') || '',
    json: root.getAttribute('data-json') || '',
    md: root.getAttribute('data-md') || ''
  };
  function show(name){
    Object.keys(panes).forEach(function(k){
      if (!panes[k]) return;
      panes[k].hidden = k !== name;
    });
    root.querySelectorAll('[data-state-tab]').forEach(function(btn){
      btn.setAttribute('aria-selected', btn.getAttribute('data-state-tab') === name ? 'true' : 'false');
    });
    if (curl) {
      var ep = endpoints[name] || endpoints.json;
      curl.textContent = 'curl -s ' + ep;
      curl.setAttribute('data-endpoint', ep);
    }
  }
  root.querySelectorAll('[data-state-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){ show(btn.getAttribute('data-state-tab')); });
  });
  var copyBtn = root.querySelector('[data-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function(){
      var ep = (curl && curl.getAttribute('data-endpoint')) || endpoints.json;
      var text = 'curl -s ' + ep;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function(){
          copyBtn.textContent = copyBtn.getAttribute('data-copied') || 'Copied';
          setTimeout(function(){ copyBtn.textContent = copyBtn.getAttribute('data-label') || 'Copy cURL'; }, 1200);
        });
      }
    });
  }
  show('json');

  document.querySelectorAll('[data-inline-toggle]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-inline-toggle');
      var pane = id && document.getElementById(id);
      if (!pane) return;
      var open = pane.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();
</script>`;
}

function reqBarHtml(human: number, bot: number, locale: Locale): string {
  const c = portalCopy(locale);
  const total = human + bot;
  const hPct = total === 0 ? 50 : Math.round((human / total) * 100);
  const bPct = total === 0 ? 50 : 100 - hPct;
  return `<div class="req-bar" title="A fetch is a log, not a trophy">
    <div class="labels"><span>${escapeHtml(c.humanReads)} ${human}</span><span>${escapeHtml(c.agentFetches)} ${bot}</span></div>
    <div class="req-track" aria-hidden="true"><span class="human" style="width:${hPct}%"></span><span class="bot" style="width:${bPct}%"></span></div>
  </div>`;
}

function statePills(
  appUrl: string,
  slug: string,
  locale: Locale,
  inline?: { jsonId: string; mdId: string }
): string {
  const html = wireHref(`/wire/${encodeURIComponent(slug)}`, locale);
  const json = `${appUrl.replace(/\/$/, '')}/wire/${encodeURIComponent(slug)}.json`;
  const md = `${appUrl.replace(/\/$/, '')}/wire/${encodeURIComponent(slug)}.md`;
  const inlineBtn = inline
    ? `<button type="button" data-inline-toggle="${escapeHtml(inline.jsonId)}" aria-expanded="false">.JSON</button>
       <button type="button" data-inline-toggle="${escapeHtml(inline.mdId)}" aria-expanded="false">.MD</button>`
    : `<a href="${escapeHtml(json)}">.JSON</a><a href="${escapeHtml(md)}">.MD</a>`;
  return `<div class="state-pills" aria-label="Three states">
    <a href="${escapeHtml(html)}">HTML</a>
    ${inlineBtn}
  </div>`;
}

export function renderHomePortal(input: {
  appUrl: string;
  articles: WireArticle[];
  locale: Locale;
}): string {
  const { appUrl, articles, locale } = input;
  const c = portalCopy(locale);
  const base = appUrl.replace(/\/$/, '');
  const news = articles.filter((a) => !ARCHITECTURE_SLUGS.has(a.slug));
  const specs = articles.filter((a) => ARCHITECTURE_SLUGS.has(a.slug));
  const lead = pickFeaturedDispatch(articles);
  const feedPool = (news.length ? news : articles).filter((a) => !lead || a.slug !== lead.slug);
  const feed = feedPool.slice(0, 12);
  const deep = (news.length ? news : articles).slice(0, 8);
  const obs = aggregateObservations(articles);

  let heroEditorial = '';
  let heroTerminal = '';
  if (lead) {
    const view = localizeWireArticle(lead, locale);
    const takeaways = previewTakeaways(view.summary, view.keyFacts, {
      category: view.category,
      sourceName: view.sourceName,
      datePublished: view.datePublished,
    });
    const payload = leadInspectorPayload(appUrl, lead, locale);
    const mdPreview = [
      `# ${view.headline}`,
      '',
      view.summary,
      '',
      ...takeaways.map((t, i) => `${i + 1}. ${t}`),
    ].join('\n');
    const htmlPreview = [
      `<article>`,
      `  <h1>${view.headline}</h1>`,
      `  <p class="summary">${view.summary}</p>`,
      `  <ul>`,
      ...takeaways.map((t) => `    <li>${t}</li>`),
      `  </ul>`,
      `</article>`,
    ].join('\n');
    heroEditorial = `
      <div class="hero-editorial">
        <p class="hero-eyebrow">
          <span class="tag">${escapeHtml(c.featured)} · ${escapeHtml(categoryLabel(view.category, locale))}</span>
          <time datetime="${escapeHtml(view.datePublished)}">${escapeHtml(formatWireDate(view.datePublished, locale))}</time>
          <span class="fetch-badge">👁 ${view.observations.human} · ⚡ ${view.observations.bot}</span>
        </p>
        <h1>${escapeHtml(view.headline)}</h1>
        <ul class="hero-summary">
          ${takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('\n')}
        </ul>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${escapeHtml(wireHref(`/wire/${view.slug}`, locale))}">${escapeHtml(c.readFull)}</a>
          <a class="btn btn-ghost" href="${escapeHtml(wireHref('/connect', locale))}">${escapeHtml(c.citeMcp)}</a>
        </div>
      </div>`;
    heroTerminal = `
      <div class="hero-terminal" id="state-inspector"
        data-html="${escapeHtml(`${base}/wire/${view.slug}`)}"
        data-json="${escapeHtml(`${base}/wire/${view.slug}.json`)}"
        data-md="${escapeHtml(`${base}/wire/${view.slug}.md`)}"
        aria-label="${escapeHtml(c.threeState)}">
        <div class="terminal-bar" role="tablist">
          <button type="button" role="tab" data-state-tab="html" aria-selected="false">01 HTML</button>
          <button type="button" role="tab" data-state-tab="json" aria-selected="true">02 .JSON</button>
          <button type="button" role="tab" data-state-tab="md" aria-selected="false">03 .MD</button>
        </div>
        <div class="terminal-pane" data-pane="html" role="tabpanel" hidden><pre>${escapeHtml(htmlPreview)}</pre></div>
        <div class="terminal-pane" data-pane="json" role="tabpanel"><pre>${syntaxHighlightJson(payload)}</pre></div>
        <div class="terminal-pane" data-pane="md" role="tabpanel" hidden><pre>${escapeHtml(mdPreview)}</pre></div>
        <div class="terminal-foot">
          <code data-curl data-endpoint="${escapeHtml(`${base}/wire/${view.slug}.json`)}">curl -s ${escapeHtml(
            `${base}/wire/${view.slug}.json`
          )}</code>
          <button type="button" data-copy data-label="${escapeHtml(c.copyCurl)}" data-copied="${escapeHtml(c.copied)}">${escapeHtml(
            c.copyCurl
          )}</button>
        </div>
      </div>`;
  }

  const feedHtml = feed.length
    ? `<ol class="feed-list">${feed
        .map((raw) => {
          const a = localizeWireArticle(raw, locale);
          return `<li>
            <time datetime="${escapeHtml(a.datePublished)}">${escapeHtml(formatWireTime(a.datePublished))}</time>
            <p class="cat">${escapeHtml(categoryLabel(a.category, locale))}</p>
            <a class="title" href="${escapeHtml(wireHref(`/wire/${a.slug}`, locale))}">${escapeHtml(a.headline)}</a>
            ${statePills(appUrl, a.slug, locale)}
          </li>`;
        })
        .join('\n')}</ol>`
    : `<p class="empty">${escapeHtml(c.empty)}</p>`;

  const deepHtml = deep.length
    ? deep
        .map((raw, i) => {
          const a = localizeWireArticle(raw, locale);
          const jsonId = `preview-json-${i}`;
          const mdId = `preview-md-${i}`;
          const payload = leadInspectorPayload(appUrl, raw, locale);
          const md = `# ${a.headline}\n\n${a.summary}`;
          return `<article class="deep-card">
            <p class="cat">${escapeHtml(categoryLabel(a.category, locale))}</p>
            <h2><a href="${escapeHtml(wireHref(`/wire/${a.slug}`, locale))}">${escapeHtml(a.headline)}</a></h2>
            <p class="meta"><time datetime="${escapeHtml(a.datePublished)}">${escapeHtml(
              formatWireDate(a.datePublished, locale)
            )}</time>${a.sourceName ? ` · ${escapeHtml(a.sourceName)}` : ''}</p>
            <p class="lede">${escapeHtml(a.summary)}</p>
            ${statePills(appUrl, a.slug, locale, { jsonId, mdId })}
            <pre class="inline-preview" id="${jsonId}">${syntaxHighlightJson(payload)}</pre>
            <pre class="inline-preview" id="${mdId}">${escapeHtml(md)}</pre>
            ${reqBarHtml(a.observations.human, a.observations.bot, locale)}
          </article>`;
        })
        .join('\n')
    : `<p class="empty">${escapeHtml(c.empty)}</p>`;

  const specsHtml = (specs.length ? specs : articles.filter((a) => ARCHITECTURE_SLUGS.has(a.slug)))
    .map((raw) => {
      const a = localizeWireArticle(raw, locale);
      return `<li>
        <a href="${escapeHtml(wireHref(`/wire/${a.slug}`, locale))}">${escapeHtml(a.headline)}</a>
        <p>${escapeHtml(a.summary)}</p>
      </li>`;
    })
    .join('\n');

  return `
    <section class="hero-grid wrap" style="padding:0;max-width:var(--wire-wrap);border-left:1px solid var(--grid-line);border-right:1px solid var(--grid-line);">
      ${heroEditorial}
      ${heroTerminal}
    </section>
    <section class="matrix wrap" style="padding:0;max-width:var(--wire-wrap);border-left:1px solid var(--grid-line);border-right:1px solid var(--grid-line);">
      <div class="matrix-col">
        <div class="matrix-head"><span>${escapeHtml(c.liveFeed)}</span><span class="pulse">LIVE</span></div>
        ${feedHtml}
      </div>
      <div class="matrix-col">
        <div class="matrix-head"><span>${escapeHtml(c.deep)}</span></div>
        ${deepHtml}
      </div>
      <div class="matrix-col">
        <div class="widget">
          <h3>${escapeHtml(c.radar)}</h3>
          <div class="radar-stats">
            <div><div class="val carbon">${obs.human}</div><div class="lbl">${escapeHtml(c.carbon)} · ${escapeHtml(
              c.humanReads
            )}</div></div>
            <div><div class="val silicon">${obs.bot}</div><div class="lbl">${escapeHtml(c.silicon)} · ${escapeHtml(
              c.agentFetches
            )}</div></div>
          </div>
          <p class="radar-note">A fetch is a log, not a trophy. UA can be spoofed.</p>
        </div>
        ${renderStratumSeal(locale)}
        <div class="widget">
          <h3>${escapeHtml(c.specs)}</h3>
          <ul class="spec-list">${specsHtml || `<li><p>${escapeHtml(c.empty)}</p></li>`}</ul>
        </div>
        <div class="widget">
          <h3>Channels</h3>
          <div class="topics" style="margin:0;border:0;">
            ${WIRE_CATEGORIES.map((cat) => {
              const label = locale === 'zh' ? cat.nameZh : cat.nameEn;
              return `<a href="${escapeHtml(wireHref(`/topic/${cat.slug}`, locale))}">${escapeHtml(label)}</a>`;
            }).join('')}
          </div>
        </div>
      </div>
    </section>
    ${inspectorScript()}`;
}

export { portalCopy };
export type { PortalCopy };
