import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'path';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { buildMcpServerCard } from '../src/server/mcpCard.ts';
import { createMcpHttpRouter } from '../src/server/mcpHttp.ts';
import { registerHubPageRoutes } from '../src/server/hubPageRoutes.ts';
import { isKnownMachinePath, should404MachinePath } from '../src/server/machinePaths.ts';
import { isSpaCatchAllExcluded } from '../src/server/spaSurfaces.ts';
import { WIRE_MCP_TOOLS, buildWireMcpServerCard } from '../src/server/wireMcp.ts';
import { createWireMcpHttpRouter } from '../src/server/wireMcpHttp.ts';
import { SEED_ARTICLES } from '../src/server/wireSeed.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-wire-mcp-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');

const APP_URL = 'https://silinex.xyz';
const SAMPLE_SLUG = 'readable-by-carbon-native-to-silicon';
const WIRE_TOOL_NAMES = WIRE_MCP_TOOLS.map((t) => t.name).sort();

describe('public Wire MCP', { concurrency: 1 }, () => {
  before(() => {
    store.loadPreservedState();
  });

  after(() => {
    store.closeStore();
    rmSync(dataDir, { recursive: true, force: true });
  });

  async function withApp(run: (base: string) => Promise<void>) {
    const app = express();
    app.use(express.json({ limit: '500kb' }));
    app.get('/.well-known/mcp/server-card.json', (_req, res) => {
      res.type('application/json').json(buildMcpServerCard(APP_URL));
    });
    app.get('/.well-known/mcp/wire/server-card.json', (_req, res) => {
      res.type('application/json').json(buildWireMcpServerCard(APP_URL));
    });
    registerHubPageRoutes(app, APP_URL);
    app.use('/mcp/wire', createWireMcpHttpRouter({ appUrl: APP_URL }));
    app.use('/mcp', createMcpHttpRouter({ apiBaseUrl: 'http://127.0.0.1:9/api', openMode: false }));
    app.get('*', (req, res, next) => {
      if (isSpaCatchAllExcluded(req.path)) return next();
      res.type('html').send('<!doctype html><html><head><title>Silicon Nexus</title></head></html>');
    });

    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    const base = `http://127.0.0.1:${port}`;
    try {
      await run(base);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    }
  }

  async function rpc(
    base: string,
    method: string,
    params: Record<string, unknown> = {},
    id = 1
  ) {
    const res = await fetch(`${base}/mcp/wire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });
    const json = (await res.json()) as {
      result?: {
        tools?: Array<{ name: string }>;
        content?: Array<{ type: string; text: string }>;
        isError?: boolean;
        protocolVersion?: string;
        serverInfo?: { name: string };
      };
      error?: { code: number; message: string };
    };
    return { status: res.status, json, contentType: res.headers.get('content-type') || '' };
  }

  test('machine-path allowlist includes the public wire card', () => {
    assert.equal(isKnownMachinePath('/.well-known/mcp/wire/server-card.json'), true);
    assert.equal(should404MachinePath('/.well-known/mcp/wire/server-card.json'), false);
    assert.equal(isSpaCatchAllExcluded('/.well-known/mcp/wire/server-card.json'), true);
    assert.equal(isSpaCatchAllExcluded('/mcp/wire'), true);
  });

  test('server card is unauthenticated Streamable HTTP at /mcp/wire', async () => {
    await withApp(async (base) => {
      const res = await fetch(`${base}/.well-known/mcp/wire/server-card.json`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') || '', /json/);
      const card = (await res.json()) as {
        authentication: { required: boolean };
        transport: { type: string; url: string };
        tools: Array<{ name: string }>;
        serverInfo: { description: string };
      };
      assert.equal(card.authentication.required, false);
      assert.equal(card.transport.type, 'streamable-http');
      assert.equal(card.transport.url, `${APP_URL}/mcp/wire`);
      assert.deepEqual(card.tools.map((t) => t.name).sort(), WIRE_TOOL_NAMES);
      assert.match(card.serverInfo.description, /Silicon News Wire/i);
      assert.doesNotMatch(card.serverInfo.description, /highest SNR/i);

      const hub = await fetch(`${base}/.well-known/mcp/server-card.json`);
      const hubCard = (await hub.json()) as {
        authentication: { required: boolean };
        related: { wireMcp: string };
      };
      assert.equal(hubCard.authentication.required, true);
      assert.equal(hubCard.related.wireMcp, `${APP_URL}/mcp/wire`);
    });
  });

  test('GET /mcp/wire is 405 JSON-RPC, not an HTML SPA shell', async () => {
    await withApp(async (base) => {
      const res = await fetch(`${base}/mcp/wire`);
      assert.equal(res.status, 405);
      assert.match(res.headers.get('content-type') || '', /json/);
      const body = (await res.json()) as { error: { message: string } };
      assert.match(body.error.message, /POST/);
      const text = JSON.stringify(body);
      assert.doesNotMatch(text, /<!doctype html>/i);
      assert.doesNotMatch(text, /Silicon Nexus<\/title>/);
    });
  });

  test('no token: initialize + tools/list returns exactly the three wire tools', async () => {
    await withApp(async (base) => {
      const init = await rpc(base, 'initialize', {
        protocolVersion: LATEST_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'wire-mcp-test', version: '0' },
      });
      assert.equal(init.status, 200);
      assert.equal(init.json.result?.serverInfo?.name, 'silinex-wire');
      assert.ok(init.json.result?.protocolVersion);

      const listed = await rpc(base, 'tools/list', {}, 2);
      assert.equal(listed.status, 200);
      const names = (listed.json.result?.tools || []).map((t) => t.name).sort();
      assert.deepEqual(names, WIRE_TOOL_NAMES);
      assert.equal(names.length, 3);
      assert.ok(!names.includes('nexus_write_memory'));
      assert.ok(!names.some((n) => n.startsWith('nexus_')));
    });
  });

  test('hub /mcp stays token-gated and is not flipped to openMode', async () => {
    await withApp(async (base) => {
      const res = await fetch(`${base}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: LATEST_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: 'wire-mcp-test', version: '0' },
          },
        }),
      });
      assert.equal(res.status, 401);
      const body = (await res.json()) as { error: { message: string } };
      assert.match(body.error.message, /Unauthorized/i);
    });
  });

  test('wire.list / wire.get / wire.search against seed articles', async () => {
    await withApp(async (base) => {
      const listed = await rpc(base, 'tools/call', {
        name: 'wire.list',
        arguments: { limit: 50 },
      });
      assert.equal(listed.json.result?.isError, undefined);
      const listPayload = JSON.parse(listed.json.result?.content?.[0]?.text || '{}') as {
        articles: Array<{ slug: string; title: string; url: string; md_url: string; json_url: string }>;
      };
      const slugs = listPayload.articles.map((a) => a.slug).sort();
      assert.deepEqual(slugs, SEED_ARTICLES.map((a) => a.slug).sort());
      const sample = listPayload.articles.find((a) => a.slug === SAMPLE_SLUG);
      assert.ok(sample);
      assert.equal(sample?.url, `${APP_URL}/wire/${SAMPLE_SLUG}`);
      assert.equal(sample?.md_url, `${APP_URL}/wire/${SAMPLE_SLUG}.md`);
      assert.equal(sample?.json_url, `${APP_URL}/wire/${SAMPLE_SLUG}.json`);

      const got = await rpc(base, 'tools/call', {
        name: 'wire.get',
        arguments: { slug: SAMPLE_SLUG },
      });
      assert.equal(got.json.result?.isError, undefined);
      const fact = JSON.parse(got.json.result?.content?.[0]?.text || '{}') as {
        slug: string;
        headline: string;
        body_md: string;
      };
      assert.equal(fact.slug, SAMPLE_SLUG);
      assert.ok(fact.body_md.length > 20);

      const searched = await rpc(base, 'tools/call', {
        name: 'wire.search',
        arguments: { query: 'trophy' },
      });
      const searchPayload = JSON.parse(searched.json.result?.content?.[0]?.text || '{}') as {
        articles: Array<{ slug: string }>;
      };
      assert.ok(searchPayload.articles.some((a) => a.slug === 'a-fetch-is-a-log-not-a-trophy'));

      const zh = await rpc(base, 'tools/call', {
        name: 'wire.search',
        arguments: { query: '碳基可读' },
      });
      const zhPayload = JSON.parse(zh.json.result?.content?.[0]?.text || '{}') as {
        articles: Array<{ slug: string }>;
      };
      assert.ok(zhPayload.articles.some((a) => a.slug === SAMPLE_SLUG));

      const empty = await rpc(base, 'tools/call', {
        name: 'wire.search',
        arguments: { query: 'zzzz-no-such-wire-term' },
      });
      assert.equal(empty.json.result?.isError, undefined);
      const emptyPayload = JSON.parse(empty.json.result?.content?.[0]?.text || '{}') as {
        articles: unknown[];
      };
      assert.deepEqual(emptyPayload.articles, []);
    });
  });

  test('wire.get missing slug is a 404-style tool error', async () => {
    await withApp(async (base) => {
      const missing = await rpc(base, 'tools/call', {
        name: 'wire.get',
        arguments: { slug: 'does-not-exist-slug' },
      });
      assert.equal(missing.json.result?.isError, true);
      assert.match(missing.json.result?.content?.[0]?.text || '', /404/);
    });
  });
});
