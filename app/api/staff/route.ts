import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyVisitorToken, VISITOR_COOKIE_NAME } from "@/lib/visitor-auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie (staff หรือ visitor) =====
async function getAuthUser(request: NextRequest) {
  const staffToken = request.cookies.get("evms_session")?.value;
  if (staffToken) return await verifyToken(staffToken);
  const visitorToken = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (visitorToken) {
    const v = await verifyVisitorToken(visitorToken);
    if (v) {
      return {
        id: v.id,
        username: v.email,
        email: v.email,
        name: `${v.firstName} ${v.lastName}`,
        nameEn: `${v.firstName} ${v.lastName}`,
        role: "visitor" as const,
        departmentId: null,
        departmentName: null,
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────
// GET /api/staff — รายชื่อพนักงานทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { employeeId: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (departmentId) {
      const deptId = parseInt(departmentId, 10);
      if (!isNaN(deptId)) {
        where.departmentId = deptId;
      }
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    const [staffList, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, nameEn: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.staff.count({ where }),
    ]);

    return ok({
      staff: staffList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/staff — สร้างพนักงานใหม่ (admin only)
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

    if (!employeeId?.trim() || !name?.trim() || !nameEn?.trim() || !position?.trim() || !departmentId || !email?.trim() || !phone?.trim() || !role?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอกข้อมูลให้ครบถ้วน (employeeId, name, nameEn, position, departmentId, email, phone, role)");
    }

    // Check employeeId uniqueness
    const existing = await prisma.staff.findUnique({ where: { employeeId: employeeId.trim() } });
    if (existing) {
      return err("EMPLOYEE_ID_EXISTS", "รหัสพนักงานนี้ถูกใช้งานแล้ว");
    }

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return err("DEPARTMENT_NOT_FOUND", "ไม่พบแผนกที่ระบุ", 404);
    }

    const staff = await prisma.staff.create({
      data: {
        employeeId: employeeId.trim(),
        name: name.trim(),
        nameEn: nameEn.trim(),
        position: position.trim(),
        departmentId,
        email: email.trim(),
        phone: phone.trim(),
        role: role.trim(),
        status: status ?? "active",
        shift: shift?.trim() || null,
      },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
      },
    });

    return ok({ staff });
  } catch (error) {
    console.error("POST /api/staff error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
