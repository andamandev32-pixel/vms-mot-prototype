import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/entries/[id]/summary — Entry summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { id } = await params;
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) return err("Invalid entry ID");

    const entry = await prisma.visitEntry.findUnique({
      where: { id: entryId },
      include: {
        visitor: true,
        department: true,
        servicePoint: true,
        hostStaff: true,
      },
    });

    if (!entry) {
      return err("Entry not found", 404);
    }

    return ok({
      entry: {
        id: entry.id,
        entryCode: entry.entryCode,
        status: entry.status,
        visitType: entry.visitType,
        purpose: entry.purpose,
        checkinAt: entry.checkinAt,
        checkoutAt: entry.checkoutAt,
        checkinChannel: entry.checkinChannel,
        idMethod: entry.idMethod,
        slipPrinted: entry.slipPrinted,
        facePhotoPath: entry.facePhotoPath,
      },
      visitor: {
        id: entry.visitor.id,
        name: entry.visitor.name,
        nameEn: entry.visitor.nameEn,
        idNumber: entry.visitor.idNumber,
        idType: entry.visitor.idType,
        phone: entry.visitor.phone,
        photo: entry.visitor.photo,
        company: entry.visitor.company,
      },
      destination: {
        department: entry.department
          ? {
              id: entry.department.id,
              name: entry.department.name,
              nameEn: entry.department.nameEn,
            }
          : null,
        area: entry.area,
        building: entry.building,
        floor: entry.floor,
        room: entry.room,
      },
      accessControl: {
        zones: [],
        granted: entry.status === "checked-in",
      },
      canReprint: entry.status === "checked-in",
    });
  } catch (error) {
    console.error("GET /api/counter/entries/[id]/summary error:", error);
    return err("Internal server error", 500);
  }
}
