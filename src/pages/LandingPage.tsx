import { Link } from 'react-router-dom';
import { Database, Eye, GitBranch } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useT } from '../i18n/I18nProvider';

export function LandingPage() {
  const t = useT();
  const features = [
    { icon: Database, title: t.landing.memoryTitle, body: t.landing.memoryBody },
    { icon: GitBranch, title: t.landing.swarmTitle, body: t.landing.swarmBody },
    { icon: Eye, title: t.landing.visibilityTitle, body: t.landing.visibilityBody },
  ];
  const surfaces = [
    { href: '/llms.txt', label: 'llms.txt' },
    { href: '/feed.json', label: 'feed.json' },
    { href: '/.well-known/agent.json', label: 'agent.json' },
    { href: '/mcp', label: '/mcp' },
  ];

  return (
    <div className="min-h-screen bg-foundry-950 text-foundry-100">
      <SiteHeader />
      <section className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">
          <p className="nx-kicker mb-3">{t.landing.eyebrow}</p>
          <h1 className="max-w-xl text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] md:text-[2rem]">
            {t.landing.headline}{' '}
            <span className="text-accent">{t.landing.headlineAccent}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foundry-400 md:text-[15px]">
            {t.landing.tagline}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="nx-chip">{t.landing.chipMemory}</span>
            <span className="nx-chip">{t.landing.chipGeo}</span>
            <span className="nx-chip">{t.landing.chipSwarm}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/console" className="nx-btn nx-btn-primary">
              {t.landing.openConsole}
            </Link>
            <Link to="/connect" className="nx-btn nx-btn-ghost">
              {t.landing.viewApi}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.06] px-5 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="nx-kicker">{t.landing.surfacesTitle}</p>
            <span className="flex gap-4 text-sm">
              <Link to="/cookbook" className="text-foundry-400 transition hover:text-accent">
                {t.cookbook.nav}
              </Link>
              <Link to="/about" className="text-foundry-400 transition hover:text-accent">
                {t.landing.aboutCta}
              </Link>
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {features.map((f, i) => (
              <article key={f.title} className="nx-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex rounded border border-white/10 bg-foundry-950 p-1.5 text-accent">
                    <f.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-mono text-[11px] text-foundry-600">0{i + 1}</span>
                </div>
                <h2 className="text-base font-semibold text-foundry-100">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foundry-400">{f.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foundry-500">
            {t.landing.selfHost}
          </p>
        </div>
      </section>

      <section className="px-5 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="nx-panel overflow-hidden">
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-5 md:p-6">
                <p className="nx-kicker mb-2">{t.connect.nav}</p>
                <h2 className="text-xl font-semibold text-foundry-100">
                  {t.connect.sectionTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-foundry-400">
                  {t.connect.sectionBody}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link to="/connect" className="nx-btn nx-btn-primary">
                    {t.connect.pageTitle}
                  </Link>
                  <Link to="/console/agents" className="nx-btn nx-btn-ghost">
                    {t.nav.agents}
                  </Link>
                  <a
                    href="/.well-known/agent.json"
                    target="_blank"
                    rel="noreferrer"
                    className="nx-btn nx-btn-ghost font-mono text-xs"
                  >
                    {t.connect.viewCard}
                  </a>
                </div>
              </div>
              <ol className="grid content-center gap-2 border-t border-white/[0.06] bg-foundry-950/50 p-5 md:border-l md:border-t-0 md:p-6">
                {[t.connect.step1, t.connect.step2, t.connect.step3].map((step, i) => (
                  <li
                    key={step}
                    className="rounded border border-white/[0.06] bg-foundry-950 px-3 py-2.5 text-sm leading-relaxed text-foundry-300"
                  >
                    <span className="mb-1 block font-mono text-[11px] tracking-[0.12em] text-accent">
                      0{i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {surfaces.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-white/10 bg-foundry-900 px-2.5 py-1 font-mono text-[11px] text-foundry-300 transition hover:border-accent/40 hover:text-accent"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
