import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// PATCH /api/appointments/:id/notify — toggle notifyOnCheckin
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role === "visitor") {
      return err("FORBIDDEN", "ไม่อนุญาต", 403);
    }

    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) {
      return err("INVALID_ID", "ID ไม่ถูกต้อง");
    }

    const body = await request.json();
    const { notifyOnCheckin } = body as { notifyOnCheckin: boolean };

    if (typeof notifyOnCheckin !== "boolean") {
      return err("INVALID_BODY", "notifyOnCheckin ต้องเป็น boolean");
    }

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return err("NOT_FOUND", "ไม่พบนัดหมาย", 404);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { notifyOnCheckin },
      select: { id: true, bookingCode: true, notifyOnCheckin: true },
    });

    return ok({ appointment: updated });
  } catch (error) {
    console.error("PATCH /api/appointments/:id/notify error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
