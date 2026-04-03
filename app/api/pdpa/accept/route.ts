import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// POST /api/pdpa/accept — ผู้เยี่ยมชมยอมรับ PDPA
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, consentChannel, ipAddress, deviceId } = body as {
      visitorId?: number;
      consentChannel?: string;
      ipAddress?: string;
      deviceId?: string;
    };

    if (!visitorId) {
      return err("MISSING_FIELDS", "กรุณาระบุ visitorId");
    }
    if (!consentChannel) {
      return err("MISSING_FIELDS", "กรุณาระบุ consentChannel");
    }

    // Verify visitor exists
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) return err("VISITOR_NOT_FOUND", "ไม่พบข้อมูลผู้เยี่ยมชม", 404);

    // Get the active PDPA config
    const config = await prisma.pdpaConsentConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });
    if (!config) {
      return err("NO_PDPA_CONFIG", "ไม่พบการตั้งค่า PDPA ที่ใช้งานอยู่", 404);
    }

    // Calculate expiry based on retention days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.retentionDays);

    // Check if visitor already has valid consent for this version
    const existingConsent = await prisma.pdpaConsentLog.findFirst({
      where: {
        visitorId,
        configVersion: config.version,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingConsent) {
      return ok({
        consent: existingConsent,
        message: "ผู้เยี่ยมชมได้ให้ความยินยอมเวอร์ชันนี้แล้ว",
        alreadyConsented: true,
      });
    }

    // Create consent log
    const consent = await prisma.pdpaConsentLog.create({
      data: {
        visitorId,
        configVersion: config.version,
        consentChannel,
        ipAddress: ipAddress || null,
        deviceId: deviceId || null,
        expiresAt,
      },
    });

    return ok({
      consent,
      message: "บันทึกความยินยอม PDPA สำเร็จ",
      alreadyConsented: false,
    });
  } catch (error) {
    console.error("POST /api/pdpa/accept error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
