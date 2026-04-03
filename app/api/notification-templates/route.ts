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
// GET /api/notification-templates — รายการเทมเพลตการแจ้งเตือน
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const triggerEvent = searchParams.get("triggerEvent");
    const isActive = searchParams.get("isActive");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (channel) where.channel = channel;
    if (triggerEvent) where.triggerEvent = triggerEvent;
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const templates = await prisma.notificationTemplate.findMany({
      where,
      include: {
        variables: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ templates });
  } catch (error) {
    console.error("GET /api/notification-templates error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/notification-templates — สร้างเทมเพลตใหม่ (admin)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const body = await request.json();
    const { name, nameEn, triggerEvent, channel, subject, bodyTh, bodyEn, isActive, variables } = body as {
      name?: string;
      nameEn?: string;
      triggerEvent?: string;
      channel?: string;
      subject?: string;
      bodyTh?: string;
      bodyEn?: string;
      isActive?: boolean;
      variables?: string[];
    };

    if (!name?.trim() || !nameEn?.trim() || !triggerEvent?.trim() || !channel?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก name, nameEn, triggerEvent และ channel");
    }
    if (!bodyTh?.trim() || !bodyEn?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก bodyTh และ bodyEn");
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        triggerEvent: triggerEvent.trim(),
        channel: channel.trim(),
        subject: subject?.trim() || null,
        bodyTh: bodyTh.trim(),
        bodyEn: bodyEn.trim(),
        isActive: isActive ?? true,
        ...(variables && variables.length > 0
          ? {
              variables: {
                create: variables.map((v) => ({ variableName: v })),
              },
            }
          : {}),
      },
      include: {
        variables: true,
      },
    });

    return ok({ template });
  } catch (error) {
    console.error("POST /api/notification-templates error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
