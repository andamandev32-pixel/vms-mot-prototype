"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VmsLogo from "@/components/ui/VmsLogo";

export default function WebLoginPage() {
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
        // Mock login delay
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
        router.push("/web/dashboard");
    };

    return (
        <div className="flex min-h-screen web-theme">
            {/* Left Side - Purple Gradient (MOTS Theme) */}
            <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-center px-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <div className="relative z-10 text-center lg:text-left">
                    <div className="mb-8">
                        <VmsLogo size={64} darkMode />
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">Visitor<br />Management<br />System</h1>
                    <div className="h-1 w-20 bg-accent rounded-full mb-6"></div>
                    <p className="text-primary-light text-xl font-light tracking-wide">สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา</p>
                </div>
                <div className="absolute bottom-12 text-primary-light/60 text-sm font-light">
                    &copy; 2569 Ministry of Tourism and Sports
                </div>
            </div>

            {/* Right Side - White */}
            <div className="flex-1 flex items-center justify-center bg-bg p-8">
                <form onSubmit={handleLogin} className="w-full max-w-[420px] space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-4">
                        <VmsLogo size={48} />
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-primary mb-2">เข้าสู่ระบบ</h2>
                        <p className="text-text-secondary">สำหรับเจ้าหน้าที่และผู้ดูแลระบบ</p>
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
                            <div className="flex justify-end mt-2">
                                <Link href="/web/forgot-password" className="text-sm text-primary font-medium hover:text-primary-dark hover:underline">
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>
                        </div>

                        <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            เข้าสู่ระบบ
                        </Button>
                    </div>

                    {/* Demo accounts */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs font-bold text-text-secondary mb-2.5 uppercase tracking-wider">บัญชีทดสอบ (Demo)</p>
                        <div className="space-y-2">
                            {[
                                { email: "admin@mots.go.th", password: "admin1234", role: "Admin", color: "text-red-600 bg-red-50" },
                                { email: "prawit.s@mots.go.th", password: "pass1234", role: "Supervisor", color: "text-purple-600 bg-purple-50" },
                                { email: "somsri.r@mots.go.th", password: "pass1234", role: "Staff", color: "text-emerald-600 bg-emerald-50" },
                                { email: "somchai.p@mots.go.th", password: "pass1234", role: "Security", color: "text-orange-600 bg-orange-50" },
                                { email: "wichai@siamtech.co.th", password: "pass1234", role: "Visitor", color: "text-blue-600 bg-blue-50" },
                            ].map((acc) => (
                                <button
                                    key={acc.email}
                                    type="button"
                                    onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-left group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-mono text-text-primary truncate group-hover:text-primary transition-colors">{acc.email}</p>
                                        <p className="text-[10px] text-text-muted">pw: {acc.password}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${acc.color}`}>{acc.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-sm text-text-secondary pt-4 border-t border-gray-100">
                        ยังไม่มีบัญชี?{" "}
                        <Link href="/web/register" className="text-primary font-bold hover:text-primary-dark hover:underline">
                            สมัครสมาชิก
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
