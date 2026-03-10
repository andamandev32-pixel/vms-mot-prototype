"use client";

import VisitorRichMenu from "@/components/mobile/VisitorRichMenu";
import { RichMenuProvider, useRichMenu } from "@/components/mobile/RichMenuContext";

function MobileAppContent({ children }: { children: React.ReactNode }) {
    const { isMenuOpen } = useRichMenu();
    return (
        <div className="flex flex-col h-full bg-bg">
            <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isMenuOpen ? "pb-[200px]" : "pb-[50px]"}`}>
                {children}
            </div>
            <VisitorRichMenu />
        </div>
    );
}

export default function MobileAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RichMenuProvider>
            <MobileAppContent>{children}</MobileAppContent>
        </RichMenuProvider>
    );
}
