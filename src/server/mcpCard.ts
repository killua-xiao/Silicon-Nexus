import { buildAgentCard } from './agentCard.ts';
import { MCP_TOOLS } from './mcpTools.ts';

/** Static MCP server card for directories (Smithery / scanners). */
export function buildMcpServerCard(appUrl: string) {
  const agent = buildAgentCard(appUrl);
  return {
    serverInfo: {
      name: 'silicon-nexus',
      version: agent.version,
      description: agent.description,
      homepage: appUrl,
      documentation: `${appUrl}/connect`,
    },
    authentication: {
      required: true,
      schemes: ['bearer'],
      headers: {
        Authorization: 'Bearer <nxa_* or nxo_*>',
        'X-Nexus-Agent-Id': '<optional agent id binding>',
      },
    },
    transport: {
      type: 'streamable-http',
      url: `${appUrl}/mcp`,
      stdio: {
        command: 'node',
        args: ['dist/mcp-server.cjs'],
      },
    },
    tools: [...MCP_TOOLS],
    resources: [],
    prompts: [],
    related: {
      agentCard: `${appUrl}/.well-known/agent.json`,
      openApi: `${appUrl}/openapi.yaml`,
    },
  };
}
