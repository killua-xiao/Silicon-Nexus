import fs from 'fs';

const env: Record<string, string> = {};
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
process.env.SMTP_HOST = env.SMTP_HOST;
process.env.SMTP_PORT = env.SMTP_PORT;
process.env.SMTP_SECURE = env.SMTP_SECURE;
process.env.SMTP_USER = env.SMTP_USER;
process.env.SMTP_PASS = env.SMTP_PASS;
process.env.SMTP_FROM = env.SMTP_FROM;

const { sendMail, mailFromAddress } = await import('../src/server/mail.ts');
const r = await sendMail({
  to: env.SMTP_USER!,
  subject: 'Silicon Nexus SMTP 自检',
  text: '这封邮件来自 silinex.xyz 生产服务的 SMTP 自检。收到即说明发信链路正常。',
});
console.log('sendMail to self:', JSON.stringify(r));
console.log('from:', mailFromAddress());
