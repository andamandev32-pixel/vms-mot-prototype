"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Search, Check, X, Eye, Users, AlertTriangle,
  Clock, CheckCircle, Bell, ArrowUpDown, Shield,
  ChevronLeft, ChevronRight, Calendar, MapPin, FileText,
  UserPlus, DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useApprovalQueue,
  useApproveAppointment,
  useRejectAppointment,
  useUpdateAppointment,
  useMyApproverGroups,
  useAppointment,
} from "@/lib/hooks";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ===== Tab types =====
type StatusTab = "pending" | "approved" | "rejected" | "tracking";
const tabs: { key: StatusTab; label: string; icon: React.ReactNode }[] = [
  { key: "pending", label: "รออนุมัติ", icon: <Clock size={14} /> },
  { key: "approved", label: "อนุมัติแล้ว", icon: <CheckCircle size={14} /> },
  { key: "rejected", label: "ปฏิเสธ", icon: <X size={14} /> },
  { key: "tracking", label: "อยู่ในพื้นที่", icon: <DoorOpen size={14} /> },
];

export default function ApprovalsPage() {
  const { user } = useAuth();

  // ─── Approver Groups ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myGroupsRaw } = useMyApproverGroups();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myGroupsData = myGroupsRaw as any;
  const canApproveAll = myGroupsData?.canApproveAll ?? false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myGroups: { id: number; name: string; nameEn: string; departmentId: number; department: any; purposes: any[] }[] =
    myGroupsData?.groups ?? [];

  // ─── State ───
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ─── Approval Queue Data ───
  const { data: queueRaw, isLoading } = useApprovalQueue({
    approverGroupId: selectedGroupId,
    status: activeTab,
    search: searchQuery || undefined,
    page,
    limit: pageSize,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queueData = queueRaw as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appointments: any[] = queueData?.appointments ?? [];
  const pagination = queueData?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };
  const stats = queueData?.stats ?? { pending: 0, approvedToday: 0, rejected: 0, onSite: 0 };

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedGroupId, activeTab, searchQuery]);

  // ─── Toast ───
  interface Toast { id: string; message: string; type: "success" | "error" | "info" | "warning" }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // ─── New Pending Detection ───
  const [newPendingCount, setNewPendingCount] = useState(0);
  const prevPendingIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (activeTab !== "pending" || appointments.length === 0) return;
    const currentIds = new Set(appointments.map((a: any) => a.id as number));
    const prevIds = prevPendingIdsRef.current;
    if (prevIds.size > 0) {
      const brandNew = [...currentIds].filter(id => !prevIds.has(id));
      if (brandNew.length > 0) {
        setNewPendingCount(prev => prev + brandNew.length);
        addToast(`มีรายการใหม่รออนุมัติ ${brandNew.length} รายการ`, "info");
      }
    }
    prevPendingIdsRef.current = currentIds;
  }, [activeTab, appointments, addToast]);

  // ─── Approve / Reject modals ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [approveTarget, setApproveTarget] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detailTarget, setDetailTarget] = useState<any | null>(null);

  // ─── Pagination ───
  const totalPages = pagination.totalPages || 1;
  const safeCurrentPage = Math.min(page, totalPages);
  const startRow = pagination.total > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endRow = Math.min(safeCurrentPage * pageSize, pagination.total);
  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Format date helper
  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear() + 543;
      return `${dd}/${mm}/${yyyy}`;
    } catch { return d; }
  };

  // Map API fields to display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapAppointment = (a: any) => ({
    ...a,
    code: a.bookingCode ?? a.code,
    host: a.hostStaff ?? a.host ?? { name: "-" },
    date: a.dateStart ? new Date(a.dateStart).toISOString().slice(0, 10) : a.date,
    dateEnd: a.dateEnd ? new Date(a.dateEnd).toISOString().slice(0, 10) : a.dateEnd,
    timeStart: a.timeStart ? new Date(a.timeStart).toISOString().slice(11, 16) : "",
    timeEnd: a.timeEnd ? new Date(a.timeEnd).toISOString().slice(11, 16) : "",
    purposeName: a.visitPurpose?.name ?? a.purpose ?? "-",
    companions: a.companionsCount ?? a._count?.companions ?? a.companions ?? 0,
    visitEntries: a.visitEntries ?? [],
    lastEntryStatus: a.visitEntries?.[0]?.status ?? null,
    approvedBy: a.approvedByStaff?.name ?? a.approvedByStaff?.nameEn ?? (a.approvedBy ? `#${a.approvedBy}` : undefined),
    visitor: a.visitor ?? { name: "-", company: "-", phone: "-" },
    departmentName: a.department?.name ?? "-",
  });

  const mappedAppointments = useMemo(() => appointments.map(mapAppointment), [appointments]);

  return (
    <>
      <Topbar title="อนุมัตินัดหมาย" />
      <main className="flex-1 p-6 space-y-6">
        {/* ── Page Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">อนุมัตินัดหมาย</h2>
            <p className="text-sm text-text-muted">
              ตรวจสอบ อนุมัติ/ปฏิเสธ นัดหมาย และติดตามการเข้า-ออกพื้นที่
            </p>
          </div>
        </div>

        {/* ── Group Selector ── */}
        {!canApproveAll && myGroups.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <AlertTriangle size={16} />
            <span>คุณยังไม่ได้อยู่ในกลุ่มผู้อนุมัติใด กรุณาติดต่อผู้ดูแลระบบ</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* "All groups" option */}
            {(canApproveAll || myGroups.length > 1) && (
              <button
                onClick={() => setSelectedGroupId(undefined)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                  selectedGroupId === undefined
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-gray-200 bg-white text-text-secondary hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <Users size={16} />
                <span>{canApproveAll ? "ทุกกลุ่ม (Admin)" : "ทุกกลุ่มของฉัน"}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  stats.pending > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-text-muted"
                )}>
                  {stats.pending}
                </span>
              </button>
            )}

            {/* Individual group buttons */}
            {myGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                  selectedGroupId === group.id
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-gray-200 bg-white text-text-secondary hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <Shield size={16} />
                <div className="text-left">
                  <span>{group.name}</span>
                  <span className="text-[10px] text-text-muted block">{group.department?.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="รออนุมัติ"
            value={stats.pending}
            icon={<Clock size={18} />}
            color="orange"
            highlight={stats.pending > 0}
          />
          <StatCard
            label="อนุมัติวันนี้"
            value={stats.approvedToday}
            icon={<CheckCircle size={18} />}
            color="green"
          />
          <StatCard
            label="ปฏิเสธ"
            value={stats.rejected}
            icon={<X size={18} />}
            color="red"
          />
          <StatCard
            label="อยู่ในพื้นที่"
            value={stats.onSite}
            icon={<DoorOpen size={18} />}
            color="blue"
            highlight={stats.onSite > 0}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {tabs.map(tab => {
              const count =
                tab.key === "pending" ? stats.pending :
                tab.key === "approved" ? stats.approvedToday :
                tab.key === "rejected" ? stats.rejected :
                tab.key === "tracking" ? stats.onSite : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); if (tab.key === "pending") setNewPendingCount(0); }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-white text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={cn(
                    "ml-1 text-xs px-1.5 py-0.5 rounded-full",
                    tab.key === "pending" && count > 0 ? "bg-orange-100 text-orange-700 font-bold" :
                    tab.key === "tracking" && count > 0 ? "bg-green-100 text-green-700 font-bold" :
                    activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-gray-200 text-text-muted"
                  )}>
                    {count}
                  </span>
                  {tab.key === "pending" && newPendingCount > 0 && activeTab !== "pending" && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
                      {newPendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {newPendingCount > 0 && (
            <button
              onClick={() => { setActiveTab("pending"); setNewPendingCount(0); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium"
            >
              <Bell size={16} className="animate-bounce" />
              <span>รายการใหม่ {newPendingCount} รายการ</span>
            </button>
          )}
        </div>

        {/* ── Search Bar ── */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="ค้นหาชื่อ / รหัสนัดหมาย / บริษัท / ผู้พบ"
                leftIcon={<Search size={18} />}
                className="h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" className="h-10 px-4 text-text-muted" onClick={() => { setSearchQuery(""); setPage(1); }}>
              ล้างตัวกรอง
            </Button>
          </CardContent>
        </Card>

        {/* ── Table ── */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-text-muted">
                  <Clock size={20} className="animate-spin" />
                  <span>กำลังโหลดข้อมูล...</span>
                </div>
              </div>
            ) : (
              <>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4">ผู้มาติดต่อ</th>
                      <th className="px-6 py-4">วัตถุประสงค์</th>
                      <th className="px-6 py-4">แผนก</th>
                      <th className="px-6 py-4 whitespace-nowrap">ประเภทการเข้า</th>
                      <th className="px-6 py-4">วันนัดหมาย</th>
                      <th className="px-6 py-4">ผู้พบ</th>
                      <th className="px-6 py-4">ผู้ติดตาม</th>
                      <th className="px-6 py-4">สถานะ</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mappedAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-gray-50 transition-colors group">
                        {/* Visitor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {apt.visitor.name?.[0] ?? "?"}
                            </div>
                            <div>
                              <p className="font-bold text-text-primary">{apt.visitor.name}</p>
                              <p className="text-xs text-text-secondary">{apt.visitor.company}</p>
                            </div>
                          </div>
                        </td>
                        {/* Purpose */}
                        <td className="px-6 py-4">
                          <p className="text-text-primary">{apt.purposeName}</p>
                          <p className="text-xs text-text-muted truncate max-w-[180px]">{apt.purpose}</p>
                        </td>
                        {/* Department */}
                        <td className="px-6 py-4">
                          <p className="text-text-primary text-xs">{apt.departmentName}</p>
                        </td>
                        {/* Entry Mode */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {apt.entryMode === "period" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                              <Calendar size={11} /> ช่วงเวลา
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                              ครั้งเดียว
                            </span>
                          )}
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4">
                          {apt.entryMode === "period" && apt.dateEnd ? (
                            <>
                              <p className="font-medium text-text-primary">{fmtDate(apt.date)} — {fmtDate(apt.dateEnd)}</p>
                              <p className="text-xs text-text-muted">{apt.timeStart} - {apt.timeEnd} น.</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-text-primary">{fmtDate(apt.date)}</p>
                              <p className="text-xs text-text-muted">{apt.timeStart} - {apt.timeEnd} น.</p>
                            </>
                          )}
                        </td>
                        {/* Host */}
                        <td className="px-6 py-4">
                          <p className="text-text-primary">{apt.host?.name ?? "-"}</p>
                          <p className="text-xs text-text-muted">{apt.area} {apt.floor}</p>
                        </td>
                        {/* Companions */}
                        <td className="px-6 py-4">
                          {apt.companions > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-text-muted" />
                              <span className="text-text-primary">{apt.companions} คน</span>
                            </div>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={apt.status} size="sm" />
                          {apt.approvedBy && <p className="text-[10px] text-text-muted mt-1">โดย: {apt.approvedBy}</p>}
                          {apt.lastEntryStatus === "checked-in" && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              อยู่ในพื้นที่
                            </span>
                          )}
                          {apt.lastEntryStatus === "checked-out" && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              ออกแล้ว
                            </span>
                          )}
                          {apt.lastEntryStatus === "overstay" && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                              <AlertTriangle size={10} /> เกินเวลา
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {apt.status === "pending" && (
                              <>
                                <button
                                  onClick={() => setApproveTarget(apt)}
                                  className="h-8 w-8 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center transition-colors border border-green-200"
                                  title="อนุมัติ"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => { setRejectTarget(apt); setRejectReason(""); }}
                                  className="h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors border border-red-200"
                                  title="ปฏิเสธ"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setDetailTarget(apt)}
                              className="h-8 w-8 rounded-full bg-gray-50 text-text-muted hover:bg-white hover:text-primary hover:shadow-sm flex items-center justify-center transition-colors border border-gray-200"
                              title="ดูรายละเอียด"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {mappedAppointments.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-text-muted">
                          {activeTab === "pending" ? "ไม่มีรายการรออนุมัติ" :
                           activeTab === "tracking" ? "ไม่มีผู้เยี่ยมอยู่ในพื้นที่ขณะนี้" :
                           "ไม่พบรายการที่ตรงกับเงื่อนไข"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>แสดง</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span>รายการ / หน้า</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {startRow}–{endRow} จาก {pagination.total} รายการ
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => goTo(safeCurrentPage - 1)} disabled={safeCurrentPage <= 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted">
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                      Math.max(0, safeCurrentPage - 3),
                      safeCurrentPage + 2
                    ).map(p => (
                      <button
                        key={p}
                        onClick={() => goTo(p)}
                        className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${p === safeCurrentPage ? "bg-primary text-white shadow-sm" : "text-text-muted hover:bg-gray-200"}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button onClick={() => goTo(safeCurrentPage + 1)} disabled={safeCurrentPage >= totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ── Approve Modal ── */}
      {approveTarget && (
        <ApproveRejectModal
          type="approve"
          appointment={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={(msg) => { setApproveTarget(null); addToast(msg, "success"); }}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {/* ── Reject Modal ── */}
      {rejectTarget && (
        <ApproveRejectModal
          type="reject"
          appointment={rejectTarget}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          onClose={() => { setRejectTarget(null); setRejectReason(""); }}
          onSuccess={(msg) => { setRejectTarget(null); setRejectReason(""); addToast(msg, "success"); }}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {/* ── Detail Drawer ── */}
      {detailTarget && (
        <AppointmentDetailDrawer appointment={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {/* ── Toasts ── */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
          {toasts.map(t => (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right duration-300",
                t.type === "success" && "bg-green-50 border-green-200 text-green-800",
                t.type === "warning" && "bg-amber-50 border-amber-200 text-amber-800",
                t.type === "info" && "bg-blue-50 border-blue-200 text-blue-800",
                t.type === "error" && "bg-red-50 border-red-200 text-red-800",
              )}
            >
              {t.type === "success" && <CheckCircle size={18} className="flex-shrink-0" />}
              {t.type === "warning" && <AlertTriangle size={18} className="flex-shrink-0" />}
              {t.type === "info" && <Bell size={18} className="flex-shrink-0" />}
              {t.type === "error" && <AlertTriangle size={18} className="flex-shrink-0" />}
              <p className="text-sm font-medium">{t.message}</p>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-auto text-current/50 hover:text-current">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ===== Stats Card =====
function StatCard({ label, value, icon, color, highlight }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "orange" | "green" | "red" | "blue";
  highlight?: boolean;
}) {
  const colorMap = {
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-500" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
  };
  const c = colorMap[color];

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl border",
      c.bg, c.border,
      highlight && "ring-2 ring-offset-1",
      highlight && color === "orange" && "ring-orange-300",
      highlight && color === "blue" && "ring-blue-300",
    )}>
      <div className={cn("p-2 rounded-lg", c.bg, c.icon)}>{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className={cn("text-xl font-bold", c.text)}>{value}</p>
      </div>
    </div>
  );
}

// ===== Approve / Reject Modal =====
function ApproveRejectModal({ type, appointment, rejectReason, onRejectReasonChange, onClose, onSuccess, onError }: {
  type: "approve" | "reject";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointment: any;
  rejectReason?: string;
  onRejectReasonChange?: (v: string) => void;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const approveMut = useApproveAppointment();
  const rejectMut = useRejectAppointment();
  const [submitting, setSubmitting] = useState(false);

  const isApprove = type === "approve";
  const canSubmit = isApprove || (rejectReason?.trim().length ?? 0) > 0;

  const handleConfirm = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (isApprove) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await approveMut.mutateAsync({ id: appointment.id } as any);
        onSuccess(`อนุมัตินัดหมาย ${appointment.code ?? ""} เรียบร้อยแล้ว`);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await rejectMut.mutateAsync({ id: appointment.id, reason: rejectReason?.trim() ?? "" } as any);
        onSuccess(`ปฏิเสธนัดหมาย ${appointment.code ?? ""} เรียบร้อยแล้ว`);
      }
    } catch {
      onError(isApprove ? "ไม่สามารถอนุมัติได้ กรุณาลองใหม่" : "ไม่สามารถปฏิเสธได้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear() + 543}`;
    } catch { return d; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={cn(
          "px-6 py-4 flex items-center gap-3",
          isApprove ? "bg-green-50 border-b border-green-100" : "bg-red-50 border-b border-red-100"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isApprove ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            {isApprove ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <h3 className="font-bold text-text-primary">{isApprove ? "ยืนยันอนุมัตินัดหมาย" : "ปฏิเสธนัดหมาย"}</h3>
            <p className="text-xs text-text-muted">{isApprove ? "กรุณาตรวจสอบข้อมูลก่อนอนุมัติ" : "กรุณาระบุเหตุผลในการปฏิเสธ"}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-white/80 text-text-muted"><X size={18} /></button>
        </div>

        {/* Appointment Info */}
        <div className="px-6 py-4 space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {appointment.visitor?.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-bold text-sm text-text-primary">{appointment.visitor?.name ?? "-"}</p>
                <p className="text-xs text-text-muted">{appointment.visitor?.company ?? "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">รหัส:</span>
                <span className="ml-1 font-medium">{appointment.code ?? "-"}</span>
              </div>
              <div>
                <span className="text-text-muted">วันที่:</span>
                <span className="ml-1 font-medium">{appointment.date ? fmtDate(appointment.date) : "-"}</span>
              </div>
              <div>
                <span className="text-text-muted">เวลา:</span>
                <span className="ml-1 font-medium">{appointment.timeStart} - {appointment.timeEnd}</span>
              </div>
              <div>
                <span className="text-text-muted">วัตถุประสงค์:</span>
                <span className="ml-1 font-medium">{appointment.purposeName ?? appointment.purpose ?? "-"}</span>
              </div>
              <div>
                <span className="text-text-muted">แผนก:</span>
                <span className="ml-1 font-medium">{appointment.departmentName ?? "-"}</span>
              </div>
              {appointment.host?.name && (
                <div>
                  <span className="text-text-muted">ผู้พบ:</span>
                  <span className="ml-1 font-medium">{appointment.host.name}</span>
                </div>
              )}
              {appointment.companions > 0 && (
                <div>
                  <span className="text-text-muted">ผู้ติดตาม:</span>
                  <span className="ml-1 font-medium">{appointment.companions} คน</span>
                </div>
              )}
            </div>
          </div>

          {/* Reject reason */}
          {!isApprove && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => onRejectReasonChange?.(e.target.value)}
                placeholder="กรุณาระบุเหตุผล เช่น เอกสารไม่ครบ, วันที่ไม่สะดวก..."
                rows={3}
                className="flex w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:border-red-300 resize-none"
                autoFocus
              />
              {rejectReason !== undefined && rejectReason.trim().length === 0 && (
                <p className="text-[11px] text-red-500 mt-1">กรุณาระบุเหตุผล</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-gray-50/50">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>ยกเลิก</Button>
          <Button
            variant={isApprove ? "secondary" : "destructive"}
            onClick={handleConfirm}
            disabled={!canSubmit || submitting}
            className={cn(isApprove && "bg-green-600 hover:bg-green-700 text-white")}
          >
            {submitting ? (
              <span className="flex items-center gap-2"><Clock size={14} className="animate-spin" /> กำลังดำเนินการ...</span>
            ) : isApprove ? (
              <span className="flex items-center gap-1.5"><Check size={16} /> อนุมัติ</span>
            ) : (
              <span className="flex items-center gap-1.5"><X size={16} /> ปฏิเสธ</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== Appointment Detail Drawer =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AppointmentDetailDrawer({ appointment, onClose }: { appointment: any; onClose: () => void }) {
  const { data: detailRaw } = useAppointment(appointment.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail = (detailRaw as any)?.appointment ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusLogs: any[] = detail?.statusLogs ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visitEntries: any[] = detail?.visitEntries ?? [];

  const [historyTab, setHistoryTab] = useState<"status" | "entry">("status");

  // ── Edit mode ──
  const [isEditing, setIsEditing] = useState(false);
  const [editTimeStart, setEditTimeStart] = useState(appointment.timeStart ?? "");
  const [editTimeEnd, setEditTimeEnd] = useState(appointment.timeEnd ?? "");
  const [editNotes, setEditNotes] = useState(appointment.notes ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const updateMut = useUpdateAppointment();

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      await updateMut.mutateAsync({
        id: appointment.id,
        timeStart: editTimeStart,
        timeEnd: editTimeEnd,
        notes: editNotes,
      });
      setIsEditing(false);
    } catch {
      // error handled by mutation
    } finally {
      setEditSaving(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear() + 543}`;
    } catch { return d; }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border z-10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">รายละเอียดนัดหมาย</h2>
            <p className="text-xs text-text-muted font-mono">{appointment.code}</p>
          </div>
          <div className="flex items-center gap-2">
            {appointment.status === "pending" && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <FileText size={14} /> แก้ไข
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-2 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Visitor info */}
          <DetailSection title="ผู้มาติดต่อ">
            <DetailRow label="ชื่อ" value={appointment.visitor?.name} />
            <DetailRow label="บริษัท" value={appointment.visitor?.company} />
            <DetailRow label="โทรศัพท์" value={appointment.visitor?.phone} />
          </DetailSection>

          {/* Appointment details */}
          <DetailSection title="รายละเอียดนัดหมาย">
            <DetailRow label="วัตถุประสงค์" value={appointment.purposeName ?? appointment.purpose} />
            <DetailRow label="แผนก" value={appointment.departmentName} />
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-text-secondary flex-shrink-0">ประเภทการเข้า</span>
              {appointment.entryMode === "period" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  <Calendar size={11} /> ช่วงเวลา
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  ครั้งเดียว
                </span>
              )}
            </div>
            {appointment.entryMode === "period" && appointment.dateEnd ? (
              <>
                <DetailRow label="วันเริ่ม" value={fmtDate(appointment.date)} />
                <DetailRow label="วันสิ้นสุด" value={fmtDate(appointment.dateEnd)} />
              </>
            ) : (
              <DetailRow label="วันที่" value={fmtDate(appointment.date)} />
            )}
            {isEditing ? (
              <div className="space-y-2">
                <label className="text-xs text-text-muted">เวลา</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={editTimeStart}
                    onChange={(e) => setEditTimeStart(e.target.value)}
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-text-muted">-</span>
                  <input
                    type="time"
                    value={editTimeEnd}
                    onChange={(e) => setEditTimeEnd(e.target.value)}
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            ) : (
              <DetailRow label="เวลา" value={`${appointment.timeStart} - ${appointment.timeEnd}`} />
            )}
            <DetailRow label="ผู้พบ" value={appointment.host?.name ?? "-"} />
            <DetailRow label="สถานที่" value={`${appointment.area ?? ""} ${appointment.floor ?? ""}`} />
          </DetailSection>

          {/* Editable Notes */}
          {isEditing ? (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide">หมายเหตุ</h3>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="เพิ่มหมายเหตุ / เงื่อนไขเพิ่มเติม..."
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          ) : appointment.notes ? (
            <DetailSection title="หมายเหตุ">
              <p className="text-sm text-text-primary">{appointment.notes}</p>
            </DetailSection>
          ) : null}

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={editSaving}>ยกเลิก</Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {editSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </Button>
            </div>
          )}

          {/* Companions */}
          {appointment.companions > 0 && (
            <DetailSection title="ผู้ติดตาม">
              <DetailRow label="จำนวน" value={`${appointment.companions} คน`} />
            </DetailSection>
          )}

          {/* Status */}
          <DetailSection title="สถานะ">
            <div className="flex items-center gap-2">
              <StatusBadge status={appointment.status} />
            </div>
            {appointment.approvedBy && <DetailRow label="อนุมัติโดย" value={appointment.approvedBy} />}
            {appointment.rejectedReason && <DetailRow label="เหตุผลปฏิเสธ" value={appointment.rejectedReason} />}
          </DetailSection>

          {/* History Tabs */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setHistoryTab("status")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  historyTab === "status" ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
              >
                ประวัติการขอ ({statusLogs.length})
              </button>
              <button
                onClick={() => setHistoryTab("entry")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  historyTab === "entry" ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
              >
                รายละเอียดการเข้าพื้นที่ ({visitEntries.length})
              </button>
            </div>

            {historyTab === "status" && (
              statusLogs.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-2">ยังไม่มีประวัติ</p>
              ) : (
                <div className="space-y-2">
                  {statusLogs.map((log: any, idx: number) => (
                    <div key={log.id ?? idx} className="bg-white rounded-lg border border-border p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {log.fromStatus ? (
                            <>
                              <StatusBadge status={log.fromStatus} size="sm" />
                              <span className="text-xs text-text-muted">→</span>
                            </>
                          ) : (
                            <span className="text-xs text-text-muted mr-1">สร้างรายการ →</span>
                          )}
                          <StatusBadge status={log.toStatus} size="sm" />
                        </div>
                        <span className="text-[11px] text-text-muted">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : ""}
                        </span>
                      </div>
                      {log.changedByStaff && <p className="text-xs text-text-secondary">โดย: {log.changedByStaff.name ?? log.changedByStaff.nameEn}</p>}
                      {!log.changedByStaff && !log.changedBy && <p className="text-xs text-text-secondary">โดย: ผู้เยี่ยมชม</p>}
                      {log.reason && <p className="text-xs text-text-muted">เหตุผล: {log.reason}</p>}
                    </div>
                  ))}
                </div>
              )
            )}

            {historyTab === "entry" && (
              visitEntries.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-2">ยังไม่มีรายการเข้าพื้นที่</p>
              ) : (
                <div className="space-y-3">
                  {visitEntries.map((entry: any, idx: number) => (
                    <div key={entry.id} className="bg-white rounded-xl border border-border p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {visitEntries.length - idx}
                          </span>
                          <span className="text-xs font-mono text-text-muted">{entry.entryCode ?? `#${entry.id}`}</span>
                        </div>
                        <StatusBadge status={entry.status} size="sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-2.5">
                        <div>
                          <p className="text-[10px] uppercase text-text-muted font-medium">เข้าพื้นที่</p>
                          <p className="text-sm font-medium text-green-700">
                            {entry.checkinAt ? new Date(entry.checkinAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-text-muted font-medium">ออกพื้นที่</p>
                          <p className={cn("text-sm font-medium", entry.checkoutAt ? "text-blue-700" : "text-amber-600")}>
                            {entry.checkoutAt ? new Date(entry.checkoutAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "ยังอยู่ในพื้นที่"}
                          </p>
                        </div>
                      </div>
                      {entry.checkinChannel && (
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-text-secondary">ช่องทาง</span>
                          <span className="text-text-primary font-medium">
                            {entry.checkinChannel === "kiosk" ? "Kiosk" : entry.checkinChannel === "counter" ? "Counter" : entry.checkinChannel}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <div className="p-6 pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </div>
  );
}

// ===== Helper components =====
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-secondary flex-shrink-0">{label}</span>
      <span className="text-text-primary font-medium text-right">{value ?? "-"}</span>
    </div>
  );
}
