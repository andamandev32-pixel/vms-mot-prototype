import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────
// GET /api/debug/line-health — ตรวจสอบสถานะ LINE OA config (admin)
// ตรวจ DB config, Channel Access Token, และ webhook endpoint ที่ LINE เห็น
// ─────────────────────────────────────────────────────

const LINE_BOT_INFO_URL = "https://api.line.me/v2/bot/info";
const LINE_WEBHOOK_INFO_URL = "https://api.line.me/v2/bot/channel/webhook/endpoint";

const PLACEHOLDER_SECRETS = new Set([
  "placeholder-channel-secret",
  "placeholder-access-token",
]);

function mask(value: string | null | undefined, keepStart = 4, keepEnd = 2): string {
  if (!value) return "(empty)";
  if (value.length <= keepStart + keepEnd) return "***";
  return `${value.slice(0, keepStart)}…${value.slice(-keepEnd)} (len=${value.length})`;
}

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" } },
      { status: 401 }
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์ดำเนินการนี้" } },
      { status: 403 }
    );
  }

  const checks: Record<string, unknown> = {};
  const problems: string[] = [];

  // 1. DB config
  let dbConfig: Awaited<ReturnType<typeof prisma.lineOaConfig.findFirst>> = null;
  try {
    dbConfig = await prisma.lineOaConfig.findFirst();
    checks.db = {
      ok: true,
      rowExists: !!dbConfig,
      channelId: dbConfig?.channelId ?? null,
      channelSecret: mask(dbConfig?.channelSecret),
      channelAccessToken: mask(dbConfig?.channelAccessToken, 8, 4),
      webhookUrl: dbConfig?.webhookUrl ?? null,
      webhookActive: dbConfig?.webhookActive ?? null,
      isActive: dbConfig?.isActive ?? null,
    };
    if (!dbConfig) problems.push("ไม่มี row ใน `line_oa_config` — รัน seed หรือ POST /api/settings/line-oa");
  } catch (err) {
    checks.db = { ok: false, error: err instanceof Error ? err.message : String(err) };
    problems.push("เชื่อมต่อ DB ไม่ได้ — ตรวจ DATABASE_URL และ firewall ของ MariaDB (ต้อง allow Vercel IPs)");
  }

  const channelSecret = dbConfig?.channelSecret || process.env.LINE_CHANNEL_SECRET || "";
  const channelAccessToken =
    dbConfig?.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

  // 2. Placeholder detection
  const secretIsPlaceholder = PLACEHOLDER_SECRETS.has(channelSecret);
  const tokenIsPlaceholder = PLACEHOLDER_SECRETS.has(channelAccessToken);
  checks.placeholder = { secretIsPlaceholder, tokenIsPlaceholder };
  if (secretIsPlaceholder)
    problems.push("Channel Secret ยังเป็นค่า placeholder จาก seed — อัปเดตผ่าน /web/settings/line-oa");
  if (tokenIsPlaceholder)
    problems.push("Channel Access Token ยังเป็นค่า placeholder จาก seed — อัปเดตผ่าน /web/settings/line-oa");

  // 3. LINE bot info (verify access token works)
  if (channelAccessToken && !tokenIsPlaceholder) {
    try {
      const res = await fetch(LINE_BOT_INFO_URL, {
        headers: { Authorization: `Bearer ${channelAccessToken}` },
      });
      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      checks.botInfo = { ok: res.ok, status: res.status, data };
      if (!res.ok)
        problems.push(`LINE API /v2/bot/info ตอบ ${res.status} — Channel Access Token อาจผิดหรือหมดอายุ`);
    } catch (err) {
      checks.botInfo = { ok: false, error: err instanceof Error ? err.message : String(err) };
      problems.push("Call LINE /v2/bot/info ไม่ได้ — เช็ค outbound network");
    }
  } else {
    checks.botInfo = { ok: false, skipped: "no access token" };
  }

  // 4. Webhook endpoint registered at LINE
  if (channelAccessToken && !tokenIsPlaceholder) {
    try {
      const res = await fetch(LINE_WEBHOOK_INFO_URL, {
        headers: { Authorization: `Bearer ${channelAccessToken}` },
      });
      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      checks.webhookInfo = { ok: res.ok, status: res.status, data };
      if (res.ok) {
        const info = data as { endpoint?: string; active?: boolean };
        const expected = new URL("/api/line/webhook", request.nextUrl.origin).toString();
        if (!info.active) problems.push("LINE Console: webhook ยังไม่ active — เปิด 'Use webhook' ใน Messaging Channel");
        if (info.endpoint && info.endpoint !== expected)
          problems.push(
            `Webhook URL ที่ LINE เห็น (${info.endpoint}) ไม่ตรงกับ deploy URL ปัจจุบัน (${expected})`
          );
      } else {
        problems.push(`LINE API /v2/bot/channel/webhook/endpoint ตอบ ${res.status}`);
      }
    } catch (err) {
      checks.webhookInfo = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    checks.webhookInfo = { ok: false, skipped: "no access token" };
  }

  return NextResponse.json({
    success: true,
    data: {
      summary: problems.length === 0 ? "healthy" : "needs_attention",
      problems,
      checks,
      checkedAt: new Date().toISOString(),
      origin: request.nextUrl.origin,
    },
  });
}
