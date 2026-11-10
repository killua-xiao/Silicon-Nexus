import { chromeCopy, type ChromeNavKey } from '../chrome/siteChrome.ts';
import type { Locale } from '../i18n/messages.ts';
import { localizeWireArticle, type LocalizedWireArticle } from './wireLocalize.ts';
import {
  aggregateObservations,
  categoryLabel,
  formatWireDate,
  renderHomePortal,
  renderWireFooter,
  renderWireShellHeader,
  wireHref,
  wirePortalCss,
  WIRE_WRAP_PX,
} from './wirePortalUi.ts';
import {
  WIRE_CATEGORIES,
  WIRE_OBSERVATION_NOTE,
  WIRE_OBSERVATION_NOTE_ZH,
  wireCategory,
  type WireArticle,
  type WireCategorySlug,
} from './wireTypes.ts';

void WIRE_WRAP_PX;

export function withOffsetIso(iso: string): string {
  const trimmed = (iso || '').trim();
  if (/[+-]\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (trimmed.endsWith('Z')) return `${trimmed.slice(0, -1)}+00:00`;
  return trimmed || new Date().toISOString().replace(/Z$/, '+00:00');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function yamlString(s: string): string {
  return JSON.stringify(s);
}

export function articleCanonical(appUrl: string, slug: string): string {
  return `${appUrl.replace(/\/$/, '')}/wire/${encodeURIComponent(slug)}`;
}

export function articleJsonUrl(appUrl: string, slug: string): string {
  return `${articleCanonical(appUrl, slug)}.json`;
}

export function articleMdUrl(appUrl: string, slug: string): string {
  return `${articleCanonical(appUrl, slug)}.md`;
}

export function topicUrl(appUrl: string, category: string): string {
  return `${appUrl.replace(/\/$/, '')}/topic/${encodeURIComponent(category)}`;
}

export function langQuery(locale: Locale, extra = ''): string {
  const params = new URLSearchParams();
  if (locale === 'zh') params.set('lang', 'zh');
  if (extra.startsWith('?')) {
    const more = new URLSearchParams(extra.slice(1));
    more.forEach((v, k) => params.set(k, v));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function href(path: string, locale: Locale): string {
  return wireHref(path, locale);
}

function formatVisibleDate(iso: string, locale: Locale): string {
  return formatWireDate(iso, locale);
}

function inlineMarkdown(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
      '<a href="$2">$1</a>'
    );
}

/** Small Markdown subset — no extra libraries, no raw HTML passthrough. */
export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inList = false;
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inlineMarkdown(escapeHtml(para.join(' ')))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!inList) return;
    out.push('</ul>');
    inList = false;
  };

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const list = /^[-*]\s+(.+)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMarkdown(escapeHtml(heading[2]))}</h${level}>`);
      continue;
    }
    if (list) {
      flushPara();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineMarkdown(escapeHtml(list[1]))}</li>`);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return out.join('\n');
}

