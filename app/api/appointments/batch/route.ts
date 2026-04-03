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
// POST /api/appointments/batch — create batch appointments with group
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role === "visitor") {
      return err("FORBIDDEN", "ไม่อนุญาตสำหรับ visitor", 403);
    }

    const body = await request.json();
    const { group, visitors } = body as {
      group: {
        name: string;
        nameEn?: string;
        description?: string;
        visitPurposeId: number;
        departmentId: number;
        hostStaffId?: number | null;
        entryMode?: string;
        dateStart: string;
        dateEnd?: string;
        timeStart: string;
        timeEnd: string;
        room?: string;
        building?: string;
        floor?: string;
        notifyOnCheckin?: boolean;
        daySchedules?: Array<{ date: string; timeStart: string; timeEnd: string; notes?: string }>;
      };
      visitors: Array<{
        firstName: string;
        lastName: string;
        company?: string;
        phone?: string;
        email?: string;
        idNumber?: string;
        idType?: string;
      }>;
    };

    // Validate
    if (!group?.name || !group.visitPurposeId || !group.departmentId || !group.dateStart || !group.timeStart || !group.timeEnd) {
      return err("MISSING_FIELDS", "group: name, visitPurposeId, departmentId, dateStart, timeStart, timeEnd ต้องระบุ");
    }
    if (!visitors || visitors.length === 0) {
      return err("NO_VISITORS", "ต้องระบุ visitors อย่างน้อย 1 คน");
    }

    // ═══════ Rule enforcement ═══════
    const visitPurpose = await prisma.visitPurpose.findUnique({ where: { id: group.visitPurposeId } });
    if (!visitPurpose || !visitPurpose.isActive) {
      return err("PURPOSE_NOT_FOUND", "ไม่พบวัตถุประสงค์ หรือถูกปิดใช้งาน", 404);
    }

    const rule = await prisma.visitPurposeDepartmentRule.findFirst({
      where: { visitPurposeId: group.visitPurposeId, departmentId: group.departmentId, isActive: true },
    });
    if (!rule) {
      return err("RULE_NOT_FOUND", "ไม่อนุญาตสำหรับวัตถุประสงค์และแผนกนี้", 400);
    }
    if (rule.requirePersonName && !group.hostStaffId) {
      return err("HOST_REQUIRED", "กรุณาระบุบุคคลที่ต้องการพบ", 400);
    }

    // Period validation
    const resolvedEntryMode = group.entryMode || "single";
    if (resolvedEntryMode === "period") {
      if (!visitPurpose.allowedEntryModes.includes("period")) {
        return err("PERIOD_NOT_ALLOWED", "วัตถุประสงค์นี้ไม่อนุญาตให้ใช้โหมด period", 400);
      }
      if (!group.dateEnd) {
        return err("DATE_END_REQUIRED", "โหมด period ต้องระบุ dateEnd", 400);
      }
      if (new Date(group.dateEnd) <= new Date(group.dateStart)) {
        return err("DATE_END_INVALID", "dateEnd ต้องมากกว่า dateStart", 400);
      }
    }

    const autoApprove = !rule.requireApproval;
    const initialStatus = autoApprove ? "approved" : "pending";

    const parseDateOnly = (d: string) => new Date(d + "T00:00:00.000Z");
    const parseTime = (t: string) => new Date(`1970-01-01T${t}:00.000Z`);

    // ═══════ Create Group + DaySchedules + Visitors + Appointments in transaction ═══════
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create AppointmentGroup
      const appointmentGroup = await tx.appointmentGroup.create({
        data: {
          name: group.name,
          nameEn: group.nameEn || null,
          description: group.description || null,
          visitPurposeId: group.visitPurposeId,
          departmentId: group.departmentId,
          hostStaffId: group.hostStaffId || null,
          entryMode: resolvedEntryMode,
          dateStart: parseDateOnly(group.dateStart),
          dateEnd: resolvedEntryMode === "period" && group.dateEnd ? parseDateOnly(group.dateEnd) : null,
          timeStart: parseTime(group.timeStart),
          timeEnd: parseTime(group.timeEnd),
          room: group.room || null,
          building: group.building || null,
          floor: group.floor || null,
          totalExpected: visitors.length,
          notifyOnCheckin: group.notifyOnCheckin ?? false,
          createdByStaffId: user.id,
        },
      });

      // 2. Create DaySchedules if provided
      if (group.daySchedules && group.daySchedules.length > 0) {
        await tx.appointmentGroupDaySchedule.createMany({
          data: group.daySchedules.map((ds) => ({
            groupId: appointmentGroup.id,
            date: parseDateOnly(ds.date),
            timeStart: parseTime(ds.timeStart),
            timeEnd: parseTime(ds.timeEnd),
            notes: ds.notes || null,
          })),
        });
      }

      // 3. Upsert visitors + create appointments
      const createdAppointments = [];
      let skipped = 0;

      for (const v of visitors) {
        if (!v.firstName?.trim() && !v.lastName?.trim()) {
          skipped++;
          continue;
        }

        // Upsert visitor by phone+name or create new
        let visitor;
        if (v.phone) {
          visitor = await tx.visitor.findFirst({
            where: { phone: v.phone, firstName: v.firstName, lastName: v.lastName },
          });
        }
        if (!visitor) {
          visitor = await tx.visitor.create({
            data: {
              firstName: v.firstName,
              lastName: v.lastName,
              firstNameEn: null,
              lastNameEn: null,
              name: `${v.firstName} ${v.lastName}`,
              idNumber: v.idNumber || `B${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.slice(0, 20),
              idType: v.idType || "thai-id",
              company: v.company || null,
              phone: v.phone || "",
              email: v.email || null,
            },
          });
        }

        // Generate booking code
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const lastAppt = await tx.appointment.findFirst({
          where: { bookingCode: { startsWith: `eVMS-${today}` } },
          orderBy: { bookingCode: "desc" },
        });
        const seq = lastAppt ? parseInt(lastAppt.bookingCode.slice(-4)) + 1 : 1;
        const bookingCode = `eVMS-${today}-${String(seq).padStart(4, "0")}`;

        const appointment = await tx.appointment.create({
          data: {
            bookingCode,
            visitorId: visitor.id,
            hostStaffId: group.hostStaffId || null,
            visitPurposeId: group.visitPurposeId,
            departmentId: group.departmentId,
            type: visitPurpose.nameEn?.toLowerCase().includes("meeting") ? "meeting"
              : visitPurpose.nameEn?.toLowerCase().includes("contractor") ? "contractor"
              : "official",
            status: initialStatus,
            entryMode: resolvedEntryMode,
            dateStart: parseDateOnly(group.dateStart),
            dateEnd: resolvedEntryMode === "period" && group.dateEnd ? parseDateOnly(group.dateEnd) : null,
            timeStart: parseTime(group.timeStart),
            timeEnd: parseTime(group.timeEnd),
            purpose: group.name,
            companionsCount: 0,
            createdBy: "staff",
            createdByStaffId: user.id,
            notifyOnCheckin: group.notifyOnCheckin ?? false,
            groupId: appointmentGroup.id,
            building: group.building || null,
            floor: group.floor || null,
            room: group.room || null,
            approvedBy: autoApprove ? user.id : null,
            approvedAt: autoApprove ? new Date() : null,
            statusLogs: {
              create: {
                fromStatus: null,
                toStatus: initialStatus,
                changedBy: user.id,
                reason: autoApprove
                  ? `สร้างจาก batch "${group.name}" — อนุมัติอัตโนมัติ`
                  : `สร้างจาก batch "${group.name}" — รอการอนุมัติ`,
              },
            },
          },
          include: {
            visitor: { select: { id: true, name: true, company: true, phone: true } },
          },
        });

        createdAppointments.push(appointment);
      }

      return { group: appointmentGroup, appointments: createdAppointments, skipped };
    });

    return ok({
      group: result.group,
      created: result.appointments.length,
      skipped: result.skipped,
      autoApproved: autoApprove,
      appointments: result.appointments,
    });
  } catch (error) {
    console.error("POST /api/appointments/batch error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
