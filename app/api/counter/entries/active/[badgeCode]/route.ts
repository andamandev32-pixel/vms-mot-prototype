import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/entries/active/[badgeCode] — Lookup active entry by badge/QR code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ badgeCode: string }> }
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { badgeCode } = await params;

    if (!badgeCode) {
      return err("Badge code is required");
    }

    const entry = await prisma.visitEntry.findFirst({
      where: {
        entryCode: badgeCode,
        status: "checked-in",
      },
      include: {
        visitor: true,
        department: true,
        servicePoint: true,
      },
    });

    if (!entry) {
      return ok({ found: false, entry: null });
    }

    // Calculate duration
    const checkinTime = new Date(entry.checkinAt).getTime();
    const now = Date.now();
    const durationMinutes = Math.floor((now - checkinTime) / (1000 * 60));
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;

    return ok({
      found: true,
      entry: {
        ...entry,
        duration: {
          minutes: durationMinutes,
          formatted: `${durationHours}h ${remainingMinutes}m`,
        },
      },
    });
  } catch (error) {
    console.error(
      "GET /api/counter/entries/active/[badgeCode] error:",
      error
    );
    return err("Internal server error", 500);
  }
}
