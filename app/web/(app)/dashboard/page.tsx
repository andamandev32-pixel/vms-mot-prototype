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
  Users, Clock, ArrowUpRight, ArrowDown, AlertTriangle, Ban,
  Building2, Briefcase, FileText, Wrench, Package, MoreHorizontal,
  CalendarClock, CheckCircle2, XCircle, Timer, UserCheck, LogOut, Bookmark,
  ChevronLeft, ChevronRight, Search, X, Database, Code2
} from "lucide-react";
import { useDashboardKPIs, useDashboardToday } from "@/lib/hooks";
import {
  visitTypes,
  statusConfig,
  type VisitType,
  type VisitStatus,
  type AppointmentStatus,
  type EntryStatus,
} from "@/lib/mock-data";

// Format time value from DB (Date or string) to "HH:MM"
function fmtTime(v: unknown): string {
  if (!v) return "—";
  if (typeof v === "string") {
    // Already "HH:MM" or ISO string
    if (/^\d{2}:\d{2}/.test(v)) return v.slice(0, 5);
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(11, 16);
    return v;
  }
  if (v instanceof Date) return v.toISOString().slice(11, 16);
  return String(v);
}

const visitTypeIcons: Record<VisitType, React.ReactNode> = {
  official: <Briefcase size={22} />,
  meeting: <Users size={22} />,
  document: <FileText size={22} />,
  contractor: <Wrench size={22} />,
  delivery: <Package size={22} />,
  other: <Bookmark size={22} />,
};

const visitTypeColors: Record<VisitType, { bg: string; icon: string; border: string }> = {
  official: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
  meeting: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
  document: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  contractor: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200" },
  delivery: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-200" },
  other: { bg: "bg-gray-50", icon: "text-gray-600", border: "border-gray-200" },
};

// All statuses for overview — appointment + entry statuses
const appointmentStatusKeys: AppointmentStatus[] = [
  "pending", "approved", "confirmed", "cancelled", "expired", "rejected",
];
const entryStatusKeys: EntryStatus[] = [
  "checked-in", "checked-out", "auto-checkout", "overstay",
];
const statusKeys: VisitStatus[] = [...appointmentStatusKeys, ...entryStatusKeys, "blocked"];

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={16} />,
  approved: <CheckCircle2 size={16} />,
  confirmed: <UserCheck size={16} />,
  cancelled: <Ban size={16} />,
  expired: <Timer size={16} />,
  rejected: <XCircle size={16} />,
  "checked-in": <ArrowUpRight size={16} />,
  "checked-out": <LogOut size={16} />,
  "auto-checkout": <Timer size={16} />,
  overstay: <AlertTriangle size={16} />,
  blocked: <Ban size={16} />,
};

