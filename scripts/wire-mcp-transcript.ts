/**
 * Local transcript for the public Wire MCP PR body.
 * Usage: NEXUS_DATA_DIR=<tmp> npx tsx scripts/wire-mcp-transcript.ts
 */
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'path';
import express from 'express';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { createWireMcpHttpRouter } from '../src/server/wireMcpHttp.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-wire-mcp-transcript-'));
process.env.NEXUS_DATA_DIR = dataDir;

const store = await import('../src/server/store.ts');
store.loadPreservedState();

const APP_URL = 'https://silinex.xyz';
const SAMPLE_SLUG = 'readable-by-carbon-native-to-silicon';

const app = express();
app.use(express.json({ limit: '500kb' }));
app.use('/mcp/wire', createWireMcpHttpRouter({ appUrl: APP_URL }));

const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address() as { port: number };
const base = `http://127.0.0.1:${port}`;

async function rpc(method: string, params: Record<string, unknown>, id: number) {
  const res = await fetch(`${base}/mcp/wire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const json = await res.json();
  return { httpStatus: res.status, json };
}

function clip(value: unknown) {
  const text = JSON.stringify(value, null, 2);
  if (text.length <= 2400) return text;
  return `${text.slice(0, 2400)}\n… [truncated]`;
}

try {
  const initialize = await rpc(
    'initialize',
    {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'wire-mcp-transcript', version: '0' },
    },
    1
  );
  const toolsList = await rpc('tools/list', {}, 2);
  const list = await rpc('tools/call', { name: 'wire.list', arguments: { limit: 2 } }, 3);
  const get = await rpc('tools/call', { name: 'wire.get', arguments: { slug: SAMPLE_SLUG } }, 4);
  const search = await rpc('tools/call', { name: 'wire.search', arguments: { query: 'trophy', limit: 5 } }, 5);

  console.log('## Local transcript (no Authorization header)\n');
  console.log(`POST ${base}/mcp/wire  (temp sqlite + seed articles)\n`);
  console.log('### initialize\n');
  console.log('```json');
  console.log(clip(initialize));
  console.log('```\n');
  console.log('### tools/list\n');
  console.log('```json');
  console.log(clip(toolsList));
  console.log('```\n');
  console.log('### tools/call wire.list limit=2\n');
  console.log('```json');
  console.log(clip(list));
  console.log('```\n');
  console.log('### tools/call wire.get slug=' + SAMPLE_SLUG + '\n');
  console.log('```json');
  console.log(clip(get));
  console.log('```\n');
  console.log('### tools/call wire.search query=trophy\n');
  console.log('```json');
  console.log(clip(search));
  console.log('```');
} finally {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  store.closeStore();
  rmSync(dataDir, { recursive: true, force: true });
}
