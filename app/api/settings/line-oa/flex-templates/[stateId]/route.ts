import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateTemplateCache } from "@/lib/line-flex-template-data";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

const templateInclude = {
  rows: { orderBy: { sortOrder: "asc" as const } },
  buttons: { orderBy: { sortOrder: "asc" as const } },
};

// ─────────────────────────────────────────────────────
// PATCH /api/settings/line-oa/flex-templates/[stateId]
// อัปเดต Flex Template เฉพาะ state (admin)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stateId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { stateId } = await params;

    const body = await request.json();
    const {
      name, nameEn, type, isActive,
      headerTitle, headerSubtitle, headerColor, headerVariant,
      showStatusBadge, statusBadgeText,
      showQrCode, qrLabel,
      infoBoxText, infoBoxColor, infoBoxEnabled,
      rows, buttons,
    } = body as {
      name?: string;
      nameEn?: string;
      type?: string;
      isActive?: boolean;
      headerTitle?: string;
      headerSubtitle?: string | null;
      headerColor?: string;
      headerVariant?: string;
      showStatusBadge?: boolean;
      statusBadgeText?: string | null;
      showQrCode?: boolean;
      qrLabel?: string | null;
      infoBoxText?: string | null;
      infoBoxColor?: string | null;
      infoBoxEnabled?: boolean;
      rows?: Array<{
        label: string;
        variable: string;
        previewValue?: string | null;
        enabled?: boolean;
        sortOrder: number;
      }>;
      buttons?: Array<{
        label: string;
        variant?: string;
        actionUrl?: string | null;
        enabled?: boolean;
        sortOrder: number;
      }>;
    };

    // Find existing or create from scratch
    let existing = await prisma.lineFlexTemplate.findUnique({
      where: { stateId },
    });

    if (!existing) {
      // Auto-create so the frontend can PATCH a template that only exists as
      // a static default (never persisted to DB yet).
      existing = await prisma.lineFlexTemplate.create({
        data: {
          stateId,
          name: name ?? stateId,
          nameEn: nameEn ?? stateId,
          type: type ?? "flex",
          isActive: isActive ?? true,
          headerTitle: headerTitle ?? "",
          headerColor: headerColor ?? "primary",
          headerVariant: headerVariant ?? "standard",
          showStatusBadge: showStatusBadge ?? false,
          showQrCode: showQrCode ?? false,
          updatedBy: user.id,
        },
      });
    }

    // Build update payload — only include provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { updatedBy: user.id };
    if (name !== undefined) update.name = name;
    if (nameEn !== undefined) update.nameEn = nameEn;
    if (type !== undefined) update.type = type;
    if (isActive !== undefined) update.isActive = isActive;
    if (headerTitle !== undefined) update.headerTitle = headerTitle;
    if (headerSubtitle !== undefined) update.headerSubtitle = headerSubtitle;
    if (headerColor !== undefined) update.headerColor = headerColor;
    if (headerVariant !== undefined) update.headerVariant = headerVariant;
    if (showStatusBadge !== undefined) update.showStatusBadge = showStatusBadge;
    if (statusBadgeText !== undefined) update.statusBadgeText = statusBadgeText;
    if (showQrCode !== undefined) update.showQrCode = showQrCode;
    if (qrLabel !== undefined) update.qrLabel = qrLabel;
    if (infoBoxText !== undefined) update.infoBoxText = infoBoxText;
    if (infoBoxColor !== undefined) update.infoBoxColor = infoBoxColor;
    if (infoBoxEnabled !== undefined) update.infoBoxEnabled = infoBoxEnabled;

    await prisma.lineFlexTemplate.update({
      where: { stateId },
      data: update,
    });

    // Replace child rows if provided
    if (rows) {
      await prisma.lineFlexTemplateRow.deleteMany({ where: { templateId: existing.id } });
      if (rows.length > 0) {
        await prisma.lineFlexTemplateRow.createMany({
          data: rows.map((r) => ({
            templateId: existing.id,
            label: r.label,
            variable: r.variable,
            previewValue: r.previewValue ?? null,
            enabled: r.enabled ?? true,
            sortOrder: r.sortOrder,
          })),
        });
      }
    }

    // Replace child buttons if provided
    if (buttons) {
      await prisma.lineFlexTemplateButton.deleteMany({ where: { templateId: existing.id } });
      if (buttons.length > 0) {
        await prisma.lineFlexTemplateButton.createMany({
          data: buttons.map((b) => ({
            templateId: existing.id,
            label: b.label,
            variant: b.variant ?? "primary",
            actionUrl: b.actionUrl ?? null,
            enabled: b.enabled ?? true,
            sortOrder: b.sortOrder,
          })),
        });
      }
    }

    // Return freshly loaded template with relations
    const template = await prisma.lineFlexTemplate.findUnique({
      where: { stateId },
      include: templateInclude,
    });

    // Invalidate cache for this template
    invalidateTemplateCache(stateId);

    return ok({ template });
  } catch (error) {
    console.error(`PATCH /api/settings/line-oa/flex-templates/[stateId] error:`, error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
