import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown, headers?: Record<string, string>) => {
  const res = NextResponse.json({ success: true, data });
  if (headers) Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
};
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// GET /api/kiosk/pdpa/latest — ดึงข้อความ PDPA เวอร์ชันล่าสุด (public)
// ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const config = await prisma.pdpaConsentConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { effectiveDate: true },
        },
      },
    });

    if (!config) {
      return err("NO_PDPA_CONFIG", "ไม่พบการตั้งค่า PDPA ที่ใช้งานอยู่", 404);
    }

    const effectiveDate = config.versions[0]?.effectiveDate ?? config.createdAt;

    return ok(
      {
        version: config.version,
        titleTh: "นโยบายคุ้มครองข้อมูลส่วนบุคคล",
        titleEn: "Personal Data Protection Policy",
        bodyTh: config.textTh,
        bodyEn: config.textEn,
        retentionDays: config.retentionDays,
        requireScrollToBottom: config.requireScroll,
        effectiveDate: effectiveDate.toISOString().split("T")[0],
      },
      { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    );
  } catch (error) {
    console.error("GET /api/kiosk/pdpa/latest error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
