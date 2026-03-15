export default function CounterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg web-theme">
            {children}
        </div>
    );
}
