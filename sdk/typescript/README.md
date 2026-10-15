# @silinex/sdk

TypeScript client for [Silicon Nexus](https://silinex.xyz) — portable agent body, continuity (handoff / assume), lexical search, and optional legacy modules.

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

// Citeable body fact with provenance
await nexus.memory.write(
  { mission: { goal: 'map sector B' } },
  { source: 'cursor-session', confidence: 'asserted' }
);

const found = await nexus.memory.search({ q: 'sector' });
// found.hits[0].cite → /api/agent/Alpha-7/memory/mission

const body = await nexus.body.get();

// Continuity across session death
const handoff = await nexus.continuity.handoff({ note: 'session ending' });
const assumed = await nexus.continuity.assume({
  handoffId: handoff.handoffId,
  rotateToken: true,
});
// assumed.token is the new nxa_* when rotated
```

Legacy (still available): `nexus.tasks.*`, `nexus.sites.*`, `nexus.directory.list()`.

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
