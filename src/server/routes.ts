import { Router, Request, Response } from 'express';
import {
  assertAgentMemoryAccess,
  planIdFromRequest,
  requireAdmin,
  requireFeature,
  requireRole,
} from './auth.ts';
import {
  acceptTaskSchema,
  createTaskSchema,
  completeTaskSchema,
  failTaskSchema,
  idSchema,
  memoryDataSchema,
  memoryKeySchema,
  patchAgentSchema,
  registerAgentSchema,
  searchMemoryQuerySchema,
} from './schemas.ts';
import {
  claimOpenTask,
  completeTask,
  countSites,
  createTask,
  dashboardStats,
  failTask,
  findTask,
  getAccountById,
  getEventLogs,
  getMemoryStore,
  getTaskQueue,
  incrementUsage,
  listAccounts,
  listAgentSummaries,
  listOpenTasks,
  listPublicAgents,
  listFeedItems,
  getFeedItemBySlug,
  upsertFeedItem,
  deleteFeedItem,
  recordFeedCrawl,
  listSites,
  getSiteBySlug,
  upsertSite,
  deleteSite,
  listSiteContent,
  getSiteContent,
  upsertSiteContent,
  deleteSiteContent,
  recordSiteContentCrawl,
  siteGeoStatus,
  checkAccountPassword,
  consumeAuthToken,
  findAccountByEmail,
  issueAuthToken,
  loginAccount,
  markEmailVerified,
  registerAccount,
  setAccountPassword,
  setAccountPlan,
  readAgentMemory,
  registerAgentToken,
  reopenTask,
  revokeAgentToken,
  searchAgentMemory,
  updateAgentProfile,
  usageSnapshot,
  wipeAgentMemory,
  writeAgentMemory,
} from './store.ts';
import { logJson } from './log.ts';
import { resolveLocaleFromRequest } from './locale.ts';
import { DEFAULT_WORKSPACE_ID, PlanId, resolvePlan } from './types.ts';
import { listPublicPlans, getPlan, planHasFeature } from './plans.ts';
import { z } from 'zod';
import { detectCrawler, INDEXING_NOTE } from './crawlDetect.ts';
import { pullSiteFromSitemap } from './geoPull.ts';
import { isMailConfigured, sendMail, shouldExposeEmailLinks } from './mail.ts';
import { accountCredentialsSchema, registerBodySchema } from './accountAuth.ts';
import { createCheckoutSession, isPaidPlanId, isStripeConfigured } from './stripeBilling.ts';
import { workerStatus } from './workerHeartbeat.ts';

function tenantWs(req: Request): string {
  return req.nexus?.workspaceId || DEFAULT_WORKSPACE_ID;
}

function isSignedIn(req: Request): boolean {
  return req.nexus?.role === 'operator' || req.nexus?.role === 'agent';
}

function feedWorkspace(req: Request): string {
  return isSignedIn(req) ? tenantWs(req) : DEFAULT_WORKSPACE_ID;
}

function sitesListWorkspace(req: Request): string | undefined {
  return isSignedIn(req) ? tenantWs(req) : undefined;
}

async function issueEmailLink(
  accountId: string,
  email: string,
  purpose: 'verify' | 'reset',
  appUrl: string
): Promise<{ mailed: boolean; verifyUrl: string | null; resetUrl: string | null }> {
  const expose = shouldExposeEmailLinks();
  if (!isMailConfigured() && !expose) {
    return { mailed: false, verifyUrl: null, resetUrl: null };
  }
  const ttl = purpose === 'verify' ? 48 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
  const issued = issueAuthToken(accountId, purpose, ttl);
  if (!issued) return { mailed: false, verifyUrl: null, resetUrl: null };
  const path = purpose === 'verify' ? '/verify' : '/reset';
  const url = `${appUrl.replace(/\/$/, '')}${path}?token=${encodeURIComponent(issued.token)}`;
  const mailed = await sendMail({
    to: email,
    subject: purpose === 'verify' ? 'Verify your Silicon Nexus account' : 'Reset your Silicon Nexus password',
    text:
      purpose === 'verify'
        ? `Confirm this email for Silicon Nexus:\n${url}\n\nThis link expires in 48 hours.`
        : `Reset your Silicon Nexus password:\n${url}\n\nThis link expires in 2 hours.`,
  });
  return {
    mailed: mailed.ok === true,
    verifyUrl: purpose === 'verify' && expose ? url : null,
    resetUrl: purpose === 'reset' && expose ? url : null,
  };
}

