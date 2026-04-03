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
// PUT /api/visit-purposes/:id — อัปเดตวัตถุประสงค์ (admin only)
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
    const purposeId = parseInt(id, 10);
    if (isNaN(purposeId)) {
      return err("INVALID_ID", "รหัสวัตถุประสงค์ไม่ถูกต้อง");
    }

    const existing = await prisma.visitPurpose.findUnique({ where: { id: purposeId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบวัตถุประสงค์ที่ระบุ", 404);
    }

    const body = await request.json();
    const {
      name, nameEn, icon, allowedEntryModes,
      showOnLine, showOnWeb, showOnKiosk, showOnCounter,
      sortOrder, isActive,
    } = body as {
      name?: string;
      nameEn?: string;
      icon?: string;
      allowedEntryModes?: string;
      showOnLine?: boolean;
      showOnWeb?: boolean;
      showOnKiosk?: boolean;
      showOnCounter?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    };

    const visitPurpose = await prisma.visitPurpose.update({
      where: { id: purposeId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn.trim() }),
        ...(icon !== undefined && { icon: icon?.trim() || null }),
        ...(allowedEntryModes !== undefined && { allowedEntryModes }),
        ...(showOnLine !== undefined && { showOnLine }),
        ...(showOnWeb !== undefined && { showOnWeb }),
        ...(showOnKiosk !== undefined && { showOnKiosk }),
        ...(showOnCounter !== undefined && { showOnCounter }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok({ visitPurpose });
  } catch (error) {
    console.error("PUT /api/visit-purposes/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PATCH /api/visit-purposes/:id — อัปเดตวัตถุประสงค์ (alias for PUT)
// ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PUT(request, ctx);
}

// ─────────────────────────────────────────────────────
// DELETE /api/visit-purposes/:id — ลบวัตถุประสงค์ (admin only)
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
    const purposeId = parseInt(id, 10);
    if (isNaN(purposeId)) {
      return err("INVALID_ID", "รหัสวัตถุประสงค์ไม่ถูกต้อง");
    }

    const existing = await prisma.visitPurpose.findUnique({ where: { id: purposeId } });
    if (!existing) {
      return err("NOT_FOUND", "ไม่พบวัตถุประสงค์ที่ระบุ", 404);
    }

    await prisma.visitPurpose.delete({ where: { id: purposeId } });

    return ok({ message: "ลบวัตถุประสงค์เรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/visit-purposes/[id] error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
