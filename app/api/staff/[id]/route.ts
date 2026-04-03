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
// GET /api/staff/:id — ข้อมูลพนักงานรายบุคคล
// ─────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await params;
    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return err("INVALID_ID", "รหัสพนักงานไม่ถูกต้อง");
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
      },
    });

    if (!staff) {
      return err("NOT_FOUND", "ไม่พบพนักงานที่ระบุ", 404);
    }

    return ok({ staff });
  } catch (error) {
    console.error("GET /api/staff/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/staff/:id — อัปเดตข้อมูลพนักงาน (admin only)
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
    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return err("INVALID_ID", "รหัสพนักงานไม่ถูกต้อง");
    }

    const existing = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบพนักงานที่ระบุ", 404);
    }

    const body = await request.json();
    const {
      employeeId, name, nameEn, position, departmentId,
      email, phone, role, status, shift,
    } = body as {
      employeeId?: string;
      name?: string;
      nameEn?: string;
      position?: string;
      departmentId?: number;
      email?: string;
      phone?: string;
      role?: string;
      status?: string;
      shift?: string;
    };

    // Check employeeId uniqueness if changed
    if (employeeId !== undefined && employeeId.trim() !== existing.employeeId) {
      const dup = await prisma.staff.findUnique({ where: { employeeId: employeeId.trim() } });
      if (dup) {
        return err("EMPLOYEE_ID_EXISTS", "รหัสพนักงานนี้ถูกใช้งานแล้ว");
      }
    }

    // Verify department if changed
    if (departmentId !== undefined) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        return err("DEPARTMENT_NOT_FOUND", "ไม่พบแผนกที่ระบุ", 404);
      }
    }

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        ...(employeeId !== undefined && { employeeId: employeeId.trim() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(position !== undefined && { position: position.trim() }),
        ...(departmentId !== undefined && { departmentId }),
        ...(email !== undefined && { email: email.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(role !== undefined && { role: role.trim() }),
        ...(status !== undefined && { status }),
        ...(shift !== undefined && { shift: shift?.trim() || null }),
      },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
      },
    });

    return ok({ staff });
  } catch (error) {
    console.error("PUT /api/staff/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/staff/:id — soft delete (deactivate) พนักงาน (admin only)
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
    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return err("INVALID_ID", "รหัสพนักงานไม่ถูกต้อง");
    }

    const existing = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบพนักงานที่ระบุ", 404);
    }

    // Soft delete: set status to "inactive"
    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: { status: "inactive" },
    });

    return ok({ staff, message: "ปิดการใช้งานพนักงานเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/staff/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
