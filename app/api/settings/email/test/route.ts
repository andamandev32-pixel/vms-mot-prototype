import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// POST /api/settings/email/test — ทดสอบส่งอีเมล (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const { to } = body as { to?: string };

    if (!to?.trim()) {
      return err("MISSING_FIELDS", "กรุณาระบุอีเมลปลายทาง");
    }

    // Mock success — actual email sending not yet implemented
    return ok({
      message: "ส่งอีเมลทดสอบสำเร็จ (mock)",
      sentTo: to.trim(),
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/settings/email/test error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
