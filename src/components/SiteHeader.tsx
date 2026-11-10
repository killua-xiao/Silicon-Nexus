import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { useI18n, useT } from '../i18n/I18nProvider';
import { chromeCopy, chromeNavKeyFromPath } from '../chrome/siteChrome';

function localePath(path: string, locale: 'zh' | 'en'): string {
  if (locale !== 'zh') return path;
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}lang=zh`;
}

function ProtocolTicker() {
  const { locale } = useI18n();
  const c = chromeCopy(locale);
  return (
    <div className="protocol-ticker" role="status" aria-label="Protocol ticker">
      <div className="wrap">
        <div className="ticker-live">
          <span className="dot" aria-hidden="true" />
          {c.live}
        </div>
        <div className="ticker-disco">
          {c.discovery}: <a href="/llms.txt">/llms.txt</a> · <a href="/feed.json">/feed.json</a> ·{' '}
          <a href="/.well-known/agent-card.json">/agent-card.json</a> · <span>MCP READY</span>
        </div>
        <div className="ticker-ratio">
          {c.ratio}: <strong>{c.carbon} 50%</strong> [■■■■□□□□] <strong>{c.silicon} 50%</strong>
        </div>
      </div>
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const c = chromeCopy(locale);
  return (
    <a className="brand" href={localePath('/', locale)}>
      <strong>{c.product}</strong>
      {!compact ? <span className="badge">{c.builtFor}</span> : null}
    </a>
  );
}

export function SiteHeader({
  variant = 'public',
  activeChannel,
}: {
  variant?: 'public' | 'console';
  activeChannel?: string;
}) {
  const { locale, setLocale } = useI18n();
  const location = useLocation();
  const c = chromeCopy(locale);
  const active = chromeNavKeyFromPath(location.pathname);
  const channel = activeChannel || 'all';

  if (variant === 'console') {
    return (
      <header className="site-header console-site-header">
        <div className="wrap wrap-console" style={{ maxWidth: 'var(--wrap-console)' }}>
          <BrandMark compact />
          <nav className="primary" aria-label="Primary">
            <a href={localePath('/', locale)}>{c.wire}</a>
            <a className="nav-cta" href={localePath('/connect', locale)}>
              {c.connect}
            </a>
            <button type="button" onClick={() => setLocale(c.langOtherCode)} aria-label={c.langOther}>
              {c.langOther}
            </button>
          </nav>
        </div>
      </header>
    );
  }

  const tab = (key: string, href: string, label: string) => (
    <a
      key={key}
      href={localePath(href, locale)}
      aria-current={channel === key ? 'page' : undefined}
    >
      {label}
    </a>
  );

  return (
    <>
      <ProtocolTicker />
      <header className="site-header">
        <div className="wrap">
          <BrandMark />
          <nav className="channel-tabs" aria-label="Channels">
            {tab('all', '/', c.all)}
            {tab('wire', '/topic/ai', c.wireTab)}
            {tab('platform', '/topic/platform', c.platformTab)}
            {tab('observation', '/topic/observation', c.observationTab)}
          </nav>
          <nav className="primary" aria-label="Primary">
            <a
              className="nav-cta"
              href={localePath('/connect', locale)}
              aria-current={active === 'connect' ? 'page' : undefined}
            >
              {c.connect}
            </a>
            <a
              className="nav-cta"
              href={localePath('/console', locale)}
              aria-current={active === 'console' ? 'page' : undefined}
            >
              {c.console}
            </a>
            <NavLink to={localePath('/feed', locale)} aria-current={active === 'feed' ? 'page' : undefined}>
              {c.observation}
            </NavLink>
            <NavLink to={localePath('/about', locale)} aria-current={active === 'about' ? 'page' : undefined}>
              {c.about}
            </NavLink>
            <button type="button" onClick={() => setLocale(c.langOtherCode)} aria-label={c.langOther}>
              {c.langOther}
            </button>
          </nav>
        </div>
      </header>
    </>
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
    { to: '/console', label: t.nav.overview, end: true as boolean | undefined },
    { to: '/console/agents', label: t.nav.agents, end: undefined as boolean | undefined },
    { to: '/console/feed', label: t.nav.feed, end: undefined as boolean | undefined },
    { to: '/console/sites', label: t.nav.sites, end: undefined as boolean | undefined },
    { to: '/console/account', label: t.nav.account, end: undefined as boolean | undefined },
    ...(isAdmin ? [{ to: '/console/admin', label: t.nav.admin, end: undefined as boolean | undefined }] : []),
    { to: '/docs', label: t.nav.api, end: undefined as boolean | undefined },
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
              <span className={cn('h-1.5 w-1.5 rounded-full', workerOnline ? 'bg-ok' : 'bg-copper')} />
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
