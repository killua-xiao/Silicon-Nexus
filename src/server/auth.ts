import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import {
  findAccountByTokenHash,
  findCredentialByTokenHash,
  generateSecret,
  hashToken,
  ensureDataDir,
} from './store.ts';
import { NexusIdentity, NexusRole } from './types.ts';
import { planHasFeature, type PlanFeatureId } from './plans.ts';
import { logJson } from './log.ts';

const SECRETS_FILE = path.join(process.cwd(), 'data', 'secrets.json');

export function loadOrCreateOperatorKey(): { operatorKey: string; freshlyCreated: boolean } {
  const fromEnv = (
    process.env.NEXUS_OPERATOR_KEY ||
    process.env.NEXUS_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();

  if (fromEnv) {
    return { operatorKey: fromEnv, freshlyCreated: false };
  }

  try {
    ensureDataDir();
    if (fs.existsSync(SECRETS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf-8'));
      if (parsed.operatorKey && typeof parsed.operatorKey === 'string') {
        return { operatorKey: parsed.operatorKey, freshlyCreated: false };
      }
    }
  } catch (error) {
    logJson('error', 'Failed to read secrets file', { error: String(error) });
  }

  const operatorKey = generateSecret('nxo');
  const payload = {
    operatorKey,
    createdAt: new Date().toISOString(),
    note: 'Operator key for dashboard & agent enrollment. Do not commit this file.',
  };
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  return { operatorKey, freshlyCreated: true };
}

/**
 * Extract credentials from Authorization Bearer or X-API-Key only.
 * Query-string api_key is intentionally unsupported (leaks via logs/referrers).
 */
export function extractProvidedToken(req: Request): string {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-api-key'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (customHeader) {
    return String(customHeader).trim();
  }
  return '';
}

export function resolveIdentity(token: string, operatorKey: string): NexusIdentity {
  if (!token) return { role: 'anonymous' };

  // Instance admin (legacy operator key) — full surface
  if (token === operatorKey) {
    return {
      role: 'operator',
      workspaceId: 'default',
      accountRole: 'admin',
      planId: 'unlimited',
    };
  }

  // Human account session (nxu_*)
  if (token.startsWith('nxu_')) {
    const account = findAccountByTokenHash(hashToken(token));
    if (account) {
      return {
        role: 'operator',
        workspaceId: account.workspaceId,
        accountId: account.id,
        accountRole: account.role,
        planId: account.role === 'admin' ? 'unlimited' : account.planId,
      };
    }
  }

  // Agent token (nxa_*) — API / MCP only, no console role
  const cred = findCredentialByTokenHash(hashToken(token));
  if (cred) {
    return { role: 'agent', agentId: cred.agentId, workspaceId: cred.workspaceId };
  }

  return { role: 'anonymous' };
}

export function createAuthMiddleware(options: { openMode: boolean; operatorKey: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const publicGet =
      req.method === 'GET' &&
      (req.path === '/directory' ||
        req.path === '/feed' ||
        req.path.startsWith('/feed/') ||
        req.path === '/sites' ||
        req.path.startsWith('/sites/') ||
        req.path === '/plans');

    const publicAuth =
      req.path === '/auth/status' ||
      req.path === '/auth/register' ||
      req.path === '/auth/login' ||
      req.path === '/auth/verify' ||
      req.path === '/auth/forgot' ||
      req.path === '/auth/reset' ||
      req.path === '/locale' ||
      req.path === '/plans' ||
      req.path === '/billing/webhook';

    if (publicAuth || publicGet) {
      req.nexus = { role: 'anonymous' };
      // Still attach identity if a token was provided (for /auth/me style routes that opt in)
      if (!publicAuth || req.path === '/auth/status') {
        const token = extractProvidedToken(req);
        if (token) {
          const identity = resolveIdentity(token, options.operatorKey);
          if (identity.role !== 'anonymous') req.nexus = identity;
        }
      }
      return next();
    }

    if (options.openMode) {
      req.nexus = {
        role: 'operator',
        workspaceId: 'default',
        accountRole: 'admin',
        planId: 'unlimited',
      };
      return next();
    }

    const token = extractProvidedToken(req);
    const identity = resolveIdentity(token, options.operatorKey);
    req.nexus = identity;

    if (identity.role === 'anonymous') {
      return res.status(401).json({
        error: 'Unauthorized Access',
        message:
          'Provide Operator Key (nxo_*), Account session (nxu_*), or Agent Token (nxa_*) via Authorization: Bearer or X-API-Key.',
        code: 'NEXUS_RE_AUTHENTICATE',
      });
    }

    next();
  };
}

export function requireRole(...roles: NexusRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.nexus?.role || 'anonymous';
    if (!roles.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This action requires a different credential (operator/account or agent token).',
        code: 'NEXUS_INSUFFICIENT_ROLE',
      });
    }
    next();
  };
}

/** Admin = operator key or account.role=admin */
export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.nexus?.role !== 'operator' || req.nexus.accountRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin account or operator key required.',
        code: 'NEXUS_ADMIN_REQUIRED',
      });
    }
    next();
  };
}

export function requireFeature(feature: PlanFeatureId) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.nexus?.role === 'operator' && req.nexus.accountRole === 'admin') {
      return next();
    }
    const planId = req.nexus?.planId || 'free';
    if (!planHasFeature(planId, feature)) {
      return res.status(402).json({
        error: 'Plan upgrade required',
        feature,
        plan: planId,
        message: `Feature "${feature}" is not included in plan "${planId}". See /pricing.`,
        code: 'NEXUS_PLAN_FEATURE',
      });
    }
    next();
  };
}

export function planIdFromRequest(req: Request): string | null {
  return req.nexus?.planId || null;
}

export function assertAgentMemoryAccess(
  req: Request,
  agentId: string,
  res: Response
): boolean {
  if (req.nexus?.role === 'operator') return true;
  if (req.nexus?.role === 'agent' && req.nexus.agentId === agentId) return true;
  res.status(403).json({
    error: 'Forbidden',
    message: 'Agents may only access their own memory vault.',
    code: 'NEXUS_AGENT_SCOPE',
  });
  return false;
}

export function isOpenAuthMode(): boolean {
  return (process.env.NEXUS_AUTH_MODE || '').trim().toLowerCase() === 'open';
}

/** Prefer account/agent id for per-credential rate limits. */
export function rateLimitKey(req: Request): string {
  const token = extractProvidedToken(req);
  if (token) return `tok:${hashToken(token).slice(0, 16)}`;
  return `ip:${req.ip || 'unknown'}`;
}
