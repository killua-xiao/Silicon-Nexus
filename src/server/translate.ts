/**
 * Lightweight translation for wire digests.
 * Prefer NEXUS_TRANSLATE_URL (LibreTranslate-compatible) or OPENAI_API_KEY;
 * falls back to MyMemory / optional google-translate-api-x for short digests.
 */

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

  const providers = [viaLibreTranslate, viaOpenAI, viaMyMemory, viaGoogleTranslateX];
  for (const provider of providers) {
    try {
      const out = await withTimeout(provider(text, from, to), 6000);
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
  const chunks = chunkText(text);
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
  if (channelReady != null) return channelReady;
  if (process.env.OPENAI_API_KEY || process.env.NEXUS_TRANSLATE_URL) {
    channelReady = true;
    return true;
  }
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
