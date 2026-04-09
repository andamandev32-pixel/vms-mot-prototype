import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/session — Start counter session
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const { servicePointId, staffId } = body;

    if (!servicePointId || !staffId) {
      return err("servicePointId and staffId are required");
    }

    // Verify service point exists and is counter type
    const servicePoint = await prisma.servicePoint.findFirst({
      where: {
        id: servicePointId,
        type: "counter",
        isActive: true,
      },
      include: {
        servicePointPurposes: {
          include: { visitPurpose: true },
        },
        servicePointDocuments: true,
      },
    });

    if (!servicePoint) {
      return err("Service point not found or not a counter", 404);
    }

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return err("Staff not found", 404);
    }

    // Create or update counter staff assignment
    const assignment = await prisma.counterStaffAssignment.upsert({
      where: {
        servicePointId_staffId: {
          servicePointId,
          staffId,
        },
      },
      update: {
        assignedAt: new Date(),
      },
      create: {
        servicePointId,
        staffId,
        assignedAt: new Date(),
      },
    });

    const sessionId = `session-${servicePointId}-${staffId}-${Date.now()}`;

    const config = {
      allowedPurposes: servicePoint.servicePointPurposes.map((spp) => ({
        id: spp.visitPurpose.id,
        name: spp.visitPurpose.name,
        nameEn: spp.visitPurpose.nameEn,
        icon: spp.visitPurpose.icon,
      })),
      allowedDocuments: servicePoint.servicePointDocuments.map((spd) => ({
        servicePointId: spd.servicePointId,
        documentTypeId: spd.identityDocumentTypeId,
      })),
    };

    return ok({
      sessionId,
      servicePoint: {
        id: servicePoint.id,
        name: servicePoint.name,
        nameEn: servicePoint.nameEn,
        location: servicePoint.location,
      },
      staff: {
        id: staff.id,
        name: staff.name,
      },
      config,
      assignmentId: assignment.id,
    });
  } catch (error) {
    console.error("POST /api/counter/session error:", error);
    return err("Internal server error", 500);
  }
}
