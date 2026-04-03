// ════════════════════════════════════════════════════
// LINE OA Flow Data — States, DB Schema, API Docs, Flow Definitions
// สำหรับ Prototype จำลองการทำงาน LINE OA ทั้งระบบ
// ════════════════════════════════════════════════════

// ===== TYPES =====

export type LineUserType = "visitor" | "officer";

export type LineFlowStateId =
  // Visitor Flow
  | "new-friend"
  | "visitor-register"
  | "visitor-registered"
  | "visitor-booking"
  | "visitor-booking-confirmed"
  | "visitor-approval-result"
  | "visitor-auto-cancelled"
  | "visitor-reminder"
  | "visitor-checkin-kiosk"
  | "visitor-wifi-credentials"
  | "visitor-slip-line"
  | "visitor-checkout"
  // Officer Flow
  | "officer-register"
  | "officer-registered"
  | "officer-new-request"
  | "officer-approve-action"
  | "officer-checkin-alert"
  | "officer-overstay-alert";

export interface FlowStateInfo {
  id: LineFlowStateId;
  name: string;
  nameEn: string;
  description: string;
  userType: LineUserType | "both";
  order: number;
  triggers: string[];       // อะไร trigger state นี้
  nextStates: LineFlowStateId[];
  relatedChannels: ("kiosk" | "counter" | "web" | "line")[];
  roles: string[];          // roles ที่เกี่ยวข้อง
  dbTables: string[];       // ตารางที่เกี่ยวข้อง
  apiEndpoints: string[];   // API paths ที่เกี่ยวข้อง
  codeExample?: string[];   // LIFF/API code snippet สำหรับ dev
}

export interface LineApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  summaryEn: string;
  auth: "public" | "user" | "admin" | "webhook";
  requestBody?: { name: string; type: string; required: boolean; description: string }[];
  responseExample: string;
  stateIds: LineFlowStateId[];
  notes?: string[];
}

export interface LineDbTable {
  name: string;
  comment: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    comment: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    references?: string;
  }[];
  stateIds: LineFlowStateId[];
}

// ===== FLOW STATES =====

