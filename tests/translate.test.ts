import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import {
  geminiApiBase,
  geminiApiKey,
  geminiGatewayToken,
  geminiTranslateModel,
  translateText,
  translationChannelReady,
} from '../src/server/translate.ts';

const ENV_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GEMINI_TRANSLATE_MODEL',
  'GEMINI_API_BASE',
  'CF_AIG_TOKEN',
  'GEMINI_GATEWAY_TOKEN',
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

  test('defaults Gemini API base to Google and strips a trailing slash', () => {
    delete process.env.GEMINI_API_BASE;
    assert.equal(geminiApiBase(), 'https://generativelanguage.googleapis.com');
    process.env.GEMINI_API_BASE = '  https://gateway.ai.cloudflare.com/v1/example-account/example-gateway/google-ai-studio/  ';
    assert.equal(
      geminiApiBase(),
      'https://gateway.ai.cloudflare.com/v1/example-account/example-gateway/google-ai-studio'
    );
  });

  test('prefers CF_AIG_TOKEN over GEMINI_GATEWAY_TOKEN and trims both', () => {
    delete process.env.CF_AIG_TOKEN;
    delete process.env.GEMINI_GATEWAY_TOKEN;
    assert.equal(geminiGatewayToken(), '');
    process.env.GEMINI_GATEWAY_TOKEN = '  alias-placeholder  ';
    assert.equal(geminiGatewayToken(), 'alias-placeholder');
    process.env.CF_AIG_TOKEN = '  primary-gateway-placeholder  ';
    assert.equal(geminiGatewayToken(), 'primary-gateway-placeholder');
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
    delete process.env.GEMINI_API_BASE;
    delete process.env.CF_AIG_TOKEN;
    delete process.env.GEMINI_GATEWAY_TOKEN;
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
      assert.equal(headers['cf-aig-authorization'], undefined);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  test('routes generateContent through GEMINI_API_BASE and sends cf-aig-authorization', async () => {
    process.env.GEMINI_API_KEY = 'test-placeholder-not-a-secret';
    process.env.GEMINI_API_BASE =
      'https://gateway.ai.cloudflare.com/v1/example-account/example-gateway/google-ai-studio/';
    process.env.CF_AIG_TOKEN = 'test-gateway-token-placeholder';
    delete process.env.GEMINI_GATEWAY_TOKEN;
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXUS_TRANSLATE_URL;
    const origFetch = globalThis.fetch;
    const calls: Array<{ url: string; headers: HeadersInit | undefined }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, headers: init?.headers });
      if (url.includes('gateway.ai.cloudflare.com') && url.includes(':generateContent')) {
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '网关探针译文，用于验证自定义基址。' }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('unexpected provider', { status: 500 });
    }) as typeof fetch;
    try {
      const out = await translateText(
        'Silicon News Wire published a unique Cloudflare gateway probe brief.',
        'en',
        'zh'
      );
      assert.match(out, /网关探针译文/);
      assert.equal(calls.length, 1);
      assert.equal(
        calls[0].url,
        'https://gateway.ai.cloudflare.com/v1/example-account/example-gateway/google-ai-studio/v1beta/models/gemini-3.8-flash:generateContent'
      );
      const headers = calls[0].headers as Record<string, string>;
      assert.equal(headers['x-goog-api-key'], 'test-placeholder-not-a-secret');
      assert.equal(headers['cf-aig-authorization'], 'Bearer test-gateway-token-placeholder');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  test('falls back when Gemini generateContent fails', async () => {
    process.env.GEMINI_API_KEY = 'test-placeholder-not-a-secret';
    delete process.env.GEMINI_API_BASE;
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
