import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { sanitizeWireSlug, latinSlugTokens } from '../src/server/wireBrief.ts';
import { containsHan, localizeWireArticle } from '../src/server/wireLocalize.ts';
import {
  pickFeaturedDispatch,
  previewTakeaways,
  FEATURED_RECENCY_DAYS,
} from '../src/server/wirePortalUi.ts';
import type { WireArticle } from '../src/server/wireTypes.ts';
import { WIRE_OBSERVATION_NOTE } from '../src/server/wireTypes.ts';

function fakeArticle(partial: Partial<WireArticle> & Pick<WireArticle, 'slug' | 'headline'>): WireArticle {
  return {
    id: partial.id || `id-${partial.slug}`,
    publisherId: 'pub',
    publisher: {
      id: 'pub',
      slug: 'silicon-nexus',
      name: 'Silicon Nexus',
      url: 'https://silinex.xyz/',
      description: '',
      createdAt: '',
      updatedAt: '',
    },
    slug: partial.slug,
    headline: partial.headline,
    summary: partial.summary || 'English summary.',
    bodyMd: partial.bodyMd || '## Wire brief\n\nEnglish body.',
    keyFacts: partial.keyFacts || [{ id: '1', text: 'Fact one' }],
    headlineZh: partial.headlineZh || '',
    summaryZh: partial.summaryZh || '',
    bodyMdZh: partial.bodyMdZh || '',
    keyFactsZh: partial.keyFactsZh || [],
    category: partial.category || 'robotics',
    authorName: partial.authorName || 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: partial.authorUrl || null,
    status: 'published',
    datePublished: partial.datePublished || '2026-11-08T12:00:00+08:00',
    dateModified: partial.dateModified || '2026-11-08T12:00:00+08:00',
    imageUrl: null,
    language: partial.language || 'en',
    sourceUrl: partial.sourceUrl ?? null,
    sourceName: partial.sourceName ?? null,
    externalId: partial.externalId ?? null,
    createdAt: '',
    updatedAt: '',
    observations: partial.observations || {
      human: 0,
      bot: 0,
      crawlers: [],
      note: WIRE_OBSERVATION_NOTE,
    },
  };
}

describe('wire portal polish', () => {
  test('slug sanitize collapses hyphen runs and prefers latin tokens', () => {
    assert.equal(sanitizeWireSlug('longcat-2-5---1-6'), 'longcat-2-5-1-6');
    assert.deepEqual(latinSlugTokens('LongCat 2.5 发布 1.6 升级'), ['longcat', '2', '5', '1', '6']);
    const tokens = latinSlugTokens('何小鹏：希望小鹏明年能成为第一个在欧洲上线智能辅助驾驶的中国品牌');
    assert.equal(tokens.length, 0);
  });

  test('preview takeaways drop summary duplicates', () => {
    const summary = 'Researchers released a public robotics benchmark.';
    const facts = [
      { text: summary },
      { text: 'Includes success rates and failure logs.' },
      { text: 'Teams compare agents under one protocol.' },
    ];
    const out = previewTakeaways(summary, facts, {
      category: 'robotics',
      sourceName: 'MIT Technology Review',
      datePublished: '2026-11-09T00:00:00+00:00',
    });
    assert.equal(out.length, 2);
    assert.ok(!out.some((t) => t === summary));
  });

  test('featured dispatch prefers highest signal within recency window', () => {
    const nowMs = Date.parse('2026-11-10T12:00:00+08:00');
    const hotterOlder = fakeArticle({
      slug: 'hotter-older',
      headline: 'Hotter but slightly older',
      datePublished: '2026-11-08T12:00:00+08:00',
      observations: { human: 5, bot: 1, crawlers: [], note: WIRE_OBSERVATION_NOTE },
    });
    const fresherQuieter = fakeArticle({
      slug: 'fresher-quieter',
      headline: 'Fresher but quieter',
      sourceUrl: 'https://www.ithome.com/x',
      sourceName: 'IT之家',
      externalId: 'ithome:1',
      datePublished: '2026-11-09T22:00:00+08:00',
      observations: { human: 1, bot: 0, crawlers: [], note: WIRE_OBSERVATION_NOTE },
    });
    const lead = pickFeaturedDispatch([fresherQuieter, hotterOlder], nowMs);
    assert.equal(lead?.slug, 'hotter-older');
  });

  test('featured dispatch falls back to newest outside recency window', () => {
    const nowMs = Date.parse('2026-11-10T12:00:00+08:00');
    const daysOutside = FEATURED_RECENCY_DAYS + 2;
    const older = fakeArticle({
      slug: 'older-scraped',
      headline: 'Older scraped',
      sourceUrl: 'https://www.ithome.com/x',
      sourceName: 'IT之家',
      externalId: 'ithome:old',
      datePublished: new Date(nowMs - daysOutside * 24 * 60 * 60 * 1000).toISOString(),
      observations: { human: 20, bot: 5, crawlers: [], note: WIRE_OBSERVATION_NOTE },
    });
    const newer = fakeArticle({
      slug: 'newer-scraped',
      headline: 'Newer scraped',
      sourceUrl: 'https://www.ithome.com/y',
      sourceName: 'IT之家',
      externalId: 'ithome:new',
      datePublished: new Date(nowMs - (daysOutside - 1) * 24 * 60 * 60 * 1000).toISOString(),
      observations: { human: 0, bot: 0, crawlers: [], note: WIRE_OBSERVATION_NOTE },
    });
    const lead = pickFeaturedDispatch([older, newer], nowMs);
    assert.equal(lead?.slug, 'newer-scraped');
  });

  test('featured dispatch breaks signal ties by newer datePublished', () => {
    const nowMs = Date.parse('2026-11-10T12:00:00+08:00');
    const tiedOlder = fakeArticle({
      slug: 'tied-older',
      headline: 'Tied older',
      datePublished: '2026-11-08T10:00:00+08:00',
      observations: { human: 2, bot: 2, crawlers: [], note: WIRE_OBSERVATION_NOTE },
    });
    const tiedNewer = fakeArticle({
      slug: 'tied-newer',
      headline: 'Tied newer',
      datePublished: '2026-11-09T10:00:00+08:00',
      observations: { human: 2, bot: 2, crawlers: [], note: WIRE_OBSERVATION_NOTE },
    });
    const lead = pickFeaturedDispatch([tiedOlder, tiedNewer], nowMs);
    assert.equal(lead?.slug, 'tied-newer');
  });

  test('English localize never returns Han-mixed fields', () => {
    const article = fakeArticle({
      slug: 'dispatch-mixed',
      headline: '何小鹏谈智驾',
      summary: 'According to public reporting via IT之家, 综合公开报道，小鹏汽车官微宣布。',
      keyFacts: [{ id: '1', text: '综合公开报道，IT之家消息。' }],
      headlineZh: '何小鹏谈智驾',
      summaryZh: '小鹏汽车官微宣布相关进展。',
      keyFactsZh: [{ id: '1', text: '小鹏汽车官微宣布相关进展。' }],
      sourceUrl: 'https://www.ithome.com/x',
      sourceName: 'IT之家',
      externalId: 'ithome:2',
      language: 'zh',
    });
    const view = localizeWireArticle(article, 'en');
    assert.equal(containsHan(view.headline), false);
    assert.equal(containsHan(view.summary), false);
    assert.ok(view.keyFacts.every((f) => !containsHan(f.text)));
    assert.doesNotMatch(view.summary, /综合公开/);
    const zh = localizeWireArticle(article, 'zh');
    assert.ok(containsHan(zh.headline) || containsHan(zh.summary));
  });
});
