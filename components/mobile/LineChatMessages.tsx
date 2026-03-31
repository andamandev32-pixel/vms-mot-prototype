"use client";

import { Shield, Check, Clock, MapPin, Wifi, QrCode, UserCheck, AlertTriangle, CalendarCheck, FileText, Bell, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LineFlowStateId } from "@/lib/line-oa-flow-data";

// ===== Chat Message Building Blocks =====

interface BotBubbleProps {
  children: React.ReactNode;
  time: string;
  showAvatar?: boolean;
}

export function BotBubble({ children, time, showAvatar = true }: BotBubbleProps) {
  return (
    <div className="flex items-end gap-2 max-w-[88%] mb-3">
      {showAvatar ? (
        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow flex-shrink-0">
          <Shield size={12} className="text-white" />
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div>
        {children}
        <p className="text-[10px] text-white/50 mt-1 ml-1">{time}</p>
      </div>
    </div>
  );
}

export function TextBubble({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{text}</p>
    </div>
  );
}

export function UserBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div>
        <div className="bg-[#06C755] rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          <p className="text-sm text-white whitespace-pre-line leading-relaxed">{text}</p>
        </div>
        <p className="text-[10px] text-white/50 mt-1 mr-1 text-right">{time}</p>
      </div>
    </div>
  );
}

// ===== Flex Message Cards =====

interface FlexCardProps {
  children: React.ReactNode;
  time: string;
}

export function FlexCard({ children, time }: FlexCardProps) {
  return (
    <BotBubble time={time}>
      <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden border border-gray-100 max-w-[280px]">
        {children}
      </div>
    </BotBubble>
  );
}

export function CardHeader({ title, subtitle, color = "primary" }: { title: string; subtitle?: string; color?: string }) {
  return (
    <div className="px-4 pt-4 pb-2 text-center border-b border-gray-100">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
          <Shield size={14} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-xs font-extrabold text-primary-800 leading-tight">eVMES MOT</p>
          <p className="text-[8px] text-text-muted leading-tight">Visitor Management System</p>
        </div>
      </div>
      <h3 className={cn(
        "text-base font-bold",
        color === "primary" && "text-primary",
        color === "green" && "text-[#06C755]",
        color === "orange" && "text-orange-500",
        color === "red" && "text-red-500",
        color === "blue" && "text-blue-500",
      )}>{title}</h3>
      {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function CardRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      {icon && <span className="text-text-muted mt-0.5 flex-shrink-0">{icon}</span>}
      <span className="text-text-muted min-w-[55px] text-xs flex-shrink-0">{label}</span>
      <span className="font-medium text-text-primary text-xs">{value}</span>
    </div>
  );
}

export function CardButton({ label, variant = "green", onClick }: { label: string; variant?: "green" | "outline" | "primary" | "red"; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full font-bold py-2.5 rounded-xl text-sm transition-colors active:scale-[0.98]",
        variant === "green" && "bg-[#06C755] hover:bg-[#05b34c] text-white",
        variant === "primary" && "bg-primary hover:bg-primary-dark text-white",
        variant === "outline" && "bg-white border-2 border-gray-200 text-text-primary hover:bg-gray-50",
        variant === "red" && "bg-red-500 hover:bg-red-600 text-white",
      )}
    >
      {label}
    </button>
  );
}

