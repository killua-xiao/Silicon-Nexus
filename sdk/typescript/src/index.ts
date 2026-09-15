export type SiliconNexusOptions = {
  /** Base API URL including /api, e.g. https://silinex.xyz/api */
  baseUrl: string;
  /** Operator (nxo_*) or agent (nxa_*) token */
  token: string;
  /** Default agent id for memory/task identity */
  agentId?: string;
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

  memory = {
    write: (data: Record<string, unknown>, agentId = this.agentId) => {
      if (!agentId) throw new Error('agentId required');
      return this.request<{ status: string; storedKeys: string[] }>(
        `/agent/${encodeURIComponent(agentId)}/memory`,
        { method: 'POST', body: JSON.stringify(data) }
      );
    },
    read: (agentId = this.agentId) => {
      if (!agentId) throw new Error('agentId required');
      return this.request<Record<string, unknown>>(
        `/agent/${encodeURIComponent(agentId)}/memory`
      );
    },
    wipe: (agentId = this.agentId) => {
      if (!agentId) throw new Error('agentId required');
      return this.request<{ status: string }>(
        `/agent/${encodeURIComponent(agentId)}/memory`,
        { method: 'DELETE' }
      );
    },
  };

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
