// ===== VMS MOCK DATA STORE =====
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

export type UserRole = "admin" | "supervisor" | "officer" | "staff" | "security" | "visitor";

export type NotificationType = "approved" | "rejected" | "reminder" | "checkin" | "wifi" | "overstay" | "system";

export type ShiftType = "morning" | "afternoon" | "night";

export interface Department {
  id: string;
  name: string;
  nameEn: string;
  floor: string;
  building: string;
}

export interface Staff {
  id: string;
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
  id: string;
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

export interface Vehicle {
  licensePlate: string;
  type: string;
  color: string;
}

export interface Equipment {
  name: string;
  quantity: number;
}

export interface Appointment {
  id: string;
  code: string;            // VMS-XXXXXXXX-XXXX
  visitor: Visitor;
  host: Staff;
  type: VisitType;
  status: VisitStatus;
  date: string;            // YYYY-MM-DD
  timeStart: string;       // HH:mm
  timeEnd: string;         // HH:mm
  purpose: string;
  companions: number;
  vehicle?: Vehicle;
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
  id: string;
  type: NotificationType;
  title: string;
  titleEn?: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  appointmentId?: string;
  actionUrl?: string;
}

export interface BlocklistEntry {
  id: string;
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
  { id: "dept-1", name: "สำนักงานปลัดกระทรวง", nameEn: "Office of the Permanent Secretary", floor: "ชั้น 3", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-2", name: "กองกลาง", nameEn: "General Administration Division", floor: "ชั้น 2", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-3", name: "กองการต่างประเทศ", nameEn: "International Affairs Division", floor: "ชั้น 5", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-4", name: "กองกิจการท่องเที่ยว", nameEn: "Tourism Affairs Division", floor: "ชั้น 4", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-5", name: "กรมการท่องเที่ยว", nameEn: "Department of Tourism", floor: "ชั้น 6", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-6", name: "กรมพลศึกษา", nameEn: "Department of Physical Education", floor: "ชั้น 7", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-7", name: "การกีฬาแห่งประเทศไทย", nameEn: "Sports Authority of Thailand", floor: "ชั้น 8", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-8", name: "สำนักนโยบายและแผน", nameEn: "Policy and Planning Division", floor: "ชั้น 4", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-9", name: "สำนักงานรัฐมนตรี", nameEn: "Minister's Office", floor: "ชั้น 9", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-10", name: "การท่องเที่ยวแห่งประเทศไทย", nameEn: "Tourism Authority of Thailand", floor: "ชั้น 6", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-11", name: "มหาวิทยาลัยการกีฬาแห่งชาติ", nameEn: "National Sports University", floor: "ชั้น 7", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-12", name: "กองบัญชาการตำรวจท่องเที่ยว", nameEn: "Tourist Police Bureau", floor: "ชั้น 8", building: "ศูนย์ราชการ อาคาร C" },
  { id: "dept-13", name: "องค์การบริหารการพัฒนาพื้นที่พิเศษเพื่อการท่องเที่ยวอย่างยั่งยืน (อพท.)", nameEn: "DASTA", floor: "ชั้น 8", building: "ศูนย์ราชการ อาคาร C" },
];

// ===== STAFF =====

export const staffMembers: Staff[] = [
  {
    id: "staff-1",
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
    id: "staff-2",
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
    id: "staff-3",
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
    id: "staff-4",
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
    id: "staff-5",
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
    id: "staff-6",
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
    id: "staff-7",
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
    id: "staff-8",
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
    id: "staff-9",
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
    id: "staff-10",
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
];

// ===== VISITORS =====

export const visitors: Visitor[] = [
  {
    id: "visitor-1",
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
    id: "visitor-2",
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
    id: "visitor-3",
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
    id: "visitor-4",
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
    id: "visitor-5",
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
    id: "visitor-6",
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
    id: "visitor-7",
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
    id: "visitor-8",
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
    id: "apt-1",
    code: "VMS-20690308-0001",
    visitor: visitors[0],
    host: staffMembers[0],
    type: "official",
    status: "approved",
    date: "2569-03-08",
    timeStart: "09:00",
    timeEnd: "10:30",
    purpose: "หารือแนวทางส่งเสริมการท่องเที่ยวเชิงนิเวศ",
    companions: 0,
    vehicle: { licensePlate: "กข 1234", type: "รถเก๋ง", color: "ขาว" },
    area: "กองกิจการท่องเที่ยว",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    room: "ห้องประชุม 1",
    createdAt: "2569-03-05T10:30:00",
    approvedAt: "2569-03-05T14:00:00",
    approvedBy: "คุณสมศรี รักงาน",
  },
  {
    id: "apt-2",
    code: "VMS-20690308-0002",
    visitor: visitors[1],
    host: staffMembers[1],
    type: "meeting",
    status: "approved",
    date: "2569-03-08",
    timeStart: "10:00",
    timeEnd: "11:00",
    purpose: "ประชุมเตรียมงานมหกรรมท่องเที่ยวนานาชาติ",
    companions: 2,
    area: "กองกลาง",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 2",
    room: "ห้องประชุมใหญ่",
    createdAt: "2569-03-04T09:00:00",
    approvedAt: "2569-03-04T11:30:00",
    approvedBy: "คุณประเสริฐ ศรีวิโล",
  },
  {
    id: "apt-3",
    code: "VMS-20690308-0003",
    visitor: visitors[2],
    host: staffMembers[2],
    type: "official",
    status: "approved",
    date: "2569-03-08",
    timeStart: "13:00",
    timeEnd: "14:30",
    purpose: "Discuss bilateral tourism cooperation agreement",
    companions: 1,
    area: "กองการต่างประเทศ",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 5",
    createdAt: "2569-03-03T15:00:00",
    approvedAt: "2569-03-04T09:00:00",
    approvedBy: "คุณกมลพร วงศ์สวัสดิ์",
  },
  {
    id: "apt-4",
    code: "VMS-20690308-0004",
    visitor: visitors[3],
    host: staffMembers[1],
    type: "contractor",
    status: "pending",
    date: "2569-03-08",
    timeStart: "14:00",
    timeEnd: "16:00",
    purpose: "สำรวจพื้นที่ซ่อมแซมห้องประชุมชั้น 3",
    companions: 3,
    vehicle: { licensePlate: "2กบ 5678", type: "รถกระบะ", color: "ดำ" },
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
    id: "apt-5",
    code: "VMS-20690309-0001",
    visitor: visitors[4],
    host: staffMembers[3],
    type: "official",
    status: "pending",
    date: "2569-03-09",
    timeStart: "10:00",
    timeEnd: "11:30",
    purpose: "สัมภาษณ์ผู้บริหารเรื่องแผนส่งเสริมท่องเที่ยวปี 2570",
    companions: 1,
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
    id: "apt-6",
    code: "VMS-20690308-0005",
    visitor: visitors[0],
    host: staffMembers[0],
    type: "official",
    status: "checked-in",
    date: "2569-03-08",
    timeStart: "09:00",
    timeEnd: "10:30",
    purpose: "หารือแนวทางส่งเสริมการท่องเที่ยวเชิงนิเวศ",
    companions: 0,
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
    id: "apt-7",
    code: "VMS-20690307-0001",
    visitor: visitors[6],
    host: staffMembers[2],
    type: "meeting",
    status: "checked-out",
    date: "2569-03-07",
    timeStart: "10:00",
    timeEnd: "12:00",
    purpose: "Workshop: Japan-Thailand Tourism Exchange Program",
    companions: 0,
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
    id: "apt-8",
    code: "VMS-20690306-0001",
    visitor: visitors[4],
    host: staffMembers[3],
    type: "document",
    status: "rejected",
    date: "2569-03-06",
    timeStart: "14:00",
    timeEnd: "15:00",
    purpose: "ส่งเอกสารประกอบการพิจารณาโครงการ",
    companions: 0,
    area: "สำนักนโยบายและแผน",
    building: "ศูนย์ราชการ อาคาร C",
    floor: "ชั้น 4",
    createdAt: "2569-03-05T08:00:00",
    rejectedAt: "2569-03-05T09:30:00",
    rejectedReason: "วันที่ขอมาตรงกับวันหยุดราชการ กรุณาเลือกวันใหม่",
  },
];

// ===== NOTIFICATIONS =====

export const notifications: VisitNotification[] = [
  {
    id: "notif-1",
    type: "approved",
    title: "การนัดหมายได้รับอนุมัติ",
    titleEn: "Appointment Approved",
    body: "8 มี.ค. 2569 เวลา 09:00 น. — คุณสมศรี รักงาน",
    timestamp: "2569-03-05T14:00:00",
    isRead: false,
    appointmentId: "apt-1",
    actionUrl: "/mobile/qr-code",
  },
  {
    id: "notif-2",
    type: "rejected",
    title: "การนัดหมายไม่ได้รับอนุมัติ",
    titleEn: "Appointment Rejected",
    body: "วันที่ขอมาตรงกับวันหยุดราชการ — วันว่าง: 10 มี.ค., 11 มี.ค.",
    timestamp: "2569-03-05T09:30:00",
    isRead: true,
    appointmentId: "apt-8",
    actionUrl: "/mobile/booking",
  },
  {
    id: "notif-3",
    type: "reminder",
    title: "อีก 1 ชั่วโมงก่อนถึงเวลานัด",
    titleEn: "1 Hour Reminder",
    body: "เตรียม QR Code และเอกสาร — พบคุณสมศรี 09:00 น.",
    timestamp: "2569-03-08T08:00:00",
    isRead: false,
    appointmentId: "apt-1",
    actionUrl: "/mobile/qr-code",
  },
  {
    id: "notif-4",
    type: "checkin",
    title: "เข้าพื้นที่สำเร็จ",
    titleEn: "Check-in Confirmed",
    body: "Check-in 8 มี.ค. 2569 08:55 น. · กองกิจการท่องเที่ยว",
    timestamp: "2569-03-08T08:55:00",
    isRead: false,
    appointmentId: "apt-6",
  },
  {
    id: "notif-5",
    type: "wifi",
    title: "ข้อมูล Wi-Fi ของคุณ",
    titleEn: "Wi-Fi Credentials",
    body: "SSID: MOTS-Visitor · แตะเพื่อดูรหัสผ่าน",
    timestamp: "2569-03-08T08:55:00",
    isRead: false,
    appointmentId: "apt-6",
  },
  {
    id: "notif-6",
    type: "system",
    title: "ระบบปรับปรุงเวอร์ชันใหม่",
    titleEn: "System Update",
    body: "VMS v2.0 อัปเดต: รองรับ ThaiD, Passport MRZ scan",
    timestamp: "2569-03-01T09:00:00",
    isRead: true,
  },
];

// ===== BLOCKLIST =====

export const blocklist: BlocklistEntry[] = [
  {
    id: "block-1",
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
  { id: "room-1", name: "ห้องประชุม 1", floor: "ชั้น 3", building: "ศูนย์ราชการ อาคาร C", capacity: 20 },
  { id: "room-2", name: "ห้องประชุม 2", floor: "ชั้น 5", building: "ศูนย์ราชการ อาคาร C", capacity: 15 },
  { id: "room-3", name: "ห้องประชุมใหญ่", floor: "ชั้น 2", building: "ศูนย์ราชการ อาคาร C", capacity: 50 },
  { id: "room-4", name: "ห้องรับรอง VIP", floor: "ชั้น 9", building: "ศูนย์ราชการ อาคาร C", capacity: 10 },
  { id: "room-5", name: "ห้องประชุม 3", floor: "ชั้น 7", building: "ศูนย์ราชการ อาคาร C", capacity: 30 },
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

export function isVisitorBlocked(idNumber: string): boolean {
  return visitors.some((v) => v.idNumber === idNumber && v.isBlocked);
}

// ===== MOCK PERSONNEL DATABASE (for staff registration lookup) =====

export interface PersonnelRecord {
  employeeId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  firstNameEn: string;
  lastNameEn: string;
  position: string;
  departmentId: string;
  departmentName: string;
}

export const personnelDatabase: PersonnelRecord[] = [
  {
    employeeId: "EMP-001",
    nationalId: "1-1001-00001-01-1",
    firstName: "สมศรี",
    lastName: "รักงาน",
    firstNameEn: "Somsri",
    lastNameEn: "Rakngarn",
    position: "ผู้อำนวยการกองกิจการท่องเที่ยว",
    departmentId: "dept-4",
    departmentName: "กองกิจการท่องเที่ยว",
  },
  {
    employeeId: "EMP-002",
    nationalId: "1-1002-00002-02-2",
    firstName: "ประเสริฐ",
    lastName: "ศรีวิโล",
    firstNameEn: "Prasert",
    lastNameEn: "Srivilo",
    position: "หัวหน้ากลุ่มงานบริหารทั่วไป",
    departmentId: "dept-2",
    departmentName: "กองกลาง",
  },
  {
    employeeId: "EMP-007",
    nationalId: "1-8401-00567-89-0",
    firstName: "นพดล",
    lastName: "ชูช่วย",
    firstNameEn: "Noppadon",
    lastNameEn: "Choochuay",
    position: "นักวิชาการท่องเที่ยวชำนาญการ",
    departmentId: "dept-4",
    departmentName: "กองกิจการท่องเที่ยว",
  },
  {
    employeeId: "EMP-003",
    nationalId: "1-1003-00003-03-3",
    firstName: "กมลพร",
    lastName: "วงศ์สวัสดิ์",
    firstNameEn: "Kamonporn",
    lastNameEn: "Wongsawad",
    position: "ผู้เชี่ยวชาญด้านต่างประเทศ",
    departmentId: "dept-3",
    departmentName: "กองการต่างประเทศ",
  },
  {
    employeeId: "EMP-004",
    nationalId: "1-1004-00004-04-4",
    firstName: "วิภาดา",
    lastName: "ชัยมงคล",
    firstNameEn: "Wipada",
    lastNameEn: "Chaimongkol",
    position: "นักวิเคราะห์นโยบายและแผน",
    departmentId: "dept-8",
    departmentName: "สำนักนโยบายและแผน",
  },
];

export function lookupPersonnel(query: string): PersonnelRecord | null {
  const q = query.trim();
  return personnelDatabase.find(
    (p) => p.employeeId.toLowerCase() === q.toLowerCase() || p.nationalId === q
  ) ?? null;
}

// ===== VISIT PURPOSE CONFIGURATION =====

export interface DepartmentRule {
  departmentId: string;
  requirePersonName: boolean;     // ต้องระบุชื่อบุคคลที่ต้องการพบ
  requireApproval: boolean;       // ต้องมีการอนุมัติก่อนเข้าพื้นที่
  approverGroupId?: string;       // กลุ่มผู้อนุมัติ (เมื่อ requireApproval = true)
  offerWifi: boolean;             // เสนอ WiFi ให้ผู้เข้าเยี่ยม
  showOnLine: boolean;            // แสดงบน LINE OA + Web App
  showOnKiosk: boolean;           // แสดงบน Kiosk
  isActive: boolean;
}

export interface VisitPurposeConfig {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  departmentRules: DepartmentRule[];
  isActive: boolean;
  order: number;
}

export const visitPurposeConfigs: VisitPurposeConfig[] = [
  {
    id: "vpc-1",
    name: "ติดต่อราชการ",
    nameEn: "Official Business",
    icon: "🏛️",
    departmentRules: [
      { departmentId: "dept-1", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-1",  offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-2", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-3",  offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-3", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-5",  offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-4", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-6",  offerWifi: false, showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: "dept-5", requirePersonName: true,  requireApproval: false,                             offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-8", requirePersonName: false, requireApproval: false,                             offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-9", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-10", offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
    ],
    isActive: true,
    order: 1,
  },
  {
    id: "vpc-2",
    name: "ประชุม / สัมมนา",
    nameEn: "Meeting / Seminar",
    icon: "📋",
    departmentRules: [
      { departmentId: "dept-1", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-1", offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-3", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-5", offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: "dept-4", requirePersonName: true,  requireApproval: false,                            offerWifi: true,  showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-9", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-10", offerWifi: true, showOnLine: true,  showOnKiosk: false, isActive: true },
    ],
    isActive: true,
    order: 2,
  },
  {
    id: "vpc-3",
    name: "ส่งเอกสาร / พัสดุ",
    nameEn: "Document / Parcel Delivery",
    icon: "📄",
    departmentRules: [
      { departmentId: "dept-1", requirePersonName: false, requireApproval: false,                            offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-2", requirePersonName: false, requireApproval: false,                            offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-4", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-6", offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 3,
  },
  {
    id: "vpc-4",
    name: "ผู้รับเหมา / ซ่อมบำรุง",
    nameEn: "Contractor / Maintenance",
    icon: "🔧",
    departmentRules: [
      { departmentId: "dept-2", requirePersonName: false, requireApproval: true,  approverGroupId: "apg-4", offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
      { departmentId: "dept-6", requirePersonName: false, requireApproval: true,  approverGroupId: "apg-9", offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 4,
  },
  {
    id: "vpc-5",
    name: "สมัครงาน / สัมภาษณ์",
    nameEn: "Job Application / Interview",
    icon: "💼",
    departmentRules: [
      { departmentId: "dept-2", requirePersonName: true,  requireApproval: false, offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 5,
  },
  {
    id: "vpc-6",
    name: "เยี่ยมชม / ศึกษาดูงาน",
    nameEn: "Study Visit / Tour",
    icon: "🎓",
    departmentRules: [
      { departmentId: "dept-4", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-7", offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: "dept-5", requirePersonName: true,  requireApproval: true,  approverGroupId: "apg-8", offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: true },
      { departmentId: "dept-7", requirePersonName: false, requireApproval: true,                             offerWifi: true,  showOnLine: true,  showOnKiosk: false, isActive: false },
    ],
    isActive: true,
    order: 6,
  },
  {
    id: "vpc-7",
    name: "รับ-ส่งสินค้า",
    nameEn: "Delivery / Pickup",
    icon: "📦",
    departmentRules: [
      { departmentId: "dept-1", requirePersonName: false, requireApproval: false, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
      { departmentId: "dept-2", requirePersonName: false, requireApproval: false, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
      { departmentId: "dept-4", requirePersonName: false, requireApproval: false, offerWifi: false, showOnLine: false, showOnKiosk: true,  isActive: true },
    ],
    isActive: true,
    order: 7,
  },
  {
    id: "vpc-8",
    name: "อื่นๆ",
    nameEn: "Other",
    icon: "🔖",
    departmentRules: [
      { departmentId: "dept-1", requirePersonName: false, requireApproval: true,  approverGroupId: "apg-2", offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
      { departmentId: "dept-2", requirePersonName: false, requireApproval: true,  approverGroupId: "apg-3", offerWifi: false, showOnLine: true,  showOnKiosk: true,  isActive: true },
    ],
    isActive: false,
    order: 8,
  },
];

// ===== BUILDINGS & FLOORS =====

export interface Building {
  id: string;
  name: string;
  nameEn: string;
  totalFloors: number;
  description?: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  nameEn: string;
  departmentIds: string[];
}

export type AccessZoneType = "office" | "meeting-room" | "lobby" | "parking" | "common" | "restricted" | "service";

export interface AccessZone {
  id: string;
  name: string;
  nameEn: string;
  floorId: string;
  buildingId: string;
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
  id: string;
  name: string;
  nameEn: string;
  description: string;
  zoneIds: string[];
  hikvisionGroupId: string;
  qrCodePrefix: string;
  validityMinutes: number;
  schedule: AccessGroupSchedule;
  allowedVisitTypes: VisitType[];
  isActive: boolean;
  color: string;
}

export interface DepartmentAccessMapping {
  departmentId: string;
  defaultAccessGroupId: string;
  additionalGroupIds: string[];
}

// ── Buildings ──

export const buildings: Building[] = [
  { id: "bld-C", name: "ศูนย์ราชการ อาคาร C", nameEn: "Government Center Building C", totalFloors: 9, description: "กระทรวงการท่องเที่ยวและกีฬา — ทุกหน่วยงานในตึกเดียว" },
];

// ── Floors ──

export const floors: Floor[] = [
  { id: "fl-C1", buildingId: "bld-C", floorNumber: 1, name: "ชั้น 1 — ล็อบบี้ / ประชาสัมพันธ์ / รปภ.", nameEn: "1F — Lobby / Reception / Security", departmentIds: [] },
  { id: "fl-C2", buildingId: "bld-C", floorNumber: 2, name: "ชั้น 2 — กองกลาง", nameEn: "2F — General Admin", departmentIds: ["dept-2"] },
  { id: "fl-C3", buildingId: "bld-C", floorNumber: 3, name: "ชั้น 3 — สำนักงานปลัด", nameEn: "3F — OPS", departmentIds: ["dept-1"] },
  { id: "fl-C4", buildingId: "bld-C", floorNumber: 4, name: "ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน", nameEn: "4F — Tourism Affairs & Policy", departmentIds: ["dept-4", "dept-8"] },
  { id: "fl-C5", buildingId: "bld-C", floorNumber: 5, name: "ชั้น 5 — กองการต่างประเทศ", nameEn: "5F — International Affairs", departmentIds: ["dept-3"] },
  { id: "fl-C6", buildingId: "bld-C", floorNumber: 6, name: "ชั้น 6 — กรมการท่องเที่ยว / ททท.", nameEn: "6F — Dept. of Tourism / TAT", departmentIds: ["dept-5", "dept-10"] },
  { id: "fl-C7", buildingId: "bld-C", floorNumber: 7, name: "ชั้น 7 — กรมพลศึกษา / มกช.", nameEn: "7F — Dept. of PE / NSU", departmentIds: ["dept-6", "dept-11"] },
  { id: "fl-C8", buildingId: "bld-C", floorNumber: 8, name: "ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท.", nameEn: "8F — SAT / Tourist Police / DASTA", departmentIds: ["dept-7", "dept-12", "dept-13"] },
  { id: "fl-C9", buildingId: "bld-C", floorNumber: 9, name: "ชั้น 9 — สำนักงานรัฐมนตรี / ห้องประชุมอเนกประสงค์", nameEn: "9F — Minister's Office / Conference", departmentIds: ["dept-9"] },
];

// ── Access Zones (areas controlled by Hikvision readers) ──

export const accessZones: AccessZone[] = [
  // ชั้น 1 — ล็อบบี้ / ที่จอดรถ / ซ่อมบำรุง
  { id: "az-lobby", name: "ล็อบบี้ ชั้น 1", nameEn: "Lobby 1F", floorId: "fl-C1", buildingId: "bld-C", type: "lobby", hikvisionDoorId: "HIK-DOOR-C1-01", isActive: true },
  { id: "az-parking", name: "ลานจอดรถ", nameEn: "Parking", floorId: "fl-C1", buildingId: "bld-C", type: "parking", hikvisionDoorId: "HIK-DOOR-C1-PK", isActive: true },
  { id: "az-service", name: "พื้นที่ซ่อมบำรุง", nameEn: "Maintenance Area", floorId: "fl-C1", buildingId: "bld-C", type: "service", hikvisionDoorId: "HIK-DOOR-C1-SVC", isActive: true },
  // ชั้น 2 — กองกลาง
  { id: "az-f2-office", name: "สำนักงาน กองกลาง", nameEn: "General Admin Office", floorId: "fl-C2", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C2-01", isActive: true },
  { id: "az-f2-meeting", name: "ห้องประชุม ชั้น 2", nameEn: "Meeting Room 2F", floorId: "fl-C2", buildingId: "bld-C", type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C2-MR", isActive: true },
  // ชั้น 3 — สำนักงานปลัด
  { id: "az-f3-office", name: "สำนักงานปลัด", nameEn: "OPS Office", floorId: "fl-C3", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C3-01", isActive: true },
  { id: "az-f3-meeting", name: "ห้องประชุม ชั้น 3", nameEn: "Meeting Room 3F", floorId: "fl-C3", buildingId: "bld-C", type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C3-MR", isActive: true },
  // ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน
  { id: "az-f4-office", name: "สำนักงาน กองกิจการ / นโยบาย", nameEn: "Tourism & Policy Office", floorId: "fl-C4", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C4-01", isActive: true },
  { id: "az-f4-meeting", name: "ห้องประชุม ชั้น 4", nameEn: "Meeting Room 4F", floorId: "fl-C4", buildingId: "bld-C", type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C4-MR", isActive: true },
  // ชั้น 5 — กองการต่างประเทศ
  { id: "az-f5-office", name: "สำนักงาน กองต่างประเทศ", nameEn: "International Office", floorId: "fl-C5", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C5-01", isActive: true },
  { id: "az-f5-meeting", name: "ห้องประชุม ชั้น 5", nameEn: "Meeting Room 5F", floorId: "fl-C5", buildingId: "bld-C", type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C5-MR", isActive: true },
  // ชั้น 6 — กรมการท่องเที่ยว / ททท.
  { id: "az-f6-office", name: "กรมการท่องเที่ยว / ททท.", nameEn: "Tourism Dept. / TAT", floorId: "fl-C6", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C6-01", isActive: true },
  { id: "az-f6-meeting", name: "ห้องประชุม ชั้น 6", nameEn: "Meeting Room 6F", floorId: "fl-C6", buildingId: "bld-C", type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C6-MR", isActive: true },
  // ชั้น 7 — กรมพลศึกษา / มกช.
  { id: "az-f7-office", name: "กรมพลศึกษา / มกช.", nameEn: "PE Dept. / NSU", floorId: "fl-C7", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C7-01", isActive: true },
  { id: "az-f7-meeting", name: "ห้องประชุม ชั้น 7", nameEn: "Meeting Room 7F", floorId: "fl-C7", buildingId: "bld-C", type: "meeting-room", hikvisionDoorId: "HIK-DOOR-C7-MR", isActive: true },
  // ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท.
  { id: "az-f8-office", name: "กกท. / ตร.ท่องเที่ยว / อพท.", nameEn: "SAT / Tourist Police / DASTA", floorId: "fl-C8", buildingId: "bld-C", type: "office", hikvisionDoorId: "HIK-DOOR-C8-01", isActive: true },
  { id: "az-f8-restricted", name: "พื้นที่ควบคุม ตร.ท่องเที่ยว", nameEn: "Tourist Police Restricted", floorId: "fl-C8", buildingId: "bld-C", type: "restricted", hikvisionDoorId: "HIK-DOOR-C8-02", isActive: true },
  // ชั้น 9 — สำนักงานรัฐมนตรี (VIP) / ห้องประชุมอเนกประสงค์
  { id: "az-f9-vip", name: "สำนักงานรัฐมนตรี (VIP)", nameEn: "Minister's Office (VIP)", floorId: "fl-C9", buildingId: "bld-C", type: "restricted", hikvisionDoorId: "HIK-DOOR-C9-01", isActive: true },
  { id: "az-f9-meeting", name: "ห้องประชุมรัฐมนตรี", nameEn: "Minister's Conference", floorId: "fl-C9", buildingId: "bld-C", type: "restricted", hikvisionDoorId: "HIK-DOOR-C9-MR", isActive: true },
  { id: "az-f9-multipurpose", name: "ห้องอเนกประสงค์", nameEn: "Multipurpose Hall", floorId: "fl-C9", buildingId: "bld-C", type: "common", hikvisionDoorId: "HIK-DOOR-C9-MP", isActive: true },
];

// ── Access Groups (Hikvision person-group mapping) ──

export const accessGroups: AccessGroup[] = [
  {
    id: "ag-1",
    name: "ผู้เยี่ยมชมทั่วไป",
    nameEn: "General Visitor",
    description: "เข้าได้เฉพาะล็อบบี้และพื้นที่ส่วนกลาง ชั้น 1",
    zoneIds: ["az-lobby", "az-f9-multipurpose"],
    hikvisionGroupId: "HIK-GRP-GENERAL",
    qrCodePrefix: "VMS-GEN",
    validityMinutes: 60,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["document", "delivery", "other"],
    isActive: true,
    color: "#6B7280",
  },
  {
    id: "ag-2",
    name: "ติดต่อราชการ ชั้น 2-5",
    nameEn: "Official — Floor 2-5",
    description: "เข้าล็อบบี้ + สำนักงานชั้น 2-5 (ปลัด, กองกลาง, กิจการท่องเที่ยว, ต่างประเทศ)",
    zoneIds: ["az-lobby", "az-f2-office", "az-f2-meeting", "az-f3-office", "az-f3-meeting", "az-f4-office", "az-f4-meeting", "az-f5-office", "az-f5-meeting"],
    hikvisionGroupId: "HIK-GRP-FL2-5",
    qrCodePrefix: "VMS-OFA",
    validityMinutes: 120,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["official", "meeting", "document"],
    isActive: true,
    color: "#6A0DAD",
  },
  {
    id: "ag-3",
    name: "ติดต่อราชการ ชั้น 6",
    nameEn: "Official — Floor 6",
    description: "เข้าล็อบบี้ + ชั้น 6 (กรมการท่องเที่ยว / ททท.)",
    zoneIds: ["az-lobby", "az-f6-office", "az-f6-meeting"],
    hikvisionGroupId: "HIK-GRP-FL6",
    qrCodePrefix: "VMS-OFB",
    validityMinutes: 120,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["official", "meeting", "document"],
    isActive: true,
    color: "#2563EB",
  },
  {
    id: "ag-4",
    name: "ติดต่อราชการ ชั้น 7-8",
    nameEn: "Official — Floor 7-8",
    description: "เข้าล็อบบี้ + ชั้น 7-8 (กรมพลศึกษา, มกช., กกท., ตร.ท่องเที่ยว, อพท.)",
    zoneIds: ["az-lobby", "az-f7-office", "az-f7-meeting", "az-f8-office"],
    hikvisionGroupId: "HIK-GRP-FL7-8",
    qrCodePrefix: "VMS-OFC",
    validityMinutes: 120,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "17:00" },
    allowedVisitTypes: ["official", "meeting"],
    isActive: true,
    color: "#059669",
  },
  {
    id: "ag-5",
    name: "ห้องประชุมรวม",
    nameEn: "All Meeting Rooms",
    description: "เข้าได้เฉพาะห้องประชุมทุกชั้น (ไม่รวมห้องประชุมรัฐมนตรี)",
    zoneIds: ["az-lobby", "az-f2-meeting", "az-f3-meeting", "az-f4-meeting", "az-f5-meeting", "az-f6-meeting", "az-f7-meeting", "az-f9-multipurpose"],
    hikvisionGroupId: "HIK-GRP-MEETING",
    qrCodePrefix: "VMS-MTG",
    validityMinutes: 180,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "07:30", endTime: "18:00" },
    allowedVisitTypes: ["meeting"],
    isActive: true,
    color: "#0891B2",
  },
  {
    id: "ag-6",
    name: "VIP — สำนักงานรัฐมนตรี",
    nameEn: "VIP — Minister's Office",
    description: "เข้าชั้น 9 (ต้องได้รับอนุมัติพิเศษ)",
    zoneIds: ["az-lobby", "az-f9-vip", "az-f9-meeting"],
    hikvisionGroupId: "HIK-GRP-VIP",
    qrCodePrefix: "VMS-VIP",
    validityMinutes: 60,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "16:00" },
    allowedVisitTypes: ["official", "meeting"],
    isActive: true,
    color: "#DC2626",
  },
  {
    id: "ag-7",
    name: "ผู้รับเหมา / ซ่อมบำรุง",
    nameEn: "Contractor / Maintenance",
    description: "เข้าพื้นที่ซ่อมบำรุง + ที่จอดรถ (มีเวลาจำกัด)",
    zoneIds: ["az-lobby", "az-parking", "az-service"],
    hikvisionGroupId: "HIK-GRP-MAINT",
    qrCodePrefix: "VMS-CTR",
    validityMinutes: 240,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "18:00" },
    allowedVisitTypes: ["contractor"],
    isActive: true,
    color: "#92400E",
  },
  {
    id: "ag-8",
    name: "ที่จอดรถ",
    nameEn: "Parking Only",
    description: "เข้าได้เฉพาะลานจอดรถ",
    zoneIds: ["az-parking"],
    hikvisionGroupId: "HIK-GRP-PARK",
    qrCodePrefix: "VMS-PKG",
    validityMinutes: 480,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "06:00", endTime: "20:00" },
    allowedVisitTypes: ["official", "meeting", "contractor", "delivery", "other"],
    isActive: true,
    color: "#4B5563",
  },
  {
    id: "ag-9",
    name: "รับ-ส่งสินค้า",
    nameEn: "Delivery / Pickup",
    description: "เข้าล็อบบี้ + ที่จอดรถ (จำกัดเวลา 30 นาที)",
    zoneIds: ["az-lobby", "az-parking"],
    hikvisionGroupId: "HIK-GRP-DELIVERY",
    qrCodePrefix: "VMS-DLV",
    validityMinutes: 30,
    schedule: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "06:00", endTime: "18:00" },
    allowedVisitTypes: ["delivery"],
    isActive: true,
    color: "#7C3AED",
  },
];

// ── Department → Access Group mapping ──

export const departmentAccessMappings: DepartmentAccessMapping[] = [
  { departmentId: "dept-1", defaultAccessGroupId: "ag-2", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-2", defaultAccessGroupId: "ag-2", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-3", defaultAccessGroupId: "ag-2", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-4", defaultAccessGroupId: "ag-2", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-5", defaultAccessGroupId: "ag-3", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-6", defaultAccessGroupId: "ag-4", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-7", defaultAccessGroupId: "ag-4", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-8", defaultAccessGroupId: "ag-2", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-9", defaultAccessGroupId: "ag-6", additionalGroupIds: ["ag-2"] },
  { departmentId: "dept-10", defaultAccessGroupId: "ag-3", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-11", defaultAccessGroupId: "ag-4", additionalGroupIds: ["ag-5"] },
  { departmentId: "dept-12", defaultAccessGroupId: "ag-4", additionalGroupIds: [] },
  { departmentId: "dept-13", defaultAccessGroupId: "ag-4", additionalGroupIds: ["ag-5"] },
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

// ===== APPROVER GROUPS =====

export type ApproverNotifyChannel = "line" | "email" | "web-app";

export interface ApproverMember {
  staffId: string;
  canApprove: boolean;             // สามารถกดอนุมัติ / ปฏิเสธ ได้
  receiveNotification: boolean;    // ได้รับแจ้งเตือนเมื่อมีรายการใหม่
}

export interface ApproverGroup {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  departmentId: string;            // แผนกที่รับผิดชอบ
  visitPurposeIds: string[];       // วัตถุประสงค์ที่ใช้กลุ่มนี้อนุมัติ
  members: ApproverMember[];
  notifyChannels: ApproverNotifyChannel[];  // ช่องทางแจ้งเตือน (เลือกได้มากกว่า 1)
  isActive: boolean;
}

export const approverGroups: ApproverGroup[] = [
  {
    id: "apg-1",
    name: "ผู้อนุมัติ สำนักงานปลัด (ราชการ+ประชุม)",
    nameEn: "OPS Approvers (Official+Meeting)",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานปลัดกระทรวง",
    departmentId: "dept-1",
    visitPurposeIds: ["vpc-1", "vpc-2"],
    members: [
      { staffId: "staff-5", canApprove: true,  receiveNotification: true },
      { staffId: "staff-1", canApprove: true,  receiveNotification: true },
      { staffId: "staff-4", canApprove: false, receiveNotification: true },
    ],
    notifyChannels: ["line", "email", "web-app"],
    isActive: true,
  },
  {
    id: "apg-2",
    name: "ผู้อนุมัติ สำนักงานปลัด (อื่นๆ)",
    nameEn: "OPS Approvers (Other)",
    description: "กลุ่มผู้อนุมัติสำหรับ วัตถุประสงค์อื่นๆ ที่ สำนักงานปลัดกระทรวง",
    departmentId: "dept-1",
    visitPurposeIds: ["vpc-8"],
    members: [
      { staffId: "staff-5", canApprove: true,  receiveNotification: true },
      { staffId: "staff-4", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "web-app"],
    isActive: true,
  },
  {
    id: "apg-3",
    name: "ผู้อนุมัติ กองกลาง (ราชการ+อื่นๆ)",
    nameEn: "General Admin Approvers (Official+Other)",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / อื่นๆ ที่ กองกลาง",
    departmentId: "dept-2",
    visitPurposeIds: ["vpc-1", "vpc-8"],
    members: [
      { staffId: "staff-2", canApprove: true,  receiveNotification: true },
      { staffId: "staff-6", canApprove: false, receiveNotification: true },
    ],
    notifyChannels: ["line", "email"],
    isActive: true,
  },
  {
    id: "apg-4",
    name: "ผู้อนุมัติ กองกลาง (ผู้รับเหมา)",
    nameEn: "General Admin Approvers (Contractor)",
    description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กองกลาง",
    departmentId: "dept-2",
    visitPurposeIds: ["vpc-4"],
    members: [
      { staffId: "staff-2", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "email"],
    isActive: true,
  },
  {
    id: "apg-5",
    name: "ผู้อนุมัติ กองการต่างประเทศ",
    nameEn: "International Approvers",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ กองการต่างประเทศ",
    departmentId: "dept-3",
    visitPurposeIds: ["vpc-1", "vpc-2"],
    members: [
      { staffId: "staff-3", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "web-app"],
    isActive: true,
  },
  {
    id: "apg-6",
    name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (ราชการ+เอกสาร)",
    nameEn: "Tourism Affairs Approvers (Official+Docs)",
    description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ส่งเอกสาร ที่ กองกิจการท่องเที่ยว",
    departmentId: "dept-4",
    visitPurposeIds: ["vpc-1", "vpc-3"],
    members: [
      { staffId: "staff-1", canApprove: true,  receiveNotification: true },
      { staffId: "staff-4", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["email", "web-app"],
    isActive: true,
  },
  {
    id: "apg-7",
    name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (เยี่ยมชม)",
    nameEn: "Tourism Affairs Approvers (Tour)",
    description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กองกิจการท่องเที่ยว",
    departmentId: "dept-4",
    visitPurposeIds: ["vpc-6"],
    members: [
      { staffId: "staff-1", canApprove: true,  receiveNotification: true },
      { staffId: "staff-4", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["email", "web-app"],
    isActive: true,
  },
  {
    id: "apg-8",
    name: "ผู้อนุมัติ กรมการท่องเที่ยว (เยี่ยมชม)",
    nameEn: "Dept. of Tourism Approvers (Tour)",
    description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กรมการท่องเที่ยว",
    departmentId: "dept-5",
    visitPurposeIds: ["vpc-6"],
    members: [
      { staffId: "staff-1", canApprove: true,  receiveNotification: true },
      { staffId: "staff-3", canApprove: true,  receiveNotification: false },
    ],
    notifyChannels: ["line", "email", "web-app"],
    isActive: true,
  },
  {
    id: "apg-9",
    name: "ผู้อนุมัติ กรมพลศึกษา (ผู้รับเหมา)",
    nameEn: "Dept. of PE Approvers (Contractor)",
    description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กรมพลศึกษา",
    departmentId: "dept-6",
    visitPurposeIds: ["vpc-4"],
    members: [
      { staffId: "staff-2", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["web-app"],
    isActive: true,
  },
  {
    id: "apg-10",
    name: "ผู้อนุมัติ สำนักงานรัฐมนตรี (VIP)",
    nameEn: "Minister Office Approvers (VIP)",
    description: "กลุ่มผู้อนุมัติ VIP สำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานรัฐมนตรี",
    departmentId: "dept-9",
    visitPurposeIds: ["vpc-1", "vpc-2"],
    members: [
      { staffId: "staff-5", canApprove: true,  receiveNotification: true },
      { staffId: "staff-1", canApprove: true,  receiveNotification: true },
      { staffId: "staff-4", canApprove: true,  receiveNotification: true },
    ],
    notifyChannels: ["line", "email", "web-app"],
    isActive: true,
  },
];
