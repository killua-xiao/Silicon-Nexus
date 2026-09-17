import type { Locale } from '../i18n/messages';

/** Public SKU list prices. Not a live FX conversion. */
export const PUBLIC_LIST_PRICES = {
  free: { usd: 0, cny: 0 },
  starter: { usd: 19, cny: 138 },
  pro: { usd: 79, cny: 568 },
  business: { usd: 249, cny: 1788 },
} as const;

export function formatListPrice(
  locale: Locale,
  usd: number | null | undefined,
  cny: number | null | undefined
): string | null {
  if (locale === 'zh') {
    if (cny == null) return null;
    if (cny === 0) return null;
    return `¥${cny.toLocaleString('zh-CN')}`;
  }
  if (usd == null) return null;
  if (usd === 0) return null;
  return `$${usd}`;
}
