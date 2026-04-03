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
// GET /api/entries/:id — single entry detail
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
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) {
      return err("INVALID_ID", "รหัสรายการไม่ถูกต้อง");
    }

    const entry = await prisma.visitEntry.findUnique({
      where: { id: entryId },
      include: {
        visitor: {
          select: {
            id: true, firstName: true, lastName: true, name: true, nameEn: true,
            company: true, phone: true, email: true, photo: true, idType: true, nationality: true,
          },
        },
        appointment: {
          include: {
            visitPurpose: { select: { id: true, name: true, nameEn: true } },
            companions: true,
            equipment: true,
          },
        },
        hostStaff: {
          select: {
            id: true, name: true, nameEn: true, position: true,
            departmentId: true, email: true, phone: true,
          },
        },
        department: { select: { id: true, name: true, nameEn: true } },
        checkoutByStaff: { select: { id: true, name: true, nameEn: true } },
        servicePoint: true,
      },
    });

    if (!entry) {
      return err("NOT_FOUND", "ไม่พบรายการเช็คอิน", 404);
    }

    return ok({ entry });
  } catch (error) {
    console.error("GET /api/entries/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