export function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" | "checked-in" | "checked-out" }) {
  const config = {
    pending: { label: "รอดำเนินการ", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    approved: { label: "อนุมัติแล้ว", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    rejected: { label: "ไม่อนุมัติ", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    "checked-in": { label: "เข้าพื้นที่แล้ว", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    "checked-out": { label: "ออกแล้ว", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  }[status];

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", config.bg, config.text, config.border)}>
      {config.label}
    </span>
  );
}

// ===== VISITOR FLOW MESSAGES =====

export function WelcomeMessage() {
  return (
    <BotBubble time="09:00">
      <TextBubble text={'ยินดีต้อนรับสู่ eVMES MOT 🙏\nระบบจัดการผู้มาติดต่อ\nกระทรวงการท่องเที่ยวและกีฬา\n\nกรุณากดปุ่ม "Registration Now" ด้านล่างเพื่อลงทะเบียนเข้าใช้งาน'} />
    </BotBubble>
  );
}

export function VisitorRegisteredCard({ onAction }: { onAction?: () => void }) {
  return (
    <FlexCard time="09:05">
      <CardHeader title="Registration Complete" color="green" />
      <div className="px-4 py-3 space-y-1.5">
        <CardRow label="ประเภท" value="Visitor" />
        <CardRow label="วันที่" value="30 มี.ค. 2569, 09:05 น." />
        <CardRow label="ชื่อ" value="พุทธิพงษ์ คาดสนิท" />
        <CardRow label="บริษัท" value="บริษัท สยามเทค จำกัด" />
        <CardRow label="โทร." value="081-302-5678" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <CardButton label="สร้างรายการนัดหมาย" variant="green" onClick={onAction} />
        <CardButton label="ข้อมูลส่วนบุคคล" variant="outline" />
      </div>
    </FlexCard>
  );
}

export function BookingConfirmedCard() {
  return (
    <FlexCard time="09:15">
      <CardHeader title="นัดหมายใหม่" subtitle="Booking #eVMS-20260402-1042" color="primary" />
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">สถานะ</span>
          <StatusBadge status="pending" />
        </div>
        <CardRow label="วัตถุประสงค์" value="🏛️ ติดต่อราชการ" />
        <CardRow label="วันที่" value="2 เม.ย. 2569" />
        <CardRow label="เวลา" value="10:00 - 11:00 น." />
        <CardRow label="ผู้รับพบ" value="คุณสมชาย รักชาติ" />
        <CardRow label="สถานที่" value="สำนักนโยบายฯ อาคาร C ชั้น 4" />
      </div>
      {/* QR Section */}
      <div className="px-4 pb-2 flex flex-col items-center">
        <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center">
          <QrCode size={48} className="text-gray-400" />
          <p className="text-[8px] text-gray-400 mt-1">QR Check-in</p>
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <CardButton label="ดูรายละเอียด" variant="primary" />
      </div>
    </FlexCard>
  );
}

export function ApprovalApprovedCard() {
  return (
    <FlexCard time="10:30">
      <CardHeader title="นัดหมายอนุมัติแล้ว ✅" color="green" />
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">สถานะ</span>
          <StatusBadge status="approved" />
        </div>
        <CardRow label="Booking" value="#eVMS-20260402-1042" />
        <CardRow label="วันที่" value="2 เม.ย. 2569 | 10:00 - 11:00 น." />
        <CardRow label="ผู้อนุมัติ" value="คุณสมศรี รักษ์ดี" />
        <CardRow label="อนุมัติเมื่อ" value="30 มี.ค. 2569 10:30 น." />
      </div>
      <div className="px-4 pb-1">
        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-green-700">กรุณาสแกน QR Code ที่ Kiosk หรือ Counter ในวันนัดหมาย</p>
        </div>
      </div>
      <div className="px-4 pb-3 pt-2 space-y-2">
        <CardButton label="ดู QR Code" variant="green" />
      </div>
    </FlexCard>
  );
}

export function ReminderMessage() {
  return (
    <BotBubble time="08:00">
      <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden border border-gray-100 max-w-[280px]">
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-2">
          <Bell size={16} className="text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-700">แจ้งเตือนนัดหมาย</p>
            <p className="text-[10px] text-amber-600">พรุ่งนี้ 2 เม.ย. 2569</p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-1.5">
          <CardRow label="เวลา" value="10:00 - 11:00 น." />
          <CardRow label="ผู้รับพบ" value="คุณสมชาย รักชาติ" />
          <CardRow label="สถานที่" value="อาคาร C ชั้น 4" />
        </div>
        <div className="px-4 pb-3">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-2 text-center">
            <p className="text-[10px] text-primary">เตรียมบัตรประชาชน/Passport สำหรับยืนยันตัวตนที่ Kiosk</p>
          </div>
        </div>
      </div>
    </BotBubble>
  );
}

export function CheckinNotificationCard() {
  return (
    <FlexCard time="09:45">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-blue-600" />
          <div>
            <p className="text-sm font-bold text-blue-700">Check-in สำเร็จ</p>
            <p className="text-[10px] text-blue-500">ยินดีต้อนรับสู่ กท.กก.</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">สถานะ</span>
          <StatusBadge status="checked-in" />
        </div>
        <CardRow label="เลข Slip" value="eVMS-25690402-0099" />
        <CardRow label="เวลาเข้า" value="09:45 น." />
        <CardRow label="เวลาออก" value="ภายใน 11:00 น." />
        <CardRow label="สถานที่" value="อาคาร C ชั้น 4" />
      </div>
      <div className="px-4 pb-3">
        <CardButton label="ดู Visit Slip" variant="primary" />
      </div>
    </FlexCard>
  );
}

export function WifiCredentialsCard() {
  return (
    <FlexCard time="09:46">
      <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100">
        <div className="flex items-center gap-2">
          <Wifi size={18} className="text-cyan-600" />
          <div>
            <p className="text-sm font-bold text-cyan-700">WiFi สำหรับผู้มาติดต่อ</p>
            <p className="text-[10px] text-cyan-500">ใช้ได้ถึง 16:30 น. วันนี้</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-text-muted mb-0.5">SSID</p>
          <p className="text-lg font-bold text-primary tracking-wide">MOTS-Guest</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-text-muted mb-0.5">Password</p>
          <p className="text-lg font-bold text-primary tracking-wider">mots2026</p>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-text-muted">
          <Clock size={10} />
          <span>ใช้ได้ถึง 16:30 น. | 2 เม.ย. 2569</span>
        </div>
      </div>
    </FlexCard>
  );
}

export function VisitSlipLineCard() {
  return (
    <FlexCard time="09:47">
      <div className="bg-primary-50 px-4 py-3 border-b border-primary-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-extrabold text-primary-800">eVMES MOT</p>
            <p className="text-[7px] text-text-muted">กระทรวงการท่องเที่ยวและกีฬา</p>
          </div>
        </div>
        <p className="text-sm font-bold text-primary">Visit Slip (Digital)</p>
      </div>
      <div className="px-4 py-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">เลข Slip</span>
          <span className="font-bold text-primary">eVMS-25690402-0099</span>
        </div>
        <div className="border-t border-gray-100 pt-1.5" />
        <CardRow label="ชื่อ" value="พุทธิพงษ์ คาดสนิท" />
        <CardRow label="บัตร" value="1-xxxx-xxxxx-90-3" />
        <CardRow label="วัตถุประสงค์" value="ติดต่อราชการ" />
        <CardRow label="แผนก" value="สำนักนโยบายฯ" />
        <CardRow label="อาคาร" value="อาคาร C ชั้น 4" />
        <div className="border-t border-gray-100 pt-1.5" />
        <div className="flex justify-between">
          <span className="text-text-muted">เข้า</span>
          <span className="font-bold">09:45</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">ออก (ภายใน)</span>
          <span className="font-bold">11:00 น.</span>
        </div>
      </div>
      {/* QR for checkout */}
      <div className="px-4 pb-3 flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center">
          <QrCode size={40} className="text-gray-400" />
          <p className="text-[7px] text-gray-400 mt-0.5">QR Check-out</p>
        </div>
        <p className="text-[9px] text-text-muted mt-1">สแกน QR นี้ที่ทางออกเพื่อ Check-out</p>
      </div>
    </FlexCard>
  );
}

export function CheckoutThankYouCard() {
  return (
    <FlexCard time="10:55">
      <div className="bg-green-50 px-4 py-4 border-b border-green-100 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Check size={24} className="text-green-600" />
        </div>
        <p className="text-base font-bold text-green-700">Check-out สำเร็จ</p>
        <p className="text-[10px] text-green-600 mt-0.5">ขอบคุณที่มาเยือน กท.กก.</p>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">สถานะ</span>
          <StatusBadge status="checked-out" />
        </div>
        <CardRow label="เข้า" value="09:45 น." />
        <CardRow label="ออก" value="10:55 น." />
        <CardRow label="ระยะเวลา" value="1 ชม. 10 นาที" />
      </div>
      <div className="px-4 pb-3">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-text-muted">กรุณาส่งคืนบัตร Visitor (ถ้ามี) ที่จุด Counter</p>
        </div>
      </div>
    </FlexCard>
  );
}

export function AutoCancelledCard() {
  return (
    <FlexCard time="09:16">
      <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <XCircle size={18} className="text-orange-600" />
          <div>
            <p className="text-sm font-bold text-orange-700">นัดหมายถูกยกเลิกอัตโนมัติ</p>
            <p className="text-[10px] text-orange-500">หมดเวลารอการอนุมัติ</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">สถานะ</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-100 text-orange-700 border-orange-200">
            ยกเลิกอัตโนมัติ
          </span>
        </div>
        <CardRow label="Booking" value="#eVMS-20260402-1042" />
        <CardRow label="วัตถุประสงค์" value="🏛️ ติดต่อราชการ" />
        <CardRow label="วันที่นัด" value="2 เม.ย. 2569 | 10:00 - 11:00 น." />
        <CardRow label="ผู้รับพบ" value="คุณสมชาย รักชาติ" />
      </div>
      <div className="px-4 pb-2">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5">
          <p className="text-[10px] text-orange-700 leading-relaxed">
            ⚠️ นัดหมายนี้ไม่ได้รับการอนุมัติภายในเวลาที่กำหนด (24 ชั่วโมง) ระบบจึงยกเลิกอัตโนมัติ
          </p>
          <p className="text-[10px] text-orange-600 mt-1">
            หากต้องการเข้าพบ กรุณาสร้างนัดหมายใหม่อีกครั้ง
          </p>
        </div>
      </div>
      <div className="px-4 pb-3 pt-1 space-y-2">
        <CardButton label="สร้างนัดหมายใหม่" variant="green" />
        <CardButton label="ดูรายละเอียด" variant="outline" />
      </div>
    </FlexCard>
  );
}

// ===== OFFICER FLOW MESSAGES =====

export function OfficerRegisteredCard({ onAction }: { onAction?: () => void }) {
  return (
    <FlexCard time="09:05">
      <CardHeader title="Registration Complete" color="green" />
      <div className="px-4 py-3 space-y-1.5">
        <CardRow label="ประเภท" value="Officer" />
        <CardRow label="วันที่" value="30 มี.ค. 2569, 09:05 น." />
        <CardRow label="ชื่อ" value="นพดล ชูช่วย" />
        <CardRow label="ตำแหน่ง" value="นักวิชาการท่องเที่ยว ชำนาญการ" />
        <CardRow label="สังกัด" value="กองกิจการท่องเที่ยว" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <CardButton label="ดูคำขอนัดหมาย" variant="primary" onClick={onAction} />
        <CardButton label="ข้อมูลส่วนบุคคล" variant="outline" />
      </div>
    </FlexCard>
  );
}

export function OfficerNewRequestCard() {
  return (
    <FlexCard time="09:16">
      <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-700">คำขอนัดหมายใหม่</p>
            <p className="text-[10px] text-amber-500">ต้องการอนุมัติ</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">สถานะ</span>
          <StatusBadge status="pending" />
        </div>
        <CardRow label="ผู้ขอ" value="พุทธิพงษ์ คาดสนิท" />
        <CardRow label="บริษัท" value="บริษัท สยามเทค จำกัด" />
        <CardRow label="วัตถุประสงค์" value="🏛️ ติดต่อราชการ" />
        <CardRow label="วันที่" value="2 เม.ย. 2569 | 10:00 - 11:00" />
        <CardRow label="ผู้ติดตาม" value="0 คน" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <CardButton label="อนุมัติ" variant="green" />
        <CardButton label="ปฏิเสธ" variant="red" />
        <CardButton label="ดูรายละเอียด" variant="outline" />
      </div>
    </FlexCard>
  );
}

export function OfficerApprovedConfirmCard() {
  return (
    <BotBubble time="10:31">
      <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden border border-gray-100 max-w-[280px]">
        <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center gap-2">
          <Check size={18} className="text-green-600" />
          <p className="text-sm font-bold text-green-700">อนุมัติเรียบร้อย</p>
        </div>
        <div className="px-4 py-3 space-y-1">
          <p className="text-xs text-text-primary"><span className="text-text-muted">คำขอ:</span> #eVMS-20260402-1042</p>
          <p className="text-xs text-text-primary"><span className="text-text-muted">ผู้ขอ:</span> พุทธิพงษ์ คาดสนิท</p>
          <p className="text-[10px] text-text-muted mt-1">แจ้งผู้มาติดต่อทาง LINE แล้ว</p>
        </div>
      </div>
    </BotBubble>
  );
}

export function OfficerCheckinAlertCard() {
  return (
    <FlexCard time="09:46">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-blue-600" />
          <div>
            <p className="text-sm font-bold text-blue-700">ผู้มาติดต่อ Check-in แล้ว</p>
            <p className="text-[10px] text-blue-500">กำลังเดินทางมาพบคุณ</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <CardRow label="ชื่อ" value="พุทธิพงษ์ คาดสนิท" />
        <CardRow label="บริษัท" value="บริษัท สยามเทค จำกัด" />
        <CardRow label="Check-in" value="09:45 น. | Kiosk K-01" />
        <CardRow label="สถานที่" value="อาคาร C ชั้น 4" />
      </div>
      <div className="px-4 pb-3">
        <CardButton label="ดูรายละเอียด" variant="primary" />
      </div>
    </FlexCard>
  );
}

export function OfficerOverstayAlertCard() {
  return (
    <FlexCard time="11:45">
      <div className="bg-red-50 px-4 py-3 border-b border-red-100">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-700">แจ้งเตือน: เกินเวลานัด</p>
            <p className="text-[10px] text-red-500">Overstay 45 นาที</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <CardRow label="ชื่อ" value="พุทธิพงษ์ คาดสนิท" />
        <CardRow label="นัดหมาย" value="10:00 - 11:00 น." />
        <CardRow label="เกินเวลา" value="45 นาที" />
        <CardRow label="สถานที่" value="อาคาร C ชั้น 4" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <CardButton label="ติดต่อ Visitor" variant="primary" />
        <CardButton label="แจ้ง Security" variant="red" />
      </div>
    </FlexCard>
  );
}

// ===== State-to-Messages Mapper =====

export function getMessagesForState(
  stateId: LineFlowStateId,
  onAction?: () => void,
): React.ReactNode[] {
  switch (stateId) {
    case "new-friend":
      return [<WelcomeMessage key="welcome" />];

    case "visitor-register":
      return [
        <WelcomeMessage key="welcome" />,
        <UserBubble key="user-reg" text="ลงทะเบียน" time="09:02" />,
      ];

    case "visitor-registered":
      return [
        <WelcomeMessage key="welcome" />,
        <UserBubble key="user-reg" text="ลงทะเบียน" time="09:02" />,
        <VisitorRegisteredCard key="reg-card" onAction={onAction} />,
      ];

    case "visitor-booking":
      return [
        <WelcomeMessage key="welcome" />,
        <VisitorRegisteredCard key="reg-card" />,
        <UserBubble key="user-book" text="สร้างนัดหมาย" time="09:10" />,
      ];

    case "visitor-booking-confirmed":
      return [
        <VisitorRegisteredCard key="reg-card" />,
        <UserBubble key="user-book" text="สร้างนัดหมาย" time="09:10" />,
        <BookingConfirmedCard key="booking" />,
      ];

    case "visitor-approval-result":
      return [
        <BookingConfirmedCard key="booking" />,
        <ApprovalApprovedCard key="approved" />,
      ];

    case "visitor-auto-cancelled":
      return [
        <BookingConfirmedCard key="booking" />,
        <AutoCancelledCard key="auto-cancelled" />,
      ];

    case "visitor-reminder":
      return [
        <ApprovalApprovedCard key="approved" />,
        <ReminderMessage key="reminder" />,
      ];

    case "visitor-checkin-kiosk":
      return [
        <ReminderMessage key="reminder" />,
        <CheckinNotificationCard key="checkin" />,
      ];

    case "visitor-wifi-credentials":
      return [
        <CheckinNotificationCard key="checkin" />,
        <WifiCredentialsCard key="wifi" />,
      ];

    case "visitor-slip-line":
      return [
        <WifiCredentialsCard key="wifi" />,
        <VisitSlipLineCard key="slip" />,
      ];

    case "visitor-checkout":
      return [
        <VisitSlipLineCard key="slip" />,
        <CheckoutThankYouCard key="checkout" />,
      ];

    // Officer Flow
    case "officer-register":
      return [
        <WelcomeMessage key="welcome" />,
        <UserBubble key="user-reg" text="ลงทะเบียน" time="09:02" />,
      ];

    case "officer-registered":
      return [
        <WelcomeMessage key="welcome" />,
        <UserBubble key="user-reg" text="ลงทะเบียน" time="09:02" />,
        <OfficerRegisteredCard key="reg-card" onAction={onAction} />,
      ];

    case "officer-new-request":
      return [
        <OfficerRegisteredCard key="reg-card" />,
        <OfficerNewRequestCard key="request" />,
      ];

    case "officer-approve-action":
      return [
        <OfficerNewRequestCard key="request" />,
        <UserBubble key="user-approve" text="อนุมัติ" time="10:30" />,
        <OfficerApprovedConfirmCard key="confirm" />,
      ];

    case "officer-checkin-alert":
      return [
        <OfficerApprovedConfirmCard key="confirm" />,
        <OfficerCheckinAlertCard key="alert" />,
      ];

    case "officer-overstay-alert":
      return [
        <OfficerCheckinAlertCard key="alert" />,
        <OfficerOverstayAlertCard key="overstay" />,
      ];

    default:
      return [<WelcomeMessage key="welcome" />];
  }
}
