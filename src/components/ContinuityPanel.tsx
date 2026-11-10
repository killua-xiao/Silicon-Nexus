import { useEffect, useMemo, useState } from 'react';
import { Copy, GitBranch, RefreshCw } from 'lucide-react';
import { apiJson } from '../lib/api';
import { useToast } from './Toast';
import { useT } from '../i18n/I18nProvider';
import type { AgentRow } from './AgentPanel';

type HandoffPacket = {
  decisions?: string[];
  constraints?: string[];
  evidence?: string[];
  nextAction?: string;
  provenance?: {
    actor?: string;
    task?: string;
    conditions?: string;
  };
};

type HandoffResponse = {
  handoffId: string;
  agentId: string;
  digest: string;
  keys: string[];
  note: string | null;
  packet: HandoffPacket | null;
  createdAt: string;
  expiresAt: string;
};

type AssumeResponse = {
  agentId: string;
  handoffId: string;
  digest: string;
  assumedKeys: string[];
  diff: { carried: string[]; missing: string[] };
  rotated: boolean;
  token?: string;
  assumedAt: string | null;
  packet: HandoffPacket | null;
  note: string;
};

export function ContinuityPanel({
  agents,
  defaultAgentId,
}: {
  agents: AgentRow[];
  defaultAgentId?: string;
}) {
  const t = useT();
  const { push } = useToast();
  const c = t.continuity;
  const [agentId, setAgentId] = useState(defaultAgentId || agents[0]?.agentId || '');
  const [note, setNote] = useState('');
  const [handoffId, setHandoffId] = useState('');
  const [rotateToken, setRotateToken] = useState(true);
  const [lastHandoff, setLastHandoff] = useState<HandoffResponse | null>(null);
  const [lastAssume, setLastAssume] = useState<AssumeResponse | null>(null);
  const [busy, setBusy] = useState<'handoff' | 'assume' | null>(null);

  const agentOptions = useMemo(() => agents.map((a) => a.agentId), [agents]);

  useEffect(() => {
    if (agentId) return;
    const next = defaultAgentId || agents[0]?.agentId || '';
    if (next) setAgentId(next);
  }, [agentId, defaultAgentId, agents]);

  const copy = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push(okMsg, 'success');
    } catch {
      push(t.common.cannotReach, 'error');
    }
  };

  const createHandoff = async () => {
    if (!agentId.trim()) {
      push(c.pickAgent, 'error');
      return;
    }
    setBusy('handoff');
    try {
      const data = await apiJson<HandoffResponse>(
        `/api/agent/${encodeURIComponent(agentId.trim())}/handoff`,
        {
          method: 'POST',
          body: JSON.stringify({ note: note.trim() || undefined }),
        }
      );
      setLastHandoff(data);
      setHandoffId(data.handoffId);
      setLastAssume(null);
      push(c.handoffOk, 'success');
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : c.handoffFail, 'error');
    } finally {
      setBusy(null);
    }
  };

  const assume = async () => {
    if (!agentId.trim() || !handoffId.trim()) {
      push(c.needHandoffId, 'error');
      return;
    }
    setBusy('assume');
    try {
      const data = await apiJson<AssumeResponse>(
        `/api/agent/${encodeURIComponent(agentId.trim())}/assume`,
        {
          method: 'POST',
          body: JSON.stringify({
            handoffId: handoffId.trim(),
            rotateToken,
          }),
        }
      );
      setLastAssume(data);
      push(c.assumeOk, 'success');
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : c.assumeFail, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="nx-panel p-4">
      <h2 className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
        <GitBranch className="h-3.5 w-3.5" />
        {c.title}
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-foundry-500">{c.hint}</p>

      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
        <label className="grid gap-1 text-xs text-foundry-500">
          {c.agentLabel}
          {agentOptions.length > 0 ? (
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm text-foundry-100"
            >
              {agentOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Alpha-7"
              className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm text-foundry-100"
            />
          )}
        </label>
        <label className="grid gap-1 text-xs text-foundry-500">
          {c.noteLabel}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={c.notePh}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm text-foundry-100"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={busy !== null}
            onClick={createHandoff}
            className="nx-btn nx-btn-primary w-full px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy === 'handoff' ? '…' : c.handoffBtn}
          </button>
        </div>
      </div>

      {lastHandoff ? (
        <div className="mt-4 rounded border border-accent/20 bg-foundry-950 p-3 font-mono text-[11px] leading-relaxed text-foundry-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-teal-glow">{c.handoffId}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-foundry-400 hover:text-teal-glow"
              onClick={() => copy(lastHandoff.handoffId, c.copied)}
            >
              <Copy className="h-3 w-3" />
              {lastHandoff.handoffId}
            </button>
          </div>
          <p className="mt-2 break-all text-foundry-500">
            digest {lastHandoff.digest.slice(0, 16)}… · {lastHandoff.keys.length} keys · expires{' '}
            {lastHandoff.expiresAt.slice(0, 10)}
          </p>
          {lastHandoff.note ? (
            <p className="mt-2 text-foundry-400">
              {c.noteLabel}: {lastHandoff.note}
            </p>
          ) : null}
          {lastHandoff.packet ? (
            <div className="mt-2">
              <p className="text-teal-glow">{c.packetLabel}</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-foundry-400">
                {JSON.stringify(lastHandoff.packet, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 border-t border-white/5 pt-5 md:grid-cols-[1fr_auto_auto]">
        <label className="grid gap-1 text-xs text-foundry-500">
          {c.handoffId}
          <input
            value={handoffId}
            onChange={(e) => setHandoffId(e.target.value)}
            placeholder="hof_…"
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm text-foundry-100"
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-xs text-foundry-400">
          <input
            type="checkbox"
            checked={rotateToken}
            onChange={(e) => setRotateToken(e.target.checked)}
            className="rounded border-white/20"
          />
          {c.rotateLabel}
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={busy !== null}
            onClick={assume}
            className="nx-btn nx-btn-ghost inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {busy === 'assume' ? '…' : c.assumeBtn}
          </button>
        </div>
      </div>

      {lastAssume ? (
        <div className="mt-4 rounded border border-white/10 bg-foundry-950 p-3 text-sm text-foundry-300">
          <p>
            {c.assumedKeys}: {lastAssume.assumedKeys.length} · {c.restored}:{' '}
            {lastAssume.diff.missing.length} · {c.carried}: {lastAssume.diff.carried.length}
          </p>
          {lastAssume.packet ? (
            <div className="mt-3 font-mono text-[11px] leading-relaxed">
              <p className="text-teal-glow">{c.packetLabel}</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-foundry-400">
                {JSON.stringify(lastAssume.packet, null, 2)}
              </pre>
            </div>
          ) : null}
          {lastAssume.token ? (
            <div className="mt-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-copper">
                {c.newToken}
              </p>
              <button
                type="button"
                className="mt-1 break-all text-left font-mono text-xs text-teal-glow hover:underline"
                onClick={() => copy(lastAssume.token!, c.copied)}
              >
                {lastAssume.token}
              </button>
              <p className="mt-2 text-xs text-foundry-500">{lastAssume.note}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-foundry-500">{lastAssume.note}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
