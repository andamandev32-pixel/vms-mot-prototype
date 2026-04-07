import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashVisitorPassword,
  createVisitorToken,
  VISITOR_COOKIE_NAME,
} from "@/lib/visitor-auth";
import { buildVisitorRegisteredMessage } from "@/lib/flex/messages";

// LINE API URLs
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/**
 * POST /api/liff/register
 * Combined: ลงทะเบียน Visitor ผ่าน LIFF
 * 1. Verify LINE access token → ได้ lineUserId
 * 2. สร้าง/link visitor account
 * 3. ผูก LINE account
 * 4. Assign Rich Menu "visitor"
 * 5. ส่ง Flex Message ยืนยัน
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      company,
      idNumber,
      lineAccessToken,
    } = body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      company?: string;
      idNumber?: string;
      lineAccessToken?: string;
    };

    // --- Validate ---
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FIELDS", message: "กรุณากรอก ชื่อ, นามสกุล, เบอร์โทร" } },
        { status: 400 }
      );
    }

    if (!lineAccessToken?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_LINE_TOKEN", message: "กรุณาเปิดผ่าน LINE" } },
        { status: 400 }
      );
    }

    // --- 1. Verify LINE access token → get profile ---
    const profileRes = await fetch(LINE_PROFILE_URL, {
      headers: { Authorization: `Bearer ${lineAccessToken.trim()}` },
    });
    if (!profileRes.ok) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_LINE_TOKEN", message: "LINE token ไม่ถูกต้องหรือหมดอายุ" } },
        { status: 401 }
      );
    }
    const lineProfile = (await profileRes.json()) as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    // Check if this LINE already linked
    const existingByLine = await prisma.visitor.findFirst({
      where: { lineUserId: lineProfile.userId },
    });
    if (existingByLine) {
      return NextResponse.json(
        { success: false, error: { code: "LINE_ALREADY_REGISTERED", message: "LINE นี้ลงทะเบียนแล้ว" } },
        { status: 409 }
      );
    }

    // --- 2. Create or link visitor ---
    let visitor = await prisma.visitor.findFirst({
      where: {
        OR: [
          ...(email?.trim() ? [{ email: email.trim().toLowerCase() }] : []),
          { phone: phone.trim() },
        ],
      },
    });

    // Auto-generate password for LINE registration
    const autoPassword = `LINE-${Date.now().toString(36)}`;
    const passwordHash = await hashVisitorPassword(autoPassword);
    const now = new Date();

    if (visitor) {
      // Link existing visitor with LINE
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          ...(email?.trim() ? { email: email.trim().toLowerCase() } : {}),
          ...(company?.trim() ? { company: company.trim() } : {}),
          ...(idNumber?.trim() ? { idNumber: idNumber.trim() } : {}),
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName,
          lineLinkedAt: now,
          registeredChannel: "line",
          lastLoginAt: now,
          // Don't overwrite existing password
          ...(!visitor.passwordHash ? { passwordHash } : {}),
        },
      });
    } else {
      const cleanId = idNumber?.trim() || `LINE-${Date.now().toString(36)}`.slice(0, 20);
      visitor = await prisma.visitor.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email?.trim()?.toLowerCase() || null,
          phone: phone.trim(),
          company: company?.trim() || null,
          idNumber: cleanId,
          idType: idNumber?.trim() ? "national-id" : "other",
          passwordHash,
          isEmailVerified: false,
          registeredChannel: "line",
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName,
          lineLinkedAt: now,
          lastLoginAt: now,
        },
      });
    }

    // --- 3. Assign Rich Menu "visitor" ---
    const config = await prisma.lineOaConfig.findFirst({ where: { isActive: true } });
    if (config?.channelAccessToken && config.richMenuVisitorId) {
      await fetch(
        `https://api.line.me/v2/bot/user/${lineProfile.userId}/richmenu/${config.richMenuVisitorId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${config.channelAccessToken}` },
        }
      ).catch(() => { /* non-critical */ });
    }

    // --- 4. Send confirmation Flex Message ---
    if (config?.channelAccessToken) {
      const flexMsg = buildVisitorRegisteredMessage({
        visitorName: `${visitor.firstName} ${visitor.lastName}`,
        company: visitor.company || "-",
        phone: visitor.phone || "-",
        date: now.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      await fetch(LINE_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineProfile.userId,
          messages: [flexMsg],
        }),
      }).catch(() => { /* non-critical */ });
    }

    // --- 5. Create JWT & set cookie ---
    const token = await createVisitorToken({
      id: visitor.id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email || "",
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
          lineUserId: lineProfile.userId,
        },
      },
    });

    response.cookies.set(VISITOR_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // LIFF runs in LINE WebView → needs sameSite=none
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/liff/register error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" } },
      { status: 500 }
    );
  }
}
