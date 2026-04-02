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
// GET /api/appointments/groups/:id — group detail with per-day arrival stats
// ─────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role === "visitor") return err("FORBIDDEN", "ไม่อนุญาต", 403);

    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get("date") || null;

    const group = await prisma.appointmentGroup.findUnique({
      where: { id: groupId },
      include: {
        visitPurpose: { select: { id: true, name: true, nameEn: true, icon: true } },
        department: { select: { id: true, name: true, nameEn: true } },
        hostStaff: { select: { id: true, name: true, nameEn: true } },
        createdByStaff: { select: { id: true, name: true, nameEn: true } },
        daySchedules: { orderBy: { date: "asc" } },
      },
    });
    if (!group) return err("NOT_FOUND", "ไม่พบกลุ่มนัดหมาย", 404);

    // Compute available dates for period groups
    const availableDates: string[] = [];
    if (group.entryMode === "period" && group.dateEnd) {
      const start = new Date(group.dateStart);
      const end = new Date(group.dateEnd);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        availableDates.push(d.toISOString().slice(0, 10));
      }
    } else {
      availableDates.push(new Date(group.dateStart).toISOString().slice(0, 10));
    }

    // Determine the date to show (default: today or first available date)
    const today = new Date().toISOString().slice(0, 10);
    const selectedDate = dateFilter && availableDates.includes(dateFilter)
      ? dateFilter
      : availableDates.includes(today)
        ? today
        : availableDates[0];

    const selectedDateStart = new Date(selectedDate + "T00:00:00.000Z");
    const selectedDateEnd = new Date(selectedDate + "T23:59:59.999Z");

    // Get all appointments in this group with their entries
    const appointments = await prisma.appointment.findMany({
      where: { groupId },
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, name: true, company: true, phone: true },
        },
        visitEntries: {
          select: {
            id: true, entryCode: true, status: true, checkinAt: true, checkoutAt: true,
          },
          orderBy: { checkinAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Process per-appointment stats
    let arrivedToday = 0;
    let checkedOutToday = 0;
    const allVisitorIds = new Set<number>();
    const arrivedVisitorIds = new Set<number>();

    const appointmentsWithStats = appointments.map((appt) => {
      allVisitorIds.add(appt.visitorId);

      // Today's entry
      const todayEntry = appt.visitEntries.find(
        (e) => e.checkinAt >= selectedDateStart && e.checkinAt <= selectedDateEnd
      );
      if (todayEntry) {
        arrivedToday++;
        arrivedVisitorIds.add(appt.visitorId);
        if (todayEntry.checkoutAt) checkedOutToday++;
      }

      // All entries mapped to dates
      const allEntries = availableDates.map((d) => {
        const dStart = new Date(d + "T00:00:00.000Z");
        const dEnd = new Date(d + "T23:59:59.999Z");
        const entry = appt.visitEntries.find(
          (e) => e.checkinAt >= dStart && e.checkinAt <= dEnd
        );
        return {
          date: d,
          entryId: entry?.id ?? null,
          status: entry?.status ?? null,
          checkinAt: entry?.checkinAt?.toISOString() ?? null,
          checkoutAt: entry?.checkoutAt?.toISOString() ?? null,
        };
      });

      // Track if visitor came at least 1 day
      if (appt.visitEntries.length > 0) {
        arrivedVisitorIds.add(appt.visitorId);
      }

      return {
        id: appt.id,
        bookingCode: appt.bookingCode,
        status: appt.status,
        notifyOnCheckin: appt.notifyOnCheckin,
        visitor: appt.visitor,
        todayEntry: todayEntry
          ? {
              entryId: todayEntry.id,
              entryCode: todayEntry.entryCode,
              status: todayEntry.status,
              checkinAt: todayEntry.checkinAt.toISOString(),
              checkoutAt: todayEntry.checkoutAt?.toISOString() ?? null,
            }
          : null,
        allEntries,
      };
    });

    // Get day schedule for selected date
    const daySchedule = group.daySchedules.find(
      (ds) => new Date(ds.date).toISOString().slice(0, 10) === selectedDate
    );

    return ok({
      group: {
        ...group,
        daySchedules: group.daySchedules.map((ds) => ({
          ...ds,
          date: new Date(ds.date).toISOString().slice(0, 10),
        })),
      },
      dateFilter: selectedDate,
      availableDates,
      todaySchedule: daySchedule
        ? { timeStart: daySchedule.timeStart, timeEnd: daySchedule.timeEnd, notes: daySchedule.notes }
        : { timeStart: group.timeStart, timeEnd: group.timeEnd, notes: null },
      stats: {
        total: appointments.length,
        arrivedToday,
        notArrivedToday: Math.max(0, appointments.length - arrivedToday),
        checkedOutToday,
        arrivedAllDays: arrivedVisitorIds.size,
        neverArrived: allVisitorIds.size - arrivedVisitorIds.size,
      },
      appointments: appointmentsWithStats,
    });
  } catch (error) {
    console.error("GET /api/appointments/groups/:id error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}

// ─────────────────────────────────────────────────────
// PATCH /api/appointments/groups/:id — update group (notify toggle, status)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role === "visitor") return err("FORBIDDEN", "ไม่อนุญาต", 403);

    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const body = await request.json();
    const { notifyOnCheckin, status } = body as {
      notifyOnCheckin?: boolean;
      status?: string;
    };

    const group = await prisma.appointmentGroup.findUnique({ where: { id: groupId } });
    if (!group) return err("NOT_FOUND", "ไม่พบกลุ่ม", 404);

    // Only creator or admin can update
    if (group.createdByStaffId !== user.id && user.role !== "admin") {
      return err("FORBIDDEN", "เฉพาะผู้สร้างหรือ admin เท่านั้น", 403);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (notifyOnCheckin !== undefined) updateData.notifyOnCheckin = notifyOnCheckin;
    if (status) updateData.status = status;

    // Update group
    const updated = await prisma.appointmentGroup.update({
      where: { id: groupId },
      data: updateData,
    });

    // Cascade notifyOnCheckin to all appointments in group
    if (notifyOnCheckin !== undefined) {
      await prisma.appointment.updateMany({
        where: { groupId },
        data: { notifyOnCheckin },
      });
    }

    // Cascade cancel to all appointments
    if (status === "cancelled") {
      await prisma.appointment.updateMany({
        where: { groupId, status: { in: ["pending", "approved"] } },
        data: { status: "cancelled" },
      });
    }

    return ok({ group: updated });
  } catch (error) {
    console.error("PATCH /api/appointments/groups/:id error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
