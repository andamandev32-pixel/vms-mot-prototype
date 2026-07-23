"use client";

// ════════════════════════════════════════════════════
// ลงทะเบียนพนักงาน (Officer Registration) — 3 ขั้น
//   1. ค้นหาพนักงาน  (ชื่อ-นามสกุล / รหัสพนักงาน / เลขบัตรประชาชน)
//   2. เลือกรายชื่อ   (เมื่อพบหลายรายการ)
//   3. กรอกข้อมูลสร้างบัญชี
// ใช้ร่วมกันระหว่าง /line-oa (เดโม) และ /liff/register (LIFF จริง)
// ════════════════════════════════════════════════════

import { useState } from "react";
import {
  Search, Loader2, ChevronRight, ChevronLeft, Briefcase, UserPlus,
  Mail, Phone, BadgeCheck, AtSign, Eye, EyeOff, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import type { StaffCandidate, ApiCallLog } from "@/lib/hooks/use-line-oa";

export interface OfficerRegisterPayload {
  candidate: StaffCandidate;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  username: string;
  password: string;
}

interface OfficerRegisterFormProps {
  onSubmit: (payload: OfficerRegisterPayload) => void | Promise<void>;
  onBack?: () => void;
  submitting?: boolean;
  /** ข้อความ error จากฝั่ง parent (เช่น API ตอบ error) */
  errorMessage?: string;
  /** เก็บ log การเรียก API ไว้โชว์ในแผง dev ของ /line-oa */
  onApiLog?: (log: ApiCallLog) => void;
}

/** กฎการตั้งรหัสผ่านตามคู่มือ (ส่วนที่ 3.3) */
export function checkPasswordRules(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

const ROLE_OPTIONS = [
  { value: "staff", label: "พนักงาน (Staff)" },
  { value: "supervisor", label: "หัวหน้า (Supervisor)" },
  { value: "security", label: "เจ้าหน้าที่ รปภ. (Security)" },
];

export default function OfficerRegisterForm({
  onSubmit,
  onBack,
  submitting = false,
  errorMessage,
  onApiLog,
}: OfficerRegisterFormProps) {
  const [step, setStep] = useState<"search" | "select" | "form">("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [candidates, setCandidates] = useState<StaffCandidate[]>([]);
  const [selected, setSelected] = useState<StaffCandidate | null>(null);

  // ── ฟอร์มสร้างบัญชี ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const pwRules = checkPasswordRules(password);
  const pwValid = Object.values(pwRules).every(Boolean);
  const canSubmit = !!selected && !!firstName.trim() && !!email.trim() && !!username.trim() && pwValid;

  const pickCandidate = (c: StaffCandidate) => {
    setSelected(c);
    setFirstName(c.firstName);
    setLastName(c.lastName);
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setUsername(c.employeeId.toLowerCase().replace(/[^a-z0-9]/g, ""));
    setStep("form");
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchError("กรุณากรอกชื่อ-นามสกุล รหัสพนักงาน หรือเลขบัตรประชาชน");
      return;
    }
    setSearching(true);
    setSearchError("");
    const requestBody = { query: query.trim() };
    const start = performance.now();
    try {
      const res = await fetch("/api/auth/check-staff", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const json = await res.json();
      onApiLog?.({
        id: `check-staff-${Date.now()}`,
        method: "POST",
        url: "/api/auth/check-staff",
        requestBody,
        responseStatus: res.status,
        responseBody: json,
        latencyMs: Math.round(performance.now() - start),
        timestamp: Date.now(),
      });

      const list = (json?.data?.candidates ?? []) as StaffCandidate[];
      if (!json.success || list.length === 0) {
        setCandidates([]);
        setSearchError(json?.error?.message || "ไม่พบข้อมูลพนักงาน กรุณาตรวจสอบข้อมูลอีกครั้ง");
        return;
      }

      setCandidates(list);
      if (list.length === 1) pickCandidate(list[0]);
      else setStep("select");
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSearching(false);
    }
  };

  // ═════════ Header ═════════
  const Header = (
    <div className="flex items-center gap-3 mb-3">
      {(onBack || step !== "search") && (
        <button
          onClick={() => {
            if (step === "form") { setStep(candidates.length > 1 ? "select" : "search"); return; }
            if (step === "select") { setStep("search"); return; }
            onBack?.();
          }}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
        {step === "form" ? <UserPlus size={20} className="text-green-600" /> : <Briefcase size={20} className="text-green-600" />}
      </div>
      <div className="min-w-0">
        <h1 className="text-base font-bold text-primary leading-tight">ลงทะเบียนพนักงาน</h1>
        <p className="text-[11px] text-text-muted">
          {step === "form" ? "กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่" : "Officer Registration"}
        </p>
      </div>
    </div>
  );

  // ═════════ ขั้น 1-2: ค้นหา / เลือกรายชื่อ ═════════
  if (step === "search" || step === "select") {
    return (
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          {Header}

          <label className="block text-sm font-bold text-primary mb-1.5">ค้นหาพนักงาน</label>
          <div className="flex gap-2">
            <Input
              placeholder="ชื่อ-นามสกุล / รหัสพนักงาน / เลขบัตรประชาชน"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="flex-1 rounded-full"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || searching}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                query.trim() && !searching ? "bg-[#06C755] text-white" : "bg-gray-100 text-gray-400"
              )}
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>

          {searchError && <p className="text-xs text-red-500 mt-2">{searchError}</p>}

          {step === "select" && (
            <div className="mt-4">
              <p className="text-sm font-medium text-primary mb-2">
                พบ {candidates.length} รายการ — กรุณาเลือกรายการของคุณ
              </p>
              <div className="space-y-2">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCandidate(c)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary-50/40 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={15} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {c.employeeId} • {c.position} • {c.departmentName}
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-text-muted mt-3">
            ระบบจะค้นหาข้อมูลพนักงานจากระบบเพื่อกรอกฟอร์มอัตโนมัติ
          </p>
        </div>
      </div>
    );
  }

  // ═════════ ขั้น 3: ฟอร์มสร้างบัญชี ═════════
  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {Header}

        {/* กฎการตั้งรหัสผ่าน */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-700 mb-1.5">🔐 กฎการตั้งรหัสผ่าน</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              { ok: pwRules.length, label: "อย่างน้อย 8 ตัวอักษร" },
              { ok: pwRules.upper, label: "ตัวอักษรพิมพ์ใหญ่ (A-Z)" },
              { ok: pwRules.lower, label: "ตัวอักษรพิมพ์เล็ก (a-z)" },
              { ok: pwRules.digit, label: "ตัวเลข (0-9)" },
              { ok: pwRules.special, label: "อักขระพิเศษ (!@#$%^&*…)" },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-1.5">
                <Check size={12} className={cn("mt-0.5 flex-shrink-0", r.ok ? "text-green-600" : "text-amber-400")} />
                <span className={cn("text-[10px] leading-tight", r.ok ? "text-green-700" : "text-amber-700")}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input label="ชื่อ" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ชื่อ" />
          <Input label="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="นามสกุล" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="อีเมล" required type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@mots.go.th" leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="เบอร์โทรศัพท์" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0XX-XXX-XXXX" leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>

        {/* รหัสพนักงาน — อ่านอย่างเดียว */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <BadgeCheck size={14} /> รหัสพนักงาน
          </span>
          <span className="text-sm font-bold text-primary">{selected?.employeeId}</span>
        </div>

        {/* สังกัด/กลุ่มงาน จากทำเนียบ */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-xs text-text-muted flex-shrink-0">ตำแหน่ง</span>
            <span className="text-xs text-primary text-right">{selected?.position}</span>
          </div>
          {selected?.workGroup && (
            <div className="flex justify-between gap-2">
              <span className="text-xs text-text-muted flex-shrink-0">กลุ่มงาน</span>
              <span className="text-xs text-primary text-right">{selected.workGroup}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-xs text-text-muted flex-shrink-0">สังกัด</span>
            <span className="text-xs text-primary text-right">{selected?.departmentName}</span>
          </div>
        </div>

        {/* สิทธิ์ (ROLE) */}
        <div>
          <label className="block text-xs font-medium uppercase text-text-secondary mb-1">สิทธิ์ (ROLE)</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="ชื่อผู้ใช้งาน" required value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ชื่อผู้ใช้งาน (username)" leftIcon={<AtSign className="w-4 h-4" />}
        />

        <Input
          label="รหัสผ่าน" required
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="กรอกรหัสผ่าน (password)"
          rightIcon={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-muted">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 flex items-start gap-2">
          <Mail size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-blue-700 leading-snug">
            ผู้ใช้สามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้ได้ทันที
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
        )}

        <button
          onClick={() => selected && onSubmit({
            candidate: selected,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            role,
            username: username.trim(),
            password,
          })}
          disabled={!canSubmit || submitting}
          className="w-full h-11 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          สร้างบัญชี
        </button>
      </div>
    </div>
  );
}
