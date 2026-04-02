"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users, Calendar, Clock, ChevronLeft, ChevronRight, Bell, BellOff,
  CheckCircle, XCircle, RefreshCw, ArrowLeft, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ═══════ Types ═══════

interface GroupSummary {
  id: number;
  name: string;
  nameEn?: string;
  entryMode: string;
  dateStart: string;
  dateEnd?: string;
  timeStart: string;
  timeEnd: string;
  totalExpected: number;
  notifyOnCheckin: boolean;
  status: string;
  room?: string;
  building?: string;
  floor?: string;
  visitPurpose: { id: number; name: string; icon?: string };
  department: { id: number; name: string };
  createdByStaff: { id: number; name: string };
  stats: { totalExpected: number; arrivedToday: number; notArrivedToday: number };
}

interface GroupDetail {
  group: GroupSummary & { daySchedules: Array<{ date: string; timeStart: string; timeEnd: string; notes?: string }> };
  dateFilter: string;
  availableDates: string[];
  todaySchedule: { timeStart: string; timeEnd: string; notes?: string };
  stats: {
    total: number;
    arrivedToday: number;
    notArrivedToday: number;
    checkedOutToday: number;
    arrivedAllDays: number;
    neverArrived: number;
  };
  appointments: Array<{
    id: number;
    bookingCode: string;
    status: string;
    notifyOnCheckin: boolean;
    visitor: { id: number; name: string; company?: string; phone?: string };
    todayEntry: { entryId: number; status: string; checkinAt: string; checkoutAt?: string } | null;
    allEntries: Array<{ date: string; entryId: number | null; status: string | null; checkinAt: string | null; checkoutAt: string | null }>;
  }>;
}

// ═══════ Mock/Fetch helpers ═══════

async function fetchGroups(): Promise<GroupSummary[]> {
  try {
    const res = await fetch("/api/appointments/groups?createdBy=me", { credentials: "include" });
    const json = await res.json();
    return json.success ? json.data.groups : [];
  } catch {
    return [];
  }
}

async function fetchGroupDetail(id: number, date?: string): Promise<GroupDetail | null> {
  try {
    const url = `/api/appointments/groups/${id}${date ? `?date=${date}` : ""}`;
    const res = await fetch(url, { credentials: "include" });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

async function toggleGroupNotify(id: number, value: boolean) {
  await fetch(`/api/appointments/groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ notifyOnCheckin: value }),
  });
}

async function toggleAppointmentNotify(id: number, value: boolean) {
  await fetch(`/api/appointments/${id}/notify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ notifyOnCheckin: value }),
  });
}

// ═══════ Format helpers ═══════

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatTime(t: string) {
  if (!t) return "";
  if (t.includes("T")) return new Date(t).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return t.slice(0, 5);
}

// ═══════ Page Component ═══════

