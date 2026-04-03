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
// GET /api/search/appointments — ค้นหาการนัดหมาย
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (q) {
      where.OR = [
        { bookingCode: { contains: q } },
        { purpose: { contains: q } },
        { visitor: { name: { contains: q } } },
        { visitor: { nameEn: { contains: q } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom) {
      where.dateStart = { ...(where.dateStart || {}), gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.dateStart = { ...(where.dateStart || {}), lte: new Date(dateTo) };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          visitor: {
            select: { id: true, firstName: true, lastName: true, name: true, nameEn: true, company: true, phone: true },
          },
          hostStaff: {
            select: { id: true, name: true, nameEn: true, employeeId: true },
          },
          department: { select: { id: true, name: true, nameEn: true } },
        },
        orderBy: { dateStart: "desc" },
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
    console.error("GET /api/search/appointments error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
