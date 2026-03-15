"use client";

import { ChevronLeft, QrCode, Loader2, CreditCard } from "lucide-react";

interface QrScanScreenProps {
  locale: "th" | "en";
  onDemoScan: () => void;
  onSkipToId?: () => void;
  onBack: () => void;
}

export default function QrScanScreen({ locale, onDemoScan, onSkipToId, onBack }: QrScanScreenProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <QrCode size={14} className="text-[#1B2B5E]" />
        <div>
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "สแกน QR Code" : "Scan QR Code"}
          </h1>
          <p className="text-[8px] text-gray-400">
            {locale === "th" ? "Scan QR Code" : "Hold your QR code to the reader"}
          </p>
        </div>
      </header>

      <main className="flex flex-col items-center pt-3 px-3 gap-2.5">
        {/* QR Scanner frame */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
            <QrCode size={36} className="text-gray-600" />
          </div>
          {/* Corner brackets */}
          <div className="absolute inset-2">
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-[3px] border-l-[3px] border-[#2E3192] rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-[3px] border-r-[3px] border-[#2E3192] rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-[3px] border-l-[3px] border-[#2E3192] rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[3px] border-r-[3px] border-[#2E3192] rounded-br-lg" />
          </div>
          {/* Scanning line */}
          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#2E3192] to-transparent animate-[scanLine_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
        </div>

        <div className="text-center space-y-0.5">
          <h2 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "วาง QR Code ที่เครื่องสแกน" : "Hold QR Code to scanner"}
          </h2>
          <p className="text-[8px] text-gray-400">
            {locale === "th"
              ? "QR Code จาก LINE หรืออีเมลยืนยัน"
              : "QR Code from LINE or confirmation email"}
          </p>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-[#2E3192] animate-pulse ">
          <Loader2 size={10} className="animate-spin" />
          {locale === "th" ? "รอสแกน QR Code..." : "Waiting for QR Code..."}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {/* Demo button */}
          <button
            onClick={onDemoScan}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#252880] text-white text-[11px] font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            {locale === "th" ? "จำลองสแกน QR (Demo)" : "Simulate QR Scan (Demo)"}
          </button>

          {/* Skip to ID verification */}
          {onSkipToId && (
            <button
              onClick={onSkipToId}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-[10px] font-medium hover:border-[#1B2B5E]/30 hover:text-[#1B2B5E] hover:bg-gray-50 transition-all"
            >
              <CreditCard size={12} />
              {locale === "th" ? "ไม่มี QR Code — ยืนยันตัวตนแทน" : "No QR Code — Verify by ID"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
