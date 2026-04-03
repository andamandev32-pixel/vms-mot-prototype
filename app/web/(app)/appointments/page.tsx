"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Drawer } from "@/components/ui/Drawer";
import {
  Search, Plus, Check, X, Eye, Pencil, Download, Upload, Trash2, AlertTriangle,
  Users, UserPlus, Building2, Wifi, WifiOff, FileSpreadsheet, FileText, MapPin, ChevronDown, ChevronLeft, ChevronRight, Calendar,
  Clock, CheckCircle, Bell, ArrowUpDown, Shield, QrCode as QrCodeIcon
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { formatThaiDate } from "@/lib/thai-date";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppointments, useAppointment, useCreateAppointment, useUpdateAppointment, useApproveAppointment, useRejectAppointment, useCancelAppointment, useMyApproverGroups } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  staffMembers,
  departments,
  blocklist,
  visitPurposeConfigs,
  type Appointment,
  type AppointmentStatus,
  type EntryStatus,
  type EntryMode,
  appointmentStatusConfig,
  visitTypes,
  getDepartmentLocation,
} from "@/lib/mock-data";

// ===== Tab definition =====
type TabFilter = "all" | "visitor" | "staff" | "cancelled" | "pending" | "approved" | "rejected" | "tracking";
const staffTabs: { key: TabFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รออนุมัติ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "rejected", label: "ไม่อนุมัติ" },
  { key: "tracking", label: "กำลังเข้าพื้นที่" },
  { key: "staff", label: "เจ้าหน้าที่สร้าง" },
  { key: "cancelled", label: "ยกเลิก" },
];
const visitorTabs: { key: TabFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รออนุมัติ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "cancelled", label: "ยกเลิก" },
];

// ===== Companion entry =====
interface CompanionEntry {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  isBlacklisted?: boolean;
}

