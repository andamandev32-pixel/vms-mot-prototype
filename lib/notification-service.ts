// ═══════════════════════════════════════════════════════════
// eVMS Notification Service
// ─ Routes notifications to LINE / Email / Web-app
// ─ Currently a stub — actual LINE/Email sending to be implemented
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import {
  buildBookingConfirmedMessage,
  buildOfficerNewRequestMessage,
  buildApprovalResultMessage,
  buildCheckinMessage,
  buildOfficerCheckinAlertMessage,
  buildOfficerOverstayAlertMessage,
  buildVisitorOverstayAlertMessage,
  buildAutoCancelledMessage,
} from "@/lib/flex/messages";

// ═══════ Types ═══════

export interface NotificationPayload {
  type:
    | "booking-confirmed"
    | "approval-needed"
    | "booking-approved"
    | "booking-rejected"
    | "checkin-alert"
    | "checkin-welcome"
    | "overstay-alert"
    | "visitor-overstay-alert"
    | "auto-cancelled"
    | "batch-summary";
  recipientStaffId?: number;
  recipientVisitorId?: number;
  recipientLineUserId?: string;
  recipientEmail?: string;
  channel?: "line" | "email" | "web-app";
  variables: Record<string, string>;
}

export interface CheckinNotificationParams {
  appointmentId: number;
  visitorName: string;
  checkinTime: Date;
  entryCode: string;
  location?: string;
}

export interface OverstayAlertParams {
  entryId: number;
  visitorName: string;
  company?: string;
  checkinAt: string;
  expectedCheckout: string;
  overstayDuration: string;
  location?: string;
  groupName?: string;
}

// ═══════ Queue (in-memory for now — replace with proper queue later) ═══════

const notificationQueue: NotificationPayload[] = [];

function enqueue(payload: NotificationPayload) {
  notificationQueue.push(payload);
  console.log(`[NotificationService] Queued: ${payload.type} → ${payload.recipientStaffId ?? payload.recipientEmail ?? "visitor"}`);

  // Auto-process LINE notifications
  if (payload.channel === "line" && payload.recipientLineUserId) {
    processLineNotification(payload).catch((err) =>
      console.error("[NotificationService] LINE send error:", err)
    );
  }
}

// ═══════ LINE Push Integration ═══════

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

async function getLineAccessToken(): Promise<string | null> {
  const config = await prisma.lineOaConfig.findFirst({ where: { isActive: true } });
  return config?.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
}

async function pushToLine(lineUserId: string, messages: unknown[]) {
  const token = await getLineAccessToken();
  if (!token) {
    console.warn("[NotificationService] No LINE access token");
    return;
  }
  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineUserId, messages }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[NotificationService] LINE push failed:", res.status, errText);
  }
}

/** Build and send LINE Flex Message based on notification type */
async function processLineNotification(payload: NotificationPayload) {
  const { type, recipientLineUserId, variables: vars } = payload;
  if (!recipientLineUserId) return;

  let message: unknown = null;

  switch (type) {
    case "booking-confirmed":
      message = await buildBookingConfirmedMessage({
        bookingCode: vars.bookingCode || "",
        purposeName: vars.purposeName || vars.purpose || "",
        date: vars.date || "",
        timeSlot: vars.timeSlot || "",
        hostName: vars.hostName || "",
        location: vars.location || "",
      });
      break;

    case "approval-needed":
      message = await buildOfficerNewRequestMessage({
        visitorName: vars.visitorName || "",
        company: vars.company || "",
        purposeName: vars.purposeName || vars.purpose || "",
        dateTime: vars.dateTime || vars.date || "",
        companions: vars.companions || "0 คน",
        appointmentId: vars.appointmentId || "",
      });
      break;

    case "booking-approved":
      message = await buildApprovalResultMessage({
        approved: true,
        bookingCode: vars.bookingCode || "",
        dateTime: vars.dateTime || "",
        approverName: vars.approverName || "",
        approvedAt: vars.approvedAt || "",
      });
      break;

    case "booking-rejected":
      message = await buildApprovalResultMessage({
        approved: false,
        bookingCode: vars.bookingCode || "",
        dateTime: vars.dateTime || "",
        approverName: vars.approverName || "",
        approvedAt: vars.approvedAt || "",
        rejectedReason: vars.rejectedReason,
      });
      break;

    case "checkin-alert":
      message = await buildOfficerCheckinAlertMessage({
        visitorName: vars.visitorName || "",
        company: vars.company || "",
        checkinInfo: vars.checkinTime || vars.checkinAt || "",
        location: vars.location || "",
      });
      break;

    case "checkin-welcome":
      message = await buildCheckinMessage({
        entryCode: vars.entryCode || "",
        checkinAt: vars.checkinAt || vars.checkinTime || "",
        checkoutAt: vars.checkoutAt || "",
        location: vars.location || "",
      });
      break;

    case "overstay-alert":
      message = await buildOfficerOverstayAlertMessage({
        visitorName: vars.visitorName || "",
        timeSlot: vars.expectedCheckout || "",
        overstayMinutes: vars.overstayDuration || "",
        location: vars.location || "",
      });
      break;

    case "visitor-overstay-alert":
      message = await buildVisitorOverstayAlertMessage({
        checkinAt: vars.checkinAt || "",
        expectedCheckout: vars.expectedCheckout || "",
        overstayDuration: vars.overstayDuration || "",
        location: vars.location || "",
      });
      break;

    case "auto-cancelled":
      message = await buildAutoCancelledMessage({
        bookingCode: vars.bookingCode || "",
        purposeName: vars.purposeName || "",
        dateTime: vars.dateTime || "",
        hostName: vars.hostName || "",
        timeoutHours: vars.timeoutHours || "24",
      });
      break;

    default:
      console.warn(`[NotificationService] No LINE message builder for type: ${type}`);
      return;
  }

  if (message) {
    await pushToLine(recipientLineUserId, [message]);
  }
}