function firstParagraph(md: string): string {
  const block = md.replace(/\r\n/g, '\n').split(/\n\n+/)[0] || '';
  return block.replace(/^#+\s+/, '').replace(/\s+/g, ' ').trim();
}

export function articleContentText(article: WireArticle): string {
  const facts = article.keyFacts.map((f, i) => `${i + 1}. ${f.text}`).join('\n');
  const lead = firstParagraph(article.bodyMd);
  return [facts, lead].filter(Boolean).join('\n\n');
}

type Copy = {
  product: string;
  wire: string;
  tagline: string;
  builtFor: string;
  sub: string;
  tldr: string;
  by: string;
  threeState: string;
  html: string;
  json: string;
  md: string;
  topics: string;
  console: string;
  mcp: string;
  observation: string;
  about: string;
  docs: string;
  telemetry: string;
  disclaimer: string;
  empty: string;
  home: string;
  observed: string;
  human: string;
  bot: string;
  langOther: string;
  langOtherHref: string;
};

function copyFor(locale: Locale): Copy {
  const chrome = chromeCopy(locale);
  if (locale === 'zh') {
    return {
      product: chrome.product,
      wire: chrome.wire,
      tagline: '碳基可读，硅基原生。',
      builtFor: chrome.builtFor,
      sub: '同一事实，HTML / JSON / Markdown 三态可引用。收录与排名不保证。',
      tldr: '硅基要点',
      by: '作者',
      threeState: '三态',
      html: 'HTML',
      json: 'JSON',
      md: 'Markdown',
      topics: '频道',
      console: chrome.console,
      mcp: chrome.connect,
      observation: chrome.observation,
      about: chrome.about,
      docs: chrome.docs,
      telemetry: '请求分类',
      disclaimer: WIRE_OBSERVATION_NOTE_ZH,
      empty: '此频道暂无已发布电讯。',
      home: chrome.home,
      observed: '观测请求',
      human: '人类',
      bot: '机器人',
      langOther: chrome.langOther,
      langOtherHref: '?lang=en',
    };
  }
  return {
    product: chrome.product,
    wire: chrome.wire,
    tagline: 'Readable by carbon. Native to silicon.',
    builtFor: chrome.builtFor,
    sub: 'The same facts, three states: HTML, JSON, Markdown. Discovery files are not a ranking.',
    tldr: 'Silicon TL;DR',
    by: 'By',
    threeState: 'Three states',
    html: 'HTML',
    json: 'JSON',
    md: 'Markdown',
    topics: 'Topics',
    console: chrome.console,
    mcp: chrome.connect,
    observation: chrome.observation,
    about: chrome.about,
    docs: chrome.docs,
    telemetry: 'Request log',
    disclaimer: WIRE_OBSERVATION_NOTE,
    empty: 'No published dispatches in this channel yet.',
    home: chrome.home,
    observed: 'Observed requests',
    human: 'human',
    bot: 'bot',
    langOther: chrome.langOther,
    langOtherHref: '?lang=zh',
  };
}

function wireCss(): string {
  return wirePortalCss();
}

function layout(input: {
  appUrl: string;
  locale: Locale;
  title: string;
  description: string;
  canonical: string;
  jsonLd?: unknown[];
  alternates?: Array<{ href: string; type: string; title?: string }>;
  ogType?: string;
  extraHead?: string;
  body: string;
  active?: ChromeNavKey | 'topic' | 'article' | 'home';
  activeChannel?: string;
  articles?: WireArticle[];
}): string {
  const base = input.appUrl.replace(/\/$/, '');
  const alternates = input.alternates || [];
  const jsonLd = input.jsonLd || [];
  const langHref =
    input.locale === 'zh' ? `${input.canonical}?lang=en` : `${input.canonical}?lang=zh`;
  const pathHref = (path: string) => href(path, input.locale);
  const obs = aggregateObservations(input.articles || []);
  const altLinks = alternates
    .map(
      (a) =>
        `<link rel="alternate" type="${escapeHtml(a.type)}" href="${escapeHtml(a.href)}"${
          a.title ? ` title="${escapeHtml(a.title)}"` : ''
        }>`
    )
    .join('\n    ');
  const ld = jsonLd
    .map((block) => `<script type="application/ld+json">\n${JSON.stringify(block)}\n    </script>`)
    .join('\n    ');

  return `<!doctype html>
<html lang="${input.locale === 'zh' ? 'zh-CN' : 'en'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
    <meta name="description" content="${escapeHtml(input.description)}" />
    <link rel="canonical" href="${escapeHtml(input.canonical)}" />
    <link rel="alternate" hreflang="${input.locale === 'zh' ? 'zh-CN' : 'en'}" href="${escapeHtml(input.canonical)}" />
    ${altLinks}
    <meta name="theme-color" content="#F4F6F8" />
    <meta property="og:type" content="${escapeHtml(input.ogType || 'website')}" />
    <meta property="og:site_name" content="Silicon Nexus" />
    <meta property="og:url" content="${escapeHtml(input.canonical)}" />
    <meta property="og:title" content="${escapeHtml(input.title)}" />
    <meta property="og:description" content="${escapeHtml(input.description)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(input.title)}" />
    <meta name="twitter:description" content="${escapeHtml(input.description)}" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
    ${ld}
    ${input.extraHead || ''}
    <style>${wireCss()}</style>
  </head>
  <body>
    ${renderWireShellHeader({
      locale: input.locale,
      pathHref,
      langHref,
      human: obs.human,
      bot: obs.bot,
      activeChannel: input.activeChannel || (input.active === 'home' ? 'all' : undefined),
    })}
    ${input.body}
    ${renderWireFooter(input.locale, pathHref)}
    <p style="display:none">${escapeHtml(base)}</p>
  </body>
</html>
`;
}

export function newsArticleJsonLd(
  appUrl: string,
  article: WireArticle | LocalizedWireArticle
): Record<string, unknown> {
  const url = articleCanonical(appUrl, article.slug);
  const author: Record<string, unknown> = {
    '@type': article.authorType,
    name: article.authorName,
  };
  if (article.authorUrl) author.url = article.authorUrl;
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline.slice(0, 110),
    datePublished: withOffsetIso(article.datePublished),
    dateModified: withOffsetIso(article.dateModified),
    author: [author],
    publisher: {
      '@type': 'Organization',
      name: article.publisher.name,
      url: article.publisher.url,
    },
    mainEntityOfPage: url,
    isAccessibleForFree: true,
    description: article.summary,
    inLanguage: article.language || 'en',
  };
  if (article.imageUrl) {
    payload.image = [article.imageUrl];
  }
  return payload;
}

