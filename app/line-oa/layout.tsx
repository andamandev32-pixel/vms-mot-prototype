"use client";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { LiffProvider } from "@/lib/liff/provider";

export default function LineOaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen overflow-hidden">
            <QueryProvider>
                <LiffProvider>{children}</LiffProvider>
            </QueryProvider>
        </div>
    );
}
