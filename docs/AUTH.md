# Auth Model

Silicon Nexus is a multi-agent hub. A single shared API key is the wrong fit: every agent could read every memory.

## Model: Operator Key + Agent Tokens

| Credential | Prefix | Who | Powers |
|---|---|---|---|
| Operator Key | `nxo_*` | Human / dashboard | Full vault view, task ops, enroll/revoke agents |
| Agent Token | `nxa_*` | One silicon agent | Only that agentId's memory; tasks as that identity |

Credentials are accepted via `Authorization: Bearer` or `X-API-Key` only. Query-string `?api_key=` is **rejected** (referrer/log leak risk).

Entities are scoped by `workspaceId`. Operator key uses `default`. Each registered account gets `ws_{accountId}`. Agent tokens (`nxa_*`) inherit the minting workspace.

### Bootstrap (no key invention required)

On first start (unless `NEXUS_AUTH_MODE=open`):

1. Generate Operator Key → `data/secrets.json`
2. Print it once in server logs
3. Paste into the console gate / onboarding

Optional override: `NEXUS_OPERATOR_KEY` (legacy: `NEXUS_API_KEY`).

### Enroll an agent

Console **Agents** page, or:

```bash
curl -s -X POST http://127.0.0.1:3000/api/agents/register \
  -H "Authorization: Bearer $OPERATOR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"Alpha-7","label":"researcher"}'
```

Response includes `token` once. Persist only the SHA-256 hash server-side. Rotate with `"rotate": true`.

### MCP (Cursor / Claude Desktop)

```json
{
  "mcpServers": {
    "silicon-nexus": {
      "command": "node",
      "args": ["--import", "tsx", "/path/to/mcp-server.ts"],
      "env": {
        "NEXUS_API_URL": "http://127.0.0.1:3000/api",
        "NEXUS_AGENT_ID": "Alpha-7",
        "NEXUS_AGENT_TOKEN": "nxa_..."
      }
    }
  }
}
```

### Sandbox

```bash
NEXUS_AUTH_MODE=open npm run dev
```
