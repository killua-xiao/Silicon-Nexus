import { useI18n } from '../i18n/I18nProvider';
import { cn } from '../lib/cn';
import type { Locale } from '../i18n/messages';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, messages } = useI18n();

  const btn = (code: Locale, label: string) => (
    <button
      type="button"
      key={code}
      onClick={() => setLocale(code)}
      className={cn(
        'rounded px-2 py-1 text-[11px] font-medium transition',
        locale === code
          ? 'bg-teal-glow/20 text-teal-glow'
          : 'text-foundry-500 hover:text-foundry-200'
      )}
      aria-pressed={locale === code}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        'inline-flex items-center rounded border border-white/10 bg-foundry-950/60 p-0.5',
        className
      )}
      role="group"
      aria-label="Language"
    >
      {btn('zh', messages.nav.langZh)}
      {btn('en', messages.nav.langEn)}
    </div>
  );
}
