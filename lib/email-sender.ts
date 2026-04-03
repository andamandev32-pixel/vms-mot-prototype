// ═══════════════════════════════════════════════════════════
// eVMS Email Sender — SMTP email sending using nodemailer
// ═══════════════════════════════════════════════════════════

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";

let cachedTransporter: Transporter | null = null;
let cachedConfigId: number | null = null;

interface EmailConfig {
  id: number;
  smtpHost: string;
  smtpPort: number;
  encryption: string;
  username: string;
  password: string;
  fromEmail: string;
  fromDisplayName: string;
  replyToEmail: string | null;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  const config = await prisma.emailConfig.findFirst({
    where: { isActive: true },
  });
  return config as EmailConfig | null;
}

export async function getEmailTransporter(): Promise<Transporter | null> {
  const config = await getEmailConfig();
  if (!config) {
    console.warn("[EmailSender] No active email configuration found");
    return null;
  }

  // Reuse cached transporter if config hasn't changed
  if (cachedTransporter && cachedConfigId === config.id) {
    return cachedTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.encryption === "ssl",
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: config.encryption === "tls" ? { rejectUnauthorized: false } : undefined,
  });

  cachedTransporter = transporter;
  cachedConfigId = config.id;
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await getEmailTransporter();
    if (!transporter) return { success: false, error: "Email not configured" };

    const config = await getEmailConfig();
    if (!config) return { success: false, error: "Email not configured" };

    await transporter.sendMail({
      from: `"${config.fromDisplayName}" <${config.fromEmail}>`,
      replyTo: config.replyToEmail || undefined,
      to,
      subject,
      html: htmlBody,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[EmailSender] Failed to send to ${to}:`, message);
    return { success: false, error: message };
  }
}

export async function sendBulkEmail(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  renderHtml: (recipient: { email: string; name: string }) => string
): Promise<{ sent: number; skipped: number; failed: number; errors: string[] }> {
  const result = { sent: 0, skipped: 0, failed: 0, errors: [] as string[] };

  const transporter = await getEmailTransporter();
  if (!transporter) {
    result.errors.push("Email not configured");
    result.skipped = recipients.length;
    return result;
  }

  for (const recipient of recipients) {
    if (!recipient.email) {
      result.skipped++;
      continue;
    }

    const html = renderHtml(recipient);
    const res = await sendEmail(recipient.email, subject, html);

    if (res.success) {
      result.sent++;
    } else {
      result.failed++;
      result.errors.push(`${recipient.email}: ${res.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return result;
}
