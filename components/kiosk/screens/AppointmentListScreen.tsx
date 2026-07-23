"use client";

// ════════════════════════════════════════════════════
// รายการนัดหมาย (Appointments Found) — เส้นทาง "มีนัดแต่ไม่มี QR"
// ระบบค้นนัดจากบัตรที่ยืนยันตัวตน แล้วให้เลือกนัดที่ถูกต้อง (คู่มือ 4.3.1)
// ════════════════════════════════════════════════════

import { ChevronLeft, Building, User, Calendar, Clock, Landmark, Globe } from "lucide-react";
import type { AppointmentData } from "@/lib/kiosk/kiosk-types";

interface AppointmentListScreenProps {
  locale: "th" | "en";
  appointments: AppointmentData[];
  onSelect: (appointment: AppointmentData) => void;
  onBack: () => void;
  onChangeLocale?: () => void;
}

export default function AppointmentListScreen({
  locale,
  appointments,
  onSelect,
  onBack,
  onChangeLocale,
}: AppointmentListScreenProps) {
  const th = locale === "th";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {th ? "รายการนัดหมาย" : "Appointments Found"}
          </h1>
          <p className="text-[8px] text-gray-400">
            {th ? "Appointments Found" : "เลือกนัดหมายที่ถูกต้อง"}
          </p>
        </div>
        {onChangeLocale && (
          <button
            onClick={onChangeLocale}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300 text-[9px] font-bold text-[#2E3192] hover:bg-gray-50 transition-all"
          >
            <Globe size={9} />
            {th ? "EN" : "TH"}
          </button>
        )}
      </header>

      <main className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="text-right text-[11px] font-bold text-[#1B2B5E] mb-1.5">
          {th ? `พบ ${appointments.length} รายการ` : `${appointments.length} found`}
        </p>

        <div className="space-y-1.5">
          {appointments.map((appt) => (
            <div
              key={appt.bookingCode}
              className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
            >
              <div className="flex items-start gap-1.5">
                <div className="w-6 h-6 rounded-md bg-[#2E3192]/10 flex items-center justify-center flex-shrink-0">
                  <Landmark size={12} className="text-[#2E3192]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#1B2B5E] truncate">
                    {th ? appt.purposeName : appt.purposeNameEn}
                  </p>

                  <div className="mt-0.5 space-y-[1px]">
                    <p className="flex items-center gap-1 text-[8px] text-gray-500 truncate">
                      <User size={8} className="text-gray-400 flex-shrink-0" />
                      {appt.hostName}
                    </p>
                    <p className="flex items-center gap-1 text-[8px] text-gray-500 truncate">
                      <Building size={8} className="text-gray-400 flex-shrink-0" />
                      {appt.hostDepartment}
                    </p>
                    <p className="flex items-center gap-1 text-[8px] font-bold text-[#1B2B5E]">
                      <Calendar size={8} className="text-gray-400 flex-shrink-0" />
                      {appt.entryMode === "period" && appt.dateEnd
                        ? `${appt.date} – ${appt.dateEnd}`
                        : appt.date}
                    </p>
                    <p className="flex items-center gap-1 text-[8px] text-gray-500">
                      <Clock size={8} className="text-gray-400 flex-shrink-0" />
                      {appt.timeSlot}
                      {appt.entryMode === "period" && (
                        <span className="text-gray-400">
                          · {th ? "เข้าได้หลายครั้ง" : "multi-entry"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {appt.status === "approved" && (
                    <span className="px-1.5 py-[1px] rounded-full bg-emerald-50 border border-emerald-200 text-[7px] font-bold text-emerald-600">
                      {th ? "อนุมัติแล้ว" : "Approved"}
                    </span>
                  )}
                  <button
                    onClick={() => onSelect(appt)}
                    className="px-2.5 py-1 rounded-md bg-[#1B2B5E] text-white text-[9px] font-bold active:scale-95 transition-all"
                  >
                    {th ? "เลือก" : "Select"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[7px] text-gray-400 text-center mt-2 leading-tight">
          {th
            ? "กรุณาเลือกนัดให้ตรงวัน/เวลา/ผู้ที่ต้องการพบ ก่อนดำเนินการต่อ"
            : "Select the appointment matching your date, time and host"}
        </p>
      </main>
    </div>
  );
}
