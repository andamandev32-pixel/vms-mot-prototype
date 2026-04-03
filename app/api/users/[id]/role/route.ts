import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/auth-config";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

const VALID_ROLES: AppRole[] = ["visitor", "staff", "supervisor", "security", "admin"];

// ─────────────────────────────────────────────────────
// PATCH /api/users/:id/role — เปลี่ยนบทบาทผู้ใช้ (admin only)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const authUser = token ? await verifyToken(token) : null;
    if (!authUser) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (authUser.role !== "admin") {
      return err("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนบทบาทได้", 403);
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return err("INVALID_ID", "รหัสผู้ใช้ไม่ถูกต้อง");
    }

    const body = await request.json();
    const { role } = body as { role?: string };

    if (!role || !VALID_ROLES.includes(role as AppRole)) {
      return err("INVALID_ROLE", `บทบาทไม่ถูกต้อง ต้องเป็น: ${VALID_ROLES.join(", ")}`);
    }

    // ป้องกัน admin เปลี่ยน role ตัวเอง
    if (userId === authUser.id) {
      return err("SELF_ROLE_CHANGE", "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้");
    }

    // Check user exists
    const targetUser = await prisma.userAccount.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return err("USER_NOT_FOUND", "ไม่พบผู้ใช้", 404);
    }

    const updated = await prisma.userAccount.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return ok({ user: updated });
  } catch (error) {
    console.error("PATCH /api/users/:id/role error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
