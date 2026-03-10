"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    ChevronLeft, User, Building2, Calendar, Clock, Car, Users,
    Package, MessageSquare, CheckCircle2, XCircle, Send, QrCode
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const mockRequest = {
    id: "1",
    name: "นายสมศักดิ์ จริงใจ",
    company: "บริษัท ABC จำกัด",
    phone: "081-234-5678",
    email: "somsak@abc.co.th",
    type: "ติดต่อราชการ",
    purpose: "ยื่นเอกสาร, ติดต่อเจ้าหน้าที่",
    host: "คุณสมชาย รักชาติ",
    department: "สำนักนโยบายและยุทธศาสตร์",
    date: "20 ก.พ. 2569",
    timeStart: "10:00",
    timeEnd: "11:00",
    companions: 1,
    vehicle: { plate: "กข 1234 กรุงเทพฯ", type: "รถเก๋ง สีขาว" },
    equipment: [
        { name: "Laptop", qty: 1 },
        { name: "กล้องถ่ายรูป", qty: 1 },
    ],
    note: "นำเอกสารสัญญามาส่งมอบ",
    status: "pending",
};

export default function RequestDetailPage() {
    const [status, setStatus] = useState(mockRequest.status);
    const [showModal, setShowModal] = useState<"approve" | "reject" | null>(null);

    const handleApprove = () => {
        setStatus("approved");
        setShowModal("approve");
    };

    const handleReject = () => {
        setStatus("rejected");
        setShowModal("reject");
    };

    return (
        <div className="min-h-full bg-bg pb-32">
            {/* Header */}
            <div className="bg-primary text-white p-4 sticky top-0 z-20 shadow-sm flex items-center gap-3">
                <Link href="/mobile/officer/requests" className="p-1">
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-lg font-bold flex-1">รายละเอียดคำขอ</h1>
                <Badge
                    variant={status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending"}
                    className="text-xs"
                >
                    {status === "approved" ? "อนุมัติแล้ว" : status === "rejected" ? "ปฏิเสธแล้ว" : "รอดำเนินการ"}
                </Badge>
            </div>

            <div className="p-4 space-y-4">
                {/* Visitor Info */}
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <User size={16} /> ข้อมูลผู้มาติดต่อ
                    </h3>
                    <div className="space-y-2">
                        <DetailRow label="ชื่อ-นามสกุล" value={mockRequest.name} />
                        <DetailRow label="บริษัท" value={mockRequest.company} icon={<Building2 size={14} />} />
                        <DetailRow label="โทรศัพท์" value={mockRequest.phone} />
                        <DetailRow label="อีเมล" value={mockRequest.email} />
                        <DetailRow label="ประเภท" value={mockRequest.type} />
                    </div>
                </Card>

                {/* Appointment Info */}
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <Calendar size={16} /> รายละเอียดนัดหมาย
                    </h3>
                    <div className="space-y-2">
                        <DetailRow label="ผู้ต้องการเข้าพบ" value={mockRequest.host} />
                        <DetailRow label="หน่วยงาน" value={mockRequest.department} />
                        <DetailRow label="วันที่" value={mockRequest.date} icon={<Calendar size={14} />} />
                        <DetailRow label="เวลา" value={`${mockRequest.timeStart} - ${mockRequest.timeEnd}`} icon={<Clock size={14} />} />
                        <DetailRow label="จำนวนผู้ติดตาม" value={`${mockRequest.companions} คน`} icon={<Users size={14} />} />
                    </div>
                </Card>

                {/* Vehicle Info */}
                {mockRequest.vehicle && (
                    <Card className="p-4">
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <Car size={16} /> ข้อมูลยานพาหนะ
                        </h3>
                        <div className="space-y-2">
                            <DetailRow label="ทะเบียน" value={mockRequest.vehicle.plate} />
                            <DetailRow label="ประเภท/สี" value={mockRequest.vehicle.type} />
                        </div>
                    </Card>
                )}

                {/* Equipment */}
                {mockRequest.equipment.length > 0 && (
                    <Card className="p-4">
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <Package size={16} /> อุปกรณ์นำเข้าพื้นที่
                        </h3>
                        <div className="space-y-1">
                            {mockRequest.equipment.map((eq, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                                    <span className="text-text-secondary">{eq.name}</span>
                                    <span className="font-bold text-text-primary">{eq.qty} ชิ้น</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Note */}
                {mockRequest.note && (
                    <Card className="p-4">
                        <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                            <MessageSquare size={16} /> หมายเหตุ
                        </h3>
                        <p className="text-sm text-text-secondary bg-gray-50 p-3 rounded-lg">{mockRequest.note}</p>
                    </Card>
                )}
            </div>

            {/* Action Buttons */}
            {status === "pending" && (
                <div className="fixed bottom-[170px] left-0 right-0 p-4 bg-white border-t border-border z-20">
                    <div className="max-w-md mx-auto flex gap-3">
                        <Button
                            onClick={handleReject}
                            className="flex-1 h-14 font-bold text-base rounded-xl bg-white border-2 border-error text-error hover:bg-error/5"
                        >
                            <XCircle size={20} className="mr-2" />
                            ไม่อนุมัติ
                        </Button>
                        <Button
                            onClick={handleApprove}
                            className="flex-1 h-14 font-bold text-base rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg"
                        >
                            <CheckCircle2 size={20} className="mr-2" />
                            อนุมัติ
                        </Button>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowModal(null)}>
                    <div
                        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showModal === "approve" ? (
                            <>
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                                    <CheckCircle2 size={40} className="text-[#06C755]" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">อนุมัติเรียบร้อย</h3>
                                <p className="text-sm text-text-secondary mb-4">
                                    ระบบได้ส่ง QR Code ไปยังผู้มาติดต่อทาง LINE และอีเมลแล้ว
                                </p>
                                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                    <div className="flex items-center justify-center gap-2 text-primary mb-2">
                                        <QrCode size={20} />
                                        <span className="font-bold text-sm">QR Code ถูกส่งแล้ว</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[#06C755]">
                                        <Send size={16} />
                                        <span className="text-xs">LINE Message Sent</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                                    <XCircle size={40} className="text-error" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">ปฏิเสธรายการ</h3>
                                <p className="text-sm text-text-secondary mb-4">
                                    ระบบได้แจ้งผลการปฏิเสธไปยังผู้มาติดต่อทาง LINE และอีเมลแล้ว
                                </p>
                                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                    <div className="flex items-center justify-center gap-2 text-error">
                                        <Send size={16} />
                                        <span className="text-xs">LINE Message Sent — ปฏิเสธการเข้าพบ</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <Link href="/mobile/officer/requests">
                            <Button fullWidth className="h-12 rounded-xl font-bold bg-primary text-white">
                                กลับไปรายการคำขอ
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-start">
            <span className="text-xs text-text-muted flex items-center gap-1">
                {icon}
                {label}
            </span>
            <span className="text-sm font-bold text-text-primary text-right max-w-[60%]">{value}</span>
        </div>
    );
}
