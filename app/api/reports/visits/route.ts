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
// GET /api/reports/visits — รายงานการเข้าเยี่ยม (admin/supervisor)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const type = searchParams.get("type") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (dateFrom) {
      where.checkinAt = { ...(where.checkinAt || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      where.checkinAt = { ...(where.checkinAt || {}), lt: endDate };
    }

    if (type) {
      where.visitType = type;
    }

    if (departmentId) {
      const deptId = parseInt(departmentId, 10);
      if (!isNaN(deptId)) {
        where.departmentId = deptId;
      }
    }

    const [entries, total] = await Promise.all([
      prisma.visitEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: {
              id: true, firstName: true, lastName: true, name: true, nameEn: true,
              company: true, phone: true, idNumber: true, nationality: true,
            },
          },
          appointment: {
            select: { id: true, bookingCode: true, type: true, purpose: true },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true, employeeId: true },
          },
          department: { select: { id: true, name: true, nameEn: true } },
        },
        orderBy: { checkinAt: "desc" },
      }),
      prisma.visitEntry.count({ where }),
    ]);

    return ok({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/reports/visits error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
