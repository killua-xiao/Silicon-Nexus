import type { Request } from 'express';
import geoip from 'geoip-lite';
import { CHINESE_REGION_COUNTRIES, type Locale } from '../i18n/messages.ts';

function headerCountry(req: Request): string | null {
  const candidates = [
    req.headers['cf-ipcountry'],
    req.headers['cloudfront-viewer-country'],
    req.headers['x-vercel-ip-country'],
    req.headers['x-country-code'],
  ];
  for (const raw of candidates) {
    const v = String(Array.isArray(raw) ? raw[0] : raw || '')
      .trim()
      .toUpperCase();
    if (v && v !== 'XX' && v !== 'T1') return v;
  }
  return null;
}

function clientIp(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) {
    return xf.split(',')[0].trim();
  }
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(',')[0].trim();
  return (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, '');
}

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  const m = /^172\.(\d+)\./.exec(ip);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

function acceptLanguagePrefersZh(header: string | undefined): boolean {
  if (!header) return false;
  const parts = header.toLowerCase().split(',');
  for (const part of parts) {
    const tag = part.split(';')[0].trim();
    if (tag.startsWith('zh')) return true;
  }
  return false;
}

export function resolveLocaleFromRequest(req: Request): {
  locale: Locale;
  country: string | null;
  source: 'geo' | 'accept-language' | 'default';
} {
  const fromHeader = headerCountry(req);
  if (fromHeader) {
    return {
      locale: CHINESE_REGION_COUNTRIES.has(fromHeader) ? 'zh' : 'en',
      country: fromHeader,
      source: 'geo',
    };
  }

  const ip = clientIp(req);
  if (!isPrivateIp(ip)) {
    const lookup = geoip.lookup(ip);
    const country = lookup?.country || null;
    if (country) {
      return {
        locale: CHINESE_REGION_COUNTRIES.has(country) ? 'zh' : 'en',
        country,
        source: 'geo',
      };
    }
  }

  if (acceptLanguagePrefersZh(req.headers['accept-language'])) {
    return { locale: 'zh', country: fromHeader, source: 'accept-language' };
  }

  return { locale: 'en', country: fromHeader, source: 'default' };
}