export default function AppointmentGroupsPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "arrived" | "not-arrived" | "never">("all");
  const [loading, setLoading] = useState(false);

  // Load groups
  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  // Load detail when group selected
  const loadDetail = useCallback(async (groupId: number, date?: string) => {
    setLoading(true);
    const d = await fetchGroupDetail(groupId, date);
    setDetail(d);
    if (d) setSelectedDate(d.dateFilter);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedGroupId) loadDetail(selectedGroupId, selectedDate ?? undefined);
  }, [selectedGroupId, loadDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!selectedGroupId) return;
    const interval = setInterval(() => {
      loadDetail(selectedGroupId, selectedDate ?? undefined);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedGroupId, selectedDate, loadDetail]);

  // Filter appointments
  const filteredAppointments = detail?.appointments.filter((a) => {
    if (filter === "arrived") return a.todayEntry !== null;
    if (filter === "not-arrived") return a.todayEntry === null;
    if (filter === "never") return a.allEntries.every((e) => e.entryId === null);
    return true;
  }) ?? [];

  // ═══════ Group List View ═══════
  if (!selectedGroupId) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Topbar title="กลุ่มนัดหมาย — Arrival Dashboard" />
        <div className="max-w-6xl mx-auto p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/web/appointments" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft size={16} /> กลับหน้านัดหมาย
            </Link>
            <Button variant="outline" size="sm" onClick={() => fetchGroups().then(setGroups)}>
              <RefreshCw size={14} className="mr-1.5" /> รีเฟรช
            </Button>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-text-muted">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">ยังไม่มีกลุ่มนัดหมาย</p>
                <p className="text-sm mt-1">สร้างนัดหมายแบบ Batch จากหน้านัดหมาย</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {groups.map((g) => (
                <Card key={g.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setSelectedGroupId(g.id)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{g.visitPurpose.icon}</span>
                          <h3 className="font-bold text-text-primary">{g.name}</h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", g.status === "active" ? "bg-green-100 text-green-700" : g.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>{g.status}</span>
                          {g.entryMode === "period" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">หลายวัน</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                          <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(g.dateStart)}{g.dateEnd ? ` - ${formatDate(g.dateEnd)}` : ""}</span>
                          <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(g.timeStart)}-{formatTime(g.timeEnd)}</span>
                          <span>{g.department.name}</span>
                          <span>สร้างโดย: {g.createdByStaff.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">{g.stats.arrivedToday}/{g.totalExpected}</div>
                        <p className="text-[11px] text-text-muted">มาแล้ววันนี้</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${g.totalExpected > 0 ? (g.stats.arrivedToday / g.totalExpected) * 100 : 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════ Group Detail View ═══════
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Topbar title={detail?.group.name ?? "กลุ่มนัดหมาย — Arrival Dashboard"} />
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {/* Back button */}
        <button onClick={() => { setSelectedGroupId(null); setDetail(null); }} className="flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> กลับรายการกลุ่ม
        </button>

        {loading && !detail ? (
          <Card><CardContent className="py-12 text-center text-text-muted">กำลังโหลด...</CardContent></Card>
        ) : detail ? (
          <>
            {/* Date selector (for period groups) */}
            {detail.availableDates.length > 1 && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-border p-3">
                <Calendar size={16} className="text-purple-600" />
                <span className="text-sm font-bold text-purple-700 mr-2">วันที่:</span>
                {detail.availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); loadDetail(selectedGroupId!, d); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      d === detail.dateFilter
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-text-secondary hover:bg-purple-100"
                    )}
                  >
                    {formatDate(d)}
                  </button>
                ))}
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-black text-primary">{detail.stats.arrivedToday}</div>
                <p className="text-xs text-text-muted mt-1">มาแล้ววันนี้</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-black text-amber-600">{detail.stats.notArrivedToday}</div>
                <p className="text-xs text-text-muted mt-1">ยังไม่มาวันนี้</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-black text-green-600">{detail.stats.checkedOutToday}</div>
                <p className="text-xs text-text-muted mt-1">Checkout แล้ว</p>
              </CardContent></Card>
              {detail.availableDates.length > 1 && (
                <>
                  <Card><CardContent className="p-4 text-center">
                    <div className="text-2xl font-black text-blue-600">{detail.stats.arrivedAllDays}</div>
                    <p className="text-xs text-text-muted mt-1">มาอย่างน้อย 1 วัน</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center">
                    <div className="text-2xl font-black text-red-600">{detail.stats.neverArrived}</div>
                    <p className="text-xs text-text-muted mt-1">ไม่มาเลย</p>
                  </CardContent></Card>
                </>
              )}
            </div>

            {/* Progress bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">ความคืบหน้าวันนี้: {detail.stats.arrivedToday}/{detail.stats.total} ({detail.stats.total > 0 ? Math.round((detail.stats.arrivedToday / detail.stats.total) * 100) : 0}%)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">แจ้งเตือน check-in:</span>
                    <button
                      onClick={async () => {
                        const newVal = !detail.group.notifyOnCheckin;
                        await toggleGroupNotify(detail.group.id, newVal);
                        loadDetail(selectedGroupId!, selectedDate ?? undefined);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors",
                        detail.group.notifyOnCheckin
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 text-text-muted"
                      )}
                    >
                      {detail.group.notifyOnCheckin ? <Bell size={12} /> : <BellOff size={12} />}
                      {detail.group.notifyOnCheckin ? "เปิด" : "ปิด"}
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary rounded-full h-3 transition-all"
                    style={{ width: `${detail.stats.total > 0 ? (detail.stats.arrivedToday / detail.stats.total) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filter tabs */}
            <div className="flex items-center gap-2">
              {(["all", "arrived", "not-arrived", "never"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    filter === f ? "bg-primary text-white" : "bg-white border border-border text-text-secondary hover:bg-gray-50"
                  )}
                >
                  {f === "all" ? `ทั้งหมด (${detail.stats.total})`
                    : f === "arrived" ? `มาแล้ว (${detail.stats.arrivedToday})`
                    : f === "not-arrived" ? `ยังไม่มา (${detail.stats.notArrivedToday})`
                    : `ไม่มาเลย (${detail.stats.neverArrived})`}
                </button>
              ))}
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => loadDetail(selectedGroupId!, selectedDate ?? undefined)}>
                  <RefreshCw size={14} className="mr-1.5" /> รีเฟรช
                </Button>
              </div>
            </div>

            {/* Appointment table */}
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-3">ชื่อ</th>
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-3">บริษัท</th>
                      <th className="text-center text-xs font-bold text-text-secondary px-4 py-3">วันนี้</th>
                      {detail.availableDates.length > 1 && detail.availableDates.map((d) => (
                        <th key={d} className="text-center text-xs font-bold text-text-secondary px-3 py-3">
                          {formatDate(d)}
                        </th>
                      ))}
                      <th className="text-center text-xs font-bold text-text-secondary px-4 py-3">แจ้งเตือน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-text-primary">{a.visitor.name}</p>
                          <p className="text-[11px] text-text-muted">{a.visitor.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{a.visitor.company ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {a.todayEntry ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                              <CheckCircle size={14} />
                              {formatTime(a.todayEntry.checkinAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>
                        {detail.availableDates.length > 1 && a.allEntries.map((e) => (
                          <td key={e.date} className="px-3 py-3 text-center">
                            {e.entryId ? (
                              <span className="text-green-600"><CheckCircle size={14} className="mx-auto" /></span>
                            ) : (
                              <span className="text-gray-300"><XCircle size={14} className="mx-auto" /></span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={async () => {
                              await toggleAppointmentNotify(a.id, !a.notifyOnCheckin);
                              loadDetail(selectedGroupId!, selectedDate ?? undefined);
                            }}
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                              a.notifyOnCheckin ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                            )}
                          >
                            {a.notifyOnCheckin ? <Bell size={13} /> : <BellOff size={13} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAppointments.length === 0 && (
                  <div className="py-8 text-center text-text-muted text-sm">ไม่พบรายการ</div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card><CardContent className="py-12 text-center text-text-muted">ไม่พบข้อมูลกลุ่ม</CardContent></Card>
        )}
      </div>
    </div>
  );
}
