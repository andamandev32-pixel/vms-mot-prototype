/**
 * Kiosk Types — Platform-Agnostic Type Definitions
 *
 * Flutter dev: Map these directly to Dart classes/enums
 * → kiosk_types.dart
 */

// ===== ENUMS =====

export type KioskCase = "walkin" | "appointment";
export type KioskLocale = "th" | "en";
export type IdMethod = "thai-id-card" | "passport" | "thai-id-app";
export type AppointmentPath = "has-qr" | "no-qr";

/** Hardware devices on the kiosk machine */
export type HardwareDevice =
  | "camera"
  | "qr-reader"
  | "id-reader"
  | "passport-reader"
  | "printer";

// ===== DATA MODELS =====

/** Data read from ID card / Passport / ThaiID */
export interface VisitorIdentity {
  fullNameTh: string;
  fullNameEn: string;
  idNumber: string;
  dateOfBirth: string;
  photo?: string; // base64 or URL
  address?: string;
  issueDate?: string;
  expiryDate?: string;
  documentType: IdMethod;
}

/** Appointment data (from QR scan or lookup) */
export interface AppointmentData {
  bookingCode: string;
  visitorName: string;
  visitorCompany?: string;
  hostName: string;
  hostDepartment: string;
  hostFloor: string;
  location: string;
  locationEn: string;
  date: string;
  dateEnd?: string;         // period mode: end date
  timeSlot: string;
  entryMode?: "single" | "period";
  purposeName: string;
  purposeNameEn: string;
  purposeIcon: string;
  status: string;
  /** ผู้จองขอ WiFi ไว้ตอนนัดหมายล่วงหน้า */
  wifiRequested?: boolean;
  /** ผู้จองผูก LINE OA ไว้แล้ว */
  lineLinked?: boolean;
}

/** Visit purpose selection */
export interface VisitPurposeOption {
  id: number;
  name: string;
  nameEn: string;
  icon: string;
  description?: string;
  descriptionEn?: string;
  wifiEnabled?: boolean;
}

/** WiFi credentials */
export interface WifiCredentials {
  ssid: string;
  password: string;
  validUntil: string;
}

/** Visit Slip data for printing */
export interface SlipData {
  slipNumber: string;
  visitorName: string;
  visitorNameEn?: string;
  idNumber: string;
  visitPurpose: string;
  visitPurposeEn?: string;
  hostName: string;
  department: string;
  accessZone: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  wifi?: WifiCredentials;
  qrCodeData: string;
  companions?: number;
  vehiclePlate?: string;
}

/** Audio cue for TTS */
export interface AudioCue {
  th: string;
  en: string;
}

// ===== STATE TYPES =====

/**
 * All possible Kiosk states
 * Flutter dev: Each becomes a subclass of KioskState in BLoC
 */
export type KioskStateType =
  // Common
  | "WELCOME"
  | "PDPA_CONSENT"
  | "SELECT_ID_METHOD"
  | "ID_VERIFICATION"
  | "DATA_PREVIEW"
  | "WIFI_OFFER"
  | "SUCCESS"
  // Walk-in specific
  | "SELECT_PURPOSE"
  | "FACE_CAPTURE"
  // Appointment specific
  | "QR_SCAN"
  | "APPOINTMENT_PREVIEW"
  | "APPOINTMENT_VERIFY_ID"
  // System
  | "ERROR"
  | "TIMEOUT";

export interface KioskState {
  type: KioskStateType;
  case?: KioskCase;
  idMethod?: IdMethod;
  appointmentPath?: AppointmentPath;
  visitorData?: VisitorIdentity;
  appointmentData?: AppointmentData;
  selectedPurpose?: VisitPurposeOption;
  capturedPhoto?: string;
  wifiAccepted?: boolean;
  wifiCredentials?: WifiCredentials;
  slipData?: SlipData;
  /** Walk-in ที่ยืนยันตัวตนแล้ว (เคยมาแล้ว) — ข้ามขั้นตอนยืนยันตัวตนซ้ำ */
  identityVerified?: boolean;
  /** ผู้เยี่ยมผูก LINE ไว้แล้ว — ถามก่อนพิมพ์ slip */
  lineLinked?: boolean;
  /** ผู้เยี่ยมเลือกพิมพ์ slip หรือไม่ (undefined = ยังไม่ถาม, กรณีไม่มี LINE จะพิมพ์อัตโนมัติ) */
  printSlip?: boolean;
  errorMessage?: string;
  retryState?: KioskState;
}

// ===== EVENT TYPES =====

/**
 * All possible Kiosk events (user actions + system events)
 * Flutter dev: Each becomes an Event class in BLoC
 */
export type KioskEventType =
  // Navigation
  | "SELECT_WALKIN"
  | "SELECT_APPOINTMENT"
  | "ACCEPT_PDPA"
  | "GO_BACK"
  | "RESET"
  // ID Verification
  | "CHOOSE_ID_METHOD"
  | "ID_READ_SUCCESS"
  | "ID_READ_FAILED"
  | "CONFIRM_DATA"
  // Walk-in
  | "SELECT_VISIT_PURPOSE"
  | "FACE_CAPTURED"
  | "FACE_CONFIRMED"
  | "FACE_CAPTURE_FAILED"
  // WiFi + Success
  | "ACCEPT_WIFI"
  | "DECLINE_WIFI"
  | "SKIP_WIFI"
  | "PRINT_COMPLETE"
  | "CHOOSE_PRINT"
  | "SKIP_PRINT"
  // Appointment
  | "HAS_QR_CODE"
  | "NO_QR_CODE"
  | "QR_SCANNED"
  | "QR_SCAN_FAILED"
  | "APPOINTMENT_FOUND"
  | "APPOINTMENT_NOT_FOUND"
  | "CONFIRM_CHECKIN"
  // System
  | "TIMEOUT";

export interface KioskEvent {
  type: KioskEventType;
  idMethod?: IdMethod;
  visitorData?: VisitorIdentity;
  appointmentData?: AppointmentData;
  purpose?: VisitPurposeOption;
  photo?: string;
  wifiAccepted?: boolean;
  bookingCode?: string;
  errorMessage?: string;
  /** Walk-in ที่ยืนยันตัวตนแล้ว — ข้ามขั้นตอนยืนยันซ้ำ */
  identityVerified?: boolean;
}

// ===== STEP INFO (for Demo Panel) =====

export interface StepInfo {
  id: string;
  stateType: KioskStateType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  activeDevice: HardwareDevice | null;
  audioCue?: AudioCue;
  conditions: string[];
  conditionsEn: string[];
  possibleTransitions: {
    event: KioskEventType;
    targetState: KioskStateType;
    description: string;
  }[];
  flutterHint: {
    bloc: string;
    state: string;
    device?: string;
    plugin?: string;
  };
  timeoutSeconds?: number;
}
