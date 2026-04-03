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
// GET /api/kiosk-devices/:id — single device detail (admin only)
// ─────────────────────────────────────────────────────
export async function GET(
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

    const device = await prisma.kioskDevice.findUnique({
      where: { id: deviceId },
      include: {
        servicePoint: { select: { id: true, name: true, nameEn: true, location: true } },
        registeredBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!device) return err("NOT_FOUND", "ไม่พบอุปกรณ์", 404);

    const { tokenHash, tokenPrefix, ...safeDevice } = device;
    return ok({ device: safeDevice });
  } catch (error) {
    console.error("GET /api/kiosk-devices/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/kiosk-devices/:id — update device info (admin only)
// ─────────────────────────────────────────────────────
export async function PUT(
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

    const body = await request.json();
    const { name, servicePointId, status } = body as {
      name?: string;
      servicePointId?: number;
      status?: string;
    };

    // Validate status
    if (status && !["active", "revoked", "suspended"].includes(status)) {
      return err("INVALID_STATUS", "สถานะไม่ถูกต้อง (active, revoked, suspended)");
    }

    const device = await prisma.kioskDevice.update({
      where: { id: deviceId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(servicePointId !== undefined && { servicePointId }),
        ...(status !== undefined && { status }),
      },
      include: {
        servicePoint: { select: { id: true, name: true, nameEn: true } },
      },
    });

    const { tokenHash, tokenPrefix, ...safeDevice } = device;
    return ok({ device: safeDevice });
  } catch (error) {
    console.error("PUT /api/kiosk-devices/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/kiosk-devices/:id — revoke device (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
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

    // Soft delete: set status to "revoked"
    await prisma.kioskDevice.update({
      where: { id: deviceId },
      data: { status: "revoked" },
    });

    return ok({ message: "เพิกถอนอุปกรณ์เรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/kiosk-devices/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
