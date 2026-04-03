import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie =====
async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// POST /api/locations/buildings/:buildingId/floors — เพิ่มชั้นในอาคาร (admin only)
// ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { buildingId } = await params;
    const bId = parseInt(buildingId, 10);
    if (isNaN(bId)) {
      return err("INVALID_ID", "รหัสอาคารไม่ถูกต้อง");
    }

    const building = await prisma.building.findUnique({ where: { id: bId } });
    if (!building) {
      return err("NOT_FOUND", "ไม่พบอาคารที่ระบุ", 404);
    }

    const body = await request.json();
    const { name, nameEn, floorNumber } = body as {
      name?: string;
      nameEn?: string;
      floorNumber?: number;
    };

    if (!name?.trim() || !nameEn?.trim() || floorNumber === undefined) {
      return err("MISSING_FIELDS", "กรุณากรอก name, nameEn และ floorNumber");
    }

    const floor = await prisma.floor.create({
      data: {
        buildingId: bId,
        name: name.trim(),
        nameEn: nameEn.trim(),
        floorNumber,
      },
    });

    return ok({ floor });
  } catch (error) {
    console.error("POST /api/locations/buildings/[buildingId]/floors error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
