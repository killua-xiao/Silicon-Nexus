/**
 * Lightweight translation for wire digests.
 * Prefer Gemini (GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY) when present,
 * then NEXUS_TRANSLATE_URL (LibreTranslate-compatible) or OPENAI_API_KEY;
 * falls back to MyMemory / optional google-translate-api-x for short digests.
 */

const GEMINI_GENERATE_CONTENT_HOST = 'generativelanguage.googleapis.com';
const DEFAULT_GEMINI_TRANSLATE_MODEL = 'gemini-3.8-flash';
const GEMINI_CHUNK_CHARS = 8000;
const GEMINI_TIMEOUT_MS = 20000;

export function geminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim();
}

/** Official Gemini Flash model, overridable. Shared NEXUS_TRANSLATE_MODEL is used only if it is a gemini-* id. */
export function geminiTranslateModel(): string {
  const specific = (process.env.GEMINI_TRANSLATE_MODEL || '').trim();
  if (specific) return specific;
  const shared = (process.env.NEXUS_TRANSLATE_MODEL || '').trim();
  if (/^gemini[-/]/i.test(shared)) return shared.replace(/^models\//i, '');
  return DEFAULT_GEMINI_TRANSLATE_MODEL;
}

function hasReadyTranslationKey(): boolean {
  return Boolean(
    geminiApiKey() || process.env.OPENAI_API_KEY || process.env.NEXUS_TRANSLATE_URL
  );
}

export type TranslateLang = 'en' | 'zh';

type CacheKey = string;
const cache = new Map<CacheKey, string>();

function cacheKey(text: string, from: TranslateLang, to: TranslateLang): CacheKey {
  return `${from}|${to}|${text}`;
}

function looksLikeTargetLang(text: string, to: TranslateLang): boolean {
  const zh = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  if (to === 'zh') return zh >= Math.max(3, en * 0.35);
  return en >= Math.max(8, zh * 0.6);
}

function chunkText(text: string, max = 450): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= max) return [trimmed];
  const parts: string[] = [];
  let buf = '';
  for (const para of trimmed.split(/\n+/)) {
    if (!para.trim()) continue;
    if ((buf + '\n' + para).length > max && buf) {
      parts.push(buf);
      buf = para;
    } else {
      buf = buf ? `${buf}\n${para}` : para;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function extractGeminiText(data: unknown): string | null {
  const candidates = (data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  }).candidates;
  const parts = candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text as string)
    .join('')
    .trim();
  return text || null;
}

async function viaGemini(text: string, from: TranslateLang, to: TranslateLang): Promise<string | null> {
  const key = geminiApiKey();
  if (!key) return null;
  const model = geminiTranslateModel();
  const toLabel = to === 'zh' ? 'Simplified Chinese' : 'English';
  const fromLabel = from === 'zh' ? 'Simplified Chinese' : 'English';
  const url = `https://${GEMINI_GENERATE_CONTENT_HOST}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              `Translate the following ${fromLabel} tech/long-form news digest into ${toLabel}. ` +
              'Keep markdown links, code spans, and established proper nouns. Return only the translation.',
          },
        ],
      },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        thinkingConfig: { thinkingLevel: 'low' },
      },
    }),
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  return extractGeminiText(data);
}

async function viaLibreTranslate(text: string, from: TranslateLang, to: TranslateLang): Promise<string | null> {
  const base = (process.env.NEXUS_TRANSLATE_URL || '').replace(/\/$/, '');
  if (!base) return null;
  const source = from === 'zh' ? 'zh' : 'en';
  const target = to === 'zh' ? 'zh' : 'en';
  const res = await fetch(`${base}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text',
      api_key: process.env.NEXUS_TRANSLATE_API_KEY || undefined,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { translatedText?: string };
  return data.translatedText?.trim() || null;
}

