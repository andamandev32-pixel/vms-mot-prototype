"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Mail, Lock, Phone, Building2, CreditCard, Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function VisitorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    company: "",
    idNumber: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim() || !form.phone.trim()) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
      return;
    }
    if (form.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!agreed) {
      setError("กรุณายอมรับเงื่อนไขการใช้งาน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/visitor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          company: form.company || undefined,
          idNumber: form.idNumber || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/visitor/booking");
      } else {
        setError(json.error?.message || "สมัครสมาชิกไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-between px-12 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="relative z-10 text-left">
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">eVMS</h1>
          <p className="text-base text-primary-light font-light uppercase tracking-[0.15em]">Visitor Portal</p>
        </div>

        <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center -mt-20">
          <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={200} height={200} className="drop-shadow-2xl mb-6" priority />
          <p className="text-primary-light text-2xl font-light">สมัครสมาชิก</p>
          <p className="text-primary-light/60 text-base font-light mt-2">ลงทะเบียนเพื่อจองนัดหมายออนไลน์</p>
        </div>

        <div className="relative z-10 text-primary-light/60 text-sm font-light">
          © 2569 กระทรวงการท่องเที่ยวและกีฬา
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center bg-bg p-6 md:p-8">
        <form onSubmit={handleRegister} className="w-full max-w-[480px] space-y-6 bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100">
          <div className="lg:hidden flex flex-col items-center mb-2">
            <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={64} height={64} className="mb-1" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-1">สมัครสมาชิก</h2>
            <p className="text-text-secondary text-sm">ลงทะเบียนเพื่อจองนัดหมายออนไลน์</p>
          </div>

          {error && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="ชื่อ *"
                placeholder="ชื่อ"
                leftIcon={<User size={16} />}
                className="h-11 bg-gray-50 border-gray-200"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <Input
                label="นามสกุล *"
                placeholder="นามสกุล"
                className="h-11 bg-gray-50 border-gray-200"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>

            <Input
              label="อีเมล *"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Mail size={16} />}
              className="h-11 bg-gray-50 border-gray-200"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />

            <Input
              label="เบอร์โทร *"
              type="tel"
              placeholder="081-234-5678"
              leftIcon={<Phone size={16} />}
              className="h-11 bg-gray-50 border-gray-200"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />

            <Input
              label="บริษัท/หน่วยงาน"
              placeholder="ชื่อบริษัท (ถ้ามี)"
              leftIcon={<Building2 size={16} />}
              className="h-11 bg-gray-50 border-gray-200"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />

            <Input
              label="เลขบัตรประชาชน/Passport"
              placeholder="สำหรับยืนยันตัวตนที่ Kiosk (ถ้ามี)"
              leftIcon={<CreditCard size={16} />}
              className="h-11 bg-gray-50 border-gray-200"
              value={form.idNumber}
              onChange={(e) => update("idNumber", e.target.value)}
              maxLength={20}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="รหัสผ่าน *"
                type="password"
                placeholder="อย่างน้อย 6 ตัว"
                leftIcon={<Lock size={16} />}
                className="h-11 bg-gray-50 border-gray-200"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <Input
                label="ยืนยันรหัสผ่าน *"
                type="password"
                placeholder="กรอกอีกครั้ง"
                leftIcon={<Lock size={16} />}
                className="h-11 bg-gray-50 border-gray-200"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>

            {/* PDPA Consent */}
            <div
              onClick={() => setAgreed(!agreed)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                agreed ? "bg-primary-50 border-primary/30" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                agreed ? "bg-primary border-primary" : "border-gray-300 bg-white"
              }`}>
                {agreed && <Check size={12} className="text-white" />}
              </div>
              <p className="text-xs text-text-secondary leading-snug">
                ข้าพเจ้ายินยอมให้จัดเก็บข้อมูลส่วนบุคคลเพื่อการรักษาความปลอดภัยและการจัดการนัดหมาย ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
              </p>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} className="h-13 text-base font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              สมัครสมาชิก
            </Button>
          </div>

          <div className="text-center text-sm text-text-secondary pt-3 border-t border-gray-100">
            มีบัญชีแล้ว?{" "}
            <Link href="/visitor" className="text-primary font-bold hover:text-primary-dark hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
