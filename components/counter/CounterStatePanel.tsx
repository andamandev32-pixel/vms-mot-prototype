"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Code, ArrowRight, Zap, Monitor, CreditCard, Keyboard, FileText, Scan, Fingerprint, Camera, Printer, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import CounterApiSection from "@/components/counter/CounterApiSection";

// ── Counter State Types ──
export type CounterState =
  | "COUNTER_SELECTION"
  | "IDLE"
  | "WALKIN_IDENTITY"
  | "WALKIN_PURPOSE"
  | "WALKIN_DEPARTMENT"
  | "WALKIN_CONTACT"
  | "WALKIN_PHOTO"
  | "WALKIN_REVIEW"
  | "APPOINTMENT_SEARCH"
  | "APPOINTMENT_IDENTITY"
  | "APPOINTMENT_REVIEW"
  | "CHECKOUT_SCAN"
  | "CHECKOUT_CONFIRM"
  | "PRINT_SLIP"
  | "SUCCESS";

export type CounterCheckinMode = "walkin" | "appointment";

interface CounterStateInfo {
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  transitions: { event: string; targetState: CounterState; condition?: string }[];
  devices?: { name: string; nameEn: string; icon: React.ReactNode; flutterPlugin?: string }[];
  conditions?: string[];
  conditionsEn?: string[];
  flutterHint?: { bloc: string; state: string; device?: string; plugin?: string };
}

