import { useEffect, useState } from 'react';
import { WirePublicShell } from '../components/WirePublicShell';
import { Link, useSearchParams } from 'react-router-dom';
import { apiJson } from '../lib/api';
import { useT } from '../i18n/I18nProvider';

export function VerifyPage() {
  const t = useT();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t.verify.missing);
      return;
    }
    apiJson('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => {
        setStatus('ok');
        setMessage(t.verify.ok);
      })
      .catch((e: any) => {
        setStatus('error');
        setMessage(e.message || t.verify.failed);
      });
  }, [token, t.verify.failed, t.verify.missing, t.verify.ok]);

  return (
    <WirePublicShell>
        <h1 className="text-2xl font-semibold text-ink">{t.verify.title}</h1>
        <p className={`mt-4 text-sm ${status === 'error' ? 'text-rose-300' : 'text-ink-muted'}`}>
          {message || t.verify.working}
        </p>
        <Link to="/console/account" className="mt-6 inline-block text-sm text-wire-blue hover:underline">
          {t.verify.back}
        </Link>
      </WirePublicShell>
  );
}
