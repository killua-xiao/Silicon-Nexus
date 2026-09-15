import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Boxes, Database, Globe2 } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { useT } from '../i18n/I18nProvider';

export function LandingPage() {
  const t = useT();
  const features = [
    { icon: Database, title: t.landing.memoryTitle, body: t.landing.memoryBody },
    { icon: Boxes, title: t.landing.swarmTitle, body: t.landing.swarmBody },
    { icon: Globe2, title: t.landing.visibilityTitle, body: t.landing.visibilityBody },
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
      <section className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden">
        <HeroBackdrop />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-6xl flex-col justify-center px-6 py-16 md:px-12">
          <div className="hero-copy">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="nx-kicker mb-4"
          >
            {t.landing.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
          >
            Silicon <span className="text-teal-glow">Nexus</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-foundry-300 md:text-xl"
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
            <span className="nx-chip">{t.landing.chipSwarm}</span>
            <span className="nx-chip">{t.landing.chipGeo}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/console" className="nx-btn nx-btn-primary px-5 py-2.5">
              {t.landing.openConsole}
            </Link>
            <Link to="/docs" className="nx-btn nx-btn-ghost px-5 py-2.5">
              {t.landing.viewApi}
            </Link>
          </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-foundry-950 px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="nx-card nx-card-hover animate-foundry-rise p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="mb-4 inline-flex rounded-md border border-white/10 p-2 text-teal-glow">
                <f.icon className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-foundry-100">{f.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-foundry-400">{f.body}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-6xl text-sm leading-relaxed text-foundry-500">
          {t.landing.selfHost}
        </p>
      </section>

      <section className="border-t border-white/5 bg-foundry-900/40 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="nx-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foundry-100">
              {t.connect.sectionTitle}
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-foundry-400">{t.connect.sectionBody}</p>
            <ol className="mt-8 grid gap-3 md:grid-cols-3">
              <li className="rounded-md border border-white/5 bg-foundry-950/50 p-4 text-sm text-foundry-300">
                <span className="font-mono text-teal-glow">1.</span> {t.connect.step1}
              </li>
              <li className="rounded-md border border-white/5 bg-foundry-950/50 p-4 text-sm text-foundry-300">
                <span className="font-mono text-teal-glow">2.</span> {t.connect.step2}
              </li>
              <li className="rounded-md border border-white/5 bg-foundry-950/50 p-4 text-sm text-foundry-300">
                <span className="font-mono text-teal-glow">3.</span> {t.connect.step3}
              </li>
            </ol>
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

          <div className="mt-10">
            <p className="nx-kicker mb-3">{t.landing.surfacesTitle}</p>
            <div className="flex flex-wrap gap-2">
              {surfaces.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-xs text-foundry-300 transition hover:border-teal-glow/40 hover:text-teal-glow"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
