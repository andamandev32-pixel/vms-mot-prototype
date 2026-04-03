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
// GET /api/visit-purposes/:id/department-rules
// ─────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const { id } = await params;
    const purposeId = parseInt(id, 10);
    if (isNaN(purposeId)) return err("INVALID_ID", "รหัสวัตถุประสงค์ไม่ถูกต้อง");

    const rules = await prisma.visitPurposeDepartmentRule.findMany({
      where: { visitPurposeId: purposeId },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
        approverGroup: { select: { id: true, name: true } },
      },
      orderBy: { id: "asc" },
    });

    return ok({ rules });
  } catch (error) {
    console.error("GET department-rules error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/visit-purposes/:id/department-rules
// ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    if (user.role !== "admin" && user.role !== "supervisor")
      return err("FORBIDDEN", "ไม่มีสิทธิ์ดำเนินการ", 403);

    const { id } = await params;
    const purposeId = parseInt(id, 10);
    if (isNaN(purposeId)) return err("INVALID_ID", "รหัสวัตถุประสงค์ไม่ถูกต้อง");

    const purpose = await prisma.visitPurpose.findUnique({ where: { id: purposeId } });
    if (!purpose) return err("NOT_FOUND", "ไม่พบวัตถุประสงค์", 404);

    const body = await request.json();
    const {
      departmentId,
      requirePersonName = false,
      requireApproval = false,
      approverGroupId = null,
      offerWifi = false,
      acceptFromLine = true,
      acceptFromWeb = true,
      acceptFromKiosk = true,
      acceptFromCounter = true,
      followBusinessHours = false,
      isActive = true,
    } = body;

    if (!departmentId) return err("MISSING_FIELDS", "กรุณาเลือกแผนก");

    const rule = await prisma.visitPurposeDepartmentRule.create({
      data: {
        visitPurposeId: purposeId,
        departmentId,
        requirePersonName,
        requireApproval,
        approverGroupId: requireApproval ? approverGroupId : null,
        offerWifi,
        acceptFromLine,
        acceptFromWeb,
        acceptFromKiosk,
        acceptFromCounter,
        followBusinessHours,
        isActive,
      },
    });

    return ok({ rule });
  } catch (error) {
    console.error("POST department-rules error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
