"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, User, Eye, EyeOff, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Lang = "th" | "en";

const i18n: Record<string, Record<Lang, string>> = {
    systemName: { th: "eVMS", en: "eVMS" },
    systemSub: { th: "Visitor Management", en: "Visitor Management" },
    orgLine1: { th: "สำนักงานปลัด", en: "Office of the Permanent Secretary" },
    orgLine2: { th: "กระทรวงการท่องเที่ยวและกีฬา", en: "Ministry of Tourism and Sports" },
    orgDesc: { th: "ระบบจัดการผู้มาติดต่อราชการ", en: "Visitor Management System" },
    copyright: { th: "© 2569 กระทรวงการท่องเที่ยวและกีฬา", en: "© 2026 Ministry of Tourism and Sports" },
    loginTitle: { th: "เข้าสู่ระบบ", en: "Sign In" },
    loginDesc: { th: "สำหรับเจ้าหน้าที่และผู้ดูแลระบบ", en: "For staff and administrators" },
    usernameLabel: { th: "Username หรือ Email", en: "Username or Email" },
    usernamePlaceholder: { th: "username หรือ your@email.com", en: "username or your@email.com" },
    passwordLabel: { th: "รหัสผ่าน", en: "Password" },
    forgotPassword: { th: "ลืมรหัสผ่าน?", en: "Forgot password?" },
    loginBtn: { th: "เข้าสู่ระบบ", en: "Sign In" },
    demoTitle: { th: "บัญชีทดสอบ (Demo) — ใช้ username หรือ email ก็ได้", en: "Demo Accounts — use username or email" },
    noAccount: { th: "ยังไม่มีบัญชี?", en: "Don't have an account?" },
    register: { th: "สมัครสมาชิก", en: "Register" },
    errRequired: { th: "กรุณากรอก Username/Email และรหัสผ่าน", en: "Please enter Username/Email and Password" },
    errFailed: { th: "เข้าสู่ระบบไม่สำเร็จ", en: "Login failed" },
    errGeneric: { th: "เกิดข้อผิดพลาด กรุณาลองใหม่", en: "An error occurred, please try again" },
    mobileOrg: { th: "สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา", en: "Ministry of Tourism and Sports" },
};

