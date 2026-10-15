import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Hexagon, Menu, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-teal-glow/35 bg-foundry-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <Hexagon className="h-4 w-4 text-teal-glow" strokeWidth={1.75} />
        <span className="absolute inset-0 animate-foundry-pulse rounded-xl bg-teal-glow/10" />
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight text-foundry-100">
        Silicon <span className="text-teal-glow">Nexus</span>
      </span>
    </Link>
  );
}

const publicLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-1.5 text-sm text-foundry-400 transition hover:bg-white/5 hover:text-foundry-100',
    isActive && 'bg-teal-glow/10 text-teal-glow'
  );

export function SiteHeader({ compact }: { compact?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/about', label: t.nav.about },
    { to: '/connect', label: t.connect.nav },
    { to: '/pricing', label: t.nav.pricing },
    { to: '/cookbook', label: t.cookbook.nav },
    { to: '/feed', label: t.nav.feed },
    { to: '/docs', label: t.nav.docs },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-white/[0.06] px-5 py-3 md:px-8',
        compact ? 'bg-foundry-950/90 backdrop-blur-xl' : 'bg-foundry-950/60 backdrop-blur-xl'
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <BrandMark />
        <nav className="hidden items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={publicLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link to="/console" className="nx-btn nx-btn-primary px-3 py-1.5 text-sm">
            {t.nav.openConsole}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-foundry-200 lg:hidden"
            aria-expanded={open}
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mt-3 grid gap-1 border-t border-white/5 pt-3 lg:hidden">
          <div className="mb-2 sm:hidden">
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
    'rounded-full px-3 py-1.5 text-sm text-foundry-400 transition hover:bg-white/5 hover:text-foundry-100',
    isActive && 'bg-teal-glow/10 text-teal-glow'
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
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-foundry-950/88 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <BrandMark />
          <nav className="hidden items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 text-sm md:flex">
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
              connected ? 'text-teal-glow' : 'text-copper'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                connected ? 'bg-teal-glow animate-foundry-pulse' : 'bg-copper'
              )}
            />
            {connected ? t.nav.linked : t.nav.awaitingKey}
          </span>
          {workerOnline != null ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider',
                workerOnline ? 'text-teal-glow' : 'text-copper'
              )}
              title={workerOnline ? t.tasks.workerOnline : t.tasks.workerOffline}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  workerOnline ? 'bg-teal-glow animate-foundry-pulse' : 'bg-copper'
                )}
              />
              <span className="hidden sm:inline">{workerOnline ? t.nav.workerOn : t.nav.workerOff}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={onLock}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-foundry-300 hover:border-white/20 hover:text-foundry-100"
          >
            {t.nav.lock}
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-foundry-200 md:hidden"
            aria-expanded={open}
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mt-3 grid gap-1 border-t border-white/5 pt-3 md:hidden">
          <div className="mb-2 sm:hidden">
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
