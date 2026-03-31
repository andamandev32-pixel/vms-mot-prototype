"use client";

import { ChevronLeft, User, Calendar, MapPin, CreditCard, ShieldAlert } from "lucide-react";
import type { VisitorIdentity } from "@/lib/kiosk/kiosk-types";
import type { BlocklistEntry } from "@/lib/mock-data";
import { maskIdNumber } from "@/lib/kiosk/kiosk-mock-data";

interface DataPreviewScreenProps {
  locale: "th" | "en";
  visitor: VisitorIdentity;
  blocklistEntry?: BlocklistEntry | null;
  onConfirm: () => void;
  onBack: () => void;
}

export default function DataPreviewScreen({ locale, visitor, blocklistEntry, onConfirm, onBack }: DataPreviewScreenProps) {
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <User size={10} className="text-[#2E3192]" />,
      label: locale === "th" ? "ชื่อ-สกุล" : "Full Name",
      value: visitor.fullNameTh || visitor.fullNameEn,
    },
    ...(visitor.fullNameTh && visitor.fullNameEn
      ? [{ icon: <User size={10} className="text-[#2E3192]" />, label: locale === "th" ? "ชื่อ (EN)" : "Name (EN)", value: visitor.fullNameEn }]
      : []),
    {
      icon: <CreditCard size={10} className="text-[#2E3192]" />,
      label: locale === "th" ? "เลขบัตร" : "ID Number",
      value: maskIdNumber(visitor.idNumber),
    },
    ...(visitor.documentType !== "thai-id-card" && visitor.dateOfBirth
      ? [{
          icon: <Calendar size={10} className="text-[#2E3192]" />,
          label: locale === "th" ? "วันเกิด" : "Date of Birth",
          value: visitor.dateOfBirth,
        }]
      : []),
    ...(visitor.documentType !== "thai-id-card" && visitor.address
      ? [{
          icon: <MapPin size={10} className="text-[#2E3192]" />,
          label: locale === "th" ? "ที่อยู่" : "Address",
          value: visitor.address,
        }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "ตรวจสอบข้อมูล" : "Review Your Data"}
          </h1>
          <p className="text-[8px] text-gray-400">
            {locale === "th" ? "Review Your Data" : "Please confirm your information"}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-3 py-2 gap-2 overflow-hidden">
        {/* Blocklist Warning Banner */}
        {blocklistEntry && (
          <div className="w-full rounded-lg bg-red-50 border-2 border-red-300 p-2 flex items-start gap-2">
            <ShieldAlert size={14} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-bold text-red-700">
                {locale === "th" ? "พบรายชื่อใน Blocklist" : "Blocklist Match Found"}
              </p>
              <p className="text-[7px] text-red-600 mt-0.5 leading-tight">
                {blocklistEntry.reason}
              </p>
              <p className="text-[7px] text-red-500 mt-0.5">
                {blocklistEntry.type === "permanent"
                  ? (locale === "th" ? "ถูก Block ถาวร — ไม่สามารถเข้าพื้นที่ได้" : "Permanently Blocked")
                  : (locale === "th" ? "ถูก Block ชั่วคราว" : "Temporarily Blocked")}
              </p>
            </div>
          </div>
        )}

        {/* Single card — all data in one bordered frame */}
        <div className="w-full rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-[8px] text-gray-600 leading-[1.4] space-y-2">
          {/* Photo + name row */}
          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-200">
            <div className="w-9 h-10 rounded-md bg-gray-200 border border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {visitor.photo ? (
                <img src={visitor.photo} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#1B2B5E]">{visitor.fullNameTh || visitor.fullNameEn}</p>
              {visitor.fullNameTh && visitor.fullNameEn && (
                <p className="text-[7.5px] text-gray-400">{visitor.fullNameEn}</p>
              )}
              <p className="text-[7px] text-[#2E3192] font-medium">
                {visitor.documentType === "thai-id-card" ? "บัตรประชาชน" : visitor.documentType === "passport" ? "Passport" : "ThaiID App"}
              </p>
            </div>
          </div>

          {/* Data fields */}
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[#2E3192] mt-px shrink-0">{row.icon}</span>
              <div className="min-w-0">
                <p className="text-[7px] text-gray-400 font-medium leading-tight">{row.label}</p>
                <p className="text-[8.5px] text-[#1B2B5E] font-medium break-words leading-tight">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Confirm button — disabled if permanently blocked */}
        <div className="w-full space-y-1.5">
          {blocklistEntry?.type === "permanent" ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-red-200 text-red-400 font-bold text-[11px] cursor-not-allowed"
            >
              {locale === "th" ? "ไม่สามารถเข้าพื้นที่ได้ (Blocked)" : "Access Denied (Blocked)"}
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="w-full py-2.5 rounded-xl bg-[#2E3192] text-white font-bold text-[11px] shadow-lg hover:bg-[#252880] hover:shadow-xl active:scale-[0.98] transition-all"
            >
              {locale === "th" ? "ยืนยันข้อมูล" : "Confirm Data"}
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full py-1.5 rounded-xl text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            {locale === "th" ? "ย้อนกลับ — แก้ไขข้อมูล" : "Back — Edit Data"}
          </button>
        </div>
      </main>
    </div>
  );
}
