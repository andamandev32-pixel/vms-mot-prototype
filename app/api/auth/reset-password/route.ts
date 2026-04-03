import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-utils";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "evms-dev-secret-key-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body as {
      token?: string;
      newPassword?: string;
    };

    // ===== Validate input =====
    if (!token?.trim()) {
      return apiError("MISSING_TOKEN", "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง");
    }
    if (!newPassword?.trim()) {
      return apiError("MISSING_PASSWORD", "กรุณากรอกรหัสผ่านใหม่");
    }
    if (newPassword.length < 8) {
      return apiError("WEAK_PASSWORD", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    }

    // ===== Verify JWT reset token =====
    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return apiError("INVALID_TOKEN", "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ", 400);
    }

    // Check token purpose
    if (payload.purpose !== "password-reset" || !payload.sub) {
      return apiError("INVALID_TOKEN", "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง", 400);
    }

    const userId = Number(payload.sub);

    // ===== Find user with matching reset token =====
    const user = await prisma.userAccount.findFirst({
      where: {
        id: userId,
        resetToken: token,
      },
    });

    if (!user) {
      return apiError(
        "INVALID_TOKEN",
        "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือถูกใช้งานแล้ว",
        400
      );
    }

    // ===== Check token expiry (database-level check) =====
    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      // Clear expired token
      await prisma.userAccount.update({
        where: { id: userId },
        data: { resetToken: null, resetTokenExpires: null },
      });
      return apiError("TOKEN_EXPIRED", "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอใหม่", 400);
    }

    // ===== Hash new password & update =====
    const passwordHash = await hashPassword(newPassword);

    await prisma.userAccount.update({
      where: { id: userId },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return apiSuccess({
      message: "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
