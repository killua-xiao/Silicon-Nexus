/** Known AI / search crawler User-Agent fragments → stable crawler id. */
const CRAWLER_UA: Array<{ id: string; pattern: RegExp }> = [
  { id: 'GPTBot', pattern: /GPTBot/i },
  { id: 'ChatGPT-User', pattern: /ChatGPT-User/i },
  { id: 'ClaudeBot', pattern: /ClaudeBot|anthropic-ai|Claude-Web/i },
  { id: 'PerplexityBot', pattern: /PerplexityBot/i },
  { id: 'Google-Extended', pattern: /Google-Extended/i },
  { id: 'Googlebot', pattern: /Googlebot/i },
  { id: 'Bingbot', pattern: /bingbot|BingPreview/i },
  { id: 'Applebot', pattern: /Applebot/i },
  { id: 'Bytespider', pattern: /Bytespider/i },
  { id: 'CCBot', pattern: /CCBot/i },
  { id: 'Amazonbot', pattern: /Amazonbot/i },
  { id: 'meta-externalagent', pattern: /meta-externalagent|FacebookBot/i },
  { id: 'DuckDuckBot', pattern: /DuckDuckBot/i },
  { id: 'YandexBot', pattern: /YandexBot/i },
  { id: 'cohere-ai', pattern: /cohere-ai/i },
  { id: 'Diffbot', pattern: /Diffbot/i },
  { id: 'YouBot', pattern: /YouBot/i },
  { id: 'PetalBot', pattern: /PetalBot/i },
  { id: 'SemrushBot', pattern: /SemrushBot/i },
  { id: 'AhrefsBot', pattern: /AhrefsBot/i },
];

export type CrawlStatus = 'unseen' | 'crawled';

export type FeedIndexing = {
  /** Observed crawler fetch — NOT a guarantee of search/LLM corpus inclusion. */
  status: CrawlStatus;
  crawlHits: number;
  lastCrawledAt: string | null;
  crawlersSeen: string[];
  note: string;
};

export const INDEXING_NOTE =
  'status=crawled means a known crawler fetched this URL. It does not prove permanent search-engine or LLM training inclusion.';

export function detectCrawler(userAgent: string | undefined): string | null {
  if (!userAgent) return null;
  for (const c of CRAWLER_UA) {
    if (c.pattern.test(userAgent)) return c.id;
  }
  return null;
}

export function buildIndexing(input: {
  crawlHits: number;
  lastCrawledAt: string | null;
  crawlersJson: string | null;
}): FeedIndexing {
  let crawlersSeen: string[] = [];
  try {
    crawlersSeen = JSON.parse(input.crawlersJson || '[]');
  } catch {
    crawlersSeen = [];
  }
  const crawled = input.crawlHits > 0 || !!input.lastCrawledAt || crawlersSeen.length > 0;
  return {
    status: crawled ? 'crawled' : 'unseen',
    crawlHits: input.crawlHits || 0,
    lastCrawledAt: input.lastCrawledAt,
    crawlersSeen,
    note: INDEXING_NOTE,
  };
}
