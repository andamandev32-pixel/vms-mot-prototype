import { NextRequest, NextResponse } from "next/server";
import { verifyVisitorToken, createVisitorToken, VISITOR_COOKIE_NAME } from "@/lib/visitor-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const visitor = await verifyVisitorToken(token);
    if (!visitor) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่" } },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: { visitor } });
  } catch (error) {
    console.error("Visitor me error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────
// PATCH /api/auth/visitor/me — update profile
// ─────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }
    const visitor = await verifyVisitorToken(token);
    if (!visitor) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Session หมดอายุ" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, company } = body;

    const updated = await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        ...(firstName && { firstName: String(firstName).trim() }),
        ...(lastName && { lastName: String(lastName).trim() }),
        ...(phone && { phone: String(phone).trim() }),
        ...(company !== undefined && { company: company ? String(company).trim() : null }),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, company: true },
    });

    // Refresh JWT with updated data
    const newToken = await createVisitorToken({
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email || "",
      phone: updated.phone,
      company: updated.company,
    });

    const res = NextResponse.json({ success: true, data: { visitor: updated } });
    res.cookies.set(VISITOR_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });
    return res;
  } catch (error) {
    console.error("Visitor profile update error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
