import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { logJson } from './log.ts';
import {
  articleCanonical,
  articleFactPackage,
  articleJsonUrl,
  articleMdUrl,
  withOffsetIso,
} from './wirePublic.ts';
import {
  getPublishedArticleBySlug,
  listPublishedArticles,
  recordWireMcpCall,
  searchPublishedArticles,
} from './wireStore.ts';
import { isWireCategorySlug, type WireArticle } from './wireTypes.ts';

export const WIRE_MCP_TOOLS = [
  {
    name: 'wire.list',
    description:
      'List published Silicon News Wire articles (newest first). Read-only. Never returns drafts or moderation rows.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max articles to return. Default 20, cap 50.',
        },
        category: {
          type: 'string',
          description: 'Optional wire category slug (e.g. wire, observation).',
        },
      },
      required: [],
    },
  },
  {
    name: 'wire.get',
    description:
      'Fetch one published Silicon News Wire article by slug as a fact package (headline, summary, body, canonical/.md/.json URLs).',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Published article slug' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'wire.search',
    description:
      'Case-insensitive search of published title, summary, and body (English and Chinese fields). Empty matches are an empty list, not an error.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search string' },
        limit: { type: 'number', description: 'Max hits. Default 10, cap 20.' },
      },
      required: ['query'],
    },
  },
] as const;

export function buildWireMcpServerCard(appUrl: string) {
  const base = appUrl.replace(/\/$/, '');
  return {
    serverInfo: {
      name: 'silinex-wire',
      version: '1.5.0',
      description:
        'Silicon News Wire: curated public briefs in HTML, JSON, and Markdown. Read-only. Not a ranking or inclusion claim.',
      homepage: `${base}/`,
      documentation: `${base}/docs`,
    },
    authentication: {
      required: false,
    },
    transport: {
      type: 'streamable-http',
      url: `${base}/mcp/wire`,
    },
    tools: [...WIRE_MCP_TOOLS],
    resources: [],
    prompts: [],
    related: {
      html: `${base}/`,
      llmsTxt: `${base}/llms.txt`,
      hubMcp: `${base}/mcp`,
      hubServerCard: `${base}/.well-known/mcp/server-card.json`,
    },
  };
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function listItem(appUrl: string, article: WireArticle) {
  return {
    title: article.headline,
    slug: article.slug,
    summary: article.summary,
    date_published: withOffsetIso(article.datePublished),
    url: articleCanonical(appUrl, article.slug),
    md_url: articleMdUrl(appUrl, article.slug),
    json_url: articleJsonUrl(appUrl, article.slug),
  };
}

function textResult(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
}

function errorResult(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true as const,
  };
}

export type WireMcpCallMeta = {
  ua?: string;
};

/** Public read-only Wire MCP. Does not register hub body/memory/task tools. */
export function createWireMcpServer(options: { appUrl: string; callMeta?: WireMcpCallMeta }): Server {
  const appUrl = options.appUrl.replace(/\/$/, '');
  const server = new Server(
    { name: 'silinex-wire', version: '1.5.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...WIRE_MCP_TOOLS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'wire.list') {
        const limit = clampInt(args?.limit, 20, 1, 50);
        const rawCategory = typeof args?.category === 'string' ? args.category.trim() : '';
        const articles = rawCategory
          ? isWireCategorySlug(rawCategory)
            ? listPublishedArticles({ category: rawCategory, limit })
            : []
          : listPublishedArticles({ limit });
        observe('wire.list', options.callMeta);
        return textResult({ articles: articles.map((a) => listItem(appUrl, a)) });
      }

      if (name === 'wire.get') {
        const slug = typeof args?.slug === 'string' ? args.slug.trim() : '';
        if (!slug) return errorResult('Error 404: slug is required');
        const article = getPublishedArticleBySlug(slug);
        if (!article) return errorResult(`Error 404: published article not found: ${slug}`);
        observe('wire.get', options.callMeta, { slug });
        return textResult(articleFactPackage(appUrl, article));
      }

      if (name === 'wire.search') {
        const query = typeof args?.query === 'string' ? args.query : '';
        if (!query.trim()) return errorResult('Error: query is required');
        const limit = clampInt(args?.limit, 10, 1, 20);
        const articles = searchPublishedArticles(query, limit);
        observe('wire.search', options.callMeta, { queryLen: query.length });
        return textResult({ query: query.trim(), articles: articles.map((a) => listItem(appUrl, a)) });
      }

      return errorResult(`Unknown tool: ${name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logJson('error', 'Wire MCP tool failed', { tool: name, error: message });
      return errorResult(`Error: ${message}`);
    }
  });

  return server;
}

function observe(
  tool: string,
  meta?: WireMcpCallMeta,
  extra?: { slug?: string; queryLen?: number }
) {
  try {
    recordWireMcpCall({
      tool,
      ua: meta?.ua,
      slug: extra?.slug,
      queryLen: extra?.queryLen,
    });
  } catch (error) {
    logJson('warn', 'mcp_wire_calls insert failed', { error: String(error) });
  }
}
