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
// PUT /api/locations/floors/:floorId/departments — กำหนดแผนกให้ชั้น (admin only)
// ─────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { floorId } = await params;
    const fId = parseInt(floorId, 10);
    if (isNaN(fId)) {
      return err("INVALID_ID", "รหัสชั้นไม่ถูกต้อง");
    }

    const floor = await prisma.floor.findUnique({ where: { id: fId } });
    if (!floor) {
      return err("NOT_FOUND", "ไม่พบชั้นที่ระบุ", 404);
    }

    const body = await request.json();
    const { departmentIds } = body as { departmentIds?: number[] };

    if (!Array.isArray(departmentIds)) {
      return err("MISSING_FIELDS", "กรุณาระบุ departmentIds เป็น array");
    }

    // Replace all floor-department assignments in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.floorDepartment.deleteMany({ where: { floorId: fId } });

      // Create new assignments
      if (departmentIds.length > 0) {
        await tx.floorDepartment.createMany({
          data: departmentIds.map((deptId) => ({
            floorId: fId,
            departmentId: deptId,
          })),
        });
      }
    });

    // Fetch updated assignments
    const floorDepartments = await prisma.floorDepartment.findMany({
      where: { floorId: fId },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
      },
    });

    return ok({ floorId: fId, departments: floorDepartments });
  } catch (error) {
    console.error("PUT /api/locations/floors/[floorId]/departments error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
