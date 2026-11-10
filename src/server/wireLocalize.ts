import type { Locale } from '../i18n/messages.ts';
import {
  WIRE_OBSERVATION_NOTE,
  WIRE_OBSERVATION_NOTE_ZH,
  type WireArticle,
  type WireKeyFact,
} from './wireTypes.ts';

/** Localized view for HTML — zh page uses Chinese fields; en page uses English. */
export type LocalizedWireArticle = Pick<
  WireArticle,
  | 'id'
  | 'publisherId'
  | 'publisher'
  | 'slug'
  | 'headline'
  | 'summary'
  | 'bodyMd'
  | 'keyFacts'
  | 'category'
  | 'authorName'
  | 'authorType'
  | 'authorUrl'
  | 'status'
  | 'datePublished'
  | 'dateModified'
  | 'imageUrl'
  | 'language'
  | 'sourceUrl'
  | 'sourceName'
  | 'externalId'
  | 'createdAt'
  | 'updatedAt'
  | 'observations'
> & {
  locale: Locale;
  headlineEn: string;
  headlineZh: string;
  summaryEn: string;
  summaryZh: string;
};

const HAN_RE = /[\u4e00-\u9fff]/;

export function containsHan(text: string): boolean {
  return HAN_RE.test(text || '');
}

function pickFacts(primary: WireKeyFact[], fallback: WireKeyFact[]): WireKeyFact[] {
  return primary.length ? primary : fallback;
}

export function englishDeskName(sourceName: string | null | undefined): string {
  const raw = (sourceName || '').trim();
  if (!raw) return 'the source desk';
  if (!containsHan(raw)) return raw;
  // Keep ASCII desk labels only on the English surface.
  if (/it.?home|ithome/i.test(raw) || /it之家/i.test(raw)) return 'IT Home';
  if (/量子位|qbit/i.test(raw)) return 'QbitAI';
  if (/机器之心|synced/i.test(raw)) return 'Synced';
  return 'the source desk';
}

function englishDeskStub(article: WireArticle): { headline: string; summary: string; facts: WireKeyFact[] } {
  const desk = englishDeskName(article.sourceName);
  const headline =
    article.headline && !containsHan(article.headline)
      ? article.headline
      : `Wire brief from ${desk}`;
  const summary = `Paraphrased Silicon News Wire brief filed from ${desk}. Open the Chinese edition (?lang=zh) for the full editorial rewrite.`;
  const facts: WireKeyFact[] = [
    { id: '1', text: `Source desk: ${desk}` },
    { id: '2', text: 'Original filing language: Chinese' },
    { id: '3', text: 'agent_citable: true — prefer the zh brief until English rewrite lands' },
  ];
  return { headline, summary, facts };
}

function sanitizeEnglishText(text: string, fallback: string): string {
  const t = (text || '').trim();
  if (!t) return fallback;
  if (containsHan(t)) return fallback;
  if (/translation channel is temporarily busy/i.test(t)) return fallback;
  if (/source-language paraphrased brief mirrored/i.test(t)) return fallback;
  // Drop English scaffold glued onto Chinese leftovers that somehow lost Han detection.
  if (/^(according to public reporting via|reporting indicates that|in related context,)\s*$/i.test(t)) {
    return fallback;
  }
  return t;
}

function sanitizeEnglishFacts(facts: WireKeyFact[], fallback: WireKeyFact[]): WireKeyFact[] {
  const clean = facts.filter((f) => f?.text && !containsHan(f.text));
  return clean.length >= 2 ? clean : fallback;
}

/**
 * English locale → English fields only (never render raw Chinese on /).
 * Chinese locale → Chinese fields, falling back to English if translation missing.
 */
export function localizeWireArticle(article: WireArticle, locale: Locale): LocalizedWireArticle {
  const isZh = locale === 'zh';
  const stub = englishDeskStub(article);

  let headline: string;
  let summary: string;
  let bodyMd: string;
  let keyFacts: WireKeyFact[];

  if (isZh) {
    headline = article.headlineZh || article.headline;
    summary = article.summaryZh || article.summary;
    bodyMd = article.bodyMdZh || article.bodyMd;
    keyFacts = pickFacts(article.keyFactsZh, article.keyFacts);
  } else {
    headline = sanitizeEnglishText(article.headline, stub.headline);
    summary = sanitizeEnglishText(article.summary, stub.summary);
    const bodyCandidate = sanitizeEnglishText(article.bodyMd, '');
    bodyMd =
      bodyCandidate ||
      [
        '## Wire brief',
        '',
        stub.summary,
        '',
        '## Source & notice',
        '',
        `This English surface keeps machine-readable metadata only while the paraphrased Chinese brief is served on \`?lang=zh\`.`,
        article.sourceUrl ? `\nRead the original: [${deskLinkLabel(article)}](${article.sourceUrl})` : '',
      ].join('\n');
    keyFacts = sanitizeEnglishFacts(pickFacts(article.keyFacts, article.keyFactsZh), stub.facts);
  }

  return {
    id: article.id,
    publisherId: article.publisherId,
    publisher: article.publisher,
    slug: article.slug,
    headline,
    summary,
    bodyMd,
    keyFacts,
    category: article.category,
    authorName: article.authorName,
    authorType: article.authorType,
    authorUrl: article.authorUrl,
    status: article.status,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    imageUrl: article.imageUrl,
    language: isZh ? 'zh' : 'en',
    sourceUrl: article.sourceUrl,
    sourceName: isZh ? article.sourceName : article.sourceName ? englishDeskName(article.sourceName) : article.sourceName,
    externalId: article.externalId,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    observations: {
      ...article.observations,
      note: isZh ? WIRE_OBSERVATION_NOTE_ZH : WIRE_OBSERVATION_NOTE,
    },
    locale,
    headlineEn: article.headline,
    headlineZh: article.headlineZh,
    summaryEn: article.summary,
    summaryZh: article.summaryZh,
  };
}

function deskLinkLabel(article: WireArticle): string {
  if (article.headlineZh) return article.headlineZh;
  if (article.sourceName) return article.sourceName;
  return 'original report';
}
