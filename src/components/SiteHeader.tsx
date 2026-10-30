import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Hexagon, Menu, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export function BrandMark({ className }: { className?: string }) {
  return (
    <a href="/" className={cn('group inline-flex items-center gap-2', className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded border border-accent/30 bg-foundry-900">
        <Hexagon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight text-foundry-100">
        Silicon Nexus
      </span>
    </a>
  );
}

const publicLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded px-2.5 py-1 text-[13px] text-foundry-400 transition hover:bg-white/5 hover:text-foundry-100',
    isActive && 'bg-accent/10 text-accent'
  );

export function SiteHeader({ compact }: { compact?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/connect', label: t.nav.mcpApi },
    { to: '/feed', label: t.nav.observation },
    { to: '/about', label: t.nav.about },
    { to: '/cookbook', label: t.cookbook.nav },
    { to: '/docs', label: t.nav.docs },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-white/[0.06] px-5 py-2 md:px-8',
        compact ? 'bg-foundry-950' : 'bg-foundry-950/95 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-10 max-w-6xl items-center justify-between gap-4">
        <BrandMark />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={publicLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link to="/console" className="nx-btn nx-btn-primary px-2.5 py-1 text-[13px]">
            {t.nav.openConsole}
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-foundry-200 lg:hidden"
            aria-expanded={open}
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mt-2 grid gap-0.5 border-t border-white/5 pt-2 lg:hidden">
          <div className="mb-1 sm:hidden">
            <LanguageSwitcher />
          </div>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={publicLinkClass}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
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
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-foundry-950 px-4 py-2 md:px-6">
      <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <nav className="hidden items-center gap-0.5 text-[13px] md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={consoleLinkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex" />
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
        <nav className="mt-2 grid gap-0.5 border-t border-white/5 pt-2 md:hidden">
          <div className="mb-1 sm:hidden">
            <LanguageSwitcher />
          </div>
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
    </header>
  );
}
