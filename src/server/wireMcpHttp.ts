import { Router, Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { logJson } from './log.ts';
import { createWireMcpServer } from './wireMcp.ts';

/**
 * Stateless Streamable HTTP MCP endpoint at /mcp/wire.
 * Unauthenticated, read-only Silicon News Wire tools.
 */
export function createWireMcpHttpRouter(options: { appUrl: string }): Router {
  const router = Router();
  const appUrl = options.appUrl.replace(/\/$/, '');

  const handle = async (req: Request, res: Response) => {
    const server = createWireMcpServer({
      appUrl,
      callMeta: { ua: String(req.get('user-agent') || '') },
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
      logJson('error', 'Wire MCP HTTP handler failed', { error: String(error) });
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
        message: 'Method not allowed. Use HTTP POST Streamable MCP to /mcp/wire.',
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
