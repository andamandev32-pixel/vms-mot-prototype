"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Search, FileText, Settings, Shield, LogOut, ChevronRight, ClipboardList, DoorOpen, ShieldCheck, UserCog, Monitor, FileCheck, Clock, Bell, Printer, Building2, Mail, MessageCircle, Users, User } from "lucide-react";
import VmsLogo from "@/components/ui/VmsLogo";
import { canAccess, roleConfig, type AppRole } from "@/lib/auth-config";

// Mock current user — ในระบบจริงจะดึงจาก session/context
const CURRENT_USER_ROLE: AppRole = "admin";

export default function Sidebar() {
    const pathname = usePathname();
    const role = CURRENT_USER_ROLE;

    const allNavItems = [
        { href: "/web/dashboard", label: "ภาพรวม", icon: <LayoutDashboard size={20} />, resource: "dashboard" },
        { href: "/web/appointments", label: "การนัดหมาย", icon: <Calendar size={20} />, resource: "appointments" },
        { href: "/web/search", label: "รายชื่อการติดต่อ", icon: <Search size={20} />, resource: "search" },
        { href: "/web/blocklist", label: "Blocklist", icon: <Shield size={20} />, resource: "blocklist" },
        { href: "/web/reports", label: "รายงาน", icon: <FileText size={20} />, resource: "reports" },
        { href: "/web/settings", label: "ตั้งค่า", icon: <Settings size={20} />, separator: true, resource: "settings" },
        { href: "/web/settings/visit-purposes", label: "วัตถุประสงค์เข้าพื้นที่", icon: <ClipboardList size={20} />, resource: "settings" },
        { href: "/web/settings/locations", label: "สถานที่และแผนก", icon: <Building2 size={20} />, resource: "settings" },
        { href: "/web/settings/access-zones", label: "โซนเข้าพื้นที่", icon: <DoorOpen size={20} />, resource: "settings" },
        { href: "/web/settings/approver-groups", label: "กลุ่มผู้อนุมัติ", icon: <ShieldCheck size={20} />, resource: "settings" },
        { href: "/web/settings/users", label: "จัดการผู้ใช้งาน", icon: <Users size={20} />, resource: "settings" },
        { href: "/web/settings/staff", label: "จัดการพนักงาน", icon: <UserCog size={20} />, resource: "settings" },
        { href: "/web/settings/service-points", label: "จุดให้บริการ Kiosk/Counter", icon: <Monitor size={20} />, resource: "settings" },
        { href: "/web/settings/document-types", label: "ประเภทเอกสาร", icon: <FileCheck size={20} />, resource: "settings" },
        { href: "/web/settings/business-hours", label: "เวลาทำการ", icon: <Clock size={20} />, resource: "settings" },
        { href: "/web/settings/notification-templates", label: "เทมเพลตแจ้งเตือน", icon: <Bell size={20} />, resource: "settings" },
        { href: "/web/settings/visit-slips", label: "แบบฟอร์ม Visit Slip", icon: <Printer size={20} />, resource: "settings" },
        { href: "/web/settings/pdpa-consent", label: "PDPA / ข้อมูลส่วนบุคคล", icon: <ShieldCheck size={20} />, resource: "settings" },
        { href: "/web/settings/email-system", label: "ตั้งค่าอีเมลระบบ", icon: <Mail size={20} />, resource: "settings" },
        { href: "/web/settings/line-oa-config", label: "ตั้งค่า LINE OA", icon: <MessageCircle size={20} />, resource: "settings" },
    ];

    // Filter menu items by role permissions
    const navItems = allNavItems.filter((item) => canAccess(role, item.resource));
    const rc = roleConfig[role];

    return (
        <aside className="w-[260px] bg-primary-dark flex flex-col fixed inset-y-0 left-0 z-50 text-white shadow-2xl">
            {/* Brand Header */}
            <div className="h-20 flex items-center px-5 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <VmsLogo size={42} showText darkMode />
            </div>


            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <div key={item.href}>
                        {item.separator && <div className="my-4 border-t border-white/10 mx-3"></div>}
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium transition-all rounded-xl relative group overflow-hidden",
                                pathname === item.href || pathname.startsWith(item.href + "/")
                                    ? "text-white bg-white/10 shadow-inner"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {(pathname === item.href || pathname.startsWith(item.href + "/")) && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full shadow-[0_0_10px_rgba(77,182,172,0.8)]"></div>
                            )}
                            <span className={cn("mr-3 transition-colors", (pathname === item.href || pathname.startsWith(item.href + "/")) ? "text-accent" : "text-white/60 group-hover:text-white")}>
                                {item.icon}
                            </span>
                            <span className="flex-1">{item.label}</span>
                            {(pathname === item.href || pathname.startsWith(item.href + "/")) && <ChevronRight size={14} className="text-accent opacity-80" />}
                        </Link>
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md space-y-1">
                <Link href="/web/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 p-[2px]">
                        <div className="w-full h-full rounded-full bg-primary-dark flex items-center justify-center text-xs font-bold text-accent">
                            AD
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-white group-hover:text-accent transition-colors">Admin User</p>
                        <p className="text-xs text-white/50 truncate">{rc.label} ({rc.labelEn})</p>
                    </div>
                    <User size={16} className="text-white/30 group-hover:text-accent transition-colors" />
                </Link>
                <Link href="/web" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/40 hover:text-error hover:bg-white/5 transition-colors text-xs">
                    <LogOut size={14} /> ออกจากระบบ
                </Link>
            </div>
        </aside>
    );
}
