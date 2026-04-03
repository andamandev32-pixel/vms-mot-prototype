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
// GET /api/business-hours — รายการกฎเวลาทำการทั้งหมด (any authenticated user)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const rules = await prisma.businessHoursRule.findMany({
      orderBy: [{ type: "asc" }, { specificDate: "asc" }, { id: "asc" }],
    });

    return ok({ rules });
  } catch (error) {
    console.error("GET /api/business-hours error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/business-hours — อัปเดตกฎเวลาทำการ (admin only)
// Body: { rules: [...] }
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin" && user.role !== "supervisor") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const { rules } = body as {
      rules?: Array<{
        id?: number;
        name: string;
        nameEn: string;
        type: string;
        daysOfWeek?: number[];
        specificDate?: string;
        openTime: string;
        closeTime: string;
        allowWalkin?: boolean;
        allowKiosk?: boolean;
        notes?: string;
        isActive?: boolean;
      }>;
    };

    if (!Array.isArray(rules)) {
      return err("MISSING_FIELDS", "กรุณาระบุ rules เป็น array");
    }

    // Upsert each rule in a transaction
    const updatedRules = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const rule of rules) {
        const data = {
          name: rule.name,
          nameEn: rule.nameEn,
          type: rule.type,
          daysOfWeek: rule.daysOfWeek ?? undefined,
          specificDate: rule.specificDate ? new Date(rule.specificDate) : null,
          openTime: new Date(`1970-01-01T${rule.openTime}`),
          closeTime: new Date(`1970-01-01T${rule.closeTime}`),
          allowWalkin: rule.allowWalkin ?? true,
          allowKiosk: rule.allowKiosk ?? true,
          notes: rule.notes || null,
          isActive: rule.isActive ?? true,
        };

        if (rule.id) {
          const updated = await tx.businessHoursRule.update({
            where: { id: rule.id },
            data,
          });
          results.push(updated);
        } else {
          const created = await tx.businessHoursRule.create({ data });
          results.push(created);
        }
      }

      return results;
    });

    return ok({ rules: updatedRules });
  } catch (error) {
    console.error("PUT /api/business-hours error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
