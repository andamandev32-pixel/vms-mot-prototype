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
// PUT /api/visit-purposes/:id/department-rules/:ruleId
// ─────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "ไม่มีสิทธิ์ดำเนินการ", 403);

    const { ruleId } = await params;
    const ruleIdInt = parseInt(ruleId, 10);
    if (isNaN(ruleIdInt)) return err("INVALID_ID", "รหัสเงื่อนไขไม่ถูกต้อง");

    const existing = await prisma.visitPurposeDepartmentRule.findUnique({ where: { id: ruleIdInt } });
    if (!existing) return err("NOT_FOUND", "ไม่พบเงื่อนไขแผนก", 404);

    const body = await request.json();
    const {
      departmentId,
      requirePersonName,
      requireApproval,
      approverGroupId,
      offerWifi,
      acceptFromLine,
      acceptFromWeb,
      acceptFromKiosk,
      acceptFromCounter,
      isActive,
    } = body;

    const rule = await prisma.visitPurposeDepartmentRule.update({
      where: { id: ruleIdInt },
      data: {
        ...(departmentId !== undefined && { departmentId }),
        ...(requirePersonName !== undefined && { requirePersonName }),
        ...(requireApproval !== undefined && { requireApproval }),
        ...(approverGroupId !== undefined && { approverGroupId: requireApproval ? approverGroupId : null }),
        ...(offerWifi !== undefined && { offerWifi }),
        ...(acceptFromLine !== undefined && { acceptFromLine }),
        ...(acceptFromWeb !== undefined && { acceptFromWeb }),
        ...(acceptFromKiosk !== undefined && { acceptFromKiosk }),
        ...(acceptFromCounter !== undefined && { acceptFromCounter }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok({ rule });
  } catch (error) {
    console.error("PUT department-rule error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; ruleId: string }> },
) {
  return PUT(request, ctx);
}

// ─────────────────────────────────────────────────────
// DELETE /api/visit-purposes/:id/department-rules/:ruleId
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "ไม่มีสิทธิ์ดำเนินการ", 403);

    const { ruleId } = await params;
    const ruleIdInt = parseInt(ruleId, 10);
    if (isNaN(ruleIdInt)) return err("INVALID_ID", "รหัสเงื่อนไขไม่ถูกต้อง");

    const existing = await prisma.visitPurposeDepartmentRule.findUnique({ where: { id: ruleIdInt } });
    if (!existing) return err("NOT_FOUND", "ไม่พบเงื่อนไขแผนก", 404);

    await prisma.visitPurposeDepartmentRule.delete({ where: { id: ruleIdInt } });

    return ok({ message: "ลบเงื่อนไขแผนกสำเร็จ" });
  } catch (error) {
    console.error("DELETE department-rule error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
