"use client";

import { UserPlus, Globe, QrCode, AlertTriangle } from "lucide-react";

interface WelcomeScreenProps {
  locale: "th" | "en";
  isAuthenticated?: boolean;
  onSelectWalkin: () => void;
  onSelectAppointment: () => void;
  onChangeLocale?: () => void;
}

export default function WelcomeScreen({ locale, isAuthenticated = true, onSelectWalkin, onSelectAppointment, onChangeLocale }: WelcomeScreenProps) {
  const now = new Date();
  const time = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const date = locale === "th"
    ? now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top section — Logo left + Title right */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Emblem_of_Ministry_of_Tourism_and_Sports_of_Thailand.svg/960px-Emblem_of_Ministry_of_Tourism_and_Sports_of_Thailand.svg.png"
          alt="MOTS"
          className="w-10 h-10 object-contain shrink-0"
        />
        <div>
          <h1 className="text-[13px] font-bold text-[#2E3192] leading-snug whitespace-nowrap">
            {locale === "th" ? "กระทรวงการท่องเที่ยวและกีฬา" : "Ministry of Tourism and Sports"}
          </h1>
          <p className="text-[11px] text-gray-400 font-semibold">Visitor Management System</p>
        </div>
      </div>

      {/* Date/time + locale row */}
      <div className="flex items-center justify-between px-3 mt-2.5">
        {onChangeLocale && (
          <button
            onClick={onChangeLocale}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300 text-[9px] font-bold text-[#2E3192] hover:bg-gray-50 transition-all"
          >
            <Globe size={9} />
            {locale === "th" ? "EN" : "TH"}
          </button>
        )}
        <div className="text-right">
          <div className="text-base font-bold text-[#2E3192] tabular-nums leading-tight">{time}</div>
        </div>
      </div>

      {/* Date centered */}
      <div className="text-center mt-0.5">
        <span className="text-[9px] text-gray-400">{date}</span>
      </div>

      {/* Welcome text */}
      <main className="flex-1 flex flex-col px-3 mt-2 gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#1B2B5E] leading-tight">
            {locale === "th" ? "ยินดีต้อนรับ" : "Welcome"}
          </h2>
          <p className="text-[10px] text-gray-400 text-center">
            {locale === "th" ? "กรุณาเลือกรายการ" : "Please select an option"}
          </p>
        </div>

        {/* Token warning */}
        {!isAuthenticated && (
          <div className="w-full flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-bold text-red-600">
                {locale === "th" ? "Device Token ไม่ถูกต้อง" : "Invalid Device Token"}
              </p>
              <p className="text-[8px] text-red-500 mt-0.5">
                {locale === "th"
                  ? "กรุณากดไอคอน ⚙️ ด้านล่างเพื่อตั้งค่า Device Token ก่อนใช้งาน"
                  : "Please tap the ⚙️ icon below to configure Device Token"}
              </p>
            </div>
          </div>
        )}

        {/* Two buttons side by side */}
        <div className="w-full flex gap-1.5">
          {/* Appointment */}
          <button
            onClick={onSelectAppointment}
            disabled={!isAuthenticated}
            className={`flex-1 flex items-center gap-1.5 py-2 px-1.5 rounded-xl bg-white border-2 border-[#2E3192]/20 shadow-sm transition-all ${
              isAuthenticated
                ? "hover:border-[#2E3192] hover:shadow-md active:scale-[0.97]"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#2E3192]/10 flex items-center justify-center shrink-0 ">
              <QrCode size={16} className="text-[#2E3192]" />
            </div>
            <div className="text-left min-w-0">
              <h3 className="text-[9px] font-bold text-[#1B2B5E] leading-tight whitespace-nowrap">
                {locale === "th" ? "มีนัดล่วงหน้า" : "Appointment"}
              </h3>
              <p className="text-[7px] text-gray-400 whitespace-nowrap">Scan QR Code</p>
            </div>
          </button>

          {/* Walk-in */}
          <button
            onClick={onSelectWalkin}
            disabled={!isAuthenticated}
            className={`flex-1 flex items-center gap-1.5 py-2 px-1.5 rounded-xl bg-[#2E3192] text-white shadow-lg transition-all ${
              isAuthenticated
                ? "hover:bg-[#252880] hover:shadow-xl active:scale-[0.97]"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <UserPlus size={16} className="text-white" />
            </div>
            <div className="text-left min-w-0">
              <h3 className="text-[9px] font-bold leading-tight whitespace-nowrap">
                {locale === "th" ? "ไม่มีนัดหมาย" : "Walk-in"}
              </h3>
              <p className="text-[7px] text-white/70 whitespace-nowrap">Walk in Registration</p>
            </div>
          </button>
        </div>

        {/* Touch to start */}
        <div className="flex justify-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[8px] text-gray-500">
            {locale === "th" ? "แตะหน้าจอเริ่มทำงาน / Touch To Start" : "Touch To Start"}
          </div>
        </div>
      </main>

      {/* Bottom accent bar */}
      <div className="h-2 bg-[#2E3192] " />
    </div>
  );
}
