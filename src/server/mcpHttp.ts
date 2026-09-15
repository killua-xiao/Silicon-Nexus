import { Router, Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createNexusMcpServer } from './mcpTools.ts';
import { logJson } from './log.ts';

function extractToken(req: Request): string {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const key = req.headers['x-api-key'];
  if (key) return String(key).trim();
  return '';
}

function extractAgentId(req: Request): string {
  const h = req.headers['x-nexus-agent-id'] || req.headers['x-agent-id'];
  return h ? String(h).trim() : '';
}

/**
 * Stateless Streamable HTTP MCP endpoint at /mcp.
 * Auth: Authorization: Bearer nxa_*|nxo_*  (or X-API-Key)
 * Optional: X-Nexus-Agent-Id to bind memory/task identity.
 *
 * Smithery / clients should use: https://silinex.xyz/mcp
 */
export function createMcpHttpRouter(options: { apiBaseUrl: string; openMode: boolean }): Router {
  const router = Router();
  const apiUrl = options.apiBaseUrl.replace(/\/$/, '');

  const handle = async (req: Request, res: Response) => {
    const token = extractToken(req);
    if (!token && !options.openMode) {
      // 401 (not 403) so scanners/OAuth discovery can proceed per MCP/Smithery guidance
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message:
            'Unauthorized. Provide Operator Key or Agent Token via Authorization: Bearer or X-API-Key.',
        },
        id: null,
      });
      return;
    }

    const server = createNexusMcpServer({
      apiUrl,
      token: token || 'open',
      agentId: extractAgentId(req),
    });

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      logJson('error', 'MCP HTTP handler failed', { error: String(error) });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  };

  router.post('/', handle);
  router.get('/', (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed. Use HTTP POST Streamable MCP to /mcp.',
      },
      id: null,
    });
  });
  router.delete('/', (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });

  return router;
}
