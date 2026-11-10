/**
 * Silicon News Wire ingest — RSS digests from curated reputable desks only.
 * Bilingual digests (title + summary + link). No full-text reprint.
 * Politics / sensitive topics are rejected by wireSafety.
 */
import crypto from 'crypto';
import { composeBilingualBriefs, softExtractPage } from './wireBrief.ts';
import { evaluateWireSafety } from './wireSafety.ts';
import type { TranslateLang } from './translate.ts';
import {
  deleteWireArticle,
  listWireArticlesForModeration,
  upsertWireArticle,
} from './wireStore.ts';
import type { WireArticleInput, WireCategorySlug } from './wireTypes.ts';

export type WireFeedSource = {
  id: string;
  name: string;
  url: string;
  lang: TranslateLang;
  defaultCategory: WireCategorySlug;
  /** Only these link hosts may be ingested from this desk. */
  allowedHosts: string[];
  /** Official / established tech desk (required for ingest). */
  reputable: true;
};

/**
 * Allowlist only — no open web crawl, no user forums, no aggregators without an editorial desk.
 * Add new desks here deliberately; do not ingest arbitrary RSS.
 */
export const WIRE_FEED_SOURCES: WireFeedSource[] = [
  {
    id: 'mit-tr',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    lang: 'en',
    defaultCategory: 'frontier',
    allowedHosts: ['technologyreview.com'],
    reputable: true,
  },
  {
    id: 'openai-news',
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    lang: 'en',
    defaultCategory: 'ai',
    allowedHosts: ['openai.com'],
    reputable: true,
  },
  {
    id: 'deepmind-blog',
    name: 'Google DeepMind Blog',
    url: 'https://deepmind.google/blog/rss.xml',
    lang: 'en',
    defaultCategory: 'ai',
    allowedHosts: ['deepmind.google', 'blog.google'],
    reputable: true,
  },
  {
    id: 'qbitai',
    name: '量子位',
    url: 'https://www.qbitai.com/feed',
    lang: 'zh',
    defaultCategory: 'ai',
    allowedHosts: ['qbitai.com'],
    reputable: true,
  },
  {
    id: 'ithome',
    name: 'IT之家',
    url: 'https://www.ithome.com/rss/',
    lang: 'zh',
    defaultCategory: 'frontier',
    allowedHosts: ['ithome.com'],
    reputable: true,
  },
];

/** Retired desks — any leftover digests are purged on ingest. */
export const RETIRED_WIRE_SOURCE_NAMES = ['Hacker News (AI)', 'Solidot', 'OpenAI Blog', 'Google News (AI EN)', 'Google News (AI ZH)'];

const TOPIC_RULES: Array<{ category: WireCategorySlug; patterns: RegExp[] }> = [
  {
    category: 'robotics',
    patterns: [/robot/i, /embodied/i, /humanoid/i, /具身/, /机器人/, /人形/],
  },
  {
    category: 'chips',
    patterns: [
      /semiconductor/i,
      /chip\b/i,
      /GPU/i,
      /NVIDIA|TSMC|ASML|HBM/i,
      /算力/,
      /芯片/,
      /晶圆/,
      /英伟达/,
    ],
  },
  {
    category: 'silicon',
    patterns: [
      /agentic/i,
      /autonomous agent/i,
      /silicon life/i,
      /digital being/i,
      /智能体/,
      /硅基/,
      /自主代理/,
    ],
  },
  {
    category: 'ai',
    patterns: [
      /\bAI\b/,
      /\bLLM\b/,
      /\bGPT\b/,
      /OpenAI|Anthropic|DeepSeek|Gemini|DeepMind/i,
      /machine learning/i,
      /artificial intelligence/i,
      /大模型/,
      /人工智能/,
      /生成式/,
      /深度学习/,
    ],
  },
  {
    category: 'frontier',
    patterns: [
      /quantum/i,
      /biotech/i,
      /fusion/i,
      /spacetech/i,
      /deep tech/i,
      /量子/,
      /前沿/,
      /生物技术/,
    ],
  },
];

