"use client";

import { ChevronLeft, User, Building, MapPin, Clock, Calendar, CheckCircle, ClipboardCheck } from "lucide-react";
import type { AppointmentData } from "@/lib/kiosk/kiosk-types";
import { cn } from "@/lib/utils";

interface AppointmentPreviewScreenProps {
  locale: "th" | "en";
  appointment: AppointmentData;
  onConfirmCheckin: () => void;
  onBack: () => void;
}

export default function AppointmentPreviewScreen({ locale, appointment, onConfirmCheckin, onBack }: AppointmentPreviewScreenProps) {
  const isperiod = appointment.entryMode === "period";
  const detailRows = [
    { icon: <Building size={10} className="text-[#2E4A8A]" />, label: locale === "th" ? "หน่วยงาน" : "Department", value: appointment.hostDepartment },
    { icon: <User size={10} className="text-[#2E4A8A]" />, label: locale === "th" ? "ผู้นัดหมาย" : "Host", value: appointment.hostName },
    { icon: <MapPin size={10} className="text-[#2E4A8A]" />, label: locale === "th" ? "สถานที่" : "Location", value: locale === "th" ? appointment.location : appointment.locationEn },
    { icon: <Calendar size={10} className="text-[#2E4A8A]" />, label: locale === "th" ? (isperiod ? "ช่วงวันที่" : "วันที่") : (isperiod ? "Date Range" : "Date"), value: isperiod && appointment.dateEnd ? `${appointment.date} — ${appointment.dateEnd}` : appointment.date },
    { icon: <Clock size={10} className="text-[#2E4A8A]" />, label: locale === "th" ? "เวลา" : "Time", value: appointment.timeSlot },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <ClipboardCheck size={14} className="text-[#1B2B5E]" />
        <div>
          <h1 className="text-[11px] font-bold text-[#1B2B5E]">
            {locale === "th" ? "ข้อมูลนัดหมาย" : "Appointment Details"}
          </h1>
          <p className="text-[8px] text-gray-400">
            {locale === "th" ? "Appointment Details" : "Confirm your appointment"}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-3 py-2 gap-2 overflow-hidden">
        {/* ── Single unified card ── */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 space-y-1">
          {/* Purpose badge (top) */}
          <div className="flex items-center justify-center gap-2 pb-1 border-b border-gray-200">
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#2E3192]/10 border border-[#2E3192]/20 ">
              <span className="text-xs">{appointment.purposeIcon}</span>
              <span className="text-[9px] font-bold text-[#2E3192]">
                {locale === "th" ? appointment.purposeName : appointment.purposeNameEn}
              </span>
            </div>
            {isperiod && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200">
                <Calendar size={9} className="text-purple-600" />
                <span className="text-[8px] font-bold text-purple-700">
                  {locale === "th" ? "ช่วงเวลา" : "Period"}
                </span>
              </div>
            )}
          </div>

          {/* Visitor info row */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-[#1B2B5E]/10 flex items-center justify-center shrink-0">
              <User size={12} className="text-[#1B2B5E]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-[#1B2B5E]">{appointment.visitorName}</p>
              {appointment.visitorCompany && (
                <p className="text-[8px] text-gray-400">{appointment.visitorCompany}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Detail rows — 2 columns */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {detailRows.map((row, i) => (
              <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1", i === 0 && "col-span-2")}>
                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0">
                  {row.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] text-gray-400 leading-tight">{row.label}</p>
                  <p className="text-[8px] font-medium text-[#1B2B5E] leading-tight">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={onConfirmCheckin}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#252880] text-white font-bold text-[11px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <CheckCircle size={13} />
          {locale === "th" ? "ยืนยัน Check-in" : "Confirm Check-in"}
        </button>
      </main>
    </div>
  );
}
