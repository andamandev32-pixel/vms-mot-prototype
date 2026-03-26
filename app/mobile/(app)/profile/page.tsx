"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { User, Mail, Phone, Building2, Edit3, ChevronRight, Shield, LogOut, MessageCircle, Unlink, RefreshCw, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const [lineAccount, setLineAccount] = useState<{
        userId: string;
        displayName: string;
        linkedAt: string;
    } | null>({
        userId: "U1234567890",
        displayName: "somchai_jaidee",
        linkedAt: "15 ม.ค. 2569",
    });

    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
    const [showLinkConfirm, setShowLinkConfirm] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToastMsg = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleLinkLine = () => {
        // Simulate LIFF/LINE Login redirect
        setShowLinkConfirm(false);
        setLineAccount({
            userId: "U" + Math.random().toString(36).slice(2, 12),
            displayName: "LINE User " + Math.floor(Math.random() * 1000),
            linkedAt: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
        });
        showToastMsg("ผูกบัญชี LINE สำเร็จ");
    };

    const handleUnlinkLine = () => {
        setShowUnlinkConfirm(false);
        setLineAccount(null);
        showToastMsg("ยกเลิกการผูก LINE สำเร็จ");
    };

    const handleChangeLine = () => {
        // Simulate changing to a new LINE account
        setLineAccount({
            userId: "U" + Math.random().toString(36).slice(2, 12),
            displayName: "LINE User " + Math.floor(Math.random() * 1000),
            linkedAt: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
        });
        showToastMsg("เปลี่ยนบัญชี LINE สำเร็จ");
    };

    const profile = {
        name: "คุณพุทธิพงษ์ คาดสนิท",
        email: "somchai@email.com",
        phone: "081-234-5678",
        company: "บริษัท ABC จำกัด",
        registeredDate: "15 ม.ค. 2569",
    };

    return (
        <div className="min-h-full bg-bg pb-20">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#06C755] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            {/* Header */}
            <header className="bg-gradient-to-br from-[#06C755] via-[#06C755] to-[#04A847] text-white p-6 pb-16 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-[30px]"></div>

                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20 shadow-lg">
                        <User size={40} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold">{profile.name}</h1>
                    <p className="text-white/70 text-sm mt-1">ผู้มาติดต่อ</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                        <p className="text-white/50 text-xs">สมาชิกตั้งแต่ {profile.registeredDate}</p>
                        <div className="w-2 h-2 rounded-full bg-white/50"></div>
                    </div>
                </div>
            </header>

            <div className="px-5 -mt-8 relative z-10 space-y-4">
                {/* Profile Info Card */}
                <Card className="bg-white border-none shadow-lg overflow-hidden rounded-2xl">
                    <div className="h-1.5 bg-gradient-to-r from-[#06C755] to-[#04A847] w-full"></div>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-text-primary">ข้อมูลส่วนตัว</h2>
                            <button className="flex items-center gap-1 text-xs text-[#06C755] font-bold">
                                <Edit3 size={14} />
                                แก้ไข
                            </button>
                        </div>

                        <div className="space-y-4">
                            <ProfileRow icon={<User size={18} />} label="ชื่อ-นามสกุล" value={profile.name} />
                            <ProfileRow icon={<Mail size={18} />} label="อีเมล" value={profile.email} />
                            <ProfileRow icon={<Phone size={18} />} label="เบอร์โทรศัพท์" value={profile.phone} />
                            <ProfileRow icon={<Building2 size={18} />} label="บริษัท / หน่วยงาน" value={profile.company} />
                        </div>
                    </CardContent>
                </Card>

                {/* LINE Connection Card */}
                <Card className="bg-white border-none shadow-md rounded-2xl overflow-hidden">
                    {lineAccount ? (
                        /* ===== LINE ผูกแล้ว ===== */
                        <>
                            <div className="h-1 bg-[#06C755] w-full"></div>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-[#06C755]/10 flex items-center justify-center">
                                        <MessageCircle size={22} className="text-[#06C755]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                            LINE เชื่อมต่อแล้ว
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#06C755] shadow-md shadow-[#06C755]/30"></div>
                                        </h3>
                                        <p className="text-xs text-text-secondary">@{lineAccount.displayName}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-text-muted space-y-1">
                                    <p>ผูกเมื่อ: {lineAccount.linkedAt}</p>
                                    <p>รับการแจ้งเตือนนัดหมาย, สถานะอนุมัติ, และ Visit Slip ผ่าน LINE</p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleChangeLine}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-[#06C755] bg-[#06C755]/5 rounded-xl border border-[#06C755]/20 hover:bg-[#06C755]/10 transition-colors active:scale-[0.98]"
                                    >
                                        <RefreshCw size={14} /> เปลี่ยนบัญชี LINE
                                    </button>
                                    <button
                                        onClick={() => setShowUnlinkConfirm(true)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-error bg-error/5 rounded-xl border border-error/20 hover:bg-error/10 transition-colors active:scale-[0.98]"
                                    >
                                        <Unlink size={14} /> ยกเลิกการผูก
                                    </button>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        /* ===== LINE ยังไม่ผูก ===== */
                        <>
                            <div className="h-1 bg-gray-200 w-full"></div>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <MessageCircle size={22} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-text-primary">LINE ยังไม่ได้เชื่อมต่อ</h3>
                                        <p className="text-xs text-text-muted">ผูกบัญชี LINE เพื่อรับการแจ้งเตือน</p>
                                    </div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                </div>

                                <div className="bg-[#06C755]/5 border border-[#06C755]/15 rounded-xl p-3 mb-4 text-xs text-[#06C755] space-y-1">
                                    <p className="font-bold">ผูกบัญชี LINE เพื่อ:</p>
                                    <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                                        <li>รับแจ้งเตือนนัดหมาย & สถานะอนุมัติ</li>
                                        <li>รับ Visit Slip ผ่าน LINE (ไม่ต้องพิมพ์กระดาษ)</li>
                                        <li>Check-in ผ่าน LINE ได้สะดวก</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => setShowLinkConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-[#06C755] rounded-xl shadow-md shadow-[#06C755]/20 hover:bg-[#04A847] transition-colors active:scale-[0.98]"
                                >
                                    <MessageCircle size={18} /> ผูกบัญชี LINE
                                </button>
                            </CardContent>
                        </>
                    )}
                </Card>

                {/* Quick Links */}
                <div className="space-y-2">
                    <QuickLink href="/mobile/history" label="ประวัติการเยือน" desc="ดูประวัติการเข้าพบทั้งหมด" />
                    <QuickLink href="/mobile/booking" label="จองนัดหมาย" desc="สร้างการนัดหมายใหม่" />
                </div>

                {/* Logout */}
                <Link href="/mobile">
                    <button className="w-full flex items-center justify-center gap-2 py-4 text-sm text-error font-bold rounded-2xl bg-error/5 hover:bg-error/10 transition-colors mt-2">
                        <LogOut size={18} />
                        ออกจากระบบ
                    </button>
                </Link>
            </div>

            {/* ===== Unlink LINE Confirm Modal ===== */}
            {showUnlinkConfirm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowUnlinkConfirm(false); }}>
                    <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5"></div>
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <Unlink size={24} className="text-error" />
                            </div>
                        </div>
                        <h3 className="text-center text-lg font-bold text-text-primary mb-1">ยกเลิกการผูก LINE</h3>
                        <p className="text-center text-sm text-text-secondary mb-4">คุณแน่ใจหรือไม่?</p>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-xs text-red-700 flex items-start gap-2">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p>หลังยกเลิกการผูก LINE คุณจะ:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>ไม่ได้รับการแจ้งเตือนผ่าน LINE</li>
                                    <li>ไม่ได้รับ Visit Slip ผ่าน LINE</li>
                                    <li>ต้องผูกใหม่ด้วยตัวเองหากต้องการใช้งาน</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowUnlinkConfirm(false)} className="flex-1 py-3 text-sm font-bold text-text-secondary bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleUnlinkLine} className="flex-1 py-3 text-sm font-bold text-white bg-error rounded-xl hover:bg-error/90 transition-colors">
                                ยืนยันยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Link LINE Confirm Modal ===== */}
            {showLinkConfirm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowLinkConfirm(false); }}>
                    <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5"></div>
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                                <MessageCircle size={24} className="text-[#06C755]" />
                            </div>
                        </div>
                        <h3 className="text-center text-lg font-bold text-text-primary mb-1">ผูกบัญชี LINE</h3>
                        <p className="text-center text-sm text-text-secondary mb-4">เชื่อมต่อกับ LINE Official Account eVMS</p>

                        <div className="bg-[#06C755]/5 border border-[#06C755]/15 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#06C755] flex items-center justify-center shadow-md shadow-[#06C755]/20">
                                    <MessageCircle size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">eVMS กระทรวงการท่องเที่ยวฯ</p>
                                    <p className="text-xs text-text-muted">LINE Official Account</p>
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary">ระบบจะนำคุณไปยังหน้า LINE Login เพื่อยืนยันตัวตนและอนุญาตให้ eVMS เข้าถึงโปรไฟล์ LINE ของคุณ</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowLinkConfirm(false)} className="flex-1 py-3 text-sm font-bold text-text-secondary bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleLinkLine} className="flex-1 py-3 text-sm font-bold text-white bg-[#06C755] rounded-xl shadow-md shadow-[#06C755]/20 hover:bg-[#04A847] transition-colors">
                                เชื่อมต่อ LINE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-muted font-medium">{label}</p>
                <p className="text-sm font-semibold text-text-primary truncate">{value}</p>
            </div>
        </div>
    );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
    return (
        <Link href={href}>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-text-primary">{label}</h3>
                    <p className="text-xs text-text-secondary">{desc}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
            </div>
        </Link>
    );
}
