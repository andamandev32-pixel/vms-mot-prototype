import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyVisitorPassword,
  createVisitorToken,
  updateVisitorLastLogin,
  VISITOR_COOKIE_NAME,
} from "@/lib/visitor-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FIELDS", message: "กรุณากรอกอีเมลและรหัสผ่าน" } },
        { status: 400 }
      );
    }

    // Find visitor with password (web-registered)
    const visitor = await prisma.visitor.findFirst({
      where: { email: email.trim().toLowerCase(), passwordHash: { not: null } },
    });

    if (!visitor || !visitor.passwordHash) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" } },
        { status: 401 }
      );
    }

    if (visitor.isBlocked) {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_BLOCKED", message: "บัญชีของคุณถูกบล็อก กรุณาติดต่อเจ้าหน้าที่" } },
        { status: 403 }
      );
    }

    const passwordValid = await verifyVisitorPassword(password, visitor.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" } },
        { status: 401 }
      );
    }

    await updateVisitorLastLogin(visitor.id);

    const token = await createVisitorToken({
      id: visitor.id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email!,
      phone: visitor.phone,
      company: visitor.company,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        visitor: {
          id: visitor.id,
          firstName: visitor.firstName,
          lastName: visitor.lastName,
          email: visitor.email,
          phone: visitor.phone,
          company: visitor.company,
        },
      },
    });

    response.cookies.set(VISITOR_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Visitor login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" } },
      { status: 500 }
    );
  }
}
