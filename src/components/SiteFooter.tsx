import { Link } from 'react-router-dom';
import { useT } from '../i18n/I18nProvider';
import { SITE_LEGAL } from '../legal/site';

const ICP_NUMBER = SITE_LEGAL.icp;
const ICP_URL = SITE_LEGAL.icpUrl;
const COPYRIGHT_YEAR = 2026;

export function SiteFooter({
  tagline,
  copyright,
}: {
  tagline: string;
  copyright: string;
}) {
  const t = useT();
  const links = [
    { to: '/about', label: t.nav.about },
    { to: '/connect', label: t.connect.nav },
    { to: '/pricing', label: t.nav.pricing },
    { to: '/feed', label: t.nav.feed },
    { to: '/docs', label: t.nav.docs },
    { to: '/cookbook', label: t.cookbook.nav },
    { to: '/console', label: t.nav.console },
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-foundry-950 px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="max-w-md text-sm leading-relaxed text-foundry-400">{tagline}</p>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foundry-500">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="transition hover:text-accent">
                {l.label}
              </Link>
            ))}
            <a href="/llms.txt" className="font-mono transition hover:text-accent">
              llms.txt
            </a>
            <Link to="/privacy" className="transition hover:text-accent">
              {t.legal.privacyNav}
            </Link>
            <Link to="/terms" className="transition hover:text-accent">
              {t.legal.termsNav}
            </Link>
            <a
              className="transition hover:text-accent"
              href={`mailto:${SITE_LEGAL.contactEmail}`}
            >
              {SITE_LEGAL.contactEmail}
            </a>
            <a
              href={SITE_LEGAL.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-accent"
            >
              GitHub
            </a>
            <a href="/.well-known/agent.json" className="font-mono transition hover:text-accent">
              agent.json
            </a>
          </nav>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-foundry-600">
          <span>{copyright.replace('{year}', String(COPYRIGHT_YEAR))}</span>
          <a
            href={ICP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foundry-500 transition hover:text-accent"
          >
            {ICP_NUMBER}
          </a>
        </p>
      </div>
    </footer>
  );
}
