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
// GET /api/dashboard/charts — ข้อมูลกราฟ (จำนวนผู้เข้าเยี่ยมรายวัน)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    const days = period === "30d" ? 30 : 7;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);

    // Get all entries in the period
    const entries = await prisma.visitEntry.findMany({
      where: {
        checkinAt: { gte: startDate },
      },
      select: { checkinAt: true },
    });

    // Group by date
    const dailyCounts: Record<string, number> = {};

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split("T")[0];
      dailyCounts[dateKey] = 0;
    }

    // Count entries per day
    for (const entry of entries) {
      const dateKey = new Date(entry.checkinAt).toISOString().split("T")[0];
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++;
      }
    }

    const chartData = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));

    return ok({ period, chartData });
  } catch (error) {
    console.error("GET /api/dashboard/charts error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
