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
// GET /api/reports/audit-log — ประวัติการเปลี่ยนสถานะการนัดหมาย (admin)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (appointmentId) {
      const apptId = parseInt(appointmentId, 10);
      if (!isNaN(apptId)) {
        where.appointmentId = apptId;
      }
    }

    if (dateFrom) {
      where.createdAt = { ...(where.createdAt || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = { ...(where.createdAt || {}), lt: endDate };
    }

    const [logs, total] = await Promise.all([
      prisma.appointmentStatusLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          appointment: {
            select: { id: true, bookingCode: true },
          },
          changedByStaff: {
            select: { id: true, name: true, nameEn: true, employeeId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointmentStatusLog.count({ where }),
    ]);

    return ok({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/reports/audit-log error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
