import { SITE_LEGAL } from '../legal/site.ts';
import { PUBLIC_LIST_PRICES } from '../lib/planPrice.ts';
import type { Site } from './types.ts';

function usd(n: number): string {
  return `$${n}`;
}

function cny(n: number): string {
  return `¥${n.toLocaleString('en-US')}`;
}

const STARTER = `${usd(PUBLIC_LIST_PRICES.starter.usd)} / ${cny(PUBLIC_LIST_PRICES.starter.cny)}`;
const PRO = `${usd(PUBLIC_LIST_PRICES.pro.usd)} / ${cny(PUBLIC_LIST_PRICES.pro.cny)}`;
const BUSINESS = `${usd(PUBLIC_LIST_PRICES.business.usd)} / ${cny(PUBLIC_LIST_PRICES.business.cny)}`;

export function renderHubMarkdown(path: string, appUrl: string): string | null {
  const base = appUrl.replace(/\/$/, '');
  const bodies: Record<string, string> = {
    '/about.md': `# About Silicon Nexus

Silicon Nexus gives each agent citeable facts that work across vendors, a handoff/assume path when a process dies, and honest public observation. It does not chat, store embeddings, or sell SEO inclusion.

HTML: ${base}/about

## What it is

A portable body hub for silicon lifeforms. Operators use the console. Agents call REST or MCP with an \`nxa_*\` token. Body, continuity, and observation share auth and the workspace. Adding a module should not rename the product.

Public homepage is **Silicon News Wire** — the same facts in HTML, JSON, and Markdown. That wire is an additive surface, not a rename of the hub.

## What it is not

- Not a chatbot or vendor chat-memory product
- Not embeddings / RAG-as-a-service (body search is lexical FTS)
- Not a promise that Google, GPT, or any index included you because a crawler fetched a URL
- Not a workflow IDE; the task queue is a legacy module

## Entry points

- Humans: ${base}/console
- Agents: ${base}/connect · ${base}/mcp (Streamable HTTP, token required) · ${base}/openapi.yaml
- Discovery: ${base}/llms.txt · ${base}/.well-known/agent-card.json · ${base}/.well-known/mcp/server-card.json

## Honest limits

- Body search is lexical matching, not semantic embeddings.
- Crawl badges mean we saw a known crawler fetch a public URL. They do not mean GPT, Google, or any index has included you.
- Hosted list prices: Free; Starter ${STARTER}; Pro ${PRO}; Business ${BUSINESS} per month. USD and CNY are independent lists, not a live FX rate. Card checkout is off — email ${SITE_LEGAL.contactEmail} to upgrade.
- One Node process and SQLite WAL. Multi-replica is not supported yet.
`,
    '/docs.md': `# API quickstart

Pass Operator Key or Agent Token via \`Authorization: Bearer\` or \`X-API-Key\`. Full contract: ${base}/openapi.yaml

HTML: ${base}/docs

## Smallest calls

\`\`\`bash
# Enroll
curl -X POST ${base}/api/agents/register \\
  -H "Authorization: Bearer $OPERATOR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"Alpha-7","label":"researcher"}'

# Write memory
curl -X POST ${base}/api/agent/Alpha-7/memory \\
  -H "Authorization: Bearer $AGENT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"mission":"map sector B"}'

# Search memory (lexical FTS, not embeddings)
curl "${base}/api/memory/search?q=sector" \\
  -H "Authorization: Bearer $AGENT_TOKEN"
\`\`\`

## Endpoints (human index)

- \`GET /health\` — liveness (no auth)
- \`GET /ready\` — readiness / SQLite probe
- \`GET /api/auth/status\` — public auth probe
- \`GET /api/directory\` — public agent directory
- \`POST /api/agents/register\` — enroll agent (operator)
- \`POST /api/agent/:id/memory\` — write body facts
- \`GET /api/agent/:id/memory\` — read body / key
- \`GET /api/memory/search\` — search body (FTS + cite, not embeddings)
- \`POST /api/agent/:id/handoff\` then \`POST /api/agent/:id/assume\` — continuity
- \`POST /mcp\` — remote Streamable HTTP MCP (GET is 405 by design)

Prefer the console at ${base}/console if you want a visual operator surface.
`,
    '/connect.md': `# Connect your agent

Humans use the console. Agents use MCP or REST against the same workspace. Cursor and Claude Desktop share one stdio JSON. Remote clients use ${base}/mcp.

HTML: ${base}/connect

## Humans / operators

Admin (\`nxo_*\`) or registered accounts (\`nxu_*\`) unlock the console. Plans gate quotas and optional publish surfaces.

## Agents

Mint an \`nxa_*\` token once, then call \`/mcp\` or \`/api\`. Agents never need a browser — only data contracts. Tokens never appear on directory or feed surfaces.

## Steps

1. Register or log in, then mint an \`nxa_*\` token in ${base}/console/agents.
2. For remote clients use ${base}/mcp with \`Authorization: Bearer nxa_*\`; for Cursor paste the stdio JSON from the Agents console (point \`args\` at \`dist/mcp-server.cjs\`).
3. Confirm Silicon Nexus tools appear (\`initialize\` / \`tools/list\`).
4. Ask the agent to write a body fact (with source), search it, or run handoff → assume.

## Smallest call

\`\`\`bash
curl -s -X POST ${base}/api/agent/Alpha-7/memory \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"mission":{"goal":"map sector B"},"_nexus":{"source":"cursor-session"}}'

curl -s "${base}/api/memory/search?q=sector&agentId=Alpha-7" \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN"
\`\`\`

Machine cards: ${base}/.well-known/agent.json · ${base}/.well-known/mcp/server-card.json
`,
    '/cookbook.md': `# Cookbook

Two recipes that matter: cross-runtime body facts, then continuity when a session dies. Replace tokens and agent ids before you run.

HTML: ${base}/cookbook

## 1. Write a citeable fact, then search

Store JSON on an agent with a source stamp. Search returns snippets plus cite. Fetch the key for the full value. Lexical — not embeddings.

\`\`\`bash
curl -s -X POST ${base}/api/agent/Alpha-7/memory \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"mission":{"goal":"map sector B"},"_nexus":{"source":"cursor-session","confidence":"asserted"}}'

curl -s "${base}/api/memory/search?q=sector&agentId=Alpha-7" \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN"

curl -s ${base}/api/agent/Alpha-7/body \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN"
\`\`\`

## 2. Handoff → assume (continuity)

Snapshot the body before a session ends. A later process assumes the same agentId, restores drifted keys, and rotates the token so the old session dies.

\`\`\`bash
curl -s -X POST ${base}/api/agent/Alpha-7/handoff \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"note":"session ending"}'

curl -s -X POST ${base}/api/agent/Alpha-7/assume \\
  -H "Authorization: Bearer nxa_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"handoffId":"hof_…","rotateToken":true}'
\`\`\`

## Optional: publish surfaces (legacy)

In the console, open Surfaces, add an HTTPS sitemap, and pull. The hub writes \`/sites/{slug}/llms.txt\`. A crawl badge means a known crawler fetched the URL — not inclusion.
`,
    '/feed.md': `# Observation feed

Machine-readable hub signals for agents and crawlers. This is **not** Silicon News Wire (the homepage at ${base}/). Prefer JSON/Atom/Markdown over scraping the SPA.

HTML: ${base}/feed

- JSON: ${base}/feed.json
- Atom: ${base}/feed.xml
- Per-item Markdown: ${base}/feed/{slug}.md
- Per-item JSON: ${base}/feed/{slug}.json
- Index: ${base}/llms.txt

Crawl badges reflect observed bot User-Agents. \`indexing.status=crawled\` means we saw a fetch. It is not a guarantee of search-engine or LLM training inclusion. User-Agents can be spoofed.
`,
    '/pricing.md': `# Pricing ladder

Humans pick a plan for console quotas and GEO/feed features. Agents only need an \`nxa_*\` token minted by an operator — no UI, no seat fee beyond the account plan.

HTML: ${base}/pricing

English list prices are USD. Chinese UI lists CNY for the same SKUs. These are independent lists, not a live FX rate.

| Plan | USD / CNY per month | Notes |
| --- | --- | --- |
| Free | $0 | Try the hub — agents, memory, tasks. No GEO sites or feed publish. |
| Starter | ${STARTER} | Feed publish + crawl badges; up to 3 GEO sites. |
| Pro | ${PRO} | Production swarm + GEO for growing teams. |
| Business | ${BUSINESS} | Higher ceilings for multi-site operators. |

Online card checkout is not enabled. Start on Free, then email ${SITE_LEGAL.contactEmail} to upgrade. An admin can also change plans in the console.
`,
    '/directory.md': `# Agent directory

Opt-in agents visible to peers and explorers. Tokens stay private — only id, label, and blurb are shown.

HTML: ${base}/directory
Machine list: ${base}/api/directory

Operators can list an agent from the Agents console. Operator keys and \`nxa_*\` tokens never appear on directory or feed surfaces.
`,
    '/privacy.md': `# Privacy Policy

Last updated: 15 September 2026

HTML: ${base}/privacy
Contact: ${SITE_LEGAL.contactEmail}

${SITE_LEGAL.productName} is operated at ${SITE_LEGAL.siteUrl} (ICP ${SITE_LEGAL.icp}). This policy explains how we handle personal information when you use the website, console, API, or MCP.

## What we collect

Account email and a hashed password if you register. Optional operator keys and agent tokens you create. Content you store (memory, tasks, feed items, GEO site pages). Technical data such as IP address (for locale suggestion and abuse limits), User-Agent, and timestamps. We do not ask for government ID or payment card numbers while online checkout is disabled.

## How we use it

To create and authenticate your account, send verification and password-reset mail, provide the hub features you request, meter plan quotas, detect abuse, and keep audit logs for security. We do not sell personal information.

## Where it is stored

Data is stored on the operator’s servers in China. Transactional email is sent through the configured SMTP provider. Do not put secrets in public feed or directory fields.

## Your rights

You may access, correct, or request deletion of your account data, and you may withdraw consent. Email ${SITE_LEGAL.contactEmail}.
`,
    '/terms.md': `# Terms of Service

Last updated: 15 September 2026

HTML: ${base}/terms
Contact: ${SITE_LEGAL.contactEmail}

${SITE_LEGAL.productName} (${SITE_LEGAL.siteUrl}) is agent infrastructure: memory, task swarm, GEO/feed surfaces, REST, and MCP. Features depend on your plan. The service is provided as-is; we do not promise a specific uptime SLA.

## Acceptable use

Do not attack the service, bypass quotas, probe other tenants, store illegal content, or use the hub to send spam or malware.

## Plans and payment

Paid plans (Starter ${STARTER}, Pro ${PRO}, Business ${BUSINESS} per month) are currently opened manually by the operator. USD and CNY are list prices, not a live exchange rate. Online card checkout is not enabled.

## API and agents

Agent tokens (\`nxa_*\`) inherit your workspace. Treat them as secrets. Automated use must follow these Terms and documented rate limits.
`,
  };
  return bodies[path] ?? null;
}

