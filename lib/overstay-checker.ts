// ═══════════════════════════════════════════════════════════
// eVMS Overstay Checker
// ─ Detects visitors who are still checked-in past their allowed time
// ─ Resolves timeEnd from: daySchedule → group default → appointment → business hours
// ─ To be called from a cron job (every 15 minutes)
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { sendOverstayAlert } from "@/lib/notification-service";

/**
 * Resolve the expected checkout time for a visit entry
 * Priority: DaySchedule (for group) → Group default → Appointment → Business hours close
 */
async function resolveExpectedCheckout(entry: {
  appointmentId: number | null;
  checkinAt: Date;
}): Promise<{ timeEnd: Date; source: string } | null> {
  const today = entry.checkinAt.toISOString().slice(0, 10);

  if (entry.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: entry.appointmentId },
      include: {
        group: {
          include: {
            daySchedules: {
              where: { date: new Date(today + "T00:00:00.000Z") },
            },
          },
        },
      },
    });

    if (appointment) {
      // Priority 1: Group day schedule
      if (appointment.group?.daySchedules?.[0]) {
        const ds = appointment.group.daySchedules[0];
        const timeEnd = new Date(entry.checkinAt);
        const dsTime = new Date(ds.timeEnd);
        timeEnd.setHours(dsTime.getUTCHours(), dsTime.getUTCMinutes(), 0, 0);
        return { timeEnd, source: `daySchedule (${today})` };
      }

      // Priority 2: Group default time
      if (appointment.group) {
        const timeEnd = new Date(entry.checkinAt);
        const gTime = new Date(appointment.group.timeEnd);
        timeEnd.setHours(gTime.getUTCHours(), gTime.getUTCMinutes(), 0, 0);
        return { timeEnd, source: "group default" };
      }

      // Priority 3: Appointment timeEnd
      const timeEnd = new Date(entry.checkinAt);
      const aTime = new Date(appointment.timeEnd);
      timeEnd.setHours(aTime.getUTCHours(), aTime.getUTCMinutes(), 0, 0);
      return { timeEnd, source: "appointment" };
    }
  }

  // Priority 4: Business hours (for walk-ins)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const businessRule = await prisma.businessHoursRule.findFirst({
    where: {
      type: "regular",
      isActive: true,
    },
    orderBy: { id: "asc" },
  });

  if (businessRule) {
    const timeEnd = new Date(entry.checkinAt);
    const bTime = new Date(businessRule.closeTime);
    timeEnd.setHours(bTime.getUTCHours(), bTime.getUTCMinutes(), 0, 0);
    return { timeEnd, source: "business hours" };
  }

  return null;
}

/**
 * Check all currently checked-in entries for overstay
 * Returns the number of overstay entries detected
 */
export async function checkOverstayEntries(): Promise<{
  checked: number;
  overstay: number;
  notified: number;
}> {
  const now = new Date();
  let checked = 0;
  let overstayCount = 0;
  let notified = 0;

  // Get all active entries (checked-in, not yet checked out)
  const activeEntries = await prisma.visitEntry.findMany({
    where: {
      status: "checked-in",
      checkoutAt: null,
    },
    include: {
      visitor: { select: { id: true, name: true, company: true } },
      appointment: {
        select: {
          id: true,
          createdByStaffId: true,
          hostStaffId: true,
          groupId: true,
          group: { select: { name: true } },
        },
      },
      department: { select: { name: true } },
    },
  });

  for (const entry of activeEntries) {
    checked++;
    const expected = await resolveExpectedCheckout({
      appointmentId: entry.appointmentId,
      checkinAt: entry.checkinAt,
    });

    if (!expected) continue;

    if (now > expected.timeEnd) {
      overstayCount++;

      // Update status to overstay
      await prisma.visitEntry.update({
        where: { id: entry.id },
        data: { status: "overstay" },
      });

      // Calculate duration
      const durationMs = now.getTime() - expected.timeEnd.getTime();
      const durationMin = Math.floor(durationMs / 60000);
      const durationStr = durationMin >= 60
        ? `${Math.floor(durationMin / 60)} ชม. ${durationMin % 60} นาที`
        : `${durationMin} นาที`;

      // Send overstay alert
      await sendOverstayAlert({
        entryId: entry.id,
        visitorName: entry.visitor.name,
        company: entry.visitor.company ?? undefined,
        checkinAt: entry.checkinAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        expectedCheckout: expected.timeEnd.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        overstayDuration: durationStr,
        location: `${entry.building} ${entry.floor}`,
        groupName: entry.appointment?.group?.name ?? undefined,
      });

      notified++;
      console.log(`[OverstayChecker] Entry ${entry.entryCode}: overstay ${durationStr} (source: ${expected.source})`);
    }
  }

  console.log(`[OverstayChecker] Checked: ${checked}, Overstay: ${overstayCount}, Notified: ${notified}`);
  return { checked, overstay: overstayCount, notified };
}

/**
 * Auto-expire appointments that are past their date
 * Returns count of expired appointments
 */
export async function autoExpireAppointments(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Single mode: dateStart < today
  const expiredSingle = await prisma.appointment.updateMany({
    where: {
      entryMode: "single",
      dateStart: { lt: today },
      status: { in: ["approved", "pending"] },
    },
    data: { status: "expired" },
  });

  // Period mode: dateEnd < today
  const expiredPeriod = await prisma.appointment.updateMany({
    where: {
      entryMode: "period",
      dateEnd: { lt: today },
      status: { in: ["approved", "pending", "confirmed"] },
    },
    data: { status: "expired" },
  });

  const total = expiredSingle.count + expiredPeriod.count;

  // Update group status where all appointments are expired
  const groupsToComplete = await prisma.appointmentGroup.findMany({
    where: {
      status: "active",
      appointments: {
        every: { status: { in: ["expired", "cancelled"] } },
      },
    },
    select: { id: true },
  });

  if (groupsToComplete.length > 0) {
    await prisma.appointmentGroup.updateMany({
      where: { id: { in: groupsToComplete.map((g) => g.id) } },
      data: { status: "completed" },
    });
  }

  console.log(`[AutoExpire] Expired: ${total} appointments, Completed: ${groupsToComplete.length} groups`);
  return total;
}
