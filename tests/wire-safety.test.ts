import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  evaluateWireSafety,
  hostAllowed,
  isPoliticalDigest,
  isSensitiveDigest,
} from '../src/server/wireSafety.ts';
import { WIRE_FEED_SOURCES } from '../src/server/wireIngest.ts';

describe('wire safety', () => {
  test('only curated reputable desks are configured', () => {
    assert.ok(WIRE_FEED_SOURCES.length >= 3);
    for (const s of WIRE_FEED_SOURCES) {
      assert.equal(s.reputable, true);
      assert.ok(s.allowedHosts.length > 0);
    }
    assert.equal(
      WIRE_FEED_SOURCES.some((s) => /hacker news|solidot|google news/i.test(s.name)),
      false
    );
  });

  test('host allowlist accepts desk domains only', () => {
    assert.equal(hostAllowed('https://www.technologyreview.com/2026/ai/', ['technologyreview.com']), true);
    assert.equal(hostAllowed('https://random.blog/post', ['technologyreview.com']), false);
    assert.equal(hostAllowed('not-a-url', ['openai.com']), false);
  });

  test('rejects political digests', () => {
    assert.equal(isPoliticalDigest('Election polling and AI ads', 'campaign trail'), true);
    assert.equal(isPoliticalDigest('两会代表谈人工智能监管', '政治议题'), true);
    assert.equal(isPoliticalDigest('OpenAI releases a new model API', 'benchmarks and latency'), false);
  });

  test('rejects sensitive digests', () => {
    assert.equal(isSensitiveDigest('Leaked password dump online', 'credentials'), true);
    assert.equal(isSensitiveDigest('DeepSeek open-sources a new LLM', 'weights on GitHub'), false);
  });

  test('evaluateWireSafety combines topical + domain + politics', () => {
    const ok = evaluateWireSafety({
      title: 'Anthropic ships Claude update for coding agents',
      summary: 'New tools for developers.',
      link: 'https://www.anthropic.com/news/claude-update',
      allowedHosts: ['anthropic.com'],
      topical: true,
    });
    assert.equal(ok.ok, true);

    const politics = evaluateWireSafety({
      title: 'White House AI executive order fight',
      summary: 'Congress and sanctions debate',
      link: 'https://www.anthropic.com/news/x',
      allowedHosts: ['anthropic.com'],
      topical: true,
    });
    assert.equal(politics.ok, false);
    if (!politics.ok) assert.equal(politics.reason, 'politics');

    const domain = evaluateWireSafety({
      title: 'AI chip news',
      summary: 'NVIDIA GPU',
      link: 'https://spam.example/ai',
      allowedHosts: ['anthropic.com'],
      topical: true,
    });
    assert.equal(domain.ok, false);
    if (!domain.ok) assert.equal(domain.reason, 'domain');
  });
});