// ═══════ Send Functions ═══════

interface StaffRecipient {
  id: number;
  lineUserId: string | null;
  email: string | null;
}

interface AppointmentForFanOut {
  createdByStaff: StaffRecipient | null;
  hostStaff: StaffRecipient | null;
  createdByStaffId: number | null;
  hostStaffId: number | null;
  group: {
    staffNotifyConfig: string | null;
    approverGroup: {
      members: Array<{ staff: StaffRecipient }>;
    } | null;
  } | null;
}

/** Prisma include shape for fan-out — keep both callers in sync */
const APPOINTMENT_FAN_OUT_INCLUDE = {
  createdByStaff: { select: { id: true, lineUserId: true, email: true } },
  hostStaff: { select: { id: true, lineUserId: true, email: true } },
  group: {
    select: {
      staffNotifyConfig: true,
      approverGroup: {
        include: {
          members: {
            where: { receiveNotification: true },
            include: { staff: { select: { id: true, lineUserId: true, email: true } } },
          },
        },
      },
    },
  },
} as const;

/**
 * Fan out a notification to: creator + host (deduped) + group's responsible/additional staff.
 * Each recipient gets LINE (if lineUserId) and email (if email). Caller passes the loaded
 * appointment (use APPOINTMENT_FAN_OUT_INCLUDE), the event type, and variables.
 */
async function fanOutAppointmentStaff(
  appointment: AppointmentForFanOut,
  type: NotificationPayload["type"],
  variables: Record<string, string>
): Promise<void> {
  const notified = new Set<number>();
  const notifyStaff = (staff: StaffRecipient | null | undefined) => {
    if (!staff || notified.has(staff.id)) return;
    notified.add(staff.id);
    if (staff.lineUserId) {
      enqueue({
        type,
        recipientStaffId: staff.id,
        recipientLineUserId: staff.lineUserId,
        channel: "line",
        variables,
      });
    }
    if (staff.email) {
      enqueue({
        type,
        recipientStaffId: staff.id,
        recipientEmail: staff.email,
        channel: "email",
        variables,
      });
    }
  };

  // Creator + host (deduped if same person)
  notifyStaff(appointment.createdByStaff);
  if (
    appointment.hostStaffId &&
    appointment.hostStaffId !== appointment.createdByStaffId
  ) {
    notifyStaff(appointment.hostStaff);
  }

  // Group-level recipients from staffNotifyConfig
  if (appointment.group?.staffNotifyConfig) {
    let config: {
      responsibleGroup?: boolean;
      additionalStaff?: number[];
      additionalApproverGroups?: number[];
    } = {};
    try {
      config = JSON.parse(appointment.group.staffNotifyConfig);
    } catch (e) {
      console.error("[NotificationService] invalid staffNotifyConfig JSON:", e);
    }

    if (config.responsibleGroup && appointment.group.approverGroup) {
      for (const member of appointment.group.approverGroup.members) {
        notifyStaff(member.staff);
      }
    }

    if (Array.isArray(config.additionalStaff) && config.additionalStaff.length > 0) {
      const staffList = await prisma.staff.findMany({
        where: { id: { in: config.additionalStaff } },
        select: { id: true, lineUserId: true, email: true },
      });
      for (const s of staffList) notifyStaff(s);
    }

    if (
      Array.isArray(config.additionalApproverGroups) &&
      config.additionalApproverGroups.length > 0
    ) {
      const extraGroups = await prisma.approverGroup.findMany({
        where: { id: { in: config.additionalApproverGroups } },
        include: {
          members: {
            where: { receiveNotification: true },
            include: { staff: { select: { id: true, lineUserId: true, email: true } } },
          },
        },
      });
      for (const g of extraGroups) {
        for (const m of g.members) notifyStaff(m.staff);
      }
    }
  }
}