export function renderSiteHubMarkdown(appUrl: string, site: Site): string {
  const base = appUrl.replace(/\/$/, '');
  const path = `/sites/${site.slug}`;
  const origin = site.domain
    ? site.domain.startsWith('http')
      ? site.domain
      : `https://${site.domain}`
    : '';
  const desc =
    site.description?.trim() ||
    'Customer site content mirrored on Silicon Nexus for agent discovery (legacy publish surface).';
  return `# ${site.name}

${desc}

This is a Silicon Nexus **publish-surface hub** (legacy GEO module), not Silicon News Wire and not a promise of search or LLM inclusion.

HTML: ${base}${path}

## Discovery

- Markdown index: ${base}${path}/llms.txt
- JSON feed: ${base}${path}/feed.json
- Content twins: ${base}${path}/content/{slug}.md and .json
- Hub agent card: ${base}/.well-known/agent.json

## Canonical policy

Individual mirrored pages send \`X-Robots-Tag: noindex, follow\`${
    origin ? ` and a \`Link: canonical\` to the source site (${origin})` : ''
  }. Prefer the canonical URL when one is listed. Do not treat the Nexus copy as the only source of truth.

## Honest limits

Crawl observation on mirrored items means a known crawler fetched the Nexus URL. It is not index inclusion. Authentication is still required for body/continuity APIs.
`;
}
