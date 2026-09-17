import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiJson, getOperatorKey, setOperatorKey } from '../lib/api';
import { useToast } from '../components/Toast';
import { useI18n, useT } from '../i18n/I18nProvider';
import { Skeleton } from '../components/EmptyState';
import { SITE_LEGAL } from '../legal/site';
import { formatListPrice } from '../lib/planPrice';
import type { Locale, Messages } from '../i18n/messages';

type MeResponse = {
  kind: 'account' | 'operator_key';
  account: {
    id: string;
    email: string | null;
    role: 'admin' | 'user';
    planId: string;
    workspaceId: string;
    emailVerified?: boolean;
    createdAt?: string;
  };
  plan: {
    id: string;
    name: string;
    tagline: string;
    priceMonthlyUsd: number | null;
    priceMonthlyCny?: number | null;
    bullets: string[];
    maxAgents: number;
    maxSites: number;
    features: Record<string, boolean>;
  };
  billing?: { stripeConfigured?: boolean; stripeCustomerId?: string | null };
  email?: { smtpConfigured?: boolean };
};

type AccountRow = {
  id: string;
  email: string;
  role: string;
  planId: string;
  createdAt: string;
};

function formatAccountPlanPrice(
  locale: Locale,
  pricing: Messages['pricing'],
  plan: MeResponse['plan']
): string {
  const labeled = formatListPrice(locale, plan.priceMonthlyUsd, plan.priceMonthlyCny ?? null);
  if (labeled) return ` · ${labeled}${pricing.perMonth}`;
  if (plan.priceMonthlyUsd === 0 || plan.priceMonthlyCny === 0) return ` · ${pricing.free}`;
  return '';
}

