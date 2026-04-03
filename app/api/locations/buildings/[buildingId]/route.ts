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
// PATCH /api/locations/buildings/:buildingId — แก้ไขอาคาร (admin only)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const { buildingId } = await params;
    const entityId = parseInt(buildingId, 10);
    if (isNaN(entityId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.building.findUnique({ where: { id: entityId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบอาคารที่ระบุ", 404);

    const body = await request.json();
    const { name, nameEn, totalFloors, description, isActive } = body as {
      name?: string;
      nameEn?: string;
      totalFloors?: number;
      description?: string;
      isActive?: boolean;
    };

    const building = await prisma.building.update({
      where: { id: entityId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(totalFloors !== undefined && { totalFloors }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok({ building });
  } catch (error) {
    console.error("PATCH /api/locations/buildings/[buildingId] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/locations/buildings/:buildingId — ลบอาคาร (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const { buildingId } = await params;
    const entityId = parseInt(buildingId, 10);
    if (isNaN(entityId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.building.findUnique({ where: { id: entityId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบอาคารที่ระบุ", 404);

    const floors = await prisma.floor.findMany({ where: { buildingId: entityId }, select: { id: true } });
    if (floors.length > 0) {
      const floorIds = floors.map((f) => f.id);
      await prisma.floorDepartment.deleteMany({ where: { floorId: { in: floorIds } } });
      await prisma.floor.deleteMany({ where: { buildingId: entityId } });
    }
    await prisma.building.delete({ where: { id: entityId } });

    return ok({ message: "ลบอาคารเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/locations/buildings/[buildingId] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
