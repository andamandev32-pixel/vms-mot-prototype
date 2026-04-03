import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashVisitorPassword,
  createVisitorToken,
  updateVisitorLastLogin,
  VISITOR_COOKIE_NAME,
} from "@/lib/visitor-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, phone, company, idNumber } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      phone?: string;
      company?: string;
      idNumber?: string;
    };

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FIELDS", message: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, รหัสผ่าน, เบอร์โทร)" } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_EMAIL", message: "รูปแบบอีเมลไม่ถูกต้อง" } },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "WEAK_PASSWORD", message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" } },
        { status: 400 }
      );
    }

    // Check if email already registered (visitor with passwordHash = has web account)
    const existing = await prisma.visitor.findFirst({
      where: { email: email.trim().toLowerCase(), passwordHash: { not: null } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_EXISTS", message: "อีเมลนี้ถูกใช้สมัครแล้ว" } },
        { status: 409 }
      );
    }

    // Check if visitor exists by phone/email (may have been created by staff) → link account
    let visitor = await prisma.visitor.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { phone: phone.trim() },
        ],
      },
    });

    const passwordHash = await hashVisitorPassword(password);

    if (visitor) {
      // Link existing visitor record with web auth
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          passwordHash,
          email: email.trim().toLowerCase(),
          isEmailVerified: false,
          registeredChannel: "web",
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new visitor
      const cleanId = idNumber?.trim() || `WEB-${Date.now().toString(36)}`.slice(0, 20);
      visitor = await prisma.visitor.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          company: company?.trim() || null,
          idNumber: cleanId,
          idType: idNumber?.trim() ? "national-id" : "other",
          passwordHash,
          isEmailVerified: false,
          registeredChannel: "web",
          lastLoginAt: new Date(),
        },
      });
    }

    // Create JWT
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
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Visitor register error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" } },
      { status: 500 }
    );
  }
}
