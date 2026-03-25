"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VmsLogo from "@/components/ui/VmsLogo";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resetSuccess, setResetSuccess] = useState(false);

    // Password strength
    const getStrength = (pw: string): { level: number; label: string; color: string } => {
        if (!pw) return { level: 0, label: "", color: "" };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { level: 1, label: "อ่อน", color: "bg-error" };
        if (score <= 2) return { level: 2, label: "ปานกลาง", color: "bg-warning" };
        return { level: 3, label: "แข็งแรง", color: "bg-success" };
    };

    const strength = getStrength(newPassword);

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) { setError("กรุณากรอกอีเมล"); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("รูปแบบอีเมลไม่ถูกต้อง"); return; }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1500));
        setLoading(false);
        setStep(2);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!newPassword || !confirmPassword) { setError("กรุณากรอกรหัสผ่าน"); return; }
        if (newPassword.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
        if (newPassword !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1500));
        setLoading(false);
        setResetSuccess(true);
        setTimeout(() => router.push("/web"), 2000);
    };

    // Shared left panel
    const LeftPanel = () => (
        <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-center px-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 text-center lg:text-left">
                <div className="mb-8"><VmsLogo size={64} darkMode /></div>
                <h1 className="text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">Visitor<br />Management<br />System</h1>
                <div className="h-1 w-20 bg-accent rounded-full mb-6"></div>
                <p className="text-primary-light text-xl font-light tracking-wide">สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา</p>
            </div>
            <div className="absolute bottom-12 text-primary-light/60 text-sm font-light">&copy; 2569 Ministry of Tourism and Sports</div>
        </div>
    );

    return (
        <div className="flex min-h-screen web-theme">
            <LeftPanel />

            <div className="flex-1 flex items-center justify-center bg-bg p-8">
                <div className="w-full max-w-[420px] bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <div className="lg:hidden flex justify-center mb-4"><VmsLogo size={48} /></div>

                    <Link href="/web" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-6 transition-colors">
                        <ChevronLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
                    </Link>

                    {/* ===== Step 1: Enter Email ===== */}
                    {step === 1 && (
                        <form onSubmit={handleSendLink} className="space-y-6">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-full bg-primary-50 mx-auto flex items-center justify-center mb-4">
                                    <Mail size={24} className="text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-primary mb-2">ลืมรหัสผ่าน</h2>
                                <p className="text-text-secondary text-sm">กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่</p>
                            </div>

                            {error && <div className="bg-error-light border border-error/20 text-error text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

                            <Input
                                label="อีเมล"
                                type="email"
                                placeholder="your@email.com"
                                leftIcon={<Mail size={18} />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-gray-50"
                            />

                            <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg">
                                ส่งลิงก์รีเซ็ต
                            </Button>
                        </form>
                    )}

                    {/* ===== Step 2: Link Sent ===== */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-success-light mx-auto flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} className="text-success" />
                                </div>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">ส่งลิงก์เรียบร้อย!</h2>
                                <p className="text-text-secondary text-sm">
                                    เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่<br />
                                    <span className="font-bold text-primary">{email}</span>
                                </p>
                                <p className="text-text-muted text-xs mt-3">หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์สแปม</p>
                            </div>

                            <Button fullWidth size="lg" onClick={() => setStep(3)} className="h-14 text-lg font-bold shadow-lg">
                                ตั้งรหัสผ่านใหม่
                            </Button>

                            <p className="text-center text-xs text-text-muted">
                                (ในระบบจริง — จะต้องกดลิงก์จากอีเมลเพื่อมาหน้านี้)
                            </p>
                        </div>
                    )}

                    {/* ===== Step 3: Reset Password ===== */}
                    {step === 3 && !resetSuccess && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-full bg-primary-50 mx-auto flex items-center justify-center mb-4">
                                    <ShieldCheck size={24} className="text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-primary mb-2">ตั้งรหัสผ่านใหม่</h2>
                                <p className="text-text-secondary text-sm">สำหรับบัญชี <span className="font-medium">{email}</span></p>
                            </div>

                            {error && <div className="bg-error-light border border-error/20 text-error text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

                            <div>
                                <Input
                                    label="รหัสผ่านใหม่"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="อย่างน้อย 8 ตัวอักษร"
                                    leftIcon={<Lock size={18} />}
                                    rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-12 bg-gray-50"
                                />
                                {/* Strength bar */}
                                {newPassword && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 flex gap-1">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= strength.level ? strength.color : "bg-gray-200")} />
                                            ))}
                                        </div>
                                        <span className={cn("text-xs font-medium", strength.level === 1 ? "text-error" : strength.level === 2 ? "text-warning" : "text-success")}>{strength.label}</span>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="ยืนยันรหัสผ่านใหม่"
                                type={showConfirm ? "text" : "password"}
                                placeholder="กรอกรหัสผ่านอีกครั้ง"
                                leftIcon={<Lock size={18} />}
                                rightIcon={<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-text-muted hover:text-text-primary">{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-12 bg-gray-50"
                                error={confirmPassword && newPassword !== confirmPassword ? "รหัสผ่านไม่ตรงกัน" : undefined}
                            />

                            <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg">
                                บันทึกรหัสผ่านใหม่
                            </Button>
                        </form>
                    )}

                    {/* Success state */}
                    {step === 3 && resetSuccess && (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-success-light mx-auto flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-success" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">เปลี่ยนรหัสผ่านสำเร็จ!</h3>
                            <p className="text-text-muted text-sm">กำลังไปหน้าเข้าสู่ระบบ...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
