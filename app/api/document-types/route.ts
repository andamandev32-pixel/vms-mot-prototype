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
// GET /api/document-types — รายการประเภทเอกสารทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const documentTypes = await prisma.documentType.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return ok({ documentTypes });
  } catch (error) {
    console.error("GET /api/document-types error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// POST /api/document-types — สร้างประเภทเอกสารใหม่ (admin only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
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

    if (!name?.trim() || !nameEn?.trim() || !category?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก name, nameEn และ category");
    }

    const documentType = await prisma.documentType.create({
      data: {
        name: name.trim(),
        nameEn: nameEn.trim(),
        category: category.trim(),
        isRequired: isRequired ?? false,
        requirePhoto: requirePhoto ?? false,
        description: description?.trim() || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return ok({ documentType });
  } catch (error) {
    console.error("POST /api/document-types error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
