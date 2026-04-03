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
// GET /api/dashboard/today — การนัดหมายและการเข้าเยี่ยมวันนี้
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [appointments, entries] = await Promise.all([
      // Today's appointments
      prisma.appointment.findMany({
        where: {
          dateStart: { gte: startOfToday, lt: startOfTomorrow },
        },
        include: {
          visitor: {
            select: { id: true, firstName: true, lastName: true, name: true, nameEn: true, company: true, phone: true },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true, employeeId: true },
          },
          department: { select: { id: true, name: true, nameEn: true } },
        },
        orderBy: { timeStart: "asc" },
      }),
      // Today's entries
      prisma.visitEntry.findMany({
        where: {
          checkinAt: { gte: startOfToday, lt: startOfTomorrow },
        },
        include: {
          visitor: {
            select: { id: true, firstName: true, lastName: true, name: true, nameEn: true, company: true },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true },
          },
          department: { select: { id: true, name: true, nameEn: true } },
        },
        orderBy: { checkinAt: "desc" },
      }),
    ]);

    return ok({ appointments, entries });
  } catch (error) {
    console.error("GET /api/dashboard/today error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
