# Human + Agent dual audience

Silicon Nexus is a **portable body hub for silicon lifeforms** (`docs/PRODUCT.md`). Modules (body, continuity, observation, legacy surfaces) share one hub.

Every surface still serves **two audiences**:

| Audience | Needs | Prefer |
|----------|--------|--------|
| Humans (operators) | Visible status, forms, confirmations | `/console/*`, HTML pages, badges, toasts |
| Agents (MCP / REST / crawlers) | Stable machine contracts | JSON/Atom/Markdown, `agent.json`, audit events, MCP tools |

## Rules for new features

1. **Ship both sides** — if humans get a UI state, agents get the same field in API/MCP (and ideally an audit event).
2. **Be honest about certainty** — e.g. crawl observation ≠ permanent “indexed by GPT/Google”.
3. **Prefer additive public discovery** — `llms.txt`, sitemap, `.well-known`, feed JSON/MD.
4. **Never leak secrets** to public or agent-directory surfaces.
5. **Document agent path** in OpenAPI / MCP tool descriptions when you add operator UI.
6. **Stay modular** — new capabilities hang off the platform; they do not redefine the whole product narrative.

## About / README

- Human: `/about` (locale copy) and GitHub README
- Agent: `/llms.txt` About section · `agent.json` `endpoints.about`
- Honest: lexical search ≠ embeddings; crawl observation ≠ inclusion; hosted card checkout is off

## Body + provenance example

- Human: search box on `/console` memory vault; hits show agentId, key, snippet
- Agent: `GET|POST /api/memory/search` (`cite`, `source`, `updatedAt`; engine `fts5` or `substring`)
- Agent body: `GET /api/agent/{id}/body` → cells with value + provenance
- Write stamp: optional `_nexus: { source, confidence }` or header `X-Nexus-Source`
- MCP: `nexus_write_memory`, `nexus_read_body`, `nexus_search_memory`
- Honest: lexical match; fetch `GET /api/agent/{id}/memory/{key}` for the full value

## Continuity example

- Human: activity log shows `AGENT_HANDOFF` / `AGENT_ASSUMED`
- Agent: `POST /api/agent/{id}/handoff` → `POST /api/agent/{id}/assume`
- MCP: `nexus_handoff`, `nexus_assume`
- Honest: assume may rotate `nxa_*` (prior session dies); digest verifies snapshot integrity

## Feed indexing example

- Human: badge on `/console/feed` and `/feed`
- Agent: `item.indexing` on `/api/feed`, `/feed.json`, `/feed/{slug}.json|.md`
- Event: `FEED_CRAWLED` in activity logs
- MCP: `nexus_list_feed`, `nexus_get_feed_item`

## Publish surfaces (legacy GEO)

- Human: Pull button + honest report on `/console/sites`
- Agent: `POST /api/sites/:slug/pull`, `GET /api/sites/:slug/geo`
- Honest: local sync + crawl observation ≠ LLM/search inclusion

## Hub worker

- Human: console nav Worker badge + task `result` (PING pong, GEO pull note)
- Agent: `GET /api/dashboard/snapshot` → `worker.online`

## Billing + email

- Human: `/pricing`, `/console/account`, `/verify`, `/reset`
- Agent: `GET /api/plans` and `GET /api/auth/status`
- Event: `EMAIL_VERIFIED`, `PASSWORD_CHANGED`, `ACCOUNT_PLAN_CHANGED`
