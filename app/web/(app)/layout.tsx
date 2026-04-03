import Sidebar from "@/components/web/Sidebar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function WebAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryProvider>
            <AuthProvider>
                <div className="min-h-screen bg-bg web-theme">
                    <Sidebar />
                    <div className="pl-[240px] flex flex-col min-h-screen">
                        {children}
                    </div>
                </div>
            </AuthProvider>
        </QueryProvider>
    );
}
