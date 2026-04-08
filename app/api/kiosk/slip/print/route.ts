import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/slip/print — Record slip print status
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { entryId, printed } = body as {
      entryId?: number;
      printed?: boolean;
      printMethod?: string;
    };

    if (!entryId) return err("MISSING_FIELDS", "กรุณาระบุ entryId");

    const entry = await prisma.visitEntry.findUnique({ where: { id: entryId } });
    if (!entry) return err("NOT_FOUND", "ไม่พบข้อมูล entry", 404);

    await prisma.visitEntry.update({
      where: { id: entryId },
      data: { slipPrinted: printed !== false },
    });

    return ok({ updated: true, slipPrinted: printed !== false });
  } catch (error) {
    console.error("POST /api/kiosk/slip/print error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
