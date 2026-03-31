"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  LogOut, Scan, Search, Printer, UserPlus, CreditCard,
  RefreshCw, Loader2, CheckCircle2, Calendar, Users,
  MapPin, Clock, Building, Check, X, Monitor, Wifi, WifiOff,
  Activity, Keyboard, Camera, FileText, Target,
  ArrowLeftRight, Shield, User, Phone, Fingerprint, Code,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect, useMemo } from "react";
import VmsLogo from "@/components/ui/VmsLogo";
import { cn } from "@/lib/utils";
import CounterStatePanel, { resolveCounterState } from "@/components/counter/CounterStatePanel";
import type { CounterCheckinMode } from "@/components/counter/CounterStatePanel";
import {
  servicePoints,
  visitPurposeConfigs,
  identityDocumentTypes,
  staffMembers,
  departments,
  type ServicePoint,
  type BlocklistEntry,
  checkBlocklist,
  getDepartmentLocation,
} from "@/lib/mock-data";
import { purposeDepartmentMap } from "@/lib/kiosk/kiosk-mock-data";

// ── Types ──
type InputMethod = "auto-card-reader" | "passport-reader" | "manual-officer" | "qr-scan" | "thai-id-app";
type CardReaderStatus = "idle" | "reading" | "success";
type CheckinMode = "walkin" | "appointment";

const INPUT_METHOD_LABELS: Record<InputMethod, { label: string; labelEn: string; icon: React.ReactNode; color: string }> = {
  "auto-card-reader": { label: "อ่านบัตรอัตโนมัติ", labelEn: "Auto Card Reader", icon: <CreditCard size={12} />, color: "bg-success-light text-success" },
  "passport-reader": { label: "เครื่องอ่าน Passport", labelEn: "Passport Reader", icon: <FileText size={12} />, color: "bg-info-light text-info" },
  "manual-officer": { label: "เจ้าหน้าที่คีย์ข้อมูล", labelEn: "Manual Input", icon: <Keyboard size={12} />, color: "bg-warning-light text-warning" },
  "qr-scan": { label: "สแกน QR Code", labelEn: "QR Scan", icon: <Scan size={12} />, color: "bg-primary-50 text-primary" },
  "thai-id-app": { label: "ThaiID App", labelEn: "ThaiID App", icon: <Fingerprint size={12} />, color: "bg-accent-50 text-accent-600" },
};

// ── Mock Data ──
const MOCK_ID_CARDS = [
  { firstName: "พุทธิพงษ์", lastName: "คาดสนิท", idNumber: "1100100234567" },
  { firstName: "สมหญิง", lastName: "รักสุข", idNumber: "1101400789012" },
  { firstName: "วิชัย", lastName: "มั่นคง", idNumber: "3100500345678" },
  { firstName: "อัญชลี", lastName: "แสงทอง", idNumber: "1500700901234" },
  { firstName: "ประยุทธ์", lastName: "ศรีสุข", idNumber: "1102003456789" },
  { firstName: "นภาพร", lastName: "วงศ์สวัสดิ์", idNumber: "1200800567890" },
  { firstName: "ธนกร", lastName: "เจริญสุข", idNumber: "1409900123456" },
  { firstName: "พิมพ์ใจ", lastName: "สว่างวงศ์", idNumber: "1301200678901" },
];

