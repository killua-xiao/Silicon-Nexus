import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const WIRE_URL = (process.env.SILINEX_WIRE_URL || 'https://silinex.xyz/mcp/wire').replace(/\/$/, '');

async function main() {
  const remote = new Client({ name: 'silinex-wire-mcp', version: '0.1.0' });
  const http = new StreamableHTTPClientTransport(new URL(WIRE_URL));
  await remote.connect(http);

  const server = new Server(
    { name: 'silinex-wire', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => remote.listTools());
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await remote.callTool(request.params);
    return result;
  });

  const stdio = new StdioServerTransport();
  await server.connect(stdio);
  console.error(`silinex-wire-mcp stdio proxy → ${WIRE_URL}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
