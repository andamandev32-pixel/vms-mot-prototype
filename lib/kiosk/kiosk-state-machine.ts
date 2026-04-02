/**
 * Kiosk State Machine — Pure Logic (Platform-Agnostic)
 *
 * Flutter dev: Convert this reducer to BLoC's mapEventToState
 * → kiosk_bloc.dart
 *
 * This is a pure function: (state, event) → newState
 * No side effects, no UI, no framework dependency.
 */

import type { KioskState, KioskEvent } from "./kiosk-types";

/** Initial state */
export const initialKioskState: KioskState = { type: "WELCOME" };

/**
 * Core state machine reducer
 * Given current state + event → returns next state
 */
export function kioskReducer(state: KioskState, event: KioskEvent): KioskState {
  switch (state.type) {
    // ───────────── WELCOME ─────────────
    case "WELCOME":
      if (event.type === "SELECT_WALKIN")
        return {
          type: "PDPA_CONSENT",
          case: "walkin",
          identityVerified: event.identityVerified,
          visitorData: event.visitorData,
        };
      if (event.type === "SELECT_APPOINTMENT")
        return { type: "PDPA_CONSENT", case: "appointment" };
      break;

    // ───────────── PDPA CONSENT ─────────────
    case "PDPA_CONSENT":
      if (event.type === "ACCEPT_PDPA") {
        if (state.case === "walkin")
          return { ...state, type: "SELECT_PURPOSE" };
        return { ...state, type: "QR_SCAN" };
      }
      if (event.type === "GO_BACK")
        return { type: "WELCOME" };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── SELECT ID METHOD ─────────────
    case "SELECT_ID_METHOD":
      if (event.type === "CHOOSE_ID_METHOD" && event.idMethod)
        return { ...state, type: "ID_VERIFICATION", idMethod: event.idMethod };
      if (event.type === "GO_BACK") {
        if (state.case === "walkin") return { ...state, type: "SELECT_PURPOSE" };
        // Appointment no-QR path: back to QR scan
        return { ...state, type: "QR_SCAN" };
      }
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── ID VERIFICATION ─────────────
    case "ID_VERIFICATION":
      if (event.type === "ID_READ_SUCCESS" && event.visitorData) {
        if (state.case === "walkin") {
          return {
            ...state,
            type: "DATA_PREVIEW",
            visitorData: event.visitorData,
          };
        }
        // Appointment no-QR path: after ID read → search for appointment
        return {
          ...state,
          type: "APPOINTMENT_PREVIEW",
          visitorData: event.visitorData,
          appointmentPath: "no-qr",
        };
      }
      if (event.type === "ID_READ_FAILED")
        return {
          type: "ERROR",
          errorMessage: event.errorMessage || "ไม่สามารถอ่านข้อมูลได้",
          retryState: state,
        };
      if (event.type === "GO_BACK")
        return { ...state, type: "SELECT_ID_METHOD", idMethod: undefined };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── DATA PREVIEW (Walk-in) ─────────────
    case "DATA_PREVIEW":
      if (event.type === "CONFIRM_DATA")
        return { ...state, type: "FACE_CAPTURE" };
      if (event.type === "GO_BACK")
        return { ...state, type: "ID_VERIFICATION" };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── SELECT PURPOSE (Walk-in) ─────────────
    case "SELECT_PURPOSE":
      if (event.type === "SELECT_VISIT_PURPOSE" && event.purpose) {
        // If visitor already verified identity (returning walk-in), skip ID steps
        if (state.identityVerified)
          return { ...state, type: "FACE_CAPTURE", selectedPurpose: event.purpose };
        return { ...state, type: "SELECT_ID_METHOD", selectedPurpose: event.purpose };
      }
      if (event.type === "GO_BACK")
        return { ...state, type: "PDPA_CONSENT" };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── FACE CAPTURE (All flows) ─────────────
    case "FACE_CAPTURE":
      if (event.type === "FACE_CAPTURED" && event.photo)
        return { ...state, type: "WIFI_OFFER", capturedPhoto: event.photo };
      if (event.type === "FACE_CONFIRMED") {
        const wifi = event.wifiAccepted ?? false;
        return {
          ...state,
          type: "SUCCESS",
          capturedPhoto: event.photo,
          wifiAccepted: wifi,
          ...(wifi ? {
            wifiCredentials: {
              ssid: "MOTS-Guest",
              password: "mots" + new Date().getFullYear(),
              validUntil: new Date().toISOString(),
            },
          } : {}),
        };
      }
      if (event.type === "SKIP_WIFI")
        return { ...state, type: "SUCCESS", capturedPhoto: event.photo, wifiAccepted: false };
      if (event.type === "FACE_CAPTURE_FAILED")
        return {
          type: "ERROR",
          errorMessage: event.errorMessage || "ไม่สามารถถ่ายภาพได้",
          retryState: state,
        };
      if (event.type === "GO_BACK") {
        if (state.case === "appointment")
          return { ...state, type: "APPOINTMENT_VERIFY_ID" };
        // Walk-in: if already verified, back to purpose; otherwise back to data preview
        if (state.identityVerified)
          return { ...state, type: "SELECT_PURPOSE" };
        return { ...state, type: "DATA_PREVIEW" };
      }
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── WIFI OFFER ─────────────
    case "WIFI_OFFER":
      if (event.type === "ACCEPT_WIFI")
        return {
          ...state,
          type: "SUCCESS",
          wifiAccepted: true,
          wifiCredentials: {
            ssid: "MOTS-Guest",
            password: "mots" + new Date().getFullYear(),
            validUntil: new Date().toISOString(),
          },
        };
      if (event.type === "DECLINE_WIFI")
        return { ...state, type: "SUCCESS", wifiAccepted: false };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── SUCCESS ─────────────
    case "SUCCESS":
      if (event.type === "CHOOSE_PRINT")
        return { ...state, printSlip: true };
      if (event.type === "SKIP_PRINT")
        return { ...state, printSlip: false };
      if (event.type === "PRINT_COMPLETE" || event.type === "TIMEOUT" || event.type === "RESET")
        return { type: "WELCOME" };
      break;

    // ───────────── QR SCAN ─────────────
    case "QR_SCAN":
      if (event.type === "QR_SCANNED" && event.appointmentData)
        return {
          ...state,
          type: "APPOINTMENT_PREVIEW",
          appointmentData: event.appointmentData,
          lineLinked: event.appointmentData.lineLinked,
        };
      if (event.type === "QR_SCAN_FAILED")
        return {
          type: "ERROR",
          errorMessage: event.errorMessage || "ไม่สามารถอ่าน QR Code ได้",
          retryState: state,
        };
      if (event.type === "NO_QR_CODE")
        return { ...state, type: "SELECT_ID_METHOD", appointmentPath: "no-qr" };
      if (event.type === "GO_BACK")
        return { ...state, type: "PDPA_CONSENT" };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── APPOINTMENT PREVIEW ─────────────
    case "APPOINTMENT_PREVIEW":
      if (event.type === "CONFIRM_CHECKIN")
        return { ...state, type: "APPOINTMENT_VERIFY_ID" };
      if (event.type === "APPOINTMENT_NOT_FOUND")
        return {
          type: "ERROR",
          errorMessage: "ไม่พบนัดหมายที่ตรงกับข้อมูล",
          retryState: { type: "QR_SCAN", case: "appointment" },
        };
      if (event.type === "GO_BACK") {
        if (state.appointmentPath === "no-qr")
          return { ...state, type: "SELECT_ID_METHOD" };
        return { ...state, type: "QR_SCAN" };
      }
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── APPOINTMENT: VERIFY ID (after preview) ─────────────
    case "APPOINTMENT_VERIFY_ID":
      if (event.type === "CHOOSE_ID_METHOD" && event.idMethod)
        return { ...state, idMethod: event.idMethod };
      if (event.type === "ID_READ_SUCCESS")
        return { ...state, type: "FACE_CAPTURE", visitorData: event.visitorData };
      if (event.type === "ID_READ_FAILED")
        return {
          type: "ERROR",
          errorMessage: event.errorMessage || "ไม่สามารถอ่านข้อมูลได้",
          retryState: state,
        };
      if (event.type === "GO_BACK")
        return { ...state, type: "APPOINTMENT_PREVIEW" };
      if (event.type === "TIMEOUT") return { type: "TIMEOUT" };
      break;

    // ───────────── PENDING_APPROVAL (Walk-in ที่ต้อง approve) ─────────────
    case "PENDING_APPROVAL":
      if (event.type === "APPOINTMENT_APPROVED")
        return { ...state, type: "FACE_CAPTURE" };
      if (event.type === "APPOINTMENT_REJECTED")
        return { ...state, type: "ERROR", errorMessage: "คำขอถูกปฏิเสธ กรุณาติดต่อเคาน์เตอร์" };
      if (event.type === "GO_BACK")
        return { ...state, type: "SELECT_PURPOSE" };
      if (event.type === "TIMEOUT")
        return { ...state, type: "ERROR", errorMessage: "หมดเวลารออนุมัติ กรุณาติดต่อเคาน์เตอร์" };
      break;

    // ───────────── ERROR ─────────────
    case "ERROR":
      if (event.type === "GO_BACK" && state.retryState)
        return state.retryState;
      if (event.type === "RESET" || event.type === "TIMEOUT")
        return { type: "WELCOME" };
      break;

    // ───────────── TIMEOUT ─────────────
    case "TIMEOUT":
      return { type: "WELCOME" };
  }

  // No matching transition → stay in current state
  return state;
}

