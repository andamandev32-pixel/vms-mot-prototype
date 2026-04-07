"use client";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { LiffProvider } from "@/lib/liff/provider";

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <LiffProvider>
        <div className="min-h-screen bg-bg flex justify-center">
          <div className="w-full max-w-md min-h-screen bg-bg relative">
            <div className="w-full min-h-screen overflow-y-auto no-scrollbar">
              {children}
            </div>
          </div>
        </div>
      </LiffProvider>
    </QueryProvider>
  );
}