// ── State Configuration Map ──
const COUNTER_STATE_MAP: Record<CounterState, CounterStateInfo> = {
  COUNTER_SELECTION: {
    label: "เลือกจุดบริการ",
    labelEn: "Counter Selection",
    description: "เจ้าหน้าที่เลือกจุด Counter ที่ต้องการปฏิบัติงาน โหลดการตั้งค่า (วัตถุประสงค์, เอกสาร) ตาม ServicePoint",
    descriptionEn: "Officer selects the counter station. Loads config (allowed purposes, documents) from ServicePoint settings.",
    transitions: [
      { event: "SELECT_COUNTER", targetState: "IDLE", condition: "counter.status === 'online'" },
    ],
    conditions: ["Counter ต้องอยู่ในสถานะ online", "โหลด allowedPurposeIds, allowedDocumentIds จาก ServicePoint"],
    conditionsEn: ["Counter must be online", "Load allowedPurposeIds, allowedDocumentIds from ServicePoint"],
    flutterHint: { bloc: "CounterBloc", state: "CounterSelectionState" },
  },
  IDLE: {
    label: "รอรับผู้เยี่ยม",
    labelEn: "Idle — Ready",
    description: "หน้าจอหลักพร้อมรับลงทะเบียน สามารถเลือก Walk-in หรือ นัดหมาย ด้าน Left Panel แสดงรายชื่อผู้อยู่ในพื้นที่",
    descriptionEn: "Main dashboard ready for check-in. Left panel shows walk-in/appointment toggle and current visitors list.",
    transitions: [
      { event: "START_WALKIN", targetState: "WALKIN_IDENTITY" },
      { event: "START_APPOINTMENT", targetState: "APPOINTMENT_SEARCH" },
      { event: "SCAN_CHECKOUT", targetState: "CHECKOUT_SCAN" },
      { event: "SWITCH_COUNTER", targetState: "COUNTER_SELECTION" },
    ],
    conditions: ["เจ้าหน้าที่ล็อกอินแล้ว", "แสดงนาฬิกา, จำนวนรายการวันนี้"],
    conditionsEn: ["Officer is logged in", "Show clock, today's transaction count"],
    flutterHint: { bloc: "CounterBloc", state: "CounterIdleState" },
  },
  WALKIN_IDENTITY: {
    label: "ยืนยันตัวตน (Walk-in)",
    labelEn: "Walk-in Identity Verification",
    description: "อ่านบัตรประชาชน / Passport / คีย์ข้อมูลเอง เพื่อได้ชื่อ-นามสกุล, เลขบัตร อัตโนมัติ หรือ manual",
    descriptionEn: "Read Thai ID card / Passport via reader, or manual key-in. Auto-fills name and ID number.",
    transitions: [
      { event: "CARD_READ_SUCCESS", targetState: "WALKIN_PURPOSE", condition: "auto-fill name + ID" },
      { event: "MANUAL_INPUT_COMPLETE", targetState: "WALKIN_PURPOSE" },
      { event: "RESET", targetState: "IDLE" },
    ],
    devices: [
      { name: "เครื่องอ่านบัตรประชาชน", nameEn: "Smart Card Reader", icon: <CreditCard size={12} />, flutterPlugin: "flutter_pcsc / flutter_nfc" },
      { name: "เครื่องอ่าน Passport", nameEn: "Passport Reader (OCR/MRZ)", icon: <FileText size={12} />, flutterPlugin: "camera + google_mlkit_text_recognition" },
      { name: "คีย์ข้อมูลเอง", nameEn: "Manual Keyboard Input", icon: <Keyboard size={12} /> },
    ],
    conditions: ["เลือกประเภทเอกสารตาม allowedDocumentIds", "CardReader ต้อง connected"],
    conditionsEn: ["Document types filtered by allowedDocumentIds", "Card Reader must be connected"],
    flutterHint: { bloc: "CounterBloc", state: "WalkinIdentityState", device: "SmartCardReader", plugin: "flutter_pcsc" },
  },
  WALKIN_PURPOSE: {
    label: "เลือกวัตถุประสงค์",
    labelEn: "Select Visit Purpose",
    description: "เลือกวัตถุประสงค์จากรายการที่ตั้งค่าไว้ใน ServicePoint.allowedPurposeIds แสดงเฉพาะรายการที่ active",
    descriptionEn: "Select visit purpose from ServicePoint.allowedPurposeIds. Only active purposes are shown.",
    transitions: [
      { event: "PURPOSE_SELECTED", targetState: "WALKIN_DEPARTMENT" },
      { event: "RESET", targetState: "IDLE" },
    ],
    conditions: ["แสดงเฉพาะวัตถุประสงค์ที่ isActive && อยู่ใน allowedPurposeIds"],
    conditionsEn: ["Show only purposes where isActive && in allowedPurposeIds"],
    flutterHint: { bloc: "CounterBloc", state: "WalkinPurposeState" },
  },
  WALKIN_DEPARTMENT: {
    label: "เลือกสถานที่ / หน่วยงาน",
    labelEn: "Select Department / Location",
    description: "เลือกหน่วยงานปลายทาง กรองตาม purposeDepartmentMap[purposeId] แสดง ชั้น/อาคาร สามารถ filter ตามชั้นได้",
    descriptionEn: "Select destination department filtered by purposeDepartmentMap[purposeId]. Supports floor tab filtering.",
    transitions: [
      { event: "DEPARTMENT_SELECTED", targetState: "WALKIN_CONTACT" },
      { event: "BACK", targetState: "WALKIN_PURPOSE" },
      { event: "RESET", targetState: "IDLE" },
    ],
    conditions: ["departments กรองตาม purposeDepartmentMap", "Auto-select ถ้ามี 1 dept"],
    conditionsEn: ["Filter departments by purposeDepartmentMap", "Auto-select if only 1 dept"],
    flutterHint: { bloc: "CounterBloc", state: "WalkinDepartmentState" },
  },
  WALKIN_CONTACT: {
    label: "ข้อมูลการติดต่อ",
    labelEn: "Contact Information",
    description: "กรอกข้อมูลผู้ที่มาพบ, เบอร์โทร (optional fields)",
    descriptionEn: "Enter host contact name, phone number (optional fields)",
    transitions: [
      { event: "CONTACT_FILLED", targetState: "WALKIN_PHOTO" },
      { event: "SKIP_PHOTO", targetState: "WALKIN_REVIEW" },
      { event: "RESET", targetState: "IDLE" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "WalkinContactState" },
  },
  WALKIN_PHOTO: {
    label: "ถ่ายภาพผู้ติดต่อ",
    labelEn: "Capture Visitor Photo",
    description: "ถ่ายภาพผู้เยี่ยมด้วยกล้อง Webcam สำหรับพิมพ์บัตร",
    descriptionEn: "Capture visitor photo via webcam for badge printing",
    transitions: [
      { event: "PHOTO_CAPTURED", targetState: "WALKIN_REVIEW" },
      { event: "SKIP", targetState: "WALKIN_REVIEW" },
    ],
    devices: [
      { name: "กล้อง Webcam", nameEn: "USB Webcam", icon: <Camera size={12} />, flutterPlugin: "camera" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "WalkinPhotoState", device: "Webcam", plugin: "camera" },
  },
  WALKIN_REVIEW: {
    label: "ตรวจสอบข้อมูล (Walk-in)",
    labelEn: "Walk-in Review & Confirm",
    description: "แสดงสรุปข้อมูลทั้งหมด (Right Panel) ให้ รปภ. ตรวจสอบก่อนบันทึก",
    descriptionEn: "Summary panel on the right shows all data for review before saving.",
    transitions: [
      { event: "SAVE_AND_PRINT", targetState: "PRINT_SLIP" },
      { event: "EDIT", targetState: "WALKIN_IDENTITY" },
      { event: "RESET", targetState: "IDLE" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "WalkinReviewState" },
  },
  APPOINTMENT_SEARCH: {
    label: "ค้นหานัดหมาย",
    labelEn: "Search Appointment",
    description: "ค้นหานัดหมายจากชื่อผู้เยี่ยม, เลขบัตร, รหัสนัด, หรือชื่อ host",
    descriptionEn: "Search appointment by visitor name, ID number, appointment code, or host name",
    transitions: [
      { event: "SELECT_APPOINTMENT", targetState: "APPOINTMENT_IDENTITY" },
      { event: "SWITCH_TO_WALKIN", targetState: "WALKIN_IDENTITY" },
      { event: "RESET", targetState: "IDLE" },
    ],
    conditions: ["โหลดนัดหมายวันนี้จาก API", "Filter ตาม keyword"],
    conditionsEn: ["Load today's appointments from API", "Filter by keyword"],
    flutterHint: { bloc: "CounterBloc", state: "AppointmentSearchState" },
  },
  APPOINTMENT_IDENTITY: {
    label: "ยืนยันตัวตน (นัดหมาย)",
    labelEn: "Appointment Identity Verification",
    description: "ยืนยันตัวตนผู้เยี่ยมที่มีนัดหมาย — อ่านบัตร หรือ scan QR จากมือถือ ข้อมูลชื่อ/เลขบัตร auto-fill จาก appointment",
    descriptionEn: "Verify visitor identity for appointment — card reader or QR scan from mobile. Auto-fill from appointment data.",
    transitions: [
      { event: "IDENTITY_VERIFIED", targetState: "APPOINTMENT_REVIEW" },
      { event: "RESET", targetState: "IDLE" },
    ],
    devices: [
      { name: "เครื่องอ่านบัตรประชาชน", nameEn: "Smart Card Reader", icon: <CreditCard size={12} /> },
      { name: "QR Scanner", nameEn: "QR Code Scanner", icon: <Scan size={12} />, flutterPlugin: "mobile_scanner" },
      { name: "ThaiID App", nameEn: "ThaiID Digital ID", icon: <Fingerprint size={12} /> },
    ],
    conditions: ["เลขบัตรต้องตรงกับนัดหมาย", "นัดหมายต้อง status === 'confirmed'"],
    conditionsEn: ["ID number must match appointment", "Appointment status must be 'confirmed'"],
    flutterHint: { bloc: "CounterBloc", state: "AppointmentIdentityState", device: "SmartCardReader / QRScanner" },
  },
  APPOINTMENT_REVIEW: {
    label: "ตรวจสอบข้อมูล (นัดหมาย)",
    labelEn: "Appointment Review & Confirm",
    description: "แสดงข้อมูลนัดหมาย + ข้อมูลผู้เยี่ยม ให้ รปภ. ยืนยัน check-in",
    descriptionEn: "Show appointment details + visitor data for officer to confirm check-in",
    transitions: [
      { event: "CONFIRM_CHECKIN", targetState: "PRINT_SLIP" },
      { event: "RESET", targetState: "IDLE" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "AppointmentReviewState" },
  },
  CHECKOUT_SCAN: {
    label: "สแกนออก",
    labelEn: "Check-out Scan",
    description: "สแกน QR / Barcode จากบัตรผู้เยี่ยมเพื่อลงทะเบียนออก",
    descriptionEn: "Scan QR / Barcode from visitor badge to check-out",
    transitions: [
      { event: "BADGE_SCANNED", targetState: "CHECKOUT_CONFIRM" },
      { event: "CANCEL", targetState: "IDLE" },
    ],
    devices: [
      { name: "เครื่องสแกน Barcode/QR", nameEn: "Barcode/QR Scanner", icon: <Scan size={12} />, flutterPlugin: "mobile_scanner" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "CheckoutScanState", device: "BarcodeScanner", plugin: "mobile_scanner" },
  },
  CHECKOUT_CONFIRM: {
    label: "ยืนยันออก",
    labelEn: "Confirm Check-out",
    description: "แสดงข้อมูลผู้เยี่ยมที่สแกนได้ ให้ รปภ. กดยืนยัน check-out",
    descriptionEn: "Show scanned visitor data for officer to confirm check-out",
    transitions: [
      { event: "CONFIRM_CHECKOUT", targetState: "IDLE" },
      { event: "CANCEL", targetState: "IDLE" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "CheckoutConfirmState" },
  },
  PRINT_SLIP: {
    label: "พิมพ์บัตรผู้เยี่ยม",
    labelEn: "Print Visitor Badge",
    description: "ส่งข้อมูลไปยังเครื่องพิมพ์บัตร (Thermal Printer) พร้อม QR Code",
    descriptionEn: "Send data to thermal printer for visitor badge with QR code",
    transitions: [
      { event: "PRINT_COMPLETE", targetState: "SUCCESS" },
      { event: "PRINT_ERROR", targetState: "WALKIN_REVIEW", condition: "retry" },
    ],
    devices: [
      { name: "เครื่องพิมพ์บัตร (Thermal)", nameEn: "Thermal Badge Printer", icon: <Printer size={12} />, flutterPlugin: "esc_pos_printer / sunmi_printer" },
    ],
    conditions: ["เครื่องพิมพ์ต้อง connected", "ใช้ slipConfig จาก ServicePoint"],
    conditionsEn: ["Printer must be connected", "Use slipConfig from ServicePoint"],
    flutterHint: { bloc: "CounterBloc", state: "PrintSlipState", device: "ThermalPrinter", plugin: "esc_pos_printer" },
  },
  SUCCESS: {
    label: "ลงทะเบียนสำเร็จ",
    labelEn: "Check-in Success",
    description: "แสดง overlay สำเร็จ พร้อมหมายเลขบัตร, ชื่อ, เวลาเข้า จากนั้น reset กลับ IDLE",
    descriptionEn: "Show success overlay with badge number, name, time-in. Then reset to IDLE.",
    transitions: [
      { event: "CLOSE", targetState: "IDLE" },
      { event: "REPRINT", targetState: "PRINT_SLIP" },
    ],
    flutterHint: { bloc: "CounterBloc", state: "CheckinSuccessState" },
  },
};

// Determine current state from dashboard props
export function resolveCounterState(params: {
  hasCounter: boolean;
  checkinMode: CounterCheckinMode;
  hasIdentity: boolean;
  hasPurpose: boolean;
  hasDepartment: boolean;
  hasAppointment: boolean;
  showSuccess: boolean;
  cardReaderStatus: string;
}): CounterState {
  if (!params.hasCounter) return "COUNTER_SELECTION";
  if (params.showSuccess) return "SUCCESS";

  if (params.checkinMode === "appointment") {
    if (params.hasAppointment && params.hasIdentity) return "APPOINTMENT_REVIEW";
    if (params.hasAppointment) return "APPOINTMENT_IDENTITY";
    return "APPOINTMENT_SEARCH";
  }

  // walkin flow
  if (params.hasIdentity && params.hasPurpose && params.hasDepartment) return "WALKIN_REVIEW";
  if (params.hasIdentity && params.hasPurpose) return "WALKIN_DEPARTMENT";
  if (params.hasIdentity) return "WALKIN_PURPOSE";
  if (params.cardReaderStatus === "reading") return "WALKIN_IDENTITY";
  return "IDLE";
}

// ── All counter states in logical order ──
const COUNTER_STATE_ORDER: CounterState[] = [
  "COUNTER_SELECTION", "IDLE",
  "WALKIN_IDENTITY", "WALKIN_PURPOSE", "WALKIN_DEPARTMENT", "WALKIN_CONTACT", "WALKIN_PHOTO", "WALKIN_REVIEW",
  "APPOINTMENT_SEARCH", "APPOINTMENT_IDENTITY", "APPOINTMENT_REVIEW",
  "CHECKOUT_SCAN", "CHECKOUT_CONFIRM",
  "PRINT_SLIP", "SUCCESS",
];

// ═══ Counter State Panel Component ═══
interface CounterStatePanelProps {
  currentState: CounterState;
  checkinMode: CounterCheckinMode;
  stateData?: Record<string, unknown>;
}

export default function CounterStatePanel({ currentState, checkinMode, stateData }: CounterStatePanelProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["state", "transitions", "devices", "conditions", "api"]));

  const info = COUNTER_STATE_MAP[currentState];
  const stateIndex = COUNTER_STATE_ORDER.indexOf(currentState);

  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-300 text-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={14} className="text-teal-400" />
            <span className="font-bold text-white text-sm">State Panel</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Step {stateIndex + 1}/{COUNTER_STATE_ORDER.length}
          </span>
        </div>
        {/* State badge */}
        <div className="mt-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 inline-flex items-center gap-2">
          <Zap size={10} className="text-teal-400" />
          <span className="font-mono font-bold text-teal-400">{currentState}</span>
        </div>
        <div className="mt-1.5">
          <p className="text-[10px] text-gray-400">{info.label} — {info.labelEn}</p>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* State Object */}
        <Section title="State Object" id="state" open={openSections.has("state")} onToggle={toggle}>
          <pre className="text-[10px] font-mono text-green-400 bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                type: currentState,
                checkinMode,
                ...(stateData || {}),
              },
              null,
              2
            )}
          </pre>
        </Section>

        {/* Description */}
        <Section title="คำอธิบาย / Description" id="description" open={openSections.has("description")} onToggle={toggle}>
          <div className="space-y-2">
            <p className="text-gray-300 leading-relaxed">{info.description}</p>
            <p className="text-gray-500 text-[10px] leading-relaxed">{info.descriptionEn}</p>
          </div>
        </Section>

        {/* Transitions */}
        <Section title="Transitions" id="transitions" open={openSections.has("transitions")} onToggle={toggle}>
          {info.transitions.length ? (
            <div className="space-y-1.5">
              {info.transitions.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900 text-[10px] flex-wrap">
                  <span className="font-mono text-orange-400 shrink-0">{t.event}</span>
                  <ArrowRight size={10} className="text-gray-600 shrink-0" />
                  <span className="font-mono text-blue-400 shrink-0">{t.targetState}</span>
                  {t.condition && <span className="text-gray-500 text-[9px]">({t.condition})</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">No transitions</p>
          )}
        </Section>

        {/* Active Devices */}
        <Section title="Devices / Hardware" id="devices" open={openSections.has("devices")} onToggle={toggle}>
          {info.devices?.length ? (
            <div className="space-y-2">
              {info.devices.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor size={12} className="text-cyan-400" />
                    <span className="text-cyan-300">{d.icon} {d.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 pl-5">{d.nameEn}</p>
                  {d.flutterPlugin && (
                    <div className="px-2 py-1 ml-5 rounded bg-gray-900 text-[10px] font-mono text-purple-400 inline-block">
                      Flutter: {d.flutterPlugin}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">No device active</p>
          )}
        </Section>

        {/* Conditions */}
        <Section title="Conditions / Rules" id="conditions" open={openSections.has("conditions")} onToggle={toggle}>
          {info.conditions?.length ? (
            <ul className="space-y-1">
              {info.conditions.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px]">
                  <span className="text-teal-400 shrink-0 mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
              {info.conditionsEn && (
                <div className="mt-2 pt-2 border-t border-gray-800">
                  {info.conditionsEn.map((c, i) => (
                    <li key={`en-${i}`} className="flex items-start gap-2 text-[10px] text-gray-500">
                      <span className="text-gray-600 shrink-0 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </div>
              )}
            </ul>
          ) : (
            <p className="text-gray-600 italic">No conditions</p>
          )}
        </Section>

        {/* 🔌 API Endpoint */}
        <Section title="🔌 API Endpoint" id="api" open={openSections.has("api")} onToggle={toggle}>
          <CounterApiSection stateType={currentState} />
        </Section>

        {/* Flutter / BLoC Hint */}
        <Section title="Flutter / BLoC Hint" id="flutter" open={openSections.has("flutter")} onToggle={toggle}>
          {info.flutterHint ? (
            <div className="px-2 py-1.5 rounded bg-gray-900 text-[10px] font-mono space-y-0.5">
              <p><span className="text-gray-500">bloc:</span> <span className="text-blue-400">{info.flutterHint.bloc}</span></p>
              <p><span className="text-gray-500">state:</span> <span className="text-green-400">{info.flutterHint.state}</span></p>
              {info.flutterHint.device && (
                <p><span className="text-gray-500">device:</span> <span className="text-cyan-400">{info.flutterHint.device}</span></p>
              )}
              {info.flutterHint.plugin && (
                <p><span className="text-gray-500">plugin:</span> <span className="text-purple-400">{info.flutterHint.plugin}</span></p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic">No Flutter hint</p>
          )}
        </Section>

        {/* All States Overview */}
        <Section title="All Counter States" id="all-states" open={openSections.has("all-states")} onToggle={toggle}>
          <div className="space-y-1">
            {COUNTER_STATE_ORDER.map((s) => {
              const sInfo = COUNTER_STATE_MAP[s];
              const isCurrent = s === currentState;
              const isWalkin = s.startsWith("WALKIN_");
              const isAppt = s.startsWith("APPOINTMENT_");
              const isCheckout = s.startsWith("CHECKOUT_");
              return (
                <div
                  key={s}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-mono flex items-center gap-2",
                    isCurrent ? "bg-teal-500/20 text-teal-300 font-bold" : "text-gray-500"
                  )}
                >
                  {isCurrent && <Zap size={8} className="text-teal-400" />}
                  {!isCurrent && <span className="w-2" />}
                  <span className={cn(
                    isWalkin && "text-orange-400/60",
                    isAppt && "text-blue-400/60",
                    isCheckout && "text-red-400/60",
                    isCurrent && "!text-teal-300"
                  )}>{s}</span>
                  <span className="text-gray-600 text-[9px] truncate flex-1">{sInfo.label}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── Collapsible Section ──
function Section({
  title,
  id,
  open,
  onToggle,
  children,
}: {
  title: string;
  id: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-900 transition-colors text-left"
      >
        {open ? (
          <ChevronDown size={12} className="text-gray-500" />
        ) : (
          <ChevronRight size={12} className="text-gray-500" />
        )}
        <span className={cn("font-medium", open ? "text-white" : "text-gray-400")}>{title}</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
