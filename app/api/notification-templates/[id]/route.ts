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
// PUT /api/notification-templates/:id — แก้ไขเทมเพลต (admin)
// ─────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const existing = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบเทมเพลต", 404);

    const body = await request.json();
    const { name, nameEn, triggerEvent, channel, subject, bodyTh, bodyEn, isActive, variables } = body;

    // Update template
    const template = await prisma.notificationTemplate.update({
      where: { id: templateId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(triggerEvent !== undefined && { triggerEvent: triggerEvent.trim() }),
        ...(channel !== undefined && { channel: channel.trim() }),
        ...(subject !== undefined && { subject: subject?.trim() || null }),
        ...(bodyTh !== undefined && { bodyTh: bodyTh.trim() }),
        ...(bodyEn !== undefined && { bodyEn: bodyEn.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { variables: true },
    });

    // Update variables if provided
    if (variables !== undefined && Array.isArray(variables)) {
      await prisma.notificationTemplateVariable.deleteMany({
        where: { templateId },
      });
      if (variables.length > 0) {
        await prisma.notificationTemplateVariable.createMany({
          data: variables.map((v: string) => ({
            templateId,
            variableName: v,
          })),
        });
      }
      // Re-fetch with updated variables
      const updated = await prisma.notificationTemplate.findUnique({
        where: { id: templateId },
        include: { variables: true },
      });
      return ok({ template: updated });
    }

    return ok({ template });
  } catch (error) {
    console.error("PUT /api/notification-templates/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/notification-templates/:id — ลบเทมเพลต (admin)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin") return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const existing = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบเทมเพลต", 404);

    // Delete related variables first
    await prisma.notificationTemplateVariable.deleteMany({ where: { templateId } });
    await prisma.notificationTemplate.delete({ where: { id: templateId } });

    return ok({ message: "ลบเทมเพลตสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/notification-templates/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
