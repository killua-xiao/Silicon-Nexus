import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useI18n, useT } from '../i18n/I18nProvider';
import { apiJson } from '../lib/api';
import { cn } from '../lib/cn';
import { SITE_LEGAL } from '../legal/site';
import type { Messages } from '../i18n/messages';
import { PUBLIC_LIST_PRICES, formatListPrice } from '../lib/planPrice';

type PlanId = 'free' | 'starter' | 'pro' | 'business';

type ApiPlan = {
  id: string;
  priceMonthlyUsd: number | null;
  priceMonthlyCny: number | null;
  highlighted?: boolean;
};

function localizedPlan(t: Messages['pricing'], id: PlanId) {
  const map = {
    free: {
      name: t.planFreeName,
      tagline: t.planFreeTagline,
      bullets: [t.planFreeB1, t.planFreeB2, t.planFreeB3, t.planFreeB4],
    },
    starter: {
      name: t.planStarterName,
      tagline: t.planStarterTagline,
      bullets: [t.planStarterB1, t.planStarterB2, t.planStarterB3, t.planStarterB4],
    },
    pro: {
      name: t.planProName,
      tagline: t.planProTagline,
      bullets: [t.planProB1, t.planProB2, t.planProB3, t.planProB4],
    },
    business: {
      name: t.planBusinessName,
      tagline: t.planBusinessTagline,
      bullets: [t.planBusinessB1, t.planBusinessB2, t.planBusinessB3, t.planBusinessB4],
    },
  } as const;
  return map[id];
}

const ORDER: PlanId[] = ['free', 'starter', 'pro', 'business'];

export function PricingPage() {
  const t = useT();
  const { locale } = useI18n();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  useEffect(() => {
    apiJson<{ plans: ApiPlan[]; stripeConfigured?: boolean }>('/api/plans')
      .then((d) => {
        setPlans(d.plans || []);
        setStripeConfigured(!!d.stripeConfigured);
      })
      .catch(() => setPlans([]));
  }, []);

  const display = ORDER.map((id) => {
    const api = plans.find((p) => p.id === id);
    const priceMonthlyUsd = api?.priceMonthlyUsd ?? PUBLIC_LIST_PRICES[id].usd;
    const priceMonthlyCny = api?.priceMonthlyCny ?? PUBLIC_LIST_PRICES[id].cny;
    return {
      id,
      priceLabel: formatListPrice(locale, priceMonthlyUsd, priceMonthlyCny),
      highlighted: api?.highlighted ?? id === 'pro',
      ...localizedPlan(t.pricing, id),
    };
  });

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid">
      <SiteHeader compact />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="nx-kicker mb-2">{t.pricing.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100 md:text-4xl">
          {t.pricing.title}
        </h1>
        <p className="mt-3 max-w-2xl text-foundry-400 leading-relaxed">{t.pricing.intro}</p>
        <p className="mt-2 max-w-2xl text-xs text-foundry-500">{t.pricing.currencyNote}</p>
        <p className="mt-1 max-w-2xl text-xs text-foundry-600">{t.pricing.checkoutNote}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {display.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'nx-card nx-card-hover relative flex flex-col p-5',
                plan.highlighted && 'border-teal-glow/40 ring-1 ring-teal-glow/20'
              )}
            >
              {plan.highlighted ? (
                <span className="nx-chip absolute right-4 top-4">{t.pricing.recommended}</span>
              ) : null}
              <div className="pr-24 font-mono text-[11px] uppercase tracking-wider text-foundry-500">
                {plan.name}
              </div>
              <div className="mt-2 font-mono text-3xl text-foundry-100">
                {plan.priceLabel ?? t.pricing.free}
                {plan.priceLabel ? (
                  <span className="text-sm text-foundry-500">{t.pricing.perMonth}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-foundry-400">{plan.tagline}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-foundry-300">
                {plan.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-teal-glow">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {plan.id === 'free' ? (
                <Link
                  to="/console"
                  className={cn(
                    'nx-btn mt-6',
                    plan.highlighted ? 'nx-btn-primary' : 'nx-btn-ghost'
                  )}
                >
                  {t.pricing.cta}
                </Link>
              ) : stripeConfigured ? (
                <Link
                  to="/console/account"
                  className={cn(
                    'nx-btn mt-6',
                    plan.highlighted ? 'nx-btn-primary' : 'nx-btn-ghost'
                  )}
                >
                  {t.pricing.ctaCheckout}
                </Link>
              ) : (
                <a
                  href={`mailto:${SITE_LEGAL.contactEmail}?subject=${encodeURIComponent(`Silicon Nexus ${plan.id} upgrade`)}`}
                  className={cn(
                    'nx-btn mt-6',
                    plan.highlighted ? 'nx-btn-primary' : 'nx-btn-ghost'
                  )}
                >
                  {t.pricing.ctaPaid}
                </a>
              )}
            </div>
          ))}
        </div>

        <section className="nx-card mt-12 p-5">
          <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.pricing.audiencesTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-foundry-300">
            <div>
              <div className="font-semibold text-foundry-100">{t.pricing.userTitle}</div>
              <p className="mt-1 text-foundry-500">{t.pricing.userBody}</p>
            </div>
            <div>
              <div className="font-semibold text-foundry-100">{t.pricing.agentTitle}</div>
              <p className="mt-1 text-foundry-500">{t.pricing.agentBody}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
