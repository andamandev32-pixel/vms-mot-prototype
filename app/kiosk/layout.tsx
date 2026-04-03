import Link from "next/link";
import { Home } from "lucide-react";
import { KioskAuthProvider } from "@/lib/kiosk/kiosk-auth-context";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function KioskLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryProvider>
        <KioskAuthProvider>
        <div className="min-h-screen bg-[#F4F6FA] overflow-hidden select-none text-[#1B2B5E] selection:bg-[#C8A84E]/30">
            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* Home button — back to prototype */}
            <Link
                href="/"
                className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#1B2B5E]/10 backdrop-blur-md border border-[#1B2B5E]/20 rounded-full px-5 py-3 text-[#1B2B5E]/60 hover:bg-[#1B2B5E]/20 hover:text-[#1B2B5E] transition-all shadow-lg group"
            >
                <Home size={20} />
                <span className="text-sm font-medium">Prototype</span>
            </Link>
        </div>
        </KioskAuthProvider>
        </QueryProvider>
    );
}
