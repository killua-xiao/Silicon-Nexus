import { Link } from 'react-router-dom';
import { WirePublicShell } from '../components/WirePublicShell';
import { McpConfigPanel } from '../components/McpConfigPanel';
import { useT } from '../i18n/I18nProvider';

export function ConnectPage() {
  const t = useT();

  return (
    <WirePublicShell>

        <p className="nx-kicker mb-2">{t.connect.eyebrow}</p>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink">
          {t.connect.pageTitle}
        </h1>
        <p className="mt-3 text-ink-muted leading-relaxed">{t.connect.pageIntro}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <section className="nx-card p-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-wire-blue">
              {t.connect.humanTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.connect.humanBody}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/console" className="nx-btn nx-btn-primary px-3 py-1.5 text-sm">
                {t.connect.openConsole}
              </Link>
              <a href="/" className="nx-btn nx-btn-ghost px-3 py-1.5 text-sm">
                Wire
              </a>
            </div>
          </section>
          <section className="nx-card p-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-copper">
              {t.connect.agentTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.connect.agentBody}</p>
            <p className="mt-3 font-mono text-[11px] text-ink-muted">{t.connect.agentNoUi}</p>
          </section>
        </div>

        <ol className="mt-10 space-y-6">
          {[t.connect.guide1, t.connect.guide2, t.connect.guide3, t.connect.guide4].map(
            (text, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-teal-glow/30 font-mono text-sm text-wire-blue">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-ink-muted">{text}</p>
              </li>
            )
          )}
        </ol>

        <section className="nx-card mt-10 p-5">
          <h2 className="font-mono text-xs uppercase tracking-wider text-wire-blue">
            {t.connect.clientsTitle}
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-muted">
            <li>{t.connect.clientCursor}</li>
            <li>{t.connect.clientClaude}</li>
            <li>{t.connect.clientRemote}</li>
          </ul>
          <h3 className="mt-6 font-mono text-xs uppercase tracking-wider text-copper">
            {t.connect.sampleTitle}
          </h3>
          <pre className="mt-3 overflow-x-auto rounded border border-grid-line bg-carbon-paper p-3 font-mono text-[11px] leading-relaxed text-ink">
            {t.connect.sampleCurl}
          </pre>
        </section>

        <div className="mt-8">
          <McpConfigPanel />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link to="/console/agents" className="nx-btn nx-btn-primary">
            {t.connect.openAgents}
          </Link>
          <a
            href="/.well-known/agent.json"
            target="_blank"
            rel="noreferrer"
            className="nx-btn nx-btn-ghost"
          >
            {t.connect.viewCard}
          </a>
          <a
            href="/.well-known/mcp/server-card.json"
            target="_blank"
            rel="noreferrer"
            className="nx-btn nx-btn-ghost"
          >
            {t.connect.viewMcpCard}
          </a>
        </div>

        <p className="mt-8 text-xs text-ink-muted">
          {t.connect.fullDocs}{' '}
          <a href="/docs" className="text-wire-blue/80 hover:underline">
            /docs
          </a>
          {' · '}
          <span className="font-mono text-ink-muted">docs/CONNECT.md</span>
        </p>
      </WirePublicShell>
  );
}
