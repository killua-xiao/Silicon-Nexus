import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from './db.ts';
import { DEFAULT_WORKSPACE_ID, MAX_LOGS } from './types.ts';
import { SEED_ARTICLES, SEED_PUBLISHER } from './wireSeed.ts';
import {
  WIRE_OBSERVATION_NOTE,
  isWireCategorySlug,
  type WireArticle,
  type WireArticleInput,
  type WireArticleStatus,
  type WireAudience,
  type WireAuthorType,
  type WireCategorySlug,
  type WireCrawlerCount,
  type WireKeyFact,
  type WireObservations,
  type WirePublisher,
} from './wireTypes.ts';

type PublisherRow = {
  id: string;
  slug: string;
  name: string;
  url: string;
  description: string;
  created_at: string;
  updated_at: string;
};

type ArticleRow = {
  id: string;
  publisher_id: string;
  slug: string;
  headline: string;
  summary: string;
  body_md: string;
  key_facts_json: string;
  headline_zh?: string | null;
  summary_zh?: string | null;
  body_md_zh?: string | null;
  key_facts_zh_json?: string | null;
  category: string;
  author_name: string;
  author_type: string;
  author_url: string | null;
  status: string;
  date_published: string;
  date_modified: string;
  image_url: string | null;
  language: string;
  source_url?: string | null;
  source_name?: string | null;
  external_id?: string | null;
  created_at: string;
  updated_at: string;
  rowid?: number;
};

type ObservationRow = {
  article_id: string;
  audience: string;
  crawler_id: string;
  hits: number;
  last_seen_at: string | null;
  last_ua: string | null;
};

function mapPublisher(row: PublisherRow): WirePublisher {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    url: row.url,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseKeyFacts(raw: string | null | undefined): WireKeyFact[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, i) => {
        if (typeof item === 'string' && item.trim()) {
          return { id: `fact-${i + 1}`, text: item.trim() };
        }
        if (item && typeof item === 'object' && 'text' in item) {
          const text = String((item as { text: unknown }).text || '').trim();
          if (!text) return null;
          const idRaw = 'id' in item ? String((item as { id: unknown }).id || '') : '';
          return { id: idRaw || `fact-${i + 1}`, text };
        }
        return null;
      })
      .filter((x): x is WireKeyFact => !!x);
  } catch {
    return [];
  }
}

function mapArticle(row: ArticleRow, publisher: WirePublisher, observations: WireObservations): WireArticle {
  const category = isWireCategorySlug(row.category) ? row.category : 'wire';
  const status: WireArticleStatus = row.status === 'draft' ? 'draft' : 'published';
  const authorType: WireAuthorType = row.author_type === 'Person' ? 'Person' : 'Organization';
  return {
    id: row.id,
    publisherId: row.publisher_id,
    publisher,
    slug: row.slug,
    headline: row.headline,
    summary: row.summary,
    bodyMd: row.body_md,
    keyFacts: parseKeyFacts(row.key_facts_json),
    headlineZh: row.headline_zh || '',
    summaryZh: row.summary_zh || '',
    bodyMdZh: row.body_md_zh || '',
    keyFactsZh: parseKeyFacts(row.key_facts_zh_json),
    category,
    authorName: row.author_name,
    authorType,
    authorUrl: row.author_url,
    status,
    datePublished: row.date_published,
    dateModified: row.date_modified,
    imageUrl: row.image_url,
    language: row.language || 'en',
    sourceUrl: row.source_url || null,
    sourceName: row.source_name || null,
    externalId: row.external_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    observations,
  };
}

function emptyObservations(): WireObservations {
  return {
    human: 0,
    bot: 0,
    crawlers: [],
    lastSeenAt: null,
    note: WIRE_OBSERVATION_NOTE,
  };
}

