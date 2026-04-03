// ════════════════════════════════════════════════════
// LINE Flex Message Template Configuration Data
// สำหรับตั้งค่า Flex Message แต่ละ state ของ LINE OA flow
// ════════════════════════════════════════════════════

import type { LineFlowStateId } from "./line-oa-flow-data";

// ===== TYPES =====

export type FlexTemplateType = "flex" | "text" | "liff";

export type HeaderVariant =
  | "standard"         // CardHeader with eVMES logo
  | "reminder"         // amber bg + Bell icon
  | "checkin"          // blue bg + UserCheck icon
  | "wifi"             // cyan bg + Wifi icon
  | "slip"             // primary bg + Shield icon
  | "checkout"         // green bg + Check icon
  | "auto-cancelled"   // orange bg + XCircle icon
  | "officer-request"  // amber bg + CalendarCheck icon
  | "officer-approved" // green bg + Check icon
  | "officer-checkin"  // blue bg + UserCheck icon
  | "officer-overstay"; // red bg + AlertTriangle icon

export type HeaderColor = "primary" | "green" | "orange" | "red" | "blue";
export type ButtonVariant = "green" | "outline" | "primary" | "red";

export interface FlexTemplateRow {
  id: string;
  label: string;
  variable: string;       // {{variable}} name
  previewValue: string;   // mock value for preview
  enabled: boolean;
  sortOrder: number;
}

export interface FlexTemplateButton {
  id: string;
  label: string;
  variant: ButtonVariant;
  enabled: boolean;
  sortOrder: number;
}

export interface FlexTemplateInfoBox {
  text: string;
  color: "green" | "orange" | "blue" | "red" | "gray";
  enabled: boolean;
}

export interface FlexTemplateConfig {
  stateId: LineFlowStateId;
  name: string;
  nameEn: string;
  type: FlexTemplateType;
  isActive: boolean;

  // Header
  headerTitle: string;
  headerSubtitle?: string;
  headerColor: HeaderColor;
  headerVariant: HeaderVariant;

  // Status Badge
  showStatusBadge: boolean;
  statusBadgeText?: string;
  statusBadgeType?: "pending" | "approved" | "rejected" | "confirmed" | "cancelled" | "expired" | "checked-in" | "checked-out" | "auto-checkout" | "overstay";

  // Body Rows
  rows: FlexTemplateRow[];

  // Buttons
  buttons: FlexTemplateButton[];

  // Info Box
  infoBox?: FlexTemplateInfoBox;

  // QR Code
  showQrCode: boolean;
  qrLabel?: string;

  // Variables available for this template
  availableVariables: string[];
}

// ===== HEADER VARIANT CONFIG =====

export const headerVariantConfig: Record<HeaderVariant, { bgClass: string; borderClass: string; textClass: string; icon: string; iconColor: string }> = {
  standard:          { bgClass: "bg-white",     borderClass: "border-gray-100", textClass: "text-primary",    icon: "Shield",         iconColor: "text-primary" },
  reminder:          { bgClass: "bg-amber-50",  borderClass: "border-amber-100", textClass: "text-amber-700", icon: "Bell",           iconColor: "text-amber-500" },
  checkin:           { bgClass: "bg-blue-50",   borderClass: "border-blue-100",  textClass: "text-blue-700",  icon: "UserCheck",      iconColor: "text-blue-600" },
  wifi:              { bgClass: "bg-cyan-50",   borderClass: "border-cyan-100",  textClass: "text-cyan-700",  icon: "Wifi",           iconColor: "text-cyan-600" },
  slip:              { bgClass: "bg-primary-50", borderClass: "border-primary-100", textClass: "text-primary", icon: "Shield",        iconColor: "text-primary" },
  checkout:          { bgClass: "bg-green-50",  borderClass: "border-green-100", textClass: "text-green-700", icon: "Check",          iconColor: "text-green-600" },
  "auto-cancelled":  { bgClass: "bg-orange-50", borderClass: "border-orange-100", textClass: "text-orange-700", icon: "XCircle",     iconColor: "text-orange-600" },
  "officer-request": { bgClass: "bg-amber-50",  borderClass: "border-amber-100", textClass: "text-amber-700", icon: "CalendarCheck", iconColor: "text-amber-600" },
  "officer-approved":{ bgClass: "bg-green-50",  borderClass: "border-green-100", textClass: "text-green-700", icon: "Check",          iconColor: "text-green-600" },
  "officer-checkin": { bgClass: "bg-blue-50",   borderClass: "border-blue-100",  textClass: "text-blue-700",  icon: "UserCheck",      iconColor: "text-blue-600" },
  "officer-overstay":{ bgClass: "bg-red-50",    borderClass: "border-red-100",   textClass: "text-red-700",   icon: "AlertTriangle",  iconColor: "text-red-600" },
};

