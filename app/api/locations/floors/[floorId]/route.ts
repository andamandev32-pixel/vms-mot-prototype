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
// PATCH /api/locations/floors/:floorId — แก้ไขชั้น (admin only)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const { floorId } = await params;
    const entityId = parseInt(floorId, 10);
    if (isNaN(entityId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.floor.findUnique({ where: { id: entityId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบชั้นที่ระบุ", 404);

    const body = await request.json();
    const { buildingId, name, nameEn, floorNumber, departmentIds } = body as {
      buildingId?: number;
      name?: string;
      nameEn?: string;
      floorNumber?: number;
      departmentIds?: number[];
    };

    await prisma.$transaction(async (tx) => {
      await tx.floor.update({
        where: { id: entityId },
        data: {
          ...(buildingId !== undefined && { buildingId }),
          ...(name !== undefined && { name: name.trim() }),
          ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
          ...(floorNumber !== undefined && { floorNumber }),
        },
      });

      if (departmentIds !== undefined) {
        await tx.floorDepartment.deleteMany({ where: { floorId: entityId } });
        if (departmentIds.length > 0) {
          await tx.floorDepartment.createMany({
            data: departmentIds.map((deptId) => ({
              floorId: entityId,
              departmentId: deptId,
            })),
          });
        }
      }
    });

    const floor = await prisma.floor.findUnique({
      where: { id: entityId },
      include: {
        floorDepartments: {
          include: { department: { select: { id: true, name: true, nameEn: true } } },
        },
      },
    });

    return ok({ floor });
  } catch (error) {
    console.error("PATCH /api/locations/floors/[floorId] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/locations/floors/:floorId — ลบชั้น (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const { floorId } = await params;
    const entityId = parseInt(floorId, 10);
    if (isNaN(entityId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.floor.findUnique({ where: { id: entityId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบชั้นที่ระบุ", 404);

    await prisma.floorDepartment.deleteMany({ where: { floorId: entityId } });
    await prisma.floor.delete({ where: { id: entityId } });

    return ok({ message: "ลบชั้นเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/locations/floors/[floorId] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
