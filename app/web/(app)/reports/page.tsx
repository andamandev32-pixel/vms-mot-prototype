"use client";

import { useState, useMemo } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  BarChart3, FileText, Download, Calendar, Users, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Building2, Clock, CheckCircle2, AlertTriangle,
  Briefcase, Package, Wrench, FileCheck, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisitReport } from "@/lib/hooks";

type DateRange = "today" | "week" | "month" | "custom";

// Simple bar chart component
function SimpleBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-text-primary w-8 text-right">{value}</span>
    </div>
  );
}

export default function ReportsPage() {
  const { data: reportData, isLoading: loadingReport } = useVisitReport();

  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("reports");
  const flowData = getFlowByPageId("reports");
  const apiDoc = getApiDocByPageId("reports");

  const [dateRange, setDateRange] = useState<DateRange>("today");

  // Compute stats from real API data only — no mock fallback
  const stats = useMemo(() => {
    const rd = reportData as any;
    const entries: any[] = rd?.entries ?? [];

    const total = rd?.pagination?.total ?? entries.length;
    const checkedIn = entries.filter((e: any) => e.status === "checked-in").length;
    const checkedOut = entries.filter((e: any) => ["checked-out", "auto-checkout"].includes(e.status)).length;
    const pending = entries.filter((e: any) => e.status === "pending").length;
    const overstay = entries.filter((e: any) => e.status === "overstay").length;
    const walkin = entries.filter((e: any) => e.appointmentId === null).length;

    // Visit type breakdown
    const visitTypeLabels: Record<string, string> = {
      official: "พบเจ้าหน้าที่",
      meeting: "ประชุม / สัมมนา",
      document: "ส่งเอกสาร",
      contractor: "ผู้รับเหมา / ซ่อมบำรุง",
      delivery: "รับ-ส่งสินค้า",
      other: "อื่นๆ",
    };
    const typeMap = new Map<string, number>();
    entries.forEach((e: any) => {
      const t = e.visitType || e.appointment?.type || "other";
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
    });
    const typeBreakdown = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, label: visitTypeLabels[type] ?? type, count }))
      .sort((a, b) => b.count - a.count);

    // Department breakdown
    const deptMap = new Map<string, number>();
    entries.forEach((e: any) => {
      const dept = e.department?.name ?? "ไม่ระบุ";
      deptMap.set(dept, (deptMap.get(dept) ?? 0) + 1);
    });
    const deptBreakdown = Array.from(deptMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Channel breakdown
    const channelLabels: Record<string, { label: string; color: string }> = {
      kiosk:   { label: "Kiosk",    color: "bg-blue-500" },
      line:    { label: "LINE OA",  color: "bg-green-500" },
      web:     { label: "Web App",  color: "bg-indigo-500" },
      counter: { label: "Counter",  color: "bg-purple-500" },
      walkin:  { label: "Walk-in",  color: "bg-amber-500" },
    };
    const channelMap = new Map<string, number>();
    entries.forEach((e: any) => {
      const ch = e.checkinChannel || "other";
      channelMap.set(ch, (channelMap.get(ch) ?? 0) + 1);
    });
    const channelBreakdown = Array.from(channelMap.entries())
      .map(([key, count]) => ({
        label: channelLabels[key]?.label ?? key,
        count,
        color: channelLabels[key]?.color ?? "bg-gray-400",
      }))
      .sort((a, b) => b.count - a.count);

    return { total, checkedIn, checkedOut, pending, overstay, walkin, typeBreakdown, deptBreakdown, channelBreakdown };
  }, [reportData]);

  const maxTypeCount = Math.max(...stats.typeBreakdown.map((t: any) => t.count), 1);
  const maxDeptCount = Math.max(...stats.deptBreakdown.map((d: any) => d.count), 1);
  const maxChannelCount = Math.max(...stats.channelBreakdown.map((c: any) => c.count), 1);

  const visitTypeIcons: Record<string, React.ReactNode> = {
    official: <Briefcase size={14} />,
    meeting: <Users size={14} />,
    document: <FileCheck size={14} />,
    contractor: <Wrench size={14} />,
    delivery: <Package size={14} />,
    other: <Bookmark size={14} />,
  };

  const visitTypeColors: Record<string, string> = {
    official: "bg-blue-500",
    meeting: "bg-purple-500",
    document: "bg-emerald-500",
    contractor: "bg-orange-500",
    delivery: "bg-cyan-500",
    other: "bg-gray-400",
  };

  if (loadingReport) return <div><Topbar title="รายงาน" /><div className="p-8 text-center text-text-muted">กำลังโหลดรายงาน...</div></div>;

  return (
    <div>
      <Topbar title="รายงาน" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                รายงานสถิติผู้มาติดต่อ
                {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
                {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
                {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
              </h2>
              <p className="text-sm text-text-muted">
                สรุปสถิติ, กราฟแนวโน้ม, วิเคราะห์ตามประเภท/แผนก/ช่องทาง
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {([
                { key: "today", label: "วันนี้" },
                { key: "week", label: "สัปดาห์" },
                { key: "month", label: "เดือน" },
              ] as { key: DateRange; label: string }[]).map((r) => (
                <button
                  key={r.key}
                  onClick={() => setDateRange(r.key)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                    dateRange === r.key ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="outline" className="text-sm">
              <Download size={16} className="mr-2" />
              ส่งออก
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "ผู้มาติดต่อทั้งหมด", value: stats.total, icon: Users, color: "text-primary-600", bg: "bg-primary-50", delta: "+12%", up: true },
            { label: "เข้าพื้นที่แล้ว", value: stats.checkedIn, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", delta: "+8%", up: true },
            { label: "รอดำเนินการ", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", delta: "-5%", up: false },
            { label: "เกินเวลา", value: stats.overstay, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", delta: "+2", up: true },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", kpi.bg)}>
                    <kpi.icon size={18} className={kpi.color} />
                  </div>
                  <span className={cn("flex items-center gap-0.5 text-xs font-semibold", kpi.up ? "text-green-600" : "text-red-600")}>
                    {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.delta}
                  </span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visit Type Breakdown */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-600" />
                สัดส่วนตามประเภทการติดต่อ
              </h3>
              <div className="space-y-3">
                {stats.typeBreakdown.map((t: any) => (
                  <div key={t.type} className="flex items-center gap-3">
                    <div className="w-6 flex justify-center text-text-muted">
                      {visitTypeIcons[t.type]}
                    </div>
                    <span className="text-xs text-text-secondary w-28 truncate">{t.label}</span>
                    <SimpleBar value={t.count} max={maxTypeCount} color={visitTypeColors[t.type]} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-primary-600" />
                สถิติตามแผนก (Top 6)
              </h3>
              <div className="space-y-3">
                {stats.deptBreakdown.map((d: any, i: any) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-5 text-right">{i + 1}.</span>
                    <span className="text-xs text-text-secondary w-36 truncate" title={d.name}>{d.name}</span>
                    <SimpleBar value={d.count} max={maxDeptCount} color="bg-primary-500" />
                  </div>
                ))}
                {stats.deptBreakdown.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">ไม่มีข้อมูล</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Channel Breakdown */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600" />
                สถิติตามช่องทาง
              </h3>
              <div className="space-y-3">
                {stats.channelBreakdown.map((c: any) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-20">{c.label}</span>
                    <SimpleBar value={c.count} max={maxChannelCount} color={c.color} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" />
                สรุปภาพรวม
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">ผู้มาติดต่อทั้งหมด</span>
                  <span className="text-sm font-bold text-text-primary">{stats.total} คน</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Check-in สำเร็จ</span>
                  <span className="text-sm font-bold text-green-600">{stats.checkedIn} คน</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Check-out แล้ว</span>
                  <span className="text-sm font-bold text-text-primary">{stats.checkedOut} คน</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Walk-in (เจ้าหน้าที่สร้าง)</span>
                  <span className="text-sm font-bold text-blue-600">{stats.walkin} คน</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">เกินเวลา</span>
                  <span className="text-sm font-bold text-red-600">{stats.overstay} คน</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-text-secondary">จำนวนแผนกที่มีผู้เยี่ยม</span>
                  <span className="text-sm font-bold text-text-primary">{stats.deptBreakdown.length} แผนก</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
