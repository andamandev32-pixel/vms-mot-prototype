// ===== eVMS MOCK DATA STORE =====
// Shared mock data for all surfaces (Mobile, Web, Kiosk, Counter)
// All data is hardcoded — no backend or API integration

// ===== TYPES =====

export type VisitStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "auto-checkout"
  | "overstay"
  | "blocked"
  | "cancelled";

export type VisitType =
  | "official"       // พบเจ้าหน้าที่
  | "meeting"        // ประชุม / สัมมนา
  | "document"       // ส่งเอกสาร
  | "contractor"     // ผู้รับเหมา / ซ่อมบำรุง
  | "delivery"       // รับ-ส่งสินค้า
  | "other";         // อื่นๆ

export type EntryMode = "single" | "period";

export type UserRole = "admin" | "supervisor" | "staff" | "security" | "visitor";

export type NotificationType = "approved" | "rejected" | "reminder" | "checkin" | "wifi" | "overstay" | "system";

export type ShiftType = "morning" | "afternoon" | "night";

export interface Department {
  id: number;
  name: string;
  nameEn: string;
  floor: string;
  building: string;
  isActive: boolean;
}

export interface Staff {
  id: number;
  employeeId: string;
  name: string;
  nameEn: string;
  position: string;
  department: Department;
  email: string;
  phone: string;
  lineUserId?: string;
  avatar?: string;
  role: UserRole;
  status: "active" | "inactive" | "locked";
  shift?: ShiftType;
}

export interface Visitor {
  id: number;
  name: string;
  nameEn?: string;
  idNumber: string;       // เลขบัตรประชาชน or Passport
  idType: "thai-id" | "passport" | "driver-license";
  company: string;
  phone: string;
  email?: string;
  lineUserId?: string;
  photo?: string;
  nationality?: string;
  isBlocked: boolean;
  blockReason?: string;
  blockedBy?: string;
  blockedDate?: string;
}

export interface Equipment {
  name: string;
  quantity: number;
}

export interface Appointment {
  id: number;
  code: string;            // eVMS-XXXXXXXX-XXXX
  visitor: Visitor;
  host: Staff;
  type: VisitType;
  status: VisitStatus;
  entryMode: EntryMode;    // "single" = ครั้งเดียว, "period" = ช่วงเวลา
  date: string;            // YYYY-MM-DD (วันเริ่ม)
  dateEnd?: string;        // YYYY-MM-DD (วันสิ้นสุด — เฉพาะ period mode)
  timeStart: string;       // HH:mm
  timeEnd: string;         // HH:mm
  purpose: string;
  companions: number;
  companionNames?: string[];   // รายชื่อผู้ติดตาม (ถ้าระบุ → แต่ละคน check-in แยกได้)
  createdBy: "visitor" | "staff";  // ใครสร้างรายการ
  offerWifi?: boolean;          // เสนอ WiFi ให้ผู้มาติดต่อ
  wifiRequested?: boolean;      // ผู้จองขอรับ WiFi ไว้ตอนนัดหมาย
  slipPrinted?: boolean;        // พิมพ์ slip แล้วหรือไม่ (ถ้าผูก LINE อาจเลือกไม่พิมพ์)
  equipment?: Equipment[];
  area: string;
  building: string;
  floor: string;
  room?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  checkinAt?: string;
  checkoutAt?: string;
  checkoutBy?: string;
  wifiUsername?: string;
  wifiPassword?: string;
  notes?: string;
}

export interface VisitNotification {
  id: number;
  type: NotificationType;
  title: string;
  titleEn?: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  appointmentId?: number;
  actionUrl?: string;
}

export interface BlocklistEntry {
  id: number;
  visitor: Visitor;
  reason: string;
  type: "permanent" | "temporary";
  expiryDate?: string;
  addedBy: string;
  addedAt: string;
}

// ===== VISIT TYPE CONFIG =====

export const visitTypes: Record<VisitType, { label: string; labelEn: string; icon: string }> = {
  official: { label: "พบเจ้าหน้าที่", labelEn: "Official Visit", icon: "🤝" },
  meeting: { label: "ประชุม / สัมมนา", labelEn: "Meeting / Seminar", icon: "📋" },
  document: { label: "ส่งเอกสาร", labelEn: "Document Delivery", icon: "📄" },
  contractor: { label: "ผู้รับเหมา / ซ่อมบำรุง", labelEn: "Contractor / Maintenance", icon: "🔧" },
  delivery: { label: "รับ-ส่งสินค้า", labelEn: "Delivery", icon: "📦" },
  other: { label: "อื่นๆ", labelEn: "Other", icon: "🔖" },
};

