import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// DELETE /api/users/:id/line/unlink — ยกเลิกการเชื่อมต่อ LINE (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const authUser = token ? await verifyToken(token) : null;
    if (!authUser) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (authUser.role !== "admin") {
      return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถยกเลิกการเชื่อมต่อ LINE ได้", 403);
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return err("INVALID_ID", "รหัสผู้ใช้ไม่ถูกต้อง");
    }

    // Check user exists
    const targetUser = await prisma.userAccount.findUnique({
      where: { id: userId },
      select: { id: true, lineUserId: true },
    });
    if (!targetUser) {
      return err("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);
    }

    if (!targetUser.lineUserId) {
      return err("NOT_LINKED", "ผู้ใช้นี้ยังไม่ได้เชื่อมต่อ LINE");
    }

    await prisma.userAccount.update({
      where: { id: userId },
      data: {
        lineUserId: null,
        lineDisplayName: null,
        lineLinkedAt: null,
      },
    });

    return ok({ message: "ยกเลิกการเชื่อมต่อ LINE เรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/users/:id/line/unlink error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
