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

// POST /api/settings/email-templates/test — Send test email (mock)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const body = await request.json();
    const { template_id, to_email } = body as {
      template_id?: number;
      to_email?: string;
    };

    if (!template_id) return err("MISSING_FIELDS", "กรุณาระบุ template_id");
    if (!to_email?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ to_email");

    const template = await prisma.emailNotificationTemplate.findUnique({
      where: { id: template_id },
    });
    if (!template) return err("NOT_FOUND", "ไม่พบ template ที่ระบุ", 404);

    // Mock send — log and return success
    console.log(`[TEST EMAIL] Template: ${template.name}, To: ${to_email}, Subject: ${template.subject}`);

    return ok({
      status: "sent",
      to: to_email,
      template: template.name,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/settings/email-templates/test error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
