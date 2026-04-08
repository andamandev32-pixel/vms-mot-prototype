import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// POST /api/kiosk/pdpa/consent — บันทึกการยินยอม PDPA (public, ก่อนระบุตัวตน)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configVersion, consentChannel, servicePointId, consentGiven } = body as {
      configVersion?: number;
      consentChannel?: string;
      servicePointId?: number;
      consentGiven?: boolean;
      locale?: string;
    };

    if (configVersion == null) {
      return err("MISSING_FIELDS", "กรุณาระบุ configVersion");
    }
    if (!consentGiven) {
      return err("CONSENT_REQUIRED", "ผู้เยี่ยมชมต้องยินยอม PDPA ก่อนดำเนินการต่อ");
    }

    // Verify the config version exists and is active
    const config = await prisma.pdpaConsentConfig.findFirst({
      where: { version: configVersion, isActive: true },
    });
    if (!config) {
      return err("INVALID_CONFIG_VERSION", "ไม่พบเวอร์ชัน PDPA ที่ระบุ หรือไม่ได้ใช้งานแล้ว", 400);
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.retentionDays);

    // Create consent log without visitorId (linked later at checkin)
    const consent = await prisma.pdpaConsentLog.create({
      data: {
        visitorId: null,
        configVersion: config.version,
        consentChannel: consentChannel || "kiosk",
        servicePointId: servicePointId ?? null,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        expiresAt,
      },
    });

    return ok({
      consentId: consent.id,
      recordedAt: consent.consentedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/kiosk/pdpa/consent error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
