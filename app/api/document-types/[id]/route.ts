import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ===== Helper: ดึง authenticated user จาก cookie =====
async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("evms_session")?.value;
  return token ? await verifyToken(token) : null;
}

// ─────────────────────────────────────────────────────
// PUT /api/document-types/:id — อัปเดตประเภทเอกสาร (admin only)
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
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return err("INVALID_ID", "รหัสประเภทเอกสารไม่ถูกต้อง");
    }

    const existing = await prisma.documentType.findUnique({ where: { id: docId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบประเภทเอกสารที่ระบุ", 404);
    }

    const body = await request.json();
    const { name, nameEn, category, isRequired, requirePhoto, description, isActive, sortOrder } = body as {
      name?: string;
      nameEn?: string;
      category?: string;
      isRequired?: boolean;
      requirePhoto?: boolean;
      description?: string;
      isActive?: boolean;
      sortOrder?: number;
    };

    const documentType = await prisma.documentType.update({
      where: { id: docId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(isRequired !== undefined && { isRequired }),
        ...(requirePhoto !== undefined && { requirePhoto }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return ok({ documentType });
  } catch (error) {
    console.error("PUT /api/document-types/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/document-types/:id — ลบประเภทเอกสาร (admin only)
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
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return err("INVALID_ID", "รหัสประเภทเอกสารไม่ถูกต้อง");
    }

    const existing = await prisma.documentType.findUnique({ where: { id: docId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบประเภทเอกสารที่ระบุ", 404);
    }

    await prisma.documentType.delete({ where: { id: docId } });

    return ok({ message: "ลบประเภทเอกสารเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/document-types/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
