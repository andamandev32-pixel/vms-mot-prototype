import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

async function getAccessToken(): Promise<string | null> {
  const config = await prisma.lineOaConfig.findFirst();
  return config?.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
}

// ─────────────────────────────────────────────────────
// POST /api/line/push-message — Send LINE Push Message
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return err("NOT_CONFIGURED", "LINE OA ยังไม่ได้ตั้งค่า Access Token", 500);
    }

    const body = await request.json();
    const { to, messages, flexMessage } = body as {
      to: string;
      messages?: unknown[];
      flexMessage?: unknown;
    };

    if (!to) {
      return err("MISSING_TO", "ต้องระบุ LINE User ID (to)");
    }

    // Build messages array
    let lineMessages: unknown[];
    if (messages && Array.isArray(messages)) {
      lineMessages = messages;
    } else if (flexMessage) {
      lineMessages = [
        {
          type: "flex",
          altText: "การแจ้งเตือนจาก eVMS",
          contents: flexMessage,
        },
      ];
    } else {
      return err("MISSING_MESSAGES", "ต้องระบุ messages หรือ flexMessage");
    }

    // Call LINE Messaging API
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ to, messages: lineMessages }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[LINE Push] API Error:", errorText);
      return err("LINE_API_ERROR", `LINE API Error: ${res.status}`, 502);
    }

    return ok({
      status: "sent",
      to,
      messageCount: lineMessages.length,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[LINE Push] Error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
