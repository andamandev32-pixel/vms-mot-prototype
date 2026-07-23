"use client";

// ════════════════════════════════════════════════════
// ลงทะเบียนผู้มาติดต่อ (Visitor Registration)
// ยืนยันตัวตนด้วยบัญชี LINE — ไม่ต้องตั้งรหัสผ่าน
// ใช้ร่วมกันระหว่าง /line-oa (เดโม) และ /liff/register (LIFF จริง)
// ════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, UserPlus, Mail, Phone, Building2, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface VisitorRegisterPayload {
  firstName: string;
  lastName: string;
  idType: "thai-id" | "passport";
  idNumber: string;
  company: string;
  email: string;
  phone: string;
}

interface VisitorRegisterFormProps {
  onSubmit: (payload: VisitorRegisterPayload) => void | Promise<void>;
  onBack?: () => void;
  submitting?: boolean;
  errorMessage?: string;
  /** ชื่อจากบัญชี LINE — ระบบเติมให้อัตโนมัติ */
  displayName?: string;
}

export default function VisitorRegisterForm({
  onSubmit,
  onBack,
  submitting = false,
  errorMessage,
  displayName,
}: VisitorRegisterFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idType, setIdType] = useState<"thai-id" | "passport">("thai-id");
  const [idNumber, setIdNumber] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // ดึงชื่อ-นามสกุลจากบัญชี LINE ให้อัตโนมัติ
  useEffect(() => {
    if (!displayName) return;
    const parts = displayName.split(" ");
    setFirstName((prev) => prev || parts[0] || "");
    setLastName((prev) => prev || parts.slice(1).join(" ") || "");
  }, [displayName]);

  const canSubmit = !!firstName.trim() && !!idNumber.trim() && !!email.trim();

  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <UserPlus size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-primary leading-tight">ลงทะเบียนผู้มาติดต่อ</h1>
            <p className="text-[11px] text-text-muted">กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input label="ชื่อ" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ชื่อ" />
          <Input label="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="นามสกุล" />
        </div>

        <div className="grid grid-cols-[110px_1fr] gap-2">
          <div>
            <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ประเภทเอกสาร</label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value as "thai-id" | "passport")}
              className="flex h-10 w-full rounded-md border border-border bg-white px-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="thai-id">บัตรประชาชน</option>
              <option value="passport">Passport</option>
            </select>
          </div>
          <Input
            label={idType === "thai-id" ? "เลขบัตรประชาชน" : "เลขที่ Passport"}
            required
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder={idType === "thai-id" ? "เลข 13 หลัก" : "AA1234567"}
            leftIcon={<CreditCard className="w-4 h-4" />}
          />
        </div>

        <Input
          label="บริษัท / หน่วยงาน" value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="เช่น บจก. ตัวอย่าง" leftIcon={<Building2 className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="อีเมล" required type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com" leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="เบอร์โทรศัพท์" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0XX-XXX-XXXX" leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
        )}

        <button
          onClick={() => onSubmit({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            idType,
            idNumber: idNumber.trim(),
            company: company.trim(),
            email: email.trim(),
            phone: phone.trim(),
          })}
          disabled={!canSubmit || submitting}
          className="w-full h-11 rounded-xl bg-[#06C755] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          สร้างบัญชี
        </button>

        <p className="text-[11px] text-text-muted text-center">
          ยืนยันตัวตนด้วยบัญชี LINE — ไม่ต้องตั้งรหัสผ่าน
        </p>
      </div>
    </div>
  );
}
