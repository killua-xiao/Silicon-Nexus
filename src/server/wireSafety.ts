/**
 * Wire ingest safety — allow only curated desks; reject politics / sensitive topics.
 * Keyword lists are defensive filters for digests (title + summary), not legal advice.
 */

export type SafetyVerdict =
  | { ok: true }
  | { ok: false; reason: 'politics' | 'sensitive' | 'off_topic' | 'source' | 'domain' };

/** Hostnames permitted for a desk (item.link must match). */
export function hostAllowed(link: string, allowedHosts: string[]): boolean {
  try {
    const host = new URL(link).hostname.toLowerCase().replace(/^www\./, '');
    return allowedHosts.some((allowed) => {
      const a = allowed.toLowerCase().replace(/^www\./, '');
      return host === a || host.endsWith(`.${a}`);
    });
  } catch {
    return false;
  }
}

/**
 * Politics / governance / conflict — out of scope for Silicon News Wire.
 */
const POLITICS_PATTERNS: RegExp[] = [
  // EN
  /\belection\b/i,
  /\bvote[sd]?\b/i,
  /\bcampaign trail\b/i,
  /\bcongress\b/i,
  /\bparliament\b/i,
  /\bsenate\b/i,
  /\bwhite house\b/i,
  /\bpresident\b/i,
  /\bprime minister\b/i,
  /\bdiplomacy\b|\bdiplomat\b/i,
  /\bsanction(s|ed)?\b/i,
  /\bgeopolitic/i,
  /\bmilitary\b|\bwarfare\b|\barmed forces\b/i,
  /\binvasion\b|\bmissile\b|\bartillery\b/i,
  /\bprotest(s|ers)?\b|\briots?\b/i,
  /\btrump\b|\bbiden\b|\bputin\b/i,
  /\btaiwan strait\b|\bxinjiang\b|\btibet\b/i,
  /\bhamas\b|\bisrael[- ]palestine\b|\bukraine war\b/i,
  // ZH
  /政治/,
  /选举|选战|议员|议会|人大代表|两会|政协/,
  /外交|制裁|关税战|贸易战/,
  /军事|战争|开战|导弹|军队|军演/,
  /游行|示威|抗议/,
  /台海|新疆|西藏|香港独立|台独|藏独|疆独/,
  /总统|首相|总书记|国家主席|内阁/,
  /中美对抗|中美博弈|冷战/,
];

/** Adult, crime, scams, privacy leaks, self-harm, extremism, etc. */
const SENSITIVE_PATTERNS: RegExp[] = [
  // EN
  /\bnsfw\b|\bporn\b|\bxxx\b|\berotic\b/i,
  /\b enticement\b|\bgrooming\b/i,
  /\bsuicide\b|\bself[- ]harm\b/i,
  /\bterroris[mt]\b|\bextremis[mt]\b/i,
  /\bdrug cartel\b|\bcocaine\b|\bmethamphetamine\b/i,
  /\bmurder\b|\bmass shooting\b|\bbeheading\b/i,
  /\bchild abuse\b|\bcsam\b|\bchild porn/i,
  /\bleaked password\b|\bleaked credentials\b|\bssn leak\b/i,
  /\bcredit card dump\b|\bransomware victim list\b/i,
  /\bhow to make a bomb\b|\bpipe bomb\b/i,
  /\bphishing kit\b/i,
  // ZH
  /色情|黄片|成人影片|约炮/,
  /自杀|自残/,
  /恐怖袭击|极端组织/,
  /毒品|冰毒|吸毒/,
  /杀人案|血腥|斩首/,
  /儿童色情|未成年人色情/,
  /密码泄露|身份证号泄露|开房记录/,
  /制爆|爆炸物制作/,
  /诈骗受害人名单|钓鱼工具包/,
  /赌博平台|博彩/,
];

function blobOf(title: string, summary: string): string {
  return `${title}\n${summary}`.trim();
}

export function isPoliticalDigest(title: string, summary: string): boolean {
  return POLITICS_PATTERNS.some((p) => p.test(blobOf(title, summary)));
}

export function isSensitiveDigest(title: string, summary: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(blobOf(title, summary)));
}

export function evaluateWireSafety(input: {
  title: string;
  summary: string;
  link: string;
  allowedHosts: string[];
  topical: boolean;
}): SafetyVerdict {
  if (!input.allowedHosts.length) return { ok: false, reason: 'source' };
  if (!hostAllowed(input.link, input.allowedHosts)) return { ok: false, reason: 'domain' };
  if (!input.title.trim()) return { ok: false, reason: 'off_topic' };
  if (!input.topical) return { ok: false, reason: 'off_topic' };
  if (isPoliticalDigest(input.title, input.summary)) return { ok: false, reason: 'politics' };
  if (isSensitiveDigest(input.title, input.summary)) return { ok: false, reason: 'sensitive' };
  return { ok: true };
}
