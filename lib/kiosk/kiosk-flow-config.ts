/**
 * Kiosk Flow Configurations — Step definitions for each case
 *
 * Flutter dev: Use these to build the step indicator UI
 * and understand the navigation flow for each case.
 */

import type { StepInfo, KioskStateType } from "./kiosk-types";

// ===== WALK-IN FLOW: 8 Steps =====
export const walkinSteps: StepInfo[] = [
  {
    id: "w1",
    stateType: "WELCOME",
    title: "หน้าต้อนรับ",
    titleEn: "Welcome",
    description: "เลือก \"ไม่มีนัดหมาย/ผู้มาติดต่อ\" เพื่อเริ่ม walk-in",
    descriptionEn: "Tap 'Walk-in / No Appointment' to begin",
    activeDevice: null,
    conditions: ["Kiosk ต้องอยู่ในสถานะ online", "อยู่ในเวลาทำการ"],
    conditionsEn: ["Kiosk must be online", "Within business hours"],
    possibleTransitions: [
      { event: "SELECT_WALKIN", targetState: "PDPA_CONSENT", description: "กดปุ่มไม่มีนัดหมาย" },
      { event: "SELECT_APPOINTMENT", targetState: "PDPA_CONSENT", description: "กดปุ่มมีนัดล่วงหน้า" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "WelcomeState" },
  },
  {
    id: "w1b",
    stateType: "PDPA_CONSENT",
    title: "ยินยอม PDPA",
    titleEn: "PDPA Consent",
    description: "อ่านและยอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล",
    descriptionEn: "Read and accept the privacy policy (PDPA)",
    activeDevice: null,
    audioCue: { th: "กรุณาอ่านและยอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล คะ", en: "Please read and accept the privacy policy." },
    conditions: ["ต้องกดยอมรับก่อนดำเนินการต่อ"],
    conditionsEn: ["Must accept before proceeding"],
    possibleTransitions: [
      { event: "ACCEPT_PDPA", targetState: "SELECT_ID_METHOD", description: "ยอมรับ PDPA → ไปยืนยันตัวตน" },
      { event: "GO_BACK", targetState: "WELCOME", description: "ปฏิเสธ → กลับหน้าแรก" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "PdpaConsentState" },
    timeoutSeconds: 120,
  },
  {
    id: "w2",
    stateType: "SELECT_ID_METHOD",
    title: "เลือกวิธียืนยันตัวตน",
    titleEn: "Select ID Method",
    description: "เลือกวิธียืนยันตัวตน: บัตรประชาชน / Passport / ThaiID",
    descriptionEn: "Choose identity verification method",
    activeDevice: null,
    audioCue: { th: "เลือกเอกสารการยืนยันตัวตน คะ", en: "Please select your identification method." },
    conditions: ["แสดงเฉพาะเอกสารที่ Kiosk นี้รองรับ"],
    conditionsEn: ["Show only documents supported by this kiosk"],
    possibleTransitions: [
      { event: "CHOOSE_ID_METHOD", targetState: "ID_VERIFICATION", description: "เลือกวิธียืนยัน" },
      { event: "GO_BACK", targetState: "PDPA_CONSENT", description: "ย้อนกลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "SelectIdMethodState" },
    timeoutSeconds: 60,
  },
  {
    id: "w3",
    stateType: "ID_VERIFICATION",
    title: "ยืนยันตัวตน",
    titleEn: "Verify Identity",
    description: "อ่านข้อมูลจากอุปกรณ์ตามวิธีที่เลือก",
    descriptionEn: "Read data from selected device",
    activeDevice: null,
    conditions: [
      "บัตร ปชช. → เครื่องอ่านบัตร",
      "Passport → เครื่องอ่าน Passport",
      "ThaiID → QR Code บนจอ",
    ],
    conditionsEn: [
      "Thai ID Card → Smart Card Reader",
      "Passport → Passport Scanner",
      "ThaiID → Display QR on screen",
    ],
    possibleTransitions: [
      { event: "ID_READ_SUCCESS", targetState: "DATA_PREVIEW", description: "อ่านสำเร็จ" },
      { event: "ID_READ_FAILED", targetState: "ERROR", description: "อ่านไม่สำเร็จ" },
      { event: "GO_BACK", targetState: "SELECT_ID_METHOD", description: "เปลี่ยนวิธี" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "IdVerificationState", device: "SmartCardReader / PassportReader / ThaiIDService" },
    timeoutSeconds: 60,
  },
  {
    id: "w4",
    stateType: "DATA_PREVIEW",
    title: "ตรวจสอบข้อมูล",
    titleEn: "Review Data",
    description: "แสดงข้อมูลที่อ่านได้ให้ผู้ใช้ยืนยัน",
    descriptionEn: "Display read data for user confirmation",
    activeDevice: null,
    conditions: ["ตรวจสอบ Blocklist"],
    conditionsEn: ["Check Blocklist"],
    possibleTransitions: [
      { event: "CONFIRM_DATA", targetState: "SELECT_PURPOSE", description: "ข้อมูลถูกต้อง" },
      { event: "GO_BACK", targetState: "ID_VERIFICATION", description: "กลับยืนยันใหม่" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "DataPreviewState" },
    timeoutSeconds: 120,
  },
  {
    id: "w5",
    stateType: "SELECT_PURPOSE",
    title: "เลือกวัตถุประสงค์",
    titleEn: "Select Purpose",
    description: "เลือกวัตถุประสงค์การเข้าพื้นที่",
    descriptionEn: "Select visit purpose",
    activeDevice: null,
    audioCue: { th: "เลือกรายการเข้าพื้นที่ คะ", en: "Please select your visit purpose." },
    conditions: ["แสดงเฉพาะ purpose ที่ showOnKiosk = true"],
    conditionsEn: ["Show only purposes where showOnKiosk = true"],
    possibleTransitions: [
      { event: "SELECT_VISIT_PURPOSE", targetState: "FACE_CAPTURE", description: "เลือกแล้ว → ถ่ายภาพ" },
      { event: "GO_BACK", targetState: "DATA_PREVIEW", description: "กลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "SelectPurposeState" },
    timeoutSeconds: 60,
  },
  {
    id: "w6",
    stateType: "FACE_CAPTURE",
    title: "ถ่ายภาพ + WiFi",
    titleEn: "Face Photo + WiFi",
    description: "ถ่ายภาพใบหน้า + ถาม WiFi ในหน้าเดียว",
    descriptionEn: "Capture face photo + WiFi offer in one screen",
    activeDevice: "camera",
    conditions: ["กล้องต้องพร้อมใช้งาน", "ตรวจจับใบหน้าอัตโนมัติ", "ถาม WiFi เฉพาะประเภทที่เปิดใช้", "ถ้าผูก LINE → หน้า Success จะถามก่อนพิมพ์ slip"],
    conditionsEn: ["Camera must be available", "Auto face detection", "WiFi offer only for enabled purposes", "LINE-linked visitors will be asked before printing slip"],
    possibleTransitions: [
      { event: "FACE_CONFIRMED", targetState: "SUCCESS", description: "ยืนยันภาพ+WiFi → สำเร็จ" },
      { event: "FACE_CAPTURE_FAILED", targetState: "ERROR", description: "ถ่ายไม่สำเร็จ" },
      { event: "GO_BACK", targetState: "SELECT_PURPOSE", description: "กลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "FaceCaptureState", device: "USB Camera", plugin: "camera / google_mlkit_face_detection" },
    timeoutSeconds: 60,
  },
];

// ===== APPOINTMENT FLOW: 6 Steps =====
export const appointmentSteps: StepInfo[] = [
  {
    id: "a1",
    stateType: "WELCOME",
    title: "หน้าต้อนรับ",
    titleEn: "Welcome",
    description: "กดปุ่ม \"มีนัดล่วงหน้า\"",
    descriptionEn: "Tap 'Appointment / Scan QR'",
    activeDevice: null,
    conditions: ["Kiosk ต้อง online"],
    conditionsEn: ["Kiosk must be online"],
    possibleTransitions: [
      { event: "SELECT_APPOINTMENT", targetState: "PDPA_CONSENT", description: "กดปุ่มมีนัดล่วงหน้า" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "WelcomeState" },
  },
  {
    id: "a1b",
    stateType: "PDPA_CONSENT",
    title: "ยินยอม PDPA",
    titleEn: "PDPA Consent",
    description: "ยอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล",
    descriptionEn: "Accept privacy policy (PDPA)",
    activeDevice: null,
    conditions: ["ต้องกดยอมรับก่อนดำเนินการต่อ"],
    conditionsEn: ["Must accept before proceeding"],
    possibleTransitions: [
      { event: "ACCEPT_PDPA", targetState: "QR_SCAN", description: "ยอมรับ → สแกน QR" },
      { event: "GO_BACK", targetState: "WELCOME", description: "ปฏิเสธ → กลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "PdpaConsentState" },
    timeoutSeconds: 120,
  },
  {
    id: "a2",
    stateType: "QR_SCAN",
    title: "สแกน QR Code",
    titleEn: "Scan QR Code",
    description: "สแกน QR Code นัดหมาย หรือกด \"ไม่มี QR\" เพื่อยืนยันตัวตนแทน",
    descriptionEn: "Scan appointment QR Code, or tap 'No QR' to verify by ID",
    activeDevice: "qr-reader",
    audioCue: { th: "สแกน QR Code นัดหมาย คะ", en: "Please scan your appointment QR Code." },
    conditions: ["มีปุ่ม 'ไม่มี QR Code' ให้ข้ามไปยืนยันตัวตน"],
    conditionsEn: ["Has 'No QR Code' button to skip to ID verification"],
    possibleTransitions: [
      { event: "QR_SCANNED", targetState: "APPOINTMENT_PREVIEW", description: "สแกนสำเร็จ" },
      { event: "NO_QR_CODE", targetState: "SELECT_ID_METHOD", description: "ไม่มี QR → ยืนยันตัวตน" },
      { event: "GO_BACK", targetState: "PDPA_CONSENT", description: "กลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "QrScanState", device: "QR Scanner", plugin: "usb_serial / flutter_barcode_scanner" },
    timeoutSeconds: 60,
  },
  {
    id: "a3",
    stateType: "APPOINTMENT_PREVIEW",
    title: "ข้อมูลนัดหมาย",
    titleEn: "Appointment Details",
    description: "แสดงข้อมูลนัดหมาย กดยืนยัน Check-in",
    descriptionEn: "Show appointment details, confirm check-in",
    activeDevice: null,
    conditions: ["ยืนยัน Check-in → ไปยืนยันตัวตน"],
    conditionsEn: ["Confirm Check-in → verify identity"],
    possibleTransitions: [
      { event: "CONFIRM_CHECKIN", targetState: "APPOINTMENT_VERIFY_ID", description: "ยืนยัน → ยืนยันตัวตน" },
      { event: "GO_BACK", targetState: "QR_SCAN", description: "กลับสแกนใหม่" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "AppointmentPreviewState" },
    timeoutSeconds: 120,
  },
  {
    id: "a4",
    stateType: "APPOINTMENT_VERIFY_ID",
    title: "ยืนยันตัวตน",
    titleEn: "Verify Identity",
    description: "ยืนยันตัวตนด้วยบัตรประชาชน/Passport/ThaiID",
    descriptionEn: "Verify identity with ID card/Passport/ThaiID",
    activeDevice: null,
    conditions: ["เลือกวิธียืนยัน → อ่านข้อมูลอัตโนมัติ"],
    conditionsEn: ["Select method → auto-read data"],
    possibleTransitions: [
      { event: "ID_READ_SUCCESS", targetState: "WIFI_OFFER", description: "ยืนยันสำเร็จ → WiFi" },
      { event: "GO_BACK", targetState: "APPOINTMENT_PREVIEW", description: "กลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "AppointmentVerifyIdState" },
    timeoutSeconds: 60,
  },
  {
    id: "a4b",
    stateType: "FACE_CAPTURE",
    title: "ถ่ายภาพใบหน้า",
    titleEn: "Face Photo",
    description: "ถ่ายภาพใบหน้าด้วยกล้อง Kiosk",
    descriptionEn: "Capture face photo via kiosk camera",
    activeDevice: "camera",
    conditions: ["กล้องต้องพร้อมใช้งาน", "ตรวจจับใบหน้าอัตโนมัติ"],
    conditionsEn: ["Camera must be available", "Auto face detection"],
    possibleTransitions: [
      { event: "FACE_CAPTURED", targetState: "WIFI_OFFER", description: "ถ่ายสำเร็จ" },
      { event: "FACE_CAPTURE_FAILED", targetState: "ERROR", description: "ถ่ายไม่สำเร็จ" },
      { event: "GO_BACK", targetState: "APPOINTMENT_VERIFY_ID", description: "กลับ" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "FaceCaptureState", device: "USB Camera", plugin: "camera / google_mlkit_face_detection" },
    timeoutSeconds: 30,
  },
  {
    id: "a5",
    stateType: "WIFI_OFFER",
    title: "WiFi + สำเร็จ",
    titleEn: "WiFi + Done",
    description: "ถาม WiFi (ถ้าขอไว้ตอนนัดหมายจะเลือกไว้ให้ แก้ไขได้) → พิมพ์ Visit Slip (ถ้าผูก LINE จะถามก่อนพิมพ์)",
    descriptionEn: "Offer WiFi (pre-selected if requested during booking, editable) → print Visit Slip (LINE-linked visitors can skip print)",
    activeDevice: "printer",
    audioCue: { th: "ทำรายการเสร็จเรียบร้อยค่ะ", en: "Registration completed successfully." },
    conditions: ["พิมพ์ Visit Slip", "ถ้าขอ WiFi ไว้ตอนนัดหมาย → เลือกไว้ให้อัตโนมัติ", "ถ้าผูก LINE → ถามก่อนพิมพ์ slip"],
    conditionsEn: ["Print Visit Slip", "If WiFi requested during booking → pre-select", "If LINE-linked → ask before printing slip"],
    possibleTransitions: [
      { event: "ACCEPT_WIFI", targetState: "SUCCESS", description: "รับ WiFi" },
      { event: "DECLINE_WIFI", targetState: "SUCCESS", description: "ไม่รับ WiFi" },
    ],
    flutterHint: { bloc: "KioskBloc", state: "WifiOfferState", device: "Thermal Printer (80mm)", plugin: "esc_pos_printer" },
    timeoutSeconds: 15,
  },
];

// ===== STEP LOOKUP =====

export type FlowCase = "walkin" | "appointment";

export const flowSteps: Record<FlowCase, StepInfo[]> = {
  walkin: walkinSteps,
  appointment: appointmentSteps,
};

/** Get the step order (for progress indicator) */
export function getStepIndex(flow: FlowCase, stateType: KioskStateType): number {
  return flowSteps[flow].findIndex((s) => s.stateType === stateType);
}

/** Get total steps for a flow */
export function getTotalSteps(flow: FlowCase): number {
  return flowSteps[flow].length;
}

/** Get step info for current state */
export function getStepInfo(flow: FlowCase, stateType: KioskStateType): StepInfo | undefined {
  return flowSteps[flow].find((s) => s.stateType === stateType);
}
