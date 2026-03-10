import Sidebar from "@/components/web/Sidebar";

export default function WebAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg web-theme">
            <Sidebar />
            <div className="pl-[240px] flex flex-col min-h-screen">
                {children}
            </div>
        </div>
    );
}
