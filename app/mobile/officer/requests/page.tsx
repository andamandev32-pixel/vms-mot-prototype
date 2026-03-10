"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Search, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const mockRequests = [
    { id: "1", name: "นายสมศักดิ์ จริงใจ", company: "บริษัท ABC จำกัด", type: "ติดต่อราชการ", date: "20 ก.พ. 2569", time: "10:00-11:00", status: "pending" },
    { id: "2", name: "นางสาวมาลี งามจิต", company: "บริษัท XYZ จำกัด", type: "ประชุม", date: "20 ก.พ. 2569", time: "13:00-14:00", status: "pending" },
    { id: "3", name: "นายสุชาติ ปรีชา", company: "หจก. สมาร์ท เซอร์วิส", type: "ผู้รับเหมา", date: "21 ก.พ. 2569", time: "09:00-17:00", status: "pending" },
    { id: "4", name: "นายธนพงศ์ สุขใจ", company: "บริษัท เทคโน จำกัด", type: "ติดต่อราชการ", date: "19 ก.พ. 2569", time: "09:00-10:00", status: "checkedin" },
    { id: "5", name: "นางวันดี สว่างจิต", company: "บริษัท พรีเมียร์ จำกัด", type: "ประชุม", date: "19 ก.พ. 2569", time: "10:00-12:00", status: "approved" },
    { id: "6", name: "นายชัยวัฒน์ สุขสันต์", company: "บริษัท เดลต้า จำกัด", type: "ส่งเอกสาร", date: "18 ก.พ. 2569", time: "14:00-15:00", status: "checkout" },
    { id: "7", name: "นางสมพร ใจบุญ", company: "บริษัท ซีเนอร์ จำกัด", type: "ติดต่อราชการ", date: "17 ก.พ. 2569", time: "10:00-11:00", status: "rejected" },
];

const tabs = [
    { key: "appointment", label: "นัดหมาย" },
    { key: "meeting", label: "กำลังเข้าพบ" },
    { key: "history", label: "ประวัติทั้งหมด" },
];

export default function OfficerRequestsPage() {
    const [activeTab, setActiveTab] = useState("appointment");

    const filteredRequests = mockRequests.filter((r) => {
        if (activeTab === "appointment") return r.status === "pending" || r.status === "approved";
        if (activeTab === "meeting") return r.status === "checkedin";
        return r.status === "checkout" || r.status === "rejected";
    });

    return (
        <div className="min-h-full bg-bg pb-24">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <Link href="/mobile/officer" className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} className="text-primary" />
                    </Link>
                    <h1 className="text-lg font-bold text-primary">รายการคำขอเข้าพบ</h1>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Filter size={20} className="text-text-secondary" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-bg text-sm"
                        placeholder="ค้นหาชื่อ, บริษัท..."
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                                activeTab === tab.key
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Request List */}
            <div className="p-4 space-y-3">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-text-muted text-sm">
                        ไม่มีรายการ
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <RequestItem key={req.id} {...req} />
                    ))
                )}
            </div>
        </div>
    );
}

function RequestItem({ id, name, company, type, date, time, status }: {
    id: string; name: string; company: string; type: string; date: string; time: string; status: string;
}) {
    const statusMap: Record<string, { label: string; variant: string; dot: string }> = {
        pending: { label: "รอดำเนินการ", variant: "pending", dot: "bg-warning" },
        approved: { label: "อนุมัติ", variant: "approved", dot: "bg-success" },
        checkedin: { label: "เข้าพบแล้ว", variant: "checkedin", dot: "bg-primary" },
        checkout: { label: "Check-out", variant: "checkout", dot: "bg-gray-400" },
        rejected: { label: "ปฏิเสธ", variant: "rejected", dot: "bg-error" },
    };
    const s = statusMap[status] || statusMap.pending;

    return (
        <Link href={`/mobile/officer/requests/${id}`}>
            <Card className="p-4 active:scale-[0.99] transition-transform hover:shadow-md">
                <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-2 shrink-0 ${s.dot}`} />
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
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{type}</span>
                            <span>{date}</span>
                            <span className="text-primary font-medium">{time}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
