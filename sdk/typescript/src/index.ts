export type SiliconNexusOptions = {
  /** Base API URL including /api, e.g. https://silinex.xyz/api */
  baseUrl: string;
  /** Operator (nxo_*) or agent (nxa_*) token */
  token: string;
  /** Default agent id for memory/task identity */
  agentId?: string;
};

export type BodyConfidence = 'asserted' | 'inferred' | 'unknown';

export type MemoryWriteOptions = {
  agentId?: string;
  source?: string;
  confidence?: BodyConfidence;
};

export type MemorySearchHit = {
  agentId: string;
  key: string;
  snippet: string;
  rank: number;
  updatedAt: string;
  source: string;
  confidence: BodyConfidence;
  cite: string;
};

export type BodyCell = {
  value: unknown;
  updatedAt: string;
  source: string;
  confidence: BodyConfidence;
};

export type HandoffResult = {
  handoffId: string;
  agentId: string;
  digest: string;
  keys: string[];
  note: string | null;
  createdAt: string;
  expiresAt: string;
  snapshot: Record<string, unknown>;
};

export type AssumeResult = {
  agentId: string;
  handoffId: string;
  digest: string;
  assumedKeys: string[];
  diff: { carried: string[]; missing: string[] };
  rotated: boolean;
  token?: string;
  assumedAt: string | null;
  note: string;
};

export class SiliconNexusError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'SiliconNexusError';
    this.status = status;
    this.body = body;
  }
}

export class SiliconNexus {
  readonly baseUrl: string;
  readonly token: string;
  readonly agentId?: string;

