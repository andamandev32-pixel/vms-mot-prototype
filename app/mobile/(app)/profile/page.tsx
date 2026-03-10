"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { User, Mail, Phone, Building2, Edit3, ChevronRight, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ProfilePage() {
    const profile = {
        name: "คุณพุทธิพงษ์ คาดสนิท",
        email: "somchai@email.com",
        phone: "081-234-5678",
        company: "บริษัท ABC จำกัด",
        lineId: "somchai_jaidee",
        registeredDate: "15 ม.ค. 2569",
    };

    return (
        <div className="min-h-full bg-bg pb-20">
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

                {/* LINE Connection */}
                <Card className="bg-white border-none shadow-md rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[#06C755]/10 flex items-center justify-center">
                                <Shield size={22} className="text-[#06C755]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-text-primary">LINE เชื่อมต่อแล้ว</h3>
                                <p className="text-xs text-text-secondary">@{profile.lineId}</p>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-[#06C755] shadow-md shadow-[#06C755]/30"></div>
                        </div>
                    </CardContent>
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