// ===== Toast notification state =====
interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const isVisitor = user?.role === "visitor";
  const { data: apptRaw, isLoading: apptLoading } = useAppointments();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apptData = apptRaw as any;

  // Approver group data for group-based filtering
  const { data: myGroupsRaw } = useMyApproverGroups();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myGroupsData = myGroupsRaw as any;
  const canApproveAll = myGroupsData?.canApproveAll ?? isVisitor;
  const purposeDepartmentPairs: { visitPurposeId: number; departmentId: number }[] =
    myGroupsData?.purposeDepartmentPairs ?? [];
  const myGroupNames: string[] = (myGroupsData?.groups ?? []).map((g: any) => g.name);

  // Map API (Prisma) field names → frontend Appointment shape
  const mockAppointments: Appointment[] = useMemo(() => {
    const rawAppointments: any[] = Array.isArray(apptData) ? apptData : apptData?.appointments ?? [];
    return rawAppointments.map((a: any) => ({
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
      visitEntries: a.visitEntries ?? [],
      lastEntryStatus: a.visitEntries?.[0]?.status ?? null,
      approvedBy: a.approvedByStaff?.name ?? a.approvedByStaff?.nameEn ?? (a.approvedBy ? `#${a.approvedBy}` : undefined),
      visitor: a.visitor ?? { name: "-", company: "-", phone: "-" },
    }));
  }, [apptData]);

  // ===== Toast Notification System =====
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevStatusMapRef = useRef<Record<number, string>>({});

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // Track new pending count for staff notification badge
  const [newPendingCount, setNewPendingCount] = useState(0);
  const prevPendingIdsRef = useRef<Set<number>>(new Set());

  // Detect status changes → show toast for both visitor AND staff
  useEffect(() => {
    if (mockAppointments.length === 0) return;
    const prevMap = prevStatusMapRef.current;
    const newMap: Record<number, string> = {};

    for (const apt of mockAppointments) {
      newMap[apt.id] = apt.status;
      const prev = prevMap[apt.id];
      if (prev && prev !== apt.status) {
        if (isVisitor) {
          // Visitor sees status updates on their appointments
          if (apt.status === "approved") {
            addToast(`นัดหมาย ${apt.code ?? ""} ได้รับการอนุมัติแล้ว`, "success");
          } else if (apt.status === "rejected") {
            addToast(`นัดหมาย ${apt.code ?? ""} ถูกปฏิเสธ`, "warning");
          }
        } else {
          // Staff sees updates (e.g. visitor cancelled)
          if (apt.status === "cancelled" && prev !== "cancelled") {
            addToast(`นัดหมาย ${apt.code ?? ""} ถูกยกเลิกโดย Visitor`, "warning");
          }
        }
      }
    }
    prevStatusMapRef.current = newMap;

    // Staff: detect new pending appointments
    if (!isVisitor) {
      const currentPendingIds = new Set(mockAppointments.filter(a => a.status === "pending").map(a => a.id));
      const prevIds = prevPendingIdsRef.current;
      if (prevIds.size > 0) {
        const brandNew = [...currentPendingIds].filter(id => !prevIds.has(id));
        if (brandNew.length > 0) {
          setNewPendingCount(prev => prev + brandNew.length);
          addToast(`มีนัดหมายใหม่รออนุมัติ ${brandNew.length} รายการ`, "info");
        }
      }
      prevPendingIdsRef.current = currentPendingIds;
    }
  }, [isVisitor, mockAppointments, addToast]);

  // Auto-refresh every 15s for both visitors and staff
  const queryClient = useQueryClient();
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }, 15000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Approve/Reject modal state
  const [approveTarget, setApproveTarget] = useState<Appointment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("appointments");
  const flowData = getFlowByPageId("appointments");
  const apiDoc = getApiDocByPageId("appointments");

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [dateSortDir, setDateSortDir] = useState<"desc" | "asc">("desc");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Appointment | null>(null);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [slipModalApt, setSlipModalApt] = useState<Appointment | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let result = [...mockAppointments];

    // Tab filter — "cancelled" tab shows only cancelled; "all" hides cancelled for visitors
    if (activeTab === "cancelled") {
      result = result.filter(a => a.status === "cancelled");
    } else if (activeTab === "pending") {
      result = result.filter(a => a.status === "pending");
      // Group-based filtering: staff only sees pending items for their group's purpose+dept
      if (!isVisitor && !canApproveAll && purposeDepartmentPairs.length > 0) {
        result = result.filter(a =>
          purposeDepartmentPairs.some(p =>
            p.visitPurposeId === a.visitPurposeId && p.departmentId === a.departmentId
          )
        );
      } else if (!isVisitor && !canApproveAll && purposeDepartmentPairs.length === 0) {
        // Staff not in any approver group → sees no pending items
        result = [];
      }
    } else if (activeTab === "approved") {
      result = result.filter(a => a.status === "approved" || a.status === "confirmed");
    } else if (activeTab === "rejected") {
      result = result.filter(a => a.status === "rejected");
    } else if (activeTab === "tracking") {
      // Show approved items that have at least one checked-in entry (visitor is currently on site)
      result = result.filter(a =>
        (a.status === "approved" || a.status === "confirmed") &&
        a.visitEntries?.some((e: any) => e.status === "checked-in")
      );
    } else {
      if (isVisitor) result = result.filter(a => a.status !== "cancelled");
      if (activeTab === "visitor") result = result.filter(a => a.createdBy === "visitor");
      if (activeTab === "staff") result = result.filter(a => a.createdBy === "staff");
    }

    // Status filter
    if (statusFilter !== "all") result = result.filter(a => a.status === statusFilter);

    // Date filter
    if (dateFilter) result = result.filter(a => a.date === dateFilter);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.visitor?.name?.toLowerCase().includes(q) ||
        a.visitor?.company?.toLowerCase().includes(q) ||
        a.code?.toLowerCase().includes(q) ||
        a.host?.name?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q)
      );
    }

    // Sort by date (newest first by default)
    result.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return dateSortDir === "desc" ? db - da : da - db;
    });

    return result;
  }, [mockAppointments, activeTab, statusFilter, dateFilter, searchQuery, dateSortDir, isVisitor, canApproveAll, purposeDepartmentPairs]);

  // Pagination
  const totalCount = filteredAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const pagedAppointments = filteredAppointments.slice(startIdx, startIdx + pageSize);
  const startRow = totalCount > 0 ? startIdx + 1 : 0;
  const endRow = Math.min(startIdx + pageSize, totalCount);
  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("");
    setPage(1);
  };

  return (
    <>
      <Topbar title="การนัดหมาย" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-6">
        {/* Page Header with DB/Flow buttons */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Calendar size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              จัดการนัดหมาย
              {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
              {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h2>
            <p className="text-sm text-text-muted">{isVisitor ? "สร้างนัดหมาย, ติดตามสถานะ, แก้ไข/ยกเลิกรายการ" : "สร้าง/อนุมัติ/ปฏิเสธนัดหมาย, ติดตามสถานะ, จัดการผู้ติดตามและ WiFi"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(isVisitor ? visitorTabs : staffTabs).map(tab => {
              const count =
                tab.key === "all" ? mockAppointments.filter(a => isVisitor ? a.status !== "cancelled" : true).length :
                tab.key === "cancelled" ? mockAppointments.filter(a => a.status === "cancelled").length :
                tab.key === "pending" ? mockAppointments.filter(a => a.status === "pending").length :
                tab.key === "approved" ? mockAppointments.filter(a => a.status === "approved" || a.status === "confirmed").length :
                tab.key === "rejected" ? mockAppointments.filter(a => a.status === "rejected").length :
                tab.key === "tracking" ? mockAppointments.filter(a => (a.status === "approved" || a.status === "confirmed") && a.visitEntries?.some((e: any) => e.status === "checked-in")).length :
                tab.key === "visitor" ? mockAppointments.filter(a => a.createdBy === "visitor").length :
                tab.key === "staff" ? mockAppointments.filter(a => a.createdBy === "staff").length : 0;
              const isPending = tab.key === "pending";
              const isTracking = tab.key === "tracking";
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); if (isPending) setNewPendingCount(0); }}
                  className={cn(
                    "relative px-5 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-white text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                    isPending && count > 0 ? "bg-orange-100 text-orange-700 font-bold" :
                    isTracking && count > 0 ? "bg-green-100 text-green-700 font-bold" :
                    activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-gray-200 text-text-muted"
                  )}>
                    {count}
                  </span>
                  {/* New pending badge */}
                  {isPending && newPendingCount > 0 && activeTab !== "pending" && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
                      {newPendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bell notification for staff */}
          {!isVisitor && newPendingCount > 0 && (
            <button
              onClick={() => { setActiveTab("pending"); setNewPendingCount(0); }}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium animate-in fade-in"
            >
              <Bell size={16} className="animate-bounce" />
              <span>มีรายการใหม่รออนุมัติ {newPendingCount} รายการ</span>
            </button>
          )}
        </div>

        {/* Link to dedicated approvals page */}
        {!isVisitor && activeTab === "pending" && (
          <a
            href="/web/approvals"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm hover:bg-green-100 transition-colors"
          >
            <Shield size={16} />
            <span>ใช้หน้า <strong>อนุมัตินัดหมาย</strong> เพื่อจัดการคิวอนุมัติตามกลุ่มและติดตามการเข้า-ออกพื้นที่ →</span>
          </a>
        )}

        {/* Group info banner for staff on pending tab */}
        {!isVisitor && activeTab === "pending" && !canApproveAll && myGroupNames.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <Users size={16} />
            <span>แสดงเฉพาะรายการที่กลุ่มของคุณรับผิดชอบ: <strong>{myGroupNames.join(", ")}</strong></span>
          </div>
        )}
        {!isVisitor && activeTab === "pending" && !canApproveAll && purposeDepartmentPairs.length === 0 && myGroupNames.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <AlertTriangle size={16} />
            <span>คุณยังไม่ได้อยู่ในกลุ่มผู้อนุมัติใด — กรุณาติดต่อผู้ดูแลระบบ</span>
          </div>
        )}

        {/* Filter Bar */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="ค้นหาชื่อ / รหัสนัดหมาย / บริษัท / ผู้พบ"
                leftIcon={<Search size={18} />}
                className="h-10"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="expired">หมดอายุ</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary text-text-muted"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="ghost" className="h-10 px-4 text-text-muted" onClick={clearFilters}>ล้างตัวกรอง</Button>
            </div>
            <div className="ml-auto">
              <Button variant="secondary" className="h-10 shadow-sm" onClick={() => setShowModal(true)}>
                <Plus size={18} className="mr-2" />
                สร้างนัดหมาย
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4">ผู้มาติดต่อ</th>
                  <th className="px-6 py-4">วัตถุประสงค์</th>
                  <th className="px-6 py-4 whitespace-nowrap">ประเภทการเข้า</th>
                  <th className="px-6 py-4">
                    <button onClick={() => setDateSortDir(d => d === "desc" ? "asc" : "desc")} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                      วันนัดหมาย
                      <ArrowUpDown size={14} className={dateSortDir === "desc" ? "text-primary" : "text-text-muted"} />
                    </button>
                  </th>
                  <th className="px-6 py-4">ผู้พบ / สถานที่</th>
                  <th className="px-6 py-4">ผู้ติดตาม</th>
                  {!isVisitor && <th className="px-6 py-4">สร้างโดย</th>}
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedAppointments.map((apt) => (
                  <AppointmentRow key={apt.id} apt={apt} isVisitor={isVisitor} onView={() => setShowDetailModal(apt)} onEdit={() => setEditAppointment(apt)} onNotify={addToast} onApprove={() => setApproveTarget(apt)} onReject={() => { setRejectTarget(apt); setRejectReason(""); }} onPrintSlip={() => setSlipModalApt(apt)} />
                ))}
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-text-muted">
                      ไม่พบรายการนัดหมายที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
      </main>

      {/* Create Appointment Drawer */}
      {isVisitor ? (
        <VisitorCreateDrawer open={showModal} onClose={() => setShowModal(false)} visitorId={user?.refId ?? user?.id ?? 0} onSuccess={() => addToast("สร้างนัดหมายสำเร็จแล้ว", "success")} />
      ) : (
        <CreateAppointmentDrawer open={showModal} onClose={() => setShowModal(false)} />
      )}

      {/* Edit Appointment Drawer */}
      {editAppointment && (
        <EditAppointmentDrawer
          open={!!editAppointment}
          onClose={() => setEditAppointment(null)}
          appointment={editAppointment}
          isVisitor={isVisitor}
          onNotify={addToast}
        />
      )}

      {/* Appointment Slip Modal (Printable QR document) */}
      {slipModalApt && (
        <AppointmentSlipModal appointment={slipModalApt} onClose={() => setSlipModalApt(null)} />
      )}

      {/* Appointment Detail Modal */}
      {showDetailModal && (
        <AppointmentDetailModal appointment={showDetailModal} onClose={() => setShowDetailModal(null)} />
      )}

      {/* Approve Confirmation Modal */}
      {approveTarget && (
        <ApproveRejectModal
          type="approve"
          appointment={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={(msg) => { setApproveTarget(null); addToast(msg, "success"); }}
          onError={(msg) => addToast(msg, "error")}
        />
      )}

      {/* Reject Confirmation Modal */}
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

      {/* Toast Notifications — top-right */}
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

// ===== Appointment Row =====
function AppointmentRow({ apt, isVisitor, onView, onEdit, onNotify, onApprove, onReject, onPrintSlip }: { apt: Appointment; isVisitor: boolean; onView: () => void; onEdit: () => void; onNotify?: (msg: string, type?: "info" | "success" | "warning" | "error") => void; onApprove?: () => void; onReject?: () => void; onPrintSlip?: () => void }) {
  const cancelMut = useCancelAppointment();

  const typeName = apt.purposeName ?? apt.type;

  // Format date helpers
  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear() + 543; // Buddhist era
      return `${dd}/${mm}/${yyyy}`;
    } catch { return d; }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {apt.visitor.name[0]}
          </div>
          <div>
            <p className="font-bold text-text-primary">{apt.visitor.name}</p>
            <p className="text-xs text-text-secondary">{apt.visitor.company}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-text-primary">{typeName}</p>
        <p className="text-xs text-text-muted truncate max-w-[180px]">{apt.purpose}</p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {apt.entryMode === "period" ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            <Calendar size={11} />
            ช่วงเวลา
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            🔹 ครั้งเดียว
          </span>
        )}
      </td>
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
      <td className="px-6 py-4">
        <p className="text-text-primary">{apt.host?.name ?? "-"}</p>
        <p className="text-xs text-text-muted">{apt.area} • {apt.floor}</p>
      </td>
      <td className="px-6 py-4">
        {apt.companions > 0 ? (
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-text-muted" />
            <span className="text-text-primary">{apt.companions} คน</span>
            {apt.companionNames && apt.companionNames.length > 0 && (
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">ระบุชื่อ</span>
            )}
          </div>
        ) : (
          <span className="text-text-muted">-</span>
        )}
      </td>
      {!isVisitor && (
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
          apt.createdBy === "staff" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
        )}>
          {apt.createdBy === "staff" ? <UserPlus size={12} /> : <Users size={12} />}
          {apt.createdBy === "staff" ? "เจ้าหน้าที่" : "Visitor"}
        </span>
      </td>
      )}
      <td className="px-6 py-4">
        <StatusBadge status={apt.status} size="sm" />
        {apt.approvedBy && <p className="text-[10px] text-text-muted mt-1">โดย: {apt.approvedBy}</p>}
        {/* Entry status inline */}
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
            <AlertTriangle size={10} />
            เกินเวลา
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {!isVisitor && apt.status === "pending" && (
            <>
              <button onClick={onApprove} className="h-8 w-8 rounded-full bg-green-50 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors border border-green-200" title="อนุมัติ">
                <Check size={16} />
              </button>
              <button onClick={onReject} className="h-8 w-8 rounded-full bg-red-50 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors border border-red-200" title="ปฏิเสธ">
                <X size={16} />
              </button>
            </>
          )}
          {/* Visitor: edit only pending; Staff: edit any */}
          {(!isVisitor || apt.status === "pending") && (
          <button onClick={onEdit} className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors border border-amber-200" title="แก้ไข">
            <Pencil size={16} />
          </button>
          )}
          {/* Visitor: cancel pending or approved, only if no entry yet */}
          {isVisitor && (apt.status === "pending" || apt.status === "approved") && !apt.visitEntryCount && (
            <button
              onClick={() => {
                if (confirm(apt.status === "approved" ? "นัดหมายนี้ได้รับการอนุมัติแล้ว ท่านต้องการยกเลิกหรือไม่? (เจ้าหน้าที่จะได้รับแจ้งเตือน)" : "ท่านต้องการยกเลิกนัดหมายนี้หรือไม่?")) {
                  cancelMut.mutate({ id: apt.id } as any, {
                    onSuccess: () => onNotify?.("ยกเลิกนัดหมายเรียบร้อยแล้ว", "success"),
                    onError: () => onNotify?.("ไม่สามารถยกเลิกได้ กรุณาลองใหม่", "error"),
                  });
                }
              }}
              className="h-8 w-8 rounded-full bg-red-50 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors border border-red-200"
              title="ยกเลิก"
            >
              <X size={16} />
            </button>
          )}
          {apt.status === "approved" && (
            <button onClick={onPrintSlip} className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors border border-blue-200" title="พิมพ์เอกสารนัดหมาย">
              <FileText size={16} />
            </button>
          )}
          <button onClick={onView} className="h-8 w-8 rounded-full bg-gray-50 text-text-muted hover:bg-white hover:text-primary hover:shadow-sm flex items-center justify-center transition-colors border border-gray-200" title="ดูรายละเอียด">
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ===== Approve / Reject Confirmation Modal =====
function ApproveRejectModal({ type, appointment, rejectReason, onRejectReasonChange, onClose, onSuccess, onError }: {
  type: "approve" | "reject";
  appointment: Appointment;
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
        await approveMut.mutateAsync({ id: appointment.id } as any);
        onSuccess(`อนุมัตินัดหมาย ${appointment.code ?? ""} เรียบร้อยแล้ว`);
      } else {
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
              {appointment.host?.name && (
                <div className="col-span-2">
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

          {/* Reject reason input */}
          {!isApprove && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                เหตุผลในการปฏิเสธ <span className="text-error">*</span>
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
function AppointmentDetailModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { data: detailRaw } = useAppointment(appointment.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail = (detailRaw as any)?.appointment ?? null;
  const statusLogs: any[] = detail?.statusLogs ?? [];
  const visitEntries: any[] = detail?.visitEntries ?? [];

  const [historyTab, setHistoryTab] = useState<"status" | "entry">("status");

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border z-10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">รายละเอียดนัดหมาย</h2>
            <p className="text-xs text-text-muted font-mono">{appointment.code}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <DetailSection title="ผู้มาติดต่อ">
            <DetailRow label="ชื่อ" value={appointment.visitor.name} />
            <DetailRow label="บริษัท" value={appointment.visitor.company} />
            <DetailRow label="โทรศัพท์" value={appointment.visitor.phone} />
          </DetailSection>

          <DetailSection title="รายละเอียดนัดหมาย">
            <DetailRow label="วัตถุประสงค์" value={appointment.purpose} />
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-text-secondary flex-shrink-0">ประเภทการเข้า</span>
              {appointment.entryMode === "period" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  <Calendar size={11} />
                  ช่วงเวลา
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  🔹 ครั้งเดียว
                </span>
              )}
            </div>
            {appointment.entryMode === "period" && appointment.dateEnd ? (
              <>
                <DetailRow label="วันเริ่ม" value={fmtDate(appointment.date)} />
                <DetailRow label="วันสิ้นสุด" value={fmtDate(appointment.dateEnd)} />
                <DetailRow label="เวลา" value={`${appointment.timeStart} - ${appointment.timeEnd}`} />
              </>
            ) : (
              <>
                <DetailRow label="วันที่" value={fmtDate(appointment.date)} />
                <DetailRow label="เวลา" value={`${appointment.timeStart} - ${appointment.timeEnd}`} />
              </>
            )}
            <DetailRow label="ผู้พบ" value={appointment.host?.name ?? "-"} />
            <DetailRow label="สถานที่" value={`${appointment.area} ${appointment.floor}`} />
          </DetailSection>

          {appointment.companions > 0 && (
            <DetailSection title="ผู้ติดตาม">
              <DetailRow label="จำนวน" value={`${appointment.companions} คน`} />
              {appointment.companionNames && appointment.companionNames.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-text-secondary font-medium">รายชื่อ:</p>
                  {appointment.companionNames.map((name, i) => (
                    <p key={i} className="text-sm text-text-primary pl-3">• {name}</p>
                  ))}
                </div>
              )}
            </DetailSection>
          )}

          {appointment.offerWifi && (
            <DetailSection title="WiFi">
              <div className="flex items-center gap-2 text-sm">
                <Wifi size={14} className="text-primary" />
                <span className="text-primary font-medium">เสนอ WiFi ให้ผู้มาติดต่อ</span>
              </div>
            </DetailSection>
          )}

          <DetailSection title="สถานะ">
            <div className="flex items-center gap-2">
              <StatusBadge status={appointment.status} />
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                appointment.createdBy === "staff" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
              )}>
                สร้างโดย: {appointment.createdBy === "staff" ? "เจ้าหน้าที่" : "Visitor"}
              </span>
            </div>
            {appointment.approvedBy && <DetailRow label="อนุมัติโดย" value={appointment.approvedBy} />}
            {appointment.rejectedReason && <DetailRow label="เหตุผลปฏิเสธ" value={appointment.rejectedReason} />}
          </DetailSection>

          {/* History Tabs: Status Logs & Entry History */}
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
                      {log.changedByStaff && (
                        <p className="text-xs text-text-secondary">โดย: {log.changedByStaff.name ?? log.changedByStaff.nameEn}</p>
                      )}
                      {!log.changedByStaff && !log.changedBy && (
                        <p className="text-xs text-text-secondary">โดย: ผู้เยี่ยมชม</p>
                      )}
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
                      {/* Header: entry number + code + status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {visitEntries.length - idx}
                          </span>
                          <span className="text-xs font-mono text-text-muted">{entry.entryCode ?? `#${entry.id}`}</span>
                        </div>
                        <StatusBadge status={entry.status} size="sm" />
                      </div>

                      {/* Check-in / Check-out */}
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

                      {/* Location & Channel */}
                      <div className="space-y-1">
                        {(entry.area || entry.building || entry.floor) && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-text-secondary flex items-center gap-1"><MapPin size={12} /> สถานที่</span>
                            <span className="text-text-primary font-medium text-right">{[entry.building, entry.floor, entry.room].filter(Boolean).join(" / ") || entry.area}</span>
                          </div>
                        )}
                        {entry.checkinChannel && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-text-secondary">ช่องทาง Check-in</span>
                            <span className="text-text-primary font-medium text-right">
                              {entry.checkinChannel === "kiosk" ? "🖥️ Kiosk" : entry.checkinChannel === "counter" ? "🏢 Counter" : entry.checkinChannel === "mobile" ? "📱 Mobile" : entry.checkinChannel}
                            </span>
                          </div>
                        )}
                        {entry.hostStaff && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-text-secondary">ผู้พบ</span>
                            <span className="text-text-primary font-medium text-right">{entry.hostStaff.name}</span>
                          </div>
                        )}
                        {entry.companionsCount > 0 && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-text-secondary">ผู้ติดตาม</span>
                            <span className="text-text-primary font-medium text-right">{entry.companionsCount} คน</span>
                          </div>
                        )}
                        {entry.checkoutByStaff && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-text-secondary">Check-out โดย</span>
                            <span className="text-text-primary font-medium text-right">{entry.checkoutByStaff.name}</span>
                          </div>
                        )}
                        {entry.notes && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-text-secondary">หมายเหตุ</span>
                            <span className="text-text-primary text-right">{entry.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </div>
  );
}

