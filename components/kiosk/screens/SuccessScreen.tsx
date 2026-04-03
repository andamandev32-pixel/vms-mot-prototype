"use client";

import { CheckCircle, Home, Printer, MessageCircle, FileX } from "lucide-react";
import { useEffect, useState } from "react";
import type { SlipData, ThermalSection } from "@/lib/kiosk/kiosk-types";
import ThermalSlipPreview from "@/components/kiosk/ThermalSlipPreview";

interface SuccessScreenProps {
  locale: "th" | "en";
  slipData?: SlipData;
  onDone: () => void;
  /** ผู้เยี่ยมผูก LINE ไว้ → ถามก่อนพิมพ์ slip */
  lineLinked?: boolean;
  /** เลือกพิมพ์ slip */
  onChoosePrint?: () => void;
  /** เลือกไม่พิมพ์ slip */
  onSkipPrint?: () => void;
  /** ค่าจาก state ว่าเลือกพิมพ์หรือไม่ */
  printSlip?: boolean;
  /** Template sections จาก API /api/visit-slips/template */
  slipSections?: ThermalSection[];
  /** Logo URL จาก template */
  slipLogoUrl?: string;
  /** Logo size จาก template */
  slipLogoSize?: number;
}

export default function SuccessScreen({ locale, slipData, onDone, lineLinked, onChoosePrint, onSkipPrint, printSlip, slipSections, slipLogoUrl, slipLogoSize }: SuccessScreenProps) {
  const [countdown, setCountdown] = useState(lineLinked && printSlip === undefined ? 30 : 10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDone]);

  // กรณีผูก LINE + ยังไม่ได้เลือกพิมพ์/ไม่พิมพ์
  const showPrintChoice = lineLinked && printSlip === undefined;
  // กรณีเลือกพิมพ์แล้ว หรือไม่มี LINE (พิมพ์อัตโนมัติ)
  const showPrinting = !lineLinked || printSlip === true;
  // กรณีเลือกไม่พิมพ์
  const showSkipped = lineLinked && printSlip === false;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Content */}
      <main className="flex-1 flex flex-col items-center pt-4 px-4 gap-3 overflow-y-auto">
        {/* Success animation */}
        <div className="w-18 h-18 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
          <CheckCircle size={36} className="text-emerald-500" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-[#1B2B5E]">
            {locale === "th" ? "ทำรายการเสร็จเรียบร้อย" : "Registration Complete"}
          </h2>
          <p className="text-[10px] text-gray-400">
            {showPrintChoice
              ? (locale === "th"
                ? "ระบบจะส่งข้อความแจ้งผ่าน LINE ของท่าน"
                : "A notification will be sent to your LINE account")
              : showSkipped
              ? (locale === "th"
                ? "ข้อมูลบัตรผู้เยี่ยมจะส่งผ่าน LINE ของท่าน"
                : "Your visitor pass will be sent via LINE")
              : (locale === "th"
                ? "กรุณารับบัตรผู้มาติดต่อจากเครื่องพิมพ์"
                : "Please collect your visitor pass from the printer")}
          </p>
        </div>

        {/* === กรณีผูก LINE: ถามว่าต้องการพิมพ์ slip หรือไม่ === */}
        {showPrintChoice && (
          <div className="w-full max-w-[240px] space-y-2">
            {/* LINE notification badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#06C755]/10 border border-[#06C755]/20">
              <MessageCircle size={14} className="text-[#06C755]" />
              <span className="text-[10px] font-medium text-[#06C755]">
                {locale === "th" ? "จะส่งผ่าน LINE อยู่แล้ว" : "Will notify via LINE"}
              </span>
            </div>

            <p className="text-[10px] text-center text-[#1B2B5E] font-semibold">
              {locale === "th"
                ? "ต้องการสั่งพิมพ์บัตรผู้เยี่ยมหรือไม่?"
                : "Would you like to print a visitor pass?"}
            </p>
            <p className="text-[8px] text-center text-gray-400">
              {locale === "th"
                ? "ช่วยลดการใช้กระดาษ หากไม่จำเป็นต้องพิมพ์"
                : "Help reduce paper usage if printing is not needed"}
            </p>

            <button
              onClick={onChoosePrint}
              className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-medium text-xs hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Printer size={14} />
              {locale === "th" ? "พิมพ์บัตรผู้เยี่ยม" : "Print Visitor Pass"}
            </button>
            <button
              onClick={onSkipPrint}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06C755] to-[#05a648] text-white font-bold text-xs shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <FileX size={14} />
              {locale === "th" ? "ไม่ต้องพิมพ์ (รับผ่าน LINE)" : "Skip Print (via LINE)"}
            </button>
          </div>
        )}

        {/* === กรณีเลือกไม่พิมพ์ (LINE) === */}
        {showSkipped && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#06C755]/10 border border-[#06C755]/20">
            <MessageCircle size={14} className="text-[#06C755] animate-pulse" />
            <span className="text-[10px] font-medium text-[#06C755]">
              {locale === "th" ? "กำลังส่งข้อมูลผ่าน LINE..." : "Sending via LINE..."}
            </span>
          </div>
        )}

        {/* === กรณีพิมพ์ปกติ / เลือกพิมพ์ === */}
        {showPrinting && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2E3192]/10 border border-[#2E3192]/20 ">
            <Printer size={14} className="text-[#2E3192] animate-pulse" />
            <span className="text-[10px] font-medium text-[#2E3192]">
              {locale === "th" ? "กำลังพิมพ์บัตร..." : "Printing pass..."}
            </span>
          </div>
        )}

        {/* Thermal Slip Preview — ใช้ template จาก API */}
        {slipData && !showPrintChoice && (
          <div className="w-full flex justify-center">
            <ThermalSlipPreview
              data={slipData}
              scale={0.75}
              sections={slipSections}
              logoSrc={slipLogoUrl}
              logoSize={slipLogoSize}
            />
          </div>
        )}

        {/* Home button */}
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E3192] text-white font-semibold text-xs shadow-lg hover:bg-[#252880] active:scale-95 transition-all"
        >
          <Home size={16} />
          {locale === "th" ? "กลับหน้าหลัก" : "Back to Home"}
        </button>

        {/* Auto-return countdown */}
        <p className="text-[9px] text-gray-400">
          {locale === "th"
            ? `กลับหน้าหลักอัตโนมัติใน ${countdown} วินาที`
            : `Returning to home in ${countdown} seconds`}
        </p>
      </main>
    </div>
  );
}
