"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
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
} from "lucide-react";
import {
  servicePoints,
  staffMembers,
  visitPurposeConfigs,
  identityDocumentTypes,
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
  const schema = getSchemaByPageId("service-points")!;
  const flowData = getFlowByPageId("service-points")!;
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
  const cycleStatus = (id: string) => {
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
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              จุดให้บริการ Kiosk & Counter
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
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
          {(["all", "kiosk", "counter"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                filterType === t ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              )}
            >
              {t === "all" ? "ทั้งหมด" : t === "kiosk" ? "Kiosk" : "Counter"}
            </button>
          ))}

          <div className="w-px h-6 bg-border mx-2" />

          <span className="text-sm font-medium text-text-secondary">สถานะ:</span>
          {(["all", "online", "offline", "maintenance"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                filterStatus === s ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              )}
            >
              {s === "all" ? "ทั้งหมด" : s === "online" ? "ออนไลน์" : s === "offline" ? "ออฟไลน์" : "ปิดปรับปรุง"}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sp) => {
            const assignedStaff = sp.assignedStaffId ? staffMembers.find((s) => s.id === sp.assignedStaffId) : null;
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
                    {assignedStaff && (
                      <div className="flex items-center gap-1.5 text-text-secondary col-span-2">
                        <User size={13} className="text-text-muted" /> ผู้รับผิดชอบ: {assignedStaff.name}
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
  const kioskOnlyDocIds = ["1", "2", "5"];

  const [type, setType] = useState<ServicePointType>(initial?.type ?? "kiosk");
  const [status, setStatus] = useState<ServicePointStatus>(initial?.status ?? "offline");
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(initial?.allowedPurposeIds ?? []);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(initial?.allowedDocumentIds ?? []);

  const handleTypeChange = (t: ServicePointType) => {
    setType(t);
    if (t === "kiosk") {
      setSelectedDocs((prev) => prev.filter((id) => kioskOnlyDocIds.includes(id)));
    }
  };

  const togglePurpose = (id: string) =>
    setSelectedPurposes((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  const toggleDoc = (id: string) =>
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
