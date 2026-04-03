import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/settings/email — ดึงค่า SMTP config (admin)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    // Get singleton (first record)
    const config = await prisma.emailConfig.findFirst();

    return ok({ config });
  } catch (error) {
    console.error("GET /api/settings/email error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/settings/email — อัปเดตค่า SMTP config (admin)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const {
      smtpHost, smtpPort, encryption, smtpUsername, smtpPassword,
      fromEmail, fromDisplayName, replyToEmail, isActive,
    } = body as {
      smtpHost?: string;
      smtpPort?: number;
      encryption?: string;
      smtpUsername?: string;
      smtpPassword?: string;
      fromEmail?: string;
      fromDisplayName?: string;
      replyToEmail?: string;
      isActive?: boolean;
    };

    // Find existing or create
    const existing = await prisma.emailConfig.findFirst();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { updatedBy: user.id };
    if (smtpHost !== undefined) data.smtpHost = smtpHost;
    if (smtpPort !== undefined) data.smtpPort = smtpPort;
    if (encryption !== undefined) data.encryption = encryption;
    if (smtpUsername !== undefined) data.smtpUsername = smtpUsername;
    if (smtpPassword !== undefined) data.smtpPassword = smtpPassword;
    if (fromEmail !== undefined) data.fromEmail = fromEmail;
    if (fromDisplayName !== undefined) data.fromDisplayName = fromDisplayName;
    if (replyToEmail !== undefined) data.replyToEmail = replyToEmail;
    if (isActive !== undefined) data.isActive = isActive;

    let config;
    if (existing) {
      config = await prisma.emailConfig.update({
        where: { id: existing.id },
        data,
      });
    } else {
      // Create with required fields
      if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !fromEmail || !fromDisplayName) {
        return err("MISSING_FIELDS", "กรุณากรอกข้อมูล SMTP ให้ครบถ้วน");
      }
      config = await prisma.emailConfig.create({ data });
    }

    return ok({ config });
  } catch (error) {
    console.error("PUT /api/settings/email error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
