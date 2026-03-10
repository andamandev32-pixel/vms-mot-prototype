"use client";

import Link from "next/link";
import { CalendarPlus, UserCircle } from "lucide-react";

/**
 * Rich Menu State 2.2: Officer / Staff (post-registration)
 * Shown after staff completes registration.
 * 2-button layout: "ข้อมูลผู้ใช้งาน พนักงาน" + "บันทึกนัดหมาย"
 * Reference: Screenshot 2 (right) — ADVICS staff rich menu
 */
export default function OfficerRichMenu() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto">
                {/* Rich Menu Container */}
                <div className="bg-white shadow-[0_-6px_30px_rgba(0,0,0,0.15)] overflow-hidden border-t border-gray-200">
                    {/* Logo Header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">V</span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary-800">eVMES MOT</span>
                        <span className="text-[10px] text-text-muted">Visitor Management System</span>
                    </div>

                    {/* 2-Button Grid */}
                    <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
                        {/* Button 1 — ข้อมูลผู้ใช้งาน พนักงาน */}
                        <Link href="/mobile/officer" className="block">
                            <div className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2.5">
                                    <UserCircle size={36} className="text-primary" />
                                </div>
                                <p className="text-xs font-bold text-text-primary text-center leading-tight">ข้อมูลส่วนบุคคล</p>
                                <p className="text-[10px] text-text-muted text-center mt-0.5">พนักงาน กท.กก.</p>
                            </div>
                        </Link>

                        {/* Button 2 — บันทึกนัดหมาย */}
                        <Link href="/mobile/officer/requests" className="block">
                            <div className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-2.5">
                                    <CalendarPlus size={36} className="text-accent-600" />
                                </div>
                                <p className="text-xs font-bold text-text-primary text-center leading-tight">บันทึกนัดหมาย</p>
                                <p className="text-[10px] text-text-muted text-center mt-0.5">Make Appointment</p>
                            </div>
                        </Link>
                    </div>

                    {/* Bottom Menu Bar */}
                    <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 border-t border-gray-200">
                        <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" />
                                <rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" />
                                <rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" />
                                <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">Bulletin ▾</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
