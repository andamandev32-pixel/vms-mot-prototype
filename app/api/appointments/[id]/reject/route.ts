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
// POST /api/appointments/:id/reject — reject appointment
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

    if (user.role === "visitor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ปฏิเสธการนัดหมาย", 403);
    }

    const { id } = await params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return err("INVALID_ID", "รหัสนัดหมายไม่ถูกต้อง");
    }

    const body = await request.json();
    const { reason } = body as { reason?: string };

    if (!reason?.trim()) {
      return err("MISSING_FIELDS", "กรุณาระบุเหตุผลในการปฏิเสธ");
    }

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบการนัดหมาย", 404);
    }

    if (existing.status !== "pending") {
      return err("INVALID_STATUS", `ไม่สามารถปฏิเสธการนัดหมายที่มีสถานะ "${existing.status}" ได้`);
    }

    // ═══════ Approver Group Authorization ═══════
    if (user.role === "staff") {
      const staffId = user.refId;
      if (!staffId) {
        return err("FORBIDDEN", "ไม่พบข้อมูลเจ้าหน้าที่", 403);
      }

      const rule = await prisma.visitPurposeDepartmentRule.findFirst({
        where: {
          visitPurposeId: existing.visitPurposeId,
          departmentId: existing.departmentId,
          isActive: true,
        },
      });

      if (rule?.requireApproval && rule.approverGroupId) {
        const membership = await prisma.approverGroupMember.findFirst({
          where: {
            approverGroupId: rule.approverGroupId,
            staffId,
            canApprove: true,
          },
        });

        if (!membership) {
          return err("FORBIDDEN", "คุณไม่อยู่ในกลุ่มผู้อนุมัติสำหรับการนัดหมายนี้", 403);
        }
      }
    }

    const now = new Date();

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "rejected",
        rejectedAt: now,
        rejectedReason: reason.trim(),
        statusLogs: {
          create: {
            fromStatus: existing.status,
            toStatus: "rejected",
            changedBy: user.id,
            reason: reason.trim(),
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
    console.error("POST /api/appointments/[id]/reject error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