function loadObservations(db: Database.Database, articleId: string): WireObservations {
  const rows = db
    .prepare(
      `SELECT article_id, audience, crawler_id, hits, last_seen_at, last_ua
       FROM article_observations WHERE article_id = ?`
    )
    .all(articleId) as ObservationRow[];
  const crawlers: WireCrawlerCount[] = [];
  let human = 0;
  let bot = 0;
  let lastSeenAt: string | null = null;
  for (const row of rows) {
    if (row.audience === 'human') human += row.hits;
    if (row.audience === 'bot') {
      bot += row.hits;
      if (row.crawler_id) {
        crawlers.push({
          crawlerId: row.crawler_id,
          hits: row.hits,
          lastSeenAt: row.last_seen_at,
        });
      }
    }
    if (row.last_seen_at && (!lastSeenAt || row.last_seen_at > lastSeenAt)) {
      lastSeenAt = row.last_seen_at;
    }
  }
  crawlers.sort((a, b) => b.hits - a.hits || a.crawlerId.localeCompare(b.crawlerId));
  return { human, bot, crawlers, lastSeenAt, note: WIRE_OBSERVATION_NOTE };
}

function getPublisherById(db: Database.Database, id: string): WirePublisher | null {
  const row = db.prepare(`SELECT * FROM publishers WHERE id = ?`).get(id) as PublisherRow | undefined;
  return row ? mapPublisher(row) : null;
}

export function getPublisherBySlug(slug: string): WirePublisher | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM publishers WHERE slug = ?`).get(slug) as PublisherRow | undefined;
  return row ? mapPublisher(row) : null;
}

function hydrate(db: Database.Database, row: ArticleRow | undefined): WireArticle | null {
  if (!row) return null;
  const publisher = getPublisherById(db, row.publisher_id);
  if (!publisher) return null;
  return mapArticle(row, publisher, loadObservations(db, row.id));
}

export function listPublishedArticles(options?: {
  category?: WireCategorySlug;
  limit?: number;
}): WireArticle[] {
  const db = getDb();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const rows = options?.category
    ? (db
        .prepare(
          `SELECT * FROM articles
           WHERE status = 'published' AND category = ?
           ORDER BY date_published DESC
           LIMIT ?`
        )
        .all(options.category, limit) as ArticleRow[])
    : (db
        .prepare(
          `SELECT * FROM articles
           WHERE status = 'published'
           ORDER BY date_published DESC
           LIMIT ?`
        )
        .all(limit) as ArticleRow[]);
  return rows.map((row) => hydrate(db, row)).filter((a): a is WireArticle => !!a);
}

export function getPublishedArticleBySlug(slug: string): WireArticle | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM articles WHERE slug = ? AND status = 'published'`)
    .get(slug) as ArticleRow | undefined;
  return hydrate(db, row);
}

/** Case-insensitive substring search over published title/summary/body (en + zh). */
export function searchPublishedArticles(query: string, limit = 10): WireArticle[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const cap = Math.min(Math.max(limit, 1), 20);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM articles
       WHERE status = 'published'
         AND (
           instr(lower(headline), ?) > 0
           OR instr(lower(summary), ?) > 0
           OR instr(lower(body_md), ?) > 0
           OR instr(lower(headline_zh), ?) > 0
           OR instr(lower(summary_zh), ?) > 0
           OR instr(lower(body_md_zh), ?) > 0
         )
       ORDER BY date_published DESC
       LIMIT ?`
    )
    .all(needle, needle, needle, needle, needle, needle, cap) as ArticleRow[];
  return rows.map((row) => hydrate(db, row)).filter((a): a is WireArticle => !!a);
}

export function recordWireMcpCall(input: {
  tool: string;
  ua?: string;
  slug?: string;
  queryLen?: number;
}): void {
  const db = getDb();
  const ua = (input.ua || '').trim().slice(0, 120);
  db.prepare(
    `INSERT INTO mcp_wire_calls (tool, ua, slug, query_len, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    input.tool,
    ua || null,
    input.slug || null,
    typeof input.queryLen === 'number' && Number.isFinite(input.queryLen) ? input.queryLen : null,
    new Date().toISOString()
  );
}

