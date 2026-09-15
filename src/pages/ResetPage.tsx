import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { apiJson } from '../lib/api';
import { useT } from '../i18n/I18nProvider';

export function ResetPage() {
  const t = useT();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await apiJson('/api/auth/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message || t.reset.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid">
      <SiteHeader compact />
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-semibold text-foundry-100">{t.reset.title}</h1>
        {done ? (
          <p className="mt-4 text-sm text-foundry-300">{t.reset.ok}</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-foundry-500">{t.reset.hint}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.reset.passwordPh}
              className="mt-4 w-full rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
            />
            {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
            <button
              type="button"
              disabled={busy || !token || password.length < 8}
              onClick={submit}
              className="mt-4 rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950 disabled:opacity-50"
            >
              {busy ? t.reset.saving : t.reset.submit}
            </button>
          </>
        )}
        <Link to="/console/account" className="mt-6 block text-sm text-teal-glow hover:underline">
          {t.reset.back}
        </Link>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
