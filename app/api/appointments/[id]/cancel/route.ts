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
// POST /api/appointments/:id/cancel — cancel appointment
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

    const { id } = await params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return err("INVALID_ID", "รหัสนัดหมายไม่ถูกต้อง");
    }

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบการนัดหมาย", 404);
    }

    // Permission: owner (visitor) or admin/supervisor
    if (user.role === "visitor") {
      const visitor = await prisma.visitor.findFirst({ where: { email: user.email } });
      if (!visitor || existing.visitorId !== visitor.id) {
        return err("FORBIDDEN", "คุณไม่มีสิทธิ์ยกเลิกการนัดหมายนี้", 403);
      }
    } else if (user.role === "staff") {
      // Staff can cancel if in same department or is the host
      if (user.departmentId && existing.departmentId !== user.departmentId) {
        return err("FORBIDDEN", "คุณไม่มีสิทธิ์ยกเลิกการนัดหมายนี้", 403);
      }
    }

    if (existing.status === "cancelled") {
      return err("INVALID_STATUS", "การนัดหมายนี้ถูกยกเลิกแล้ว");
    }
    if (existing.status === "completed") {
      return err("INVALID_STATUS", "ไม่สามารถยกเลิกการนัดหมายที่เสร็จสิ้นแล้วได้");
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "cancelled",
        statusLogs: {
          create: {
            fromStatus: existing.status,
            toStatus: "cancelled",
            changedBy: user.role !== "visitor" ? user.id : null,
            reason: "ยกเลิกการนัดหมาย",
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
    console.error("POST /api/appointments/[id]/cancel error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
