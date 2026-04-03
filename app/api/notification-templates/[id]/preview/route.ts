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

/**
 * Replace {{variable}} placeholders in template text with provided values
 */
function renderTemplate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

// ─────────────────────────────────────────────────────
// POST /api/notification-templates/:id/preview — ตัวอย่างเทมเพลต
// ─────────────────────────────────────────────────────
export async function POST(
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

    const template = await prisma.notificationTemplate.findUnique({
      where: { id: templateId },
      include: { variables: true },
    });
    if (!template) return err("NOT_FOUND", "ไม่พบเทมเพลต", 404);

    const body = await request.json();
    const { variables } = body as { variables?: Record<string, string> };

    // Build sample data from template variables if user didn't provide values
    const sampleData: Record<string, string> = {
      visitorName: "สมชาย ใจดี",
      visitorNameEn: "Somchai Jaidee",
      hostName: "วิชัย รักงาน",
      department: "ฝ่ายเทคโนโลยีสารสนเทศ",
      bookingCode: "VMS-20260401-001",
      date: "01/04/2026",
      time: "09:00",
      purpose: "ประชุม",
      building: "อาคาร A",
      floor: "ชั้น 3",
      company: "บริษัท ตัวอย่าง จำกัด",
      ...variables,
    };

    const renderedSubject = template.subject
      ? renderTemplate(template.subject, sampleData)
      : null;
    const renderedBodyTh = renderTemplate(template.bodyTh, sampleData);
    const renderedBodyEn = renderTemplate(template.bodyEn, sampleData);

    return ok({
      template: {
        id: template.id,
        name: template.name,
        channel: template.channel,
        triggerEvent: template.triggerEvent,
      },
      preview: {
        subject: renderedSubject,
        bodyTh: renderedBodyTh,
        bodyEn: renderedBodyEn,
      },
      variablesUsed: sampleData,
    });
  } catch (error) {
    console.error("POST /api/notification-templates/[id]/preview error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
