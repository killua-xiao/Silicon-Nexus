import {
  hubCanonicalUrl,
  hubMarkdownPath,
  resolveHubPageMeta,
  type HubPageMeta,
} from '../lib/hubPageMeta.ts';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertBeforeHeadClose(html: string, snippet: string): string {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `    ${snippet}\n  </head>`);
  }
  return `${snippet}\n${html}`;
}

function replaceTitle(html: string, title: string): string {
  const tag = `<title>${escapeHtml(title)}</title>`;
  if (/<title\b[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title\b[\s\S]*?<\/title>/i, tag);
  }
  return insertBeforeHeadClose(html, tag);
}

function replaceLinkHref(html: string, rel: string, href: string): string {
  const tag = `<link rel="${rel}" href="${escapeHtmlAttr(href)}" />`;
  const re = new RegExp(`<link\\s+rel\\s*=\\s*["']${escapeRegExp(rel)}["'][\\s\\S]*?\\/?>`, 'i');
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return insertBeforeHeadClose(html, tag);
}

function replaceMeta(
  html: string,
  identAttr: 'name' | 'property',
  identValue: string,
  content: string
): string {
  const tag = `<meta ${identAttr}="${identValue}" content="${escapeHtmlAttr(content)}" />`;
  const re = new RegExp(
    `<meta\\s+${identAttr}\\s*=\\s*["']${escapeRegExp(identValue)}["'][\\s\\S]*?\\/?>`,
    'i'
  );
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return insertBeforeHeadClose(html, tag);
}

function replaceStaticBlurb(html: string, blurb: string): string {
  const tag = `<p class="nx-static-def">${escapeHtml(blurb)}</p>`;
  if (/<p class="nx-static-def">[\s\S]*?<\/p>/.test(html)) {
    return html.replace(/<p class="nx-static-def">[\s\S]*?<\/p>/, tag);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, (open) => `${open}\n    ${tag}`);
  }
  return `${tag}\n${html}`;
}

function replaceJsonLd(html: string, title: string, url: string, description: string): string {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url,
    description,
  };
  const tag = `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, tag);
  }
  return insertBeforeHeadClose(html, tag);
}

function replaceMarkdownAlternate(html: string, href: string | null): string {
  const re =
    /<link\b[^>]*rel\s*=\s*["']alternate["'][^>]*type\s*=\s*["']text\/markdown["'][^>]*\/?>|<link\b[^>]*type\s*=\s*["']text\/markdown["'][^>]*rel\s*=\s*["']alternate["'][^>]*\/?>/gi;
  let out = html.replace(re, '');
  if (!href) return out;
  const tag = `<link rel="alternate" type="text/markdown" href="${escapeHtmlAttr(href)}" />`;
  return insertBeforeHeadClose(out, tag);
}

/**
 * Rewrite the Vite SPA `index.html` shell so crawlers see per-route title,
 * description, and canonical. `og:image` is left as baked in the file.
 *
 * Does not emit SoftwareApplication or aggregateRating.
 */
export function rewriteSpaHtml(
  html: string,
  requestPath: string,
  appUrl: string,
  extra?: { meta?: HubPageMeta }
): string {
  const meta = extra?.meta ?? resolveHubPageMeta(requestPath);
  const url = extra?.meta
    ? hubCanonicalUrl(appUrl, extra.meta.path)
    : hubCanonicalUrl(appUrl, requestPath);
  const title = meta?.title ?? 'Silicon Nexus';
  const description =
    meta?.description ??
    'Silicon Nexus is agent infrastructure with a public Silicon News Wire: the same facts in HTML, JSON, and Markdown. Agents connect over MCP. Humans use the console.';
  const mdPath = extra?.meta ? `${extra.meta.path}.md` : hubMarkdownPath(requestPath);
  const mdHref = mdPath ? `${appUrl.replace(/\/$/, '')}${mdPath}` : null;

  let out = html;
  out = replaceTitle(out, title);
  out = replaceMeta(out, 'name', 'description', description);
  out = replaceLinkHref(out, 'canonical', url);
  out = replaceMeta(out, 'property', 'og:url', url);
  out = replaceMeta(out, 'property', 'og:title', title);
  out = replaceMeta(out, 'property', 'og:description', description);
  out = replaceMeta(out, 'name', 'twitter:title', title);
  out = replaceMeta(out, 'name', 'twitter:description', description);
  out = replaceJsonLd(out, title, url, description);
  out = replaceMarkdownAlternate(out, mdHref);
  if (meta?.blurb) {
    out = replaceStaticBlurb(out, meta.blurb);
  }
  return out;
}
