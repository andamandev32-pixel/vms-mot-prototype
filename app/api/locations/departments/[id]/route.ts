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
// PATCH /api/locations/departments/:id — แก้ไขแผนก (admin only)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const { id } = await params;
    const entityId = parseInt(id, 10);
    if (isNaN(entityId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.department.findUnique({ where: { id: entityId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบแผนกที่ระบุ", 404);

    const body = await request.json();
    const { name, nameEn, isActive } = body as {
      name?: string;
      nameEn?: string;
      isActive?: boolean;
    };

    const department = await prisma.department.update({
      where: { id: entityId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok({ department });
  } catch (error) {
    console.error("PATCH /api/locations/departments/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/locations/departments/:id — ลบแผนก (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const { id } = await params;
    const entityId = parseInt(id, 10);
    if (isNaN(entityId)) return err("INVALID_ID", "รหัสไม่ถูกต้อง");

    const existing = await prisma.department.findUnique({ where: { id: entityId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบแผนกที่ระบุ", 404);

    await prisma.floorDepartment.deleteMany({ where: { departmentId: entityId } });
    await prisma.department.delete({ where: { id: entityId } });

    return ok({ message: "ลบแผนกเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/locations/departments/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
