"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink, Shield } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-full bg-bg pb-20">
            {/* Header */}
            <header className="bg-gradient-to-br from-[#06C755] via-[#06C755] to-[#04A847] text-white p-6 pb-14 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-[30px]"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-white/60 font-medium">eVMES MOT • LINE OA</p>
                            <h1 className="text-lg font-bold">ติดต่อเรา</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-5 -mt-6 relative z-10 space-y-4">
                {/* Organization Info */}
                <Card className="bg-white border-none shadow-lg overflow-hidden rounded-2xl">
                    <div className="h-1.5 bg-gradient-to-r from-[#06C755] to-[#04A847] w-full"></div>
                    <CardContent className="p-5">
                        <h2 className="text-base font-bold text-text-primary mb-1">กระทรวงการท่องเที่ยวและกีฬา</h2>
                        <p className="text-xs text-text-secondary mb-5">Ministry of Tourism and Sports</p>

                        <div className="space-y-4">
                            <ContactRow
                                icon={<MapPin size={18} />}
                                label="ที่อยู่"
                                value="4 ถนนราชดำเนินนอก แขวงวัดโสมนัส เขตป้อมปราบศัตรูพ่าย กรุงเทพฯ 10100"
                            />
                            <ContactRow
                                icon={<Phone size={18} />}
                                label="เบอร์โทรศัพท์"
                                value="02-283-1500"
                                action
                            />
                            <ContactRow
                                icon={<Mail size={18} />}
                                label="อีเมล"
                                value="webmaster@mots.go.th"
                                action
                            />
                            <ContactRow
                                icon={<Clock size={18} />}
                                label="เวลาทำการ"
                                value="จันทร์ - ศุกร์ 08:30 - 16:30 น."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* LINE OA Card */}
                <Card className="bg-gradient-to-br from-[#06C755] to-[#04A847] border-none shadow-lg rounded-2xl overflow-hidden">
                    <CardContent className="p-5 text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">LINE Official Account</h3>
                                <p className="text-white/70 text-sm">@eVMES-MOTS</p>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm mb-4">
                            ติดต่อสอบถาม แจ้งปัญหา หรือรับแจ้งเตือนผ่าน LINE
                        </p>
                        <button className="w-full py-3 bg-white text-[#06C755] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-md">
                            <ExternalLink size={16} />
                            เพิ่มเพื่อน LINE OA
                        </button>
                    </CardContent>
                </Card>

                {/* Help Section */}
                <Card className="bg-white border-none shadow-md rounded-2xl">
                    <CardContent className="p-5">
                        <h3 className="text-sm font-bold text-text-primary mb-3">คำถามที่พบบ่อย</h3>
                        <div className="space-y-3">
                            <FaqItem q="ลืมรหัสผ่านทำอย่างไร?" a="กดปุ่ม 'ลืมรหัสผ่าน' ที่หน้าล็อกอิน ระบบจะส่งลิงก์ตั้งค่าใหม่ทางอีเมล" />
                            <FaqItem q="เปลี่ยนนัดหมายได้ไหม?" a="สามารถแก้ไขนัดหมายได้ก่อนเจ้าหน้าที่อนุมัติ โดยไปที่ประวัติ → แก้ไข" />
                            <FaqItem q="QR Code หมดอายุเมื่อไหร่?" a="QR Code จะใช้ได้ในวันที่นัดหมาย และจะหมดอายุหลัง Check-out" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ContactRow({ icon, label, value, action }: { icon: React.ReactNode; label: string; value: string; action?: boolean }) {
    return (
        <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 rounded-xl bg-[#06C755]/10 flex items-center justify-center text-[#06C755] mt-0.5 shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-muted font-medium">{label}</p>
                <p className={`text-sm font-semibold ${action ? "text-[#06C755]" : "text-text-primary"} leading-relaxed`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    return (
        <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-sm font-bold text-text-primary mb-1">{q}</p>
            <p className="text-xs text-text-secondary leading-relaxed">{a}</p>
        </div>
    );
}
