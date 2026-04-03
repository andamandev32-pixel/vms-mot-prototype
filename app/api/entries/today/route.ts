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
// GET /api/entries/today — today's visit entries
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.trim() || "";

    // Today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      checkinAt: { gte: startOfDay, lte: endOfDay },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { entryCode: { contains: search } },
        { visitor: { name: { contains: search } } },
        { visitor: { phone: { contains: search } } },
      ];
    }

    const entries = await prisma.visitEntry.findMany({
      where,
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
            companionsCount: true,
          },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        checkoutByStaff: { select: { id: true, name: true, nameEn: true } },
      },
      orderBy: { checkinAt: "desc" },
    });

    // Summary counts
    const totalToday = entries.length;
    const checkedIn = entries.filter((e) => e.status === "checked-in").length;
    const checkedOut = entries.filter((e) => e.status === "checked-out").length;

    return ok({
      entries,
      summary: {
        total: totalToday,
        checkedIn,
        checkedOut,
      },
    });
  } catch (error) {
    console.error("GET /api/entries/today error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
