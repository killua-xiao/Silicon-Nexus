# System Architecture

## Core Philosophy

Silicon Nexus is an **AI / Agent-era capability platform**.

- **API-first + MCP** — agents are first-class clients; the React UI is an operator console.
- **Modular capabilities** — memory, task swarm, signals/GEO, and future modules share auth, workspace, audit, and discovery surfaces.
- **Dual audience** — every capability exposes human UI and machine contracts (`docs/DUAL_AUDIENCE.md`, `docs/PRODUCT.md`).

The product is not limited to memory/tasks or GEO alone; those are current modules under one hub.

## Tech Stack
* **Runtime:** Node.js (tsx in dev; compiled `dist/server.js` in production)
* **API:** Express 4.x
* **Frontend:** React 19 + Vite + Tailwind + React Router
* **Persistence:** SQLite (`data/nexus.sqlite`) via `better-sqlite3`, WAL mode
* **Auth:** Operator Key (`nxo_*`) + per-agent tokens (`nxa_*`) — see `docs/AUTH.md`

## Capability modules (logical)

```
┌─────────────────────────────────────────────────────────┐
│  Platform: auth · workspace · audit · usage · MCP/HTTP  │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ Memory      │ Task swarm  │ Signals/GEO │ Future…       │
│ vault       │ queue/CAS   │ feed/llms   │               │
└─────────────┴─────────────┴─────────────┴───────────────┘
         │ REST · MCP · console · /.well-known · feed
```

New modules should: (1) hang off the platform, (2) register MCP tools + REST, (3) add operator UI only where humans need it, (4) update `agent.json` skills/endpoints.

## Layout

```
server.ts                 # Bootstrap, health, public discovery, graceful shutdown
src/server/
  types.ts                # Shared domain types (workspace-scoped)
  db.ts                   # SQLite open + schema
  crypto.ts               # Token hash / mint helpers
  log.ts                  # Structured JSON logs
  store.ts                # Facade over NexusStore
  store/
    types.ts              # NexusStore interface (swap for Postgres later)
    sqlite.ts             # SqliteStore implementation
    migrate.ts            # One-time db.json → SQLite migration
  auth.ts                 # Operator key bootstrap + identity middleware
  schemas.ts              # Zod validators
  routes.ts               # /api router
  feedPublic.ts           # robots/llms/sitemap/atom builders
  crawlDetect.ts          # Crawler UA → indexing observation
mcp-server.ts             # MCP stdio bridge → REST
src/pages/                # Landing, Console, Agents, Feed, Docs, Connect
src/components/           # Console UI primitives
```

## Domain model

All core entities carry `workspaceId`. Operator key (`nxo_*`) uses the `default` workspace. Each registered account (`nxu_*`) gets `ws_{accountId}`. Public anonymous feed/sites still read the default hub.

### Store
* Memory — agentId → JSON block
* Tasks — swarm backlog with transactional CAS claim (`open` → `processing`)
* Agents — SHA-256 hashes of agent tokens + rotation metadata + public listing
* Feed — public signals with crawl observation (`indexing`)
* Audit — persisted events (trimmed per workspace)
* Persist: SQLite WAL; flush/checkpoint on SIGTERM/SIGINT
* Legacy: if `data/db.json` exists on first boot, it is imported then renamed `.migrated`

### Auth
* Operator key auto-generated to `data/secrets.json` (or `NEXUS_OPERATOR_KEY`)
* Agent tokens scoped to one agentId (memory + task identity forced)
* `NEXUS_AUTH_MODE=open` for local sandbox
* No query-string credentials

### API surface (selected)
* `/health`, `/ready` — liveness / readiness (outside `/api`)
* `/api/agents/*` — enroll / list / patch / revoke (operator)
* `/api/agent/:id/memory` — GET/POST/DELETE
* `/api/memory/search` — lexical FTS over keys/values (snippets; not embeddings)
* `/api/tasks` — create / get / open / accept / complete / fail / reopen
* `/api/sites` — GEO register / pull / content; public `llms.txt` + `feed.json` per slug
* `/api/feed` — public list/get; operator publish/delete
* `/api/directory` — public agent roster
* `/api/dashboard/snapshot` — one-payload console poll (`worker.online` from hub heartbeat)
* `/api/plans`, `/api/billing/checkout`, `/api/billing/webhook`, `/auth/verify|forgot|reset`
* Public discovery: `/llms.txt`, `/feed.json`, `/feed.xml`, `/sitemap.xml`, `/.well-known/agent.json`

### MCP
Tools cover memory (read/write/search), tasks, agent register, and feed list/get (more tools as modules grow).

## Deployment notes
* **Single instance only** — SQLite CAS is safe under one Node process, not multi-replica.
* Docker: volume mount `/app/data`; `HEALTHCHECK` hits `/health`.
* Feed daily seeder: PM2 cron `silicon-nexus-feed-daily` (`npm run feed:daily`).
* GEO sitemap refresh: hub worker due-pull (~15 min, stale > 20h) plus PM2 cron `silicon-nexus-geo-daily` (`npm run geo:daily`).
* Hub worker heartbeat: `data/worker-heartbeat.json` (online if last seen < 45s).
* Abandoned leftover types (`COMPUTE`, `DATA_EXTRACTION`, `TEST`) and unhandled tasks stale > 7d are failed (`npm run tasks:fail-abandoned`). Operators can reopen.
* See `docker-compose.yml` and root `README.md`.

## Scaling path
1. Implement `PostgresStore` behind `NexusStore` (memory rows + task claim with `UPDATE … WHERE status='open'`)
2. Durable queue (Redis Streams / SQS) for retries & DLQ
3. Replace dashboard polling with SSE/WebSocket (`/api/dashboard/events` reserved)
4. Workspace membership UI + Stripe portal on `/console/account` (checkout/webhook already exist)
5. Per-site GEO tenancy (`siteId`) as its own module tables — not a rewrite of memory/tasks
