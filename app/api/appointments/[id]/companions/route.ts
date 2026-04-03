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
// GET /api/appointments/:id/companions — list companions
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

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return err("NOT_FOUND", "ไม่พบการนัดหมาย", 404);
    }

    const companions = await prisma.appointmentCompanion.findMany({
      where: { appointmentId },
      orderBy: { id: "asc" },
    });

    return ok({ companions });
  } catch (error) {
    console.error("GET /api/appointments/[id]/companions error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/appointments/:id/companions — add companion(s)
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

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return err("NOT_FOUND", "ไม่พบการนัดหมาย", 404);
    }

    const body = await request.json();
    const { companions } = body as {
      companions: Array<{ firstName: string; lastName: string; company?: string; phone?: string }>;
    };

    if (!companions || !Array.isArray(companions) || companions.length === 0) {
      return err("MISSING_FIELDS", "กรุณาระบุข้อมูลผู้ติดตามอย่างน้อย 1 คน");
    }

    // Validate each companion
    for (const c of companions) {
      if (!c.firstName?.trim() || !c.lastName?.trim()) {
        return err("MISSING_FIELDS", "กรุณาระบุชื่อและนามสกุลของผู้ติดตามทุกคน");
      }
    }

    // Create companions and update count
    const created = await prisma.$transaction(async (tx) => {
      const newCompanions = await Promise.all(
        companions.map((c) =>
          tx.appointmentCompanion.create({
            data: {
              appointmentId,
              firstName: c.firstName.trim(),
              lastName: c.lastName.trim(),
              company: c.company?.trim() || null,
              phone: c.phone?.trim() || null,
            },
          })
        )
      );

      // Update companions count
      const totalCount = await tx.appointmentCompanion.count({ where: { appointmentId } });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { companionsCount: totalCount },
      });

      return newCompanions;
    });

    return ok({ companions: created });
  } catch (error) {
    console.error("POST /api/appointments/[id]/companions error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
