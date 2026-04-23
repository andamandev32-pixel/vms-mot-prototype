import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/appointment/verify-identity — Verify identity against appointment
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const {
      bookingCode,
      idNumber,
      passportNumber,
      firstName,
      lastName,
      fullNameTh,
    } = body as {
      bookingCode?: string;
      documentType?: string;
      idNumber?: string;
      passportNumber?: string;
      firstName?: string;
      lastName?: string;
      fullNameTh?: string;
      servicePointId?: number;
    };

    const bookingTrim = bookingCode?.trim();
    const idTrim = idNumber?.trim();
    const passTrim = passportNumber?.trim();
    const fnTrim = firstName?.trim();
    const lnTrim = lastName?.trim();
    const hasName = !!(fnTrim && lnTrim);

    if (!bookingTrim && !idTrim && !passTrim && !hasName) {
      return err(
        "MISSING_FIELDS",
        "กรุณาระบุอย่างน้อย 1 อย่าง: bookingCode, idNumber, passportNumber, หรือ firstName + lastName"
      );
    }

    // Resolve target appointment
    let appointment;
    if (bookingTrim) {
      appointment = await prisma.appointment.findUnique({
        where: { bookingCode: bookingTrim },
        include: { visitor: true },
      });
      if (!appointment) return err("NOT_FOUND", "ไม่พบนัดหมาย", 404);
    } else {
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

      appointment = await prisma.appointment.findFirst({
        where: {
          visitor: { OR: visitorOr },
          dateStart: { gte: dayStart, lt: dayEnd },
          status: { in: ["approved", "confirmed"] },
        },
        include: { visitor: true },
        orderBy: { timeStart: "asc" },
      });
      if (!appointment) return err("NOT_FOUND", "ไม่พบนัดหมายที่ตรงกับข้อมูลที่ระบุ", 404);
    }

    const visitor = appointment.visitor;

    // Blocklist check (use any available identifier on the matched visitor)
    const blockId = visitor?.idNumber || idTrim || passTrim;
    if (blockId) {
      const blocked = await prisma.blocklist.findFirst({
        where: { visitor: { idNumber: blockId }, isActive: true },
      });
      if (blocked) {
        return ok({
          status: "blocked",
          isBlocked: true,
          blockReason: blocked.reason,
          message: "ผู้เยี่ยมชมอยู่ในรายการที่ถูกบล็อค",
        });
      }
    }

    // Match identity against the resolved appointment's visitor
    const idMatch = idTrim
      ? visitor?.idNumber === idTrim
      : passTrim
        ? visitor?.idNumber === passTrim
        : hasName
          ? (visitor?.firstName === fnTrim && visitor?.lastName === lnTrim) ||
            (visitor?.firstNameEn === fnTrim && visitor?.lastNameEn === lnTrim)
          : true;

    const nameMatch = fullNameTh
      ? visitor?.name?.includes(fullNameTh.trim()) || fullNameTh.trim().includes(visitor?.name || "")
      : hasName;

    if (!idMatch) {
      return ok({
        status: "mismatch",
        matchResult: { nameMatch, idMatch: false, confidence: 0 },
        message: "ข้อมูลที่ระบุไม่ตรงกับนัดหมาย",
      });
    }

    if (visitor) {
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { lastVerifiedAt: new Date() },
      });
    }

    return ok({
      status: "matched",
      visitorId: visitor?.id,
      appointmentId: appointment.id,
      isBlocked: false,
      matchResult: { nameMatch, idMatch: true, confidence: idMatch && nameMatch ? 1.0 : 0.8 },
    });
  } catch (error) {
    console.error("POST /api/kiosk/appointment/verify-identity error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
