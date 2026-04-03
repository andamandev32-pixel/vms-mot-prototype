import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie =====
async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/service-points — รายการจุดบริการทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const servicePoints = await prisma.servicePoint.findMany({
      where,
      include: {
        assignedStaff: { select: { id: true, name: true, nameEn: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok({ servicePoints });
  } catch (error) {
    console.error("GET /api/service-points error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/service-points — สร้างจุดบริการใหม่ (admin only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const {
      name, nameEn, type, status, location, locationEn,
      building, floor, ipAddress, macAddress, serialNumber,
      assignedStaffId, notes, isActive,
      wifiSsid, wifiPasswordPattern, wifiValidityMode, wifiFixedDurationMin,
      pdpaRequireScroll, pdpaRetentionDays,
      slipHeaderText, slipFooterText, followBusinessHours,
      idMaskingPattern, adminPin,
    } = body as {
      name?: string;
      nameEn?: string;
      type?: string;
      status?: string;
      location?: string;
      locationEn?: string;
      building?: string;
      floor?: string;
      ipAddress?: string;
      macAddress?: string;
      serialNumber?: string;
      assignedStaffId?: number;
      notes?: string;
      isActive?: boolean;
      wifiSsid?: string;
      wifiPasswordPattern?: string;
      wifiValidityMode?: string;
      wifiFixedDurationMin?: number;
      pdpaRequireScroll?: boolean;
      pdpaRetentionDays?: number;
      slipHeaderText?: string;
      slipFooterText?: string;
      followBusinessHours?: boolean;
      idMaskingPattern?: string;
      adminPin?: string;
    };

    if (!name?.trim() || !nameEn?.trim() || !type?.trim() || !serialNumber?.trim() || !location?.trim() || !locationEn?.trim() || !building?.trim() || !floor?.trim() || !ipAddress?.trim() || !macAddress?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอกข้อมูลให้ครบถ้วน (name, nameEn, type, serialNumber, location, locationEn, building, floor, ipAddress, macAddress)");
    }

    // Check serialNumber uniqueness
    const existing = await prisma.servicePoint.findUnique({ where: { serialNumber: serialNumber.trim() } });
    if (existing) {
      return err("SERIAL_NUMBER_EXISTS", "หมายเลขซีเรียลนี้ถูกใช้งานแล้ว");
    }

    const servicePoint = await prisma.servicePoint.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        type: type.trim(),
        status: status ?? "online",
        location: location.trim(),
        locationEn: locationEn.trim(),
        building: building.trim(),
        floor: floor.trim(),
        ipAddress: ipAddress.trim(),
        macAddress: macAddress.trim(),
        serialNumber: serialNumber.trim(),
        assignedStaffId: assignedStaffId || null,
        notes: notes?.trim() || null,
        isActive: isActive ?? true,
        wifiSsid: wifiSsid?.trim() || null,
        wifiPasswordPattern: wifiPasswordPattern?.trim() || null,
        wifiValidityMode: wifiValidityMode?.trim() || null,
        wifiFixedDurationMin: wifiFixedDurationMin || null,
        pdpaRequireScroll: pdpaRequireScroll ?? true,
        pdpaRetentionDays: pdpaRetentionDays ?? 90,
        slipHeaderText: slipHeaderText?.trim() || null,
        slipFooterText: slipFooterText?.trim() || null,
        followBusinessHours: followBusinessHours ?? true,
        idMaskingPattern: idMaskingPattern?.trim() || null,
        adminPin: adminPin?.trim() || "10210",
      },
    });

    return ok({ servicePoint });
  } catch (error) {
    console.error("POST /api/service-points error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
