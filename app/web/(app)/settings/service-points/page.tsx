"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Settings,
  Monitor,
  Tablet,
  Plus,
  Pencil,
  MapPin,
  Wifi,
  WifiOff,
  Wrench,
  Activity,
  Hash,
  Network,
  Building2,
  Layers,
  User,
  StickyNote,
  Save,
  Power,
  PowerOff,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  CircleDot,
  FileText,
  Target,
  Check,
  Timer,
  Shield,
  Printer,
  Clock,
  Eye,
  KeyRound,
  UserPlus,
  X,
  Star,
  Users,
} from "lucide-react";
import {
  servicePoints,
  staffMembers,
  visitPurposeConfigs,
  identityDocumentTypes,
  counterStaffAssignments,
  getAssignedStaff,
  type ServicePoint,
  type ServicePointType,
  type ServicePointStatus,
} from "@/lib/mock-data";

/* ── Status Badge ── */
function StatusBadge({ status }: { status: ServicePointStatus }) {
  const cfg: Record<ServicePointStatus, { label: string; icon: React.ReactNode; cls: string }> = {
    online: { label: "ออนไลน์", icon: <Wifi size={12} />, cls: "bg-success-light text-success" },
    offline: { label: "ออฟไลน์", icon: <WifiOff size={12} />, cls: "bg-gray-100 text-gray-500" },
    maintenance: { label: "ปิดปรับปรุง", icon: <Wrench size={12} />, cls: "bg-warning-light text-warning" },
  };
  const c = cfg[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", c.cls)}>
      {c.icon} {c.label}
    </span>
  );
}

