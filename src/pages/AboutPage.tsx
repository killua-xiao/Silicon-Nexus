import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useT } from '../i18n/I18nProvider';
import { SITE_LEGAL } from '../legal/site';
import { PUBLIC_LIST_PRICES } from '../lib/planPrice';

function fill(text: string) {
  const usd = (n: number) => `$${n}`;
  const cny = (n: number) => `¥${n.toLocaleString('zh-CN')}`;
  return text
    .replaceAll('{email}', SITE_LEGAL.contactEmail)
    .replaceAll('{starterUsd}', usd(PUBLIC_LIST_PRICES.starter.usd))
    .replaceAll('{proUsd}', usd(PUBLIC_LIST_PRICES.pro.usd))
    .replaceAll('{businessUsd}', usd(PUBLIC_LIST_PRICES.business.usd))
    .replaceAll('{starterCny}', cny(PUBLIC_LIST_PRICES.starter.cny))
    .replaceAll('{proCny}', cny(PUBLIC_LIST_PRICES.pro.cny))
    .replaceAll('{businessCny}', cny(PUBLIC_LIST_PRICES.business.cny));
}

export function AboutPage() {
  const t = useT();
  const a = t.about;
  const capabilities = [
    { title: a.capMemoryTitle, body: a.capMemoryBody },
    { title: a.capSwarmTitle, body: a.capSwarmBody },
    { title: a.capSignalsTitle, body: a.capSignalsBody },
    { title: a.capGeoTitle, body: a.capGeoBody },
  ];
  const limits = [a.honestLexical, a.honestCrawl, a.honestBilling, a.honestScale];

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid text-foundry-100">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="nx-kicker mb-2">{a.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100 md:text-4xl">
          {a.title}
        </h1>
        <p className="mt-4 leading-relaxed text-foundry-400">{a.lead}</p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-foundry-100">{a.platformTitle}</h2>
          <p className="mt-3 leading-relaxed text-foundry-400">{a.platformBody}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-foundry-100">
            {a.audiencesTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="nx-card p-5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
                {a.humanTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foundry-400">{a.humanBody}</p>
            </article>
            <article className="nx-card p-5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-copper">
                {a.agentTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foundry-400">{a.agentBody}</p>
            </article>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-foundry-100">{a.capTitle}</h2>
          <ul className="mt-4 space-y-4">
            {capabilities.map((c) => (
              <li key={c.title} className="nx-card p-5">
                <h3 className="font-semibold text-foundry-100">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foundry-400">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-foundry-100">{a.honestTitle}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foundry-400">
            {limits.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-glow" />
                <span>{fill(line)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="nx-card mt-12 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-foundry-100">{a.startTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-foundry-400">{a.startBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/console" className="nx-btn nx-btn-primary">
              {t.nav.openConsole}
            </Link>
            <Link to="/connect" className="nx-btn nx-btn-ghost">
              {t.connect.pageTitle}
            </Link>
            <Link to="/pricing" className="nx-btn nx-btn-ghost">
              {t.nav.pricing}
            </Link>
            <Link to="/docs" className="nx-btn nx-btn-ghost">
              {t.nav.docs}
            </Link>
            <a
              href="/.well-known/agent.json"
              target="_blank"
              rel="noreferrer"
              className="nx-btn nx-btn-ghost font-mono text-xs"
            >
              agent.json
            </a>
            <a
              href={SITE_LEGAL.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="nx-btn nx-btn-ghost"
            >
              {a.github}
            </a>
          </div>
          <p className="mt-4 font-mono text-[11px] text-foundry-600">{a.sourceHint}</p>
        </section>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
