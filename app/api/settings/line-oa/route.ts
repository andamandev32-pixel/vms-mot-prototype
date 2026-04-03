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
// GET /api/settings/line-oa — ดึงค่า LINE OA config (admin)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const config = await prisma.lineOaConfig.findFirst();

    return ok({ config });
  } catch (error) {
    console.error("GET /api/settings/line-oa error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/settings/line-oa — อัปเดตค่า LINE OA config (admin)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const {
      channelId, channelSecret, channelAccessToken, botBasicId,
      liffAppId, liffEndpointUrl, webhookUrl, webhookActive,
      richMenuVisitorId, richMenuOfficerId, isActive,
    } = body as {
      channelId?: string;
      channelSecret?: string;
      channelAccessToken?: string;
      botBasicId?: string;
      liffAppId?: string;
      liffEndpointUrl?: string;
      webhookUrl?: string;
      webhookActive?: boolean;
      richMenuVisitorId?: string;
      richMenuOfficerId?: string;
      isActive?: boolean;
    };

    const existing = await prisma.lineOaConfig.findFirst();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { updatedBy: user.id };
    if (channelId !== undefined) data.channelId = channelId;
    if (channelSecret !== undefined) data.channelSecret = channelSecret;
    if (channelAccessToken !== undefined) data.channelAccessToken = channelAccessToken;
    if (botBasicId !== undefined) data.botBasicId = botBasicId;
    if (liffAppId !== undefined) data.liffAppId = liffAppId;
    if (liffEndpointUrl !== undefined) data.liffEndpointUrl = liffEndpointUrl;
    if (webhookUrl !== undefined) data.webhookUrl = webhookUrl;
    if (webhookActive !== undefined) data.webhookActive = webhookActive;
    if (richMenuVisitorId !== undefined) data.richMenuVisitorId = richMenuVisitorId;
    if (richMenuOfficerId !== undefined) data.richMenuOfficerId = richMenuOfficerId;
    if (isActive !== undefined) data.isActive = isActive;

    let config;
    if (existing) {
      config = await prisma.lineOaConfig.update({
        where: { id: existing.id },
        data,
      });
    } else {
      if (!channelId || !channelSecret || !channelAccessToken) {
        return err("MISSING_FIELDS", "กรุณากรอก Channel ID, Channel Secret, และ Access Token");
      }
      config = await prisma.lineOaConfig.create({ data });
    }

    return ok({ config });
  } catch (error) {
    console.error("PUT /api/settings/line-oa error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
