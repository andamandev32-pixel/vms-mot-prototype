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
// POST /api/business-hours/holidays — เพิ่มวันหยุด (admin only)
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
    const { date, name, description } = body as {
      date?: string;
      name?: string;
      description?: string;
    };

    if (!date?.trim() || !name?.trim()) {
      return err("MISSING_FIELDS", "กรุณากรอก date และ name");
    }

    // Create a holiday as a business hours rule with type "holiday"
    const holiday = await prisma.businessHoursRule.create({
      data: {
        name: name.trim(),
        nameEn: name.trim(), // Use same name for English if not provided
        type: "holiday",
        specificDate: new Date(date),
        openTime: new Date("1970-01-01T00:00:00"),
        closeTime: new Date("1970-01-01T00:00:00"),
        allowWalkin: false,
        allowKiosk: false,
        notes: description?.trim() || null,
        isActive: true,
      },
    });

    return ok({ holiday });
  } catch (error) {
    console.error("POST /api/business-hours/holidays error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/business-hours/holidays?date=YYYY-MM-DD — ลบวันหยุด (admin only)
// ─────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return err("MISSING_FIELDS", "กรุณาระบุ date เป็น query parameter (YYYY-MM-DD)");
    }

    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return err("INVALID_DATE", "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)");
    }

    // Delete holiday rules matching the date
    const deleted = await prisma.businessHoursRule.deleteMany({
      where: {
        type: "holiday",
        specificDate: targetDate,
      },
    });

    if (deleted.count === 0) {
      return err("NOT_FOUND", "ไม่พบวันหยุดในวันที่ระบุ", 404);
    }

    return ok({ message: "ลบวันหยุดเรียบร้อยแล้ว", deletedCount: deleted.count });
  } catch (error) {
    console.error("DELETE /api/business-hours/holidays error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
