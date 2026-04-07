"use client";

// ════════════════════════════════════════════════════
// LIFF: Visitor Registration
// เปิดจาก Rich Menu → กรอกข้อมูล → สร้าง account + ผูก LINE
// ════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useLiff } from "@/lib/liff/use-liff";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User,
  Phone,
  Mail,
  Building2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

type RegistrationType = "visitor" | "officer" | null;

export default function LiffRegisterPage() {
  const { isReady, isLoggedIn, isInClient, profile, accessToken, loading, error, login, closeWindow } = useLiff();

  const [regType, setRegType] = useState<RegistrationType>(null);

  // --- LIFF loading / error states ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-muted">กำลังเชื่อมต่อ LINE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-3 text-sm text-red-600">{error}</p>
          {!isInClient && (
            <p className="mt-2 text-xs text-muted">กรุณาเปิดลิงก์นี้ผ่าน LINE</p>
          )}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <p className="text-sm text-muted mb-4">กรุณา Login ด้วย LINE</p>
          <Button onClick={login}>Login with LINE</Button>
        </div>
      </div>
    );
  }

  // --- Type selection ---
  if (!regType) {
    return <TypeSelector onSelect={setRegType} displayName={profile?.displayName} />;
  }

  if (regType === "officer") {
    return <OfficerForm accessToken={accessToken!} onClose={closeWindow} onBack={() => setRegType(null)} />;
  }

  return (
    <VisitorForm
      accessToken={accessToken!}
      profile={profile}
      onClose={closeWindow}
      onBack={() => setRegType(null)}
    />
  );
}

// ===== Type Selector =====

function TypeSelector({
  onSelect,
  displayName,
}: {
  onSelect: (type: RegistrationType) => void;
  displayName?: string;
}) {
  return (
    <div className="px-6 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-primary">ลงทะเบียน eVMS</h1>
        {displayName && (
          <p className="text-sm text-muted mt-1">สวัสดี {displayName}</p>
        )}
        <p className="text-sm text-muted mt-2">เลือกประเภทผู้ใช้งาน</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onSelect("visitor")}
          className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">ผู้มาติดต่อ (Visitor)</p>
              <p className="text-xs text-muted">ลงทะเบียนเพื่อจองนัดหมาย</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("officer")}
          className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">เจ้าหน้าที่ (Officer)</p>
              <p className="text-xs text-muted">ผูก LINE กับระบบพนักงาน</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ===== Visitor Registration Form =====

function VisitorForm({
  accessToken,
  profile,
  onClose,
  onBack,
}: {
  accessToken: string;
  profile: { displayName: string; userId: string } | null;
  onClose: () => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    idNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from LINE displayName
  useEffect(() => {
    if (profile?.displayName) {
      const parts = profile.displayName.split(" ");
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || parts[0] || "",
        lastName: prev.lastName || parts.slice(1).join(" ") || "",
      }));
    }
  }, [profile]);

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError("กรุณากรอก ชื่อ, นามสกุล, เบอร์โทร");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/liff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lineAccessToken: accessToken,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || "เกิดข้อผิดพลาด");
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(), 2500);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-lg font-bold text-green-700 mt-4">ลงทะเบียนสำเร็จ!</h2>
          <p className="text-sm text-muted mt-2">คุณ {form.firstName} {form.lastName}</p>
          <p className="text-xs text-muted mt-1">กำลังปิดหน้าต่าง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted hover:text-primary text-sm">&larr; กลับ</button>
        <h1 className="text-lg font-bold text-primary">ลงทะเบียนผู้มาติดต่อ</h1>
      </div>

      <div className="space-y-4">
        <Input
          label="ชื่อ *"
          placeholder="ชื่อจริง"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          leftIcon={<User className="w-4 h-4" />}
        />
        <Input
          label="นามสกุล *"
          placeholder="นามสกุล"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          leftIcon={<User className="w-4 h-4" />}
        />
        <Input
          label="เบอร์โทร *"
          placeholder="08x-xxx-xxxx"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          leftIcon={<Phone className="w-4 h-4" />}
        />
        <Input
          label="อีเมล"
          placeholder="email@example.com"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          leftIcon={<Mail className="w-4 h-4" />}
        />
        <Input
          label="บริษัท / หน่วยงาน"
          placeholder="ชื่อบริษัท"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          leftIcon={<Building2 className="w-4 h-4" />}
        />
        <Input
          label="เลขบัตรประชาชน / Passport"
          placeholder="x-xxxx-xxxxx-xx-x"
          value={form.idNumber}
          onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
          leftIcon={<CreditCard className="w-4 h-4" />}
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังลงทะเบียน...
            </span>
          ) : (
            "ลงทะเบียน"
          )}
        </Button>
      </div>
    </div>
  );
}