const MOCK_APPOINTMENTS = [
  {
    id: "eVMS-20260315-0042", visitorName: "นายวิชัย มั่นคง", idNumber: "3100500345678",
    host: "คุณสมศรี รักงาน", hostRole: "ผู้อำนวยการกองกิจการท่องเที่ยว",
    department: "กองกิจการท่องเที่ยว", floor: "ชั้น 4",
    purpose: "ประชุมหารือโครงการส่งเสริมการท่องเที่ยว", purposeId: 2,
    time: "09:00 - 10:30", status: "confirmed" as const, companions: 0, type: "official" as const,
    company: "บริษัท ทัวร์ไทย จำกัด",
  },
  {
    id: "eVMS-20260315-0043", visitorName: "นางอัญชลี แสงทอง", idNumber: "1500700901234",
    host: "คุณประเสริฐ ศรีวิไล", hostRole: "หัวหน้ากลุ่มงานบริหารทั่วไป",
    department: "กองกลาง", floor: "ชั้น 2",
    purpose: "ยื่นเอกสารสัญญาจ้าง", purposeId: 3,
    time: "10:00 - 11:00", status: "confirmed" as const, companions: 2, type: "meeting" as const,
    company: "สมาคมส่งเสริมการท่องเที่ยวไทย",
  },
  {
    id: "eVMS-20260315-0044", visitorName: "Mr. James Wilson", idNumber: "AA7890123",
    host: "คุณนภาพร วงศ์สวัสดิ์", hostRole: "ผู้เชี่ยวชาญด้านต่างประเทศ",
    department: "กองการต่างประเทศ", floor: "ชั้น 5",
    purpose: "Meeting - International Tourism Cooperation", purposeId: 2,
    time: "13:00 - 14:30", status: "confirmed" as const, companions: 1, type: "official" as const,
    company: "World Tourism Organization",
  },
  {
    id: "eVMS-20260315-0045", visitorName: "นายธนพล สุขสำราญ", idNumber: "1102003456001",
    host: "คุณประเสริฐ ศรีวิไล", hostRole: "หัวหน้ากลุ่มงานบริหารทั่วไป",
    department: "กองกลาง", floor: "ชั้น 2",
    purpose: "งานซ่อมบำรุงระบบปรับอากาศ", purposeId: 4,
    time: "08:00 - 17:00", status: "confirmed" as const, companions: 3, type: "contractor" as const,
    company: "บริษัท ก่อสร้างเอก จำกัด",
  },
  {
    id: "eVMS-20260315-0046", visitorName: "นายสมชาย ดีใจ", idNumber: "1301200678111",
    host: "คุณสมศรี รักงาน", hostRole: "ผู้อำนวยการกองกิจการท่องเที่ยว",
    department: "กองกิจการท่องเที่ยว", floor: "ชั้น 4",
    purpose: "ส่งเอกสารสัญญา", purposeId: 3,
    time: "09:30 - 10:00", status: "confirmed" as const, companions: 0, type: "document" as const,
    company: "บริษัท เอกสารด่วน จำกัด",
  },
  {
    id: "eVMS-20260315-0047", visitorName: "นางสาวพิมพ์ชนก แก้วมณี", idNumber: "1409900123999",
    host: "คุณนภาพร วงศ์สวัสดิ์", hostRole: "ผู้เชี่ยวชาญด้านต่างประเทศ",
    department: "กองการต่างประเทศ", floor: "ชั้น 5",
    purpose: "ประชุมวางแผนโครงการ", purposeId: 2,
    time: "14:00 - 15:30", status: "confirmed" as const, companions: 0, type: "meeting" as const,
    company: "สำนักงานส่งเสริมเศรษฐกิจดิจิทัล",
  },
  {
    id: "eVMS-20260315-0048", visitorName: "Mr. David Chen", idNumber: "BB1234567",
    host: "คุณสมศรี รักงาน", hostRole: "ผู้อำนวยการกองกิจการท่องเที่ยว",
    department: "กองกิจการท่องเที่ยว", floor: "ชั้น 4",
    purpose: "Business Partnership Discussion", purposeId: 2,
    time: "15:00 - 16:00", status: "confirmed" as const, companions: 2, type: "official" as const,
    company: "Asia Tourism Alliance",
  },
  {
    id: "eVMS-20260315-0049", visitorName: "นายกิตติ พงษ์พิพัฒน์", idNumber: "3100500345999",
    host: "คุณประเสริฐ ศรีวิไล", hostRole: "หัวหน้ากลุ่มงานบริหารทั่วไป",
    department: "กองกลาง", floor: "ชั้น 2",
    purpose: "ส่งพัสดุ", purposeId: 5,
    time: "11:00 - 11:30", status: "confirmed" as const, companions: 0, type: "delivery" as const,
    company: "บริษัท ขนส่งไทย จำกัด",
  },
];

const APPOINTMENT_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  official: { label: "พบเจ้าหน้าที่", icon: "🤝", color: "text-blue-600" },
  meeting: { label: "ประชุม / สัมมนา", icon: "📋", color: "text-purple-600" },
  document: { label: "ส่งเอกสาร", icon: "📄", color: "text-emerald-600" },
  contractor: { label: "ผู้รับเหมา / ซ่อมบำรุง", icon: "🔧", color: "text-orange-600" },
  delivery: { label: "รับ-ส่งสินค้า", icon: "📦", color: "text-cyan-600" },
  other: { label: "อื่นๆ", icon: "🔖", color: "text-gray-600" },
};

const MOCK_CHECKED_IN = [
  { name: "นายพุทธิพงษ์ คาดสนิท", slip: "eVMS-0089", timeIn: "08:32", department: "สำนักงานปลัดฯ", method: "auto-card-reader" as InputMethod, company: "บริษัท ไอที โปร จำกัด", host: "คุณสมศรี รักงาน", type: "official" as const, companions: 0, status: "checked-in" as const },
  { name: "Ms. Sarah Connor", slip: "eVMS-0088", timeIn: "08:45", department: "กองการต่างประเทศ", method: "passport-reader" as InputMethod, company: "US Embassy", host: "คุณนภาพร วงศ์สวัสดิ์", type: "official" as const, companions: 1, status: "checked-in" as const },
  { name: "นายธนกร เจริญสุข", slip: "eVMS-0087", timeIn: "09:10", department: "กองกลาง", method: "manual-officer" as InputMethod, company: "บริษัท ซ่อมเอก จำกัด", host: "คุณประเสริฐ ศรีวิไล", type: "contractor" as const, companions: 2, status: "checked-in" as const },
  { name: "นางสาวลภัสรดา ชูวงศ์", slip: "eVMS-0086", timeIn: "09:25", department: "กองกิจการท่องเที่ยว", method: "auto-card-reader" as InputMethod, company: "สมาคมท่องเที่ยวไทย", host: "คุณสมศรี รักงาน", type: "meeting" as const, companions: 0, status: "checked-in" as const },
  { name: "นายวรเดช สิริสม", slip: "eVMS-0085", timeIn: "09:40", department: "สำนักนโยบายและแผน", method: "manual-officer" as InputMethod, company: "บริษัท คอนซัลท์ จำกัด", host: "คุณประเสริฐ ศรีวิไล", type: "document" as const, companions: 0, status: "checked-in" as const },
  { name: "Mr. John Smith", slip: "eVMS-0084", timeIn: "10:05", department: "กองการต่างประเทศ", method: "passport-reader" as InputMethod, company: "JICA", host: "คุณนภาพร วงศ์สวัสดิ์", type: "official" as const, companions: 3, status: "checked-in" as const },
  { name: "นายอนุชา พลายงาม", slip: "eVMS-0083", timeIn: "10:15", department: "กรมพลศึกษา", method: "qr-scan" as InputMethod, company: "สมาคมกีฬาไทย", host: "คุณสมศรี รักงาน", type: "meeting" as const, companions: 0, status: "checked-in" as const },
  { name: "นางสุภาภรณ์ ดีงาม", slip: "eVMS-0082", timeIn: "10:30", department: "กองกลาง", method: "auto-card-reader" as InputMethod, company: "บริษัท เอกสารด่วน จำกัด", host: "คุณประเสริฐ ศรีวิไล", type: "delivery" as const, companions: 0, status: "checked-in" as const },
];

