import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/wifi/generate — Generate WiFi credentials
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { servicePointId, entryId, accepted } = body as {
      visitorId?: number;
      servicePointId?: number;
      entryId?: number;
      accepted?: boolean;
    };

    if (!entryId) return err("MISSING_FIELDS", "กรุณาระบุ entryId");
    if (!accepted) return err("WIFI_DECLINED", "ผู้เยี่ยมชมไม่ต้องการ WiFi");

    const entry = await prisma.visitEntry.findUnique({ where: { id: entryId } });
    if (!entry) return err("NOT_FOUND", "ไม่พบข้อมูล entry", 404);

    // Check if already issued
    if (entry.wifiUsername && entry.wifiPassword) {
      const validUntil = new Date();
      validUntil.setHours(17, 0, 0, 0);
      return ok({
        ssid: "MOTS-Guest",
        username: entry.wifiUsername,
        password: entry.wifiPassword,
        validUntil: validUntil.toISOString(),
        validityDisplay: `ถึง 17:00 น. วันนี้`,
        alreadyIssued: true,
      });
    }

    // Get service point for wifi config
    const sp = servicePointId
      ? await prisma.servicePoint.findUnique({ where: { id: servicePointId } })
      : entry.servicePointId
        ? await prisma.servicePoint.findUnique({ where: { id: entry.servicePointId } })
        : null;

    const year = new Date().getFullYear();
    const ssid = sp?.wifiSsid || "MOTS-Guest";
    const password = sp?.wifiPasswordPattern
      ? sp.wifiPasswordPattern.replace("{YYYY}", String(year))
      : `mots${year}`;
    const username = `guest-${entry.entryCode.slice(-8)}`;

    const validUntil = new Date();
    validUntil.setHours(17, 0, 0, 0);

    await prisma.visitEntry.update({
      where: { id: entryId },
      data: { wifiUsername: username, wifiPassword: password },
    });

    return ok({
      ssid,
      username,
      password,
      validUntil: validUntil.toISOString(),
      validityDisplay: `ถึง 17:00 น. วันนี้`,
      alreadyIssued: false,
    });
  } catch (error) {
    console.error("POST /api/kiosk/wifi/generate error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
