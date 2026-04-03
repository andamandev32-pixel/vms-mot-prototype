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
// GET /api/pdpa/logs — รายการ PDPA Consent Logs (admin)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const channel = searchParams.get("channel");
    const visitorId = searchParams.get("visitorId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (dateFrom || dateTo) {
      where.consentedAt = {};
      if (dateFrom) where.consentedAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.consentedAt.lte = endDate;
      }
    }

    if (channel) where.consentChannel = channel;
    if (visitorId) where.visitorId = parseInt(visitorId, 10);

    const [logs, total] = await Promise.all([
      prisma.pdpaConsentLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consentedAt: "desc" },
        include: {
          visitor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              nameEn: true,
              idNumber: true,
              company: true,
              phone: true,
            },
          },
        },
      }),
      prisma.pdpaConsentLog.count({ where }),
    ]);

    return ok({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/pdpa/logs error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
