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
// GET /api/kiosk-devices — list all kiosk devices (admin only)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะ admin เท่านั้น", 403);

    const devices = await prisma.kioskDevice.findMany({
      include: {
        servicePoint: { select: { id: true, name: true, nameEn: true, location: true } },
        registeredBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ไม่ return tokenHash ออกไป
    const safeDevices = devices.map(({ tokenHash, tokenPrefix, ...d }) => d);

    return ok({ devices: safeDevices });
  } catch (error) {
    console.error("GET /api/kiosk-devices error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/kiosk-devices — register new kiosk device (admin only)
// Returns raw token ONCE — cannot be retrieved again
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะ admin เท่านั้น", 403);

    const body = await request.json();
    const { name, serialNumber, servicePointId } = body as {
      name?: string;
      serialNumber?: string;
      servicePointId?: number;
    };

    if (!name?.trim() || !serialNumber?.trim() || !servicePointId) {
      return err("MISSING_FIELDS", "กรุณากรอก name, serialNumber, servicePointId");
    }

    // Validate service point exists
    const sp = await prisma.servicePoint.findUnique({ where: { id: servicePointId } });
    if (!sp) return err("NOT_FOUND", "ไม่พบจุดบริการที่ระบุ", 404);

    // Check duplicate serial
    const existing = await prisma.kioskDevice.findUnique({ where: { serialNumber: serialNumber.trim() } });
    if (existing) return err("DUPLICATE_SERIAL", "หมายเลขซีเรียลนี้ถูกใช้งานแล้ว");

    // Generate token
    const { token, tokenHash, tokenPrefix } = generateDeviceToken();

    const device = await prisma.kioskDevice.create({
      data: {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
        servicePointId,
        token,
        tokenHash,
        tokenPrefix,
        registeredById: user.id,
      },
      include: {
        servicePoint: { select: { id: true, name: true, nameEn: true } },
      },
    });

    // Return token ครั้งเดียว — เก็บไว้ให้ดี!
    return ok({
      device: {
        id: device.id,
        name: device.name,
        serialNumber: device.serialNumber,
        servicePoint: device.servicePoint,
        status: device.status,
        createdAt: device.createdAt,
      },
      token, // ⚠️ แสดงครั้งเดียว ไม่สามารถดึงกลับมาได้
    });
  } catch (error) {
    console.error("POST /api/kiosk-devices error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
