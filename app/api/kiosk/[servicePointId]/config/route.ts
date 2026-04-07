import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== Inline response helpers =====
const ok = (data: unknown) =>
  NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// ─────────────────────────────────────────────────────
// GET /api/kiosk/:servicePointId/config
// Public endpoint — ไม่ต้อง auth
// ใช้ตอน Kiosk boot / reset — ดึง config เฉพาะที่ kiosk ต้องใช้
// ─────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ servicePointId: string }> }
) {
  try {
    const { servicePointId } = await params;
    const spId = parseInt(servicePointId, 10);
    if (isNaN(spId)) {
      return err("INVALID_ID", "รหัสจุดบริการไม่ถูกต้อง");
    }

    const servicePoint = await prisma.servicePoint.findUnique({
      where: { id: spId },
      include: {
        servicePointPurposes: {
          include: {
            visitPurpose: { select: { id: true, name: true, nameEn: true, icon: true, isActive: true } },
          },
        },
        servicePointDocuments: {
          include: {
            identityDocumentType: { select: { id: true, name: true, nameEn: true } },
          },
        },
      },
    });

    if (!servicePoint) {
      return err("NOT_FOUND", "ไม่พบจุดบริการที่ระบุ", 404);
    }

    // Only allow kiosk type service points
    if (servicePoint.type !== "kiosk") {
      return err("NOT_FOUND", "ไม่พบจุดบริการ Kiosk ที่ระบุ", 404);
    }

    // Fetch business hours rules (active only)
    const businessHoursRules = await prisma.businessHoursRule.findMany({
      where: { isActive: true },
      orderBy: { type: "asc" },
    });

    // Determine if currently open based on business hours
    const now = new Date();
    const businessHours = resolveBusinessHours(servicePoint.followBusinessHours ?? true, businessHoursRules, now);

    // Build response — only fields the kiosk needs
    return ok({
      servicePoint: {
        id: servicePoint.id,
        name: servicePoint.name,
        nameEn: servicePoint.nameEn,
        type: servicePoint.type,
        status: servicePoint.status,
        serialNumber: servicePoint.serialNumber,
        location: servicePoint.location,
        locationEn: servicePoint.locationEn,
        building: servicePoint.building,
        floor: servicePoint.floor,
        ipAddress: servicePoint.ipAddress,
        adminPin: servicePoint.adminPin,
        followBusinessHours: servicePoint.followBusinessHours,
        wifiSsid: servicePoint.wifiSsid,
        wifiPasswordPattern: servicePoint.wifiPasswordPattern,
        wifiValidityMode: servicePoint.wifiValidityMode,
        wifiFixedDurationMin: servicePoint.wifiFixedDurationMin,
        pdpaRequireScroll: servicePoint.pdpaRequireScroll,
        pdpaRetentionDays: servicePoint.pdpaRetentionDays,
        slipHeaderText: servicePoint.slipHeaderText,
        slipFooterText: servicePoint.slipFooterText,
        idMaskingPattern: servicePoint.idMaskingPattern,
        todayTransactions: servicePoint.todayTransactions,
      },
      supportedDocuments: servicePoint.servicePointDocuments.map((d) => ({
        id: d.identityDocumentType.id,
        name: d.identityDocumentType.name,
        nameEn: d.identityDocumentType.nameEn,
      })),
      supportedPurposeIds: servicePoint.servicePointPurposes.map((p) => p.visitPurpose.id),
      businessHours,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/kiosk/[servicePointId]/config error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}

// ─────────────────────────────────────────────────────
// Business Hours Resolution
// ─────────────────────────────────────────────────────

interface BusinessHoursResult {
  followBusinessHours: boolean;
  isOpen: boolean;
  allowWalkin: boolean;
  allowKiosk: boolean;
  currentRule: string | null;
  todaySchedule: { openTime: string; closeTime: string } | null;
}

interface BHRule {
  name: string;
  type: string;
  daysOfWeek: unknown;
  specificDate: Date | null;
  openTime: Date;
  closeTime: Date;
  allowWalkin: boolean;
  allowKiosk: boolean;
}

function resolveBusinessHours(
  followBusinessHours: boolean,
  rules: BHRule[],
  now: Date
): BusinessHoursResult {
  // If not following business hours, always open
  if (!followBusinessHours) {
    return {
      followBusinessHours: false,
      isOpen: true,
      allowWalkin: true,
      allowKiosk: true,
      currentRule: null,
      todaySchedule: null,
    };
  }

  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check special/holiday rules first (specific date match)
  for (const rule of rules) {
    if ((rule.type === "holiday" || rule.type === "special") && rule.specificDate) {
      const ruleDate = new Date(rule.specificDate).toISOString().split("T")[0];
      if (ruleDate === todayStr) {
        const open = timeToMinutes(rule.openTime);
        const close = timeToMinutes(rule.closeTime);
        const isOpen = currentMinutes >= open && currentMinutes < close;
        return {
          followBusinessHours: true,
          isOpen,
          allowWalkin: rule.allowWalkin,
          allowKiosk: rule.allowKiosk,
          currentRule: rule.name,
          todaySchedule: { openTime: formatTime(rule.openTime), closeTime: formatTime(rule.closeTime) },
        };
      }
    }
  }

  // Check regular rules (day of week match)
  for (const rule of rules) {
    if (rule.type === "regular" && rule.daysOfWeek) {
      const days = rule.daysOfWeek as number[];
      if (Array.isArray(days) && days.includes(dayOfWeek)) {
        const open = timeToMinutes(rule.openTime);
        const close = timeToMinutes(rule.closeTime);
        const isOpen = currentMinutes >= open && currentMinutes < close;
        return {
          followBusinessHours: true,
          isOpen,
          allowWalkin: rule.allowWalkin,
          allowKiosk: rule.allowKiosk,
          currentRule: rule.name,
          todaySchedule: { openTime: formatTime(rule.openTime), closeTime: formatTime(rule.closeTime) },
        };
      }
    }
  }

  // No matching rule — closed
  return {
    followBusinessHours: true,
    isOpen: false,
    allowWalkin: false,
    allowKiosk: false,
    currentRule: null,
    todaySchedule: null,
  };
}

function timeToMinutes(time: Date): number {
  return time.getHours() * 60 + time.getMinutes();
}

function formatTime(time: Date): string {
  return `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
}
