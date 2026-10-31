import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { SITE_LEGAL } from '../legal/site';
import { chromeCopy, FOOTER_DISCOVERY, FOOTER_NAV } from '../chrome/siteChrome';

export function SiteFooter() {
  const { locale } = useI18n();
  const c = chromeCopy(locale);

  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>
          {c.wire} · {c.builtFor}
        </p>
        <nav>
          {FOOTER_NAV.map((item) =>
            item.href === '/' ? (
              <a key={item.href} href={item.href}>
                {item.label(c)}
              </a>
            ) : (
              <Link key={item.href} to={item.href}>
                {item.label(c)}
              </Link>
            )
          )}
          {FOOTER_DISCOVERY.map((item) => (
            <a key={item.href} href={item.href} className="mono">
              {item.label}
            </a>
          ))}
          <a href={SITE_LEGAL.githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
        <p className="mono" style={{ marginTop: 12 }}>
          © 2026 Silicon Nexus · {SITE_LEGAL.icp}
        </p>
      </div>
    </footer>
  );
}
