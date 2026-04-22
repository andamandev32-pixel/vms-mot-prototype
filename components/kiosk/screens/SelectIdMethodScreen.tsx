"use client";

import { CreditCard, BookOpen, Smartphone, ChevronLeft, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IdMethod } from "@/lib/kiosk/kiosk-types";

interface SelectIdMethodScreenProps {
  locale: "th" | "en";
  selected?: IdMethod | null;
  onSelect: (method: IdMethod) => void;
  onBack: () => void;
  title?: string;
  titleEn?: string;
  /** Allowed ID methods from kiosk config (filters which methods to show) */
  allowedMethods?: IdMethod[];
  onChangeLocale?: () => void;
}

const idMethods: { id: IdMethod; icon: React.ReactNode; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { id: "thai-id-card", icon: <CreditCard size={24} />, label: "บัตรประชาชน", labelEn: "Thai National ID Card", desc: "เสียบบัตรที่เครื่องอ่าน", descEn: "Insert card into reader" },
  { id: "passport", icon: <BookOpen size={24} />, label: "หนังสือเดินทาง", labelEn: "Passport", desc: "วางบนเครื่องสแกน", descEn: "Place on scanner" },
  { id: "thai-id-app", icon: <Smartphone size={24} />, label: "แอพ ThaiID", labelEn: "ThaiID App", desc: "สแกน QR Code ด้วยแอพ", descEn: "Scan QR via app" },
];

export default function SelectIdMethodScreen({
  locale,
  selected,
  onSelect,
  onBack,
  title,
  titleEn,
  allowedMethods,
  onChangeLocale,
}: SelectIdMethodScreenProps) {
  const filteredMethods = allowedMethods
    ? idMethods.filter((m) => allowedMethods.includes(m.id))
    : idMethods;
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <CreditCard size={14} className="text-[#1B2B5E]" />
        <div className="flex-1">
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? (title || "เลือกวิธียืนยันตัวตน") : (titleEn || "Select ID Verification")}
          </h1>
          <p className="text-[8px] text-gray-400">
            {locale === "th" ? "Select ID Verification" : "Choose your method"}
          </p>
        </div>
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

      <main className="flex flex-col items-center pt-3 px-3 gap-2">
        <p className="text-[9px] text-gray-400">
          {locale === "th" ? "กรุณาเลือกเอกสารยืนยันตัวตน" : "Please select identification document"}
        </p>
        {filteredMethods.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all active:scale-[0.98]",
              selected === m.id
                ? "border-[#2E3192] bg-[#2E3192]/5 shadow-md"
                : "border-gray-100 bg-white hover:border-[#2E3192]/30"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              selected === m.id ? "bg-[#2E3192] text-white " : "bg-gray-50 text-[#1B2B5E]"
            )}>
              {m.icon}
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[10px] font-bold text-[#1B2B5E]">
                {locale === "th" ? m.label : m.labelEn}
              </h3>
              <p className="text-[8px] text-gray-400">
                {locale === "th" ? m.desc : m.descEn}
              </p>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}
