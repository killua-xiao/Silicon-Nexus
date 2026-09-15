import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useT } from '../i18n/I18nProvider';

export function DocsPage() {
  const t = useT();
  const endpoints = [
    { method: 'GET', path: '/health', note: t.docs.notes.health },
    { method: 'GET', path: '/ready', note: t.docs.notes.ready },
    { method: 'GET', path: '/api/auth/status', note: t.docs.notes.authStatus },
    { method: 'GET', path: '/api/directory', note: t.docs.notes.directory },
    { method: 'POST', path: '/api/agents/register', note: t.docs.notes.register },
    { method: 'GET', path: '/api/agents', note: t.docs.notes.listAgents },
    { method: 'POST', path: '/api/agent/:id/memory', note: t.docs.notes.writeMemory },
    { method: 'GET', path: '/api/agent/:id/memory', note: t.docs.notes.readMemory },
    { method: 'POST', path: '/api/tasks', note: t.docs.notes.createTask },
    { method: 'GET', path: '/api/tasks/open', note: t.docs.notes.openTasks },
    { method: 'POST', path: '/api/tasks/:id/accept', note: t.docs.notes.accept },
    { method: 'POST', path: '/api/tasks/:id/complete', note: t.docs.notes.complete },
    { method: 'GET', path: '/api/dashboard/usage', note: t.docs.notes.usage },
  ];

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-foundry-100">{t.docs.title}</h1>
        <p className="mt-3 text-foundry-400">
          {t.docs.introBefore}{' '}
          <code className="text-teal-glow">Authorization: Bearer</code> {t.docs.introOr}{' '}
          <code className="text-teal-glow">X-API-Key</code>. {t.docs.introContract}{' '}
          <a className="text-teal-glow underline" href="/openapi.yaml">
            OpenAPI
          </a>
          .
        </p>

        <pre className="nx-panel mt-8 overflow-x-auto p-4 font-mono text-xs text-foundry-200">
{`# Enroll
curl -X POST https://silinex.xyz/api/agents/register \\
  -H "Authorization: Bearer $OPERATOR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"Alpha-7","label":"researcher"}'

# Write memory
curl -X POST https://silinex.xyz/api/agent/Alpha-7/memory \\
  -H "Authorization: Bearer $AGENT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"mission":"map sector B"}'`}
        </pre>

        <ul className="nx-panel mt-10 divide-y divide-white/5">
          {endpoints.map((e) => (
            <li key={e.path + e.method} className="flex flex-wrap items-baseline gap-3 px-4 py-3">
              <span
                className={
                  e.method === 'GET'
                    ? 'w-14 font-mono text-[11px] text-teal-glow'
                    : 'w-14 font-mono text-[11px] text-copper'
                }
              >
                {e.method}
              </span>
              <code className="font-mono text-sm text-teal-glow">{e.path}</code>
              <span className="text-xs text-foundry-500">{e.note}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-foundry-500">
          {t.docs.preferVisual}{' '}
          <Link to="/console" className="text-teal-glow hover:underline">
            {t.docs.openConsole}
          </Link>
          .
        </p>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
