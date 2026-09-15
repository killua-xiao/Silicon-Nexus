import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { apiJson, setOperatorKey } from '../lib/api';
import { useT } from '../i18n/I18nProvider';
import { cn } from '../lib/cn';

export function AuthGate({
  open,
  error,
  onAuthenticated,
}: {
  open: boolean;
  error?: string;
  onAuthenticated: (key: string) => void;
}) {
  const t = useT();
  const [tab, setTab] = useState<'key' | 'account'>('key');
  const [value, setValue] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotHint, setForgotHint] = useState('');
  const [acceptLegal, setAcceptLegal] = useState(false);

  if (!open) return null;

  const submitAccount = async (mode: 'login' | 'register') => {
    if (mode === 'register' && !acceptLegal) {
      setLocalError(t.auth.acceptMust);
      return;
    }
    setBusy(true);
    setLocalError('');
    try {
      const data = await apiJson<{ token: string }>(
        mode === 'login' ? '/api/auth/login' : '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(
            mode === 'register' ? { email, password, acceptLegal: true } : { email, password }
          ),
        }
      );
      setOperatorKey(data.token);
      onAuthenticated(data.token);
    } catch (e: any) {
      setLocalError(e.message || t.auth.required);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foundry-950/85 p-4 backdrop-blur-sm">
      <div className="nx-card w-full max-w-md p-6 shadow-2xl animate-foundry-rise">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-teal-glow/30 bg-foundry-950">
            <Shield className="h-5 w-5 text-teal-glow" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foundry-100">{t.auth.title}</h2>
            <p className="text-sm text-foundry-400">{t.auth.subtitle}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-1 rounded border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setTab('key')}
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-medium',
              tab === 'key' ? 'bg-foundry-800 text-teal-glow' : 'text-foundry-400'
            )}
          >
            {t.auth.tabKey}
          </button>
          <button
            type="button"
            onClick={() => setTab('account')}
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-medium',
              tab === 'account' ? 'bg-foundry-800 text-teal-glow' : 'text-foundry-400'
            )}
          >
            {t.auth.tabAccount}
          </button>
        </div>

        {tab === 'key' ? (
          <>
            <p className="mb-3 text-xs leading-relaxed text-foundry-500">
              {t.auth.hintBefore}{' '}
              <code className="text-teal-glow/80">data/secrets.json</code>
              {t.auth.hintAfter}{' '}
              <code className="font-mono text-foundry-300">nxo_</code>.
            </p>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="nxo_…"
              className="mb-3 w-full rounded border border-white/10 bg-foundry-950 px-3 py-2.5 font-mono text-sm"
              autoFocus
            />
            {error || localError ? (
              <p className="mb-3 text-sm text-rose-400">{error || localError}</p>
            ) : null}
            <button
              type="button"
              className="w-full rounded-sm bg-teal-glow py-2.5 text-sm font-semibold text-foundry-950 hover:bg-teal-300"
              onClick={() => {
                const key = value.trim();
                if (!key) return;
                setOperatorKey(key);
                onAuthenticated(key);
              }}
            >
              {t.auth.authorize}
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs leading-relaxed text-foundry-500">{t.auth.accountHint}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPh}
              className="mb-2 w-full rounded border border-white/10 bg-foundry-950 px-3 py-2.5 font-mono text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPh}
              className="mb-3 w-full rounded border border-white/10 bg-foundry-950 px-3 py-2.5 font-mono text-sm"
            />
            <label className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-foundry-400">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acceptLegal}
                onChange={(e) => setAcceptLegal(e.target.checked)}
              />
              <span>
                {t.auth.acceptPrefix}{' '}
                <Link to="/terms" className="text-teal-glow hover:underline">
                  {t.legal.termsNav}
                </Link>{' '}
                {t.auth.acceptAnd}{' '}
                <Link to="/privacy" className="text-teal-glow hover:underline">
                  {t.legal.privacyNav}
                </Link>
                .
              </span>
            </label>
            {error || localError ? (
              <p className="mb-3 text-sm text-rose-400">{error || localError}</p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-sm bg-teal-glow py-2.5 text-sm font-semibold text-foundry-950 hover:bg-teal-300 disabled:opacity-50"
                onClick={() => submitAccount('login')}
              >
                {t.auth.login}
              </button>
              <button
                type="button"
                disabled={busy || !acceptLegal}
                className="flex-1 rounded-sm border border-white/15 py-2.5 text-sm text-foundry-100 hover:border-teal-glow/40 disabled:opacity-50"
                onClick={() => submitAccount('register')}
              >
                {t.auth.register}
              </button>
            </div>
            <button
              type="button"
              className="mt-3 text-xs text-foundry-500 hover:text-teal-glow"
              onClick={() => setForgotOpen((v) => !v)}
            >
              {t.auth.forgot}
            </button>
            {forgotOpen ? (
              <div className="mt-2">
                <button
                  type="button"
                  disabled={busy || !email}
                  className="w-full rounded-sm border border-white/15 py-2 text-sm text-foundry-100 disabled:opacity-50"
                  onClick={async () => {
                    setBusy(true);
                    setForgotHint('');
                    try {
                      const data = await apiJson<{ hint?: string }>(
                        '/api/auth/forgot',
                        { method: 'POST', body: JSON.stringify({ email }) }
                      );
                      setForgotHint(data.hint || t.auth.forgotHint);
                    } catch (e: any) {
                      setLocalError(e.message || t.auth.required);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t.auth.sendReset}
                </button>
                {forgotHint ? <p className="mt-2 text-xs text-foundry-400 break-all">{forgotHint}</p> : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function OnboardingChecklist({
  hasKey,
  hasAgent,
  hasTask,
  onDismiss,
}: {
  hasKey: boolean;
  hasAgent: boolean;
  hasTask: boolean;
  onDismiss: () => void;
}) {
  const t = useT();
  if (hasKey && hasAgent && hasTask) return null;
  const steps = [
    { done: hasKey, label: t.onboarding.stepKey },
    { done: hasAgent, label: t.onboarding.stepAgent },
    { done: hasTask, label: t.onboarding.stepTask },
  ];

  return (
    <div className="mb-4 border border-teal-glow/20 bg-teal-950/20 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-teal-glow">{t.onboarding.title}</h3>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[11px] text-foundry-500 hover:text-foundry-300"
        >
          {t.onboarding.dismiss}
        </button>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-sm text-foundry-300">
            <span
              className={
                s.done
                  ? 'flex h-5 w-5 items-center justify-center rounded-full bg-teal-glow text-[10px] font-bold text-foundry-950'
                  : 'flex h-5 w-5 items-center justify-center rounded-full border border-white/20 font-mono text-[10px] text-foundry-500'
              }
            >
              {s.done ? '✓' : i + 1}
            </span>
            <span className={s.done ? 'text-foundry-500 line-through' : ''}>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
