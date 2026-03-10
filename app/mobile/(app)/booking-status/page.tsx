"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Clock, Send, ChevronRight, QrCode, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function BookingStatusPage() {
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setSent(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-full bg-bg pb-24">
            {/* Header */}
            <div className="bg-[#06C755] text-white p-6 text-center">
                <h1 className="text-lg font-bold">สถานะคำขอนัดหมาย</h1>
            </div>

            <div className="p-6 space-y-6">
                {/* Status Animation */}
                <div className="text-center py-8">
                    {!sent ? (
                        <div className="animate-pulse">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                                <Send size={40} className="text-[#06C755] animate-bounce" />
                            </div>
                            <p className="text-lg font-bold text-text-primary">กำลังส่งคำขอ...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-[#06C755]" />
                            </div>
                            <p className="text-lg font-bold text-text-primary mb-1">ส่งคำขอเรียบร้อย!</p>
                            <p className="text-sm text-text-secondary">รอการตอบกลับจากพนักงาน</p>
                        </div>
                    )}
                </div>

                {/* Status Card */}
                <Card className="overflow-hidden border-none shadow-lg">
                    <div className="h-1.5 bg-gradient-to-r from-warning to-accent"></div>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                                <Clock size={20} className="text-warning" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">รอการตอบกลับ</h3>
                                <p className="text-xs text-text-secondary">พนักงานจะตรวจสอบและตอบกลับทาง LINE</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 space-y-3">
                            <StatusStep icon={<Send size={16} />} text="ส่งคำขอนัดหมายแล้ว" done />
                            <StatusStep icon={<MessageSquare size={16} />} text="รอพนักงานตรวจสอบ" current />
                            <StatusStep icon={<CheckCircle2 size={16} />} text="อนุมัติ → ได้รับ QR Code" />
                            <StatusStep icon={<QrCode size={16} />} text="Scan QR Code ที่ Kiosk เพื่อ Check-in" />
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                    <h4 className="font-bold text-sm text-primary mb-3">รายละเอียดคำขอ</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-muted">ประเภท</span>
                            <span className="font-bold text-text-primary">ติดต่อราชการ</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">ผู้รับพบ</span>
                            <span className="font-bold text-text-primary">คุณสมศรี รักงาน</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">วันที่</span>
                            <span className="font-bold text-text-primary">12 มี.ค. 2569</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">เวลา</span>
                            <span className="font-bold text-text-primary">10:00 - 11:00</span>
                        </div>
                    </div>
                </Card>

                {/* Info */}
                <div className="bg-[#06C755]/5 border border-[#06C755]/20 p-4 rounded-xl text-center">
                    <p className="text-sm text-text-secondary">
                        กรณี<span className="font-bold text-[#06C755]">อนุมัติ</span> จะมีข้อความตอบกลับทาง LINE พร้อม QR Code
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        กรณี<span className="font-bold text-error">ไม่อนุมัติ</span> จะมีข้อความแจ้งตอบกลับทาง LINE
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link href="/mobile/dashboard">
                        <Button fullWidth className="h-12 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold">
                            กลับหน้าแรก
                        </Button>
                    </Link>
                    <Link href="/mobile/history">
                        <Button fullWidth variant="outline" className="h-12 border-primary text-primary rounded-xl font-bold">
                            ดูประวัติการนัดหมาย
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatusStep({ icon, text, done, current }: { icon: React.ReactNode; text: string; done?: boolean; current?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#06C755] text-white" : current ? "bg-warning/20 text-warning animate-pulse" : "bg-gray-100 text-text-muted"
                }`}>
                {icon}
            </div>
            <span className={`text-sm ${done ? "text-text-primary font-medium line-through opacity-60" : current ? "text-text-primary font-bold" : "text-text-muted"}`}>
                {text}
            </span>
        </div>
    );
}
