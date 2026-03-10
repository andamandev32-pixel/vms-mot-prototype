"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Shield, Bell, UtensilsCrossed, Coffee, GlassWater, ChevronRight, Check, Clock, Users } from "lucide-react";

export default function HospitalityPage() {
    return (
        <div className="min-h-full bg-bg pb-20">
            {/* Header */}
            <header className="bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white p-6 pb-14 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-[40px]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-300/20 rounded-full blur-[30px]"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-white/60 font-medium">eVMES MOT • พนักงาน</p>
                                <h1 className="text-lg font-bold">จัดเตรียมรับรอง</h1>
                            </div>
                        </div>
                        <button className="relative p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                            <Bell size={22} />
                        </button>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                            <p className="text-2xl font-extrabold text-white">3</p>
                            <p className="text-[10px] text-white/60 font-medium">รอจัดเตรียม</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                            <p className="text-2xl font-extrabold text-white">2</p>
                            <p className="text-[10px] text-white/60 font-medium">เตรียมเสร็จ</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                            <p className="text-2xl font-extrabold text-white">5</p>
                            <p className="text-[10px] text-white/60 font-medium">ทั้งหมดวันนี้</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-5 -mt-4 relative z-10 space-y-4">
                {/* Pending Preparations */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-text-primary">รายการรอจัดเตรียม</h2>
                        <Badge variant="pending" className="text-xs">3 รายการ</Badge>
                    </div>
                    <div className="space-y-3">
                        <HospitalityCard
                            visitor="นายสมศักดิ์ จริงใจ"
                            company="บริษัท ABC จำกัด"
                            time="10:00 - 11:00"
                            room="ห้องประชุม A ชั้น 3"
                            items={["น้ำดื่ม 5 แก้ว", "กาแฟ 2 ชุด"]}
                            status="pending"
                            guests={3}
                        />
                        <HospitalityCard
                            visitor="นางสาวมาลี งามจิต"
                            company="บริษัท XYZ จำกัด"
                            time="13:00 - 14:00"
                            room="ห้องประชุม B ชั้น 5"
                            items={["น้ำดื่ม 10 แก้ว", "ชุดอาหารว่าง 10 ชุด", "กาแฟ 5 ชุด"]}
                            status="pending"
                            guests={8}
                        />
                        <HospitalityCard
                            visitor="นายสุชาติ ปรีชา"
                            company="หจก. สมาร์ท เซอร์วิส"
                            time="15:00 - 16:00"
                            room="ห้องรับรอง VIP"
                            items={["น้ำดื่ม 3 แก้ว", "ชา/กาแฟ 3 ชุด"]}
                            status="pending"
                            guests={2}
                        />
                    </div>
                </div>

                {/* Completed */}
                <div>
                    <h2 className="text-base font-bold text-text-primary mb-3">เตรียมเสร็จแล้ว</h2>
                    <div className="space-y-3">
                        <HospitalityCard
                            visitor="นายธนพงศ์ สุขใจ"
                            company="บริษัท เทคโน จำกัด"
                            time="09:00 - 10:00"
                            room="ห้องประชุม C ชั้น 2"
                            items={["น้ำดื่ม 4 แก้ว"]}
                            status="done"
                            guests={2}
                        />
                        <HospitalityCard
                            visitor="นางวันดี สว่างจิต"
                            company="บริษัท พรีเมียร์ จำกัด"
                            time="10:00 - 12:00"
                            room="ห้องประชุม D ชั้น 4"
                            items={["น้ำดื่ม 8 แก้ว", "อาหารว่าง 8 ชุด", "กาแฟ 4 ชุด"]}
                            status="done"
                            guests={6}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function HospitalityCard({
    visitor,
    company,
    time,
    room,
    items,
    status,
    guests,
}: {
    visitor: string;
    company: string;
    time: string;
    room: string;
    items: string[];
    status: "pending" | "done";
    guests: number;
}) {
    const isPending = status === "pending";

    return (
        <Card className={`overflow-hidden rounded-2xl border-none shadow-md ${isPending ? "bg-white" : "bg-white/80"}`}>
            <div className={`h-1 ${isPending ? "bg-gradient-to-r from-warning to-accent" : "bg-gradient-to-r from-success to-success/60"}`}></div>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isPending ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>
                            {visitor.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-text-primary">{visitor}</h3>
                            <p className="text-xs text-text-secondary">{company}</p>
                        </div>
                    </div>
                    <Badge variant={isPending ? "pending" : "approved"} className="text-[10px] h-5 px-2">
                        {isPending ? "รอจัดเตรียม" : "เสร็จแล้ว"}
                    </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {time}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {guests} คน</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-text-secondary mb-1">📍 {room}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {items.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-white rounded-lg px-2.5 py-1.5 text-text-primary font-medium border border-gray-100">
                                {item.includes("กาแฟ") ? <Coffee size={12} className="text-amber-500" /> :
                                    item.includes("น้ำ") ? <GlassWater size={12} className="text-blue-500" /> :
                                        <UtensilsCrossed size={12} className="text-orange-500" />}
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {isPending && (
                    <button className="w-full h-10 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1 hover:bg-primary-dark transition-colors">
                        <Check size={16} />
                        เตรียมเสร็จแล้ว
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
