export default function CounterAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-bg h-screen overflow-hidden web-theme">
            {children}
        </div>
    );
}
