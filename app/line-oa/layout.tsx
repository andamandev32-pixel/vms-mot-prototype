export default function LineOaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Full-screen layout (no mobile wrapper) — same pattern as kiosk
    return <div className="h-screen overflow-hidden">{children}</div>;
}
