/** Silicon News Wire — additive public dispatch module. */

export const WIRE_PUBLISHER_SLUG = 'silicon-nexus';

export const WIRE_CATEGORIES = [
  {
    slug: 'ai',
    nameEn: 'AI',
    nameZh: '人工智能',
    blurbEn: 'Models, agents, and applied intelligence.',
    blurbZh: '大模型、智能体与应用落地。',
  },
  {
    slug: 'frontier',
    nameEn: 'Frontier',
    nameZh: '前沿科技',
    blurbEn: 'Frontier science and deep tech.',
    blurbZh: '前沿科学与深科技。',
  },
  {
    slug: 'silicon',
    nameEn: 'Silicon Life',
    nameZh: '硅基生命',
    blurbEn: 'Agents, continuity, and silicon lifeforms.',
    blurbZh: '智能体、连续性与硅基生命体。',
  },
  {
    slug: 'chips',
    nameEn: 'Chips',
    nameZh: '芯片算力',
    blurbEn: 'Semiconductors, compute, and infrastructure.',
    blurbZh: '半导体、算力与基础设施。',
  },
  {
    slug: 'robotics',
    nameEn: 'Robotics',
    nameZh: '具身智能',
    blurbEn: 'Embodied AI, robots, and physical agents.',
    blurbZh: '具身智能、机器人与物理智能体。',
  },
  { slug: 'wire', nameEn: 'Wire', nameZh: '电讯', blurbEn: 'Hub dispatches.', blurbZh: '站方电讯。' },
  {
    slug: 'platform',
    nameEn: 'Platform',
    nameZh: '平台',
    blurbEn: 'Body, continuity, MCP.',
    blurbZh: '身体、连续性、MCP。',
  },
  {
    slug: 'observation',
    nameEn: 'Observation',
    nameZh: '观测',
    blurbEn: 'Request logs, not inclusion.',
    blurbZh: '请求日志，不是收录证明。',
  },
] as const;

export type WireCategorySlug = (typeof WIRE_CATEGORIES)[number]['slug'];

export type WireArticleStatus = 'draft' | 'published';
export type WireAuthorType = 'Organization' | 'Person';
export type WireAudience = 'human' | 'bot';
export type WireSourceLang = 'en' | 'zh';

export interface WirePublisher {
  id: string;
  slug: string;
  name: string;
  url: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface WireKeyFact {
  id: string;
  text: string;
}

export interface WireCrawlerCount {
  crawlerId: string;
  hits: number;
  lastSeenAt: string | null;
}

export interface WireObservations {
  human: number;
  bot: number;
  crawlers: WireCrawlerCount[];
  lastSeenAt: string | null;
  note: string;
}

export interface WireArticle {
  id: string;
  publisherId: string;
  publisher: WirePublisher;
  slug: string;
  /** English (canonical for machine defaults). */
  headline: string;
  summary: string;
  bodyMd: string;
  keyFacts: WireKeyFact[];
  /** Chinese display fields. Empty string / [] means fall back to English. */
  headlineZh: string;
  summaryZh: string;
  bodyMdZh: string;
  keyFactsZh: WireKeyFact[];
  category: WireCategorySlug;
  authorName: string;
  authorType: WireAuthorType;
  authorUrl: string | null;
  status: WireArticleStatus;
  datePublished: string;
  dateModified: string;
  imageUrl: string | null;
  /** Original source language. */
  language: string;
  sourceUrl: string | null;
  sourceName: string | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
  observations: WireObservations;
}

export interface WireArticleInput {
  slug: string;
  headline: string;
  summary: string;
  bodyMd: string;
  keyFacts: string[];
  headlineZh?: string;
  summaryZh?: string;
  bodyMdZh?: string;
  keyFactsZh?: string[];
  category: WireCategorySlug;
  authorName: string;
  authorType?: WireAuthorType;
  authorUrl?: string | null;
  status?: WireArticleStatus;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string | null;
  language?: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
  externalId?: string | null;
}

export const WIRE_OBSERVATION_NOTE =
  'Counts are request logs classified by User-Agent. User-Agents can be spoofed. This is not proof of search-engine or LLM inclusion.';

export const WIRE_OBSERVATION_NOTE_ZH =
  '计数来自按 User-Agent 分类的请求日志。UA 可伪造。这不是搜索引擎或大模型收录证明。';

export function isWireCategorySlug(value: string): value is WireCategorySlug {
  return WIRE_CATEGORIES.some((c) => c.slug === value);
}

export function wireCategory(slug: string) {
  return WIRE_CATEGORIES.find((c) => c.slug === slug) ?? null;
}
