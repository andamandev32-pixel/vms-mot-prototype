export default function CounterAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-bg min-h-screen">
            {children}
        </div>
    );
}
