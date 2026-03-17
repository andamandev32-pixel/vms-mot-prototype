/**
 * Kiosk Mock Data — Demo data for preview
 */

import type { VisitorIdentity, AppointmentData, VisitPurposeOption, SlipData } from "./kiosk-types";

/** Mask ID number: show first digit + last 5 digits, mask the rest */
export function maskIdNumber(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length <= 6) return id;
  // Keep first 1 digit and last 5 digits visible
  const masked = digits[0] + "x".repeat(digits.length - 6) + digits.slice(-5);
  // Re-apply original formatting (dashes)
  let result = "";
  let di = 0;
  for (const ch of id) {
    if (/\d/.test(ch)) {
      result += masked[di++];
    } else {
      result += ch;
    }
  }
  return result;
}

/** Mock visitor data (simulated ID card read) */
export const mockVisitorIdCard: VisitorIdentity = {
  fullNameTh: "นายพุทธิพงษ์ คาดสนิท",
  fullNameEn: "Mr. Putthipong Khadsnit",
  idNumber: "1-1234-56789-01-0",
  dateOfBirth: "2533-05-15",
  address: "123/45 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
  issueDate: "2565-01-10",
  expiryDate: "2574-05-14",
  documentType: "thai-id-card",
};

/** Mock visitor data (simulated Passport read) */
export const mockVisitorPassport: VisitorIdentity = {
  fullNameTh: "",
  fullNameEn: "Mr. John Smith",
  idNumber: "AA1234567",
  dateOfBirth: "1990-03-20",
  issueDate: "2022-06-01",
  expiryDate: "2032-05-31",
  documentType: "passport",
};

/** Mock visitor data (simulated ThaiID read) */
export const mockVisitorThaiId: VisitorIdentity = {
  fullNameTh: "นายพุทธิพงษ์ คาดสนิท",
  fullNameEn: "Mr. Putthipong Khadsnit",
  idNumber: "1-1234-56789-01-0",
  dateOfBirth: "2533-05-15",
  photo: "/images/demo-face.jpg",
  documentType: "thai-id-app",
};

/** Mock appointment data */
export const mockAppointment: AppointmentData = {
  bookingCode: "eVMS-20260315-0042",
  visitorName: "นายพุทธิพงษ์ คาดสนิท",
  visitorCompany: "บริษัท ไอที โซลูชั่น จำกัด",
  hostName: "คุณสมศรี รักงาน",
  hostDepartment: "กองกิจการท่องเที่ยว",
  hostFloor: "ชั้น 3",
  location: "ห้องประชุม 301 ชั้น 3 อาคาร C",
  locationEn: "Meeting Room 301, 3rd Floor, Building C",
  date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
  timeSlot: "10:00 — 11:30",
  purposeName: "ประชุม / สัมมนา",
  purposeNameEn: "Meeting / Seminar",
  purposeIcon: "📋",
  status: "approved",
  wifiRequested: true,
  lineLinked: true,
};

/** Mock visit purposes for kiosk (filtered from visitPurposeConfigs where showOnKiosk = true) */
export const mockKioskPurposes: VisitPurposeOption[] = [
  { id: 1, name: "ติดต่อราชการ", nameEn: "Official Business", icon: "🏛️", description: "ยื่นเอกสาร, ติดต่อเจ้าหน้าที่", descriptionEn: "Submit documents, contact officers", wifiEnabled: true },
  { id: 2, name: "ประชุม / สัมมนา", nameEn: "Meeting / Seminar", icon: "📋", description: "เข้าร่วมประชุมตามนัดหมาย", descriptionEn: "Attend scheduled meetings", wifiEnabled: true },
  { id: 3, name: "ส่งเอกสาร / พัสดุ", nameEn: "Document / Parcel Delivery", icon: "📄", description: "Messenger, ไปรษณีย์", descriptionEn: "Messenger, postal services", wifiEnabled: false },
  { id: 4, name: "ผู้รับเหมา / ซ่อมบำรุง", nameEn: "Contractor / Maintenance", icon: "🔧", description: "ซ่อมบำรุง, ติดตั้งอุปกรณ์", descriptionEn: "Maintenance, equipment installation", wifiEnabled: false },
  { id: 5, name: "สมัครงาน / สัมภาษณ์", nameEn: "Job Application / Interview", icon: "💼", description: "สมัครงาน, สัมภาษณ์", descriptionEn: "Job application, interview", wifiEnabled: true },
  { id: 7, name: "รับ-ส่งสินค้า", nameEn: "Delivery / Pickup", icon: "📦", description: "รับ-ส่งสินค้า", descriptionEn: "Delivery and pickup", wifiEnabled: false },
];

/**
 * Mapping: purpose ID → department IDs that accept this purpose.
 * If a purpose maps to only 1 department, auto-select it in the kiosk flow.
 */
export const purposeDepartmentMap: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 8, 9],           // ติดต่อราชการ → หลายหน่วยงาน
  2: [1, 3, 4, 5, 6, 7, 8, 9, 10],// ประชุม / สัมมนา → หลายหน่วยงาน
  3: [2],                                           // ส่งเอกสาร / พัสดุ → กองกลางเท่านั้น
  4: [2],                                           // ผู้รับเหมา / ซ่อมบำรุง → กองกลางเท่านั้น
  5: [1, 2, 3, 4, 5, 6, 7, 8],       // สมัครงาน / สัมภาษณ์ → หลายหน่วยงาน
  7: [2],                                           // รับ-ส่งสินค้า → กองกลางเท่านั้น
};

/** Generate mock slip data */
export function generateMockSlipData(
  visitor: VisitorIdentity,
  purpose?: VisitPurposeOption,
  wifiAccepted?: boolean
): SlipData {
  const now = new Date();
  return {
    slipNumber: `eVMS-${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    visitorName: visitor.fullNameTh || visitor.fullNameEn,
    visitorNameEn: visitor.fullNameEn,
    idNumber: visitor.idNumber,
    visitPurpose: purpose?.name || "ติดต่อราชการ",
    visitPurposeEn: purpose?.nameEn || "Official Business",
    hostName: "คุณสมศรี รักงาน",
    department: "กองกิจการท่องเที่ยว",
    accessZone: "ชั้น 3 อาคาร C",
    date: now.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
    timeIn: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    timeOut: "16:30 น.",
    wifi: wifiAccepted
      ? {
          ssid: "MOTS-Guest",
          password: `mots${now.getFullYear()}`,
          validUntil: "16:30 น.",
        }
      : undefined,
    qrCodeData: `eVMS-${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-0042`,
  };
}