export function breadcrumbJsonLd(
  appUrl: string,
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function collectionJsonLd(appUrl: string, name: string, description: string): Record<string, unknown> {
  const base = appUrl.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${base}/`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Silicon Nexus',
      url: `${base}/`,
    },
  };
}

function topicChips(locale: Locale, active?: string): string {
  const c = copyFor(locale);
  return `<nav class="topics" aria-label="${escapeHtml(c.topics)}">${WIRE_CATEGORIES.map((cat) => {
    const current = cat.slug === active ? ' aria-current="page"' : '';
    const label = locale === 'zh' ? cat.nameZh : cat.nameEn;
    return `<a href="${escapeHtml(href(`/topic/${cat.slug}`, locale))}"${current}>${escapeHtml(label)}</a>`;
  }).join('')}</nav>`;
}

function articleList(articles: WireArticle[], appUrl: string, locale: Locale): string {
  const c = copyFor(locale);
  if (!articles.length) return `<p class="empty">${escapeHtml(c.empty)}</p>`;
  return `<ol class="list">${articles
    .map((raw) => {
      const article = localizeWireArticle(raw, locale);
      const url = href(`/wire/${encodeURIComponent(article.slug)}`, locale);
      const sourceBit =
        article.sourceName && article.sourceUrl
          ? `<p class="byline">${escapeHtml(locale === 'zh' ? '来源' : 'Source')}: <a href="${escapeHtml(
              article.sourceUrl
            )}">${escapeHtml(article.sourceName)}</a></p>`
          : '';
      return `<li>
        <p class="kicker">${escapeHtml(categoryLabel(article.category, locale))}</p>
        <h2><a href="${escapeHtml(url)}">${escapeHtml(article.headline)}</a></h2>
        <p class="meta"><time datetime="${escapeHtml(withOffsetIso(article.datePublished))}">${escapeHtml(
          formatVisibleDate(article.datePublished, locale)
        )}</time></p>
        <p class="lede">${escapeHtml(article.summary)}</p>
        ${sourceBit}
        <p class="states">
          <a href="${escapeHtml(url)}">${escapeHtml(c.html)}</a>
          <a href="${escapeHtml(articleJsonUrl(appUrl, article.slug))}">${escapeHtml(c.json)}</a>
          <a href="${escapeHtml(articleMdUrl(appUrl, article.slug))}">${escapeHtml(c.md)}</a>
        </p>
      </li>`;
    })
    .join('\n')}</ol>`;
}

export function renderHomeHtml(appUrl: string, articles: WireArticle[], locale: Locale): string {
  const c = copyFor(locale);
  const base = appUrl.replace(/\/$/, '');
  const body = renderHomePortal({ appUrl, articles, locale });
  return layout({
    appUrl,
    locale,
    title: `${c.tagline} · Silicon Nexus`,
    description: c.sub,
    canonical: `${base}/`,
    ogType: 'website',
    active: 'home',
    activeChannel: 'all',
    articles,
    jsonLd: [collectionJsonLd(appUrl, c.wire, c.sub)],
    alternates: [
      { href: `${base}/feed.json`, type: 'application/feed+json', title: c.wire },
      { href: `${base}/feed.xml`, type: 'application/atom+xml', title: c.wire },
    ],
    extraHead: `<link rel="alternate" type="application/feed+json" href="${base}/feed.json" title="Silicon News Wire" />`,
    body,
  });
}

export function renderTopicHtml(
  appUrl: string,
  category: WireCategorySlug,
  articles: WireArticle[],
  locale: Locale
): string {
  const c = copyFor(locale);
  const cat = wireCategory(category)!;
  const name = locale === 'zh' ? cat.nameZh : cat.nameEn;
  const blurb = locale === 'zh' ? cat.blurbZh : cat.blurbEn;
  const canonical = topicUrl(appUrl, category);
  const body = `
    <section class="page-hero">
      <div class="wrap">
        <p class="crumb"><a href="${escapeHtml(href('/', locale))}">${escapeHtml(c.home)}</a> / ${escapeHtml(name)}</p>
        <p class="kicker">${escapeHtml(c.topics)}</p>
        <h1>${escapeHtml(name)}</h1>
        <p class="lede">${escapeHtml(blurb)}</p>
        ${topicChips(locale, category)}
      </div>
    </section>
    <main class="wrap page-rail">
      <div class="matrix-head"><span>${escapeHtml(c.wire)}</span><span class="pulse">LIVE</span></div>
      ${articleList(articles, appUrl, locale)}
    </main>`;
  return layout({
    appUrl,
    locale,
    title: `${name} · ${c.wire}`,
    description: blurb,
    canonical,
    active: 'topic',
    activeChannel:
      category === 'platform' || category === 'observation' ? category : category === 'wire' ? 'wire' : 'wire',
    articles,
    jsonLd: [
      collectionJsonLd(appUrl, `${c.wire} · ${name}`, blurb),
      breadcrumbJsonLd(appUrl, [
        { name: c.home, url: `${appUrl.replace(/\/$/, '')}/` },
        { name, url: canonical },
      ]),
    ],
    alternates: [{ href: `${canonical}.json`, type: 'application/json', title: `${name} JSON` }],
    body,
  });
}

export function renderArticleHtml(appUrl: string, article: WireArticle, locale: Locale): string {
  const c = copyFor(locale);
  const view = localizeWireArticle(article, locale);
  const canonical = articleCanonical(appUrl, article.slug);
  const catName = categoryLabel(view.category, locale);
  const facts = view.keyFacts
    .map(
      (f, i) =>
        `<li id="${escapeHtml(f.id || `fact-${i + 1}`)}">${escapeHtml(f.text)}</li>`
    )
    .join('\n');
  const crawlerBits = view.observations.crawlers
    .map((cr) => `${escapeHtml(cr.crawlerId)} ${cr.hits}`)
    .join(' · ');
  const telemetry = `${c.observed}: ${c.human} <strong>${view.observations.human}</strong> · ${c.bot} <strong>${view.observations.bot}</strong>${
    crawlerBits ? ` (${crawlerBits})` : ''
  }`;
  const sourceBit =
    view.sourceName && view.sourceUrl
      ? `<p class="byline">${escapeHtml(locale === 'zh' ? '来源' : 'Source')}: <a href="${escapeHtml(
          view.sourceUrl
        )}">${escapeHtml(view.sourceName)}</a></p>
        <p class="source-notice">${escapeHtml(
          locale === 'zh'
            ? '本文为 Silicon News Wire 要点改写电讯，便于阅读与引用；非原文全文转载。完整表述以原文为准。'
            : 'This is a Silicon News Wire editorial brief (paraphrased for reading and citation), not a verbatim full-text reprint. Details remain on the origin page.'
        )} <a href="${escapeHtml(view.sourceUrl)}">${escapeHtml(
          locale === 'zh' ? '打开原文 →' : 'Open original →'
        )}</a></p>`
      : '';
  const body = `
    <main class="wrap page-rail">
      <article class="dispatch-article">
        <header class="dispatch-header">
          <p class="crumb"><a href="${escapeHtml(href('/', locale))}">${escapeHtml(c.home)}</a> / <a href="${escapeHtml(
            href(`/topic/${view.category}`, locale)
          )}">${escapeHtml(catName)}</a></p>
          <p class="kicker">${escapeHtml(catName)}</p>
          <h1>${escapeHtml(view.headline)}</h1>
          <p class="hero-eyebrow">
            <time datetime="${escapeHtml(withOffsetIso(view.datePublished))}">${escapeHtml(
              formatVisibleDate(view.datePublished, locale)
            )}</time>
            <span class="fetch-badge">👁 ${view.observations.human} · ⚡ ${view.observations.bot}</span>
          </p>
          <p class="byline">${escapeHtml(c.by)} ${escapeHtml(view.authorName)}</p>
          ${sourceBit}
          <p class="states" aria-label="${escapeHtml(c.threeState)}">
            <a href="${escapeHtml(href(`/wire/${view.slug}`, locale))}">${escapeHtml(c.html)}</a>
            <a href="${escapeHtml(articleJsonUrl(appUrl, view.slug))}">.${escapeHtml(c.json)}</a>
            <a href="${escapeHtml(articleMdUrl(appUrl, view.slug))}">.${escapeHtml(c.md)}</a>
          </p>
        </header>
        <section class="tldr" aria-label="${escapeHtml(c.tldr)}">
          <h2>${escapeHtml(c.tldr)}</h2>
          <ol>
            ${facts}
          </ol>
        </section>
        <div class="body">
          ${renderMarkdown(view.bodyMd)}
        </div>
      </article>
      <aside class="telemetry">
        <div class="matrix-head"><span>${escapeHtml(c.telemetry)}</span></div>
        <p>${telemetry}</p>
        <p class="disclaimer">${escapeHtml(c.disclaimer)}</p>
      </aside>
    </main>`;
  return layout({
    appUrl,
    locale,
    title: view.headline,
    description: view.summary,
    canonical,
    ogType: 'article',
    active: 'article',
    articles: [article],
    jsonLd: [
      newsArticleJsonLd(appUrl, view),
      breadcrumbJsonLd(appUrl, [
        { name: c.home, url: `${appUrl.replace(/\/$/, '')}/` },
        { name: catName, url: topicUrl(appUrl, view.category) },
        { name: view.headline, url: canonical },
      ]),
    ],
    alternates: [
      { href: articleJsonUrl(appUrl, view.slug), type: 'application/json', title: 'JSON' },
      { href: articleMdUrl(appUrl, view.slug), type: 'text/markdown', title: 'Markdown' },
    ],
    body,
  });
}

export function renderNotFoundHtml(appUrl: string, locale: Locale, message: string): string {
  const c = copyFor(locale);
  const body = `
    <main class="wrap page-rail">
      <section class="page-hero" style="border-bottom:0">
        <p class="kicker">404</p>
        <h1>${escapeHtml(message)}</h1>
        <p class="cta" style="margin-top:18px"><a class="btn btn-primary" href="${escapeHtml(href('/', locale))}">${escapeHtml(c.home)}</a></p>
      </section>
    </main>`;
  return layout({
    appUrl,
    locale,
    title: `${message} · Silicon Nexus`,
    description: message,
    canonical: `${appUrl.replace(/\/$/, '')}/`,
    body,
  });
}

export function articleFactPackage(appUrl: string, article: WireArticle): Record<string, unknown> {
  return {
    slug: article.slug,
    url: articleCanonical(appUrl, article.slug),
    json_url: articleJsonUrl(appUrl, article.slug),
    md_url: articleMdUrl(appUrl, article.slug),
    headline: article.headline,
    headline_zh: article.headlineZh || undefined,
    title: article.headline,
    summary: article.summary,
    summary_zh: article.summaryZh || undefined,
    date_published: withOffsetIso(article.datePublished),
    date_modified: withOffsetIso(article.dateModified),
    author: {
      type: article.authorType,
      name: article.authorName,
      url: article.authorUrl,
    },
    publisher: {
      name: article.publisher.name,
      url: article.publisher.url,
    },
    category: article.category,
    language: article.language,
    source_url: article.sourceUrl || undefined,
    source_name: article.sourceName || undefined,
    key_facts: article.keyFacts.map((f) => f.text),
    key_facts_zh: article.keyFactsZh.length ? article.keyFactsZh.map((f) => f.text) : undefined,
    body_md: article.bodyMd,
    body_md_zh: article.bodyMdZh || undefined,
    ...(article.imageUrl ? { image: article.imageUrl } : {}),
    observations: {
      human: article.observations.human,
      bot: article.observations.bot,
      crawlers: article.observations.crawlers,
      last_seen_at: article.observations.lastSeenAt,
      note: article.observations.note,
    },
  };
}

export function renderArticleMarkdown(appUrl: string, article: WireArticle): string {
  const facts = article.keyFacts.map((f) => `  - ${yamlString(f.text)}`).join('\n');
  const header = [
    '---',
    `slug: ${yamlString(article.slug)}`,
    `title: ${yamlString(article.headline)}`,
    `headline: ${yamlString(article.headline)}`,
    `canonical: ${yamlString(articleCanonical(appUrl, article.slug))}`,
    `date_published: ${yamlString(withOffsetIso(article.datePublished))}`,
    `date_modified: ${yamlString(withOffsetIso(article.dateModified))}`,
    `author: ${yamlString(article.authorName)}`,
    `publisher: ${yamlString(article.publisher.name)}`,
    `category: ${yamlString(article.category)}`,
    `summary: ${yamlString(article.summary)}`,
    'key_facts:',
    facts,
    '---',
    '',
  ].join('\n');
  const tldr = article.keyFacts.map((f, i) => `${i + 1}. ${f.text}`).join('\n');
  return `${header}# ${article.headline}\n\n## Silicon TL;DR\n\n${tldr}\n\n${article.bodyMd.trim()}\n`;
}

