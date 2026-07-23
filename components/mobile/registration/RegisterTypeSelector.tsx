"use client";

// ════════════════════════════════════════════════════
// เลือกประเภทผู้ใช้งาน — ขั้นแรกของการลงทะเบียนผ่าน LINE
// ใช้ร่วมกันระหว่าง /line-oa (เดโม) และ /liff/register (LIFF จริง)
// ════════════════════════════════════════════════════

import { Users, Briefcase, ChevronRight } from "lucide-react";

export type RegisterUserType = "visitor" | "officer";

interface RegisterTypeSelectorProps {
  onSelect: (type: RegisterUserType) => void;
  /** ชื่อจากบัญชี LINE (ถ้ามี) */
  displayName?: string;
}

export default function RegisterTypeSelector({ onSelect, displayName }: RegisterTypeSelectorProps) {
  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h1 className="text-lg font-bold text-primary">เลือกประเภทผู้ใช้งาน</h1>
        <p className="text-xs text-text-muted mt-1">
          {displayName
            ? `สวัสดี ${displayName} — กรุณาเลือกประเภทบัญชีของคุณก่อนกรอกข้อมูล`
            : "กรุณาเลือกประเภทบัญชีของคุณก่อนกรอกข้อมูล"}
        </p>

        <div className="mt-4 space-y-3">
          <button
            onClick={() => onSelect("visitor")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary-50/40 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary">ผู้มาติดต่อ</p>
              <p className="text-[11px] text-text-muted leading-snug">
                Visitor — ผู้มาติดต่อราชการทั่วไป
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>

          <button
            onClick={() => onSelect("officer")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary-50/40 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary">พนักงาน</p>
              <p className="text-[11px] text-text-muted leading-snug">
                Officer — เจ้าหน้าที่ของหน่วยงาน
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
