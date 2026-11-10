import { useT } from '../i18n/I18nProvider';
import { WirePublicShell } from '../components/WirePublicShell';

export function NotFoundPage() {
  const t = useT();
  return (
    <WirePublicShell>

        <p className="nx-kicker mb-2">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-ink-muted">
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
      </WirePublicShell>
  );
}
