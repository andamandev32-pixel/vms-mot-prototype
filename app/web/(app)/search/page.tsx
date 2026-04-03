"use client";

import { useState, useMemo } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Drawer } from "@/components/ui/Drawer";
import {
  Search, X, ChevronLeft, ChevronRight, MoreHorizontal,
  Users, Briefcase, FileText, Wrench, Package, Bookmark,
  LogIn, Eye, Calendar, Clock, MapPin, Building2, UserPlus,
  Loader2,
} from "lucide-react";
import { useAppointments, useEntries } from "@/lib/hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  visitTypes,
  statusConfig,
  appointmentStatusConfig,
  entryStatusConfig,
  type VisitType,
  type VisitStatus,
  type AppointmentStatus,
  type EntryStatus,
  type Appointment,
  type VisitEntry,
} from "@/lib/mock-data";

// ── Tab type ──
type SearchTab = "all" | "appointments" | "entries";

// ── Icons & Colors per visit type ──
const visitTypeIcons: Record<VisitType, React.ReactNode> = {
  official: <Briefcase size={18} />,
  meeting: <Users size={18} />,
  document: <FileText size={18} />,
  contractor: <Wrench size={18} />,
  delivery: <Package size={18} />,
  other: <Bookmark size={18} />,
};

const visitTypeColors: Record<VisitType, { icon: string }> = {
  official: { icon: "text-blue-600" },
  meeting: { icon: "text-purple-600" },
  document: { icon: "text-emerald-600" },
  contractor: { icon: "text-orange-600" },
  delivery: { icon: "text-cyan-600" },
  other: { icon: "text-gray-600" },
};