function TypeBadge({ type }: { type: ServicePointType }) {
  return type === "kiosk" ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary">
      <Tablet size={12} /> Kiosk
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-info-light text-info">
      <Monitor size={12} /> Counter
    </span>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function ServicePointsSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("service-points")!;
  const flowData = getFlowByPageId("service-points")!;
  const apiDoc = getApiDocByPageId("service-points");
  const [items, setItems] = useState<ServicePoint[]>(servicePoints);
  const [filterType, setFilterType] = useState<"all" | ServicePointType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | ServicePointStatus>("all");
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit"; item?: ServicePoint } | null>(null);

  const filtered = items.filter((sp) => {
    if (filterType !== "all" && sp.type !== filterType) return false;
    if (filterStatus !== "all" && sp.status !== filterStatus) return false;
    return true;
  });

  /* stats */
  const totalKiosks = items.filter((s) => s.type === "kiosk").length;
  const totalCounters = items.filter((s) => s.type === "counter").length;
  const onlineCount = items.filter((s) => s.status === "online").length;
  const todayTotal = items.reduce((sum, s) => sum + s.todayTransactions, 0);

  const stats = [
    { label: "Kiosk ทั้งหมด", value: totalKiosks, icon: <Tablet size={20} />, color: "text-primary", bg: "bg-primary-50" },
    { label: "Counter ทั้งหมด", value: totalCounters, icon: <Monitor size={20} />, color: "text-info", bg: "bg-info-light" },
    { label: "เครื่องออนไลน์", value: onlineCount, icon: <Wifi size={20} />, color: "text-success", bg: "bg-success-light" },
    { label: "รายการวันนี้", value: todayTotal, icon: <BarChart3 size={20} />, color: "text-accent-600", bg: "bg-accent-50" },
  ];

  /* toggle status */
  const cycleStatus = (id: number) => {
    setItems((prev) =>
      prev.map((sp) => {
        if (sp.id !== id) return sp;
        const next: ServicePointStatus = sp.status === "online" ? "offline" : sp.status === "offline" ? "maintenance" : "online";
        return { ...sp, status: next };
      })
    );
  };

  return (
    <>
      <Topbar title="จัดการจุดให้บริการ / Service Points" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              จุดให้บริการ Kiosk & Counter
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h3>
            <p className="text-sm text-text-muted mt-1">เพิ่ม ลด และจัดการสถานะเครื่อง Kiosk / Counter ทุกจุดบริการ</p>
          </div>
          <Button onClick={() => setDrawer({ mode: "add" })} className="gap-2">
            <Plus size={16} /> เพิ่มจุดบริการ
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary-dark leading-relaxed">
            <strong>จุดให้บริการ</strong> คือเครื่อง Kiosk สำหรับ self-service และ Counter สำหรับ รปภ. ใช้ลงทะเบียนผู้เยี่ยม
            สามารถเพิ่ม/ลด และสลับสถานะ ออนไลน์ / ออฟไลน์ / ปิดปรับปรุง ได้ตามต้องการ
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg, s.color)}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">ประเภท:</span>
          {([{ key: "all", label: "ทั้งหมด" }, { key: "kiosk", label: "Kiosk" }, { key: "counter", label: "Counter" }] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key as typeof filterType)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                filterType === t.key ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              )}
            >
              {t.label}
            </button>
          ))}

          <div className="w-px h-6 bg-border mx-2" />

          <span className="text-sm font-medium text-text-secondary">สถานะ:</span>
          {([{ key: "all", label: "ทั้งหมด" }, { key: "online", label: "ออนไลน์" }, { key: "offline", label: "ออฟไลน์" }, { key: "maintenance", label: "ปิดปรับปรุง" }] as const).map((s) => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key as typeof filterStatus)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                filterStatus === s.key ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sp) => {
            const assignedStaffList = getAssignedStaff(sp.id);
            return (
              <Card key={sp.id} className={cn("border shadow-sm transition-all hover:shadow-md", !sp.isActive && "opacity-60")}>
                <CardContent className="p-5">
                  {/* top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", sp.type === "kiosk" ? "bg-primary-50 text-primary" : "bg-info-light text-info")}>
                        {sp.type === "kiosk" ? <Tablet size={22} /> : <Monitor size={22} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-sm">{sp.name}</h4>
                        <p className="text-xs text-text-muted">{sp.nameEn}</p>
                      </div>
                    </div>
                    <StatusBadge status={sp.status} />
                  </div>

                  {/* info grid */}
                  <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <MapPin size={13} className="text-text-muted" /> {sp.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Building2 size={13} className="text-text-muted" /> {sp.building} — {sp.floor}
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Network size={13} className="text-text-muted" /> {sp.ipAddress}
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Hash size={13} className="text-text-muted" /> S/N: {sp.serialNumber}
                    </div>
                    {assignedStaffList.length > 0 && (
                      <div className="flex items-start gap-1.5 text-text-secondary col-span-2">
                        <Users size={13} className="text-text-muted mt-0.5" />
                        <div>
                          <span className="text-xs">เจ้าหน้าที่: </span>
                          {assignedStaffList.map((s, i) => (
                            <span key={s.id} className="text-xs">
                              {s.name}{s.isPrimary && <Star size={10} className="inline text-accent-600 ml-0.5" />}
                              {i < assignedStaffList.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {sp.notes && (
                      <div className="flex items-start gap-1.5 text-warning col-span-2">
                        <StickyNote size={13} className="mt-0.5" /> {sp.notes}
                      </div>
                    )}
                  </div>

                  {/* วัตถุประสงค์ + เอกสารยืนยันตัวตน */}
                  <div className="space-y-2.5 mb-4">
                    {/* วัตถุประสงค์ */}
                    <div>
                      <p className="text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1"><Target size={11} /> วัตถุประสงค์ที่เปิดให้บริการ</p>
                      <div className="flex flex-wrap gap-1">
                        {sp.allowedPurposeIds.length > 0 ? sp.allowedPurposeIds.map((pid) => {
                          const purpose = visitPurposeConfigs.find((p) => p.id === pid);
                          return purpose ? (
                            <span key={pid} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary">
                              {purpose.icon} {purpose.name}
                            </span>
                          ) : null;
                        }) : <span className="text-[11px] text-text-muted">ยังไม่ได้ตั้งค่า</span>}
                      </div>
                    </div>
                    {/* เอกสารยืนยันตัวตน */}
                    <div>
                      <p className="text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1"><FileText size={11} /> เอกสารยืนยันตัวตนที่รับ</p>
                      <div className="flex flex-wrap gap-1">
                        {sp.allowedDocumentIds.length > 0 ? sp.allowedDocumentIds.map((did) => {
                          const doc = identityDocumentTypes.find((d) => d.id === did);
                          return doc ? (
                            <span key={did} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-50 text-accent-600">
                              {doc.icon} {doc.name}
                            </span>
                          ) : null;
                        }) : <span className="text-[11px] text-text-muted">ยังไม่ได้ตั้งค่า</span>}
                      </div>
                    </div>
                  </div>

                  {/* bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-accent-600" />
                      <span className="text-sm font-bold text-accent-600">{sp.todayTransactions}</span>
                      <span className="text-xs text-text-muted">รายการวันนี้</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => cycleStatus(sp.id)} className="gap-1 text-xs">
                        <CircleDot size={14} /> สลับสถานะ
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDrawer({ mode: "edit", item: sp })} className="gap-1 text-xs">
                        <Pencil size={14} /> แก้ไข
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Monitor size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">ไม่พบจุดบริการที่ตรงตามตัวกรอง</p>
          </div>
        )}
      </main>

      {/* ── Drawer ── */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "add" ? "เพิ่มจุดบริการใหม่" : "แก้ไขจุดบริการ"}
        subtitle={drawer?.mode === "add" ? "กรอกข้อมูลเครื่อง Kiosk หรือ Counter" : drawer?.item?.name}
      >
        <ServicePointForm
          initial={drawer?.item}
          onSave={() => setDrawer(null)}
          onCancel={() => setDrawer(null)}
        />
      </Drawer>
    </>
  );
}

/* ── Add/Edit Form ── */
function ServicePointForm({ initial, onSave, onCancel }: { initial?: ServicePoint; onSave: () => void; onCancel: () => void }) {
  const kioskOnlyDocIds = [1, 2, 5];

  const [type, setType] = useState<ServicePointType>(initial?.type ?? "kiosk");
  const [status, setStatus] = useState<ServicePointStatus>(initial?.status ?? "offline");
  const [selectedPurposes, setSelectedPurposes] = useState<number[]>(initial?.allowedPurposeIds ?? []);
  const [selectedDocs, setSelectedDocs] = useState<number[]>(initial?.allowedDocumentIds ?? []);
  const [showTimeouts, setShowTimeouts] = useState(false);
  const [showWifiConfig, setShowWifiConfig] = useState(false);
  const [showPdpaConfig, setShowPdpaConfig] = useState(false);
  const [showSlipConfig, setShowSlipConfig] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStaffAssign, setShowStaffAssign] = useState(false);

  // Staff assignment state (counter only)
  const initialAssignedStaff = initial ? counterStaffAssignments.filter((a) => a.servicePointId === initial.id) : [];
  const [assignedStaffIds, setAssignedStaffIds] = useState<{ staffId: number; isPrimary: boolean }[]>(
    initialAssignedStaff.map((a) => ({ staffId: a.staffId, isPrimary: a.isPrimary }))
  );

  const eligibleStaff = staffMembers.filter((s) => (s.role === "security" || s.role === "admin") && s.status === "active");
  const unassignedStaff = eligibleStaff.filter((s) => !assignedStaffIds.some((a) => a.staffId === s.id));

  const addStaffAssignment = (staffId: number) => {
    setAssignedStaffIds((prev) => [...prev, { staffId, isPrimary: prev.length === 0 }]);
  };
  const removeStaffAssignment = (staffId: number) => {
    setAssignedStaffIds((prev) => {
      const next = prev.filter((a) => a.staffId !== staffId);
      if (next.length > 0 && !next.some((a) => a.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };
  const setPrimaryStaff = (staffId: number) => {
    setAssignedStaffIds((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.staffId === staffId }))
    );
  };

  const defaultTimeouts = {
    pdpaConsent: 120,
    selectIdMethod: 60,
    idVerification: 60,
    dataPreview: 120,
    selectPurpose: 60,
    faceCapture: 60,
    qrScan: 60,
    appointmentPreview: 120,
    successRedirect: 10,
  };
  const [timeouts, setTimeouts] = useState(initial?.timeoutConfig ?? defaultTimeouts);

  // WiFi config state
  const [wifiSsid, setWifiSsid] = useState(initial?.wifiConfig?.ssid ?? "MOTS-Guest");
  const [wifiPassword, setWifiPassword] = useState(initial?.wifiConfig?.passwordPattern ?? "mots{year}");
  const [wifiValidityMode, setWifiValidityMode] = useState<"business-hours-close" | "fixed-duration">(initial?.wifiConfig?.validityMode ?? "business-hours-close");
  const [wifiFixedDuration, setWifiFixedDuration] = useState(initial?.wifiConfig?.fixedDurationMinutes ?? 480);

  // PDPA config state
  const [pdpaRequireScroll, setPdpaRequireScroll] = useState(initial?.pdpaConfig?.requireScroll ?? true);
  const [pdpaRetentionDays, setPdpaRetentionDays] = useState(initial?.pdpaConfig?.retentionDays ?? 90);

  // Slip config state
  const [slipHeader, setSlipHeader] = useState(initial?.slipConfig?.headerText ?? "กระทรวงการท่องเที่ยวและกีฬา");
  const [slipFooter, setSlipFooter] = useState(initial?.slipConfig?.footerText ?? "ขอบคุณที่มาเยือน — Thank you for visiting");

  // Advanced settings state
  const [followBusinessHours, setFollowBusinessHours] = useState(initial?.followBusinessHours ?? true);
  const [idMaskingPattern, setIdMaskingPattern] = useState(initial?.idMaskingPattern ?? "show-last-4");
  const [adminPin, setAdminPin] = useState(initial?.adminPin ?? "10210");

  const timeoutFields: { key: keyof typeof defaultTimeouts; label: string; labelEn: string }[] = [
    { key: "pdpaConsent", label: "หน้ายินยอม PDPA", labelEn: "PDPA Consent" },
    { key: "selectIdMethod", label: "หน้าเลือกวิธียืนยันตัวตน", labelEn: "Select ID Method" },
    { key: "idVerification", label: "หน้าตรวจสอบเอกสาร", labelEn: "ID Verification" },
    { key: "dataPreview", label: "หน้าตรวจสอบข้อมูล", labelEn: "Data Preview" },
    { key: "selectPurpose", label: "หน้าเลือกประเภทเข้าพื้นที่", labelEn: "Select Purpose" },
    { key: "faceCapture", label: "หน้าถ่ายภาพ + WiFi", labelEn: "Face Capture + WiFi" },
    { key: "qrScan", label: "หน้าสแกน QR (มีนัด)", labelEn: "QR Scan" },
    { key: "appointmentPreview", label: "หน้าตรวจสอบนัดหมาย", labelEn: "Appointment Preview" },
    { key: "successRedirect", label: "หน้าสำเร็จ (redirect)", labelEn: "Success Redirect" },
  ];

  const handleTypeChange = (t: ServicePointType) => {
    setType(t);
    if (t === "kiosk") {
      setSelectedDocs((prev) => prev.filter((id) => kioskOnlyDocIds.includes(id)));
    }
  };

  const togglePurpose = (id: number) =>
    setSelectedPurposes((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  const toggleDoc = (id: number) =>
    setSelectedDocs((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);

  const availableDocs = type === "kiosk"
    ? identityDocumentTypes.filter((d) => kioskOnlyDocIds.includes(d.id))
    : identityDocumentTypes;

  return (
    <div className="p-6 space-y-5">
      {/* Type */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">ประเภท</label>
        <div className="flex gap-3">
          {(["kiosk", "counter"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                type === t ? "border-primary bg-primary-50 text-primary" : "border-border bg-white text-text-secondary hover:border-primary/30"
              )}
            >
              {t === "kiosk" ? <Tablet size={18} /> : <Monitor size={18} />}
              {t === "kiosk" ? "Kiosk" : "Counter"}
            </button>
          ))}
        </div>
      </div>

      <Input label="ชื่อจุดบริการ (ไทย)" defaultValue={initial?.name} placeholder="เช่น ตู้ Kiosk ล็อบบี้หลัก" />
      <Input label="ชื่อจุดบริการ (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Main Lobby Kiosk" />
      <Input label="ที่ตั้ง / ตำแหน่ง" defaultValue={initial?.location} placeholder="เช่น ล็อบบี้ ชั้น 1 ประตูหลัก" leftIcon={<MapPin size={16} />} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="อาคาร" defaultValue={initial?.building} placeholder="ศูนย์ราชการ อาคาร C" />
        <Input label="ชั้น" defaultValue={initial?.floor} placeholder="ชั้น 1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="IP Address" defaultValue={initial?.ipAddress} placeholder="192.168.1.101" leftIcon={<Network size={16} />} />
        <Input label="Serial Number" defaultValue={initial?.serialNumber} placeholder="KIOSK-2024-001" leftIcon={<Hash size={16} />} />
      </div>
      <Input label="MAC Address" defaultValue={initial?.macAddress} placeholder="AA:BB:CC:DD:01:01" />

      {/* วัตถุประสงค์ที่เปิดให้บริการ */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block flex items-center gap-1.5">
          <Target size={15} className="text-primary" /> วัตถุประสงค์ที่เปิดให้บริการ
        </label>
        <div className="space-y-2">
          {visitPurposeConfigs.filter((p) => p.isActive).map((purpose) => (
            <button
              key={purpose.id}
              type="button"
              onClick={() => togglePurpose(purpose.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all",
                selectedPurposes.includes(purpose.id)
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-border bg-white text-text-secondary hover:border-primary/30"
              )}
            >
              <span className="text-base">{purpose.icon}</span>
              <span className="flex-1 font-medium">{purpose.name}</span>
              {selectedPurposes.includes(purpose.id) && <Check size={16} className="text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* เอกสารยืนยันตัวตนที่รับ */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block flex items-center gap-1.5">
          <FileText size={15} className="text-accent-600" /> เอกสารยืนยันตัวตนที่รับ
        </label>
        {type === "kiosk" && (
          <p className="text-xs text-info mb-2 flex items-center gap-1">
            <Info size={13} /> Kiosk รองรับเฉพาะ บัตรประชาชน, Passport และ ThaiID
          </p>
        )}
        <div className="space-y-2">
          {availableDocs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => toggleDoc(doc.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all",
                selectedDocs.includes(doc.id)
                  ? "border-accent-500 bg-accent-50 text-accent-600"
                  : "border-border bg-white text-text-secondary hover:border-accent-500/30"
              )}
            >
              <span className="text-base">{doc.icon}</span>
              <span className="flex-1 font-medium">{doc.name}</span>
              <span className="text-[11px] text-text-muted">{doc.nameEn}</span>
              {selectedDocs.includes(doc.id) && <Check size={16} className="text-accent-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      {/* ── Timeout Config (kiosk only) ── */}
      {type === "kiosk" && (
        <div>
          <button
            type="button"
            onClick={() => setShowTimeouts((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-2 w-full"
          >
            <Timer size={15} className="text-primary" />
            ตั้งค่า Timeout แต่ละหน้า (วินาที)
            {showTimeouts ? <ChevronUp size={14} className="ml-auto text-text-muted" /> : <ChevronDown size={14} className="ml-auto text-text-muted" />}
          </button>
          {showTimeouts && (
            <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-border">
              <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                <Info size={13} /> กำหนดเวลา timeout สำหรับแต่ละหน้าจอ Kiosk (หน่วย: วินาที)
              </p>
              {timeoutFields.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{f.label}</p>
                    <p className="text-[11px] text-text-muted">{f.labelEn}</p>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={5}
                      max={600}
                      value={timeouts[f.key]}
                      onChange={(e) => {
                        const val = Math.max(5, Math.min(600, Number(e.target.value) || 5));
                        setTimeouts((prev) => ({ ...prev, [f.key]: val }));
                      }}
                      className="w-full px-2.5 py-1.5 text-sm text-center rounded-lg border border-border bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <span className="text-xs text-text-muted w-8">วิ.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WiFi Config ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowWifiConfig((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-2 w-full"
        >
          <Wifi size={15} className="text-info" />
          ตั้งค่า WiFi สำหรับผู้เยี่ยม
          {showWifiConfig ? <ChevronUp size={14} className="ml-auto text-text-muted" /> : <ChevronDown size={14} className="ml-auto text-text-muted" />}
        </button>
        {showWifiConfig && (
          <div className="space-y-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
              <Info size={13} /> ตั้งค่า WiFi ที่จะแสดงบนใบ slip และหน้าจอ Kiosk
            </p>
            <Input
              label="WiFi SSID"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              placeholder="MOTS-Guest"
              leftIcon={<Wifi size={16} />}
            />
            <Input
              label="รูปแบบรหัสผ่าน (Password Pattern)"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder="mots{year} → mots2568"
              leftIcon={<KeyRound size={16} />}
            />
            <p className="text-[11px] text-text-muted px-1">ตัวแปร: {"{year}"} = ปี พ.ศ., {"{month}"} = เดือน, {"{day}"} = วัน</p>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">วิธีคำนวณ WiFi หมดอายุ</label>
              <div className="flex gap-2">
                {(["business-hours-close", "fixed-duration"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWifiValidityMode(mode)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                      wifiValidityMode === mode
                        ? "border-info bg-blue-50 text-info"
                        : "border-border bg-white text-text-muted hover:border-info/30"
                    )}
                  >
                    {mode === "business-hours-close" ? "🕐 ตามเวลาปิดทำการ" : "⏱ กำหนดชั่วโมง"}
                  </button>
                ))}
              </div>
            </div>
            {wifiValidityMode === "fixed-duration" && (
              <Input
                label="ระยะเวลา WiFi (นาที)"
                type="number"
                value={String(wifiFixedDuration)}
                onChange={(e) => setWifiFixedDuration(Math.max(30, Number(e.target.value) || 30))}
                placeholder="480"
                leftIcon={<Clock size={16} />}
              />
            )}
          </div>
        )}
      </div>

      {/* ── PDPA Config ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowPdpaConfig((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-2 w-full"
        >
          <Shield size={15} className="text-warning" />
          ตั้งค่า PDPA / ความเป็นส่วนตัว
          {showPdpaConfig ? <ChevronUp size={14} className="ml-auto text-text-muted" /> : <ChevronDown size={14} className="ml-auto text-text-muted" />}
        </button>
        {showPdpaConfig && (
          <div className="space-y-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">บังคับเลื่อนอ่านก่อนยินยอม</p>
                <p className="text-[11px] text-text-muted">ผู้ใช้ต้องเลื่อนอ่านข้อความ PDPA จนสุดก่อนกดยินยอม</p>
              </div>
              <button
                type="button"
                onClick={() => setPdpaRequireScroll((v) => !v)}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative",
                  pdpaRequireScroll ? "bg-warning" : "bg-gray-300"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                  pdpaRequireScroll ? "left-[22px]" : "left-0.5"
                )} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">ระยะเวลาเก็บข้อมูล (วัน)</p>
                <p className="text-[11px] text-text-muted">แสดงในข้อความ PDPA ว่าเก็บข้อมูลกี่วัน</p>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={pdpaRetentionDays}
                  onChange={(e) => setPdpaRetentionDays(Math.max(1, Math.min(3650, Number(e.target.value) || 90)))}
                  className="w-full px-2.5 py-1.5 text-sm text-center rounded-lg border border-border bg-white focus:border-warning focus:ring-1 focus:ring-warning/20 outline-none"
                />
              </div>
              <span className="text-xs text-text-muted w-8">วัน</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Slip Config ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowSlipConfig((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-2 w-full"
        >
          <Printer size={15} className="text-accent-600" />
          ตั้งค่าใบ Slip (Thermal Print)
          {showSlipConfig ? <ChevronUp size={14} className="ml-auto text-text-muted" /> : <ChevronDown size={14} className="ml-auto text-text-muted" />}
        </button>
        {showSlipConfig && (
          <div className="space-y-3 p-3 rounded-xl bg-accent-50/50 border border-accent-100">
            <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
              <Info size={13} /> กำหนดข้อความหัว/ท้ายที่จะพิมพ์บนใบ slip ของ Kiosk นี้
            </p>
            <Input
              label="ข้อความส่วนหัว (Header)"
              value={slipHeader}
              onChange={(e) => setSlipHeader(e.target.value)}
              placeholder="กระทรวงการท่องเที่ยวและกีฬา"
            />
            <Input
              label="ข้อความส่วนท้าย (Footer)"
              value={slipFooter}
              onChange={(e) => setSlipFooter(e.target.value)}
              placeholder="ขอบคุณที่มาเยือน"
            />
          </div>
        )}
      </div>

      {/* ── Advanced Settings ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-2 w-full"
        >
          <Settings size={15} className="text-text-muted" />
          ตั้งค่าขั้นสูง
          {showAdvanced ? <ChevronUp size={14} className="ml-auto text-text-muted" /> : <ChevronDown size={14} className="ml-auto text-text-muted" />}
        </button>
        {showAdvanced && (
          <div className="space-y-3 p-3 rounded-xl bg-gray-50 border border-border">
            {/* Follow Business Hours */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary flex items-center gap-1"><Clock size={13} /> ตามเวลาทำการ</p>
                <p className="text-[11px] text-text-muted">Kiosk จะแสดงหน้า &ldquo;นอกเวลาทำการ&rdquo; เมื่อไม่อยู่ในช่วงเวลาเปิดทำการ</p>
              </div>
              <button
                type="button"
                onClick={() => setFollowBusinessHours((v) => !v)}
                className={cn(
                  "w-11 h-6 rounded-full transition-all relative",
                  followBusinessHours ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                  followBusinessHours ? "left-[22px]" : "left-0.5"
                )} />
              </button>
            </div>

            {/* ID Masking */}
            <div>
              <p className="text-sm font-medium text-text-primary flex items-center gap-1 mb-1.5"><Eye size={13} /> รูปแบบการปิดบังเลขบัตร</p>
              <p className="text-[11px] text-text-muted mb-2">เลือกวิธีแสดงเลขบัตรประชาชน/Passport บนใบ slip</p>
              <div className="flex gap-2">
                {([
                  { value: "show-last-4", label: "แสดง 4 ตัวท้าย", example: "x-xxxx-xxxxx-xx-1" },
                  { value: "show-first-last", label: "แสดงหัว+ท้าย", example: "1-xxxx-xxxxx-xx-1" },
                  { value: "full-mask", label: "ปิดทั้งหมด", example: "x-xxxx-xxxxx-xx-x" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIdMaskingPattern(opt.value)}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all text-center",
                      idMaskingPattern === opt.value
                        ? "border-primary bg-primary-50 text-primary"
                        : "border-border bg-white text-text-muted hover:border-primary/30"
                    )}
                  >
                    <span className="block">{opt.label}</span>
                    <span className="block text-[10px] font-mono mt-0.5 opacity-60">{opt.example}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Admin PIN */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary flex items-center gap-1"><KeyRound size={13} /> PIN ผู้ดูแล Kiosk</p>
                <p className="text-[11px] text-text-muted">รหัส 5 หลักสำหรับเข้าเมนูตั้งค่าบน Kiosk</p>
              </div>
              <div className="w-28">
                <input
                  type="text"
                  maxLength={5}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="w-full px-2.5 py-1.5 text-sm text-center font-mono tracking-widest rounded-lg border border-border bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── เจ้าหน้าที่ประจำ Counter (counter only) ── */}
      {type === "counter" && (
        <div>
          <button
            type="button"
            onClick={() => setShowStaffAssign((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-2 w-full"
          >
            <Users size={15} className="text-info" />
            เจ้าหน้าที่ประจำ Counter ({assignedStaffIds.length} คน)
            {showStaffAssign ? <ChevronUp size={14} className="ml-auto text-text-muted" /> : <ChevronDown size={14} className="ml-auto text-text-muted" />}
          </button>
          {showStaffAssign && (
            <div className="space-y-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                <Info size={13} /> กำหนดเจ้าหน้าที่ รปภ. ที่มีสิทธิ์ทำงานที่ Counter นี้ — ★ = เจ้าหน้าที่หลัก
              </p>

              {/* Assigned list */}
              {assignedStaffIds.length > 0 ? (
                <div className="space-y-2">
                  {assignedStaffIds.map((a) => {
                    const staff = staffMembers.find((s) => s.id === a.staffId);
                    if (!staff) return null;
                    return (
                      <div key={a.staffId} className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 bg-white",
                        a.isPrimary ? "border-accent-500" : "border-border"
                      )}>
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          a.isPrimary ? "bg-accent-50 text-accent-600" : "bg-gray-100 text-text-secondary"
                        )}>
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{staff.name}</p>
                          <p className="text-[11px] text-text-muted">{staff.employeeId} · {staff.position}</p>
                        </div>
                        {a.isPrimary ? (
                          <span className="text-[11px] font-semibold text-accent-600 flex items-center gap-0.5 shrink-0">
                            <Star size={12} /> หลัก
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryStaff(a.staffId)}
                            className="text-[11px] text-text-muted hover:text-accent-600 shrink-0"
                          >
                            ตั้งเป็นหลัก
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeStaffAssignment(a.staffId)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:bg-error-light hover:text-error transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-warning text-center py-3">ยังไม่มีเจ้าหน้าที่ประจำ Counter นี้</p>
              )}

              {/* Add dropdown */}
              {unassignedStaff.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1"><UserPlus size={12} /> เพิ่มเจ้าหน้าที่</p>
                  <div className="space-y-1">
                    {unassignedStaff.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => addStaffAssignment(staff.id)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl border-2 border-dashed border-border text-left text-sm hover:border-info hover:bg-blue-50/30 transition-all"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-text-muted">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{staff.name}</p>
                          <p className="text-[11px] text-text-muted">{staff.employeeId} · {staff.shift === "morning" ? "กะเช้า" : staff.shift === "afternoon" ? "บ่าย" : staff.shift === "night" ? "ดึก" : ""}</p>
                        </div>
                        <UserPlus size={14} className="text-info shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status - original */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">สถานะ</label>
        <div className="flex gap-2">
          {(["online", "offline", "maintenance"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "flex-1 py-2.5 rounded-xl border-2 text-xs font-medium transition-all",
                status === s
                  ? s === "online" ? "border-success bg-success-light text-success" : s === "offline" ? "border-gray-400 bg-gray-100 text-gray-600" : "border-warning bg-warning-light text-warning"
                  : "border-border bg-white text-text-muted hover:border-gray-300"
              )}
            >
              {s === "online" ? "ออนไลน์" : s === "offline" ? "ออฟไลน์" : "ปิดปรับปรุง"}
            </button>
          ))}
        </div>
      </div>

      <Input label="หมายเหตุ" defaultValue={initial?.notes ?? ""} placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)" leftIcon={<StickyNote size={16} />} />

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}><Save size={16} /> บันทึก</Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>ยกเลิก</Button>
      </div>
    </div>
  );
}
