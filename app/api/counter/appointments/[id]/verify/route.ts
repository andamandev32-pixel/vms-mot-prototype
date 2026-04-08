import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// POST /api/counter/appointments/[id]/verify — Verify identity against appointment
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
    const { idNumber, fullNameTh } = body;

    if (!idNumber && !fullNameTh) {
      return err("idNumber or fullNameTh is required");
    }

    // Check blocklist first
    const blocklistEntries = await prisma.blocklist.findMany({
      where: {
        isActive: true,
        OR: [
          ...(idNumber
            ? [{ visitor: { idNumber } }]
            : []),
          ...(fullNameTh
            ? [
                {
                  firstName: fullNameTh.split(" ")[0] || "",
                  lastName: fullNameTh.split(" ").slice(1).join(" ") || "",
                },
              ]
            : []),
        ],
      },
    });

    if (blocklistEntries.length > 0) {
      return ok({
        status: "blocked",
        reason: blocklistEntries[0].reason,
        blocklistId: blocklistEntries[0].id,
      });
    }

    // Fetch appointment with visitor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { visitor: true },
    });

    if (!appointment) {
      return err("Appointment not found", 404);
    }

    // Match against appointment visitor
    const visitor = appointment.visitor;
    let matched = false;

    if (idNumber && visitor.idNumber === idNumber) {
      matched = true;
    }

    if (fullNameTh && visitor.name === fullNameTh) {
      matched = true;
    }

    return ok({
      status: matched ? "matched" : "mismatch",
      appointment: {
        id: appointment.id,
        bookingCode: appointment.bookingCode,
        status: appointment.status,
      },
      visitor: matched
        ? {
            id: visitor.id,
            name: visitor.name,
            nameEn: visitor.nameEn,
            idNumber: visitor.idNumber,
            photo: visitor.photo,
          }
        : null,
    });
  } catch (error) {
    console.error("POST /api/counter/appointments/[id]/verify error:", error);
    return err("Internal server error", 500);
  }
}
