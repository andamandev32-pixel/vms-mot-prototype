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

/** Send check-in notification to appointment creator and/or host staff */
export async function sendCheckinNotification(params: CheckinNotificationParams) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        createdByStaff: { select: { id: true, name: true, lineUserId: true, email: true } },
        hostStaff: { select: { id: true, name: true, lineUserId: true, email: true } },
        group: { select: { id: true, name: true } },
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

    // Notify creator
    if (appointment.createdByStaff) {
      const staff = appointment.createdByStaff;
      if (staff.lineUserId) {
        enqueue({
          type: "checkin-alert",
          recipientStaffId: staff.id,
          recipientLineUserId: staff.lineUserId,
          channel: "line",
          variables,
        });
      }
      if (staff.email) {
        enqueue({
          type: "checkin-alert",
          recipientStaffId: staff.id,
          recipientEmail: staff.email,
          channel: "email",
          variables,
        });
      }
    }

    // Notify host (if different from creator)
    if (appointment.hostStaff && appointment.hostStaffId !== appointment.createdByStaffId) {
      const host = appointment.hostStaff;
      if (host.lineUserId) {
        enqueue({
          type: "checkin-alert",
          recipientStaffId: host.id,
          recipientLineUserId: host.lineUserId,
          channel: "line",
          variables,
        });
      }
    }
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

/** Send overstay alert */
export async function sendOverstayAlert(params: OverstayAlertParams) {
  enqueue({
    type: "overstay-alert",
    variables: {
      visitorName: params.visitorName,
      company: params.company ?? "",
      checkinAt: params.checkinAt,
      expectedCheckout: params.expectedCheckout,
      overstayDuration: params.overstayDuration,
      location: params.location ?? "",
      groupName: params.groupName ?? "",
    },
  });
}

/** Get queued notifications (for debugging/testing) */
export function getNotificationQueue() {
  return [...notificationQueue];
}

/** Clear queue (for testing) */
export function clearNotificationQueue() {
  notificationQueue.length = 0;
}
