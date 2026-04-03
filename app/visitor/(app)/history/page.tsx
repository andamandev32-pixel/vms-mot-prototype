"use client";

import { useState, useEffect } from "react";
import { useVisitorAuth } from "@/components/providers/VisitorAuthProvider";
import { CalendarDays, Clock, Check, X, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Appointment {
  id: number;
  bookingCode: string;
  status: string;
  dateStart: string;
  timeStart: string;
  timeEnd: string;
  purpose: string;
  createdAt: string;
  visitPurpose: { name: string; icon: string | null };
  department: { name: string };
  hostStaff: { name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  approved: { label: "อนุมัติแล้ว", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Check size={12} /> },
  pending_approval: { label: "รอการอนุมัติ", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={12} /> },
  rejected: { label: "ถูกปฏิเสธ", color: "bg-red-50 text-red-700 border-red-200", icon: <X size={12} /> },
  cancelled: { label: "ยกเลิก", color: "bg-gray-50 text-gray-500 border-gray-200", icon: <X size={12} /> },
  checked_in: { label: "เข้าพบแล้ว", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Check size={12} /> },
  checked_out: { label: "ออกแล้ว", color: "bg-gray-50 text-gray-600 border-gray-200", icon: <Check size={12} /> },
};

export default function VisitorHistoryPage() {
  const { visitor } = useVisitorAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (filter !== "all") params.set("status", filter);
        const res = await fetch(`/api/appointments?${params}`);
        const json = await res.json();
        if (json.success) {
          setAppointments(json.data.appointments || []);
        }
      } catch (e) {
        console.error("Failed to load appointments:", e);
      } finally {
        setLoading(false);
      }
    }
    if (visitor) load();
  }, [visitor, filter]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch { return d; }
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    if (t.includes("T")) return t.split("T")[1]?.slice(0, 5) || t;
    return t.slice(0, 5);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">ประวัตินัดหมาย</h1>
        <Link href="/visitor/booking">
          <Button size="sm" className="flex items-center gap-1">
            <CalendarDays size={14} /> สร้างนัดหมาย
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "pending_approval", label: "รออนุมัติ" },
          { key: "approved", label: "อนุมัติ" },
          { key: "checked_in", label: "เข้าพบแล้ว" },
          { key: "rejected", label: "ปฏิเสธ" },
          { key: "cancelled", label: "ยกเลิก" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setFilter(f.key); setLoading(true); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-muted hover:bg-gray-200"
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-text-muted text-sm">ยังไม่มีประวัตินัดหมาย</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const sc = statusConfig[appt.status] || statusConfig["pending_approval"];
            return (
              <div key={appt.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{appt.visitPurpose?.icon || "📋"}</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{appt.visitPurpose?.name}</p>
                      <p className="text-xs text-text-muted">{appt.department?.name}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.color}`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted mb-2">
                  <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(appt.dateStart)}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(appt.timeStart)} - {formatTime(appt.timeEnd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-primary">{appt.bookingCode}</p>
                  {appt.hostStaff && (
                    <p className="text-xs text-text-muted">พบ: {appt.hostStaff.name}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
