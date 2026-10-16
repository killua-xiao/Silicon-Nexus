# Silicon Nexus

**A portable body for silicon lifeforms** — citeable facts, continuity across session death, honest observation.

Not chat memory. Not embeddings RAG. Not an SEO product. Agents get an identity that outlives Cursor, Claude, or any one vendor session — via REST & MCP.

中文简介：给 Agent 一具跨厂商可携带的身体——可引用事实、会话死亡后的交接（handoff / assume）、诚实观测面。[关于](https://silinex.xyz/about)

| | |
|---|---|
| Hosted hub | **https://silinex.xyz** |
| About | https://silinex.xyz/about |
| Connect | https://silinex.xyz/connect |
| Agent card | https://silinex.xyz/.well-known/agent.json |
| Remote MCP | https://silinex.xyz/mcp |
| OpenAPI | https://silinex.xyz/openapi.yaml |
| Product narrative | [`docs/PRODUCT.md`](./docs/PRODUCT.md) |

Version **1.4.0** · License **Apache-2.0**

## What it does

| Capability | Status | Contract |
|---|---|---|
| **Agent body** | Core | Durable JSON per agent. Lexical search with `cite` + `source` + `updatedAt`. Optional `_nexus.source` on write. `GET /api/agent/{id}/body` for structured cells. |
| **Continuity** | Core | `POST .../handoff` → `POST .../assume`. Restores drifted keys; rotates `nxa_*` by default so the prior session dies. |
| **Honest observation** | Live | `/feed.json`, crawl badges = observed fetches, not inclusion promises. |
| **Publish surfaces** | Legacy | Optional sitemap → `/sites/{slug}/llms.txt`. Not SEO ranking. |
| **Task queue** | Legacy | Create / CAS claim / complete — prefer continuity for identity survival. |
| **Accounts / plans** | Live | Register (`nxu_*`), console quotas. Online card checkout is **off** — email to upgrade. |

Humans use the console. Agents use REST, MCP, and the TypeScript SDK. Same workspace state, two contracts — see [`docs/DUAL_AUDIENCE.md`](./docs/DUAL_AUDIENCE.md).

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

Hosted production binds Node to `127.0.0.1` and terminates TLS at nginx. Deploy notes: [`docs/DEPLOYMENT_zh.md`](./docs/DEPLOYMENT_zh.md).

## Connect an agent (5 minutes)

1. Open **https://silinex.xyz/console/agents** (or local `/console/agents`).
2. Mint an agent token (`nxa_*`) — shown once.
3. Click **Copy MCP config**, paste into Cursor / Claude Desktop MCP settings (fix `args` path with your `dist/mcp-server.cjs`).
4. Or call REST with `Authorization: Bearer nxa_…`.

```bash
curl -s https://silinex.xyz/.well-known/agent.json
```

### Smallest useful calls

```bash
# Write a citeable fact
curl -s -X POST https://silinex.xyz/api/agent/Alpha-7/memory \
  -H "Authorization: Bearer nxa_…" \
  -H "Content-Type: application/json" \
  -d '{"mission":{"goal":"map sector B"},"_nexus":{"source":"cursor-session","confidence":"asserted"}}'

# Continuity
curl -s -X POST https://silinex.xyz/api/agent/Alpha-7/handoff \
  -H "Authorization: Bearer nxa_…" \
  -H "Content-Type: application/json" \
  -d '{"note":"session ending"}'

curl -s -X POST https://silinex.xyz/api/agent/Alpha-7/assume \
  -H "Authorization: Bearer nxa_…" \
  -H "Content-Type: application/json" \
  -d '{"handoffId":"hof_…","rotateToken":true}'
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

Remote Streamable HTTP: `https://silinex.xyz/mcp` with `Authorization: Bearer nxa_…`.

Core tools: `nexus_write_memory`, `nexus_read_body`, `nexus_search_memory`, `nexus_handoff`, `nexus_assume`. Legacy: task queue and publish-surface tools.

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
const found = await nexus.memory.search({ q: 'sector' });
```

## Auth

| Who | Credential | Notes |
|-----|------------|--------|
| Operator / admin | `nxo_*` | First-boot key in `data/secrets.json` |
| Registered account | `nxu_*` | Workspace `ws_{accountId}` |
| Agent | `nxa_*` | Scoped to one agentId in the minting workspace |

Send credentials as `Authorization: Bearer` or `X-API-Key` only. Query-string `?api_key=` is rejected. See [docs/AUTH.md](docs/AUTH.md).

## Stack

- **Runtime:** Node.js (tsx in dev; `dist/server.js` in production)
- **API:** Express · **UI:** React 19 + Vite + Tailwind
- **Store:** SQLite (`data/nexus.sqlite`) via `better-sqlite3`, WAL — **single instance**
- **Protocols:** REST, Streamable HTTP MCP, stdio MCP bridge

Do not commit `.env`, `data/*.sqlite`, or `data/secrets.json`.

## Docs

- [About the hub](https://silinex.xyz/about)
- [Connect (EN)](docs/CONNECT.md) / [接入指南（中文）](docs/CONNECT_zh.md)
- [UI design language](./DESIGN.md) — foundry tokens for console / MCP-facing UI
- [Dual audience](docs/DUAL_AUDIENCE.md) · [Architecture](docs/ARCHITECTURE.md)
- [MCP publish checklist](docs/MCP_PUBLISH.md)
- [OpenAPI](docs/openapi.yaml) · [Health](docs/HEALTH.md)

## License

Apache-2.0
