import { NextRequest, NextResponse } from "next/server";
import { getStaffOrKiosk } from "@/lib/kiosk-auth";
import { prisma } from "@/lib/prisma";

const ok = (data: unknown) => NextResponse.json({ success: true, data });
const err = (code: string, msg: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message: msg } }, { status });

// POST /api/kiosk/appointment/lookup — Look up appointment by QR code
export async function POST(request: NextRequest) {
  try {
    const auth = await getStaffOrKiosk(request);
    if (!auth) return err("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);

    const body = await request.json();
    const { qrCodeData } = body as { qrCodeData?: string; servicePointId?: number };

    if (!qrCodeData?.trim()) return err("MISSING_FIELDS", "กรุณาระบุ qrCodeData");

    const appointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { bookingCode: qrCodeData.trim() },
          { bookingCode: { contains: qrCodeData.trim() } },
        ],
      },
      include: {
        visitor: { select: { id: true, name: true, nameEn: true, company: true } },
        hostStaff: { select: { id: true, name: true, nameEn: true, position: true } },
        department: {
          include: {
            floorDepartments: {
              include: { floor: { include: { building: true } } },
              take: 1,
            },
          },
        },
        visitPurpose: { select: { id: true, name: true, nameEn: true, icon: true } },
      },
    });

    if (!appointment) {
      return ok({ found: false, reason: "not-found", message: "ไม่พบนัดหมายจาก QR Code ที่สแกน" });
    }

    // Check date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointment.dateStart);
    apptDate.setHours(0, 0, 0, 0);

    if (apptDate.getTime() !== today.getTime()) {
      return ok({ found: false, reason: "wrong-date", message: "นัดหมายนี้ไม่ใช่วันนี้" });
    }

    // Check status
    const validStatuses = ["approved", "confirmed"];
    if (!validStatuses.includes(appointment.status)) {
      return ok({
        found: true,
        appointment: {
          bookingCode: appointment.bookingCode,
          status: appointment.status,
          message:
            appointment.status === "pending" ? "นัดหมายรอการอนุมัติ" :
            appointment.status === "rejected" ? "นัดหมายถูกปฏิเสธ" :
            appointment.status === "cancelled" ? "นัดหมายถูกยกเลิก" :
            "สถานะนัดหมายไม่ถูกต้อง",
        },
      });
    }

    const fd = appointment.department?.floorDepartments?.[0];

    return ok({
      found: true,
      appointment: {
        id: appointment.id,
        bookingCode: appointment.bookingCode,
        visitorName: appointment.visitor?.name || "",
        visitorCompany: appointment.visitor?.company || "",
        hostName: appointment.hostStaff?.name || "",
        hostDepartment: appointment.department?.name || "",
        hostFloor: fd?.floor?.name || "",
        location: fd?.floor?.building?.name || "",
        date: appointment.dateStart.toLocaleDateString("th-TH", { dateStyle: "long" }),
        timeSlot: `${appointment.timeStart || "—"} — ${appointment.timeEnd || "—"}`,
        purposeName: appointment.visitPurpose?.name || appointment.purpose || "",
        purposeIcon: appointment.visitPurpose?.icon || "📋",
        status: appointment.status,
        wifiRequested: appointment.wifiRequested || false,
      },
    });
  } catch (error) {
    console.error("POST /api/kiosk/appointment/lookup error:", error);
    return err("SERVER_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่", 500);
  }
}
