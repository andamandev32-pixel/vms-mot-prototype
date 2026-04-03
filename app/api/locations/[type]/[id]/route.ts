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

const VALID_TYPES = ["building", "floor", "department"] as const;
type LocationType = (typeof VALID_TYPES)[number];

// ─────────────────────────────────────────────────────
// DELETE /api/locations/:type/:id — ลบอาคาร/ชั้น/แผนก (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { type, id } = await params;
    const entityType = type as LocationType;

    if (!VALID_TYPES.includes(entityType)) {
      return err("INVALID_TYPE", "ประเภทไม่ถูกต้อง ต้องเป็น: building, floor, department");
    }

    const entityId = parseInt(id, 10);
    if (isNaN(entityId)) {
      return err("INVALID_ID", "รหัสไม่ถูกต้อง");
    }

    switch (entityType) {
      case "building": {
        const existing = await prisma.building.findUnique({ where: { id: entityId } });
        if (!existing) {
          return err("NOT_FOUND", "ไม่พบอาคารที่ระบุ", 404);
        }
        // Delete related floors and their department assignments first
        const floors = await prisma.floor.findMany({ where: { buildingId: entityId }, select: { id: true } });
        if (floors.length > 0) {
          const floorIds = floors.map((f) => f.id);
          await prisma.floorDepartment.deleteMany({ where: { floorId: { in: floorIds } } });
          await prisma.floor.deleteMany({ where: { buildingId: entityId } });
        }
        await prisma.building.delete({ where: { id: entityId } });
        return ok({ message: "ลบอาคารเรียบร้อยแล้ว" });
      }

      case "floor": {
        const existing = await prisma.floor.findUnique({ where: { id: entityId } });
        if (!existing) {
          return err("NOT_FOUND", "ไม่พบชั้นที่ระบุ", 404);
        }
        await prisma.floorDepartment.deleteMany({ where: { floorId: entityId } });
        await prisma.floor.delete({ where: { id: entityId } });
        return ok({ message: "ลบชั้นเรียบร้อยแล้ว" });
      }

      case "department": {
        const existing = await prisma.department.findUnique({ where: { id: entityId } });
        if (!existing) {
          return err("NOT_FOUND", "ไม่พบแผนกที่ระบุ", 404);
        }
        await prisma.floorDepartment.deleteMany({ where: { departmentId: entityId } });
        await prisma.department.delete({ where: { id: entityId } });
        return ok({ message: "ลบแผนกเรียบร้อยแล้ว" });
      }
    }
  } catch (error) {
    console.error("DELETE /api/locations/[type]/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
