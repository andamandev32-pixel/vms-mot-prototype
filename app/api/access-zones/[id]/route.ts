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
// PUT /api/access-zones/:id — แก้ไข Access Zone (admin)
// ─────────────────────────────────────────────────────
export async function PUT(
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

    const existing = await prisma.accessZone.findUnique({ where: { id: zoneId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบ Access Zone", 404);

    const body = await request.json();
    const { name, nameEn, type, hikvisionDoorId, buildingId, floorId, description, isActive } = body;

    // Check unique hikvisionDoorId if changed
    if (hikvisionDoorId && hikvisionDoorId !== existing.hikvisionDoorId) {
      const dup = await prisma.accessZone.findUnique({ where: { hikvisionDoorId } });
      if (dup) return err("DUPLICATE_DOOR_ID", "hikvisionDoorId นี้ถูกใช้งานแล้ว");
    }

    const zone = await prisma.accessZone.update({
      where: { id: zoneId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(type !== undefined && { type: type.trim() }),
        ...(hikvisionDoorId !== undefined && { hikvisionDoorId: hikvisionDoorId.trim() }),
        ...(buildingId !== undefined && { buildingId }),
        ...(floorId !== undefined && { floorId }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        building: { select: { id: true, name: true, nameEn: true } },
        floor: { select: { id: true, name: true, nameEn: true, floorNumber: true } },
      },
    });

    return ok({ zone });
  } catch (error) {
    console.error("PUT /api/access-zones/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/access-zones/:id — ลบ Access Zone (admin)
// ─────────────────────────────────────────────────────
export async function DELETE(
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

    const existing = await prisma.accessZone.findUnique({ where: { id: zoneId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบ Access Zone", 404);

    // Check if zone is used in access group mappings
    const usageCount = await prisma.accessGroupZone.count({
      where: { accessZoneId: zoneId },
    });
    if (usageCount > 0) {
      return err("IN_USE", "ไม่สามารถลบได้ เนื่องจาก Access Zone นี้ถูกใช้งานอยู่ใน Access Group");
    }

    await prisma.accessZone.delete({ where: { id: zoneId } });

    return ok({ message: "ลบ Access Zone สำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/access-zones/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
