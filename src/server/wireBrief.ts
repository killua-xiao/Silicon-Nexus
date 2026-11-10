/**
 * Copyright-aware wire briefs: original editorial rewrite, not verbatim reprint.
 * Uses RSS/public notes + optional soft page extract as source material only.
 */
import {
  translateLines,
  translateText,
  translationChannelReady,
  translationLooksFailed,
  type TranslateLang,
} from './translate.ts';

const MAX_SOURCE_CHARS = 3600;
const MAX_EXTRACT_CHARS = 2600;
const MAX_BRIEF_CHARS = 3200;

const CHROME_RE =
  /首页|IT圈|最会买|日夜间|随系统|主题色|投稿|RSS订阅|软媒|要知App|软媒魔方|责编|线索投递|评论：|收藏|客户端|Win10|Win11|cookie|subscribe|sign[\s-]?in|newsletter|related articles|share this|广告|注册登录|设置\s*日夜间|搜索\s*首页|资讯\s*智能车|智库\s*活动|MEET大会|AIGC|扫码关注|量子位的朋友们|软媒应用|业界\s*手机\s*电脑|专题\s*搜索/i;

function normalizeSpace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCharCode(Number(n));
      } catch {
        return ' ';
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      try {
        return String.fromCharCode(parseInt(h, 16));
      } catch {
        return ' ';
      }
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;|&mdash;/g, '—')
    .replace(/&hellip;/g, '…');
}

