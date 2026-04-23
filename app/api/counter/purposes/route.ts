import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/counter/purposes — List visit purposes for counter
export async function GET(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("Unauthorized", 401);

    const purposes = await prisma.visitPurpose.findMany({
      where: { isActive: true },
      include: {
        channelConfigs: { where: { channel: "counter" } },
        departmentRules: {
          where: { acceptFromCounter: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const result = purposes.map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      icon: p.icon,
      requirePhoto: p.channelConfigs[0]?.requirePhoto ?? true,
      allowedDepartmentIds: p.departmentRules.map((r) => r.departmentId),
    }));

    return ok({ purposes: result });
  } catch (error) {
    console.error("GET /api/counter/purposes error:", error);
    return err("Internal server error", 500);
  }
}
