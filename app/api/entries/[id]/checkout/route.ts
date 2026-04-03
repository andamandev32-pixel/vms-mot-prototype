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
// POST /api/entries/:id/checkout — checkout a visit entry
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
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) {
      return err("INVALID_ID", "รหัสรายการไม่ถูกต้อง");
    }

    const existing = await prisma.visitEntry.findUnique({ where: { id: entryId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบรายการเช็คอิน", 404);
    }

    if (existing.status === "checked-out") {
      return err("ALREADY_CHECKED_OUT", "รายการนี้เช็คเอาท์แล้ว");
    }

    if (existing.status !== "checked-in") {
      return err("INVALID_STATUS", `ไม่สามารถเช็คเอาท์รายการที่มีสถานะ "${existing.status}" ได้`);
    }

    const now = new Date();

    const entry = await prisma.visitEntry.update({
      where: { id: entryId },
      data: {
        status: "checked-out",
        checkoutAt: now,
        checkoutBy: user.id,
      },
      include: {
        visitor: {
          select: {
            id: true, firstName: true, lastName: true, name: true,
            company: true, phone: true, email: true, photo: true,
          },
        },
        appointment: {
          select: { id: true, bookingCode: true, type: true, status: true, purpose: true },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true, phone: true },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        checkoutByStaff: { select: { id: true, name: true, nameEn: true } },
      },
    });

    return ok({ entry });
  } catch (error) {
    console.error("POST /api/entries/[id]/checkout error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
