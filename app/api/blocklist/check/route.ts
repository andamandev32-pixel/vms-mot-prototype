import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// POST /api/blocklist/check — ตรวจสอบว่าบุคคลถูกบล็อกหรือไม่
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const { idNumber, firstName, lastName } = body as {
      idNumber?: string;
      firstName?: string;
      lastName?: string;
    };

    // Strategy 1: Check by idNumber via visitor table
    if (idNumber?.trim()) {
      const visitor = await prisma.visitor.findFirst({
        where: { idNumber: idNumber.trim() },
        select: { id: true, isBlocked: true },
      });

      if (visitor && visitor.isBlocked) {
        const blockEntry = await prisma.blocklist.findFirst({
          where: { visitorId: visitor.id, isActive: true },
          orderBy: { addedAt: "desc" },
        });

        return ok({
          isBlocked: true,
          blockReason: blockEntry?.reason || "บุคคลต้องห้าม",
          blockType: blockEntry?.type || "permanent",
        });
      }

      // Also check blocklist directly by name from visitor
      if (visitor) {
        return ok({ isBlocked: false, blockReason: null, blockType: null });
      }
    }

    // Strategy 2: Check by firstName + lastName in blocklist
    if (firstName?.trim() && lastName?.trim()) {
      const blockEntry = await prisma.blocklist.findFirst({
        where: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isActive: true,
        },
        orderBy: { addedAt: "desc" },
      });

      if (blockEntry) {
        // Check expiry
        if (blockEntry.expiryDate && new Date(blockEntry.expiryDate) < new Date()) {
          return ok({ isBlocked: false, blockReason: null, blockType: null });
        }

        return ok({
          isBlocked: true,
          blockReason: blockEntry.reason,
          blockType: blockEntry.type,
        });
      }
    }

    return ok({ isBlocked: false, blockReason: null, blockType: null });
  } catch (error) {
    console.error("POST /api/blocklist/check error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
