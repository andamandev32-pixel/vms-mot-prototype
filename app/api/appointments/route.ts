import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie =====
async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/appointments — list appointments (RBAC scoped)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const date = searchParams.get("date") || "";
    const dateEnd = searchParams.get("dateEnd") || "";
    const search = searchParams.get("search")?.trim() || "";
    const createdBy = searchParams.get("createdBy") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // RBAC scoping
    if (user.role === "visitor") {
      // Visitor sees only their own appointments (match by email)
      const visitor = await prisma.visitor.findFirst({ where: { email: user.email } });
      if (visitor) {
        where.visitorId = visitor.id;
      } else {
        // No matching visitor record — return empty
        return ok({ appointments: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    } else if (user.role === "staff") {
      // Staff sees appointments for their department
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      }
    }
    // admin / supervisor sees all — no extra filter

    // Query param filters
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (date) {
      where.dateStart = { gte: new Date(date) };
    }
    if (dateEnd) {
      where.dateEnd = where.dateEnd || {};
      where.dateStart = {
        ...where.dateStart,
        lte: new Date(dateEnd),
      };
    }
    if (createdBy) {
      where.createdBy = createdBy;
    }
    if (search) {
      where.OR = [
        { bookingCode: { contains: search } },
        { purpose: { contains: search } },
        { visitor: { name: { contains: search } } },
        { visitor: { phone: { contains: search } } },
        { hostStaff: { name: { contains: search } } },
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
          hostStaff: {
            select: {
              id: true, name: true, nameEn: true, position: true,
              departmentId: true, email: true, phone: true,
            },
          },
          department: { select: { id: true, name: true, nameEn: true } },
          visitPurpose: { select: { id: true, name: true, nameEn: true } },
          _count: { select: { visitEntries: true, companions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count({ where }),
    ]);

    return ok({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/appointments — create new appointment
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const {
      visitorId, hostStaffId, visitPurposeId, departmentId,
      type, entryMode, date, dateEnd, timeStart, timeEnd,
      purpose, companions, companionNames, offerWifi,
      equipment, area, building, floor, room, notes,
      notifyOnCheckin, groupId, channel,
    } = body as {
      visitorId: number;
      hostStaffId?: number | null;
      visitPurposeId: number;
      departmentId: number;
      type: string;
      entryMode?: string;
      date: string;
      dateEnd?: string;
      timeStart: string;
      timeEnd: string;
      purpose: string;
      companions?: number;
      companionNames?: Array<{ firstName: string; lastName: string; company?: string; phone?: string }>;
      offerWifi?: boolean;
      equipment?: Array<{ name: string; quantity?: number; serialNumber?: string; description?: string }>;
      area?: string;
      building?: string;
      floor?: string;
      room?: string;
      notes?: string;
      notifyOnCheckin?: boolean;
      groupId?: number | null;
      channel?: string; // "web" | "line" | "kiosk" | "counter"
    };

    // Validate required fields (hostStaffId is now conditional)
    if (!visitorId || !visitPurposeId || !departmentId || !type || !date || !timeStart || !timeEnd || !purpose?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอกข้อมูลให้ครบถ้วน (visitorId, visitPurposeId, departmentId, type, date, timeStart, timeEnd, purpose)");
    }

    // ═══════ Rule Enforcement: visit_purpose_department_rules ═══════
    const visitPurpose = await prisma.visitPurpose.findUnique({ where: { id: visitPurposeId } });
    if (!visitPurpose || !visitPurpose.isActive) {
      return err("PURPOSE_NOT_FOUND", "ไม่พบวัตถุประสงค์ หรือถูกปิดใช้งาน", 404);
    }

    const rule = await prisma.visitPurposeDepartmentRule.findFirst({
      where: { visitPurposeId, departmentId, isActive: true },
    });
    if (!rule) {
      return err("RULE_NOT_FOUND", "ไม่อนุญาตสำหรับวัตถุประสงค์และแผนกนี้", 400);
    }

    // Channel validation
    const requestChannel = channel || (user.role === "visitor" ? "line" : "web");
    if (requestChannel === "line" && !rule.acceptFromLine) {
      return err("CHANNEL_BLOCKED", "ไม่รับการนัดหมายจาก LINE สำหรับวัตถุประสงค์และแผนกนี้", 403);
    }
    if (requestChannel === "web" && !rule.acceptFromWeb) {
      return err("CHANNEL_BLOCKED", "ไม่รับการนัดหมายจาก Web สำหรับวัตถุประสงค์และแผนกนี้", 403);
    }
    if (requestChannel === "kiosk" && !rule.acceptFromKiosk) {
      return err("CHANNEL_BLOCKED", "ไม่รับการนัดหมายจาก Kiosk สำหรับวัตถุประสงค์และแผนกนี้", 403);
    }
    if (requestChannel === "counter" && !rule.acceptFromCounter) {
      return err("CHANNEL_BLOCKED", "ไม่รับการนัดหมายจาก Counter สำหรับวัตถุประสงค์และแผนกนี้", 403);
    }

    // requirePersonName enforcement
    if (rule.requirePersonName && !hostStaffId) {
      return err("HOST_REQUIRED", "กรุณาระบุบุคคลที่ต้องการพบ (กฎของวัตถุประสงค์และแผนกนี้กำหนดให้ต้องระบุ)", 400);
    }

    // Period mode validation
    const resolvedEntryMode = entryMode || "single";
    if (resolvedEntryMode === "period") {
      if (!visitPurpose.allowedEntryModes.includes("period")) {
        return err("PERIOD_NOT_ALLOWED", "วัตถุประสงค์นี้ไม่อนุญาตให้ใช้โหมด period", 400);
      }
      if (!dateEnd) {
        return err("DATE_END_REQUIRED", "โหมด period ต้องระบุ dateEnd", 400);
      }
      if (new Date(dateEnd) <= new Date(date)) {
        return err("DATE_END_INVALID", "dateEnd ต้องมากกว่า dateStart", 400);
      }
    }

    // Auto-approve logic
    const autoApprove = !rule.requireApproval;
    const initialStatus = autoApprove ? "approved" : "pending";

    // ═══════ Validate entities ═══════
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) {
      return err("VISITOR_NOT_FOUND", "ไม่พบข้อมูลผู้เยี่ยมชม", 404);
    }
    if (visitor.isBlocked) {
      return err("VISITOR_BLOCKED", "ผู้เยี่ยมชมถูกบล็อก ไม่สามารถนัดหมายได้");
    }

    if (hostStaffId) {
      const host = await prisma.staff.findUnique({ where: { id: hostStaffId } });
      if (!host) {
        return err("HOST_NOT_FOUND", "ไม่พบข้อมูลพนักงานผู้รับ", 404);
      }
    }

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return err("DEPARTMENT_NOT_FOUND", "ไม่พบแผนกที่ระบุ", 404);
    }

    // Generate booking code: eVMS-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const lastAppt = await prisma.appointment.findFirst({
      where: { bookingCode: { startsWith: `eVMS-${today}` } },
      orderBy: { bookingCode: "desc" },
    });
    const seq = lastAppt ? parseInt(lastAppt.bookingCode.slice(-4)) + 1 : 1;
    const bookingCode = `eVMS-${today}-${String(seq).padStart(4, "0")}`;

    // Determine createdBy
    const createdBy = user.role === "visitor" ? "visitor" : "staff";

    // Parse time fields — Prisma @db.Time expects a Date with time portion
    const parseDateOnly = (d: string) => new Date(d + "T00:00:00.000Z");
    const parseTime = (t: string) => new Date(`1970-01-01T${t}:00.000Z`);

    const appointment = await prisma.appointment.create({
      data: {
        bookingCode,
        visitorId,
        hostStaffId: hostStaffId || null,
        visitPurposeId,
        departmentId,
        type,
        status: initialStatus,
        entryMode: resolvedEntryMode,
        dateStart: parseDateOnly(date),
        dateEnd: resolvedEntryMode === "period" && dateEnd ? parseDateOnly(dateEnd) : null,
        timeStart: parseTime(timeStart),
        timeEnd: parseTime(timeEnd),
        purpose: purpose.trim(),
        companionsCount: companions || companionNames?.length || 0,
        createdBy,
        createdByStaffId: createdBy === "staff" ? user.id : null,
        offerWifi: offerWifi || false,
        notifyOnCheckin: notifyOnCheckin ?? true,
        groupId: groupId || null,
        area: area || null,
        building: building || null,
        floor: floor || null,
        room: room || null,
        notes: notes || null,
        approvedBy: autoApprove && createdBy === "staff" ? user.id : null,
        approvedAt: autoApprove ? new Date() : null,
        // Create companions if provided
        companions: companionNames && companionNames.length > 0
          ? {
              create: companionNames.map((c) => ({
                firstName: c.firstName,
                lastName: c.lastName,
                company: c.company || null,
                phone: c.phone || null,
              })),
            }
          : undefined,
        // Create equipment if provided
        equipment: equipment && equipment.length > 0
          ? {
              create: equipment.map((e) => ({
                name: e.name,
                quantity: e.quantity || 1,
                serialNumber: e.serialNumber || null,
                description: e.description || null,
              })),
            }
          : undefined,
        // Create initial status log
        statusLogs: {
          create: {
            fromStatus: null,
            toStatus: initialStatus,
            changedBy: createdBy === "staff" ? user.id : null,
            reason: autoApprove
              ? "สร้างการนัดหมาย — อนุมัติอัตโนมัติ (ไม่ต้องอนุมัติ)"
              : "สร้างการนัดหมายใหม่ — รอการอนุมัติ",
          },
        },
      },
      include: {
        visitor: {
          select: {
            id: true, firstName: true, lastName: true, name: true,
            company: true, phone: true, email: true,
          },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        visitPurpose: { select: { id: true, name: true, nameEn: true } },
        companions: true,
        equipment: true,
        statusLogs: true,
      },
    });

    return ok({
      appointment,
      autoApproved: autoApprove,
      rule: {
        requirePersonName: rule.requirePersonName,
        requireApproval: rule.requireApproval,
        offerWifi: rule.offerWifi,
        approverGroupId: rule.approverGroupId,
      },
    });
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
