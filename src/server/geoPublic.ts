import type { Site, SiteContent } from './types.ts';

export function buildSiteLlmsTxt(
  appUrl: string,
  site: Site,
  items: SiteContent[]
): string {
  const base = appUrl.replace(/\/$/, '');
  const siteBase = `${base}/sites/${encodeURIComponent(site.slug)}`;
  const lines = [
    `# ${site.name}`,
    `> ${site.description || 'Customer site content mirrored for AI/agent discovery (GEO module).'}`,
    '',
    site.domain ? `Canonical domain: ${site.domain}` : null,
    '',
    '## Discovery',
    `- [Site feed (JSON)](${siteBase}/feed.json)`,
    `- [Hub llms.txt](${base}/llms.txt)`,
    `- [GEO status API](${base}/api/sites/${encodeURIComponent(site.slug)}/geo)`,
    '',
    '## Content',
    ...items.slice(0, 100).map(
      (i) =>
        `- [${i.title}](${siteBase}/content/${encodeURIComponent(i.slug)}.md)${
          i.canonicalUrl ? ` — source: ${i.canonicalUrl}` : ''
        }`
    ),
    '',
    '## Notes for crawlers',
    '- Prefer Markdown/JSON content endpoints over scraping the SPA shell.',
    '- indexing.status on items reflects observed crawler User-Agents — not a guarantee of LLM/search inclusion.',
    '- This surface is a Silicon Nexus GEO module; memory/tasks remain separate authenticated APIs.',
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
    },
    home: siteBase,
    llmsTxt: `${siteBase}/llms.txt`,
    indexingNote:
      'indexing.status=crawled means a known crawler fetched the item URL; not a guarantee of corpus inclusion.',
    items,
  };
}