// ===== API/DB Info Tag =====
function ApiDbTag({ api, tables, query }: { api: string; tables: string; query?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
        title="DB / API Info"
      >
        <Database size={10} />
        <Code2 size={10} />
        API
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 min-w-[360px] max-w-[440px]">
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">API Endpoint</p>
              <p className="text-xs font-mono text-text-primary bg-gray-50 px-2 py-1 rounded">{api}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Tables</p>
              <p className="text-xs font-mono text-text-secondary">{tables}</p>
            </div>
            {query && (
              <div>
                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-0.5">Query</p>
                <pre className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2 py-1.5 rounded whitespace-pre-wrap leading-relaxed">{query}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WebDashboard() {
  const { data: kpisRaw, isLoading: kpisLoading } = useDashboardKPIs();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kpis = kpisRaw as any;
  const { data: todayData, isLoading: todayLoading } = useDashboardToday();

  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("dashboard");
  const flowData = getFlowByPageId("dashboard");
  const apiDoc = getApiDocByPageId("dashboard");

  // Data from API (with fallback)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const td = todayData as any;
  const todayAppts: any[] = td?.appointments ?? [];
  const todayEntries: any[] = td?.entries ?? [];
  const pendingAppts = todayAppts.filter((a) => a.status === "pending");

  function countByStatus(status: VisitStatus) {
    const entryStatuses: string[] = ["checked-in", "checked-out", "auto-checkout", "overstay"];
    if (entryStatuses.includes(status)) {
      return todayEntries.filter((e: any) => e.status === status).length;
    }
    return todayAppts.filter((a) => a.status === status).length;
  }

  function typeStatusBreakdown(type: VisitType) {
    const ofType = todayAppts.filter((a) => a.type === type);
    const apptIds = new Set(ofType.map((a) => a.id));
    const linkedEntries = todayEntries.filter((e: any) => e.appointmentId && apptIds.has(e.appointmentId));
    const walkInEntries = todayEntries.filter((e: any) => e.appointmentId === null && e.visitType === type);
    const allEntries = [...linkedEntries, ...walkInEntries];
    return {
      total: ofType.length + walkInEntries.length,
      pending: ofType.filter((a) => a.status === "pending").length,
      approved: ofType.filter((a) => a.status === "approved" || a.status === "confirmed").length,
      checkedIn: allEntries.filter((e: any) => e.status === "checked-in").length,
      checkedOut: allEntries.filter((e: any) => e.status === "checked-out" || e.status === "auto-checkout").length,
      overstay: allEntries.filter((e: any) => e.status === "overstay").length,
      other: ofType.filter((a) => ["rejected", "cancelled", "expired"].includes(a.status)).length,
    };
  }

  const isLoading = kpisLoading || todayLoading;
  if (isLoading) {
    return (
      <div>
        <Topbar title="ภาพรวม" />
        <div className="p-8 text-center text-text-muted">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="ภาพรวม" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <div className="p-6 space-y-6">

        {/* Page Header with DB/Flow buttons */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Building2 size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              ภาพรวม — Dashboard
              {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
              {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h2>
            <p className="text-sm text-text-muted">สรุป KPI, สถานะวันนี้, แยกตามประเภท, รายการรออนุมัติ</p>
          </div>
        </div>

        {/* ===== Section 1: Hero KPI Strip ===== */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Section 1: KPI Strip</span>
          <ApiDbTag
            api="GET /api/dashboard/stats"
            tables="appointments, visit_entries"
            query={`-- Appointment counts\nSELECT status, COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY status;\n-- Entry counts (in building, overstay)\nSELECT status, COUNT(*) FROM visit_entries WHERE DATE(checkin_at) = CURDATE() GROUP BY status;`}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="ผู้มาติดต่อวันนี้"
            titleEn="Today's Visitors"
            value={kpis?.totalVisitorsToday ?? 0}
            icon={<Users size={22} />}
            color="primary"
          />
          <KPICard
            title="อยู่ในอาคาร"
            titleEn="Currently In Building"
            value={kpis?.currentlyInBuilding ?? 0}
            icon={<Building2 size={22} />}
            color="info"
          />
          <KPICard
            title="รออนุมัติ"
            titleEn="Pending Approval"
            value={kpis?.pendingApprovals ?? 0}
            icon={<Clock size={22} />}
            color="warning"
            highlight={(kpis?.pendingApprovals ?? 0) > 0}
          />
          <KPICard
            title="Check-in แล้ว"
            titleEn="Checked-In"
            value={kpis?.currentlyInBuilding ?? 0}
            icon={<ArrowUpRight size={22} />}
            color="success"
          />
          <KPICard
            title="ออกแล้ว"
            titleEn="Checked-Out"
            value={kpis?.checkedOutToday ?? 0}
            icon={<ArrowDown size={22} />}
            color="neutral"
          />
          <KPICard
            title="เกินเวลา"
            titleEn="Overstay"
            value={kpis?.overstayCount ?? 0}
            icon={<AlertTriangle size={22} />}
            color="error"
            highlight={(kpis?.overstayCount ?? 0) > 0}
          />
        </div>

        {/* ===== Section 2: Status Overview Bar ===== */}
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 px-6 py-4">
            <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
              สถานะทั้งหมดวันนี้ — Status Overview
              <ApiDbTag
                api="GET /api/dashboard/status-overview"
                tables="appointments"
                query={`SELECT status, COUNT(*) AS count\nFROM appointments\nWHERE date_start = CURDATE()\nGROUP BY status`}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3">
              {statusKeys.map((s) => {
                const count = countByStatus(s);
                const cfg = statusConfig[s];
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${cfg.bgColor} ${cfg.borderColor} min-w-[140px]`}
                  >
                    <span className={cfg.color}>{statusIcons[s]}</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-text-muted">{cfg.label}</span>
                      <span className={`text-lg font-extrabold ${cfg.color}`}>{count}</span>
                    </div>
                    <span className="text-[10px] text-text-muted ml-auto">{cfg.labelEn}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ===== Section 3: By Visit Type ===== */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CalendarClock size={20} className="text-primary" />
            แยกตามประเภทการเข้าพื้นที่ — By Visit Type
            <ApiDbTag
              api="GET /api/dashboard/by-type"
              tables="appointments"
              query={`SELECT type, status, COUNT(*) AS count\nFROM appointments\nWHERE date_start = CURDATE()\nGROUP BY type, status`}
            />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(visitTypes) as VisitType[]).map((type) => {
              const bd = typeStatusBreakdown(type);
              const vt = visitTypes[type];
              const colors = visitTypeColors[type];
              return (
                <Card key={type} className={`border ${colors.border} shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
                        {visitTypeIcons[type]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{vt.label}</p>
                        <p className="text-xs text-text-muted">{vt.labelEn}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-2xl font-extrabold text-text-primary">{bd.total}</p>
                        <p className="text-[10px] text-text-muted">รายการ</p>
                      </div>
                    </div>
                    {/* Mini status breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat label="รออนุมัติ" count={bd.pending} color="text-warning" bg="bg-warning-light" />
                      <MiniStat label="อนุมัติ" count={bd.approved} color="text-success" bg="bg-success-light" />
                      <MiniStat label="Check-in" count={bd.checkedIn} color="text-green-700" bg="bg-green-50" />
                      <MiniStat label="ออกแล้ว" count={bd.checkedOut} color="text-gray-600" bg="bg-gray-100" />
                      <MiniStat label="เกินเวลา" count={bd.overstay} color="text-orange-700" bg="bg-orange-50" />
                      <MiniStat label="อื่นๆ" count={bd.other} color="text-gray-500" bg="bg-gray-50" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ===== Section 4: Pending Approval Table ===== */}
        {pendingAppts.length > 0 && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden border-l-4 border-l-warning">
            <CardHeader className="bg-gradient-to-r from-warning-light to-white border-b border-warning/20 px-6 py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-warning flex items-center gap-2">
                  <Clock size={18} />
                  รายการรออนุมัติ — Pending Approval
                  <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning text-white text-xs font-bold">
                    {pendingAppts.length}
                  </span>
                  <ApiDbTag
                    api="GET /api/dashboard/pending"
                    tables="appointments JOIN visitors JOIN staff JOIN departments"
                    query={`SELECT a.*, v.name, v.company,\n  s.name AS host_name, d.name AS dept_name\nFROM appointments a\nJOIN visitors v ON a.visitor_id = v.id\nJOIN staff s ON a.host_id = s.id\nJOIN departments d ON s.department_id = d.id\nWHERE a.date_start = CURDATE()\n  AND a.status = 'pending'`}
                  />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-warning-light/50 border-b border-warning/10">
                  <tr className="text-left text-text-muted font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-6">ผู้มาติดต่อ</th>
                    <th className="py-3 px-4">ประเภท</th>
                    <th className="py-3 px-4">วัน-เวลา</th>
                    <th className="py-3 px-4">ผู้พบ / แผนก</th>
                    <th className="py-3 px-4">ผู้ติดตาม</th>
                    <th className="py-3 px-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warning/10">
                  {pendingAppts.map((a) => (
                    <tr key={a.id} className="hover:bg-warning-light/30 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-warning to-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            {a.visitor.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary block">{a.visitor.name}</span>
                            <span className="text-xs text-text-muted">{a.visitor.company}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium">{visitTypes[a.type as VisitType]?.label}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-mono text-xs">
                        {fmtTime(a.timeStart)}–{fmtTime(a.timeEnd)} น.
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-text-secondary text-xs">{a.hostStaff?.name ?? "—"}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-text-secondary">
                          {a.companionsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status} size="sm" showDot />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* ===== Section 5: All Visitors Today (Real-time) ===== */}
        <AllVisitorsTodayTable appointments={todayAppts} />
      </div>
    </div>
  );
}

// ===== Sub-components =====

type KPIColor = "primary" | "info" | "warning" | "success" | "error" | "neutral";

const kpiColorMap: Record<KPIColor, { bg: string; icon: string; text: string; ring: string }> = {
  primary: { bg: "bg-primary-50", icon: "text-primary", text: "text-primary", ring: "ring-primary/20" },
  info: { bg: "bg-info-light", icon: "text-info", text: "text-info", ring: "ring-info/20" },
  warning: { bg: "bg-warning-light", icon: "text-warning", text: "text-warning", ring: "ring-warning/20" },
  success: { bg: "bg-success-light", icon: "text-success", text: "text-success", ring: "ring-success/20" },
  error: { bg: "bg-error-light", icon: "text-error", text: "text-error", ring: "ring-error/20" },
  neutral: { bg: "bg-gray-100", icon: "text-gray-500", text: "text-gray-600", ring: "ring-gray-200" },
};

function KPICard({
  title,
  titleEn,
  value,
  icon,
  color,
  change,
  up,
  highlight,
}: {
  title: string;
  titleEn: string;
  value: number;
  icon: React.ReactNode;
  color: KPIColor;
  change?: string;
  up?: boolean;
  highlight?: boolean;
}) {
  const c = kpiColorMap[color];
  return (
    <Card className={`border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group ${highlight ? `ring-2 ${c.ring} animate-pulse` : ""}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs font-semibold text-text-secondary leading-tight">{title}</p>
            <p className="text-[10px] text-text-muted">{titleEn}</p>
          </div>
          <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center ${c.icon} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        </div>
        <p className={`text-3xl font-extrabold ${c.text}`}>{value}</p>
        {change && (
          <p className={`text-[10px] font-semibold mt-1 ${up ? "text-success" : "text-text-muted"}`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-lg px-2 py-1.5 text-center`}>
      <p className={`text-sm font-bold ${color}`}>{count}</p>
      <p className="text-[10px] text-text-muted leading-tight">{label}</p>
    </div>
  );
}

// ===== Paginated All Visitors Table =====

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function AllVisitorsTodayTable({ appointments: appts }: { appointments: any[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<VisitType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<VisitStatus | "all">("all");

  // Filter logic
  const filtered = appts.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        a.visitor.name.toLowerCase().includes(q) ||
        (a.visitor.nameEn?.toLowerCase().includes(q)) ||
        a.visitor.company.toLowerCase().includes(q) ||
        (a.hostStaff?.name ?? "").toLowerCase().includes(q) ||
        (a.bookingCode ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);
  const startRow = filtered.length > 0 ? startIdx + 1 : 0;
  const endRow = Math.min(startIdx + pageSize, filtered.length);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const hasFilters = search.trim() !== "" || filterType !== "all" || filterStatus !== "all";

  const clearAll = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatus("all");
    setPage(1);
  };

  // Unique statuses present in today's data for the dropdown
  const availableStatuses = Array.from(new Set(appts.map((a) => a.status)));
  // Unique types present in today's data
  const availableTypes = Array.from(new Set(appts.map((a) => a.type)));

  return (
    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            ผู้มาติดต่อวันนี้ทั้งหมด — All Visitors Today
            <ApiDbTag
              api="GET /api/appointments?date=today&page=1&limit=10"
              tables="appointments JOIN visitors JOIN staff JOIN departments"
              query={`SELECT a.*, v.name, v.company, v.name_en,\n  s.name AS host_name,\n  d.name AS dept_name\nFROM appointments a\nJOIN visitors v ON a.visitor_id = v.id\nJOIN staff s ON a.host_id = s.id\nJOIN departments d ON s.department_id = d.id\nWHERE a.date_start = CURDATE()\nORDER BY a.time_start\nLIMIT :limit OFFSET :offset`}
            />
          </CardTitle>
          <span className="text-xs text-primary/60 font-medium bg-primary-100 px-3 py-1 rounded-full">
            {appts.length} รายการ · อัปเดตอัตโนมัติ
          </span>
        </div>
        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, บริษัท, รหัส..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-text-muted/60"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value as VisitType | "all"); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-text-secondary"
          >
            <option value="all">ประเภท: ทั้งหมด</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{visitTypes[t as VisitType]?.label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as VisitStatus | "all"); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-text-secondary"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            {availableStatuses.map((s) => (
              <option key={s} value={s}>{statusConfig[s as VisitStatus]?.label} ({statusConfig[s as VisitStatus]?.labelEn})</option>
            ))}
          </select>

          {/* Clear all filters */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-error hover:bg-error-light rounded-xl transition-colors"
            >
              <X size={14} />
              ล้างตัวกรอง
            </button>
          )}

          {/* Filtered count badge */}
          {hasFilters && (
            <span className="text-xs text-text-muted bg-gray-100 px-2.5 py-1 rounded-full">
              พบ {filtered.length} จาก {appts.length} รายการ
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
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
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Search size={32} className="mx-auto text-text-muted/40 mb-2" />
                  <p className="text-sm text-text-muted">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                  <button onClick={clearAll} className="text-xs text-primary hover:underline mt-1">
                    ล้างตัวกรองทั้งหมด
                  </button>
                </td>
              </tr>
            )}
            {paged.map((a) => (
              <tr key={a.id} className="hover:bg-primary-50/30 transition-colors">
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold shadow-sm">
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
                    <span className={`${visitTypeColors[a.type as VisitType]?.icon}`}>
                      {visitTypeIcons[a.type as VisitType]}
                    </span>
                    <span className="text-xs font-medium text-text-secondary">{visitTypes[a.type as VisitType]?.label}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-text-secondary font-mono text-xs">
                  {fmtTime(a.timeStart)}–{fmtTime(a.timeEnd)}
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-text-secondary text-sm">{a.hostStaff?.name ?? "—"}</span>
                  <span className="block text-xs text-text-muted">{a.department?.name ?? "—"}</span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  {a.companionsCount > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-xs font-bold text-primary">
                      +{a.companionsCount}
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
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          {/* Page size selector */}
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

          {/* Info */}
          <span className="text-xs text-text-muted">
            {startRow}–{endRow} จาก {filtered.length} รายการ
          </span>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${
                  p === safeCurrentPage
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goTo(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
