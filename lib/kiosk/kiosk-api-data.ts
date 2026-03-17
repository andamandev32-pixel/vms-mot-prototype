/**
 * Kiosk API Specification Data — mapped to each KioskStateType
 *
 * Flutter dev: ใช้ข้อมูลนี้เป็น reference สำหรับ API integration
 * แต่ละ state จะมี API endpoint, request/response schema, tables ที่ใช้
 */

import type { KioskStateType } from "./kiosk-types";

// ===== TYPES =====

export interface KioskApiEndpoint {
  method: "GET" | "POST";
  path: string;
  summary: string;
  summaryEn: string;
  contentType?: string;
  tables: string[];
  request?: Record<string, unknown>;
  response: Record<string, unknown>;
  errorResponse?: Record<string, unknown>;
  notes?: string[];
  notesEn?: string[];
}

export interface KioskApiSpec {
  stateType: KioskStateType;
  hasApi: boolean;
  noApiReason?: string;
  noApiReasonEn?: string;
  endpoints: KioskApiEndpoint[];
}

// ===== DATA =====

const apiSpecs: KioskApiSpec[] = [
  // ─── WELCOME ───
  {
    stateType: "WELCOME",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/kiosk/config",
        summary: "โหลด config ตู้ + เช็คสถานะ online",
        summaryEn: "Load kiosk config + check online status",
        tables: ["service_points", "business_hours_rules", "service_point_purposes", "service_point_documents"],
        response: {
          servicePoint: {
            id: 1,
            name: "Kiosk ล็อบบี้ ชั้น 1 (ซ้าย)",
            type: "kiosk",
            status: "online",
            serialNumber: "KIOSK-C1-L001",
            wifi: { ssid: "MOTS-Guest", passwordPattern: "MOTSGuest{YYYY}" },
            supportedDocuments: ["thai-id-card", "passport", "thai-id-app"],
            supportedPurposes: [1, 2, 3, 4, 5, 6, 7],
          },
          businessHours: {
            isOpen: true,
            allowWalkin: true,
            allowKiosk: true,
            todaySchedule: { openTime: "08:00", closeTime: "17:00" },
          },
          serverTime: "2026-03-15T08:30:00+07:00",
        },
        notes: ["เรียกตอน boot หรือ reset กลับหน้าแรก", "Cache ได้ — refresh ทุก 5 นาที"],
        notesEn: ["Called on boot or reset to welcome", "Cacheable — refresh every 5 min"],
      },
    ],
  },

  // ─── PDPA_CONSENT ───
  {
    stateType: "PDPA_CONSENT",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/kiosk/pdpa",
        summary: "ดึงข้อความ PDPA เวอร์ชันล่าสุด",
        summaryEn: "Get latest PDPA consent text",
        tables: ["pdpa_consent_configs", "pdpa_consent_versions"],
        response: {
          version: 3,
          titleTh: "นโยบายคุ้มครองข้อมูลส่วนบุคคล",
          titleEn: "Personal Data Protection Policy",
          bodyTh: "กระทรวงการท่องเที่ยวและกีฬา...",
          bodyEn: "The Ministry of Tourism and Sports...",
          retentionDays: 90,
          requireScrollToBottom: true,
          effectiveDate: "2026-01-15",
        },
        notes: ["Cache ได้ — เปลี่ยนไม่บ่อย"],
        notesEn: ["Cacheable — rarely changes"],
      },
      {
        method: "POST",
        path: "/kiosk/pdpa/consent",
        summary: "บันทึกการยินยอม PDPA",
        summaryEn: "Record PDPA consent",
        tables: ["pdpa_consent_logs"],
        request: {
          configVersion: 3,
          consentChannel: "kiosk",
          servicePointId: 1,
          visitorIdNumber: "1234567890123",
          consentGiven: true,
        },
        response: {
          consentId: 42,
          recordedAt: "2026-03-15T09:01:00+07:00",
        },
        notes: ["บันทึกก่อนหรือหลัง verify ก็ได้"],
        notesEn: ["Can record before or after ID verification"],
      },
    ],
  },

  // ─── SELECT_ID_METHOD ───
  {
    stateType: "SELECT_ID_METHOD",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/kiosk/id-methods",
        summary: "ดึงวิธียืนยันตัวตนที่ตู้รองรับ",
        summaryEn: "Get supported ID verification methods",
        tables: ["identity_document_types", "service_point_documents", "visit_purpose_channel_documents"],
        response: {
          methods: [
            { id: 1, code: "thai-id-card", name: "บัตรประชาชน", nameEn: "Thai National ID Card", deviceRequired: "id-reader" },
            { id: 2, code: "passport", name: "หนังสือเดินทาง", nameEn: "Passport", deviceRequired: "passport-reader" },
            { id: 5, code: "thai-id-app", name: "แอป ThaiID", nameEn: "ThaiID App", deviceRequired: "qr-reader" },
          ],
        },
        notes: ["ดึงจาก /kiosk/config ได้ (cached)"],
        notesEn: ["Can use cached data from /kiosk/config"],
      },
    ],
  },

  // ─── ID_VERIFICATION ───
  {
    stateType: "ID_VERIFICATION",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/verify-identity",
        summary: "ยืนยันตัวตน + เช็ค blocklist",
        summaryEn: "Verify identity + check blocklist",
        tables: ["visitors", "blocklist", "visit_records"],
        request: {
          documentType: "thai-id-card",
          idNumber: "1234567890123",
          fullNameTh: "นายสมชาย ใจดี",
          fullNameEn: "MR. SOMCHAI JAIDEE",
          dateOfBirth: "1985-06-15",
          photo: "<base64>",
          servicePointId: 1,
        },
        response: {
          status: "ok",
          visitorId: 15,
          isNewVisitor: false,
          isBlocked: false,
          existingAppointments: [],
          previousVisitCount: 3,
          verifiedData: {
            fullNameTh: "นายสมชาย ใจดี",
            fullNameEn: "MR. SOMCHAI JAIDEE",
            idNumber: "1-2345-67890-12-3",
          },
        },
        errorResponse: {
          status: "blocked",
          isBlocked: true,
          blockReason: "ประพฤติไม่เหมาะสม",
          message: "ท่านถูกระงับการเข้าพื้นที่",
        },
        notes: ["Upsert visitor ถ้าเป็นคนใหม่", "เช็ค blocklist ก่อนบันทึก", "ถ้ามีนัดหมายวันนี้ → แนะนำ appointment flow"],
        notesEn: ["Upsert visitor if new", "Check blocklist before saving", "If has today's appointment → suggest appointment flow"],
      },
    ],
  },

  // ─── DATA_PREVIEW ───
  {
    stateType: "DATA_PREVIEW",
    hasApi: false,
    noApiReason: "ใช้ข้อมูลจาก verify-identity response — ไม่ต้องเรียก API",
    noApiReasonEn: "Uses data from verify-identity response — no API call needed",
    endpoints: [],
  },

  // ─── SELECT_PURPOSE ───
  {
    stateType: "SELECT_PURPOSE",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/kiosk/purposes",
        summary: "ดึงวัตถุประสงค์ที่แสดงบน Kiosk",
        summaryEn: "Get visit purposes for kiosk display",
        tables: ["visit_purposes", "visit_purpose_department_rules", "visit_purpose_channel_configs", "service_point_purposes"],
        response: {
          purposes: [
            {
              id: 1,
              name: "ติดต่อราชการ",
              nameEn: "Official Business",
              icon: "🏛️",
              requirePhoto: true,
              departments: [
                { departmentId: 1, departmentName: "สำนักงานปลัด", floor: "ชั้น 3", requireApproval: true, offerWifi: true },
              ],
            },
            { id: 3, name: "ส่งเอกสาร / พัสดุ", nameEn: "Document Delivery", icon: "📄", requirePhoto: true },
            { id: 7, name: "รับ-ส่งสินค้า", nameEn: "Delivery / Pickup", icon: "📦", requirePhoto: false },
          ],
        },
        notes: ["กรองเฉพาะ show_on_kiosk = true", "Cache ได้ — refresh ตอน boot"],
        notesEn: ["Filter by show_on_kiosk = true", "Cacheable — refresh on boot"],
      },
    ],
  },

  // ─── FACE_CAPTURE ───
  {
    stateType: "FACE_CAPTURE",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/face-photo",
        summary: "อัปโหลดภาพถ่ายใบหน้า",
        summaryEn: "Upload face photo",
        contentType: "multipart/form-data",
        tables: ["visit_records"],
        request: {
          photo: "<binary_jpeg>",
          visitorId: 15,
          servicePointId: 1,
        },
        response: {
          photoPath: "/photos/2026/03/15/visitor-15-face.jpg",
          faceDetected: true,
          faceCount: 1,
          quality: "good",
        },
        notes: ["Compress JPEG 80% ก่อนอัปโหลด", "ตรวจจับใบหน้าฝั่ง backend"],
        notesEn: ["Compress JPEG to 80% before upload", "Face detection on backend"],
      },
    ],
  },

  // ─── WIFI_OFFER ───
  {
    stateType: "WIFI_OFFER",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/wifi/generate",
        summary: "สร้าง WiFi Credentials",
        summaryEn: "Generate WiFi credentials",
        tables: ["service_points", "visit_records"],
        request: {
          visitorId: 15,
          servicePointId: 1,
          accepted: true,
        },
        response: {
          ssid: "MOTS-Guest",
          password: "MOTSGuest2026",
          validUntil: "2026-03-15T17:00:00+07:00",
          validityDisplay: "ถึง 17:00 น. วันนี้",
        },
        notes: ["อาจ generate ฝั่ง Kiosk ตาม pattern จาก config", "ถ้าต้องการ central control → ใช้ API"],
        notesEn: ["Can generate on kiosk using pattern from config", "Use API for centralized control"],
      },
    ],
  },

  // ─── SUCCESS ───
  {
    stateType: "SUCCESS",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/checkin",
        summary: "สร้าง visit_record + ออก QR/Slip",
        summaryEn: "Create visit record + generate QR/Slip",
        tables: ["visit_records", "access_groups", "access_group_zones", "department_access_mappings", "visit_slip_templates", "visit_slip_sections", "visit_slip_fields", "purpose_slip_mappings"],
        request: {
          type: "walkin",
          visitorId: 15,
          servicePointId: 1,
          visitPurposeId: 1,
          departmentId: 1,
          idMethod: "thai-id-card",
          facePhotoPath: "/photos/.../face.jpg",
          wifiAccepted: true,
          pdpaConsentId: 42,
        },
        response: {
          visitRecord: { id: 42, bookingCode: "eVMS-20260315-0099", status: "checked-in" },
          accessControl: {
            accessGroupName: "ติดต่อราชการ ชั้น 2-5",
            qrCodeData: "eVMS-OFA-20260315-0099-A2B3C4",
            allowedZones: ["ล็อบบี้ ชั้น 1", "สำนักงานปลัด"],
            hikvisionSynced: true,
          },
          slip: { slipNumber: "eVMS-25680315-0099", lineLinked: false, askPrint: false },
          notification: { hostNotified: true, channel: "line" },
        },
        notes: ["API หลัก — รวม transaction ทั้งหมด", "Hikvision sync ทำ async ฝั่ง backend", "ใช้ idempotency key = booking_code"],
        notesEn: ["Main API — combines all transactions", "Hikvision sync is async on backend", "Use booking_code as idempotency key"],
      },
      {
        method: "POST",
        path: "/kiosk/slip/print",
        summary: "บันทึกว่าพิมพ์ slip แล้ว",
        summaryEn: "Record slip print status",
        tables: ["visit_records"],
        request: { visitRecordId: 42, printed: true },
        response: { updated: true, slipPrinted: true },
        notes: ["กรณีผูก LINE → ถามก่อนพิมพ์", "ถ้าไม่ผูก LINE → พิมพ์อัตโนมัติ"],
        notesEn: ["If LINE-linked → ask before printing", "If not LINE-linked → auto print"],
      },
    ],
  },

  // ─── QR_SCAN ───
  {
    stateType: "QR_SCAN",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/appointment/lookup-qr",
        summary: "ค้นหานัดหมายจาก QR Code",
        summaryEn: "Look up appointment by QR code",
        tables: ["visit_records", "visitors", "staff", "departments", "visit_purposes", "floor_departments", "floors"],
        request: {
          qrCodeData: "eVMS-20260315-0042",
          servicePointId: 1,
        },
        response: {
          found: true,
          appointment: {
            bookingCode: "eVMS-20260315-0042",
            visitorName: "นายสมชาย ใจดี",
            hostName: "นางสาวพิมพา เกษมศรี",
            hostDepartment: "กองการต่างประเทศ",
            hostFloor: "ชั้น 5",
            timeSlot: "10:00-11:30",
            status: "approved",
            wifiRequested: true,
            lineLinked: true,
          },
        },
        errorResponse: {
          found: false,
          reason: "not-found",
          message: "ไม่พบนัดหมายที่ตรงกับ QR Code นี้",
        },
        notes: ["ตรวจสอบสถานะ approved ก่อน check-in", "ถ้า pending → แสดง error message"],
        notesEn: ["Check approved status before check-in", "If pending → show error message"],
      },
    ],
  },

  // ─── APPOINTMENT_PREVIEW ───
  {
    stateType: "APPOINTMENT_PREVIEW",
    hasApi: false,
    noApiReason: "ใช้ข้อมูลจาก lookup-qr response — ไม่ต้องเรียก API",
    noApiReasonEn: "Uses data from lookup-qr response — no API call needed",
    endpoints: [],
  },

  // ─── APPOINTMENT_VERIFY_ID ───
  {
    stateType: "APPOINTMENT_VERIFY_ID",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/appointment/verify",
        summary: "ยืนยันตัวตนกับนัดหมาย",
        summaryEn: "Verify identity against appointment",
        tables: ["visitors", "visit_records", "blocklist"],
        request: {
          bookingCode: "eVMS-20260315-0042",
          documentType: "thai-id-card",
          idNumber: "1234567890123",
          fullNameTh: "นายสมชาย ใจดี",
          servicePointId: 1,
        },
        response: {
          status: "matched",
          visitorId: 15,
          isBlocked: false,
          matchResult: { nameMatch: true, idMatch: true, confidence: 1.0 },
        },
        errorResponse: {
          status: "mismatch",
          matchResult: { nameMatch: false, idMatch: false, confidence: 0.0 },
          message: "ข้อมูลบัตรไม่ตรงกับผู้จองนัดหมาย",
        },
        notes: ["ตรวจ blocklist + match กับข้อมูลนัดหมาย", "ถ้าไม่ตรง → แสดง error"],
        notesEn: ["Check blocklist + match against appointment data", "If mismatch → show error"],
      },
    ],
  },

  // ─── ERROR ───
  {
    stateType: "ERROR",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/kiosk/error-log",
        summary: "รายงาน error ไป backend (optional)",
        summaryEn: "Report error to backend (optional)",
        tables: [],
        request: {
          servicePointId: 1,
          errorType: "hardware",
          device: "id-reader",
          stateAtError: "ID_VERIFICATION",
          message: "Card reader timeout after 60s",
        },
        response: { logged: true, errorId: "ERR-20260315-0001" },
        notes: ["Optional — ใช้สำหรับ monitoring", "ส่ง async ไม่ต้องรอ response"],
        notesEn: ["Optional — for monitoring", "Send async, no need to wait for response"],
      },
    ],
  },

  // ─── TIMEOUT ───
  {
    stateType: "TIMEOUT",
    hasApi: false,
    noApiReason: "Reset กลับ WELCOME — ไม่ต้องเรียก API",
    noApiReasonEn: "Resets to WELCOME — no API call needed",
    endpoints: [],
  },
];

// ===== LOOKUP =====

const apiSpecMap = new Map<KioskStateType, KioskApiSpec>(
  apiSpecs.map((spec) => [spec.stateType, spec])
);

/** Get API spec for a given kiosk state */
export function getApiSpec(stateType: KioskStateType): KioskApiSpec | undefined {
  return apiSpecMap.get(stateType);
}

/** Get all API specs */
export function getAllApiSpecs(): KioskApiSpec[] {
  return apiSpecs;
}
