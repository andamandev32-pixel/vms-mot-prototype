"use client";

import { CheckCircle, Wifi, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function KioskSuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/kiosk');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="flex flex-col h-screen px-12 py-10">
            <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left: Success Message */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-r border-dashed border-white/10">
                    <div className="mb-8">
                        <div className="w-40 h-40 bg-success/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <CheckCircle size={100} className="text-success drop-shadow-lg" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg">Check-in สำเร็จ!</h1>
                    <p className="text-2xl text-white/60 mb-12">Registration Successful</p>

                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent-hover border-4 border-white/30 shadow-xl flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">ส</span>
                        </div>
                        <div className="text-left">
                            <h2 className="text-3xl font-bold text-white">นายพุทธิพงษ์ คาดสนิท</h2>
                            <p className="text-xl text-white/60">ผู้มาติดต่อ (Visitor)</p>
                        </div>
                    </div>
                </div>

                {/* Right: Slip Preview */}
                <div className="flex-1 bg-white/5 p-12 flex flex-col items-center justify-center">
                    <div className="bg-white w-[400px] p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
                        <div className="text-center border-b border-gray-200 pb-4">
                            <h3 className="text-xl font-extrabold text-primary">VISIT SLIP</h3>
                            <p className="text-sm text-text-muted">Visitor Management System</p>
                        </div>

                        <div className="space-y-4">
                            <SlipRow label="วันที่" value="21 ม.ค. 2568" />
                            <SlipRow label="เวลาเข้า" value="14:50 น." />
                            <SlipRow label="ผู้พบ" value="คุณวิชัย (IT)" />
                            <SlipRow label="พื้นที่" value="ชั้น 3 อาคาร A" />
                        </div>

                        <div className="bg-accent-100 border-l-4 border-accent p-4 rounded-r-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Wifi size={24} className="text-primary" />
                                <span className="font-bold text-primary">Wi-Fi Access</span>
                            </div>
                            <p className="font-mono text-lg text-text-primary">User: guest01</p>
                            <p className="font-mono text-lg font-bold text-primary">Pass: wifi2026</p>
                        </div>

                        <div className="flex justify-center pt-2">
                            <div className="text-center">
                                <div className="w-32 h-32 bg-primary-900 mx-auto mb-2 rounded-lg"></div>
                                <p className="text-xs text-text-muted font-mono">VMS-20260121-0089</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-accent animate-pulse">
                        <Printer size={32} />
                        <span className="text-2xl font-bold">กำลังพิมพ์บัตร...</span>
                    </div>
                </div>
            </div>

            {/* Countdown Footer */}
            <div className="mt-6 flex justify-center">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-8 py-3 text-white text-xl">
                    กลับหน้าหลักอัตโนมัติใน <span className="font-bold text-accent">{countdown}</span> วินาที
                </div>
            </div>
        </div>
    );
}

function SlipRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
            <span className="text-text-secondary font-medium">{label}</span>
            <span className="text-primary font-bold">{value}</span>
        </div>
    )
}
