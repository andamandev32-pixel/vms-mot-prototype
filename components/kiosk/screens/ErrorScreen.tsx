"use client";

import { AlertTriangle, RotateCcw, Home, Globe } from "lucide-react";

interface ErrorScreenProps {
  locale: "th" | "en";
  message?: string;
  onRetry: () => void;
  onHome: () => void;
  onChangeLocale?: () => void;
}

export default function ErrorScreen({ locale, message, onRetry, onHome, onChangeLocale }: ErrorScreenProps) {
  return (
    <div className="relative flex flex-col h-full bg-white">
      {onChangeLocale && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onChangeLocale}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300 bg-white text-[9px] font-bold text-[#2E3192] hover:bg-gray-50 transition-all"
          >
            <Globe size={9} />
            {locale === "th" ? "EN" : "TH"}
          </button>
        </div>
      )}
      <main className="flex-1 flex flex-col items-center pt-8 px-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-500" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-[#1B2B5E]">
            {locale === "th" ? "เกิดข้อผิดพลาด" : "An Error Occurred"}
          </h2>
          <p className="text-[10px] text-gray-400 max-w-[240px]">
            {message || (locale === "th" ? "กรุณาลองใหม่อีกครั้ง" : "Please try again")}
          </p>
        </div>

        <div className="w-full max-w-[240px] space-y-2">
          <button
            onClick={onRetry}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#252880] text-white font-bold text-xs shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            {locale === "th" ? "ลองใหม่" : "Try Again"}
          </button>
          <button
            onClick={onHome}
            className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium text-xs hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Home size={14} />
            {locale === "th" ? "กลับหน้าหลัก" : "Back to Home"}
          </button>
        </div>
      </main>
    </div>
  );
}
