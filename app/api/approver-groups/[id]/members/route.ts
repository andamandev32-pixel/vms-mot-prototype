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
// GET /api/approver-groups/:id/members — รายชื่อสมาชิก
// ─────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const group = await prisma.approverGroup.findUnique({ where: { id: groupId } });
    if (!group) return err("NOT_FOUND", "ไม่พบกลุ่มผู้อนุมัติ", 404);

    const members = await prisma.approverGroupMember.findMany({
      where: { approverGroupId: groupId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            employeeId: true,
            position: true,
            email: true,
            phone: true,
            departmentId: true,
            department: { select: { id: true, name: true, nameEn: true } },
          },
        },
      },
    });

    return ok({ members });
  } catch (error) {
    console.error("GET /api/approver-groups/[id]/members error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/approver-groups/:id/members — เพิ่มสมาชิก
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
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const group = await prisma.approverGroup.findUnique({ where: { id: groupId } });
    if (!group) return err("NOT_FOUND", "ไม่พบกลุ่มผู้อนุมัติ", 404);

    const body = await request.json();
    const { staffId, canApprove, receiveNotification } = body as {
      staffId?: number;
      canApprove?: boolean;
      receiveNotification?: boolean;
    };

    if (!staffId) return err("MISSING_FIELDS", "กรุณาระบุ staffId");

    // Check staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) return err("STAFF_NOT_FOUND", "ไม่พบพนักงาน", 404);

    // Check if already a member
    const existingMember = await prisma.approverGroupMember.findFirst({
      where: { approverGroupId: groupId, staffId },
    });
    if (existingMember) return err("ALREADY_MEMBER", "พนักงานนี้เป็นสมาชิกอยู่แล้ว");

    const member = await prisma.approverGroupMember.create({
      data: {
        approverGroupId: groupId,
        staffId,
        canApprove: canApprove ?? false,
        receiveNotification: receiveNotification ?? true,
      },
      include: {
        staff: {
          select: { id: true, name: true, nameEn: true, position: true, email: true },
        },
      },
    });

    return ok({ member });
  } catch (error) {
    console.error("POST /api/approver-groups/[id]/members error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/approver-groups/:id/members?staffId=X — ลบสมาชิก
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
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const { searchParams } = new URL(request.url);
    const staffIdStr = searchParams.get("staffId");
    if (!staffIdStr) return err("MISSING_FIELDS", "กรุณาระบุ staffId ใน query parameter");

    const staffId = parseInt(staffIdStr, 10);
    if (isNaN(staffId)) return err("INVALID_ID", "staffId ไม่ถูกต้อง");

    const member = await prisma.approverGroupMember.findFirst({
      where: { approverGroupId: groupId, staffId },
    });
    if (!member) return err("NOT_FOUND", "ไม่พบสมาชิกในกลุ่ม", 404);

    await prisma.approverGroupMember.delete({ where: { id: member.id } });

    return ok({ message: "ลบสมาชิกออกจากกลุ่มสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/approver-groups/[id]/members error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
