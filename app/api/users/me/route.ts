import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// GET /api/users/me — ดึงโปรไฟล์ผู้ใช้ปัจจุบัน
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const authUser = token ? await verifyToken(token) : null;
    if (!authUser) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const account = await prisma.userAccount.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        role: true,
        refId: true,
        isActive: true,
        isEmailVerified: true,
        lineUserId: true,
        lineDisplayName: true,
        lineLinkedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return err("USER_NOT_FOUND", "ไม่พบบัญชีผู้ใช้", 404);
    }

    // Lookup staff/visitor data via refId
    let staffData = null;
    let visitorData = null;

    if (account.userType === "staff" && account.refId) {
      staffData = await prisma.staff.findUnique({
        where: { id: account.refId },
        select: {
          id: true,
          employeeId: true,
          name: true,
          nameEn: true,
          position: true,
          departmentId: true,
          email: true,
          phone: true,
          avatarUrl: true,
          department: { select: { id: true, name: true } },
        },
      });
    } else if (account.userType === "visitor" && account.refId) {
      visitorData = await prisma.visitor.findUnique({
        where: { id: account.refId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          nameEn: true,
          idNumber: true,
          idType: true,
          company: true,
          phone: true,
          email: true,
          nationality: true,
        },
      });
    }

    return ok({
      user: {
        ...account,
        staff: staffData,
        visitor: visitorData,
      },
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PATCH /api/users/me — อัปเดตโปรไฟล์ตัวเอง
// ─────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("evms_session")?.value;
    const authUser = token ? await verifyToken(token) : null;
    if (!authUser) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const { firstName, lastName, phone } = body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    // Build update data (only provided fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return err("INVALID_INPUT", "ชื่อต้องไม่เป็นค่าว่าง");
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return err("INVALID_INPUT", "นามสกุลต้องไม่เป็นค่าว่าง");
      }
      updateData.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return err("NO_CHANGES", "ไม่มีข้อมูลที่ต้องการอัปเดต");
    }

    const updated = await prisma.userAccount.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return ok({ user: updated });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
