import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, type Locale, type Messages } from './messages';

const STORAGE_KEY = 'nexus_locale';

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  country: string | null;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'zh' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function readQueryLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const lang = new URLSearchParams(window.location.search).get('lang');
    if (lang === 'zh' || lang === 'en') return lang;
  } catch {
    /* ignore */
  }
  return null;
}

function writeLocaleQuery(next: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (next === 'zh') url.searchParams.set('lang', 'zh');
    else url.searchParams.delete('lang');
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  } catch {
    /* ignore */
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const query = typeof window !== 'undefined' ? readQueryLocale() : null;
  const stored = typeof window !== 'undefined' && !query ? readStoredLocale() : null;
  const [locale, setLocaleState] = useState<Locale>(query || stored || 'en');
  const [ready, setReady] = useState(!!query || !!stored);
  const [country, setCountry] = useState<string | null>(null);
  const [manual, setManual] = useState(!!query || !!stored);

  useEffect(() => {
    if (manual) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/locale');
        const data = (await res.json()) as { locale?: Locale; country?: string | null };
        if (cancelled) return;
        if (data.locale === 'zh' || data.locale === 'en') {
          setLocaleState(data.locale);
        }
        setCountry(data.country ?? null);
      } catch {
        /* keep default */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manual]);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setManual(true);
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    writeLocaleQuery(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      messages: dictionaries[locale],
      ready,
      setLocale,
      country,
    }),
    [locale, ready, setLocale, country]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().messages;
}
