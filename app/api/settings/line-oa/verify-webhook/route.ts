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
// POST /api/settings/line-oa/verify-webhook — ตรวจสอบ webhook URL (admin)
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

    // Mock success — actual webhook verification not yet implemented
    return ok({
      verified: true,
      message: "Webhook URL ตรวจสอบสำเร็จ (mock)",
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/settings/line-oa/verify-webhook error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