// ===== DEFAULT TEMPLATES FOR ALL 17 STATES =====

export const defaultFlexTemplates: FlexTemplateConfig[] = [
  // ─── new-friend (text only) ───
  {
    stateId: "new-friend",
    name: "ข้อความต้อนรับ",
    nameEn: "Welcome Message",
    type: "text",
    isActive: true,
    headerTitle: "",
    headerColor: "primary",
    headerVariant: "standard",
    showStatusBadge: false,
    rows: [],
    buttons: [],
    showQrCode: false,
    availableVariables: [],
  },

  // ─── visitor-register (LIFF) ───
  {
    stateId: "visitor-register",
    name: "ลงทะเบียน Visitor",
    nameEn: "Visitor Registration (LIFF)",
    type: "liff",
    isActive: true,
    headerTitle: "",
    headerColor: "primary",
    headerVariant: "standard",
    showStatusBadge: false,
    rows: [],
    buttons: [],
    showQrCode: false,
    availableVariables: [],
  },

  // ─── visitor-registered ───
  {
    stateId: "visitor-registered",
    name: "ลงทะเบียนสำเร็จ",
    nameEn: "Registration Complete",
    type: "flex",
    isActive: true,
    headerTitle: "Registration Complete",
    headerColor: "green",
    headerVariant: "standard",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "ประเภท", variable: "userType", previewValue: "Visitor", enabled: true, sortOrder: 1 },
      { id: "r2", label: "วันที่", variable: "date", previewValue: "30 มี.ค. 2569, 09:05 น.", enabled: true, sortOrder: 2 },
      { id: "r3", label: "ชื่อ", variable: "visitorName", previewValue: "พุทธิพงษ์ คาดสนิท", enabled: true, sortOrder: 3 },
      { id: "r4", label: "บริษัท", variable: "company", previewValue: "บริษัท สยามเทค จำกัด", enabled: true, sortOrder: 4 },
      { id: "r5", label: "โทร.", variable: "phone", previewValue: "081-302-5678", enabled: true, sortOrder: 5 },
    ],
    buttons: [
      { id: "b1", label: "สร้างรายการนัดหมาย", variant: "green", enabled: true, sortOrder: 1 },
      { id: "b2", label: "ข้อมูลส่วนบุคคล", variant: "outline", enabled: true, sortOrder: 2 },
    ],
    showQrCode: false,
    availableVariables: ["userType", "date", "visitorName", "company", "phone"],
  },

  // ─── visitor-booking (LIFF) ───
  {
    stateId: "visitor-booking",
    name: "จองนัดหมาย",
    nameEn: "Book Appointment (LIFF)",
    type: "liff",
    isActive: true,
    headerTitle: "",
    headerColor: "primary",
    headerVariant: "standard",
    showStatusBadge: false,
    rows: [],
    buttons: [],
    showQrCode: false,
    availableVariables: [],
  },

  // ─── visitor-booking-confirmed ───
  {
    stateId: "visitor-booking-confirmed",
    name: "ยืนยันการจอง",
    nameEn: "Booking Confirmed",
    type: "flex",
    isActive: true,
    headerTitle: "นัดหมายใหม่",
    headerSubtitle: "Booking #{{bookingCode}}",
    headerColor: "primary",
    headerVariant: "standard",
    showStatusBadge: true,
    statusBadgeText: "รอดำเนินการ",
    statusBadgeType: "pending",
    rows: [
      { id: "r1", label: "วัตถุประสงค์", variable: "purposeName", previewValue: "🏛️ ติดต่อราชการ", enabled: true, sortOrder: 1 },
      { id: "r2", label: "วันที่", variable: "date", previewValue: "2 เม.ย. 2569", enabled: true, sortOrder: 2 },
      { id: "r3", label: "เวลา", variable: "timeSlot", previewValue: "10:00 - 11:00 น.", enabled: true, sortOrder: 3 },
      { id: "r4", label: "ผู้รับพบ", variable: "hostName", previewValue: "คุณสมชาย รักชาติ", enabled: true, sortOrder: 4 },
      { id: "r5", label: "สถานที่", variable: "location", previewValue: "สำนักนโยบายฯ อาคาร C ชั้น 4", enabled: true, sortOrder: 5 },
    ],
    buttons: [
      { id: "b1", label: "ดูรายละเอียด", variant: "primary", enabled: true, sortOrder: 1 },
    ],
    showQrCode: true,
    qrLabel: "QR Check-in",
    availableVariables: ["bookingCode", "purposeName", "date", "timeSlot", "hostName", "location"],
  },

  // ─── visitor-approval-result ───
  {
    stateId: "visitor-approval-result",
    name: "แจ้งผลอนุมัติ",
    nameEn: "Approval Approved",
    type: "flex",
    isActive: true,
    headerTitle: "นัดหมายอนุมัติแล้ว ✅",
    headerColor: "green",
    headerVariant: "standard",
    showStatusBadge: true,
    statusBadgeText: "อนุมัติแล้ว",
    statusBadgeType: "approved",
    rows: [
      { id: "r1", label: "Booking", variable: "bookingCode", previewValue: "#eVMS-20260402-1042", enabled: true, sortOrder: 1 },
      { id: "r2", label: "วันที่", variable: "dateTime", previewValue: "2 เม.ย. 2569 | 10:00 - 11:00 น.", enabled: true, sortOrder: 2 },
      { id: "r3", label: "ผู้อนุมัติ", variable: "approverName", previewValue: "คุณสมศรี รักษ์ดี", enabled: true, sortOrder: 3 },
      { id: "r4", label: "อนุมัติเมื่อ", variable: "approvedAt", previewValue: "30 มี.ค. 2569 10:30 น.", enabled: true, sortOrder: 4 },
    ],
    buttons: [
      { id: "b1", label: "ดู QR Code", variant: "green", enabled: true, sortOrder: 1 },
    ],
    infoBox: { text: "กรุณาสแกน QR Code ที่ Kiosk หรือ Counter ในวันนัดหมาย", color: "green", enabled: true },
    showQrCode: false,
    availableVariables: ["bookingCode", "dateTime", "approverName", "approvedAt"],
  },

  // ─── visitor-auto-cancelled ───
  {
    stateId: "visitor-auto-cancelled",
    name: "ยกเลิกอัตโนมัติ",
    nameEn: "Auto-Cancelled (Timeout)",
    type: "flex",
    isActive: true,
    headerTitle: "นัดหมายถูกยกเลิกอัตโนมัติ",
    headerSubtitle: "หมดเวลารอการอนุมัติ",
    headerColor: "orange",
    headerVariant: "auto-cancelled",
    showStatusBadge: true,
    statusBadgeText: "ยกเลิกอัตโนมัติ",
    rows: [
      { id: "r1", label: "Booking", variable: "bookingCode", previewValue: "#eVMS-20260402-1042", enabled: true, sortOrder: 1 },
      { id: "r2", label: "วัตถุประสงค์", variable: "purposeName", previewValue: "🏛️ ติดต่อราชการ", enabled: true, sortOrder: 2 },
      { id: "r3", label: "วันที่นัด", variable: "dateTime", previewValue: "2 เม.ย. 2569 | 10:00 - 11:00 น.", enabled: true, sortOrder: 3 },
      { id: "r4", label: "ผู้รับพบ", variable: "hostName", previewValue: "คุณสมชาย รักชาติ", enabled: true, sortOrder: 4 },
    ],
    buttons: [
      { id: "b1", label: "สร้างนัดหมายใหม่", variant: "green", enabled: true, sortOrder: 1 },
      { id: "b2", label: "ดูรายละเอียด", variant: "outline", enabled: true, sortOrder: 2 },
    ],
    infoBox: {
      text: "⚠️ นัดหมายนี้ไม่ได้รับการอนุมัติภายใน {{timeoutHours}} ชั่วโมง ระบบจึงยกเลิกอัตโนมัติ\nหากต้องการเข้าพบ กรุณาสร้างนัดหมายใหม่",
      color: "orange",
      enabled: true,
    },
    showQrCode: false,
    availableVariables: ["bookingCode", "purposeName", "dateTime", "hostName", "timeoutHours"],
  },

  // ─── visitor-reminder ───
  {
    stateId: "visitor-reminder",
    name: "แจ้งเตือนล่วงหน้า",
    nameEn: "Appointment Reminder",
    type: "flex",
    isActive: true,
    headerTitle: "แจ้งเตือนนัดหมาย",
    headerSubtitle: "พรุ่งนี้ {{date}}",
    headerColor: "orange",
    headerVariant: "reminder",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "เวลา", variable: "timeSlot", previewValue: "10:00 - 11:00 น.", enabled: true, sortOrder: 1 },
      { id: "r2", label: "ผู้รับพบ", variable: "hostName", previewValue: "คุณสมชาย รักชาติ", enabled: true, sortOrder: 2 },
      { id: "r3", label: "สถานที่", variable: "location", previewValue: "อาคาร C ชั้น 4", enabled: true, sortOrder: 3 },
    ],
    buttons: [],
    infoBox: { text: "เตรียมบัตรประชาชน/Passport สำหรับยืนยันตัวตนที่ Kiosk", color: "blue", enabled: true },
    showQrCode: false,
    availableVariables: ["date", "timeSlot", "hostName", "location"],
  },

  // ─── visitor-checkin-kiosk ───
  {
    stateId: "visitor-checkin-kiosk",
    name: "Check-in สำเร็จ",
    nameEn: "Check-in Notification",
    type: "flex",
    isActive: true,
    headerTitle: "Check-in สำเร็จ",
    headerSubtitle: "ยินดีต้อนรับสู่ กท.กก.",
    headerColor: "blue",
    headerVariant: "checkin",
    showStatusBadge: true,
    statusBadgeType: "checked-in",
    rows: [
      { id: "r1", label: "เลข Entry", variable: "entryCode", previewValue: "eVMS-25690402-0099", enabled: true, sortOrder: 1 },
      { id: "r2", label: "เวลาเข้า", variable: "checkinAt", previewValue: "09:45 น.", enabled: true, sortOrder: 2 },
      { id: "r3", label: "เวลาออก", variable: "checkoutAt", previewValue: "ภายใน 11:00 น.", enabled: true, sortOrder: 3 },
      { id: "r4", label: "สถานที่", variable: "location", previewValue: "อาคาร C ชั้น 4", enabled: true, sortOrder: 4 },
    ],
    buttons: [
      { id: "b1", label: "ดู Visit Slip", variant: "primary", enabled: true, sortOrder: 1 },
    ],
    showQrCode: false,
    availableVariables: ["entryCode", "checkinAt", "checkoutAt", "location"],
  },

  // ─── visitor-wifi-credentials ───
  {
    stateId: "visitor-wifi-credentials",
    name: "ข้อมูล WiFi",
    nameEn: "WiFi Credentials",
    type: "flex",
    isActive: true,
    headerTitle: "WiFi สำหรับผู้มาติดต่อ",
    headerSubtitle: "ใช้ได้ถึง {{expiry}} วันนี้",
    headerColor: "blue",
    headerVariant: "wifi",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "SSID", variable: "wifiSSID", previewValue: "MOTS-Guest", enabled: true, sortOrder: 1 },
      { id: "r2", label: "Password", variable: "wifiPassword", previewValue: "mots2026", enabled: true, sortOrder: 2 },
    ],
    buttons: [],
    showQrCode: false,
    availableVariables: ["entryCode", "wifiSSID", "wifiPassword", "expiry"],
  },

  // ─── visitor-slip-line ───
  {
    stateId: "visitor-slip-line",
    name: "Visit Slip (Digital)",
    nameEn: "Digital Visit Slip",
    type: "flex",
    isActive: true,
    headerTitle: "Visit Slip (Digital)",
    headerColor: "primary",
    headerVariant: "slip",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "เลข Entry", variable: "entryCode", previewValue: "eVMS-25690402-0099", enabled: true, sortOrder: 1 },
      { id: "r2", label: "ชื่อ", variable: "visitorName", previewValue: "พุทธิพงษ์ คาดสนิท", enabled: true, sortOrder: 2 },
      { id: "r3", label: "บัตร", variable: "idNumber", previewValue: "1-xxxx-xxxxx-90-3", enabled: true, sortOrder: 3 },
      { id: "r4", label: "วัตถุประสงค์", variable: "purposeName", previewValue: "ติดต่อราชการ", enabled: true, sortOrder: 4 },
      { id: "r5", label: "แผนก", variable: "department", previewValue: "สำนักนโยบายฯ", enabled: true, sortOrder: 5 },
      { id: "r6", label: "อาคาร", variable: "location", previewValue: "อาคาร C ชั้น 4", enabled: true, sortOrder: 6 },
      { id: "r7", label: "เข้า", variable: "checkinAt", previewValue: "09:45", enabled: true, sortOrder: 7 },
      { id: "r8", label: "ออก (ภายใน)", variable: "checkoutAt", previewValue: "11:00 น.", enabled: true, sortOrder: 8 },
    ],
    buttons: [],
    showQrCode: true,
    qrLabel: "สแกน QR นี้ที่ทางออกเพื่อ Check-out",
    availableVariables: ["entryCode", "visitorName", "idNumber", "purposeName", "department", "location", "checkinAt", "checkoutAt"],
  },

  // ─── visitor-checkout ───
  {
    stateId: "visitor-checkout",
    name: "Check-out ขอบคุณ",
    nameEn: "Check-out Thank You",
    type: "flex",
    isActive: true,
    headerTitle: "Check-out สำเร็จ",
    headerSubtitle: "ขอบคุณที่มาเยือน กท.กก.",
    headerColor: "green",
    headerVariant: "checkout",
    showStatusBadge: true,
    statusBadgeType: "checked-out",
    rows: [
      { id: "r1", label: "เข้า", variable: "checkinAt", previewValue: "09:45 น.", enabled: true, sortOrder: 1 },
      { id: "r2", label: "ออก", variable: "checkoutAt", previewValue: "10:55 น.", enabled: true, sortOrder: 2 },
      { id: "r3", label: "ระยะเวลา", variable: "duration", previewValue: "1 ชม. 10 นาที", enabled: true, sortOrder: 3 },
    ],
    buttons: [],
    infoBox: { text: "กรุณาส่งคืนบัตร Visitor (ถ้ามี) ที่จุด Counter", color: "gray", enabled: true },
    showQrCode: false,
    availableVariables: ["entryCode", "checkinAt", "checkoutAt", "duration"],
  },

  // ─── officer-register (LIFF) ───
  {
    stateId: "officer-register",
    name: "ลงทะเบียน Officer",
    nameEn: "Officer Registration (LIFF)",
    type: "liff",
    isActive: true,
    headerTitle: "",
    headerColor: "primary",
    headerVariant: "standard",
    showStatusBadge: false,
    rows: [],
    buttons: [],
    showQrCode: false,
    availableVariables: [],
  },

  // ─── officer-registered ───
  {
    stateId: "officer-registered",
    name: "ลงทะเบียน Officer สำเร็จ",
    nameEn: "Officer Registration Complete",
    type: "flex",
    isActive: true,
    headerTitle: "Registration Complete",
    headerColor: "green",
    headerVariant: "standard",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "ประเภท", variable: "userType", previewValue: "Officer", enabled: true, sortOrder: 1 },
      { id: "r2", label: "วันที่", variable: "date", previewValue: "30 มี.ค. 2569, 09:05 น.", enabled: true, sortOrder: 2 },
      { id: "r3", label: "ชื่อ", variable: "officerName", previewValue: "นพดล ชูช่วย", enabled: true, sortOrder: 3 },
      { id: "r4", label: "ตำแหน่ง", variable: "position", previewValue: "นักวิชาการท่องเที่ยว ชำนาญการ", enabled: true, sortOrder: 4 },
      { id: "r5", label: "สังกัด", variable: "department", previewValue: "กองกิจการท่องเที่ยว", enabled: true, sortOrder: 5 },
    ],
    buttons: [
      { id: "b1", label: "ดูคำขอนัดหมาย", variant: "primary", enabled: true, sortOrder: 1 },
      { id: "b2", label: "ข้อมูลส่วนบุคคล", variant: "outline", enabled: true, sortOrder: 2 },
    ],
    showQrCode: false,
    availableVariables: ["userType", "date", "officerName", "position", "department"],
  },

  // ─── officer-new-request ───
  {
    stateId: "officer-new-request",
    name: "คำขอนัดหมายใหม่",
    nameEn: "New Request Notification",
    type: "flex",
    isActive: true,
    headerTitle: "คำขอนัดหมายใหม่",
    headerSubtitle: "ต้องการอนุมัติ",
    headerColor: "orange",
    headerVariant: "officer-request",
    showStatusBadge: true,
    statusBadgeText: "รอดำเนินการ",
    statusBadgeType: "pending",
    rows: [
      { id: "r1", label: "ผู้ขอ", variable: "visitorName", previewValue: "พุทธิพงษ์ คาดสนิท", enabled: true, sortOrder: 1 },
      { id: "r2", label: "บริษัท", variable: "company", previewValue: "บริษัท สยามเทค จำกัด", enabled: true, sortOrder: 2 },
      { id: "r3", label: "วัตถุประสงค์", variable: "purposeName", previewValue: "🏛️ ติดต่อราชการ", enabled: true, sortOrder: 3 },
      { id: "r4", label: "วันที่", variable: "dateTime", previewValue: "2 เม.ย. 2569 | 10:00 - 11:00", enabled: true, sortOrder: 4 },
      { id: "r5", label: "ผู้ติดตาม", variable: "companions", previewValue: "0 คน", enabled: true, sortOrder: 5 },
    ],
    buttons: [
      { id: "b1", label: "อนุมัติ", variant: "green", enabled: true, sortOrder: 1 },
      { id: "b2", label: "ปฏิเสธ", variant: "red", enabled: true, sortOrder: 2 },
      { id: "b3", label: "ดูรายละเอียด", variant: "outline", enabled: true, sortOrder: 3 },
    ],
    showQrCode: false,
    availableVariables: ["visitorName", "company", "purposeName", "dateTime", "companions"],
  },

  // ─── officer-approve-action ───
  {
    stateId: "officer-approve-action",
    name: "ยืนยันอนุมัติ",
    nameEn: "Approval Confirmed",
    type: "flex",
    isActive: true,
    headerTitle: "อนุมัติเรียบร้อย",
    headerColor: "green",
    headerVariant: "officer-approved",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "คำขอ", variable: "bookingCode", previewValue: "#eVMS-20260402-1042", enabled: true, sortOrder: 1 },
      { id: "r2", label: "ผู้ขอ", variable: "visitorName", previewValue: "พุทธิพงษ์ คาดสนิท", enabled: true, sortOrder: 2 },
    ],
    buttons: [],
    infoBox: { text: "แจ้งผู้มาติดต่อทาง LINE แล้ว", color: "gray", enabled: true },
    showQrCode: false,
    availableVariables: ["bookingCode", "visitorName"],
  },

  // ─── officer-checkin-alert ───
  {
    stateId: "officer-checkin-alert",
    name: "แจ้งเตือน Visitor Check-in",
    nameEn: "Visitor Check-in Alert",
    type: "flex",
    isActive: true,
    headerTitle: "ผู้มาติดต่อ Check-in แล้ว",
    headerSubtitle: "กำลังเดินทางมาพบคุณ",
    headerColor: "blue",
    headerVariant: "officer-checkin",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "ชื่อ", variable: "visitorName", previewValue: "พุทธิพงษ์ คาดสนิท", enabled: true, sortOrder: 1 },
      { id: "r2", label: "บริษัท", variable: "company", previewValue: "บริษัท สยามเทค จำกัด", enabled: true, sortOrder: 2 },
      { id: "r3", label: "Check-in", variable: "checkinInfo", previewValue: "09:45 น. | Kiosk K-01", enabled: true, sortOrder: 3 },
      { id: "r4", label: "สถานที่", variable: "location", previewValue: "อาคาร C ชั้น 4", enabled: true, sortOrder: 4 },
    ],
    buttons: [
      { id: "b1", label: "ดูรายละเอียด", variant: "primary", enabled: true, sortOrder: 1 },
    ],
    showQrCode: false,
    availableVariables: ["visitorName", "company", "checkinInfo", "location"],
  },

  // ─── officer-overstay-alert ───
  {
    stateId: "officer-overstay-alert",
    name: "แจ้งเตือน Overstay",
    nameEn: "Overstay Alert",
    type: "flex",
    isActive: true,
    headerTitle: "แจ้งเตือน: เกินเวลานัด",
    headerSubtitle: "Overstay {{overstayMinutes}} นาที",
    headerColor: "red",
    headerVariant: "officer-overstay",
    showStatusBadge: false,
    rows: [
      { id: "r1", label: "ชื่อ", variable: "visitorName", previewValue: "พุทธิพงษ์ คาดสนิท", enabled: true, sortOrder: 1 },
      { id: "r2", label: "นัดหมาย", variable: "timeSlot", previewValue: "10:00 - 11:00 น.", enabled: true, sortOrder: 2 },
      { id: "r3", label: "เกินเวลา", variable: "overstayMinutes", previewValue: "45 นาที", enabled: true, sortOrder: 3 },
      { id: "r4", label: "สถานที่", variable: "location", previewValue: "อาคาร C ชั้น 4", enabled: true, sortOrder: 4 },
    ],
    buttons: [
      { id: "b1", label: "ติดต่อ Visitor", variant: "primary", enabled: true, sortOrder: 1 },
      { id: "b2", label: "แจ้ง Security", variant: "red", enabled: true, sortOrder: 2 },
    ],
    showQrCode: false,
    availableVariables: ["visitorName", "timeSlot", "overstayMinutes", "location"],
  },
];

// ===== HELPERS =====

export function getFlexTemplate(stateId: LineFlowStateId): FlexTemplateConfig | undefined {
  return defaultFlexTemplates.find((t) => t.stateId === stateId);
}

export function getFlexTemplatesByType(type: FlexTemplateType): FlexTemplateConfig[] {
  return defaultFlexTemplates.filter((t) => t.type === type);
}

export function getVisitorTemplates(): FlexTemplateConfig[] {
  return defaultFlexTemplates.filter((t) => t.stateId.startsWith("visitor-") || t.stateId === "new-friend");
}

export function getOfficerTemplates(): FlexTemplateConfig[] {
  return defaultFlexTemplates.filter((t) => t.stateId.startsWith("officer-"));
}
