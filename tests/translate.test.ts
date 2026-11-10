import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import {
  geminiApiKey,
  geminiTranslateModel,
  translateText,
  translationChannelReady,
} from '../src/server/translate.ts';

const ENV_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GEMINI_TRANSLATE_MODEL',
  'NEXUS_TRANSLATE_MODEL',
  'OPENAI_API_KEY',
  'NEXUS_TRANSLATE_URL',
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe('Gemini translation provider', { concurrency: 1 }, () => {
  const snap = snapshotEnv();
  afterEach(() => restoreEnv(snap));

  test('reads GEMINI_API_KEY then GOOGLE_GENERATIVE_AI_API_KEY', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    assert.equal(geminiApiKey(), '');
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'alt-placeholder';
    assert.equal(geminiApiKey(), 'alt-placeholder');
    process.env.GEMINI_API_KEY = 'primary-placeholder';
    assert.equal(geminiApiKey(), 'primary-placeholder');
  });

  test('defaults to current Gemini Flash and ignores a gpt shared model', () => {
    delete process.env.GEMINI_TRANSLATE_MODEL;
    delete process.env.NEXUS_TRANSLATE_MODEL;
    assert.equal(geminiTranslateModel(), 'gemini-3.8-flash');
    process.env.NEXUS_TRANSLATE_MODEL = 'gpt-4o-mini';
    assert.equal(geminiTranslateModel(), 'gemini-3.8-flash');
    process.env.NEXUS_TRANSLATE_MODEL = 'gemini-3.6-flash';
    assert.equal(geminiTranslateModel(), 'gemini-3.6-flash');
    process.env.GEMINI_TRANSLATE_MODEL = 'gemini-3.8-flash';
    process.env.NEXUS_TRANSLATE_MODEL = 'gemini-3.6-flash';
    assert.equal(geminiTranslateModel(), 'gemini-3.8-flash');
  });

  test('translationChannelReady treats a Gemini key as a ready channel', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXUS_TRANSLATE_URL;
    process.env.GEMINI_API_KEY = 'test-placeholder-not-a-secret';
    const origFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      throw new Error('network should not be required when a Gemini key is set');
    }) as typeof fetch;
    try {
      assert.equal(await translationChannelReady(), true);
      assert.equal(fetchCalls, 0);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  test('translateText posts to Gemini generateContent first', async () => {
    process.env.GEMINI_API_KEY = 'test-placeholder-not-a-secret';
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXUS_TRANSLATE_URL;
    const origFetch = globalThis.fetch;
    const calls: Array<{ url: string; body: unknown; headers: HeadersInit | undefined }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null, headers: init?.headers });
      if (url.includes('generativelanguage.googleapis.com') && url.includes(':generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '硅基新闻电讯发布了一则简短的科技简报。' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('unexpected provider', { status: 500 });
    }) as typeof fetch;
    try {
      const out = await translateText(
        'Silicon News Wire published a unique Gemini probe brief.',
        'en',
        'zh'
      );
      assert.match(out, /硅基新闻电讯/);
      assert.equal(calls.length, 1);
      assert.match(
        calls[0].url,
        /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.8-flash:generateContent/
      );
      const body = calls[0].body as { systemInstruction: { parts: Array<{ text: string }> } };
      assert.match(body.systemInstruction.parts[0].text, /Simplified Chinese/);
      assert.match(body.systemInstruction.parts[0].text, /proper nouns/);
      assert.match(body.systemInstruction.parts[0].text, /markdown links/);
      const headers = calls[0].headers as Record<string, string>;
      assert.equal(headers['x-goog-api-key'], 'test-placeholder-not-a-secret');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  test('falls back when Gemini generateContent fails', async () => {
    process.env.GEMINI_API_KEY = 'test-placeholder-not-a-secret';
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXUS_TRANSLATE_URL;
    const origFetch = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response('nope', { status: 503 });
      }
      if (url.includes('mymemory.translated.net')) {
        return new Response(
          JSON.stringify({
            responseStatus: 200,
            responseData: { translatedText: '这是回退译文，用于验证备用通道。' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('no', { status: 500 });
    }) as typeof fetch;
    try {
      const out = await translateText('A distinct fallback probe about agentic silicon chips.', 'en', 'zh');
      assert.match(out, /回退译文/);
      assert.ok(urls[0]?.includes('generativelanguage.googleapis.com'));
      assert.ok(urls.some((u) => u.includes('mymemory.translated.net')));
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
