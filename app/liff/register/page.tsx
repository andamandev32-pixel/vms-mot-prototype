"use client";

// ════════════════════════════════════════════════════
// LIFF: Registration (Visitor / Officer)
// เปิดจาก Rich Menu → เลือกประเภทผู้ใช้งาน → กรอกข้อมูล → สร้างบัญชี + ผูก LINE
// ใช้ฟอร์มชุดเดียวกับเดโม /line-oa (components/mobile/registration)
// ════════════════════════════════════════════════════

import { useState } from "react";
import { useLiff } from "@/lib/liff/use-liff";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import RegisterTypeSelector, { type RegisterUserType } from "@/components/mobile/registration/RegisterTypeSelector";
import OfficerRegisterForm, { type OfficerRegisterPayload } from "@/components/mobile/registration/OfficerRegisterForm";
import VisitorRegisterForm, { type VisitorRegisterPayload } from "@/components/mobile/registration/VisitorRegisterForm";

export default function LiffRegisterPage() {
  const { isReady, isLoggedIn, isInClient, profile, accessToken, loading, error, login, closeWindow } = useLiff();

  const [regType, setRegType] = useState<RegisterUserType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<{ name: string; detail?: string } | null>(null);

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
          {!isInClient && <p className="mt-2 text-xs text-muted">กรุณาเปิดลิงก์นี้ผ่าน LINE</p>}
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-lg font-bold text-green-700 mt-4">ลงทะเบียนสำเร็จ!</h2>
          <p className="text-sm text-muted mt-2">{success.name}</p>
          {success.detail && <p className="text-xs text-muted mt-1">{success.detail}</p>}
          <p className="text-xs text-muted mt-1">กำลังปิดหน้าต่าง...</p>
        </div>
      </div>
    );
  }

  // ===== ลงทะเบียนผู้มาติดต่อ — ผูกกับบัญชี LINE (ไม่ต้องตั้งรหัสผ่าน) =====
  const handleVisitor = async (data: VisitorRegisterPayload) => {
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/liff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          company: data.company,
          idNumber: data.idNumber,
          lineAccessToken: accessToken,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setFormError(json.error?.message || "เกิดข้อผิดพลาด");
        return;
      }
      setSuccess({ name: `คุณ ${data.firstName} ${data.lastName}` });
      setTimeout(() => closeWindow(), 2500);
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== ลงทะเบียนพนักงาน — สร้างบัญชี + ผูก LINE + Rich Menu =====
  const handleOfficer = async (data: OfficerRegisterPayload) => {
    setFormError("");
    setSubmitting(true);
    try {
      // 1) สร้างบัญชีผู้ใช้งาน (ผูก LINE ให้ในตัวเมื่อส่ง lineAccessToken)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: "staff",
          username: data.username,
          password: data.password,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName || data.firstName,
          phone: data.phone,
          email: data.email,
          employeeId: data.candidate.employeeId,
          departmentId: data.candidate.departmentId,
          position: data.candidate.position,
          lineAccessToken: accessToken,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setFormError(json.error?.message || "เกิดข้อผิดพลาด");
        return;
      }

      // 2) กำหนด Rich Menu "officer" + ส่ง Flex ยืนยัน (ไม่บล็อกผลลัพธ์)
      fetch("/api/liff/register-officer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: data.candidate.employeeId, lineAccessToken: accessToken }),
      }).catch(() => {});

      setSuccess({
        name: `${data.firstName} ${data.lastName}`,
        detail: data.candidate.position,
      });
      setTimeout(() => closeWindow(), 2500);
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Type selection ---
  if (!regType) {
    return <RegisterTypeSelector onSelect={setRegType} displayName={profile?.displayName} />;
  }

  if (regType === "officer") {
    return (
      <OfficerRegisterForm
        onSubmit={handleOfficer}
        onBack={() => { setRegType(null); setFormError(""); }}
        submitting={submitting}
        errorMessage={formError || undefined}
      />
    );
  }

  return (
    <VisitorRegisterForm
      onSubmit={handleVisitor}
      onBack={() => { setRegType(null); setFormError(""); }}
      submitting={submitting}
      errorMessage={formError || undefined}
      displayName={profile?.displayName}
    />
  );
}
