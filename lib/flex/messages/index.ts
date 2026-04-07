// ════════════════════════════════════════════════════
// Flex Message Factories — Barrel Export
// import { buildWelcomeMessage, buildBookingConfirmedMessage, ... } from "@/lib/flex/messages"
// ════════════════════════════════════════════════════

export { buildWelcomeMessage } from "./welcome";
export { buildVisitorRegisteredMessage } from "./visitor-registered";
export type { VisitorRegisteredParams } from "./visitor-registered";
export { buildBookingConfirmedMessage } from "./booking-confirmed";
export type { BookingConfirmedParams } from "./booking-confirmed";
export { buildApprovalResultMessage } from "./approval-result";
export type { ApprovalResultParams } from "./approval-result";
export { buildAutoCancelledMessage } from "./auto-cancelled";
export type { AutoCancelledParams } from "./auto-cancelled";
export { buildReminderMessage } from "./reminder";
export type { ReminderParams } from "./reminder";
export { buildCheckinMessage } from "./checkin";
export type { CheckinParams } from "./checkin";
export { buildWifiCredentialsMessage } from "./wifi-credentials";
export type { WifiCredentialsParams } from "./wifi-credentials";
export { buildVisitSlipMessage } from "./visit-slip";
export type { VisitSlipParams } from "./visit-slip";
export { buildCheckoutMessage } from "./checkout";
export type { CheckoutParams } from "./checkout";
export { buildOfficerRegisteredMessage } from "./officer-registered";
export type { OfficerRegisteredParams } from "./officer-registered";
export { buildOfficerNewRequestMessage } from "./officer-new-request";
export type { OfficerNewRequestParams } from "./officer-new-request";
export { buildOfficerCheckinAlertMessage } from "./officer-checkin-alert";
export type { OfficerCheckinAlertParams } from "./officer-checkin-alert";
export { buildOfficerOverstayAlertMessage } from "./officer-overstay-alert";
export type { OfficerOverstayAlertParams } from "./officer-overstay-alert";
