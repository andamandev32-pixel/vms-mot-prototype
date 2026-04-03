import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "eVMS — Visitor Portal",
  description: "ระบบจองนัดหมายสำหรับผู้มาติดต่อ",
};

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg web-theme">{children}</div>;
}
