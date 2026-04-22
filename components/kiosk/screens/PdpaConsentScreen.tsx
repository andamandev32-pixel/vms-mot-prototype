"use client";

import { ChevronLeft, Shield, Check, Globe } from "lucide-react";
import { useState } from "react";

interface PdpaConsentScreenProps {
  locale: "th" | "en";
  onAccept: () => void;
  onDecline: () => void;
  /** Data retention days from config (default 90) */
  retentionDays?: number;
  onChangeLocale?: () => void;
}

export default function PdpaConsentScreen({ locale, onAccept, onDecline, retentionDays = 90, onChangeLocale }: PdpaConsentScreenProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={onDecline} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <Shield size={14} className="text-[#1B2B5E]" />
        <h1 className="flex-1 text-[11px] font-bold text-[#1B2B5E]">
          {locale === "th" ? "คุ้มครองข้อมูลส่วนบุคคล (PDPA)" : "Privacy Policy (PDPA)"}
        </h1>
        {onChangeLocale && (
          <button
            onClick={onChangeLocale}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300 text-[9px] font-bold text-[#2E3192] hover:bg-gray-50 transition-all"
          >
            <Globe size={9} />
            {locale === "th" ? "EN" : "TH"}
          </button>
        )}
      </header>

      {/* Compact PDPA content */}
      <main className="flex-1 flex flex-col px-3 py-2 gap-2 overflow-hidden">
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-[8px] text-gray-600 leading-[1.4] space-y-1.5">
          <p className="font-semibold text-[9px] text-[#1B2B5E]">
            {locale === "th" ? "พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562" : "Personal Data Protection Act B.E. 2562"}
          </p>
          <p>
            {locale === "th"
              ? "กระทรวงการท่องเที่ยวและกีฬา จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อ:"
              : "The Ministry of Tourism and Sports will collect, use, and disclose your personal data for:"}
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[7.5px]">
            <span>✓ {locale === "th" ? "ยืนยันตัวตน/ลงทะเบียน" : "Identity verification"}</span>
            <span>✓ {locale === "th" ? "รักษาความปลอดภัย" : "Security maintenance"}</span>
            <span>✓ {locale === "th" ? "บันทึกเข้า-ออกอาคาร" : "Entry/exit records"}</span>
            <span>✓ {locale === "th" ? "ติดต่อกรณีฉุกเฉิน" : "Emergency contact"}</span>
          </div>
          <p className="font-medium text-[8px] text-[#1B2B5E] pt-0.5">
            {locale === "th" ? "ข้อมูลที่เก็บ:" : "Data collected:"}
          </p>
          <p className="text-[7.5px]">
            {locale === "th"
              ? "ชื่อ-นามสกุล • เลขบัตร/พาสปอร์ต • ภาพถ่ายใบหน้า • ข้อมูลติดต่อ"
              : "Name • ID/Passport No. • Photo • Contact info"}
          </p>
          <p className="text-[7.5px]">
            {locale === "th"
              ? `ท่านมีสิทธิเข้าถึง แก้ไข ลบ หรือเพิกถอนความยินยอมได้ • จัดเก็บ ${retentionDays} วัน`
              : `You may access, correct, delete or withdraw consent • Retained ${retentionDays} days`}
          </p>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-2 cursor-pointer">
          <button
            onClick={() => setAgreed(!agreed)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              agreed
                ? "bg-[#2E3192] border-[#2E3192] text-white "
                : "border-gray-300 hover:border-[#2E3192]"
            }`}
          >
            {agreed && <Check size={10} strokeWidth={3} />}
          </button>
          <span className="text-[9px] leading-tight text-[#1B2B5E]">
            {locale === "th"
              ? "ข้าพเจ้ายอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล"
              : "I accept the Personal Data Protection Policy"}
          </span>
        </label>

        {/* Buttons — right after checkbox */}
        <div className="space-y-1.5">
          <button
            onClick={onAccept}
            disabled={!agreed}
            className={`w-full py-2.5 rounded-xl font-bold text-[11px] shadow-lg transition-all flex items-center justify-center gap-1.5 ${
              agreed
                ? "bg-[#2E3192] text-white hover:bg-[#252880] hover:shadow-xl active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            <Shield size={12} />
            {locale === "th" ? "ยอมรับและดำเนินการต่อ" : "Accept & Continue"}
          </button>
          <button
            onClick={onDecline}
            className="w-full py-1.5 rounded-xl text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            {locale === "th" ? "ไม่ยอมรับ — กลับหน้าหลัก" : "Decline — Back to Home"}
          </button>
        </div>
      </main>
    </div>
  );
}
