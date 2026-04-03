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
// GET /api/visit-slips/config — ดึงค่า Visit Slip Template (default)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    // Get default template or first active one
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
      return ok({ template: null, message: "ยังไม่มีเทมเพลตใบผ่าน" });
    }

    return ok({ template });
  } catch (error) {
    console.error("GET /api/visit-slips/config error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/visit-slips/config — อัปเดตค่า Visit Slip Template (admin)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const body = await request.json();
    const {
      id,
      name,
      nameEn,
      description,
      paperSize,
      paperWidthPx,
      orgName,
      orgNameEn,
      slipTitle,
      footerTextTh,
      footerTextEn,
      showOrgLogo,
      logoUrl,
      logoSizePx,
      isDefault,
      isActive,
      sections,
    } = body;

    // If id is provided, update existing; otherwise update the default template
    let templateId = id;
    if (!templateId) {
      const defaultTemplate = await prisma.visitSlipTemplate.findFirst({
        where: { isDefault: true },
      });
      if (!defaultTemplate) {
        return err("NOT_FOUND", "ไม่พบเทมเพลตใบผ่านเริ่มต้น กรุณาระบุ id", 404);
      }
      templateId = defaultTemplate.id;
    }

    const existing = await prisma.visitSlipTemplate.findUnique({ where: { id: templateId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบเทมเพลตใบผ่าน", 404);

    // Update template main fields
    const template = await prisma.visitSlipTemplate.update({
      where: { id: templateId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(description !== undefined && { description }),
        ...(paperSize !== undefined && { paperSize }),
        ...(paperWidthPx !== undefined && { paperWidthPx }),
        ...(orgName !== undefined && { orgName: orgName.trim() }),
        ...(orgNameEn !== undefined && { orgNameEn: orgNameEn.trim() }),
        ...(slipTitle !== undefined && { slipTitle: slipTitle.trim() }),
        ...(footerTextTh !== undefined && { footerTextTh: footerTextTh.trim() }),
        ...(footerTextEn !== undefined && { footerTextEn: footerTextEn.trim() }),
        ...(showOrgLogo !== undefined && { showOrgLogo }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(logoSizePx !== undefined && { logoSizePx }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Update sections and fields if provided
    if (sections && Array.isArray(sections)) {
      for (const section of sections) {
        if (section.id) {
          await prisma.visitSlipSection.update({
            where: { id: section.id },
            data: {
              ...(section.name !== undefined && { name: section.name }),
              ...(section.nameEn !== undefined && { nameEn: section.nameEn }),
              ...(section.isEnabled !== undefined && { isEnabled: section.isEnabled }),
              ...(section.sortOrder !== undefined && { sortOrder: section.sortOrder }),
            },
          });

          // Update fields within this section
          if (section.fields && Array.isArray(section.fields)) {
            for (const field of section.fields) {
              if (field.id) {
                await prisma.visitSlipField.update({
                  where: { id: field.id },
                  data: {
                    ...(field.label !== undefined && { label: field.label }),
                    ...(field.labelEn !== undefined && { labelEn: field.labelEn }),
                    ...(field.isEnabled !== undefined && { isEnabled: field.isEnabled }),
                    ...(field.isEditable !== undefined && { isEditable: field.isEditable }),
                    ...(field.sortOrder !== undefined && { sortOrder: field.sortOrder }),
                  },
                });
              }
            }
          }
        }
      }
    }

    // Re-fetch with relations
    const updated = await prisma.visitSlipTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          include: { fields: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return ok({ template: updated });
  } catch (error) {
    console.error("PUT /api/visit-slips/config error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
