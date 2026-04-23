/**
 * Kiosk API Specification Data — mapped to each KioskStateType
 *
 * Flutter dev: ใช้ข้อมูลนี้เป็น reference สำหรับ API integration
 * แต่ละ state จะมี API endpoint, request/response schema, tables ที่ใช้
 * รวมถึง config sources จาก Web App Settings ที่เกี่ยวข้อง
 */

import type { KioskStateType } from "./kiosk-types";
import type { ApiParam } from "@/lib/api-doc-data";

// ===== TYPES =====

export interface KioskApiEndpoint {
  method: "GET" | "POST" | "PATCH";
  path: string;
  summary: string;
  summaryEn: string;
  contentType?: string;
  tables: string[];
  queryParams?: ApiParam[];
  request?: Record<string, unknown>;
  response: Record<string, unknown>;
  errorResponse?: Record<string, unknown>;
  notes?: string[];
  notesEn?: string[];
}

export interface ConfigSourceInfo {
  /** ชื่อหน้า Settings ใน Web App */
  settingsPage: string;
  settingsPageEn: string;
  /** path ไปหน้า settings */
  settingsPath: string;
  /** field/table ที่อ่าน */
  fields: string[];
  /** อธิบายว่าใช้ทำอะไรใน state นี้ */
  usage: string;
  usageEn: string;
}

export interface KioskApiSpec {
  stateType: KioskStateType;
  /** ชื่อ state */
  title: string;
  titleEn: string;
  /** คำอธิบายสำหรับ dev */
  description: string;
  descriptionEn: string;
  hasApi: boolean;
  noApiReason?: string;
  noApiReasonEn?: string;
  endpoints: KioskApiEndpoint[];
  /** Web App Settings ที่ต้องตั้งค่าก่อน */
  configSources: ConfigSourceInfo[];
  /** คำแนะนำสำหรับ Flutter/Backend dev */
  devNotes?: string[];
  devNotesEn?: string[];
}

// ===== DATA =====

