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
// GET /api/locations/buildings — รายการอาคารทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const buildings = await prisma.building.findMany({
      include: {
        floors: {
          include: {
            floorDepartments: {
              include: {
                department: { select: { id: true, name: true, nameEn: true } },
              },
            },
          },
          orderBy: { floorNumber: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return ok({ buildings });
  } catch (error) {
    console.error("GET /api/locations/buildings error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/locations/buildings — สร้างอาคารใหม่ (admin only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const { name, nameEn, totalFloors, description, isActive } = body as {
      name?: string;
      nameEn?: string;
      totalFloors?: number;
      description?: string;
      isActive?: boolean;
    };

    if (!name?.trim() || !nameEn?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก name และ nameEn");
    }

    const building = await prisma.building.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        totalFloors: totalFloors ?? 1,
        description: description?.trim() || null,
        isActive: isActive ?? true,
      },
    });

    return ok({ building });
  } catch (error) {
    console.error("POST /api/locations/buildings error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