function maybeRecordCrawl(req: Request, slug: string) {
  const crawler = detectCrawler(req.get('user-agent') || undefined);
  if (!crawler) return;
  try {
    recordFeedCrawl(slug, crawler);
  } catch {
    // never break reads
  }
}

function maybeRecordSiteCrawl(req: Request, siteSlug: string, contentSlug: string) {
  const crawler = detectCrawler(req.get('user-agent') || undefined);
  if (!crawler) return;
  try {
    recordSiteContentCrawl(siteSlug, contentSlug, crawler);
  } catch {
    // never break reads
  }
}

function resolvePublicAppUrl(req: Request): string {
  const fromEnv = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || 'silinex.xyz').split(',')[0].trim();
  return `${proto}://${host}`;
}

const feedPublishSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/),
  title: z.string().min(1).max(300),
  summary: z.string().max(500).optional(),
  bodyMd: z.string().min(1).max(100_000),
  tags: z.array(z.string().max(40)).max(20).optional(),
  source: z.string().max(80).optional(),
  sourceUrl: z.string().url().nullable().optional(),
  externalId: z.string().max(200).nullable().optional(),
  publishedAt: z.string().datetime().optional(),
});

const siteUpsertSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/),
  name: z.string().min(1).max(200),
  domain: z.string().max(253).nullable().optional(),
  description: z.string().max(2000).optional(),
  sitemapUrl: z.string().url().nullable().optional(),
});

const sitePullSchema = z.object({
  sitemapUrl: z.string().url().optional(),
});

const siteContentUpsertSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/),
  title: z.string().min(1).max(300),
  summary: z.string().max(500).optional(),
  bodyMd: z.string().min(1).max(100_000),
  canonicalUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  publishedAt: z.string().datetime().optional(),
});

const siteSlugParam = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/);