// ═══ Counter Selection Screen ═══
function CounterSelectionScreen({ onSelect }: { onSelect: (sp: ServicePoint) => void }) {
  const counters = servicePoints.filter(sp => sp.type === "counter" && sp.isActive);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <VmsLogo size={56} />
          <div className="text-left">
            <h1 className="text-2xl font-bold text-primary">Visitor Management System</h1>
            <p className="text-sm text-text-muted">ระบบลงทะเบียนผู้เยี่ยม — Counter Terminal</p>
          </div>
        </div>
        <p className="text-text-secondary mt-2">เลือกจุดบริการ Counter ที่ต้องการทำงาน</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {counters.map((sp) => {
          const staff = sp.assignedStaffId ? staffMembers.find(s => s.id === sp.assignedStaffId) : null;
          const purposeCount = sp.allowedPurposeIds.length;
          const docCount = sp.allowedDocumentIds.length;
          return (
            <button
              key={sp.id}
              onClick={() => onSelect(sp)}
              disabled={sp.status !== "online"}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all duration-200 group",
                sp.status === "online"
                  ? "border-primary/20 bg-white hover:border-primary hover:shadow-lg cursor-pointer"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    sp.status === "online" ? "bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{sp.name}</h3>
                    <p className="text-xs text-text-muted">{sp.nameEn}</p>
                  </div>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                  sp.status === "online" ? "bg-success-light text-success" : "bg-gray-100 text-gray-500"
                )}>
                  {sp.status === "online" ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {sp.status === "online" ? "Online" : "Offline"}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-text-muted shrink-0" /> {sp.location}
                </div>
                <div className="flex items-center gap-2">
                  <Building size={12} className="text-text-muted shrink-0" /> {sp.building} — {sp.floor}
                </div>
                {staff && (
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-text-muted shrink-0" /> ผู้รับผิดชอบ: {staff.name}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <span className="flex items-center gap-1 text-primary">
                    <Target size={11} /> {purposeCount} วัตถุประสงค์
                  </span>
                  <span className="flex items-center gap-1 text-accent-600">
                    <FileText size={11} /> {docCount} เอกสาร
                  </span>
                  <span className="flex items-center gap-1 text-text-muted">
                    <Activity size={11} /> {sp.todayTransactions} วันนี้
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <Link href="/counter">
          <Button variant="ghost" className="text-text-muted">
            <LogOut size={16} className="mr-2" /> กลับหน้า Login
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ═══ Input Method Badge ═══
function InputMethodBadge({ method }: { method: InputMethod }) {
  const cfg = INPUT_METHOD_LABELS[method];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.color)}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ═══ Summary Row ═══
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-[11px] text-text-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-text-primary text-right ml-2 truncate">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Main Counter Dashboard
// ═══════════════════════════════════════════════════
export default function CounterDashboard() {
  const [selectedCounter, setSelectedCounter] = useState<ServicePoint | null>(null);
  const [checkinMode, setCheckinMode] = useState<CheckinMode>("walkin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [contactHost, setContactHost] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [floorFilter, setFloorFilter] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPurposeId, setSelectedPurposeId] = useState<number | null>(null);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<number | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>("manual-officer");
  const [cardReaderStatus, setCardReaderStatus] = useState<CardReaderStatus>("idle");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<typeof MOCK_APPOINTMENTS[0] | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; slip: string; type: string; method: InputMethod } | null>(null);
  const [showStatePanel, setShowStatePanel] = useState(true);
  const [checkoutScan, setCheckoutScan] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [blocklistWarning, setBlocklistWarning] = useState<BlocklistEntry | null>(null);
  const [showBlocklistModal, setShowBlocklistModal] = useState(false);
  const [aptPage, setAptPage] = useState(1);
  const [checkedInPage, setCheckedInPage] = useState(1);
  const PANEL_PAGE_SIZE = 5;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const allowedPurposes = useMemo(() => {
    if (!selectedCounter) return [];
    return visitPurposeConfigs.filter(p => p.isActive && selectedCounter.allowedPurposeIds.includes(p.id));
  }, [selectedCounter]);

  const allowedDocuments = useMemo(() => {
    if (!selectedCounter) return [];
    return identityDocumentTypes.filter(d => selectedCounter.allowedDocumentIds.includes(d.id));
  }, [selectedCounter]);

  const filteredAppointments = MOCK_APPOINTMENTS.filter(a =>
    a.visitorName.includes(appointmentSearch) ||
    a.idNumber.includes(appointmentSearch) ||
    a.host.includes(appointmentSearch) ||
    a.id.toLowerCase().includes(appointmentSearch.toLowerCase())
  );

  const aptTotalPages = Math.max(1, Math.ceil(filteredAppointments.length / PANEL_PAGE_SIZE));
  const safeAptPage = Math.min(aptPage, aptTotalPages);
  const pagedAppointments = filteredAppointments.slice((safeAptPage - 1) * PANEL_PAGE_SIZE, safeAptPage * PANEL_PAGE_SIZE);

  const checkedInTotalPages = Math.max(1, Math.ceil(MOCK_CHECKED_IN.length / PANEL_PAGE_SIZE));
  const safeCheckedInPage = Math.min(checkedInPage, checkedInTotalPages);
  const pagedCheckedIn = MOCK_CHECKED_IN.slice((safeCheckedInPage - 1) * PANEL_PAGE_SIZE, safeCheckedInPage * PANEL_PAGE_SIZE);

  const handleReadCard = useCallback(() => {
    if (cardReaderStatus === "reading") return;
    setCardReaderStatus("reading");
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * MOCK_ID_CARDS.length);
      const mockData = MOCK_ID_CARDS[randomIndex];
      setFirstName(mockData.firstName);
      setLastName(mockData.lastName);
      setIdNumber(mockData.idNumber);
      setInputMethod("auto-card-reader");
      setSelectedDocTypeId(1);
      setCardReaderStatus("success");
      setTimeout(() => setCardReaderStatus("idle"), 2000);
    }, 1500);
  }, [cardReaderStatus]);

  const handleReadPassport = useCallback(() => {
    if (cardReaderStatus === "reading") return;
    setCardReaderStatus("reading");
    setTimeout(() => {
      setFirstName("James");
      setLastName("Wilson");
      setIdNumber("AA7890123");
      setInputMethod("passport-reader");
      setSelectedDocTypeId(2);
      setCardReaderStatus("success");
      setTimeout(() => setCardReaderStatus("idle"), 2000);
    }, 1500);
  }, [cardReaderStatus]);

  // Departments filtered by selected purpose
  const purposeDepartments = useMemo(() => {
    if (!selectedPurposeId) return [];
    const activeDepts = departments.filter(d => d.isActive);
    const deptIds = purposeDepartmentMap[selectedPurposeId];
    if (!deptIds) return activeDepts;
    return activeDepts.filter(d => deptIds.includes(d.id));
  }, [selectedPurposeId]);

  const purposeFloors = useMemo(() => {
    return [...new Set(purposeDepartments.map(d => getDepartmentLocation(d.id)?.floor).filter(Boolean) as string[])].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""));
      const numB = parseInt(b.replace(/\D/g, ""));
      return numA - numB;
    });
  }, [purposeDepartments]);

  const filteredDepartments = floorFilter
    ? purposeDepartments.filter(d => getDepartmentLocation(d.id)?.floor === floorFilter)
    : purposeDepartments;

  const selectedDepartment = selectedDepartmentId ? departments.find(d => d.id === selectedDepartmentId) : null;

  const handleReset = useCallback(() => {
    setFirstName("");
    setLastName("");
    setIdNumber("");
    setContactHost("");
    setPhoneNumber("");
    setSelectedPurposeId(null);
    setSelectedDepartmentId(null);
    setFloorFilter(null);
    setSelectedDocTypeId(null);
    setCardReaderStatus("idle");
    setInputMethod("manual-officer");
    setSelectedAppointment(null);
    setAppointmentSearch("");
  }, []);

  // Blocklist check — runs before save
  const handleCheckAndSave = useCallback(() => {
    const blocked = checkBlocklist(firstName, lastName);
    if (blocked) {
      setBlocklistWarning(blocked);
      setShowBlocklistModal(true);
      return; // ไม่ save → แสดง warning ก่อน
    }
    doSave();
  }, [firstName, lastName]);

  const doSave = useCallback(() => {
    const slip = `eVMS-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    if (checkinMode === "walkin") {
      setSuccessData({ name: `${firstName} ${lastName}`, slip, type: "Walk-in", method: inputMethod });
    } else if (selectedAppointment) {
      setSuccessData({ name: selectedAppointment.visitorName, slip, type: "นัดหมาย", method: inputMethod });
    }
    setShowSuccess(true);
    setShowBlocklistModal(false);
    setBlocklistWarning(null);
  }, [checkinMode, firstName, lastName, selectedAppointment, inputMethod]);

  // Keep old ref for backward compat
  const handleSave = handleCheckAndSave;

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setSuccessData(null);
    handleReset();
  }, [handleReset]);

  const handleSelectAppointment = useCallback((apt: typeof MOCK_APPOINTMENTS[0]) => {
    setSelectedAppointment(apt);
    setInputMethod("qr-scan");
    const nameParts = apt.visitorName.replace(/^(นาย|นาง|นางสาว|Mr\.|Ms\.|Mrs\.)\s*/i, "").split(" ");
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");
    setIdNumber(apt.idNumber);
    setSelectedPurposeId(apt.purposeId);
  }, []);

  const canSaveWalkin = firstName.trim() && lastName.trim() && idNumber.trim() && selectedPurposeId && selectedDepartmentId;

  // Counter Selection Screen
  if (!selectedCounter) {
    return <CounterSelectionScreen onSelect={setSelectedCounter} />;
  }

  const counterStaff = selectedCounter.assignedStaffId ? staffMembers.find(s => s.id === selectedCounter.assignedStaffId) : null;

  // Resolve current state for StatePanel
  const currentCounterState = resolveCounterState({
    hasCounter: !!selectedCounter,
    checkinMode: checkinMode as CounterCheckinMode,
    hasIdentity: !!(firstName.trim() && lastName.trim() && idNumber.trim()),
    hasPurpose: !!selectedPurposeId,
    hasDepartment: !!selectedDepartmentId,
    hasAppointment: !!selectedAppointment,
    showSuccess,
    cardReaderStatus,
  });

  const statePanelData = {
    checkinMode,
    inputMethod,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    idNumber: idNumber || undefined,
    selectedPurposeId: selectedPurposeId || undefined,
    selectedDepartmentId: selectedDepartmentId || undefined,
    selectedDocTypeId: selectedDocTypeId || undefined,
    appointmentId: selectedAppointment?.id || undefined,
    cardReaderStatus,
    counterName: selectedCounter.name,
    allowedPurposes: allowedPurposes.length,
    allowedDocuments: allowedDocuments.length,
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header Bar ── */}
      <header className="h-14 bg-gradient-to-r from-primary-900 to-primary flex items-center justify-between px-4 text-white shrink-0">
        <div className="flex items-center gap-3">
          <VmsLogo size={36} darkMode />
          <div className="border-l border-white/20 pl-3">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-white/70" />
              <h1 className="font-bold text-sm leading-tight">{selectedCounter.name}</h1>
            </div>
            <p className="text-[11px] text-white/50">{selectedCounter.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-white/70 text-xs">
            <Activity size={14} />
            <span className="font-bold text-white">{selectedCounter.todayTransactions}</span>
            <span>รายการวันนี้</span>
          </div>
          {counterStaff && (
            <div className="flex items-center gap-1.5 text-white/70 text-xs border-l border-white/20 pl-4">
              <User size={14} />
              <span className="text-white font-medium">{counterStaff.name}</span>
            </div>
          )}
          <div className="text-right border-l border-white/20 pl-4">
            <p className="text-lg font-mono font-bold leading-none">{time}</p>
            <p className="text-[10px] text-white/50">{date}</p>
          </div>
          <div className="flex items-center gap-1 border-l border-white/20 pl-3">
            <button onClick={() => setShowStatePanel(!showStatePanel)} className={cn("p-2 rounded-lg transition-colors", showStatePanel ? "bg-white/20" : "hover:bg-white/10")} title="Toggle State Panel">
              <Code size={16} />
            </button>
            <button onClick={() => setSelectedCounter(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="เปลี่ยน Counter">
              <ArrowLeftRight size={16} />
            </button>
            <Link href="/counter">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="ออกจากระบบ">
                <LogOut size={16} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main 3-Column Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ LEFT PANEL: Queue & Checkout ═══ */}
        <div className="w-[300px] border-r border-border bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => { setCheckinMode("walkin"); handleReset(); }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  checkinMode === "walkin" ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-primary"
                )}
              >
                <UserPlus size={14} /> Walk-in
              </button>
              <button
                onClick={() => { setCheckinMode("appointment"); handleReset(); }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  checkinMode === "appointment" ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-primary"
                )}
              >
                <Calendar size={14} /> นัดหมาย
              </button>
            </div>
          </div>

          {checkinMode === "appointment" ? (
            <>
              <div className="p-3 border-b border-border">
                <Input placeholder="ค้นหาชื่อ, เลขบัตร, รหัสนัด..." value={appointmentSearch} onChange={(e) => { setAppointmentSearch(e.target.value); setAptPage(1); }} leftIcon={<Search size={14} />} className="text-xs" />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">ไม่พบนัดหมาย</p>
                  </div>
                ) : (
                  pagedAppointments.map((apt) => {
                    const typeInfo = APPOINTMENT_TYPES[apt.type] || APPOINTMENT_TYPES.other;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => handleSelectAppointment(apt)}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 text-left transition-all duration-200",
                          selectedAppointment?.id === apt.id ? "border-primary bg-primary-50" : "border-gray-100 bg-white hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                              {apt.visitorName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-text-primary block leading-tight">{apt.visitorName}</span>
                              <span className="text-[10px] text-text-muted">{apt.company}</span>
                            </div>
                          </div>
                          {selectedAppointment?.id === apt.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 mb-1">
                          <span className={cn("text-sm", typeInfo.color)}>{typeInfo.icon}</span>
                          <span className="text-[10px] font-medium text-text-secondary">{typeInfo.label}</span>
                          <span className="text-[10px] text-text-muted ml-auto">{apt.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
                          <Users size={9} className="text-text-muted shrink-0" />
                          <span className="truncate">{apt.host}</span>
                          <span className="text-text-muted">·</span>
                          <span className="truncate text-text-muted">{apt.department}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">{apt.id}</Badge>
                          <div className="flex items-center gap-2">
                            {apt.companions > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-50 text-[10px] font-bold text-primary">+{apt.companions}</span>
                            )}
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-info-light text-info">ยืนยันแล้ว</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {/* Appointment Pagination */}
              {aptTotalPages > 1 && (
                <div className="px-3 py-2 border-t border-border flex items-center justify-between bg-gray-50/50">
                  <span className="text-[10px] text-text-muted">
                    {(safeAptPage - 1) * PANEL_PAGE_SIZE + 1}–{Math.min(safeAptPage * PANEL_PAGE_SIZE, filteredAppointments.length)} จาก {filteredAppointments.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setAptPage(Math.max(1, safeAptPage - 1))} disabled={safeAptPage <= 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-text-muted"><ChevronLeft size={14} /></button>
                    {Array.from({ length: aptTotalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setAptPage(p)} className={cn("min-w-[22px] h-[22px] rounded text-[10px] font-bold", p === safeAptPage ? "bg-primary text-white" : "text-text-muted hover:bg-gray-200")}>{p}</button>
                    ))}
                    <button onClick={() => setAptPage(Math.min(aptTotalPages, safeAptPage + 1))} disabled={safeAptPage >= aptTotalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-text-muted"><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mb-2">
                  <Shield size={12} className="text-primary" /> ลงทะเบียนออก (Check-out)
                </h3>
                <Input placeholder="สแกน QR / Barcode บัตร..." value={checkoutScan} onChange={(e) => setCheckoutScan(e.target.value)} leftIcon={<Scan size={14} />} className="text-xs" />
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold text-text-muted mb-1.5 flex items-center gap-1"><Activity size={11} /> ผู้เข้าพบ ณ ขณะนี้ ({MOCK_CHECKED_IN.length})</p>
                </div>
                {pagedCheckedIn.map((v, idx) => {
                  const typeInfo = APPOINTMENT_TYPES[v.type] || APPOINTMENT_TYPES.other;
                  return (
                    <div key={idx} className="px-3 py-2.5 border-b border-gray-50 hover:bg-primary-50/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                          {v.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-text-primary block truncate">{v.name}</span>
                          <span className="text-[10px] text-text-muted truncate block">{v.company}</span>
                        </div>
                        <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2 rounded-md shrink-0">Out</Button>
                      </div>
                      <div className="flex items-center gap-1.5 ml-9 mb-1">
                        <span className={cn("text-xs", typeInfo.color)}>{typeInfo.icon}</span>
                        <span className="text-[10px] font-medium text-text-secondary">{typeInfo.label}</span>
                        <span className="text-[10px] text-text-muted ml-auto">เข้า {v.timeIn}</span>
                      </div>
                      <div className="flex items-center justify-between ml-9">
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                          <span>{v.slip}</span><span>·</span><span>{v.host}</span><span>·</span><span>{v.department}</span>
                        </div>
                        {v.companions > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-50 text-[10px] font-bold text-primary">+{v.companions}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Checked-in Pagination */}
              {checkedInTotalPages > 1 && (
                <div className="px-3 py-2 border-t border-border flex items-center justify-between bg-gray-50/50">
                  <span className="text-[10px] text-text-muted">
                    {(safeCheckedInPage - 1) * PANEL_PAGE_SIZE + 1}–{Math.min(safeCheckedInPage * PANEL_PAGE_SIZE, MOCK_CHECKED_IN.length)} จาก {MOCK_CHECKED_IN.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCheckedInPage(Math.max(1, safeCheckedInPage - 1))} disabled={safeCheckedInPage <= 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-text-muted"><ChevronLeft size={14} /></button>
                    {Array.from({ length: checkedInTotalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setCheckedInPage(p)} className={cn("min-w-[22px] h-[22px] rounded text-[10px] font-bold", p === safeCheckedInPage ? "bg-primary text-white" : "text-text-muted hover:bg-gray-200")}>{p}</button>
                    ))}
                    <button onClick={() => setCheckedInPage(Math.min(checkedInTotalPages, safeCheckedInPage + 1))} disabled={safeCheckedInPage >= checkedInTotalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-text-muted"><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ CENTER PANEL: Data Entry ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          <div className="h-11 bg-white border-b border-border px-4 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-primary text-sm flex items-center gap-2">
              {checkinMode === "walkin" ? <><UserPlus size={16} /> ลงทะเบียนเข้า — Walk-in</> : <><Calendar size={16} /> ลงทะเบียนเข้า — มีนัดหมาย</>}
            </h2>
            <div className="flex items-center gap-2">
              <InputMethodBadge method={inputMethod} />
              <Button size="sm" variant="ghost" className="h-7 text-xs text-text-muted" onClick={handleReset}>
                <RefreshCw size={12} className="mr-1" /> รายการใหม่
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
              {/* Card Reader / ID Input */}
              <div className="col-span-2">
                <div className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                      <CreditCard size={13} className="text-primary" /> ยืนยันตัวตน
                    </h3>
                    {allowedDocuments.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {allowedDocuments.map(doc => (
                          <button key={doc.id} onClick={() => setSelectedDocTypeId(doc.id)} className={cn(
                            "px-2 py-1 rounded-lg text-[11px] font-medium transition-all border",
                            selectedDocTypeId === doc.id ? "border-primary bg-primary-50 text-primary" : "border-gray-200 text-text-muted hover:border-primary/30"
                          )}>
                            {doc.icon} {doc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button onClick={handleReadCard} className={cn(
                      "border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                      cardReaderStatus === "reading" ? "bg-amber-50 border-amber-400 text-amber-700" :
                      cardReaderStatus === "success" && inputMethod === "auto-card-reader" ? "bg-emerald-50 border-emerald-400 text-emerald-700" :
                      "bg-primary-50 border-primary/30 text-primary hover:bg-primary-100"
                    )}>
                      {cardReaderStatus === "reading" ? (
                        <><Loader2 size={24} className="mb-1 animate-spin text-amber-500" /><span className="font-bold text-[11px]">กำลังอ่านบัตร...</span></>
                      ) : (
                        <><CreditCard size={24} className="mb-1" /><span className="font-bold text-[11px]">อ่านบัตรประชาชน</span><span className="text-[10px] opacity-60">Smart Card Reader</span></>
                      )}
                    </button>

                    <button onClick={handleReadPassport} className={cn(
                      "border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                      cardReaderStatus === "reading" ? "opacity-50 cursor-not-allowed" :
                      inputMethod === "passport-reader" && cardReaderStatus === "success" ? "bg-emerald-50 border-emerald-400 text-emerald-700" :
                      "bg-info-light border-info/30 text-info hover:bg-blue-100"
                    )}>
                      <FileText size={24} className="mb-1" /><span className="font-bold text-[11px]">อ่าน Passport</span><span className="text-[10px] opacity-60">Passport Reader</span>
                    </button>

                    <button onClick={() => setInputMethod("manual-officer")} className={cn(
                      "border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                      inputMethod === "manual-officer" ? "bg-warning-light border-warning/30 text-warning" : "bg-gray-50 border-gray-200 text-text-muted hover:bg-gray-100"
                    )}>
                      <Keyboard size={24} className="mb-1" /><span className="font-bold text-[11px]">คีย์ข้อมูลเอง</span><span className="text-[10px] opacity-60">Manual Input</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Input label="ชื่อ (First Name)" placeholder="ชื่อ" value={firstName} onChange={(e) => { setFirstName(e.target.value); if (inputMethod !== "manual-officer") setInputMethod("manual-officer"); }} className="text-sm" />
                    <Input label="นามสกุล (Last Name)" placeholder="นามสกุล" value={lastName} onChange={(e) => { setLastName(e.target.value); if (inputMethod !== "manual-officer") setInputMethod("manual-officer"); }} className="text-sm" />
                    <Input label="เลขบัตร / Passport" placeholder="เลขบัตร" value={idNumber} onChange={(e) => { setIdNumber(e.target.value); if (inputMethod !== "manual-officer") setInputMethod("manual-officer"); }} className="text-sm" />
                  </div>
                </div>
              </div>

              {/* Purpose Selection */}
              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mb-3">
                  <Target size={13} className="text-primary" /> วัตถุประสงค์
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {allowedPurposes.map(purpose => (
                    <button key={purpose.id} onClick={() => { setSelectedPurposeId(purpose.id); setSelectedDepartmentId(null); setFloorFilter(null); }} className={cn(
                      "p-2.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-2",
                      selectedPurposeId === purpose.id ? "border-primary bg-primary-50 text-primary" : "border-gray-100 bg-white text-text-secondary hover:border-primary/30"
                    )}>
                      <span className="text-lg">{purpose.icon}</span>
                      <div>
                        <p className="text-xs font-bold leading-tight">{purpose.name}</p>
                        <p className="text-[10px] opacity-60">{purpose.nameEn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department / Location Selection — shows after purpose */}
              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mb-3">
                  <Building size={13} className="text-primary" /> สถานที่ / หน่วยงาน
                </h3>
                {!selectedPurposeId ? (
                  <div className="text-center py-6 text-text-muted">
                    <Target size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">กรุณาเลือกวัตถุประสงค์ก่อน</p>
                    <p className="text-[10px] opacity-60">Select purpose first</p>
                  </div>
                ) : (
                  <>
                    {/* Floor filter buttons */}
                    {purposeFloors.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <button
                          onClick={() => setFloorFilter(null)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border",
                            !floorFilter ? "border-primary bg-primary-50 text-primary" : "border-gray-200 text-text-muted hover:border-primary/30"
                          )}
                        >
                          ทั้งหมด
                        </button>
                        {purposeFloors.map(floor => (
                          <button
                            key={floor}
                            onClick={() => setFloorFilter(floor === floorFilter ? null : floor)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border",
                              floorFilter === floor ? "border-primary bg-primary-50 text-primary" : "border-gray-200 text-text-muted hover:border-primary/30"
                            )}
                          >
                            {floor}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {filteredDepartments.map(dept => (
                        <button
                          key={dept.id}
                          onClick={() => setSelectedDepartmentId(dept.id)}
                          className={cn(
                            "w-full p-2.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-2",
                            selectedDepartmentId === dept.id ? "border-primary bg-primary-50 text-primary" : "border-gray-100 bg-white text-text-secondary hover:border-primary/30"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                            selectedDepartmentId === dept.id ? "bg-primary text-white" : "bg-gray-100 text-text-muted"
                          )}>
                            <MapPin size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{dept.name}</p>
                            <p className="text-[10px] opacity-60 truncate">{dept.nameEn}</p>
                          </div>
                          <span className="text-[10px] text-text-muted shrink-0">{getDepartmentLocation(dept.id)?.floor ?? ""}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Contact Info */}
              <div className="col-span-2">
                <div className="bg-white rounded-xl border border-border p-4">
                  <h3 className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mb-3">
                    <Users size={13} className="text-primary" /> ข้อมูลการติดต่อ
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ผู้ที่มาพบ" placeholder="ค้นหาชื่อ..." value={contactHost} onChange={(e) => setContactHost(e.target.value)} leftIcon={<Search size={14} />} className="text-sm" />
                    <Input label="เบอร์โทรศัพท์" placeholder="08x-xxx-xxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} leftIcon={<Phone size={14} />} className="text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL: Summary & Actions ═══ */}
        <div className="w-[280px] border-l border-border bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-text-muted cursor-pointer hover:border-primary/30 hover:bg-primary-50/30 transition-all">
              <Camera size={32} className="mb-2 opacity-40" />
              <p className="text-xs font-bold">ถ่ายภาพผู้ติดต่อ</p>
              <p className="text-[10px] opacity-60">คลิกเพื่อถ่ายภาพ</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-bold text-text-secondary mb-3 flex items-center gap-1.5">
              <FileText size={12} className="text-primary" /> สรุปข้อมูล
            </h3>
            <div className="space-y-2.5">
              <SummaryRow label="ชื่อ-นามสกุล" value={firstName && lastName ? `${firstName} ${lastName}` : "-"} />
              <SummaryRow label="เลขบัตร" value={idNumber || "-"} />
              <SummaryRow label="เอกสาร" value={selectedDocTypeId ? identityDocumentTypes.find(d => d.id === selectedDocTypeId)?.name || "-" : "-"} />
              <SummaryRow label="วัตถุประสงค์" value={selectedPurposeId ? visitPurposeConfigs.find(p => p.id === selectedPurposeId)?.name || "-" : "-"} />
              <SummaryRow label="หน่วยงาน" value={selectedDepartment ? selectedDepartment.name : "-"} />
              <SummaryRow label="ชั้น / อาคาร" value={selectedDepartment ? (() => { const loc = getDepartmentLocation(selectedDepartment.id); return loc ? `${loc.floor} — ${loc.building}` : "-"; })() : "-"} />
              <SummaryRow label="ผู้ที่มาพบ" value={contactHost || selectedAppointment?.host || "-"} />
              <SummaryRow label="เบอร์โทร" value={phoneNumber || "-"} />
              <div className="pt-2 border-t border-dashed border-gray-200">
                <SummaryRow label="วิธีป้อนข้อมูล" value="" />
                <div className="mt-1"><InputMethodBadge method={inputMethod} /></div>
              </div>
              {checkinMode === "appointment" && selectedAppointment && (
                <div className="pt-2 border-t border-dashed border-gray-200">
                  <SummaryRow label="รหัสนัดหมาย" value={selectedAppointment.id} />
                  <SummaryRow label="สถานที่" value={`${selectedAppointment.department} ${selectedAppointment.floor}`} />
                  <SummaryRow label="เวลานัด" value={selectedAppointment.time} />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            {checkinMode === "walkin" ? (
              <Button fullWidth size="lg" className={cn(
                "h-14 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white transition-all",
                !canSaveWalkin ? "opacity-40 cursor-not-allowed" : "hover:shadow-lg"
              )} disabled={!canSaveWalkin} onClick={handleSave}>
                <Printer size={20} className="mr-2" /> บันทึก & พิมพ์บัตร
              </Button>
            ) : (
              <Button fullWidth size="lg" className={cn(
                "h-14 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white transition-all",
                !selectedAppointment ? "opacity-40 cursor-not-allowed" : "hover:shadow-lg"
              )} disabled={!selectedAppointment} onClick={handleSave}>
                <Check size={20} className="mr-2" /> ยืนยัน Check-in
              </Button>
            )}
            <Button fullWidth variant="outline" className="h-10 text-sm font-medium rounded-xl border-border" onClick={handleReset}>
              <RefreshCw size={14} className="mr-2" /> ล้างข้อมูล
            </Button>
          </div>
        </div>
      </div>

      {/* ── Footer Bar ── */}
      <footer className="h-8 bg-white border-t border-border px-4 flex items-center justify-between text-[11px] text-text-muted shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
            {selectedCounter.status === "online" ? "Online" : "Offline"}
          </span>
          <span>IP: {selectedCounter.ipAddress}</span>
          <span>S/N: {selectedCounter.serialNumber}</span>
          <span>{selectedCounter.building} — {selectedCounter.floor}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{allowedPurposes.length} วัตถุประสงค์</span>
          <span>{allowedDocuments.length} เอกสาร</span>
          <span className="font-medium text-primary">eVMS Counter v1.0</span>
        </div>
      </footer>

      {/* ── Success Overlay ── */}
      {showSuccess && successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center text-white relative">
              <button onClick={handleCloseSuccess} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors" title="Close" aria-label="Close">
                <X size={14} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-xl font-bold">ลงทะเบียนสำเร็จ!</h2>
              <p className="text-xs text-white/80 mt-1">Check-in Completed</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">หมายเลขบัตร</span>
                  <span className="font-mono font-bold text-primary text-base">{successData.slip}</span>
                </div>
                <div className="border-t border-dashed border-gray-200"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">ชื่อ</span>
                  <span className="font-bold text-text-primary">{successData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">ประเภท</span>
                  <Badge className="bg-primary/10 text-primary">{successData.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">วิธีป้อนข้อมูล</span>
                  <InputMethodBadge method={successData.method} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">เวลาเข้า</span>
                  <span className="text-sm font-medium text-text-secondary">{time}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button fullWidth variant="outline" className="h-11 rounded-xl font-bold" onClick={handleCloseSuccess}>ปิด</Button>
                <Button fullWidth className="h-11 rounded-xl font-bold bg-gradient-to-r from-primary to-primary-dark text-white" onClick={handleCloseSuccess}>
                  <Printer size={16} className="mr-2" /> พิมพ์บัตร
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ═══ BLOCKLIST WARNING MODAL ═══ */}
      {showBlocklistModal && blocklistWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Shield size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Blocklist Warning</h3>
                <p className="text-xs text-white/80">พบรายชื่อในระบบ Blocklist</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">ชื่อ-สกุล</span>
                  <span className="font-bold text-red-800">{blocklistWarning.visitor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">ประเภท</span>
                  <span className={cn("font-bold px-2 py-0.5 rounded-full text-xs",
                    blocklistWarning.type === "permanent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                    {blocklistWarning.type === "permanent" ? "ถาวร (Permanent)" : "ชั่วคราว (Temporary)"}
                  </span>
                </div>
                {blocklistWarning.expiryDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">หมดอายุ</span>
                    <span className="font-bold text-red-800">{blocklistWarning.expiryDate}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-text-secondary mb-1">เหตุผลการ Block</p>
                <p className="text-sm text-text-primary bg-gray-50 rounded-xl p-3 border border-border">{blocklistWarning.reason}</p>
              </div>

              <div className="text-xs text-text-muted">
                <p>เพิ่มโดย: {blocklistWarning.addedBy} | วันที่: {blocklistWarning.addedAt}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowBlocklistModal(false); setBlocklistWarning(null); handleReset(); }}
                className="flex-1 h-11 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
                ยกเลิก — กลับหน้าหลัก
              </button>
              {blocklistWarning.type === "temporary" && (
                <button onClick={doSave}
                  className="flex-1 h-11 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors">
                  ดำเนินการต่อ (ชั่วคราว)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STATE PANEL (Dev Tool) ═══ */}
      {showStatePanel && (
        <div className="w-[300px] shrink-0 border-l border-gray-800">
          <CounterStatePanel
            currentState={currentCounterState}
            checkinMode={checkinMode as CounterCheckinMode}
            stateData={statePanelData}
          />
        </div>
      )}
    </div>
  );
}
