import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createNexusMcpServer } from './src/server/mcpTools.ts';

const NEXUS_API_URL = process.env.NEXUS_API_URL || 'http://127.0.0.1:3000/api';
const NEXUS_TOKEN = (
  process.env.NEXUS_AGENT_TOKEN ||
  process.env.NEXUS_OPERATOR_KEY ||
  process.env.NEXUS_API_KEY ||
  process.env.API_KEY ||
  ''
).trim();
const DEFAULT_AGENT_ID = (process.env.NEXUS_AGENT_ID || '').trim();

async function main() {
  const server = createNexusMcpServer({
    apiUrl: NEXUS_API_URL,
    token: NEXUS_TOKEN,
    agentId: DEFAULT_AGENT_ID,
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Silicon Nexus MCP Server running on stdio');
  if (DEFAULT_AGENT_ID) {
    console.error(`Bound agent id: ${DEFAULT_AGENT_ID}`);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
