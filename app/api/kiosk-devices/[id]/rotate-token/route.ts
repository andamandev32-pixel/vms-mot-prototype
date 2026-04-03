import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { generateDeviceToken } from "@/lib/kiosk-auth";
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
// POST /api/kiosk-devices/:id/rotate-token — generate new token (admin only)
// Old token is immediately invalidated
// ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะ admin เท่านั้น", 403);

    const { id } = await params;
    const deviceId = parseInt(id, 10);
    if (isNaN(deviceId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.kioskDevice.findUnique({ where: { id: deviceId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบอุปกรณ์", 404);
    if (existing.status === "revoked") return err("DEVICE_REVOKED", "อุปกรณ์ถูกเพิกถอนแล้ว ไม่สามารถ rotate token ได้");

    // Generate new token
    const { token, tokenHash, tokenPrefix } = generateDeviceToken();

    await prisma.kioskDevice.update({
      where: { id: deviceId },
      data: { tokenHash, tokenPrefix, status: "active" },
    });

    return ok({
      deviceId,
      token, // ⚠️ แสดงครั้งเดียว ไม่สามารถดึงกลับมาได้
      message: "Token ใหม่ถูกสร้างแล้ว — token เก่าใช้งานไม่ได้อีกต่อไป",
    });
  } catch (error) {
    console.error("POST /api/kiosk-devices/[id]/rotate-token error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
