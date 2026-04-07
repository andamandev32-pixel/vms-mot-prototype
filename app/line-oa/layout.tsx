import { QueryProvider } from "@/components/providers/QueryProvider";

export default function LineOaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen overflow-hidden">
            <QueryProvider>{children}</QueryProvider>
        </div>
    );
}
