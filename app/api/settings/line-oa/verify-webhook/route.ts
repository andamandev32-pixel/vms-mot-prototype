import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// POST /api/settings/line-oa/verify-webhook — ตรวจสอบ webhook URL (admin)
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

    const config = await prisma.lineOaConfig.findFirst();
    if (!config?.webhookUrl) {
      return err("NO_WEBHOOK_URL", "ยังไม่ได้ตั้งค่า Webhook URL");
    }

    // Test the webhook URL by sending a POST request
    const testRes = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: [] }),
    });

    const verified = testRes.ok;
    const now = new Date();

    // Update test result in DB
    await prisma.lineOaConfig.update({
      where: { id: config.id },
      data: {
        lastTestAt: now,
        lastTestResult: verified
          ? "success"
          : `failed (${testRes.status})`,
      },
    });

    return ok({
      verified,
      statusCode: testRes.status,
      message: verified
        ? "Webhook URL ตรวจสอบสำเร็จ"
        : `Webhook URL ตอบกลับ ${testRes.status}`,
      verifiedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/settings/line-oa/verify-webhook error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
