import Topbar from "@/components/web/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, Clock, ArrowUpRight, ArrowDown, MoreHorizontal, Eye } from "lucide-react";

export default function WebDashboard() {
    return (
        <div>
            <Topbar title="ภาพรวม" />
            <div className="p-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-5">
                    <KPICard title="Visitors Today" value="124" change="+12%" icon={<Users size={22} />} up />
                    <KPICard title="รอเข้าพื้นที่" value="8" change="-2 vs เมื่อวาน" icon={<Clock size={22} />} />
                    <KPICard title="Check-in แล้ว" value="86" change="+5 vs เมื่อวาน" icon={<ArrowUpRight size={22} />} up />
                    <KPICard title="ออกแล้ว" value="30" change="+8 vs เมื่อวาน" icon={<ArrowDown size={22} />} />
                </div>

                {/* Visitor Table */}
                <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-bold text-primary">ผู้มาติดต่อล่าสุด (Real-time)</CardTitle>
                            <span className="text-xs text-primary/60 font-medium bg-primary-100 px-3 py-1 rounded-full">อัปเดตอัตโนมัติ</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-left text-text-muted font-semibold text-xs uppercase tracking-wider">
                                    <th className="py-3 px-6">ผู้มาติดต่อ</th>
                                    <th className="py-3 px-4">ประเภท</th>
                                    <th className="py-3 px-4">เวลาเข้า</th>
                                    <th className="py-3 px-4">ผู้พบ</th>
                                    <th className="py-3 px-4">สถานะ</th>
                                    <th className="py-3 px-4 text-right">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <VisitorRow name="นายพุทธิพงษ์ คาดสนิท" type="ติดต่อราชการ" time="14:20 น." host="คุณวิจัย" status="checked-in" />
                                <VisitorRow name="คุณสุดา แก้วใส" type="ประชุม" time="13:45 น." host="คุณมานะ" status="pending" />
                                <VisitorRow name="นายจิรวัฒน์ เก่งกล้า" type="ผู้รับเหมา" time="11:30 น." host="ฝ่ายอาคาร" status="checked-out" />
                                <VisitorRow name="คุณนพมาศ วงศ์งาม" type="รับ-ส่งเอกสาร" time="10:15 น." host="สำนักงาน" status="approved" />
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, change, icon, up }: { title: string; value: string; change: string; icon: React.ReactNode; up?: boolean }) {
    return (
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-semibold text-text-secondary">{title}</p>
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        {icon}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-extrabold text-text-primary">{value}</p>
                    <p className={`text-xs font-semibold ${up ? "text-success" : "text-text-muted"}`}>
                        {change}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function VisitorRow({ name, type, time, host, status }: { name: string; type: string; time: string; host: string; status: string }) {
    const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
        "checked-in": { label: "Checked-in", variant: "approved", className: "bg-success-light text-success border-success/20" },
        "pending": { label: "Pending", variant: "pending", className: "bg-warning-light text-warning border-warning/20" },
        "checked-out": { label: "Checked-out", variant: "checkout", className: "bg-gray-100 text-text-muted border-gray-200" },
        "approved": { label: "Approved", variant: "approved", className: "bg-info-light text-info border-info/20" },
    };
    const sc = statusConfig[status] || statusConfig["pending"];

    return (
        <tr className="hover:bg-primary-50/30 transition-colors">
            <td className="py-3.5 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {name.charAt(0)}
                    </div>
                    <span className="font-semibold text-text-primary">{name}</span>
                </div>
            </td>
            <td className="py-3.5 px-4 text-text-secondary">{type}</td>
            <td className="py-3.5 px-4 text-text-secondary font-mono text-xs">{time}</td>
            <td className="py-3.5 px-4 text-text-secondary">{host}</td>
            <td className="py-3.5 px-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.className}`}>
                    {sc.label}
                </span>
            </td>
            <td className="py-3.5 px-4 text-right">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-primary">
                    <MoreHorizontal size={18} />
                </button>
            </td>
        </tr>
    );
}
