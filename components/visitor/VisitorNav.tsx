"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, History, User, LogOut } from "lucide-react";
import { useVisitorAuth } from "@/components/providers/VisitorAuthProvider";

const navItems = [
  { href: "/visitor/booking", label: "จองนัดหมาย", icon: CalendarPlus },
  { href: "/visitor/history", label: "ประวัติ", icon: History },
  { href: "/visitor/profile", label: "โปรไฟล์", icon: User },
];

export default function VisitorNav() {
  const pathname = usePathname();
  const { visitor, logout } = useVisitorAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/visitor/booking" className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-primary">eVMS</span>
          <span className="text-xs text-text-muted font-light hidden sm:inline">Visitor Portal</span>
        </Link>

        {/* Nav items */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary-50 text-primary"
                    : "text-text-secondary hover:text-primary hover:bg-gray-50"
                }`}
              >
                <item.icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* User info + logout */}
          <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-2">
            {visitor && (
              <span className="text-xs text-text-muted hidden md:inline">
                {visitor.firstName} {visitor.lastName}
              </span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-error hover:bg-error-light transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
