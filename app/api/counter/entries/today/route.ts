import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/entries/today — Today's entries
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause: Record<string, unknown> = {
      checkinAt: { gte: today, lt: tomorrow },
    };

    if (statusFilter) {
      const statuses = statusFilter.split(",").map((s) => s.trim());
      whereClause.status = { in: statuses };
    }

    const entries = await prisma.visitEntry.findMany({
      where: whereClause,
      include: {
        visitor: true,
        department: true,
      },
      orderBy: { checkinAt: "desc" },
    });

    return ok({
      entries,
      total: entries.length,
      filters: {
        status: statusFilter || "all",
        date: today.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    console.error("GET /api/counter/entries/today error:", error);
    return err("Internal server error", 500);
  }
}
