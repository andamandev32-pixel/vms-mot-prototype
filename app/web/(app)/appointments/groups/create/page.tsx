"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft, Plus, Trash2, Download, Upload, Calendar, Clock,
  MapPin, Users, Mail, Bell, BellOff, FileSpreadsheet, AlertTriangle, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

// ═══════ Types ═══════

interface VisitorEntry {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  idType?: string;
  source: "manual" | "excel";
}

interface DayScheduleEntry {
  date: string;
  timeStart: string;
  timeEnd: string;
  notes: string;
}

interface VisitPurpose {
  id: number;
  name: string;
  nameEn: string;
  icon?: string;
  isActive: boolean;
  allowedEntryModes: string;
  departmentRules?: Array<{
    id: number;
    departmentId: number;
    department: { id: number; name: string };
    requireApproval: boolean;
    requirePersonName: boolean;
    approverGroupId?: number;
  }>;
}

interface Department {
  id: number;
  name: string;
  nameEn?: string;
}

interface ApproverGroup {
  id: number;
  name: string;
  nameEn: string;
  departmentId: number;
  isActive: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// ═══════ Helpers ═══════

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  const endDate = new Date(end);
  while (d <= endDate) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// ═══════ Page Component ═══════

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Toast ───
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ─── Data loading ───
  const [purposes, setPurposes] = useState<VisitPurpose[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [approverGroups, setApproverGroups] = useState<ApproverGroup[]>([]);

  useEffect(() => {
    fetch("/api/visit-purposes?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setPurposes(j.data.purposes ?? j.data ?? []); })
      .catch(() => {});

    fetch("/api/locations/departments?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setDepartments(j.data.departments ?? j.data ?? []); })
      .catch(() => {});

    fetch("/api/approver-groups?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setApproverGroups(j.data.approverGroups ?? j.data ?? []); })
      .catch(() => {});
  }, []);

  // ─── Section 1: Event Details ───
  const [eventName, setEventName] = useState("");
  const [eventNameEn, setEventNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [visitPurposeId, setVisitPurposeId] = useState<number | "">("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [approverGroupId, setApproverGroupId] = useState<number | "">("");

  // Filter departments by selected purpose rules
  const availableDepartments = useMemo(() => {
    if (!visitPurposeId) return departments;
    const purpose = purposes.find((p) => p.id === visitPurposeId);
    if (!purpose?.departmentRules?.length) return departments;
    const ruleDepIds = purpose.departmentRules.map((r) => r.departmentId);
    return departments.filter((d) => ruleDepIds.includes(d.id));
  }, [visitPurposeId, purposes, departments]);

  // Filter approver groups by department
  const filteredApproverGroups = useMemo(() => {
    if (!departmentId) return approverGroups.filter((g) => g.isActive);
    return approverGroups.filter((g) => g.isActive && g.departmentId === departmentId);
  }, [departmentId, approverGroups]);

  // ─── Section 2: Schedule ───
  const [entryMode, setEntryMode] = useState<"single" | "period">("single");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("17:00");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");

  // Day schedules for period mode
  const [daySchedules, setDaySchedules] = useState<DayScheduleEntry[]>([]);

  // Auto-generate day schedules when dates change
  useEffect(() => {
    if (entryMode === "period" && dateStart && dateEnd && dateEnd >= dateStart) {
      const dates = generateDateRange(dateStart, dateEnd);
      setDaySchedules((prev) => {
        return dates.map((date) => {
          const existing = prev.find((ds) => ds.date === date);
          return existing || { date, timeStart, timeEnd, notes: "" };
        });
      });
    }
  }, [entryMode, dateStart, dateEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDaySchedule = useCallback((index: number, field: keyof DayScheduleEntry, value: string) => {
    setDaySchedules((prev) => prev.map((ds, i) => (i === index ? { ...ds, [field]: value } : ds)));
  }, []);

  // ─── Section 3: Visitor List ───
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [newVisitor, setNewVisitor] = useState({ firstName: "", lastName: "", company: "", phone: "", email: "" });
  const [importLoading, setImportLoading] = useState(false);

  const addVisitor = useCallback(() => {
    if (!newVisitor.firstName.trim() || !newVisitor.lastName.trim()) {
      addToast("กรุณากรอกชื่อและนามสกุล", "error");
      return;
    }
    setVisitors((prev) => [...prev, { ...newVisitor, id: generateId(), source: "manual" }]);
    setNewVisitor({ firstName: "", lastName: "", company: "", phone: "", email: "" });
  }, [newVisitor, addToast]);

  const removeVisitor = useCallback((id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleExcelImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/appointments/groups/import-visitors", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        const imported: VisitorEntry[] = json.data.visitors.map((v: VisitorEntry) => ({
          ...v,
          id: generateId(),
          source: "excel" as const,
        }));
        setVisitors((prev) => [...prev, ...imported]);
        addToast(`นำเข้าสำเร็จ ${json.data.validRows} รายการ${json.data.errors.length > 0 ? ` (${json.data.errors.length} ข้อผิดพลาด)` : ""}`, "success");
        if (json.data.errors.length > 0) {
          json.data.errors.forEach((err: { message: string }) => addToast(err.message, "error"));
        }
      } else {
        addToast(json.error?.message || "นำเข้าไม่สำเร็จ", "error");
      }
    } catch {
      addToast("เกิดข้อผิดพลาดในการนำเข้า", "error");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [addToast]);

  const visitorsWithEmail = useMemo(() => visitors.filter((v) => v.email).length, [visitors]);

  // ─── Section 4: Notification Settings ───
  const [sendVisitorEmail, setSendVisitorEmail] = useState(false);
  const [notifyOnCheckin, setNotifyOnCheckin] = useState(false);
  const [staffNotifyConfig, setStaffNotifyConfig] = useState({ onCheckin: true, onApproval: true, onCancel: false });

  // ─── Submit ───
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      eventName.trim() &&
      visitPurposeId &&
      departmentId &&
      dateStart &&
      timeStart &&
      timeEnd &&
      visitors.length > 0 &&
      (entryMode === "single" || (entryMode === "period" && dateEnd && dateEnd >= dateStart))
    );
  }, [eventName, visitPurposeId, departmentId, dateStart, dateEnd, timeStart, timeEnd, visitors, entryMode]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        group: {
          name: eventName.trim(),
          nameEn: eventNameEn.trim() || undefined,
          description: description.trim() || undefined,
          visitPurposeId: Number(visitPurposeId),
          departmentId: Number(departmentId),
          approverGroupId: approverGroupId ? Number(approverGroupId) : undefined,
          entryMode,
          dateStart,
          dateEnd: entryMode === "period" ? dateEnd : undefined,
          timeStart,
          timeEnd,
          building: building.trim() || undefined,
          floor: floor.trim() || undefined,
          room: room.trim() || undefined,
          notifyOnCheckin,
          sendVisitorEmail,
          staffNotifyConfig,
          daySchedules: entryMode === "period" && daySchedules.length > 0
            ? daySchedules.map((ds) => ({
                date: ds.date,
                timeStart: ds.timeStart,
                timeEnd: ds.timeEnd,
                notes: ds.notes || undefined,
              }))
            : undefined,
        },
        visitors: visitors.map((v) => ({
          firstName: v.firstName,
          lastName: v.lastName,
          company: v.company || undefined,
          phone: v.phone || undefined,
          email: v.email || undefined,
          idNumber: v.idNumber || undefined,
          idType: v.idType || undefined,
        })),
      };

      const res = await fetch("/api/appointments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        addToast(`สร้างกิจกรรมสำเร็จ — ${json.data.created} นัดหมาย${json.data.autoApproved ? " (อนุมัติอัตโนมัติ)" : ""}`, "success");
        setTimeout(() => router.push("/web/appointments/groups"), 1200);
      } else {
        addToast(json.error?.message || "สร้างกิจกรรมไม่สำเร็จ", "error");
      }
    } catch {
      addToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, eventName, eventNameEn, description, visitPurposeId, departmentId, approverGroupId, entryMode, dateStart, dateEnd, timeStart, timeEnd, building, floor, room, notifyOnCheckin, sendVisitorEmail, staffNotifyConfig, daySchedules, visitors, addToast, router]);