const checkinChannelLabels: Record<string, string> = {
  kiosk: "Kiosk",
  counter: "เคาน์เตอร์",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Helper: format datetime string to time
function formatTime(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Helper: format datetime string to date
function formatDate(dt: string): string {
  // Extract date portion from ISO string
  return dt.slice(0, 10);
}

// Helper: format date string to Thai Buddhist Era DD/MM/YYYY+543
function fmtDateThai(d: string): string {
  try {
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
  } catch { return d; }
}

export default function WebSearchPage() {
  // ── Filter & pagination state ──
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<VisitType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ── Build API params from filter state ──
  const apptParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    type: filterType !== "all" ? filterType : undefined,
    status: (activeTab !== "entries" && filterStatus !== "all") ? filterStatus : undefined,
    date: todayOnly ? todayDate : undefined,
    page: activeTab === "all" ? 1 : page,
    limit: activeTab === "all" ? 100 : pageSize,
  }), [debouncedSearch, filterType, filterStatus, todayOnly, todayDate, page, pageSize, activeTab]);

  const entryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: (activeTab !== "appointments" && filterStatus !== "all") ? filterStatus : undefined,
    date: todayOnly ? todayDate : undefined,
    page: activeTab === "all" ? 1 : page,
    limit: activeTab === "all" ? 100 : pageSize,
  }), [debouncedSearch, filterStatus, todayOnly, todayDate, page, pageSize, activeTab]);

  // ── Fetch from API with server-side filtering + RBAC ──
  const { data: apptRaw, isLoading: apptLoading } = useAppointments(
    activeTab !== "entries" ? apptParams : undefined
  );
  const { data: entryRaw, isLoading: entryLoading } = useEntries(
    activeTab !== "appointments" ? entryParams : undefined
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apptData = apptRaw as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entryData = entryRaw as any;
  const appointmentsRaw = Array.isArray(apptData) ? apptData : apptData?.appointments ?? [];
  const apptPagination = apptData?.pagination ?? { page: 1, total: 0, totalPages: 1 };

  // Normalize API shape (Prisma fields) → frontend Appointment shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appointments: Appointment[] = useMemo(() => appointmentsRaw.map((a: any) => ({
    ...a,
    code: a.bookingCode ?? a.code,
    host: a.hostStaff ?? a.host ?? { name: "-" },
    date: a.dateStart ? new Date(a.dateStart).toISOString().slice(0, 10) : a.date,
    dateEnd: a.dateEnd ? new Date(a.dateEnd).toISOString().slice(0, 10) : a.dateEnd,
    timeStart: a.timeStart ? new Date(a.timeStart).toISOString().slice(11, 16) : "",
    timeEnd: a.timeEnd ? new Date(a.timeEnd).toISOString().slice(11, 16) : "",
    purposeName: a.visitPurpose?.name ?? a.purpose ?? "-",
    companions: a.companionsCount ?? a._count?.companions ?? a.companions ?? 0,
    visitEntryCount: a._count?.visitEntries ?? a.visitEntryCount ?? 0,
    approvedBy: a.approvedByStaff?.name ?? a.approvedByStaff?.nameEn ?? (a.approvedBy ? `#${a.approvedBy}` : undefined),
    visitor: a.visitor ?? { name: "-", company: "-", phone: "-" },
  })), [appointmentsRaw]);

  const entriesRaw = Array.isArray(entryData) ? entryData : entryData?.entries ?? [];
  const entryPagination = entryData?.pagination ?? { page: 1, total: 0, totalPages: 1 };
  // Normalize entry shape — API returns hostStaff instead of host
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visitEntries: VisitEntry[] = useMemo(() => entriesRaw.map((e: any) => ({
    ...e,
    host: e.hostStaff ?? e.host,
    checkinAt: typeof e.checkinAt === "string" ? e.checkinAt : new Date(e.checkinAt).toISOString(),
    checkoutAt: e.checkoutAt ? (typeof e.checkoutAt === "string" ? e.checkoutAt : new Date(e.checkoutAt).toISOString()) : undefined,
    companions: e.companionsCount ?? e.companions ?? 0,
  })), [entriesRaw]);

  // Detail drawer state
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [detailEntry, setDetailEntry] = useState<VisitEntry | null>(null);

  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("search");
  const flowData = getFlowByPageId("search");
  const apiDoc = getApiDocByPageId("search");

  const isLoading = (activeTab !== "entries" && apptLoading) || (activeTab !== "appointments" && entryLoading);

  // Reset page & status filter when tab changes
  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setFilterStatus("all");
    setPage(1);
  };

  // ── Status options per tab ──
  const statusOptions: { value: string; label: string }[] = (() => {
    if (activeTab === "appointments") {
      return (Object.keys(appointmentStatusConfig) as AppointmentStatus[]).map((s) => ({
        value: s,
        label: `${appointmentStatusConfig[s].label} (${appointmentStatusConfig[s].labelEn})`,
      }));
    }
    if (activeTab === "entries") {
      return (Object.keys(entryStatusConfig) as EntryStatus[]).map((s) => ({
        value: s,
        label: `${entryStatusConfig[s].label} (${entryStatusConfig[s].labelEn})`,
      }));
    }
    // "all" tab — full VisitStatus
    return (Object.keys(statusConfig) as VisitStatus[]).map((s) => ({
      value: s,
      label: `${statusConfig[s].label} (${statusConfig[s].labelEn})`,
    }));
  })();

  // ── Combined results + pagination ──
  // For "appointments" / "entries" tabs: use server-side pagination
  // For "all" tab: merge both arrays and paginate client-side
  type ResultItem =
    | { kind: "appointment"; data: Appointment }
    | { kind: "entry"; data: VisitEntry };

  const { paged, totalCount, totalPages, safeCurrentPage, startRow, endRow } = useMemo(() => {
    if (activeTab === "appointments") {
      const items = appointments.map((a) => ({ kind: "appointment" as const, data: a }));
      const total = apptPagination.total || items.length;
      const pages = apptPagination.totalPages || 1;
      const current = Math.min(page, pages);
      const start = total > 0 ? (current - 1) * pageSize + 1 : 0;
      const end = Math.min(current * pageSize, total);
      return { paged: items, totalCount: total, totalPages: pages, safeCurrentPage: current, startRow: start, endRow: end };
    }
    if (activeTab === "entries") {
      const items = visitEntries.map((e) => ({ kind: "entry" as const, data: e }));
      const total = entryPagination.total || items.length;
      const pages = entryPagination.totalPages || 1;
      const current = Math.min(page, pages);
      const start = total > 0 ? (current - 1) * pageSize + 1 : 0;
      const end = Math.min(current * pageSize, total);
      return { paged: items, totalCount: total, totalPages: pages, safeCurrentPage: current, startRow: start, endRow: end };
    }
    // "all" tab — merge + client-side pagination
    const merged: ResultItem[] = [
      ...appointments.map((a) => ({ kind: "appointment" as const, data: a })),
      ...visitEntries.map((e) => ({ kind: "entry" as const, data: e })),
    ];
    const total = merged.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pages);
    const startIdx = (current - 1) * pageSize;
    const items = merged.slice(startIdx, startIdx + pageSize);
    const start = total > 0 ? startIdx + 1 : 0;
    const end = Math.min(startIdx + pageSize, total);
    return { paged: items, totalCount: total, totalPages: pages, safeCurrentPage: current, startRow: start, endRow: end };
  }, [activeTab, appointments, visitEntries, apptPagination, entryPagination, page, pageSize]);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const hasFilters = search.trim() !== "" || filterType !== "all" || filterStatus !== "all" || !todayOnly;
  const clearAll = () => { setSearch(""); setFilterType("all"); setFilterStatus("all"); setTodayOnly(true); setPage(1); };

  const availableTypes = Object.keys(visitTypes) as VisitType[];

  // Tab config
  const tabs: { key: SearchTab; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "appointments", label: "นัดหมาย" },
    { key: "entries", label: "การเข้าพื้นที่" },
  ];

  return (
    <div>
      <Topbar title="รายชื่อการติดต่อ" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <div className="p-6 space-y-6">
        {/* Page Header with DB/Flow buttons */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Search size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              ค้นหาผู้มาติดต่อ
              {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
              {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h2>
            <p className="text-sm text-text-muted">ค้นหาตามชื่อ/บริษัท/รหัส, กรองตามประเภท/สถานะ/วัน, ดูรายละเอียด</p>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 px-6 py-4">
            <div className="flex justify-between items-center mb-3">
              <CardTitle className="text-base font-bold text-primary">
                รายการผู้มาติดต่อ
              </CardTitle>
              <span className="text-xs text-primary/60 font-medium bg-primary-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                {isLoading && <Loader2 size={12} className="animate-spin" />}
                {totalCount} รายการ · อัปเดตอัตโนมัติ
              </span>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-xl p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder={activeTab === "entries" ? "ค้นหาชื่อ, รหัสเข้า, ผู้พบ..." : "ค้นหาชื่อ, บริษัท, รหัส..."}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-text-muted/60"
                />
                {search && (
                  <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <X size={14} />
                  </button>
                )}
              </div>
              {activeTab !== "entries" && (
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value as VisitType | "all"); setPage(1); }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-text-secondary"
                >
                  <option value="all">ประเภท: ทั้งหมด</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{visitTypes[t].label}</option>
                  ))}
                </select>
              )}
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-text-secondary"
              >
                <option value="all">สถานะ: ทั้งหมด</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={todayOnly}
                  onChange={(e) => { setTodayOnly(e.target.checked); setPage(1); }}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 accent-primary-600 cursor-pointer"
                />
                <span className="text-sm text-text-secondary">วันนี้เท่านั้น</span>
              </label>
              {hasFilters && (
                <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-error hover:bg-error-light rounded-xl transition-colors">
                  <X size={14} /> ล้างตัวกรอง
                </button>
              )}
              {hasFilters && (
                <span className="text-xs text-text-muted bg-gray-100 px-2.5 py-1 rounded-full">
                  พบ {totalCount} รายการ
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Appointments table */}
            {activeTab !== "entries" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-text-muted font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-6">ผู้มาติดต่อ</th>
                    <th className="py-3 px-4">ประเภท</th>
                    <th className="py-3 px-4">เวลา</th>
                    <th className="py-3 px-4">ผู้พบ / แผนก</th>
                    <th className="py-3 px-4">ผู้ติดตาม</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.filter((r) => r.kind === "appointment").length === 0 && activeTab === "appointments" && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Search size={32} className="mx-auto text-text-muted/40 mb-2" />
                        <p className="text-sm text-text-muted">ไม่พบรายการนัดหมายที่ตรงกับเงื่อนไข</p>
                        <button onClick={clearAll} className="text-xs text-primary hover:underline mt-1">ล้างตัวกรองทั้งหมด</button>
                      </td>
                    </tr>
                  )}
                  {paged.filter((r) => r.kind === "appointment").map((r) => {
                    const a = r.data as Appointment;
                    return (
                      <tr key={`appt-${a.id}`} className="hover:bg-primary-50/30 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold shadow-sm uppercase">
                              {a.visitor.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-text-primary block">{a.visitor.name}</span>
                              <span className="text-xs text-text-muted">{a.visitor.company}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={visitTypeColors[a.type]?.icon ?? "text-gray-600"}>{visitTypeIcons[a.type] ?? <Bookmark size={18} />}</span>
                            <span className="text-xs font-medium text-text-secondary">{a.purposeName ?? visitTypes[a.type]?.label ?? a.type}</span>
                          </div>
                          <span className="text-[10px] text-text-muted truncate max-w-[180px] block">{a.purpose}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-medium text-text-primary">{fmtDateThai(a.date)}</p>
                          <p className="text-xs text-text-muted font-mono">{a.timeStart} - {a.timeEnd} น.</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-text-secondary text-sm">{a.host?.name ?? '-'}</span>
                          <span className="block text-xs text-text-muted">{(a as any).department?.name ?? a.host?.department?.name ?? '-'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {a.companions > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-xs font-bold text-primary">
                              +{a.companions}
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={a.status} size="sm" showDot />
                          {a.approvedBy && <p className="text-[10px] text-text-muted mt-0.5">โดย: {a.approvedBy}</p>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => setDetailAppt(a)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-primary" title="ดูรายละเอียด">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Entries table */}
            {activeTab !== "appointments" && (
              <>
                {activeTab === "all" && paged.some((r) => r.kind === "appointment") && paged.some((r) => r.kind === "entry") && (
                  <div className="px-6 py-2 bg-gray-50 border-y border-gray-100">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <LogIn size={14} /> การเข้าพื้นที่
                    </span>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead className={`bg-gray-50 border-b border-gray-100 ${activeTab === "all" ? "" : ""}`}>
                    <tr className="text-left text-text-muted font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-6">ผู้มาติดต่อ</th>
                      <th className="py-3 px-4">รหัส</th>
                      <th className="py-3 px-4">เข้า / ออก</th>
                      <th className="py-3 px-4">ช่องทาง</th>
                      <th className="py-3 px-4">พื้นที่</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.filter((r) => r.kind === "entry").length === 0 && activeTab === "entries" && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Search size={32} className="mx-auto text-text-muted/40 mb-2" />
                          <p className="text-sm text-text-muted">ไม่พบรายการเข้าพื้นที่ที่ตรงกับเงื่อนไข</p>
                          <button onClick={clearAll} className="text-xs text-primary hover:underline mt-1">ล้างตัวกรองทั้งหมด</button>
                        </td>
                      </tr>
                    )}
                    {paged.filter((r) => r.kind === "entry").map((r) => {
                      const e = r.data as VisitEntry;
                      const linkedAppt = e.appointmentId !== null ? appointments.find((a) => a.id === e.appointmentId) : null;
                      return (
                        <tr key={`entry-${e.id}`} className="hover:bg-primary-50/30 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-sm uppercase">
                                {e.visitor.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-text-primary block">{e.visitor.name}</span>
                                <div className="flex items-center gap-1.5">
                                  {e.appointmentId === null ? (
                                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0 rounded-full">
                                      Walk-in
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-text-muted">{linkedAppt?.code ?? `#${e.appointmentId}`}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-mono text-text-secondary">{e.entryCode.replace("eVMS-ENTRY-", "")}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-text-secondary">
                            <span>{formatTime(e.checkinAt)}</span>
                            {e.checkoutAt && (
                              <span className="text-text-muted"> – {formatTime(e.checkoutAt)}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              e.checkinChannel === "kiosk"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600"
                            }`}>
                              {checkinChannelLabels[e.checkinChannel] ?? e.checkinChannel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-text-secondary text-sm">{e.area}</span>
                            <span className="block text-xs text-text-muted">{e.floor}{e.room ? ` · ${e.room}` : ""}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={e.status} size="sm" showDot />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button onClick={() => setDetailEntry(e)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-primary" title="ดูรายละเอียด">
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            {/* Empty state for "all" tab when both are empty */}
            {activeTab === "all" && paged.length === 0 && (
              <div className="py-12 text-center">
                <Search size={32} className="mx-auto text-text-muted/40 mb-2" />
                <p className="text-sm text-text-muted">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                <button onClick={clearAll} className="text-xs text-primary hover:underline mt-1">ล้างตัวกรองทั้งหมด</button>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>แสดง</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span>รายการ / หน้า</span>
              </div>
              <span className="text-xs text-text-muted">
                {startRow}–{endRow} จาก {totalCount} รายการ
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => goTo(safeCurrentPage - 1)} disabled={safeCurrentPage <= 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
          </CardContent>
        </Card>

        {/* ===== Appointment Detail Drawer ===== */}
        <Drawer open={!!detailAppt} onClose={() => setDetailAppt(null)} title="รายละเอียดนัดหมาย" width="w-[560px]">
          {detailAppt && (() => {
            const a = detailAppt;
            return (
              <div className="space-y-5 p-1">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {a.visitor?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">{a.visitor?.name}</h3>
                    <p className="text-sm text-text-muted">{a.visitor?.company}</p>
                  </div>
                  <StatusBadge status={a.status} size="sm" showDot />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><FileText size={12} /> รหัสนัดหมาย</p>
                    <p className="text-sm font-medium font-mono text-text-primary">{a.code}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Bookmark size={12} /> วัตถุประสงค์</p>
                    <p className="text-sm font-medium text-text-primary">{a.purposeName ?? a.purpose}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Calendar size={12} /> วันนัดหมาย</p>
                    <p className="text-sm font-medium text-text-primary">
                      {fmtDateThai(a.date)}
                      {a.entryMode === "period" && a.dateEnd ? ` — ${fmtDateThai(a.dateEnd)}` : ""}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Clock size={12} /> เวลา</p>
                    <p className="text-sm font-medium text-text-primary">{a.timeStart} - {a.timeEnd} น.</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Users size={12} /> ผู้พบ</p>
                    <p className="text-sm font-medium text-text-primary">{a.host?.name ?? "-"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Building2 size={12} /> แผนก</p>
                    <p className="text-sm font-medium text-text-primary">{(a as any).department?.name ?? a.host?.department?.name ?? "-"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><MapPin size={12} /> สถานที่</p>
                    <p className="text-sm font-medium text-text-primary">{a.area ?? "-"} • {a.floor ?? "-"}{a.room ? ` • ${a.room}` : ""}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Users size={12} /> ผู้ติดตาม</p>
                    <p className="text-sm font-medium text-text-primary">{a.companions > 0 ? `${a.companions} คน` : "-"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><UserPlus size={12} /> สร้างโดย</p>
                    <p className="text-sm font-medium text-text-primary">{a.createdBy === "staff" ? "เจ้าหน้าที่" : "ผู้เยี่ยมชม"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><LogIn size={12} /> เข้าพื้นที่</p>
                    <p className="text-sm font-medium text-text-primary">{a.visitEntryCount ?? 0} ครั้ง</p>
                  </div>
                </div>

                {/* Approval info */}
                {a.approvedBy && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-green-700 font-medium">อนุมัติโดย: {a.approvedBy}</p>
                  </div>
                )}
                {a.rejectedReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-red-700 font-medium">เหตุผลที่ปฏิเสธ: {a.rejectedReason}</p>
                  </div>
                )}

                {/* Notes */}
                {a.notes && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-text-muted mb-1">หมายเหตุ</p>
                    <p className="text-sm text-text-primary">{a.notes}</p>
                  </div>
                )}

                {/* Visitor Contact */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                  <p className="text-xs text-text-muted font-semibold">ข้อมูลติดต่อผู้เยี่ยมชม</p>
                  {a.visitor?.phone && <p className="text-sm text-text-primary">โทร: {a.visitor.phone}</p>}
                  {a.visitor?.email && <p className="text-sm text-text-primary">Email: {a.visitor.email}</p>}
                </div>
              </div>
            );
          })()}
        </Drawer>

        {/* ===== Entry Detail Drawer ===== */}
        <Drawer open={!!detailEntry} onClose={() => setDetailEntry(null)} title="รายละเอียดการเข้าพื้นที่" width="w-[560px]">
          {detailEntry && (() => {
            const e = detailEntry;
            const linkedAppt = e.appointmentId != null ? appointments.find((a) => a.id === e.appointmentId) : null;
            return (
              <div className="space-y-5 p-1">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {e.visitor?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">{e.visitor?.name}</h3>
                    {e.appointmentId == null ? (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full">Walk-in</span>
                    ) : (
                      <span className="text-xs text-text-muted">นัดหมาย: {linkedAppt?.code ?? `#${e.appointmentId}`}</span>
                    )}
                  </div>
                  <StatusBadge status={e.status} size="sm" showDot />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted">รหัสเข้าพื้นที่</p>
                    <p className="text-sm font-medium font-mono text-text-primary">{e.entryCode}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted">ช่องทาง Check-in</p>
                    <p className="text-sm font-medium text-text-primary">{checkinChannelLabels[e.checkinChannel] ?? e.checkinChannel}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Clock size={12} /> เวลาเข้า</p>
                    <p className="text-sm font-medium text-text-primary">{fmtDateThai(formatDate(e.checkinAt))} {formatTime(e.checkinAt)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Clock size={12} /> เวลาออก</p>
                    <p className="text-sm font-medium text-text-primary">{e.checkoutAt ? `${fmtDateThai(formatDate(e.checkoutAt))} ${formatTime(e.checkoutAt)}` : "ยังไม่ออก"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><MapPin size={12} /> พื้นที่</p>
                    <p className="text-sm font-medium text-text-primary">{e.area} • {e.floor}{e.room ? ` • ${e.room}` : ""}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted flex items-center gap-1"><Users size={12} /> ผู้พบ</p>
                    <p className="text-sm font-medium text-text-primary">{e.host?.name ?? "-"}</p>
                  </div>
                  {e.purpose && (
                    <div className="col-span-2 space-y-0.5">
                      <p className="text-xs text-text-muted">วัตถุประสงค์</p>
                      <p className="text-sm font-medium text-text-primary">{e.purpose}</p>
                    </div>
                  )}
                </div>

                {e.notes && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-text-muted mb-1">หมายเหตุ</p>
                    <p className="text-sm text-text-primary">{e.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </Drawer>
      </div>
    </div>
  );
}
