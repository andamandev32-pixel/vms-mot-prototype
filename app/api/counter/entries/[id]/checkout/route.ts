import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/entries/[id]/checkout — Checkout visitor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { id } = await params;
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) return err("Invalid entry ID");

    const body = await request.json();
    const { officerId, returnedBadge, officerNote } = body;

    // Fetch entry
    const entry = await prisma.visitEntry.findUnique({
      where: { id: entryId },
      include: { visitor: true },
    });

    if (!entry) {
      return err("Entry not found", 404);
    }

    if (entry.status !== "checked-in") {
      return err("Entry is not currently checked-in");
    }

    const now = new Date();
    const checkinTime = new Date(entry.checkinAt).getTime();
    const totalDurationMinutes = Math.floor(
      (now.getTime() - checkinTime) / (1000 * 60)
    );
    const durationHours = Math.floor(totalDurationMinutes / 60);
    const remainingMinutes = totalDurationMinutes % 60;

    // Update entry
    const updatedEntry = await prisma.visitEntry.update({
      where: { id: entryId },
      data: {
        status: "checked-out",
        checkoutAt: now,
        checkoutBy: officerId || null,
        notes: officerNote
          ? entry.notes
            ? `${entry.notes}\n[Checkout] ${officerNote}`
            : `[Checkout] ${officerNote}`
          : entry.notes,
      },
      include: {
        visitor: true,
        department: true,
      },
    });

    return ok({
      entry: updatedEntry,
      totalDuration: {
        minutes: totalDurationMinutes,
        formatted: `${durationHours}h ${remainingMinutes}m`,
      },
      returnedBadge: returnedBadge ?? false,
      accessRevoked: true,
    });
  } catch (error) {
    console.error("POST /api/counter/entries/[id]/checkout error:", error);
    return err("Internal server error", 500);
  }
}