export function getArticleByExternalId(externalId: string): WireArticle | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM articles WHERE external_id = ?`)
    .get(externalId) as ArticleRow | undefined;
  return hydrate(db, row);
}

export function recordArticleObservation(input: {
  articleId: string;
  audience: WireAudience;
  crawlerId?: string | null;
  userAgent?: string | null;
}): WireObservations {
  const db = getDb();
  const crawlerId = input.audience === 'bot' ? (input.crawlerId || 'bot').slice(0, 80) : '';
  const now = new Date().toISOString();
  const ua = (input.userAgent || '').slice(0, 240);
  const existing = db
    .prepare(
      `SELECT hits FROM article_observations
       WHERE article_id = ? AND audience = ? AND crawler_id = ?`
    )
    .get(input.articleId, input.audience, crawlerId) as { hits: number } | undefined;

  db.prepare(
    `INSERT INTO article_observations (article_id, audience, crawler_id, hits, last_seen_at, last_ua)
     VALUES (?, ?, ?, 1, ?, ?)
     ON CONFLICT(article_id, audience, crawler_id)
     DO UPDATE SET
       hits = hits + 1,
       last_seen_at = excluded.last_seen_at,
       last_ua = excluded.last_ua`
  ).run(input.articleId, input.audience, crawlerId, now, ua || null);

  if (input.audience === 'bot' && !existing) {
    logWireObserved(db, crawlerId || 'bot', input.articleId);
  }

  return loadObservations(db, input.articleId);
}

function logWireObserved(db: Database.Database, crawlerId: string, articleId: string): void {
  const id = crypto.randomBytes(6).toString('hex');
  const timestamp = new Date().toISOString();
  db.prepare(
    `INSERT INTO audit_events (id, workspace_id, timestamp, type, agent_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    DEFAULT_WORKSPACE_ID,
    timestamp,
    'WIRE_OBSERVED',
    crawlerId,
    `Crawler first observed on wire article ${articleId}`
  );
  const count = (
    db.prepare('SELECT COUNT(*) AS c FROM audit_events WHERE workspace_id = ?').get(DEFAULT_WORKSPACE_ID) as {
      c: number;
    }
  ).c;
  if (count > MAX_LOGS) {
    db.prepare(
      `DELETE FROM audit_events WHERE id IN (
         SELECT id FROM audit_events WHERE workspace_id = ?
         ORDER BY timestamp ASC LIMIT ?
       )`
    ).run(DEFAULT_WORKSPACE_ID, count - MAX_LOGS);
  }
}

