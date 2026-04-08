import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/service-points — List counter service points
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const servicePoints = await prisma.servicePoint.findMany({
      where: {
        type: "counter",
        isActive: true,
      },
      include: {
        servicePointPurposes: {
          include: {
            visitPurpose: true,
          },
        },
        servicePointDocuments: true,
        counterStaffAssignments: {
          include: {
            staff: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return ok({ servicePoints });
  } catch (error) {
    console.error("GET /api/counter/service-points error:", error);
    return err("Internal server error", 500);
  }
}