export const lineFlowStates: FlowStateInfo[] = [
  // ─── Visitor Flow ───
  {
    id: "new-friend",
    name: "เพิ่มเพื่อน (New Friend)",
    nameEn: "Add Friend / Welcome",
    description: "ผู้ใช้เพิ่มเพื่อน LINE OA ของระบบ → ระบบส่งข้อความต้อนรับ + แสดง Rich Menu สำหรับผู้ใช้ใหม่",
    userType: "both",
    order: 1,
    triggers: ["User follows LINE OA (@evms-mots)", "LINE Follow Event webhook"],
    nextStates: ["visitor-register", "officer-register"],
    relatedChannels: ["line"],
    roles: ["visitor", "officer"],
    dbTables: ["line_oa_config", "line_webhook_events"],
    apiEndpoints: ["POST /api/line/webhook"],
    codeExample: [
      "// Webhook Handler (Node.js)",
      "app.post('/api/line/webhook', async (req, res) => {",
      "  const signature = req.headers['x-line-signature'];",
      "  if (!validateSignature(req.body, signature)) return res.status(401);",
      "  for (const event of req.body.events) {",
      "    if (event.type === 'follow') {",
      "      await assignRichMenu(event.source.userId, 'new-friend');",
      "      await pushMessage(event.source.userId, welcomeMessage);",
      "    }",
      "  }",
      "  res.json({ status: 'ok' });",
      "});",
    ],
  },
  {
    id: "visitor-register",
    name: "ลงทะเบียน Visitor (LIFF)",
    nameEn: "Visitor Registration via LIFF",
    description: "เปิด LIFF App → เลือกประเภท 'ผู้มาติดต่อ' → กรอกข้อมูลส่วนบุคคล → ระบบสร้าง user account + ผูก LINE → เปลี่ยน Rich Menu เป็น Visitor Menu",
    userType: "visitor",
    order: 2,
    triggers: ["User taps 'Registration Now' on Rich Menu", "LIFF app opened"],
    nextStates: ["visitor-registered"],
    relatedChannels: ["line"],
    roles: ["visitor"],
    dbTables: ["user_accounts", "visitor_profiles", "line_oa_config"],
    apiEndpoints: ["POST /api/auth/register", "POST /api/users/me/line/link", "POST /api/line/richmenu/assign"],
    codeExample: [
      "// LIFF Registration (Frontend)",
      "import liff from '@line/liff';",
      "",
      "await liff.init({ liffId: LIFF_ID });",
      "const profile = await liff.getProfile();",
      "// profile.userId = 'U1234567890'",
      "// profile.displayName = 'พุทธิพงษ์'",
      "",
      "const res = await fetch('/api/auth/register', {",
      "  method: 'POST',",
      "  body: JSON.stringify({",
      "    user_type: 'visitor',",
      "    first_name, last_name, phone, email, company,",
      "    line_access_token: liff.getAccessToken(),",
      "  })",
      "});",
      "// → ระบบ link LINE account + assign Visitor Rich Menu",
    ],
  },
  {
    id: "visitor-registered",
    name: "ลงทะเบียนสำเร็จ",
    nameEn: "Registration Complete",
    description: "ระบบส่ง Flex Message ยืนยันการลงทะเบียน + เปลี่ยน Rich Menu → ผู้ใช้สามารถจองนัดหมาย, ดูข้อมูลส่วนตัว",
    userType: "visitor",
    order: 3,
    triggers: ["Registration API returns success"],
    nextStates: ["visitor-booking"],
    relatedChannels: ["line"],
    roles: ["visitor"],
    dbTables: ["user_accounts", "visitor_profiles"],
    apiEndpoints: ["POST /api/line/push-message"],
  },
  {
    id: "visitor-booking",
    name: "จองนัดหมาย (LIFF)",
    nameEn: "Book Appointment via LIFF",
    description: "เปิด LIFF → เลือกวัตถุประสงค์ (filter acceptFromLine=true) → เลือกแผนก → ตรวจ visit_purpose_department_rules → ถ้า requirePersonName=true ต้องเลือกผู้พบ → แสดง badge อนุมัติอัตโนมัติ/รออนุมัติ ตาม requireApproval → กรอกรายละเอียด → ยืนยัน PDPA → POST /api/appointments { channel: 'line', departmentId, visitPurposeId }",
    userType: "visitor",
    order: 4,
    triggers: ["User taps 'บันทึกนัดหมาย' on Rich Menu or Flex Message button"],
    nextStates: ["visitor-booking-confirmed"],
    relatedChannels: ["line", "web"],
    roles: ["visitor"],
    dbTables: ["appointments", "visit_purposes", "visit_purpose_department_rules", "departments", "approver_groups", "pdpa_consents"],
    apiEndpoints: ["GET /api/visit-purposes?channel=line", "GET /api/departments", "GET /api/staff", "POST /api/appointments", "POST /api/pdpa-consents"],
    codeExample: [
      "// LIFF Booking (Frontend) — อัปเดต: เพิ่ม departmentId + ตรวจ rules",
      "const purposes = await fetch('/api/visit-purposes?channel=line');",
      "const departments = await fetch('/api/departments');",
      "// ตรวจ rules: GET /api/visit-purposes/:id/department-rules",
      "// rule.acceptFromLine → แสดงเฉพาะที่อนุญาต LINE",
      "// rule.requireApproval → แสดง badge 'รออนุมัติ'/'อนุมัติอัตโนมัติ'",
      "// rule.requirePersonName → ต้องเลือก host staff",
      "",
      "const res = await fetch('/api/appointments', {",
      "  method: 'POST',",
      "  headers: { Authorization: `Bearer ${token}` },",
      "  body: JSON.stringify({",
      "    visitorId: myVisitorId,",
      "    visitPurposeId: 1,",
      "    departmentId: 2,",
      "    type: 'official',",
      "    date: '2026-04-02',",
      "    timeStart: '10:00',",
      "    timeEnd: '11:00',",
      "    purpose: 'ติดต่อราชการ',",
      "    hostStaffId: 5, // ถ้า requirePersonName=true",
      "    channel: 'line',",
      "  })",
      "});",
      "// → สร้าง appointment + ส่ง notification ไปยัง host",
    ],
  },
  {
    id: "visitor-booking-confirmed",
    name: "ยืนยันการจอง",
    nameEn: "Booking Confirmed",
    description: "ระบบส่ง Flex Message แสดงรายละเอียดนัดหมาย + QR Code + สถานะ 'รอดำเนินการ' → ส่ง notification ไปยังเจ้าหน้าที่ผู้รับพบ",
    userType: "visitor",
    order: 5,
    triggers: ["POST /api/appointments returns success", "Appointment created in DB"],
    nextStates: ["visitor-approval-result"],
    relatedChannels: ["line", "web"],
    roles: ["visitor", "officer"],
    dbTables: ["appointments", "notification_logs"],
    apiEndpoints: ["POST /api/line/push-message", "POST /api/notifications/send"],
    codeExample: [
      "// Send Flex Message (Backend)",
      "const template = await getFlexTemplate('visitor-booking-confirmed');",
      "const flexMsg = buildFlexMessage(template, {",
      "  bookingCode: appointment.code,",
      "  purposeName: purpose.name,",
      "  date: formatDate(appointment.date),",
      "  hostName: host.name,",
      "});",
      "",
      "await lineClient.pushMessage(visitor.lineUserId, {",
      "  type: 'flex',",
      "  altText: `นัดหมาย ${appointment.code} ยืนยันแล้ว`,",
      "  contents: flexMsg,",
      "});",
    ],
  },
  {
    id: "visitor-approval-result",
    name: "แจ้งผลอนุมัติ",
    nameEn: "Approval Result Notification",
    description: "เจ้าหน้าที่อนุมัติ/ปฏิเสธ → ระบบส่ง Flex Message แจ้ง visitor ทาง LINE → ถ้าอนุมัติ = แสดง QR Code สำหรับ check-in ที่ kiosk",
    userType: "visitor",
    order: 6,
    triggers: ["Officer approves/rejects via LINE or Web", "PATCH /api/appointments/:id/status"],
    nextStates: ["visitor-reminder", "visitor-checkin-kiosk", "visitor-auto-cancelled"],
    relatedChannels: ["line", "web", "kiosk"],
    roles: ["visitor", "officer", "supervisor"],
    dbTables: ["appointments", "notification_logs", "approver_groups"],
    apiEndpoints: ["PATCH /api/appointments/:id/status", "POST /api/line/push-message"],
  },
  {
    id: "visitor-auto-cancelled",
    name: "ยกเลิกอัตโนมัติ (หมดเวลาอนุมัติ)",
    nameEn: "Auto-Cancelled (Approval Timeout)",
    description: "นัดหมายไม่ได้รับการอนุมัติภายในเวลาที่กำหนด (เช่น 24 ชม. หรือก่อนวันนัด) → ระบบยกเลิกอัตโนมัติ + ส่ง Flex Message แจ้ง visitor พร้อมปุ่มจองใหม่",
    userType: "visitor",
    order: 6.5,
    triggers: [
      "Scheduled cron job ตรวจสอบ appointments ที่ status='pending' เกินเวลา",
      "approval_timeout_hours (ค่าจาก settings เช่น 24 ชม.)",
      "หรือ ถ้าวันนัดหมายผ่านไปแล้วยังไม่อนุมัติ → ยกเลิกอัตโนมัติ",
    ],
    nextStates: ["visitor-booking"],
    relatedChannels: ["line", "web"],
    roles: ["visitor"],
    dbTables: ["appointments", "notification_logs", "notification_templates", "system_settings"],
    apiEndpoints: ["PATCH /api/appointments/:id/status", "POST /api/line/push-message", "GET /api/appointments/pending-expired"],
  },
  {
    id: "visitor-reminder",
    name: "แจ้งเตือนล่วงหน้า",
    nameEn: "Appointment Reminder",
    description: "ระบบส่ง Push Message เตือนผู้มาติดต่อ 1 วันก่อน + เช้าวันนัด → แสดง QR Code + สถานที่ + เวลา",
    userType: "visitor",
    order: 7,
    triggers: ["Scheduled cron job (T-1 day, T-2 hours)", "notification_schedule trigger"],
    nextStates: ["visitor-checkin-kiosk"],
    relatedChannels: ["line"],
    roles: ["visitor"],
    dbTables: ["appointments", "notification_logs", "notification_templates"],
    apiEndpoints: ["POST /api/line/push-message", "GET /api/appointments/upcoming"],
  },
  {
    id: "visitor-checkin-kiosk",
    name: "Check-in ที่ Kiosk/Counter",
    nameEn: "Check-in at Kiosk or Counter",
    description: "ผู้มาติดต่อสแกน QR ที่ kiosk → ยืนยันตัวตน → ถ่ายรูป → ระบบสร้าง visit_entry record + ส่ง Flex Message แจ้งทั้ง visitor และ host officer",
    userType: "visitor",
    order: 8,
    triggers: ["QR scanned at kiosk", "ID verified at counter", "POST /api/kiosk/checkin"],
    nextStates: ["visitor-wifi-credentials", "visitor-slip-line"],
    relatedChannels: ["kiosk", "counter", "line"],
    roles: ["visitor", "officer", "security"],
    dbTables: ["visit_entries", "appointments", "notification_logs"],
    apiEndpoints: ["POST /api/kiosk/checkin", "POST /api/counter/checkin", "POST /api/line/push-message"],
  },
  {
    id: "visitor-wifi-credentials",
    name: "ส่ง WiFi ทาง LINE",
    nameEn: "WiFi Credentials via LINE",
    description: "ถ้าวัตถุประสงค์มี offerWifi=true และผู้ใช้ผูก LINE → ส่ง Flex Message พร้อม SSID + Password + ระยะเวลาใช้งาน",
    userType: "visitor",
    order: 9,
    triggers: ["Check-in success + purpose.offerWifi=true + user.lineLinked=true"],
    nextStates: ["visitor-slip-line"],
    relatedChannels: ["line", "kiosk", "counter"],
    roles: ["visitor"],
    dbTables: ["visit_entries", "wifi_sessions", "visit_purpose_department_rules"],
    apiEndpoints: ["POST /api/kiosk/wifi/accept", "POST /api/line/push-message"],
  },
  {
    id: "visitor-slip-line",
    name: "ส่งใบ Slip ทาง LINE",
    nameEn: "Visit Slip via LINE",
    description: "แทนการพิมพ์ thermal slip → ส่ง Flex Message แสดงข้อมูล slip + QR Code สำหรับ check-out → kiosk ถามก่อนว่า 'ส่งทาง LINE' หรือ 'พิมพ์'",
    userType: "visitor",
    order: 10,
    triggers: ["User selects 'ส่งทาง LINE' at kiosk SUCCESS screen", "lineLinked=true"],
    nextStates: ["visitor-checkout"],
    relatedChannels: ["line", "kiosk"],
    roles: ["visitor"],
    dbTables: ["visit_entries", "visit_slips"],
    apiEndpoints: ["POST /api/line/push-message", "POST /api/kiosk/slip/print"],
  },
  {
    id: "visitor-checkout",
    name: "Check-out / ขอบคุณ",
    nameEn: "Check-out & Thank You",
    description: "เมื่อ visitor check-out (สแกน QR ที่ gate หรือ auto-checkout เมื่อหมดเวลา) → ส่ง Push Message ขอบคุณ + สรุปเวลาเข้า-ออก",
    userType: "visitor",
    order: 11,
    triggers: ["QR scanned at exit gate", "Auto-checkout scheduled job", "PATCH /api/entries/:id/checkout"],
    nextStates: [],
    relatedChannels: ["line", "kiosk", "counter"],
    roles: ["visitor", "security"],
    dbTables: ["visit_entries", "notification_logs"],
    apiEndpoints: ["PATCH /api/entries/:id/checkout", "POST /api/line/push-message"],
  },

  // ─── Officer Flow ───
  {
    id: "officer-register",
    name: "ลงทะเบียน Officer (LIFF)",
    nameEn: "Officer Registration via LIFF",
    description: "เปิด LIFF App → เลือก 'พนักงาน' → ป้อนรหัสพนักงาน/เลขบัตร → ระบบ lookup จากฐานข้อมูลบุคลากร → ยืนยัน + ผูก LINE → เปลี่ยน Rich Menu เป็น Officer Menu",
    userType: "officer",
    order: 12,
    triggers: ["User taps 'Registration Now' on Rich Menu", "LIFF app opened → selects Officer"],
    nextStates: ["officer-registered"],
    relatedChannels: ["line"],
    roles: ["officer", "supervisor", "admin"],
    dbTables: ["user_accounts", "staff", "line_oa_config"],
    apiEndpoints: ["POST /api/auth/register", "GET /api/staff/lookup", "POST /api/users/me/line/link", "POST /api/line/richmenu/assign"],
  },
  {
    id: "officer-registered",
    name: "ลงทะเบียน Officer สำเร็จ",
    nameEn: "Officer Registration Complete",
    description: "ส่ง Flex Message ยืนยันการผูก LINE → แสดง Rich Menu สำหรับ Officer: ข้อมูลส่วนตัว, ดูคำขอ",
    userType: "officer",
    order: 13,
    triggers: ["Staff registration + LINE link success"],
    nextStates: ["officer-new-request"],
    relatedChannels: ["line"],
    roles: ["officer", "supervisor"],
    dbTables: ["user_accounts", "staff"],
    apiEndpoints: ["POST /api/line/push-message"],
  },
  {
    id: "officer-new-request",
    name: "แจ้งคำขอใหม่",
    nameEn: "New Request Notification",
    description: "เมื่อ visitor สร้างนัดหมายที่ requireApproval=true → ระบบหา approverGroupId จาก visit_purpose_department_rules → ส่ง Flex Message ไปยังสมาชิก ApproverGroup ที่ receiveNotification=true + notifyChannels มี 'line' → แสดงรายละเอียด visitor + วัตถุประสงค์ + แผนก + ปุ่มอนุมัติ/ปฏิเสธ (postback: action=approve&id=xxx)",
    userType: "officer",
    order: 14,
    triggers: ["POST /api/appointments creates new appointment with requireApproval=true", "sendApprovalNotification() in notification-service.ts"],
    nextStates: ["officer-approve-action"],
    relatedChannels: ["line", "web"],
    roles: ["officer", "supervisor", "admin"],
    dbTables: ["appointments", "approver_groups", "approver_group_members", "approver_group_notify_channels", "visit_purpose_department_rules", "notification_logs"],
    apiEndpoints: ["POST /api/line/push-message", "GET /api/appointments/:id", "GET /api/approvals"],
  },
  {
    id: "officer-approve-action",
    name: "อนุมัติ / ปฏิเสธ",
    nameEn: "Approve or Reject Action",
    description: "Officer กดปุ่ม 'อนุมัติ' หรือ 'ปฏิเสธ' บน Flex Message (Postback) หรือบนหน้า /web/approvals → Webhook handler เรียก POST /api/appointments/:id/approve หรือ /reject → ระบบตรวจ ApproverGroupMember.canApprove=true → อัปเดตสถานะ + สร้าง StatusLog → ส่ง Flex แจ้งผล visitor ทาง LINE",
    userType: "officer",
    order: 15,
    triggers: ["Officer taps approve/reject on Flex Message (LINE Postback)", "Officer clicks approve/reject on /web/approvals"],
    nextStates: ["officer-checkin-alert"],
    relatedChannels: ["line", "web"],
    roles: ["officer", "supervisor", "admin"],
    dbTables: ["appointments", "appointment_status_logs", "approver_group_members", "notification_logs"],
    apiEndpoints: ["POST /api/appointments/:id/approve", "POST /api/appointments/:id/reject", "POST /api/line/push-message"],
  },
  {
    id: "officer-checkin-alert",
    name: "แจ้งเตือน Visitor Check-in",
    nameEn: "Visitor Check-in Alert",
    description: "เมื่อ visitor check-in ที่ kiosk/counter → POST /api/entries สร้าง visit_entry → sendCheckinNotification() ส่ง Push Message แจ้ง host officer + creator (ถ้า notifyOnCheckin=true) → แสดงชื่อ visitor, เวลา check-in, สถานที่",
    userType: "officer",
    order: 16,
    triggers: ["POST /api/entries success → sendCheckinNotification() in notification-service.ts"],
    nextStates: ["officer-overstay-alert"],
    relatedChannels: ["line", "kiosk", "counter"],
    roles: ["officer"],
    dbTables: ["visit_entries", "notification_logs"],
    apiEndpoints: ["POST /api/line/push-message"],
  },
  {
    id: "officer-overstay-alert",
    name: "แจ้งเตือน Overstay",
    nameEn: "Overstay Alert",
    description: "ถ้า visitor อยู่เกินเวลาที่นัด → ระบบส่ง Push Message แจ้ง host officer + security → แสดงข้อมูล visitor + เวลาที่เกิน",
    userType: "officer",
    order: 17,
    triggers: ["Scheduled cron job checks overdue check-ins", "check_in.timeEnd < NOW()"],
    nextStates: [],
    relatedChannels: ["line", "web"],
    roles: ["officer", "security"],
    dbTables: ["visit_entries", "notification_logs"],
    apiEndpoints: ["POST /api/line/push-message", "GET /api/entries/overstay"],
  },
];

