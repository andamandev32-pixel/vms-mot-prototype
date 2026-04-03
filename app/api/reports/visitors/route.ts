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
// GET /api/reports/visitors — สถิติผู้เยี่ยมชมไม่ซ้ำ
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entryWhere: any = {};

    if (dateFrom) {
      entryWhere.checkinAt = { ...(entryWhere.checkinAt || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      entryWhere.checkinAt = { ...(entryWhere.checkinAt || {}), lt: endDate };
    }

    // Get all entries in range
    const entries = await prisma.visitEntry.findMany({
      where: entryWhere,
      select: {
        visitorId: true,
        visitor: {
          select: {
            id: true, firstName: true, lastName: true, name: true,
            company: true, nationality: true,
          },
        },
      },
    });

    // Total unique visitors
    const uniqueVisitorIds = new Set(entries.map((e) => e.visitorId));
    const totalUniqueVisitors = uniqueVisitorIds.size;

    // Top visitors (most frequent)
    const visitorCounts: Record<number, { visitor: typeof entries[0]["visitor"]; count: number }> = {};
    for (const entry of entries) {
      if (!visitorCounts[entry.visitorId]) {
        visitorCounts[entry.visitorId] = { visitor: entry.visitor, count: 0 };
      }
      visitorCounts[entry.visitorId].count++;
    }
    const topVisitors = Object.values(visitorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // By company
    const companyCounts: Record<string, number> = {};
    for (const entry of entries) {
      const company = entry.visitor.company || "ไม่ระบุ";
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    }
    const byCompany = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // By nationality
    const nationalityCounts: Record<string, number> = {};
    for (const entry of entries) {
      const nationality = entry.visitor.nationality || "ไม่ระบุ";
      nationalityCounts[nationality] = (nationalityCounts[nationality] || 0) + 1;
    }
    const byNationality = Object.entries(nationalityCounts)
      .map(([nationality, count]) => ({ nationality, count }))
      .sort((a, b) => b.count - a.count);

    return ok({
      totalUniqueVisitors,
      topVisitors,
      byCompany,
      byNationality,
    });
  } catch (error) {
    console.error("GET /api/reports/visitors error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
