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
// GET /api/settings/system — ดึงค่าตั้งค่าระบบทั้งหมด (admin)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });

    // Convert to key-value map
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return ok({ settings: settingsMap, raw: settings });
  } catch (error) {
    console.error("GET /api/settings/system error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/settings/system — อัปเดตค่าตั้งค่าระบบ (admin)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }
    if (user.role !== "admin") {
      return err("FORBIDDEN", "คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
    }

    const body = await request.json();
    const { settings } = body as {
      settings?: Record<string, string>;
    };

    if (!settings || typeof settings !== "object") {
      return err("MISSING_FIELDS", "กรุณาระบุ settings เป็น object { key: value }");
    }

    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      const result = await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value), updatedBy: user.id },
        create: { key, value: String(value), updatedBy: user.id },
      });
      results.push(result);
    }

    return ok({ updated: results.length, settings: results });
  } catch (error) {
    console.error("PUT /api/settings/system error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
