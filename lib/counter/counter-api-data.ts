/**
 * Counter API Specification Data — mapped to each CounterState
 *
 * Flutter dev: ใช้ข้อมูลนี้เป็น reference สำหรับ API integration
 * แต่ละ state จะมี API endpoint, request/response schema, tables ที่ใช้
 */

import type { CounterState } from "@/components/counter/CounterStatePanel";
import type { ApiParam } from "@/lib/api-doc-data";

// ===== TYPES =====

export interface CounterApiEndpoint {
  method: "GET" | "POST";
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

export interface CounterApiSpec {
  stateType: CounterState;
  hasApi: boolean;
  noApiReason?: string;
  noApiReasonEn?: string;
  endpoints: CounterApiEndpoint[];
}

// ===== DATA =====

const apiSpecs: CounterApiSpec[] = [
  // ─── COUNTER_SELECTION ───
  {
    stateType: "COUNTER_SELECTION",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/service-points",
        summary: "โหลดรายการจุดบริการ Counter ที่ว่าง (ต้อง Staff Auth)",
        summaryEn: "Load available counter service points (Staff Auth required)",
        tables: ["service_points", "business_hours_rules", "service_point_purposes", "service_point_documents"],
        response: {
          servicePoints: [
            {
              id: 3,
              name: "เคาน์เตอร์ รปภ. ประตู 1",
              nameEn: "Security Counter Gate 1",
              type: "counter",
              status: "online",
              location: "ชั้น 1 ประตูทางเข้าหลัก",
              currentOfficer: null,
              allowedPurposeIds: [1, 2, 3, 4, 5, 6, 7],
              allowedDocumentIds: [1, 2, 5],
            },
          ],
        },
        notes: ["🔒 ต้อง Staff Auth (Cookie/Bearer) — ≠ Kiosk ที่ใช้ public endpoint", "กรอง type=counter, status=online", "แสดงเจ้าหน้าที่ที่ประจำจุดอยู่"],
        notesEn: ["🔒 Requires Staff Auth (Cookie/Bearer) — unlike Kiosk which uses public endpoint", "Filter type=counter, status=online", "Show currently assigned officer"],
      },
      {
        method: "POST",
        path: "/api/counter/session",
        summary: "เจ้าหน้าที่เข้าประจำจุด Counter",
        summaryEn: "Officer starts counter session",
        tables: ["service_points", "staff"],
        request: {
          servicePointId: 3,
          officerPin: "1234",
          staffId: 8,
        },
        response: {
          sessionId: "CTR-20260315-003",
          servicePoint: { id: 3, name: "เคาน์เตอร์ รปภ. ประตู 1" },
          officer: { id: 8, name: "สิบตำรวจโท วีรชัย แสนดี", role: "security_guard" },
          config: {
            allowedPurposeIds: [1, 2, 3, 4, 5, 6, 7],
            allowedDocumentIds: [1, 2, 5],
            supportedInputMethods: ["card-reader", "passport-reader", "manual", "qr-scan", "thai-id-app"],
          },
          token: "<officer_session_token>",
        },
        notes: ["PIN ยืนยันตัวตนเจ้าหน้าที่", "สร้าง session token สำหรับ API ต่อไป"],
        notesEn: ["PIN authenticates officer", "Creates session token for subsequent API calls"],
      },
    ],
  },

  // ─── IDLE ───
  {
    stateType: "IDLE",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/dashboard",
        summary: "โหลดสรุปสถิติประจำวัน + คิว (นับจาก visit_entries)",
        summaryEn: "Load daily summary stats + queue (counts from visit_entries)",
        tables: ["visit_entries", "appointments", "visitors", "service_points"],
        response: {
          stats: {
            todayTotal: 45,
            walkin: 28,
            appointment: 17,
            checkedOut: 30,
            currentlyInside: 15,
            pendingQueue: 3,
          },
          recentVisitors: [
            { visitId: 41, visitorName: "นายประเสริฐ มั่นคง", purpose: "ติดต่อราชการ", checkinAt: "2026-03-15T08:45:00+07:00" },
          ],
          upcomingAppointments: [
            { bookingCode: "eVMS-20260315-0042", visitorName: "นายสมชาย ใจดี", timeSlot: "10:00-11:30", status: "approved" },
          ],
        },
        notes: ["Refresh ทุกครั้งที่กลับ IDLE", "Polling ทุก 30 วินาที", "currentlyInside นับจาก visit_entries WHERE status='checked-in' (ไม่ใช่จาก appointments)"],
        notesEn: ["Refresh on every IDLE return", "Poll every 30 seconds", "currentlyInside counts from visit_entries WHERE status='checked-in' (not from appointments)"],
      },
      {
        method: "GET",
        path: "/api/counter/entries/today",
        summary: "ดึงรายการ visit_entries วันนี้ + filter ตาม status",
        summaryEn: "List today's visit entries with status filtering",
        tables: ["visit_entries", "visitors", "departments", "visit_purposes", "appointments"],
        queryParams: [
          {
            name: "status",
            type: "string",
            required: false,
            description: "กรองตาม entry status — รองรับหลายค่าคั่นด้วย comma เช่น 'checked-in,checked-out,auto-checkout,overstay'",
          },
        ],
        response: {
          entries: [
            {
              entryId: 42,
              entryCode: "ENT-20260315-0099",
              appointmentId: null,
              visitor: { name: "นายสมชาย ใจดี", idNumber: "1-2345-XXXXX-XX-3" },
              purpose: "ติดต่อราชการ",
              department: "สำนักงานปลัด",
              floor: "ชั้น 3",
              checkinAt: "2026-03-15T09:05:00+07:00",
              checkoutAt: null,
              status: "checked-in",
              type: "walkin",
            },
          ],
          total: 45,
          filters: { status: "checked-in" },
        },
        notes: [
          "รองรับ query params: ?status=checked-in,checked-out,auto-checkout,overstay",
          "appointmentId = null หมายถึง walk-in",
          "ใช้แสดงรายการผู้เยี่ยมที่อยู่ในอาคาร หรือประวัติวันนี้",
        ],
        notesEn: [
          "Supports query params: ?status=checked-in,checked-out,auto-checkout,overstay",
          "appointmentId = null means walk-in entry",
          "Used to display visitors currently inside or today's history",
        ],
      },
    ],
  },

  // ─── WALKIN_IDENTITY ───
  {
    stateType: "WALKIN_IDENTITY",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/identity/card-read",
        summary: "อ่านบัตร + เช็ค blocklist + upsert visitor",
        summaryEn: "Read card + check blocklist + upsert visitor",
        tables: ["visitors", "blocklist", "visit_entries"],
        request: {
          inputMethod: "card-reader",
          documentType: "thai-id-card",
          idNumber: "1234567890123",
          fullNameTh: "นายสมชาย ใจดี",
          fullNameEn: "MR. SOMCHAI JAIDEE",
          dateOfBirth: "1985-06-15",
          photo: "<base64>",
          servicePointId: 3,
        },
        response: {
          status: "ok",
          visitorId: 15,
          isNewVisitor: false,
          isBlocked: false,
          existingAppointments: [],
          previousVisitCount: 3,
          verifiedData: { fullNameTh: "นายสมชาย ใจดี", fullNameEn: "MR. SOMCHAI JAIDEE", idNumber: "1-2345-67890-12-3" },
        },
        errorResponse: {
          status: "blocked",
          isBlocked: true,
          blockReason: "ประพฤติไม่เหมาะสม",
          message: "บุคคลนี้ถูกระงับการเข้าพื้นที่",
        },
        notes: ["รองรับ card-reader, passport-reader, qr-scan, thai-id-app", "Upsert visitor ถ้าเป็นคนใหม่", "ถ้ามีนัดหมาย → แนะนำ appointment flow"],
        notesEn: ["Supports card-reader, passport-reader, qr-scan, thai-id-app", "Upsert visitor if new", "If has appointment → suggest appointment flow"],
      },
      {
        method: "POST",
        path: "/api/counter/identity/manual",
        summary: "กรอกข้อมูลด้วยมือ (manual entry)",
        summaryEn: "Manual identity input by officer",
        tables: ["visitors", "blocklist"],
        request: {
          inputMethod: "manual",
          documentType: "thai-id-card",
          idNumber: "1234567890123",
          titleTh: "นาย",
          firstNameTh: "สมชาย",
          lastNameTh: "ใจดี",
          phone: "081-234-5678",
          servicePointId: 3,
          officerNote: "บัตรหมดอายุ — ใช้ใบขับขี่ยืนยัน",
        },
        response: {
          status: "ok",
          visitorId: 16,
          isNewVisitor: true,
          isBlocked: false,
          verifiedData: { fullNameTh: "นายสมชาย ใจดี", idNumber: "1-2345-67890-12-3" },
        },
        notes: ["ใช้เมื่อเครื่องอ่านบัตรเสีย หรือเอกสารอื่น", "officerNote บันทึกเหตุผลที่ใช้ manual"],
        notesEn: ["Use when card reader broken or alternative documents", "officerNote records reason for manual entry"],
      },
    ],
  },

  // ─── WALKIN_PURPOSE ───
  {
    stateType: "WALKIN_PURPOSE",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/purposes",
        summary: "ดึงวัตถุประสงค์ที่ Counter รองรับ",
        summaryEn: "Get visit purposes for this counter",
        tables: ["visit_purposes", "visit_purpose_channel_configs", "visit_purpose_department_rules", "service_point_purposes"],
        response: {
          purposes: [
            { id: 1, name: "ติดต่อราชการ", nameEn: "Official Business", icon: "🏛️", requirePhoto: true, allowedDepartmentIds: [1, 2, 3, 4, 5, 8, 9] },
            { id: 2, name: "ประชุม / สัมมนา", nameEn: "Meeting / Seminar", icon: "📋", requirePhoto: true, allowedDepartmentIds: [1, 3, 4, 9] },
            { id: 3, name: "ส่งเอกสาร / พัสดุ", nameEn: "Document Delivery", icon: "📄", requirePhoto: false, allowedDepartmentIds: [1, 2, 4] },
          ],
        },
        notes: [
          "กรองตาม allowedPurposeIds ของ ServicePoint",
          "Cache ได้ — refresh ตอน login",
          "requirePhoto มาจาก visit_purpose_channel_configs (channel='counter') — default = true ถ้ายังไม่ได้ตั้งค่า",
        ],
        notesEn: [
          "Filter by ServicePoint allowedPurposeIds",
          "Cacheable — refresh on login",
          "requirePhoto sourced from visit_purpose_channel_configs (channel='counter') — defaults to true when no row exists",
        ],
      },
    ],
  },

  // ─── WALKIN_DEPARTMENT ───
  {
    stateType: "WALKIN_DEPARTMENT",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/departments",
        summary: "ดึงหน่วยงานตาม purpose ที่เลือก",
        summaryEn: "Get departments filtered by selected purpose",
        tables: ["departments", "floors", "floor_departments", "visit_purpose_department_rules"],
        queryParams: [
          {
            name: "purposeId",
            type: "number",
            required: true,
            description: "Visit purpose ID เพื่อกรอง departments ที่รองรับการรับผู้เยี่ยมจาก counter",
          },
        ],
        response: {
          departments: [
            { id: 1, name: "สำนักงานปลัดกระทรวง", nameEn: "Office of the Permanent Secretary", floor: "ชั้น 3", requireApproval: true, offerWifi: true },
            { id: 2, name: "กองกลาง", nameEn: "General Administration Division", floor: "ชั้น 2", requireApproval: true, offerWifi: true },
          ],
          floors: [
            { floor: "ชั้น 2", count: 1 },
            { floor: "ชั้น 3", count: 1 },
          ],
        },
        notes: ["กรองตาม purposeDepartmentMap[purposeId]", "Auto-select ถ้ามี 1 หน่วยงาน", "รองรับ filter ตามชั้น"],
        notesEn: ["Filter by purposeDepartmentMap[purposeId]", "Auto-select if only 1 department", "Supports floor tab filtering"],
      },
    ],
  },

  // ─── WALKIN_CONTACT ───
  {
    stateType: "WALKIN_CONTACT",
    hasApi: false,
    noApiReason: "กรอกข้อมูลในฟอร์ม — เก็บไว้ใน state (ชื่อผู้ที่มาพบ, เบอร์โทร เป็น optional)",
    noApiReasonEn: "Form input stored in local state — host contact name & phone are optional fields",
    endpoints: [],
  },

  // ─── WALKIN_PHOTO ───
  {
    stateType: "WALKIN_PHOTO",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/visitor-photo",
        summary: "อัปโหลดภาพถ่ายผู้เยี่ยม (Webcam)",
        summaryEn: "Upload visitor photo from webcam",
        contentType: "application/json",
        tables: ["visitors"],
        request: {
          photo: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          visitorId: 15,
          servicePointId: 3,
          capturedBy: "officer",
        },
        response: {
          faceDetected: true,
          quality: "good",
        },
        notes: ["Compress JPEG 80% ก่อนอัปโหลด", "Skip ได้ถ้าไม่มีกล้อง"],
        notesEn: ["Compress JPEG to 80% before upload", "Can skip if no webcam available"],
      },
    ],
  },

  // ─── WALKIN_REVIEW ───
  {
    stateType: "WALKIN_REVIEW",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/walkin/checkin",
        summary: "สร้าง visit_entry สำหรับ walk-in (API หลัก) — appointment_id = NULL",
        summaryEn: "Create visit_entry for walk-in (main API) — appointment_id = NULL",
        tables: ["visit_entries", "access_groups", "access_group_zones", "department_access_mappings", "visit_slip_templates", "visit_slip_sections", "visit_slip_fields", "purpose_slip_mappings", "visitors"],
        request: {
          type: "walkin",
          visitorId: 15,
          servicePointId: 3,
          visitPurposeId: 1,
          departmentId: 1,
          hostContactName: "คุณสมหวัง สุขสมบูรณ์",
          hostPhone: "02-123-4567 ต่อ 1234",
          idMethod: "card-reader",
          documentType: "thai-id-card",
          facePhotoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          officerId: 8,
        },
        response: {
          entry: { entryId: 42, entryCode: "ENT-20260315-0099", appointmentId: null, status: "checked-in", checkinBy: "officer" },
          accessControl: {
            accessGroupName: "ติดต่อราชการ ชั้น 2-5",
            qrCodeData: "eVMS-OFA-20260315-0099-A2B3C4",
            allowedZones: ["ล็อบบี้ ชั้น 1", "สำนักงานปลัด ชั้น 3"],
            hikvisionSynced: true,
          },
          badge: {
            badgeNumber: "V-20260315-0099",
            askPrint: true,
            logoUrl: "/uploads/slip-logos/logo-1711785600.png",
            logoSizePx: 40,
            showOfficerSign: true,
          },
          notification: { hostNotified: true, channel: "line" },
        },
        errorResponse: {
          error: "DUPLICATE_ACTIVE_ENTRY",
          message: "ผู้เยี่ยมนี้ยังเช็คอินอยู่ — กรุณาเช็คเอาท์ก่อน",
        },
        notes: [
          "API หลัก — รวม transaction ทั้งหมด",
          "Hikvision sync ทำ async ฝั่ง backend",
          "แจ้ง host ผ่าน LINE/Email อัตโนมัติ",
          "badge.logoUrl + logoSizePx ดึงจาก visit_slip_templates (null = ใช้ค่าเริ่มต้น)",
          "badge.showOfficerSign ดึงจาก visit_slip_sections.officerSign.is_enabled",
        ],
        notesEn: [
          "Main API — combines all transactions",
          "Hikvision sync is async on backend",
          "Auto-notify host via LINE/Email",
          "badge.logoUrl + logoSizePx from visit_slip_templates (null = use defaults)",
          "badge.showOfficerSign from visit_slip_sections.officerSign.is_enabled",
        ],
      },
    ],
  },

  // ─── APPOINTMENT_SEARCH ───
  {
    stateType: "APPOINTMENT_SEARCH",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/appointments/today",
        summary: "ค้นหานัดหมายวันนี้",
        summaryEn: "Search today's appointments",
        tables: ["appointments", "visitors", "staff", "departments", "visit_purposes"],
        queryParams: [
          {
            name: "q",
            type: "string",
            required: false,
            description: "Keyword ค้นหา — ชื่อผู้เยี่ยม, เลขบัตร, booking code, หรือชื่อ host",
          },
        ],
        response: {
          appointments: [
            {
              id: 42,
              bookingCode: "eVMS-20260315-0042",
              visitor: { name: "นายสมชาย ใจดี", idNumber: "1-2345-XXXXX-XX-3" },
              host: { name: "นางสาวพิมพา เกษมศรี", department: "กองการต่างประเทศ", floor: "ชั้น 5" },
              purpose: "ประชุม / สัมมนา",
              timeSlot: "10:00-11:30",
              status: "approved",
            },
          ],
          total: 1,
        },
        notes: ["ค้นจาก keyword: ชื่อ, เลขบัตร, booking code, ชื่อ host", "กรอง status=approved,confirmed"],
        notesEn: ["Search by keyword: name, ID, booking code, host name", "Filter status=approved,confirmed"],
      },
    ],
  },

  // ─── APPOINTMENT_IDENTITY ───
  {
    stateType: "APPOINTMENT_IDENTITY",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/appointments/{id}/verify",
        summary: "ยืนยันตัวตนกับนัดหมาย",
        summaryEn: "Verify identity against appointment",
        tables: ["visitors", "appointments", "blocklist"],
        request: {
          documentType: "thai-id-card",
          idNumber: "1234567890123",
          inputMethod: "card-reader",
          fullNameTh: "นายสมชาย ใจดี",
          servicePointId: 3,
        },
        response: {
          status: "matched",
          visitorId: 15,
          isBlocked: false,
          matchResult: { nameMatch: true, idMatch: true, confidence: 1.0 },
          verifiedData: { fullNameTh: "นายสมชาย ใจดี", fullNameEn: "SOMCHAI JAIDEE", photo: "<url>" },
        },
        errorResponse: {
          status: "mismatch",
          matchResult: { nameMatch: false, idMatch: false, confidence: 0.0 },
          message: "ข้อมูลบัตรไม่ตรงกับผู้จองนัดหมาย",
        },
        notes: ["เลขบัตรต้องตรงกับนัดหมาย", "เช็ค blocklist ก่อน match", "นัดหมายต้อง status = confirmed/approved"],
        notesEn: ["ID number must match appointment", "Check blocklist before matching", "Appointment must be confirmed/approved"],
      },
    ],
  },

  // ─── APPOINTMENT_REVIEW ───
  {
    stateType: "APPOINTMENT_REVIEW",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/appointments/{id}/checkin",
        summary: "เช็คอินจากนัดหมาย — สร้าง visit_entry ผูกกับ appointment",
        summaryEn: "Check-in from appointment — creates a visit_entry linked to the appointment",
        tables: ["visit_entries", "appointments", "access_groups", "access_group_zones", "department_access_mappings", "visit_slip_templates", "purpose_slip_mappings"],
        request: {
          visitorId: 15,
          servicePointId: 3,
          idMethod: "card-reader",
          documentType: "thai-id-card",
          facePhotoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          officerId: 8,
        },
        response: {
          entry: { entryId: 42, entryCode: "ENT-20260315-0042", appointmentId: 42, status: "checked-in", checkinBy: "officer" },
          accessControl: {
            accessGroupName: "ประชุม ชั้น 5",
            qrCodeData: "eVMS-OFA-20260315-0042-X5Y6Z7",
            allowedZones: ["ล็อบบี้ ชั้น 1", "กองการต่างประเทศ ชั้น 5"],
            hikvisionSynced: true,
          },
          badge: {
            badgeNumber: "V-20260315-0042",
            askPrint: true,
            logoUrl: "/uploads/slip-logos/logo-1711785600.png",
            logoSizePx: 40,
            showOfficerSign: true,
          },
          notification: { hostNotified: true, channel: "line", notifiedTo: "นางสาวพิมพา เกษมศรี" },
        },
        notes: [
          "สร้าง visit_entry ใหม่ผูกกับ appointment (1 appointment → N entries สำหรับนัดหมายแบบ period)",
          "ไม่เปลี่ยน appointment status — appointment ยังคงเป็น approved/confirmed",
          "แจ้ง host อัตโนมัติ",
          "badge.logoUrl/logoSizePx/showOfficerSign ดึงจาก visit_slip_templates + sections",
        ],
        notesEn: [
          "Creates new visit_entry linked to appointment (1 appointment → N entries for period appointments)",
          "Does NOT change appointment status — appointment stays approved/confirmed",
          "Auto-notify host",
          "badge.logoUrl/logoSizePx/showOfficerSign from visit_slip_templates + sections",
        ],
      },
    ],
  },

  // ─── CHECKOUT_SCAN ───
  {
    stateType: "CHECKOUT_SCAN",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/entries/active/{badgeCode}",
        summary: "ค้นหา entry ผู้เยี่ยมจาก badge/QR",
        summaryEn: "Look up active visit entry by badge/QR code",
        tables: ["visit_entries", "visitors", "departments", "visit_purposes"],
        response: {
          found: true,
          entry: {
            entryId: 42,
            entryCode: "ENT-20260315-0099",
            appointmentId: null,
            badgeNumber: "V-20260315-0099",
            visitor: { name: "นายสมชาย ใจดี", idNumber: "1-2345-XXXXX-XX-3", photo: "<url>" },
            purpose: "ติดต่อราชการ",
            department: "สำนักงานปลัด",
            floor: "ชั้น 3",
            checkinAt: "2026-03-15T09:05:00+07:00",
            duration: "2 ชั่วโมง 30 นาที",
            status: "checked-in",
          },
        },
        errorResponse: {
          found: false,
          reason: "not-found",
          message: "ไม่พบข้อมูลผู้เยี่ยมจากรหัสนี้",
        },
        notes: ["สแกน Barcode/QR จากบัตรผู้เยี่ยม", "แสดง duration ตั้งแต่เช็คอิน"],
        notesEn: ["Scan barcode/QR from visitor badge", "Show duration since check-in"],
      },
    ],
  },

  // ─── CHECKOUT_CONFIRM ───
  {
    stateType: "CHECKOUT_CONFIRM",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/entries/{id}/checkout",
        summary: "ยืนยัน checkout — อัปเดต entry status เป็น checked-out",
        summaryEn: "Confirm visitor checkout — updates entry status to checked-out",
        tables: ["visit_entries", "access_groups"],
        request: {
          officerId: 8,
          returnedBadge: true,
          returnedItems: ["บัตรผู้เยี่ยม"],
          officerNote: null,
        },
        response: {
          success: true,
          entry: {
            entryId: 42,
            entryCode: "ENT-20260315-0099",
            status: "checked-out",
            checkoutAt: "2026-03-15T11:35:00+07:00",
            checkoutBy: "officer",
            totalDuration: "2 ชั่วโมง 30 นาที",
          },
          accessRevoked: true,
        },
        notes: ["อัปเดต visit_entries.status → checked-out", "ลบ access จาก Hikvision async", "บันทึกการคืนบัตร/อุปกรณ์"],
        notesEn: ["Update visit_entries.status → checked-out", "Revoke Hikvision access async", "Record badge/item returns"],
      },
    ],
  },

  // ─── PRINT_SLIP ───
  {
    stateType: "PRINT_SLIP",
    hasApi: true,
    endpoints: [
      {
        method: "POST",
        path: "/api/counter/badge/print",
        summary: "พิมพ์บัตรผู้เยี่ยม + ดึง slip layout",
        summaryEn: "Print visitor badge + get slip layout",
        tables: ["visit_slip_templates", "visit_slip_sections", "visit_slip_fields", "purpose_slip_mappings", "visit_entries"],
        request: {
          entryId: 42,
          servicePointId: 3,
          printType: "badge",
          copies: 1,
        },
        response: {
          printJob: { id: "PRT-20260315-042", status: "sent" },
          badgeData: {
            header: "กระทรวงการท่องเที่ยวและกีฬา",
            logoUrl: "/uploads/slip-logos/logo-1711785600.png",
            logoSizePx: 40,
            visitorName: "นายสมชาย ใจดี",
            badgeNumber: "V-20260315-0099",
            purpose: "ติดต่อราชการ",
            department: "สำนักงานปลัด ชั้น 3",
            qrCode: "eVMS-OFA-20260315-0099-A2B3C4",
            showOfficerSign: true,
            officerSignLabelTh: "ลงชื่อเจ้าหน้าที่ / Officer Signature",
            officerSignLabelEn: "ประทับตรา / Stamp",
            stampPlaceholder: "ประทับตราหน่วยงาน",
            footer: "กรุณาคืนบัตรผู้เยี่ยมก่อนออก",
          },
        },
        notes: [
          "เครื่องพิมพ์ต้อง connected",
          "ใช้ slipConfig จาก ServicePoint (ถ้าไม่มี fallback เป็น Template default)",
          "Thermal printer: esc_pos_printer / sunmi_printer",
          "logoUrl: null → ใช้โลโก้เริ่มต้น (/images/mot_logo_slip.png)",
          "showOfficerSign=true → พิมพ์ส่วนลงชื่อ+ประทับตรา — เจ้าหน้าที่เซ็นก่อนมอบให้ผู้เยี่ยม",
        ],
        notesEn: [
          "Printer must be connected",
          "Use slipConfig from ServicePoint (falls back to template defaults)",
          "Thermal: esc_pos_printer / sunmi_printer",
          "logoUrl: null → use default logo (/images/mot_logo_slip.png)",
          "showOfficerSign=true → print signature & stamp area — officer signs before handing to visitor",
        ],
      },
    ],
  },

  // ─── SUCCESS ───
  {
    stateType: "SUCCESS",
    hasApi: true,
    endpoints: [
      {
        method: "GET",
        path: "/api/counter/entries/{id}/summary",
        summary: "ดึงสรุปข้อมูล check-in สำเร็จ",
        summaryEn: "Get check-in success summary",
        tables: ["visit_entries", "visitors", "departments", "visit_purposes"],
        response: {
          entry: { entryId: 42, entryCode: "ENT-20260315-0099", appointmentId: null, badgeNumber: "V-20260315-0099", status: "checked-in", type: "walkin" },
          visitor: { name: "นายสมชาย ใจดี", nameEn: "SOMCHAI JAIDEE" },
          destination: { purpose: "ติดต่อราชการ", department: "สำนักงานปลัด", floor: "ชั้น 3" },
          accessControl: { qrCodeData: "eVMS-OFA-20260315-0099-A2B3C4", validUntil: "17:00 น." },
          canReprint: true,
        },
        notes: ["แสดง overlay สำเร็จ + ข้อมูลบัตร", "REPRINT → กลับ PRINT_SLIP", "CLOSE → กลับ IDLE"],
        notesEn: ["Show success overlay + badge info", "REPRINT → back to PRINT_SLIP", "CLOSE → back to IDLE"],
      },
    ],
  },
];

// ===== LOOKUP =====

const specMap = new Map<CounterState, CounterApiSpec>();
for (const spec of apiSpecs) {
  specMap.set(spec.stateType, spec);
}

export function getCounterApiSpec(state: CounterState): CounterApiSpec | undefined {
  return specMap.get(state);
}

export function getAllCounterApiSpecs(): CounterApiSpec[] {
  return apiSpecs;
}
