"use client";

import { useState, useMemo } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Settings, Printer, Pencil, QrCode, Wifi, Scissors,
  ChevronDown, ChevronUp, Info, Save, Eye,
  GripVertical, Check, X, Plus, ToggleRight, ToggleLeft,
} from "lucide-react";
import ThermalSlipPreview from "@/components/kiosk/ThermalSlipPreview";
import type { SlipData } from "@/lib/kiosk/kiosk-types";

// ===== TYPES FOR THERMAL TEMPLATE EDITOR =====
interface ThermalSection {
  id: string;
  name: string;
  nameEn: string;
  enabled: boolean;
  fields: ThermalField[];
}

interface ThermalField {
  key: string;
  label: string;
  labelEn: string;
  enabled: boolean;
  editable: boolean; // label text can be changed
  value?: string; // override display value in preview
}

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
    enabled: false,
    fields: [
      { key: "companions", label: "ผู้ติดตาม", labelEn: "Companions", enabled: false, editable: true },
      { key: "vehiclePlate", label: "ทะเบียนรถ", labelEn: "Vehicle Plate", enabled: false, editable: true },
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
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("visit-slips")!;
  const flowData = getFlowByPageId("visit-slips")!;

  const [sections, setSections] = useState<ThermalSection[]>(defaultSections);
  const [expandedSection, setExpandedSection] = useState<string | null>("header");
  const [editingField, setEditingField] = useState<string | null>(null);

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

  return (
    <>
      <Topbar title="แบบฟอร์ม Visit Slip / Thermal Slip Editor" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      <main className="flex-1 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              ตั้งค่า Visit Slip (80mm Thermal)
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
            </h3>
            <p className="text-sm text-text-muted mt-1">แก้ไขเนื้อหา ส่วนที่แสดง และลำดับฟิลด์ของ Visit Slip ที่พิมพ์จาก Kiosk</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark shadow-sm transition">
            <Save size={16} /> บันทึก
          </button>
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
            {sections.map((section) => {
              const isExpanded = expandedSection === section.id;
              const enabledCount = section.fields.filter((f) => f.enabled).length;
              return (
                <Card key={section.id} className={cn("border shadow-sm transition-all", !section.enabled && "opacity-40")}>
                  <CardContent className="p-0">
                    {/* Section header */}
                    <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}>
                      <GripVertical size={14} className="text-gray-300 cursor-grab" />
                      <button onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
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
                            <button onClick={() => toggleField(section.id, field.key)}
                              className={cn("shrink-0", field.enabled ? "text-success" : "text-gray-300")}>
                              {field.enabled ? <Check size={14} /> : <X size={14} />}
                            </button>
                            {editingField === field.key && field.editable ? (
                              <input
                                autoFocus
                                defaultValue={field.label}
                                onBlur={(e) => { updateFieldLabel(section.id, field.key, e.target.value); setEditingField(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter") { updateFieldLabel(section.id, field.key, (e.target as HTMLInputElement).value); setEditingField(null); } }}
                                className="flex-1 text-xs px-2 py-1 rounded-lg border border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/30 bg-primary-50"
                              />
                            ) : (
                              <span className={cn("flex-1 text-xs", field.enabled ? "text-text-primary" : "text-gray-400 line-through")}>
                                {field.label}
                              </span>
                            )}
                            <span className="text-[10px] text-text-muted shrink-0">{field.labelEn}</span>
                            {field.editable && (
                              <button onClick={() => setEditingField(field.key)} className="text-gray-300 hover:text-primary transition-colors">
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
              <ThermalSlipPreview data={previewSlipData} scale={0.9} />
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
