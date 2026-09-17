import { useEffect, useState } from 'react';
import { Database, Search, Trash2 } from 'lucide-react';
import { EmptyState, Skeleton } from './EmptyState';
import { useT } from '../i18n/I18nProvider';
import { interpolate } from '../i18n/messages';
import { apiJson } from '../lib/api';

type MemoryHit = {
  agentId: string;
  key: string;
  snippet: string;
  rank: number;
  updatedAt: string;
};

type MemorySearchResponse = {
  query: string;
  engine: 'fts5' | 'substring';
  note: string;
  hits: MemoryHit[];
};

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
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MemoryHit[] | null>(null);
  const [engine, setEngine] = useState<'fts5' | 'substring' | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits(null);
      setEngine(null);
      return;
    }
    const handle = window.setTimeout(() => {
      setSearching(true);
      const params = new URLSearchParams({ q, limit: '10' });
      apiJson<MemorySearchResponse>(`/api/memory/search?${params.toString()}`)
        .then((data) => {
          setHits(data.hits);
          setEngine(data.engine);
        })
        .catch(() => {
          setHits([]);
          setEngine(null);
        })
        .finally(() => setSearching(false));
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query]);

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
          <div className="border-b border-white/5 px-3 py-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foundry-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.memory.searchPlaceholder}
                className="w-full rounded-sm border border-white/10 bg-foundry-950 py-1.5 pl-7 pr-2 font-mono text-[11px] text-foundry-200 placeholder:text-foundry-600 focus:border-teal-glow/40 focus:outline-none"
              />
            </label>
            <p className="mt-1 text-[10px] leading-snug text-foundry-600">{t.memory.searchHint}</p>
          </div>
          {query.trim() ? (
            <div className="max-h-36 overflow-auto border-b border-white/5">
              {searching && hits === null ? (
                <p className="px-3 py-2 font-mono text-[11px] text-foundry-500">{t.memory.searching}</p>
              ) : hits && hits.length === 0 ? (
                <p className="px-3 py-2 font-mono text-[11px] text-foundry-500">{t.memory.searchEmpty}</p>
              ) : hits ? (
                <ul>
                  {hits.map((hit) => (
                    <li key={`${hit.agentId}:${hit.key}:${hit.updatedAt}`}>
                      <button
                        type="button"
                        onClick={() => onSelect(hit.agentId)}
                        className="block w-full px-3 py-1.5 text-left hover:bg-foundry-800/80"
                      >
                        <div className="flex items-baseline gap-2 font-mono text-[11px]">
                          <span className="text-teal-glow">{hit.agentId}</span>
                          <span className="text-foundry-400">{hit.key}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-foundry-400">{hit.snippet}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {engine ? (
                <p className="px-3 pb-1.5 font-mono text-[10px] text-foundry-600">
                  {interpolate(t.memory.searchHits, { n: String(hits?.length ?? 0) })} · {engine}
                </p>
              ) : null}
            </div>
          ) : null}
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