export function createApiRouter(options: { openMode: boolean }): Router {
  const router = Router();

  router.use((req, res, next) => {
    if (
      req.path === '/auth/status' ||
      req.path === '/auth/register' ||
      req.path === '/auth/login' ||
      req.path === '/auth/verify' ||
      req.path === '/auth/forgot' ||
      req.path === '/auth/reset' ||
      req.path === '/locale' ||
      req.path === '/plans' ||
      req.path === '/directory' ||
      req.path === '/feed' ||
      req.path.startsWith('/feed/') ||
      req.path === '/sites' ||
      req.path.startsWith('/sites/') ||
      req.path.startsWith('/dashboard')
    ) {
      return next();
    }
    try {
      const plan = resolvePlan(planIdFromRequest(req));
      const ws = req.nexus?.workspaceId;
      const snap = usageSnapshot(ws);
      if (snap.today.apiRequests >= plan.maxApiRequestsPerDay) {
        return res.status(402).json({
          error: 'Plan daily API request quota exceeded',
          plan: plan.id,
          maxApiRequestsPerDay: plan.maxApiRequestsPerDay,
          code: 'NEXUS_PLAN_LIMIT',
        });
      }
      incrementUsage('api_requests', 1, ws);
    } catch {
      // metering must never break the request path when DB is mid-boot
    }
    next();
  });

  router.get('/auth/status', (req, res) => {
    res.json({
      protected: !options.openMode,
      mode: options.openMode ? 'open' : 'identity',
      authModel: 'admin_operator_account_and_agent_tokens',
      audiences: {
        admin: 'nxo_* operator key or first registered admin account — full console',
        user: 'nxu_* after email register/login — console gated by plan',
        agent: 'nxa_* — REST/MCP only, no UI',
      },
      workspaceModel: 'per_account_workspace',
      email: { smtpConfigured: isMailConfigured() },
      billing: { stripeConfigured: isStripeConfigured() },
      plan: resolvePlan(planIdFromRequest(req)).id,
      identity: req.nexus?.role
        ? {
            role: req.nexus.role,
            accountRole: req.nexus.accountRole || null,
            planId: req.nexus.planId || null,
            accountId: req.nexus.accountId || null,
            workspaceId: req.nexus.workspaceId || null,
          }
        : null,
      hint: options.openMode
        ? 'Sandbox mode (NEXUS_AUTH_MODE=open): no credentials required.'
        : 'Humans: Operator Key or account login. Agents: nxa_* via MCP/REST only.',
    });
  });

  router.get('/plans', (_req, res) => {
    res.json({
      plans: listPublicPlans(),
      admin: getPlan('unlimited'),
      note: isStripeConfigured()
        ? 'Paid plans can checkout via POST /api/billing/checkout. Admins can still PATCH /api/accounts/:id/plan.'
        : 'Stripe is not configured on this instance. Admins upgrade accounts via PATCH /api/accounts/:id/plan.',
      stripeConfigured: isStripeConfigured(),
      smtpConfigured: isMailConfigured(),
      currency: 'USD',
      currencies: {
        USD: { ui: 'en', note: 'English UI list prices' },
        CNY: { ui: 'zh', note: 'Chinese UI list prices' },
      },
      pricingNote:
        'List prices: English UI uses USD, Chinese UI uses CNY for the same SKUs. Not a live FX conversion. If Stripe Checkout is enabled, charges are USD.',
    });
  });

  const accountAuthSchema = accountCredentialsSchema;

  router.post('/auth/register', async (req, res) => {
    try {
      const parsed = registerBodySchema.parse(req.body);
      const result = registerAccount(parsed);
      if (result.ok === false) {
        if (result.code === 'exists') {
          return res.status(409).json({ error: 'Email already registered', code: 'NEXUS_ACCOUNT_EXISTS' });
        }
        return res.status(400).json({ error: 'Invalid email or password (min 8 chars)' });
      }
      const verify = result.account.emailVerified
        ? { mailed: false, verifyUrl: null as string | null }
        : await issueEmailLink(result.account.id, result.account.email, 'verify', resolvePublicAppUrl(req));
      res.status(201).json({
        status: 'registered',
        account: result.account,
        token: result.token,
        email: {
          smtpConfigured: isMailConfigured(),
          mailed: verify.mailed,
          verifyUrl: verify.verifyUrl,
        },
        hint: result.account.emailVerified
          ? 'First account is admin and already verified. Store the nxu_* token.'
          : verify.mailed
            ? 'Check your email to verify this account.'
            : 'SMTP is not configured, so a verification email was not sent.',
      });
    } catch (err: any) {
      const legalMissing = Array.isArray(err?.issues)
        ? err.issues.some((issue: { path?: (string | number)[] }) => issue.path?.includes('acceptLegal'))
        : false;
      if (legalMissing) {
        return res.status(400).json({
          error: 'Agree to the Terms and Privacy Policy to register',
          code: 'NEXUS_LEGAL_REQUIRED',
        });
      }
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/auth/login', (req, res) => {
    try {
      const parsed = accountAuthSchema.parse(req.body);
      const result = loginAccount(parsed);
      if (result.ok === false) {
        return res.status(401).json({ error: 'Invalid email or password', code: 'NEXUS_RE_AUTHENTICATE' });
      }
      res.json({ status: 'ok', account: result.account, token: result.token });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/auth/me', requireRole('operator'), (req, res) => {
    if (req.nexus?.accountId) {
      const account = getAccountById(req.nexus.accountId);
      if (!account) return res.status(401).json({ error: 'Account not found' });
      return res.json({
        kind: 'account',
        account: {
          id: account.id,
          email: account.email,
          role: account.role,
          planId: account.role === 'admin' ? 'unlimited' : account.planId,
          workspaceId: account.workspaceId,
          emailVerified: account.emailVerified,
          createdAt: account.createdAt,
        },
        plan: getPlan(account.role === 'admin' ? 'unlimited' : account.planId),
        billing: {
          stripeConfigured: isStripeConfigured(),
          stripeCustomerId: account.stripeCustomerId,
        },
        email: { smtpConfigured: isMailConfigured() },
      });
    }
    res.json({
      kind: 'operator_key',
      account: {
        id: 'operator',
        email: null,
        role: 'admin',
        planId: 'unlimited',
        workspaceId: req.nexus?.workspaceId || 'default',
        emailVerified: true,
      },
      plan: getPlan('unlimited'),
      billing: { stripeConfigured: isStripeConfigured(), stripeCustomerId: null },
      email: { smtpConfigured: isMailConfigured() },
    });
  });

  router.post('/auth/verify', (req, res) => {
    try {
      const token = z.string().min(10).max(200).parse(req.body?.token);
      const account = consumeAuthToken(token, 'verify');
      if (!account) {
        return res.status(400).json({ error: 'Invalid or expired verify token', code: 'NEXUS_VERIFY_INVALID' });
      }
      const updated = markEmailVerified(account.id);
      res.json({ status: 'verified', account: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/auth/forgot', async (req, res) => {
    try {
      const email = z.string().email().max(200).parse(req.body?.email).toLowerCase();
      const account = findAccountByEmail(email);
      if (account) {
        await issueEmailLink(account.id, account.email, 'reset', resolvePublicAppUrl(req));
      }
      res.json({
        status: 'accepted',
        smtpConfigured: isMailConfigured(),
        hint: isMailConfigured()
          ? 'If that email is registered, a reset link was sent.'
          : 'Password reset email cannot be sent until SMTP is configured.',
      });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/auth/reset', (req, res) => {
    try {
      const parsed = z
        .object({
          token: z.string().min(10).max(200),
          password: z.string().min(8).max(200),
        })
        .parse(req.body);
      const account = consumeAuthToken(parsed.token, 'reset');
      if (!account) {
        return res.status(400).json({ error: 'Invalid or expired reset token', code: 'NEXUS_RESET_INVALID' });
      }
      if (!setAccountPassword(account.id, parsed.password)) {
        return res.status(400).json({ error: 'Password update failed' });
      }
      res.json({ status: 'reset', email: account.email });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/auth/resend-verify', requireRole('operator'), async (req, res) => {
    if (!req.nexus?.accountId) {
      return res.status(400).json({ error: 'Account session required' });
    }
    const account = getAccountById(req.nexus.accountId);
    if (!account) return res.status(401).json({ error: 'Account not found' });
    if (account.emailVerified) return res.json({ status: 'already_verified' });
    const issued = await issueEmailLink(account.id, account.email, 'verify', resolvePublicAppUrl(req));
    res.json({
      status: 'sent',
      mailed: issued.mailed,
      verifyUrl: issued.verifyUrl,
    });
  });

  router.post('/auth/password', requireRole('operator'), (req, res) => {
    if (!req.nexus?.accountId) {
      return res.status(400).json({ error: 'Account session required' });
    }
    try {
      const parsed = z
        .object({
          currentPassword: z.string().min(1).max(200),
          newPassword: z.string().min(8).max(200),
        })
        .parse(req.body);
      if (!checkAccountPassword(req.nexus.accountId, parsed.currentPassword)) {
        return res.status(401).json({ error: 'Current password is wrong', code: 'NEXUS_RE_AUTHENTICATE' });
      }
      setAccountPassword(req.nexus.accountId, parsed.newPassword);
      res.json({ status: 'updated' });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/billing/checkout', requireRole('operator'), async (req, res) => {
    if (!req.nexus?.accountId) {
      return res.status(400).json({
        error: 'Checkout requires a registered account session (nxu_*)',
        code: 'NEXUS_ACCOUNT_REQUIRED',
      });
    }
    const account = getAccountById(req.nexus.accountId);
    if (!account) return res.status(401).json({ error: 'Account not found' });
    if (account.role === 'admin') {
      return res.status(400).json({ error: 'Admin accounts are not billed' });
    }
    try {
      const planId = z.string().parse(req.body?.planId);
      if (!isPaidPlanId(planId)) {
        return res.status(400).json({ error: 'Choose starter, pro, or business' });
      }
      const created = await createCheckoutSession({
        accountId: account.id,
        email: account.email,
        planId,
        appUrl: resolvePublicAppUrl(req),
        customerId: account.stripeCustomerId,
      });
      if (created.ok === false) {
        return res.status(503).json({
          error: created.error || 'Checkout is not available',
          code: 'NEXUS_BILLING_UNCONFIGURED',
          stripeConfigured: isStripeConfigured(),
        });
      }
      res.json({ status: 'checkout', url: created.url, planId });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/accounts', requireRole('operator'), requireAdmin(), (_req, res) => {
    res.json({ accounts: listAccounts() });
  });

  router.patch('/accounts/:id/plan', requireRole('operator'), requireAdmin(), (req, res) => {
    try {
      const planId = z
        .enum(['free', 'starter', 'pro', 'business', 'unlimited'])
        .parse(req.body?.planId);
      const updated = setAccountPlan(req.params.id, planId as PlanId);
      if (!updated) return res.status(404).json({ error: 'Account not found' });
      res.json({ status: 'updated', account: updated, plan: getPlan(updated.planId) });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  /** Public: geo/IP-based UI locale suggestion (CN/HK/TW/MO → zh, else en). */
  router.get('/locale', (req, res) => {
    const resolved = resolveLocaleFromRequest(req);
    res.json(resolved);
  });

  /** Public agent directory — opt-in listings only (no tokens). */
  router.get('/directory', (_req, res) => {
    res.json({
      agents: listPublicAgents(),
      hub: 'https://silinex.xyz',
      hint: 'Operators opt agents in via PATCH /api/agents/:id { "listed": true }.',
    });
  });

  /** Public signal feed for AI crawlers / agents. */
  router.get('/feed', (req, res) => {
    const limit = Number(req.query.limit || 50);
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    let items = listFeedItems({
      limit: Math.min(limit * 2, 200),
      since,
      workspaceId: feedWorkspace(req),
    });
    if (status === 'crawled' || status === 'unseen') {
      items = items.filter((i) => i.indexing.status === status).slice(0, limit);
    } else {
      items = items.slice(0, limit);
    }
    res.json({
      items,
      count: items.length,
      indexingNote: INDEXING_NOTE,
      formats: {
        html: '/feed',
        json: '/feed.json',
        atom: '/feed.xml',
        itemJson: '/feed/{slug}.json',
        itemMd: '/feed/{slug}.md',
        api: '/api/feed',
      },
      audience: {
        human: 'Use /console/feed to publish; badges show crawl observation.',
        agent: 'Poll /api/feed or MCP nexus_list_feed; watch indexing.status and FEED_CRAWLED audit events.',
      },
    });
  });

  router.get('/feed/:slug', (req, res) => {
    maybeRecordCrawl(req, req.params.slug);
    const item = getFeedItemBySlug(req.params.slug, feedWorkspace(req));
    if (!item) return res.status(404).json({ error: 'Feed item not found' });
    res.json(item);
  });

  router.post('/feed', requireRole('operator'), requireFeature('feedPublish'), (req, res) => {
    try {
      const parsed = feedPublishSchema.parse(req.body);
      const result = upsertFeedItem(parsed, tenantWs(req));
      if (!result.ok) return res.status(400).json({ error: 'Invalid feed item' });
      res.status(201).json({ status: 'published', item: result.item });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.delete('/feed/:slug', requireRole('operator'), (req, res) => {
    try {
      const slug = z
        .string()
        .min(2)
        .max(120)
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/)
        .parse(req.params.slug);
      if (!deleteFeedItem(slug, tenantWs(req))) {
        return res.status(404).json({ error: 'Feed item not found' });
      }
      res.json({ status: 'deleted', slug });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  /** GEO module: multi-site content sync surfaces. */
  router.get('/sites', (req, res) => {
    const sites = listSites(sitesListWorkspace(req));
    res.json({
      sites,
      count: sites.length,
      audience: {
        human: 'Register sites in /console/sites; sync pages via MCP or POST /api/sites/:slug/content.',
        agent:
          'Use MCP nexus_list_sites / nexus_upsert_content / nexus_pull_sitemap / nexus_geo_status. Crawl observation ≠ guaranteed inclusion.',
      },
    });
  });

  router.post('/sites', requireRole('operator'), requireFeature('geoSites'), (req, res) => {
    try {
      const parsed = siteUpsertSchema.parse(req.body);
      const plan = resolvePlan(planIdFromRequest(req));
      const existing = getSiteBySlug(parsed.slug, tenantWs(req));
      if (!existing && countSites(tenantWs(req)) >= plan.maxSites) {
        return res.status(402).json({
          error: 'Plan site quota exceeded',
          plan: plan.id,
          maxSites: plan.maxSites,
          code: 'NEXUS_PLAN_LIMIT',
        });
      }
      const result = upsertSite(parsed, tenantWs(req));
      if (result.ok === false) {
        if (result.code === 'slug_taken') {
          return res.status(409).json({
            error: 'Site slug is already taken',
            code: 'NEXUS_SLUG_TAKEN',
          });
        }
        return res.status(400).json({ error: 'Invalid site' });
      }
      res.status(201).json({ status: 'upserted', site: result.site });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/sites/:siteSlug', (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      const site = getSiteBySlug(siteSlug);
      if (!site) return res.status(404).json({ error: 'Site not found' });
      const limit = Number(req.query.limit || 50);
      const items = listSiteContent(siteSlug, { limit });
      res.json({
        site,
        items,
        formats: {
          llmsTxt: `/sites/${siteSlug}/llms.txt`,
          feedJson: `/sites/${siteSlug}/feed.json`,
          contentMd: `/sites/${siteSlug}/content/{slug}.md`,
          api: `/api/sites/${siteSlug}`,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.delete('/sites/:siteSlug', requireRole('operator'), (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      if (!deleteSite(siteSlug, tenantWs(req))) return res.status(404).json({ error: 'Site not found' });
      res.json({ status: 'deleted', slug: siteSlug });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/sites/:siteSlug/geo', (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      const status = siteGeoStatus(siteSlug, resolvePublicAppUrl(req));
      if (!status) return res.status(404).json({ error: 'Site not found' });
      res.json(status);
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post(
    '/sites/:siteSlug/pull',
    requireRole('operator'),
    requireFeature('geoSites'),
    async (req, res) => {
      try {
        const siteSlug = siteSlugParam.parse(req.params.siteSlug);
        const parsed = sitePullSchema.parse(req.body || {});
        if (!getSiteBySlug(siteSlug, tenantWs(req))) {
          return res.status(404).json({ error: 'Site not found' });
        }
        const pulled = await pullSiteFromSitemap({
          slug: siteSlug,
          workspaceId: tenantWs(req),
          sitemapUrl: parsed.sitemapUrl,
        });
        const status = siteGeoStatus(siteSlug, resolvePublicAppUrl(req), tenantWs(req));
        res.json({
          status: pulled.ok ? 'pulled' : 'pull_failed',
          pull: pulled,
          geo: status,
        });
      } catch (err: any) {
        res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
      }
    }
  );

  router.get('/sites/:siteSlug/content', (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      if (!getSiteBySlug(siteSlug)) return res.status(404).json({ error: 'Site not found' });
      const limit = Number(req.query.limit || 50);
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      let items = listSiteContent(siteSlug, { limit: Math.min(limit * 2, 200) });
      if (status === 'crawled' || status === 'unseen') {
        items = items.filter((i) => i.indexing.status === status).slice(0, limit);
      } else {
        items = items.slice(0, limit);
      }
      res.json({ items, count: items.length, indexingNote: INDEXING_NOTE });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post(
    '/sites/:siteSlug/content',
    requireRole('operator'),
    requireFeature('geoSites'),
    (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      const parsed = siteContentUpsertSchema.parse(req.body);
      const result = upsertSiteContent(siteSlug, parsed, tenantWs(req));
      if (result.ok === false) {
        if (result.code === 'site_not_found') {
          return res.status(404).json({ error: 'Site not found' });
        }
        return res.status(400).json({ error: 'Invalid content' });
      }
      res.status(201).json({ status: 'upserted', item: result.item });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/sites/:siteSlug/content/:slug', (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      const slug = z
        .string()
        .min(2)
        .max(120)
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/)
        .parse(req.params.slug);
      maybeRecordSiteCrawl(req, siteSlug, slug);
      const item = getSiteContent(siteSlug, slug);
      if (!item) return res.status(404).json({ error: 'Content not found' });
      res.json(item);
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.delete('/sites/:siteSlug/content/:slug', requireRole('operator'), (req, res) => {
    try {
      const siteSlug = siteSlugParam.parse(req.params.siteSlug);
      const slug = z
        .string()
        .min(2)
        .max(120)
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/)
        .parse(req.params.slug);
      if (!deleteSiteContent(siteSlug, slug, tenantWs(req))) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.json({ status: 'deleted', siteSlug, slug });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/agents', requireRole('operator'), (req, res) => {
    res.json({ agents: listAgentSummaries(tenantWs(req)) });
  });

  router.post('/agents/register', requireRole('operator'), (req, res) => {
    try {
      const { agentId, label, rotate } = registerAgentSchema.parse(req.body);
      const result = registerAgentToken(
        agentId,
        {
          label,
          rotate,
          planId: planIdFromRequest(req),
        },
        tenantWs(req)
      );
      if (result.ok === false) {
        if (result.code === 'capacity') {
          return res.status(429).json({ error: 'Maximum agent capacity reached.' });
        }
        if (result.code === 'plan_limit') {
          const plan = resolvePlan(planIdFromRequest(req));
          return res.status(402).json({
            error: 'Plan agent limit reached',
            plan: plan.id,
            maxAgents: plan.maxAgents,
            code: 'NEXUS_PLAN_LIMIT',
          });
        }
        return res.status(409).json({
          error: 'Agent already registered',
          message: 'Pass { "rotate": true } to mint a new token (invalidates the old one).',
          agentId,
        });
      }
      res.json({
        status: 'registered',
        agentId,
        token: result.token,
        rotated: result.rotated,
        warning: 'Store this token now. It is shown once and only a hash is persisted.',
      });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.patch('/agents/:agentId', requireRole('operator'), (req, res) => {
    try {
      const agentId = idSchema.parse(req.params.agentId);
      const patch = patchAgentSchema.parse(req.body);
      if (patch.listed === true) {
        if (
          req.nexus?.accountRole !== 'admin' &&
          !planHasFeature(req.nexus?.planId || 'free', 'directoryList')
        ) {
          return res.status(402).json({
            error: 'Plan upgrade required',
            feature: 'directoryList',
            plan: req.nexus?.planId || 'free',
            code: 'NEXUS_PLAN_FEATURE',
          });
        }
      }
      if (!updateAgentProfile(agentId, patch, tenantWs(req))) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json({ status: 'updated', agentId, ...patch });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/agents/:agentId/revoke', requireRole('operator'), (req, res) => {
    try {
      const agentId = idSchema.parse(req.params.agentId);
      if (!revokeAgentToken(agentId, tenantWs(req))) {
        return res.status(404).json({ error: 'No token found for agent' });
      }
      res.json({ status: 'revoked', agentId });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/dashboard/system-info', requireRole('operator'), (req, res) => {
    res.json(dashboardStats(tenantWs(req)));
  });

  router.get('/dashboard/activity-logs', requireRole('operator'), (req, res) => {
    res.json(getEventLogs(tenantWs(req)));
  });

  router.get('/dashboard/task-queue', requireRole('operator'), (req, res) => {
    res.json(getTaskQueue(tenantWs(req)));
  });

  router.get('/dashboard/memory-vault', requireRole('operator'), (req, res) => {
    res.json(getMemoryStore(tenantWs(req)));
  });

  router.get('/dashboard/agents', requireRole('operator'), (req, res) => {
    res.json({ agents: listAgentSummaries(tenantWs(req)) });
  });

  /** Usage metering — workspace scoped. Stripe checkout is not wired yet. */
  router.get('/dashboard/usage', requireRole('operator'), (req, res) => {
    res.json(usageSnapshot(tenantWs(req)));
  });

  router.get('/dashboard/snapshot', requireRole('operator'), (req, res) => {
    const ws = tenantWs(req);
    res.json({
      stats: dashboardStats(ws),
      usage: usageSnapshot(ws),
      logs: getEventLogs(ws),
      tasks: getTaskQueue(ws),
      memory: getMemoryStore(ws),
      agents: listAgentSummaries(ws),
      worker: workerStatus(),
      at: new Date().toISOString(),
    });
  });

  // Future: Server-Sent Events for live dashboard (polling remains default).
  // router.get('/dashboard/events', requireRole('operator'), sseHandler);

  const handleMemorySearch = (req: Request, res: Response, raw: unknown) => {
    try {
      const parsed = searchMemoryQuerySchema.parse(raw);
      let agentId = parsed.agentId;
      if (req.nexus?.role === 'agent') {
        const bound = req.nexus.agentId;
        if (!bound) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Agent token is not bound to an agentId.',
            code: 'NEXUS_AGENT_SCOPE',
          });
        }
        if (agentId && agentId !== bound) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Agents may only search their own memory vault.',
            code: 'NEXUS_AGENT_SCOPE',
          });
        }
        agentId = bound;
      }
      const result = searchAgentMemory(parsed.q, {
        workspaceId: tenantWs(req),
        agentId,
        limit: parsed.limit,
      });
      incrementUsage('memory_searches', 1, tenantWs(req));
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  };

  router.get('/memory/search', (req, res) => {
    handleMemorySearch(req, res, {
      q: req.query.q,
      limit: req.query.limit,
      agentId: req.query.agentId,
    });
  });

  router.post('/memory/search', (req, res) => {
    handleMemorySearch(req, res, req.body);
  });

  router.post('/agent/:agentId/memory', (req, res) => {
    try {
      const agentId = idSchema.parse(req.params.agentId);
      if (!assertAgentMemoryAccess(req, agentId, res)) return;
      const data = memoryDataSchema.parse(req.body);
      const result = writeAgentMemory(agentId, data, tenantWs(req));
      if (result.ok === false) {
        if (result.code === 'plan_limit') {
          const plan = resolvePlan(planIdFromRequest(req));
          return res.status(402).json({
            error: 'Plan memory quota exceeded',
            plan: plan.id,
            maxMemoryBytes: plan.maxMemoryBytes,
            code: 'NEXUS_PLAN_LIMIT',
          });
        }
        return res.status(429).json({ error: 'Maximum agent capacity reached in memory vault.' });
      }
      res.json({ status: 'success', storedKeys: result.storedKeys });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/agent/:agentId/memory/:key?', (req, res) => {
    try {
      const agentId = idSchema.parse(req.params.agentId);
      if (!assertAgentMemoryAccess(req, agentId, res)) return;
      const key = req.params.key ? memoryKeySchema.parse(req.params.key) : undefined;
      const memory = readAgentMemory(agentId, tenantWs(req));
      if (key) {
        res.json({ [key]: memory[key] ?? null });
      } else {
        res.json(memory);
      }
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.delete('/agent/:agentId/memory', (req, res) => {
    try {
      const agentId = idSchema.parse(req.params.agentId);
      if (!assertAgentMemoryAccess(req, agentId, res)) return;
      if (!wipeAgentMemory(agentId, tenantWs(req))) {
        return res.status(404).json({ error: 'Agent memory not found' });
      }
      res.json({ status: 'wiped', agentId });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/tasks', (req, res) => {
    try {
      const parsed = createTaskSchema.parse(req.body);
      let creatorId = parsed.creatorId;
      if (req.nexus?.role === 'agent') {
        creatorId = req.nexus.agentId;
      } else if (!creatorId) {
        return res.status(400).json({ error: 'creatorId is required for operator-created tasks' });
      }
      const created = createTask({
        creatorId: creatorId!,
        type: parsed.type,
        payload: parsed.payload,
        workspaceId: tenantWs(req),
      });
      if ('ok' in created) {
        const plan = resolvePlan(planIdFromRequest(req));
        return res.status(402).json({
          error: 'Plan daily task quota exceeded',
          plan: plan.id,
          maxTasksPerDay: plan.maxTasksPerDay,
          code: 'NEXUS_PLAN_LIMIT',
        });
      }
      res.json({ status: 'created', taskId: created.id });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.get('/tasks/open', (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      if (type) memoryKeySchema.parse(type);
      res.json(listOpenTasks(type, tenantWs(req)));
    } catch {
      res.status(400).json({ error: 'Validation failed' });
    }
  });

  router.get('/tasks/:taskId', (req, res) => {
    try {
      const taskId = idSchema.parse(req.params.taskId);
      const task = findTask(taskId, tenantWs(req));
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/tasks/:taskId/accept', (req, res) => {
    try {
      const taskId = idSchema.parse(req.params.taskId);
      const parsed = acceptTaskSchema.parse(req.body || {});
      let agentId = parsed.agentId;
      if (req.nexus?.role === 'agent') agentId = req.nexus.agentId;
      if (!agentId) return res.status(400).json({ error: 'agentId is required' });

      const result = claimOpenTask(taskId, agentId, tenantWs(req));
      if (result.ok === false) {
        if (result.code === 'not_found') return res.status(404).json({ error: 'Task not found' });
        return res.status(409).json({ error: 'Task is no longer open', code: 'TASK_CLAIM_CONFLICT' });
      }
      res.json({ status: 'assigned', task: result.task });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/tasks/:taskId/complete', (req, res) => {
    try {
      const taskId = idSchema.parse(req.params.taskId);
      const parsed = completeTaskSchema.parse(req.body || {});
      const task = findTask(taskId, tenantWs(req));
      if (!task) return res.status(404).json({ error: 'Task not found' });

      let agentId = parsed.agentId;
      if (req.nexus?.role === 'agent') {
        agentId = req.nexus.agentId;
        if (task.assignedTo !== agentId) {
          return res.status(403).json({ error: 'Task not assigned to you' });
        }
      } else {
        if (!agentId) agentId = task.assignedTo;
        if (!agentId) return res.status(400).json({ error: 'agentId is required' });
        if (task.assignedTo && task.assignedTo !== agentId) {
          return res.status(403).json({ error: 'Task not assigned to that agent' });
        }
      }

      const result = completeTask(taskId, agentId!, parsed.status, parsed.result, tenantWs(req));
      if (result.ok === false) {
        if (result.code === 'not_found') return res.status(404).json({ error: 'Task not found' });
        return res.status(403).json({ error: 'Task not assigned to you' });
      }
      res.json({ status: 'updated', task: result.task });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/tasks/:taskId/fail', requireRole('operator'), (req, res) => {
    try {
      const taskId = idSchema.parse(req.params.taskId);
      const { lastError } = failTaskSchema.parse(req.body || {});
      const result = failTask(taskId, lastError, tenantWs(req));
      if (!result.ok) return res.status(404).json({ error: 'Task not found' });
      res.json({ status: 'failed', task: result.task });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  router.post('/tasks/:taskId/reopen', requireRole('operator'), (req, res) => {
    try {
      const taskId = idSchema.parse(req.params.taskId);
      const result = reopenTask(taskId, tenantWs(req));
      if (result.ok === false) {
        if (result.code === 'not_found') return res.status(404).json({ error: 'Task not found' });
        return res.status(409).json({
          error: 'Task cannot be reopened',
          message: 'Only failed or processing tasks can be reopened.',
        });
      }
      res.json({ status: 'reopened', task: result.task });
    } catch (err: any) {
      res.status(400).json({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  return router;
}

export function apiErrorHandler(err: any, _req: Request, res: Response, _next: () => void) {
  logJson('error', 'Unhandled API error', { error: err?.message, stack: err?.stack });
  res.status(500).json({ error: 'Internal Server Error' });
}
