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
// POST /api/visit-slips/preview — ตัวอย่างใบผ่าน (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const body = await request.json();
    const { templateId } = body as { templateId?: number };

    // Get the template
    let template;
    if (templateId) {
      template = await prisma.visitSlipTemplate.findUnique({
        where: { id: templateId },
        include: {
          sections: {
            where: { isEnabled: true },
            include: {
              fields: {
                where: { isEnabled: true },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    } else {
      template = await prisma.visitSlipTemplate.findFirst({
        where: { isDefault: true },
        include: {
          sections: {
            where: { isEnabled: true },
            include: {
              fields: {
                where: { isEnabled: true },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    if (!template) {
      return err("NOT_FOUND", "ไม่พบเทมเพลตใบผ่าน", 404);
    }

    // Generate sample slip data
    const sampleSlip = {
      template: {
        id: template.id,
        name: template.name,
        paperSize: template.paperSize,
        paperWidthPx: template.paperWidthPx,
      },
      header: {
        orgName: template.orgName || "องค์กรตัวอย่าง",
        orgNameEn: template.orgNameEn || "Sample Organization",
        slipTitle: template.slipTitle || "VISITOR PASS",
        showOrgLogo: template.showOrgLogo,
        logoUrl: template.logoUrl,
        logoSizePx: template.logoSizePx,
      },
      visitor: {
        name: "สมชาย ใจดี",
        nameEn: "Somchai Jaidee",
        company: "บริษัท ตัวอย่าง จำกัด",
        idNumber: "1-XXXX-XXXXX-XX-X",
        phone: "08X-XXX-XXXX",
      },
      visit: {
        bookingCode: "VMS-20260401-001",
        purpose: "ประชุม / Meeting",
        hostName: "วิชัย รักงาน",
        department: "ฝ่ายเทคโนโลยีสารสนเทศ",
        building: "อาคาร A",
        floor: "ชั้น 3",
        room: "ห้องประชุม 301",
        checkinAt: "01/04/2026 09:00",
        validUntil: "01/04/2026 17:00",
      },
      qrCode: {
        data: "VMS-20260401-001",
        label: "สแกน QR Code เพื่อตรวจสอบ",
      },
      footer: {
        textTh: template.footerTextTh || "กรุณาติดบัตรให้เห็นชัดเจนตลอดเวลา",
        textEn: template.footerTextEn || "Please wear this badge visibly at all times",
      },
      sections: template.sections,
      generatedAt: new Date().toISOString(),
    };

    return ok({ slip: sampleSlip });
  } catch (error) {
    console.error("POST /api/visit-slips/preview error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
