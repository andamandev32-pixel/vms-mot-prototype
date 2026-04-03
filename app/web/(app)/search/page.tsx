"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Search, X, ChevronLeft, ChevronRight, MoreHorizontal,
  Users, Briefcase, FileText, Wrench, Package, Bookmark,
  LogIn,
} from "lucide-react";
import { useAppointments, useEntries } from "@/lib/hooks";
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
import { getMockToday } from "@/lib/thai-date";

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

export default function WebSearchPage() {
  const { data: apptRaw, isLoading: apptLoading } = useAppointments();
  const { data: entryRaw, isLoading: entryLoading } = useEntries();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apptData = apptRaw as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entryData = entryRaw as any;
  const appointments: Appointment[] = Array.isArray(apptData) ? apptData : apptData?.appointments ?? [];
  const visitEntries: VisitEntry[] = Array.isArray(entryData) ? entryData : entryData?.entries ?? [];

  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("search");
  const flowData = getFlowByPageId("search");
  const apiDoc = getApiDocByPageId("search");

  const allAppts = appointments;
  const allEntries = visitEntries;

  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<VisitType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(true);
  const mockToday = getMockToday();

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

  // ── Filter appointments ──
  const filteredAppts = allAppts.filter((a) => {
    if (todayOnly && a.date !== mockToday) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        a.visitor.name.toLowerCase().includes(q) ||
        (a.visitor.nameEn?.toLowerCase().includes(q)) ||
        a.visitor.company.toLowerCase().includes(q) ||
        a.host.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // ── Filter entries ──
  const filteredEntries = allEntries.filter((e) => {
    if (todayOnly && formatDate(e.checkinAt) !== mockToday) return false;
    if (filterType !== "all") {
      // For appointment-linked entries, we can't easily filter by type unless walk-in has visitType
      if (e.appointmentId === null) {
        if (e.visitType !== filterType) return false;
      } else {
        // Look up the linked appointment to check type
        const linked = allAppts.find((a) => a.id === e.appointmentId);
        if (linked && linked.type !== filterType) return false;
        if (!linked) return false;
      }
    }
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        e.visitor.name.toLowerCase().includes(q) ||
        (e.visitor.nameEn?.toLowerCase().includes(q)) ||
        e.entryCode.toLowerCase().includes(q) ||
        (e.host?.name.toLowerCase().includes(q)) ||
        (e.purpose?.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // ── Combined results ──
  type ResultItem =
    | { kind: "appointment"; data: Appointment }
    | { kind: "entry"; data: VisitEntry };

  const results: ResultItem[] = (() => {
    if (activeTab === "appointments") return filteredAppts.map((a) => ({ kind: "appointment" as const, data: a }));
    if (activeTab === "entries") return filteredEntries.map((e) => ({ kind: "entry" as const, data: e }));
    // "all" — merge both
    return [
      ...filteredAppts.map((a) => ({ kind: "appointment" as const, data: a })),
      ...filteredEntries.map((e) => ({ kind: "entry" as const, data: e })),
    ];
  })();

  const totalCount = results.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const paged = results.slice(startIdx, startIdx + pageSize);
  const startRow = totalCount > 0 ? startIdx + 1 : 0;
  const endRow = Math.min(startIdx + pageSize, totalCount);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const sourceCount = activeTab === "appointments" ? allAppts.length : activeTab === "entries" ? allEntries.length : allAppts.length + allEntries.length;

  const hasFilters = search.trim() !== "" || filterType !== "all" || filterStatus !== "all" || !todayOnly;
  const clearAll = () => { setSearch(""); setFilterType("all"); setFilterStatus("all"); setTodayOnly(true); setPage(1); };

  const availableTypes = Array.from(new Set(allAppts.map((a) => a.type)));

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
              <span className="text-xs text-primary/60 font-medium bg-primary-100 px-3 py-1 rounded-full">
                {sourceCount} รายการ · อัปเดตอัตโนมัติ
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
                  พบ {totalCount} จาก {sourceCount} รายการ
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
                            <span className={visitTypeColors[a.type].icon}>{visitTypeIcons[a.type]}</span>
                            <span className="text-xs font-medium text-text-secondary">{visitTypes[a.type].label}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary font-mono text-xs">
                          {a.timeStart}–{a.timeEnd}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-text-secondary text-sm">{a.host.name}</span>
                          <span className="block text-xs text-text-muted">{a.host.department.name}</span>
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
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-primary">
                            <MoreHorizontal size={18} />
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
                      const linkedAppt = e.appointmentId !== null ? allAppts.find((a) => a.id === e.appointmentId) : null;
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
                            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted hover:text-primary">
                              <MoreHorizontal size={18} />
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
      </div>
    </div>
  );
}
