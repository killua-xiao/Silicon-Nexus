import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  apiFetch,
  apiJson,
  clearOperatorKey,
  getOperatorKey,
  setApiHandlers,
  setOperatorKey,
} from '../lib/api';
import { AuthGate, OnboardingChecklist } from '../components/AuthGate';
import { ConsoleNav } from '../components/SiteHeader';
import { useToast } from '../components/Toast';
import type { AgentRow } from '../components/AgentPanel';
import type { LogRow } from '../components/ActivityFeed';
import type { TaskRow, WorkerStatusLite } from '../components/TaskQueue';
import type { Stats, Usage } from '../components/StatStrip';
import { useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';
import { SiteFooter } from '../components/SiteFooter';

type ConsoleContextValue = {
  protectedMode: boolean;
  connected: boolean;
  loading: boolean;
  stats: Stats | null;
  usage: Usage | null;
  logs: LogRow[];
  tasks: TaskRow[];
  memory: Record<string, Record<string, unknown>>;
  agents: AgentRow[];
  worker: WorkerStatusLite | null;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  logQuery: string;
  setLogQuery: (q: string) => void;
  paused: boolean;
  setPaused: (p: boolean) => void;
  refresh: () => Promise<void>;
  registerAgent: (input: {
    agentId: string;
    label?: string;
    rotate?: boolean;
  }) => Promise<{ token: string; agentId: string }>;
  revokeAgent: (agentId: string) => Promise<void>;
  patchAgent: (
    agentId: string,
    patch: { listed?: boolean; blurb?: string | null; label?: string }
  ) => Promise<void>;
  dispatchTask: (input: {
    creatorId: string;
    type: string;
    payload: unknown;
  }) => Promise<void>;
  reopenTask: (taskId: string) => Promise<void>;
  failTask: (taskId: string, lastError: string) => Promise<void>;
  wipeMemory: (agentId: string) => Promise<void>;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

function ConsoleShellInner() {
  const { push } = useToast();
  const t = useT();
  const [protectedMode, setProtectedMode] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [connected, setConnected] = useState(!!getOperatorKey());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [memory, setMemory] = useState<Record<string, Record<string, unknown>>>({});
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [worker, setWorker] = useState<WorkerStatusLite | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const [hideOnboarding, setHideOnboarding] = useState(
    () => localStorage.getItem('nexus_onboarding_dismissed') === '1'
  );

  useEffect(() => {
    setApiHandlers({
      onUnauthorized: () => {
        setShowAuth(true);
        setConnected(false);
        setAuthError(t.auth.required);
      },
      onError: (message) => push(message, 'error'),
    });
  }, [push, t.auth.required]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        setProtectedMode(!!data.protected);
        if (data.protected && !getOperatorKey()) {
          setShowAuth(true);
          setConnected(false);
        } else {
          setConnected(true);
        }
      } catch {
        push(t.common.cannotReach, 'error');
      }
    })();
  }, [push, t.common.cannotReach]);

  const refresh = useCallback(async () => {
    if (protectedMode && !getOperatorKey()) {
      setLoading(false);
      return;
    }
    try {
      const snap = await apiJson<{
        stats: Stats;
        usage: Usage;
        logs: LogRow[];
        tasks: TaskRow[];
        memory: Record<string, Record<string, unknown>>;
        agents: AgentRow[];
        worker?: WorkerStatusLite;
      }>('/api/dashboard/snapshot');
      setStats(snap.stats);
      setUsage(snap.usage);
      setLogs(snap.logs);
      setTasks(snap.tasks);
      setMemory(snap.memory);
      setAgents(snap.agents || []);
      setWorker(snap.worker || null);
      setConnected(true);
      setAuthError('');
    } catch {
      // errors toasted via api handlers / thrown messages
    } finally {
      setLoading(false);
    }
  }, [protectedMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (paused) return;
    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refresh();
    };
    const id = setInterval(tick, 8000);
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [paused, refresh]);

  const value = useMemo<ConsoleContextValue>(
    () => ({
      protectedMode,
      connected,
      loading,
      stats,
      usage,
      logs,
      tasks,
      memory,
      agents,
      worker,
      selectedAgentId,
      setSelectedAgentId,
      logQuery,
      setLogQuery,
      paused,
      setPaused,
      refresh,
      registerAgent: async (input) => {
        const data = await apiJson<{ token: string; agentId: string }>('/api/agents/register', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        await refresh();
        return { token: data.token, agentId: data.agentId || input.agentId };
      },
      revokeAgent: async (agentId) => {
        await apiJson(`/api/agents/${encodeURIComponent(agentId)}/revoke`, { method: 'POST' });
        await refresh();
      },
      patchAgent: async (agentId, patch) => {
        await apiJson(`/api/agents/${encodeURIComponent(agentId)}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        await refresh();
      },
      dispatchTask: async (input) => {
        await apiJson('/api/tasks', { method: 'POST', body: JSON.stringify(input) });
        push(t.tasks.dispatched, 'success');
        await refresh();
      },
      reopenTask: async (taskId) => {
        await apiJson(`/api/tasks/${encodeURIComponent(taskId)}/reopen`, { method: 'POST' });
        push(t.tasks.reopened, 'success');
        await refresh();
      },
      failTask: async (taskId, lastError) => {
        await apiJson(`/api/tasks/${encodeURIComponent(taskId)}/fail`, {
          method: 'POST',
          body: JSON.stringify({ lastError }),
        });
        push(t.tasks.markedFailed, 'info');
        await refresh();
      },
      wipeMemory: async (agentId) => {
        await apiFetch(`/api/agent/${encodeURIComponent(agentId)}/memory`, { method: 'DELETE' });
        push(interpolate(t.memory.wiped, { id: agentId }), 'success');
        await refresh();
      },
    }),
    [
      protectedMode,
      connected,
      loading,
      stats,
      usage,
      logs,
      tasks,
      memory,
      agents,
      worker,
      selectedAgentId,
      logQuery,
      paused,
      refresh,
      push,
      t.tasks.dispatched,
      t.tasks.reopened,
      t.tasks.markedFailed,
      t.memory.wiped,
    ]
  );

  return (
    <ConsoleContext.Provider value={value}>
      <div className="min-h-screen bg-foundry-950 foundry-grid">
        <ConsoleNav
          connected={connected && (!protectedMode || !!getOperatorKey())}
          workerOnline={worker?.online}
          onLock={() => {
            clearOperatorKey();
            setConnected(false);
            setShowAuth(true);
          }}
        />
        <AuthGate
          open={showAuth && protectedMode}
          error={authError}
          onAuthenticated={() => {
            setShowAuth(false);
            setConnected(true);
            setLoading(true);
            refresh();
          }}
        />
        <main className="mx-auto max-w-[1400px] px-4 py-5 md:px-6">
          {!hideOnboarding && (
            <OnboardingChecklist
              hasKey={!protectedMode || !!getOperatorKey()}
              hasAgent={agents.length > 0}
              hasTask={tasks.length > 0}
              onDismiss={() => {
                localStorage.setItem('nexus_onboarding_dismissed', '1');
                setHideOnboarding(true);
              }}
            />
          )}
          <Outlet />
        </main>
        <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
      </div>
    </ConsoleContext.Provider>
  );
}

export function ConsoleLayout() {
  return <ConsoleShellInner />;
}

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error('useConsole must be used within ConsoleLayout');
  return ctx;
}

// re-export for AuthGate callers that set key before refresh
export { setOperatorKey };
