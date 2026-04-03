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
// GET /api/locations/floors — รายการชั้นทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const floors = await prisma.floor.findMany({
      include: {
        building: { select: { id: true, name: true, nameEn: true } },
        floorDepartments: {
          include: {
            department: { select: { id: true, name: true, nameEn: true } },
          },
        },
      },
      orderBy: [{ buildingId: "asc" }, { floorNumber: "asc" }],
    });

    return ok({ floors });
  } catch (error) {
    console.error("GET /api/locations/floors error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/locations/floors — สร้างชั้นใหม่ (admin only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);

    const body = await request.json();
    const { buildingId, name, nameEn, floorNumber, departmentIds } = body as {
      buildingId?: number;
      name?: string;
      nameEn?: string;
      floorNumber?: number;
      departmentIds?: number[];
    };

    if (!buildingId || !name?.trim() || !nameEn?.trim() || floorNumber === undefined) {
      return err("MISSING_FIELDS", "กรุณากรอก buildingId, name, nameEn และ floorNumber");
    }

    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building) return err("NOT_FOUND", "ไม่พบอาคารที่ระบุ", 404);

    const floor = await prisma.$transaction(async (tx) => {
      const f = await tx.floor.create({
        data: {
          buildingId,
          name: name.trim(),
          nameEn: nameEn.trim(),
          floorNumber,
        },
      });

      if (departmentIds && departmentIds.length > 0) {
        await tx.floorDepartment.createMany({
          data: departmentIds.map((deptId) => ({
            floorId: f.id,
            departmentId: deptId,
          })),
        });
      }

      return f;
    });

    return ok({ floor });
  } catch (error) {
    console.error("POST /api/locations/floors error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
