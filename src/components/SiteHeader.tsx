import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { useI18n, useT } from '../i18n/I18nProvider';
import {
  chromeCopy,
  chromeNavKeyFromPath,
  PRIMARY_NAV,
  primaryNavLabel,
} from '../chrome/siteChrome';

function localePath(path: string, locale: 'zh' | 'en'): string {
  if (locale !== 'zh') return path;
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}lang=zh`;
}

export function BrandMark() {
  const { locale } = useI18n();
  const c = chromeCopy(locale);
  return (
    <a className="brand" href={localePath('/', locale)}>
      <strong>{c.product}</strong>
      <span>{c.builtFor}</span>
    </a>
  );
}

export function SiteHeader() {
  const { locale, setLocale } = useI18n();
  const location = useLocation();
  const c = chromeCopy(locale);
  const active = chromeNavKeyFromPath(location.pathname);

  return (
    <header className="site-header">
      <div className="wrap">
        <BrandMark />
        <nav className="primary" aria-label="Primary">
          {PRIMARY_NAV.map((item) => {
            const label = primaryNavLabel(item.key, c);
            const current = item.key === active;
            if (item.href === '/') {
              return (
                <a
                  key={item.key}
                  href={localePath('/', locale)}
                  aria-current={current ? 'page' : undefined}
                >
                  {label}
                </a>
              );
            }
            return (
              <NavLink
                key={item.key}
                to={localePath(item.href, locale)}
                aria-current={current ? 'page' : undefined}
              >
                {label}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setLocale(c.langOtherCode)}
            aria-label={c.langOther}
          >
            {c.langOther}
          </button>
        </nav>
      </div>
    </header>
  );
}

const consoleLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded px-2.5 py-1 text-[13px] text-foundry-400 transition hover:bg-white/5 hover:text-foundry-100',
    isActive && 'bg-accent/10 text-accent'
  );

export function ConsoleNav({
  connected,
  workerOnline,
  isAdmin,
  onLock,
}: {
  connected: boolean;
  workerOnline?: boolean;
  isAdmin?: boolean;
  onLock: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/console', label: t.nav.overview, end: true },
    { to: '/console/agents', label: t.nav.agents },
    { to: '/console/feed', label: t.nav.feed },
    { to: '/console/sites', label: t.nav.sites },
    { to: '/console/account', label: t.nav.account },
    ...(isAdmin ? [{ to: '/console/admin', label: t.nav.admin }] : []),
    { to: '/docs', label: t.nav.api },
  ];

  return (
    <div className="border-b border-white/[0.06] bg-foundry-950">
      <div className="wrap-console flex min-h-10 items-center justify-between gap-3 py-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-foundry-500 md:hidden">
          {t.nav.console}
        </p>
        <nav className="hidden items-center gap-0.5 text-[13px] md:flex" aria-label={t.nav.console}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={consoleLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={cn(
              'hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider sm:inline-flex',
              connected ? 'text-ok' : 'text-copper'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-ok' : 'bg-copper')} />
            {connected ? t.nav.linked : t.nav.awaitingKey}
          </span>
          {workerOnline != null ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider',
                workerOnline ? 'text-ok' : 'text-copper'
              )}
              title={workerOnline ? t.tasks.workerOnline : t.tasks.workerOffline}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', workerOnline ? 'bg-ok' : 'bg-copper')}
              />
              <span className="hidden sm:inline">
                {workerOnline ? t.nav.workerOn : t.nav.workerOff}
              </span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={onLock}
            className="rounded border border-white/10 px-2.5 py-1 text-xs text-foundry-300 hover:border-white/20 hover:text-foundry-100"
          >
            {t.nav.lock}
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-foundry-200 md:hidden"
            aria-expanded={open}
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="wrap-console grid gap-0.5 border-t border-white/5 py-2 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={consoleLinkClass}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
