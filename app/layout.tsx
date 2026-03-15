import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eVMS - Visitor Management System",
  description: "ระบบจัดการผู้มาติดต่อ กระทรวงการท่องเที่ยวและกีฬา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
