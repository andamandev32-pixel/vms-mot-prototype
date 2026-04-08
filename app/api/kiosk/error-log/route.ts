import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/error-log — Report error to backend
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { servicePointId, errorType, device, stateAtError, message, stackTrace } = body as {
      servicePointId?: number;
      errorType?: string;
      device?: string;
      stateAtError?: string;
      message?: string;
      stackTrace?: string;
    };

    if (!errorType?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ errorType");
    if (!message?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ message");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.kioskErrorLog.count({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
    });
    const errorId = `ERR-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    await prisma.kioskErrorLog.create({
      data: {
        servicePointId: servicePointId || null,
        errorType: errorType.trim(),
        device: device?.trim() || null,
        stateAtError: stateAtError?.trim() || null,
        message: message.trim(),
        stackTrace: stackTrace || null,
      },
    });

    return ok({ logged: true, errorId });
  } catch (error) {
    console.error("POST /api/kiosk/error-log error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