// ===== Visitor Create Appointment Drawer =====
interface VPurpose { id: number; name: string; nameEn: string; icon: string | null; isActive: boolean; showOnWeb: boolean; allowedEntryModes: string; departmentRules: VDeptRule[]; }
interface VDeptRule { id: number; departmentId: number; requirePersonName: boolean; requireApproval: boolean; acceptFromWeb: boolean; followBusinessHours: boolean; isActive: boolean; department: { id: number; name: string; nameEn: string }; }
interface BHRule { id: number; type: string; daysOfWeek: number[] | null; specificDate: string | null; openTime: string; closeTime: string; isActive: boolean; }
interface VStaff { id: number; name: string; nameEn: string; position: string; department: { id: number; name: string }; }

/** Extract HH:MM from ISO datetime or raw time string (local timezone) */
function toHHMM(v: string): string {
  if (!v) return "00:00";
  // ISO datetime: parse as Date to get local time (handles UTC→local conversion)
  if (v.includes("T")) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }
  // Already HH:MM or HH:MM:SS
  const m = v.match(/^(\d{2}:\d{2})/);
  if (m) return m[1];
  return "00:00";
}

/** Snap time string to nearest 10-minute mark */
function snapTo10(t: string): string {
  if (!t) return t;
  const [h, m] = t.split(":").map(Number);
  const snapped = Math.round(m / 10) * 10;
  const fH = snapped >= 60 ? h + 1 : h;
  const fM = snapped >= 60 ? 0 : snapped;
  if (fH >= 24) return "23:50";
  return `${String(fH).padStart(2, "0")}:${String(fM).padStart(2, "0")}`;
}

/** Current time rounded up to next 10-min as "HH:MM" */
function getNowRounded(): string {
  const now = new Date();
  const m = Math.ceil(now.getMinutes() / 10) * 10;
  const h = m >= 60 ? now.getHours() + 1 : now.getHours();
  if (h >= 24) return "23:50";
  return `${String(h).padStart(2, "0")}:${String(m >= 60 ? 0 : m).padStart(2, "0")}`;
}

