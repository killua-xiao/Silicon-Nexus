import { Database, Trash2 } from 'lucide-react';
import { EmptyState, Skeleton } from './EmptyState';
import { useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';

export function MemoryVault({
  memory,
  selectedAgentId,
  onSelect,
  onWipe,
  loading,
}: {
  memory: Record<string, Record<string, unknown>>;
  selectedAgentId: string;
  onSelect: (id: string) => void;
  onWipe: (id: string) => Promise<void>;
  loading?: boolean;
}) {
  const t = useT();
  const agents = Object.keys(memory);
  const selected = selectedAgentId || agents[0] || '';
  const block = selected ? memory[selected] : null;

  return (
    <section className="nx-panel flex h-[min(600px,70vh)] flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-teal-glow">{t.memory.title}</h2>
        {selected ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(interpolate(t.memory.wipeConfirm, { id: selected }))) {
                onWipe(selected);
              }
            }}
            className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
            {t.memory.wipe}
          </button>
        ) : null}
      </div>

      {loading && agents.length === 0 ? (
        <div className="space-y-2 p-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : agents.length === 0 ? (
        <EmptyState icon={Database} title={t.memory.emptyTitle} hint={t.memory.emptyHint} />
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-2 py-2">
            {agents.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={
                  id === selected
                    ? 'shrink-0 rounded-sm bg-teal-deep/40 px-2 py-1 font-mono text-[11px] text-teal-glow'
                    : 'shrink-0 rounded-sm px-2 py-1 font-mono text-[11px] text-foundry-400 hover:bg-foundry-800'
                }
              >
                {id}
              </button>
            ))}
          </div>
          <pre className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-foundry-300">
            {JSON.stringify(block ?? {}, null, 2)}
          </pre>
        </>
      )}
    </section>
  );
}
