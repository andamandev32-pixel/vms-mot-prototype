import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/appointment/match-by-identity
// Auto-match walk-in visitor against today's appointments by ID number.
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const {
      idNumber,
      passportNumber,
      firstName,
      lastName,
      departmentId,
      visitPurposeId,
    } = body as {
      idNumber?: string;
      passportNumber?: string;
      firstName?: string;
      lastName?: string;
      departmentId?: number;
      visitPurposeId?: number;
    };

    const idTrim = idNumber?.trim();
    const passTrim = passportNumber?.trim();
    const fnTrim = firstName?.trim();
    const lnTrim = lastName?.trim();
    const hasName = !!(fnTrim && lnTrim);

    if (!idTrim && !passTrim && !hasName) {
      return err(
        "MISSING_FIELDS",
        "กรุณาระบุอย่างน้อย 1 อย่าง: idNumber, passportNumber, หรือ firstName + lastName"
      );
    }

    const visitorOr: Record<string, unknown>[] = [];
    if (idTrim) visitorOr.push({ idNumber: idTrim });
    if (passTrim) visitorOr.push({ idNumber: passTrim });
    if (hasName) {
      visitorOr.push({ firstName: fnTrim, lastName: lnTrim });
      visitorOr.push({ firstNameEn: fnTrim, lastNameEn: lnTrim });
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        visitor: { OR: visitorOr },
        dateStart: { gte: dayStart, lt: dayEnd },
        status: { in: ["approved", "confirmed"] },
      },
      include: {
        visitor: { select: { id: true, name: true, company: true } },
        hostStaff: { select: { id: true, name: true, position: true } },
        department: { select: { id: true, name: true } },
        visitPurpose: { select: { id: true, name: true, icon: true } },
      },
      orderBy: { timeStart: "asc" },
    });

    if (appointments.length === 0) {
      return ok({ hasAppointment: false, suggestion: "proceed-walkin" });
    }

    const formatTime = (t: Date | null | undefined) =>
      t ? t.toISOString().slice(11, 16) : "—";

    const mapped = appointments.map((a) => {
      const deptMatches = departmentId != null ? a.departmentId === departmentId : true;
      const purposeMatches = visitPurposeId != null ? a.visitPurposeId === visitPurposeId : true;
      return {
        id: a.id,
        bookingCode: a.bookingCode,
        status: a.status,
        type: a.type,
        entryMode: a.entryMode,
        timeStart: formatTime(a.timeStart),
        timeEnd: formatTime(a.timeEnd),
        visitorName: a.visitor?.name || "",
        visitorCompany: a.visitor?.company || "",
        hostName: a.hostStaff?.name || "",
        hostPosition: a.hostStaff?.position || "",
        departmentId: a.departmentId,
        departmentName: a.department?.name || "",
        visitPurposeId: a.visitPurposeId,
        purposeName: a.visitPurpose?.name || a.purpose || "",
        purposeIcon: a.visitPurpose?.icon || "📋",
        matchesWalkinChoice: deptMatches && purposeMatches,
      };
    });

    const anyMatchesChoice = mapped.some((m) => m.matchesWalkinChoice);

    return ok({
      hasAppointment: true,
      matchesWalkinChoice: anyMatchesChoice,
      suggestion: anyMatchesChoice ? "use-appointment" : "confirm-with-visitor",
      appointments: mapped,
    });
  } catch (error) {
    console.error("POST /api/kiosk/appointment/match-by-identity error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
