import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";
import { sendCheckinNotification } from "@/lib/notification-service";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/entries — list visit entries with filters
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const date = searchParams.get("date") || "";
    const appointmentId = searchParams.get("appointmentId") || "";
    const visitorId = searchParams.get("visitorId") || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // RBAC scoping — staff sees only their department's entries
    if (user.role === "visitor") {
      return err("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง", 403);
    } else if (user.role === "staff" && user.departmentId) {
      where.departmentId = user.departmentId;
    }
    // admin / supervisor / security — sees all entries

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date + "T00:00:00.000Z");
      const endOfDay = new Date(date + "T23:59:59.999Z");
      where.checkinAt = { gte: startOfDay, lte: endOfDay };
    }

    if (appointmentId) {
      const apptId = parseInt(appointmentId, 10);
      if (!isNaN(apptId)) {
        where.appointmentId = apptId;
      }
    }

    if (visitorId) {
      const vId = parseInt(visitorId, 10);
      if (!isNaN(vId)) {
        where.visitorId = vId;
      }
    }

    if (search) {
      where.OR = [
        { entryCode: { contains: search } },
        { visitor: { name: { contains: search } } },
        { visitor: { phone: { contains: search } } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.visitEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: {
              id: true, firstName: true, lastName: true, name: true,
              company: true, phone: true, email: true, photo: true,
            },
          },
          appointment: {
            select: {
              id: true, bookingCode: true, type: true, status: true,
              purpose: true, dateStart: true, timeStart: true, timeEnd: true,
            },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
          },
          department: { select: { id: true, name: true, nameEn: true } },
          checkoutByStaff: { select: { id: true, name: true, nameEn: true } },
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
    console.error("GET /api/entries error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/entries — create check-in entry
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const {
      appointmentId, visitorId, checkinChannel, area, building, floor,
      room, purpose, visitType, hostStaffId, departmentId,
      companions, idMethod, notes,
    } = body as {
      appointmentId?: number | null;
      visitorId: number;
      checkinChannel: string;
      area: string;
      building: string;
      floor: string;
      room?: string;
      purpose?: string;
      visitType?: string;
      hostStaffId?: number;
      departmentId?: number;
      companions?: number;
      idMethod?: string;
      notes?: string;
    };

    // Validate required fields
    if (!visitorId || !checkinChannel?.trim() || !area?.trim() || !building?.trim() || !floor?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอกข้อมูลให้ครบถ้วน (visitorId, checkinChannel, area, building, floor)");
    }

    // Verify visitor exists
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) {
      return err("VISITOR_NOT_FOUND", "ไม่พบข้อมูลผู้เยี่ยมชม", 404);
    }
    if (visitor.isBlocked) {
      return err("VISITOR_BLOCKED", "ผู้เยี่ยมชมถูกบล็อก ไม่สามารถเช็คอินได้");
    }

    // If linked to appointment, verify it + entry mode validation
    if (appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appt) {
        return err("APPOINTMENT_NOT_FOUND", "ไม่พบการนัดหมาย", 404);
      }
      if (appt.status !== "approved" && appt.status !== "pending") {
        return err("INVALID_APPOINTMENT_STATUS", `ไม่สามารถเช็คอินกับการนัดหมายที่มีสถานะ "${appt.status}" ได้`);
      }

      // ═══════ Entry Mode Validation ═══════
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (appt.entryMode === "single") {
        // Single mode: only 1 entry ever allowed
        const existingEntry = await prisma.visitEntry.findFirst({
          where: { appointmentId },
        });
        if (existingEntry) {
          return err("SINGLE_ENTRY_USED", "รายการนี้ใช้สิทธิ์ check-in แล้ว (single mode — อนุญาต 1 ครั้ง)", 409);
        }
      } else if (appt.entryMode === "period") {
        // Period mode: validate date range + no duplicate same-day
        const apptDateStart = new Date(appt.dateStart);
        apptDateStart.setHours(0, 0, 0, 0);

        if (todayStart < apptDateStart) {
          return err("BEFORE_DATE_RANGE", "ยังไม่ถึงวันนัดหมาย (เริ่ม " + appt.dateStart.toISOString().slice(0, 10) + ")", 400);
        }

        if (appt.dateEnd) {
          const apptDateEnd = new Date(appt.dateEnd);
          apptDateEnd.setHours(23, 59, 59, 999);
          if (todayStart > apptDateEnd) {
            return err("APPOINTMENT_EXPIRED", "นัดหมายหมดอายุแล้ว (สิ้นสุด " + appt.dateEnd.toISOString().slice(0, 10) + ")", 410);
          }
        }

        // Check for duplicate check-in on the same day
        const todayEntry = await prisma.visitEntry.findFirst({
          where: {
            appointmentId,
            checkinAt: { gte: todayStart, lte: todayEnd },
            status: "checked-in",
          },
        });
        if (todayEntry) {
          return err("ALREADY_CHECKED_IN_TODAY", "วันนี้ check-in แล้ว กรุณา check-out ก่อน", 409);
        }
      }
    }

    // For walk-in, purpose is required
    if (!appointmentId && !purpose?.trim()) {
      return err("MISSING_FIELDS", "กรุณาระบุวัตถุประสงค์การเยี่ยมชม (walk-in)");
    }

    // Generate entry code: eVMS-ENTRY-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const lastEntry = await prisma.visitEntry.findFirst({
      where: { entryCode: { startsWith: `eVMS-ENTRY-${today}` } },
      orderBy: { entryCode: "desc" },
    });
    const seq = lastEntry ? parseInt(lastEntry.entryCode.slice(-4)) + 1 : 1;
    const entryCode = `eVMS-ENTRY-${today}-${String(seq).padStart(4, "0")}`;

    const now = new Date();

    const entry = await prisma.visitEntry.create({
      data: {
        entryCode,
        appointmentId: appointmentId || null,
        visitorId,
        status: "checked-in",
        purpose: purpose?.trim() || null,
        visitType: visitType || null,
        hostStaffId: hostStaffId || null,
        departmentId: departmentId || null,
        checkinAt: now,
        checkinChannel: checkinChannel.trim(),
        area: area.trim(),
        building: building.trim(),
        floor: floor.trim(),
        room: room?.trim() || null,
        idMethod: idMethod || null,
        companionsCount: companions || 0,
        notes: notes?.trim() || null,
      },
      include: {
        visitor: {
          select: {
            id: true, firstName: true, lastName: true, name: true,
            company: true, phone: true, email: true, photo: true,
          },
        },
        appointment: {
          select: { id: true, bookingCode: true, type: true, status: true, purpose: true },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
        },
        department: { select: { id: true, name: true, nameEn: true } },
      },
    });

    // ═══════ Send check-in notification (async, non-blocking) ═══════
    if (appointmentId && entry.appointment) {
      sendCheckinNotification({
        appointmentId,
        visitorName: entry.visitor.name,
        checkinTime: now,
        entryCode: entry.entryCode,
        location: `${entry.building} ${entry.floor}`,
      }).catch((e) => console.error("[Entries] notification error:", e));
    }

    return ok({ entry });
  } catch (error) {
    console.error("POST /api/entries error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
