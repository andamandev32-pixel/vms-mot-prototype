import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/departments — Departments filtered by purposeId
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const purposeId = searchParams.get("purposeId");

    if (!purposeId) {
      return err("purposeId query parameter is required");
    }

    const rules = await prisma.visitPurposeDepartmentRule.findMany({
      where: {
        visitPurposeId: parseInt(purposeId, 10),
        acceptFromCounter: true,
        isActive: true,
      },
      include: {
        department: {
          include: {
            floorDepartments: {
              include: {
                floor: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Return unique departments — เก็บ rule fields ด้วย (requirePersonName, requireApproval)
    // ถ้ามีหลาย rule ต่อ department เดียวกัน (กรณีหายาก) ใช้ OR — ถ้า rule ใดบอกต้องระบุ ก็ถือว่าต้องระบุ
    const departmentMap = new Map<number, { dept: (typeof rules)[0]["department"]; requirePersonName: boolean; requireApproval: boolean }>();
    for (const rule of rules) {
      const existing = departmentMap.get(rule.department.id);
      if (!existing) {
        departmentMap.set(rule.department.id, {
          dept: rule.department,
          requirePersonName: rule.requirePersonName,
          requireApproval: rule.requireApproval,
        });
      } else {
        // OR logic: ถ้ามี rule ใดบังคับ → บังคับ
        existing.requirePersonName = existing.requirePersonName || rule.requirePersonName;
        existing.requireApproval = existing.requireApproval || rule.requireApproval;
      }
    }

    const departments = Array.from(departmentMap.values()).map(({ dept, requirePersonName, requireApproval }) => ({
      id: dept.id,
      name: dept.name,
      nameEn: dept.nameEn,
      requirePersonName,
      requireApproval,
      floors: dept.floorDepartments.map((fd: (typeof dept.floorDepartments)[number]) => ({
        floorId: fd.floor.id,
        floorName: fd.floor.name,
        floorNameEn: fd.floor.nameEn,
        buildingId: fd.floor.building.id,
        buildingName: fd.floor.building.name,
        buildingNameEn: fd.floor.building.nameEn,
      })),
    }));

    return ok({ departments });
  } catch (error) {
    console.error("GET /api/counter/departments error:", error);
    return err("Internal server error", 500);
  }
}
