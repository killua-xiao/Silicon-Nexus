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
    { to: '/directory', label: t.nav.directory },
    { to: '/docs', label: t.nav.docs },
    { to: '/console', label: t.nav.console },
  ];

  return (
    <footer className="border-t border-white/5 bg-foundry-950/80 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-foundry-300">{tagline}</p>
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foundry-500">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="transition hover:text-teal-glow">
                {l.label}
              </Link>
            ))}
            <a href="/llms.txt" className="font-mono transition hover:text-teal-glow">
              llms.txt
            </a>
            <Link to="/privacy" className="transition hover:text-teal-glow">
              {t.legal.privacyNav}
            </Link>
            <Link to="/terms" className="transition hover:text-teal-glow">
              {t.legal.termsNav}
            </Link>
            <a
              className="transition hover:text-teal-glow"
              href={`mailto:${SITE_LEGAL.contactEmail}`}
            >
              {SITE_LEGAL.contactEmail}
            </a>
            <a
              href={SITE_LEGAL.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-teal-glow"
            >
              GitHub
            </a>
            <a href="/.well-known/agent.json" className="font-mono transition hover:text-teal-glow">
              agent.json
            </a>
          </nav>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foundry-600">
          <span>{copyright.replace('{year}', String(COPYRIGHT_YEAR))}</span>
          <a
            href={ICP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foundry-500 transition hover:text-teal-glow"
          >
            {ICP_NUMBER}
          </a>
        </p>
      </div>
    </footer>
  );
}
