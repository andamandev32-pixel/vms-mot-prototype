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
  Bell,
  Plus,
  Pencil,
  MessageSquare,
  Mail,
  Smartphone,
  Check,
  X,
  Info,
  Save,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  Variable,
} from "lucide-react";
import {
  notificationTemplates,
  notificationTriggerLabels,
  type NotificationTemplate,
  type NotificationChannel,
  type NotificationTrigger,
} from "@/lib/mock-data";

/* ── Channel Badge ── */
function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const cfg: Record<NotificationChannel, { label: string; icon: React.ReactNode; cls: string }> = {
    line: { label: "LINE", icon: <MessageSquare size={12} />, cls: "bg-green-50 text-green-600" },
    email: { label: "Email", icon: <Mail size={12} />, cls: "bg-info-light text-info" },
    sms: { label: "SMS", icon: <Smartphone size={12} />, cls: "bg-warning-light text-warning" },
  };
  const c = cfg[channel];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", c.cls)}>
      {c.icon} {c.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function NotificationTemplatesSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("notification-templates")!;
  const flowData = getFlowByPageId("notification-templates")!;
  const apiDoc = getApiDocByPageId("notification-templates");
  const [items, setItems] = useState<NotificationTemplate[]>(notificationTemplates);
  const [filterChannel, setFilterChannel] = useState<"all" | NotificationChannel>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit"; item?: NotificationTemplate } | null>(null);

  const filtered = filterChannel === "all" ? items : items.filter((t) => t.channel === filterChannel);

  const lineCount = items.filter((t) => t.channel === "line").length;
  const emailCount = items.filter((t) => t.channel === "email").length;
  const smsCount = items.filter((t) => t.channel === "sms").length;
  const activeCount = items.filter((t) => t.isActive).length;

  const stats = [
    { label: "LINE Templates", value: lineCount, icon: <MessageSquare size={20} />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Email Templates", value: emailCount, icon: <Mail size={20} />, color: "text-info", bg: "bg-info-light" },
    { label: "SMS Templates", value: smsCount, icon: <Smartphone size={20} />, color: "text-warning", bg: "bg-warning-light" },
    { label: "ใช้งานอยู่", value: activeCount, icon: <Bell size={20} />, color: "text-accent-600", bg: "bg-accent-50" },
  ];

  const toggleActive = (id: number) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
  };

  return (
    <>
      <Topbar title="เทมเพลตแจ้งเตือน / Notification Templates" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              ตั้งค่าเทมเพลตการแจ้งเตือน
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h3>
            <p className="text-sm text-text-muted mt-1">จัดการข้อความแจ้งเตือนผ่าน LINE, Email, SMS สำหรับแต่ละ event</p>
          </div>
          <Button onClick={() => setDrawer({ mode: "add" })} className="gap-2">
            <Plus size={16} /> เพิ่มเทมเพลต
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary-dark leading-relaxed">
            <strong>เทมเพลตแจ้งเตือน</strong> ใช้กำหนดข้อความที่ระบบจะส่งอัตโนมัติเมื่อมี event เกิดขึ้น
            — ตัวแปร <code className="bg-white/50 px-1 rounded text-xs">{`{{variable}}`}</code> จะถูกแทนที่ด้วยข้อมูลจริงเมื่อส่ง
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
          <span className="text-sm font-medium text-text-secondary">ช่องทาง:</span>
          {(["all", "line", "email", "sms"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={cn("px-3 py-1.5 text-sm rounded-lg transition-colors font-medium", filterChannel === ch ? "bg-primary text-white" : "bg-gray-100 text-text-secondary hover:bg-gray-200")}
            >
              {ch === "all" ? "ทั้งหมด" : ch === "line" ? "LINE" : ch === "email" ? "Email" : "SMS"}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filtered.map((tmpl) => {
            const triggerCfg = notificationTriggerLabels[tmpl.trigger];
            const isExpanded = expandedId === tmpl.id;
            return (
              <Card key={tmpl.id} className={cn("border shadow-sm transition-all", !tmpl.isActive && "opacity-50")}>
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ChannelBadge channel={tmpl.channel} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-text-primary text-sm truncate">{tmpl.name}</h4>
                        <p className="text-xs text-text-muted truncate">{tmpl.nameEn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary">
                        {triggerCfg.label}
                      </span>
                      <button onClick={() => toggleActive(tmpl.id)} className={cn("text-xs font-medium px-2.5 py-1 rounded-full transition-colors", tmpl.isActive ? "bg-success-light text-success" : "bg-gray-100 text-gray-500")}>
                        {tmpl.isActive ? "ใช้งาน" : "ปิด"}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : tmpl.id)} className="text-xs">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "edit", item: tmpl })} className="gap-1 text-xs">
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 bg-gray-50/50 space-y-3">
                      {tmpl.subject && (
                        <div>
                          <p className="text-[11px] font-semibold text-text-muted mb-1">Subject</p>
                          <p className="text-sm text-text-primary bg-white p-2 rounded-lg border border-border">{tmpl.subject}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] font-semibold text-text-muted mb-1">ข้อความภาษาไทย</p>
                          <pre className="text-xs text-text-primary bg-white p-3 rounded-lg border border-border whitespace-pre-wrap font-sans leading-relaxed">{tmpl.bodyTh}</pre>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-text-muted mb-1">English Message</p>
                          <pre className="text-xs text-text-primary bg-white p-3 rounded-lg border border-border whitespace-pre-wrap font-sans leading-relaxed">{tmpl.bodyEn}</pre>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-text-muted mb-1">ตัวแปรที่ใช้ได้</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tmpl.variables.map((v) => (
                            <span key={v} className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent-50 text-accent-600 border border-accent-100">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* ── Drawer ── */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "add" ? "เพิ่มเทมเพลตแจ้งเตือน" : "แก้ไขเทมเพลต"}
        subtitle={drawer?.mode === "edit" ? drawer.item?.name : "กำหนดข้อความแจ้งเตือนตาม event"}
        width="w-[600px]"
      >
        <NotificationTemplateForm initial={drawer?.item} onSave={() => setDrawer(null)} onCancel={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}

/* ── Form ── */
function NotificationTemplateForm({ initial, onSave, onCancel }: { initial?: NotificationTemplate; onSave: () => void; onCancel: () => void }) {
  const [channel, setChannel] = useState<NotificationChannel>(initial?.channel ?? "line");
  const [trigger, setTrigger] = useState<NotificationTrigger>(initial?.trigger ?? "booking-confirmed");

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อเทมเพลต (ไทย)" defaultValue={initial?.name} placeholder="เช่น แจ้งยืนยันจอง (LINE)" />
      <Input label="ชื่อเทมเพลต (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Booking Confirmed (LINE)" />

      {/* Channel */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">ช่องทาง</label>
        <div className="flex gap-2">
          {(["line", "email", "sms"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                channel === ch ? "border-primary bg-primary-50 text-primary" : "border-border bg-white text-text-secondary hover:border-primary/30"
              )}
            >
              {ch === "line" ? <MessageSquare size={16} /> : ch === "email" ? <Mail size={16} /> : <Smartphone size={16} />}
              {ch === "line" ? "LINE" : ch === "email" ? "Email" : "SMS"}
            </button>
          ))}
        </div>
      </div>

      {/* Trigger */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">Event ที่ trigger</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(notificationTriggerLabels) as [NotificationTrigger, { label: string }][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setTrigger(key)}
              className={cn(
                "px-2 py-2 rounded-lg border text-xs font-medium transition-all text-center",
                trigger === key ? "border-primary bg-primary-50 text-primary" : "border-border bg-white text-text-muted hover:border-primary/30"
              )}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {channel === "email" && (
        <Input label="Subject" defaultValue={initial?.subject ?? ""} placeholder="หัวข้ออีเมล" leftIcon={<Mail size={16} />} />
      )}

      <div>
        <label className="text-sm font-semibold text-text-primary mb-1 block">ข้อความภาษาไทย</label>
        <textarea
          className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-y"
          defaultValue={initial?.bodyTh}
          placeholder="ข้อความภาษาไทย — ใช้ {{variable}} สำหรับตัวแปร"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-text-primary mb-1 block">English Message</label>
        <textarea
          className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-y"
          defaultValue={initial?.bodyEn}
          placeholder="English message — use {{variable}} for placeholders"
        />
      </div>

      {/* Available variables hint */}
      <div className="bg-accent-50 rounded-xl p-3 border border-accent-100">
        <p className="text-[11px] font-semibold text-accent-600 mb-1.5 flex items-center gap-1"><Variable size={12} /> ตัวแปรที่ใช้ได้</p>
        <div className="flex flex-wrap gap-1.5">
          {["visitorName", "bookingCode", "date", "time", "location", "hostName", "approverName", "reason", "checkinTime", "checkoutTime", "zone", "contactNumber", "wifiSSID", "wifiUsername", "wifiPassword", "expiry"].map((v) => (
            <span key={v} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-accent-600 cursor-pointer hover:bg-accent-100 transition-colors">
              {`{{${v}}}`}
            </span>
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
