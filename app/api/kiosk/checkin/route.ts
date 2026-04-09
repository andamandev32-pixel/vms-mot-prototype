import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/checkin — Main kiosk check-in endpoint
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const {
      type, visitorId, servicePointId, visitPurposeId, departmentId,
      appointmentId, idMethod, facePhotoPath, wifiAccepted, pdpaConsentId,
    } = body as {
      type?: string;
      visitorId?: number;
      servicePointId?: number;
      visitPurposeId?: number;
      departmentId?: number;
      appointmentId?: number | null;
      idMethod?: string;
      facePhotoPath?: string;
      wifiAccepted?: boolean;
      pdpaConsentId?: number;
    };

    if (!visitorId) return err("MISSING_FIELDS", "กรุณาระบุ visitorId");
    if (!servicePointId) return err("MISSING_FIELDS", "กรุณาระบุ servicePointId");

    // Verify visitor
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) return err("NOT_FOUND", "ไม่พบข้อมูลผู้เยี่ยมชม", 404);
    if (visitor.isBlocked) return err("VISITOR_BLOCKED", "ผู้เยี่ยมชมอยู่ในรายการบล็อค");

    // Generate entry code
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.visitEntry.count({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
    });
    const entryCode = `eVMS-ENTRY-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Get service point for config
    const servicePoint = await prisma.servicePoint.findUnique({ where: { id: servicePointId } });

    // Get purpose and department info
    const purpose = visitPurposeId
      ? await prisma.visitPurpose.findUnique({ where: { id: visitPurposeId } })
      : null;
    const department = departmentId
      ? await prisma.department.findUnique({
          where: { id: departmentId },
          include: {
            floorDepartments: {
              include: { floor: { include: { building: true } } },
              take: 1,
            },
          },
        })
      : null;

    // Resolve access group
    let accessGroup = null;
    if (departmentId) {
      const mapping = await prisma.departmentAccessMapping.findFirst({
        where: { departmentId },
        include: {
          defaultAccessGroup: { include: { accessGroupZones: { include: { accessZone: true } } } },
        },
      });
      accessGroup = mapping?.defaultAccessGroup || null;
    }

    // Calculate expected checkout
    const expectedCheckout = new Date(now);
    expectedCheckout.setHours(17, 0, 0, 0);

    // Create entry
    const entry = await prisma.visitEntry.create({
      data: {
        entryCode,
        visitorId,
        appointmentId: appointmentId || null,
        servicePointId,
        hostStaffId: null,
        departmentId: departmentId || null,
        status: "checked-in",
        checkinAt: now,
        checkinChannel: "kiosk",
        visitType: type || "walkin",
        purpose: purpose?.name || "",
        area: department?.floorDepartments?.[0]?.floor?.building?.name || "",
        building: department?.floorDepartments?.[0]?.floor?.building?.name || "",
        floor: department?.floorDepartments?.[0]?.floor?.name || "",
        idMethod: idMethod || null,
        facePhotoPath: facePhotoPath || null,
        companionsCount: 0,
      },
    });

    // Link PDPA consent to visitor
    if (pdpaConsentId) {
      await prisma.pdpaConsentLog.update({
        where: { id: pdpaConsentId },
        data: { visitorId },
      }).catch(() => {}); // Ignore if not found
    }

    // Generate WiFi if accepted
    let wifiData = null;
    if (wifiAccepted && servicePoint) {
      const year = now.getFullYear();
      const ssid = servicePoint.wifiSsid || "MOTS-Guest";
      const password = servicePoint.wifiPasswordPattern
        ? servicePoint.wifiPasswordPattern.replace("{YYYY}", String(year))
        : `mots${year}`;

      await prisma.visitEntry.update({
        where: { id: entry.id },
        data: { wifiUsername: `guest-${entryCode.slice(-8)}`, wifiPassword: password },
      });

      wifiData = { ssid, password, validUntil: expectedCheckout.toISOString() };
    }

    // Get slip config
    const slipTemplate = await prisma.visitSlipTemplate.findFirst({
      where: { isActive: true },
    }).catch(() => null);

    const qrCodeData = `eVMS-${entryCode}`;

    return ok({
      entry: {
        entryId: entry.id,
        entryCode: entry.entryCode,
        appointmentId: entry.appointmentId,
        status: entry.status,
        checkinTime: entry.checkinAt?.toISOString(),
        expectedCheckout: expectedCheckout.toISOString(),
      },
      accessControl: {
        accessGroupId: accessGroup?.id || null,
        accessGroupName: accessGroup?.name || "ทั่วไป",
        qrCodeData,
        allowedZones: accessGroup?.accessGroupZones?.map((z: { accessZone: { name: string } }) => z.accessZone.name) || [],
        validityMinutes: accessGroup?.validityMinutes || 120,
        hikvisionSynced: false,
      },
      slip: {
        slipNumber: entryCode,
        templateId: slipTemplate?.id || null,
        headerText: servicePoint?.slipHeaderText || "กระทรวงการท่องเที่ยวและกีฬา",
        footerText: servicePoint?.slipFooterText || "ขอบคุณที่มาเยือน",
        visitorName: visitor.name,
        idNumber: visitor.idNumber,
        visitPurpose: purpose?.name || "",
        department: department?.name || "",
        date: now.toLocaleDateString("th-TH"),
        timeIn: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        timeOut: expectedCheckout.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        wifi: wifiData,
        qrCodeData,
      },
      notifications: [],
    });
  } catch (error) {
    console.error("POST /api/kiosk/checkin error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
