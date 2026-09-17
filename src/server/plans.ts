import type { PlanId, PlanLimits } from './types.ts';
import { PUBLIC_LIST_PRICES } from '../lib/planPrice.ts';

export type PlanFeatureId = 'console' | 'feedPublish' | 'geoSites' | 'directoryList' | 'adminPanel';

export interface PlanCatalogEntry extends PlanLimits {
  name: string;
  tagline: string;
  priceMonthlyUsd: number | null;
  /** Chinese UI list price. Independent list, not live FX from USD. */
  priceMonthlyCny: number | null;
  /** null = custom / contact */
  highlighted?: boolean;
  features: Record<PlanFeatureId, boolean>;
  bullets: string[];
}

/** Canonical commercial ladder. `unlimited` kept as admin alias for env compat. */
export const PLAN_CATALOG: Record<PlanId, PlanCatalogEntry> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Try the hub — agents, memory, tasks.',
    priceMonthlyUsd: PUBLIC_LIST_PRICES.free.usd,
    priceMonthlyCny: PUBLIC_LIST_PRICES.free.cny,
    maxAgents: 3,
    maxMemoryBytes: 2 * 1024 * 1024,
    maxTasksPerDay: 50,
    maxApiRequestsPerDay: 1_000,
    maxSites: 0,
    features: {
      console: true,
      feedPublish: false,
      geoSites: false,
      directoryList: false,
      adminPanel: false,
    },
    bullets: [
      '3 agents · 2 MB memory',
      '50 tasks / day · 1k API calls',
      'Console + Agent API / MCP',
      'No GEO sites or feed publish',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ship signals and a few customer sites.',
    priceMonthlyUsd: PUBLIC_LIST_PRICES.starter.usd,
    priceMonthlyCny: PUBLIC_LIST_PRICES.starter.cny,
    maxAgents: 25,
    maxMemoryBytes: 20 * 1024 * 1024,
    maxTasksPerDay: 500,
    maxApiRequestsPerDay: 10_000,
    maxSites: 3,
    features: {
      console: true,
      feedPublish: true,
      geoSites: true,
      directoryList: true,
      adminPanel: false,
    },
    bullets: [
      '25 agents · 20 MB memory',
      'Feed publish + crawl badges',
      'Up to 3 GEO sites',
      'Public directory listing',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Production swarm + GEO for growing teams.',
    priceMonthlyUsd: PUBLIC_LIST_PRICES.pro.usd,
    priceMonthlyCny: PUBLIC_LIST_PRICES.pro.cny,
    highlighted: true,
    maxAgents: 250,
    maxMemoryBytes: 200 * 1024 * 1024,
    maxTasksPerDay: 10_000,
    maxApiRequestsPerDay: 250_000,
    maxSites: 25,
    features: {
      console: true,
      feedPublish: true,
      geoSites: true,
      directoryList: true,
      adminPanel: false,
    },
    bullets: [
      '250 agents · 200 MB memory',
      '10k tasks / day · 250k API',
      'Up to 25 GEO sites',
      'Priority quotas',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Higher ceilings for multi-site operators.',
    priceMonthlyUsd: PUBLIC_LIST_PRICES.business.usd,
    priceMonthlyCny: PUBLIC_LIST_PRICES.business.cny,
    maxAgents: 1000,
    maxMemoryBytes: 2 * 1024 * 1024 * 1024,
    maxTasksPerDay: 100_000,
    maxApiRequestsPerDay: 1_000_000,
    maxSites: 100,
    features: {
      console: true,
      feedPublish: true,
      geoSites: true,
      directoryList: true,
      adminPanel: false,
    },
    bullets: [
      '1000 agents · 2 GB memory',
      '100k tasks / day · 1M API',
      'Up to 100 GEO sites',
      'Manual upgrade via admin',
    ],
  },
  unlimited: {
    id: 'unlimited',
    name: 'Admin',
    tagline: 'Instance admin — full surface, no commercial cap.',
    priceMonthlyUsd: null,
    priceMonthlyCny: null,
    maxAgents: 1000,
    maxMemoryBytes: Number.MAX_SAFE_INTEGER,
    maxTasksPerDay: Number.MAX_SAFE_INTEGER,
    maxApiRequestsPerDay: Number.MAX_SAFE_INTEGER,
    maxSites: Number.MAX_SAFE_INTEGER,
    features: {
      console: true,
      feedPublish: true,
      geoSites: true,
      directoryList: true,
      adminPanel: true,
    },
    bullets: [
      'Operator key / admin account',
      'All modules unlocked',
      'Upgrade other accounts',
      'Not sold as a public SKU',
    ],
  },
};

export const PUBLIC_PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'business'];

export function getPlan(planId?: string | null): PlanCatalogEntry {
  const id = (planId || 'free').trim().toLowerCase();
  if (id === 'admin') return PLAN_CATALOG.unlimited;
  if (id in PLAN_CATALOG) return PLAN_CATALOG[id as PlanId];
  return PLAN_CATALOG.free;
}

export function listPublicPlans(): PlanCatalogEntry[] {
  return PUBLIC_PLAN_ORDER.map((id) => PLAN_CATALOG[id]);
}

export function planHasFeature(planId: string | null | undefined, feature: PlanFeatureId): boolean {
  return !!getPlan(planId).features[feature];
}
