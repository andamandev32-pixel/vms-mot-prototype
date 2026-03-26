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
} from "lucide-react";
import {
  appointments,
  visitTypes,
  statusConfig,
  type VisitType,
  type VisitStatus,
  type Appointment,
} from "@/lib/mock-data";
import { getMockToday } from "@/lib/thai-date";

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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function WebSearchPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("search");
  const flowData = getFlowByPageId("search");
  const apiDoc = getApiDocByPageId("search");

  const allAppts = appointments;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<VisitType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<VisitStatus | "all">("all");
  const [todayOnly, setTodayOnly] = useState(true);
  const mockToday = getMockToday();

  // Filter
  const filtered = allAppts.filter((a) => {
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);
  const startRow = filtered.length > 0 ? startIdx + 1 : 0;
  const endRow = Math.min(startIdx + pageSize, filtered.length);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const hasFilters = search.trim() !== "" || filterType !== "all" || filterStatus !== "all" || !todayOnly;
  const clearAll = () => { setSearch(""); setFilterType("all"); setFilterStatus("all"); setTodayOnly(true); setPage(1); };

  const availableStatuses = Array.from(new Set(allAppts.map((a) => a.status)));
  const availableTypes = Array.from(new Set(allAppts.map((a) => a.type)));

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
                {allAppts.length} รายการ · อัปเดตอัตโนมัติ
              </span>
            </div>
            {/* Search + Filters */}
            <div className="flex flex-wrap items-center gap-3">
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
                  <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <X size={14} />
                  </button>
                )}
              </div>
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
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as VisitStatus | "all"); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-text-secondary"
              >
                <option value="all">สถานะ: ทั้งหมด</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{statusConfig[s].label} ({statusConfig[s].labelEn})</option>
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
                  พบ {filtered.length} จาก {allAppts.length} รายการ
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
                      <button onClick={clearAll} className="text-xs text-primary hover:underline mt-1">ล้างตัวกรองทั้งหมด</button>
                    </td>
                  </tr>
                )}
                {paged.map((a) => (
                  <tr key={a.id} className="hover:bg-primary-50/30 transition-colors">
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
                ))}
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
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span>รายการ / หน้า</span>
              </div>
              <span className="text-xs text-text-muted">
                {startRow}–{endRow} จาก {filtered.length} รายการ
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
