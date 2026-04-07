import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultFlexTemplates, invalidateTemplateCache } from "@/lib/line-flex-template-data";

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
// GET /api/settings/line-oa/flex-templates
// ดึง Flex Message templates ทั้งหมด (admin)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const dbTemplates = await prisma.lineFlexTemplate.findMany({
      include: templateInclude,
      orderBy: { id: "asc" },
    });

    // Merge with defaults: DB records take priority; states not yet in DB
    // are returned from the static defaults so the UI always sees all 17.
    const dbMap = new Map(dbTemplates.map((t) => [t.stateId, t]));
    const templates = defaultFlexTemplates.map((def) => {
      const db = dbMap.get(def.stateId);
      if (db) return db;
      // Return default shape (no DB id) so the frontend can display it
      return def;
    });

    return ok({ templates });
  } catch (error) {
    console.error("GET /api/settings/line-oa/flex-templates error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/settings/line-oa/flex-templates
// Bulk upsert ทุก template (admin)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const { templates: incoming } = body as {
      templates: Array<{
        stateId: string;
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
      }>;
    };

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return err("INVALID_BODY", "ต้องส่ง templates เป็น array");
    }

    // Run all upserts inside a transaction
    const results = await prisma.$transaction(
      incoming.map((t) =>
        prisma.lineFlexTemplate.upsert({
          where: { stateId: t.stateId },
          create: {
            stateId: t.stateId,
            name: t.name ?? t.stateId,
            nameEn: t.nameEn ?? t.stateId,
            type: t.type ?? "flex",
            isActive: t.isActive ?? true,
            headerTitle: t.headerTitle ?? "",
            headerSubtitle: t.headerSubtitle ?? null,
            headerColor: t.headerColor ?? "primary",
            headerVariant: t.headerVariant ?? "standard",
            showStatusBadge: t.showStatusBadge ?? false,
            statusBadgeText: t.statusBadgeText ?? null,
            showQrCode: t.showQrCode ?? false,
            qrLabel: t.qrLabel ?? null,
            infoBoxText: t.infoBoxText ?? null,
            infoBoxColor: t.infoBoxColor ?? null,
            infoBoxEnabled: t.infoBoxEnabled ?? false,
            updatedBy: user.id,
            rows: t.rows
              ? { create: t.rows.map((r) => ({ label: r.label, variable: r.variable, previewValue: r.previewValue ?? null, enabled: r.enabled ?? true, sortOrder: r.sortOrder })) }
              : undefined,
            buttons: t.buttons
              ? { create: t.buttons.map((b) => ({ label: b.label, variant: b.variant ?? "primary", actionUrl: b.actionUrl ?? null, enabled: b.enabled ?? true, sortOrder: b.sortOrder })) }
              : undefined,
          },
          update: {
            ...(t.name !== undefined && { name: t.name }),
            ...(t.nameEn !== undefined && { nameEn: t.nameEn }),
            ...(t.type !== undefined && { type: t.type }),
            ...(t.isActive !== undefined && { isActive: t.isActive }),
            ...(t.headerTitle !== undefined && { headerTitle: t.headerTitle }),
            ...(t.headerSubtitle !== undefined && { headerSubtitle: t.headerSubtitle }),
            ...(t.headerColor !== undefined && { headerColor: t.headerColor }),
            ...(t.headerVariant !== undefined && { headerVariant: t.headerVariant }),
            ...(t.showStatusBadge !== undefined && { showStatusBadge: t.showStatusBadge }),
            ...(t.statusBadgeText !== undefined && { statusBadgeText: t.statusBadgeText }),
            ...(t.showQrCode !== undefined && { showQrCode: t.showQrCode }),
            ...(t.qrLabel !== undefined && { qrLabel: t.qrLabel }),
            ...(t.infoBoxText !== undefined && { infoBoxText: t.infoBoxText }),
            ...(t.infoBoxColor !== undefined && { infoBoxColor: t.infoBoxColor }),
            ...(t.infoBoxEnabled !== undefined && { infoBoxEnabled: t.infoBoxEnabled }),
            updatedBy: user.id,
          },
          include: templateInclude,
        })
      )
    );

    // For upserted records that have rows/buttons in the payload, we need to
    // replace child rows/buttons (delete old + create new) in a second pass
    // because Prisma upsert doesn't support deleteMany on nested relations.
    for (let i = 0; i < incoming.length; i++) {
      const t = incoming[i];
      const saved = results[i];
      if (!saved) continue;

      if (t.rows) {
        await prisma.lineFlexTemplateRow.deleteMany({ where: { templateId: saved.id } });
        if (t.rows.length > 0) {
          await prisma.lineFlexTemplateRow.createMany({
            data: t.rows.map((r) => ({
              templateId: saved.id,
              label: r.label,
              variable: r.variable,
              previewValue: r.previewValue ?? null,
              enabled: r.enabled ?? true,
              sortOrder: r.sortOrder,
            })),
          });
        }
      }

      if (t.buttons) {
        await prisma.lineFlexTemplateButton.deleteMany({ where: { templateId: saved.id } });
        if (t.buttons.length > 0) {
          await prisma.lineFlexTemplateButton.createMany({
            data: t.buttons.map((b) => ({
              templateId: saved.id,
              label: b.label,
              variant: b.variant ?? "primary",
              actionUrl: b.actionUrl ?? null,
              enabled: b.enabled ?? true,
              sortOrder: b.sortOrder,
            })),
          });
        }
      }
    }

    // Re-fetch with relations after child replacement
    const templates = await prisma.lineFlexTemplate.findMany({
      include: templateInclude,
      orderBy: { id: "asc" },
    });

    // Invalidate template cache so next message send uses fresh data
    invalidateTemplateCache();

    return ok({ templates });
  } catch (error) {
    console.error("PUT /api/settings/line-oa/flex-templates error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
