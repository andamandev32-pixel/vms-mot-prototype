import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// POST /api/users/me/change-password — เปลี่ยนรหัสผ่านตัวเอง
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const authUser = token ? await verifyToken(token) : null;
    if (!authUser) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword?.trim() || !newPassword?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่");
    }

    if (newPassword.length < 8) {
      return err("WEAK_PASSWORD", "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
    }

    // Fetch current password hash
    const account = await prisma.userAccount.findUnique({
      where: { id: authUser.id },
      select: { passwordHash: true },
    });

    if (!account) {
      return err("USER_NOT_FOUND", "ไม่พบบัญชีผู้ใช้", 404);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, account.passwordHash);
    if (!isValid) {
      return err("WRONG_PASSWORD", "รหัสผ่านปัจจุบันไม่ถูกต้อง", 401);
    }

    // Hash and update new password
    const newHash = await hashPassword(newPassword);
    await prisma.userAccount.update({
      where: { id: authUser.id },
      data: { passwordHash: newHash },
    });

    return ok({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("POST /api/users/me/change-password error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
