import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/badge/print — Print badge
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const { entryId, servicePointId } = body;

    if (!entryId || !servicePointId) {
      return err("entryId and servicePointId are required");
    }

    // Fetch entry with visitor
    const entry = await prisma.visitEntry.findUnique({
      where: { id: entryId },
      include: {
        visitor: true,
        department: true,
      },
    });

    if (!entry) {
      return err("Entry not found", 404);
    }

    // Update slipPrinted
    await prisma.visitEntry.update({
      where: { id: entryId },
      data: { slipPrinted: true },
    });

    return ok({
      printJob: {
        id: `print-${entryId}-${Date.now()}`,
        status: "queued",
        servicePointId,
      },
      badgeData: {
        entryCode: entry.entryCode,
        visitorName: entry.visitor.name,
        visitorNameEn: entry.visitor.nameEn,
        visitorPhoto: entry.visitor.photo,
        department: entry.department?.name || "",
        purpose: entry.purpose,
        checkinAt: entry.checkinAt.toISOString(),
        area: entry.area,
        building: entry.building,
        floor: entry.floor,
      },
    });
  } catch (error) {
    console.error("POST /api/counter/badge/print error:", error);
    return err("Internal server error", 500);
  }
}
