"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, User, ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

export default function Topbar({ title }: { title: string }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        if (showUserMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showUserMenu]);

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>

            <div className="flex items-center gap-3">
                <button className="p-2.5 hover:bg-primary-50 rounded-xl transition-colors text-text-muted hover:text-primary">
                    <Search size={20} />
                </button>
                <button className="relative p-2.5 hover:bg-primary-50 rounded-xl transition-colors text-text-muted hover:text-primary">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
                </button>

                {/* User Avatar + Dropdown */}
                <div className="relative ml-2" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shadow-sm">
                            SM
                        </div>
                        <ChevronDown size={14} className={`text-text-muted transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-bold text-text-primary">สมศรี รักงาน</p>
                                <p className="text-xs text-text-muted">somsri.r@mots.go.th</p>
                            </div>

                            {/* Menu items */}
                            <Link
                                href="/web/profile"
                                onClick={() => setShowUserMenu(false)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors"
                            >
                                <User size={15} /> โปรไฟล์ของฉัน
                            </Link>
                            <Link
                                href="/web/settings"
                                onClick={() => setShowUserMenu(false)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors"
                            >
                                <Settings size={15} /> ตั้งค่า
                            </Link>

                            <div className="border-t border-border my-1"></div>

                            <Link
                                href="/web"
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={15} /> ออกจากระบบ
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