/** Send check-in notification to creator + host + everyone listed in group.staffNotifyConfig */
export async function sendCheckinNotification(params: CheckinNotificationParams) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        ...APPOINTMENT_FAN_OUT_INCLUDE,
        group: {
          select: {
            ...APPOINTMENT_FAN_OUT_INCLUDE.group.select,
            name: true,
          },
        },
      },
    });

    if (!appointment) return;
    if (!appointment.notifyOnCheckin) return; // Silent mode

    const variables: Record<string, string> = {
      visitorName: params.visitorName,
      checkinTime: params.checkinTime.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      entryCode: params.entryCode,
      location: params.location ?? "",
      groupName: appointment.group?.name ?? "",
    };

    await fanOutAppointmentStaff(appointment, "checkin-alert", variables);
  } catch (error) {
    console.error("[NotificationService] sendCheckinNotification error:", error);
  }
}

/** Send approval request to approver group members */
export async function sendApprovalNotification(params: {
  appointmentId: number;
  approverGroupId: number;
}) {
  try {
    const group = await prisma.approverGroup.findUnique({
      where: { id: params.approverGroupId },
      include: {
        members: {
          where: { receiveNotification: true },
          include: {
            staff: { select: { id: true, name: true, lineUserId: true, email: true } },
          },
        },
        notifyChannels: true,
      },
    });

    if (!group) return;

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        visitor: { select: { name: true, company: true } },
        visitPurpose: { select: { name: true } },
      },
    });

    if (!appointment) return;

    const channels = group.notifyChannels.map((nc) => nc.channel);
    const variables: Record<string, string> = {
      visitorName: appointment.visitor.name,
      company: appointment.visitor.company ?? "",
      purpose: appointment.visitPurpose.name,
      bookingCode: appointment.bookingCode,
    };

    for (const member of group.members) {
      const staff = member.staff;
      if (channels.includes("line") && staff.lineUserId) {
        enqueue({
          type: "approval-needed",
          recipientStaffId: staff.id,
          recipientLineUserId: staff.lineUserId,
          channel: "line",
          variables,
        });
      }
      if (channels.includes("email") && staff.email) {
        enqueue({
          type: "approval-needed",
          recipientStaffId: staff.id,
          recipientEmail: staff.email,
          channel: "email",
          variables,
        });
      }
    }
  } catch (error) {
    console.error("[NotificationService] sendApprovalNotification error:", error);
  }
}

/** Notify visitor of approval/rejection result via LINE */
export async function sendApprovalResultNotification(params: {
  appointmentId: number;
  approved: boolean;
  approverName: string;
  decidedAt: Date;
  rejectedReason?: string;
}) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        visitor: { select: { id: true, lineUserId: true } },
      },
    });

    if (!appointment) return;
    if (!appointment.visitor?.lineUserId) return; // no LINE channel for visitor

    const decidedAt = params.decidedAt.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateTime = appointment.dateStart
      ? `${appointment.dateStart.toLocaleDateString("th-TH")} | ${appointment.timeStart ?? ""} - ${appointment.timeEnd ?? ""}`
      : "";

    enqueue({
      type: params.approved ? "booking-approved" : "booking-rejected",
      recipientVisitorId: appointment.visitor.id,
      recipientLineUserId: appointment.visitor.lineUserId,
      channel: "line",
      variables: {
        bookingCode: appointment.bookingCode,
        dateTime,
        approverName: params.approverName,
        approvedAt: decidedAt,
        ...(params.rejectedReason ? { rejectedReason: params.rejectedReason } : {}),
      },
    });
  } catch (error) {
    console.error("[NotificationService] sendApprovalResultNotification error:", error);
  }
}

/**
 * Send overstay alert
 * - Visitor (LINE only): "you are overstaying — please check out"
 * - Creator + host + group's responsibleGroup / additionalStaff / additionalApproverGroups
 *   (LINE + email, deduped by staff id)
 */
export async function sendOverstayAlert(params: OverstayAlertParams) {
  try {
    const entry = await prisma.visitEntry.findUnique({
      where: { id: params.entryId },
      include: {
        visitor: { select: { id: true, lineUserId: true } },
        appointment: { include: APPOINTMENT_FAN_OUT_INCLUDE },
      },
    });

    const baseVars: Record<string, string> = {
      visitorName: params.visitorName,
      company: params.company ?? "",
      checkinAt: params.checkinAt,
      expectedCheckout: params.expectedCheckout,
      overstayDuration: params.overstayDuration,
      location: params.location ?? "",
      groupName: params.groupName ?? "",
    };

    // ─── Visitor side (LINE only) ───
    if (entry?.visitor?.lineUserId) {
      enqueue({
        type: "visitor-overstay-alert",
        recipientVisitorId: entry.visitor.id,
        recipientLineUserId: entry.visitor.lineUserId,
        channel: "line",
        variables: baseVars,
      });
    }

    // ─── Officer side (creator + host + group fan-out) ───
    if (entry?.appointment) {
      await fanOutAppointmentStaff(entry.appointment, "overstay-alert", baseVars);
    }
  } catch (error) {
    console.error("[NotificationService] sendOverstayAlert error:", error);
  }
}

/** Get queued notifications (for debugging/testing) */
export function getNotificationQueue() {
  return [...notificationQueue];
}

/** Clear queue (for testing) */
export function clearNotificationQueue() {
  notificationQueue.length = 0;
}
