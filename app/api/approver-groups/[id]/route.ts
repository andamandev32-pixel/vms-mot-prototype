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
// PUT /api/approver-groups/:id — แก้ไขกลุ่มผู้อนุมัติ (admin)
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
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) return err("INVALID_ID", "ID ไม่ถูกต้อง");

    const existing = await prisma.approverGroup.findUnique({ where: { id: groupId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบกลุ่มผู้อนุมัติ", 404);

    const body = await request.json();
    const { name, nameEn, description, departmentId, isActive } = body;

    const group = await prisma.approverGroup.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(departmentId !== undefined && { departmentId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        department: { select: { id: true, name: true, nameEn: true } },
        members: {
          include: {
            staff: {
              select: { id: true, name: true, nameEn: true, position: true, email: true },
            },
          },
        },
      },
    });

    return ok({ group });
  } catch (error) {
    console.error("PUT /api/approver-groups/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/approver-groups/:id — ลบกลุ่มผู้อนุมัติ (admin)
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

    const existing = await prisma.approverGroup.findUnique({ where: { id: groupId } });
    if (!existing) return err("NOT_FOUND", "ไม่พบกลุ่มผู้อนุมัติ", 404);

    // Check if group is referenced in department rules
    const ruleCount = await prisma.visitPurposeDepartmentRule.count({
      where: { approverGroupId: groupId },
    });
    if (ruleCount > 0) {
      return err("IN_USE", "ไม่สามารถลบได้ เนื่องจากกลุ่มนี้ถูกใช้งานอยู่ในกฎแผนก");
    }

    // Delete related records first
    await prisma.approverGroupMember.deleteMany({ where: { approverGroupId: groupId } });
    await prisma.approverGroupPurpose.deleteMany({ where: { approverGroupId: groupId } });
    await prisma.approverGroupNotifyChannel.deleteMany({ where: { approverGroupId: groupId } });
    await prisma.approverGroup.delete({ where: { id: groupId } });

    return ok({ message: "ลบกลุ่มผู้อนุมัติสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/approver-groups/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
