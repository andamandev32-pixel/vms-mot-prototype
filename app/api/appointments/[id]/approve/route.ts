import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// POST /api/appointments/:id/approve — approve appointment
// ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    // Only staff, admin, supervisor can approve
    if (user.role === "visitor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์อนุมัติการนัดหมาย", 403);
    }

    const { id } = await params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return err("INVALID_ID", "รหัสนัดหมายไม่ถูกต้อง");
    }

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบการนัดหมาย", 404);
    }

    if (existing.status !== "pending") {
      return err("INVALID_STATUS", `ไม่สามารถอนุมัติการนัดหมายที่มีสถานะ "${existing.status}" ได้`);
    }

    const now = new Date();

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "approved",
        approvedBy: user.id,
        approvedAt: now,
        statusLogs: {
          create: {
            fromStatus: existing.status,
            toStatus: "approved",
            changedBy: user.id,
            reason: "อนุมัติการนัดหมาย",
          },
        },
      },
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, name: true, company: true, phone: true, email: true },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        statusLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return ok({ appointment });
  } catch (error) {
    console.error("POST /api/appointments/[id]/approve error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