// ===== LINE-SPECIFIC API ENDPOINTS =====

export const lineApiEndpoints: LineApiEndpoint[] = [
  // ─── Webhook ───
  {
    method: "POST",
    path: "/api/line/webhook",
    summary: "รับ Webhook Events จาก LINE Platform",
    summaryEn: "Receive LINE Webhook Events",
    auth: "webhook",
    requestBody: [
      { name: "events", type: "LineEvent[]", required: true, description: "Array of LINE events (follow, message, postback)" },
      { name: "destination", type: "string", required: true, description: "LINE OA user ID ปลายทาง" },
    ],
    responseExample: `{ "status": "ok" }`,
    stateIds: ["new-friend", "officer-approve-action"],
    notes: [
      "Verify X-Line-Signature header ด้วย channel_secret",
      "Event types: follow, unfollow, message, postback",
      "Follow event → ส่งข้อความต้อนรับ + assign Rich Menu (new-friend)",
      "Postback event → handle approve/reject action",
    ],
  },
  // ─── Push Message ───
  {
    method: "POST",
    path: "/api/line/push-message",
    summary: "ส่ง Push Message / Flex Message ไปยังผู้ใช้",
    summaryEn: "Send Push/Flex Message to User",
    auth: "admin",
    requestBody: [
      { name: "to", type: "string", required: true, description: "LINE user ID ปลายทาง" },
      { name: "template_id", type: "string", required: true, description: "รหัส notification template" },
      { name: "variables", type: "object", required: false, description: "ตัวแปรแทนที่ใน template (e.g. visitor_name, date)" },
      { name: "flex_message", type: "object", required: false, description: "LINE Flex Message JSON (ถ้าไม่ใช้ template)" },
    ],
    responseExample: `{
  "status": "sent",
  "message_id": "msg-20260330-001",
  "sent_at": "2026-03-30T09:00:00Z",
  "recipient_line_id": "U1234567890"
}`,
    stateIds: ["visitor-registered", "visitor-booking-confirmed", "visitor-approval-result", "visitor-auto-cancelled", "visitor-reminder", "visitor-checkin-kiosk", "visitor-wifi-credentials", "visitor-slip-line", "visitor-checkout", "officer-registered", "officer-new-request", "officer-checkin-alert", "officer-overstay-alert"],
  },
  // ─── Rich Menu ───
  {
    method: "POST",
    path: "/api/line/richmenu/assign",
    summary: "กำหนด Rich Menu ให้ผู้ใช้ตามประเภท",
    summaryEn: "Assign Rich Menu by User Type",
    auth: "admin",
    requestBody: [
      { name: "line_user_id", type: "string", required: true, description: "LINE user ID" },
      { name: "menu_type", type: "string", required: true, description: "'new-friend' | 'visitor' | 'officer'" },
    ],
    responseExample: `{
  "status": "assigned",
  "rich_menu_id": "richmenu-abc123",
  "menu_type": "visitor",
  "assigned_at": "2026-03-30T09:00:00Z"
}`,
    stateIds: ["new-friend", "visitor-register", "officer-register"],
    notes: [
      "new-friend: แสดง 'Registration Now' + 'Help'",
      "visitor: แสดง 'ข้อมูลส่วนตัว' + 'บันทึกนัดหมาย' + 'ประวัติ'",
      "officer: แสดง 'ข้อมูลส่วนตัว' + 'คำขอ' + 'Bulletin'",
    ],
  },
  // ─── LIFF Registration ───
  {
    method: "POST",
    path: "/api/auth/register",
    summary: "ลงทะเบียนผู้ใช้ผ่าน LIFF (Visitor หรือ Officer)",
    summaryEn: "Register User via LIFF",
    auth: "public",
    requestBody: [
      { name: "user_type", type: "string", required: true, description: "'visitor' | 'staff'" },
      { name: "first_name", type: "string", required: true, description: "ชื่อ" },
      { name: "last_name", type: "string", required: true, description: "นามสกุล" },
      { name: "phone", type: "string", required: true, description: "เบอร์โทรศัพท์" },
      { name: "email", type: "string", required: false, description: "อีเมล" },
      { name: "company", type: "string", required: false, description: "บริษัท/หน่วยงาน (visitor only)" },
      { name: "employee_id", type: "string", required: false, description: "รหัสพนักงาน (staff only)" },
      { name: "national_id", type: "string", required: false, description: "เลขบัตรประชาชน (staff lookup)" },
      { name: "line_access_token", type: "string", required: true, description: "LIFF access token สำหรับผูก LINE" },
    ],
    responseExample: `{
  "status": "registered",
  "user": {
    "id": 42,
    "email": "puttipong@company.com",
    "user_type": "visitor",
    "first_name": "พุทธิพงษ์",
    "last_name": "คาดสนิท",
    "phone": "081-302-5678",
    "company": "บริษัท สยามเทค จำกัด",
    "line_user_id": "U1234567890",
    "line_display_name": "พุทธิพงษ์",
    "line_linked_at": "2026-03-30T09:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}`,
    stateIds: ["visitor-register", "officer-register"],
  },
  // ─── Create Appointment ───
  {
    method: "POST",
    path: "/api/appointments",
    summary: "สร้างนัดหมายใหม่ (จาก LINE LIFF หรือ Web)",
    summaryEn: "Create New Appointment",
    auth: "user",
    requestBody: [
      { name: "visit_purpose_id", type: "number", required: true, description: "รหัสวัตถุประสงค์" },
      { name: "host_staff_id", type: "number", required: true, description: "รหัสเจ้าหน้าที่ผู้รับพบ" },
      { name: "date", type: "string", required: true, description: "วันนัดหมาย (YYYY-MM-DD)" },
      { name: "time_start", type: "string", required: true, description: "เวลาเริ่ม (HH:mm)" },
      { name: "time_end", type: "string", required: true, description: "เวลาสิ้นสุด (HH:mm)" },
      { name: "companions", type: "number", required: false, description: "จำนวนผู้ติดตาม" },
      { name: "purpose_note", type: "string", required: false, description: "หมายเหตุวัตถุประสงค์" },
      { name: "equipment", type: "object[]", required: false, description: "รายการอุปกรณ์นำเข้า" },
      { name: "channel", type: "string", required: true, description: "'line' | 'web' | 'counter'" },
    ],
    responseExample: `{
  "status": "created",
  "appointment": {
    "id": 1042,
    "code": "eVMS-20260330-1042",
    "visit_purpose": "ติดต่อราชการ",
    "host": { "name": "สมชาย รักชาติ", "department": "สำนักนโยบายและยุทธศาสตร์" },
    "date": "2026-04-02",
    "time_start": "10:00",
    "time_end": "11:00",
    "status": "pending",
    "require_approval": true,
    "qr_code_data": "eVMS-20260402-1042",
    "created_at": "2026-03-30T09:15:00Z"
  },
  "notifications_sent": [
    { "to": "host_officer", "channel": "line", "template": "new-request" },
    { "to": "approver_group", "channel": "line", "template": "approval-needed" }
  ]
}`,
    stateIds: ["visitor-booking", "visitor-booking-confirmed"],
  },
  // ─── Approve / Reject ───
  {
    method: "PATCH",
    path: "/api/appointments/:id/status",
    summary: "อนุมัติ หรือ ปฏิเสธนัดหมาย",
    summaryEn: "Approve or Reject Appointment",
    auth: "user",
    requestBody: [
      { name: "status", type: "string", required: true, description: "'approved' | 'rejected'" },
      { name: "reject_reason", type: "string", required: false, description: "เหตุผลการปฏิเสธ (required if rejected)" },
      { name: "officer_note", type: "string", required: false, description: "หมายเหตุจากเจ้าหน้าที่" },
    ],
    responseExample: `{
  "status": "updated",
  "appointment": {
    "id": 1042,
    "status": "approved",
    "approved_at": "2026-03-30T10:30:00Z",
    "approved_by": { "id": 5, "name": "สมศรี รักษ์ดี" }
  },
  "notifications_sent": [
    { "to": "visitor", "channel": "line", "template": "approval-approved" }
  ]
}`,
    stateIds: ["officer-approve-action", "visitor-approval-result"],
  },
  // ─── Kiosk Check-in ───
  {
    method: "POST",
    path: "/api/kiosk/checkin",
    summary: "สร้าง visit_entry จาก Kiosk",
    summaryEn: "Create Check-in Record from Kiosk",
    auth: "admin",
    requestBody: [
      { name: "appointment_id", type: "number", required: false, description: "รหัสนัดหมาย (null = walk-in)" },
      { name: "visitor_id", type: "number", required: true, description: "รหัสผู้มาติดต่อ" },
      { name: "service_point_id", type: "number", required: true, description: "รหัส Kiosk/Counter" },
      { name: "id_method", type: "string", required: true, description: "'thai-id' | 'passport' | 'thaiid-app'" },
      { name: "face_photo", type: "string", required: false, description: "Base64 face photo" },
      { name: "wifi_accepted", type: "boolean", required: false, description: "ผู้ใช้ยอมรับ WiFi" },
      { name: "print_slip", type: "boolean", required: true, description: "true = พิมพ์, false = ส่งทาง LINE" },
    ],
    responseExample: `{
  "status": "checked-in",
  "entry": {
    "id": 5001,
    "entry_code": "eVMS-25690330-0099",
    "appointment_id": 1042,
    "slip_number": "eVMS-25690330-0099",
    "checkin_at": "2026-03-30T09:45:00Z",
    "wifi": { "ssid": "MOTS-Guest", "password": "mots2026", "valid_until": "2026-03-30T16:30:00Z" }
  },
  "slip": {
    "slip_number": "eVMS-25690330-0099",
    "visitor_name": "พุทธิพงษ์ คาดสนิท",
    "visit_purpose": "ติดต่อราชการ",
    "department": "สำนักนโยบายและยุทธศาสตร์",
    "access_zone": "ชั้น 4 อาคาร C",
    "time_in": "09:45",
    "time_out": "11:00",
    "qr_code_data": "eVMS-OFA-20260330-0099-A2B3C4"
  },
  "notifications_sent": [
    { "to": "host_officer", "channel": "line", "template": "visitor-checkin" },
    { "to": "visitor", "channel": "line", "template": "checkin-welcome" }
  ]
}`,
    stateIds: ["visitor-checkin-kiosk", "officer-checkin-alert"],
  },
  // ─── WiFi Accept ───
  {
    method: "POST",
    path: "/api/kiosk/wifi/accept",
    summary: "ผู้ใช้ยอมรับ WiFi → ส่ง credentials ทาง LINE",
    summaryEn: "Accept WiFi Offer and Send Credentials",
    auth: "admin",
    requestBody: [
      { name: "entry_id", type: "number", required: true, description: "รหัส check-in" },
      { name: "send_via_line", type: "boolean", required: false, description: "ส่ง credentials ทาง LINE ด้วย" },
    ],
    responseExample: `{
  "wifi": {
    "ssid": "MOTS-Guest",
    "password": "mots2026",
    "valid_until": "2026-03-30T16:30:00Z"
  },
  "line_sent": true
}`,
    stateIds: ["visitor-wifi-credentials"],
  },
  // ─── Check-out ───
  {
    method: "PATCH",
    path: "/api/entries/:id/checkout",
    summary: "Check-out ผู้มาติดต่อ (สแกน QR หรือ auto)",
    summaryEn: "Check-out Visitor",
    auth: "admin",
    requestBody: [
      { name: "checkout_method", type: "string", required: true, description: "'qr-scan' | 'manual' | 'auto'" },
      { name: "checkout_by", type: "number", required: false, description: "รหัสเจ้าหน้าที่ (manual only)" },
    ],
    responseExample: `{
  "status": "checked-out",
  "entry": {
    "id": 5001,
    "checkout_at": "2026-03-30T11:05:00Z",
    "duration_minutes": 80,
    "checkout_method": "qr-scan"
  },
  "notifications_sent": [
    { "to": "visitor", "channel": "line", "template": "checkout-thankyou" }
  ]
}`,
    stateIds: ["visitor-checkout"],
  },
  // ─── Overstay Check ───
  {
    method: "GET",
    path: "/api/entries/overstay",
    summary: "ดึงรายการ visitor ที่เกินเวลานัด",
    summaryEn: "List Overstaying Visitors",
    auth: "admin",
    responseExample: `{
  "data": [
    {
      "entry_id": 5001,
      "visitor_name": "สมศักดิ์ จริงใจ",
      "host_name": "สมศรี รักษ์ดี",
      "expected_out": "11:00",
      "overstay_minutes": 45,
      "location": "ชั้น 4 อาคาร C"
    }
  ],
  "total": 1
}`,
    stateIds: ["officer-overstay-alert"],
  },
  // ─── Pending Expired (Auto-cancel) ───
  {
    method: "GET",
    path: "/api/appointments/pending-expired",
    summary: "ดึงรายการนัดหมายที่หมดเวลาอนุมัติ (pending เกินกำหนด)",
    summaryEn: "List Pending Appointments Past Approval Deadline",
    auth: "admin",
    responseExample: `{
  "data": [
    {
      "appointment_id": 1042,
      "code": "eVMS-20260402-1042",
      "visitor_name": "พุทธิพงษ์ คาดสนิท",
      "host_name": "สมชาย รักชาติ",
      "date": "2026-04-02",
      "created_at": "2026-03-30T09:15:00Z",
      "pending_hours": 48,
      "approval_timeout_hours": 24,
      "reason": "exceeded_approval_timeout"
    }
  ],
  "auto_cancelled": 1
}`,
    stateIds: ["visitor-auto-cancelled"],
    notes: [
      "Cron job เรียกทุก 1 ชม. เพื่อตรวจสอบ pending appointments",
      "เงื่อนไขยกเลิก: pending_hours > approval_timeout_hours OR date < TODAY",
      "approval_timeout_hours กำหนดใน system_settings (default: 24 ชม.)",
      "เมื่อยกเลิก → PATCH /api/appointments/:id/status { status: 'auto-cancelled' }",
      "ส่ง LINE notification แจ้ง visitor + host officer",
    ],
  },
];

