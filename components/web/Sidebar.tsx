"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Search, FileText, Settings, Shield, LogOut, ChevronRight, ClipboardList, DoorOpen, ShieldCheck, UserCog, Monitor, FileCheck, Clock, Printer, Building2, MessageCircle, Users } from "lucide-react";
import VmsLogo from "@/components/ui/VmsLogo";
import { canAccess, type AppRole } from "@/lib/auth-config";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const role: AppRole = user?.role ?? "staff";

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
        { href: "/web/settings/line-message-templates", label: "LINE OA & แจ้งเตือน", icon: <MessageCircle size={20} />, resource: "settings" },
        { href: "/web/settings/visit-slips", label: "แบบฟอร์ม Visit Slip", icon: <Printer size={20} />, resource: "settings" },
        { href: "/web/settings/pdpa-consent", label: "PDPA / ข้อมูลส่วนบุคคล", icon: <ShieldCheck size={20} />, resource: "settings" },
    ];

    // Filter menu items by role permissions
    const navItems = allNavItems.filter((item) => canAccess(role, item.resource));

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
                        {item.separator ? (
                            <div className="flex items-center px-4 py-3 text-sm font-medium text-white/70 cursor-default select-none">
                                <span className="mr-3 text-white/60">
                                    {item.icon}
                                </span>
                                <span className="flex-1">{item.label}</span>
                            </div>
                        ) : (
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
                        )}
                    </div>
                ))}
            </nav>

            {/* Logout Button - Bottom */}
            <div className="px-3 py-4 border-t border-white/10">
                <button
                    onClick={async () => { await logout(); router.push("/web"); }}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-white/50 hover:text-error hover:bg-white/10 transition-colors text-sm font-medium gap-3"
                >
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </aside>
    );
}
