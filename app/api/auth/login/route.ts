import { NextRequest, NextResponse } from "next/server";
import { findUser, verifyPassword, createToken, updateLastLogin, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body as {
      usernameOrEmail?: string;
      password?: string;
    };

    // Validate input
    if (!usernameOrEmail?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FIELDS", message: "กรุณากรอก username/email และรหัสผ่าน" } },
        { status: 400 }
      );
    }

    // Find user by username or email (query from MariaDB)
    const user = await findUser(usernameOrEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง" } },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === "inactive") {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_INACTIVE", message: "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ" } },
        { status: 403 }
      );
    }
    if (user.status === "locked") {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_LOCKED", message: "บัญชีนี้ถูกล็อก กรุณาติดต่อผู้ดูแลระบบ" } },
        { status: 403 }
      );
    }

    // Verify password (async bcrypt.compare)
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง" } },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Create JWT token
    const token = await createToken(user);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          nameEn: user.nameEn,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.departmentName,
          refId: user.refId ?? null,
        },
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" } },
      { status: 500 }
    );
  }
}