async function viaOpenAI(text: string, from: TranslateLang, to: TranslateLang): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.NEXUS_TRANSLATE_MODEL || 'gpt-4o-mini';
  const toLabel = to === 'zh' ? 'Simplified Chinese' : 'English';
  const fromLabel = from === 'zh' ? 'Simplified Chinese' : 'English';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You translate ${fromLabel} tech news digests into ${toLabel}. Keep markdown links and code spans. Return only the translation.`,
        },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

async function viaMyMemory(text: string, from: TranslateLang, to: TranslateLang): Promise<string | null> {
  const langpair = `${from === 'zh' ? 'zh-CN' : 'en'}|${to === 'zh' ? 'zh-CN' : 'en'}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SiliconNexusWireBot/1.0 (+https://silinex.xyz)' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  if (data.responseStatus && data.responseStatus !== 200) return null;
  const out = data.responseData?.translatedText?.trim();
  if (!out || /MYMEMORY WARNING/i.test(out)) return null;
  return out;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function viaGoogleTranslateX(text: string, from: TranslateLang, to: TranslateLang): Promise<string | null> {
  // Disabled unless explicitly enabled — Google endpoints often hang on this host.
  if (process.env.NEXUS_TRANSLATE_GOOGLE !== '1') return null;
  try {
    const mod = await import('google-translate-api-x');
    const translate = mod.default || (mod as { translate?: typeof mod.default }).translate;
    if (!translate) return null;
    const res = await withTimeout(
      translate(text, {
        from: from === 'zh' ? 'zh-CN' : 'en',
        to: to === 'zh' ? 'zh-CN' : 'en',
      }),
      4000
    );
    if (!res) return null;
    const out = (res as { text?: string }).text?.trim();
    return out || null;
  } catch {
    return null;
  }
}

async function translateChunk(text: string, from: TranslateLang, to: TranslateLang): Promise<string> {
  const key = cacheKey(text, from, to);
  const hit = cache.get(key);
  if (hit) return hit;

  const providers = geminiApiKey()
    ? [viaGemini, viaLibreTranslate, viaOpenAI, viaMyMemory, viaGoogleTranslateX]
    : [viaLibreTranslate, viaOpenAI, viaMyMemory, viaGoogleTranslateX];
  for (const provider of providers) {
    try {
      const timeoutMs = provider === viaGemini ? GEMINI_TIMEOUT_MS : 6000;
      const out = await withTimeout(provider(text, from, to), timeoutMs);
      if (out && looksLikeTargetLang(out, to)) {
        cache.set(key, out);
        return out;
      }
    } catch {
      /* try next */
    }
  }
  // Do not cache failures — providers may recover (quota / network).
  return text;
}

export async function translateText(
  text: string,
  from: TranslateLang,
  to: TranslateLang
): Promise<string> {
  if (!text.trim() || from === to) return text;
  const chunks = chunkText(text, geminiApiKey() ? GEMINI_CHUNK_CHARS : 450);
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk, from, to));
    await new Promise((r) => setTimeout(r, 120));
  }
  return out.join('\n\n');
}

let channelReady: boolean | null = null;

/** Fast probe so callers can skip expensive bilingual passes when quota/network is down. */
export async function translationChannelReady(): Promise<boolean> {
  if (hasReadyTranslationKey()) {
    channelReady = true;
    return true;
  }
  if (channelReady != null) return channelReady;
  const sample = 'Silicon News Wire published a short technology brief.';
  const out = await translateText(sample, 'en', 'zh');
  channelReady = !translationLooksFailed(sample, out, 'zh');
  return channelReady;
}

export async function translateLines(
  lines: string[],
  from: TranslateLang,
  to: TranslateLang
): Promise<string[]> {
  if (!(await translationChannelReady())) {
    return lines.slice();
  }
  const out: string[] = [];
  for (const line of lines) {
    out.push(await translateText(line, from, to));
  }
  return out;
}

/** True when translated text still looks like the source language. */
export function translationLooksFailed(
  source: string,
  translated: string,
  to: TranslateLang
): boolean {
  if (!translated.trim()) return true;
  if (source.trim() === translated.trim()) return true;
  return !looksLikeTargetLang(translated, to);
}
