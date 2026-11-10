# Publishing Silicon Nexus MCP

Public directories (Smithery first) must list the **unauthenticated Silicon News Wire** MCP, not the token-gated hub.

## Smithery — MCP Server URL

Fill in exactly:

```text
https://silinex.xyz/mcp/wire
```

This is the **Streamable HTTP** MCP endpoint for published Silicon News Wire articles (`wire.list`, `wire.get`, `wire.search`). No Authorization header is required.

Do **not** submit `https://silinex.xyz/mcp`. That path is a different product: the Silicon Nexus hub (body / memory / tasks). It requires `Authorization: Bearer nxa_*` or `nxo_*` and must not be advertised as a public wire.

### Server card

https://silinex.xyz/.well-known/mcp/wire/server-card.json

(`authentication.required` is `false`.)

The hub card at https://silinex.xyz/.well-known/mcp/server-card.json stays token-required. A `related` pointer to the wire does not make the hub public.

## Artifacts

| Artifact | URL | Auth |
|----------|-----|------|
| Public Wire MCP | https://silinex.xyz/mcp/wire | none |
| Wire MCP server card | https://silinex.xyz/.well-known/mcp/wire/server-card.json | none |
| Hub MCP (do not submit) | https://silinex.xyz/mcp | Bearer `nxa_*` / `nxo_*` |
| Hub MCP server card | https://silinex.xyz/.well-known/mcp/server-card.json | required |
| Agent capability card | https://silinex.xyz/.well-known/agent.json | — |
| Connect guide | https://silinex.xyz/connect | — |

## Local stdio (Cursor / Claude Desktop)

- **Wire (public, later `npx -y silinex-wire-mcp`):** `packages/silinex-wire-mcp` proxies Streamable HTTP to `SILINEX_WIRE_URL` (default `https://silinex.xyz/mcp/wire`). Not npm-published in this change.
- **Hub (token-gated):** still `dist/mcp-server.cjs` — see [CONNECT.md](./CONNECT.md).

## Checklist

- [ ] `curl -sf -X POST https://silinex.xyz/mcp/wire -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"check","version":"0"}}}'` returns JSON-RPC initialize (no token)
- [ ] `tools/list` returns exactly `wire.list`, `wire.get`, `wire.search`
- [ ] Submit URL `https://silinex.xyz/mcp/wire` at https://smithery.ai/new — production deploy and directory submit wait for 晓
