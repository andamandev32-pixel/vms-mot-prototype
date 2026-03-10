import Link from "next/link";
import { Home } from "lucide-react";

export default function KioskLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#2E0249] via-[#4B0082] to-[#6A0DAD] overflow-hidden select-none text-white selection:bg-accent/50">
            {/* Background Texture/Pattern */}
            <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')",
                backgroundSize: "200px"
            }}></div>

            {/* Ambient Light Orbs */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary-light rounded-full blur-[128px] opacity-20 animate-pulse"></div>
            <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-accent rounded-full blur-[150px] opacity-10"></div>

            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* Home button — back to prototype */}
            <Link
                href="/"
                className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-3 text-white/60 hover:bg-white/20 hover:text-white transition-all shadow-lg group"
            >
                <Home size={20} />
                <span className="text-sm font-medium">Prototype</span>
            </Link>
        </div>
    );
}
