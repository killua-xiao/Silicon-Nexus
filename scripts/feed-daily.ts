/**
 * Daily signal seeder — builds crawlable feed foundation without full-text reprint.
 *
 * 1) Nexus hub digest (original): directory + usage snapshot
 * 2) Hacker News link digests (title + URL + score only, with attribution)
 *
 * Usage:
 *   npm run feed:daily
 *   APP_URL=https://silinex.xyz npm run feed:daily
 */
import 'dotenv/config';
import { loadPreservedState, closeStore, listPublicAgents, usageSnapshot, upsertFeedItem } from '../src/server/store.ts';
import { logJson } from '../src/server/log.ts';

const APP = (process.env.APP_URL || 'https://silinex.xyz').replace(/\/$/, '');
const HN_LIMIT = Number(process.env.FEED_HN_LIMIT || 8);

type HnItem = {
  id: number;
  title?: string;
  url?: string;
  score?: number;
  by?: string;
  time?: number;
  type?: string;
};

function daySlug(prefix: string, d = new Date()) {
  const day = d.toISOString().slice(0, 10);
  return `${prefix}-${day}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SiliconNexusFeedBot/1.0 (+https://silinex.xyz)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

async function seedHubDigest() {
  const usage = usageSnapshot();
  const listed = listPublicAgents();
  const day = new Date().toISOString().slice(0, 10);
  const slug = daySlug('nexus-digest');
  const lines = [
    `# Silicon Nexus daily digest — ${day}`,
    '',
    `Hub: ${APP}`,
    '',
    '## Live footprint',
    `- Plan: \`${usage.plan.id}\``,
    `- Enrolled agents: ${usage.enrolledAgents}`,
    `- Listed in public directory: ${usage.listedAgents}`,
    `- Memory footprint: ${usage.memoryBytes} bytes`,
    `- Tasks: ${usage.totalTasks} total · ${usage.openTasks} open · ${usage.completedTasks} completed`,
    `- API requests today: ${usage.today.apiRequests}`,
    '',
    '## Public directory',
  ];
  if (listed.length === 0) {
    lines.push('_No agents listed yet. Operators can opt in from the Agents console._');
  } else {
    for (const a of listed.slice(0, 20)) {
      lines.push(`- **${a.agentId}**${a.label ? ` — ${a.label}` : ''}${a.blurb ? `: ${a.blurb}` : ''}`);
    }
  }
  lines.push(
    '',
    '## Machine endpoints',
    `- JSON: ${APP}/feed.json`,
    `- Atom: ${APP}/feed.xml`,
    `- llms.txt: ${APP}/llms.txt`,
    `- Agent card: ${APP}/.well-known/agent.json`,
    ''
  );

  const result = upsertFeedItem({
    slug,
    title: `Silicon Nexus daily digest — ${day}`,
    summary: `Hub footprint and public directory snapshot for ${day}.`,
    bodyMd: lines.join('\n'),
    tags: ['nexus', 'digest', 'daily'],
    source: 'nexus-digest',
    sourceUrl: `${APP}/feed/${slug}`,
    externalId: `nexus-digest:${day}`,
  });
  return result.ok ? 1 : 0;
}

async function seedHnDigests() {
  const ids = await fetchJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json');
  let written = 0;
  for (const id of ids.slice(0, HN_LIMIT)) {
    try {
      const item = await fetchJson<HnItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!item?.title || item.type !== 'story') continue;
      const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
      const slug = `hn-${item.id}`;
      const bodyMd = [
        `# ${item.title}`,
        '',
        `Source: [Hacker News](https://news.ycombinator.com/item?id=${item.id}) · score ${item.score ?? 0}${item.by ? ` · by ${item.by}` : ''}`,
        '',
        `Link: ${url}`,
        '',
        '> Link digest only — Silicon Nexus does not republish full article text. Crawlers should fetch the original URL for body content.',
        '',
        `Published via Silicon Nexus signal feed: ${APP}/feed/${slug}`,
      ].join('\n');

      const result = upsertFeedItem({
        slug,
        title: item.title,
        summary: `HN digest · score ${item.score ?? 0}`,
        bodyMd,
        tags: ['hn', 'link-digest', 'tech'],
        source: 'hacker-news',
        sourceUrl: url,
        externalId: `hn:${item.id}`,
        publishedAt: item.time
          ? new Date(item.time * 1000).toISOString()
          : new Date().toISOString(),
      });
      if (result.ok) written += 1;
    } catch (err) {
      logJson('warn', 'HN item skipped', { id, error: String(err) });
    }
  }
  return written;
}

async function main() {
  loadPreservedState();
  const digest = await seedHubDigest();
  const hn = await seedHnDigests();
  logJson('info', 'Daily feed seed complete', { digest, hn, app: APP });
  console.log(`[feed:daily] published digest=${digest} hn_digests=${hn}`);
  closeStore();
}

main().catch((err) => {
  console.error('[feed:daily] failed:', err);
  try {
    closeStore();
  } catch {
    // ignore
  }
  process.exit(1);
});
