/** Agent body provenance helpers. Lexical vault — not embeddings. */

import type { AgentMemory } from './types.ts';

export const BODY_META_KEY = '__body_meta__';

export type BodyConfidence = 'asserted' | 'inferred' | 'unknown';

export type BodyCellMeta = {
  updatedAt: string;
  source: string;
  confidence: BodyConfidence;
};

export type BodyCell = BodyCellMeta & {
  value: unknown;
};

export type MemoryWriteOptions = {
  source: string;
  confidence: BodyConfidence;
};

const CONFIDENCES = new Set<BodyConfidence>(['asserted', 'inferred', 'unknown']);

export function isBodyMetaKey(key: string): boolean {
  return key === BODY_META_KEY;
}

export function splitMemoryWritePayload(body: unknown): {
  data: AgentMemory;
  options: MemoryWriteOptions;
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Memory body must be a JSON object of key → value pairs');
  }
  const obj = { ...(body as Record<string, unknown>) };
  let source = 'unspecified';
  let confidence: BodyConfidence = 'asserted';

  const nexus = obj._nexus;
  if (nexus && typeof nexus === 'object' && !Array.isArray(nexus)) {
    const n = nexus as Record<string, unknown>;
    if (typeof n.source === 'string' && n.source.trim()) {
      source = n.source.trim().slice(0, 120);
    }
    if (typeof n.confidence === 'string' && CONFIDENCES.has(n.confidence as BodyConfidence)) {
      confidence = n.confidence as BodyConfidence;
    }
  }
  delete obj._nexus;
  delete obj[BODY_META_KEY];

  return {
    data: obj as AgentMemory,
    options: { source, confidence },
  };
}

export function readBodyMetaMap(memory: AgentMemory): Record<string, BodyCellMeta> {
  const raw = memory[BODY_META_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, BodyCellMeta> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    const v = val as Record<string, unknown>;
    const updatedAt = typeof v.updatedAt === 'string' ? v.updatedAt : '';
    const source = typeof v.source === 'string' && v.source.trim() ? v.source.trim() : 'legacy';
    const confidence =
      typeof v.confidence === 'string' && CONFIDENCES.has(v.confidence as BodyConfidence)
        ? (v.confidence as BodyConfidence)
        : 'unknown';
    if (!updatedAt) continue;
    out[key] = { updatedAt, source, confidence };
  }
  return out;
}

export function stampBodyMeta(
  existing: AgentMemory,
  writtenKeys: string[],
  options: MemoryWriteOptions,
  now: string
): AgentMemory {
  const meta = { ...readBodyMetaMap(existing) };
  for (const key of writtenKeys) {
    if (isBodyMetaKey(key)) continue;
    meta[key] = {
      updatedAt: now,
      source: options.source,
      confidence: options.confidence,
    };
  }
  return { ...existing, [BODY_META_KEY]: meta };
}

export function userMemoryKeys(memory: AgentMemory): string[] {
  return Object.keys(memory).filter((k) => !isBodyMetaKey(k));
}

export function buildBodyCells(
  memory: AgentMemory,
  fallbackUpdatedAt: string
): Record<string, BodyCell> {
  const meta = readBodyMetaMap(memory);
  const cells: Record<string, BodyCell> = {};
  for (const key of userMemoryKeys(memory)) {
    const m = meta[key];
    cells[key] = {
      value: memory[key],
      updatedAt: m?.updatedAt || fallbackUpdatedAt,
      source: m?.source || 'legacy',
      confidence: m?.confidence || 'unknown',
    };
  }
  return cells;
}

export function citePath(agentId: string, key: string): string {
  return `/api/agent/${encodeURIComponent(agentId)}/memory/${encodeURIComponent(key)}`;
}