// ===== LINE-SPECIFIC DB TABLES =====

export const lineDbTables: LineDbTable[] = [
  {
    name: "line_webhook_events",
    comment: "Log ทุก Webhook Event จาก LINE Platform",
    columns: [
      { name: "id", type: "BIGSERIAL", nullable: false, comment: "PK", isPrimaryKey: true },
      { name: "event_type", type: "VARCHAR(30)", nullable: false, comment: "follow | unfollow | message | postback" },
      { name: "line_user_id", type: "VARCHAR(50)", nullable: false, comment: "LINE User ID ผู้ส่ง" },
      { name: "reply_token", type: "VARCHAR(100)", nullable: true, comment: "Reply Token (ใช้ได้ 1 ครั้ง 30 วิ)" },
      { name: "event_data", type: "JSONB", nullable: true, comment: "Raw event JSON จาก LINE" },
      { name: "processed", type: "BOOLEAN", nullable: false, comment: "ประมวลผลแล้วหรือยัง" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "เวลาที่รับ event" },
    ],
    stateIds: ["new-friend", "officer-approve-action"],
  },
  {
    name: "notification_logs",
    comment: "Log การส่ง Notification ทุกช่องทาง (LINE, Email, SMS)",
    columns: [
      { name: "id", type: "BIGSERIAL", nullable: false, comment: "PK", isPrimaryKey: true },
      { name: "channel", type: "ENUM('line','email','sms')", nullable: false, comment: "ช่องทางการส่ง" },
      { name: "template_id", type: "INT", nullable: true, comment: "รหัส template", isForeignKey: true, references: "notification_templates.id" },
      { name: "recipient_user_id", type: "INT", nullable: false, comment: "ผู้รับ", isForeignKey: true, references: "user_accounts.id" },
      { name: "recipient_line_id", type: "VARCHAR(50)", nullable: true, comment: "LINE user ID ปลายทาง" },
      { name: "appointment_id", type: "INT", nullable: true, comment: "รหัสนัดหมายที่เกี่ยวข้อง", isForeignKey: true, references: "appointments.id" },
      { name: "entry_id", type: "INT", nullable: true, comment: "รหัส check-in ที่เกี่ยวข้อง", isForeignKey: true, references: "visit_entries.id" },
      { name: "subject", type: "VARCHAR(200)", nullable: true, comment: "หัวข้อ (email/sms)" },
      { name: "body_snapshot", type: "TEXT", nullable: true, comment: "เนื้อหาที่ส่ง (snapshot)" },
      { name: "status", type: "ENUM('sent','failed','queued')", nullable: false, comment: "สถานะการส่ง" },
      { name: "error_message", type: "TEXT", nullable: true, comment: "ข้อความ error (ถ้า failed)" },
      { name: "sent_at", type: "TIMESTAMP", nullable: true, comment: "เวลาที่ส่งสำเร็จ" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "เวลาที่สร้าง record" },
    ],
    stateIds: ["visitor-booking-confirmed", "visitor-approval-result", "visitor-auto-cancelled", "visitor-reminder", "visitor-checkin-kiosk", "visitor-wifi-credentials", "visitor-slip-line", "visitor-checkout", "officer-new-request", "officer-checkin-alert", "officer-overstay-alert"],
  },
  {
    name: "notification_templates",
    comment: "แม่แบบข้อความแจ้งเตือน สำหรับแต่ละ Event",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, comment: "PK", isPrimaryKey: true },
      { name: "trigger_name", type: "VARCHAR(50)", nullable: false, comment: "ชื่อ event trigger (e.g. checkin-welcome, approval-approved)" },
      { name: "channel", type: "ENUM('line','email','sms')", nullable: false, comment: "ช่องทาง" },
      { name: "subject_th", type: "VARCHAR(200)", nullable: true, comment: "หัวข้อภาษาไทย" },
      { name: "body_th", type: "TEXT", nullable: false, comment: "เนื้อหาภาษาไทย (support {{variables}})" },
      { name: "body_en", type: "TEXT", nullable: true, comment: "เนื้อหาภาษาอังกฤษ" },
      { name: "flex_json", type: "JSONB", nullable: true, comment: "LINE Flex Message JSON template" },
      { name: "variables", type: "TEXT[]", nullable: true, comment: "รายการ variables ที่ใช้ได้ (e.g. visitor_name, date)" },
      { name: "is_active", type: "BOOLEAN", nullable: false, comment: "เปิด/ปิดใช้งาน" },
      { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "แก้ไขล่าสุด" },
    ],
    stateIds: ["visitor-registered", "visitor-booking-confirmed", "visitor-approval-result", "visitor-auto-cancelled", "visitor-reminder", "visitor-checkin-kiosk", "visitor-wifi-credentials", "visitor-slip-line", "visitor-checkout", "officer-registered", "officer-new-request", "officer-checkin-alert", "officer-overstay-alert"],
  },
  {
    name: "wifi_sessions",
    comment: "รายการ WiFi ที่แจกให้ visitor",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, comment: "PK", isPrimaryKey: true },
      { name: "entry_id", type: "INT", nullable: false, comment: "รหัส check-in", isForeignKey: true, references: "visit_entries.id" },
      { name: "ssid", type: "VARCHAR(50)", nullable: false, comment: "ชื่อ WiFi" },
      { name: "password", type: "VARCHAR(50)", nullable: false, comment: "รหัส WiFi" },
      { name: "valid_from", type: "TIMESTAMP", nullable: false, comment: "เริ่มใช้งาน" },
      { name: "valid_until", type: "TIMESTAMP", nullable: false, comment: "หมดอายุ" },
      { name: "sent_via_line", type: "BOOLEAN", nullable: false, comment: "ส่งทาง LINE แล้วหรือไม่" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "สร้างเมื่อ" },
    ],
    stateIds: ["visitor-wifi-credentials"],
  },
  {
    name: "visit_slips",
    comment: "ข้อมูล Visit Slip ที่ออก (ทั้งพิมพ์และส่งทาง LINE)",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, comment: "PK", isPrimaryKey: true },
      { name: "slip_number", type: "VARCHAR(30)", nullable: false, comment: "เลขที่ slip (e.g. eVMS-25690330-0099)" },
      { name: "entry_id", type: "INT", nullable: false, comment: "รหัส check-in", isForeignKey: true, references: "visit_entries.id" },
      { name: "delivery_method", type: "ENUM('print','line','both')", nullable: false, comment: "วิธีส่ง slip" },
      { name: "printed_at", type: "TIMESTAMP", nullable: true, comment: "เวลาที่พิมพ์" },
      { name: "line_sent_at", type: "TIMESTAMP", nullable: true, comment: "เวลาที่ส่งทาง LINE" },
      { name: "qr_code_data", type: "VARCHAR(100)", nullable: false, comment: "QR code สำหรับ check-out" },
      { name: "slip_data", type: "JSONB", nullable: false, comment: "ข้อมูล slip ทั้งหมด (JSON)" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "สร้างเมื่อ" },
    ],
    stateIds: ["visitor-slip-line", "visitor-checkin-kiosk"],
  },
];

