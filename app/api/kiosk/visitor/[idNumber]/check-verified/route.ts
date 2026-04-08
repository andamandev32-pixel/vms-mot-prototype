import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// GET /api/kiosk/visitor/:idNumber/check-verified
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idNumber: string }> },
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const { idNumber } = await params;
    if (!idNumber?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ idNumber");

    const visitor = await prisma.visitor.findFirst({
      where: { idNumber: idNumber.trim() },
      select: {
        id: true,
        name: true,
        nameEn: true,
        photo: true,
        idType: true,
        lastVerifiedAt: true,
      },
    });

    if (!visitor) {
      return ok({ verified: false, message: "ไม่พบข้อมูลยืนยันตัวตน" });
    }

    // Check if visitor has an entry today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntry = await prisma.visitEntry.findFirst({
      where: {
        visitorId: visitor.id,
        status: "checked-in",
        checkinAt: { gte: today, lt: tomorrow },
      },
    });

    if (todayEntry || visitor.lastVerifiedAt) {
      return ok({
        verified: true,
        visitorId: visitor.id,
        lastVerifiedAt: visitor.lastVerifiedAt?.toISOString() || null,
        lastIdMethod: visitor.idType || "thai-id-card",
        fullNameTh: visitor.name,
        fullNameEn: visitor.nameEn,
        photoPath: visitor.photo,
      });
    }

    return ok({ verified: false, message: "ไม่พบข้อมูลยืนยันตัวตน" });
  } catch (error) {
    console.error("GET /api/kiosk/visitor/[idNumber]/check-verified error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
