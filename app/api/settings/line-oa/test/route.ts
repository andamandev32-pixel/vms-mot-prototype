import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// POST /api/settings/line-oa/test — ทดสอบส่ง LINE message (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const { userId } = body as { userId?: string };

    if (!userId?.trim()) {
      return err("MISSING_USER_ID", "กรุณาระบุ LINE User ID ปลายทาง");
    }

    // Get access token from DB
    const config = await prisma.lineOaConfig.findFirst();
    const accessToken = config?.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!accessToken) {
      return err("NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Channel Access Token");
    }

    // Send test message via LINE Push API
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: userId.trim(),
        messages: [
          {
            type: "text",
            text: "✅ ทดสอบจากระบบ eVMS สำเร็จ!\n\nระบบ LINE OA เชื่อมต่อเรียบร้อยแล้ว 🎉",
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[LINE Test] API Error:", errorText);
      return err("LINE_API_ERROR", `LINE API Error: ${res.status} — ${errorText}`, 502);
    }

    return ok({
      message: "ส่งข้อความ LINE ทดสอบสำเร็จ",
      userId: userId.trim(),
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/settings/line-oa/test error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
