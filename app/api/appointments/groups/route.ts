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
// GET /api/appointments/groups — list appointment groups
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role === "visitor") return err("FORBIDDEN", "ไม่อนุญาตสำหรับ visitor", 403);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const createdBy = searchParams.get("createdBy") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;
    if (createdBy === "me") where.createdByStaffId = user.id;

    // RBAC: staff sees own groups, supervisor/admin sees all
    if (user.role === "staff" && createdBy !== "me") {
      where.createdByStaffId = user.id;
    }

    const [groups, total] = await Promise.all([
      prisma.appointmentGroup.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitPurpose: { select: { id: true, name: true, nameEn: true, icon: true } },
          department: { select: { id: true, name: true, nameEn: true } },
          hostStaff: { select: { id: true, name: true, nameEn: true } },
          createdByStaff: { select: { id: true, name: true, nameEn: true } },
          _count: { select: { appointments: true, daySchedules: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointmentGroup.count({ where }),
    ]);

    // Compute arrival stats for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (g) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const arrivedToday = await prisma.visitEntry.count({
          where: {
            appointment: { groupId: g.id },
            checkinAt: { gte: todayStart, lte: todayEnd },
          },
        });

        return {
          ...g,
          stats: {
            totalExpected: g.totalExpected,
            arrivedToday,
            notArrivedToday: Math.max(0, g.totalExpected - arrivedToday),
          },
        };
      })
    );

    return ok({
      groups: groupsWithStats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/appointments/groups error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
