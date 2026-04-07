import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, SESSION_COOKIE } from "@/lib/auth";

// LINE API URL
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

/**
 * POST /api/liff/auth
 * Exchange LINE access token → session cookie
 * สำหรับ LIFF pages ที่ต้องการ staff auth (เช่น approve page)
 *
 * ไม่ต้อง login ด้วย username/password — ใช้ LINE token verify ตัวตนแทน
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineAccessToken } = body as { lineAccessToken?: string };

    if (!lineAccessToken?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_TOKEN", message: "กรุณาเปิดผ่าน LINE" } },
        { status: 400 }
      );
    }

    // --- Verify LINE access token → get profile ---
    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${lineAccessToken.trim()}` },
    });
    if (!profileRes.ok) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_LINE_TOKEN", message: "LINE token ไม่ถูกต้อง" } },
        { status: 401 }
      );
    }
    const lineProfile = (await profileRes.json()) as {
      userId: string;
      displayName: string;
    };

    // --- Find UserAccount by LINE userId ---
    const userAccount = await prisma.userAccount.findFirst({
      where: { lineUserId: lineProfile.userId },
    });

    if (!userAccount) {
      // Try finding staff by lineUserId
      const staff = await prisma.staff.findFirst({
        where: { lineUserId: lineProfile.userId },
        include: { department: true },
      });

      if (!staff) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_REGISTERED", message: "LINE นี้ยังไม่ได้ลงทะเบียน" } },
          { status: 404 }
        );
      }

      // Find or create UserAccount for this staff
      let account = await prisma.userAccount.findFirst({
        where: { refId: staff.id, role: { not: "visitor" } },
      });

      if (!account) {
        return NextResponse.json(
          { success: false, error: { code: "NO_ACCOUNT", message: "ไม่พบ account สำหรับพนักงานนี้" } },
          { status: 404 }
        );
      }

      // Create session
      const token = await createToken({
        id: account.id,
        username: account.username || "",
        name: staff.name,
        nameEn: staff.nameEn || "",
        email: account.email || "",
        role: account.role as import("@/lib/auth-config").AppRole,
        departmentId: staff.departmentId ?? null,
        departmentName: staff.department?.name ?? null,
        refId: staff.id,
      });

      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: account.id,
            name: staff.name,
            role: account.role,
            departmentName: staff.department?.name,
          },
        },
      });

      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    // UserAccount found — create session
    const staff = userAccount.refId
      ? await prisma.staff.findUnique({
          where: { id: userAccount.refId },
          include: { department: true },
        })
      : null;

    const displayName = staff?.name || `${userAccount.firstName} ${userAccount.lastName}`;
    const token = await createToken({
      id: userAccount.id,
      username: userAccount.username || "",
      name: displayName,
      nameEn: staff?.nameEn || "",
      email: userAccount.email || "",
      role: userAccount.role as import("@/lib/auth-config").AppRole,
      departmentId: staff?.departmentId ?? null,
      departmentName: staff?.department?.name ?? null,
      refId: userAccount.refId ?? undefined,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: userAccount.id,
          name: displayName,
          role: userAccount.role,
          departmentName: staff?.department?.name,
        },
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/liff/auth error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด" } },
      { status: 500 }
    );
  }
}
