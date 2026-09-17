/** Lexical memory retrieval helpers. Not embeddings. */

export const MEMORY_SEARCH_NOTE =
  'Lexical match over memory keys and JSON values (FTS5, substring fallback). Not embeddings. Fetch GET /api/agent/{agentId}/memory/{key} for the full value.';

const BODY_CAP = 8000;
const SNIPPET_LEN = 220;
const MAX_TOKENS = 12;

export function flattenMemoryValue(key: string, value: unknown): string {
  const parts: string[] = [key];
  const walk = (v: unknown, depth: number) => {
    if (depth > 8) return;
    if (parts.reduce((n, p) => n + p.length + 1, 0) > BODY_CAP) return;
    if (v == null) return;
    if (typeof v === 'string') {
      parts.push(v);
      return;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      parts.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item, depth + 1);
      return;
    }
    if (typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        parts.push(k);
        walk(val, depth + 1);
      }
    }
  };
  walk(value, 0);
  return parts.join(' ').slice(0, BODY_CAP);
}

/** Turn a user query into a safe FTS5 MATCH expression, or null if empty. */
export function sanitizeFtsQuery(raw: string): string | null {
  const tokens = raw
    .trim()
    .slice(0, 200)
    .split(/[\s,;]+/g)
    .flatMap((t) => t.replace(/[-_/]+/g, ' ').split(/\s+/g))
    .map((t) => t.replace(/["'*()^:{}[\]~]+/g, '').trim())
    .filter((t) => t.length >= 1 && t.length <= 64)
    .slice(0, MAX_TOKENS);

  if (tokens.length === 0) return null;

  return tokens
    .map((t) => {
      if (/^[a-zA-Z0-9_]+$/.test(t) && t.length >= 2) {
        return `"${t}"*`;
      }
      return `"${t}"`;
    })
    .join(' AND ');
}

export function extractSnippet(body: string, query: string, maxLen = SNIPPET_LEN): string {
  const compact = body.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  const terms = query
    .trim()
    .split(/\s+/g)
    .map((t) => t.replace(/["'*()^:{}[\]~]+/g, ''))
    .filter((t) => t.length > 0);
  const lower = compact.toLowerCase();
  let idx = -1;
  for (const term of terms) {
    idx = lower.indexOf(term.toLowerCase());
    if (idx >= 0) break;
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - 40);
  const slice = compact.slice(start, start + maxLen);
  return `${start > 0 ? '…' : ''}${slice}${start + maxLen < compact.length ? '…' : ''}`;
}
