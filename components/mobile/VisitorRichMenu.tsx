"use client";

import Link from "next/link";
import { CalendarPlus, UserCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useRichMenu } from "./RichMenuContext";

/**
 * Rich Menu State 2.1: Visitor (post-registration)
 * Collapsible — toggle via the bottom bar.
 */
export default function VisitorRichMenu() {
    const { isMenuOpen, toggleMenu } = useRichMenu();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto">
                <div className="bg-white shadow-[0_-6px_30px_rgba(0,0,0,0.15)] overflow-hidden border-t border-gray-200">
                    {/* Toggle Bar — always visible */}
                    <button
                        onClick={toggleMenu}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 border-b border-gray-200 active:bg-gray-200 transition-colors"
                    >
                        <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" />
                                <rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" />
                                <rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" />
                                <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">Bulletin</span>
                        {isMenuOpen ? (
                            <ChevronDown size={14} className="text-gray-400" />
                        ) : (
                            <ChevronUp size={14} className="text-gray-400" />
                        )}
                    </button>

                    {/* Collapsible Content */}
                    <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{ maxHeight: isMenuOpen ? "300px" : "0px" }}
                    >
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
                            <Link href="/mobile/profile" className="block">
                                <div className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                                    <div className="w-16 h-16 rounded-2xl bg-[#06C755]/10 flex items-center justify-center mb-2.5">
                                        <UserCircle size={36} className="text-[#06C755]" />
                                    </div>
                                    <p className="text-xs font-bold text-text-primary text-center leading-tight">ข้อมูลส่วนบุคคล</p>
                                    <p className="text-[10px] text-text-muted text-center mt-0.5">ผู้มาติดต่อ / Visitor</p>
                                </div>
                            </Link>

                            <Link href="/mobile/booking" className="block">
                                <div className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2.5">
                                        <CalendarPlus size={36} className="text-primary" />
                                    </div>
                                    <p className="text-xs font-bold text-text-primary text-center leading-tight">บันทึกนัดหมาย</p>
                                    <p className="text-[10px] text-text-muted text-center mt-0.5">Make Appointment</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
