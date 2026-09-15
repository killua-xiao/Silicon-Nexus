import { Link, useLocation } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useT } from '../i18n/I18nProvider';
import { SITE_LEGAL } from '../legal/site';

function fill(text: string) {
  return text
    .replaceAll('{product}', SITE_LEGAL.productName)
    .replaceAll('{site}', SITE_LEGAL.siteUrl)
    .replaceAll('{email}', SITE_LEGAL.contactEmail)
    .replaceAll('{icp}', SITE_LEGAL.icp);
}

export function LegalPage() {
  const t = useT();
  const kind = useLocation().pathname.startsWith('/terms') ? 'terms' : 'privacy';
  const copy = kind === 'terms' ? t.legal.terms : t.legal.privacy;
  const other =
    kind === 'terms'
      ? { to: '/privacy', label: t.legal.privacyNav }
      : { to: '/terms', label: t.legal.termsNav };

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="nx-kicker mb-2">{t.legal.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100">{copy.title}</h1>
        <p className="mt-2 text-sm text-foundry-500">{fill(copy.updated)}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foundry-300">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-foundry-100">{section.heading}</h2>
              <p className="mt-2 whitespace-pre-wrap">{fill(section.body)}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-foundry-500">
          <Link to={other.to} className="text-teal-glow hover:underline">
            {other.label}
          </Link>
          <span className="mx-2 text-foundry-700">·</span>
          <a className="text-teal-glow hover:underline" href={`mailto:${SITE_LEGAL.contactEmail}`}>
            {SITE_LEGAL.contactEmail}
          </a>
        </p>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