export default function WebLoginPage() {
    const router = useRouter();
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<Lang>("th");
    const [demoOpen, setDemoOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("vms-lang");
        if (saved === "en" || saved === "th") setLang(saved);
    }, []);

    const toggleLang = () => {
        const next = lang === "th" ? "en" : "th";
        setLang(next);
        localStorage.setItem("vms-lang", next);
    };

    const t = (key: string) => i18n[key]?.[lang] ?? key;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!usernameOrEmail.trim() || !password.trim()) {
            setError(t("errRequired"));
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernameOrEmail, password }),
            });
            const json = await res.json();
            if (json.success) {
                const role = json.data?.user?.role;
                router.push(role === "visitor" ? "/web/appointments" : "/web/dashboard");
            } else {
                setError(json.error?.message || t("errFailed"));
            }
        } catch {
            setError(t("errGeneric"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen web-theme">
            {/* Left Side - Teal Gradient with animated waves & orbs */}
            <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-between px-12 py-10 relative overflow-hidden">
                {/* Animated orbs */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-orb-1"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-orb-2"></div>
                <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-orb-1" style={{ animationDelay: "4s" }}></div>

                {/* SVG Wave layers */}
                <svg className="absolute bottom-0 left-0 w-[200%] h-40 animate-wave-1 opacity-10" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z" fill="white" />
                </svg>
                <svg className="absolute bottom-0 left-0 w-[200%] h-32 animate-wave-2 opacity-[0.07]" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path d="M0,80 C240,20 480,100 720,60 C960,20 1200,100 1440,80 L1440,120 L0,120 Z" fill="white" />
                </svg>

                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                {/* Top: System name — left aligned */}
                <div className="relative z-10 text-left">
                    <h1 className="text-4xl font-extrabold text-white leading-tight drop-shadow-lg tracking-tight">{t("systemName")}</h1>
                    <p className="text-base text-primary-light font-light uppercase tracking-[0.15em]">{t("systemSub")}</p>
                </div>

                {/* Center: Logo + org name */}
                <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center -mt-20">
                    <div className="mb-4 flex justify-center">
                        <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={312} height={312} className="drop-shadow-2xl" priority />
                    </div>
                    <p className="text-primary-light text-3xl font-light tracking-wide">{t("orgLine1")}</p>
                    <p className="text-primary-light text-3xl font-light tracking-wide">{t("orgLine2")}</p>
                    <p className="text-primary-light/60 text-lg font-light mt-3">{t("orgDesc")}</p>
                </div>

                <div className="relative z-10 text-primary-light/60 text-sm font-light">
                    {t("copyright")}
                </div>
            </div>

            {/* Right Side - White */}
            <div className="flex-1 flex items-center justify-center bg-bg p-8 relative">
                {/* Language toggle */}
                <button
                    type="button"
                    onClick={toggleLang}
                    className="absolute top-5 right-6 flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary border border-gray-200 rounded-full px-3 py-1.5 hover:border-primary/40 transition-all bg-white shadow-sm"
                >
                    <Globe size={15} />
                    {lang === "th" ? "EN" : "TH"}
                </button>

                <form onSubmit={handleLogin} className="w-full max-w-[420px] space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex flex-col items-center mb-4">
                        <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={80} height={80} className="mb-2" />
                        <p className="text-xs text-text-secondary">{t("mobileOrg")}</p>
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-primary mb-2">{t("loginTitle")}</h2>
                        <p className="text-text-secondary">{t("loginDesc")}</p>
                    </div>

                    {error && (
                        <div className="bg-error-light border border-error/20 text-error text-sm rounded-xl px-4 py-3 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <Input
                            label={t("usernameLabel")}
                            type="text"
                            placeholder={t("usernamePlaceholder")}
                            leftIcon={<User size={18} />}
                            className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                        />
                        <div>
                            <Input
                                label={t("passwordLabel")}
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
                                    {t("forgotPassword")}
                                </Link>
                            </div>
                        </div>

                        <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            {t("loginBtn")}
                        </Button>
                    </div>

                    {/* Demo accounts — collapsible */}
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setDemoOpen(!demoOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
                        >
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t("demoTitle")}</p>
                            <ChevronDown size={16} className={`text-text-muted transition-transform duration-200 ${demoOpen ? "rotate-180" : ""}`} />
                        </button>
                        <div
                            className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                            style={{ gridTemplateRows: demoOpen ? "1fr" : "0fr" }}
                        >
                            <div className="overflow-hidden">
                                <div className="px-4 pb-3 space-y-1.5">
                            {[
                                { username: "admin", email: "admin@mots.go.th", password: "admin1234", role: "Admin", color: "text-red-600 bg-red-50" },
                                { username: "prawit.s", email: "prawit.s@mots.go.th", password: "pass1234", role: "Supervisor", color: "text-purple-600 bg-purple-50" },
                                { username: "somsri.r", email: "somsri.r@mots.go.th", password: "pass1234", role: "Staff", color: "text-emerald-600 bg-emerald-50" },
                                { username: "somchai.p", email: "somchai.p@mots.go.th", password: "pass1234", role: "Security", color: "text-orange-600 bg-orange-50" },
                                { username: "wichai.m", email: "wichai@siamtech.co.th", password: "pass1234", role: "Visitor", color: "text-blue-600 bg-blue-50" },
                            ].map((acc) => (
                                <button
                                    key={acc.username}
                                    type="button"
                                    onClick={() => { setUsernameOrEmail(acc.username); setPassword(acc.password); setDemoOpen(false); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-left group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-mono text-text-primary truncate group-hover:text-primary transition-colors">
                                            <span className="font-bold">{acc.username}</span>
                                            <span className="text-text-muted ml-1">({acc.email})</span>
                                        </p>
                                        <p className="text-[10px] text-text-muted">pw: {acc.password}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${acc.color}`}>{acc.role}</span>
                                </button>
                            ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-text-secondary pt-4 border-t border-gray-100">
                        {t("noAccount")}{" "}
                        <Link href="/web/register" className="text-primary font-bold hover:text-primary-dark hover:underline">
                            {t("register")}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
