import { useState } from 'react';
import { WirePublicShell } from '../components/WirePublicShell';
import { Link, useSearchParams } from 'react-router-dom';
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
    <WirePublicShell>
        <h1 className="text-2xl font-semibold text-ink">{t.reset.title}</h1>
        {done ? (
          <p className="mt-4 text-sm text-ink-muted">{t.reset.ok}</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-ink-muted">{t.reset.hint}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.reset.passwordPh}
              className="mt-4 w-full rounded border border-grid-line bg-carbon-paper px-3 py-2 font-mono text-sm"
            />
            {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
            <button
              type="button"
              disabled={busy || !token || password.length < 8}
              onClick={submit}
              className="mt-4 rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? t.reset.saving : t.reset.submit}
            </button>
          </>
        )}
        <Link to="/console/account" className="mt-6 block text-sm text-wire-blue hover:underline">
          {t.reset.back}
        </Link>
      </WirePublicShell>
  );
}
