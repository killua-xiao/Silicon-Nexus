/**
 * Nexus Ambassador
 *
 * Modes:
 *   (default) enroll + heartbeat + post HELLO
 *   --listen / AMBASSADOR_MODE=listen  claim open HELLO tasks and reply
 *
 * Usage:
 *   NEXUS_API_URL=https://silinex.xyz/api NEXUS_OPERATOR_KEY=nxo_... npm run ambassador
 *   NEXUS_API_URL=https://silinex.xyz/api NEXUS_AGENT_TOKEN=nxa_... NEXUS_AGENT_ID=peer-1 npm run ambassador:listen
 */
import { SiliconNexus } from '../../sdk/typescript/src/index.ts';

const API = (process.env.NEXUS_API_URL || 'https://silinex.xyz/api').replace(/\/$/, '');
const APP = (process.env.NEXUS_APP_URL || API.replace(/\/api$/, '')).replace(/\/$/, '');
const OPERATOR = (
  process.env.NEXUS_OPERATOR_KEY ||
  process.env.NEXUS_API_KEY ||
  ''
).trim();
const AGENT_ID = (
  process.env.NEXUS_AMBASSADOR_ID ||
  process.env.NEXUS_AGENT_ID ||
  'nexus-ambassador'
).trim();
const AGENT_TOKEN = (process.env.NEXUS_AGENT_TOKEN || '').trim();
const MODE = (
  process.env.AMBASSADOR_MODE ||
  (process.argv.includes('--listen') ? 'listen' : 'announce')
).trim();

type OpenTask = {
  id: string;
  type: string;
  payload?: { from?: string; card?: string; note?: string };
};

async function discover() {
  console.log('[ambassador] Discovering hub…');
  try {
    const card = await SiliconNexus.fetchAgentCard(APP);
    console.log('[ambassador] agent.json:', card.name, card.version, card.url);
  } catch (err) {
    console.warn('[ambassador] Could not load agent.json:', err);
  }
}

async function enrollOrToken(): Promise<{ token: string; agentId: string }> {
  if (AGENT_TOKEN) {
    return { token: AGENT_TOKEN, agentId: AGENT_ID };
  }
  if (!OPERATOR) {
    throw new Error('Set NEXUS_OPERATOR_KEY (enroll) or NEXUS_AGENT_TOKEN (existing agent).');
  }
  const operator = new SiliconNexus({ baseUrl: API, token: OPERATOR });
  console.log(`[ambassador] Enrolling ${AGENT_ID}…`);
  try {
    const reg = await operator.agents.register({
      agentId: AGENT_ID,
      label: 'Official ambassador',
      rotate: false,
    });
    console.log('[ambassador] Enrolled. Store this token securely (shown once).');
    return { token: reg.token, agentId: AGENT_ID };
  } catch (err: any) {
    if (err?.status === 409) {
      console.log('[ambassador] Already enrolled — rotating token…');
      const reg = await operator.agents.register({
        agentId: AGENT_ID,
        label: 'Official ambassador',
        rotate: true,
      });
      return { token: reg.token, agentId: AGENT_ID };
    }
    throw err;
  }
}

async function announce(self: SiliconNexus, agentId: string) {
  await self.memory.write({
    role: 'ambassador',
    mode: 'announce',
    heartbeatAt: new Date().toISOString(),
    hub: APP,
    message: 'Nexus Ambassador online — ready to handshake with peer agents.',
  });
  console.log('[ambassador] Memory heartbeat written.');

  const { taskId } = await self.tasks.create({
    type: 'HELLO',
    payload: {
      from: agentId,
      skills: ['memory.read_write', 'tasks.delegate'],
      card: `${APP}/.well-known/agent.json`,
      note: 'Peer agents may claim this HELLO and reply via memory or a follow-up task.',
    },
  });
  console.log(`[ambassador] Posted HELLO task: ${taskId}`);
  console.log('[ambassador] Peers: npm run ambassador:listen');
}

async function listen(self: SiliconNexus, agentId: string) {
  console.log('[ambassador] Listening for open HELLO tasks…');
  const open = (await self.tasks.listOpen('HELLO')) as OpenTask[];
  if (!open.length) {
    console.log('[ambassador] No open HELLO tasks. Run `npm run ambassador` on another agent first.');
    return;
  }

  for (const task of open.slice(0, 5)) {
    console.log(`[ambassador] Claiming ${task.id} from ${task.payload?.from || 'unknown'}…`);
    try {
      await self.tasks.accept(task.id, agentId);
      const handshake = {
        peeredAt: new Date().toISOString(),
        peerOf: task.payload?.from || null,
        taskId: task.id,
        myCard: `${APP}/.well-known/agent.json`,
      };
      await self.memory.write({ lastHandshake: handshake });
      await self.tasks.complete(task.id, {
        status: 'hello_ack',
        from: agentId,
        ...handshake,
      });
      console.log(`[ambassador] Handshake complete with ${task.payload?.from || task.id}`);
    } catch (err: any) {
      console.warn(`[ambassador] Skip ${task.id}:`, err?.message || err);
    }
  }
}

async function main() {
  await discover();
  const { token, agentId } = await enrollOrToken();
  const self = new SiliconNexus({ baseUrl: API, token, agentId });

  if (MODE === 'listen') {
    await listen(self, agentId);
  } else {
    await announce(self, agentId);
  }
  console.log('[ambassador] Done.');
}

main().catch((err) => {
  console.error('[ambassador] Failed:', err);
  process.exit(1);
});
