"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KioskWalkInPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/kiosk"); }, [router]);
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400 text-sm">Redirecting to Kiosk Demo...</p>
    </div>
  );
}