export function ConsoleAccountPage() {
  const t = useT();
  const { locale } = useI18n();
  const { push } = useToast();
  const [params] = useSearchParams();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<MeResponse>('/api/auth/me');
      setMe(data);
      if (data.account.role === 'admin') {
        const list = await apiJson<{ accounts: AccountRow[] }>('/api/accounts');
        setAccounts(list.accounts || []);
      } else {
        setAccounts([]);
      }
    } catch (e: any) {
      push(e.message || t.common.cannotReach, 'error');
    } finally {
      setLoading(false);
    }
  }, [push, t.common.cannotReach]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      push(t.account.checkoutOk, 'success');
    }
  }, [params, push, t.account.checkoutOk]);

  const registerOrLogin = async (mode: 'register' | 'login') => {
    setBusy(true);
    try {
      const data = await apiJson<{ token: string; account: AccountRow }>(
        mode === 'register' ? '/api/auth/register' : '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      setOperatorKey(data.token);
      push(mode === 'register' ? t.account.registered : t.account.loggedIn, 'success');
      setPassword('');
      await refresh();
    } catch (e: any) {
      push(e.message || 'Auth failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const upgrade = async (accountId: string, planId: string) => {
    try {
      await apiJson(`/api/accounts/${encodeURIComponent(accountId)}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ planId }),
      });
      push(t.account.planUpdated, 'success');
      await refresh();
    } catch (e: any) {
      push(e.message || 'Upgrade failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foundry-100">
          {t.account.title}
        </h1>
        <p className="text-sm text-foundry-500">
          {t.account.hint}{' '}
          <Link to="/pricing" className="text-teal-glow hover:underline">
            /pricing
          </Link>
        </p>
      </div>

      <section className="nx-card p-4 md:p-5">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-teal-glow">
          {t.account.sessionTitle}
        </h2>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : me ? (
          <div className="space-y-2 font-mono text-sm text-foundry-300">
            <p>
              {t.account.kind}: <span className="text-teal-glow">{me.kind}</span>
            </p>
            <p>
              {t.account.role}: <span className="text-foundry-100">{me.account.role}</span>
              {me.account.email ? ` · ${me.account.email}` : ''}
            </p>
            <p>
              {t.account.plan}:{' '}
              <span className="text-teal-glow">
                {me.plan.name} ({me.plan.id})
                {formatAccountPlanPrice(locale, t.pricing, me.plan)}
              </span>
            </p>
            <p>
              {t.account.workspace}:{' '}
              <span className="text-foundry-100">{me.account.workspaceId}</span>
            </p>
            {me.kind === 'account' ? (
              <p>
                {t.account.verified}:{' '}
                <span className={me.account.emailVerified ? 'text-teal-glow' : 'text-rose-300'}>
                  {me.account.emailVerified ? t.account.verifiedYes : t.account.verifiedNo}
                </span>
                {!me.account.emailVerified ? (
                  <button
                    type="button"
                    className="ml-2 text-xs text-teal-glow hover:underline"
                    onClick={async () => {
                      try {
                        const data = await apiJson<{ mailed?: boolean }>(
                          '/api/auth/resend-verify',
                          { method: 'POST', body: '{}' }
                        );
                        push(
                          data.mailed ? t.account.verifySent : t.account.verifyLink,
                          data.mailed ? 'success' : 'info'
                        );
                      } catch (e: any) {
                        push(e.message || t.common.cannotReach, 'error');
                      }
                    }}
                  >
                    {t.account.resendVerify}
                  </button>
                ) : null}
              </p>
            ) : null}
            <p className="text-xs text-foundry-500">{t.account.mintHint}</p>
            <ul className="mt-3 space-y-1 text-xs text-foundry-500">
              {me.plan.bullets.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
            <p className="pt-2 text-[11px] text-foundry-600">
              token prefix:{' '}
              {getOperatorKey().startsWith('nxu_')
                ? 'nxu_*'
                : getOperatorKey().startsWith('nxo_')
                  ? 'nxo_*'
                  : '—'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-foundry-500">{t.account.noSession}</p>
        )}
      </section>

      <section className="nx-card p-4 md:p-5">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-teal-glow">
          {t.account.authTitle}
        </h2>
        <p className="mb-3 text-xs text-foundry-500">{t.account.authHint}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.account.emailPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.account.passwordPh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => registerOrLogin('login')}
            className="rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950 disabled:opacity-50"
          >
            {t.account.login}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => registerOrLogin('register')}
            className="rounded-sm border border-white/15 px-4 py-2 text-sm text-foundry-100 hover:border-teal-glow/40 disabled:opacity-50"
          >
            {t.account.register}
          </button>
        </div>
      </section>

      {me?.kind === 'account' ? (
        <section className="nx-card p-4 md:p-5">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.account.passwordTitle}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t.account.currentPasswordPh}
              className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.account.newPasswordPh}
              className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
            />
          </div>
          <button
            type="button"
            className="mt-3 rounded-sm border border-white/15 px-4 py-2 text-sm text-foundry-100 hover:border-teal-glow/40"
            onClick={async () => {
              try {
                await apiJson('/api/auth/password', {
                  method: 'POST',
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                setCurrentPassword('');
                setNewPassword('');
                push(t.account.passwordUpdated, 'success');
              } catch (e: any) {
                push(e.message || t.account.passwordFailed, 'error');
              }
            }}
          >
            {t.account.changePassword}
          </button>
        </section>
      ) : null}

      {me?.kind === 'account' && me.account.role !== 'admin' ? (
        <section className="nx-card p-4 md:p-5">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
            {t.account.upgradeTitle}
          </h2>
          <p className="mb-3 text-xs text-foundry-500">
            {me.billing?.stripeConfigured ? t.account.upgradeStripe : t.account.upgradeManual}
          </p>
          {me.billing?.stripeConfigured ? (
            <div className="flex flex-wrap gap-2">
              {['starter', 'pro', 'business'].map((planId) => (
                <button
                  key={planId}
                  type="button"
                  className="rounded-sm border border-white/15 px-3 py-1.5 font-mono text-xs text-foundry-100 hover:border-teal-glow/40"
                  onClick={async () => {
                    try {
                      const data = await apiJson<{ url?: string }>('/api/billing/checkout', {
                        method: 'POST',
                        body: JSON.stringify({ planId }),
                      });
                      if (data.url) {
                        window.location.href = data.url;
                        return;
                      }
                      push(t.account.upgradeManual, 'info');
                    } catch (e: any) {
                      push(e.message || t.account.upgradeManual, 'error');
                    }
                  }}
                >
                  {planId}
                </button>
              ))}
            </div>
          ) : (
            <a
              className="nx-btn nx-btn-primary w-fit text-sm"
              href={`mailto:${SITE_LEGAL.contactEmail}?subject=${encodeURIComponent('Silicon Nexus plan upgrade')}&body=${encodeURIComponent(`Account: ${me.account.email || ''}\nPlan: `)}`}
            >
              {t.pricing.ctaPaid}
            </a>
          )}
        </section>
      ) : null}

      {me?.account.role === 'admin' ? (
        <section className="nx-panel">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">
              {t.account.adminTitle}
            </h2>
            <p className="mt-1 text-xs text-foundry-500">{t.account.adminHint}</p>
          </div>
          {accounts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-foundry-500">{t.account.noAccounts}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <div className="font-mono text-sm text-foundry-100">{a.email}</div>
                    <p className="font-mono text-[11px] text-foundry-500">
                      {a.role} · {a.planId}
                    </p>
                  </div>
                  <select
                    defaultValue={a.planId}
                    onChange={(e) => upgrade(a.id, e.target.value)}
                    className="rounded border border-white/10 bg-foundry-950 px-2 py-1 font-mono text-xs"
                  >
                    {['free', 'starter', 'pro', 'business', 'unlimited'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