const RELEVANCE =
  /AI|LLM|GPT|AGI|robot|chip|semiconductor|NVIDIA|OpenAI|Anthropic|DeepSeek|DeepMind|agent|silicon|quantum|neural|model|智能|大模型|机器人|芯片|算力|硅基|生成式|深度学习|具身|半导体|自动驾驶|智能驾驶/i;

type RssItem = {
  title: string;
  link: string;
  summary: string;
  guid: string;
  published: string;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(s: string): string {
  return decodeXmlEntities(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagContent(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(block);
  return m ? stripHtml(m[1]) : '';
}

function attrLink(block: string): string {
  const m = /<link[^>]*href=["']([^"']+)["']/i.exec(block) || /<link>([^<]+)<\/link>/i.exec(block);
  return m ? stripHtml(m[1]) : '';
}

export function parseRssItems(xml: string): RssItem[] {
  const chunks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  const items: RssItem[] = [];
  for (const chunk of chunks) {
    const title = tagContent(chunk, 'title');
    const link = attrLink(chunk) || tagContent(chunk, 'id');
    const summary =
      tagContent(chunk, 'description') ||
      tagContent(chunk, 'summary') ||
      tagContent(chunk, 'content:encoded') ||
      tagContent(chunk, 'content');
    const guid = tagContent(chunk, 'guid') || tagContent(chunk, 'id') || link || title;
    const published =
      tagContent(chunk, 'pubDate') ||
      tagContent(chunk, 'published') ||
      tagContent(chunk, 'updated') ||
      new Date().toISOString();
    if (!title || !link) continue;
    items.push({ title, link, summary: summary.slice(0, 2400), guid, published });
  }
  return items;
}

export function classifyCategory(title: string, summary: string, fallback: WireCategorySlug): WireCategorySlug {
  const blob = `${title}\n${summary}`;
  for (const rule of TOPIC_RULES) {
    if (rule.patterns.some((p) => p.test(blob))) return rule.category;
  }
  return fallback;
}

export function isRelevant(title: string, summary: string): boolean {
  return RELEVANCE.test(`${title}\n${summary}`);
}

function toIso(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/Z$/, '+00:00');
  return d.toISOString().replace(/Z$/, '+00:00');
}

function slugify(title: string, externalId: string): string {
  // Prefer Latin/numeric semantic tokens (Chinese titles otherwise collapse to "---").
  const tokens = (title.toLowerCase().match(/[a-z0-9]+/g) || []).filter(Boolean);
  const ascii = (tokens.join('-') || 'dispatch')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const hash = crypto.createHash('sha1').update(externalId).digest('hex').slice(0, 8);
  return `${ascii}-${hash}`.replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
}

async function buildBilingualDigest(input: {
  source: WireFeedSource;
  item: RssItem;
}): Promise<WireArticleInput> {
  const { source, item } = input;
  const category = classifyCategory(item.title, item.summary, source.defaultCategory);
  const externalId = `${source.id}:${item.guid}`.slice(0, 240);
  const slug = slugify(item.title, externalId);
  const published = toIso(item.published);
  const pageExtract = await softExtractPage(item.link);
  const briefs = await composeBilingualBriefs({
    title: item.title,
    rssSummary: item.summary,
    sourceName: source.name,
    link: item.link,
    sourceLang: source.lang,
    pageExtract,
  });

  return {
    slug,
    headline: briefs.headlineEn,
    summary: briefs.summaryEn,
    bodyMd: briefs.bodyEn,
    keyFacts: briefs.factsEn,
    headlineZh: briefs.headlineZh,
    summaryZh: briefs.summaryZh,
    bodyMdZh: briefs.bodyZh,
    keyFactsZh: briefs.factsZh,
    category,
    authorName: source.name,
    authorType: 'Organization',
    authorUrl: item.link,
    status: 'published',
    datePublished: published,
    dateModified: new Date().toISOString().replace(/Z$/, '+00:00'),
    language: source.lang,
    sourceUrl: item.link,
    sourceName: source.name,
    externalId,
  };
}

export type IngestResult = {
  sourceId: string;
  fetched: number;
  relevant: number;
  created: number;
  updated: number;
  skipped: number;
  rejectedPolitics: number;
  rejectedSensitive: number;
  rejectedDomain: number;
  error?: string;
};

async function fetchFeedXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SiliconNexusWireBot/1.0 (+https://silinex.xyz)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Remove digests from retired desks or that fail current safety rules. */
export function scrubNonCompliantWireArticles(): { removed: number; reasons: Record<string, number> } {
  const allowedNames = new Set(WIRE_FEED_SOURCES.map((s) => s.name));
  const hostByName = new Map(WIRE_FEED_SOURCES.map((s) => [s.name, s.allowedHosts]));
  const reasons: Record<string, number> = {};
  let removed = 0;

  for (const article of listWireArticlesForModeration(500)) {
    // Keep hub seed desk articles (no external source).
    if (!article.sourceName && !article.sourceUrl) continue;

    let reason: string | null = null;
    if (!article.sourceName || RETIRED_WIRE_SOURCE_NAMES.includes(article.sourceName) || !allowedNames.has(article.sourceName)) {
      reason = 'retired_or_unlisted_source';
    } else {
      const hosts = hostByName.get(article.sourceName) || [];
      const verdict = evaluateWireSafety({
        title: `${article.headline} ${article.headlineZh}`,
        summary: `${article.summary} ${article.summaryZh}`,
        link: article.sourceUrl || '',
        allowedHosts: hosts,
        topical: isRelevant(`${article.headline} ${article.headlineZh}`, `${article.summary} ${article.summaryZh}`),
      });
      if (verdict.ok === false) reason = verdict.reason;
    }

    if (reason) {
      if (deleteWireArticle(article.id)) {
        removed += 1;
        reasons[reason] = (reasons[reason] || 0) + 1;
      }
    }
  }
  return { removed, reasons };
}

export async function ingestWireFeeds(options?: {
  sources?: WireFeedSource[];
  perSource?: number;
}): Promise<{
  results: IngestResult[];
  created: number;
  updated: number;
  scrubbed: number;
}> {
  const scrub = scrubNonCompliantWireArticles();
  const sources = (options?.sources || WIRE_FEED_SOURCES).filter((s) => s.reputable);
  const perSource = Math.min(Math.max(options?.perSource ?? 4, 1), 20);
  const results: IngestResult[] = [];
  let created = 0;
  let updated = 0;

  for (const source of sources) {
    const row: IngestResult = {
      sourceId: source.id,
      fetched: 0,
      relevant: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      rejectedPolitics: 0,
      rejectedSensitive: 0,
      rejectedDomain: 0,
    };
    try {
      const xml = await fetchFeedXml(source.url);
      const items = parseRssItems(xml).slice(0, 40);
      row.fetched = items.length;
      for (const item of items) {
        const topical =
          isRelevant(item.title, item.summary) ||
          source.id === 'openai-news' ||
          source.id === 'deepmind-blog' ||
          source.id === 'mit-tr';
        const verdict = evaluateWireSafety({
          title: item.title,
          summary: item.summary,
          link: item.link,
          allowedHosts: source.allowedHosts,
          topical,
        });
        if (verdict.ok === false) {
          row.skipped += 1;
          if (verdict.reason === 'politics') row.rejectedPolitics += 1;
          else if (verdict.reason === 'sensitive') row.rejectedSensitive += 1;
          else if (verdict.reason === 'domain') row.rejectedDomain += 1;
          continue;
        }
        row.relevant += 1;
        if (row.created + row.updated >= perSource) break;
        const input = await buildBilingualDigest({ source, item });
        // Re-check translated Chinese fields for politics/sensitive bleed.
        const post = evaluateWireSafety({
          title: `${input.headline} ${input.headlineZh}`,
          summary: `${input.summary} ${input.summaryZh}`,
          link: item.link,
          allowedHosts: source.allowedHosts,
          topical: true,
        });
        if (post.ok === false) {
          row.skipped += 1;
          if (post.reason === 'politics') row.rejectedPolitics += 1;
          else if (post.reason === 'sensitive') row.rejectedSensitive += 1;
          continue;
        }
        const result = upsertWireArticle(input);
        if (result.created) {
          row.created += 1;
          created += 1;
        } else {
          row.updated += 1;
          updated += 1;
        }
      }
    } catch (err) {
      row.error = err instanceof Error ? err.message : String(err);
    }
    results.push(row);
  }

  return { results, created, updated, scrubbed: scrub.removed };
}

/**
 * Re-write existing sourced digests into readable editorial briefs (paraphrase, not reprint).
 * Hub seed articles without sourceUrl are left untouched.
 */
export async function enrichExistingWireBriefs(options?: {
  limit?: number;
}): Promise<{ enriched: number; skipped: number }> {
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  const deskByName = new Map(WIRE_FEED_SOURCES.map((s) => [s.name, s]));
  let enriched = 0;
  let skipped = 0;

  const candidates = listWireArticlesForModeration(300)
    .filter((a) => a.sourceUrl && a.sourceName && a.externalId)
    .sort((a, b) => {
      const deskA = deskByName.get(a.sourceName || '');
      const deskB = deskByName.get(b.sourceName || '');
      // Prefer Chinese desks first — zh UI readability is the primary reading surface.
      const score = (desk?: { lang?: string }, bodyZh?: string) =>
        (desk?.lang === 'zh' ? 0 : 2) + ((bodyZh || '').length < 800 ? 0 : 1);
      return score(deskA, a.bodyMdZh) - score(deskB, b.bodyMdZh);
    })
    .slice(0, limit);

  for (const article of candidates) {
    const desk = deskByName.get(article.sourceName || '');
    if (!desk) {
      skipped += 1;
      continue;
    }
    const force = process.env.WIRE_ENRICH_FORCE === '1';
    const already =
      /##\s*(Wire brief|电讯正文)/i.test(article.bodyMd) &&
      /##\s*(Source & notice|来源与声明)/i.test(article.bodyMdZh || article.bodyMd);
    if (!force && already && (article.bodyMdZh || '').length > 900) {
      skipped += 1;
      continue;
    }

    try {
      const pageExtract = await softExtractPage(article.sourceUrl!);
      // Prefer public summary text; strip prior Wire framing so we don't re-ingest our own prose.
      const rawSummary =
        desk.lang === 'zh'
          ? article.summaryZh || article.summary || article.headlineZh || article.headline
          : article.summary || article.headline;
      const rssSummary = rawSummary
        .replace(/^综合\s+\S+\s+等公开(?:信息|报道)(?:整理)?[：:，,]?\s*/u, '')
        .replace(/^According to public reporting via [^,]+,\s*/i, '')
        .replace(/事件核心如下[：:]\s*/u, '')
        .replace(/Silicon News Wire[^.。]*[.。]?/gi, ' ')
        .trim();
      const briefs = await composeBilingualBriefs({
        title: desk.lang === 'zh' ? article.headlineZh || article.headline : article.headline,
        rssSummary: (rssSummary || article.headlineZh || article.headline).slice(0, 2400),
        sourceName: desk.name,
        link: article.sourceUrl!,
        sourceLang: desk.lang,
        pageExtract,
      });
      const post = evaluateWireSafety({
        title: `${briefs.headlineEn} ${briefs.headlineZh}`,
        summary: `${briefs.summaryEn} ${briefs.summaryZh}`,
        link: article.sourceUrl!,
        allowedHosts: desk.allowedHosts,
        topical: true,
      });
      if (post.ok === false) {
        skipped += 1;
        continue;
      }
      upsertWireArticle({
        slug: article.slug,
        headline: briefs.headlineEn,
        summary: briefs.summaryEn,
        bodyMd: briefs.bodyEn,
        keyFacts: briefs.factsEn,
        headlineZh: briefs.headlineZh,
        summaryZh: briefs.summaryZh,
        bodyMdZh: briefs.bodyZh,
        keyFactsZh: briefs.factsZh,
        category: article.category,
        authorName: desk.name,
        authorType: 'Organization',
        authorUrl: article.sourceUrl,
        status: 'published',
        datePublished: article.datePublished,
        dateModified: new Date().toISOString().replace(/Z$/, '+00:00'),
        language: desk.lang,
        sourceUrl: article.sourceUrl,
        sourceName: desk.name,
        externalId: article.externalId,
      });
      enriched += 1;
    } catch {
      skipped += 1;
    }
  }

  return { enriched, skipped };
}
