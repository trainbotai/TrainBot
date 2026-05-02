import { Resend } from 'resend';
import { env } from '../config/index.js';
import { logger } from '../lib/logger.js';

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!cachedClient) cachedClient = new Resend(env.RESEND_API_KEY);
  return cachedClient;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email if RESEND_API_KEY is configured.
 * If not configured, logs the would-be email and returns silently.
 * Never throws — email failures should not break primary flows.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ sent: boolean }> {
  const client = getClient();
  if (!client) {
    logger.info({ to: opts.to, subject: opts.subject }, 'email skipped (no RESEND_API_KEY)');
    return { sent: false };
  }
  try {
    await client.emails.send({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: opts.to }, 'email send failed');
    return { sent: false };
  }
}

/**
 * Notify teacher that a student synced for the first time.
 */
export async function notifyTeacherFirstStudentSync(opts: {
  teacherEmail: string;
  teacherName: string;
  studentName: string;
  className: string;
}) {
  const link = `${env.PUBLIC_WEB_URL}/`;
  return sendEmail({
    to: opts.teacherEmail,
    subject: `${opts.studentName} a început să folosească TrainBot 🎉`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1A1A2E;">
        <h2 style="color: #7B5BF5;">Salut, ${escapeHtml(opts.teacherName)}!</h2>
        <p><strong>${escapeHtml(opts.studentName)}</strong> tocmai și-a sincronizat primul proiect ML din clasa <em>${escapeHtml(opts.className)}</em>.</p>
        <p>Poți vedea ce lucrează în dashboard:</p>
        <p><a href="${link}" style="display:inline-block; background:#7B5BF5; color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">Deschide dashboard</a></p>
        <p style="color: #6B6B85; font-size: 13px; margin-top: 24px;">— Echipa TrainBot</p>
      </div>
    `.trim(),
    text: `${opts.studentName} a sincronizat primul proiect din clasa ${opts.className}. Vezi dashboard: ${link}`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
