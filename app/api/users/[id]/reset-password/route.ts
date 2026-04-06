import { NextRequest, NextResponse } from "next/server";
import { verifyToken, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// POST /api/users/:id/reset-password — Admin รีเซ็ตรหัสผ่าน
// ─────────────────────────────────────────────────────
export async function POST(
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
      return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถรีเซ็ตรหัสผ่านได้", 403);
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return err("INVALID_ID", "รหัสผู้ใช้ไม่ถูกต้อง");
    }

    // Check user exists
    const targetUser = await prisma.userAccount.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return err("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);
    }

    // ─── Option A: Admin sets password directly ───
    const body = await request.json().catch(() => ({}));
    const { newPassword } = body as { newPassword?: string };

    if (newPassword) {
      if (newPassword.length < 8) {
        return err("WEAK_PASSWORD", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      }
      const passwordHash = await hashPassword(newPassword);
      await prisma.userAccount.update({
        where: { id: userId },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpires: null,
        },
      });
      return ok({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
    }

    // ─── Option B: Generate reset token & send email ───
    const resetToken = crypto.randomBytes(48).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชั่วโมง

    await prisma.userAccount.update({
      where: { id: userId },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // TODO: Production — ส่งอีเมลแจ้ง reset link ให้ผู้ใช้
    // await sendResetEmail(targetUser.email, resetToken);

    return ok({
      message: "สร้างลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว",
      // ส่ง token กลับเฉพาะ dev เท่านั้น
      ...(process.env.NODE_ENV !== "production" && { resetToken }),
    });
  } catch (error) {
    console.error("POST /api/users/:id/reset-password error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