export const statusConfig: Record<VisitStatus, { label: string; labelEn: string; color: string; bgColor: string; borderColor: string }> = {
  pending: { label: "รอดำเนินการ", labelEn: "Pending", color: "text-warning", bgColor: "bg-warning-light", borderColor: "border-warning" },
  approved: { label: "อนุมัติแล้ว", labelEn: "Approved", color: "text-success", bgColor: "bg-success-light", borderColor: "border-success" },
  rejected: { label: "ไม่อนุมัติ", labelEn: "Rejected", color: "text-error", bgColor: "bg-error-light", borderColor: "border-error" },
  confirmed: { label: "ยืนยันแล้ว", labelEn: "Confirmed", color: "text-info", bgColor: "bg-info-light", borderColor: "border-info" },
  "checked-in": { label: "เข้าพื้นที่แล้ว", labelEn: "Checked-In", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-500" },
  "checked-out": { label: "ออกแล้ว", labelEn: "Checked-Out", color: "text-gray-600", bgColor: "bg-gray-100", borderColor: "border-gray-400" },
  "auto-checkout": { label: "Auto Check-out", labelEn: "Auto Check-out", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-500" },
  overstay: { label: "เกินเวลา", labelEn: "Overstay", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-500" },
  blocked: { label: "ถูกบล็อก", labelEn: "Blocked", color: "text-red-800", bgColor: "bg-red-100", borderColor: "border-red-700" },
  cancelled: { label: "ยกเลิก", labelEn: "Cancelled", color: "text-gray-500", bgColor: "bg-gray-50", borderColor: "border-gray-300" },
};

// ===== DEPARTMENTS =====

export const departments: Department[] = [
  { id: 1, name: "สำนักงานปลัดกระทรวง", nameEn: "Office of the Permanent Secretary", floor: "ชั้น 3", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 2, name: "กองกลาง", nameEn: "General Administration Division", floor: "ชั้น 2", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 3, name: "กองการต่างประเทศ", nameEn: "International Affairs Division", floor: "ชั้น 5", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 4, name: "กองกิจการท่องเที่ยว", nameEn: "Tourism Affairs Division", floor: "ชั้น 4", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 5, name: "กรมการท่องเที่ยว", nameEn: "Department of Tourism", floor: "ชั้น 6", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 6, name: "กรมพลศึกษา", nameEn: "Department of Physical Education", floor: "ชั้น 7", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 7, name: "การกีฬาแห่งประเทศไทย", nameEn: "Sports Authority of Thailand", floor: "ชั้น 8", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 8, name: "สำนักนโยบายและแผน", nameEn: "Policy and Planning Division", floor: "ชั้น 4", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 9, name: "สำนักงานรัฐมนตรี", nameEn: "Minister's Office", floor: "ชั้น 9", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 10, name: "การท่องเที่ยวแห่งประเทศไทย", nameEn: "Tourism Authority of Thailand", floor: "ชั้น 6", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 11, name: "มหาวิทยาลัยการกีฬาแห่งชาติ", nameEn: "National Sports University", floor: "ชั้น 7", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 12, name: "กองบัญชาการตำรวจท่องเที่ยว", nameEn: "Tourist Police Bureau", floor: "ชั้น 8", building: "ศูนย์ราชการ อาคาร C", isActive: true },
  { id: 13, name: "องค์การบริหารการพัฒนาพื้นที่พิเศษเพื่อการท่องเที่ยวอย่างยั่งยืน (อพท.)", nameEn: "DASTA", floor: "ชั้น 8", building: "ศูนย์ราชการ อาคาร C", isActive: true },
];

// ===== STAFF =====

export const staffMembers: Staff[] = [
  {
    id: 1,
    employeeId: "EMP-001",
    name: "คุณสมศรี รักงาน",
    nameEn: "Somsri Rakngarn",
    position: "ผู้อำนวยการกองกิจการท่องเที่ยว",
    department: departments[3],
    email: "somsri.r@mots.go.th",
    phone: "02-283-1500",
    role: "staff",
    status: "active",
    avatar: undefined,
  },
  {
    id: 2,
    employeeId: "EMP-002",
    name: "คุณประเสริฐ ศรีวิโล",
    nameEn: "Prasert Srivilo",
    position: "หัวหน้ากลุ่มงานบริหารทั่วไป",
    department: departments[1],
    email: "prasert.s@mots.go.th",
    phone: "02-283-1501",
    role: "staff",
    status: "active",
    avatar: undefined,
  },
  {
    id: 3,
    employeeId: "EMP-003",
    name: "คุณกมลพร วงศ์สวัสดิ์",
    nameEn: "Kamonporn Wongsawad",
    position: "ผู้เชี่ยวชาญด้านต่างประเทศ",
    department: departments[2],
    email: "kamonporn.w@mots.go.th",
    phone: "02-283-1502",
    role: "staff",
    status: "active",
    avatar: undefined,
  },
  {
    id: 4,
    employeeId: "EMP-004",
    name: "คุณวิภาดา ชัยมงคล",
    nameEn: "Wipada Chaimongkol",
    position: "นักวิเคราะห์นโยบายและแผน",
    department: departments[7],
    email: "wipada.c@mots.go.th",
    phone: "02-283-1503",
    role: "staff",
    status: "active",
    avatar: undefined,
  },
  {
    id: 5,
    employeeId: "EMP-005",
    name: "คุณอนันต์ มั่นคง",
    nameEn: "Anan Mankong",
    position: "ผู้ดูแลระบบ",
    department: departments[0],
    email: "anan.m@mots.go.th",
    phone: "02-283-1504",
    role: "admin",
    status: "active",
    avatar: undefined,
  },
  {
    id: 6,
    employeeId: "SEC-001",
    name: "คุณสมชาย ปลอดภัย",
    nameEn: "Somchai Plodpai",
    position: "เจ้าหน้าที่รักษาความปลอดภัย",
    department: departments[1],
    email: "somchai.p@mots.go.th",
    phone: "02-283-1510",
    role: "security",
    status: "active",
    shift: "morning",
    avatar: undefined,
  },
  {
    id: 7,
    employeeId: "EMP-006",
    name: "คุณธนพล จิตรดี",
    nameEn: "Thanapon Jitdee",
    position: "นักวิชาการท่องเที่ยว",
    department: departments[4],
    email: "thanapon.j@mots.go.th",
    phone: "02-283-1505",
    role: "staff",
    status: "active",
    avatar: undefined,
  },
  {
    id: 8,
    employeeId: "EMP-007",
    name: "คุณปิยะนุช สุขใจ",
    nameEn: "Piyanuch Sukjai",
    position: "เจ้าหน้าที่บริหารงานทั่วไป",
    department: departments[5],
    email: "piyanuch.s@mots.go.th",
    phone: "02-283-1506",
    role: "staff",
    status: "active",
    avatar: undefined,
  },
  {
    id: 9,
    employeeId: "EMP-008",
    name: "คุณนภดล เรืองศักดิ์",
    nameEn: "Noppadon Ruangsak",
    position: "นักจัดการงานทั่วไป",
    department: departments[0],
    email: "noppadon.r@mots.go.th",
    phone: "02-283-1507",
    role: "staff",
    status: "inactive",
    avatar: undefined,
  },
  {
    id: 10,
    employeeId: "SEC-002",
    name: "คุณชัยวัฒน์ กล้าหาญ",
    nameEn: "Chaiwat Klahan",
    position: "เจ้าหน้าที่รักษาความปลอดภัย",
    department: departments[1],
    email: "chaiwat.k@mots.go.th",
    phone: "02-283-1511",
    role: "security",
    status: "inactive",
    shift: "night",
    avatar: undefined,
  },
  {
    id: 11,
    employeeId: "SEC-003",
    name: "คุณวิรัตน์ เก่งกาจ",
    nameEn: "Wirat Kengkaj",
    position: "เจ้าหน้าที่รักษาความปลอดภัย",
    department: departments[1],
    email: "wirat.k@mots.go.th",
    phone: "02-283-1512",
    role: "security",
    status: "active",
    shift: "morning",
    avatar: undefined,
  },
  {
    id: 12,
    employeeId: "SEC-004",
    name: "คุณประยุทธ์ แก้วมั่นคง",
    nameEn: "Prayut Kaewmankong",
    position: "เจ้าหน้าที่รักษาความปลอดภัย",
    department: departments[1],
    email: "prayut.k@mots.go.th",
    phone: "02-283-1513",
    role: "security",
    status: "active",
    shift: "afternoon",
    avatar: undefined,
  },
];

// ===== VISITORS =====

export const visitors: Visitor[] = [
  {
    id: 1,
    name: "นายวิชัย มั่นคง",
    nameEn: "Wichai Mankong",
    idNumber: "1-3045-00123-45-6",
    idType: "thai-id",
    company: "บริษัท ทัวร์ไทย จำกัด",
    phone: "081-234-5678",
    email: "wichai@tourthai.co.th",
    lineUserId: "U1234567890",
    nationality: "ไทย",
    isBlocked: false,
  },
  {
    id: 2,
    name: "นางอัญชลี แสงทอง",
    nameEn: "Anchalee Saengthong",
    idNumber: "1-1234-56789-01-2",
    idType: "thai-id",
    company: "สมาคมส่งเสริมการท่องเที่ยวไทย",
    phone: "089-876-5432",
    email: "anchalee@tat.or.th",
    lineUserId: "U0987654321",
    nationality: "ไทย",
    isBlocked: false,
  },
  {
    id: 3,
    name: "Mr. James Wilson",
    nameEn: "James Wilson",
    idNumber: "AB1234567",
    idType: "passport",
    company: "World Tourism Organization",
    phone: "+66-92-345-6789",
    email: "james.wilson@unwto.org",
    nationality: "American",
    isBlocked: false,
  },
  {
    id: 4,
    name: "นายธนพล สุขสำราญ",
    nameEn: "Thanapol Suksamran",
    idNumber: "3-5678-01234-56-7",
    idType: "thai-id",
    company: "บริษัท ก่อสร้างเอก จำกัด",
    phone: "086-111-2222",
    email: "thanapol@ekconstruction.com",
    nationality: "ไทย",
    isBlocked: false,
  },
  {
    id: 5,
    name: "นางสาวพิมพ์ใจ รุ่งเรือง",
    nameEn: "Pimjai Rungreung",
    idNumber: "1-2345-67890-12-3",
    idType: "thai-id",
    company: "สำนักข่าว Thai PBS",
    phone: "083-333-4444",
    email: "pimjai@thaipbs.or.th",
    lineUserId: "U5555555555",
    nationality: "ไทย",
    isBlocked: false,
  },
  {
    id: 6,
    name: "นายสุรศักดิ์ อันตราย",
    nameEn: "Surasak Antarai",
    idNumber: "1-9876-54321-09-8",
    idType: "thai-id",
    company: "-",
    phone: "099-999-0000",
    nationality: "ไทย",
    isBlocked: true,
    blockReason: "พฤติกรรมไม่เหมาะสม — ก่อความวุ่นวายในพื้นที่เมื่อ 15 ม.ค. 2569",
    blockedBy: "คุณอนันต์ มั่นคง",
    blockedDate: "2569-01-16",
  },
  {
    id: 7,
    name: "Ms. Yuki Tanaka",
    nameEn: "Yuki Tanaka",
    idNumber: "TK8901234",
    idType: "passport",
    company: "Japan National Tourism Organization",
    phone: "+66-95-678-9012",
    email: "yuki.tanaka@jnto.go.jp",
    nationality: "Japanese",
    isBlocked: false,
  },
  {
    id: 8,
    name: "นายพิพัฒน์ เจริญกิจ",
    nameEn: "Pipat Charoenkij",
    idNumber: "1-4567-89012-34-5",
    idType: "thai-id",
    company: "บริษัท ไอที โซลูชั่น จำกัด",
    phone: "084-555-6666",
    email: "pipat@itsolution.co.th",
    nationality: "ไทย",
    isBlocked: false,
  },
];

// ===== APPOINTMENTS =====

export const appointments: Appointment[] = [
  {
    id: 1,
    code: "eVMS-20690308-0001",
    visitor: visitors[0],
    host: staffMembers[0],
    type: "official",
    status: "approved",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "09:00",
    timeEnd: "10:30",
    purpose: "หารือแนวทางส่งเสริมการท่องเที่ยวเชิงนิเวศ",
    companions: 0,
    createdBy: "visitor",
    offerWifi: true,
    area: "กองกิจการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    room: "ห้องประชุม 1",
    createdAt: "2569-03-05T10:30:00",
    approvedAt: "2569-03-05T14:00:00",
    approvedBy: "คุณสมศรี รักงาน",
  },
  {
    id: 2,
    code: "eVMS-20690308-0002",
    visitor: visitors[1],
    host: staffMembers[1],
    type: "meeting",
    status: "approved",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "10:00",
    timeEnd: "11:00",
    purpose: "ประชุมเตรียมงานมหกรรมท่องเที่ยวนานาชาติ",
    companions: 2,
    companionNames: ["นายสุรชัย วิทยา", "นางสาวปรียา สุขสวัสดิ์"],
    createdBy: "visitor",
    offerWifi: true,
    area: "กองกลาง",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 2",
    room: "ห้องประชุมใหญ่",
    createdAt: "2569-03-04T09:00:00",
    approvedAt: "2569-03-04T11:30:00",
    approvedBy: "คุณประเสริฐ ศรีวิโล",
  },
  {
    id: 3,
    code: "eVMS-20690308-0003",
    visitor: visitors[2],
    host: staffMembers[2],
    type: "official",
    status: "approved",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "13:00",
    timeEnd: "14:30",
    purpose: "Discuss bilateral tourism cooperation agreement",
    companions: 1,
    companionNames: ["Ms. Sarah Johnson"],
    createdBy: "staff",
    offerWifi: true,
    area: "กองการต่างประเทศ",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 5",
    createdAt: "2569-03-03T15:00:00",
    approvedAt: "2569-03-04T09:00:00",
    approvedBy: "คุณกมลพร วงศ์สวัสดิ์",
  },
  {
    id: 4,
    code: "eVMS-20690308-0004",
    visitor: visitors[3],
    host: staffMembers[1],
    type: "contractor",
    status: "pending",
    entryMode: "period",
    date: "2569-03-08",
    dateEnd: "2569-03-12",
    timeStart: "08:00",
    timeEnd: "17:00",
    purpose: "สำรวจพื้นที่ซ่อมแซมห้องประชุมชั้น 3",
    companions: 3,
    companionNames: ["นายวิทยา ช่างดี", "นายสุภาพ แข็งแรง", "นายอดิศร ไฟฟ้า"],
    createdBy: "staff",
    equipment: [
      { name: "กล่องเครื่องมือช่าง", quantity: 2 },
      { name: "บันได้อลูมิเนียม", quantity: 1 },
    ],
    area: "กองกลาง",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 3",
    createdAt: "2569-03-07T16:00:00",
  },
  {
    id: 5,
    code: "eVMS-20690309-0001",
    visitor: visitors[4],
    host: staffMembers[3],
    type: "official",
    status: "pending",
    entryMode: "single",
    date: "2569-03-09",
    timeStart: "10:00",
    timeEnd: "11:30",
    purpose: "สัมภาษณ์ผู้บริหารเรื่องแผนส่งเสริมท่องเที่ยวปี 2570",
    companions: 1,
    companionNames: ["นายสมชาย ช่างภาพ"],
    createdBy: "visitor",
    equipment: [
      { name: "กล้องถ่ายรูป", quantity: 1 },
      { name: "ขาตั้งกล้อง", quantity: 1 },
    ],
    area: "สำนักนโยบายและแผน",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-07T11:00:00",
  },
  {
    id: 6,
    code: "eVMS-20690308-0005",
    visitor: visitors[0],
    host: staffMembers[0],
    type: "official",
    status: "checked-in",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "09:00",
    timeEnd: "10:30",
    purpose: "หารือแนวทางส่งเสริมการท่องเที่ยวเชิงนิเวศ",
    companions: 0,
    createdBy: "visitor",
    offerWifi: true,
    area: "กองกิจการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-05T10:30:00",
    approvedAt: "2569-03-05T14:00:00",
    approvedBy: "คุณสมศรี รักงาน",
    checkinAt: "2569-03-08T08:55:00",
    wifiUsername: "guest_wichai",
    wifiPassword: "MOTS2569x",
  },
  {
    id: 7,
    code: "eVMS-20690307-0001",
    visitor: visitors[6],
    host: staffMembers[2],
    type: "meeting",
    status: "checked-out",
    entryMode: "period",
    date: "2569-03-05",
    dateEnd: "2569-03-07",
    timeStart: "09:00",
    timeEnd: "17:00",
    purpose: "Workshop: Japan-Thailand Tourism Exchange Program",
    companions: 0,
    createdBy: "staff",
    offerWifi: true,
    area: "กองการต่างประเทศ",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 5",
    room: "ห้องประชุม 2",
    createdAt: "2569-03-01T09:00:00",
    approvedAt: "2569-03-02T10:00:00",
    approvedBy: "คุณกมลพร วงศ์สวัสดิ์",
    checkinAt: "2569-03-07T09:50:00",
    checkoutAt: "2569-03-07T12:15:00",
    checkoutBy: "คุณกมลพร วงศ์สวัสดิ์",
  },
  {
    id: 8,
    code: "eVMS-20690306-0001",
    visitor: visitors[4],
    host: staffMembers[3],
    type: "document",
    status: "rejected",
    entryMode: "single",
    date: "2569-03-06",
    timeStart: "14:00",
    timeEnd: "15:00",
    purpose: "ส่งเอกสารประกอบการพิจารณาโครงการ",
    companions: 0,
    createdBy: "visitor",
    area: "สำนักนโยบายและแผน",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-05T08:00:00",
    rejectedAt: "2569-03-05T09:30:00",
    rejectedReason: "วันที่ขอมาตรงกับวันหยุดราชการ กรุณาเลือกวันใหม่",
  },
  // --- Additional appointments for dashboard coverage ---
  {
    id: 9,
    code: "eVMS-20690308-0006",
    visitor: visitors[7],
    host: staffMembers[4],
    type: "delivery",
    status: "checked-in",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "08:30",
    timeEnd: "09:30",
    purpose: "ส่งอุปกรณ์คอมพิวเตอร์ชุดใหม่",
    companions: 1,
    companionNames: ["นายสมหมาย ขับรถ"],
    createdBy: "staff",
    equipment: [{ name: "กล่องอุปกรณ์", quantity: 5 }],
    area: "สำนักงานปลัดกระทรวง",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 3",
    createdAt: "2569-03-07T14:00:00",
    approvedAt: "2569-03-07T15:00:00",
    approvedBy: "คุณอนันต์ มั่นคง",
    checkinAt: "2569-03-08T08:25:00",
  },
  {
    id: 10,
    code: "eVMS-20690308-0007",
    visitor: visitors[1],
    host: staffMembers[3],
    type: "document",
    status: "checked-in",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "09:30",
    timeEnd: "10:00",
    purpose: "ส่งรายงานผลการดำเนินงานประจำปี",
    companions: 0,
    createdBy: "visitor",
    area: "สำนักนโยบายและแผน",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-06T10:00:00",
    approvedAt: "2569-03-06T14:00:00",
    approvedBy: "คุณวิภาดา ชัยมงคล",
    checkinAt: "2569-03-08T09:25:00",
  },
  {
    id: 11,
    code: "eVMS-20690308-0008",
    visitor: visitors[3],
    host: staffMembers[7],
    type: "contractor",
    status: "overstay",
    entryMode: "period",
    date: "2569-03-08",
    dateEnd: "2569-03-10",
    timeStart: "08:00",
    timeEnd: "17:00",
    purpose: "ซ่อมบำรุงระบบปรับอากาศชั้น 7",
    companions: 2,
    companionNames: ["นายวิทยา ช่างแอร์", "นายสุภาพ ช่างไฟ"],
    createdBy: "staff",
    equipment: [
      { name: "เครื่องมือซ่อมแอร์", quantity: 1 },
      { name: "อะไหล่", quantity: 3 },
    ],
    area: "กรมพลศึกษา",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 7",
    createdAt: "2569-03-06T09:00:00",
    approvedAt: "2569-03-06T11:00:00",
    approvedBy: "คุณปิยะนุช สุขใจ",
    checkinAt: "2569-03-08T07:55:00",
  },
  {
    id: 12,
    code: "eVMS-20690308-0009",
    visitor: visitors[6],
    host: staffMembers[2],
    type: "meeting",
    status: "checked-in",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "13:30",
    timeEnd: "15:00",
    purpose: "Japan-Thailand Tourism Cooperation Follow-up",
    companions: 0,
    createdBy: "staff",
    offerWifi: true,
    area: "กองการต่างประเทศ",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 5",
    room: "ห้องประชุม 2",
    createdAt: "2569-03-06T08:00:00",
    approvedAt: "2569-03-06T10:00:00",
    approvedBy: "คุณกมลพร วงศ์สวัสดิ์",
    checkinAt: "2569-03-08T13:20:00",
    wifiUsername: "guest_yuki",
    wifiPassword: "MOTS2569y",
  },
  {
    id: 13,
    code: "eVMS-20690308-0010",
    visitor: visitors[4],
    host: staffMembers[0],
    type: "official",
    status: "checked-out",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "08:00",
    timeEnd: "09:00",
    purpose: "สัมภาษณ์สำหรับข่าวโครงการท่องเที่ยวสีเขียว",
    companions: 1,
    companionNames: ["นายสมชาย ช่างภาพ"],
    createdBy: "visitor",
    area: "กองกิจการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-06T14:00:00",
    approvedAt: "2569-03-07T09:00:00",
    approvedBy: "คุณสมศรี รักงาน",
    checkinAt: "2569-03-08T07:50:00",
    checkoutAt: "2569-03-08T09:10:00",
    checkoutBy: "คุณสมศรี รักงาน",
  },
  {
    id: 14,
    code: "eVMS-20690308-0011",
    visitor: visitors[2],
    host: staffMembers[6],
    type: "meeting",
    status: "auto-checkout",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "09:00",
    timeEnd: "10:30",
    purpose: "UNESCO Heritage Site Coordination Meeting",
    companions: 1,
    companionNames: ["Ms. Sarah Johnson"],
    createdBy: "staff",
    offerWifi: true,
    area: "กรมการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 6",
    createdAt: "2569-03-05T10:00:00",
    approvedAt: "2569-03-05T14:00:00",
    approvedBy: "คุณธนพล จิตรดี",
    checkinAt: "2569-03-08T08:50:00",
    checkoutAt: "2569-03-08T12:00:00",
    checkoutBy: "ระบบอัตโนมัติ",
  },
  {
    id: 15,
    code: "eVMS-20690308-0012",
    visitor: visitors[7],
    host: staffMembers[1],
    type: "other",
    status: "pending",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "15:00",
    timeEnd: "16:00",
    purpose: "เข้าสำรวจพื้นที่ติดตั้งระบบ CCTV",
    companions: 2,
    companionNames: ["นายวิศวะ ช่างกล้อง", "นายชาญชัย ไฟฟ้า"],
    createdBy: "staff",
    equipment: [{ name: "กล้อง CCTV ตัวอย่าง", quantity: 2 }],
    area: "กองกลาง",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 2",
    createdAt: "2569-03-08T08:00:00",
  },
  {
    id: 16,
    code: "eVMS-20690308-0013",
    visitor: visitors[0],
    host: staffMembers[6],
    type: "delivery",
    status: "checked-out",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "07:30",
    timeEnd: "08:30",
    purpose: "ส่งเอกสารและของที่ระลึกงานท่องเที่ยว",
    companions: 0,
    createdBy: "visitor",
    area: "กรมการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 6",
    createdAt: "2569-03-07T16:30:00",
    approvedAt: "2569-03-07T17:00:00",
    approvedBy: "คุณธนพล จิตรดี",
    checkinAt: "2569-03-08T07:25:00",
    checkoutAt: "2569-03-08T08:20:00",
    checkoutBy: "คุณธนพล จิตรดี",
  },
  {
    id: 17,
    code: "eVMS-20690308-0014",
    visitor: visitors[1],
    host: staffMembers[0],
    type: "meeting",
    status: "cancelled",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "11:00",
    timeEnd: "12:00",
    purpose: "ประชุมเตรียมงาน Amazing Thailand Grand Sale",
    companions: 0,
    createdBy: "visitor",
    area: "กองกิจการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-06T13:00:00",
    approvedAt: "2569-03-06T15:00:00",
    approvedBy: "คุณสมศรี รักงาน",
    notes: "ผู้มาติดต่อแจ้งยกเลิก — ติดภารกิจ",
  },
  {
    id: 18,
    code: "eVMS-20690309-0002",
    visitor: visitors[7],
    host: staffMembers[7],
    type: "contractor",
    status: "approved",
    entryMode: "period",
    date: "2569-03-09",
    dateEnd: "2569-03-12",
    timeStart: "08:00",
    timeEnd: "17:00",
    purpose: "ติดตั้งระบบ Network ชั้น 7-8",
    companions: 3,
    companionNames: ["นายวิศวะ ช่างเน็ต", "นายชาญชัย สายไฟ", "นายอดิศร เดินสาย"],
    createdBy: "staff",
    equipment: [
      { name: "สาย LAN CAT6", quantity: 20 },
      { name: "Switch Hub", quantity: 3 },
    ],
    area: "กรมพลศึกษา",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 7",
    createdAt: "2569-03-07T09:00:00",
    approvedAt: "2569-03-07T14:00:00",
    approvedBy: "คุณปิยะนุช สุขใจ",
  },
  {
    id: 19,
    code: "eVMS-20690308-0015",
    visitor: visitors[4],
    host: staffMembers[3],
    type: "document",
    status: "approved",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "14:30",
    timeEnd: "15:30",
    purpose: "ส่งเอกสารแผนยุทธศาสตร์ท่องเที่ยว 5 ปี",
    companions: 0,
    createdBy: "visitor",
    area: "สำนักนโยบายและแผน",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-07T11:00:00",
    approvedAt: "2569-03-07T16:00:00",
    approvedBy: "คุณวิภาดา ชัยมงคล",
  },
  {
    id: 20,
    code: "eVMS-20690308-0016",
    visitor: visitors[3],
    host: staffMembers[4],
    type: "contractor",
    status: "checked-in",
    entryMode: "single",
    date: "2569-03-08",
    timeStart: "10:00",
    timeEnd: "12:00",
    purpose: "ตรวจสอบระบบดับเพลิงประจำปี",
    companions: 1,
    companionNames: ["นายสุภาพ ช่างตรวจ"],
    createdBy: "staff",
    equipment: [{ name: "เครื่องมือตรวจสอบ", quantity: 1 }],
    area: "สำนักงานปลัดกระทรวง",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 3",
    createdAt: "2569-03-06T10:00:00",
    approvedAt: "2569-03-06T14:00:00",
    approvedBy: "คุณอนันต์ มั่นคง",
    checkinAt: "2569-03-08T09:55:00",
  },
];

// ===== NOTIFICATIONS =====

export const notifications: VisitNotification[] = [
  {
    id: 1,
    type: "approved",
    title: "การนัดหมายได้รับอนุมัติ",
    titleEn: "Appointment Approved",
    body: "8 มี.ค. 2569 เวลา 09:00 น. — คุณสมศรี รักงาน",
    timestamp: "2569-03-05T14:00:00",
    isRead: false,
    appointmentId: 1,
    actionUrl: "/mobile/qr-code",
  },
  {
    id: 2,
    type: "rejected",
    title: "การนัดหมายไม่ได้รับอนุมัติ",
    titleEn: "Appointment Rejected",
    body: "วันที่ขอมาตรงกับวันหยุดราชการ — วันว่าง: 10 มี.ค., 11 มี.ค.",
    timestamp: "2569-03-05T09:30:00",
    isRead: true,
    appointmentId: 8,
    actionUrl: "/mobile/booking",
  },
  {
    id: 3,
    type: "reminder",
    title: "อีก 1 ชั่วโมงก่อนถึงเวลานัด",
    titleEn: "1 Hour Reminder",
    body: "เตรียม QR Code และเอกสาร — พบคุณสมศรี 09:00 น.",
    timestamp: "2569-03-08T08:00:00",
    isRead: false,
    appointmentId: 1,
    actionUrl: "/mobile/qr-code",
  },
  {
    id: 4,
    type: "checkin",
    title: "เข้าพื้นที่สำเร็จ",
    titleEn: "Check-in Confirmed",
    body: "Check-in 8 มี.ค. 2569 08:55 น. · กองกิจการท่องเที่ยว",
    timestamp: "2569-03-08T08:55:00",
    isRead: false,
    appointmentId: 6,
  },
  {
    id: 5,
    type: "wifi",
    title: "ข้อมูล Wi-Fi ของคุณ",
    titleEn: "Wi-Fi Credentials",
    body: "SSID: MOTS-Visitor · แตะเพื่อดูรหัสผ่าน",
    timestamp: "2569-03-08T08:55:00",
    isRead: false,
    appointmentId: 6,
  },
  {
    id: 6,
    type: "system",
    title: "ระบบปรับปรุงเวอร์ชันใหม่",
    titleEn: "System Update",
    body: "eVMS v2.0 อัปเดต: รองรับ ThaiD, Passport MRZ scan",
    timestamp: "2569-03-01T09:00:00",
    isRead: true,
  },
];

// ===== BLOCKLIST =====

export const blocklist: BlocklistEntry[] = [
  {
    id: 1,
    visitor: visitors[5],
    reason: "พฤติกรรมไม่เหมาะสม — ก่อความวุ่นวายในพื้นที่เมื่อ 15 ม.ค. 2569",
    type: "permanent",
    addedBy: "คุณอนันต์ มั่นคง",
    addedAt: "2569-01-16T10:00:00",
  },
];

// ===== DASHBOARD STATS =====

export const dashboardStats = {
  today: {
    totalVisitors: 124,
    waiting: 8,
    checkedIn: 86,
    checkedOut: 30,
    deltaVisitors: 12,   // +12 vs yesterday
    deltaWaiting: -2,
  },
  currentInBuilding: 28,
  overstayCount: 3,
};

// ===== MEETING ROOMS =====

export const meetingRooms = [
  { id: 1, name: "ห้องประชุม 1", floor: "ชั้น 3", building: "ศูนย์ราชการ อาคาร C", capacity: 20 },
  { id: 2, name: "ห้องประชุม 2", floor: "ชั้น 5", building: "ศูนย์ราชการ อาคาร C", capacity: 15 },
  { id: 3, name: "ห้องประชุมใหญ่", floor: "ชั้น 2", building: "ศูนย์ราชการ อาคาร C", capacity: 50 },
  { id: 4, name: "ห้องรับรอง VIP", floor: "ชั้น 9", building: "ศูนย์ราชการ อาคาร C", capacity: 10 },
  { id: 5, name: "ห้องประชุม 3", floor: "ชั้น 7", building: "ศูนย์ราชการ อาคาร C", capacity: 30 },
];

// ===== HELPER: Current visitor (logged-in mock) =====

export const currentVisitor = visitors[0];
export const currentStaff = staffMembers[0];
export const currentSecurity = staffMembers[5];

// ===== HELPER: Filter functions =====

export function getAppointmentsByDate(date: string): Appointment[] {
  return appointments.filter((a) => a.date === date);
}

export function getAppointmentsByStatus(status: VisitStatus): Appointment[] {
  return appointments.filter((a) => a.status === status);
}

export function getTodayAppointments(): Appointment[] {
  return getAppointmentsByDate("2569-03-08");
}

export function getPendingAppointments(): Appointment[] {
  return getAppointmentsByStatus("pending");
}

export function getCheckedInAppointments(): Appointment[] {
  return getAppointmentsByStatus("checked-in");
}

export function searchAppointments(query: string): Appointment[] {
  const q = query.toLowerCase();
  return appointments.filter(
    (a) =>
      a.visitor.name.toLowerCase().includes(q) ||
      a.visitor.company.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.host.name.toLowerCase().includes(q) ||
      a.visitor.idNumber.includes(q)
  );
}

/** @deprecated ไม่ใช้เลขบัตรตรวจ — ใช้ isNameBlocked แทน */
export function isVisitorBlocked(idNumber: string): boolean {
  return visitors.some((v) => v.idNumber === idNumber && v.isBlocked);
}

/**
 * ตรวจ Blocklist ด้วยชื่อ+นามสกุล (partial match, case-insensitive)
 * ใช้ทุกช่องทาง: Kiosk, Counter, LINE OA, Web เจ้าหน้าที่สร้างให้
 * ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID ไว้
 */
export function isNameBlocked(firstName: string, lastName: string): BlocklistEntry | undefined {
  const fn = firstName.toLowerCase().trim();
  const ln = lastName.toLowerCase().trim();
  if (!fn && !ln) return undefined;
  return blocklist.find((entry) => {
    const blockedName = entry.visitor.name.toLowerCase();
    return (fn && blockedName.includes(fn)) && (ln && blockedName.includes(ln));
  });
}

// ===== MOCK PERSONNEL DATABASE (for staff registration lookup) =====

export interface PersonnelRecord {
  id: number;
  employeeId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  firstNameEn: string;
  lastNameEn: string;
  position: string;
  departmentId: number;
  departmentName: string;
}

export const personnelDatabase: PersonnelRecord[] = [
  {
    id: 1,
    employeeId: "EMP-001",
    nationalId: "1-1001-00001-01-1",
    firstName: "สมศรี",
    lastName: "รักงาน",
    firstNameEn: "Somsri",
    lastNameEn: "Rakngarn",
    position: "ผู้อำนวยการกองกิจการท่องเที่ยว",
    departmentId: 4,
    departmentName: "กองกิจการท่องเที่ยว",
  },
  {
    id: 2,
    employeeId: "EMP-002",
    nationalId: "1-1002-00002-02-2",
    firstName: "ประเสริฐ",
    lastName: "ศรีวิโล",
    firstNameEn: "Prasert",
    lastNameEn: "Srivilo",
    position: "หัวหน้ากลุ่มงานบริหารทั่วไป",
    departmentId: 2,
    departmentName: "กองกลาง",
  },
  {
    id: 3,
    employeeId: "EMP-007",
    nationalId: "1-8401-00567-89-0",
    firstName: "นพดล",
    lastName: "ชูช่วย",
    firstNameEn: "Noppadon",
    lastNameEn: "Choochuay",
    position: "นักวิชาการท่องเที่ยวชำนาญการ",
    departmentId: 4,
    departmentName: "กองกิจการท่องเที่ยว",
  },
  {
    id: 4,
    employeeId: "EMP-003",
    nationalId: "1-1003-00003-03-3",
    firstName: "กมลพร",
    lastName: "วงศ์สวัสดิ์",
    firstNameEn: "Kamonporn",
    lastNameEn: "Wongsawad",
    position: "ผู้เชี่ยวชาญด้านต่างประเทศ",
    departmentId: 3,
    departmentName: "กองการต่างประเทศ",
  },
  {
    id: 5,
    employeeId: "EMP-004",
    nationalId: "1-1004-00004-04-4",
    firstName: "วิภาดา",
    lastName: "ชัยมงคล",
    firstNameEn: "Wipada",
    lastNameEn: "Chaimongkol",
    position: "นักวิเคราะห์นโยบายและแผน",
    departmentId: 8,
    departmentName: "สำนักนโยบายและแผน",
  },
];

export function lookupPersonnel(query: string): PersonnelRecord | null {
  const q = query.trim();
  return personnelDatabase.find(
    (p) => p.employeeId.toLowerCase() === q.toLowerCase() || p.nationalId === q
  ) ?? null;
}

// ===== IDENTITY DOCUMENT TYPES =====

export interface IdentityDocumentType {
  id: number;
  name: string;
  nameEn: string;
  icon: string;
}

export const identityDocumentTypes: IdentityDocumentType[] = [
  { id: 1, name: "บัตรประจำตัวประชาชน", nameEn: "National ID Card", icon: "🪪" },
  { id: 2, name: "หนังสือเดินทาง (Passport)", nameEn: "Passport", icon: "📕" },
  { id: 3, name: "ใบขับขี่", nameEn: "Driver's License", icon: "🚗" },
  { id: 4, name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", nameEn: "Government Officer Card", icon: "🏛️" },
  { id: 5, name: "AppThaiID", nameEn: "AppThaiID", icon: "📱" },
];

// ===== VISIT PURPOSE CONFIGURATION =====

export interface DepartmentRule {
  departmentId: number;
  requirePersonName: boolean;     // ต้องระบุชื่อบุคคลที่ต้องการพบ
  requireApproval: boolean;       // ต้องมีการอนุมัติก่อนเข้าพื้นที่
  approverGroupId?: number;       // กลุ่มผู้อนุมัติ (เมื่อ requireApproval = true)
  offerWifi: boolean;             // เสนอ WiFi ให้ผู้เข้าเยี่ยม
  showOnLine: boolean;            // แสดงบน LINE OA + Web App
  showOnKiosk: boolean;           // แสดงบน Kiosk
  isActive: boolean;
}

export interface EntryChannelConfig {
  allowedDocuments: number[];     // IDs จาก identityDocumentTypes
  requirePhoto: boolean;          // ต้องถ่ายภาพ
}

export interface VisitPurposeConfig {
  id: number;
  name: string;
  nameEn: string;
  icon: string;
  departmentRules: DepartmentRule[];
  allowedEntryModes: EntryMode[];  // ประเภทการเข้าที่อนุญาต
  kioskConfig: EntryChannelConfig;
  counterConfig: EntryChannelConfig;
  isActive: boolean;
  order: number;
}

export const visitPurposeConfigs: VisitPurposeConfig[] = [
  {
    id: 1,
    name: "ติดต่อราชการ",
    nameEn: "Official Business",
    icon: "🏛️",
    allowedEntryModes: ["single", "period"],
    kioskConfig: { allowedDocuments: [1, 2, 4, 5], requirePhoto: true },
    counterConfig: { allowedDocuments: [1, 2, 3, 4, 5], requirePhoto: true },
    departmentRules: [
      { departmentId: 1, requirePersonName: true,  requireApproval: true,  approverGroupId: 1,  offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 2, requirePersonName: true,  requireApproval: true,  approverGroupId: 3,  offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 3, requirePersonName: true,  requireApproval: true,  approverGroupId: 5,  offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 4, requirePersonName: true,  requireApproval: true,  approverGroupId: 6,  offerWifi: false, showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: 5, requirePersonName: true,  requireApproval: false,                             offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 8, requirePersonName: false, requireApproval: false,                             offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 9, requirePersonName: true,  requireApproval: true,  approverGroupId: 10, offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
    ],
    isActive: true,
    order: 1,
  },
  {
    id: 2,
    name: "ประชุม / สัมมนา",
    nameEn: "Meeting / Seminar",
    icon: "📋",
    allowedEntryModes: ["single", "period"],
    kioskConfig: { allowedDocuments: [1, 2, 4, 5], requirePhoto: true },
    counterConfig: { allowedDocuments: [1, 2, 3, 4, 5], requirePhoto: false },
    departmentRules: [
      { departmentId: 1, requirePersonName: true,  requireApproval: true,  approverGroupId: 1, offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 3, requirePersonName: true,  requireApproval: true,  approverGroupId: 5, offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: 4, requirePersonName: true,  requireApproval: false,                            offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 9, requirePersonName: true,  requireApproval: true,  approverGroupId: 10, offerWifi: true, showOnLine: true,  showOnKiosk: false, isActive: true },
    ],
    isActive: true,
    order: 2,
  },
  {
    id: 3,
    name: "ส่งเอกสาร / พัสดุ",
    nameEn: "Document / Parcel Delivery",
    icon: "📄",
    allowedEntryModes: ["single"],
    kioskConfig: { allowedDocuments: [1, 3], requirePhoto: true },
    counterConfig: { allowedDocuments: [1, 3, 2], requirePhoto: false },
    departmentRules: [
      { departmentId: 1, requirePersonName: false, requireApproval: false,                            offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 2, requirePersonName: false, requireApproval: false,                            offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 4, requirePersonName: true,  requireApproval: true,  approverGroupId: 6, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 3,
  },
  {
    id: 4,
    name: "ผู้รับเหมา / ซ่อมบำรุง",
    nameEn: "Contractor / Maintenance",
    icon: "🔧",
    allowedEntryModes: ["single", "period"],
    kioskConfig: { allowedDocuments: [1, 3], requirePhoto: true },
    counterConfig: { allowedDocuments: [1, 2, 3, 4], requirePhoto: true },
    departmentRules: [
      { departmentId: 2, requirePersonName: false, requireApproval: true,  approverGroupId: 4, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
      { departmentId: 6, requirePersonName: false, requireApproval: true,  approverGroupId: 9, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 4,
  },
  {
    id: 5,
    name: "สมัครงาน / สัมภาษณ์",
    nameEn: "Job Application / Interview",
    icon: "💼",
    allowedEntryModes: ["single"],
    kioskConfig: { allowedDocuments: [1, 2, 5], requirePhoto: true },
    counterConfig: { allowedDocuments: [1, 2, 3, 4, 5], requirePhoto: true },
    departmentRules: [
      { departmentId: 2, requirePersonName: true,  requireApproval: false, offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 5,
  },
  {
    id: 6,
    name: "เยี่ยมชม / ศึกษาดูงาน",
    nameEn: "Study Visit / Tour",
    icon: "🎓",
    allowedEntryModes: ["single", "period"],
    kioskConfig: { allowedDocuments: [1, 2, 5], requirePhoto: true },
    counterConfig: { allowedDocuments: [1, 2, 3, 4, 5], requirePhoto: false },
    departmentRules: [
      { departmentId: 4, requirePersonName: true,  requireApproval: true,  approverGroupId: 7, offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: 5, requirePersonName: true,  requireApproval: true,  approverGroupId: 8, offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: 7, requirePersonName: false, requireApproval: true,                             offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: false },
    ],
    isActive: true,
    order: 6,
  },
  {
    id: 7,
    name: "รับ-ส่งสินค้า",
    nameEn: "Delivery / Pickup",
    icon: "📦",
    allowedEntryModes: ["single"],
    kioskConfig: { allowedDocuments: [1, 3], requirePhoto: false },
    counterConfig: { allowedDocuments: [1, 3], requirePhoto: false },
    departmentRules: [
      { departmentId: 1, requirePersonName: false, requireApproval: false, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
      { departmentId: 2, requirePersonName: false, requireApproval: false, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
      { departmentId: 4, requirePersonName: false, requireApproval: false, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 7,
  },
  {
    id: 8,
    name: "อื่นๆ",
    nameEn: "Other",
    icon: "🔖",
    allowedEntryModes: ["single"],
    kioskConfig: { allowedDocuments: [1, 2], requirePhoto: false },
    counterConfig: { allowedDocuments: [1, 2, 3], requirePhoto: false },
    departmentRules: [
      { departmentId: 1, requirePersonName: false, requireApproval: true,  approverGroupId: 2, offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: 2, requirePersonName: false, requireApproval: true,  approverGroupId: 3, offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
    ],
    isActive: false,
    order: 8,
  },
];

// ===== BUILDINGS & FLOORS =====

export interface Building {
  id: number;
  name: string;
  nameEn: string;
  totalFloors: number;
  description?: string;
  isActive: boolean;
}

export interface Floor {
  id: number;
  buildingId: number;
  floorNumber: number;
  name: string;
  nameEn: string;
  departmentIds: number[];
}

export type AccessZoneType = "office" | "meeting-room" | "lobby" | "parking" | "common" | "restricted" | "service";

export interface AccessZone {
  id: number;
  name: string;
  nameEn: string;
  floorId: number;
  buildingId: number;
  type: AccessZoneType;
  hikvisionDoorId: string;
  description?: string;
  isActive: boolean;
}

export interface AccessGroupSchedule {
  daysOfWeek: number[];       // 0=Sun, 1=Mon ... 6=Sat
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
}

export interface AccessGroup {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  zoneIds: number[];
  hikvisionGroupId: string;
  qrCodePrefix: string;
  validityMinutes: number;
  schedule: AccessGroupSchedule;
  allowedVisitTypes: VisitType[];
  isActive: boolean;
  color: string;
}

export interface DepartmentAccessMapping {
  id: number;
  departmentId: number;
  defaultAccessGroupId: number;
  additionalGroupIds: number[];
}

// ── Buildings ──

export const buildings: Building[] = [
  { id: 1, name: "ศูนย์ราชการ อาคาร C", nameEn: "Government Center Building C", totalFloors: 9, description: "กระทรวงการท่องเที่ยวและกีฬา — ทุกหน่วยงานในตึกเดียว", isActive: true },
];

// ── Floors ──

export const floors: Floor[] = [
  { id: 1, buildingId: 1, floorNumber: 1, name: "ชั้น 1 — ล็อบบี้ / ประชาสัมพันธ์ / รปภ.", nameEn: "1F — Lobby / Reception / Security", departmentIds: [] },
  { id: 2, buildingId: 1, floorNumber: 2, name: "ชั้น 2 — กองกลาง", nameEn: "2F — General Admin", departmentIds: [2] },
  { id: 3, buildingId: 1, floorNumber: 3, name: "ชั้น 3 — สำนักงานปลัด", nameEn: "3F — OPS", departmentIds: [1] },
  { id: 4, buildingId: 1, floorNumber: 4, name: "ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน", nameEn: "4F — Tourism Affairs & Policy", departmentIds: [4, 8] },
  { id: 5, buildingId: 1, floorNumber: 5, name: "ชั้น 5 — กองการต่างประเทศ", nameEn: "5F — International Affairs", departmentIds: [3] },
  { id: 6, buildingId: 1, floorNumber: 6, name: "ชั้น 6 — กรมการท่องเที่ยว / ททท.", nameEn: "6F — Dept. of Tourism / TAT", departmentIds: [5, 10] },
  { id: 7, buildingId: 1, floorNumber: 7, name: "ชั้น 7 — กรมพลศึกษา / มกช.", nameEn: "7F — Dept. of PE / NSU", departmentIds: [6, 11] },
  { id: 8, buildingId: 1, floorNumber: 8, name: "ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท.", nameEn: "8F — SAT / Tourist Police / DASTA", departmentIds: [7, 12, 13] },
  { id: 9, buildingId: 1, floorNumber: 9, name: "ชั้น 9 — สำนักงานรัฐมนตรี / ห้องประชุมอเนกประสงค์", nameEn: "9F — Minister's Office / Conference", departmentIds: [9] },
];

// ── Access Zones (areas controlled by Hikvision readers) ──

export const accessZones: AccessZone[] = [
  // ชั้น 1 — ล็อบบี้ / ที่จอดรถ / ซ่อมบำรุง
  { id: 1, name: "ล็อบบี้ ชั้น 1", nameEn: "Lobby 1F", floorId: 1, buildingId: 1, type: "lobby", hikvisionDoorId: "HIK-DOOR-C1-01", isActive: true },
  { id: 2, name: "ลานจอดรถ", nameEn: "Parking", floorId: 1, buildingId: 1, type: "parking", hikvisionDoorId: "HIK-DOOR-C1-PK", isActive: true },
  { id: 3, name: "พื้นที่ซ่อมบำรุง", nameEn: "Maintenance Area", floorId: 1, buildingId: 1, type: "service", hikvisionDoorId: "HIK-DOOR-C1-SVC", isActive: true },
  // ชั้น 2 — กองกลาง
  { id: 4, name: "สำนักงาน กองกลาง", nameEn: "General Admin Office", floorId: 2, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C2-01", isActive: true },
  { id: 5, name: "ห้องประชุม ชั้น 2", nameEn: "Meeting Room 2F", floorId: 2, buildingId: 1, type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C2-MR", isActive: true },
  // ชั้น 3 — สำนักงานปลัด
  { id: 6, name: "สำนักงานปลัด", nameEn: "OPS Office", floorId: 3, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C3-01", isActive: true },
  { id: 7, name: "ห้องประชุม ชั้น 3", nameEn: "Meeting Room 3F", floorId: 3, buildingId: 1, type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C3-MR", isActive: true },
  // ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน
  { id: 8, name: "สำนักงาน กองกิจการ / นโยบาย", nameEn: "Tourism & Policy Office", floorId: 4, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C4-01", isActive: true },
  { id: 9, name: "ห้องประชุม ชั้น 4", nameEn: "Meeting Room 4F", floorId: 4, buildingId: 1, type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C4-MR", isActive: true },
  // ชั้น 5 — กองการต่างประเทศ
  { id: 10, name: "สำนักงาน กองต่างประเทศ", nameEn: "International Office", floorId: 5, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C5-01", isActive: true },
  { id: 11, name: "ห้องประชุม ชั้น 5", nameEn: "Meeting Room 5F", floorId: 5, buildingId: 1, type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C5-MR", isActive: true },
  // ชั้น 6 — กรมการท่องเที่ยว / ททท.
  { id: 12, name: "กรมการท่องเที่ยว / ททท.", nameEn: "Tourism Dept. / TAT", floorId: 6, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C6-01", isActive: true },
  { id: 13, name: "ห้องประชุม ชั้น 6", nameEn: "Meeting Room 6F", floorId: 6, buildingId: 1, type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C6-MR", isActive: true },
  // ชั้น 7 — กรมพลศึกษา / มกช.
  { id: 14, name: "กรมพลศึกษา / มกช.", nameEn: "PE Dept. / NSU", floorId: 7, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C7-01", isActive: true },
  { id: 15, name: "ห้องประชุม ชั้น 7", nameEn: "Meeting Room 7F", floorId: 7, buildingId: 1, type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C7-MR", isActive: true },
  // ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท.
  { id: 16, name: "กกท. / ตร.ท่องเที่ยว / อพท.", nameEn: "SAT / Tourist Police / DASTA", floorId: 8, buildingId: 1, type: "office", hikvisionDoorId: "HIK-DOOR-C8-01", isActive: true },
  { id: 17, name: "พื้นที่ควบคุม ตร.ท่องเที่ยว", nameEn: "Tourist Police Restricted", floorId: 8, buildingId: 1, type: "restricted", hikvisionDoorId: "HIK-DOOR-C8-02", isActive: true },
  // ชั้น 9 — สำนักงานรัฐมนตรี (VIP) / ห้องประชุมอเนกประสงค์
  { id: 18, name: "สำนักงานรัฐมนตรี (VIP)", nameEn: "Minister's Office (VIP)", floorId: 9, buildingId: 1, type: "restricted", hikvisionDoorId: "HIK-DOOR-C9-01", isActive: true },
  { id: 19, name: "ห้องประชุมรัฐมนตรี", nameEn: "Minister's Conference", floorId: 9, buildingId: 1, type: "restricted", hikvisionDoorId: "HIK-DOOR-C9-MR", isActive: true },
  { id: 20, name: "ห้องอเนกประสงค์", nameEn: "Multipurpose Hall", floorId: 9, buildingId: 1, type: "common", hikvisionDoorId: "HIK-DOOR-C9-MP", isActive: true },
];

// ── Access Groups (Hikvision person-group mapping) ──

export const accessGroups: AccessGroup[] = [
  {
    id: 1,
    name: "ผู้เยี่ยมชมทั่วไป",
    nameEn: "General Visitor",
    description: "เข้าได้เฉพาะล็อบบี้และพื้นที่ส่วนกลาง ชั้น 1",
    zoneIds: [1, 20],
    hikvisionGroupId: "HIK-GRP-GENERAL",
    qrCodePrefix: "eVMS-GEN",
    validityMinutes: 60,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["document", "delivery", "other"],
    isActive: true,
    color: "#6B7280",
  },
  {
    id: 2,
    name: "ติดต่อราชการ ชั้น 2-5",
    nameEn: "Official — Floor 2-5",
    description: "เข้าล็อบบี้ + สำนักงานชั้น 2-5 (ปลัด, กองกลาง, กิจการท่องเที่ยว, ต่างประเทศ)",
    zoneIds: [1, 4, 5, 6, 7, 8, 9, 10, 11],
    hikvisionGroupId: "HIK-GRP-FL2-5",
    qrCodePrefix: "eVMS-OFA",
    validityMinutes: 120,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["official", "meeting", "document"],
    isActive: true,
    color: "#6A0DAD",
  },
  {
    id: 3,
    name: "ติดต่อราชการ ชั้น 6",
    nameEn: "Official — Floor 6",
    description: "เข้าล็อบบี้ + ชั้น 6 (กรมการท่องเที่ยว / ททท.)",
    zoneIds: [1, 12, 13],
    hikvisionGroupId: "HIK-GRP-FL6",
    qrCodePrefix: "eVMS-OFB",
    validityMinutes: 120,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["official", "meeting", "document"],
    isActive: true,
    color: "#2563EB",
  },
  {
    id: 4,
    name: "ติดต่อราชการ ชั้น 7-8",
    nameEn: "Official — Floor 7-8",
    description: "เข้าล็อบบี้ + ชั้น 7-8 (กรมพลศึกษา, มกช., กกท., ตร.ท่องเที่ยว, อพท.)",
    zoneIds: [1, 14, 15, 16],
    hikvisionGroupId: "HIK-GRP-FL7-8",
    qrCodePrefix: "eVMS-OFC",
    validityMinutes: 120,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["official", "meeting"],
    isActive: true,
    color: "#059669",
  },
  {
    id: 5,
    name: "ห้องประชุมรวม",
    nameEn: "All Meeting Rooms",
    description: "เข้าได้เฉพาะห้องประชุมทุกชั้น (ไม่รวมห้องประชุมรัฐมนตรี)",
    zoneIds: [1, 5, 7, 9, 11, 13, 15, 20],
    hikvisionGroupId: "HIK-GRP-MEETING",
    qrCodePrefix: "eVMS-MTG",
    validityMinutes: 180,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "07:30", endTime: "18:00" },
    allowedVisitTypes: ["meeting"],
    isActive: true,
    color: "#0891B2",
  },
  {
    id: 6,
    name: "VIP — สำนักงานรัฐมนตรี",
    nameEn: "VIP — Minister's Office",
    description: "เข้าชั้น 9 (ต้องได้รับอนุมัติพิเศษ)",
    zoneIds: [1, 18, 19],
    hikvisionGroupId: "HIK-GRP-VIP",
    qrCodePrefix: "eVMS-VIP",
    validityMinutes: 60,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "16:00" },
    allowedVisitTypes: ["official", "meeting"],
    isActive: true,
    color: "#DC2626",
  },
  {
    id: 7,
    name: "ผู้รับเหมา / ซ่อมบำรุง",
    nameEn: "Contractor / Maintenance",
    description: "เข้าพื้นที่ซ่อมบำรุง + ที่จอดรถ (มีเวลาจำกัด)",
    zoneIds: [1, 2, 3],
    hikvisionGroupId: "HIK-GRP-MAINT",
    qrCodePrefix: "eVMS-CTR",
    validityMinutes: 240,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "18:00" },
    allowedVisitTypes: ["contractor"],
    isActive: true,
    color: "#92400E",
  },
  {
    id: 8,
    name: "ที่จอดรถ",
    nameEn: "Parking Only",
    description: "เข้าได้เฉพาะลานจอดรถ",
    zoneIds: [2],
    hikvisionGroupId: "HIK-GRP-PARK",
    qrCodePrefix: "eVMS-PKG",
    validityMinutes: 480,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "06:00", endTime: "20:00" },
    allowedVisitTypes: ["official", "meeting", "contractor", "delivery", "other"],
    isActive: true,
    color: "#4B5563",
  },
  {
    id: 9,
    name: "รับ-ส่งสินค้า",
    nameEn: "Delivery / Pickup",
    description: "เข้าล็อบบี้ + ที่จอดรถ (จำกัดเวลา 30 นาที)",
    zoneIds: [1, 2],
    hikvisionGroupId: "HIK-GRP-DELIVERY",
    qrCodePrefix: "eVMS-DLV",
    validityMinutes: 30,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "06:00", endTime: "18:00" },
    allowedVisitTypes: ["delivery"],
    isActive: true,
    color: "#7C3AED",
  },
];

// ── Department → Access Group mapping ──

export const departmentAccessMappings: DepartmentAccessMapping[] = [
  { id: 1, departmentId: 1, defaultAccessGroupId: 2, additionalGroupIds: [5] },
  { id: 2, departmentId: 2, defaultAccessGroupId: 2, additionalGroupIds: [5] },
  { id: 3, departmentId: 3, defaultAccessGroupId: 2, additionalGroupIds: [5] },
  { id: 4, departmentId: 4, defaultAccessGroupId: 2, additionalGroupIds: [5] },
  { id: 5, departmentId: 5, defaultAccessGroupId: 3, additionalGroupIds: [5] },
  { id: 6, departmentId: 6, defaultAccessGroupId: 4, additionalGroupIds: [5] },
  { id: 7, departmentId: 7, defaultAccessGroupId: 4, additionalGroupIds: [5] },
  { id: 8, departmentId: 8, defaultAccessGroupId: 2, additionalGroupIds: [5] },
  { id: 9, departmentId: 9, defaultAccessGroupId: 6, additionalGroupIds: [2] },
  { id: 10, departmentId: 10, defaultAccessGroupId: 3, additionalGroupIds: [5] },
  { id: 11, departmentId: 11, defaultAccessGroupId: 4, additionalGroupIds: [5] },
  { id: 12, departmentId: 12, defaultAccessGroupId: 4, additionalGroupIds: [] },
  { id: 13, departmentId: 13, defaultAccessGroupId: 4, additionalGroupIds: [5] },
];

export const accessZoneTypeLabels: Record<AccessZoneType, { label: string; labelEn: string; icon: string }> = {
  office: { label: "สำนักงาน", labelEn: "Office", icon: "🏢" },
  "meeting-room": { label: "ห้องประชุม", labelEn: "Meeting Room", icon: "🗣️" },
  lobby: { label: "ล็อบบี้", labelEn: "Lobby", icon: "🚪" },
  parking: { label: "ที่จอดรถ", labelEn: "Parking", icon: "🅿️" },
  common: { label: "พื้นที่ส่วนกลาง", labelEn: "Common Area", icon: "🏛️" },
  restricted: { label: "พื้นที่ควบคุม", labelEn: "Restricted", icon: "🔒" },
  service: { label: "พื้นที่บริการ / ซ่อมบำรุง", labelEn: "Service / Maintenance", icon: "🔧" },
};

// ===== SERVICE POINTS (Kiosk & Counter) =====

export type ServicePointType = "kiosk" | "counter";
export type ServicePointStatus = "online" | "offline" | "maintenance";

export interface ServicePoint {
  id: number;
  name: string;
  nameEn: string;
  type: ServicePointType;
  status: ServicePointStatus;
  location: string;
  locationEn: string;
  building: string;
  floor: string;
  ipAddress: string;
  macAddress: string;
  serialNumber: string;
  todayTransactions: number;
  lastOnline?: string;
  assignedStaffId?: number;
  notes?: string;
  allowedPurposeIds: number[];    // IDs จาก visitPurposeConfigs
  allowedDocumentIds: number[];   // IDs จาก identityDocumentTypes
  isActive: boolean;
  /** Timeout settings per screen (seconds). Configurable from web admin. */
  timeoutConfig?: {
    pdpaConsent: number;       // default 120
    selectIdMethod: number;    // default 60
    idVerification: number;    // default 60
    dataPreview: number;       // default 120
    selectPurpose: number;     // default 60
    faceCapture: number;       // default 60
    qrScan: number;            // default 60
    appointmentPreview: number;// default 120
    successRedirect: number;   // default 10
  };
  /** WiFi configuration for guest visitors */
  wifiConfig?: {
    ssid: string;                  // default "MOTS-Guest"
    passwordPattern: string;       // default "mots{year}" — supports {year}, {yearBE}
    validityMode: "business-hours-close" | "fixed-duration"; // default "business-hours-close"
    fixedDurationMinutes?: number; // default 480 (8 hours)
  };
  /** PDPA consent screen configuration */
  pdpaConfig?: {
    requireScroll: boolean;  // default true — must scroll before accept
    retentionDays: number;   // default 90
  };
  /** Visit slip template overrides */
  slipConfig?: {
    headerText: string;      // default "กระทรวงการท่องเที่ยวและกีฬา"
    footerText: string;      // default "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร"
  };
  /** Whether this kiosk/counter follows business hours rules */
  followBusinessHours?: boolean; // default true
  /** ID number masking pattern */
  idMaskingPattern?: string;     // default "show-first1-last5"
  /** Admin PIN for kiosk configuration (5 digits) */
  adminPin?: string;             // default "10210"
}

export const servicePoints: ServicePoint[] = [
  {
    id: 1, name: "ตู้ Kiosk ล็อบบี้หลัก", nameEn: "Main Lobby Kiosk", type: "kiosk", status: "online",
    location: "ล็อบบี้ ชั้น 1 ประตูหลัก", locationEn: "Main Lobby, Gate 1",
    building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1",
    ipAddress: "192.168.1.101", macAddress: "AA:BB:CC:DD:01:01", serialNumber: "KIOSK-2024-001",
    todayTransactions: 42, lastOnline: "2569-03-08T14:30:00",
    allowedPurposeIds: [1, 2, 5], allowedDocumentIds: [1, 2, 4, 5], isActive: true,
    timeoutConfig: { pdpaConsent: 120, selectIdMethod: 60, idVerification: 60, dataPreview: 120, selectPurpose: 60, faceCapture: 60, qrScan: 60, appointmentPreview: 120, successRedirect: 10 },
    wifiConfig: { ssid: "MOTS-Guest", passwordPattern: "mots{year}", validityMode: "business-hours-close", fixedDurationMinutes: 480 },
    pdpaConfig: { requireScroll: true, retentionDays: 90 },
    slipConfig: { headerText: "กระทรวงการท่องเที่ยวและกีฬา", footerText: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร" },
    followBusinessHours: true,
    idMaskingPattern: "show-first1-last5",
    adminPin: "10210",
  },
  {
    id: 2, name: "ตู้ Kiosk ล็อบบี้ฝั่งตะวันออก", nameEn: "East Lobby Kiosk", type: "kiosk", status: "offline",
    location: "ล็อบบี้ ชั้น 1 ประตูฝั่งตะวันออก", locationEn: "East Lobby, Side Gate",
    building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1",
    ipAddress: "192.168.1.102", macAddress: "AA:BB:CC:DD:01:02", serialNumber: "KIOSK-2024-002",
    todayTransactions: 28, lastOnline: "2569-03-08T14:28:00",
    allowedPurposeIds: [1, 3, 4], allowedDocumentIds: [1, 3, 5], isActive: true,
    timeoutConfig: { pdpaConsent: 120, selectIdMethod: 60, idVerification: 60, dataPreview: 120, selectPurpose: 60, faceCapture: 60, qrScan: 60, appointmentPreview: 120, successRedirect: 10 },
    wifiConfig: { ssid: "MOTS-Guest", passwordPattern: "mots{year}", validityMode: "business-hours-close", fixedDurationMinutes: 480 },
    pdpaConfig: { requireScroll: true, retentionDays: 90 },
    slipConfig: { headerText: "กระทรวงการท่องเที่ยวและกีฬา", footerText: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร" },
    followBusinessHours: true,
    idMaskingPattern: "show-first1-last5",
    adminPin: "10210",
  },
  {
    id: 3, name: "จุดบริการ Counter 1", nameEn: "Service Counter 1", type: "counter", status: "online",
    location: "เคาน์เตอร์ รปภ. ประตูหลัก", locationEn: "Security Counter, Main Gate",
    building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1",
    ipAddress: "192.168.1.201", macAddress: "AA:BB:CC:DD:02:01", serialNumber: "CTR-2024-001",
    todayTransactions: 67, lastOnline: "2569-03-08T14:30:00", assignedStaffId: 6,
    allowedPurposeIds: [1, 2, 3, 4, 5], allowedDocumentIds: [1, 2, 3, 4, 5], isActive: true,
    followBusinessHours: true,
    adminPin: "10210",
  },
  {
    id: 4, name: "จุดบริการ Counter 2", nameEn: "Service Counter 2", type: "counter", status: "online",
    location: "เคาน์เตอร์ รปภ. ประตูหลัก", locationEn: "Security Counter, Main Gate",
    building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1",
    ipAddress: "192.168.1.202", macAddress: "AA:BB:CC:DD:02:02", serialNumber: "CTR-2024-002",
    todayTransactions: 53, lastOnline: "2569-03-08T14:29:00", assignedStaffId: 7,
    allowedPurposeIds: [1, 2, 3, 4, 5], allowedDocumentIds: [1, 2, 3, 4, 5], isActive: true,
    followBusinessHours: true,
    adminPin: "10210",
  },
];

// ===== COUNTER STAFF ASSIGNMENTS =====

export interface CounterStaffAssignment {
  id: number;
  servicePointId: number;
  staffId: number;
  isPrimary: boolean;
  assignedAt: string;
}

export const counterStaffAssignments: CounterStaffAssignment[] = [
  { id: 1, servicePointId: 3, staffId: 6, isPrimary: true, assignedAt: "2569-01-15T09:00:00" },
  { id: 2, servicePointId: 3, staffId: 11, isPrimary: false, assignedAt: "2569-02-01T09:00:00" },
  { id: 3, servicePointId: 4, staffId: 12, isPrimary: true, assignedAt: "2569-01-15T09:00:00" },
  { id: 4, servicePointId: 4, staffId: 6, isPrimary: false, assignedAt: "2569-02-10T09:00:00" },
  { id: 5, servicePointId: 4, staffId: 11, isPrimary: false, assignedAt: "2569-03-01T09:00:00" },
];

/** คืน counter ที่พนักงานคนนี้มีสิทธิ์ทำงานได้ (เฉพาะ online + active) */
export function getAuthorizedCounters(staffId: number): ServicePoint[] {
  const assignedIds = counterStaffAssignments
    .filter((a) => a.staffId === staffId)
    .map((a) => a.servicePointId);
  return servicePoints.filter(
    (sp) => sp.type === "counter" && sp.isActive && assignedIds.includes(sp.id)
  );
}

/** คืนเจ้าหน้าที่ที่ assign อยู่ใน counter นี้ */
export function getAssignedStaff(servicePointId: number): (Staff & { isPrimary: boolean })[] {
  const assignments = counterStaffAssignments.filter((a) => a.servicePointId === servicePointId);
  return assignments
    .map((a) => {
      const staff = staffMembers.find((s) => s.id === a.staffId);
      return staff ? { ...staff, isPrimary: a.isPrimary } : null;
    })
    .filter(Boolean) as (Staff & { isPrimary: boolean })[];
}

// ===== DOCUMENT TYPES =====

export type DocumentCategory = "identification" | "authorization" | "vehicle" | "other";

export interface DocumentType {
  id: number;
  name: string;
  nameEn: string;
  category: DocumentCategory;
  isRequired: boolean;
  applicableVisitTypes: VisitType[];
  requirePhoto: boolean;
  description?: string;
  isActive: boolean;
  order: number;
}

export const documentTypes: DocumentType[] = [
  { id: 1, name: "บัตรประจำตัวประชาชน", nameEn: "Thai National ID Card", category: "identification", isRequired: true, applicableVisitTypes: ["official", "meeting", "document", "contractor", "delivery", "other"], requirePhoto: true, description: "บัตรประชาชนตัวจริง สำหรับบุคคลสัญชาติไทย", isActive: true, order: 1 },
  { id: 2, name: "หนังสือเดินทาง (Passport)", nameEn: "Passport", category: "identification", isRequired: true, applicableVisitTypes: ["official", "meeting", "document", "contractor", "delivery", "other"], requirePhoto: true, description: "สำหรับบุคคลต่างชาติ", isActive: true, order: 2 },
  { id: 3, name: "ใบขับขี่", nameEn: "Driver's License", category: "identification", isRequired: false, applicableVisitTypes: ["official", "meeting", "document", "contractor", "delivery", "other"], requirePhoto: true, description: "ใช้แทนบัตรประชาชนได้เฉพาะกรณี walk-in", isActive: true, order: 3 },
  { id: 4, name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", nameEn: "Government Officer ID", category: "identification", isRequired: false, applicableVisitTypes: ["official", "meeting"], requirePhoto: true, description: "บัตรประจำตัวข้าราชการ", isActive: true, order: 4 },
];

export const documentCategoryLabels: Record<DocumentCategory, { label: string; labelEn: string; icon: string }> = {
  identification: { label: "เอกสารระบุตัวตน", labelEn: "Identification", icon: "🪪" },
  authorization: { label: "เอกสารมอบอำนาจ / รับรอง", labelEn: "Authorization", icon: "📜" },
  vehicle: { label: "เอกสารยานพาหนะ", labelEn: "Vehicle", icon: "🚗" },
  other: { label: "เอกสารอื่นๆ", labelEn: "Other", icon: "📎" },
};

// ===== BUSINESS HOURS =====

export interface BusinessHoursRule {
  id: number;
  name: string;
  nameEn: string;
  type: "regular" | "special" | "holiday";
  daysOfWeek?: number[];          // 0=Sun ... 6=Sat (for regular)
  specificDate?: string;          // YYYY-MM-DD (for special/holiday)
  openTime: string;               // HH:mm
  closeTime: string;              // HH:mm
  allowWalkin: boolean;
  allowKiosk: boolean;
  notes?: string;
  isActive: boolean;
}

export const businessHoursRules: BusinessHoursRule[] = [
  { id: 1, name: "วันทำการปกติ (จ-ศ)", nameEn: "Regular Weekdays (Mon-Fri)", type: "regular", daysOfWeek: [1, 2, 3, 4, 5], openTime: "08:30", closeTime: "16:30", allowWalkin: true, allowKiosk: true, isActive: true },
  { id: 2, name: "วันเสาร์ (เปิดครึ่งวัน)", nameEn: "Saturday (Half Day)", type: "regular", daysOfWeek: [6], openTime: "09:00", closeTime: "12:00", allowWalkin: true, allowKiosk: true, notes: "เปิดเฉพาะบางแผนก", isActive: true },
  { id: 3, name: "วันอาทิตย์ (ปิด)", nameEn: "Sunday (Closed)", type: "regular", daysOfWeek: [0], openTime: "00:00", closeTime: "00:00", allowWalkin: false, allowKiosk: false, isActive: true },
  { id: 4, name: "วันจักรี", nameEn: "Chakri Memorial Day", type: "holiday", specificDate: "2569-04-06", openTime: "00:00", closeTime: "00:00", allowWalkin: false, allowKiosk: false, notes: "วันหยุดราชการ", isActive: true },
  { id: 5, name: "สงกรานต์", nameEn: "Songkran Festival", type: "holiday", specificDate: "2569-04-13", openTime: "00:00", closeTime: "00:00", allowWalkin: false, allowKiosk: false, notes: "วันหยุดสงกรานต์ 13-15 เม.ย.", isActive: true },
  { id: 6, name: "งานสัมมนาพิเศษ", nameEn: "Special Seminar Event", type: "special", specificDate: "2569-03-20", openTime: "07:00", closeTime: "20:00", allowWalkin: true, allowKiosk: true, notes: "เปิดนอกเวลาสำหรับสัมมนาประจำปี", isActive: true },
];

// ===== NOTIFICATION TEMPLATES =====

export type NotificationChannel = "line" | "email" | "sms";
export type NotificationTrigger = "booking-confirmed" | "booking-approved" | "booking-rejected" | "reminder-1day" | "reminder-1hour" | "checkin-welcome" | "checkout-thankyou" | "overstay-alert" | "wifi-credentials";

export interface NotificationTemplate {
  id: number;
  name: string;
  nameEn: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  subject?: string;
  bodyTh: string;
  bodyEn: string;
  variables: string[];
  isActive: boolean;
}

export const notificationTriggerLabels: Record<NotificationTrigger, { label: string; labelEn: string }> = {
  "booking-confirmed": { label: "ยืนยันการจอง", labelEn: "Booking Confirmed" },
  "booking-approved": { label: "อนุมัติแล้ว", labelEn: "Booking Approved" },
  "booking-rejected": { label: "ไม่อนุมัติ", labelEn: "Booking Rejected" },
  "reminder-1day": { label: "เตือนล่วงหน้า 1 วัน", labelEn: "1-Day Reminder" },
  "reminder-1hour": { label: "เตือนล่วงหน้า 1 ชม.", labelEn: "1-Hour Reminder" },
  "checkin-welcome": { label: "ต้อนรับเข้าพื้นที่", labelEn: "Check-in Welcome" },
  "checkout-thankyou": { label: "ขอบคุณเมื่อออก", labelEn: "Check-out Thank You" },
  "overstay-alert": { label: "แจ้งเตือนเกินเวลา", labelEn: "Overstay Alert" },
  "wifi-credentials": { label: "ข้อมูล WiFi", labelEn: "WiFi Credentials" },
};

export const notificationTemplates: NotificationTemplate[] = [
  { id: 1, name: "แจ้งยืนยันจอง (LINE)", nameEn: "Booking Confirmed (LINE)", trigger: "booking-confirmed", channel: "line", bodyTh: "สวัสดีค่ะ คุณ{{visitorName}} 🎉\nการจองเลขที่ {{bookingCode}} ได้รับการยืนยันแล้ว\n📅 วันที่: {{date}}\n⏰ เวลา: {{time}}\n📍 สถานที่: {{location}}\n\nกรุณาแสดง QR Code ณ จุดลงทะเบียน", bodyEn: "Hello {{visitorName}} 🎉\nBooking {{bookingCode}} confirmed.\n📅 Date: {{date}}\n⏰ Time: {{time}}\n📍 Location: {{location}}\n\nPlease show your QR Code at the registration point.", variables: ["visitorName", "bookingCode", "date", "time", "location"], isActive: true },
  { id: 2, name: "แจ้งอนุมัติ (LINE)", nameEn: "Approved (LINE)", trigger: "booking-approved", channel: "line", bodyTh: "✅ คำขอเข้าพื้นที่ {{bookingCode}} ได้รับการอนุมัติแล้ว\nผู้อนุมัติ: {{approverName}}\nกรุณาตรวจสอบรายละเอียดใน LINE Rich Menu", bodyEn: "✅ Visit request {{bookingCode}} has been approved.\nApproved by: {{approverName}}", variables: ["bookingCode", "approverName"], isActive: true },
  { id: 3, name: "แจ้งไม่อนุมัติ (LINE)", nameEn: "Rejected (LINE)", trigger: "booking-rejected", channel: "line", bodyTh: "❌ คำขอเข้าพื้นที่ {{bookingCode}} ไม่ได้รับการอนุมัติ\nเหตุผล: {{reason}}\nหากมีข้อสงสัย กรุณาติดต่อ {{contactNumber}}", bodyEn: "❌ Visit request {{bookingCode}} was rejected.\nReason: {{reason}}", variables: ["bookingCode", "reason", "contactNumber"], isActive: true },
  { id: 4, name: "เตือนล่วงหน้า 1 วัน (LINE)", nameEn: "1-Day Reminder (LINE)", trigger: "reminder-1day", channel: "line", bodyTh: "📢 เตือน: พรุ่งนี้คุณมีนัดหมาย {{bookingCode}}\n📅 {{date}} เวลา {{time}}\n📍 {{location}}\nอย่าลืมเตรียมบัตรประชาชน!", bodyEn: "📢 Reminder: Tomorrow you have appointment {{bookingCode}}\n📅 {{date}} at {{time}}\n📍 {{location}}", variables: ["bookingCode", "date", "time", "location"], isActive: true },
  { id: 5, name: "ต้อนรับ Check-in (LINE)", nameEn: "Welcome Check-in (LINE)", trigger: "checkin-welcome", channel: "line", bodyTh: "🏢 ยินดีต้อนรับคุณ {{visitorName}}\nเข้าพื้นที่สำเร็จเมื่อ {{checkinTime}}\n📍 พื้นที่: {{zone}}\n⏰ กรุณาออกก่อน {{checkoutTime}}", bodyEn: "🏢 Welcome {{visitorName}}\nChecked in at {{checkinTime}}\n📍 Zone: {{zone}}", variables: ["visitorName", "checkinTime", "zone", "checkoutTime"], isActive: true },
  { id: 6, name: "แจ้งยืนยัน (Email)", nameEn: "Booking Confirmed (Email)", trigger: "booking-confirmed", channel: "email", subject: "ยืนยันการจองเข้าพื้นที่ — {{bookingCode}}", bodyTh: "เรียน คุณ{{visitorName}}\n\nการจองเข้าพื้นที่เลขที่ {{bookingCode}} ได้รับการยืนยันเรียบร้อย\nรายละเอียด:\n- วันที่: {{date}}\n- เวลา: {{time}}\n- สถานที่: {{location}}\n- ผู้ติดต่อ: {{hostName}}\n\nกรุณาเตรียมบัตรประชาชนและแสดง QR Code ณ จุดลงทะเบียน", bodyEn: "Dear {{visitorName}},\n\nYour visit {{bookingCode}} has been confirmed.\nDetails:\n- Date: {{date}}\n- Time: {{time}}\n- Location: {{location}}\n- Host: {{hostName}}", variables: ["visitorName", "bookingCode", "date", "time", "location", "hostName"], isActive: true },
  { id: 7, name: "แจ้งเตือนเกินเวลา (LINE)", nameEn: "Overstay Alert (LINE)", trigger: "overstay-alert", channel: "line", bodyTh: "⚠️ แจ้งเตือน: คุณ {{visitorName}} อยู่เกินเวลาที่กำหนด\nเวลาที่ควรออก: {{checkoutTime}}\nกรุณาดำเนินการออกจากพื้นที่โดยเร็ว", bodyEn: "⚠️ Alert: {{visitorName}} has exceeded allowed time.\nExpected checkout: {{checkoutTime}}", variables: ["visitorName", "checkoutTime"], isActive: true },
  { id: 8, name: "ข้อมูล WiFi (LINE)", nameEn: "WiFi Credentials (LINE)", trigger: "wifi-credentials", channel: "line", bodyTh: "📶 ข้อมูล WiFi สำหรับผู้เยี่ยม\nSSID: {{wifiSSID}}\nUsername: {{wifiUsername}}\nPassword: {{wifiPassword}}\nใช้ได้ถึง: {{expiry}}", bodyEn: "📶 Guest WiFi Credentials\nSSID: {{wifiSSID}}\nUsername: {{wifiUsername}}\nPassword: {{wifiPassword}}\nValid until: {{expiry}}", variables: ["wifiSSID", "wifiUsername", "wifiPassword", "expiry"], isActive: true },
];

// ===== VISIT SLIP TEMPLATES =====

export type SlipSize = "a4" | "a5" | "thermal-80mm" | "thermal-58mm" | "badge-card";

export interface SlipField {
  key: string;
  label: string;
  labelEn: string;
  enabled: boolean;
}

export interface VisitSlipTemplate {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  size: SlipSize;
  orientation: "portrait" | "landscape";
  showLogo: boolean;
  showQrCode: boolean;
  showPhoto: boolean;
  showBarcode: boolean;
  fields: SlipField[];
  headerText: string;
  footerText: string;
  isDefault: boolean;
  isActive: boolean;
  previewColor: string;
}

export const slipSizeLabels: Record<SlipSize, { label: string; labelEn: string; dimensions: string }> = {
  a4: { label: "A4", labelEn: "A4", dimensions: "210 × 297 mm" },
  a5: { label: "A5", labelEn: "A5", dimensions: "148 × 210 mm" },
  "thermal-80mm": { label: "ใบเสร็จ 80mm", labelEn: "Thermal 80mm", dimensions: "80mm roll" },
  "thermal-58mm": { label: "ใบเสร็จ 58mm", labelEn: "Thermal 58mm", dimensions: "58mm roll" },
  "badge-card": { label: "บัตรติดหน้าอก", labelEn: "Badge Card", dimensions: "86 × 54 mm (CR80)" },
};

export const defaultSlipFields: SlipField[] = [
  { key: "visitorName", label: "ชื่อ-นามสกุล ผู้เยี่ยม", labelEn: "Visitor Name", enabled: true },
  { key: "visitorCompany", label: "บริษัท / หน่วยงาน", labelEn: "Company", enabled: true },
  { key: "idNumber", label: "เลขบัตรประชาชน / Passport", labelEn: "ID Number", enabled: true },
  { key: "hostName", label: "ผู้ติดต่อ / ผู้รับ", labelEn: "Host Name", enabled: true },
  { key: "department", label: "แผนก / หน่วยงานที่พบ", labelEn: "Department", enabled: true },
  { key: "visitPurpose", label: "วัตถุประสงค์", labelEn: "Visit Purpose", enabled: true },
  { key: "visitDate", label: "วันที่เข้าพื้นที่", labelEn: "Visit Date", enabled: true },
  { key: "timeIn", label: "เวลาเข้า", labelEn: "Time In", enabled: true },
  { key: "timeOut", label: "เวลาที่ต้องออก", labelEn: "Time Out", enabled: true },
  { key: "accessZone", label: "โซนที่อนุญาต", labelEn: "Allowed Zone", enabled: true },
  { key: "companions", label: "จำนวนผู้ติดตาม", labelEn: "Companions", enabled: false },
  { key: "vehiclePlate", label: "ทะเบียนรถ", labelEn: "Vehicle Plate", enabled: false },
  { key: "bookingCode", label: "รหัสนัดหมาย", labelEn: "Booking Code", enabled: true },
  { key: "wifiInfo", label: "ข้อมูล WiFi", labelEn: "WiFi Info", enabled: false },
];

export const visitSlipTemplates: VisitSlipTemplate[] = [
  {
    id: 1,
    name: "แบบมาตรฐาน (A5)",
    nameEn: "Standard (A5)",
    description: "แบบฟอร์มมาตรฐาน พิมพ์ A5 สำหรับผู้เยี่ยมทั่วไป",
    size: "a5",
    orientation: "portrait",
    showLogo: true, showQrCode: true, showPhoto: false, showBarcode: true,
    fields: defaultSlipFields.map(f => ({ ...f })),
    headerText: "บัตรผู้เยี่ยม / Visitor Pass — กระทรวงการท่องเที่ยวและกีฬา",
    footerText: "กรุณาคืนบัตรเมื่อออกจากพื้นที่ / Please return this pass upon exit",
    isDefault: true, isActive: true, previewColor: "#6A0DAD",
  },
  {
    id: 2,
    name: "แบบ Badge Card",
    nameEn: "Badge Card",
    description: "บัตรติดหน้าอก ขนาด CR80 สำหรับงานประชุม/สัมมนา",
    size: "badge-card",
    orientation: "landscape",
    showLogo: true, showQrCode: true, showPhoto: true, showBarcode: false,
    fields: defaultSlipFields.map(f => ({ ...f, enabled: ["visitorName", "visitorCompany", "visitPurpose", "visitDate", "accessZone", "bookingCode"].includes(f.key) })),
    headerText: "บัตรผู้เยี่ยม / Visitor Badge",
    footerText: "กรุณาติดบัตรตลอดเวลาที่อยู่ในพื้นที่",
    isDefault: false, isActive: true, previewColor: "#D4AF37",
  },
  {
    id: 3,
    name: "แบบ Thermal 80mm (ใบเสร็จ)",
    nameEn: "Thermal 80mm Receipt",
    description: "พิมพ์จากเครื่องพิมพ์ thermal สำหรับ Kiosk / Counter",
    size: "thermal-80mm",
    orientation: "portrait",
    showLogo: true, showQrCode: true, showPhoto: false, showBarcode: true,
    fields: defaultSlipFields.map(f => ({ ...f, enabled: ["visitorName", "visitPurpose", "visitDate", "timeIn", "timeOut", "accessZone", "bookingCode"].includes(f.key) })),
    headerText: "=== บัตรผู้เยี่ยม ===",
    footerText: "--- กรุณาคืนบัตรเมื่อออก ---",
    isDefault: false, isActive: true, previewColor: "#333333",
  },
  {
    id: 4,
    name: "แบบ VIP (A5 สีทอง)",
    nameEn: "VIP Pass (A5 Gold)",
    description: "สำหรับแขก VIP / ผู้บริหารระดับสูง มีธีมสีทอง",
    size: "a5",
    orientation: "portrait",
    showLogo: true, showQrCode: true, showPhoto: true, showBarcode: false,
    fields: defaultSlipFields.map(f => ({ ...f, enabled: ["visitorName", "visitorCompany", "hostName", "department", "visitPurpose", "visitDate", "timeIn", "accessZone", "bookingCode"].includes(f.key) })),
    headerText: "VIP Visitor Pass — Ministry of Tourism and Sports",
    footerText: "Welcome to the Ministry of Tourism and Sports",
    isDefault: false, isActive: true, previewColor: "#D4AF37",
  },
  {
    id: 5,
    name: "แบบผู้รับเหมา (A5)",
    nameEn: "Contractor Pass (A5)",
    description: "สำหรับผู้รับเหมา/ซ่อมบำรุง แสดงข้อมูลเครื่องมือ",
    size: "a5",
    orientation: "portrait",
    showLogo: true, showQrCode: true, showPhoto: false, showBarcode: true,
    fields: defaultSlipFields.map(f => ({ ...f, enabled: ["visitorName", "visitorCompany", "idNumber", "hostName", "department", "visitPurpose", "visitDate", "timeIn", "timeOut", "accessZone", "companions", "vehiclePlate", "bookingCode"].includes(f.key) })),
    headerText: "บัตรผู้รับเหมา / Contractor Pass",
    footerText: "ห้ามเข้าพื้นที่นอกเหนือจากที่ระบุ / Access restricted to designated zones only",
    isDefault: false, isActive: true, previewColor: "#E65100",
  },
];

// ===== VISIT PURPOSE → SLIP TEMPLATE MAPPING =====

export interface PurposeSlipMapping {
  id: number;
  visitPurposeId: number;
  slipTemplateId: number | null;  // null = ใช้แบบ default ของระบบ
}

export const purposeSlipMappings: PurposeSlipMapping[] = [
  { id: 1, visitPurposeId: 1, slipTemplateId: null },           // ติดต่อราชการ → ใช้แบบมาตรฐาน
  { id: 2, visitPurposeId: 2, slipTemplateId: 2 },       // ประชุม → Badge Card
  { id: 3, visitPurposeId: 3, slipTemplateId: 3 },       // ส่งเอกสาร → Thermal
  { id: 4, visitPurposeId: 4, slipTemplateId: 5 },       // ผู้รับเหมา → Contractor Pass
  { id: 5, visitPurposeId: 5, slipTemplateId: null },           // สมัครงาน → ใช้แบบมาตรฐาน
  { id: 6, visitPurposeId: 6, slipTemplateId: 4 },       // เยี่ยมชม → VIP
  { id: 7, visitPurposeId: 7, slipTemplateId: 3 },       // รับ-ส่งสินค้า → Thermal
  { id: 8, visitPurposeId: 8, slipTemplateId: null },           // อื่นๆ → ใช้แบบมาตรฐาน
];

// ===== APPROVER GROUPS =====

export type ApproverNotifyChannel = "line" | "email" | "web-app";

export interface ApproverMember {
  staffId: number;
  canApprove: boolean;             // สามารถกดอนุมัติ / ปฏิเสธ ได้
  receiveNotification: boolean;    // ได้รับแจ้งเตือนเมื่อมีรายการใหม่
}

export interface ApproverGroup {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  departmentId: number;            // แผนกที่รับผิดชอบ
  visitPurposeIds: number[];       // วัตถุประสงค์ที่ใช้กลุ่มนี้อนุมัติ
  members: ApproverMember[];
  notifyChannels: ApproverNotifyChannel[];  // ช่องทางแจ้งเตือน (เลือกได้มากกว่า 1)
  isActive: boolean;
}

export const approverGroups: ApproverGroup[] = [
  {
    id: 1,
    name: "ผู้อนุมัติ สำนักงานปลัด (ราชการ+ประชุม)",
    nameEn: "OPS Approvers (Official+Meeting)",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานปลัดกระทรวง",
    departmentId: 1,
    visitPurposeIds: [1, 2],
    members: [
      { staffId: 5, canApprove: true,  receiveNotification: true },
      { staffId: 1, canApprove: true,  receiveNotification: true },
      { staffId: 4, canApprove: false, receiveNotification: true },
    ],
    notifyChannels: ["line", "email", "web-app"],
    isActive: true,
  },
  {
    id: 2,
    name: "ผู้อนุมัติ สำนักงานปลัด (อื่นๆ)",
    nameEn: "OPS Approvers (Other)",
    description: "กลุ่มผู้อนุมัติสำหรับ วัตถุประสงค์อื่นๆ ที่ สำนักงานปลัดกระทรวง",
    departmentId: 1,
    visitPurposeIds: [8],
    members: [
      { staffId: 5, canApprove: true,  receiveNotification: true },
      { staffId: 4, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "web-app"],
    isActive: true,
  },
  {
    id: 3,
    name: "ผู้อนุมัติ กองกลาง (ราชการ+อื่นๆ)",
    nameEn: "General Admin Approvers (Official+Other)",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / อื่นๆ ที่ กองกลาง",
    departmentId: 2,
    visitPurposeIds: [1, 8],
    members: [
      { staffId: 2, canApprove: true,  receiveNotification: true },
      { staffId: 6, canApprove: false, receiveNotification: true },
    ],
    notifyChannels: ["line", "email"],
    isActive: true,
  },
  {
    id: 4,
    name: "ผู้อนุมัติ กองกลาง (ผู้รับเหมา)",
    nameEn: "General Admin Approvers (Contractor)",
    description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กองกลาง",
    departmentId: 2,
    visitPurposeIds: [4],
    members: [
      { staffId: 2, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "email"],
    isActive: true,
  },
  {
    id: 5,
    name: "ผู้อนุมัติ กองการต่างประเทศ",
    nameEn: "International Approvers",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ กองการต่างประเทศ",
    departmentId: 3,
    visitPurposeIds: [1, 2],
    members: [
      { staffId: 3, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "web-app"],
    isActive: true,
  },
  {
    id: 6,
    name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (ราชการ+เอกสาร)",
    nameEn: "Tourism Affairs Approvers (Official+Docs)",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ส่งเอกสาร ที่ กองกิจการท่องเที่ยว",
    departmentId: 4,
    visitPurposeIds: [1, 3],
    members: [
      { staffId: 1, canApprove: true,  receiveNotification: true },
      { staffId: 4, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["email", "web-app"],
    isActive: true,
  },
  {
    id: 7,
    name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (เยี่ยมชม)",
    nameEn: "Tourism Affairs Approvers (Tour)",
    description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กองกิจการท่องเที่ยว",
    departmentId: 4,
    visitPurposeIds: [6],
    members: [
      { staffId: 1, canApprove: true,  receiveNotification: true },
      { staffId: 4, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["email", "web-app"],
    isActive: true,
  },
  {
    id: 8,
    name: "ผู้อนุมัติ กรมการท่องเที่ยว (เยี่ยมชม)",
    nameEn: "Dept. of Tourism Approvers (Tour)",
    description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กรมการท่องเที่ยว",
    departmentId: 5,
    visitPurposeIds: [6],
    members: [
      { staffId: 1, canApprove: true,  receiveNotification: true },
      { staffId: 3, canApprove: true,  receiveNotification: false },
    ],
    notifyChannels: ["line", "email", "web-app"],
    isActive: true,
  },
  {
    id: 9,
    name: "ผู้อนุมัติ กรมพลศึกษา (ผู้รับเหมา)",
    nameEn: "Dept. of PE Approvers (Contractor)",
    description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กรมพลศึกษา",
    departmentId: 6,
    visitPurposeIds: [4],
    members: [
      { staffId: 2, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["web-app"],
    isActive: true,
  },
  {
    id: 10,
    name: "ผู้อนุมัติ สำนักงานรัฐมนตรี (VIP)",
    nameEn: "Minister Office Approvers (VIP)",
    description: "กลุ่มผู้อนุมัติ VIP สำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานรัฐมนตรี",
    departmentId: 9,
    visitPurposeIds: [1, 2],
    members: [
      { staffId: 5, canApprove: true,  receiveNotification: true },
      { staffId: 1, canApprove: true,  receiveNotification: true },
      { staffId: 4, canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "email", "web-app"],
    isActive: true,
  },
];

// ===== PDPA CONSENT VERSION MANAGEMENT =====

export type PdpaDisplayChannel = "kiosk" | "line";

export interface PdpaVersion {
  id: number;
  configId: number;
  version: number;
  textTh: string;
  textEn: string;
  retentionDays: number;
  requireScroll: boolean;
  isActive: boolean;
  effectiveDate: string;
  changedBy: number | null;
  changedByName: string | null;
  changeNote: string;
  createdAt: string;
  displayChannels: PdpaDisplayChannel[];
}

export interface PdpaConsentLog {
  id: number;
  visitorId: number;
  visitorName: string;
  visitorIdCard: string;
  configVersion: number;
  consentChannel: "kiosk" | "line" | "counter" | "web";
  ipAddress: string | null;
  deviceId: string | null;
  consentedAt: string;
  expiresAt: string;
}

const pdpaTextThV1 = `พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

กระทรวงการท่องเที่ยวและกีฬา ("หน่วยงาน") จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:

1. การยืนยันตัวตนและลงทะเบียนผู้มาติดต่อ
2. การรักษาความปลอดภัยของสถานที่
3. การบันทึกประวัติการเข้า-ออกอาคาร
4. การติดต่อสื่อสารกรณีฉุกเฉิน

ข้อมูลที่เก็บรวบรวม:
• ชื่อ-นามสกุล
• เลขบัตรประจำตัวประชาชน/หนังสือเดินทาง
• ภาพถ่ายใบหน้า
• ข้อมูลการติดต่อ

ระยะเวลาการจัดเก็บ:
ข้อมูลจะถูกจัดเก็บไว้เป็นระยะเวลา 90 วัน นับจากวันที่เข้าเยี่ยมชม หลังจากนั้นจะถูกลบออกจากระบบโดยอัตโนมัติ`;

const pdpaTextEnV1 = `Personal Data Protection Act B.E. 2562 (PDPA)

The Ministry of Tourism and Sports ("the Organization") will collect, use, and disclose your personal data for the following purposes:

1. Identity verification and visitor registration
2. Premises security maintenance
3. Building entry/exit records
4. Emergency communication

Data Collected:
• Full name
• National ID / Passport number
• Facial photograph
• Contact information

Retention Period:
Data will be retained for 90 days from the date of visit, after which it will be automatically deleted from the system.`;

const pdpaTextThV2 = `พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

กระทรวงการท่องเที่ยวและกีฬา ("หน่วยงาน") จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:

1. การยืนยันตัวตนและลงทะเบียนผู้มาติดต่อ
2. การรักษาความปลอดภัยของสถานที่
3. การบันทึกประวัติการเข้า-ออกอาคาร
4. การติดต่อสื่อสารกรณีฉุกเฉิน
5. การจัดทำสถิติและปรับปรุงบริการ

ข้อมูลที่เก็บรวบรวม:
• ชื่อ-นามสกุล
• เลขบัตรประจำตัวประชาชน/หนังสือเดินทาง
• ภาพถ่ายใบหน้า
• ข้อมูลการติดต่อ
• ทะเบียนรถยนต์ (ถ้ามี)

สิทธิของเจ้าของข้อมูล:
ท่านมีสิทธิในการเข้าถึง แก้ไข ลบ หรือขอสำเนาข้อมูลส่วนบุคคลของท่าน รวมถึงสิทธิในการเพิกถอนความยินยอม โดยสามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลได้ที่เคาน์เตอร์ประชาสัมพันธ์

ระยะเวลาการจัดเก็บ:
ข้อมูลจะถูกจัดเก็บไว้เป็นระยะเวลา 90 วัน นับจากวันที่เข้าเยี่ยมชม หลังจากนั้นจะถูกลบออกจากระบบโดยอัตโนมัติ`;

const pdpaTextEnV2 = `Personal Data Protection Act B.E. 2562 (PDPA)

The Ministry of Tourism and Sports ("the Organization") will collect, use, and disclose your personal data for the following purposes:

1. Identity verification and visitor registration
2. Premises security maintenance
3. Building entry/exit records
4. Emergency communication
5. Statistical analysis and service improvement

Data Collected:
• Full name
• National ID / Passport number
• Facial photograph
• Contact information
• Vehicle registration (if applicable)

Data Subject Rights:
You have the right to access, correct, delete, or request copies of your personal data, including the right to withdraw consent. Please contact the Data Protection Officer at the reception counter.

Retention Period:
Data will be retained for 90 days from the date of visit, after which it will be automatically deleted from the system.`;

const pdpaTextThV3 = `พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

กระทรวงการท่องเที่ยวและกีฬา ("หน่วยงาน") จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:

1. การยืนยันตัวตนและลงทะเบียนผู้มาติดต่อ
2. การรักษาความปลอดภัยของสถานที่
3. การบันทึกประวัติการเข้า-ออกอาคาร
4. การติดต่อสื่อสารกรณีฉุกเฉิน
5. การจัดทำสถิติและปรับปรุงบริการ

ข้อมูลที่เก็บรวบรวม:
• ชื่อ-นามสกุล
• เลขบัตรประจำตัวประชาชน/หนังสือเดินทาง
• ภาพถ่ายใบหน้า
• ข้อมูลการติดต่อ
• ทะเบียนรถยนต์ (ถ้ามี)

สิทธิของเจ้าของข้อมูล:
ท่านมีสิทธิในการเข้าถึง แก้ไข ลบ หรือขอสำเนาข้อมูลส่วนบุคคลของท่าน รวมถึงสิทธิในการเพิกถอนความยินยอม โดยสามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลได้ที่เคาน์เตอร์ประชาสัมพันธ์

การเปิดเผยข้อมูล:
หน่วยงานอาจเปิดเผยข้อมูลแก่หน่วยงานภาครัฐที่เกี่ยวข้องตามที่กฎหมายกำหนด

ระยะเวลาการจัดเก็บ:
ข้อมูลจะถูกจัดเก็บไว้เป็นระยะเวลา 120 วัน นับจากวันที่เข้าเยี่ยมชม หลังจากนั้นจะถูกลบออกจากระบบโดยอัตโนมัติ`;

const pdpaTextEnV3 = `Personal Data Protection Act B.E. 2562 (PDPA)

The Ministry of Tourism and Sports ("the Organization") will collect, use, and disclose your personal data for the following purposes:

1. Identity verification and visitor registration
2. Premises security maintenance
3. Building entry/exit records
4. Emergency communication
5. Statistical analysis and service improvement

Data Collected:
• Full name
• National ID / Passport number
• Facial photograph
• Contact information
• Vehicle registration (if applicable)

Data Subject Rights:
You have the right to access, correct, delete, or request copies of your personal data, including the right to withdraw consent. Please contact the Data Protection Officer at the reception counter.

Data Disclosure:
The Organization may disclose data to relevant government agencies as required by law.

Retention Period:
Data will be retained for 120 days from the date of visit, after which it will be automatically deleted from the system.`;

export const pdpaVersions: PdpaVersion[] = [
  {
    id: 1,
    configId: 1,
    version: 1,
    textTh: pdpaTextThV1,
    textEn: pdpaTextEnV1,
    retentionDays: 90,
    requireScroll: true,
    isActive: false,
    effectiveDate: "2025-01-01",
    changedBy: null,
    changedByName: null,
    changeNote: "เวอร์ชันเริ่มต้น — ข้อความ PDPA พื้นฐาน",
    createdAt: "2025-01-01 00:00:00",
    displayChannels: ["kiosk", "line"],
  },
  {
    id: 2,
    configId: 1,
    version: 2,
    textTh: pdpaTextThV2,
    textEn: pdpaTextEnV2,
    retentionDays: 90,
    requireScroll: true,
    isActive: false,
    effectiveDate: "2025-06-01",
    changedBy: 1,
    changedByName: "สมชาย วิชาญ",
    changeNote: "เพิ่มข้อมูลทะเบียนรถ + สิทธิของเจ้าของข้อมูล + วัตถุประสงค์สถิติ",
    createdAt: "2025-05-28 14:30:00",
    displayChannels: ["kiosk", "line"],
  },
  {
    id: 3,
    configId: 1,
    version: 3,
    textTh: pdpaTextThV3,
    textEn: pdpaTextEnV3,
    retentionDays: 120,
    requireScroll: true,
    isActive: true,
    effectiveDate: "2026-01-15",
    changedBy: 1,
    changedByName: "สมชาย วิชาญ",
    changeNote: "เพิ่มหมวดการเปิดเผยข้อมูล + เปลี่ยน retention เป็น 120 วัน",
    createdAt: "2026-01-10 09:15:00",
    displayChannels: ["kiosk"],
  },
];

export const pdpaConsentLogs: PdpaConsentLog[] = [
  {
    id: 1,
    visitorId: 1,
    visitorName: "นายวิทยา สมศรี",
    visitorIdCard: "1-1001-XXXXX-XX-1",
    configVersion: 3,
    consentChannel: "kiosk",
    ipAddress: "192.168.1.100",
    deviceId: "KIOSK-01",
    consentedAt: "2026-03-15 09:30:00",
    expiresAt: "2026-07-13 09:30:00",
  },
  {
    id: 2,
    visitorId: 2,
    visitorName: "Ms. Sarah Johnson",
    visitorIdCard: "AA-123XXXX",
    configVersion: 3,
    consentChannel: "line",
    ipAddress: null,
    deviceId: null,
    consentedAt: "2026-03-15 10:15:00",
    expiresAt: "2026-07-13 10:15:00",
  },
  {
    id: 3,
    visitorId: 3,
    visitorName: "นางสาวปิยะดา รักไทย",
    visitorIdCard: "1-3301-XXXXX-XX-5",
    configVersion: 3,
    consentChannel: "counter",
    ipAddress: "192.168.1.50",
    deviceId: "COUNTER-01",
    consentedAt: "2026-03-14 14:00:00",
    expiresAt: "2026-07-12 14:00:00",
  },
  {
    id: 4,
    visitorId: 4,
    visitorName: "นายประเสริฐ ดีงาม",
    visitorIdCard: "1-1002-XXXXX-XX-3",
    configVersion: 2,
    consentChannel: "kiosk",
    ipAddress: "192.168.1.100",
    deviceId: "KIOSK-01",
    consentedAt: "2025-12-20 08:45:00",
    expiresAt: "2026-03-20 08:45:00",
  },
  {
    id: 5,
    visitorId: 5,
    visitorName: "Mr. Kenji Tanaka",
    visitorIdCard: "TK-98765XXXX",
    configVersion: 2,
    consentChannel: "line",
    ipAddress: null,
    deviceId: null,
    consentedAt: "2025-11-05 13:20:00",
    expiresAt: "2026-02-03 13:20:00",
  },
  {
    id: 6,
    visitorId: 6,
    visitorName: "นายสมหมาย จริงใจ",
    visitorIdCard: "1-1003-XXXXX-XX-7",
    configVersion: 3,
    consentChannel: "kiosk",
    ipAddress: "192.168.1.101",
    deviceId: "KIOSK-02",
    consentedAt: "2026-03-16 11:00:00",
    expiresAt: "2026-07-14 11:00:00",
  },
  {
    id: 7,
    visitorId: 7,
    visitorName: "นางวิภา แก่นแก้ว",
    visitorIdCard: "1-5001-XXXXX-XX-9",
    configVersion: 1,
    consentChannel: "counter",
    ipAddress: "192.168.1.50",
    deviceId: "COUNTER-01",
    consentedAt: "2025-06-10 15:30:00",
    expiresAt: "2025-09-08 15:30:00",
  },
];
