import type { Site, SiteContent } from './types.ts';

export function buildSiteLlmsTxt(
  appUrl: string,
  site: Site,
  items: SiteContent[]
): string {
  const base = appUrl.replace(/\/$/, '');
  const siteBase = `${base}/sites/${encodeURIComponent(site.slug)}`;
  const homepage = site.domain
    ? site.domain.startsWith('http')
      ? site.domain
      : `https://${site.domain}`
    : siteBase;
  const updated =
    items
      .map((i) => i.updatedAt || i.publishedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || site.updatedAt;

  const lines = [
    `# ${site.name}`,
    `> ${site.description || 'Customer site content mirrored for AI/agent discovery (GEO module).'}`,
    '',
    `Canonical homepage: ${homepage}`,
    site.domain ? `Canonical domain: ${site.domain}` : null,
    `Last content update: ${updated}`,
    '',
    '## Discovery',
    `- [Site feed (JSON)](${siteBase}/feed.json)`,
    `- [GEO status API](${base}/api/sites/${encodeURIComponent(site.slug)}/geo)`,
    `- [Hub llms.txt](${base}/llms.txt)`,
    `- [Hub agent card](${base}/.well-known/agent.json)`,
    '',
    '## Content',
    ...items.slice(0, 100).map((i) => {
      const md = `${siteBase}/content/${encodeURIComponent(i.slug)}.md`;
      const json = `${siteBase}/content/${encodeURIComponent(i.slug)}.json`;
      const source = i.canonicalUrl ? ` — canonical: ${i.canonicalUrl}` : '';
      return `- [${i.title}](${md}) ([json](${json}))${source}`;
    }),
    '',
    '## Notes for crawlers',
    '- Prefer Markdown/JSON content endpoints over scraping the SPA shell.',
    '- indexing.status on items reflects observed crawler User-Agents — not a guarantee of LLM/search inclusion.',
    '- This surface is a Silicon Nexus GEO module; memory/tasks remain separate authenticated APIs.',
    '- Do not treat mirrored pages as the only source of truth when a canonical URL is listed.',
    '',
  ].filter((line) => line !== null) as string[];
  return lines.join('\n');
}

export function buildSiteFeedJson(appUrl: string, site: Site, items: SiteContent[]) {
  const base = appUrl.replace(/\/$/, '');
  const siteBase = `${base}/sites/${encodeURIComponent(site.slug)}`;
  return {
    title: `${site.name} — GEO content`,
    site: {
      slug: site.slug,
      name: site.name,
      domain: site.domain,
      description: site.description,
      lastPulledAt: site.lastPulledAt,
      updatedAt: site.updatedAt,
    },
    home: siteBase,
    homepage: site.domain
      ? site.domain.startsWith('http')
        ? site.domain
        : `https://${site.domain}`
      : siteBase,
    llmsTxt: `${siteBase}/llms.txt`,
    formats: {
      contentMd: `${siteBase}/content/{slug}.md`,
      contentJson: `${siteBase}/content/{slug}.json`,
      geoStatus: `${base}/api/sites/${encodeURIComponent(site.slug)}/geo`,
    },
    indexingNote:
      'indexing.status=crawled means a known crawler fetched the item URL; not a guarantee of corpus inclusion.',
    count: items.length,
    items: items.map((item) => ({
      ...item,
      urls: {
        md: `${siteBase}/content/${encodeURIComponent(item.slug)}.md`,
        json: `${siteBase}/content/${encodeURIComponent(item.slug)}.json`,
      },
    })),
  };
}
