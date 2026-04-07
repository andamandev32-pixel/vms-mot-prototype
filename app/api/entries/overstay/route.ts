import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthUser, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/entries/overstay
 * ดึงรายการ visitor ที่ check-in แล้วเกินเวลานัด (สำหรับ cron job + officer alert)
 * เงื่อนไข: status = checked-in && appointment.timeEnd < NOW
 */
export async function GET(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (!isAuthUser(result)) return result;
    const user = result;

    if (user.role === "visitor") {
      return apiError("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง", 403);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    // Find entries that are still checked-in and have an appointment with timeEnd passed
    const now = new Date();

    // Get all checked-in entries with their appointments
    const where = {
      status: "checked-in",
      appointment: {
        isNot: null,
      },
    };

    const [entries, total] = await Promise.all([
      prisma.visitEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: { id: true, firstName: true, lastName: true, name: true, company: true, phone: true },
          },
          appointment: {
            select: {
              id: true,
              bookingCode: true,
              dateStart: true,
              timeStart: true,
              timeEnd: true,
              purpose: true,
            },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true, position: true, lineUserId: true },
          },
          department: {
            select: { id: true, name: true, nameEn: true },
          },
        },
        orderBy: { checkinAt: "asc" },
      }),
      prisma.visitEntry.count({ where }),
    ]);

    // Filter entries where timeEnd has passed
    // timeEnd is stored as Time — compare with current time
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const overstayEntries = entries
      .filter((entry) => {
        if (!entry.appointment?.timeEnd) return false;
        const timeEnd = new Date(entry.appointment.timeEnd);
        const endHour = timeEnd.getUTCHours();
        const endMinute = timeEnd.getUTCMinutes();
        const endTimeMinutes = endHour * 60 + endMinute;

        // Check if dateStart is today or earlier
        const dateStart = new Date(entry.appointment.dateStart);
        const today = new Date(now.toISOString().split("T")[0]);
        const isToday = dateStart <= today;

        return isToday && currentTimeMinutes > endTimeMinutes;
      })
      .map((entry) => {
        const timeEnd = new Date(entry.appointment!.timeEnd);
        const endHour = timeEnd.getUTCHours();
        const endMinute = timeEnd.getUTCMinutes();
        const endTimeMinutes = endHour * 60 + endMinute;
        const overstayMinutes = currentTimeMinutes - endTimeMinutes;

        return {
          entryId: entry.id,
          entryCode: entry.entryCode,
          visitorName: entry.visitor?.name || `${entry.visitor?.firstName} ${entry.visitor?.lastName}`,
          visitorCompany: entry.visitor?.company || null,
          visitorPhone: entry.visitor?.phone || null,
          hostName: entry.hostStaff?.name || null,
          hostLineUserId: entry.hostStaff?.lineUserId || null,
          departmentName: entry.department?.name || null,
          checkinAt: entry.checkinAt,
          expectedOut: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`,
          overstayMinutes,
          location: [entry.building, entry.floor, entry.room].filter(Boolean).join(" "),
          appointmentCode: entry.appointment?.bookingCode || null,
        };
      });

    return apiSuccess({
      entries: overstayEntries,
      total: overstayEntries.length,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/entries/overstay error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
