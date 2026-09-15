import { useEffect, useMemo, useState } from 'react';
import { Copy, Terminal } from 'lucide-react';
import { useToast } from './Toast';
import { useT } from '../i18n/I18nProvider';

const DEFAULT_APP_URL = 'https://silinex.xyz';

function buildStdioJson(agentId: string, token: string, appUrl: string) {
  return {
    mcpServers: {
      'silicon-nexus': {
        command: 'node',
        args: ['/path/to/Silicon-Nexus/dist/mcp-server.cjs'],
        env: {
          NEXUS_API_URL: `${appUrl.replace(/\/$/, '')}/api`,
          NEXUS_AGENT_ID: agentId || 'YOUR_AGENT_ID',
          NEXUS_AGENT_TOKEN: token || 'nxa_YOUR_TOKEN',
        },
      },
    },
  };
}

function buildHttpJson(agentId: string, token: string, appUrl: string) {
  const base = appUrl.replace(/\/$/, '');
  return {
    mcpServers: {
      'silicon-nexus': {
        url: `${base}/mcp`,
        headers: {
          Authorization: `Bearer ${token || 'nxa_YOUR_TOKEN'}`,
          ...(agentId ? { 'X-Nexus-Agent-Id': agentId } : {}),
        },
      },
    },
  };
}

export function McpConfigPanel({
  defaultAgentId,
  defaultToken,
}: {
  defaultAgentId?: string;
  defaultToken?: string;
}) {
  const t = useT();
  const { push } = useToast();
  const [agentId, setAgentId] = useState(defaultAgentId || '');
  const [token, setToken] = useState(defaultToken || '');
  const [appUrl, setAppUrl] = useState(DEFAULT_APP_URL);

  useEffect(() => {
    if (defaultAgentId) setAgentId(defaultAgentId);
    if (defaultToken) setToken(defaultToken);
  }, [defaultAgentId, defaultToken]);

  useEffect(() => {
    fetch('/health')
      .then((r) => r.json())
      .then((d: { appUrl?: string }) => {
        if (d.appUrl) setAppUrl(d.appUrl);
      })
      .catch(() => undefined);
  }, []);

  const mcpUrl = `${appUrl.replace(/\/$/, '')}/mcp`;
  const stdioText = useMemo(
    () => JSON.stringify(buildStdioJson(agentId.trim(), token.trim(), appUrl.trim()), null, 2),
    [agentId, token, appUrl]
  );
  const httpText = useMemo(
    () => JSON.stringify(buildHttpJson(agentId.trim(), token.trim(), appUrl.trim()), null, 2),
    [agentId, token, appUrl]
  );

  return (
    <section className="border border-white/5 bg-foundry-900/60 p-4 md:p-5">
      <h2 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
        <Terminal className="h-3.5 w-3.5" />
        {t.connect.mcpTitle}
      </h2>
      <p className="mb-4 text-sm text-foundry-500">{t.connect.mcpHint}</p>
      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <input
          value={appUrl}
          onChange={(e) => setAppUrl(e.target.value)}
          className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-xs"
          placeholder="APP_URL"
        />
        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-xs"
          placeholder="NEXUS_AGENT_ID"
        />
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-xs"
          placeholder="NEXUS_AGENT_TOKEN"
        />
      </div>

      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-foundry-500">
        {t.connect.mcpRemoteLabel}
      </p>
      <div className="relative mb-4">
        <pre className="overflow-x-auto rounded border border-teal-glow/20 bg-foundry-950 p-3 font-mono text-[11px] text-teal-glow select-text">
          {mcpUrl}
        </pre>
        <button
          type="button"
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-white/10 bg-foundry-900 px-2 py-1 text-[11px] text-teal-glow hover:border-teal-glow/40"
          onClick={async () => {
            await navigator.clipboard.writeText(mcpUrl);
            push(t.connect.copiedUrl, 'success');
          }}
        >
          <Copy className="h-3 w-3" />
          {t.connect.copyUrl}
        </button>
      </div>

      <div className="relative mb-4">
        <pre className="overflow-x-auto rounded border border-white/10 bg-foundry-950 p-3 font-mono text-[11px] text-foundry-200 select-text">
          {httpText}
        </pre>
        <button
          type="button"
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-white/10 bg-foundry-900 px-2 py-1 text-[11px] text-teal-glow hover:border-teal-glow/40"
          onClick={async () => {
            await navigator.clipboard.writeText(httpText);
            push(t.connect.copied, 'success');
          }}
        >
          <Copy className="h-3 w-3" />
          {t.connect.copy}
        </button>
      </div>

      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-foundry-500">
        {t.connect.mcpStdioLabel}
      </p>
      <div className="relative">
        <pre className="overflow-x-auto rounded border border-white/10 bg-foundry-950 p-3 font-mono text-[11px] text-foundry-200 select-text">
          {stdioText}
        </pre>
        <button
          type="button"
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-white/10 bg-foundry-900 px-2 py-1 text-[11px] text-teal-glow hover:border-teal-glow/40"
          onClick={async () => {
            await navigator.clipboard.writeText(stdioText);
            push(t.connect.copied, 'success');
          }}
        >
          <Copy className="h-3 w-3" />
          {t.connect.copy}
        </button>
      </div>
      <p className="mt-3 text-[11px] text-foundry-600">
        {t.connect.agentCardHint}{' '}
        <a
          href="/.well-known/agent.json"
          className="text-teal-glow/80 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          /.well-known/agent.json
        </a>
      </p>
    </section>
  );
}
