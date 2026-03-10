import OfficerRichMenu from "@/components/mobile/OfficerRichMenu";

export default function OfficerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-full bg-bg">
            <div className="flex-1 overflow-y-auto pb-[160px]">
                {children}
            </div>
            <OfficerRichMenu />
        </div>
    );
}
