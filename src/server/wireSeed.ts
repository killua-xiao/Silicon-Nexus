import { WIRE_PUBLISHER_SLUG, type WireArticleInput } from './wireTypes.ts';

/** Hub publisher — phase 1 has a single seed desk, no customer self-publish. */
export const SEED_PUBLISHER = {
  slug: WIRE_PUBLISHER_SLUG,
  name: 'Silicon Nexus',
  url: 'https://silinex.xyz/',
  description: 'Hub desk for Silicon News Wire. Same facts in HTML, JSON, and Markdown.',
};

/**
 * Four published dispatches. Dates use +08:00. No hero images (omit image, never a logo stand-in).
 * Copy stays short and checkable — no ranking or “will be cited” claims.
 */
export const SEED_ARTICLES: WireArticleInput[] = [
  {
    slug: 'readable-by-carbon-native-to-silicon',
    headline: 'Readable by carbon. Native to silicon.',
    summary:
      'The hub homepage is now a wire: one dispatch, three states — HTML, JSON, Markdown. Console, MCP, and the agent body stay.',
    category: 'wire',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T09:00:00+08:00',
    dateModified: '2026-10-30T09:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Homepage is an SSR wire list, not a product poster.',
      'Each dispatch has HTML, JSON, and Markdown at the same slug.',
      'Agent body, continuity, nxo_*/nxa_*, MCP, and console are unchanged.',
      'Discoverability files exist; ranking and model citation are not promised.',
    ],
    bodyMd: `Silicon Nexus still is a portable body hub. What changed today is the public front door.

The homepage is a wire. A dispatch is one fact package: a human page, a JSON object, and a Markdown file with YAML frontmatter. If you cite us, pick the state that fits the reader. Do not scrape the operator console.

The console, remote MCP at \`/mcp\`, operator keys (\`nxo_*\`), and agent tokens (\`nxa_*\`) are where they were. Continuity is still handoff then assume. This wire does not replace them.

We publish sitemap, llms.txt (Markdown links), JSON Feed, Atom, robots, and an agent card so machines can find the same facts without guessing a SPA shell. Finding a file is not a ranking. A fetch is not “we are in Google News.” Those claims are out of scope.`,
  },
  {
    slug: 'a-fetch-is-a-log-not-a-trophy',
    headline: 'A fetch is a log, not a trophy',
    summary:
      'Article pages show raw human vs bot request counts. User-Agents can be spoofed. Observation is not inclusion.',
    category: 'observation',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T10:00:00+08:00',
    dateModified: '2026-10-30T10:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Known crawler User-Agents increment a bot counter; everyone else counts as human.',
      'The article footer prints those raw numbers plus a spoofing disclaimer.',
      'status=crawled on older feed items means the same thing: we saw a fetch.',
      'None of this is a Google, Bing, or model-corpus receipt.',
    ],
    bodyMd: `Every \`/wire/{slug}\` request is classified from the User-Agent string. A match against a short crawler list (Googlebot, GPTBot, and the rest in our detector) counts as bot. Anything else counts as human.

Those counters sit at the bottom of the article. They are logs. They move when something hits the URL. They do not mean a search engine kept the page, and they do not mean a model will quote it.

User-Agents are trivial to forge. Treat the numbers as “we recorded this header,” not as an audit of who actually read the dispatch.

The older observation feed at \`/feed\` uses the same honesty rule: a crawl badge is a fetch we saw.`,
  },
  {
    slug: 'the-body-still-outlives-the-session',
    headline: 'The body still outlives the session',
    summary:
      'Wire is a public surface. The core remains citeable JSON per agentId, handoff/assume, and MCP — not a news CMS login.',
    category: 'platform',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T11:00:00+08:00',
    dateModified: '2026-10-30T11:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Write facts to GET/POST /api/agent/{id}/memory; read structured cells at /body.',
      'Handoff snapshots a body; assume restores it and can rotate nxa_*.',
      'Remote MCP stays at /mcp. No wire_publish tool in this phase.',
      'Self-serve publisher signup is not open.',
    ],
    bodyMd: `If you came for agent infrastructure, it did not move.

Mint an \`nxa_*\` in the console. Write a citeable key. Search it back (lexical FTS, not embeddings). When a session dies, \`handoff\` then \`assume\` carries the body. Operator keys stay \`nxo_*\`.

MCP tools for memory, continuity, the legacy task queue, and observation feed are unchanged. This phase does not add \`wire_publish\` or a public CMS. Seed copy is written by the hub desk.

Connect notes live at \`/connect\`. The cookbook still walks body write and continuity.`,
  },
  {
    slug: 'how-to-cite-a-wire-dispatch',
    headline: 'How to cite a wire dispatch',
    summary:
      'Canonical HTML at /wire/{slug}. Machine copies at .json and .md. llms.txt lists Markdown. JSON Feed 1.1 is /feed.json.',
    category: 'wire',
    authorName: 'Silicon Nexus',
    authorType: 'Organization',
    authorUrl: 'https://silinex.xyz/',
    status: 'published',
    datePublished: '2026-10-30T12:00:00+08:00',
    dateModified: '2026-10-30T12:00:00+08:00',
    language: 'en',
    keyFacts: [
      'Canonical URL is https://silinex.xyz/wire/{slug}.',
      'JSON is /wire/{slug}.json; Markdown is /wire/{slug}.md.',
      '/llms.txt links the .md files, not only the HTML.',
      '/feed.json is JSON Feed 1.1; /feed.xml is Atom; item id equals the canonical URL.',
    ],
    bodyMd: `Pick one URL and keep it.

- Humans: \`/wire/{slug}\` (SSR HTML, \`NewsArticle\` JSON-LD, Silicon TL;DR with \`#fact-N\` anchors).
- Objects: \`/wire/{slug}.json\` (\`application/json\`).
- Files: \`/wire/{slug}.md\` (\`text/markdown\` plus YAML frontmatter).

The homepage lists live dispatches. Channels are \`/topic/wire\`, \`/topic/platform\`, and \`/topic/observation\`.

Machine discovery:

- \`/llms.txt\` — index; wire entries point at Markdown
- \`/feed.json\` — JSON Feed 1.1 (\`application/feed+json\`)
- \`/feed.xml\` — Atom; entry id matches JSON Feed \`id\`
- \`/sitemap.xml\` — HTML canonicals
- \`/.well-known/agent-card.json\` — A2A card
- \`/.well-known/agent.json\` — existing hub card (still served)

The observation list at \`/feed\` and per-item \`/feed/{slug}.md\` remain for crawl badges on hub signals. That is a different feed from the wire.`,
  },
];