// ===== FLOW SCENARIO DEFINITIONS =====

export interface FlowScenario {
  id: string;
  name: string;
  nameEn: string;
  userType: LineUserType;
  description: string;
  stateSequence: LineFlowStateId[];
}

export const flowScenarios: FlowScenario[] = [
  {
    id: "visitor-full",
    name: "Visitor: ลงทะเบียน → นัดหมาย → Check-in → Check-out (Full Flow)",
    nameEn: "Visitor Full Journey",
    userType: "visitor",
    description: "Flow ครบทุกขั้นตอน: เพิ่มเพื่อน → ลงทะเบียน → จอง → อนุมัติ → ยกเลิกอัตโนมัติ → เตือน → Check-in (Kiosk) → WiFi → Slip ทาง LINE → Check-out",
    stateSequence: [
      "new-friend",
      "visitor-register",
      "visitor-registered",
      "visitor-booking",
      "visitor-booking-confirmed",
      "visitor-approval-result",
      "visitor-auto-cancelled",
      "visitor-reminder",
      "visitor-checkin-kiosk",
      "visitor-wifi-credentials",
      "visitor-slip-line",
      "visitor-checkout",
    ],
  },
  {
    id: "officer-full",
    name: "Officer: ลงทะเบียน → รับคำขอ → อนุมัติ → แจ้งเตือน (Full Flow)",
    nameEn: "Officer Full Journey",
    userType: "officer",
    description: "Flow ครบทุกขั้นตอน: เพิ่มเพื่อน → ลงทะเบียน (Lookup) → รับแจ้งคำขอ → อนุมัติ → แจ้ง Check-in → แจ้ง Overstay",
    stateSequence: [
      "new-friend",
      "officer-register",
      "officer-registered",
      "officer-new-request",
      "officer-approve-action",
      "officer-checkin-alert",
      "officer-overstay-alert",
    ],
  },
];

// ===== HELPER: Get state info =====
export function getFlowState(id: LineFlowStateId): FlowStateInfo | undefined {
  return lineFlowStates.find((s) => s.id === id);
}

export function getApiEndpointsForState(stateId: LineFlowStateId): LineApiEndpoint[] {
  return lineApiEndpoints.filter((e) => e.stateIds.includes(stateId));
}

export function getDbTablesForState(stateId: LineFlowStateId): LineDbTable[] {
  return lineDbTables.filter((t) => t.stateIds.includes(stateId));
}
