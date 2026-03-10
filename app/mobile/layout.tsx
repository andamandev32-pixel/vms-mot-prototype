export default function MobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg flex justify-center">
            <div className="w-full max-w-md h-screen bg-bg relative overflow-hidden">
                <div className="h-full w-full overflow-y-auto no-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