export function buildWireJsonFeed(appUrl: string, articles: WireArticle[]): Record<string, unknown> {
  const base = appUrl.replace(/\/$/, '');
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Silicon News Wire',
    home_page_url: `${base}/`,
    feed_url: `${base}/feed.json`,
    description:
      'Same facts in HTML, JSON, and Markdown. Discovery files are not a ranking or inclusion promise.',
    language: 'en',
    authors: [{ name: 'Silicon Nexus', url: `${base}/` }],
    items: articles.map((article) => {
      const url = articleCanonical(appUrl, article.slug);
      const item: Record<string, unknown> = {
        id: url,
        url,
        title: article.headline,
        summary: article.summary,
        content_text: articleContentText(article),
        date_published: withOffsetIso(article.datePublished),
        date_modified: withOffsetIso(article.dateModified),
        authors: [
          {
            name: article.authorName,
            url: article.authorUrl || article.publisher.url,
          },
        ],
        tags: [article.category],
        language: article.language || 'en',
      };
      if (article.imageUrl) item.image = article.imageUrl;
      return item;
    }),
  };
}

export function buildWireAtomFeed(appUrl: string, articles: WireArticle[]): string {
  const base = appUrl.replace(/\/$/, '');
  const updated = articles[0] ? withOffsetIso(articles[0].dateModified) : new Date().toISOString();
  const entries = articles
    .map((article) => {
      const url = articleCanonical(appUrl, article.slug);
      const md = articleMdUrl(appUrl, article.slug);
      return `  <entry>
    <title>${escapeXml(article.headline)}</title>
    <link href="${escapeXml(url)}" rel="alternate" type="text/html"/>
    <link href="${escapeXml(md)}" rel="alternate" type="text/markdown"/>
    <id>${escapeXml(url)}</id>
    <updated>${escapeXml(withOffsetIso(article.dateModified))}</updated>
    <published>${escapeXml(withOffsetIso(article.datePublished))}</published>
    <author><name>${escapeXml(article.authorName)}</name></author>
    <category term="${escapeXml(article.category)}"/>
    <summary>${escapeXml(article.summary)}</summary>
    <content type="text">${escapeXml(articleContentText(article))}</content>
  </entry>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Silicon News Wire</title>
  <subtitle>Same facts in HTML, JSON, and Markdown. Discovery files are not a ranking.</subtitle>
  <link href="${base}/feed.xml" rel="self"/>
  <link href="${base}/"/>
  <id>${base}/</id>
  <updated>${escapeXml(updated)}</updated>
  <author><name>Silicon Nexus</name></author>
${entries}
</feed>
`;
}

export function topicListPayload(
  appUrl: string,
  category: WireCategorySlug,
  articles: WireArticle[]
): Record<string, unknown> {
  return {
    category,
    url: topicUrl(appUrl, category),
    articles: articles.map((a) => ({
      slug: a.slug,
      url: articleCanonical(appUrl, a.slug),
      json_url: articleJsonUrl(appUrl, a.slug),
      md_url: articleMdUrl(appUrl, a.slug),
      headline: a.headline,
      summary: a.summary,
      date_published: withOffsetIso(a.datePublished),
      date_modified: withOffsetIso(a.dateModified),
    })),
  };
}
