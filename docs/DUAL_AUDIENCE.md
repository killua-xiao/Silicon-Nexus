# Human + Agent dual audience

Silicon Nexus is an **AI / Agent-era capability platform** (`docs/PRODUCT.md`). Modules (memory, swarm, signals/GEO, …) share one hub.

Every surface still serves **two audiences**:

| Audience | Needs | Prefer |
|----------|--------|--------|
| Humans (operators / publishers) | Visible status, forms, confirmations | `/console/*`, HTML pages, badges, toasts |
| Agents (MCP / REST / crawlers) | Stable machine contracts | JSON/Atom/Markdown, `agent.json`, audit events, MCP tools |

## Rules for new features

1. **Ship both sides** — if humans get a UI state, agents get the same field in API/MCP (and ideally an audit event).
2. **Be honest about certainty** — e.g. crawl observation ≠ permanent “indexed by GPT/Google”.
3. **Prefer additive public discovery** — `llms.txt`, sitemap, `.well-known`, feed JSON/MD.
4. **Never leak secrets** to public or agent-directory surfaces.
5. **Document agent path** in OpenAPI / MCP tool descriptions when you add operator UI.
6. **Stay modular** — new capabilities hang off the platform; they do not redefine the whole product narrative.

## Feed indexing example

- Human: badge on `/console/feed` and `/feed`
- Agent: `item.indexing` on `/api/feed`, `/feed.json`, `/feed/{slug}.json|.md`
- Event: `FEED_CRAWLED` in activity logs
- MCP: `nexus_list_feed`, `nexus_get_feed_item`

## GEO sitemap example

- Human: Pull button + honest report on `/console/sites`; last pull timestamp
- Agent: `POST /api/sites/:slug/pull`, `siteGeoStatus.lastPullNote`; SDK `sites.list` / `sites.pull`
- Scheduled: hub worker due-pull (stale sitemap) + `npm run geo:daily` cron
- Event: `SITE_CREATED` / pull note on the site record
- MCP: `nexus_pull_sitemap`, `nexus_geo_status`
- Honest: local sync + crawl observation ≠ LLM/search inclusion

## Hub worker

- Human: console nav Worker badge + task `result` (PING pong, GEO pull note)
- Agent: `GET /api/dashboard/snapshot` → `worker.online`; `GET /api/tasks/:taskId` → `result`

## Billing + email

- Human: `/pricing`, `/console/account`, `/verify`, `/reset`
- Agent: `GET /api/plans` (`stripeConfigured`) and `GET /api/auth/status` (`email`, `billing`)
- Event: `EMAIL_VERIFIED`, `PASSWORD_CHANGED`, `ACCOUNT_PLAN_CHANGED`
