import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// GET /api/visit-slips/template — Public endpoint
// ดึง Visit Slip Template (default) สำหรับ Kiosk / Counter พิมพ์บัตร
// ไม่ต้อง auth เพราะ Kiosk/Counter ไม่ได้ login เป็น admin
// ─────────────────────────────────────────────────────
export async function GET() {
  try {
    let template = await prisma.visitSlipTemplate.findFirst({
      where: { isDefault: true },
      include: {
        sections: {
          include: { fields: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!template) {
      template = await prisma.visitSlipTemplate.findFirst({
        where: { isActive: true },
        include: {
          sections: {
            include: { fields: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    if (!template) {
      return ok({ template: null });
    }

    // Map DB shape → ThermalSection[] shape for frontend
    const sections = template.sections.map((sec) => ({
      id: sec.sectionKey,
      name: sec.name,
      nameEn: sec.nameEn,
      enabled: sec.isEnabled,
      fields: sec.fields.map((f) => ({
        key: f.fieldKey,
        label: f.label,
        labelEn: f.labelEn,
        enabled: f.isEnabled,
        editable: f.isEditable,
      })),
    }));

    return ok({
      template: {
        id: template.id,
        name: template.name,
        logoUrl: template.logoUrl,
        logoSizePx: template.logoSizePx,
        orgName: template.orgName,
        orgNameEn: template.orgNameEn,
        slipTitle: template.slipTitle,
        footerTextTh: template.footerTextTh,
        footerTextEn: template.footerTextEn,
        paperSize: template.paperSize,
        paperWidthPx: template.paperWidthPx,
        sections,
      },
    });
  } catch (error) {
    console.error("GET /api/visit-slips/template error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
