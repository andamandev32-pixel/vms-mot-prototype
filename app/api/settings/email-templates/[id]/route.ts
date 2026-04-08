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

// PUT /api/settings/email-templates/:id — Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const existing = await prisma.emailNotificationTemplate.findUnique({
      where: { id: templateId },
    });
    if (!existing) return err("NOT_FOUND", "ไม่พบ template ที่ระบุ", 404);

    const body = await request.json();
    const { subject, bodyTh, bodyEn, isActive } = body as {
      subject?: string;
      bodyTh?: string;
      bodyEn?: string;
      isActive?: boolean;
    };

    const updated = await prisma.emailNotificationTemplate.update({
      where: { id: templateId },
      data: {
        ...(subject !== undefined && { subject }),
        ...(bodyTh !== undefined && { bodyTh }),
        ...(bodyEn !== undefined && { bodyEn }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok({ status: "updated", id: updated.id, updated_at: updated.updatedAt });
  } catch (error) {
    console.error("PUT /api/settings/email-templates/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
