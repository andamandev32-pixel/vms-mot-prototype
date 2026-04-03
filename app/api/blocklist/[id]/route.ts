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
// PUT /api/blocklist/:id — แก้ไขรายการบุคคลต้องห้าม (admin)
// ─────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { id } = await params;
    const blockId = parseInt(id, 10);
    if (isNaN(blockId)) {
      return err("INVALID_ID", "รหัสไม่ถูกต้อง");
    }

    const existing = await prisma.blocklist.findUnique({ where: { id: blockId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบรายการที่ต้องการแก้ไข", 404);
    }

    const body = await request.json();
    const { reason, type, expiryDate, isActive } = body as {
      reason?: string;
      type?: string;
      expiryDate?: string | null;
      isActive?: boolean;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (reason !== undefined) updateData.reason = reason.trim();
    if (type !== undefined) updateData.type = type.trim();
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.blocklist.update({
      where: { id: blockId },
      data: updateData,
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, name: true, idNumber: true },
        },
        addedByStaff: {
          select: { id: true, name: true, nameEn: true },
        },
      },
    });

    return ok({ blockEntry: updated });
  } catch (error) {
    console.error("PUT /api/blocklist/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/blocklist/:id — ลบรายการบุคคลต้องห้าม (admin)
// ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { id } = await params;
    const blockId = parseInt(id, 10);
    if (isNaN(blockId)) {
      return err("INVALID_ID", "รหัสไม่ถูกต้อง");
    }

    const existing = await prisma.blocklist.findUnique({ where: { id: blockId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบรายการที่ต้องการลบ", 404);
    }

    // Soft delete: set isActive = false
    await prisma.blocklist.update({
      where: { id: blockId },
      data: { isActive: false },
    });

    // If visitor is linked, update visitor.isBlocked = false
    // Only if no other active blocklist entries exist for this visitor
    if (existing.visitorId) {
      const otherActiveBlocks = await prisma.blocklist.count({
        where: {
          visitorId: existing.visitorId,
          isActive: true,
          id: { not: blockId },
        },
      });
      if (otherActiveBlocks === 0) {
        await prisma.visitor.update({
          where: { id: existing.visitorId },
          data: { isBlocked: false },
        });
      }
    }

    return ok({ message: "ลบรายการบุคคลต้องห้ามสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/blocklist/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
