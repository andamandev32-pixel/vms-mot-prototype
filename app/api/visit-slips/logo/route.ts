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
// POST /api/visit-slips/logo — อัปโหลดโลโก้ใบผ่าน (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    // TODO: Implement actual file upload (e.g., to S3 or local storage)
    // For now, return mock success
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("image/")) {
      return err("INVALID_CONTENT_TYPE", "กรุณาอัปโหลดไฟล์รูปภาพ (PNG, JPG)");
    }

    return ok({
      logoUrl: "/uploads/slip-logo-placeholder.png",
      message: "อัปโหลดโลโก้สำเร็จ (mock)",
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/visit-slips/logo error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
