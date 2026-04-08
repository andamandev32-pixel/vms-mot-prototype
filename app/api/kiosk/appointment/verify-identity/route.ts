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
    const { bookingCode, idNumber, fullNameTh } = body as {
      bookingCode?: string;
      documentType?: string;
      idNumber?: string;
      fullNameTh?: string;
      servicePointId?: number;
    };

    if (!bookingCode?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ bookingCode");
    if (!idNumber?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ idNumber");

    const appointment = await prisma.appointment.findUnique({
      where: { bookingCode: bookingCode.trim() },
      include: { visitor: true },
    });

    if (!appointment) return err("NOT_FOUND", "ไม่พบนัดหมาย", 404);

    // Check blocklist
    const blocked = await prisma.blocklist.findFirst({
      where: { visitor: { idNumber: idNumber.trim() }, isActive: true },
    });

    if (blocked) {
      return ok({
        status: "blocked",
        isBlocked: true,
        blockReason: blocked.reason,
        message: "ผู้เยี่ยมชมอยู่ในรายการที่ถูกบล็อค",
      });
    }

    // Match identity
    const visitor = appointment.visitor;
    const idMatch = visitor?.idNumber === idNumber.trim();
    const nameMatch = fullNameTh
      ? visitor?.name?.includes(fullNameTh.trim()) || fullNameTh.trim().includes(visitor?.name || "")
      : false;

    if (!idMatch) {
      return ok({
        status: "mismatch",
        matchResult: { nameMatch, idMatch: false, confidence: 0 },
        message: "หมายเลขบัตรไม่ตรงกับนัดหมาย",
      });
    }

    // Upsert visitor lastVerifiedAt
    if (visitor) {
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: { lastVerifiedAt: new Date() },
      });
    }

    return ok({
      status: "matched",
      visitorId: visitor?.id,
      isBlocked: false,
      matchResult: { nameMatch, idMatch: true, confidence: idMatch && nameMatch ? 1.0 : 0.8 },
    });
  } catch (error) {
    console.error("POST /api/kiosk/appointment/verify-identity error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
