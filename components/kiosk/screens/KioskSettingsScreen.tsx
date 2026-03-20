"use client";

import { Settings, X, Monitor, Clock, FileText, Target, Wifi, Printer, Shield, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResolvedKioskConfig } from "@/lib/kiosk/kiosk-config-resolver";
import type { ServicePoint } from "@/lib/mock-data";

interface KioskSettingsScreenProps {
  locale: "th" | "en";
  config: ResolvedKioskConfig;
  kioskList: ServicePoint[];
  selectedKioskId: number;
  onChangeKiosk: (id: number) => void;
  onClose: () => void;
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-block w-2 h-2 rounded-full",
      status === "online" ? "bg-emerald-500" : status === "offline" ? "bg-red-500" : "bg-amber-500"
    )} />
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[#2E3192]/60">{icon}</span>
      <h3 className="text-[10px] font-bold text-[#1B2B5E] uppercase tracking-wider">{children}</h3>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-between items-start gap-2 py-0.5", className)}>
      <span className="text-[9px] text-gray-400 shrink-0">{label}</span>
      <span className="text-[9px] text-[#1B2B5E] font-medium text-right">{value}</span>
    </div>
  );
}

function TagList({ items }: { items: { icon?: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#2E3192]/5 border border-[#2E3192]/10 text-[8px] text-[#1B2B5E] font-medium"
        >
          {item.icon && <span>{item.icon}</span>}
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function KioskSettingsScreen({
  locale,
  config,
  kioskList,
  selectedKioskId,
  onChangeKiosk,
  onClose,
}: KioskSettingsScreenProps) {
  const sp = config.servicePoint;
  const bh = config.businessHours;
  const th = locale === "th";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#1B2B5E] text-white">
        <div className="flex items-center gap-2">
          <Settings size={14} />
          <h2 className="text-[12px] font-bold">{th ? "การตั้งค่า Kiosk" : "Kiosk Settings"}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Kiosk Selector */}
      <div className="px-3 py-2 bg-[#2E3192]/5 border-b border-[#2E3192]/10">
        <label className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">
          {th ? "เลือกจุดบริการ" : "Select Service Point"}
        </label>
        <div className="relative mt-1">
          <select
            value={selectedKioskId}
            onChange={(e) => onChangeKiosk(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-[10px] rounded-lg border border-[#2E3192]/20 bg-white text-[#1B2B5E] font-bold appearance-none pr-6 focus:border-[#2E3192] focus:outline-none"
          >
            {kioskList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.serialNumber})
              </option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">

        {/* Machine Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<Monitor size={11} />}>
            {th ? "ข้อมูลเครื่อง" : "Device Info"}
          </SectionTitle>
          <InfoRow label={th ? "ชื่อ" : "Name"} value={sp.name} />
          <InfoRow label={th ? "ชื่อ EN" : "Name EN"} value={sp.nameEn} />
          <InfoRow label="S/N" value={sp.serialNumber} />
          <InfoRow label="IP" value={sp.ipAddress} />
          <InfoRow
            label={th ? "สถานะ" : "Status"}
            value={
              <span className="inline-flex items-center gap-1">
                <StatusDot status={sp.status} />
                <span className={cn(
                  "text-[9px] font-bold",
                  sp.status === "online" ? "text-emerald-600" :
                  sp.status === "offline" ? "text-red-500" : "text-amber-600"
                )}>
                  {sp.status === "online" ? (th ? "ออนไลน์" : "Online")
                    : sp.status === "offline" ? (th ? "ออฟไลน์" : "Offline")
                    : (th ? "ปิดปรับปรุง" : "Maintenance")}
                </span>
              </span>
            }
          />
          <InfoRow label={th ? "ตำแหน่ง" : "Location"} value={sp.location} />
          <InfoRow label={th ? "อาคาร" : "Building"} value={`${sp.building} — ${sp.floor}`} />
          <InfoRow label={th ? "รายการวันนี้" : "Today"} value={`${sp.todayTransactions} ${th ? "รายการ" : "transactions"}`} />
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<Clock size={11} />}>
            {th ? "เวลาทำการ" : "Business Hours"}
          </SectionTitle>
          <InfoRow
            label={th ? "ตามเวลาทำการ" : "Follow Schedule"}
            value={bh.followBusinessHours ? "✅" : "❌ (เปิดตลอด)"}
          />
          {bh.followBusinessHours && (
            <>
              <InfoRow label={th ? "กฎปัจจุบัน" : "Current Rule"} value={bh.currentRule} />
              <InfoRow label={th ? "เวลาเปิด-ปิด" : "Hours"} value={`${bh.openTime} — ${bh.closeTime}`} />
              <InfoRow label="Kiosk" value={bh.allowKiosk ? "✅ เปิดให้บริการ" : "❌ ปิด"} />
            </>
          )}
          <InfoRow
            label={th ? "สถานะตอนนี้" : "Current Status"}
            value={
              <span className={cn("font-bold", bh.isOpen ? "text-emerald-600" : "text-red-500")}>
                {bh.isOpen ? (th ? "🟢 เปิดให้บริการ" : "🟢 Open") : (th ? "🔴 ปิดให้บริการ" : "🔴 Closed")}
              </span>
            }
          />
        </div>

        {/* Allowed Documents */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<FileText size={11} />}>
            {th ? "เอกสารยืนยันตัวตนที่รับ" : "Accepted ID Documents"}
          </SectionTitle>
          <TagList
            items={config.allowedIdMethods.map((m) => ({
              icon: m.icon,
              label: th ? m.name : m.nameEn,
            }))}
          />
        </div>

        {/* Allowed Purposes */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<Target size={11} />}>
            {th ? "วัตถุประสงค์ที่เปิดให้บริการ" : "Service Purposes"}
          </SectionTitle>
          <TagList
            items={config.purposes.map((p) => ({
              icon: p.icon,
              label: th ? p.name : p.nameEn,
            }))}
          />
        </div>

        {/* WiFi */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<Wifi size={11} />}>WiFi</SectionTitle>
          <InfoRow label="SSID" value={config.wifi.ssid} />
          <InfoRow
            label={th ? "รูปแบบรหัส" : "Password Pattern"}
            value={config.wifi.passwordPattern}
          />
          <InfoRow
            label={th ? "ระยะเวลา" : "Validity"}
            value={config.wifi.validityMode === "business-hours-close"
              ? (th ? "ตามเวลาปิดทำการ" : "Until closing time")
              : `${config.wifi.fixedDurationMinutes ?? 480} ${th ? "นาที" : "min"}`}
          />
        </div>

        {/* Slip */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<Printer size={11} />}>
            {th ? "ใบเข้าพื้นที่ (Slip)" : "Visit Slip"}
          </SectionTitle>
          <InfoRow label="Header" value={config.slip.headerText} />
          <InfoRow label="Footer" value={config.slip.footerText} />
          <InfoRow
            label={th ? "รูปแบบมาสก์ ID" : "ID Masking"}
            value={config.idMaskingPattern}
          />
        </div>

        {/* PDPA */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
          <SectionTitle icon={<Shield size={11} />}>PDPA</SectionTitle>
          <InfoRow
            label={th ? "ต้อง Scroll" : "Require Scroll"}
            value={config.pdpa.requireScroll ? "✅" : "❌"}
          />
          <InfoRow
            label={th ? "ระยะเก็บข้อมูล" : "Retention"}
            value={`${config.pdpa.retentionDays} ${th ? "วัน" : "days"}`}
          />
        </div>

        {/* Note */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-2.5">
          <p className="text-[8px] text-amber-700 leading-relaxed">
            {th
              ? "💡 การตั้งค่าทั้งหมดจัดการผ่าน Web App (เมนูตั้งค่า > จุดให้บริการ Kiosk/Counter) กรุณาติดต่อ Admin หากต้องการเปลี่ยนแปลง"
              : "💡 All settings are managed via Web App (Settings > Service Points). Contact Admin to make changes."}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-3 py-2 border-t border-gray-100 bg-white">
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-[#1B2B5E] text-white text-[11px] font-bold hover:bg-[#152347] active:scale-[0.98] transition-all"
        >
          {th ? "ปิด" : "Close"}
        </button>
      </div>
    </div>
  );
}
