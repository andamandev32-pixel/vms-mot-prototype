import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

/**
 * GET /api/appointments/upcoming?hours=24
 * ดึงนัดหมายที่ใกล้ถึง (สำหรับ cron job ส่งเตือน)
 * Default: ภายใน 24 ชม. ข้างหน้า, status = approved
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    if (user.role === "visitor") {
      return err("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง", 403);
    }

    const { searchParams } = new URL(request.url);
    const hours = Math.max(1, parseInt(searchParams.get("hours") || "24", 10));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // Find approved appointments where dateStart is between now and cutoff
    const todayStr = now.toISOString().split("T")[0];
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const where = {
      status: "approved",
      dateStart: {
        gte: new Date(todayStr),
        lte: new Date(cutoffStr + "T23:59:59.999Z"),
      },
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: { id: true, firstName: true, lastName: true, name: true, company: true, phone: true, email: true },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true, lineUserId: true },
          },
          department: {
            select: { id: true, name: true, nameEn: true },
          },
        },
        orderBy: [{ dateStart: "asc" }, { timeStart: "asc" }],
      }),
      prisma.appointment.count({ where }),
    ]);

    // Check which visitors have LINE linked (for push message targeting)
    const visitorIds = [...new Set(appointments.map((a) => a.visitorId))];
    const linkedVisitors = await prisma.userAccount.findMany({
      where: {
        refId: { in: visitorIds },
        userType: "visitor",
        lineUserId: { not: null },
      },
      select: { refId: true, lineUserId: true },
    });
    const lineLinkedMap = new Map(linkedVisitors.map((v) => [v.refId, v.lineUserId]));

    const enriched = appointments.map((apt) => ({
      ...apt,
      visitorLineUserId: lineLinkedMap.get(apt.visitorId) || null,
    }));

    return ok({
      appointments: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filter: { hours, from: now.toISOString(), to: cutoff.toISOString() },
    });
  } catch (error) {
    console.error("GET /api/appointments/upcoming error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
