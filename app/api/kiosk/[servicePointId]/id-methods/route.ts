import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// GET /api/kiosk/:servicePointId/id-methods
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

    const docs = await prisma.servicePointDocument.findMany({
      where: { servicePointId: spId },
      include: {
        identityDocumentType: true,
      },
    });

    const methods = docs
      .filter((d) => d.identityDocumentType.isActive)
      .sort((a, b) => a.identityDocumentType.sortOrder - b.identityDocumentType.sortOrder)
      .map((d) => ({
        id: d.identityDocumentType.id,
        code: d.identityDocumentType.name.toLowerCase().replace(/\s+/g, "-"),
        name: d.identityDocumentType.name,
        nameEn: d.identityDocumentType.nameEn,
        icon: d.identityDocumentType.icon || "🪪",
      }));

    return ok({ methods });
  } catch (error) {
    console.error("GET /api/kiosk/[servicePointId]/id-methods error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
