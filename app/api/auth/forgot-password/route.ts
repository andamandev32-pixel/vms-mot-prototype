import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "evms-dev-secret-key-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email?.trim()) {
      return apiError("MISSING_EMAIL", "กรุณากรอกอีเมล");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.userAccount.findFirst({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return apiSuccess({
        message: "หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ",
      });
    }

    // Generate reset token (JWT with 24h expiry, containing userId)
    const resetToken = await new SignJWT({
      sub: String(user.id),
      purpose: "password-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Save reset token + expiry to user_accounts
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.userAccount.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: expiresAt,
      },
    });

    // TODO: In production, send email with reset link:
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    // await sendResetPasswordEmail(user.email, resetUrl);

    return apiSuccess({
      message: "หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
