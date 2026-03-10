"use client";

import { CreditCard, Smartphone, QrCode, BookOpen, ChevronLeft, Check, ClipboardList, Users, MapPin, Clock, Building, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function KioskCheckInPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const router = useRouter();

    const methods = [
        { id: "idcard", icon: <CreditCard size={48} />, title: "เสียบบัตรประชาชน", desc: "Insert Thai ID Card" },
        { id: "thaid", icon: <Smartphone size={48} />, title: "ThaiD Application", desc: "Scan QR via ThaiD App" },
        { id: "qrcode", icon: <QrCode size={48} />, title: "QR Code นัดหมาย", desc: "Scan Appointment QR Code" },
        { id: "passport", icon: <BookOpen size={48} />, title: "หนังสือเดินทาง", desc: "Scan Passport / Driving License" },
    ];

    // Mock appointment data (would come from backend after ID scan)
    const appointment = {
        visitor: "นายพุทธิพงษ์ คาดสนิท",
        idNumber: "1-1234-56789-01-0",
        host: "คุณสมศรี รักงาน",
        hostRole: "ผู้อำนวยการกองกิจการท่องเที่ยว",
        location: "ห้องประชุม 301 ชั้น 3",
        locationEn: "Meeting Room 301, 3rd Floor",
        date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
        time: "10:00 — 11:30",
        purpose: "ประชุมหารือ โครงการส่งเสริมการท่องเที่ยวเชิงสุขภาพ",
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header — MOTS CI */}
            <header className="h-[100px] flex items-center px-12 shrink-0">
                <button
                    onClick={() => step === 1 ? router.push('/kiosk') : setStep(1)}
                    className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mr-5 hover:bg-white/20 active:scale-95 transition-all"
                >
                    <ChevronLeft size={32} />
                </button>
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Emblem_of_Ministry_of_Tourism_and_Sports_of_Thailand.svg/960px-Emblem_of_Ministry_of_Tourism_and_Sports_of_Thailand.svg.png"
                    alt="MOTS"
                    className="w-[52px] h-[52px] object-contain drop-shadow-lg mr-5"
                />
                <div>
                    <h1 className="text-2xl font-bold text-white drop-shadow-md">
                        {step === 1 ? "ยืนยันตัวตน" : "ข้อมูลนัดหมาย"}
                    </h1>
                    <p className="text-white/50 text-sm">
                        {step === 1 ? "Select Identity Verification Method" : "Appointment Preview"}
                    </p>
                </div>
                {/* Step indicator */}
                <div className="ml-auto flex items-center gap-3">
                    <StepDot active={step >= 1} current={step === 1} label="1" />
                    <div className={cn("w-10 h-0.5", step >= 2 ? "bg-accent" : "bg-white/20")}></div>
                    <StepDot active={step >= 2} current={step === 2} label="2" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-12 pb-8 overflow-y-auto">
                {step === 1 && (
                    /* Step 1: Select ID Verification Method */
                    <div className="grid grid-cols-1 gap-4 max-w-[1100px] mx-auto">
                        {methods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => setSelected(method.id)}
                                className={cn(
                                    "h-[100px] rounded-2xl flex items-center px-8 cursor-pointer transition-all duration-300 active:scale-[0.98] backdrop-blur-xl border",
                                    selected === method.id
                                        ? "bg-accent/20 border-accent/60 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                                        : "bg-white/[0.08] border-white/[0.15] hover:bg-white/[0.12] hover:border-white/30"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mr-6 transition-all",
                                    selected === method.id
                                        ? "bg-accent text-white shadow-lg"
                                        : "bg-white/10 text-white/80"
                                )}>
                                    {method.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white">{method.title}</h3>
                                    <p className="text-base text-white/50">{method.desc}</p>
                                </div>
                                {selected === method.id && (
                                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                        <Check size={28} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    /* Step 2: Appointment Preview */
                    <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center h-full gap-6">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] w-full shadow-2xl overflow-hidden">
                            {/* Preview Header */}
                            <div className="bg-accent/10 border-b border-accent/20 px-10 py-6 flex items-center gap-4">
                                <ClipboardList size={32} className="text-accent" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">ข้อมูลนัดหมาย</h2>
                                    <p className="text-white/50 text-sm">Please verify your appointment details</p>
                                </div>
                            </div>

                            {/* Preview Body */}
                            <div className="p-10 space-y-5">
                                {/* Visitor */}
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-sm mb-1">ผู้มาติดต่อ / Visitor</p>
                                        <p className="text-xl font-bold text-white">{appointment.visitor}</p>
                                        <p className="text-white/50 text-sm">{appointment.idNumber}</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10"></div>

                                {/* Host */}
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <Building size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-sm mb-1">ผู้ที่นัดพบ / Host</p>
                                        <p className="text-xl font-bold text-white">{appointment.host}</p>
                                        <p className="text-white/50 text-sm">{appointment.hostRole}</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10"></div>

                                {/* Location */}
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-sm mb-1">สถานที่ / Location</p>
                                        <p className="text-xl font-bold text-white">{appointment.location}</p>
                                        <p className="text-white/50 text-sm">{appointment.locationEn}</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10"></div>

                                {/* Date & Time */}
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-sm mb-1">วันที่ / Date & Time</p>
                                        <p className="text-xl font-bold text-white">{appointment.date}</p>
                                        <p className="text-white/50 text-sm">{appointment.time}</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10"></div>

                                {/* Purpose */}
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <ClipboardList size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-sm mb-1">วัตถุประสงค์ / Purpose</p>
                                        <p className="text-xl font-bold text-white">{appointment.purpose}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-10 pb-10 flex gap-4">
                                <Button
                                    variant="kiosk"
                                    className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl h-16 text-lg font-bold"
                                    onClick={() => setStep(1)}
                                >
                                    <ChevronLeft size={22} className="mr-2" />
                                    ย้อนกลับ / Back
                                </Button>
                                <Button
                                    variant="kiosk"
                                    className="flex-[2] bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-16 text-lg font-bold shadow-xl"
                                    onClick={() => router.push('/kiosk/success')}
                                >
                                    <Check size={22} className="mr-2" />
                                    ยืนยัน Check-in / Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer — only for Step 1 */}
            {step === 1 && (
                <footer className="h-[120px] px-12 flex items-center justify-center shrink-0">
                    <Button
                        variant="kiosk"
                        className={cn(
                            "w-[600px] bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-20 text-2xl font-bold shadow-xl transition-all",
                            !selected && "opacity-30 cursor-not-allowed"
                        )}
                        disabled={!selected}
                        onClick={() => setStep(2)}
                    >
                        ถัดไป / Next
                        <ChevronRight size={28} className="ml-2" />
                    </Button>
                </footer>
            )}
        </div>
    );
}

function StepDot({ active, current, label }: { active: boolean; current: boolean; label: string }) {
    return (
        <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2",
            current
                ? "bg-accent text-white border-accent shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                : active
                    ? "bg-accent/30 text-accent border-accent/50"
                    : "bg-white/10 text-white/40 border-white/20"
        )}>
            {active && !current ? <Check size={18} /> : label}
        </div>
    );
}
