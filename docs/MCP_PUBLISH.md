# Publishing Silicon Nexus MCP

## Smithery — MCP Server URL

Fill in exactly:

```text
https://silinex.xyz/mcp
```

This is the **Streamable HTTP** MCP endpoint (not the website root, not `/api`).

### Auth when Smithery asks

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer nxo_...` (operator) or `Bearer nxa_...` (agent) |
| `X-Nexus-Agent-Id` | optional, e.g. `Alpha-7` |

If the scan fails without a token, point them at the static card:

https://silinex.xyz/.well-known/mcp/server-card.json

## Artifacts

| Artifact | URL |
|----------|-----|
| Remote MCP | https://silinex.xyz/mcp |
| MCP server card | https://silinex.xyz/.well-known/mcp/server-card.json |
| Agent capability card | https://silinex.xyz/.well-known/agent.json |
| Connect guide | https://silinex.xyz/connect |

## Local stdio (Cursor / Claude Desktop)

Still supported via `dist/mcp-server.cjs` — see [CONNECT.md](./CONNECT.md).

## Checklist

- [ ] `curl -sf -X POST https://silinex.xyz/mcp -H 'Content-Type: application/json' -d '{}'` returns JSON-RPC (401 without token is OK)
- [ ] With Bearer token, `tools/list` initialize flow works
- [ ] Submit URL `https://silinex.xyz/mcp` at https://smithery.ai/new
