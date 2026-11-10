import { Link, useLocation } from 'react-router-dom';
import { WirePublicShell } from '../components/WirePublicShell';
import { useT } from '../i18n/I18nProvider';
import { SITE_LEGAL } from '../legal/site';
import { PUBLIC_LIST_PRICES } from '../lib/planPrice';

function fill(text: string) {
  const usd = (n: number) => `$${n}`;
  const cny = (n: number) => `¥${n.toLocaleString('zh-CN')}`;
  return text
    .replaceAll('{product}', SITE_LEGAL.productName)
    .replaceAll('{site}', SITE_LEGAL.siteUrl)
    .replaceAll('{email}', SITE_LEGAL.contactEmail)
    .replaceAll('{icp}', SITE_LEGAL.icp)
    .replaceAll('{starterUsd}', usd(PUBLIC_LIST_PRICES.starter.usd))
    .replaceAll('{proUsd}', usd(PUBLIC_LIST_PRICES.pro.usd))
    .replaceAll('{businessUsd}', usd(PUBLIC_LIST_PRICES.business.usd))
    .replaceAll('{starterCny}', cny(PUBLIC_LIST_PRICES.starter.cny))
    .replaceAll('{proCny}', cny(PUBLIC_LIST_PRICES.pro.cny))
    .replaceAll('{businessCny}', cny(PUBLIC_LIST_PRICES.business.cny));
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
    <WirePublicShell>

        <p className="nx-kicker mb-2">{t.legal.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{fill(copy.updated)}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-muted">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-ink">{section.heading}</h2>
              <p className="mt-2 whitespace-pre-wrap">{fill(section.body)}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-muted">
          <Link to={other.to} className="text-wire-blue hover:underline">
            {other.label}
          </Link>
          <span className="mx-2 text-foundry-700">·</span>
          <a className="text-wire-blue hover:underline" href={`mailto:${SITE_LEGAL.contactEmail}`}>
            {SITE_LEGAL.contactEmail}
          </a>
        </p>
      </WirePublicShell>
  );
}
