import { Bell, Search, User, ChevronDown } from "lucide-react";

export default function Topbar({ title }: { title: string }) {
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
                <div className="ml-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        SM
                    </div>
                    <ChevronDown size={14} className="text-text-muted" />
                </div>
            </div>
        </header>
    );
}
