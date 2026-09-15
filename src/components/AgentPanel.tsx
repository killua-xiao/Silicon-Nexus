import { useState } from 'react';
import { Copy, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { EmptyState, Skeleton } from './EmptyState';
import { useToast } from './Toast';
import { useI18n, useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';

export type AgentRow = {
  agentId: string;
  createdAt: string;
  rotatedAt?: string | null;
  label: string | null;
  hasToken: boolean;
  listed?: boolean;
  blurb?: string | null;
};

export function AgentPanel({
  agents,
  loading,
  onRegister,
  onRevoke,
  onPatch,
  onTokenIssued,
}: {
  agents: AgentRow[];
  loading?: boolean;
  onRegister: (input: {
    agentId: string;
    label?: string;
    rotate?: boolean;
  }) => Promise<{ token: string; agentId: string }>;
  onRevoke: (agentId: string) => Promise<void>;
  onPatch: (
    agentId: string,
    patch: { listed?: boolean; blurb?: string | null; label?: string }
  ) => Promise<void>;
  onTokenIssued?: (info: { agentId: string; token: string }) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const { push } = useToast();
  const [agentId, setAgentId] = useState('');
  const [label, setLabel] = useState('');
  const [issued, setIssued] = useState<{ agentId: string; token: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const enroll = async (rotate = false) => {
    if (!agentId.trim()) {
      push(t.agents.idRequired, 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await onRegister({
        agentId: agentId.trim(),
        label: label.trim() || undefined,
        rotate,
      });
      setIssued(result);
      onTokenIssued?.(result);
      push(rotate ? t.agents.rotatedOk : t.agents.enrolledOk, 'success');
    } catch (e: any) {
      push(e.message || 'Enrollment failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="border border-white/5 bg-foundry-900/60 p-4 md:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
          <UserPlus className="h-3.5 w-3.5" />
          {t.agents.issueTitle}
        </h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder={t.agents.agentIdPlaceholder}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t.agents.labelPlaceholder}
            className="rounded border border-white/10 bg-foundry-950 px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => enroll(false)}
            className="rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950 disabled:opacity-50"
          >
            {t.agents.mint}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => enroll(true)}
            className="rounded-sm border border-copper/40 px-4 py-2 text-sm text-copper hover:bg-copper/10 disabled:opacity-50"
          >
            {t.agents.rotate}
          </button>
        </div>
        {issued ? (
          <div className="mt-4 rounded border border-teal-glow/30 bg-teal-950/30 p-3">
            <p className="mb-1 text-xs text-foundry-400">
              {t.agents.oneTime}{' '}
              <span className="text-teal-glow">{issued.agentId}</span> {t.agents.copyNow}
            </p>
            <div className="flex items-start gap-2">
              <code className="flex-1 break-all font-mono text-xs text-teal-50 select-text">
                {issued.token}
              </code>
              <button
                type="button"
                className="shrink-0 text-foundry-400 hover:text-teal-glow"
                onClick={() => {
                  navigator.clipboard.writeText(issued.token);
                  push(t.agents.copied, 'success');
                }}
                aria-label="Copy token"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="border border-white/5 bg-foundry-900/60">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-teal-glow">
            <KeyRound className="h-3.5 w-3.5" />
            {t.agents.enrolledTitle}
          </h2>
        </div>
        {loading && agents.length === 0 ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title={t.agents.emptyTitle}
            hint={t.agents.emptyHint}
            className="py-16"
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {agents.map((a) => (
              <li
                key={a.agentId}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm text-foundry-100">{a.agentId}</p>
                  <p className="font-mono text-[11px] text-foundry-500">
                    {a.label || t.agents.unlabeled} · {t.agents.enrolled}{' '}
                    {formatDistanceToNow(new Date(a.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                    {a.rotatedAt
                      ? ` · ${t.agents.rotated} ${formatDistanceToNow(new Date(a.rotatedAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await onPatch(a.agentId, { listed: !a.listed });
                        push(
                          a.listed ? t.agents.unlistedOk : t.agents.listedOk,
                          'success'
                        );
                      } catch (e: any) {
                        push(e.message || 'Update failed', 'error');
                      }
                    }}
                    className={`rounded border px-2.5 py-1 text-xs ${
                      a.listed
                        ? 'border-teal-glow/40 text-teal-glow'
                        : 'border-white/10 text-foundry-400 hover:border-white/20'
                    }`}
                  >
                    {a.listed ? t.agents.listed : t.agents.listPublic}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(interpolate(t.agents.revokeConfirm, { id: a.agentId }))) {
                        return;
                      }
                      try {
                        await onRevoke(a.agentId);
                        push(interpolate(t.agents.revoked, { id: a.agentId }), 'success');
                      } catch (e: any) {
                        push(e.message || 'Revoke failed', 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded border border-rose-500/30 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t.agents.revoke}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
