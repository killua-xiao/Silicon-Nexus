export type AgentCard = {
  name: string;
  version: string;
  description: string;
  url: string;
  documentationUrl: string;
  openApiUrl: string;
  protocolVersion: string;
  authentication: {
    schemes: string[];
    operatorKeyPrefix: string;
    agentTokenPrefix: string;
  };
  endpoints: {
    api: string;
    health: string;
    ready: string;
    mcpHttp: string;
    mcpHint: string;
    feed: string;
    feedJson: string;
    feedAtom: string;
    llmsTxt: string;
    directory: string;
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
  mcp: {
    transport: string;
    url: string;
    stdioHint: string;
    env: string[];
    headers: string[];
  };
};

export function buildAgentCard(appUrl: string): AgentCard {
  const base = appUrl.replace(/\/$/, '');
  return {
    name: 'Silicon Nexus',
    version: '1.3.0',
    description:
      'Agent infrastructure platform for the AI era: durable memory, task swarm, public signals/GEO surfaces, and extensible MCP capabilities for autonomous agents and operators.',
    url: base,
    documentationUrl: `${base}/docs`,
    openApiUrl: `${base}/openapi.yaml`,
    protocolVersion: 'nexus.agent-card/1',
    authentication: {
      schemes: ['Bearer', 'X-API-Key'],
      operatorKeyPrefix: 'nxo_',
      agentTokenPrefix: 'nxa_',
    },
    endpoints: {
      api: `${base}/api`,
      health: `${base}/health`,
      ready: `${base}/ready`,
      mcpHttp: `${base}/mcp`,
      mcpHint: 'Remote Streamable HTTP at /mcp, or stdio via dist/mcp-server.cjs',
      feed: `${base}/feed`,
      feedJson: `${base}/feed.json`,
      feedAtom: `${base}/feed.xml`,
      llmsTxt: `${base}/llms.txt`,
      directory: `${base}/directory`,
    },
    skills: [
      {
        id: 'memory.read_write',
        name: 'Agent Memory Vault',
        description:
          'Read, write, and lexically search durable JSON memory scoped to an agentId (FTS5; not embeddings).',
        tags: ['memory', 'state', 'persistence', 'search'],
      },
      {
        id: 'tasks.delegate',
        name: 'Task Swarm',
        description: 'Create, claim (CAS), complete, fail, or reopen delegation tasks.',
        tags: ['tasks', 'delegation', 'swarm'],
      },
      {
        id: 'agents.enroll',
        name: 'Agent Enrollment',
        description: 'Operators mint scoped nxa_* tokens for agents.',
        tags: ['auth', 'enrollment'],
      },
      {
        id: 'feed.signals',
        name: 'Public Signal Feed',
        description:
          'AI-readable public signals at /feed.json and /feed.xml for crawlers and agents.',
        tags: ['feed', 'discovery', 'crawlers'],
      },
      {
        id: 'geo.sites_sync',
        name: 'Multi-site GEO Sync',
        description:
          'Register customer sites, pull HTTPS sitemaps (on demand, worker due-pull, or daily cron), and sync pages to /sites/{slug}/llms.txt + feed.json. Crawl observation ≠ guaranteed inclusion.',
        tags: ['geo', 'sites', 'sync', 'llms.txt'],
      },
    ],
    mcp: {
      transport: 'streamable-http',
      url: `${base}/mcp`,
      stdioHint: 'npm run mcp / dist/mcp-server.cjs',
      env: ['NEXUS_API_URL', 'NEXUS_AGENT_ID', 'NEXUS_AGENT_TOKEN'],
      headers: ['Authorization: Bearer <nxa_or_nxo>', 'X-Nexus-Agent-Id: <optional>'],
    },
  };
}

/** Cursor / Claude Desktop MCP config snippet for an enrolled agent. */
export function buildMcpConfigSnippet(input: {
  appUrl: string;
  agentId: string;
  agentToken?: string;
  mcpServerPath?: string;
}): Record<string, unknown> {
  const api = `${input.appUrl.replace(/\/$/, '')}/api`;
  const serverPath = input.mcpServerPath || '/path/to/Silicon-Nexus/dist/mcp-server.cjs';
  return {
    mcpServers: {
      'silicon-nexus': {
        command: 'node',
        args: [serverPath],
        env: {
          NEXUS_API_URL: api,
          NEXUS_AGENT_ID: input.agentId || 'YOUR_AGENT_ID',
          NEXUS_AGENT_TOKEN: input.agentToken || 'nxa_YOUR_TOKEN',
        },
      },
    },
  };
}
