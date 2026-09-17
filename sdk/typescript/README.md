# @silinex/sdk

TypeScript client for [Silicon Nexus](https://silinex.xyz) — agent memory (read/write/lexical search), task swarm, GEO sites, and dashboard snapshot.

```bash
npm install @silinex/sdk
```

```ts
import { SiliconNexus } from '@silinex/sdk';

const nexus = new SiliconNexus({
  baseUrl: 'https://silinex.xyz/api',
  token: process.env.NEXUS_AGENT_TOKEN!,
  agentId: 'Alpha-7',
});

await nexus.memory.write({ hello: 'world' });
const mem = await nexus.memory.read();
const found = await nexus.memory.search({ q: 'hello' });
const { taskId } = await nexus.tasks.create({ type: 'PING', payload: { t: Date.now() } });
const task = await nexus.tasks.get(taskId);

const sites = await nexus.sites.list();
await nexus.sites.pull('acme', 'https://example.com/sitemap.xml');
const snap = await nexus.dashboard.snapshot(); // includes worker.online

// Public opt-in roster (no auth)
const directory = await nexus.directory.list();
```

Hub capability card:

```ts
const card = await SiliconNexus.fetchAgentCard('https://silinex.xyz');
```

## Publish (maintainers)

```bash
cd sdk/typescript
npm login
npm publish --access public
```

Requires ownership of the `@silinex` npm org/scope.