/** Today's date as YYYY-MM-DD */
function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ── Mini Calendar with holiday highlighting ───── */
function BhCalendar({ value, onChange, isDateClosed, bhHolidays, bhRegular }: {
  value: string;
  onChange: (v: string) => void;
  isDateClosed: (d: string) => boolean;
  bhHolidays: BHRule[];
  bhRegular: BHRule[];
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Closed day-of-week set (for graying weekend columns)
  const closedDows = new Set<number>();
  bhRegular.filter(r => toHHMM(r.openTime) === toHHMM(r.closeTime)).forEach(r => {
    (r.daysOfWeek ?? []).forEach(d => closedDows.add(d));
  });

  // Holiday dates set
  const holidayDates = new Set<string>();
  bhHolidays.forEach(h => {
    if (h.specificDate) holidayDates.add(h.specificDate.slice(0, 10));
  });

  const cells: { day: number; dateStr: string; closed: boolean; holiday: boolean; past: boolean; today: boolean; selected: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateStr = `${viewYear}-${mm}-${dd}`;
    const dow = new Date(viewYear, viewMonth, d).getDay();
    const isHoliday = holidayDates.has(dateStr);
    const isClosed = closedDows.has(dow) || isHoliday || isDateClosed(dateStr);
    const isPast = dateStr < todayStr;
    cells.push({ day: d, dateStr, closed: isClosed, holiday: isHoliday, past: isPast, today: dateStr === todayStr, selected: dateStr === value });
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-border">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-white rounded transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-bold text-text-primary">{monthNames[viewMonth]} {viewYear + 543}</span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-white rounded transition-colors"><ChevronRight size={16} /></button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-text-muted border-b border-border bg-gray-50/50 py-1">
        {dayNames.map((n, i) => (
          <div key={i} className={cn(closedDows.has(i) && "text-red-400")}>{n}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0 p-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {cells.map(c => {
          const disabled = c.closed || c.past;
          return (
            <button
              key={c.day}
              type="button"
              disabled={disabled}
              onClick={() => { if (!disabled) onChange(c.dateStr); }}
              className={cn(
                "h-9 w-full rounded-lg text-xs font-medium transition-all relative",
                c.selected && "bg-primary text-white shadow-sm",
                c.today && !c.selected && "ring-1 ring-primary/40",
                c.holiday && !c.selected && "bg-red-50 text-red-400",
                c.closed && !c.holiday && !c.selected && "bg-gray-50 text-gray-300",
                !disabled && !c.selected && !c.holiday && "hover:bg-primary/10 text-text-primary",
                disabled && !c.selected && "cursor-not-allowed",
              )}
              title={c.holiday ? "วันหยุดพิเศษ" : c.closed ? "วันหยุด" : undefined}
            >
              {c.day}
              {c.holiday && !c.selected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />}
            </button>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-border text-[10px] text-text-muted bg-gray-50/50">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200" /> วันหยุด</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 border border-gray-200" /> หยุดประจำ</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary" /> วันที่เลือก</span>
      </div>
    </div>
  );
}

function VisitorCreateDrawer({ open, onClose, visitorId, onSuccess }: { open: boolean; onClose: () => void; visitorId: number; onSuccess?: () => void }) {
  const [purposes, setPurposes] = useState<VPurpose[]>([]);
  const [loadingPurposes, setLoadingPurposes] = useState(true);

  // Step 1: Purpose & Department
  const [selectedPurpose, setSelectedPurpose] = useState<VPurpose | null>(null);
  const [selectedDeptRule, setSelectedDeptRule] = useState<VDeptRule | null>(null);

  // Step 2: Date/Time/Host
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [entryMode, setEntryMode] = useState<"single" | "period">("single");
  const [hostSearch, setHostSearch] = useState("");
  const [staffResults, setStaffResults] = useState<VStaff[]>([]);
  const [selectedHost, setSelectedHost] = useState<VStaff | null>(null);
  const [searchingStaff, setSearchingStaff] = useState(false);

  // Business hours
  const [bhRules, setBhRules] = useState<BHRule[]>([]);
  const [bhLoading, setBhLoading] = useState(false);

  // Step 3: Details
  const [purposeNote, setPurposeNote] = useState("");
  const [companionCount, setCompanionCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const createMut = useCreateAppointment();

  // Load purposes from API
  useEffect(() => {
    if (!open) return;
    async function load() {
      setLoadingPurposes(true);
      try {
        const res = await fetch("/api/visit-purposes");
        const json = await res.json();
        if (json.success) {
          const filtered = (json.data.visitPurposes as VPurpose[]).filter(
            (p) => p.isActive && p.showOnWeb && p.departmentRules.some((r) => r.acceptFromWeb && r.isActive)
          );
          setPurposes(filtered);
        }
      } catch (e) {
        console.error("Failed to load purposes:", e);
      } finally {
        setLoadingPurposes(false);
      }
    }
    load();
  }, [open]);

  // Staff search
  useEffect(() => {
    if (!hostSearch.trim() || hostSearch.length < 2 || !selectedDeptRule) return;
    const timer = setTimeout(async () => {
      setSearchingStaff(true);
      try {
        const res = await fetch(`/api/staff?search=${encodeURIComponent(hostSearch)}&departmentId=${selectedDeptRule.departmentId}&limit=5`);
        const json = await res.json();
        if (json.success) setStaffResults(json.data.staff ?? []);
      } catch { /* ignore */ } finally { setSearchingStaff(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [hostSearch, selectedDeptRule]);

  // Fetch business hours when followBusinessHours is true
  useEffect(() => {
    if (!selectedDeptRule?.followBusinessHours) { setBhRules([]); return; }
    let cancelled = false;
    setBhLoading(true);
    fetch("/api/business-hours").then(r => r.json()).then(json => {
      if (!cancelled && json.success) setBhRules((json.data.rules as BHRule[]).filter(r => r.isActive));
    }).catch(() => {}).finally(() => { if (!cancelled) setBhLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDeptRule]);

  const webDeptRules = selectedPurpose?.departmentRules.filter(r => r.acceptFromWeb && r.isActive) ?? [];
  const requirePersonName = selectedDeptRule?.requirePersonName ?? true;
  const requireApproval = selectedDeptRule?.requireApproval ?? true;
  const allowedModes = selectedPurpose?.allowedEntryModes ? selectedPurpose.allowedEntryModes.split(",") : ["single"];

  // Business hours helpers
  const bhFollowing = selectedDeptRule?.followBusinessHours && bhRules.length > 0;
  const bhRegular = bhRules.filter(r => r.type === "regular");
  const bhHolidays = bhRules.filter(r => r.type === "holiday");

  // Find regular rule for a given date
  const getBhForDate = (dateStr: string) => {
    if (!bhFollowing || !dateStr) return null;
    const d = new Date(dateStr);
    const dow = d.getDay(); // 0=Sun
    // Check holidays first
    const holiday = bhHolidays.find(h => h.specificDate?.startsWith(dateStr));
    if (holiday) return holiday;
    // Regular day
    return bhRegular.find(r => r.daysOfWeek?.includes(dow)) ?? null;
  };

  const isDateClosed = (dateStr: string) => {
    if (!bhFollowing || !dateStr) return false;
    const rule = getBhForDate(dateStr);
    if (!rule) return true; // no rule = closed
    const o = toHHMM(rule.openTime), c = toHHMM(rule.closeTime);
    return o === c; // 00:00/00:00 = closed
  };

  // Time bounds for selected date
  const bhForDate = bhFollowing ? getBhForDate(date) : null;
  const bhOpen = bhForDate ? toHHMM(bhForDate.openTime) : null;
  const bhClose = bhForDate ? toHHMM(bhForDate.closeTime) : null;
  const bhIsOpen = bhOpen !== null && bhClose !== null && bhOpen !== bhClose;
  // Time validity check
  const bhTimeValid = !bhFollowing || !date || !bhIsOpen || (timeStart >= bhOpen! && timeEnd <= bhClose! && timeStart < timeEnd);
  const bhDateValid = !bhFollowing || !date || !isDateClosed(date);

  // Same-day past time check
  const isToday = date === getTodayStr();
  const nowMin = isToday ? getNowRounded() : null;
  const minStartTime = bhIsOpen
    ? (nowMin && nowMin > bhOpen! ? nowMin : bhOpen!)
    : (nowMin ?? undefined);
  const pastTimeValid = !isToday || !timeStart || timeStart >= (nowMin ?? "00:00");

  // Auto-set time when date changes and business hours apply
  useEffect(() => {
    if (!bhFollowing || !date) return;
    const rule = getBhForDate(date);
    if (!rule) return;
    const o = toHHMM(rule.openTime), c = toHHMM(rule.closeTime);
    if (o === c) return; // closed day
    const today = date === getTodayStr();
    const nowR = today ? getNowRounded() : null;
    const effectiveOpen = nowR && nowR > o ? nowR : o;
    if (timeStart < effectiveOpen) setTimeStart(effectiveOpen);
    if (timeEnd > c || timeEnd <= timeStart) setTimeEnd(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, bhFollowing, bhRules]);

  const handlePurposeChange = (p: VPurpose | null) => {
    setSelectedPurpose(p);
    setSelectedDeptRule(null);
    setSelectedHost(null);
    setHostSearch("");
    setBhRules([]);
    if (p) {
      const modes = p.allowedEntryModes ? p.allowedEntryModes.split(",") : ["single"];
      if (modes.length === 1) setEntryMode(modes[0] as "single" | "period");
    }
  };

  const canSubmit = selectedPurpose && selectedDeptRule && date && timeStart && timeEnd && purposeNote.trim()
    && (!requirePersonName || selectedHost) && bhDateValid && bhTimeValid && pastTimeValid;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const type = selectedPurpose!.nameEn?.toLowerCase().replace(/[^a-z]/g, "-").slice(0, 30) || "general";
      await createMut.mutateAsync({
        visitorId,
        visitPurposeId: selectedPurpose!.id,
        departmentId: selectedDeptRule!.departmentId,
        hostStaffId: selectedHost?.id || null,
        type,
        entryMode,
        date,
        dateEnd: entryMode === "period" ? dateEnd : undefined,
        timeStart,
        timeEnd,
        purpose: purposeNote,
        companions: companionCount,
        notes,
        channel: "web",
      } as any);
      // Reset & close
      setSelectedPurpose(null);
      setSelectedDeptRule(null);
      setDate("");
      setDateEnd("");
      setTimeStart("09:00");
      setTimeEnd("10:00");
      setPurposeNote("");
      setCompanionCount(0);
      setNotes("");
      onClose();
      onSuccess?.();
    } catch (e: any) {
      setSubmitError(e?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="สร้างนัดหมายใหม่" subtitle="ระบุวัตถุประสงค์ วันเวลา และรายละเอียดการนัดหมาย" width="w-[560px]">
      <div className="p-6 space-y-6">

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            {submitError}
          </div>
        )}

        {/* Section 1: Purpose */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Building2 size={16} />
            วัตถุประสงค์และสถานที่
          </h3>

          {loadingPurposes ? (
            <div className="text-center py-4 text-text-muted text-sm">กำลังโหลด...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {purposes.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePurposeChange(selectedPurpose?.id === p.id ? null : p)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                    selectedPurpose?.id === p.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-text-secondary hover:border-primary/30"
                  )}
                >
                  <span>{p.icon ?? "📋"} {p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Department selection */}
          {selectedPurpose && webDeptRules.length > 0 && (
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-2">เลือกหน่วยงาน</label>
              <div className="space-y-1.5">
                {webDeptRules.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedDeptRule(selectedDeptRule?.id === r.id ? null : r); setSelectedHost(null); setHostSearch(""); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left",
                      selectedDeptRule?.id === r.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <MapPin size={16} className={selectedDeptRule?.id === r.id ? "text-primary" : "text-text-muted"} />
                    <span className={cn("text-sm font-medium", selectedDeptRule?.id === r.id ? "text-primary" : "text-text-primary")}>{r.department.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Approval badge */}
          {selectedDeptRule && (
            <div className="flex items-center gap-2 flex-wrap">
              {requireApproval ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={12} /> ต้องรออนุมัติ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle size={12} /> อนุมัติอัตโนมัติ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Date/Time & Host */}
        {selectedDeptRule && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Calendar size={16} />
              วันเวลาและผู้พบ
            </h3>

            {/* Business hours info */}
            {bhFollowing && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-sm text-cyan-800 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <Clock size={14} className="text-cyan-600" />
                  เวลาทำการ
                </div>
                {bhRegular.filter(r => toHHMM(r.openTime) !== toHHMM(r.closeTime)).map(r => {
                  const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
                  const days = (r.daysOfWeek ?? []).map(d => dayNames[d]).join(", ");
                  return <p key={r.id} className="text-xs">{days}: {toHHMM(r.openTime)} - {toHHMM(r.closeTime)}</p>;
                })}
                {bhRegular.filter(r => toHHMM(r.openTime) === toHHMM(r.closeTime)).length > 0 && (
                  <p className="text-xs text-cyan-600">
                    วันหยุด: {bhRegular.filter(r => toHHMM(r.openTime) === toHHMM(r.closeTime)).map(r => {
                      const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
                      return (r.daysOfWeek ?? []).map(d => dayNames[d]).join(", ");
                    }).join(", ")}
                  </p>
                )}
                {bhHolidays.length > 0 && (
                  <p className="text-xs text-cyan-600">
                    วันหยุดพิเศษ: {bhHolidays.map(h => {
                      const d = new Date(h.specificDate!);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }).join(", ")}
                  </p>
                )}
              </div>
            )}
            {bhLoading && <p className="text-xs text-text-muted">กำลังโหลดเวลาทำการ...</p>}

            {/* Entry mode */}
            {allowedModes.length > 1 && (
              <div className="flex gap-2">
                {allowedModes.includes("single") && (
                  <button onClick={() => setEntryMode("single")} className={cn("flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all", entryMode === "single" ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary")}>
                    🔹 ครั้งเดียว
                  </button>
                )}
                {allowedModes.includes("period") && (
                  <button onClick={() => setEntryMode("period")} className={cn("flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all", entryMode === "period" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-border text-text-secondary")}>
                    <Calendar size={14} className="inline mr-1" /> ช่วงเวลา
                  </button>
                )}
              </div>
            )}

            {/* Date fields */}
            {entryMode === "single" ? (
              <div className="space-y-3">
                {/* Mini Calendar */}
                {bhFollowing ? (
                  <BhCalendar
                    value={date}
                    onChange={setDate}
                    isDateClosed={isDateClosed}
                    bhHolidays={bhHolidays}
                    bhRegular={bhRegular}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันที่</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  </div>
                )}

                {/* Time inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม {bhIsOpen && <span className="text-cyan-600 normal-case">({bhOpen})</span>}</label>
                    <input type="time" step={600} value={timeStart} onChange={e => setTimeStart(snapTo10(e.target.value))} min={minStartTime} max={bhIsOpen ? bhClose! : undefined} className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", (!bhTimeValid || !pastTimeValid) ? "border-red-400" : "border-border")} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด {bhIsOpen && <span className="text-cyan-600 normal-case">({bhClose})</span>}</label>
                    <input type="time" step={600} value={timeEnd} onChange={e => setTimeEnd(snapTo10(e.target.value))} min={bhIsOpen ? bhOpen! : undefined} max={bhIsOpen ? bhClose! : undefined} className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", !bhTimeValid ? "border-red-400" : "border-border")} />
                  </div>
                </div>

                {date && !bhDateValid && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> วันที่เลือกเป็นวันหยุด ไม่สามารถนัดหมายได้</p>
                )}
                {date && bhDateValid && !pastTimeValid && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> ไม่สามารถเลือกเวลาที่ผ่านมาแล้วในวันนี้ (ขั้นต่ำ {nowMin})</p>
                )}
                {date && bhDateValid && pastTimeValid && !bhTimeValid && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> เวลาต้องอยู่ภายในเวลาทำการ ({bhOpen} - {bhClose})</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-purple-50/50 border border-purple-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันเริ่มต้น</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันสิ้นสุด</label>
                    <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                    <input type="time" step={600} value={timeStart} onChange={e => setTimeStart(snapTo10(e.target.value))} min={nowMin ?? undefined} className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500", isToday && !pastTimeValid ? "border-red-400" : "border-border")} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                    <input type="time" step={600} value={timeEnd} onChange={e => setTimeEnd(snapTo10(e.target.value))} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </div>
                </div>
                {isToday && !pastTimeValid && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> ไม่สามารถเลือกเวลาที่ผ่านมาแล้วในวันนี้ (ขั้นต่ำ {nowMin})</p>
                )}
              </div>
            )}

            {/* Host search */}
            {requirePersonName && (
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                  ผู้ติดต่อ (เจ้าหน้าที่ผู้รับพบ) <span className="text-error">*</span>
                </label>
                {selectedHost ? (
                  <div className="bg-primary-50 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">{selectedHost.name}</p>
                      <p className="text-[11px] text-text-muted truncate">{selectedHost.position} • {selectedHost.department.name}</p>
                    </div>
                    <button onClick={() => { setSelectedHost(null); setHostSearch(""); }} className="text-xs text-primary font-bold px-2 py-1 hover:bg-primary/10 rounded-lg">เปลี่ยน</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="ค้นหาชื่อเจ้าหน้าที่"
                      leftIcon={<Search size={16} />}
                      value={hostSearch}
                      onChange={e => setHostSearch(e.target.value)}
                    />
                    {searchingStaff && <p className="text-xs text-text-muted mt-1">กำลังค้นหา...</p>}
                    {staffResults.length > 0 && !selectedHost && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 max-h-[200px] overflow-y-auto">
                        {staffResults.map(s => (
                          <button key={s.id} onClick={() => { setSelectedHost(s); setHostSearch(""); setStaffResults([]); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-0 text-left">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Users size={14} className="text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-primary">{s.name}</p>
                              <p className="text-[11px] text-text-muted">{s.position} • {s.department.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Details */}
        {selectedDeptRule && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <FileText size={16} />
              รายละเอียด
            </h3>

            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วัตถุประสงค์ / หมายเหตุ <span className="text-error">*</span></label>
              <textarea
                value={purposeNote}
                onChange={e => setPurposeNote(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                placeholder="ระบุวัตถุประสงค์หรือรายละเอียดเพิ่มเติม"
              />
            </div>

            <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-text-primary font-medium">จำนวนผู้ติดตาม</label>
              <div className="flex items-center gap-3 ml-auto">
                <button onClick={() => setCompanionCount(Math.max(0, companionCount - 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-white transition-colors">
                  <span className="text-lg">−</span>
                </button>
                <span className="font-bold text-lg w-8 text-center">{companionCount}</span>
                <button onClick={() => setCompanionCount(Math.min(50, companionCount + 1))} className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors">
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">หมายเหตุเพิ่มเติม</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                placeholder="หมายเหตุ (ถ้ามี)"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border flex items-center justify-between bg-white">
          <div className="text-xs text-text-muted">
            {companionCount > 0 && <span>ผู้ติดตาม {companionCount} คน</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? (
                <span className="flex items-center gap-2"><Clock size={16} className="animate-spin" /> กำลังบันทึก...</span>
              ) : (
                <><Check size={16} className="mr-1.5" /> ส่งคำขอนัดหมาย</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ===== Create Appointment Drawer =====
function CreateAppointmentDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPurposeId, setSelectedPurposeId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [hostSearch, setHostSearch] = useState("");
  const [selectedHost, setSelectedHost] = useState<typeof staffMembers[0] | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("single");
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [offerWifiChecked, setOfferWifiChecked] = useState(false);

  // Companion mode
  const [companionMode, setCompanionMode] = useState<"count" | "names">("count");
  const [companionCount, setCompanionCount] = useState(0);
  const [companionList, setCompanionList] = useState<CompanionEntry[]>([]);

  // Blacklist alerts
  const [blacklistAlerts, setBlacklistAlerts] = useState<string[]>([]);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify on check-in toggle
  const [notifyOnCheckin, setNotifyOnCheckin] = useState(true);

  // WiFi eligibility + Rule resolution
  const selectedPurpose = visitPurposeConfigs.find(p => p.id === selectedPurposeId);
  const allowedModes = selectedPurpose?.allowedEntryModes ?? ["single"];

  // ═══════ Dynamic Rule: resolve from purpose + department ═══════
  const selectedRule = selectedPurpose && selectedDeptId
    ? selectedPurpose.departmentRules.find(r => r.departmentId === selectedDeptId && r.isActive)
    : null;
  const requirePersonName = selectedRule?.requirePersonName ?? true;
  const requireApproval = selectedRule?.requireApproval ?? true;

  const wifiEligible = selectedRule?.offerWifi
    ?? (selectedPurpose?.departmentRules.some(r =>
      (selectedDeptId ? r.departmentId === selectedDeptId : true) && r.offerWifi
    ) ?? false);

  // Same-day past time check
  const isToday = date === getTodayStr();
  const nowMin = isToday ? getNowRounded() : null;
  const pastTimeValid = !isToday || !timeStart || timeStart >= (nowMin ?? "00:00");

  // Host search
  const filteredHosts = useMemo(() => {
    if (hostSearch.length < 1) return [];
    return staffMembers.filter(s =>
      s.role !== "security" && (
        s.name.includes(hostSearch) ||
        s.nameEn.toLowerCase().includes(hostSearch.toLowerCase()) ||
        s.department.name.includes(hostSearch)
      )
    ).slice(0, 5);
  }, [hostSearch]);

  // Blacklist check function
  const checkBlacklist = useCallback((name: string): boolean => {
    const nameLower = name.toLowerCase().trim();
    return blocklist.some(entry => {
      const blockedName = entry.visitor.name.toLowerCase();
      return blockedName.includes(nameLower) || nameLower.includes(blockedName);
    });
  }, []);

  // Check primary visitor blacklist
  const checkPrimaryBlacklist = useCallback(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName || fullName === " ") return;
    const alerts: string[] = [];
    if (checkBlacklist(fullName)) {
      alerts.push(`⚠️ "${fullName}" อยู่ในรายชื่อ Blacklist!`);
    }
    // Check companion names too
    companionList.forEach(c => {
      const cName = `${c.firstName} ${c.lastName}`.trim();
      if (cName && checkBlacklist(cName)) {
        alerts.push(`⚠️ ผู้ติดตาม "${cName}" อยู่ในรายชื่อ Blacklist!`);
      }
    });
    setBlacklistAlerts(alerts);
  }, [firstName, lastName, companionList, checkBlacklist]);

  // Add companion manually
  const addCompanion = () => {
    setCompanionList(prev => [...prev, {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
    }]);
  };

  // Remove companion
  const removeCompanion = (id: string) => {
    setCompanionList(prev => prev.filter(c => c.id !== id));
  };

  // Update companion
  const updateCompanion = (id: string, field: keyof CompanionEntry, value: string) => {
    setCompanionList(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      // Check blacklist for this companion
      if (field === "firstName" || field === "lastName") {
        const cName = `${field === "firstName" ? value : c.firstName} ${field === "lastName" ? value : c.lastName}`.trim();
        updated.isBlacklisted = cName.length > 2 ? checkBlacklist(cName) : false;
      }
      return updated;
    }));
  };

  // Download Excel template (CSV)
  const downloadTemplate = () => {
    const BOM = "\uFEFF";
    const headers = "ชื่อ,นามสกุล,บริษัท/หน่วยงาน,เบอร์โทร";
    const sample1 = "สมศักดิ์,จริงใจ,บริษัท ABC จำกัด,081-234-5678";
    const sample2 = "Jane,Doe,World Tourism Org,092-345-6789";
    const csv = BOM + [headers, sample1, sample2].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companion_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV/Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      // Skip header line
      const dataLines = lines.slice(1);
      const newCompanions: CompanionEntry[] = dataLines.map((line, idx) => {
        const cols = line.split(",").map(c => c.trim());
        const cFirstName = cols[0] || "";
        const cLastName = cols[1] || "";
        const fullName = `${cFirstName} ${cLastName}`.trim();
        return {
          id: `import-${Date.now()}-${idx}`,
          firstName: cFirstName,
          lastName: cLastName,
          company: cols[2] || "",
          phone: cols[3] || "",
          isBlacklisted: fullName.length > 2 ? checkBlacklist(fullName) : false,
        };
      }).filter(c => c.firstName || c.lastName);
      setCompanionList(prev => [...prev, ...newCompanions]);
      setCompanionMode("names");
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Mutation hook
  const createApptMut = useCreateAppointment();

  // Save handler
  const handleSave = async () => {
    checkPrimaryBlacklist();
    const appointmentData = {
      firstName, lastName, company, phone,
      purposeId: selectedPurposeId,
      departmentId: selectedDeptId,
      hostId: requirePersonName ? selectedHost?.id : null,
      entryMode, date, dateEnd, timeStart, timeEnd,
      offerWifi: offerWifiChecked,
      notifyOnCheckin,
      companionMode, companionCount,
      companions: companionList,
      channel: "web",
    };
    await createApptMut.mutateAsync(appointmentData as any);
    onClose();
  };

  // Active visit purposes
  const activePurposes = visitPurposeConfigs.filter(p => p.isActive);

  // Department options based on selected purpose
  const deptOptions = selectedPurpose
    ? selectedPurpose.departmentRules.filter(r => r.isActive).map(r => {
      const dept = departments.find(d => d.id === r.departmentId);
      return dept ? { id: dept.id, name: dept.name, floor: getDepartmentLocation(dept.id)?.floor ?? "" } : null;
    }).filter(Boolean)
    : [];

  // Handle purpose change — auto-select entry mode + clear host
  const handlePurposeChange = (purposeId: number | null) => {
    setSelectedPurposeId(purposeId);
    setSelectedDeptId(null);
    setSelectedHost(null);
    setHostSearch("");
    const purpose = visitPurposeConfigs.find(p => p.id === purposeId);
    const modes = purpose?.allowedEntryModes ?? ["single"];
    if (modes.length === 1) {
      setEntryMode(modes[0]);
    } else if (!modes.includes(entryMode)) {
      setEntryMode(modes[0]);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="สร้างนัดหมายใหม่"
      subtitle="เจ้าหน้าที่สร้างนัดหมายให้ผู้จะมาติดต่อ"
      width="w-[640px]"
    >
      <div className="p-6 space-y-6">

          {/* Blacklist Alerts */}
          {blacklistAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-error font-bold text-sm mb-1">
                <AlertTriangle size={16} />
                แจ้งเตือน Blacklist
              </div>
              {blacklistAlerts.map((alert, i) => (
                <p key={i} className="text-sm text-red-700">{alert}</p>
              ))}
            </div>
          )}

          {/* Section 1: Primary Visitor Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Users size={16} />
              ข้อมูลผู้ติดต่อหลัก
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ชื่อ"
                placeholder="ระบุชื่อ"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={checkPrimaryBlacklist}
              />
              <Input
                label="นามสกุล"
                placeholder="ระบุนามสกุล"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={checkPrimaryBlacklist}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="บริษัท / หน่วยงาน"
                placeholder="ระบุสังกัด (ถ้ามี)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <Input
                label="เบอร์โทรศัพท์"
                placeholder="0XX-XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Purpose & Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Building2 size={16} />
              วัตถุประสงค์และสถานที่
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วัตถุประสงค์การมา</label>
                <div className="relative">
                  <select
                    value={selectedPurposeId ?? ""}
                    onChange={(e) => handlePurposeChange(e.target.value ? Number(e.target.value) : null)}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none pr-8"
                  >
                    <option value="">-- เลือกวัตถุประสงค์ --</option>
                    {activePurposes.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">หน่วยงาน / สถานที่</label>
                <div className="relative">
                  <select
                    value={selectedDeptId ?? ""}
                    onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedPurposeId}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none pr-8 disabled:opacity-50"
                  >
                    <option value="">-- เลือกหน่วยงาน --</option>
                    {deptOptions.map(d => d && (
                      <option key={d.id} value={d.id}>{d.name} ({getDepartmentLocation(d.id)?.floor ?? ""})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Approval & Rule Status Badges */}
            {selectedRule && (
              <div className="flex items-center gap-2 flex-wrap">
                {requireApproval ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock size={12} /> ต้องรออนุมัติ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle size={12} /> อนุมัติอัตโนมัติ
                  </span>
                )}
                {!requirePersonName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    ไม่ต้องระบุบุคคลที่ต้องการพบ
                  </span>
                )}
              </div>
            )}

            {/* Host search — conditional on requirePersonName */}
            {requirePersonName && (
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ผู้ติดต่อ (เจ้าหน้าที่ผู้รับพบ) {requirePersonName && <span className="text-error">*</span>}</label>
              {selectedHost ? (
                <div className="bg-primary-50 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary">{selectedHost.name}</p>
                    <p className="text-[11px] text-text-muted truncate">{selectedHost.position} • {selectedHost.department.name}</p>
                  </div>
                  <button onClick={() => setSelectedHost(null)} className="text-xs text-primary font-bold px-2 py-1 hover:bg-primary/10 rounded-lg">
                    เปลี่ยน
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="ค้นหาชื่อเจ้าหน้าที่ หรือหน่วยงาน"
                    leftIcon={<Search size={16} />}
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                  />
                  {filteredHosts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 max-h-[200px] overflow-y-auto">
                      {filteredHosts.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedHost(s); setHostSearch(""); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-0 text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">{s.name}</p>
                            <p className="text-[11px] text-text-muted">{s.position} • {s.department.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Notify on Check-in toggle */}
            {selectedRule && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <Bell size={18} className="text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">แจ้งเตือนเมื่อ Visitor Check-in</p>
                  <p className="text-[11px] text-text-muted">รับแจ้งเตือนทาง LINE / Email เมื่อผู้มาติดต่อ check-in</p>
                </div>
                <button
                  onClick={() => setNotifyOnCheckin(!notifyOnCheckin)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    notifyOnCheckin ? "bg-primary" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                    notifyOnCheckin ? "translate-x-5.5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            )}

            {/* Entry Mode Selection */}
            {selectedPurposeId && (
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase text-text-secondary">ประเภทการเข้าพื้นที่</label>
                <div className="flex gap-2">
                  {allowedModes.includes("single") && (
                    <button
                      onClick={() => setEntryMode("single")}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                        entryMode === "single"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-text-secondary hover:border-primary/30"
                      )}
                    >
                      <span className="flex items-center gap-2">🔹 ขออนุญาตแบบ 1 ครั้ง</span>
                      <p className="text-[10px] mt-0.5 font-normal opacity-70">กำหนดวันที่ เวลาเริ่ม และเวลาสิ้นสุด</p>
                    </button>
                  )}
                  {allowedModes.includes("period") && (
                    <button
                      onClick={() => setEntryMode("period")}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                        entryMode === "period"
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-border text-text-secondary hover:border-purple-300"
                      )}
                    >
                      <span className="flex items-center gap-2"><Calendar size={14} /> ขออนุญาตตามช่วงเวลา</span>
                      <p className="text-[10px] mt-0.5 font-normal opacity-70">กำหนดวันเวลาเริ่ม และวันเวลาสิ้นสุด</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Date & Time — Single mode */}
            {entryMode === "single" && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันที่นัดหมาย</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      step={600}
                      value={timeStart}
                      onChange={(e) => setTimeStart(snapTo10(e.target.value))}
                      min={nowMin ?? undefined}
                      className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary", isToday && !pastTimeValid ? "border-red-400" : "border-border")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      step={600}
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(snapTo10(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                </div>
                {isToday && !pastTimeValid && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertTriangle size={12} /> ไม่สามารถเลือกเวลาที่ผ่านมาแล้วในวันนี้ (ขั้นต่ำ {nowMin})</p>
                )}
              </>
            )}

            {/* Date & Time — Period mode */}
            {entryMode === "period" && (
              <div className="space-y-3 bg-purple-50/50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                  <Calendar size={14} />
                  กำหนดช่วงเวลาเข้าพื้นที่
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันเริ่มต้น</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันสิ้นสุด</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      step={600}
                      value={timeStart}
                      onChange={(e) => setTimeStart(snapTo10(e.target.value))}
                      min={nowMin ?? undefined}
                      className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500", isToday && !pastTimeValid ? "border-red-400" : "border-border")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      step={600}
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(snapTo10(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WiFi Offer */}
            {wifiEligible && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Wifi size={18} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">เสนอ WiFi ให้ผู้มาติดต่อ</p>
                  <p className="text-[11px] text-blue-600">ประเภทการมานี้รองรับการให้ WiFi</p>
                </div>
                <button
                  onClick={() => setOfferWifiChecked(!offerWifiChecked)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    offerWifiChecked ? "bg-primary" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                    offerWifiChecked ? "translate-x-5.5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            )}
            {!wifiEligible && selectedPurposeId && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <WifiOff size={18} className="text-gray-400" />
                <p className="text-sm text-text-muted">ประเภทการมานี้ไม่มีการเสนอ WiFi</p>
              </div>
            )}
          </div>

          {/* Section 3: Companions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <UserPlus size={16} />
              ผู้ติดตาม
            </h3>

            {/* Mode selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setCompanionMode("count")}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all",
                  companionMode === "count"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30"
                )}
              >
                ระบุจำนวนเท่านั้น
                <p className="text-[10px] mt-0.5 font-normal opacity-70">เฉพาะผู้ติดต่อหลัก check-in ได้</p>
              </button>
              <button
                onClick={() => setCompanionMode("names")}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all",
                  companionMode === "names"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30"
                )}
              >
                ระบุรายชื่อผู้ติดตาม
                <p className="text-[10px] mt-0.5 font-normal opacity-70">ทุกคนที่ระบุ check-in แยกกันได้</p>
              </button>
            </div>

            {companionMode === "count" && (
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <label className="text-sm text-text-primary font-medium">จำนวนผู้ติดตาม</label>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => setCompanionCount(Math.max(0, companionCount - 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <span className="text-lg">−</span>
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{companionCount}</span>
                  <button
                    onClick={() => setCompanionCount(Math.min(50, companionCount + 1))}
                    className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>
              </div>
            )}

            {companionMode === "names" && (
              <div className="space-y-3">
                {/* Excel Import/Export buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download size={14} className="mr-1.5" />
                    ดาวน์โหลดแบบฟอร์ม
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} className="mr-1.5" />
                    นำเข้าจากไฟล์ Excel/CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="ghost" size="sm" onClick={addCompanion} className="ml-auto text-primary">
                    <Plus size={14} className="mr-1" />
                    เพิ่มรายชื่อ
                  </Button>
                </div>

                {/* Companion table */}
                {companionList.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-text-secondary">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">ชื่อ</th>
                          <th className="px-3 py-2 text-left">นามสกุล</th>
                          <th className="px-3 py-2 text-left">บริษัท</th>
                          <th className="px-3 py-2 text-left">เบอร์โทร</th>
                          <th className="px-3 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {companionList.map((c, idx) => (
                          <tr key={c.id} className={cn(c.isBlacklisted && "bg-red-50")}>
                            <td className="px-3 py-2 text-text-muted">{idx + 1}</td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.firstName}
                                onChange={(e) => updateCompanion(c.id, "firstName", e.target.value)}
                                placeholder="ชื่อ"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.lastName}
                                onChange={(e) => updateCompanion(c.id, "lastName", e.target.value)}
                                placeholder="นามสกุล"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.company || ""}
                                onChange={(e) => updateCompanion(c.id, "company", e.target.value)}
                                placeholder="บริษัท"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.phone || ""}
                                onChange={(e) => updateCompanion(c.id, "phone", e.target.value)}
                                placeholder="เบอร์โทร"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <div className="flex items-center gap-1 justify-center">
                                {c.isBlacklisted && (
                                  <span title="อยู่ใน Blacklist"><AlertTriangle size={14} className="text-error" /></span>
                                )}
                                <button
                                  onClick={() => removeCompanion(c.id)}
                                  className="h-7 w-7 rounded-full text-text-muted hover:bg-red-50 hover:text-error flex items-center justify-center transition-colors"
                                  title="ลบ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {companionList.length === 0 && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <FileSpreadsheet size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm text-text-muted">ยังไม่มีรายชื่อผู้ติดตาม</p>
                    <p className="text-xs text-text-muted mt-1">เพิ่มด้วยมือ หรือ นำเข้าจากไฟล์ Excel/CSV</p>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border flex items-center justify-between bg-white">
          <div className="text-xs text-text-muted">
            {companionMode === "names" && companionList.length > 0 && (
              <span>ผู้ติดตาม {companionList.length} คน{companionList.some(function(c) { return c.isBlacklisted; }) && " • ⚠️ พบ Blacklist"}</span>
            )}
            {companionMode === "count" && companionCount > 0 && (
              <span>ผู้ติดตาม {companionCount} คน (ไม่ระบุชื่อ)</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button variant="primary" onClick={handleSave}>
              <Check size={16} className="mr-1.5" />
              บันทึกนัดหมาย
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ===== Edit Appointment Drawer =====
function EditAppointmentDrawer({ open, onClose, appointment, isVisitor, onNotify }: { open: boolean; onClose: () => void; appointment: Appointment; isVisitor?: boolean; onNotify?: (msg: string, type?: "info" | "success" | "warning" | "error") => void }) {
  // Pre-fill from appointment data
  const [firstName, setFirstName] = useState(appointment.visitor?.firstName ?? appointment.visitor?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(appointment.visitor?.lastName ?? appointment.visitor?.name?.split(" ").slice(1).join(" ") ?? "");
  const [company, setCompany] = useState(appointment.visitor?.company ?? "");
  const [phone, setPhone] = useState(appointment.visitor?.phone ?? "");
  const [selectedPurposeId, setSelectedPurposeId] = useState<number | null>(
    (appointment as any).visitPurposeId ?? (appointment as any).visitPurpose?.id ?? null
  );
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(
    (appointment as any).departmentId ?? (appointment as any).department?.id ?? null
  );
  const [hostSearch, setHostSearch] = useState("");
  const [selectedHost, setSelectedHost] = useState<typeof staffMembers[0] | null>(() => {
    const host = appointment.host;
    if (!host) return null;
    const found = staffMembers.find(s => s.id === host.id);
    return found ?? null;
  });
  const [entryMode, setEntryMode] = useState<EntryMode>(appointment.entryMode ?? "single");
  const [date, setDate] = useState(appointment.date ?? "");
  const [dateEnd, setDateEnd] = useState(appointment.dateEnd ?? "");
  const [timeStart, setTimeStart] = useState(appointment.timeStart ?? "09:00");
  const [timeEnd, setTimeEnd] = useState(appointment.timeEnd ?? "10:00");
  const [purpose, setPurpose] = useState(appointment.purpose ?? "");
  const [offerWifiChecked, setOfferWifiChecked] = useState(appointment.offerWifi ?? false);

  // Companion mode
  const [companionMode, setCompanionMode] = useState<"count" | "names">(
    appointment.companionNames && appointment.companionNames.length > 0 ? "names" : "count"
  );
  const [companionCount, setCompanionCount] = useState(appointment.companions ?? 0);
  const [companionList, setCompanionList] = useState<CompanionEntry[]>(() => {
    if (appointment.companionNames && appointment.companionNames.length > 0) {
      return appointment.companionNames.map((name, i) => ({
        id: `existing-${i}`,
        firstName: typeof name === "string" ? name.split(" ")[0] : (name as any).firstName ?? "",
        lastName: typeof name === "string" ? name.split(" ").slice(1).join(" ") : (name as any).lastName ?? "",
        company: (name as any).company ?? "",
        phone: (name as any).phone ?? "",
      }));
    }
    return [];
  });

  const [blacklistAlerts, setBlacklistAlerts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WiFi eligibility
  const selectedPurpose = visitPurposeConfigs.find(p => p.id === selectedPurposeId);
  const allowedModes = selectedPurpose?.allowedEntryModes ?? ["single"];
  const wifiEligible = selectedPurpose?.departmentRules.some(r =>
    (selectedDeptId ? r.departmentId === selectedDeptId : true) && r.offerWifi
  ) ?? false;

  // Same-day past time check
  const isToday = date === getTodayStr();
  const nowMin = isToday ? getNowRounded() : null;
  const pastTimeValid = !isToday || !timeStart || timeStart >= (nowMin ?? "00:00");

  // Host search
  const filteredHosts = useMemo(() => {
    if (hostSearch.length < 1) return [];
    return staffMembers.filter(s =>
      s.role !== "security" && (
        s.name.includes(hostSearch) ||
        s.nameEn.toLowerCase().includes(hostSearch.toLowerCase()) ||
        s.department.name.includes(hostSearch)
      )
    ).slice(0, 5);
  }, [hostSearch]);

  // Blacklist check function
  const checkBlacklist = useCallback((name: string): boolean => {
    const nameLower = name.toLowerCase().trim();
    return blocklist.some(entry => {
      const blockedName = entry.visitor.name.toLowerCase();
      return blockedName.includes(nameLower) || nameLower.includes(blockedName);
    });
  }, []);

  const checkPrimaryBlacklist = useCallback(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName || fullName === " ") return;
    const alerts: string[] = [];
    if (checkBlacklist(fullName)) {
      alerts.push(`⚠️ "${fullName}" อยู่ในรายชื่อ Blacklist!`);
    }
    companionList.forEach(c => {
      const cName = `${c.firstName} ${c.lastName}`.trim();
      if (cName && checkBlacklist(cName)) {
        alerts.push(`⚠️ ผู้ติดตาม "${cName}" อยู่ในรายชื่อ Blacklist!`);
      }
    });
    setBlacklistAlerts(alerts);
  }, [firstName, lastName, companionList, checkBlacklist]);

  const addCompanion = () => {
    setCompanionList(prev => [...prev, { id: Date.now().toString(), firstName: "", lastName: "" }]);
  };

  const removeCompanion = (id: string) => {
    setCompanionList(prev => prev.filter(c => c.id !== id));
  };

  const updateCompanion = (id: string, field: keyof CompanionEntry, value: string) => {
    setCompanionList(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      if (field === "firstName" || field === "lastName") {
        const cName = `${field === "firstName" ? value : c.firstName} ${field === "lastName" ? value : c.lastName}`.trim();
        updated.isBlacklisted = cName.length > 2 ? checkBlacklist(cName) : false;
      }
      return updated;
    }));
  };

  const downloadTemplate = () => {
    const BOM = "\uFEFF";
    const headers = "ชื่อ,นามสกุล,บริษัท/หน่วยงาน,เบอร์โทร";
    const sample1 = "สมศักดิ์,จริงใจ,บริษัท ABC จำกัด,081-234-5678";
    const csv = BOM + [headers, sample1].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "companion_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const dataLines = lines.slice(1);
      const newCompanions: CompanionEntry[] = dataLines.map((line, idx) => {
        const cols = line.split(",").map(c => c.trim());
        const cFirstName = cols[0] || "";
        const cLastName = cols[1] || "";
        const fullName = `${cFirstName} ${cLastName}`.trim();
        return {
          id: `import-${Date.now()}-${idx}`,
          firstName: cFirstName, lastName: cLastName,
          company: cols[2] || "", phone: cols[3] || "",
          isBlacklisted: fullName.length > 2 ? checkBlacklist(fullName) : false,
        };
      }).filter(c => c.firstName || c.lastName);
      setCompanionList(prev => [...prev, ...newCompanions]);
      setCompanionMode("names");
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateApptMut = useUpdateAppointment();
  const approveMut = useApproveAppointment();
  const rejectMut = useRejectAppointment();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<"" | "save" | "approve" | "saveApprove" | "reject">("");

  const isPending = appointment.status === "pending";
  const canStaffApprove = !isVisitor && isPending;

  const handleSave = async () => {
    checkPrimaryBlacklist();
    setActionLoading("save");
    try {
      const data: any = {
        id: appointment.id,
        purpose,
        entryMode, date, dateEnd, timeStart, timeEnd,
        offerWifi: offerWifiChecked,
        hostStaffId: selectedHost?.id,
        visitPurposeId: selectedPurposeId,
        departmentId: selectedDeptId,
        companionsCount: companionMode === "names" ? companionList.length : companionCount,
      };
      if (companionMode === "names" && companionList.length > 0) {
        data.companionNames = companionList.map(c => ({
          firstName: c.firstName, lastName: c.lastName, company: c.company, phone: c.phone,
        }));
      }
      await updateApptMut.mutateAsync(data);
      onNotify?.("บันทึกการแก้ไขเรียบร้อยแล้ว", "success");
      onClose();
    } catch { onNotify?.("ไม่สามารถบันทึกได้ กรุณาลองใหม่", "error"); }
    finally { setActionLoading(""); }
  };

  const handleSaveAndApprove = async () => {
    checkPrimaryBlacklist();
    setActionLoading("saveApprove");
    try {
      const data: any = {
        id: appointment.id,
        purpose,
        entryMode, date, dateEnd, timeStart, timeEnd,
        offerWifi: offerWifiChecked,
        hostStaffId: selectedHost?.id,
        visitPurposeId: selectedPurposeId,
        departmentId: selectedDeptId,
        companionsCount: companionMode === "names" ? companionList.length : companionCount,
      };
      if (companionMode === "names" && companionList.length > 0) {
        data.companionNames = companionList.map(c => ({
          firstName: c.firstName, lastName: c.lastName, company: c.company, phone: c.phone,
        }));
      }
      await updateApptMut.mutateAsync(data);
      await approveMut.mutateAsync({ id: appointment.id } as any);
      onNotify?.(`บันทึกและอนุมัตินัดหมาย ${appointment.code ?? ""} เรียบร้อยแล้ว`, "success");
      onClose();
    } catch { onNotify?.("ไม่สามารถดำเนินการได้ กรุณาลองใหม่", "error"); }
    finally { setActionLoading(""); }
  };

  const handleApproveOnly = async () => {
    setActionLoading("approve");
    try {
      await approveMut.mutateAsync({ id: appointment.id } as any);
      onNotify?.(`อนุมัตินัดหมาย ${appointment.code ?? ""} เรียบร้อยแล้ว`, "success");
      onClose();
    } catch { onNotify?.("ไม่สามารถอนุมัติได้ กรุณาลองใหม่", "error"); }
    finally { setActionLoading(""); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading("reject");
    try {
      await rejectMut.mutateAsync({ id: appointment.id, reason: rejectReason.trim() } as any);
      onNotify?.(`ปฏิเสธนัดหมาย ${appointment.code ?? ""} เรียบร้อยแล้ว`, "success");
      onClose();
    } catch { onNotify?.("ไม่สามารถปฏิเสธได้ กรุณาลองใหม่", "error"); }
    finally { setActionLoading(""); }
  };

  const activePurposes = visitPurposeConfigs.filter(p => p.isActive);
  const deptOptions = selectedPurpose
    ? selectedPurpose.departmentRules.filter(r => r.isActive).map(r => {
      const dept = departments.find(d => d.id === r.departmentId);
      return dept ? { id: dept.id, name: dept.name, floor: getDepartmentLocation(dept.id)?.floor ?? "" } : null;
    }).filter(Boolean)
    : [];

  const handlePurposeChange = (purposeId: number | null) => {
    setSelectedPurposeId(purposeId);
    setSelectedDeptId(null);
    const p = visitPurposeConfigs.find(v => v.id === purposeId);
    const modes = p?.allowedEntryModes ?? ["single"];
    if (modes.length === 1) setEntryMode(modes[0]);
    else if (!modes.includes(entryMode)) setEntryMode(modes[0]);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="แก้ไขนัดหมาย"
      subtitle={`รหัส: ${appointment.code ?? (appointment as any).bookingCode ?? "-"}`}
      width="w-[640px]"
    >
      <div className="p-6 space-y-6">

        {/* Blacklist Alerts */}
        {blacklistAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-error font-bold text-sm mb-1">
              <AlertTriangle size={16} />
              แจ้งเตือน Blacklist
            </div>
            {blacklistAlerts.map((alert, i) => (
              <p key={i} className="text-sm text-red-700">{alert}</p>
            ))}
          </div>
        )}

        {/* Section 1: Primary Visitor Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Users size={16} />
            ข้อมูลผู้ติดต่อหลัก
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ชื่อ" placeholder="ระบุชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={checkPrimaryBlacklist} />
            <Input label="นามสกุล" placeholder="ระบุนามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={checkPrimaryBlacklist} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="บริษัท / หน่วยงาน" placeholder="ระบุสังกัด (ถ้ามี)" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input label="เบอร์โทรศัพท์" placeholder="0XX-XXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        {/* Section 2: Purpose & Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Building2 size={16} />
            วัตถุประสงค์และสถานที่
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วัตถุประสงค์การมา</label>
              <div className="relative">
                <select
                  value={selectedPurposeId ?? ""}
                  onChange={(e) => handlePurposeChange(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none pr-8"
                >
                  <option value="">-- เลือกวัตถุประสงค์ --</option>
                  {activePurposes.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">หน่วยงาน / สถานที่</label>
              <div className="relative">
                <select
                  value={selectedDeptId ?? ""}
                  onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!selectedPurposeId}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none pr-8 disabled:opacity-50"
                >
                  <option value="">-- เลือกหน่วยงาน --</option>
                  {deptOptions.map(d => d && (
                    <option key={d.id} value={d.id}>{d.name} ({getDepartmentLocation(d.id)?.floor ?? ""})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Purpose text */}
          <div>
            <label className="block text-xs font-medium uppercase text-text-secondary mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary resize-none"
              placeholder="ระบุรายละเอียดวัตถุประสงค์"
            />
          </div>

          {/* Host search */}
          <div>
            <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ผู้ติดต่อ (เจ้าหน้าที่ผู้รับพบ)</label>
            {selectedHost ? (
              <div className="bg-primary-50 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{selectedHost.name}</p>
                  <p className="text-[11px] text-text-muted truncate">{selectedHost.position} • {selectedHost.department.name}</p>
                </div>
                <button onClick={() => setSelectedHost(null)} className="text-xs text-primary font-bold px-2 py-1 hover:bg-primary/10 rounded-lg">
                  เปลี่ยน
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="ค้นหาชื่อเจ้าหน้าที่ หรือหน่วยงาน"
                  leftIcon={<Search size={16} />}
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                />
                {filteredHosts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 max-h-[200px] overflow-y-auto">
                    {filteredHosts.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedHost(s); setHostSearch(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-0 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{s.name}</p>
                          <p className="text-[11px] text-text-muted">{s.position} • {s.department.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Entry Mode Selection */}
          {selectedPurposeId && (
            <div className="space-y-3">
              <label className="block text-xs font-medium uppercase text-text-secondary">ประเภทการเข้าพื้นที่</label>
              <div className="flex gap-2">
                {allowedModes.includes("single") && (
                  <button
                    onClick={() => setEntryMode("single")}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                      entryMode === "single" ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-primary/30"
                    )}
                  >
                    <span className="flex items-center gap-2">🔹 ขออนุญาตแบบ 1 ครั้ง</span>
                    <p className="text-[10px] mt-0.5 font-normal opacity-70">กำหนดวันที่ เวลาเริ่ม และเวลาสิ้นสุด</p>
                  </button>
                )}
                {allowedModes.includes("period") && (
                  <button
                    onClick={() => setEntryMode("period")}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                      entryMode === "period" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-border text-text-secondary hover:border-purple-300"
                    )}
                  >
                    <span className="flex items-center gap-2"><Calendar size={14} /> ขออนุญาตตามช่วงเวลา</span>
                    <p className="text-[10px] mt-0.5 font-normal opacity-70">กำหนดวันเวลาเริ่ม และวันเวลาสิ้นสุด</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Date & Time — Single mode */}
          {entryMode === "single" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันที่นัดหมาย</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                <input type="time" step={600} value={timeStart} onChange={(e) => setTimeStart(snapTo10(e.target.value))} min={nowMin ?? undefined} className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary", isToday && !pastTimeValid ? "border-red-400" : "border-border")} />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                <input type="time" step={600} value={timeEnd} onChange={(e) => setTimeEnd(snapTo10(e.target.value))} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary" />
              </div>
            </div>
          )}

          {/* Date & Time — Period mode */}
          {entryMode === "period" && (
            <div className="space-y-3 bg-purple-50/50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                <Calendar size={14} />
                กำหนดช่วงเวลาเข้าพื้นที่
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันเริ่มต้น</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันสิ้นสุด</label>
                  <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                  <input type="time" step={600} value={timeStart} onChange={(e) => setTimeStart(snapTo10(e.target.value))} min={nowMin ?? undefined} className={cn("flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500", isToday && !pastTimeValid ? "border-red-400" : "border-border")} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                  <input type="time" step={600} value={timeEnd} onChange={(e) => setTimeEnd(snapTo10(e.target.value))} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
              </div>
            </div>
          )}

          {isToday && !pastTimeValid && (
            <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> ไม่สามารถเลือกเวลาที่ผ่านมาแล้วในวันนี้ (ขั้นต่ำ {nowMin})</p>
          )}

          {/* WiFi Offer */}
          {wifiEligible && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Wifi size={18} className="text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">เสนอ WiFi ให้ผู้มาติดต่อ</p>
                <p className="text-[11px] text-blue-600">ประเภทการมานี้รองรับการให้ WiFi</p>
              </div>
              <button
                onClick={() => setOfferWifiChecked(!offerWifiChecked)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  offerWifiChecked ? "bg-primary" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                  offerWifiChecked ? "translate-x-5.5" : "translate-x-0.5"
                )} />
              </button>
            </div>
          )}
          {!wifiEligible && selectedPurposeId && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <WifiOff size={18} className="text-gray-400" />
              <p className="text-sm text-text-muted">ประเภทการมานี้ไม่มีการเสนอ WiFi</p>
            </div>
          )}
        </div>

        {/* Section 3: Companions */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <UserPlus size={16} />
            ผู้ติดตาม
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setCompanionMode("count")}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all",
                companionMode === "count" ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-primary/30"
              )}
            >
              ระบุจำนวนเท่านั้น
              <p className="text-[10px] mt-0.5 font-normal opacity-70">เฉพาะผู้ติดต่อหลัก check-in ได้</p>
            </button>
            <button
              onClick={() => setCompanionMode("names")}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all",
                companionMode === "names" ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-primary/30"
              )}
            >
              ระบุรายชื่อผู้ติดตาม
              <p className="text-[10px] mt-0.5 font-normal opacity-70">ทุกคนที่ระบุ check-in แยกกันได้</p>
            </button>
          </div>

          {companionMode === "count" && (
            <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-text-primary font-medium">จำนวนผู้ติดตาม</label>
              <div className="flex items-center gap-3 ml-auto">
                <button onClick={() => setCompanionCount(Math.max(0, companionCount - 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-white transition-colors">
                  <span className="text-lg">−</span>
                </button>
                <span className="font-bold text-lg w-8 text-center">{companionCount}</span>
                <button onClick={() => setCompanionCount(Math.min(50, companionCount + 1))} className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors">
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>
          )}

          {companionMode === "names" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download size={14} className="mr-1.5" />
                  ดาวน์โหลดแบบฟอร์ม
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1.5" />
                  นำเข้าจากไฟล์ Excel/CSV
                </Button>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                <Button variant="ghost" size="sm" onClick={addCompanion} className="ml-auto text-primary">
                  <Plus size={14} className="mr-1" />
                  เพิ่มรายชื่อ
                </Button>
              </div>

              {companionList.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-text-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left w-8">#</th>
                        <th className="px-3 py-2 text-left">ชื่อ</th>
                        <th className="px-3 py-2 text-left">นามสกุล</th>
                        <th className="px-3 py-2 text-left">บริษัท</th>
                        <th className="px-3 py-2 text-left">เบอร์โทร</th>
                        <th className="px-3 py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {companionList.map((c, idx) => (
                        <tr key={c.id} className={cn(c.isBlacklisted && "bg-red-50")}>
                          <td className="px-3 py-2 text-text-muted">{idx + 1}</td>
                          <td className="px-3 py-1.5">
                            <input type="text" value={c.firstName} onChange={(e) => updateCompanion(c.id, "firstName", e.target.value)} placeholder="ชื่อ" className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-3 py-1.5">
                            <input type="text" value={c.lastName} onChange={(e) => updateCompanion(c.id, "lastName", e.target.value)} placeholder="นามสกุล" className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-3 py-1.5">
                            <input type="text" value={c.company || ""} onChange={(e) => updateCompanion(c.id, "company", e.target.value)} placeholder="บริษัท" className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-3 py-1.5">
                            <input type="text" value={c.phone || ""} onChange={(e) => updateCompanion(c.id, "phone", e.target.value)} placeholder="เบอร์โทร" className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              {c.isBlacklisted && <span title="อยู่ใน Blacklist"><AlertTriangle size={14} className="text-error" /></span>}
                              <button onClick={() => removeCompanion(c.id)} className="h-7 w-7 rounded-full text-text-muted hover:bg-red-50 hover:text-error flex items-center justify-center transition-colors" title="ลบ">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {companionList.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <FileSpreadsheet size={32} className="mx-auto text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">ยังไม่มีรายชื่อผู้ติดตาม</p>
                  <p className="text-xs text-text-muted mt-1">เพิ่มด้วยมือ หรือ นำเข้าจากไฟล์ Excel/CSV</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-white space-y-3">
          {/* Reject reason input (shown when reject is clicked) */}
          {showRejectInput && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                <AlertTriangle size={14} />
                ปฏิเสธนัดหมาย
              </div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผล เช่น เอกสารไม่ครบ, วันที่ไม่สะดวก..."
                rows={2}
                className="flex w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowRejectInput(false); setRejectReason(""); }} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-text-muted hover:bg-gray-50">ยกเลิก</button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === "reject"}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {actionLoading === "reject" ? <><Clock size={12} className="animate-spin" /> กำลังดำเนินการ...</> : <><X size={12} /> ยืนยันปฏิเสธ</>}
                </button>
              </div>
            </div>
          )}

          {/* Status indicator */}
          {canStaffApprove && !showRejectInput && (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">
                <Clock size={12} /> สถานะ: รออนุมัติ
              </span>
              <span className="text-text-muted">สามารถแก้ไขและอนุมัติพร้อมกันได้เลย</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted">
              {companionMode === "names" && companionList.length > 0 && (
                <span>ผู้ติดตาม {companionList.length} คน{companionList.some(c => c.isBlacklisted) && " • ⚠️ พบ Blacklist"}</span>
              )}
              {companionMode === "count" && companionCount > 0 && (
                <span>ผู้ติดตาม {companionCount} คน (ไม่ระบุชื่อ)</span>
              )}
            </div>
            <div className="flex gap-2">
              {/* Reject button (staff + pending) */}
              {canStaffApprove && !showRejectInput && (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <X size={16} className="mr-1" />
                  ปฏิเสธ
                </Button>
              )}

              <Button variant="outline" onClick={onClose}>ยกเลิก</Button>

              {/* Save only */}
              <Button variant="ghost" onClick={handleSave} disabled={!!actionLoading} className="border border-border">
                {actionLoading === "save" ? <><Clock size={14} className="animate-spin mr-1" /> กำลังบันทึก...</> : <><Check size={16} className="mr-1" /> บันทึก</>}
              </Button>

              {/* Save & Approve (staff + pending only) */}
              {canStaffApprove && (
                <Button
                  variant="secondary"
                  onClick={handleSaveAndApprove}
                  disabled={!!actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === "saveApprove" ? (
                    <><Clock size={14} className="animate-spin mr-1" /> กำลังดำเนินการ...</>
                  ) : (
                    <><CheckCircle size={16} className="mr-1" /> บันทึก & อนุมัติ</>
                  )}
                </Button>
              )}

              {/* Approve only (staff + pending, no edits needed) */}
              {canStaffApprove && (
                <Button
                  variant="secondary"
                  onClick={handleApproveOnly}
                  disabled={!!actionLoading}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {actionLoading === "approve" ? (
                    <><Clock size={14} className="animate-spin mr-1" /> กำลังอนุมัติ...</>
                  ) : (
                    <><Check size={16} className="mr-1" /> อนุมัติ</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ===== Shared Detail Components =====
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-secondary flex-shrink-0">{label}</span>
      <span className="text-text-primary font-medium text-right">{value}</span>
    </div>
  );
}

// ===== Appointment Slip Modal (Printable document matching LINE style) =====
function AppointmentSlipModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const bookingCode = appointment.code ?? `#${appointment.id}`;
  const dateStr = appointment.date ? formatThaiDate(appointment.date, "medium") : "-";
  const timeRange = appointment.timeStart && appointment.timeEnd ? `${appointment.timeStart} - ${appointment.timeEnd} น.` : "";
  const dateTimeDisplay = timeRange ? `${dateStr} | ${timeRange}` : dateStr;
  const approverName = appointment.approvedBy ?? "-";

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `appointment-${bookingCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <X size={16} className="text-gray-500" />
        </button>

        {/* Printable card area */}
        <div ref={cardRef} className="bg-white p-6">
          {/* LINE-style Flex Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-[320px] mx-auto">
            {/* Header — matching CardHeader from LineChatMessages */}
            <div className="px-4 pt-4 pb-2 text-center border-b border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                  <Shield size={14} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-primary-800 leading-tight">eVMS MOT</p>
                  <p className="text-[8px] text-text-muted leading-tight">Visitor Management System</p>
                </div>
              </div>
              <h3 className="text-base font-bold text-[#06C755]">นัดหมายอนุมัติแล้ว ✅</h3>
            </div>

            {/* Body rows */}
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">สถานะ</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-100 text-green-700 border-green-200">อนุมัติแล้ว</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-text-muted min-w-[70px] text-xs flex-shrink-0">Booking</span>
                <span className="font-medium text-text-primary text-xs">{bookingCode}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-text-muted min-w-[70px] text-xs flex-shrink-0">วันที่</span>
                <span className="font-medium text-text-primary text-xs">{dateTimeDisplay}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-text-muted min-w-[70px] text-xs flex-shrink-0">ผู้อนุมัติ</span>
                <span className="font-medium text-text-primary text-xs">{approverName}</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-text-muted min-w-[70px] text-xs flex-shrink-0">ผู้มาติดต่อ</span>
                <span className="font-medium text-text-primary text-xs">{appointment.visitor?.name ?? "-"}</span>
              </div>
            </div>

            {/* Info box */}
            <div className="px-4 pb-1">
              <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-green-700">กรุณาสแกน QR Code ที่ Kiosk หรือ Counter ในวันนัดหมาย</p>
              </div>
            </div>

            {/* QR Code — real scannable QR */}
            <div className="px-4 py-3 flex flex-col items-center">
              <div className="bg-white border-2 border-gray-100 rounded-xl p-3">
                <QRCodeSVG
                  value={bookingCode}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1.5 font-medium">QR Check-in</p>
              <p className="text-[9px] text-text-muted">{bookingCode}</p>
            </div>
          </div>
        </div>

        {/* Action buttons (outside printable area) */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleSaveAsImage}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            {saving ? "กำลังบันทึก..." : "บันทึกเป็นภาพ"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold rounded-xl text-sm transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
