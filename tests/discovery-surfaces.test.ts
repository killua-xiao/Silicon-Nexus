import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import express from 'express';
import { buildLlmsTxt } from '../src/server/feedPublic.ts';
import { isSpaCatchAllExcluded } from '../src/server/spaSurfaces.ts';

test('SPA catch-all excludes well-known llms.txt and openapi.json', () => {
  assert.equal(isSpaCatchAllExcluded('/.well-known/llms.txt'), true);
  assert.equal(isSpaCatchAllExcluded('/llms.txt'), true);
  assert.equal(isSpaCatchAllExcluded('/openapi.json'), true);
  assert.equal(isSpaCatchAllExcluded('/openapi.yaml'), true);
  assert.equal(isSpaCatchAllExcluded('/.well-known/openapi.json'), true);
  assert.equal(isSpaCatchAllExcluded('/.well-known/openapi.yaml'), true);
  assert.equal(isSpaCatchAllExcluded('/.well-known/agent.json'), true);
  assert.equal(isSpaCatchAllExcluded('/'), false);
  assert.equal(isSpaCatchAllExcluded('/about'), false);
});

test('discovery routes return machine types, not the SPA shell', async () => {
  const appUrl = 'https://silinex.xyz';
  const app = express();
  app.get('/llms.txt', (_req, res) => {
    res.type('text/plain; charset=utf-8').send(buildLlmsTxt(appUrl));
  });
  app.get('/.well-known/llms.txt', (_req, res) => {
    res.type('text/plain; charset=utf-8').send(buildLlmsTxt(appUrl));
  });
  app.get('/openapi.json', (_req, res) => {
    res.redirect(301, '/openapi.yaml');
  });
  app.get('/.well-known/openapi.json', (_req, res) => {
    res.redirect(301, '/openapi.yaml');
  });
  app.get('/.well-known/openapi.yaml', (_req, res) => {
    res.redirect(301, '/openapi.yaml');
  });
  app.get('*', (req, res, next) => {
    if (isSpaCatchAllExcluded(req.path)) return next();
    res.type('text/html').send('<!doctype html><title>SPA</title>');
  });

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  const base = `http://127.0.0.1:${port}`;

  try {
    const llms = await fetch(`${base}/.well-known/llms.txt`);
    assert.equal(llms.status, 200);
    assert.match(llms.headers.get('content-type') || '', /text\/plain/);
    const llmsBody = await llms.text();
    assert.match(llmsBody, /^# Silicon Nexus/m);
    assert.doesNotMatch(llmsBody, /<!doctype html>/i);

    const openapi = await fetch(`${base}/openapi.json`, { redirect: 'manual' });
    assert.equal(openapi.status, 301);
    assert.equal(new URL(openapi.headers.get('location') || '', base).pathname, '/openapi.yaml');
    assert.doesNotMatch(openapi.headers.get('content-type') || '', /text\/html/);

    const wellKnownOpenapi = await fetch(`${base}/.well-known/openapi.json`, { redirect: 'manual' });
    assert.equal(wellKnownOpenapi.status, 301);
    assert.equal(new URL(wellKnownOpenapi.headers.get('location') || '', base).pathname, '/openapi.yaml');
    assert.doesNotMatch(wellKnownOpenapi.headers.get('content-type') || '', /text\/html/);

    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /<!doctype html>/i);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
});