function stripTags(html: string): string {
  return normalizeSpace(
    decodeEntities(
      html
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<header[\s\S]*?<\/header>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

function metaDescription(html: string): string {
  const og =
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ||
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i.exec(html)?.[1];
  const plain =
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ||
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i.exec(html)?.[1];
  return normalizeSpace(decodeEntities(og || plain || ''));
}

function pickContentHtml(html: string): string {
  const patterns = [
    /<article[\s\S]*?<\/article>/i,
    /<(?:div|section)[^>]*(?:article-content|post-content|entry-content|articleBody|post_body|content-article|article__content)[^>]*>[\s\S]*?<\/(?:div|section)>/i,
    /<main[\s\S]*?<\/main>/i,
  ];
  for (const re of patterns) {
    const hit = re.exec(html)?.[0];
    if (hit && stripTags(hit).length > 180) return hit;
  }
  return html;
}

function isChromeChunk(s: string): boolean {
  if (!s || s.length < 18) return true;
  if (CHROME_RE.test(s)) return true;
  if (/来源：\s*\S+\s*$/u.test(s) && s.length < 40) return true;
  if (/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s) && s.length < 80) return true;
  const shortTokens = (s.match(/[\u4e00-\u9fff]{1,2}/g) || []).length;
  const punct = (s.match(/[。！？.!?；;]/g) || []).length;
  if (shortTokens > 14 && punct === 0 && s.length > 36) return true;
  if ((s.match(/\//g) || []).length >= 4 && punct === 0) return true;
  return false;
}

function isSubstantiveSentence(s: string): boolean {
  if (isChromeChunk(s)) return false;
  if (s.length < 22 || s.length > 480) return false;
  if (/^https?:\/\//i.test(s)) return false;
  if (/^[\[\(（]/.test(s) && s.length < 40) return false;
  const letters = (s.match(/[A-Za-z\u4e00-\u9fff]/g) || []).length;
  return letters / Math.max(s.length, 1) > 0.45;
}

/** Soft extract — short public text for rewrite input only (never stored raw as body). */
export async function softExtractPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SiliconNexusWireBot/1.0 (+https://silinex.xyz; editorial-brief)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const html = await res.text();
    const meta = metaDescription(html);
    const mainText = stripTags(pickContentHtml(html));
    const lang = detectLang(mainText || meta);
    const sentences = splitSentences(`${meta}\n${mainText}`, lang)
      .map((s) => scrubInlineNoise(s, meta.slice(0, 80)))
      .filter(isSubstantiveSentence)
      .slice(0, 16);
    return sentences.join(lang === 'zh' ? '' : ' ').slice(0, MAX_EXTRACT_CHARS);
  } catch {
    return '';
  }
}

function detectLang(text: string): TranslateLang {
  const zh = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  return zh >= en ? 'zh' : 'en';
}

function scrubInlineNoise(s: string, title = ''): string {
  let out = decodeEntities(s)
    .replace(/综合公开报道[，,]\s*/g, '')
    .replace(/扫码关注\S*/g, ' ')
    .replace(/量子位的朋友们/g, ' ')
    .replace(/[\u4e00-\u9fff]{2,8}\s*发自\s*[^\s，。]{1,16}/g, ' ')
    .replace(/公众号\s*[A-Za-z0-9_\u4e00-\u9fff]+/g, ' ')
    .replace(/量子位\s*\|\s*/g, ' ')
    .replace(/\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}:\d{2}/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, ' ')
    .replace(/来源：\s*\S+/g, ' ')
    .replace(/作者：\s*\S+/g, ' ')
    .replace(/责编：\s*\S+/g, ' ');
  if (title) {
    const bare = title.replace(/[！!？?。.]$/u, '').trim();
    if (bare.length >= 8) {
      out = out.split(bare).join(' ');
      out = out.split(`${bare} – 量子位`).join(' ');
      out = out.split(`${bare} - 量子位`).join(' ');
    }
  }
  return normalizeSpace(out);
}

function splitSentences(text: string, lang: TranslateLang): string[] {
  const normalized = scrubInlineNoise(text);
  const parts =
    lang === 'zh'
      ? normalized.split(/(?<=[。！？；])\s*|\n+/)
      : normalized.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])|\n+/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 8);
}

function polishSentence(s: string, lang: TranslateLang, sourceName: string, title = ''): string {
  let out = scrubInlineNoise(s, title)
    .replace(/^据(?:悉|了解|介绍|报道)[，,]\s*/u, '')
    .replace(/^(?:According to|Reports say|It is reported that)\s+/i, '')
    .replace(new RegExp(`^${escapeReg(sourceName)}\\s*\\d*\\s*[月日]*\\s*消息[，,]?\\s*`, 'u'), '')
    .replace(new RegExp(`${escapeReg(sourceName)}\\s*\\d+\\s*月\\s*\\d+\\s*日消息[，,]?\\s*`, 'gu'), '')
    .replace(/(?:11|12|\d{1,2})月\d{1,2}日，?/g, (m, offset) => (offset === 0 ? m : '同日，'))
    .replace(/\s+/g, ' ')
    .trim();
  // Collapse duplicated date leads like "11月9日，… 11月9日，…"
  out = out.replace(/((?:\d{1,2}月\d{1,2}日)[，,]?)([^。]{8,40}?)\1/u, '$1$2');

  if (lang === 'zh') {
    out = out
      .replace(/今天（\d+）日晚间/g, '近日')
      .replace(/官微今天宣布/g, '官方渠道宣布')
      .replace(/转发有关微博并发文/g, '转发相关动态并表示')
      .replace(/IT之家注：/g, '')
      .replace(/现汇率约合/g, '约合')
      .replace(/该版本推出了/g, '新版本推出了');
  } else {
    out = out
      .replace(/\bannounced today that\b/gi, 'said')
      .replace(/\baccording to reports\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (out) out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Structural editorial rewrite when no LLM is available:
 * reframe lead, regroup facts, keep readable length without pasting chrome.
 */
function heuristicParaphrase(
  sentences: string[],
  lang: TranslateLang,
  sourceName: string,
  title = ''
): string[] {
  const cleaned = sentences
    .map((s) => polishSentence(s, lang, sourceName, title))
    .filter(isSubstantiveSentence)
    .filter((s) => {
      if (!title) return true;
      const bare = title.replace(/[！!？?。.]$/u, '').trim();
      // Drop near-title-only crumbs
      return !(bare && s.length < bare.length + 18 && s.includes(bare.slice(0, 12)));
    })
    .filter((s, i, arr) => arr.findIndex((x) => x.slice(0, 36) === s.slice(0, 36)) === i)
    .slice(0, 12);

  if (!cleaned.length) return [];

  if (lang === 'zh') {
    const lead = `综合 ${sourceName} 等公开报道整理：${cleaned[0]}`;
    const context = cleaned.slice(1, 4);
    const detail = cleaned.slice(4, 8);
    const close = cleaned.slice(8, 11);
    const paras = [
      lead,
      context.length ? `事件脉络方面，${context.join('')}` : '',
      detail.length ? `公开信息还提到：${detail.join('')}` : '',
      close.length
        ? `后续观察点包括：${close.join('')} Silicon News Wire 仅做要点改写，细节仍以原文为准。`
        : 'Silicon News Wire 仅做要点改写与润色，完整表述与上下文以原文页面为准。',
    ];
    return paras.map((p) => p.trim()).filter((p) => p.length > 24);
  }

  const leadCore = cleaned[0];
  const lead = `According to public reporting via ${sourceName}, ${leadCore.charAt(0).toLowerCase()}${leadCore.slice(1)}`;
  const context = cleaned.slice(1, 4).join(' ');
  const detail = cleaned.slice(4, 8).join(' ');
  const close = cleaned.slice(8, 11).join(' ');
  const paras = [
    lead,
    context ? `In related context, ${context.charAt(0).toLowerCase()}${context.slice(1)}` : '',
    detail ? `Reporting also notes that ${detail.charAt(0).toLowerCase()}${detail.slice(1)}` : '',
    close
      ? `Points still worth watching: ${close} This Silicon News Wire item is a paraphrased brief; full wording remains on the origin page.`
      : 'This Silicon News Wire item is a paraphrased brief for readability; full wording and context remain on the origin page.',
  ];
  return paras.map((p) => p.trim()).filter((p) => p.length > 24);
}

function packParagraphs(sentences: string[], lang: TranslateLang): string[] {
  if (!sentences.length) {
    return lang === 'zh'
      ? ['本电讯依据公开报道整理要点，细节以原文为准。']
      : ['This brief consolidates publicly reported points; details remain on the origin page.'];
  }
  const paras: string[] = [];
  let buf: string[] = [];
  for (const s of sentences) {
    buf.push(s);
    if (buf.length >= 2) {
      paras.push(buf.join(lang === 'zh' ? '' : ' '));
      buf = [];
    }
  }
  if (buf.length) paras.push(buf.join(lang === 'zh' ? '' : ' '));
  return paras.slice(0, 6);
}

async function llmRewrite(input: {
  title: string;
  notes: string;
  lang: TranslateLang;
  sourceName: string;
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.NEXUS_TRANSLATE_MODEL || 'gpt-4o-mini';
  const langLabel = input.lang === 'zh' ? 'Simplified Chinese' : 'English';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content: `You write Silicon News Wire editorial briefs for ${langLabel}.
Rules:
- Produce ORIGINAL prose (paraphrase). Do NOT copy sentences verbatim from the notes.
- Write a readable 4 to 6 paragraph brief that feels complete for a newsroom skim, not a one-line teaser.
- Newsroom tone, factual, no hype, no politics.
- Do not invent numbers, quotes, or claims absent from the notes.
- Do not include copyrighted long quotations.
- No markdown headings inside the body; plain paragraphs only.
- Do not add a source footer; the caller adds attribution.`,
        },
        {
          role: 'user',
          content: `Title: ${input.title}\nDesk: ${input.sourceName}\nNotes:\n${input.notes.slice(0, MAX_SOURCE_CHARS)}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}

export type WireBrief = {
  summary: string;
  bodyMd: string;
  keyFacts: string[];
};

function scrubNotes(raw: string): string {
  return normalizeSpace(
    decodeEntities(raw)
      .replace(/##[^\n]*/g, ' ')
      .replace(/来源摘录：[\s\S]*?(?=\n|$)/g, ' ')
      .replace(/Digest of \[[^\]]+\]\([^)]+\)[^.。]*[.。]?/gi, ' ')
      .replace(/Read the original:[^\n]*/gi, ' ')
      .replace(/阅读原文：[^\n]*/g, ' ')
      .replace(/Silicon News Wire[^\n]*/gi, ' ')
      .replace(/本电讯由[\s\S]*?原文页面为准。[^\n]*/g, ' ')
      .replace(/This Silicon News Wire brief[\s\S]*?origin page\./gi, ' ')
      .replace(/_?Silicon News Wire[\s\S]*?reprint\.?_?/gi, ' ')
      .replace(CHROME_RE, ' ')
  );
}

function gatherNotes(rssSummary: string, pageExtract: string, title: string): string {
  const rssLang = detectLang(rssSummary || title);
  const rssParts = splitSentences(scrubNotes(rssSummary || title), rssLang)
    .map((s) => scrubInlineNoise(s, title))
    .filter(isSubstantiveSentence);
  const extractParts = splitSentences(scrubNotes(pageExtract || ''), detectLang(pageExtract || title))
    .map((s) => scrubInlineNoise(s, title))
    .filter(isSubstantiveSentence)
    .filter((s) => !rssParts.some((r) => r.includes(s.slice(0, 28)) || s.includes(r.slice(0, 28))));

  const merged = [...rssParts, ...extractParts.slice(0, 8)];
  const joiner = rssLang === 'zh' ? '' : ' ';
  return merged.join(joiner).slice(0, MAX_SOURCE_CHARS);
}

function finalizeParagraph(p: string, sourceName: string, title: string): string {
  let out = scrubInlineNoise(p, title)
    .replace(new RegExp(`\\s*[–—-]\\s*${escapeReg(sourceName)}`, 'g'), '')
    .replace(new RegExp(`${escapeReg(sourceName)}\\s*[|｜]\\s*`, 'g'), '')
    .replace(/^[，,、；;：:\s]+/u, '')
    .replace(/同日，同日，/g, '同日，')
    .replace(/(同日，){2,}/g, '同日，')
    .replace(/([，。；])\1+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Drop leftover fragments that are mostly punctuation after title scrub.
  if (out.length < 18) return '';
  return out;
}

function wrapBriefBody(
  paragraphs: string[],
  lang: TranslateLang,
  sourceName: string,
  title: string,
  link: string
): string {
  const clipped: string[] = [];
  let total = 0;
  for (const raw of paragraphs) {
    const p = finalizeParagraph(raw, sourceName, title);
    if (!p) continue;
    if (total >= MAX_BRIEF_CHARS) break;
    clipped.push(p);
    total += p.length;
  }
  if (!clipped.length) {
    clipped.push(
      lang === 'zh'
        ? `综合 ${sourceName} 公开报道整理要点，细节以原文为准。`
        : `Brief consolidated from public reporting via ${sourceName}; details remain on the origin page.`
    );
  }

  const attribution =
    lang === 'zh'
      ? [
          '## 来源与声明',
          '',
          `本电讯由 Silicon News Wire 依据 **${sourceName}** 公开报道做要点改写与润色，便于碳基阅读与硅基引用；**不是原文全文转载**。`,
          '',
          `阅读原文：[${title}](${link})`,
        ].join('\n')
      : [
          '## Source & notice',
          '',
          `This Silicon News Wire brief paraphrases public reporting from **${sourceName}** for carbon readers and silicon citation. **It is not a verbatim full-text reprint.**`,
          '',
          `Read the original: [${title}](${link})`,
        ].join('\n');

  const lead =
    lang === 'zh'
      ? `## 电讯正文\n\n${clipped.join('\n\n')}`
      : `## Wire brief\n\n${clipped.join('\n\n')}`;

  return `${lead}\n\n${attribution}\n`;
}

function extractBodyParagraphs(bodyMd: string): string[] {
  return bodyMd
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.startsWith('##') &&
        !l.startsWith('阅读原文') &&
        !l.startsWith('Read the original') &&
        !l.startsWith('本电讯由') &&
        !l.startsWith('This Silicon News Wire')
    )
    .filter((l) => !/^\[.+\]\(.+\)$/.test(l));
}

export async function composeWireBrief(input: {
  title: string;
  rssSummary: string;
  sourceName: string;
  link: string;
  lang: TranslateLang;
  pageExtract?: string;
}): Promise<WireBrief> {
  const notes = gatherNotes(input.rssSummary, input.pageExtract || '', input.title);

  const llm = await llmRewrite({
    title: input.title,
    notes: notes || input.title,
    lang: input.lang,
    sourceName: input.sourceName,
  });

  let paragraphs: string[];
  if (llm) {
    paragraphs = llm
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 8);
  } else {
    const noteLang = detectLang(notes || input.title);
    let working = notes || input.title;
    if (noteLang !== input.lang) {
      const translated = await translateText(working.slice(0, 2200), noteLang, input.lang);
      if (!translationLooksFailed(working.slice(0, 2200), translated, input.lang)) {
        working = translated;
      }
    }
    const workingLang = detectLang(working);
    if (detectLang(working) !== input.lang) {
      // Never glue an English scaffold onto Chinese notes (or the reverse).
      paragraphs =
        input.lang === 'zh'
          ? [
              `（翻译通道暂繁忙）本条源语为英文，中文改写稍后补齐；请先阅读英文电讯或原文。`,
              `来源台：${input.sourceName}。`,
            ]
          : [
              `Paraphrased Silicon News Wire brief filed from ${input.sourceName}.`,
              `English rewrite is pending; open the Chinese edition (?lang=zh) for the full editorial brief.`,
              `This English surface keeps citable metadata only — not a bilingual mashup.`,
            ];
    } else {
      const sentences = heuristicParaphrase(
        splitSentences(working, input.lang),
        input.lang,
        input.sourceName,
        input.title
      );
      paragraphs = sentences.length
        ? sentences.slice(0, 6)
        : packParagraphs(splitSentences(working, input.lang), input.lang);
    }
  }

  const summary =
    paragraphs[0].length > 220 ? `${paragraphs[0].slice(0, 217)}…` : paragraphs[0];

  const factSeeds = splitSentences(notes || input.title, detectLang(notes || input.title))
    .filter(isSubstantiveSentence)
    .slice(0, 4);
  const keyFacts =
    factSeeds.length >= 2
      ? factSeeds.slice(0, 4).map((s) => (s.length > 140 ? `${s.slice(0, 137)}…` : s))
      : input.lang === 'zh'
        ? [
            summary,
            `信息来源：${input.sourceName}（公开报道要点改写，非原文转载）。`,
            '完整细节与表述以原文页面为准。',
          ]
        : [
            summary,
            `Source desk: ${input.sourceName}. This is an original brief, not a verbatim reprint.`,
            'Full wording and context remain on the origin page.',
          ];

  return {
    summary,
    bodyMd: wrapBriefBody(paragraphs, input.lang, input.sourceName, input.title, input.link),
    keyFacts,
  };
}

/** Build bilingual briefs from one set of notes. */
export async function composeBilingualBriefs(input: {
  title: string;
  rssSummary: string;
  sourceName: string;
  link: string;
  sourceLang: TranslateLang;
  pageExtract?: string;
}): Promise<{
  headlineEn: string;
  headlineZh: string;
  summaryEn: string;
  summaryZh: string;
  bodyEn: string;
  bodyZh: string;
  factsEn: string[];
  factsZh: string[];
}> {
  const primary = await composeWireBrief({
    title: input.title,
    rssSummary: input.rssSummary,
    sourceName: input.sourceName,
    link: input.link,
    lang: input.sourceLang,
    pageExtract: input.pageExtract,
  });

  const otherLang: TranslateLang = input.sourceLang === 'en' ? 'zh' : 'en';
  const canTranslate = await translationChannelReady();
  const headlineOtherRaw = canTranslate
    ? otherLang === 'zh'
      ? await translateText(input.title, 'en', 'zh')
      : await translateText(input.title, 'zh', 'en')
    : input.title;
  const headlineOther = translationLooksFailed(input.title, headlineOtherRaw, otherLang)
    ? input.title
    : headlineOtherRaw;

  const primaryParas = extractBodyParagraphs(primary.bodyMd);
  const translatedParas = canTranslate
    ? await translateLines(primaryParas, input.sourceLang, otherLang)
    : primaryParas.slice();
  const translationOk =
    canTranslate &&
    translatedParas.every((p, i) => !translationLooksFailed(primaryParas[i] || '', p, otherLang));

  let otherBody: string;
  let otherSummary: string;
  let otherFacts: string[];

  if (translationOk) {
    otherBody = wrapBriefBody(
      translatedParas,
      otherLang,
      input.sourceName,
      otherLang === input.sourceLang ? input.title : headlineOther,
      input.link
    );
    otherSummary =
      translatedParas[0] && translatedParas[0].length > 220
        ? `${translatedParas[0].slice(0, 217)}…`
        : translatedParas[0] || primary.summary;
    otherFacts = await translateLines(primary.keyFacts, input.sourceLang, otherLang);
  } else if (otherLang === 'zh') {
    // EN→ZH unavailable: keep Chinese chrome + short pointer, never paste English as 电讯正文 long-term ideal,
    // but English primary remains authoritative on / and zh readers get a clear bridge.
    const notice =
      '（翻译通道暂繁忙：完整英文电讯见默认英文版；恢复后将自动补中文改写。以下为标题级摘要占位。）';
    otherBody = wrapBriefBody(
      [notice, `原题：${headlineOther}`, `Source desk: ${input.sourceName}`],
      'zh',
      input.sourceName,
      headlineOther,
      input.link
    );
    otherSummary = notice;
    otherFacts = [
      `信息来源：${input.sourceName}`,
      '完整英文电讯见默认英文版（/）。',
      'agent_citable：true',
    ];
  } else {
    // ZH→EN unavailable: NEVER concatenate English scaffolds onto raw Chinese.
    // English surface stays native English stubs; Chinese rewrite stays on ?lang=zh.
    const deskEn = asciiDeskName(input.sourceName);
    const enHeadline = latinSlugTokens(input.title).length
      ? `${titleCaseTokens(latinSlugTokens(input.title))} — brief from ${deskEn}`
      : `Wire brief from ${deskEn}`;
    otherSummary = `Paraphrased Silicon News Wire brief filed from ${deskEn}. Open the Chinese edition (?lang=zh) for the full editorial rewrite.`;
    otherBody = wrapBriefBody(
      [
        otherSummary,
        `Source desk: ${deskEn}. The Chinese paraphrased brief is the reading surface until an English rewrite is available.`,
        'This English record keeps citable metadata only — not a bilingual mashup.',
      ],
      'en',
      input.sourceName,
      enHeadline,
      input.link
    );
    otherFacts = [
      `Source desk: ${deskEn}`,
      'Original filing language: Chinese',
      'Full editorial rewrite: Chinese edition (?lang=zh)',
    ];
    // Prefer the clean English stub headline over raw Chinese title.
    return {
      headlineEn: enHeadline,
      headlineZh: input.title,
      summaryEn: otherSummary,
      summaryZh: primary.summary,
      bodyEn: otherBody,
      bodyZh: primary.bodyMd,
      factsEn: otherFacts,
      factsZh: primary.keyFacts,
    };
  }

  if (input.sourceLang === 'en') {
    return {
      headlineEn: input.title,
      headlineZh: translationOk || otherLang === 'zh' ? headlineOther : input.title,
      summaryEn: primary.summary,
      summaryZh: otherSummary,
      bodyEn: primary.bodyMd,
      bodyZh: otherBody,
      factsEn: primary.keyFacts,
      factsZh: otherFacts,
    };
  }

  return {
    headlineEn: headlineOther,
    headlineZh: input.title,
    summaryEn: otherSummary,
    summaryZh: primary.summary,
    bodyEn: otherBody,
    bodyZh: primary.bodyMd,
    factsEn: otherFacts,
    factsZh: primary.keyFacts,
  };
}

function asciiDeskName(sourceName: string): string {
  const raw = (sourceName || '').trim();
  if (!raw || /[\u4e00-\u9fff]/.test(raw)) {
    if (/it.?home|ithome|it之家/i.test(raw)) return 'IT Home';
    if (/量子位|qbit/i.test(raw)) return 'QbitAI';
    if (/机器之心|synced/i.test(raw)) return 'Synced';
    return 'the source desk';
  }
  return raw;
}

/** Latin / numeric tokens for semantic English slugs from mixed titles. */
export function latinSlugTokens(title: string): string[] {
  return (title.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 0);
}

function titleCaseTokens(tokens: string[]): string {
  return tokens
    .slice(0, 8)
    .map((t) => (t.length <= 3 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1)))
    .join(' ');
}

/** Collapse hyphen runs and trim edges for wire article slugs. */
export function sanitizeWireSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
