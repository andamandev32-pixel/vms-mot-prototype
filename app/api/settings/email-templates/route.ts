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

// GET /api/settings/email-templates — List all email notification templates
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const templates = await prisma.emailNotificationTemplate.findMany({
      orderBy: { id: "asc" },
    });

    return ok({ data: templates, total: templates.length });
  } catch (error) {
    console.error("GET /api/settings/email-templates error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
