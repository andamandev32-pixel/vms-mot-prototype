"use client";

import { ChevronLeft, QrCode, Search } from "lucide-react";

interface AppointmentSelectScreenProps {
  locale: "th" | "en";
  onHasQr: () => void;
  onNoQr: () => void;
  onBack: () => void;
}

export default function AppointmentSelectScreen({ locale, onHasQr, onNoQr, onBack }: AppointmentSelectScreenProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-[#1B2B5E]">
            {locale === "th" ? "นัดหมายล่วงหน้า" : "Pre-booked Appointment"}
          </h1>
          <p className="text-[10px] text-gray-400">
            {locale === "th" ? "Pre-booked Appointment" : "Check in for your appointment"}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
        <h2 className="text-base font-bold text-[#1B2B5E] text-center">
          {locale === "th" ? "ท่านมี QR Code นัดหมายหรือไม่?" : "Do you have an appointment QR code?"}
        </h2>

        <div className="w-full max-w-[300px] space-y-3">
          {/* Has QR */}
          <button
            onClick={onHasQr}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[#2E3192]/30 bg-[#2E3192]/5 hover:border-[#2E3192] hover:bg-[#2E3192]/10 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-[#2E3192]/10 flex items-center justify-center shrink-0 ">
              <QrCode size={28} className="text-[#2E3192]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1B2B5E]">
                {locale === "th" ? "มี QR Code" : "I have a QR Code"}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {locale === "th"
                  ? "สแกน QR Code จาก LINE หรืออีเมล"
                  : "Scan QR from LINE or email"}
              </p>
            </div>
          </button>

          {/* No QR */}
          <button
            onClick={onNoQr}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-[#2E4A8A]/10 flex items-center justify-center shrink-0">
              <Search size={28} className="text-[#2E4A8A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1B2B5E]">
                {locale === "th" ? "ไม่มี QR Code" : "No QR Code"}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {locale === "th"
                  ? "ค้นหาจากบัตรประชาชน / หนังสือเดินทาง"
                  : "Search by ID card or passport"}
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
