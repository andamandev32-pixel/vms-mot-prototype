import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/appointments/today — Search today's appointments
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause: Record<string, unknown> = {
      dateStart: { lte: tomorrow },
      dateEnd: { gte: today },
      status: { in: ["approved", "confirmed"] },
    };

    if (q) {
      whereClause.OR = [
        { bookingCode: { contains: q } },
        { visitor: { name: { contains: q } } },
        { visitor: { idNumber: { contains: q } } },
        { visitor: { phone: { contains: q } } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        visitor: true,
        hostStaff: true,
        department: true,
      },
      orderBy: { timeStart: "asc" },
    });

    return ok({ appointments, total: appointments.length });
  } catch (error) {
    console.error("GET /api/counter/appointments/today error:", error);
    return err("Internal server error", 500);
  }
}
