import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
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
// GET /api/service-points/:id — ดึงข้อมูลจุดบริการ (staff หรือ kiosk)
// ─────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await params;
    const spId = parseInt(id, 10);
    if (isNaN(spId)) {
      return err("INVALID_ID", "รหัสจุดบริการไม่ถูกต้อง");
    }

    const servicePoint = await prisma.servicePoint.findUnique({
      where: { id: spId },
      include: {
        servicePointPurposes: {
          include: {
            visitPurpose: { select: { id: true, name: true, nameEn: true, icon: true, isActive: true } },
          },
        },
        servicePointDocuments: {
          include: {
            identityDocumentType: { select: { id: true, name: true, nameEn: true } },
          },
        },
        assignedStaff: { select: { id: true, name: true, nameEn: true } },
      },
    });

    if (!servicePoint) {
      return err("NOT_FOUND", "ไม่พบจุดบริการที่ระบุ", 404);
    }

    return ok({ servicePoint });
  } catch (error) {
    console.error("GET /api/service-points/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/service-points/:id — อัปเดตจุดบริการ (admin only)
// ─────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { id } = await params;
    const spId = parseInt(id, 10);
    if (isNaN(spId)) {
      return err("INVALID_ID", "รหัสจุดบริการไม่ถูกต้อง");
    }

    const existing = await prisma.servicePoint.findUnique({ where: { id: spId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบจุดบริการที่ระบุ", 404);
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
      assignedStaffId?: number | null;
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

    // Check serialNumber uniqueness if changed
    if (serialNumber !== undefined && serialNumber.trim() !== existing.serialNumber) {
      const dup = await prisma.servicePoint.findUnique({ where: { serialNumber: serialNumber.trim() } });
      if (dup) {
        return err("SERIAL_NUMBER_EXISTS", "หมายเลขซีเรียลนี้ถูกใช้งานแล้ว");
      }
    }

    const servicePoint = await prisma.servicePoint.update({
      where: { id: spId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(type !== undefined && { type: type.trim() }),
        ...(status !== undefined && { status }),
        ...(location !== undefined && { location: location.trim() }),
        ...(locationEn !== undefined && { locationEn: locationEn.trim() }),
        ...(building !== undefined && { building: building.trim() }),
        ...(floor !== undefined && { floor: floor.trim() }),
        ...(ipAddress !== undefined && { ipAddress: ipAddress.trim() }),
        ...(macAddress !== undefined && { macAddress: macAddress.trim() }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber.trim() }),
        ...(assignedStaffId !== undefined && { assignedStaffId }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(wifiSsid !== undefined && { wifiSsid: wifiSsid?.trim() || null }),
        ...(wifiPasswordPattern !== undefined && { wifiPasswordPattern: wifiPasswordPattern?.trim() || null }),
        ...(wifiValidityMode !== undefined && { wifiValidityMode: wifiValidityMode?.trim() || null }),
        ...(wifiFixedDurationMin !== undefined && { wifiFixedDurationMin }),
        ...(pdpaRequireScroll !== undefined && { pdpaRequireScroll }),
        ...(pdpaRetentionDays !== undefined && { pdpaRetentionDays }),
        ...(slipHeaderText !== undefined && { slipHeaderText: slipHeaderText?.trim() || null }),
        ...(slipFooterText !== undefined && { slipFooterText: slipFooterText?.trim() || null }),
        ...(followBusinessHours !== undefined && { followBusinessHours }),
        ...(idMaskingPattern !== undefined && { idMaskingPattern: idMaskingPattern?.trim() || null }),
        ...(adminPin !== undefined && { adminPin: adminPin?.trim() || null }),
      },
    });

    return ok({ servicePoint });
  } catch (error) {
    console.error("PUT /api/service-points/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/service-points/:id — ลบจุดบริการ (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { id } = await params;
    const spId = parseInt(id, 10);
    if (isNaN(spId)) {
      return err("INVALID_ID", "รหัสจุดบริการไม่ถูกต้อง");
    }

    const existing = await prisma.servicePoint.findUnique({ where: { id: spId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบจุดบริการที่ระบุ", 404);
    }

    await prisma.servicePoint.delete({ where: { id: spId } });

    return ok({ message: "ลบจุดบริการเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/service-points/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
