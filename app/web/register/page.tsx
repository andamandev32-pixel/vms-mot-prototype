"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Eye, EyeOff, Users, Briefcase, Phone, Building2, BadgeCheck, ChevronLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VmsLogo from "@/components/ui/VmsLogo";
import { cn } from "@/lib/utils";

type UserType = "visitor" | "staff" | null;

const departments = [
    "สำนักงานปลัดกระทรวง", "กองกลาง", "กองการต่างประเทศ", "กองกิจการท่องเที่ยว",
    "กรมการท่องเที่ยว", "กรมพลศึกษา", "การกีฬาแห่งประเทศไทย", "สำนักนโยบายและแผน",
    "สำนักงานรัฐมนตรี", "การท่องเที่ยวแห่งประเทศไทย", "มหาวิทยาลัยการกีฬาแห่งชาติ",
    "กองบัญชาการตำรวจท่องเที่ยว", "อพท.",
];

export default function RegisterPage() {
    const router = useRouter();
    const [userType, setUserType] = useState<UserType>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("รูปแบบอีเมลไม่ถูกต้อง");
            return;
        }
        if (password.length < 8) {
            setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
            return;
        }
        if (password !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            return;
        }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1500));
        setLoading(false);
        setSuccess(true);
        setTimeout(() => router.push("/web"), 2000);
    };

    return (
        <div className="flex min-h-screen web-theme">
            {/* Left Side - Purple Gradient */}
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

            {/* Right Side - Form */}
            <div className="flex-1 flex items-start justify-center bg-bg p-6 overflow-y-auto">
                <div className="w-full max-w-[520px] bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 my-8">
                    <div className="lg:hidden flex justify-center mb-4"><VmsLogo size={48} /></div>

                    <Link href="/web" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
                        <ChevronLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
                    </Link>

                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-primary mb-2">สมัครสมาชิก</h2>
                        <p className="text-text-secondary text-sm">เลือกประเภทผู้ใช้งานและกรอกข้อมูล</p>
                    </div>

                    {success ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-success-light mx-auto flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-success" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">สมัครสมาชิกสำเร็จ!</h3>
                            <p className="text-text-secondary text-sm">สิทธิ์เริ่มต้นของคุณคือ <span className="font-bold text-primary">{userType === "visitor" ? "ผู้มาติดต่อ (Visitor)" : "เจ้าหน้าที่ (Staff)"}</span></p>
                            <p className="text-text-muted text-xs">กำลังไปหน้าเข้าสู่ระบบ...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* User Type Selection */}
                            <div>
                                <label className="block text-xs font-medium uppercase text-text-secondary mb-3">ประเภทผู้ใช้งาน</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { type: "visitor" as const, icon: <Users size={20} />, label: "ผู้มาติดต่อ", sub: "Visitor — จองนัดหมาย, ดู QR" },
                                        { type: "staff" as const, icon: <Briefcase size={20} />, label: "เจ้าหน้าที่", sub: "Staff — สร้างนัดหมาย, อนุมัติ" },
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="ชื่อ" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11 bg-gray-50" />
                                        <Input label="นามสกุล" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 bg-gray-50" />
                                    </div>
                                    <Input label="อีเมล" type="email" placeholder="your@email.com" leftIcon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-gray-50" />
                                    <Input label="เบอร์โทรศัพท์" placeholder="0XX-XXX-XXXX" leftIcon={<Phone size={16} />} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 bg-gray-50" />

                                    {userType === "visitor" && (
                                        <>
                                            <Input label="บริษัท / หน่วยงาน" placeholder="ชื่อบริษัท" leftIcon={<Building2 size={16} />} value={company} onChange={(e) => setCompany(e.target.value)} className="h-11 bg-gray-50" />
                                            <Input label="เลขบัตรประชาชน / Passport" placeholder="เลข 13 หลัก หรือ Passport" leftIcon={<BadgeCheck size={16} />} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="h-11 bg-gray-50" />
                                        </>
                                    )}

                                    {userType === "staff" && (
                                        <>
                                            <Input label="รหัสพนักงาน" placeholder="เช่น EMP-001" leftIcon={<BadgeCheck size={16} />} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-11 bg-gray-50" />
                                            <div>
                                                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">แผนก</label>
                                                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="flex h-11 w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                                    <option value="">-- เลือกแผนก --</option>
                                                    {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <Input label="ตำแหน่ง" placeholder="เช่น นักวิเคราะห์นโยบาย" value={position} onChange={(e) => setPosition(e.target.value)} className="h-11 bg-gray-50" />
                                        </>
                                    )}

                                    <Input label="รหัสผ่าน" type={showPassword ? "text" : "password"} placeholder="อย่างน้อย 8 ตัวอักษร" leftIcon={<Lock size={16} />} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-muted hover:text-text-primary">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-gray-50" />
                                    <Input label="ยืนยันรหัสผ่าน" type={showConfirm ? "text" : "password"} placeholder="กรอกรหัสผ่านอีกครั้ง" leftIcon={<Lock size={16} />} rightIcon={<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-text-muted hover:text-text-primary">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 bg-gray-50" error={confirmPassword && password !== confirmPassword ? "รหัสผ่านไม่ตรงกัน" : undefined} />

                                    <Button type="submit" fullWidth size="lg" loading={loading} className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">สมัครสมาชิก</Button>

                                    <p className="text-[11px] text-text-muted text-center bg-gray-50 rounded-lg px-3 py-2">
                                        สิทธิ์เริ่มต้นคือ <strong>{userType === "visitor" ? "ผู้มาติดต่อ (Visitor)" : "เจ้าหน้าที่ (Staff)"}</strong> — หากต้องการเปลี่ยนสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ
                                    </p>
                                </>
                            )}

                            <div className="text-center text-sm text-text-secondary pt-4 border-t border-gray-100">
                                มีบัญชีแล้ว?{" "}
                                <Link href="/web" className="text-primary font-bold hover:text-primary-dark hover:underline">เข้าสู่ระบบ</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
