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
// GET /api/pdpa/config — ดึงค่า PDPA Consent Config ปัจจุบัน
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    // Get the active PDPA config
    const config = await prisma.pdpaConsentConfig.findFirst({
      where: { isActive: true },
      include: {
        updatedByStaff: {
          select: { id: true, name: true, nameEn: true },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 5,
        },
      },
      orderBy: { version: "desc" },
    });

    if (!config) {
      return ok({ config: null, message: "ยังไม่มีการตั้งค่า PDPA" });
    }

    return ok({ config });
  } catch (error) {
    console.error("GET /api/pdpa/config error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/pdpa/config — อัปเดตค่า PDPA Consent Config (admin)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const body = await request.json();
    const {
      id,
      textTh,
      textEn,
      retentionDays,
      requireScroll,
      displayChannels,
      isActive,
      version,
      changeNote,
    } = body as {
      id?: number;
      textTh?: string;
      textEn?: string;
      retentionDays?: number;
      requireScroll?: boolean;
      displayChannels?: string[];
      isActive?: boolean;
      version?: number;
      changeNote?: string;
    };

    // Find the config to update
    let configId = id;
    if (!configId) {
      const activeConfig = await prisma.pdpaConsentConfig.findFirst({
        where: { isActive: true },
        orderBy: { version: "desc" },
      });
      if (!activeConfig) {
        // Create a new config if none exists
        if (!textTh?.trim() || !textEn?.trim()) {
          return err("MISSING_FIELDS", "กรุณากรอก textTh และ textEn");
        }
        const newConfig = await prisma.pdpaConsentConfig.create({
          data: {
            textTh: textTh.trim(),
            textEn: textEn.trim(),
            retentionDays: retentionDays ?? 90,
            requireScroll: requireScroll ?? true,
            displayChannels: displayChannels ?? ["kiosk", "line", "web"],
            isActive: true,
            version: 1,
            updatedBy: user.id ?? null,
          },
        });
        return ok({ config: newConfig });
      }
      configId = activeConfig.id;
    }

    const existing = await prisma.pdpaConsentConfig.findUnique({ where: { id: configId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบการตั้งค่า PDPA", 404);

    // Determine new version number
    const newVersion = version ?? existing.version + 1;

    // Update the config
    const config = await prisma.pdpaConsentConfig.update({
      where: { id: configId },
      data: {
        ...(textTh !== undefined && { textTh: textTh.trim() }),
        ...(textEn !== undefined && { textEn: textEn.trim() }),
        ...(retentionDays !== undefined && { retentionDays }),
        ...(requireScroll !== undefined && { requireScroll }),
        ...(displayChannels !== undefined && { displayChannels }),
        ...(isActive !== undefined && { isActive }),
        version: newVersion,
        updatedBy: user.id ?? null,
      },
    });

    // Create a version snapshot
    await prisma.pdpaConsentVersion.create({
      data: {
        configId: config.id,
        version: newVersion,
        textTh: config.textTh,
        textEn: config.textEn,
        retentionDays: config.retentionDays,
        requireScroll: config.requireScroll,
        displayChannels: config.displayChannels as object,
        isActive: config.isActive,
        effectiveDate: new Date(),
        changedBy: user.id ?? null,
        changeNote: changeNote?.trim() || null,
      },
    });

    // Re-fetch with relations
    const updated = await prisma.pdpaConsentConfig.findUnique({
      where: { id: config.id },
      include: {
        updatedByStaff: {
          select: { id: true, name: true, nameEn: true },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 5,
        },
      },
    });

    return ok({ config: updated });
  } catch (error) {
    console.error("PUT /api/pdpa/config error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
