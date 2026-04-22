import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// GET /api/kiosk/:servicePointId/purposes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ servicePointId: string }> },
) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const { servicePointId } = await params;
    const spId = parseInt(servicePointId, 10);
    if (isNaN(spId)) return err("INVALID_ID", "servicePointId ไม่ถูกต้อง");

    const spPurposes = await prisma.servicePointPurpose.findMany({
      where: { servicePointId: spId },
      include: {
        visitPurpose: {
          include: {
            channelConfigs: { where: { channel: "kiosk" } },
            departmentRules: {
              where: { isActive: true, acceptFromKiosk: true },
              include: {
                department: {
                  include: {
                    floorDepartments: {
                      include: { floor: { include: { building: true } } },
                      take: 1,
                    },
                  },
                },
                approverGroup: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const purposes = spPurposes
      .filter((sp) => sp.visitPurpose.isActive)
      .sort((a, b) => a.visitPurpose.sortOrder - b.visitPurpose.sortOrder)
      .map((sp) => {
        const p = sp.visitPurpose;
        const kioskChannelCfg = p.channelConfigs[0];
        const requirePhoto = kioskChannelCfg?.requirePhoto ?? true;
        const wifiEnabled = p.departmentRules.some((r) => r.offerWifi);
        return {
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          icon: p.icon || "📋",
          order: p.sortOrder,
          requirePhoto,
          wifiEnabled,
          departments: p.departmentRules.map((r: typeof p.departmentRules[number]) => {
            const fd = r.department.floorDepartments[0];
            return {
              departmentId: r.department.id,
              name: r.department.name,
              nameEn: r.department.nameEn,
              floor: fd?.floor?.name || "",
              floorEn: fd?.floor?.nameEn || "",
              building: fd?.floor?.building?.name || "",
              buildingEn: fd?.floor?.building?.nameEn || "",
              requireApproval: r.requireApproval,
              approverGroupId: r.approverGroupId,
              offerWifi: r.offerWifi,
            };
          }),
        };
      });

    return ok({ purposes });
  } catch (error) {
    console.error("GET /api/kiosk/[servicePointId]/purposes error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
