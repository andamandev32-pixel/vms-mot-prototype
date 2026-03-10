import Topbar from "@/components/web/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Filter, Plus, MoreHorizontal, Check, X, Eye } from "lucide-react";

export default function AppointmentsPage() {
    return (
        <>
            <Topbar title="การนัดหมาย" />
            <main className="flex-1 p-6 space-y-6">

                {/* Filter Bar */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full md:w-auto">
                            <Input
                                placeholder="ค้นหาชื่อ / เลขบัตร / บริษัท"
                                leftIcon={<Search size={18} />}
                                className="h-10"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary">
                                <option>สถานะทั้งหมด</option>
                                <option>รอดำเนินการ</option>
                                <option>อนุมัติแล้ว</option>
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <input type="date" className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary text-text-muted" />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="primary" className="h-10 px-6">ค้นหา</Button>
                            <Button variant="ghost" className="h-10 px-4 text-text-muted">ล้างตัวกรอง</Button>
                        </div>
                        <div className="ml-auto">
                            <Button variant="secondary" className="h-10 shadow-sm">
                                <Plus size={18} className="mr-2" />
                                สร้างนัดหมาย
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-none shadow-sm">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4">ผู้มาติดต่อ</th>
                                    <th className="px-6 py-4">ประเภท</th>
                                    <th className="px-6 py-4">วันนัดหมาย</th>
                                    <th className="px-6 py-4">ผู้พบ</th>
                                    <th className="px-6 py-4">สถานะ</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AppointmentRow
                                    name="นายสมศักดิ์ รักชาติ"
                                    id="1-1002-00XXX-XX-X"
                                    type="ติดต่อราชการ"
                                    date="22 ม.ค. 68"
                                    time="10:00"
                                    host="คุณวิชัย"
                                    status="Pending"
                                    variant="pending"
                                />
                                <AppointmentRow
                                    name="Ms. Jane Doe"
                                    id="PASS-12345678"
                                    type="ประชุม"
                                    date="22 ม.ค. 68"
                                    time="13:30"
                                    host="ดร.สมเกียรติ"
                                    status="Approved"
                                    variant="approved"
                                    approver="คุณสมศรี"
                                />
                                <AppointmentRow
                                    name="ทีมติดตั้ง AIS"
                                    id="-"
                                    type="ผู้รับเหมา"
                                    date="23 ม.ค. 68"
                                    time="09:00"
                                    host="IT Support"
                                    status="Pending"
                                    variant="pending"
                                />
                                <AppointmentRow
                                    name="นายวิชัย ใจกล้า"
                                    id="3-1456-XXXXX-XX-X"
                                    type="สมัครงาน"
                                    date="24 ม.ค. 68"
                                    time="10:00"
                                    host="HR Manager"
                                    status="Rejected"
                                    variant="rejected"
                                />
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-text-muted">แสดง 1-4 จากทั้งหมด 24 รายการ</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled>ก่อนหน้า</Button>
                                <Button variant="outline" size="sm">ถัดไป</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

function AppointmentRow({ name, id, type, date, time, host, status, variant, approver }: any) {
    return (
        <tr className="hover:bg-gray-50 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {name[0]}
                    </div>
                    <div>
                        <p className="font-bold text-text-primary">{name}</p>
                        <p className="text-xs text-text-secondary font-mono">{id}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-text-secondary">{type}</td>
            <td className="px-6 py-4">
                <p className="font-medium text-text-primary">{date}</p>
                <p className="text-xs text-text-muted">{time} น.</p>
            </td>
            <td className="px-6 py-4 text-text-secondary">{host}</td>
            <td className="px-6 py-4">
                <Badge variant={variant} className="h-6 px-3">{status}</Badge>
                {approver && <p className="text-[10px] text-text-muted mt-1">โดย: {approver}</p>}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {status === 'Pending' && (
                        <>
                            <button className="h-8 w-8 rounded-full bg-green-50 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors border border-green-200" title="อนุมัติ">
                                <Check size={16} />
                            </button>
                            <button className="h-8 w-8 rounded-full bg-red-50 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors border border-red-200" title="ปฏิเสธ">
                                <X size={16} />
                            </button>
                        </>
                    )}
                    <button className="h-8 w-8 rounded-full bg-gray-50 text-text-muted hover:bg-white hover:text-primary hover:shadow-sm flex items-center justify-center transition-colors border border-gray-200" title="ดูรายละเอียด">
                        <Eye size={16} />
                    </button>
                </div>
            </td>
        </tr>
    )
}
