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
// GET /api/locations/departments — รายการแผนกทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const departments = await prisma.department.findMany({
      include: {
        floorDepartments: {
          include: {
            floor: {
              include: {
                building: { select: { id: true, name: true, nameEn: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return ok({ departments });
  } catch (error) {
    console.error("GET /api/locations/departments error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/locations/departments — สร้างแผนกใหม่ (admin only)
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
    const { name, nameEn, isActive } = body as {
      name?: string;
      nameEn?: string;
      isActive?: boolean;
    };

    if (!name?.trim() || !nameEn?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก name และ nameEn");
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        isActive: isActive ?? true,
      },
    });

    return ok({ department });
  } catch (error) {
    console.error("POST /api/locations/departments error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
