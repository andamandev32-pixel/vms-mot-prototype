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

    // Return unique departments
    const departmentMap = new Map<number, (typeof rules)[0]["department"]>();
    for (const rule of rules) {
      if (!departmentMap.has(rule.department.id)) {
        departmentMap.set(rule.department.id, rule.department);
      }
    }

    const departments = Array.from(departmentMap.values()).map((dept) => ({
      id: dept.id,
      name: dept.name,
      nameEn: dept.nameEn,
      floors: dept.floorDepartments.map((fd) => ({
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
