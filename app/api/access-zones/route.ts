import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== Response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// GET /api/access-zones — รายการ Access Zone ทั้งหมด
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const floorId = searchParams.get("floorId");
    const isActive = searchParams.get("isActive");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (buildingId) where.buildingId = parseInt(buildingId, 10);
    if (floorId) where.floorId = parseInt(floorId, 10);
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const zones = await prisma.accessZone.findMany({
      where,
      include: {
        building: { select: { id: true, name: true, nameEn: true } },
        floor: { select: { id: true, name: true, nameEn: true, floorNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ zones });
  } catch (error) {
    console.error("GET /api/access-zones error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/access-zones — สร้าง Access Zone ใหม่ (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);
    }

    const body = await request.json();
    const { name, nameEn, type, hikvisionDoorId, buildingId, floorId, description, isActive } = body as {
      name?: string;
      nameEn?: string;
      type?: string;
      hikvisionDoorId?: string;
      buildingId?: number;
      floorId?: number;
      description?: string;
      isActive?: boolean;
    };

    if (!name?.trim() || !nameEn?.trim() || !type?.trim() || !hikvisionDoorId?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก name, nameEn, type และ hikvisionDoorId");
    }
    if (!buildingId || !floorId) {
      return err("MISSING_FIELDS", "กรุณาระบุ buildingId และ floorId");
    }

    // Check unique hikvisionDoorId
    const existing = await prisma.accessZone.findUnique({
      where: { hikvisionDoorId },
    });
    if (existing) {
      return err("DUPLICATE_DOOR_ID", "hikvisionDoorId นี้ถูกใช้งานแล้ว");
    }

    const zone = await prisma.accessZone.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        type: type.trim(),
        hikvisionDoorId: hikvisionDoorId.trim(),
        buildingId,
        floorId,
        description: description ?? null,
        isActive: isActive ?? true,
      },
      include: {
        building: { select: { id: true, name: true, nameEn: true } },
        floor: { select: { id: true, name: true, nameEn: true, floorNumber: true } },
      },
    });

    return ok({ zone });
  } catch (error) {
    console.error("POST /api/access-zones error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
