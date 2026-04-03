"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail, Eye, EyeOff, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function VisitorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/visitor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/visitor/booking");
      } else {
        setError(json.error?.message || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Purple Gradient */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-between px-12 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="relative z-10 text-left">
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">eVMS</h1>
          <p className="text-base text-primary-light font-light uppercase tracking-[0.15em]">Visitor Portal</p>
        </div>

        <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center -mt-20">
          <div className="mb-4 flex justify-center">
            <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={240} height={240} className="drop-shadow-2xl" priority />
          </div>
          <p className="text-primary-light text-2xl font-light tracking-wide">สำนักงานปลัด</p>
          <p className="text-primary-light text-2xl font-light tracking-wide">กระทรวงการท่องเที่ยวและกีฬา</p>
          <p className="text-primary-light/60 text-base font-light mt-3">ระบบจองนัดหมายสำหรับผู้มาติดต่อ</p>
        </div>

        <div className="relative z-10 text-primary-light/60 text-sm font-light">
          © 2569 กระทรวงการท่องเที่ยวและกีฬา
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center bg-bg p-8 relative">
        <form onSubmit={handleLogin} className="w-full max-w-[420px] space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-4">
            <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={80} height={80} className="mb-2" />
            <p className="text-xs text-text-secondary">สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา</p>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-2">เข้าสู่ระบบ</h2>
            <p className="text-text-secondary">สำหรับผู้มาติดต่อราชการ</p>
          </div>

          {error && (
            <div className="bg-error-light border border-error/20 text-error text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <Input
              label="อีเมล"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Mail size={18} />}
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <Input
                label="รหัสผ่าน"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              เข้าสู่ระบบ
            </Button>
          </div>

          <div className="text-center text-sm text-text-secondary pt-4 border-t border-gray-100">
            ยังไม่มีบัญชี?{" "}
            <Link href="/visitor/register" className="text-primary font-bold hover:text-primary-dark hover:underline">
              สมัครสมาชิก
            </Link>
          </div>

          <div className="text-center">
            <Link href="/web" className="text-xs text-text-muted hover:text-primary transition-colors">
              สำหรับเจ้าหน้าที่ →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
