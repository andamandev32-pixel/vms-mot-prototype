"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Copy, CalendarDays, QrCode, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

function BookingStatusContent() {
  const params = useSearchParams();
  const code = params.get("code") || "";
  const status = params.get("status") || "pending_approval";
  const isApproved = status === "approved";

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success animation */}
      <div className="mb-6">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          isApproved ? "bg-emerald-100" : "bg-amber-100"
        }`}>
          {isApproved ? (
            <CheckCircle2 size={40} className="text-emerald-600" />
          ) : (
            <Clock size={40} className="text-amber-600" />
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">
        {isApproved ? "นัดหมายสำเร็จ!" : "ส่งคำขอนัดหมายแล้ว"}
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        {isApproved
          ? "นัดหมายของท่านได้รับการอนุมัติอัตโนมัติแล้ว"
          : "กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัตินัดหมาย"}
      </p>

      {/* Booking code card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <QrCode size={18} className="text-primary" />
          <span className="text-sm text-text-muted font-medium">รหัสนัดหมาย</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <p className="text-2xl font-mono font-bold text-primary tracking-wider">{code}</p>
          <button
            type="button"
            onClick={copyCode}
            className="p-2 rounded-lg hover:bg-gray-100 text-text-muted hover:text-primary transition-colors"
            title="คัดลอกรหัส"
          >
            <Copy size={18} />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-3">กรุณาเก็บรหัสนี้เพื่อใช้ในวันนัดหมาย</p>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${
        isApproved
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}>
        {isApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
        {isApproved ? "อนุมัติแล้ว" : "รอการอนุมัติ"}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/visitor/booking">
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
            <CalendarDays size={16} /> สร้างนัดหมายใหม่
          </Button>
        </Link>
        <Link href="/visitor/history">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            ดูประวัตินัดหมาย <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-text-muted">กำลังโหลด...</div>}>
      <BookingStatusContent />
    </Suspense>
  );
}
