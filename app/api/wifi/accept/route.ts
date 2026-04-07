import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

/**
 * POST /api/wifi/accept
 * ผู้ใช้ยอมรับ WiFi → สร้าง credentials + (optional) ส่งทาง LINE
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { entryId, sendViaLine } = body as {
      entryId?: number;
      sendViaLine?: boolean;
    };

    if (!entryId) {
      return err("MISSING_FIELDS", "กรุณาระบุ entryId");
    }

    // Find the visit entry
    const entry = await prisma.visitEntry.findUnique({
      where: { id: entryId },
      include: {
        appointment: { select: { id: true, offerWifi: true } },
        visitor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!entry) return err("NOT_FOUND", "ไม่พบรายการ check-in", 404);

    if (entry.status !== "checked-in") {
      return err("INVALID_STATUS", `ไม่สามารถออก WiFi สำหรับสถานะ "${entry.status}"`);
    }

    // Check if WiFi already issued
    if (entry.wifiUsername && entry.wifiPassword) {
      return ok({
        wifi: {
          ssid: "MOTS-Guest",
          username: entry.wifiUsername,
          password: entry.wifiPassword,
        },
        alreadyIssued: true,
        lineSent: false,
      });
    }

    // Generate WiFi credentials
    const wifiUsername = `guest-${entry.entryCode.slice(-8).toLowerCase()}`;
    const wifiPassword = `mots${Date.now().toString(36).slice(-6)}`;
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 8); // 8 hours validity

    // Update entry with WiFi credentials
    await prisma.visitEntry.update({
      where: { id: entryId },
      data: {
        wifiUsername,
        wifiPassword,
      },
    });

    // TODO: If sendViaLine && visitor has LINE linked → push WiFi credentials via LINE
    let lineSent = false;
    if (sendViaLine) {
      // Will be implemented when LINE push is fully integrated
      lineSent = false;
    }

    return ok({
      wifi: {
        ssid: "MOTS-Guest",
        username: wifiUsername,
        password: wifiPassword,
        validUntil: validUntil.toISOString(),
      },
      lineSent,
    });
  } catch (error) {
    console.error("POST /api/wifi/accept error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
