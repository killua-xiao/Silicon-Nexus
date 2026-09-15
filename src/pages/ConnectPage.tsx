import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { McpConfigPanel } from '../components/McpConfigPanel';
import { useT } from '../i18n/I18nProvider';

export function ConnectPage() {
  const t = useT();

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid text-foundry-100">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="nx-kicker mb-2">{t.connect.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100">
          {t.connect.pageTitle}
        </h1>
        <p className="mt-3 text-foundry-400 leading-relaxed">{t.connect.pageIntro}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <section className="nx-card p-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
              {t.connect.humanTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foundry-400">{t.connect.humanBody}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/console" className="nx-btn nx-btn-primary px-3 py-1.5 text-sm">
                {t.connect.openConsole}
              </Link>
              <Link to="/pricing" className="nx-btn nx-btn-ghost px-3 py-1.5 text-sm">
                {t.connect.viewPricing}
              </Link>
            </div>
          </section>
          <section className="nx-card p-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-copper">
              {t.connect.agentTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foundry-400">{t.connect.agentBody}</p>
            <p className="mt-3 font-mono text-[11px] text-foundry-500">{t.connect.agentNoUi}</p>
          </section>
        </div>

        <ol className="mt-10 space-y-6">
          {[t.connect.guide1, t.connect.guide2, t.connect.guide3, t.connect.guide4].map(
            (text, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-teal-glow/30 font-mono text-sm text-teal-glow">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-foundry-300">{text}</p>
              </li>
            )
          )}
        </ol>

        <div className="mt-10">
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

        <p className="mt-8 text-xs text-foundry-600">
          {t.connect.fullDocs}{' '}
          <a href="/docs" className="text-teal-glow/80 hover:underline">
            /docs
          </a>
          {' · '}
          <span className="font-mono text-foundry-500">docs/CONNECT.md</span>
        </p>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
