import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { isMailConfigured, shouldExposeEmailLinks } from '../src/server/mail.ts';
import { isPaidPlanId, isStripeConfigured } from '../src/server/stripeBilling.ts';

const dataDir = mkdtempSync(path.join(tmpdir(), 'nexus-auth-'));
process.env.NEXUS_DATA_DIR = dataDir;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.SMTP_URL;
delete process.env.SMTP_HOST;

const store = await import('../src/server/store.ts');

before(() => {
  store.loadPreservedState();
});

after(() => {
  store.closeStore();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('auth + billing', { concurrency: 1 }, () => {
  test('mail and stripe report unconfigured without secrets', () => {
    assert.equal(isMailConfigured(), false);
    assert.equal(isStripeConfigured(), false);
    assert.equal(isPaidPlanId('starter'), true);
    assert.equal(isPaidPlanId('free'), false);
  });

  test('register requires explicit legal acceptance', async () => {
    const { registerBodySchema } = await import('../src/server/accountAuth.ts');
    assert.throws(() => registerBodySchema.parse({ email: 'a@example.com', password: 'password1' }));
    const parsed = registerBodySchema.parse({
      email: 'a@example.com',
      password: 'password1',
      acceptLegal: true,
    });
    assert.equal(parsed.acceptLegal, true);
  });

  test('email reset/verify links stay off the public API by default', () => {
    const previous = process.env.NEXUS_EXPOSE_EMAIL_LINKS;
    delete process.env.NEXUS_EXPOSE_EMAIL_LINKS;
    assert.equal(shouldExposeEmailLinks(), false);
    process.env.NEXUS_EXPOSE_EMAIL_LINKS = '1';
    assert.equal(shouldExposeEmailLinks(), true);
    if (previous === undefined) delete process.env.NEXUS_EXPOSE_EMAIL_LINKS;
    else process.env.NEXUS_EXPOSE_EMAIL_LINKS = previous;
  });

  test('verify and reset tokens are single-use', () => {
    const registered = store.registerAccount({
      email: 'resetme@example.com',
      password: 'password1',
    });
    assert.equal(registered.ok, true);
    if (!registered.ok) return;

    const verify = store.issueAuthToken(registered.account.id, 'verify', 60_000);
    assert.ok(verify?.token.startsWith('nxv_'));
    const verifiedAccount = store.consumeAuthToken(verify!.token, 'verify');
    assert.equal(verifiedAccount?.id, registered.account.id);
    assert.equal(store.consumeAuthToken(verify!.token, 'verify'), undefined);
    const marked = store.markEmailVerified(registered.account.id);
    assert.equal(marked?.emailVerified, true);

    const reset = store.issueAuthToken(registered.account.id, 'reset', 60_000);
    const resetAccount = store.consumeAuthToken(reset!.token, 'reset');
    assert.equal(resetAccount?.email, 'resetme@example.com');
    assert.equal(store.setAccountPassword(registered.account.id, 'password2'), true);
    assert.equal(store.checkAccountPassword(registered.account.id, 'password2'), true);
    assert.equal(store.checkAccountPassword(registered.account.id, 'password1'), false);
  });

  test('usage snapshot uses the workspace plan', () => {
    const user = store.registerAccount({
      email: 'billed@example.com',
      password: 'password1',
    });
    assert.equal(user.ok, true);
    if (!user.ok) return;
    store.setAccountPlan(user.account.id, 'starter');
    const snap = store.usageSnapshot(user.account.workspaceId);
    assert.equal(snap.plan.id, 'starter');
    assert.equal(snap.billing.stripeConfigured, false);
  });
});
