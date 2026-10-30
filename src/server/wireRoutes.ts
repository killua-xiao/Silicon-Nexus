import type { Express, Request, Response } from 'express';
import { detectCrawler } from './crawlDetect.ts';
import { resolveLocaleFromRequest } from './locale.ts';
import type { Locale } from '../i18n/messages.ts';
import {
  articleFactPackage,
  renderArticleHtml,
  renderArticleMarkdown,
  renderHomeHtml,
  renderNotFoundHtml,
  renderTopicHtml,
  topicListPayload,
} from './wirePublic.ts';
import {
  getPublishedArticleBySlug,
  listPublishedArticles,
  recordArticleObservation,
} from './wireStore.ts';
import { isWireCategorySlug, type WireAudience } from './wireTypes.ts';

function resolveLocale(req: Request): Locale {
  const q = String(req.query.lang || '').trim().toLowerCase();
  if (q === 'zh' || q.startsWith('zh-')) return 'zh';
  if (q === 'en') return 'en';
  return resolveLocaleFromRequest(req).locale;
}

function classify(req: Request): { audience: WireAudience; crawlerId: string | null } {
  const crawlerId = detectCrawler(req.get('user-agent') || undefined);
  if (crawlerId) return { audience: 'bot', crawlerId };
  return { audience: 'human', crawlerId: null };
}

function observeArticle(req: Request, articleId: string): void {
  const { audience, crawlerId } = classify(req);
  try {
    recordArticleObservation({
      articleId,
      audience,
      crawlerId,
      userAgent: req.get('user-agent') || null,
    });
  } catch {
    // Observation must not fail the page.
  }
}

function stripExt(value: string, ext: string): string {
  const re = new RegExp(`\\.${ext}$`, 'i');
  return value.replace(re, '');
}

function sendHtml(res: Response, html: string, status = 200): void {
  res.status(status).type('text/html; charset=utf-8').send(html);
}

export function registerWireRoutes(app: Express, appUrl: string): void {
  app.get('/', (req, res) => {
    const locale = resolveLocale(req);
    const articles = listPublishedArticles();
    sendHtml(res, renderHomeHtml(appUrl, articles, locale));
  });

  app.get('/topic/:category.json', (req, res) => {
    const category = stripExt(req.params.category, 'json');
    if (!isWireCategorySlug(category)) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    const articles = listPublishedArticles({ category });
    res.type('application/json').json(topicListPayload(appUrl, category, articles));
  });

  app.get('/topic/:category', (req, res) => {
    const locale = resolveLocale(req);
    const category = req.params.category;
    if (!isWireCategorySlug(category)) {
      return sendHtml(res, renderNotFoundHtml(appUrl, locale, 'Topic not found'), 404);
    }
    const articles = listPublishedArticles({ category });
    sendHtml(res, renderTopicHtml(appUrl, category, articles, locale));
  });

  app.get('/wire/:slug.json', (req, res) => {
    const slug = stripExt(req.params.slug, 'json');
    const article = getPublishedArticleBySlug(slug);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    observeArticle(req, article.id);
    const fresh = getPublishedArticleBySlug(slug) || article;
    res.type('application/json').json(articleFactPackage(appUrl, fresh));
  });

  app.get('/wire/:slug.md', (req, res) => {
    const slug = stripExt(req.params.slug, 'md');
    const article = getPublishedArticleBySlug(slug);
    if (!article) return res.status(404).type('text/plain').send('Not found');
    observeArticle(req, article.id);
    const fresh = getPublishedArticleBySlug(slug) || article;
    res.type('text/markdown; charset=utf-8').send(renderArticleMarkdown(appUrl, fresh));
  });

  app.get('/wire/:slug', (req, res) => {
    const locale = resolveLocale(req);
    const slug = req.params.slug;
    if (/\.(json|md)$/i.test(slug)) {
      return sendHtml(res, renderNotFoundHtml(appUrl, locale, 'Article not found'), 404);
    }
    const article = getPublishedArticleBySlug(slug);
    if (!article) {
      return sendHtml(res, renderNotFoundHtml(appUrl, locale, 'Article not found'), 404);
    }
    observeArticle(req, article.id);
    const fresh = getPublishedArticleBySlug(slug) || article;
    sendHtml(res, renderArticleHtml(appUrl, fresh, locale));
  });
}
