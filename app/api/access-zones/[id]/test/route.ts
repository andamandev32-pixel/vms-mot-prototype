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
// POST /api/access-zones/:id/test — ทดสอบการเชื่อมต่อ Hikvision
// ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const { id } = await params;
    const zoneId = parseInt(id, 10);
    if (isNaN(zoneId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const zone = await prisma.accessZone.findUnique({ where: { id: zoneId } });
    if (!zone) return err("NOT_FOUND", "ไม่พบ Access Zone", 404);

    // TODO: Implement actual Hikvision API connection test
    // For now, return a mock response based on zone status
    const connected = zone.isActive;
    const message = connected
      ? `เชื่อมต่อ Hikvision Door ID: ${zone.hikvisionDoorId} สำเร็จ`
      : `ไม่สามารถเชื่อมต่อ Hikvision Door ID: ${zone.hikvisionDoorId} (Zone ถูกปิดใช้งาน)`;

    return ok({
      connected,
      message,
      doorId: zone.hikvisionDoorId,
      testedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/access-zones/[id]/test error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
