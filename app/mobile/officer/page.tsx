"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Bell, Shield, ClipboardList, UserCheck, Users, Clock, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function OfficerDashboard() {
    return (
        <div className="min-h-full bg-bg pb-20">
            {/* Header */}
            <header className="bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white p-6 pb-14 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-[40px]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-300/20 rounded-full blur-[30px]"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-white/60 font-medium">eVMES MOT • พนักงาน</p>
                            <h1 className="text-lg font-bold">คุณสมศรี รักษ์ดี</h1>
                        </div>
                    </div>
                    <button className="relative p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                        <Bell size={22} />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-primary"></span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 relative z-10">
                    <StatBox count={3} label="รอดำเนินการ" icon={<Clock size={16} />} color="warning" />
                    <StatBox count={5} label="เข้าพบวันนี้" icon={<Users size={16} />} color="success" />
                    <StatBox count={12} label="เดือนนี้" icon={<UserCheck size={16} />} color="info" />
                </div>
            </header>

            <div className="px-5 -mt-4 relative z-10 space-y-5">
                {/* Pending Alert */}
                <Card className="bg-white border-none shadow-lg overflow-hidden rounded-2xl">
                    <div className="h-1.5 bg-gradient-to-r from-warning to-accent w-full"></div>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                                <AlertCircle size={20} className="text-warning" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-text-primary">คำขอรอดำเนินการ</h3>
                                <p className="text-xs text-text-secondary">มี 3 รายการที่รอการอนุมัติ</p>
                            </div>
                            <Badge variant="pending" className="text-xs">3</Badge>
                        </div>
                        <Link href="/mobile/officer/requests">
                            <button className="w-full h-11 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1 hover:bg-primary-dark transition-colors">
                                ดูรายการคำขอ
                                <ChevronRight size={16} />
                            </button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Requests */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-bold text-text-primary">คำขอล่าสุด</h3>
                        <Link href="/mobile/officer/requests" className="text-xs text-primary font-bold hover:underline">
                            ดูทั้งหมด
                        </Link>
                    </div>
                    <div className="space-y-3">
                        <RequestPreviewCard
                            name="นายสมศักดิ์ จริงใจ"
                            company="บริษัท ABC จำกัด"
                            type="ติดต่อราชการ"
                            date="20 ก.พ. 2569"
                            time="10:00 - 11:00"
                            status="pending"
                            id="1"
                        />
                        <RequestPreviewCard
                            name="นางสาวมาลี งามจิต"
                            company="บริษัท XYZ จำกัด"
                            type="ประชุม"
                            date="20 ก.พ. 2569"
                            time="13:00 - 14:00"
                            status="pending"
                            id="2"
                        />
                        <RequestPreviewCard
                            name="นายสุชาติ ปรีชา"
                            company="หจก. สมาร์ท เซอร์วิส"
                            type="ผู้รับเหมา"
                            date="21 ก.พ. 2569"
                            time="09:00 - 17:00"
                            status="pending"
                            id="3"
                        />
                    </div>
                </div>

                {/* Today's Visitors */}
                <div>
                    <h3 className="text-base font-bold text-text-primary mb-3">ผู้เข้าพบวันนี้</h3>
                    <div className="space-y-3">
                        <RequestPreviewCard
                            name="นายธนพงศ์ สุขใจ"
                            company="บริษัท เทคโน จำกัด"
                            type="ติดต่อราชการ"
                            date="19 ก.พ. 2569"
                            time="09:00 - 10:00"
                            status="checkedin"
                            id="4"
                        />
                        <RequestPreviewCard
                            name="นางวันดี สว่างจิต"
                            company="บริษัท พรีเมียร์ จำกัด"
                            type="ประชุม"
                            date="19 ก.พ. 2569"
                            time="10:00 - 12:00"
                            status="approved"
                            id="5"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ count, label, icon, color }: { count: number; label: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <div className="flex items-center justify-center gap-1 mb-1 text-white/70">
                {icon}
            </div>
            <p className="text-2xl font-extrabold text-white">{count}</p>
            <p className="text-[10px] text-white/60 font-medium">{label}</p>
        </div>
    );
}

function RequestPreviewCard({ name, company, type, date, time, status, id }: {
    name: string; company: string; type: string; date: string; time: string; status: string; id: string;
}) {
    const statusMap: Record<string, { label: string; variant: string }> = {
        pending: { label: "รอดำเนินการ", variant: "pending" },
        approved: { label: "อนุมัติ", variant: "approved" },
        checkedin: { label: "เข้าพบแล้ว", variant: "checkedin" },
        rejected: { label: "ปฏิเสธ", variant: "rejected" },
    };
    const s = statusMap[status] || statusMap.pending;

    return (
        <Link href={`/mobile/officer/requests/${id}`}>
            <Card className="p-4 active:scale-[0.99] transition-transform hover:shadow-md">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h4 className="font-bold text-sm text-text-primary truncate">{name}</h4>
                                <p className="text-xs text-text-secondary truncate">{company}</p>
                            </div>
                            <Badge variant={s.variant as any} className="text-[10px] h-5 px-2 shrink-0">{s.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                            <span>{type}</span>
                            <span>•</span>
                            <span>{date}</span>
                            <span>•</span>
                            <span>{time}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
