import Stripe from 'stripe';
import type { Request, Response } from 'express';
import { getPlan } from './plans.ts';
import { logJson } from './log.ts';
import {
  getAccountById,
  getAccountByStripeCustomerId,
  setAccountPlan,
  setAccountStripeIds,
} from './store.ts';
import type { PlanId } from './types.ts';

const PAID_PLANS = ['starter', 'pro', 'business'] as const;
export type PaidPlanId = (typeof PAID_PLANS)[number];

export function isStripeConfigured(): boolean {
  return Boolean((process.env.STRIPE_SECRET_KEY || '').trim());
}

export function isStripeWebhookConfigured(): boolean {
  return isStripeConfigured() && Boolean((process.env.STRIPE_WEBHOOK_SECRET || '').trim());
}

export function isPaidPlanId(planId: string): planId is PaidPlanId {
  return (PAID_PLANS as readonly string[]).includes(planId);
}

function stripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
}

export async function createCheckoutSession(input: {
  accountId: string;
  email: string;
  planId: PaidPlanId;
  appUrl: string;
  customerId?: string | null;
}): Promise<{ ok: true; url: string } | { ok: false; code: 'unconfigured' | 'stripe_error'; error?: string }> {
  if (!isStripeConfigured()) return { ok: false, code: 'unconfigured' };
  const plan = getPlan(input.planId);
  const amount = Math.round((plan.priceMonthlyUsd || 0) * 100);
  if (amount <= 0) return { ok: false, code: 'stripe_error', error: 'Plan is not billable' };
  const appUrl = input.appUrl.replace(/\/$/, '');
  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: 'subscription',
      success_url: `${appUrl}/console/account?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      client_reference_id: input.accountId,
      customer: input.customerId || undefined,
      customer_email: input.customerId ? undefined : input.email,
      metadata: { accountId: input.accountId, planId: input.planId },
      subscription_data: {
        metadata: { accountId: input.accountId, planId: input.planId },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            recurring: { interval: 'month' },
            product_data: {
              name: `Silicon Nexus ${plan.name}`,
              description: plan.tagline,
            },
          },
        },
      ],
    });
    if (!session.url) return { ok: false, code: 'stripe_error', error: 'Checkout URL missing' };
    return { ok: true, url: session.url };
  } catch (error: any) {
    logJson('error', 'Stripe checkout failed', { error: String(error?.message || error) });
    return { ok: false, code: 'stripe_error', error: String(error?.message || error) };
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  if (!isStripeWebhookConfigured()) {
    return res.status(503).json({
      error: 'Stripe webhook is not configured',
      code: 'NEXUS_BILLING_UNCONFIGURED',
    });
  }
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe-Signature' });
  }
  const raw = req.body;
  if (!Buffer.isBuffer(raw)) {
    return res.status(400).json({ error: 'Webhook requires the raw request body' });
  }
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      raw,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!.trim()
    );
  } catch (error: any) {
    return res.status(400).json({ error: 'Invalid Stripe signature' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await applyCheckoutSession(session);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await applySubscriptionCanceled(sub);
    }
    res.json({ received: true, type: event.type });
  } catch (error: any) {
    logJson('error', 'Stripe webhook handler failed', { error: String(error?.message || error) });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function applyCheckoutSession(session: Stripe.Checkout.Session) {
  const accountId =
    session.metadata?.accountId || session.client_reference_id || '';
  const planId = session.metadata?.planId || '';
  if (!accountId || !isPaidPlanId(planId)) return;
  const account = getAccountById(accountId);
  if (!account || account.role === 'admin') return;
  setAccountPlan(accountId, planId);
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  setAccountStripeIds(accountId, customerId || null, subscriptionId || null);
  logJson('info', 'Stripe checkout completed', { accountId, planId });
}

async function applySubscriptionCanceled(sub: Stripe.Subscription) {
  const accountId = sub.metadata?.accountId;
  const account = accountId
    ? getAccountById(accountId)
    : getAccountByStripeCustomerId(typeof sub.customer === 'string' ? sub.customer : sub.customer.id);
  if (!account || account.role === 'admin') return;
  setAccountPlan(account.id, 'free' as PlanId);
  setAccountStripeIds(account.id, account.stripeCustomerId, null);
  logJson('info', 'Stripe subscription canceled', { accountId: account.id });
}
