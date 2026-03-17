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
  Clock,
  Plus,
  Pencil,
  Calendar,
  CalendarOff,
  CalendarClock,
  Check,
  X,
  Info,
  Save,
  Tablet,
  Users,
} from "lucide-react";
import {
  businessHoursRules,
  type BusinessHoursRule,
} from "@/lib/mock-data";

const dayLabels = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function TypeBadge({ type }: { type: BusinessHoursRule["type"] }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    regular: { label: "ปกติ", cls: "bg-success-light text-success", icon: <Clock size={12} /> },
    special: { label: "พิเศษ", cls: "bg-info-light text-info", icon: <CalendarClock size={12} /> },
    holiday: { label: "วันหยุด", cls: "bg-error-light text-error", icon: <CalendarOff size={12} /> },
  };
  const c = cfg[type];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", c.cls)}>
      {c.icon} {c.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function BusinessHoursSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("business-hours")!;
  const flowData = getFlowByPageId("business-hours")!;
  const [items, setItems] = useState<BusinessHoursRule[]>(businessHoursRules);
  const [filterType, setFilterType] = useState<"all" | BusinessHoursRule["type"]>("all");
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit"; item?: BusinessHoursRule } | null>(null);

  const filtered = filterType === "all" ? items : items.filter((r) => r.type === filterType);

  const regularCount = items.filter((r) => r.type === "regular").length;
  const holidayCount = items.filter((r) => r.type === "holiday").length;
  const specialCount = items.filter((r) => r.type === "special").length;

  const stats = [
    { label: "ตารางปกติ", value: regularCount, icon: <Clock size={20} />, color: "text-success", bg: "bg-success-light" },
    { label: "วันหยุด", value: holidayCount, icon: <CalendarOff size={20} />, color: "text-error", bg: "bg-error-light" },
    { label: "ตารางพิเศษ", value: specialCount, icon: <CalendarClock size={20} />, color: "text-info", bg: "bg-info-light" },
    { label: "กฎทั้งหมด", value: items.length, icon: <Calendar size={20} />, color: "text-accent-600", bg: "bg-accent-50" },
  ];

  const toggleActive = (id: number) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  return (
    <>
      <Topbar title="เวลาทำการ / Business Hours" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              ตั้งค่าเวลาทำการ
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
            </h3>
            <p className="text-sm text-text-muted mt-1">กำหนดเวลาเปิด-ปิด ระบบสำหรับวันปกติ วันหยุด และงานพิเศษ</p>
          </div>
          <Button onClick={() => setDrawer({ mode: "add" })} className="gap-2">
            <Plus size={16} /> เพิ่มกฎเวลา
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary-dark leading-relaxed">
            <strong>เวลาทำการ</strong> ใช้ควบคุมว่าระบบจะอนุญาต Walk-in และ Kiosk ในช่วงเวลาใด
            — กฎ &quot;วันหยุด&quot; จะ override กฎ &quot;ปกติ&quot; หากตรงวันเดียวกัน
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

        {/* Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">ประเภท:</span>
          {(["all", "regular", "special", "holiday"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn("px-3 py-1.5 text-sm rounded-lg transition-colors font-medium", filterType === t ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200")}
            >
              {t === "all" ? "ทั้งหมด" : t === "regular" ? "ปกติ" : t === "special" ? "พิเศษ" : "วันหยุด"}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">ชื่อกฎ</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">ประเภท</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">วัน / วันที่</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">เวลาเปิด</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">เวลาปิด</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">Walk-in</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">Kiosk</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">สถานะ</th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule) => (
                  <tr key={rule.id} className={cn("border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors", !rule.isActive && "opacity-50")}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{rule.name}</p>
                      <p className="text-xs text-text-muted">{rule.nameEn}</p>
                      {rule.notes && <p className="text-[11px] text-warning mt-0.5">{rule.notes}</p>}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={rule.type} /></td>
                    <td className="px-4 py-3">
                      {rule.daysOfWeek ? (
                        <div className="flex gap-1">
                          {dayLabels.map((d, i) => (
                            <span key={i} className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium", rule.daysOfWeek!.includes(i) ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-text-primary">{rule.specificDate}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-text-primary">
                      {rule.openTime === "00:00" && rule.closeTime === "00:00" ? (
                        <span className="text-error text-xs">ปิดทั้งวัน</span>
                      ) : rule.openTime}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-text-primary">
                      {rule.openTime === "00:00" && rule.closeTime === "00:00" ? "—" : rule.closeTime}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rule.allowWalkin ? <Check size={16} className="mx-auto text-success" /> : <X size={16} className="mx-auto text-gray-300" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rule.allowKiosk ? <Check size={16} className="mx-auto text-success" /> : <X size={16} className="mx-auto text-gray-300" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(rule.id)} className={cn("text-xs font-medium px-2.5 py-1 rounded-full transition-colors", rule.isActive ? "bg-success-light text-success" : "bg-gray-100 text-gray-500")}>
                        {rule.isActive ? "ใช้งาน" : "ปิด"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "edit", item: rule })} className="gap-1 text-xs">
                        <Pencil size={14} /> แก้ไข
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* ── Drawer ── */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "add" ? "เพิ่มกฎเวลาทำการ" : "แก้ไขกฎเวลาทำการ"}
        subtitle={drawer?.mode === "edit" ? drawer.item?.name : "กำหนดช่วงเวลาเปิด-ปิดระบบ"}
      >
        <BusinessHoursForm initial={drawer?.item} onSave={() => setDrawer(null)} onCancel={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}

/* ── Form ── */
function BusinessHoursForm({ initial, onSave, onCancel }: { initial?: BusinessHoursRule; onSave: () => void; onCancel: () => void }) {
  const [type, setType] = useState<BusinessHoursRule["type"]>(initial?.type ?? "regular");
  const [days, setDays] = useState<number[]>(initial?.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [allowWalkin, setAllowWalkin] = useState(initial?.allowWalkin ?? true);
  const [allowKiosk, setAllowKiosk] = useState(initial?.allowKiosk ?? true);

  const toggleDay = (d: number) => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อกฎ (ไทย)" defaultValue={initial?.name} placeholder="เช่น วันทำการปกติ (จ-ศ)" />
      <Input label="ชื่อกฎ (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Regular Weekdays" />

      {/* Type */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">ประเภท</label>
        <div className="flex gap-2">
          {(["regular", "special", "holiday"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                type === t ? "border-primary bg-primary-50 text-primary" : "border-border bg-white text-text-secondary hover:border-primary/30"
              )}
            >
              {t === "regular" ? <Clock size={16} /> : t === "special" ? <CalendarClock size={16} /> : <CalendarOff size={16} />}
              {t === "regular" ? "ปกติ" : t === "special" ? "พิเศษ" : "วันหยุด"}
            </button>
          ))}
        </div>
      </div>

      {/* Days (regular) or Date (special/holiday) */}
      {type === "regular" ? (
        <div>
          <label className="text-sm font-semibold text-text-primary mb-2 block">วันที่ใช้งาน</label>
          <div className="flex gap-2">
            {dayLabels.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={cn("w-10 h-10 rounded-full text-sm font-medium transition-all", days.includes(i) ? "bg-primary text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Input label="วันที่ (YYYY-MM-DD)" defaultValue={initial?.specificDate} placeholder="2569-04-06" leftIcon={<Calendar size={16} />} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="เวลาเปิด" defaultValue={initial?.openTime ?? "08:30"} placeholder="08:30" leftIcon={<Clock size={16} />} />
        <Input label="เวลาปิด" defaultValue={initial?.closeTime ?? "16:30"} placeholder="16:30" leftIcon={<Clock size={16} />} />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setAllowWalkin(!allowWalkin)}
          className={cn("flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all", allowWalkin ? "border-success bg-success-light text-success" : "border-border bg-white text-text-muted")}
        >
          <Users size={16} /> Walk-in {allowWalkin ? "✓" : "✗"}
        </button>
        <button
          onClick={() => setAllowKiosk(!allowKiosk)}
          className={cn("flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all", allowKiosk ? "border-success bg-success-light text-success" : "border-border bg-white text-text-muted")}
        >
          <Tablet size={16} /> Kiosk {allowKiosk ? "✓" : "✗"}
        </button>
      </div>

      <Input label="หมายเหตุ" defaultValue={initial?.notes ?? ""} placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)" />

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}><Save size={16} /> บันทึก</Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>ยกเลิก</Button>
      </div>
    </div>
  );
}
