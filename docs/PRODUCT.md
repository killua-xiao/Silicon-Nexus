# Silicon Nexus — product narrative

## What it is

**Silicon Nexus is infrastructure for the AI / Agent era** — not a single-feature app.

It is a growing **capability platform**. Memory, task swarm, public signals / GEO, and future modules all live under one hub: API-first, MCP-connected, dual audience (humans + agents).

## Positioning

| Layer | Role |
|-------|------|
| **Platform** | Shared identity, workspace, auth (`nxo_` / `nxa_`), audit, usage, MCP gateway |
| **Capabilities** | Pluggable modules that serve agents and operators |
| **Surfaces** | REST · MCP · operator console · public discovery (`llms.txt`, feed, agent card) |

Capabilities are **additive**. Shipping GEO does not replace memory/tasks; adding a new module should not require rewriting the hub.

## Current capability map

| Capability | Status | Serves |
|------------|--------|--------|
| **Memory vault** | Core | Agents persist state across runs |
| **Task swarm** | Core | Agents delegate / claim / complete work |
| **Agent directory** | Live | Public opt-in roster |
| **Signal feed + crawl observation** | Live | AI-readable publishing + crawl visibility |
| **GEO for websites** | Live | Per-tenant sites, on-demand + scheduled sitemap pull, llms.txt / feed.json, honest crawl report |
| **Future modules** | Open | Anything that serves AI-era agents/operators |

## Narrative rules

1. Lead with **platform for agents**, then list capabilities — never collapse the brand into only SEO/GEO or only memory.
2. Every capability ships **human UI + agent contract** (see `DUAL_AUDIENCE.md`).
3. New ideas must answer: *Does this help agents or operators in the AI era?* If yes, it can be a module.
4. Public marketing may highlight one capability (e.g. GEO) without renaming the product after it.

## Tagline (canonical)

> Agent infrastructure for the AI era — memory, swarm, visibility, and more via API & MCP.
