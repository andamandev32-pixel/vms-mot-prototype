import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// POST /api/line/push-message — Send LINE Push Message (Stub)
// ─────────────────────────────────────────────────────
// ⚠️ Stub implementation — logs intent but does not send actual LINE messages
// Production: use @line/bot-sdk client.pushMessage()
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { to, templateId, variables, flexMessage } = body as {
      to: string;          // LINE User ID
      templateId?: string; // template identifier
      variables?: Record<string, string>;
      flexMessage?: unknown; // raw Flex Message JSON
    };

    if (!to) {
      return err("MISSING_TO", "ต้องระบุ LINE User ID (to)");
    }

    // Log the push message intent
    console.log(`[LINE Push] Would send to ${to}:`, {
      templateId,
      variables,
      hasFlexMessage: !!flexMessage,
    });

    // TODO: Production implementation
    // 1. Get channel access token from line_oa_config
    // 2. Build message from template (if templateId) or use flexMessage
    // 3. Replace {{variables}} in template
    // 4. Call LINE Messaging API: client.pushMessage(to, messages)
    // 5. Log result to notification_logs table

    return ok({
      status: "queued",
      to,
      templateId: templateId || "custom",
      sentAt: new Date().toISOString(),
      note: "Stub — message not actually sent. Implement LINE SDK for production.",
    });
  } catch (error) {
    console.error("[LINE Push] Error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