function upsertPublisher(db: Database.Database, seed: typeof SEED_PUBLISHER): string {
  const existing = db
    .prepare(`SELECT id FROM publishers WHERE slug = ?`)
    .get(seed.slug) as { id: string } | undefined;
  const now = new Date().toISOString();
  if (existing) {
    db.prepare(
      `UPDATE publishers SET name = ?, url = ?, description = ?, updated_at = ? WHERE id = ?`
    ).run(seed.name, seed.url, seed.description, now, existing.id);
    return existing.id;
  }
  const id = `pub_${crypto.randomBytes(6).toString('hex')}`;
  db.prepare(
    `INSERT INTO publishers (id, slug, name, url, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, seed.slug, seed.name, seed.url, seed.description, now, now);
  return id;
}

function articleValues(publisherId: string, input: WireArticleInput, id: string, now: string) {
  return [
    id,
    publisherId,
    input.slug,
    input.headline,
    input.summary,
    input.bodyMd,
    JSON.stringify(input.keyFacts),
    input.headlineZh || '',
    input.summaryZh || '',
    input.bodyMdZh || '',
    JSON.stringify(input.keyFactsZh || []),
    input.category,
    input.authorName,
    input.authorType || 'Organization',
    input.authorUrl ?? null,
    input.status || 'published',
    input.datePublished,
    input.dateModified || input.datePublished,
    input.imageUrl ?? null,
    input.language || 'en',
    input.sourceUrl ?? null,
    input.sourceName ?? null,
    input.externalId ?? null,
    now,
    now,
  ] as const;
}

function insertArticleIfMissing(db: Database.Database, publisherId: string, input: WireArticleInput): void {
  const existing = db.prepare(`SELECT id FROM articles WHERE slug = ?`).get(input.slug) as
    | { id: string }
    | undefined;
  if (existing) {
    // Keep seed bilingual copy authoritative for hub desk articles.
    if (input.headlineZh || input.summaryZh || input.bodyMdZh) {
      db.prepare(
        `UPDATE articles SET
           headline_zh = ?, summary_zh = ?, body_md_zh = ?, key_facts_zh_json = ?,
           updated_at = ?
         WHERE id = ?`
      ).run(
        input.headlineZh || '',
        input.summaryZh || '',
        input.bodyMdZh || '',
        JSON.stringify(input.keyFactsZh || []),
        new Date().toISOString(),
        existing.id
      );
    }
    return;
  }
  const now = new Date().toISOString();
  const id = `art_${crypto.randomBytes(6).toString('hex')}`;
  db.prepare(
    `INSERT INTO articles (
       id, publisher_id, slug, headline, summary, body_md, key_facts_json,
       headline_zh, summary_zh, body_md_zh, key_facts_zh_json,
       category, author_name, author_type, author_url, status,
       date_published, date_modified, image_url, language,
       source_url, source_name, external_id, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(...articleValues(publisherId, input, id, now));
}

/** Insert or refresh an ingested wire digest by external_id / slug. */
export function upsertWireArticle(input: WireArticleInput): { ok: true; id: string; created: boolean } {
  const db = getDb();
  const publisherId = upsertPublisher(db, SEED_PUBLISHER);
  const now = new Date().toISOString();

  const byExternal =
    input.externalId
      ? (db.prepare(`SELECT id, slug FROM articles WHERE external_id = ?`).get(input.externalId) as
          | { id: string; slug: string }
          | undefined)
      : undefined;
  const bySlug = db.prepare(`SELECT id FROM articles WHERE slug = ?`).get(input.slug) as
    | { id: string }
    | undefined;
  const existing = byExternal || bySlug;

  if (existing) {
    db.prepare(
      `UPDATE articles SET
         headline = ?, summary = ?, body_md = ?, key_facts_json = ?,
         headline_zh = ?, summary_zh = ?, body_md_zh = ?, key_facts_zh_json = ?,
         category = ?, author_name = ?, author_type = ?, author_url = ?, status = ?,
         date_published = ?, date_modified = ?, image_url = ?, language = ?,
         source_url = ?, source_name = ?, external_id = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      input.headline,
      input.summary,
      input.bodyMd,
      JSON.stringify(input.keyFacts),
      input.headlineZh || '',
      input.summaryZh || '',
      input.bodyMdZh || '',
      JSON.stringify(input.keyFactsZh || []),
      input.category,
      input.authorName,
      input.authorType || 'Organization',
      input.authorUrl ?? null,
      input.status || 'published',
      input.datePublished,
      input.dateModified || input.datePublished || now,
      input.imageUrl ?? null,
      input.language || 'en',
      input.sourceUrl ?? null,
      input.sourceName ?? null,
      input.externalId ?? null,
      now,
      existing.id
    );
    return { ok: true, id: existing.id, created: false };
  }

  const id = `art_${crypto.randomBytes(6).toString('hex')}`;
  db.prepare(
    `INSERT INTO articles (
       id, publisher_id, slug, headline, summary, body_md, key_facts_json,
       headline_zh, summary_zh, body_md_zh, key_facts_zh_json,
       category, author_name, author_type, author_url, status,
       date_published, date_modified, image_url, language,
       source_url, source_name, external_id, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(...articleValues(publisherId, input, id, now));
  return { ok: true, id, created: true };
}

/** Unpublish (soft) — keeps row for audit but drops from public wire. */
export function unpublishWireArticle(id: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(`UPDATE articles SET status = 'draft', updated_at = ? WHERE id = ? AND status = 'published'`)
    .run(now, id);
  return info.changes > 0;
}

/** Hard delete by id (observations cascade). */
export function deleteWireArticle(id: string): boolean {
  const db = getDb();
  db.prepare(`DELETE FROM article_observations WHERE article_id = ?`).run(id);
  const info = db.prepare(`DELETE FROM articles WHERE id = ?`).run(id);
  return info.changes > 0;
}

export function listWireArticlesForModeration(limit = 200): WireArticle[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM articles
       WHERE status = 'published'
       ORDER BY date_published DESC
       LIMIT ?`
    )
    .all(Math.min(Math.max(limit, 1), 500)) as ArticleRow[];
  return rows.map((row) => hydrate(db, row)).filter((a): a is WireArticle => !!a);
}

/** Idempotent seed: hub publisher + published articles; backfills Chinese copy. */
export function seedWireIfEmpty(): void {
  const db = getDb();
  const tx = db.transaction(() => {
    const publisherId = upsertPublisher(db, SEED_PUBLISHER);
    for (const article of SEED_ARTICLES) {
      insertArticleIfMissing(db, publisherId, article);
    }
  });
  tx();
}

// Silence unused helper warning in older TS configs.
void emptyObservations;
