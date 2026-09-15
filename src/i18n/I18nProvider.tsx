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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const stored = typeof window !== 'undefined' ? readStoredLocale() : null;
  const [locale, setLocaleState] = useState<Locale>(stored || 'en');
  const [ready, setReady] = useState(!!stored);
  const [country, setCountry] = useState<string | null>(null);
  const [manual, setManual] = useState(!!stored);

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