/**
 * Get all valid events for a given state
 * Useful for UI to know which buttons to show
 */
export function getValidEvents(state: KioskState): KioskEvent["type"][] {
  const events: KioskEvent["type"][] = [];

  switch (state.type) {
    case "WELCOME":
      events.push("SELECT_WALKIN", "SELECT_APPOINTMENT");
      break;
    case "SELECT_ID_METHOD":
      events.push("CHOOSE_ID_METHOD", "GO_BACK", "TIMEOUT");
      break;
    case "ID_VERIFICATION":
      events.push("ID_READ_SUCCESS", "ID_READ_FAILED", "GO_BACK", "TIMEOUT");
      break;
    case "DATA_PREVIEW":
      events.push("CONFIRM_DATA", "GO_BACK", "TIMEOUT");
      break;
    case "SELECT_PURPOSE":
      events.push("SELECT_VISIT_PURPOSE", "GO_BACK", "TIMEOUT");
      break;
    case "FACE_CAPTURE":
      events.push("FACE_CAPTURED", "FACE_CAPTURE_FAILED", "SKIP_WIFI", "GO_BACK", "TIMEOUT");
      break;
    case "WIFI_OFFER":
      events.push("ACCEPT_WIFI", "DECLINE_WIFI", "TIMEOUT");
      break;
    case "SUCCESS":
      events.push("PRINT_COMPLETE", "CHOOSE_PRINT", "SKIP_PRINT", "TIMEOUT", "RESET");
      break;
    case "SUCCESS":
      events.push("PRINT_COMPLETE", "RESET", "TIMEOUT");
      break;
    case "PDPA_CONSENT":
      events.push("ACCEPT_PDPA", "GO_BACK", "TIMEOUT");
      break;
    case "QR_SCAN":
      events.push("QR_SCANNED", "QR_SCAN_FAILED", "NO_QR_CODE", "GO_BACK", "TIMEOUT");
      break;
    case "APPOINTMENT_PREVIEW":
      events.push("CONFIRM_CHECKIN", "APPOINTMENT_NOT_FOUND", "GO_BACK", "TIMEOUT");
      break;
    case "APPOINTMENT_VERIFY_ID":
      events.push("CHOOSE_ID_METHOD", "ID_READ_SUCCESS", "ID_READ_FAILED", "GO_BACK", "TIMEOUT");
      break;
    case "ERROR":
      events.push("GO_BACK", "RESET", "TIMEOUT");
      break;
    case "TIMEOUT":
      events.push("RESET");
      break;
  }

  return events;
}
