"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Eye, EyeOff, Users, Briefcase, Phone, Building2, BadgeCheck, ChevronLeft, CheckCircle2, Search, Loader2, Check, UserCircle, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PersonnelRecord } from "@/lib/mock-data";

type Lang = "th" | "en";

const i18n: Record<string, Record<Lang, string>> = {
    // Sidebar
    systemName: { th: "eVMS", en: "eVMS" },
    systemSub: { th: "Visitor Management", en: "Visitor Management" },
    orgLine1: { th: "สำนักงานปลัด", en: "Office of the Permanent Secretary" },
    orgLine2: { th: "กระทรวงการท่องเที่ยวและกีฬา", en: "Ministry of Tourism and Sports" },
    orgDesc: { th: "ระบบจัดการผู้มาติดต่อราชการ", en: "Visitor Management System" },
    copyright: { th: "© 2569 กระทรวงการท่องเที่ยวและกีฬา", en: "© 2026 Ministry of Tourism and Sports" },
    // Form
    backToLogin: { th: "กลับไปหน้าเข้าสู่ระบบ", en: "Back to Login" },
    title: { th: "สมัครสมาชิก", en: "Register" },
    subtitle: { th: "เลือกประเภทผู้ใช้งานและกรอกข้อมูล", en: "Select user type and fill in your details" },
    userTypeLabel: { th: "ประเภทผู้ใช้งาน", en: "User Type" },
    visitor: { th: "ผู้มาติดต่อ", en: "Visitor" },
    visitorSub: { th: "Visitor — จองนัดหมาย, ดู QR", en: "Visitor — Book appointments, view QR" },
    staff: { th: "เจ้าหน้าที่", en: "Staff" },
    staffSub: { th: "Staff — สร้างนัดหมาย, อนุมัติ", en: "Staff — Create appointments, approve" },
    firstName: { th: "ชื่อ", en: "First Name" },
    lastName: { th: "นามสกุล", en: "Last Name" },
    email: { th: "อีเมล", en: "Email" },
    phone: { th: "เบอร์โทรศัพท์", en: "Phone Number" },
    phonePlaceholder: { th: "0XX-XXX-XXXX", en: "0XX-XXX-XXXX" },
    company: { th: "บริษัท / หน่วยงาน", en: "Company / Organization" },
    companyPlaceholder: { th: "ชื่อบริษัท", en: "Company name" },
    idNumber: { th: "เลขบัตรประชาชน / Passport", en: "National ID / Passport" },
    idNumberPlaceholder: { th: "เลข 13 หลัก หรือ Passport", en: "13-digit ID or Passport number" },
    username: { th: "ชื่อผู้ใช้ (Username)", en: "Username" },
    usernamePlaceholder: { th: "ภาษาอังกฤษ เช่น john_doe", en: "e.g. john_doe" },
    usernameHelper: { th: "ใช้ a-z, 0-9, _ หรือ - อย่างน้อย 4 ตัว", en: "Use a-z, 0-9, _ or - (min 4 chars)" },
    password: { th: "รหัสผ่าน", en: "Password" },
    passwordPlaceholder: { th: "อย่างน้อย 8 ตัวอักษร", en: "At least 8 characters" },
    confirmPassword: { th: "ยืนยันรหัสผ่าน", en: "Confirm Password" },
    confirmPasswordPlaceholder: { th: "กรอกรหัสผ่านอีกครั้ง", en: "Re-enter password" },
    submitBtn: { th: "สมัครสมาชิก", en: "Register" },
    roleNoteVisitor: { th: "สิทธิ์เริ่มต้นคือ <strong>ผู้มาติดต่อ (Visitor)</strong> — หากต้องการเปลี่ยนสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ", en: "Default role is <strong>Visitor</strong> — Contact admin to change role" },
    roleNoteStaff: { th: "สิทธิ์เริ่มต้นคือ <strong>เจ้าหน้าที่ (Staff)</strong> — หากต้องการเปลี่ยนสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ", en: "Default role is <strong>Staff</strong> — Contact admin to change role" },
    hasAccount: { th: "มีบัญชีแล้ว?", en: "Already have an account?" },
    login: { th: "เข้าสู่ระบบ", en: "Login" },
    // Staff lookup
    staffSearchLabel: { th: "รหัสพนักงาน หรือ เลขบัตรประชาชน", en: "Employee ID or National ID" },
    staffSearchPlaceholder: { th: "EMP-007 หรือ 1-XXXX-XXXXX-XX-X", en: "EMP-007 or 1-XXXX-XXXXX-XX-X" },
    staffFound: { th: "พบข้อมูลพนักงาน", en: "Employee found" },
    staffName: { th: "ชื่อ-สกุล", en: "Name" },
    staffPosition: { th: "ตำแหน่ง", en: "Position" },
    staffDept: { th: "สังกัด", en: "Department" },
    staffCode: { th: "รหัส", en: "ID" },
    staffHasAccount: { th: "มีบัญชีผู้ใช้งานอยู่แล้ว", en: "Account already exists" },
    // Success
    successTitle: { th: "สมัครสมาชิกสำเร็จ!", en: "Registration Successful!" },
    successRoleVisitor: { th: "ผู้มาติดต่อ (Visitor)", en: "Visitor" },
    successRoleStaff: { th: "เจ้าหน้าที่ (Staff)", en: "Staff" },
    successRolePrefix: { th: "สิทธิ์เริ่มต้นของคุณคือ", en: "Your default role is" },
    successRedirect: { th: "กำลังไปหน้าเข้าสู่ระบบ...", en: "Redirecting to login..." },
    // Validation
    errFillAll: { th: "กรุณากรอกข้อมูลให้ครบทุกช่อง", en: "Please fill in all required fields" },
    errLookupFirst: { th: "กรุณาค้นหาและยืนยันข้อมูลพนักงานก่อน", en: "Please search and verify employee data first" },
    errUsername: { th: "กรุณากรอกชื่อผู้ใช้", en: "Username is required" },
    errUsernameMin: { th: "ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร", en: "Username must be at least 4 characters" },
    errUsernameFormat: { th: "ใช้ได้เฉพาะ a-z, 0-9, _ และ - เท่านั้น", en: "Only a-z, 0-9, _ and - allowed" },
    errFirstName: { th: "กรุณากรอกชื่อ", en: "First name is required" },
    errLastName: { th: "กรุณากรอกนามสกุล", en: "Last name is required" },
    errEmail: { th: "กรุณากรอกอีเมล", en: "Email is required" },
    errEmailFormat: { th: "รูปแบบอีเมลไม่ถูกต้อง", en: "Invalid email format" },
    errPhone: { th: "กรุณากรอกเบอร์โทรศัพท์", en: "Phone number is required" },
    errPhoneFormat: { th: "รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)", en: "Invalid phone format (e.g. 0812345678)" },
    errPassword: { th: "กรุณากรอกรหัสผ่าน", en: "Password is required" },
    errPasswordMin: { th: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", en: "Password must be at least 8 characters" },
    errConfirmPassword: { th: "กรุณายืนยันรหัสผ่าน", en: "Please confirm password" },
    errPasswordMismatch: { th: "รหัสผ่านไม่ตรงกัน", en: "Passwords do not match" },
    errCompany: { th: "กรุณากรอกบริษัท/หน่วยงาน", en: "Company is required" },
    errIdNumber: { th: "กรุณากรอกเลขบัตรประชาชน/Passport", en: "ID number is required" },
    errGeneric: { th: "เกิดข้อผิดพลาด กรุณาลองใหม่", en: "An error occurred. Please try again" },
    errRegisterFail: { th: "ลงทะเบียนไม่สำเร็จ", en: "Registration failed" },
};

type UserType = "visitor" | "staff" | null;

const departments = [
    "สำนักงานปลัดกระทรวง", "กองกลาง", "กองการต่างประเทศ", "กองกิจการท่องเที่ยว",
    "กรมการท่องเที่ยว", "กรมพลศึกษา", "การกีฬาแห่งประเทศไทย", "สำนักนโยบายและแผน",
    "สำนักงานรัฐมนตรี", "การท่องเที่ยวแห่งประเทศไทย", "มหาวิทยาลัยการกีฬาแห่งชาติ",
    "กองบัญชาการตำรวจท่องเที่ยว", "อพท.",
];

export default function RegisterPage() {
    const router = useRouter();
    const [lang, setLang] = useState<Lang>("th");

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

    const [userType, setUserType] = useState<UserType>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [company, setCompany] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");

    // Staff lookup state
    const [staffQuery, setStaffQuery] = useState("");
    const [foundStaff, setFoundStaff] = useState<PersonnelRecord | null>(null);
    const [staffHasAccount, setStaffHasAccount] = useState(false);
    const [lookupError, setLookupError] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Per-field error tracking
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

    const handleStaffLookup = async () => {
        if (!staffQuery.trim()) return;
        setIsSearching(true);
        setLookupError("");
        setFoundStaff(null);
        setStaffHasAccount(false);
        try {
            const res = await fetch("/api/auth/check-staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: staffQuery.trim() }),
            });
            const json = await res.json();
            if (json.success) {
                const p = json.data.personnel;
                setFoundStaff(p);
                setStaffHasAccount(json.data.hasAccount);
                // Pre-fill form fields
                setFirstName(p.firstName);
                setLastName(p.lastName);
                setEmployeeId(p.employeeId);
                setDepartment(departments[p.departmentId - 1] || "");
                setPosition(p.position);
            } else {
                setLookupError(json.error?.message || (lang === "th" ? "ไม่พบข้อมูลพนักงาน" : "Employee not found"));
            }
        } catch {
            setLookupError(t("errGeneric"));
        } finally {
            setIsSearching(false);
        }
    };

    const validateField = (field: string, value: string): string => {
        switch (field) {
            case "username":
                if (!value.trim()) return t("errUsername");
                if (value.trim().length < 4) return t("errUsernameMin");
                if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) return t("errUsernameFormat");
                return "";
            case "firstName": return !value.trim() ? t("errFirstName") : "";
            case "lastName": return !value.trim() ? t("errLastName") : "";
            case "email":
                if (!value.trim()) return t("errEmail");
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("errEmailFormat");
                return "";
            case "phone":
                if (!value.trim()) return t("errPhone");
                if (!/^0\d{8,9}$/.test(value.replace(/[-\s]/g, ""))) return t("errPhoneFormat");
                return "";
            case "password":
                if (!value) return t("errPassword");
                if (value.length < 8) return t("errPasswordMin");
                return "";
            case "confirmPassword":
                if (!value) return t("errConfirmPassword");
                if (value !== password) return t("errPasswordMismatch");
                return "";
            case "company": return userType === "visitor" && !value.trim() ? t("errCompany") : "";
            case "idNumber": return userType === "visitor" && !value.trim() ? t("errIdNumber") : "";
            default: return "";
        }
    };

    const handleBlur = (field: string, value: string) => {
        markTouched(field);
        setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    };

    const getError = (field: string): string | undefined => {
        return touched[field] && fieldErrors[field] ? fieldErrors[field] : undefined;
    };

    const validateAll = (): boolean => {
        const fields: Record<string, string> = {};
        if (userType === "visitor") {
            Object.assign(fields, { username, firstName, lastName, email, phone, password, confirmPassword, company, idNumber });
        }
        if (userType === "staff") {
            // Staff: name/employeeId/dept/position are pre-filled from lookup
            Object.assign(fields, { username, email, phone, password, confirmPassword });
        }

        const errors: Record<string, string> = {};
        const allTouched: Record<string, boolean> = {};
        let hasError = false;
        for (const [key, val] of Object.entries(fields)) {
            const err = validateField(key, val);
            errors[key] = err;
            allTouched[key] = true;
            if (err) hasError = true;
        }
        setFieldErrors(errors);
        setTouched(allTouched);
        return !hasError;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (userType === "staff" && !foundStaff) {
            setError(t("errLookupFirst"));
            return;
        }
        if (!validateAll()) return;
        setLoading(true);
        try {
            const deptIndex = departments.indexOf(department);
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userType,
                    username: username.trim(),
                    email,
                    password,
                    firstName,
                    lastName,
                    phone,
                    // Visitor fields
                    ...(userType === "visitor" && { company, idNumber, idType: "thai-id" }),
                    // Staff fields
                    ...(userType === "staff" && { employeeId, departmentId: deptIndex + 1, position }),
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess(true);
                setTimeout(() => router.push("/web/dashboard"), 2000);
            } else {
                setError(json.error?.message || t("errRegisterFail"));
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

            {/* Right Side - Form */}
            <div className="flex-1 flex items-start justify-center bg-bg p-6 overflow-y-auto">
                <div className="w-full max-w-[520px] bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 my-8">
                    <div className="lg:hidden flex flex-col items-center mb-4">
                        <Image src="/images/mot_wt_logo.png" alt="MOT Logo" width={80} height={80} className="mb-2" />
                        <p className="text-xs text-text-secondary">{t("orgLine1")} {t("orgLine2")}</p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <Link href="/web" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors">
                            <ChevronLeft size={16} /> {t("backToLogin")}
                        </Link>
                        <button
                            type="button"
                            onClick={toggleLang}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary transition-all bg-gray-50"
                        >
                            <Globe size={14} />
                            {lang === "th" ? "EN" : "ไทย"}
                        </button>
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-primary mb-2">{t("title")}</h2>
                        <p className="text-text-secondary text-sm">{t("subtitle")}</p>
                    </div>

                    {success ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-success-light mx-auto flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-success" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">{t("successTitle")}</h3>
                            <p className="text-text-secondary text-sm">{t("successRolePrefix")} <span className="font-bold text-primary">{userType === "visitor" ? t("successRoleVisitor") : t("successRoleStaff")}</span></p>
                            <p className="text-text-muted text-xs">{t("successRedirect")}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* User Type Selection */}
                            <div>
                                <label className="block text-xs font-medium uppercase text-text-secondary mb-3">{t("userTypeLabel")}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { type: "visitor" as const, icon: <Users size={20} />, label: t("visitor"), sub: t("visitorSub") },
                                        { type: "staff" as const, icon: <Briefcase size={20} />, label: t("staff"), sub: t("staffSub") },
                                    ].map((opt) => (
                                        <button
                                            key={opt.type}
                                            type="button"
                                            onClick={() => setUserType(opt.type)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                                                userType === opt.type ? "border-primary bg-primary-50 shadow-sm" : "border-gray-200 hover:border-primary/30 bg-gray-50"
                                            )}
                                        >
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", userType === opt.type ? "bg-primary text-white" : "bg-gray-200 text-text-muted")}>{opt.icon}</div>
                                            <span className={cn("text-sm font-bold", userType === opt.type ? "text-primary" : "text-text-primary")}>{opt.label}</span>
                                            <span className="text-[10px] text-text-muted leading-tight">{opt.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {userType && (
                                <>
                                    {error && (
                                        <div className="bg-error-light border border-error/20 text-error text-sm rounded-xl px-4 py-3 text-center">{error}</div>
                                    )}

                                    {userType === "visitor" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label={t("firstName")} required placeholder={t("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={() => handleBlur("firstName", firstName)} error={getError("firstName")} className="h-11 bg-gray-50" />
                                                <Input label={t("lastName")} required placeholder={t("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={() => handleBlur("lastName", lastName)} error={getError("lastName")} className="h-11 bg-gray-50" />
                                            </div>
                                            <Input label={t("email")} required type="email" placeholder="your@email.com" leftIcon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email", email)} error={getError("email")} className="h-11 bg-gray-50" />
                                            <Input label={t("phone")} required placeholder={t("phonePlaceholder")} leftIcon={<Phone size={16} />} value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => handleBlur("phone", phone)} error={getError("phone")} className="h-11 bg-gray-50" />

                                            <Input label={t("company")} required placeholder={t("companyPlaceholder")} leftIcon={<Building2 size={16} />} value={company} onChange={(e) => setCompany(e.target.value)} onBlur={() => handleBlur("company", company)} error={getError("company")} className="h-11 bg-gray-50" />
                                            <Input label={t("idNumber")} required placeholder={t("idNumberPlaceholder")} leftIcon={<BadgeCheck size={16} />} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} onBlur={() => handleBlur("idNumber", idNumber)} error={getError("idNumber")} className="h-11 bg-gray-50" />

                                            <Input label={t("username")} required placeholder={t("usernamePlaceholder")} leftIcon={<UserCircle size={16} />} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} onBlur={() => handleBlur("username", username)} error={getError("username")} helperText={!getError("username") && username ? t("usernameHelper") : undefined} className="h-11 bg-gray-50" />
                                        </>
                                    )}

                                    {userType === "staff" && (
                                        <>
                                            {/* Step 1: Search by Employee ID or National ID */}
                                            <div>
                                                <label className="block text-xs font-medium uppercase text-text-secondary mb-1.5">
                                                    {t("staffSearchLabel")}<span className="text-error ml-0.5">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder={t("staffSearchPlaceholder")}
                                                        value={staffQuery}
                                                        onChange={(e) => {
                                                            setStaffQuery(e.target.value);
                                                            if (foundStaff) {
                                                                setFoundStaff(null);
                                                                setStaffHasAccount(false);
                                                                setLookupError("");
                                                                setFirstName(""); setLastName(""); setEmployeeId(""); setDepartment(""); setPosition("");
                                                            }
                                                        }}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleStaffLookup(); } }}
                                                        leftIcon={<BadgeCheck size={16} />}
                                                        className="h-11 bg-gray-50 flex-1"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleStaffLookup}
                                                        disabled={!staffQuery.trim() || isSearching}
                                                        className={cn(
                                                            "flex items-center justify-center w-12 h-11 rounded-md transition-all flex-shrink-0",
                                                            staffQuery.trim() && !isSearching
                                                                ? "bg-primary text-white shadow-md hover:bg-primary-dark active:scale-95"
                                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                                    </button>
                                                </div>
                                                {lookupError && <p className="text-xs text-error mt-1.5">{lookupError}</p>}
                                            </div>

                                            {/* Step 2: Show found personnel — already has account */}
                                            {foundStaff && staffHasAccount && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
                                                    <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center">
                                                        <BadgeCheck size={24} className="text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-primary">{foundStaff.firstName} {foundStaff.lastName}</p>
                                                        <p className="text-xs text-text-secondary mt-0.5">{foundStaff.position} — {foundStaff.departmentName}</p>
                                                    </div>
                                                    <p className="text-sm text-amber-700 font-medium">{t("staffHasAccount")}</p>
                                                    <Link href="/web" className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow">
                                                        {t("login")}
                                                    </Link>
                                                </div>
                                            )}

                                            {/* Step 2: Show found personnel — no account yet */}
                                            {foundStaff && !staffHasAccount && (
                                                <>
                                                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Check size={16} className="text-success" />
                                                            <span className="text-sm font-bold text-success">{t("staffFound")}</span>
                                                        </div>
                                                        <div className="text-sm space-y-1.5">
                                                            <div className="flex gap-2">
                                                                <span className="text-text-muted min-w-[80px]">{t("staffName")}</span>
                                                                <span className="font-medium text-text-primary">{foundStaff.firstName} {foundStaff.lastName}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-text-muted min-w-[80px]">{t("staffPosition")}</span>
                                                                <span className="font-medium text-text-primary">{foundStaff.position}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-text-muted min-w-[80px]">{t("staffDept")}</span>
                                                                <span className="font-medium text-text-primary">{foundStaff.departmentName}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-text-muted min-w-[80px]">{t("staffCode")}</span>
                                                                <span className="font-medium text-text-primary">{foundStaff.employeeId}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step 3: Fill username, email, phone, password */}
                                                    <Input label={t("username")} required placeholder={t("usernamePlaceholder")} leftIcon={<UserCircle size={16} />} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} onBlur={() => handleBlur("username", username)} error={getError("username")} helperText={!getError("username") && username ? t("usernameHelper") : undefined} className="h-11 bg-gray-50" />
                                                    <Input label={t("email")} required type="email" placeholder="your@email.com" leftIcon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email", email)} error={getError("email")} className="h-11 bg-gray-50" />
                                                    <Input label={t("phone")} required placeholder={t("phonePlaceholder")} leftIcon={<Phone size={16} />} value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => handleBlur("phone", phone)} error={getError("phone")} className="h-11 bg-gray-50" />
                                                    <Input label={t("password")} required type={showPassword ? "text" : "password"} placeholder={t("passwordPlaceholder")} leftIcon={<Lock size={16} />} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password", password)} error={getError("password")} className="h-11 bg-gray-50" />
                                                    <Input label={t("confirmPassword")} required type={showConfirm ? "text" : "password"} placeholder={t("confirmPasswordPlaceholder")} leftIcon={<Lock size={16} />} rightIcon={<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-text-muted hover:text-text-primary">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => handleBlur("confirmPassword", confirmPassword)} error={getError("confirmPassword")} className="h-11 bg-gray-50" />

                                                    <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">{t("submitBtn")}</Button>

                                                    <p className="text-[11px] text-text-muted text-center bg-gray-50 rounded-lg px-3 py-2" dangerouslySetInnerHTML={{ __html: t("roleNoteStaff") }} />
                                                </>
                                            )}
                                        </>
                                    )}

                                    {userType === "visitor" && (
                                        <>
                                            <Input label={t("password")} required type={showPassword ? "text" : "password"} placeholder={t("passwordPlaceholder")} leftIcon={<Lock size={16} />} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password", password)} error={getError("password")} className="h-11 bg-gray-50" />
                                            <Input label={t("confirmPassword")} required type={showConfirm ? "text" : "password"} placeholder={t("confirmPasswordPlaceholder")} leftIcon={<Lock size={16} />} rightIcon={<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-text-muted hover:text-text-primary">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => handleBlur("confirmPassword", confirmPassword)} error={getError("confirmPassword")} className="h-11 bg-gray-50" />

                                            <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">{t("submitBtn")}</Button>

                                            <p className="text-[11px] text-text-muted text-center bg-gray-50 rounded-lg px-3 py-2" dangerouslySetInnerHTML={{ __html: t("roleNoteVisitor") }} />
                                        </>
                                    )}
                                </>
                            )}

                            <div className="text-center text-sm text-text-secondary pt-4 border-t border-gray-100">
                                {t("hasAccount")}{" "}
                                <Link href="/web" className="text-primary font-bold hover:text-primary-dark hover:underline">{t("login")}</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
