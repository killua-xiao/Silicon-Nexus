import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Database, Eye, GitBranch } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { HeroBackdrop } from '../components/HeroBackdrop';
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
    <div className="min-h-screen foundry-glow text-foundry-100">
      <SiteHeader />
      <section className="relative isolate min-h-[calc(100svh-4.75rem)] overflow-hidden">
        <HeroBackdrop />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.75rem)] max-w-6xl flex-col justify-center px-6 py-20 md:px-8">
          <div className="hero-copy max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="nx-kicker mb-5"
          >
            {t.landing.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-5xl lg:text-6xl"
          >
            {t.landing.headline}
            <br />
            <span className="text-teal-glow">{t.landing.headlineAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-foundry-300 md:text-xl"
          >
            {t.landing.tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            <span className="nx-chip">{t.landing.chipMemory}</span>
            <span className="nx-chip">{t.landing.chipGeo}</span>
            <span className="nx-chip">{t.landing.chipSwarm}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link to="/console" className="nx-btn nx-btn-primary px-6 py-3">
              {t.landing.openConsole}
            </Link>
            <Link to="/connect" className="nx-btn nx-btn-ghost px-6 py-3">
              {t.landing.viewApi}
            </Link>
          </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-foundry-950 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <p className="nx-kicker">{t.landing.surfacesTitle}</p>
            <span className="flex gap-4 text-sm">
              <Link to="/cookbook" className="text-foundry-400 transition hover:text-teal-glow">
                {t.cookbook.nav}
              </Link>
              <Link to="/about" className="text-foundry-400 transition hover:text-teal-glow">
                {t.landing.aboutCta}
              </Link>
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="nx-card nx-card-hover animate-foundry-rise p-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-teal-glow">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-xs text-foundry-600">0{i + 1}</span>
              </div>
              <h2 className="text-xl font-semibold text-foundry-100">{f.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-foundry-400">{f.body}</p>
            </article>
          ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-foundry-500">
            {t.landing.selfHost}
          </p>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-foundry-900/50 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="nx-card overflow-hidden p-0">
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 md:p-10">
                <p className="nx-kicker mb-4">{t.connect.nav}</p>
                <h2 className="text-3xl font-semibold text-foundry-100">
                  {t.connect.sectionTitle}
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed text-foundry-400">{t.connect.sectionBody}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/connect" className="nx-btn nx-btn-primary">
                    {t.connect.pageTitle}
                  </Link>
                  <Link to="/console/agents" className="nx-btn nx-btn-ghost">
                    {t.nav.agents}
                  </Link>
                  <a href="/.well-known/agent.json" target="_blank" rel="noreferrer" className="nx-btn nx-btn-ghost">
                    {t.connect.viewCard}
                  </a>
                </div>
              </div>
              <ol className="grid content-center gap-3 border-t border-white/[0.06] bg-foundry-950/40 p-6 md:border-l md:border-t-0 md:p-8">
                {[t.connect.step1, t.connect.step2, t.connect.step3].map((step, i) => (
                  <li key={step} className="rounded-2xl border border-white/[0.06] bg-foundry-950/70 p-4 text-sm leading-relaxed text-foundry-300">
                    <span className="mb-2 block font-mono text-[11px] tracking-[0.16em] text-teal-glow">
                      0{i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {surfaces.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 font-mono text-xs text-foundry-300 transition hover:border-teal-glow/40 hover:text-teal-glow"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
