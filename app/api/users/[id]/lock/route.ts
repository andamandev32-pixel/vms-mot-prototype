import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// PATCH /api/users/:id/lock — ล็อก/ปลดล็อกผู้ใช้ (admin only)
// ─────────────────────────────────────────────────────
export async function PATCH(
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
      return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถล็อก/ปลดล็อกผู้ใช้ได้", 403);
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return err("INVALID_ID", "รหัสผู้ใช้ไม่ถูกต้อง");
    }

    const body = await request.json();
    const { isActive } = body as { isActive?: boolean };

    if (typeof isActive !== "boolean") {
      return err("INVALID_INPUT", "กรุณาระบุ isActive เป็น true หรือ false");
    }

    // ป้องกัน admin ล็อกตัวเอง
    if (userId === authUser.id) {
      return err("SELF_LOCK", "ไม่สามารถล็อก/ปลดล็อกบัญชีของตัวเองได้");
    }

    // Check user exists
    const targetUser = await prisma.userAccount.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return err("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);
    }

    const updated = await prisma.userAccount.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return ok({ user: updated });
  } catch (error) {
    console.error("PATCH /api/users/:id/lock error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
