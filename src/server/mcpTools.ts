import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export type McpSessionConfig = {
  apiUrl: string;
  token: string;
  agentId: string;
};

export const MCP_TOOLS = [
  {
    name: 'nexus_write_memory',
    description: "Write data to this agent's Memory Vault.",
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'Optional if session agentId is set' },
        data: { type: 'object', description: 'Key-value pairs to store' },
      },
      required: ['data'],
    },
  },
  {
    name: 'nexus_read_memory',
    description: "Read data from this agent's Memory Vault.",
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        key: { type: 'string' },
      },
      required: [],
    },
  },
  {
    name: 'nexus_search_memory',
    description:
      "Lexical search over this agent's memory keys and JSON values (FTS5, substring fallback). Returns snippets with citations — not embeddings, not a chat. Fetch nexus_read_memory with the hit key for the full value. Agent tokens search only their own vault; operators may omit agentId to search the workspace.",
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query (keys and values)' },
        agentId: { type: 'string', description: 'Optional; operators can scope to one agent' },
        limit: { type: 'number', description: 'Max hits, 1–50, default 10' },
      },
      required: ['q'],
    },
  },
  {
    name: 'nexus_create_task',
    description: 'Delegate a sub-task to the Nexus swarm queue.',
    inputSchema: {
      type: 'object',
      properties: {
        creatorId: { type: 'string' },
        type: { type: 'string' },
        payload: { type: 'object' },
      },
      required: ['type', 'payload'],
    },
  },
  {
    name: 'nexus_list_open_tasks',
    description: 'Poll open (unclaimed) tasks, optionally filtered by type.',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string' } },
      required: [],
    },
  },
  {
    name: 'nexus_accept_task',
    description: 'Claim an open task for this agent.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        agentId: { type: 'string' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'nexus_complete_task',
    description: 'Mark a claimed task completed or failed and attach a result.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        agentId: { type: 'string' },
        status: { type: 'string', enum: ['completed', 'failed'] },
        result: { type: 'object' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'nexus_register_agent',
    description: 'Operator-only: enroll an agent and receive a one-time nxa_* token.',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        label: { type: 'string' },
        rotate: { type: 'boolean' },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'nexus_list_feed',
    description:
      'List public signal feed items with indexing.status (unseen|crawled). For agents monitoring crawl observation — not a guarantee of LLM corpus inclusion.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        status: { type: 'string', enum: ['unseen', 'crawled'] },
        since: { type: 'string', description: 'ISO timestamp lower bound' },
      },
      required: [],
    },
  },
  {
    name: 'nexus_get_feed_item',
    description: 'Fetch one public feed item by slug, including indexing crawl observation.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'nexus_list_sites',
    description:
      'List GEO customer sites registered on this hub (slug, name, domain). Use before upserting content.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'nexus_upsert_site',
    description:
      'Create or update a GEO site (operator token). slug becomes the public /sites/{slug}/ path id.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        name: { type: 'string' },
        domain: { type: 'string' },
        description: { type: 'string' },
        sitemapUrl: { type: 'string' },
      },
      required: ['slug', 'name'],
    },
  },
  {
    name: 'nexus_pull_sitemap',
    description:
      'Operator: fetch a site sitemap over HTTPS, pull up to 20 pages into GEO surfaces, and return an honest report (local sync + crawl observation, not LLM/search inclusion).',
    inputSchema: {
      type: 'object',
      properties: {
        siteSlug: { type: 'string' },
        sitemapUrl: { type: 'string', description: 'Optional https sitemap URL override' },
      },
      required: ['siteSlug'],
    },
  },
  {
    name: 'nexus_upsert_content',
    description:
      'Upsert a page into a site GEO surface (operator). Publishes to /sites/{siteSlug}/content/{slug}.md|.json and llms.txt.',
    inputSchema: {
      type: 'object',
      properties: {
        siteSlug: { type: 'string' },
        slug: { type: 'string' },
        title: { type: 'string' },
        summary: { type: 'string' },
        bodyMd: { type: 'string' },
        canonicalUrl: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['siteSlug', 'slug', 'title', 'bodyMd'],
    },
  },
  {
    name: 'nexus_list_content',
    description:
      'List synced content for a GEO site, including indexing.status crawl observation.',
    inputSchema: {
      type: 'object',
      properties: {
        siteSlug: { type: 'string' },
        limit: { type: 'number' },
        status: { type: 'string', enum: ['unseen', 'crawled'] },
      },
      required: ['siteSlug'],
    },
  },
  {
    name: 'nexus_geo_status',
    description:
      'GEO status for a site: content counts, crawl observation summary, and public surface URLs. Crawl ≠ guaranteed LLM/search inclusion.',
    inputSchema: {
      type: 'object',
      properties: {
        siteSlug: { type: 'string' },
      },
      required: ['siteSlug'],
    },
  },
] as const;

function authHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['X-API-Key'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function resolveAgentId(cfg: McpSessionConfig, requested?: unknown): string {
  const fromArgs = typeof requested === 'string' ? requested.trim() : '';
  if (cfg.agentId) {
    if (fromArgs && fromArgs !== cfg.agentId) {
      throw new Error(
        `This MCP session is bound to agent "${cfg.agentId}"; cannot act as "${fromArgs}".`
      );
    }
    return cfg.agentId;
  }
  if (!fromArgs) {
    throw new Error('agentId is required (set header X-Nexus-Agent-Id or pass agentId).');
  }
  return fromArgs;
}

async function apiJson(cfg: McpSessionConfig, path: string, init?: RequestInit) {
  const base = cfg.apiUrl.replace(/\/$/, '');
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...authHeaders(cfg.token), ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      (data as { error?: string; message?: string }).error ||
      (data as { message?: string }).message ||
      `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

/** Create an MCP Server instance wired to a specific token/agent session. */
export function createNexusMcpServer(cfg: McpSessionConfig): Server {
  const server = new Server(
    { name: 'silicon-nexus', version: '1.3.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...MCP_TOOLS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'nexus_write_memory') {
        const agentId = resolveAgentId(cfg, args?.agentId);
        const data = await apiJson(cfg, `/agent/${agentId}/memory`, {
          method: 'POST',
          body: JSON.stringify(args?.data ?? {}),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_read_memory') {
        const agentId = resolveAgentId(cfg, args?.agentId);
        const keyPath = args?.key ? `/${args.key}` : '';
        const data = await apiJson(cfg, `/agent/${agentId}/memory${keyPath}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_search_memory') {
        const q = String(args?.q ?? '').trim();
        if (!q) throw new Error('q is required');
        const params = new URLSearchParams({ q });
        if (typeof args?.limit === 'number' && Number.isFinite(args.limit)) {
          params.set('limit', String(args.limit));
        }
        if (cfg.token.startsWith('nxa_') || cfg.agentId) {
          params.set('agentId', resolveAgentId(cfg, args?.agentId));
        } else if (typeof args?.agentId === 'string' && args.agentId.trim()) {
          params.set('agentId', args.agentId.trim());
        }
        const data = await apiJson(cfg, `/memory/search?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_create_task') {
        const body: Record<string, unknown> = {
          type: args?.type,
          payload: args?.payload,
        };
        if (!cfg.token.startsWith('nxa_')) {
          const creatorId =
            cfg.agentId || (typeof args?.creatorId === 'string' ? args.creatorId : '');
          if (!creatorId) {
            throw new Error('creatorId is required when not using a bound agent token.');
          }
          body.creatorId = creatorId;
        }
        const data = await apiJson(cfg, '/tasks', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_list_open_tasks') {
        const qs = args?.type ? `?type=${encodeURIComponent(String(args.type))}` : '';
        const data = await apiJson(cfg, `/tasks/open${qs}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_accept_task') {
        const body: Record<string, unknown> = {};
        if (!cfg.token.startsWith('nxa_')) {
          body.agentId = resolveAgentId(cfg, args?.agentId);
        }
        const data = await apiJson(cfg, `/tasks/${args?.taskId}/accept`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_complete_task') {
        const body: Record<string, unknown> = {
          status: args?.status || 'completed',
          result: args?.result ?? {},
        };
        if (!cfg.token.startsWith('nxa_')) {
          body.agentId = resolveAgentId(cfg, args?.agentId);
        }
        const data = await apiJson(cfg, `/tasks/${args?.taskId}/complete`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_register_agent') {
        const data = await apiJson(cfg, '/agents/register', {
          method: 'POST',
          body: JSON.stringify({
            agentId: args?.agentId,
            label: args?.label,
            rotate: args?.rotate ?? false,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_list_feed') {
        const qs = new URLSearchParams();
        if (args?.limit != null) qs.set('limit', String(args.limit));
        if (args?.status) qs.set('status', String(args.status));
        if (args?.since) qs.set('since', String(args.since));
        const q = qs.toString() ? `?${qs}` : '';
        const data = await apiJson(cfg, `/feed${q}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_get_feed_item') {
        const slug = String(args?.slug || '');
        if (!slug) throw new Error('slug is required');
        const data = await apiJson(cfg, `/feed/${encodeURIComponent(slug)}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_list_sites') {
        const data = await apiJson(cfg, '/sites');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_upsert_site') {
        const data = await apiJson(cfg, '/sites', {
          method: 'POST',
          body: JSON.stringify({
            slug: args?.slug,
            name: args?.name,
            domain: args?.domain ?? null,
            description: args?.description ?? '',
            sitemapUrl: args?.sitemapUrl ?? null,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_upsert_content') {
        const siteSlug = String(args?.siteSlug || '');
        if (!siteSlug) throw new Error('siteSlug is required');
        const data = await apiJson(cfg, `/sites/${encodeURIComponent(siteSlug)}/content`, {
          method: 'POST',
          body: JSON.stringify({
            slug: args?.slug,
            title: args?.title,
            summary: args?.summary,
            bodyMd: args?.bodyMd,
            canonicalUrl: args?.canonicalUrl ?? null,
            tags: args?.tags,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_list_content') {
        const siteSlug = String(args?.siteSlug || '');
        if (!siteSlug) throw new Error('siteSlug is required');
        const qs = new URLSearchParams();
        if (args?.limit != null) qs.set('limit', String(args.limit));
        if (args?.status) qs.set('status', String(args.status));
        const q = qs.toString() ? `?${qs}` : '';
        const data = await apiJson(
          cfg,
          `/sites/${encodeURIComponent(siteSlug)}/content${q}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_pull_sitemap') {
        const siteSlug = String(args?.siteSlug || '');
        if (!siteSlug) throw new Error('siteSlug is required');
        const body: Record<string, unknown> = {};
        if (typeof args?.sitemapUrl === 'string' && args.sitemapUrl) {
          body.sitemapUrl = args.sitemapUrl;
        }
        const data = await apiJson(cfg, `/sites/${encodeURIComponent(siteSlug)}/pull`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      if (name === 'nexus_geo_status') {
        const siteSlug = String(args?.siteSlug || '');
        if (!siteSlug) throw new Error('siteSlug is required');
        const data = await apiJson(cfg, `/sites/${encodeURIComponent(siteSlug)}/geo`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error calling Silicon Nexus API: ${error.message}` }],
        isError: true,
      };
    }
  });

  return server;
}
