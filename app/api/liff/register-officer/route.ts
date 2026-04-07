import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOfficerRegisteredMessage } from "@/lib/flex/messages";

// LINE API URLs
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/**
 * POST /api/liff/register-officer
 * Combined: ลงทะเบียน Officer ผ่าน LIFF
 * 1. Verify LINE access token → ได้ lineUserId
 * 2. Lookup staff จาก employeeId / nationalId
 * 3. ผูก LINE กับ staff account
 * 4. Assign Rich Menu "officer"
 * 5. ส่ง Flex Message ยืนยัน
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, lineAccessToken } = body as {
      query?: string;
      lineAccessToken?: string;
    };

    // --- Validate ---
    if (!query?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_FIELDS", message: "กรุณากรอกรหัสพนักงาน หรือ เลขบัตรประชาชน" } },
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

    // --- 2. Lookup staff ---
    const searchTerm = query.trim();
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { employeeId: searchTerm },
          { email: searchTerm },
        ],
      },
      include: { department: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: { code: "STAFF_NOT_FOUND", message: "ไม่พบข้อมูลพนักงาน" } },
        { status: 404 }
      );
    }

    // Check if already linked to another LINE account
    if (staff.lineUserId && staff.lineUserId !== lineProfile.userId) {
      return NextResponse.json(
        { success: false, error: { code: "STAFF_LINE_LINKED", message: "พนักงานนี้ผูก LINE อื่นแล้ว" } },
        { status: 409 }
      );
    }

    // Check if this LINE already linked to another staff
    const existingByLine = await prisma.staff.findFirst({
      where: {
        lineUserId: lineProfile.userId,
        id: { not: staff.id },
      },
    });
    if (existingByLine) {
      return NextResponse.json(
        { success: false, error: { code: "LINE_ALREADY_LINKED", message: "LINE นี้ผูกกับพนักงานอื่นแล้ว" } },
        { status: 409 }
      );
    }

    // --- 3. Link LINE to staff ---
    const now = new Date();
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        lineUserId: lineProfile.userId,
        lineDisplayName: lineProfile.displayName,
        lineLinkedAt: now,
      },
    });

    // Also update UserAccount if exists
    const userAccount = await prisma.userAccount.findFirst({
      where: { refId: staff.id, role: { not: "visitor" } },
    });
    if (userAccount) {
      await prisma.userAccount.update({
        where: { id: userAccount.id },
        data: {
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName,
          lineLinkedAt: now,
        },
      });
    }

    // --- 4. Assign Rich Menu "officer" ---
    const config = await prisma.lineOaConfig.findFirst({ where: { isActive: true } });
    if (config?.channelAccessToken && config.richMenuOfficerId) {
      await fetch(
        `https://api.line.me/v2/bot/user/${lineProfile.userId}/richmenu/${config.richMenuOfficerId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${config.channelAccessToken}` },
        }
      ).catch(() => { /* non-critical */ });
    }

    // --- 5. Send confirmation Flex Message ---
    if (config?.channelAccessToken) {
      const flexMsg = await buildOfficerRegisteredMessage({
        officerName: staff.name,
        position: staff.position || "-",
        department: staff.department?.name || "-",
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

    return NextResponse.json({
      success: true,
      data: {
        staff: {
          id: staff.id,
          name: staff.name,
          position: staff.position,
          departmentName: staff.department?.name,
          employeeId: staff.employeeId,
          lineUserId: lineProfile.userId,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/liff/register-officer error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" } },
      { status: 500 }
    );
  }
}
