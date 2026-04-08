import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

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

// POST /api/counter/appointments/[id]/checkin — Checkin from appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { id } = await params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) return err("Invalid appointment ID");

    const body = await request.json();
    const { visitorId, servicePointId, idMethod, facePhotoPath, officerId } =
      body;

    if (!visitorId || !servicePointId) {
      return err("visitorId and servicePointId are required");
    }

    // Fetch appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { visitor: true, department: true },
    });

    if (!appointment) {
      return err("Appointment not found", 404);
    }

    if (!["approved", "confirmed"].includes(appointment.status)) {
      return err("Appointment is not in a valid status for checkin");
    }

    const entryCode = generateEntryCode();
    const now = new Date();

    // Create visit entry
    const entry = await prisma.visitEntry.create({
      data: {
        entryCode,
        appointmentId,
        visitorId,
        status: "checked-in",
        purpose: appointment.purpose,
        visitType: "appointment",
        hostStaffId: appointment.hostStaffId,
        departmentId: appointment.departmentId,
        checkinAt: now,
        checkinChannel: "counter",
        area: appointment.department?.name || "",
        building: "",
        floor: "",
        idMethod: idMethod || null,
        servicePointId,
        facePhotoPath: facePhotoPath || null,
      },
      include: {
        visitor: true,
        department: true,
      },
    });

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "checked-in" },
    });

    return ok({
      entry,
      entryCode,
      checkinAt: now.toISOString(),
    });
  } catch (error) {
    console.error(
      "POST /api/counter/appointments/[id]/checkin error:",
      error
    );
    return err("Internal server error", 500);
  }
}
