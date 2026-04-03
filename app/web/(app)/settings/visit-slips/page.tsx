"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Settings, Printer, Pencil, QrCode, Wifi, Scissors,
  ChevronDown, ChevronUp, Info, Save, Eye,
  GripVertical, Check, X, Plus, ToggleRight, ToggleLeft,
  Upload, ImageIcon, Trash2, ZoomIn, RotateCcw,
} from "lucide-react";
import ThermalSlipPreview from "@/components/kiosk/ThermalSlipPreview";
import type { SlipData, ThermalSection } from "@/lib/kiosk/kiosk-types";
import { useVisitSlipConfig, useUpdateVisitSlipConfig } from "@/lib/hooks";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ===== DEFAULT THERMAL TEMPLATE =====
const defaultSections: ThermalSection[] = [
  {
    id: "header",
    name: "ส่วนหัว (Header)",
    nameEn: "Header Section",
    enabled: true,
    fields: [
      { key: "orgLogo", label: "โลโก้หน่วยงาน", labelEn: "Organization Logo", enabled: true, editable: false },
      { key: "orgName", label: "กระทรวงการท่องเที่ยวและกีฬา", labelEn: "Ministry of Tourism and Sports", enabled: true, editable: true },
      { key: "orgNameEn", label: "Ministry of Tourism and Sports", labelEn: "Org Name (EN)", enabled: true, editable: true },
      { key: "slipTitle", label: "VISITOR PASS", labelEn: "Slip Title", enabled: true, editable: true },
    ],
  },
  {
    id: "slipNumber",
    name: "เลขที่ Slip",
    nameEn: "Slip Number",
    enabled: true,
    fields: [
      { key: "slipNumberLabel", label: "เลขที่ / Slip No.", labelEn: "Label", enabled: true, editable: true },
      { key: "slipNumber", label: "eVMS-25680315-0042", labelEn: "Number", enabled: true, editable: false },
    ],
  },
  {
    id: "visitor",
    name: "ข้อมูลผู้เยี่ยม",
    nameEn: "Visitor Info",
    enabled: true,
    fields: [
      { key: "visitorName", label: "ชื่อ / Name", labelEn: "Visitor Name", enabled: true, editable: true },
      { key: "visitorNameEn", label: "ชื่อ (EN)", labelEn: "Name (EN)", enabled: true, editable: true },
      { key: "idNumber", label: "เลขบัตร / ID", labelEn: "ID Number", enabled: true, editable: true },
      { key: "visitPurpose", label: "วัตถุประสงค์ / Purpose", labelEn: "Visit Purpose", enabled: true, editable: true },
      { key: "visitPurposeEn", label: "Purpose (EN)", labelEn: "Purpose (EN)", enabled: true, editable: true },
    ],
  },
  {
    id: "host",
    name: "ข้อมูลผู้รับ",
    nameEn: "Host Info",
    enabled: true,
    fields: [
      { key: "hostName", label: "ผู้รับ / Host", labelEn: "Host Name", enabled: true, editable: true },
      { key: "department", label: "หน่วยงาน / Dept", labelEn: "Department", enabled: true, editable: true },
      { key: "accessZone", label: "พื้นที่ / Zone", labelEn: "Access Zone", enabled: true, editable: true },
    ],
  },
  {
    id: "time",
    name: "วันที่-เวลา",
    nameEn: "Date & Time",
    enabled: true,
    fields: [
      { key: "visitDate", label: "วันที่ / Date", labelEn: "Date", enabled: true, editable: true },
      { key: "timeIn", label: "เข้า / In", labelEn: "Time In", enabled: true, editable: true },
      { key: "timeOut", label: "ออก / Out", labelEn: "Time Out", enabled: true, editable: true },
    ],
  },
  {
    id: "extras",
    name: "ข้อมูลเพิ่มเติม",
    nameEn: "Additional Info",
    enabled: true,
    fields: [
      { key: "companions", label: "ผู้ติดตาม", labelEn: "Companions", enabled: true, editable: true },
      { key: "vehiclePlate", label: "ทะเบียนรถ", labelEn: "Vehicle Plate", enabled: true, editable: true },
    ],
  },
  {
    id: "wifi",
    name: "WiFi สำหรับผู้เยี่ยม",
    nameEn: "Guest WiFi",
    enabled: true,
    fields: [
      { key: "wifiSsid", label: "SSID", labelEn: "Network Name", enabled: true, editable: false },
      { key: "wifiPass", label: "รหัส WiFi", labelEn: "Password", enabled: true, editable: false },
      { key: "wifiExpiry", label: "ใช้ได้ถึง", labelEn: "Valid Until", enabled: true, editable: false },
    ],
  },
  {
    id: "qrCode",
    name: "QR Code (Check-out)",
    nameEn: "Checkout QR Code",
    enabled: true,
    fields: [
      { key: "qrCode", label: "QR Code", labelEn: "QR Code", enabled: true, editable: false },
      { key: "qrLabel", label: "สแกนเพื่อ Check-out / Scan to Check-out", labelEn: "QR Label", enabled: true, editable: true },
    ],
  },
  {
    id: "officerSign",
    name: "ลงชื่อเจ้าหน้าที่ / ประทับตรา",
    nameEn: "Officer Signature & Stamp",
    enabled: true,
    fields: [
      { key: "officerSignLabel", label: "ลงชื่อเจ้าหน้าที่ / Officer Signature", labelEn: "Signature Label", enabled: true, editable: true },
      { key: "officerSignLine", label: "เส้นลงชื่อ (................................................)", labelEn: "Signature Line", enabled: true, editable: false },
      { key: "stampLabel", label: "ประทับตรา / Stamp", labelEn: "Stamp Label", enabled: true, editable: true },
      { key: "stampPlaceholder", label: "ประทับตราหน่วยงาน", labelEn: "Stamp Placeholder Text", enabled: true, editable: true },
    ],
  },
  {
    id: "footer",
    name: "ส่วนท้าย (Footer)",
    nameEn: "Footer Section",
    enabled: true,
    fields: [
      { key: "footerTh", label: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร", labelEn: "Footer TH", enabled: true, editable: true },
      { key: "footerEn", label: "Please return this pass when leaving", labelEn: "Footer EN", enabled: true, editable: true },
    ],
  },
];

// Mock preview data
const previewSlipData: SlipData = {
  slipNumber: "eVMS-25680315-0042",
  visitorName: "นายพุทธิพงษ์ คาดสนิท",
  visitorNameEn: "Mr. Putthipong Khadsnit",
  idNumber: "1-1234-56789-01-0",
  visitPurpose: "ติดต่อราชการ",
  visitPurposeEn: "Official Business",
  hostName: "คุณสมศรี รักงาน",
  department: "กองกิจการท่องเที่ยว",
  accessZone: "ชั้น 3 อาคาร C",
  date: "15 มี.ค. 2568",
  timeIn: "10:05",
  timeOut: "16:30 น.",
  wifi: {
    ssid: "MOTS-Guest",
    password: "mots2026",
    validUntil: "16:30 น.",
  },
  qrCodeData: "eVMS-25680315-0042",
};

// ===== PAGE =====
export default function VisitSlipTemplatesSettingsPage() {
  const { data: slipConfig, isLoading } = useVisitSlipConfig();
  const updateMut = useUpdateVisitSlipConfig();
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("visit-slips")!;
  const flowData = getFlowByPageId("visit-slips")!;
  const apiDoc = getApiDocByPageId("visit-slips");

  // Map DB template to local state shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tpl = (slipConfig as any)?.template;

  const [sections, setSections] = useState<ThermalSection[]>(defaultSections);
  const [dbSectionMap, setDbSectionMap] = useState<Record<string, { sectionDbId: number; fieldDbIds: Record<string, number> }>>({});
  // Seed from API when available
  useEffect(() => {
    if (!tpl?.sections?.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: ThermalSection[] = tpl.sections.map((s: any) => ({
      id: s.sectionKey,
      name: s.name,
      nameEn: s.nameEn,
      enabled: s.isEnabled,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fields: (s.fields ?? []).map((f: any) => ({
        key: f.fieldKey,
        label: f.label,
        labelEn: f.labelEn,
        enabled: f.isEnabled,
        editable: f.isEditable,
      })),
    }));
    setSections(mapped);
    // Build map of sectionKey → DB ids for saving
    const sMap: Record<string, { sectionDbId: number; fieldDbIds: Record<string, number> }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tpl.sections.forEach((s: any) => {
      const fieldIds: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s.fields ?? []).forEach((f: any) => { fieldIds[f.fieldKey] = f.id; });
      sMap[s.sectionKey] = { sectionDbId: s.id, fieldDbIds: fieldIds };
    });
    setDbSectionMap(sMap);
    // Logo from template
    if (tpl.logoUrl) setLogoSrc(tpl.logoUrl);
    if (tpl.logoSizePx) setLogoSize(tpl.logoSizePx);
  }, [tpl]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const [expandedSection, setExpandedSection] = useState<string | null>("header");
  const [editingField, setEditingField] = useState<string | null>(null);

  // Logo settings
  const [logoSrc, setLogoSrc] = useState<string>("/images/mot_logo_slip.png");
  const [logoSize, setLogoSize] = useState<number>(50);
  const [logoFileName, setLogoFileName] = useState<string>("mot_logo_slip.png");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoSrc("/images/mot_logo_slip.png");
    setLogoFileName("mot_logo_slip.png");
    setLogoSize(50);
  };

  const enabledSections = useMemo(() => sections.filter((s) => s.enabled), [sections]);
  const totalFields = useMemo(() => sections.flatMap((s) => s.fields).length, [sections]);
  const enabledFields = useMemo(() => sections.flatMap((s) => s.enabled ? s.fields.filter((f) => f.enabled) : []).length, [sections]);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleField = (sectionId: string, fieldKey: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map((f) => (f.key === fieldKey ? { ...f, enabled: !f.enabled } : f)) }
          : s
      )
    );
  };

  const updateFieldLabel = (sectionId: string, fieldKey: string, newLabel: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map((f) => (f.key === fieldKey ? { ...f, label: newLabel } : f)) }
          : s
      )
    );
  };

  const stats = [
    { label: "ขนาดกระดาษ", value: "80mm", sub: "Thermal Receipt", icon: <Printer size={18} /> },
    { label: "ส่วนที่แสดง", value: `${enabledSections.length}/${sections.length}`, sub: "Sections", icon: <Eye size={18} /> },
    { label: "ฟิลด์ที่เปิด", value: `${enabledFields}/${totalFields}`, sub: "Fields", icon: <Check size={18} /> },
  ];

  const handleSave = useCallback(async () => {
    try {
      const apiSections = sections.map((s, index) => {
        const dbInfo = dbSectionMap[s.id];
        return {
          id: dbInfo?.sectionDbId,
          name: s.name,
          nameEn: s.nameEn,
          isEnabled: s.enabled,
          sortOrder: index,
          fields: s.fields.map((f, fIndex) => ({
            id: dbInfo?.fieldDbIds?.[f.key],
            label: f.label,
            labelEn: f.labelEn,
            isEnabled: f.enabled,
            isEditable: f.editable,
            sortOrder: fIndex,
          })),
        };
      });
      await updateMut.mutateAsync({
        id: tpl?.id,
        logoUrl: logoSrc,
        logoSizePx: logoSize,
        sections: apiSections,
      } as any);
      setToast({ type: "success", message: "บันทึกสำเร็จ" });
    } catch {
      setToast({ type: "error", message: "บันทึกไม่สำเร็จ กรุณาลองใหม่" });
    }
  }, [sections, dbSectionMap, logoSrc, logoSize, tpl, updateMut]);

  const handleResetDefaults = useCallback(() => {
    setSections(defaultSections);
    setLogoSrc("/images/mot_logo_slip.png");
    setLogoSize(50);
    setLogoFileName("mot_logo_slip.png");
    setToast({ type: "success", message: "รีเซ็ตเป็นค่าเริ่มต้นแล้ว (ยังไม่ได้บันทึก)" });
  }, []);

  // Drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  if (isLoading) return <><Topbar title="แบบฟอร์ม Visit Slip / Thermal Slip Editor" /><div className="p-8 text-center text-text-muted">กำลังโหลด...</div></>;

  return (
    <>
      <Topbar title="แบบฟอร์ม Visit Slip / Thermal Slip Editor" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-5">
        {/* Toast */}
        {toast && (
          <div className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2",
            toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
            {toast.message}
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              ตั้งค่า Visit Slip (80mm Thermal)
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h3>
            <p className="text-sm text-text-muted mt-1">แก้ไขเนื้อหา ส่วนที่แสดง และลำดับฟิลด์ของ Visit Slip ที่พิมพ์จาก Kiosk</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-text-muted text-sm font-medium hover:bg-gray-50 transition"
              onClick={handleResetDefaults}
            >
              <RotateCcw size={16} />
              รีเซ็ตค่าเริ่มต้น
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark shadow-sm transition disabled:opacity-50"
              disabled={updateMut.isPending}
              onClick={handleSave}
            >
              {updateMut.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {updateMut.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={18} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-primary-dark leading-relaxed">
            Visit Slip ใช้เครื่องพิมพ์ Thermal 80mm (302px) — แก้ไขข้อความ เปิด/ปิดส่วนที่แสดง และดู Live Preview ด้านขวา
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center">{s.icon}</div>
                <div>
                  <p className="text-xl font-bold text-text-primary">{s.value}</p>
                  <p className="text-[11px] text-text-muted">{s.label} — {s.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content: Editor + Preview split */}
        <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
          {/* LEFT: Section editor */}
          <div className="space-y-2">
            {/* Logo Settings Card */}
            <Card className="border shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">โลโก้หน่วยงาน</p>
                    <p className="text-[10px] text-text-muted">Organization Logo — อัปโหลดและปรับขนาดโลโก้บน Visit Slip</p>
                  </div>
                </div>

                {/* Upload + Preview row */}
                <div className="flex items-start gap-4">
                  {/* Current logo preview */}
                  <div className="shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={logoSrc}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* File name + upload/remove buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted truncate max-w-[160px]">{logoFileName}</span>
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary text-xs font-medium cursor-pointer hover:bg-primary-100 transition-colors">
                        <Upload size={12} />
                        อัปโหลด
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      {logoSrc !== "/images/mot_logo_slip.png" && (
                        <button
                          onClick={handleLogoRemove}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs transition-colors"
                        >
                          <Trash2 size={12} />
                          ลบ
                        </button>
                      )}
                    </div>

                    {/* Size slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-text-muted">
                          <ZoomIn size={12} />
                          ขนาดโลโก้
                        </label>
                        <span className="text-xs font-mono font-semibold text-text-primary">{logoSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={150}
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-text-muted">
                        <span>50px</span>
                        <span>100px</span>
                        <span>150px</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-text-muted">รองรับ PNG, JPG, SVG, WebP — แนะนำขนาดไม่เกิน 200KB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((section) => (
                  <SortableSectionCard
                    key={section.id}
                    section={section}
                    isExpanded={expandedSection === section.id}
                    onToggleExpand={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    onToggleSection={() => toggleSection(section.id)}
                    onToggleField={(fieldKey) => toggleField(section.id, fieldKey)}
                    editingField={editingField}
                    onEditField={setEditingField}
                    onUpdateFieldLabel={(fieldKey, label) => updateFieldLabel(section.id, fieldKey, label)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* RIGHT: Live thermal preview */}
          <div className="sticky top-24">
            <div className="bg-gray-100 rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Eye size={16} className="text-primary" />
                  Live Preview
                </div>
                <span className="text-[10px] text-text-muted bg-white px-2 py-0.5 rounded-full border border-gray-200">80mm (302px)</span>
              </div>
              <ThermalSlipPreview data={previewSlipData} scale={0.9} logoSrc={logoSrc} logoSize={logoSize} sections={sections} />
              <p className="text-[10px] text-text-muted text-center mt-3">
                <Scissors size={10} className="inline mr-1" />
                ขนาดจริง 80mm — แสดงที่ 90%
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ===== SORTABLE SECTION CARD =====
function SortableSectionCard({
  section, isExpanded, onToggleExpand, onToggleSection, onToggleField,
  editingField, onEditField, onUpdateFieldLabel,
}: {
  section: ThermalSection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSection: () => void;
  onToggleField: (fieldKey: string) => void;
  editingField: string | null;
  onEditField: (key: string | null) => void;
  onUpdateFieldLabel: (fieldKey: string, label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : undefined,
  };
  const enabledCount = section.fields.filter((f) => f.enabled).length;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn("border shadow-sm transition-all", !section.enabled && "opacity-40")}>
        <CardContent className="p-0">
          {/* Section header */}
          <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onToggleExpand}>
            <GripVertical
              size={14}
              className="text-gray-300 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={(e) => { e.stopPropagation(); onToggleSection(); }}
              className={cn("shrink-0", section.enabled ? "text-success" : "text-gray-300")}>
              {section.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">{section.name}</span>
                <span className="text-[10px] text-text-muted">({section.nameEn})</span>
              </div>
              <span className="text-[10px] text-text-muted">{enabledCount}/{section.fields.length} fields</span>
            </div>
            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>

          {/* Expanded: fields */}
          {isExpanded && section.enabled && (
            <div className="border-t border-border">
              {section.fields.map((field) => (
                <div key={field.key} className="flex items-center gap-2 px-4 py-2 border-b border-border/50 last:border-0 hover:bg-gray-50/50">
                  <GripVertical size={12} className="text-gray-200" />
                  <button onClick={() => onToggleField(field.key)}
                    className={cn("shrink-0", field.enabled ? "text-success" : "text-gray-300")}>
                    {field.enabled ? <Check size={14} /> : <X size={14} />}
                  </button>
                  {editingField === field.key && field.editable ? (
                    <input
                      autoFocus
                      defaultValue={field.label}
                      onBlur={(e) => { onUpdateFieldLabel(field.key, e.target.value); onEditField(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { onUpdateFieldLabel(field.key, (e.target as HTMLInputElement).value); onEditField(null); } }}
                      className="flex-1 text-xs px-2 py-1 rounded-lg border border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-primary-50"
                    />
                  ) : (
                    <span className={cn("flex-1 text-xs", field.enabled ? "text-text-primary" : "text-gray-400 line-through")}>
                      {field.label}
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted shrink-0">{field.labelEn}</span>
                  {field.editable && (
                    <button onClick={() => onEditField(field.key)} className="text-gray-300 hover:text-primary transition-colors">
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
