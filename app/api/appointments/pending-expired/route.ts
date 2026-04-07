import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthUser, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/appointments/pending-expired?timeoutHours=24&autoCancel=false
 * ดึงรายการนัดหมายที่ status=pending เกินกำหนด (สำหรับ cron job auto-cancel)
 * - pending เกิน timeoutHours (default 24 ชม.)
 * - หรือ dateStart ผ่านไปแล้ว
 * ถ้า autoCancel=true → อัปเดตเป็น auto-cancelled ด้วย
 */
export async function GET(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if (!isAuthUser(result)) return result;
    const user = result;

    if (user.role !== "admin" && user.role !== "supervisor") {
      return apiError("FORBIDDEN", "เฉพาะผู้ดูแลระบบเท่านั้น", 403);
    }

    const { searchParams } = new URL(request.url);
    const timeoutHours = Math.max(1, parseInt(searchParams.get("timeoutHours") || "24", 10));
    const autoCancel = searchParams.get("autoCancel") === "true";

    const now = new Date();
    const timeoutCutoff = new Date(now.getTime() - timeoutHours * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];

    // Find pending appointments that:
    // 1. Were created more than timeoutHours ago, OR
    // 2. Have dateStart in the past
    const pendingExpired = await prisma.appointment.findMany({
      where: {
        status: "pending",
        OR: [
          { createdAt: { lt: timeoutCutoff } },
          { dateStart: { lt: new Date(todayStr) } },
        ],
      },
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, name: true, company: true },
        },
        hostStaff: {
          select: { id: true, name: true, nameEn: true, lineUserId: true },
        },
        department: {
          select: { id: true, name: true, nameEn: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let autoCancelled = 0;

    if (autoCancel && pendingExpired.length > 0) {
      // Auto-cancel all expired appointments
      const ids = pendingExpired.map((a) => a.id);

      await prisma.appointment.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "auto-cancelled",
          rejectedReason: "หมดเวลาอนุมัติ",
        },
      });

      // Create status logs for each
      await prisma.appointmentStatusLog.createMany({
        data: ids.map((id) => ({
          appointmentId: id,
          fromStatus: "pending",
          toStatus: "auto-cancelled",
          reason: `หมดเวลาอนุมัติ (เกิน ${timeoutHours} ชม.)`,
        })),
      });

      autoCancelled = ids.length;
    }

    // Compute pending hours for each
    const enriched = pendingExpired.map((apt) => {
      const pendingMs = now.getTime() - new Date(apt.createdAt).getTime();
      const pendingHours = Math.round(pendingMs / (1000 * 60 * 60));
      const dateStartPassed = new Date(apt.dateStart) < new Date(todayStr);

      return {
        appointmentId: apt.id,
        bookingCode: apt.bookingCode,
        visitorName: apt.visitor?.name || `${apt.visitor?.firstName} ${apt.visitor?.lastName}`,
        hostName: apt.hostStaff?.name || null,
        departmentName: apt.department?.name || null,
        dateStart: apt.dateStart,
        createdAt: apt.createdAt,
        pendingHours,
        approvalTimeoutHours: timeoutHours,
        reason: dateStartPassed ? "date_passed" : "exceeded_approval_timeout",
        autoCancelled: autoCancel,
      };
    });

    return apiSuccess({
      appointments: enriched,
      total: pendingExpired.length,
      autoCancelled,
      timeoutHours,
    });
  } catch (error) {
    console.error("GET /api/appointments/pending-expired error:", error);
    return apiError("SERVER_ERROR", "เกิดข้อผิดพลาด", 500);
  }
}
