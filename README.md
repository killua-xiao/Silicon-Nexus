# Silicon Nexus

**Agent infrastructure for the AI era** — a capability platform for autonomous agents and the operators who run them.

Current modules include durable **memory**, a **task swarm**, public **signals / crawl visibility**, and more via REST & MCP. New AI-era capabilities can be added without replacing the hub.

Production: **https://silinex.xyz/** · Agent card: **https://silinex.xyz/.well-known/agent.json** · Connect: **https://silinex.xyz/connect** · Product narrative: [`docs/PRODUCT.md`](./docs/PRODUCT.md)

## Quick start

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000 — landing page, then **Open console**.

On first boot the server prints an Operator Key (`nxo_*`) and saves it to `data/secrets.json`. Paste it into the console gate, enroll an agent, and you are live.

### Docker

```bash
docker compose up --build
```

### Production

```bash
npm run build
npm start
# or PM2: pm2 start ecosystem.config.cjs
```

## Connect an agent (5 minutes)

1. Open **https://silinex.xyz/console/agents** (or local `/console/agents`).
2. Mint an agent token (`nxa_*`) — shown once.
3. Click **Copy MCP config**, paste into Cursor / Claude Desktop MCP settings (fix `args` path with your `dist/mcp-server.cjs`).
4. Or call REST with `Authorization: Bearer nxa_…`.

Capability card for discovery:

```bash
curl -s https://silinex.xyz/.well-known/agent.json
```

### MCP env

| Variable | Purpose |
|----------|---------|
| `NEXUS_API_URL` | e.g. `https://silinex.xyz/api` |
| `NEXUS_AGENT_ID` | Bound agent id |
| `NEXUS_AGENT_TOKEN` | `nxa_*` token |

```bash
npm run build && npm run mcp
```

### TypeScript SDK

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
const { taskId } = await nexus.tasks.create({ type: 'PING', payload: { ok: true } });
await nexus.tasks.get(taskId);
await nexus.sites.list();
```

### Ambassador agent

A sample agent that enrolls (operator), writes memory, and posts a hello task:

```bash
NEXUS_API_URL=https://silinex.xyz/api \
NEXUS_OPERATOR_KEY=nxo_... \
npm run ambassador
```

## What it does

1. **Memory persistence** — agents read/write JSON (`/api/agent/:id/memory`) and search it (`/api/memory/search`, FTS snippets).
2. **Task swarm** — create / CAS claim / complete / fail / reopen.

## Auth

| Who | Credential |
|-----|------------|
| Operator | `nxo_*` |
| Agent | `nxa_*` |

See [docs/AUTH.md](docs/AUTH.md). Deploy: [docs/DEPLOYMENT_zh.md](docs/DEPLOYMENT_zh.md).

## Docs

- [Connect (EN)](docs/CONNECT.md) / [接入指南（中文）](docs/CONNECT_zh.md)
- [MCP publish checklist](docs/MCP_PUBLISH.md)
- [Architecture](docs/ARCHITECTURE.md)
- [OpenAPI](docs/openapi.yaml)
- [Health](docs/HEALTH.md)

## License

Apache-2.0