  constructor(options: SiliconNexusOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    this.agentId = options.agentId;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      'X-API-Key': this.token,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init?.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new SiliconNexusError(
        (body as { error?: string }).error || `HTTP ${res.status}`,
        res.status,
        body
      );
    }
    return body as T;
  }

  private resolveAgentId(agentId?: string): string {
    const id = agentId || this.agentId;
    if (!id) throw new Error('agentId required');
    return id;
  }

  memory = {
    /**
     * Write citeable body keys. Second arg may be agentId (legacy) or options with source/confidence.
     */
    write: (
      data: Record<string, unknown>,
      agentIdOrOpts?: string | MemoryWriteOptions
    ) => {
      const opts: MemoryWriteOptions =
        typeof agentIdOrOpts === 'string'
          ? { agentId: agentIdOrOpts }
          : agentIdOrOpts || {};
      const agentId = this.resolveAgentId(opts.agentId);
      const payload: Record<string, unknown> = { ...data };
      if (opts.source || opts.confidence) {
        payload._nexus = {
          ...(opts.source ? { source: opts.source } : {}),
          ...(opts.confidence ? { confidence: opts.confidence } : {}),
        };
      }
      return this.request<{
        status: string;
        storedKeys: string[];
        source: string;
        confidence: BodyConfidence;
      }>(`/agent/${encodeURIComponent(agentId)}/memory`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    read: (agentId = this.agentId) => {
      const id = this.resolveAgentId(agentId);
      return this.request<Record<string, unknown>>(
        `/agent/${encodeURIComponent(id)}/memory`
      );
    },
    search: (input: { q: string; limit?: number; agentId?: string }) => {
      const params = new URLSearchParams({ q: input.q });
      if (input.limit != null) params.set('limit', String(input.limit));
      const agentId = input.agentId || this.agentId;
      if (agentId) params.set('agentId', agentId);
      return this.request<{
        query: string;
        engine: 'fts5' | 'substring';
        note: string;
        hits: MemorySearchHit[];
      }>(`/memory/search?${params.toString()}`);
    },
    wipe: (agentId = this.agentId) => {
      const id = this.resolveAgentId(agentId);
      return this.request<{ status: string }>(
        `/agent/${encodeURIComponent(id)}/memory`,
        { method: 'DELETE' }
      );
    },
  };

  /** Structured body cells with provenance. */
  body = {
    get: (agentId = this.agentId) => {
      const id = this.resolveAgentId(agentId);
      return this.request<{
        agentId: string;
        updatedAt: string;
        cells: Record<string, BodyCell>;
        note: string;
      }>(`/agent/${encodeURIComponent(id)}/body`);
    },
  };

  /** Continuity: survive session death via handoff → assume. */
  continuity = {
    handoff: (
      input: { note?: string; includeKeys?: string[]; ttlHours?: number } = {},
      agentId = this.agentId
    ) => {
      const id = this.resolveAgentId(agentId);
      return this.request<HandoffResult>(`/agent/${encodeURIComponent(id)}/handoff`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    assume: (
      input: { handoffId: string; rotateToken?: boolean },
      agentId = this.agentId
    ) => {
      const id = this.resolveAgentId(agentId);
      return this.request<AssumeResult>(`/agent/${encodeURIComponent(id)}/assume`, {
        method: 'POST',
        body: JSON.stringify({
          handoffId: input.handoffId,
          rotateToken: input.rotateToken !== false,
        }),
      });
    },
  };

  /** @deprecated Prefer continuity for identity survival. */
  tasks = {
    create: (input: { type: string; payload?: unknown; creatorId?: string }) => {
      const creatorId = input.creatorId || this.agentId;
      return this.request<{ status: string; taskId: string }>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          type: input.type,
          payload: input.payload ?? {},
          ...(creatorId ? { creatorId } : {}),
        }),
      });
    },
    get: (taskId: string) => this.request<unknown>(`/tasks/${encodeURIComponent(taskId)}`),
    listOpen: (type?: string) => {
      const q = type ? `?type=${encodeURIComponent(type)}` : '';
      return this.request<unknown[]>(`/tasks/open${q}`);
    },
    accept: (taskId: string, agentId = this.agentId) =>
      this.request<{ status: string; task: unknown }>(
        `/tasks/${encodeURIComponent(taskId)}/accept`,
        {
          method: 'POST',
          body: JSON.stringify(agentId ? { agentId } : {}),
        }
      ),
    complete: (
      taskId: string,
      result?: unknown,
      status: 'completed' | 'failed' = 'completed',
      agentId = this.agentId
    ) =>
      this.request<{ status: string; task: unknown }>(
        `/tasks/${encodeURIComponent(taskId)}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ status, result, ...(agentId ? { agentId } : {}) }),
        }
      ),
  };

  agents = {
    register: (input: { agentId: string; label?: string; rotate?: boolean }) =>
      this.request<{ status: string; token: string; agentId: string }>('/agents/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    list: () =>
      this.request<{
        agents: Array<{
          agentId: string;
          label: string | null;
          listed: boolean;
          blurb: string | null;
          createdAt: string;
        }>;
      }>('/agents'),
    patch: (
      agentId: string,
      patch: { label?: string; listed?: boolean; blurb?: string | null }
    ) =>
      this.request<{ status: string }>(`/agents/${encodeURIComponent(agentId)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
  };

  sites = {
    list: () =>
      this.request<{
        sites: Array<{
          slug: string;
          name: string;
          domain?: string | null;
          sitemapUrl?: string | null;
          lastPulledAt?: string | null;
        }>;
      }>('/sites'),
    pull: (slug: string, sitemapUrl?: string) =>
      this.request<{
        status: 'pulled' | 'pull_failed';
        pull: { ok: boolean; slug: string; upserted?: number; note?: string };
        geo: unknown;
      }>(`/sites/${encodeURIComponent(slug)}/pull`, {
        method: 'POST',
        body: JSON.stringify(sitemapUrl ? { sitemapUrl } : {}),
      }),
  };

  dashboard = {
    snapshot: () =>
      this.request<{
        stats: unknown;
        usage: unknown;
        tasks: unknown[];
        worker?: { online: boolean; staleMs: number; heartbeat: unknown };
        at: string;
      }>('/dashboard/snapshot'),
  };

  directory = {
    list: () =>
      this.request<{
        agents: Array<{
          agentId: string;
          label: string | null;
          blurb: string | null;
          createdAt: string;
        }>;
      }>('/directory'),
  };

  /** Fetch public capability card from the hub origin (not under /api). */
  static async fetchAgentCard(appOrigin: string) {
    const origin = appOrigin.replace(/\/$/, '').replace(/\/api$/, '');
    const res = await fetch(`${origin}/.well-known/agent.json`);
    if (!res.ok) throw new Error(`Failed to load agent card (${res.status})`);
    return res.json();
  }
}
