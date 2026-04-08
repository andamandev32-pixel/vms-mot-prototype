import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/dashboard — Daily stats
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's entries by status
    const [total, walkin, appointment, checkedOut, currentlyInside] =
      await Promise.all([
        prisma.visitEntry.count({
          where: { checkinAt: { gte: today, lt: tomorrow } },
        }),
        prisma.visitEntry.count({
          where: {
            checkinAt: { gte: today, lt: tomorrow },
            visitType: "walkin",
          },
        }),
        prisma.visitEntry.count({
          where: {
            checkinAt: { gte: today, lt: tomorrow },
            visitType: "appointment",
          },
        }),
        prisma.visitEntry.count({
          where: {
            checkinAt: { gte: today, lt: tomorrow },
            status: "checked-out",
          },
        }),
        prisma.visitEntry.count({
          where: {
            checkinAt: { gte: today, lt: tomorrow },
            status: "checked-in",
          },
        }),
      ]);

    // Recent visitors (last 10)
    const recentVisitors = await prisma.visitEntry.findMany({
      where: { checkinAt: { gte: today, lt: tomorrow } },
      include: {
        visitor: true,
        department: true,
      },
      orderBy: { checkinAt: "desc" },
      take: 10,
    });

    // Upcoming appointments (next 5)
    const now = new Date();
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        dateStart: { lte: tomorrow },
        dateEnd: { gte: today },
        status: { in: ["approved", "confirmed"] },
      },
      include: {
        visitor: true,
        hostStaff: true,
        department: true,
      },
      orderBy: { timeStart: "asc" },
      take: 5,
    });

    return ok({
      stats: {
        total,
        walkin,
        appointment,
        checkedOut,
        currentlyInside,
      },
      recentVisitors,
      upcomingAppointments,
    });
  } catch (error) {
    console.error("GET /api/counter/dashboard error:", error);
    return err("Internal server error", 500);
  }
}