  // ═══════ Render ═══════

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Topbar title="สร้างกิจกรรม / นัดหมายกลุ่ม" />

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-in fade-in slide-in-from-right duration-300",
              t.type === "success" && "bg-green-600",
              t.type === "error" && "bg-red-600",
              t.type === "info" && "bg-blue-600"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back button */}
        <Link href="/web/appointments/groups" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft size={16} /> กลับหน้ากลุ่มนัดหมาย
        </Link>

        {/* ═══════ Section 1: Event Details ═══════ */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              รายละเอียดกิจกรรม
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ชื่อกิจกรรม *"
                  placeholder="เช่น สัมมนาประจำปี 2569"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
                <Input
                  label="ชื่อภาษาอังกฤษ"
                  placeholder="e.g. Annual Seminar 2026"
                  value={eventNameEn}
                  onChange={(e) => setEventNameEn(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">รายละเอียด</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  rows={3}
                  placeholder="รายละเอียดกิจกรรม..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">วัตถุประสงค์ *</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    value={visitPurposeId}
                    onChange={(e) => {
                      setVisitPurposeId(e.target.value ? Number(e.target.value) : "");
                      setDepartmentId("");
                    }}
                  >
                    <option value="">— เลือกวัตถุประสงค์ —</option>
                    {purposes.filter((p) => p.isActive).map((p) => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">แผนก/หน่วยงาน *</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value ? Number(e.target.value) : "");
                      setApproverGroupId("");
                    }}
                  >
                    <option value="">— เลือกแผนก —</option>
                    {availableDepartments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">กลุ่มผู้อนุมัติ</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    value={approverGroupId}
                    onChange={(e) => setApproverGroupId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {filteredApproverGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ Section 2: Schedule ═══════ */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              กำหนดการ
            </h2>

            {/* Entry mode toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setEntryMode("single")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  entryMode === "single" ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                )}
              >
                วันเดียว
              </button>
              <button
                onClick={() => setEntryMode("period")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  entryMode === "period" ? "bg-purple-600 text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                )}
              >
                หลายวัน
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="วันที่เริ่ม *"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
                {entryMode === "period" && (
                  <Input
                    label="วันที่สิ้นสุด *"
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    error={dateEnd && dateEnd < dateStart ? "ต้องไม่น้อยกว่าวันเริ่ม" : undefined}
                  />
                )}
                <Input
                  label="เวลาเริ่ม *"
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                />
                <Input
                  label="เวลาสิ้นสุด *"
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="อาคาร"
                  placeholder="ชื่ออาคาร"
                  leftIcon={<MapPin size={16} />}
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                />
                <Input
                  label="ชั้น"
                  placeholder="เช่น 3"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
                <Input
                  label="ห้อง"
                  placeholder="เช่น ห้องประชุม A"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>

              {/* Day schedule editor for period mode */}
              {entryMode === "period" && daySchedules.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-sm font-bold text-text-secondary mb-2">กำหนดการรายวัน</h3>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-border">
                          <th className="text-left px-3 py-2 font-medium text-text-secondary">วันที่</th>
                          <th className="text-left px-3 py-2 font-medium text-text-secondary">เวลาเริ่ม</th>
                          <th className="text-left px-3 py-2 font-medium text-text-secondary">เวลาสิ้นสุด</th>
                          <th className="text-left px-3 py-2 font-medium text-text-secondary">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daySchedules.map((ds, idx) => (
                          <tr key={ds.date} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 font-medium">
                              {new Date(ds.date).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" })}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="time"
                                className="px-2 py-1 border border-border rounded text-sm"
                                value={ds.timeStart}
                                onChange={(e) => updateDaySchedule(idx, "timeStart", e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="time"
                                className="px-2 py-1 border border-border rounded text-sm"
                                value={ds.timeEnd}
                                onChange={(e) => updateDaySchedule(idx, "timeEnd", e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                className="w-full px-2 py-1 border border-border rounded text-sm"
                                placeholder="หมายเหตุ..."
                                value={ds.notes}
                                onChange={(e) => updateDaySchedule(idx, "notes", e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══════ Section 3: Visitor List ═══════ */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Users size={20} className="text-primary" />
                รายชื่อผู้เข้าร่วม ({visitors.length} คน)
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href="/api/appointments/groups/template"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-text-secondary hover:bg-gray-200 transition-colors"
                >
                  <Download size={14} /> ดาวน์โหลด Template
                </a>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={importLoading}
                >
                  <FileSpreadsheet size={14} className="mr-1.5" />
                  นำเข้า Excel
                </Button>
              </div>
            </div>

            {/* Inline add form */}
            <div className="flex items-end gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                <Input
                  placeholder="ชื่อ *"
                  value={newVisitor.firstName}
                  onChange={(e) => setNewVisitor((prev) => ({ ...prev, firstName: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addVisitor()}
                />
                <Input
                  placeholder="นามสกุล *"
                  value={newVisitor.lastName}
                  onChange={(e) => setNewVisitor((prev) => ({ ...prev, lastName: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addVisitor()}
                />
                <Input
                  placeholder="บริษัท"
                  value={newVisitor.company}
                  onChange={(e) => setNewVisitor((prev) => ({ ...prev, company: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addVisitor()}
                />
                <Input
                  placeholder="โทรศัพท์"
                  value={newVisitor.phone}
                  onChange={(e) => setNewVisitor((prev) => ({ ...prev, phone: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addVisitor()}
                />
                <Input
                  placeholder="อีเมล"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor((prev) => ({ ...prev, email: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addVisitor()}
                />
              </div>
              <Button size="sm" onClick={addVisitor}>
                <Plus size={14} className="mr-1" /> เพิ่ม
              </Button>
            </div>

            {/* Visitor table */}
            {visitors.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-2.5">#</th>
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-2.5">ชื่อ-นามสกุล</th>
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-2.5">บริษัท</th>
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-2.5">โทรศัพท์</th>
                      <th className="text-left text-xs font-bold text-text-secondary px-4 py-2.5">อีเมล</th>
                      <th className="text-center text-xs font-bold text-text-secondary px-4 py-2.5">แหล่ง</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v, idx) => (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2 text-text-muted">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium">{v.firstName} {v.lastName}</td>
                        <td className="px-4 py-2 text-text-secondary">{v.company || "—"}</td>
                        <td className="px-4 py-2 text-text-secondary">{v.phone || "—"}</td>
                        <td className="px-4 py-2 text-text-secondary">{v.email || "—"}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            v.source === "excel" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {v.source === "excel" ? "Excel" : "Manual"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removeVisitor(v.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted border-2 border-dashed border-border rounded-lg">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">ยังไม่มีผู้เข้าร่วม</p>
                <p className="text-xs mt-1">เพิ่มทีละคนด้านบน หรือนำเข้าจากไฟล์ Excel</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════ Section 4: Notification Settings ═══════ */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              การแจ้งเตือน
            </h2>

            <div className="space-y-4">
              {/* Visitor email */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  checked={sendVisitorEmail}
                  onChange={(e) => setSendVisitorEmail(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                    <Mail size={14} className="inline mr-1.5" />
                    ส่งอีเมลแจ้งผู้เข้าร่วม
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    ส่งอีเมลเชิญพร้อมรหัสนัดหมายไปยังผู้เข้าร่วมที่มีอีเมล ({visitorsWithEmail}/{visitors.length} คน)
                  </p>
                </div>
              </label>

              {/* Checkin notification */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  checked={notifyOnCheckin}
                  onChange={(e) => setNotifyOnCheckin(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                    {notifyOnCheckin ? <Bell size={14} className="inline mr-1.5" /> : <BellOff size={14} className="inline mr-1.5" />}
                    แจ้งเตือนเมื่อ Check-in
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    แจ้งเตือนเจ้าหน้าที่ผู้สร้างเมื่อผู้เข้าร่วม check-in ที่หน้างาน
                  </p>
                </div>
              </label>

              {/* Staff notify config */}
              <div className="pl-0 pt-2 border-t border-border">
                <p className="text-sm font-medium text-text-secondary mb-2">แจ้งเตือนเจ้าหน้าที่เมื่อ:</p>
                <div className="flex flex-wrap gap-4">
                  {([
                    { key: "onCheckin" as const, label: "Check-in" },
                    { key: "onApproval" as const, label: "มีการอนุมัติ" },
                    { key: "onCancel" as const, label: "ยกเลิก" },
                  ]).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        checked={staffNotifyConfig[key]}
                        onChange={(e) => setStaffNotifyConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />
                      <span className="text-sm text-text-secondary">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ Submit ═══════ */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-border p-4">
          <div className="text-sm text-text-muted">
            {!canSubmit && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <AlertTriangle size={14} />
                กรุณากรอกข้อมูลให้ครบถ้วน
              </span>
            )}
            {canSubmit && (
              <span className="flex items-center gap-1.5 text-green-600">
                <CheckCircle size={14} />
                พร้อมสร้างกิจกรรม — {visitors.length} คน
                {sendVisitorEmail && visitorsWithEmail > 0 ? `, จะส่งอีเมล ${visitorsWithEmail} คน` : ""}
              </span>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          >
            <CheckCircle size={16} className="mr-2" />
            สร้างกิจกรรม
          </Button>
        </div>

        {/* Spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
