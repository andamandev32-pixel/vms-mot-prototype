import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/appointments/:id — appointment detail
// ─────────────────────────────────────────────────────
export async function GET(
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

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        visitor: {
          select: {
            id: true, firstName: true, lastName: true, name: true, nameEn: true,
            company: true, phone: true, email: true, photo: true, idType: true, nationality: true,
          },
        },
        hostStaff: {
          select: {
            id: true, name: true, nameEn: true, position: true,
            departmentId: true, email: true, phone: true,
          },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        visitPurpose: { select: { id: true, name: true, nameEn: true } },
        visitEntries: {
          include: {
            visitor: { select: { id: true, name: true } },
          },
        },
        companions: true,
        equipment: true,
        statusLogs: {
          include: {
            changedByStaff: { select: { id: true, name: true, nameEn: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        approvedByStaff: { select: { id: true, name: true, nameEn: true } },
      },
    });

    if (!appointment) {
      return err("NOT_FOUND", "ไม่พบการนัดหมาย", 404);
    }

    // RBAC check
    if (user.role === "visitor") {
      const visitor = await prisma.visitor.findFirst({ where: { email: user.email } });
      if (!visitor || appointment.visitorId !== visitor.id) {
        return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดูการนัดหมายนี้", 403);
      }
    } else if (user.role === "staff") {
      if (user.departmentId && appointment.departmentId !== user.departmentId) {
        return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดูการนัดหมายนี้", 403);
      }
    }

    return ok({ appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PATCH /api/appointments/:id — partial update (owner or admin)
// ─────────────────────────────────────────────────────
export async function PATCH(
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

    // Permission check: owner (visitor who created) or admin/supervisor
    if (user.role === "visitor") {
      const visitor = await prisma.visitor.findFirst({ where: { email: user.email } });
      if (!visitor || existing.visitorId !== visitor.id) {
        return err("FORBIDDEN", "คุณไม่มีสิทธิ์แก้ไขการนัดหมายนี้", 403);
      }
    } else if (user.role === "staff") {
      // Staff can edit if they are the host or in the same department
      if (user.departmentId && existing.departmentId !== user.departmentId) {
        return err("FORBIDDEN", "คุณไม่มีสิทธิ์แก้ไขการนัดหมายนี้", 403);
      }
    }

    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _status, ...updateFields } = body;

    // Cannot change status via PATCH
    if (body.status !== undefined) {
      return err("INVALID_FIELD", "ไม่สามารถเปลี่ยนสถานะผ่าน PATCH ได้ กรุณาใช้ approve/reject/cancel endpoint");
    }

    // Build update data for allowed fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    const allowedFields = [
      "hostStaffId", "visitPurposeId", "departmentId", "type", "entryMode",
      "purpose", "offerWifi", "area", "building", "floor", "room",
      "vehiclePlate", "notes", "companionsCount",
    ];

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        data[field] = updateFields[field];
      }
    }

    // Handle date/time fields separately for parsing
    if (updateFields.date) {
      data.dateStart = new Date(updateFields.date + "T00:00:00.000Z");
    }
    if (updateFields.dateEnd) {
      data.dateEnd = new Date(updateFields.dateEnd + "T00:00:00.000Z");
    }
    if (updateFields.timeStart) {
      data.timeStart = new Date(`1970-01-01T${updateFields.timeStart}:00.000Z`);
    }
    if (updateFields.timeEnd) {
      data.timeEnd = new Date(`1970-01-01T${updateFields.timeEnd}:00.000Z`);
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, name: true, company: true, phone: true, email: true },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        visitPurpose: { select: { id: true, name: true, nameEn: true } },
      },
    });

    return ok({ appointment });
  } catch (error) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/appointments/:id — delete appointment (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
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

    // Delete related records first, then appointment
    await prisma.$transaction([
      prisma.appointmentStatusLog.deleteMany({ where: { appointmentId } }),
      prisma.appointmentCompanion.deleteMany({ where: { appointmentId } }),
      prisma.appointmentEquipment.deleteMany({ where: { appointmentId } }),
      prisma.appointment.delete({ where: { id: appointmentId } }),
    ]);

    return ok({ message: "ลบการนัดหมายเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/appointments/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
