import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/kiosk/staff
// รายชื่อพนักงาน — ใช้ได้โดย kiosk device token (ไม่ต้องการ session ของ staff)
//
// Query params:
//   departmentId  (number)  — กรองตามหน่วยงาน
//   search        (string)  — ค้นหาชื่อ / ตำแหน่ง
//   status        (string)  — default "active"
//   limit         (number)  — default 200, max 500
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "active";
    const limit = Math.min(
      500,
      Math.max(1, parseInt(searchParams.get("limit") || "200", 10))
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      const deptId = parseInt(departmentId, 10);
      if (!isNaN(deptId)) {
        where.departmentId = deptId;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { position: { contains: search } },
      ];
    }

    const staffList = await prisma.staff.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        position: true,
        email: true,
        avatarUrl: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, nameEn: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return ok({ staff: staffList });
  } catch (error) {
    console.error("GET /api/kiosk/staff error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
