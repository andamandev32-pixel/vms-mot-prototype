import { QueryProvider } from "@/components/providers/QueryProvider";

export default function CounterAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryProvider>
            <div className="bg-bg h-screen overflow-hidden web-theme">
                {children}
            </div>
        </QueryProvider>
    );
}
