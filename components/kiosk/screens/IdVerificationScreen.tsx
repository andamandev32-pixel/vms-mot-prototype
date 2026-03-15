"use client";

import { CreditCard, BookOpen, Smartphone, ChevronLeft, Loader2, QrCode, AlertTriangle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IdMethod } from "@/lib/kiosk/kiosk-types";
import { useState, useEffect, useCallback } from "react";

const TOTAL_SECONDS = 60;
const WARNING_THRESHOLD = 15;

interface IdVerificationScreenProps {
  locale: "th" | "en";
  method: IdMethod;
  onDemoRead: () => void;
  onBack: () => void;
  onTimeout: () => void;
}

export default function IdVerificationScreen({ locale, method, onDemoRead, onBack, onTimeout }: IdVerificationScreenProps) {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const isWarning = remaining <= WARNING_THRESHOLD && remaining > 0;
  const isExpired = remaining <= 0;

  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  // Auto-redirect to home when expired after a brief pause
  useEffect(() => {
    if (!isExpired) return;
    const t = setTimeout(onTimeout, 3000);
    return () => clearTimeout(t);
  }, [isExpired, onTimeout]);

  const progressPct = (remaining / TOTAL_SECONDS) * 100;

  const config = {
    "thai-id-card": {
      icon: <CreditCard size={32} className={cn(isWarning ? "text-amber-500" : "text-[#2E3192]")} />,
      title: locale === "th" ? "กรุณาเสียบบัตรประชาชน" : "Please insert your ID card",
      subtitle: locale === "th" ? "เสียบบัตรที่ช่องเครื่องอ่านด้านขวา →" : "Insert card into the reader slot on the right →",
      waitMsg: locale === "th" ? "รอรับข้อมูลจากบัตร..." : "Waiting for card data...",
      demoLabel: locale === "th" ? "จำลองเสียบบัตร (Demo)" : "Simulate Card Read",
    },
    passport: {
      icon: <BookOpen size={32} className={cn(isWarning ? "text-amber-500" : "text-[#2E3192]")} />,
      title: locale === "th" ? "กรุณาวาง Passport" : "Please place your Passport",
      subtitle: locale === "th" ? "วาง Passport บนเครื่องสแกนด้านขวา →" : "Place passport on scanner on the right →",
      waitMsg: locale === "th" ? "รอสแกนเอกสาร..." : "Waiting for passport scan...",
      demoLabel: locale === "th" ? "จำลองสแกน Passport (Demo)" : "Simulate Passport Scan",
    },
    "thai-id-app": {
      icon: <Smartphone size={32} className={cn(isWarning ? "text-amber-500" : "text-[#2E3192]")} />,
      title: locale === "th" ? "สแกน QR Code ด้วยแอพ ThaiID" : "Scan QR with ThaiID App",
      subtitle: locale === "th" ? "เปิดแอพ ThaiID แล้วสแกน QR ด้านล่าง" : "Open ThaiID app and scan QR below",
      waitMsg: locale === "th" ? "รอยืนยันจากแอพ..." : "Waiting for app verification...",
      demoLabel: locale === "th" ? "จำลอง ThaiID (Demo)" : "Simulate ThaiID",
    },
  }[method];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "ยืนยันตัวตน" : "Identity Verification"}
          </h1>
        </div>
        {/* Countdown badge */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
          isExpired ? "bg-red-100 text-red-600" : isWarning ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-gray-100 text-gray-500"
        )}>
          <Timer size={10} />
          {isExpired ? "00:00" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center pt-3 px-3 gap-2.5">
        {/* Expired overlay */}
        {isExpired ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-sm font-bold text-red-600">
              {locale === "th" ? "หมดเวลาทำรายการ" : "Session Timed Out"}
            </h2>
            <p className="text-[10px] text-gray-500">
              {locale === "th" ? "กำลังกลับหน้าหลัก..." : "Returning to home..."}
            </p>
            <div className="w-8 h-8 rounded-full border-2 border-red-300 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Device icon */}
            <div className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors",
              isWarning ? "bg-amber-50 border-amber-300" : "bg-[#2E3192]/10 border-[#2E3192]/30"
            )}>
              {config.icon}
            </div>

            {/* Title & subtitle */}
            <div className="text-center space-y-0.5">
              <h2 className="text-xs font-bold text-[#1B2B5E]">{config.title}</h2>
              <p className="text-[9px] text-gray-400">{config.subtitle}</p>
            </div>

            {/* ThaiID shows QR */}
            {method === "thai-id-app" && (
              <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                <QrCode size={48} className="text-[#1B2B5E]/30" />
              </div>
            )}

            {/* Progress bar with countdown */}
            <div className="w-full max-w-[200px] space-y-1">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    isWarning ? "bg-amber-400" : "bg-[#2E3192]"
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className={cn(
                "flex items-center justify-center gap-1.5 text-[9px]",
                isWarning ? "text-amber-500 font-semibold" : "text-gray-400"
              )}>
                <Loader2 size={10} className="animate-spin" />
                {config.waitMsg}
              </div>
            </div>

            {/* Warning message */}
            {isWarning && (
              <div className="w-full max-w-[220px] flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                <p className="text-[9px] text-amber-700 font-medium leading-tight">
                  {locale === "th"
                    ? "กรุณาทำรายการ มิฉะนั้นระบบจะยกเลิกอัตโนมัติ"
                    : "Please proceed, or session will be cancelled automatically"}
                </p>
              </div>
            )}

            {/* Demo button */}
            <button
              onClick={onDemoRead}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#252880] text-white text-[11px] font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              {config.demoLabel}
            </button>

            <button
              onClick={onBack}
              className="px-3 py-1 rounded-lg text-[9px] text-gray-400 hover:text-[#1B2B5E] hover:bg-gray-50 transition-colors"
            >
              {locale === "th" ? "เปลี่ยนวิธี / Change Method" : "Change Method"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
