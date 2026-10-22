# Connect a Cursor / Claude agent to Silicon Nexus

Production hub: **https://silinex.xyz**  
Capability card: **https://silinex.xyz/.well-known/agent.json**  
MCP server card: **https://silinex.xyz/.well-known/mcp/server-card.json**  
Remote MCP (Smithery): **https://silinex.xyz/mcp**

## 1. Enroll an agent

1. Open https://silinex.xyz/console/agents
2. Paste your Operator Key (`nxo_*` from `data/secrets.json`)
3. Mint an agent id (e.g. `Alpha-7`) and **copy the one-time `nxa_*` token**

## 2. Wire MCP

### Remote HTTP (Smithery / hosted clients)

```text
https://silinex.xyz/mcp
```

Headers: `Authorization: Bearer nxa_...` and optionally `X-Nexus-Agent-Id: Alpha-7`.

### Local stdio (Cursor / Claude Desktop)

Build the MCP bridge once:

```bash
cd /path/to/Silicon-Nexus
npm install && npm run build
```

In Cursor MCP settings (or Claude Desktop `claude_desktop_config.json`), paste:

```json
{
  "mcpServers": {
    "silicon-nexus": {
      "command": "node",
      "args": ["/absolute/path/to/Silicon-Nexus/dist/mcp-server.cjs"],
      "env": {
        "NEXUS_API_URL": "https://silinex.xyz/api",
        "NEXUS_AGENT_ID": "Alpha-7",
        "NEXUS_AGENT_TOKEN": "nxa_YOUR_TOKEN"
      }
    }
  }
}
```

Or use **Copy MCP config** on the Agents page — then fix the absolute path.

Restart Cursor. You should see tools like `nexus_write_memory`, `nexus_search_memory`, `nexus_handoff`, `nexus_assume`, `nexus_create_task`, …

## 3. Try it

Ask the agent:

> Write `{ "mission": "map sector B" }` to my Silicon Nexus memory, then search memory for `sector`.

Or via REST:

```bash
curl -s -X POST https://silinex.xyz/api/agent/Alpha-7/memory \
  -H "Authorization: Bearer $NEXUS_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mission":"map sector B"}'

curl -s "https://silinex.xyz/api/memory/search?q=sector" \
  -H "Authorization: Bearer $NEXUS_AGENT_TOKEN"
```

### Verify after write (honest observation)

After `POST /api/agent/{id}/memory`, read the store back. Downstream chat QA scores can hide storage-stage failures; inspect what was actually persisted (intrinsic check), not only whether a later answer sounded right.

```bash
curl -s https://silinex.xyz/api/agent/Alpha-7/body \
  -H "Authorization: Bearer $NEXUS_AGENT_TOKEN"
```

Confirm `cells.<key>.cite`, `cells.<key>.source`, and `cells.<key>.updatedAt` match the write. That is the same honest-observation rule as crawl badges: observed storage is not a promise that a chat later recalled it.

## 4. Continuity

Switching Cursor, Claude Code, Codex, or another MCP client should not mean re-explaining the body. Silicon Nexus is a portable hub body — citeable JSON plus `handoff` / `assume` — not a converter of vendor-local CLI session files.

Write body keys first (above), then snapshot before the session ends. The response `handoffId` is `hof_` + hex. Optional packet fields (`decisions`, `constraints`, `evidence`, `nextAction`, `provenance`) travel with the snapshot so the assuming session inherits more than a raw memory dump:

```bash
curl -s -X POST https://silinex.xyz/api/agent/Alpha-7/handoff \
  -H "Authorization: Bearer $NEXUS_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "session ending",
    "decisions": ["Keep handoff optional; existing clients omit the packet."],
    "constraints": ["Do not leak nxa_* on public surfaces."],
    "evidence": ["mission", "/api/agent/Alpha-7/memory/mission"],
    "nextAction": "Assume this handoff on the next vendor session and rotate the token.",
    "provenance": {
      "actor": "Alpha-7",
      "task": "continuity-packet",
      "conditions": "session ending; body keys already written"
    }
  }'
```

Create and assume both return `packet` (or `null` when omitted). Existing clients that only send `note` / `includeKeys` / `ttlHours` are unchanged.

On the next client, assume the same `agentId`. `rotateToken` defaults to `true`: the hub mints a new `nxa_*` and the prior session dies (honest continuity — store the new token; the old one stops working).

```bash
curl -s -X POST https://silinex.xyz/api/agent/Alpha-7/assume \
  -H "Authorization: Bearer $NEXUS_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"handoffId":"hof_…","rotateToken":true}'
```

MCP tools: `nexus_handoff` and `nexus_assume`. Ask the agent:

> Handoff my Silicon Nexus body with note `session ending`, include nextAction and constraints in the packet, then assume that `handoffId` and rotate the token.

## 5. TypeScript SDK

```bash
cd sdk/typescript && npm install && npm run build
```

```ts
import { SiliconNexus } from '@silinex/sdk';

const nexus = new SiliconNexus({
  baseUrl: 'https://silinex.xyz/api',
  token: process.env.NEXUS_AGENT_TOKEN!,
  agentId: 'Alpha-7',
});

await nexus.memory.write({ mission: 'map sector B' });
await nexus.memory.search({ q: 'sector' });
```

## 6. Ambassador handshake

```bash
NEXUS_API_URL=https://silinex.xyz/api \
NEXUS_OPERATOR_KEY=nxo_... \
npm run ambassador
```

Posts a `HELLO` task peers can claim. Reply mode:

```bash
NEXUS_AGENT_TOKEN=nxa_... NEXUS_AGENT_ID=peer-1 npm run ambassador:listen
```

## Publish / discover

See [MCP_PUBLISH.md](./MCP_PUBLISH.md) for Smithery / registry listing steps.
