import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";
import { toDataUrl } from "@/lib/kiosk/photo-utils";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function generateEntryCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `eVMS-ENTRY-${dateStr}-${rand}`;
}

// POST /api/counter/walkin/checkin — Walk-in checkin
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const body = await request.json();
    const {
      visitorId,
      servicePointId,
      visitPurposeId,
      departmentId,
      hostContactName,
      idMethod,
      facePhotoBase64,
      officerId,
    } = body;

    if (!visitorId || !servicePointId || !visitPurposeId || !departmentId) {
      return err(
        "visitorId, servicePointId, visitPurposeId, and departmentId are required"
      );
    }

    // Check visitor exists and not blocked
    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitor) {
      return err("Visitor not found", 404);
    }

    if (visitor.isBlocked) {
      return err("Visitor is blocked", 403);
    }

    // Check no duplicate active entry
    const activeEntry = await prisma.visitEntry.findFirst({
      where: {
        visitorId,
        status: "checked-in",
      },
    });

    if (activeEntry) {
      return err(
        "Visitor already has an active entry (checked-in). Please checkout first."
      );
    }

    // Fetch purpose and department
    const [purpose, department] = await Promise.all([
      prisma.visitPurpose.findUnique({ where: { id: visitPurposeId } }),
      prisma.department.findUnique({
        where: { id: departmentId },
        include: {
          floorDepartments: {
            include: {
              floor: {
                include: { building: true },
              },
            },
          },
        },
      }),
    ]);

    if (!purpose) return err("Purpose not found", 404);
    if (!department) return err("Department not found", 404);

    const floorDept = department.floorDepartments[0];
    const entryCode = generateEntryCode();
    const now = new Date();

    const entry = await prisma.visitEntry.create({
      data: {
        entryCode,
        visitorId,
        status: "checked-in",
        purpose: purpose.name,
        visitType: "walkin",
        departmentId,
        checkinAt: now,
        checkinChannel: "counter",
        area: department.name,
        building: floorDept?.floor?.building?.name || "",
        floor: floorDept?.floor?.name || "",
        idMethod: idMethod || null,
        servicePointId,
        facePhotoPath: facePhotoBase64 ? toDataUrl(facePhotoBase64) : null,
      },
      include: {
        visitor: true,
        department: true,
      },
    });

    return ok({
      entry,
      accessControl: {
        granted: true,
        zones: [],
      },
      badge: {
        entryCode,
        visitorName: visitor.name,
        department: department.name,
        purpose: purpose.name,
        checkinAt: now.toISOString(),
      },
      notification: {
        sent: false,
        channel: null,
      },
    });
  } catch (error) {
    console.error("POST /api/counter/walkin/checkin error:", error);
    return err("Internal server error", 500);
  }
}
