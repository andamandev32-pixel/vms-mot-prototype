"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Shield, Bell, Search, Calendar, Filter, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type FilterType = "all" | "approved" | "checkedin" | "checkout" | "rejected";

const historyData = [
    { id: "1", name: "นายธนพงศ์ สุขใจ", company: "บริษัท เทคโน จำกัด", type: "ติดต่อราชการ", date: "19 ก.พ. 2569", time: "09:00 - 10:00", status: "checkout" },
    { id: "2", name: "นางวันดี สว่างจิต", company: "บริษัท พรีเมียร์ จำกัด", type: "ประชุม", date: "19 ก.พ. 2569", time: "10:00 - 12:00", status: "checkedin" },
    { id: "3", name: "นายสมศักดิ์ จริงใจ", company: "บริษัท ABC จำกัด", type: "ติดต่อราชการ", date: "18 ก.พ. 2569", time: "10:00 - 11:00", status: "checkout" },
    { id: "4", name: "นางสาวมาลี งามจิต", company: "บริษัท XYZ จำกัด", type: "ประชุม", date: "18 ก.พ. 2569", time: "13:00 - 14:00", status: "approved" },
    { id: "5", name: "นายสุชาติ ปรีชา", company: "หจก. สมาร์ท เซอร์วิส", type: "ผู้รับเหมา", date: "17 ก.พ. 2569", time: "09:00 - 17:00", status: "checkout" },
    { id: "6", name: "นายชัยวัฒน์ มั่นคง", company: "บริษัท ไอที โซลูชั่น", type: "ติดต่อราชการ", date: "17 ก.พ. 2569", time: "14:00 - 15:00", status: "rejected" },
    { id: "7", name: "นางสุภาพร ดีงาม", company: "สำนักงานตรวจเงินแผ่นดิน", type: "ประชุม", date: "16 ก.พ. 2569", time: "09:00 - 12:00", status: "checkout" },
    { id: "8", name: "นายวิทยา ฉลาดดี", company: "มหาวิทยาลัยธรรมศาสตร์", type: "รับ-ส่งเอกสาร", date: "16 ก.พ. 2569", time: "13:00 - 13:30", status: "checkout" },
];

const statusMap: Record<string, { label: string; variant: string }> = {
    approved: { label: "อนุมัติ", variant: "approved" },
    checkedin: { label: "เข้าพบแล้ว", variant: "checkedin" },
    checkout: { label: "เสร็จสิ้น", variant: "checkout" },
    rejected: { label: "ปฏิเสธ", variant: "rejected" },
};

const filterTabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "checkedin", label: "เข้าพบ" },
    { key: "checkout", label: "เสร็จสิ้น" },
    { key: "approved", label: "อนุมัติ" },
    { key: "rejected", label: "ปฏิเสธ" },
];

export default function OfficerHistoryPage() {
    const [filter, setFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");

    const filtered = historyData.filter(item => {
        const matchFilter = filter === "all" || item.status === filter;
        const matchSearch = search === "" || item.name.includes(search) || item.company.includes(search);
        return matchFilter && matchSearch;
    });

    return (
        <div className="min-h-full bg-bg pb-20">
            {/* Header */}
            <header className="bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-[40px]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-300/20 rounded-full blur-[30px]"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-white/60 font-medium">eVMES MOT • พนักงาน</p>
                                <h1 className="text-lg font-bold">ประวัติทั้งหมด</h1>
                            </div>
                        </div>
                        <button className="relative p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                            <Bell size={22} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, บริษัท..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15 focus:border-white/30 transition-colors backdrop-blur-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="px-5 -mt-2 relative z-10 space-y-4">
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                                filter === tab.key
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-white text-text-secondary border border-gray-200 hover:border-primary/30"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">
                        <span className="font-bold text-text-primary">{filtered.length}</span> รายการ
                    </p>
                    <button className="flex items-center gap-1 text-xs text-primary font-bold">
                        <Filter size={14} />
                        กรองเพิ่มเติม
                    </button>
                </div>

                {/* History List */}
                <div className="space-y-3">
                    {filtered.map(item => {
                        const s = statusMap[item.status];
                        return (
                            <Link key={item.id} href={`/mobile/officer/requests/${item.id}`}>
                                <Card className="p-4 active:scale-[0.99] transition-transform hover:shadow-md mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-text-primary truncate">{item.name}</h4>
                                                    <p className="text-xs text-text-secondary truncate">{item.company}</p>
                                                </div>
                                                <Badge variant={s.variant as any} className="text-[10px] h-5 px-2 shrink-0">{s.label}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                                <span className="flex items-center gap-1"><Calendar size={11} /> {item.date}</span>
                                                <span>•</span>
                                                <span>{item.time}</span>
                                                <span>•</span>
                                                <span>{item.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-text-muted font-medium">ไม่พบรายการ</p>
                    </div>
                )}
            </div>
        </div>
    );
}
