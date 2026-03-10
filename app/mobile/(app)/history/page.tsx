import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
    return (
        <div className="min-h-full bg-bg pb-24">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <h1 className="text-lg font-bold text-primary">ประวัติการเยือน</h1>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Filter size={20} className="text-text-secondary" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                <Badge variant="default" className="bg-primary text-white rounded-full px-4 py-2 h-auto text-sm">ทั้งหมด</Badge>
                <Badge variant="outline" className="bg-white rounded-full px-4 py-2 h-auto text-sm">รอดำเนินการ</Badge>
                <Badge variant="outline" className="bg-white rounded-full px-4 py-2 h-auto text-sm">อนุมัติ</Badge>
                <Badge variant="outline" className="bg-white rounded-full px-4 py-2 h-auto text-sm">เสร็จสิ้น</Badge>
            </div>

            {/* List */}
            <div className="bg-bg px-4 space-y-3">
                <HistoryItem
                    title="สำนักนโยบายและยุทธศาสตร์"
                    type="ติดต่อราชการ"
                    date="20 ม.ค. 2568"
                    status="Approved"
                    variant="approved"
                />
                <HistoryItem
                    title="กรมพลศึกษา"
                    type="ส่งเอกสาร"
                    date="18 ม.ค. 2568"
                    status="Checked-out"
                    variant="checkout"
                />
                <HistoryItem
                    title="กองจราจร"
                    type="ชำระค่าธรรมเนียม"
                    date="15 ม.ค. 2568"
                    status="Pending"
                    variant="pending"
                />
                <HistoryItem
                    title="ห้องประชุม 301"
                    type="ประชุมคณะทำงาน"
                    date="10 ม.ค. 2568"
                    status="Rejected"
                    variant="rejected"
                />
            </div>
        </div>
    );
}

function HistoryItem({ title, type, date, status, variant }: { title: string, type: string, date: string, status: string, variant: string }) {
    return (
        <Card className="flex items-center p-4 gap-4 active:scale-[0.99] transition-transform">
            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${variant === 'approved' ? 'bg-success' :
                    variant === 'pending' ? 'bg-warning' :
                        variant === 'rejected' ? 'bg-error' : 'bg-gray-400'
                }`} />
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                <span className="font-bold text-xs">🏢</span>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text-primary truncate">{title}</h3>
                <p className="text-xs text-text-secondary truncate">{type} • {date}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Badge variant={variant as any} className="text-[10px] px-2 h-5">{status}</Badge>
                <ChevronRight size={16} className="text-text-muted" />
            </div>
        </Card>
    )
}
