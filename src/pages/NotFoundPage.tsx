import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useT } from '../i18n/I18nProvider';

export function NotFoundPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-foundry-950 text-foundry-100">
      <SiteHeader />
      <main className="wrap py-16">
        <p className="nx-kicker mb-2">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-foundry-400">
          Public dispatches live on the wire. Console, MCP, and docs are unchanged.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="/" className="nx-btn nx-btn-primary">
            Wire
          </a>
          <a href="/console" className="nx-btn nx-btn-ghost">
            {t.nav.openConsole}
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
