"use client";

import { useEffect, useState } from "react";
import { Clock, QrCode, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import VmsLogo from "@/components/ui/VmsLogo";

export default function KioskWelcomePage() {
    const [time, setTime] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString("th-TH", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col h-screen">
            {/* Top Bar — VMS */}
            <header className="h-[120px] flex justify-between items-center px-12 z-10">
                {/* Left: VMS System Logo + Name */}
                <div className="flex items-center gap-5">
                    <VmsLogo size={72} darkMode />
                    <div>
                        <h1 className="text-3xl font-extrabold text-white leading-tight tracking-wide drop-shadow-md">VMS</h1>
                        <p className="text-sm text-white/60 font-semibold tracking-[0.15em] uppercase">Visitor Management System</p>
                    </div>
                </div>

                {/* Right: Time */}
                <div className="text-right">
                    <div className="text-5xl font-mono font-bold tracking-tight text-white drop-shadow-lg tabular-nums">{time}</div>
                    <div className="text-base text-white/60 font-medium">{date}</div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center gap-16 p-12">
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
                    <h2 className="text-7xl font-bold text-white drop-shadow-xl tracking-wide">ยินดีต้อนรับ</h2>
                    <p className="text-3xl text-white/70 font-light tracking-wider">กรุณาเลือกรายการ / Please select an option</p>
                </div>

                <div className="grid grid-cols-2 gap-16 w-full max-w-[1100px]">
                    <Link href="/kiosk/checkin" className="group">
                        <div className="relative h-[320px] bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-white/15 group-hover:scale-105 group-hover:border-accent/50 group-active:scale-95">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                            <div className="w-40 h-40 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center shadow-inner mb-6 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500">
                                <Clock size={80} className="text-white drop-shadow-lg" />
                            </div>

                            <div className="text-center relative z-10">
                                <h3 className="text-5xl font-bold text-white mb-2 group-hover:text-accent transition-colors">มีนัดล่วงหน้า</h3>
                                <p className="text-xl text-white/60 font-light uppercase tracking-widest">Appointment Check-in</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/kiosk/walkin" className="group">
                        <div className="relative h-[320px] bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-white/15 group-hover:scale-105 group-hover:border-accent/50 group-active:scale-95">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="w-40 h-40 bg-gradient-to-br from-accent to-[#B8860B] rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500">
                                <UserIcon size={80} className="text-white drop-shadow-md" />
                            </div>

                            <div className="text-center relative z-10">
                                <h3 className="text-5xl font-bold text-white mb-2 group-hover:text-accent transition-colors">ผู้มาติดต่อ</h3>
                                <p className="text-xl text-white/60 font-light uppercase tracking-widest">Walk-in Registration</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </main>

            {/* Bottom Bar */}
            <footer className="h-[120px] flex items-center justify-center pb-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-10 py-4 flex items-center gap-6 shadow-2xl animate-pulse cursor-pointer hover:bg-white/20 transition-all">
                    <QrCode size={40} className="text-accent" />
                    <span className="text-2xl font-medium text-white">แตะเพื่อสแกน QR Code (Scan Check-in)</span>
                </div>
            </footer>
        </div>
    );
}
