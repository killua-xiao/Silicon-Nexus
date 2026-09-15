import nodemailer from 'nodemailer';
import { logJson } from './log.ts';

export function isMailConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_URL || '').trim() ||
      ((process.env.SMTP_HOST || '').trim() && (process.env.SMTP_FROM || '').trim())
  );
}

/** Local/dev only. Never enable on a public host — forgot/verify links become an account-takeover channel. */
export function shouldExposeEmailLinks(): boolean {
  return (process.env.NEXUS_EXPOSE_EMAIL_LINKS || '').trim() === '1';
}

export function mailFromAddress(): string {
  return (process.env.SMTP_FROM || process.env.MAIL_FROM || 'Silicon Nexus <noreply@silinex.xyz>').trim();
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; code: 'unconfigured' | 'send_failed'; error?: string }> {
  if (!isMailConfigured()) return { ok: false, code: 'unconfigured' };
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: mailFromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true };
  } catch (error: any) {
    logJson('error', 'Mail send failed', { error: String(error?.message || error) });
    return { ok: false, code: 'send_failed', error: String(error?.message || error) };
  }
}

function createTransport() {
  const url = (process.env.SMTP_URL || '').trim();
  if (url) return nodemailer.createTransport(url);
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: (process.env.SMTP_HOST || '').trim(),
    port,
    secure: port === 465 || process.env.SMTP_SECURE === '1',
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          }
        : undefined,
  });
}