const apiSpecs: KioskApiSpec[] = [
  // ─── WELCOME ───
  {
    stateType: "WELCOME",
    title: "หน้าต้อนรับ",
    titleEn: "Welcome Screen",
    description: "โหลด config ตู้ Kiosk, ตรวจสถานะ online/offline, ตรวจเวลาทำการ — เรียก 1 ครั้งตอน boot หรือ reset",
    descriptionEn: "Load kiosk config, check online/offline status, check business hours — called once on boot or reset",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/kiosk/{servicePointId}/config",
        summary: "โหลด config ตู้ + เช็คสถานะ online + เวลาทำการ (Public — ไม่ต้อง auth)",
        summaryEn: "Load kiosk config + check online status + business hours (Public — no auth required)",
        tables: ["service_points", "business_hours_rules", "service_point_purposes", "service_point_documents"],
        response: {
          servicePoint: {
            id: 1,
            name: "Kiosk ล็อบบี้ ชั้น 1 (ซ้าย)",
            nameEn: "Lobby Kiosk 1F (Left)",
            type: "kiosk",
            status: "online",
            serialNumber: "KIOSK-C1-L001",
            location: "ชั้น 1 อาคาร A (ฝั่งซ้าย)",
            locationEn: "1st Floor Building A (Left)",
            building: "อาคาร A",
            floor: "ชั้น 1",
            ipAddress: "192.168.1.101",
            adminPin: "10210",
            followBusinessHours: true,
            wifiSsid: "MOTS-Guest",
            wifiPasswordPattern: "mots{year}",
            wifiValidityMode: "end-of-day",
            wifiFixedDurationMin: null,
            pdpaRequireScroll: true,
            pdpaRetentionDays: 90,
            slipHeaderText: "กระทรวงการท่องเที่ยวและกีฬา",
            slipFooterText: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
            idMaskingPattern: "show-first1-last5",
            todayTransactions: 42,
          },
          supportedDocuments: [
            { id: 1, name: "บัตรประชาชน", nameEn: "Thai National ID Card" },
            { id: 2, name: "หนังสือเดินทาง", nameEn: "Passport" },
            { id: 5, name: "แอป ThaiID", nameEn: "ThaiID App" },
          ],
          supportedPurposeIds: [1, 2, 3, 4, 5, 7],
          businessHours: {
            followBusinessHours: true,
            isOpen: true,
            allowWalkin: true,
            allowKiosk: true,
            currentRule: "เวลาทำการปกติ (จ-ศ)",
            todaySchedule: { openTime: "08:30", closeTime: "16:30" },
          },
          serverTime: "2026-03-26T09:00:00+07:00",
        },
        notes: [
          "🔓 Public endpoint — ไม่ต้อง auth (Kiosk ตอน boot ยังไม่มี device token)",
          "เรียกตอน boot หรือ reset กลับหน้าแรก",
          "Cache ได้ — refresh ทุก 5 นาที",
          "ถ้า status ≠ online → แสดงหน้า \"ปิดปรับปรุง\"",
          "ถ้า isOpen=false → แสดงหน้า \"นอกเวลาทำการ\"",
          "กรองเฉพาะ type=kiosk — ไม่สามารถดึง config ของ counter ได้",
        ],
        notesEn: [
          "🔓 Public endpoint — no auth required (Kiosk has no device token on boot)",
          "Called on boot or reset to welcome",
          "Cacheable — refresh every 5 min",
          "If status ≠ online → show maintenance screen",
          "If isOpen=false → show outside-hours screen",
          "Filtered to type=kiosk only — cannot fetch counter config",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.status", "service_points.type", "service_points.location", "service_points.follow_business_hours"],
        usage: "กำหนดสถานะตู้ (online/offline/maintenance), ตำแหน่งที่ตั้ง, เปิดตามเวลาทำการหรือไม่",
        usageEn: "Set kiosk status (online/offline/maintenance), location, whether to follow business hours",
      },
      {
        settingsPage: "เวลาทำการ (Business Hours)",
        settingsPageEn: "Business Hours",
        settingsPath: "/web/settings/business-hours",
        fields: ["business_hours_rules.days_of_week", "business_hours_rules.open_time", "business_hours_rules.close_time", "business_hours_rules.allow_kiosk"],
        usage: "ตรวจสอบว่า Kiosk เปิดให้บริการในเวลาปัจจุบันหรือไม่ — กฎวันปกติ, วันหยุด, วันพิเศษ",
        usageEn: "Check if kiosk is open at current time — regular, holiday, special rules",
      },
    ],
    devNotes: [
      "Flutter: สร้าง KioskConfigRepository เก็บ config ไว้ใน memory",
      "เรียก API ตอน boot + ทุก 5 นาที (health check)",
      "ถ้า offline → แสดง error screen, retry ทุก 30 วินาที",
      "🔓 ใช้ apiFetch ปกติ (ไม่ต้อง device token) — Kiosk boot ได้โดยรู้แค่ servicePointId",
      "🧪 Prototype: auto-generate device token (kvms_prototype_{spId}_{random}) ตอน boot — ไม่ต้อง lookup DB ใน dev mode",
    ],
    devNotesEn: [
      "Flutter: Create KioskConfigRepository to cache config in memory",
      "Call API on boot + every 5 min (health check)",
      "If offline → show error screen, retry every 30 seconds",
      "🔓 Use regular apiFetch (no device token needed) — Kiosk can boot knowing only servicePointId",
      "🧪 Prototype: auto-generates device token (kvms_prototype_{spId}_{random}) on boot — no DB lookup in dev mode",
    ],
  },

  // ─── PDPA_CONSENT ───
  {
    stateType: "PDPA_CONSENT",
    title: "ยินยอม PDPA",
    titleEn: "PDPA Consent",
    description: "แสดงข้อความ PDPA ให้อ่าน → กดยอมรับ → บันทึก consent log — ใช้ retentionDays + requireScroll จาก config",
    descriptionEn: "Display PDPA text → accept → record consent log — uses retentionDays + requireScroll from config",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/kiosk/pdpa/latest",
        summary: "ดึงข้อความ PDPA เวอร์ชันล่าสุด",
        summaryEn: "Get latest PDPA consent text",
        tables: ["pdpa_consent_configs", "pdpa_consent_versions"],
        response: {
          version: 3,
          titleTh: "นโยบายคุ้มครองข้อมูลส่วนบุคคล",
          titleEn: "Personal Data Protection Policy",
          bodyTh: "กระทรวงการท่องเที่ยวและกีฬา ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน...",
          bodyEn: "The Ministry of Tourism and Sports values the protection of your personal data...",
          retentionDays: 90,
          requireScrollToBottom: true,
          effectiveDate: "2026-01-15",
        },
        notes: ["Cache ได้ — เปลี่ยนไม่บ่อย", "retentionDays แสดงบนหน้าจอให้ผู้ใช้ทราบ"],
        notesEn: ["Cacheable — rarely changes", "retentionDays displayed on screen for visitor"],
      },
      {
        method: "POST",
        path: "/api/kiosk/pdpa/consent",
        summary: "บันทึกการยินยอม PDPA",
        summaryEn: "Record PDPA consent",
        tables: ["pdpa_consent_logs"],
        request: {
          configVersion: 3,
          consentChannel: "kiosk",
          servicePointId: 1,
          consentGiven: true,
          locale: "th",
        },
        response: {
          consentId: 42,
          recordedAt: "2026-03-26T09:01:00+07:00",
        },
        notes: [
          "บันทึกหลังกดยอมรับ — ยังไม่มี visitorIdNumber (ยังไม่ยืนยันตัวตน)",
          "consentId ใช้อ้างอิงตอน checkin",
          "ถ้า requireScrollToBottom=true → ปุ่มยอมรับ disable จนกว่าจะ scroll จนสุด",
        ],
        notesEn: [
          "Record after accept — no visitorIdNumber yet (not verified)",
          "consentId used as reference in checkin",
          "If requireScrollToBottom=true → disable accept button until scrolled to bottom",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "PDPA Consent",
        settingsPageEn: "PDPA Consent",
        settingsPath: "/web/settings/pdpa-consent",
        fields: ["pdpa_consent_configs.body_th", "pdpa_consent_configs.body_en", "pdpa_consent_configs.retention_days"],
        usage: "ข้อความ PDPA ที่แสดง + จำนวนวันเก็บข้อมูล + บังคับ scroll ก่อนยอมรับ",
        usageEn: "PDPA text content + retention days + require scroll before accept",
      },
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.pdpa_config.require_scroll", "service_points.pdpa_config.retention_days"],
        usage: "Override ค่า PDPA ต่อ Kiosk — ถ้า set ไว้จะใช้แทนค่า default",
        usageEn: "Per-kiosk PDPA override — if set, overrides default values",
      },
    ],
    devNotes: [
      "Flow ใหม่: PDPA → SELECT_PURPOSE (ไม่ใช่ ID verification แล้ว)",
      "consentId ต้องเก็บไว้ใน state เพื่อใช้ตอน checkin",
    ],
    devNotesEn: [
      "New flow: PDPA → SELECT_PURPOSE (no longer ID verification)",
      "consentId must be stored in state for use during checkin",
    ],
  },

  // ─── SELECT_PURPOSE ───
  {
    stateType: "SELECT_PURPOSE",
    title: "เลือกวัตถุประสงค์ + แผนก",
    titleEn: "Select Purpose + Department",
    description: "ขั้นตอนที่ 3 (หลัง PDPA) — เลือกวัตถุประสงค์การมา แล้วเลือกแผนกที่ติดต่อ ก่อนยืนยันตัวตน | ถ้า walk-in ที่ยืนยันแล้ว → ข้ามไปถ่ายภาพเลย",
    descriptionEn: "Step 3 (after PDPA) — Select visit purpose then department before ID verification | If returning walk-in (already verified) → skip to face capture",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/kiosk/{servicePointId}/purposes",
        summary: "ดึงวัตถุประสงค์ + แผนกที่แสดงบน Kiosk",
        summaryEn: "Get visit purposes + departments for kiosk display",
        tables: ["visit_purposes", "visit_purpose_department_rules", "visit_purpose_channel_configs", "service_point_purposes", "departments", "floors"],
        response: {
          purposes: [
            {
              id: 1,
              name: "ติดต่อราชการ",
              nameEn: "Official Business",
              icon: "🏛️",
              order: 1,
              wifiEnabled: true,
              requirePhoto: true,
              departments: [
                { departmentId: 1, name: "สำนักงานปลัดกระทรวง", nameEn: "Office of the Permanent Secretary", floor: "ชั้น 3", floorEn: "Floor 3", building: "อาคาร A", buildingEn: "Building A", requireApproval: true, approverGroupId: 2, offerWifi: true },
                { departmentId: 3, name: "กองการต่างประเทศ", nameEn: "Foreign Affairs Division", floor: "ชั้น 5", floorEn: "Floor 5", building: "อาคาร A", buildingEn: "Building A", requireApproval: true, approverGroupId: 2, offerWifi: true },
                { departmentId: 4, name: "กองกิจการท่องเที่ยว", nameEn: "Tourism Affairs Division", floor: "ชั้น 4", floorEn: "Floor 4", building: "อาคาร A", buildingEn: "Building A", requireApproval: false, offerWifi: true },
              ],
            },
            {
              id: 2,
              name: "ประชุม / สัมมนา",
              nameEn: "Meeting / Seminar",
              icon: "📋",
              order: 2,
              wifiEnabled: true,
              requirePhoto: true,
              departments: [
                { departmentId: 1, name: "สำนักงานปลัดกระทรวง", nameEn: "Office of the Permanent Secretary", floor: "ชั้น 3", floorEn: "Floor 3", building: "อาคาร A", buildingEn: "Building A", requireApproval: true, offerWifi: true },
              ],
            },
            {
              id: 3,
              name: "ส่งเอกสาร / พัสดุ",
              nameEn: "Document Delivery",
              icon: "📄",
              order: 3,
              wifiEnabled: false,
              requirePhoto: true,
              departments: [
                { departmentId: 2, name: "กองกลาง", nameEn: "General Administration Division", floor: "ชั้น 2", floorEn: "Floor 2", building: "อาคาร A", buildingEn: "Building A", requireApproval: false, offerWifi: false },
              ],
            },
            {
              id: 7,
              name: "รับ-ส่งสินค้า",
              nameEn: "Delivery / Pickup",
              icon: "📦",
              order: 7,
              wifiEnabled: false,
              requirePhoto: false,
              departments: [
                { departmentId: 2, name: "กองกลาง", nameEn: "General Administration Division", floor: "ชั้น 2", floorEn: "Floor 2", building: "อาคาร A", buildingEn: "Building A", requireApproval: false, offerWifi: false },
              ],
            },
          ],
        },
        notes: [
          "กรองเฉพาะ visit_purpose_department_rules.show_on_kiosk = true",
          "กรองเฉพาะ purpose ที่อยู่ใน service_points.allowed_purpose_ids",
          "departments ซ้อนมาในแต่ละ purpose — ถ้า dept เดียว auto-select ไม่ต้องกดเลือก",
          "ถ้า department.requireApproval = true → แจ้งผู้อนุมัติหลัง checkin",
          "Cache ได้ — refresh ตอน boot",
        ],
        notesEn: [
          "Filter by visit_purpose_department_rules.show_on_kiosk = true",
          "Filter by service_points.allowed_purpose_ids",
          "Departments nested in each purpose — if single dept, auto-select",
          "If department.requireApproval = true → notify approver after checkin",
          "Cacheable — refresh on boot",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "วัตถุประสงค์เข้าพื้นที่",
        settingsPageEn: "Visit Purposes",
        settingsPath: "/web/settings/visit-purposes",
        fields: [
          "visit_purposes.name", "visit_purposes.name_en", "visit_purposes.icon", "visit_purposes.order",
          "visit_purpose_department_rules.show_on_kiosk", "visit_purpose_department_rules.offer_wifi",
          "visit_purpose_department_rules.require_approval", "visit_purpose_department_rules.approver_group_id",
          "visit_purpose_channel_configs.require_photo",
        ],
        usage: "กำหนดวัตถุประสงค์ + เงื่อนไขแต่ละแผนก (แสดงบน Kiosk, WiFi, ต้องอนุมัติ, ถ่ายภาพ)",
        usageEn: "Configure purposes + per-department rules (show on kiosk, WiFi, approval, photo)",
      },
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.allowed_purpose_ids"],
        usage: "กรองวัตถุประสงค์เฉพาะที่ Kiosk ตู้นี้รองรับ",
        usageEn: "Filter purposes supported by this specific kiosk",
      },
      {
        settingsPage: "สถานที่ตั้ง (Locations)",
        settingsPageEn: "Locations",
        settingsPath: "/web/settings/locations",
        fields: ["departments.name", "departments.name_en", "departments.floor", "departments.building"],
        usage: "ข้อมูลแผนก ชั้น อาคาร — แสดงใน department picker พร้อม filter ตามชั้น",
        usageEn: "Department, floor, building info — shown in department picker with floor filter",
      },
      {
        settingsPage: "กลุ่มผู้อนุมัติ (Approver Groups)",
        settingsPageEn: "Approver Groups",
        settingsPath: "/web/settings/approver-groups",
        fields: ["approver_groups.id", "approver_groups.members"],
        usage: "ถ้า requireApproval=true → ส่งแจ้งกลุ่มผู้อนุมัตินี้หลัง checkin สำเร็จ",
        usageEn: "If requireApproval=true → notify this approver group after successful checkin",
      },
    ],
    devNotes: [
      "★ Flow ใหม่: SELECT_PURPOSE มาก่อน ID verification",
      "ถ้า dept เดียว → auto-select ไม่ต้องแสดงหน้าเลือกแผนก",
      "เก็บ purposeId + departmentId ใน state → ใช้ตอน checkin",
    ],
    devNotesEn: [
      "★ New flow: SELECT_PURPOSE comes before ID verification",
      "If single dept → auto-select, don't show department picker",
      "Store purposeId + departmentId in state → use during checkin",
    ],
  },

  // ─── SELECT_ID_METHOD ───
  {
    stateType: "SELECT_ID_METHOD",
    title: "เลือกวิธียืนยันตัวตน",
    titleEn: "Select ID Method",
    description: "ขั้นตอนที่ 4 — เลือกเอกสารยืนยันตัวตน: บัตร ปชช. / Passport / ThaiID App",
    descriptionEn: "Step 4 — Select ID document: Thai ID / Passport / ThaiID App",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/kiosk/{servicePointId}/id-methods",
        summary: "ดึงวิธียืนยันตัวตนที่ตู้รองรับ",
        summaryEn: "Get supported ID verification methods for this kiosk",
        tables: ["identity_document_types", "service_point_documents"],
        response: {
          methods: [
            { id: 1, code: "thai-id-card", name: "บัตรประชาชน", nameEn: "Thai National ID Card", icon: "🪪", deviceRequired: "id-reader", description: "สอดบัตรที่เครื่องอ่าน" },
            { id: 2, code: "passport", name: "หนังสือเดินทาง", nameEn: "Passport", icon: "📘", deviceRequired: "passport-reader", description: "วางหนังสือเดินทางบนเครื่องอ่าน" },
            { id: 5, code: "thai-id-app", name: "แอป ThaiID", nameEn: "ThaiID App", icon: "📱", deviceRequired: "qr-reader", description: "สแกน QR Code จากแอป ThaiID" },
          ],
        },
        notes: [
          "ใช้ข้อมูลจาก /kiosk/config ได้ (cached) — ไม่ต้องเรียกซ้ำ",
          "แสดงเฉพาะเอกสารที่ตู้นี้มีเครื่องอ่านรองรับ",
        ],
        notesEn: [
          "Can use cached data from /kiosk/config — no need to re-call",
          "Show only documents supported by this kiosk's hardware",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "ประเภทเอกสาร (Document Types)",
        settingsPageEn: "Document Types",
        settingsPath: "/web/settings/document-types",
        fields: ["identity_document_types.id", "identity_document_types.name", "identity_document_types.icon"],
        usage: "กำหนดชื่อ/ไอคอนเอกสารที่แสดง + เปิด/ปิดใช้งานแต่ละประเภท",
        usageEn: "Set document names/icons + enable/disable each type",
      },
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.allowed_document_ids"],
        usage: "กรองเอกสารเฉพาะที่ Kiosk ตู้นี้มีเครื่องอ่าน",
        usageEn: "Filter documents to those supported by this kiosk's readers",
      },
    ],
    devNotes: [
      "GO_BACK → กลับไป SELECT_PURPOSE (ไม่ใช่ PDPA แล้ว)",
    ],
    devNotesEn: [
      "GO_BACK → goes back to SELECT_PURPOSE (not PDPA anymore)",
    ],
  },

  // ─── ID_VERIFICATION ───
  {
    stateType: "ID_VERIFICATION",
    title: "ยืนยันตัวตน",
    titleEn: "Verify Identity",
    description: "ขั้นตอนที่ 5 — อ่านข้อมูลจากเครื่องอ่านบัตร/Passport/ThaiID + ตรวจ Blocklist",
    descriptionEn: "Step 5 — Read data from card reader/Passport/ThaiID + check Blocklist",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/identity/verify",
        summary: "ยืนยันตัวตน + ตรวจ Blocklist + Upsert visitor",
        summaryEn: "Verify identity + check Blocklist + Upsert visitor",
        tables: ["visitors", "blocklist", "visit_entries"],
        request: {
          servicePointId: 1,
          documentType: "thai-id-card",
          idNumber: "1234567890123",
          fullNameTh: "นายสมชาย ใจดี",
          fullNameEn: "MR. SOMCHAI JAIDEE",
          dateOfBirth: "2528-06-15",
          address: "123 ถ.ราชดำเนิน เขตพระนคร กรุงเทพฯ 10200",
          issueDate: "2565-01-15",
          expiryDate: "2574-06-14",
          photo: "<base64_from_card>",
        },
        response: {
          status: "ok",
          visitorId: 15,
          isNewVisitor: false,
          isBlocked: false,
          previousVisitCount: 3,
          lastVisitDate: "2026-03-20",
          existingAppointments: [],
          maskedIdNumber: "1-xxxx-xxxxx-90-3",
          verifiedData: {
            fullNameTh: "นายสมชาย ใจดี",
            fullNameEn: "MR. SOMCHAI JAIDEE",
            idNumber: "1-xxxx-xxxxx-90-3",
            dateOfBirth: "15 มิ.ย. 2528",
          },
        },
        errorResponse: {
          status: "blocked",
          isBlocked: true,
          blockReason: "ประพฤติไม่เหมาะสม",
          blockedAt: "2026-01-10T00:00:00+07:00",
          message: "ท่านถูกระงับการเข้าพื้นที่ กรุณาติดต่อเจ้าหน้าที่",
        },
        notes: [
          "Upsert visitor — ถ้ามีอยู่แล้วอัปเดต, ถ้าใหม่สร้าง record",
          "ตรวจ Blocklist ก่อนดำเนินการ — ถ้า blocked → ERROR state",
          "ID masking ใช้ pattern จาก config: show-first1-last5",
          "ถ้ามีนัดหมายวันนี้ → แนะนำ appointment flow (existingAppointments)",
          "photo จากบัตร → เก็บเป็น base64 ใช้เทียบใบหน้าทีหลัง",
        ],
        notesEn: [
          "Upsert visitor — update if exists, create if new",
          "Check Blocklist first — if blocked → ERROR state",
          "ID masking uses pattern from config: show-first1-last5",
          "If has today's appointment → suggest appointment flow",
          "Photo from card → store as base64 for face matching later",
        ],
      },
      {
        method: "POST",
        path: "/api/kiosk/appointment/match-by-identity",
        summary: "Auto-match walk-in visitor กับนัดหมายของวันนี้ — รองรับ 3 โหมดค้น: เลขบัตร ปชช. / passport / ชื่อ-นามสกุล (ส่งอย่างน้อย 1 อย่าง)",
        summaryEn: "Auto-match walk-in visitor against today's appointments — supports 3 search modes: Thai ID / passport / first+last name (at least one required)",
        tables: ["appointments", "visitors", "staff", "departments", "visit_purposes"],
        request: {
          idNumber: "1234567890123",
          passportNumber: "AB1234567",
          firstName: "สมชาย",
          lastName: "ใจดี",
          departmentId: 5,
          visitPurposeId: 2,
        },
        response: {
          hasAppointment: true,
          matchesWalkinChoice: true,
          suggestion: "use-appointment",
          appointments: [
            {
              id: 42,
              status: "approved",
              type: "single",
              entryMode: "scheduled",
              timeStart: "10:00",
              timeEnd: "11:00",
              visitorName: "นายสมชาย ใจดี",
              visitorCompany: "ACME Co., Ltd.",
              hostName: "นางสาวอรอนงค์ พนักงาน",
              hostPosition: "Senior Officer",
              departmentId: 5,
              departmentName: "กองบริหารทั่วไป",
              visitPurposeId: 2,
              purposeName: "ประชุม",
              purposeIcon: "📋",
              matchesWalkinChoice: true,
            },
          ],
        },
        errorResponse: {
          hasAppointment: false,
          suggestion: "proceed-walkin",
        },
        notes: [
          "Body ต้องมีอย่างน้อย 1: idNumber, passportNumber, หรือ firstName + lastName คู่กัน",
          "ส่งหลายค่าได้พร้อมกัน — รวมแบบ OR (appointment ที่ visitor match อย่างใดอย่างหนึ่งจะคืนมา)",
          "ชื่อ: exact match — เทียบทั้ง firstName/lastName (TH) และ firstNameEn/lastNameEn (EN)",
          "passport ค้นจาก Visitor.idNumber (ไม่ตรวจ idType) — ใช้กรณี passport หมดอายุ/เปลี่ยนเล่ม → fallback ใช้ชื่อแทนได้",
          "ค้นเฉพาะ appointments ของวันนี้ที่ status = approved/confirmed",
          "ส่ง departmentId/visitPurposeId (optional) เพื่อตรวจว่านัดที่เจอตรงกับสิ่งที่ผู้เยี่ยมเลือกตอน walk-in หรือไม่",
          "suggestion = 'use-appointment' (ตรง) | 'confirm-with-visitor' (มีนัดแต่ไม่ตรง) | 'proceed-walkin' (ไม่มีนัด)",
          "matchesWalkinChoice = true เมื่อ department + purpose ตรงกับที่เลือกใน walk-in flow",
        ],
        notesEn: [
          "Body requires at least one: idNumber, passportNumber, or firstName + lastName together",
          "Multiple criteria allowed — combined with OR (any visitor matching any criterion is returned)",
          "Name: exact match — checks both firstName/lastName (TH) and firstNameEn/lastNameEn (EN)",
          "Passport searches Visitor.idNumber (idType not enforced) — useful when passport expired/replaced → fallback to name search",
          "Searches only today's appointments with status = approved/confirmed",
          "Pass departmentId/visitPurposeId (optional) to check if found appointment matches walk-in selection",
          "suggestion = 'use-appointment' (matched) | 'confirm-with-visitor' (has appointment but mismatched) | 'proceed-walkin' (none)",
          "matchesWalkinChoice = true when department + purpose match walk-in choice",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.id_masking_pattern"],
        usage: "รูปแบบการ mask เลขบัตร: show-first1-last5 → แสดงหลักแรก + 5 หลักสุดท้าย",
        usageEn: "ID masking pattern: show-first1-last5 → show first digit + last 5 digits",
      },
      {
        settingsPage: "Blocklist",
        settingsPageEn: "Blocklist",
        settingsPath: "/web/blocklist",
        fields: ["blocklist.id_number", "blocklist.full_name", "blocklist.reason"],
        usage: "ตรวจสอบว่าผู้เยี่ยมอยู่ใน Blocklist หรือไม่ — ตรวจทั้ง idNumber + ชื่อ",
        usageEn: "Check if visitor is in Blocklist — check both idNumber + name",
      },
    ],
    devNotes: [
      "Hardware: SmartCardReader (บัตร ปชช.) / PassportReader / QR Scanner (ThaiID)",
      "Flutter plugin: smart_card_reader / passport_reader / flutter_barcode_scanner",
      "Timeout จาก config: timeouts.idVerification (default 60s)",
    ],
    devNotesEn: [
      "Hardware: SmartCardReader (Thai ID) / PassportReader / QR Scanner (ThaiID)",
      "Flutter plugin: smart_card_reader / passport_reader / flutter_barcode_scanner",
      "Timeout from config: timeouts.idVerification (default 60s)",
    ],
  },

  // ─── DATA_PREVIEW ───
  {
    stateType: "DATA_PREVIEW",
    title: "ตรวจสอบข้อมูล",
    titleEn: "Review Data",
    description: "ขั้นตอนที่ 6 — แสดงข้อมูลที่อ่านได้ให้ผู้เยี่ยมยืนยัน + ตรวจ Blocklist ซ้ำ — confirm → ไปถ่ายภาพ",
    descriptionEn: "Step 6 — Display read data for visitor confirmation + re-check Blocklist — confirm → go to face capture",
    hasApi: false,
    noApiReason: "ใช้ข้อมูลจาก verify-identity response ที่อยู่ใน state — ไม่ต้องเรียก API ซ้ำ",
    noApiReasonEn: "Uses data from verify-identity response stored in state — no additional API call needed",
    endpoints: [],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.id_masking_pattern"],
        usage: "แสดง ID number แบบ masked ตาม pattern ที่กำหนด",
        usageEn: "Display masked ID number according to configured pattern",
      },
    ],
    devNotes: [
      "CONFIRM_DATA → ไปหน้า FACE_CAPTURE (flow ใหม่: ไม่ผ่าน SELECT_PURPOSE อีกแล้ว)",
      "GO_BACK → กลับ ID_VERIFICATION เพื่อยืนยันใหม่",
      "Timeout จาก config: timeouts.dataPreview (default 120s)",
    ],
    devNotesEn: [
      "CONFIRM_DATA → goes to FACE_CAPTURE (new flow: no longer goes through SELECT_PURPOSE)",
      "GO_BACK → back to ID_VERIFICATION for re-verification",
      "Timeout from config: timeouts.dataPreview (default 120s)",
    ],
  },

  // ─── FACE_CAPTURE ───
  {
    stateType: "FACE_CAPTURE",
    title: "ถ่ายภาพใบหน้า + WiFi",
    titleEn: "Face Photo + WiFi Offer",
    description: "ขั้นตอนที่ 7 — ถ่ายภาพใบหน้าด้วยกล้อง Kiosk + ถาม WiFi (ถ้า purpose เปิดใช้) ในหน้าเดียว → สำเร็จ",
    descriptionEn: "Step 7 — Capture face photo via kiosk camera + WiFi offer (if purpose enables it) in one screen → Success",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/identity/photo",
        summary: "อัปโหลดภาพถ่ายใบหน้า + ตรวจจับใบหน้า",
        summaryEn: "Upload face photo + face detection",
        contentType: "application/json",
        tables: ["visitors"],
        request: {
          photo: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          visitorId: 15,
          servicePointId: 1,
          purposeId: 1,
        },
        response: {
          faceDetected: true,
          faceCount: 1,
          quality: "good",
          faceMatchScore: 0.92,
        },
        notes: [
          "Compress JPEG 80% ก่อนอัปโหลด",
          "ตรวจจับใบหน้าฝั่ง backend (faceDetected, faceCount)",
          "ถ้า requirePhoto = false (ตาม purpose config) → ข้ามถ่ายภาพได้",
          "faceMatchScore: เทียบกับรูปจากบัตร (optional, ถ้า ≥ 0.7 = pass)",
          "WiFi ถามในหน้าเดียวกัน — ถ้า purpose.wifiEnabled = false → ไม่แสดง",
        ],
        notesEn: [
          "Compress JPEG to 80% before upload",
          "Face detection on backend (faceDetected, faceCount)",
          "If requirePhoto = false (per purpose config) → can skip photo",
          "faceMatchScore: compared with card photo (optional, ≥ 0.7 = pass)",
          "WiFi asked on same screen — if purpose.wifiEnabled = false → don't show",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "วัตถุประสงค์เข้าพื้นที่",
        settingsPageEn: "Visit Purposes",
        settingsPath: "/web/settings/visit-purposes",
        fields: ["visit_purpose_channel_configs.require_photo", "visit_purpose_department_rules.offer_wifi"],
        usage: "ตรวจว่า purpose นี้ต้องถ่ายรูปหรือไม่ + แสดง WiFi offer หรือไม่",
        usageEn: "Check if this purpose requires photo + whether to show WiFi offer",
      },
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.wifi_config.ssid", "service_points.wifi_config.password_pattern", "service_points.wifi_config.validity_mode"],
        usage: "กำหนด WiFi SSID, pattern รหัสผ่าน, ระยะเวลาใช้งาน",
        usageEn: "Set WiFi SSID, password pattern, validity duration",
      },
    ],
    devNotes: [
      "Hardware: USB Camera — flutter plugin: camera / google_mlkit_face_detection",
      "WiFi password: ใช้ pattern จาก config (เช่น mots{year} → mots2026)",
      "WiFi validity: ตามเวลาปิดทำการ หรือ fixedDurationMinutes",
      "GO_BACK → DATA_PREVIEW",
    ],
    devNotesEn: [
      "Hardware: USB Camera — flutter plugin: camera / google_mlkit_face_detection",
      "WiFi password: use pattern from config (e.g., mots{year} → mots2026)",
      "WiFi validity: until business hours close or fixedDurationMinutes",
      "GO_BACK → DATA_PREVIEW",
    ],
  },

  // ─── WIFI_OFFER (Appointment flow) ───
  {
    stateType: "WIFI_OFFER",
    title: "WiFi Offer (Appointment)",
    titleEn: "WiFi Offer (Appointment)",
    description: "เฉพาะ Appointment flow — ถาม WiFi หลังยืนยันตัวตน (ถ้าจองไว้ตอนนัดหมาย จะเลือกไว้ให้อัตโนมัติ)",
    descriptionEn: "Appointment flow only — WiFi offer after ID verification (pre-selected if requested during booking)",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/wifi/generate",
        summary: "สร้าง WiFi Credentials",
        summaryEn: "Generate WiFi credentials",
        tables: ["service_points", "visit_entries"],
        request: {
          visitorId: 15,
          servicePointId: 1,
          entryId: 42,
          accepted: true,
        },
        response: {
          ssid: "MOTS-Guest",
          password: "mots2026",
          validUntil: "2026-03-26T16:30:00+07:00",
          validityDisplay: "ถึง 16:30 น. วันนี้",
        },
        notes: [
          "ถ้า appointment.wifiRequested=true → pre-select \"รับ WiFi\" ไว้ให้ (แก้ได้)",
          "Password generate ตาม pattern: mots{year} → mots2026",
          "อาจ generate ฝั่ง Kiosk ตาม pattern จาก config — ไม่ต้องเรียก API",
        ],
        notesEn: [
          "If appointment.wifiRequested=true → pre-select 'Accept WiFi' (editable)",
          "Password generated from pattern: mots{year} → mots2026",
          "Can generate on kiosk using pattern from config — no API needed",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.wifi_config.*"],
        usage: "WiFi SSID, password pattern, ระยะเวลาใช้งาน",
        usageEn: "WiFi SSID, password pattern, validity duration",
      },
    ],
  },

  // ─── SUCCESS ───
  {
    stateType: "SUCCESS",
    title: "สำเร็จ — Checkin + Slip + Notifications",
    titleEn: "Success — Checkin + Slip + Notifications",
    description: "API หลัก — สร้าง visit_entry + ออก QR/Slip + ส่ง notification + sync access control (Hikvision) — walk-in: appointment_id=NULL, appointment: ผูกกับ appointment",
    descriptionEn: "Main API — create visit_entry + generate QR/Slip + send notifications + sync access control (Hikvision) — walk-in: appointment_id=NULL, appointment: linked to appointment",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/checkin",
        summary: "สร้าง visit_entry + ออก QR/Slip + ส่ง notification + sync Hikvision",
        summaryEn: "Create visit_entry + generate QR/Slip + send notifications + sync Hikvision",
        tables: [
          "visit_entries", "visitors", "visit_purposes", "departments",
          "access_groups", "access_group_zones", "department_access_mappings",
          "visit_slip_templates", "visit_slip_fields",
          "notification_templates", "notification_logs",
        ],
        request: {
          type: "walkin",
          visitorId: 15,
          servicePointId: 1,
          visitPurposeId: 1,
          departmentId: 4,
          appointmentId: null,
          idMethod: "thai-id-card",
          facePhotoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          wifiAccepted: true,
          pdpaConsentId: 42,
        },
        response: {
          entry: {
            entryId: 99,
            entryCode: "ENT-20260326-0099",
            appointmentId: null,
            status: "checked-in",
            checkinTime: "2026-03-26T09:15:00+07:00",
            expectedCheckout: "2026-03-26T16:30:00+07:00",
          },
          accessControl: {
            accessGroupId: 2,
            accessGroupName: "ติดต่อราชการ ชั้น 2-5",
            qrCodeData: "eVMS-OFA-20260326-0099-A2B3C4",
            allowedZones: ["ล็อบบี้ ชั้น 1", "สำนักงานกองกิจการท่องเที่ยว ชั้น 4"],
            validityMinutes: 120,
            hikvisionSynced: true,
            hikvisionDoorIds: ["DOOR-4F-MAIN"],
          },
          slip: {
            slipNumber: "eVMS-25690326-0099",
            templateId: 1,
            headerText: "กระทรวงการท่องเที่ยวและกีฬา",
            footerText: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
            logoUrl: "/uploads/slip-logos/logo-1711785600.png",
            logoSizePx: 40,
            visitorName: "นายสมชาย ใจดี",
            idNumber: "1-xxxx-xxxxx-90-3",
            visitPurpose: "ติดต่อราชการ",
            department: "กองกิจการท่องเที่ยว",
            accessZone: "ชั้น 4 อาคาร A",
            date: "26 มี.ค. 2569",
            timeIn: "09:15",
            timeOut: "16:30 น.",
            wifi: { ssid: "MOTS-Guest", password: "mots2026", validUntil: "16:30 น." },
            qrCodeData: "eVMS-OFA-20260326-0099-A2B3C4",
            showOfficerSign: true,
            officerSignLabelTh: "ลงชื่อเจ้าหน้าที่ / Officer Signature",
            officerSignLabelEn: "ประทับตรา / Stamp",
            stampPlaceholder: "ประทับตราหน่วยงาน",
            lineLinked: false,
            askPrint: false,
          },
          notifications: [
            { trigger: "checkin-welcome", channel: "line", sent: true, recipient: "host" },
            { trigger: "wifi-credentials", channel: "line", sent: false, reason: "visitor not LINE-linked" },
          ],
        },
        notes: [
          "★ API หลัก — สร้าง visit_entry (ไม่ใช่ visit_record)",
          "walk-in: appointmentId=null / appointment: appointmentId ผูกกับนัดหมาย",
          "1 appointment → N entries (นัดหมายแบบ period สามารถเช็คอินได้หลายครั้ง)",
          "Hikvision sync ทำ async ฝั่ง backend (ไม่ block kiosk)",
          "ใช้ entryCode เป็น idempotency key — กัน double checkin",
          "ถ้า lineLinked=true → ถามก่อนพิมพ์ slip (ส่ง LINE แทนได้)",
          "ถ้า lineLinked=false → พิมพ์ slip อัตโนมัติ",
          "QR code ใช้สำหรับ scan ที่ประตู (Hikvision Access Control)",
        ],
        notesEn: [
          "★ Main API — creates visit_entry (not visit_record)",
          "walk-in: appointmentId=null / appointment: appointmentId linked to appointment",
          "1 appointment → N entries (period appointments can have multiple check-ins)",
          "Hikvision sync is async on backend (doesn't block kiosk)",
          "Use entryCode as idempotency key — prevent double checkin",
          "If lineLinked=true → ask before printing slip (can send via LINE)",
          "If lineLinked=false → auto-print slip",
          "QR code used for scanning at door (Hikvision Access Control)",
        ],
      },
      {
        method: "POST",
        path: "/api/kiosk/slip/print",
        summary: "บันทึกสถานะพิมพ์ slip",
        summaryEn: "Record slip print status",
        tables: ["visit_entries"],
        request: { entryId: 99, printed: true, printMethod: "thermal-80mm" },
        response: { updated: true, slipPrinted: true },
        notes: [
          "เรียกหลังพิมพ์เสร็จ (หรือเลือก skip)",
          "ถ้าผูก LINE → ถามก่อนพิมพ์ (ส่ง slip ทาง LINE ได้)",
        ],
        notesEn: [
          "Called after printing (or skip)",
          "If LINE-linked → ask before printing (can send slip via LINE)",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "Visit Slips",
        settingsPageEn: "Visit Slips",
        settingsPath: "/web/settings/visit-slips",
        fields: ["visit_slip_templates.size", "visit_slip_templates.fields", "visit_slip_templates.header_text", "visit_slip_templates.footer_text", "visit_slip_templates.logo_url", "visit_slip_templates.logo_size_px", "visit_slip_sections.officerSign"],
        usage: "กำหนดรูปแบบ slip: ขนาด (thermal-80mm), field ที่แสดง, header/footer, โลโก้ (URL + ขนาด), ลงชื่อเจ้าหน้าที่/ประทับตรา",
        usageEn: "Configure slip template: size (thermal-80mm), displayed fields, header/footer, logo (URL + size), officer signature & stamp",
      },
      {
        settingsPage: "Notification Templates",
        settingsPageEn: "Notification Templates",
        settingsPath: "/web/settings/notification-templates",
        fields: ["notification_templates.trigger", "notification_templates.channel", "notification_templates.body_th", "notification_templates.variables"],
        usage: "กำหนดข้อความแจ้งเตือน: checkin-welcome (แจ้ง host), wifi-credentials (แจ้ง visitor)",
        usageEn: "Configure notification messages: checkin-welcome (notify host), wifi-credentials (notify visitor)",
      },
      {
        settingsPage: "Access Zones",
        settingsPageEn: "Access Zones",
        settingsPath: "/web/settings/access-zones",
        fields: ["access_groups.id", "access_group_zones.zone_id", "department_access_mappings.access_group_id"],
        usage: "กำหนด access group ตามแผนก → zone ที่เข้าได้ → sync Hikvision door",
        usageEn: "Map department → access group → allowed zones → sync Hikvision doors",
      },
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.slip_config.header_text", "service_points.slip_config.footer_text", "service_points.slip_config.logo_url", "service_points.slip_config.logo_size_px", "service_points.slip_config.show_officer_sign"],
        usage: "Override slip header/footer/logo/officer-sign ต่อ Kiosk (ถ้าไม่ระบุใช้ค่าจาก Template)",
        usageEn: "Per-kiosk slip header/footer/logo/officer-sign override (falls back to template defaults)",
      },
    ],
    devNotes: [
      "★ Transaction สำคัญที่สุด — ต้อง handle failure gracefully",
      "Hardware: Thermal Printer (80mm) — flutter plugin: esc_pos_printer",
      "Redirect กลับ WELCOME หลัง successRedirect timeout (default 10s)",
      "LINE Flex Message: ใช้ template จาก notification_templates",
    ],
    devNotesEn: [
      "★ Most critical transaction — must handle failure gracefully",
      "Hardware: Thermal Printer (80mm) — flutter plugin: esc_pos_printer",
      "Redirect to WELCOME after successRedirect timeout (default 10s)",
      "LINE Flex Message: use template from notification_templates",
    ],
  },

  // ─── QR_SCAN (Appointment) ───
  {
    stateType: "QR_SCAN",
    title: "สแกน QR Code นัดหมาย",
    titleEn: "Scan Appointment QR Code",
    description: "Appointment flow — สแกน QR Code จากอีเมล/LINE เพื่อค้นหานัดหมาย หรือกด \"ไม่มี QR\" เพื่อยืนยันตัวตนแทน",
    descriptionEn: "Appointment flow — Scan QR from email/LINE to look up appointment, or tap 'No QR' to verify by ID instead",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/appointment/lookup",
        summary: "ค้นหานัดหมายจาก QR Code — หลัง lookup สำเร็จ checkin จะสร้าง visit_entry ผูกกับ appointment",
        summaryEn: "Look up appointment by QR code — after successful lookup, checkin creates a visit_entry linked to the appointment",
        tables: ["appointments", "visitors", "staff", "departments", "visit_purposes", "floors"],
        request: {
          qrCodeData: "eVMS-20260326-0042",
          servicePointId: 1,
        },
        response: {
          found: true,
          appointment: {
            bookingCode: "eVMS-20260326-0042",
            visitorName: "นายสมชาย ใจดี",
            visitorCompany: "บจก. ท่องเที่ยวสยาม",
            hostName: "นางสาวพิมพา เกษมศรี",
            hostDepartment: "กองการต่างประเทศ",
            hostFloor: "ชั้น 5",
            location: "กระทรวงการท่องเที่ยวและกีฬา",
            date: "26 มีนาคม 2569",
            timeSlot: "10:00 — 11:30",
            purposeName: "ประชุม / สัมมนา",
            purposeIcon: "📋",
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
        notes: [
          "ตรวจสถานะ approved/confirmed ก่อน check-in",
          "ถ้า status = pending → แสดง 'รอการอนุมัติ'",
          "ถ้า status = rejected → แสดง 'นัดหมายถูกปฏิเสธ'",
          "ตรวจวันที่ตรงกับวันนี้ด้วย",
          "Appointment statuses: pending, approved, rejected, confirmed, cancelled, expired (ไม่มี checked-in/checked-out อีกแล้ว)",
          "หลัง lookup → checkin จะสร้าง visit_entry ใหม่ผูกกับ appointment นี้",
        ],
        notesEn: [
          "Check approved/confirmed status before check-in",
          "If status = pending → show 'Awaiting approval'",
          "If status = rejected → show 'Appointment rejected'",
          "Also validate date matches today",
          "Appointment statuses: pending, approved, rejected, confirmed, cancelled, expired (no more checked-in/checked-out)",
          "After lookup → checkin creates a new visit_entry linked to this appointment",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.timeout_config.qr_scan"],
        usage: "กำหนด timeout สำหรับสแกน QR (default 60s)",
        usageEn: "Set timeout for QR scanning (default 60s)",
      },
    ],
    devNotes: [
      "Hardware: QR Scanner — flutter plugin: usb_serial / flutter_barcode_scanner",
      "\"ไม่มี QR\" → ไปหน้า SELECT_ID_METHOD (ยืนยันตัวตนแทน)",
      "GO_BACK → กลับ PDPA_CONSENT",
    ],
    devNotesEn: [
      "Hardware: QR Scanner — flutter plugin: usb_serial / flutter_barcode_scanner",
      "'No QR' → goes to SELECT_ID_METHOD (verify by ID instead)",
      "GO_BACK → back to PDPA_CONSENT",
    ],
  },

  // ─── APPOINTMENT_PREVIEW ───
  {
    stateType: "APPOINTMENT_PREVIEW",
    title: "ข้อมูลนัดหมาย",
    titleEn: "Appointment Details",
    description: "แสดงข้อมูลนัดหมาย — ชื่อผู้จอง, host, แผนก, เวลา — กดยืนยัน check-in → ยืนยันตัวตน",
    descriptionEn: "Display appointment details — visitor name, host, department, time — confirm check-in → verify identity",
    hasApi: false,
    noApiReason: "ใช้ข้อมูลจาก lookup-qr response ที่อยู่ใน state — ไม่ต้องเรียก API ซ้ำ",
    noApiReasonEn: "Uses data from lookup-qr response stored in state — no additional API call needed",
    endpoints: [],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.timeout_config.appointment_preview"],
        usage: "กำหนด timeout (default 120s)",
        usageEn: "Set timeout (default 120s)",
      },
    ],
  },

  // ─── APPOINTMENT_VERIFY_ID ───
  {
    stateType: "APPOINTMENT_VERIFY_ID",
    title: "ยืนยันตัวตน (นัดหมาย)",
    titleEn: "Verify Identity (Appointment)",
    description: "ยืนยันตัวตนสำหรับ Appointment flow — ตรวจว่าตรงกับข้อมูลผู้จองนัดหมาย",
    descriptionEn: "Verify identity for Appointment flow — check that it matches appointment booking data",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/appointment/verify-identity",
        summary: "ยืนยันตัวตนกับนัดหมาย + ตรวจ Blocklist — รองรับ 4 โหมดค้น: bookingCode / idNumber / passportNumber / firstName+lastName (อย่างน้อย 1)",
        summaryEn: "Verify identity against appointment + check Blocklist — supports 4 search modes: bookingCode / idNumber / passportNumber / firstName+lastName (at least one required)",
        tables: ["visitors", "appointments", "blocklist"],
        request: {
          idNumber: "1234567890123",
          passportNumber: "AB1234567",
          firstName: "สมชาย",
          lastName: "ใจดี",
          bookingCode: "eVMS-20260326-0042",
          documentType: "thai-id-card",
          fullNameTh: "นายสมชาย ใจดี",
        },
        response: {
          status: "matched",
          visitorId: 15,
          appointmentId: 42,
          isBlocked: false,
          matchResult: {
            nameMatch: true,
            idMatch: true,
            confidence: 1.0,
          },
        },
        errorResponse: {
          status: "mismatch",
          matchResult: { nameMatch: false, idMatch: false, confidence: 0.0 },
          message: "ข้อมูลที่ระบุไม่ตรงกับนัดหมาย",
        },
        notes: [
          "Body ต้องมีอย่างน้อย 1: bookingCode, idNumber, passportNumber, หรือ firstName + lastName คู่กัน",
          "ถ้ามี bookingCode → ดึง appointment ตาม code นั้นแล้ว verify identity",
          "ถ้าไม่มี bookingCode → ค้น appointment ของวันนี้จาก visitor identity (เหมือน match-by-identity) แล้ว verify",
          "ตรวจ Blocklist หลังเจอ visitor",
          "ถ้าไม่ตรง → status='mismatch' + ให้ลองใหม่; ถ้าไม่เจอนัด → 404 NOT_FOUND",
        ],
        notesEn: [
          "Body requires at least one: bookingCode, idNumber, passportNumber, or firstName + lastName together",
          "With bookingCode → fetch that appointment then verify identity",
          "Without bookingCode → search today's appointments by visitor identity (same as match-by-identity) then verify",
          "Blocklist check after visitor is resolved",
          "If mismatched → status='mismatch' + allow retry; if no appointment → 404 NOT_FOUND",
        ],
      },
    ],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.allowed_document_ids", "service_points.id_masking_pattern"],
        usage: "กำหนดเอกสารที่รับ + รูปแบบ mask ID",
        usageEn: "Set accepted documents + ID masking pattern",
      },
      {
        settingsPage: "Blocklist",
        settingsPageEn: "Blocklist",
        settingsPath: "/web/blocklist",
        fields: ["blocklist.id_number", "blocklist.full_name"],
        usage: "ตรวจสอบ Blocklist ก่อนยืนยัน check-in",
        usageEn: "Check Blocklist before confirming check-in",
      },
    ],
  },

  // ─── ERROR ───
  {
    stateType: "ERROR",
    title: "Error — รายงาน log",
    titleEn: "Error — Log Report",
    description: "แสดง error message + ส่ง error log ไป backend สำหรับ monitoring (optional)",
    descriptionEn: "Display error message + send error log to backend for monitoring (optional)",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/kiosk/error-log",
        summary: "รายงาน error ไป backend (optional)",
        summaryEn: "Report error to backend (optional)",
        tables: ["kiosk_error_logs"],
        request: {
          servicePointId: 1,
          errorType: "hardware",
          device: "id-reader",
          stateAtError: "ID_VERIFICATION",
          message: "Card reader timeout after 60s",
          stackTrace: "...",
        },
        response: { logged: true, errorId: "ERR-20260326-0001" },
        notes: ["Optional — ใช้สำหรับ monitoring dashboard", "ส่ง async ไม่ต้องรอ response"],
        notesEn: ["Optional — for monitoring dashboard", "Send async, no need to wait for response"],
      },
    ],
    configSources: [],
  },

  // ─── TIMEOUT ───
  {
    stateType: "TIMEOUT",
    title: "Timeout — หมดเวลาทำรายการ",
    titleEn: "Timeout — Session Expired",
    description: "แสดงข้อความ \"หมดเวลา\" → reset กลับ WELCOME อัตโนมัติ",
    descriptionEn: "Display 'Session expired' → auto-reset to WELCOME",
    hasApi: false,
    noApiReason: "Reset กลับ WELCOME — ไม่ต้องเรียก API (อาจส่ง error-log ได้ถ้าต้องการ)",
    noApiReasonEn: "Resets to WELCOME — no API call needed (can optionally send error-log)",
    endpoints: [],
    configSources: [
      {
        settingsPage: "จุดให้บริการ (Service Points)",
        settingsPageEn: "Service Points",
        settingsPath: "/web/settings/service-points",
        fields: ["service_points.timeout_config.*"],
        usage: "กำหนด timeout ต่อหน้า — ถ้าหมดเวลา → auto-redirect ไป TIMEOUT state",
        usageEn: "Set per-screen timeout — if expired → auto-redirect to TIMEOUT state",
      },
    ],
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
