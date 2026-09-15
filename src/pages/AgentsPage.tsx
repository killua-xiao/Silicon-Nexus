import { useState } from 'react';
import { AgentPanel } from '../components/AgentPanel';
import { McpConfigPanel } from '../components/McpConfigPanel';
import { useConsole } from './ConsoleLayout';
import { useT } from '../i18n/I18nProvider';

export function AgentsPage() {
  const { agents, loading, registerAgent, revokeAgent, patchAgent } = useConsole();
  const t = useT();
  const [issued, setIssued] = useState<{ agentId: string; token: string } | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foundry-100">
          {t.console.agentsTitle}
        </h1>
        <p className="text-sm text-foundry-500">{t.console.agentsHint}</p>
        <p className="mt-1 text-xs text-foundry-600">{t.console.mintHint}</p>
      </div>
      <AgentPanel
        agents={agents}
        loading={loading}
        onRegister={registerAgent}
        onRevoke={revokeAgent}
        onPatch={patchAgent}
        onTokenIssued={setIssued}
      />
      <McpConfigPanel
        defaultAgentId={issued?.agentId}
        defaultToken={issued?.token}
      />
    </div>
  );
}