// ===== Officer Registration Form =====

function OfficerForm({
  accessToken,
  onClose,
  onBack,
}: {
  accessToken: string;
  onClose: () => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [staffInfo, setStaffInfo] = useState<{
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    departmentName: string;
    employeeId: string;
  } | null>(null);
  const [step, setStep] = useState<"search" | "confirm" | "success">("search");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setError("");
    if (!query.trim()) {
      setError("กรุณากรอกรหัสพนักงาน หรือ เลขบัตรประชาชน");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch("/api/auth/check-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const json = await res.json();

      if (!json.success || !json.data?.found) {
        setError("ไม่พบข้อมูลพนักงาน กรุณาตรวจสอบรหัส");
        return;
      }

      setStaffInfo(json.data.staff);
      setStep("confirm");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/liff/register-officer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          lineAccessToken: accessToken,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || "เกิดข้อผิดพลาด");
        return;
      }

      setStep("success");
      setTimeout(() => onClose(), 2500);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-lg font-bold text-green-700 mt-4">ลงทะเบียนสำเร็จ!</h2>
          <p className="text-sm text-muted mt-2">
            {staffInfo?.firstName} {staffInfo?.lastName}
          </p>
          <p className="text-xs text-muted mt-1">{staffInfo?.position}</p>
          <p className="text-xs text-muted mt-1">กำลังปิดหน้าต่าง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted hover:text-primary text-sm">&larr; กลับ</button>
        <h1 className="text-lg font-bold text-primary">ลงทะเบียนเจ้าหน้าที่</h1>
      </div>

      {step === "search" && (
        <>
          <p className="text-sm text-muted mb-4">
            กรอกรหัสพนักงาน หรือ เลขบัตรประชาชน เพื่อค้นหาข้อมูล
          </p>
          <Input
            label="รหัสพนักงาน / เลขบัตรประชาชน"
            placeholder="เช่น EMP-001 หรือ 1-xxxx-xxxxx-xx-x"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<CreditCard className="w-4 h-4" />}
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <Button onClick={handleSearch} disabled={searching} className="w-full">
              {searching ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังค้นหา...
                </span>
              ) : (
                "ค้นหา"
              )}
            </Button>
          </div>
        </>
      )}

      {step === "confirm" && staffInfo && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-green-800">พบข้อมูลพนักงาน</p>
          </div>

          <div className="space-y-3 bg-white border rounded-xl p-4">
            <InfoRow label="ชื่อ-นามสกุล" value={`${staffInfo.firstName} ${staffInfo.lastName}`} />
            <InfoRow label="ตำแหน่ง" value={staffInfo.position} />
            <InfoRow label="สังกัด" value={staffInfo.departmentName} />
            <InfoRow label="รหัสพนักงาน" value={staffInfo.employeeId} />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button onClick={handleConfirm} disabled={submitting} className="w-full">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังลงทะเบียน...
                </span>
              ) : (
                "ยืนยันและผูก LINE"
              )}
            </Button>
            <button
              onClick={() => { setStep("search"); setStaffInfo(null); setError(""); }}
              className="w-full text-sm text-muted hover:text-primary py-2"
            >
              ค้นหาใหม่
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
