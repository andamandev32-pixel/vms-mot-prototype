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
// GET /api/dashboard/kpis — ข้อมูล KPI รวม
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      totalVisitorsToday,
      pendingApprovals,
      currentlyInBuilding,
      overstayCount,
      checkedOutToday,
      walkInToday,
    ] = await Promise.all([
      // Total visitors today (entries with checkinAt today)
      prisma.visitEntry.count({
        where: {
          checkinAt: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      // Pending approvals
      prisma.appointment.count({
        where: { status: "pending" },
      }),
      // Currently in building (checked-in, not yet checked out)
      prisma.visitEntry.count({
        where: { status: "checked-in" },
      }),
      // Overstay count
      prisma.visitEntry.count({
        where: { status: "overstay" },
      }),
      // Checked out today
      prisma.visitEntry.count({
        where: {
          checkoutAt: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      // Walk-in today (no appointmentId)
      prisma.visitEntry.count({
        where: {
          checkinAt: { gte: startOfToday, lt: startOfTomorrow },
          appointmentId: null,
        },
      }),
    ]);

    return ok({
      totalVisitorsToday,
      pendingApprovals,
      currentlyInBuilding,
      overstayCount,
      checkedOutToday,
      walkInToday,
    });
  } catch (error) {
    console.error("GET /api/dashboard/kpis error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
