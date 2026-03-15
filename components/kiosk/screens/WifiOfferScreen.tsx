"use client";

import { Wifi, WifiOff, Check } from "lucide-react";
import { useState } from "react";

interface WifiOfferScreenProps {
  locale: "th" | "en";
  onAccept: () => void;
  onDecline: () => void;
  /** ผู้จองขอ WiFi ไว้ตอนนัดหมายล่วงหน้า → pre-select "รับ WiFi" */
  preSelected?: boolean;
}

export default function WifiOfferScreen({ locale, onAccept, onDecline, preSelected }: WifiOfferScreenProps) {
  // ถ้า preSelected → เริ่มต้น "รับ WiFi" ไว้เลย แต่แก้ไขได้
  const [wifiAccepted, setWifiAccepted] = useState(preSelected ?? false);
  // เมื่อ toggle เปลี่ยนค่า ยังไม่ submit ทันที ต้องกดยืนยัน
  const isPreSelected = preSelected === true;

  const handleConfirm = () => {
    if (wifiAccepted) {
      onAccept();
    } else {
      onDecline();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="px-4 py-2.5 border-b border-gray-100">
        <h1 className="text-xs font-bold text-[#1B2B5E]">
          {locale === "th" ? "WiFi สำหรับผู้มาติดต่อ" : "Guest WiFi"}
        </h1>
        <p className="text-[9px] text-gray-400">
          {locale === "th" ? "Guest WiFi" : "Connect to our guest network"}
        </p>
      </header>

      {/* Content — upper half */}
      <main className="flex-1 flex flex-col items-center pt-4 px-4 gap-4">
        {/* WiFi icon */}
        <div className="w-16 h-16 rounded-full bg-[#2E4A8A]/10 border-2 border-[#2E4A8A]/20 flex items-center justify-center">
          <Wifi size={28} className="text-[#2E4A8A]" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-[#1B2B5E]">
            {isPreSelected
              ? (locale === "th"
                ? "คุณเลือกรับ WiFi ไว้แล้ว"
                : "WiFi was pre-selected")
              : (locale === "th"
                ? "ต้องการใช้ WiFi ของสำนักงานหรือไม่?"
                : "Would you like to use office WiFi?")}
          </h2>
          <p className="text-[10px] text-gray-400 max-w-[240px]">
            {isPreSelected
              ? (locale === "th"
                ? "ท่านขอรับ WiFi ไว้ตอนนัดหมายล่วงหน้า สามารถเปลี่ยนได้"
                : "You requested WiFi when making your appointment. You can change this.")
              : (locale === "th"
                ? "ข้อมูล WiFi จะพิมพ์ในบัตรผู้มาติดต่อ"
                : "WiFi details will be printed on your visitor slip")}
          </p>
        </div>

        {/* Preview card */}
        <div className="w-full max-w-[240px] p-3 rounded-xl bg-gradient-to-br from-[#2E4A8A]/5 to-[#1B2B5E]/5 border border-[#2E4A8A]/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400">{locale === "th" ? "ชื่อเครือข่าย" : "Network"}</span>
            <span className="text-[10px] font-bold text-[#1B2B5E]">MOTS-Guest</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400">{locale === "th" ? "ใช้ได้ถึง" : "Valid until"}</span>
            <span className="text-[10px] font-medium text-[#2E4A8A]">16:30 น.</span>
          </div>
        </div>

        {/* Toggle buttons — pre-selected shows checked state */}
        <div className="w-full max-w-[240px] space-y-2">
          <button
            onClick={() => setWifiAccepted(true)}
            className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              wifiAccepted
                ? "bg-gradient-to-r from-[#2E4A8A] to-[#1B2B5E] text-white shadow-lg"
                : "border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {wifiAccepted && <Check size={14} />}
            <Wifi size={14} />
            {locale === "th" ? "รับ WiFi" : "Accept WiFi"}
          </button>
          <button
            onClick={() => setWifiAccepted(false)}
            className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 ${
              !wifiAccepted
                ? "bg-gray-600 text-white shadow"
                : "border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {!wifiAccepted && <Check size={14} />}
            <WifiOff size={14} />
            {locale === "th" ? "ไม่ต้องการ" : "No, thanks"}
          </button>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="w-full max-w-[240px] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
        >
          ✓ {locale === "th" ? "ยืนยันและดำเนินการต่อ" : "Confirm & Continue"}
        </button>
      </main>
    </div>
  );
}
