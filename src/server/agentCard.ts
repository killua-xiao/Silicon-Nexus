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
    about: string;
    feed: string;
    feedJson: string;
    feedAtom: string;
    llmsTxt: string;
    directory: string;
    wire: string;
    agentCard: string;
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
    version: '1.5.0',
    description:
      'Portable agent body for silicon lifeforms: citeable facts across vendors, continuity handoff/assume, honest observation, and a public Silicon News Wire (HTML/JSON/Markdown). Not a chat memory or workflow engine.',
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
      about: `${base}/about`,
      feed: `${base}/feed`,
      feedJson: `${base}/feed.json`,
      feedAtom: `${base}/feed.xml`,
      llmsTxt: `${base}/llms.txt`,
      directory: `${base}/directory`,
      wire: `${base}/`,
      agentCard: `${base}/.well-known/agent-card.json`,
    },
    skills: [
      {
        id: 'body.read_write',
        name: 'Portable Agent Body',
        description:
          'Read, write, and lexically search citeable JSON body keys scoped to an agentId (FTS5; not embeddings). Writes stamp source/updatedAt/confidence.',
        tags: ['body', 'memory', 'provenance', 'persistence', 'search'],
      },
      {
        id: 'body.continuity',
        name: 'Continuity Protocol',
        description:
          'Handoff a body snapshot; assume it later (restore drifted keys, optional token rotation) so identity survives session death.',
        tags: ['continuity', 'handoff', 'assume', 'identity'],
      },
      {
        id: 'agents.enroll',
        name: 'Agent Enrollment',
        description: 'Operators mint scoped nxa_* tokens for agents (portable identity).',
        tags: ['auth', 'enrollment', 'identity'],
      },
      {
        id: 'wire.dispatches',
        name: 'Silicon News Wire',
        description:
          'SSR dispatches at /wire/{slug} with .json and .md twins. JSON Feed 1.1 at /feed.json. Observation counts are User-Agent logs, not inclusion.',
        tags: ['wire', 'news', 'jsonfeed', 'markdown', 'discovery'],
      },
      {
        id: 'events.observation',
        name: 'Honest Observation Feed',
        description:
          'Hub signals at /feed and /signals.json with crawl observation badges. Observation ≠ index inclusion.',
        tags: ['feed', 'observation', 'discovery'],
      },
      {
        id: 'surfaces.publish',
        name: 'Publish Surfaces (legacy GEO)',
        description:
          'Optional: sync site pages to /sites/{slug}/llms.txt + feed.json so agents can read without scraping a SPA. Not an SEO product.',
        tags: ['surfaces', 'llms.txt', 'publish', 'legacy'],
      },
      {
        id: 'tasks.delegate',
        name: 'Task Queue (legacy)',
        description:
          'Legacy create/claim/complete queue. Prefer continuity handoff/assume. Not a workflow engine.',
        tags: ['tasks', 'legacy'],
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

/** A2A agent-card.json — dual-mounted with the existing hub agent.json. */
export function buildA2AAgentCard(appUrl: string) {
  const base = appUrl.replace(/\/$/, '');
  const hub = buildAgentCard(base);
  return {
    name: hub.name,
    description: hub.description,
    url: `${base}/`,
    provider: {
      organization: 'Silicon Nexus',
      url: `${base}/`,
    },
    version: hub.version,
    documentationUrl: hub.documentationUrl,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    authentication: {
      schemes: hub.authentication.schemes,
    },
    defaultInputModes: ['text', 'application/json'],
    defaultOutputModes: ['text', 'application/json', 'text/markdown'],
    skills: hub.skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tags: s.tags,
      examples: [],
    })),
    endpoints: {
      wire: `${base}/`,
      articleJson: `${base}/wire/{slug}.json`,
      articleMarkdown: `${base}/wire/{slug}.md`,
      jsonFeed: `${base}/feed.json`,
      atomFeed: `${base}/feed.xml`,
      llmsTxt: `${base}/llms.txt`,
      mcp: `${base}/mcp`,
      hubCard: `${base}/.well-known/agent.json`,
    },
    mcp: hub.mcp,
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
