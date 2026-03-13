"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Settings,
  Printer,
  Plus,
  Pencil,
  FileText,
  CreditCard,
  Receipt,
  QrCode,
  Camera,
  BarChart3,
  Check,
  X,
  Info,
  Save,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  Star,
  Image,
  ScanBarcode,
  Link2,
  ArrowUpDown,
  Palette,
} from "lucide-react";
import {
  visitSlipTemplates,
  slipSizeLabels,
  defaultSlipFields,
  visitPurposeConfigs,
  purposeSlipMappings,
  type VisitSlipTemplate,
  type SlipSize,
  type SlipField,
  type PurposeSlipMapping,
} from "@/lib/mock-data";

/* ── Size Badge ── */
function SizeBadge({ size }: { size: SlipSize }) {
  const cfg = slipSizeLabels[size];
  const colorMap: Record<SlipSize, string> = {
    a4: "bg-primary-50 text-primary",
    a5: "bg-info-light text-info",
    "thermal-80mm": "bg-warning-light text-warning",
    "thermal-58mm": "bg-orange-50 text-orange-600",
    "badge-card": "bg-accent-50 text-accent-600",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full", colorMap[size])}>
      {cfg.label} ({cfg.dimensions})
    </span>
  );
}

/* ── Slip Preview Card ── */
function SlipPreview({ template }: { template: VisitSlipTemplate }) {
  const enabledFields = template.fields.filter((f) => f.enabled);
  const isLandscape = template.orientation === "landscape";

  return (
    <div
      className={cn(
        "border-2 rounded-xl p-4 bg-white relative overflow-hidden transition-all",
        isLandscape ? "aspect-[1.6/1]" : "aspect-[0.7/1]",
        "max-h-[280px]"
      )}
      style={{ borderColor: template.previewColor + "40" }}
    >
      {/* Color strip top */}
      <div className="absolute top-0 left-0 right-0 h-2 rounded-t-lg" style={{ backgroundColor: template.previewColor }} />

      <div className="mt-2 space-y-2 text-center">
        {template.showLogo && (
          <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center" style={{ backgroundColor: template.previewColor + "15", color: template.previewColor }}>
            <Printer size={16} />
          </div>
        )}
        <p className="text-[9px] font-bold truncate" style={{ color: template.previewColor }}>
          {template.headerText}
        </p>

        <div className="flex justify-center gap-2">
          {template.showQrCode && (
            <div className="w-10 h-10 rounded border border-dashed border-gray-300 flex items-center justify-center">
              <QrCode size={14} className="text-gray-400" />
            </div>
          )}
          {template.showPhoto && (
            <div className="w-10 h-10 rounded border border-dashed border-gray-300 flex items-center justify-center">
              <Camera size={14} className="text-gray-400" />
            </div>
          )}
          {template.showBarcode && (
            <div className="w-16 h-6 rounded border border-dashed border-gray-300 flex items-center justify-center">
              <ScanBarcode size={12} className="text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-0.5 text-left">
          {enabledFields.slice(0, 6).map((f) => (
            <div key={f.key} className="flex text-[8px]">
              <span className="text-gray-400 w-16 shrink-0 truncate">{f.label}:</span>
              <span className="text-gray-300 flex-1">{"█".repeat(8)}</span>
            </div>
          ))}
          {enabledFields.length > 6 && (
            <p className="text-[8px] text-gray-300 text-center">+{enabledFields.length - 6} fields</p>
          )}
        </div>

        <p className="text-[7px] text-gray-400 truncate">{template.footerText}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function VisitSlipTemplatesSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const schema = getSchemaByPageId("visit-slips")!;
  const [activeTab, setActiveTab] = useState<"templates" | "mapping">("templates");
  const [templates, setTemplates] = useState<VisitSlipTemplate[]>(visitSlipTemplates);
  const [mappings, setMappings] = useState<PurposeSlipMapping[]>(purposeSlipMappings);
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit"; item?: VisitSlipTemplate } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalActive = templates.filter((t) => t.isActive).length;
  const defaultTemplate = templates.find((t) => t.isDefault);
  const badgeCount = templates.filter((t) => t.size === "badge-card").length;
  const thermalCount = templates.filter((t) => t.size === "thermal-80mm" || t.size === "thermal-58mm").length;

  const stats = [
    { label: "เทมเพลตทั้งหมด", value: templates.length, icon: <Printer size={20} />, color: "text-primary", bg: "bg-primary-50" },
    { label: "ใช้งานอยู่", value: totalActive, icon: <Check size={20} />, color: "text-success", bg: "bg-success-light" },
    { label: "Badge Card", value: badgeCount, icon: <CreditCard size={20} />, color: "text-accent-600", bg: "bg-accent-50" },
    { label: "Thermal Receipt", value: thermalCount, icon: <Receipt size={20} />, color: "text-warning", bg: "bg-warning-light" },
  ];

  const toggleActive = (id: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
  };

  const updateMapping = (purposeId: string, templateId: string | null) => {
    setMappings((prev) => prev.map((m) => (m.visitPurposeId === purposeId ? { ...m, slipTemplateId: templateId } : m)));
  };

  return (
    <>
      <Topbar title="แบบฟอร์ม Visit Slip / Slip Templates" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              ตั้งค่าแบบฟอร์มบัตรผู้เยี่ยม (Visit Slip)
              <DbSchemaButton onClick={() => setShowSchema(true)} />
            </h3>
            <p className="text-sm text-text-muted mt-1">จัดการเทมเพลตบัตรผู้เยี่ยม และเลือกแบบที่ใช้ตามวัตถุประสงค์การเข้าพื้นที่</p>
          </div>
          {activeTab === "templates" && (
            <Button onClick={() => setDrawer({ mode: "add" })} className="gap-2">
              <Plus size={16} /> เพิ่มเทมเพลต
            </Button>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary-dark leading-relaxed">
            <strong>Visit Slip</strong> คือบัตรผู้เยี่ยมที่พิมพ์จาก Kiosk หรือ Counter
            — สามารถสร้างหลายแบบ (A5, Badge Card, Thermal Receipt) และ
            <strong> เลือกแบบที่ใช้ตามวัตถุประสงค์</strong> ได้ หรือใช้แบบมาตรฐาน
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

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("templates")}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "templates" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
            )}
          >
            <Printer size={14} className="inline mr-1.5" />
            เทมเพลตทั้งหมด
          </button>
          <button
            onClick={() => setActiveTab("mapping")}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "mapping" ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
            )}
          >
            <Link2 size={14} className="inline mr-1.5" />
            เลือกแบบตามวัตถุประสงค์
          </button>
        </div>

        {/* ══ Tab: Templates ══ */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {templates.map((tmpl) => {
              const isExpanded = expandedId === tmpl.id;
              const enabledFields = tmpl.fields.filter((f) => f.enabled);
              return (
                <Card key={tmpl.id} className={cn("border shadow-sm transition-all hover:shadow-md", !tmpl.isActive && "opacity-50")}>
                  <CardContent className="p-0">
                    {/* Preview */}
                    <div className="p-4 pb-0">
                      <SlipPreview template={tmpl} />
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-text-primary text-sm">{tmpl.name}</h4>
                            {tmpl.isDefault && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-50 text-accent-600">
                                <Star size={10} /> มาตรฐาน
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">{tmpl.nameEn}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2" style={{ backgroundColor: tmpl.previewColor, borderColor: tmpl.previewColor }} />
                      </div>

                      <p className="text-xs text-text-secondary">{tmpl.description}</p>

                      <div className="flex flex-wrap gap-1.5">
                        <SizeBadge size={tmpl.size} />
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-text-muted">
                          {tmpl.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}
                        </span>
                      </div>

                      {/* Feature icons */}
                      <div className="flex gap-3 text-xs">
                        <span className={cn("flex items-center gap-1", tmpl.showLogo ? "text-success" : "text-gray-300")}>
                          <Image size={13} /> Logo
                        </span>
                        <span className={cn("flex items-center gap-1", tmpl.showQrCode ? "text-success" : "text-gray-300")}>
                          <QrCode size={13} /> QR
                        </span>
                        <span className={cn("flex items-center gap-1", tmpl.showPhoto ? "text-success" : "text-gray-300")}>
                          <Camera size={13} /> Photo
                        </span>
                        <span className={cn("flex items-center gap-1", tmpl.showBarcode ? "text-success" : "text-gray-300")}>
                          <ScanBarcode size={13} /> Barcode
                        </span>
                      </div>

                      {/* Expandable: fields */}
                      <button onClick={() => setExpandedId(isExpanded ? null : tmpl.id)} className="flex items-center gap-1 text-xs text-primary hover:underline w-full">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        แสดงฟิลด์ ({enabledFields.length}/{tmpl.fields.length})
                      </button>

                      {isExpanded && (
                        <div className="space-y-1 bg-gray-50 rounded-lg p-3">
                          {tmpl.fields.map((f) => (
                            <div key={f.key} className="flex items-center gap-2 text-xs">
                              {f.enabled ? <Check size={12} className="text-success shrink-0" /> : <X size={12} className="text-gray-300 shrink-0" />}
                              <span className={cn(f.enabled ? "text-text-primary" : "text-gray-400 line-through")}>{f.label}</span>
                              <span className="text-text-muted">/ {f.labelEn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <button onClick={() => toggleActive(tmpl.id)} className={cn("text-xs font-medium px-2.5 py-1 rounded-full transition-colors", tmpl.isActive ? "bg-success-light text-success" : "bg-gray-100 text-gray-500")}>
                          {tmpl.isActive ? "ใช้งาน" : "ปิด"}
                        </button>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Eye size={14} /> Preview
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDrawer({ mode: "edit", item: tmpl })} className="gap-1 text-xs">
                            <Pencil size={14} /> แก้ไข
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ══ Tab: Mapping ══ */}
        {activeTab === "mapping" && (
          <Card className="border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-gray-50">
              <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <Link2 size={16} className="text-primary" />
                เลือกแบบ Slip ตามวัตถุประสงค์การเข้าพื้นที่
              </h4>
              <p className="text-xs text-text-muted mt-1">กำหนดว่าแต่ละวัตถุประสงค์จะใช้แบบ Slip แบบไหน — หากไม่เลือก จะใช้แบบมาตรฐานของระบบ</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">วัตถุประสงค์</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">แบบ Slip ที่เลือก</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">ขนาด</th>
                    <th className="text-center px-5 py-3 font-semibold text-text-secondary">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m) => {
                    const purpose = visitPurposeConfigs.find((p) => p.id === m.visitPurposeId);
                    const selectedTmpl = m.slipTemplateId ? templates.find((t) => t.id === m.slipTemplateId) : null;
                    const isDefault = !m.slipTemplateId;

                    return (
                      <tr key={m.visitPurposeId} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{purpose?.icon}</span>
                            <div>
                              <p className="font-semibold text-text-primary">{purpose?.name}</p>
                              <p className="text-xs text-text-muted">{purpose?.nameEn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={m.slipTemplateId ?? ""}
                            onChange={(e) => updateMapping(m.visitPurposeId, e.target.value || null)}
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                          >
                            <option value="">🏷️ ใช้แบบมาตรฐาน ({defaultTemplate?.name})</option>
                            {templates.filter((t) => t.isActive).map((t) => (
                              <option key={t.id} value={t.id}>{t.name} — {slipSizeLabels[t.size].label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          {selectedTmpl ? (
                            <SizeBadge size={selectedTmpl.size} />
                          ) : defaultTemplate ? (
                            <SizeBadge size={defaultTemplate.size} />
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isDefault ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-accent-50 text-accent-600">
                              <Star size={12} /> มาตรฐาน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary">
                              <Palette size={12} /> กำหนดเอง
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* ── Drawer ── */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "add" ? "เพิ่มเทมเพลต Visit Slip" : "แก้ไขเทมเพลต"}
        subtitle={drawer?.mode === "edit" ? drawer.item?.name : "ออกแบบแบบฟอร์มบัตรผู้เยี่ยม"}
        width="w-[600px]"
      >
        <SlipTemplateForm initial={drawer?.item} onSave={() => setDrawer(null)} onCancel={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}

/* ── Form ── */
function SlipTemplateForm({ initial, onSave, onCancel }: { initial?: VisitSlipTemplate; onSave: () => void; onCancel: () => void }) {
  const [size, setSize] = useState<SlipSize>(initial?.size ?? "a5");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(initial?.orientation ?? "portrait");
  const [showLogo, setShowLogo] = useState(initial?.showLogo ?? true);
  const [showQr, setShowQr] = useState(initial?.showQrCode ?? true);
  const [showPhoto, setShowPhoto] = useState(initial?.showPhoto ?? false);
  const [showBarcode, setShowBarcode] = useState(initial?.showBarcode ?? true);
  const [fields, setFields] = useState<SlipField[]>(initial?.fields ?? defaultSlipFields.map((f) => ({ ...f })));

  const toggleField = (key: string) => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  };

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อเทมเพลต (ไทย)" defaultValue={initial?.name} placeholder="เช่น แบบมาตรฐาน (A5)" />
      <Input label="ชื่อเทมเพลต (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Standard (A5)" />
      <Input label="คำอธิบาย" defaultValue={initial?.description} placeholder="รายละเอียดตัวเลือกนี้" />

      {/* Size */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">ขนาดกระดาษ</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(slipSizeLabels) as [SlipSize, { label: string; dimensions: string }][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSize(key)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-xs font-medium transition-all",
                size === key ? "border-primary bg-primary-50 text-primary" : "border-border bg-white text-text-secondary hover:border-primary/30"
              )}
            >
              <span>{val.label}</span>
              <span className="text-[10px] text-text-muted">{val.dimensions}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orientation */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">ทิศทาง</label>
        <div className="flex gap-2">
          {(["portrait", "landscape"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrientation(o)}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                orientation === o ? "border-primary bg-primary-50 text-primary" : "border-border bg-white text-text-secondary hover:border-primary/30"
              )}
            >
              {o === "portrait" ? "📄 แนวตั้ง" : "📃 แนวนอน"}
            </button>
          ))}
        </div>
      </div>

      {/* Show options */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">แสดงบน Slip</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "logo", label: "โลโก้หน่วยงาน", icon: <Image size={14} />, state: showLogo, toggle: () => setShowLogo(!showLogo) },
            { key: "qr", label: "QR Code", icon: <QrCode size={14} />, state: showQr, toggle: () => setShowQr(!showQr) },
            { key: "photo", label: "รูปภาพผู้เยี่ยม", icon: <Camera size={14} />, state: showPhoto, toggle: () => setShowPhoto(!showPhoto) },
            { key: "barcode", label: "Barcode", icon: <ScanBarcode size={14} />, state: showBarcode, toggle: () => setShowBarcode(!showBarcode) },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={opt.toggle}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all",
                opt.state ? "border-success bg-success-light text-success" : "border-border bg-white text-text-muted"
              )}
            >
              {opt.icon} {opt.label} {opt.state ? "✓" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">
          ฟิลด์ที่แสดง ({fields.filter((f) => f.enabled).length}/{fields.length})
        </label>
        <div className="space-y-1 bg-gray-50 rounded-xl p-3 max-h-[240px] overflow-y-auto">
          {fields.map((f) => (
            <button
              key={f.key}
              onClick={() => toggleField(f.key)}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                f.enabled ? "bg-white text-text-primary border border-primary/20" : "text-text-muted hover:bg-white/80"
              )}
            >
              {f.enabled ? <Check size={13} className="text-success shrink-0" /> : <X size={13} className="text-gray-300 shrink-0" />}
              <span className="flex-1">{f.label}</span>
              <span className="text-text-muted">{f.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      <Input label="ข้อความส่วนบน (Header)" defaultValue={initial?.headerText} placeholder="เช่น บัตรผู้เยี่ยม / Visitor Pass" />
      <Input label="ข้อความส่วนล่าง (Footer)" defaultValue={initial?.footerText} placeholder="เช่น กรุณาคืนบัตรเมื่อออก" />

      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">สีธีม</label>
        <div className="flex gap-2">
          {["#6A0DAD", "#D4AF37", "#333333", "#00695C", "#E65100", "#1565C0"].map((c) => (
            <button
              key={c}
              className={cn("w-8 h-8 rounded-full border-2 transition-all", initial?.previewColor === c || (!initial && c === "#6A0DAD") ? "border-text-primary scale-110" : "border-transparent hover:scale-105")}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}><Save size={16} /> บันทึก</Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>ยกเลิก</Button>
      </div>
    </div>
  );
}
