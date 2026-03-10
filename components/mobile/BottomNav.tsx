import Link from "next/link";
import { Home, Calendar, History, Bell, User } from "lucide-react";

export default function MobileBottomNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 h-[80px] rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-start">
            <NavItem href="/mobile/dashboard" icon={<Home size={24} />} label="หลัก" active />
            <NavItem href="/mobile/booking" icon={<Calendar size={24} />} label="จอง" />
            <NavItem href="/mobile/history" icon={<History size={24} />} label="ประวัติ" />
            <NavItem href="/mobile/notifications" icon={<Bell size={24} />} label="แจ้งเตือน" />
            <NavItem href="/mobile/profile" icon={<User size={24} />} label="โปรไฟล์" />
        </div>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link href={href} className={`flex flex-col items-center gap-1 ${active ? "text-primary" : "text-text-muted hover:text-text-secondary"}`}>
            <div className={`p-1 rounded-xl transition-all ${active ? "bg-primary/10" : ""}`}>
                {icon}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}
