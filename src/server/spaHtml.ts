import { resolveSpaPageMeta, spaCanonicalUrl, type SpaPageMeta } from '../lib/spaPageMeta.ts';

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
  const re = new RegExp(
    `<link\\s+rel\\s*=\\s*["']${escapeRegExp(rel)}["'][\\s\\S]*?\\/?>`,
    'i'
  );
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

function replaceJsonLd(html: string, meta: SpaPageMeta, url: string): string {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Silicon Nexus',
    url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: meta.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  const tag = `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, tag);
  }
  return html;
}

/**
 * Rewrite the Vite SPA `index.html` shell so crawlers and social previews
 * see per-route title, description, and canonical. `og:image` is left as
 * baked in the file (https://silinex.xyz/og.png).
 *
 * Unknown paths keep homepage title, description, and canonical.
 */
export function rewriteSpaHtml(html: string, requestPath: string, appUrl: string): string {
  const meta = resolveSpaPageMeta(requestPath);
  const url = spaCanonicalUrl(appUrl, requestPath);
  let out = html;
  out = replaceTitle(out, meta.title);
  out = replaceMeta(out, 'name', 'description', meta.description);
  out = replaceLinkHref(out, 'canonical', url);
  out = replaceMeta(out, 'property', 'og:url', url);
  out = replaceMeta(out, 'property', 'og:title', meta.title);
  out = replaceMeta(out, 'property', 'og:description', meta.description);
  out = replaceMeta(out, 'name', 'twitter:title', meta.title);
  out = replaceMeta(out, 'name', 'twitter:description', meta.description);
  out = replaceJsonLd(out, meta, url);
  out = replaceStaticBlurb(out, meta.blurb);
  return out;
}
