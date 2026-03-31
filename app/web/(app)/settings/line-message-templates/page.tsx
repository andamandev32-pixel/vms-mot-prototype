"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  MessageCircle, Users, Briefcase, ChevronDown, ChevronRight, Check,
  ToggleRight, ToggleLeft, GripVertical, Pencil, Plus, Trash2,
  Clock, Shield, Info, Smartphone, Zap, Mail, Key, Globe, Bell,
  Send, Wifi, Eye, EyeOff, Copy, CheckCircle, Save,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FlexMessagePreview from "@/components/web/FlexMessagePreview";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import {
  defaultFlexTemplates,
  type FlexTemplateConfig,
  type HeaderColor,
  type HeaderVariant,
  type ButtonVariant,
} from "@/lib/line-flex-template-data";

// ===== Main Page with 3 Tabs =====

type MainTab = "line-config" | "line-templates" | "email-config";

const mainTabs: { id: MainTab; label: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: "line-config", label: "ตั้งค่า LINE OA", labelEn: "LINE OA Config", icon: <MessageCircle size={16} /> },
  { id: "line-templates", label: "LINE Flex Message Templates", labelEn: "Message Templates", icon: <Bell size={16} /> },
  { id: "email-config", label: "ตั้งค่าอีเมลและแจ้งเตือน", labelEn: "Email & Notifications", icon: <Mail size={16} /> },
];

export default function LineMessageTemplatesPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("line-config");
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const [saved, setSaved] = useState(false);

  const schema = getSchemaByPageId("line-message-templates");
  const flowData = getFlowByPageId("line-message-templates");
  const apiDoc = getApiDocByPageId("line-message-templates");

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="min-h-screen bg-bg">
      {/* Modals */}
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}

      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06C755]/10 flex items-center justify-center">
                <MessageCircle size={20} className="text-[#06C755]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  การสื่อสารและแจ้งเตือน
                  {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
                  {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
                  {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
                </h1>
                <p className="text-xs text-text-secondary">Communication & Notification Settings — LINE OA, Flex Message Templates, Email System</p>
              </div>
            </div>
            <button onClick={handleSave}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all",
                saved ? "bg-[#06C755] text-white" : "bg-primary text-white hover:bg-primary-dark")}>
              {saved ? <><CheckCircle size={16} /> บันทึกแล้ว</> : <><Save size={16} /> บันทึก</>}
            </button>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-1 border-b border-border -mb-[1px]">
            {mainTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveMainTab(tab.id)}
                className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
                  activeMainTab === tab.id
                    ? "border-[#06C755] text-[#06C755] bg-[#06C755]/5"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:bg-gray-50")}>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {activeMainTab === "line-config" && <LineOaConfigTab />}
        {activeMainTab === "line-templates" && <LineFlexTemplatesTab />}
        {activeMainTab === "email-config" && <EmailConfigTab />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 1: LINE OA Config
// ════════════════════════════════════════════════════

function LineOaConfigTab() {
  const [channelId, setChannelId] = useState("1234567890");
  const [channelSecret, setChannelSecret] = useState("abc123secret");
  const [accessToken, setAccessToken] = useState("eyJhbGciOiJIUzI1NiJ9...");
  const [botBasicId, setBotBasicId] = useState("@evms-mots");
  const [liffAppId, setLiffAppId] = useState("1234567890-abcdefgh");
  const [liffEndpoint, setLiffEndpoint] = useState("https://vms.mots.go.th/liff");
  const [webhookUrl] = useState("https://vms.mots.go.th/api/line/webhook");
  const [webhookActive, setWebhookActive] = useState(true);
  const [richMenuVisitor, setRichMenuVisitor] = useState("richmenu-visitor-001");
  const [richMenuOfficer, setRichMenuOfficer] = useState("richmenu-officer-001");
  const [lineActive, setLineActive] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testUserId, setTestUserId] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const copyWebhook = () => { navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const sendTest = () => { setTestStatus("sending"); setTimeout(() => setTestStatus("success"), 1500); };

  return (
    <div className="space-y-6">
      <InfoBanner text="ตั้งค่าการเชื่อมต่อ LINE Messaging API, LIFF App, Webhook และ Rich Menu" sub="ข้อมูลได้จาก LINE Developers Console → Providers → Channel" />

      <div className="grid grid-cols-2 gap-6">
        {/* Messaging API */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <SectionHeader icon={<Key size={18} />} title="LINE Messaging API" color="text-[#06C755]" bg="bg-[#06C755]/10" />
            <Input label="Channel ID" value={channelId} onChange={(e) => setChannelId(e.target.value)} />
            <div className="relative">
              <Input label="Channel Secret" type={showSecret ? "text" : "password"} value={channelSecret} onChange={(e) => setChannelSecret(e.target.value)} />
              <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">Channel Access Token</label>
              <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                className={cn("w-full rounded-xl border border-border p-3 text-xs h-20 resize-none font-mono focus:outline-none focus:ring-2 focus:ring-[#06C755]/30", !showToken && "text-security-disc")}
              />
              <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input label="Bot Basic ID" value={botBasicId} onChange={(e) => setBotBasicId(e.target.value)} placeholder="@your-bot-id" />
          </CardContent>
        </Card>

        {/* LIFF + Webhook */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={<Smartphone size={18} />} title="LIFF Configuration" color="text-blue-600" bg="bg-blue-50" />
              <Input label="LIFF App ID" value={liffAppId} onChange={(e) => setLiffAppId(e.target.value)} />
              <Input label="LIFF Endpoint URL" value={liffEndpoint} onChange={(e) => setLiffEndpoint(e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={<Globe size={18} />} title="Webhook" color="text-purple-600" bg="bg-purple-50" />
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">Webhook URL</label>
                <div className="flex gap-2">
                  <input value={webhookUrl} readOnly className="flex-1 h-10 px-3 rounded-xl border border-border bg-gray-50 text-xs font-mono text-text-muted" />
                  <button onClick={copyWebhook} className={cn("h-10 px-3 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all",
                    copied ? "border-green-300 bg-green-50 text-green-600" : "border-border hover:bg-gray-50")}>
                    {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Webhook Active</span>
                <button onClick={() => setWebhookActive(!webhookActive)}>
                  {webhookActive ? <ToggleRight size={28} className="text-[#06C755]" /> : <ToggleLeft size={28} className="text-gray-400" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Rich Menu */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <SectionHeader icon={<MessageCircle size={18} />} title="Rich Menu" color="text-amber-600" bg="bg-amber-50" />
            <Input label="Rich Menu ID — Visitor" value={richMenuVisitor} onChange={(e) => setRichMenuVisitor(e.target.value)} />
            <Input label="Rich Menu ID — Officer" value={richMenuOfficer} onChange={(e) => setRichMenuOfficer(e.target.value)} />
          </CardContent>
        </Card>

        {/* Status & Test */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <SectionHeader icon={<Send size={18} />} title="สถานะและทดสอบ" color="text-emerald-600" bg="bg-emerald-50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">LINE OA Status</p>
                <p className="text-xs text-text-muted">{lineActive ? "ระบบ LINE OA เปิดใช้งาน" : "ปิดใช้งาน"}</p>
              </div>
              <button onClick={() => setLineActive(!lineActive)}>
                {lineActive ? <ToggleRight size={28} className="text-[#06C755]" /> : <ToggleLeft size={28} className="text-gray-400" />}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ทดสอบส่งข้อความ</label>
              <div className="flex gap-2">
                <Input placeholder="LINE User ID ปลายทาง" value={testUserId} onChange={(e) => setTestUserId(e.target.value)} className="flex-1" />
                <button onClick={sendTest} disabled={!testUserId || testStatus === "sending"}
                  className="h-10 px-4 rounded-xl bg-[#06C755] text-white text-xs font-bold hover:bg-[#05b34c] disabled:opacity-50 flex items-center gap-1">
                  {testStatus === "sending" ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  ทดสอบ
                </button>
              </div>
              {testStatus === "success" && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> ส่งข้อความทดสอบสำเร็จ</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 2: LINE Flex Message Templates
// ════════════════════════════════════════════════════

const headerColors: { value: HeaderColor; label: string; bg: string }[] = [
  { value: "primary", label: "Primary", bg: "bg-primary" },
  { value: "green", label: "Green", bg: "bg-[#06C755]" },
  { value: "orange", label: "Orange", bg: "bg-orange-500" },
  { value: "red", label: "Red", bg: "bg-red-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
];

const headerVariants: { value: HeaderVariant; label: string }[] = [
  { value: "standard", label: "Standard (eVMES Logo)" },
  { value: "reminder", label: "Reminder (Bell)" },
  { value: "checkin", label: "Check-in (UserCheck)" },
  { value: "wifi", label: "WiFi" },
  { value: "slip", label: "Slip (Shield)" },
  { value: "checkout", label: "Checkout (Check)" },
  { value: "auto-cancelled", label: "Auto-cancel (XCircle)" },
  { value: "officer-request", label: "Request (Calendar)" },
  { value: "officer-approved", label: "Approved" },
  { value: "officer-checkin", label: "Officer Checkin" },
  { value: "officer-overstay", label: "Overstay (Alert)" },
];

function LineFlexTemplatesTab() {
  const [templates, setTemplates] = useState<FlexTemplateConfig[]>(() => JSON.parse(JSON.stringify(defaultFlexTemplates)));
  const [activeTab, setActiveTab] = useState<"visitor" | "officer">("visitor");
  const [selectedStateId, setSelectedStateId] = useState<string>("visitor-registered");
  const [expandedSection, setExpandedSection] = useState<string | null>("header");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [approvalTimeout, setApprovalTimeout] = useState(24);
  const [autoCancelOnDate, setAutoCancelOnDate] = useState(true);

  const currentTemplate = templates.find(t => t.stateId === selectedStateId);
  const visitorTemplates = templates.filter(t => t.stateId.startsWith("visitor-") || t.stateId === "new-friend");
  const officerTemplates = templates.filter(t => t.stateId.startsWith("officer-"));
  const displayedTemplates = activeTab === "visitor" ? visitorTemplates : officerTemplates;
  const flexCount = templates.filter(t => t.type === "flex").length;
  const activeCount = templates.filter(t => t.isActive).length;

  const updateTemplate = (stateId: string, updater: (t: FlexTemplateConfig) => FlexTemplateConfig) => {
    setTemplates(prev => prev.map(t => t.stateId === stateId ? updater({ ...t }) : t));
  };

  return (
    <div className="space-y-6">
      <InfoBanner text="ตั้งค่ารูปแบบ Flex Message ที่ส่งผ่าน LINE OA ในแต่ละขั้นตอน" sub="แก้ไขข้อความ, ปุ่ม, สี header, QR Code, Info Box และดู Live Preview ได้ทันที" />

      {/* Approval Timeout */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0"><Clock size={20} className="text-orange-600" /></div>
            <div className="flex-1">
              <h3 className="font-bold text-text-primary">ระยะเวลารออนุมัติก่อนยกเลิกอัตโนมัติ</h3>
              <p className="text-xs text-text-secondary mt-0.5">Approval Timeout — นัดหมายที่รอการอนุมัติเกินเวลานี้จะถูกยกเลิกอัตโนมัติ</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <input type="number" value={approvalTimeout} onChange={(e) => setApprovalTimeout(Number(e.target.value))} min={1} max={168}
                    className="w-20 h-10 px-3 rounded-xl border border-border text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  <span className="text-sm text-text-secondary">ชั่วโมง</span>
                </div>
                <span className="text-xs text-text-muted">= {Math.floor(approvalTimeout / 24)} วัน {approvalTimeout % 24} ชม.</span>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <div onClick={() => setAutoCancelOnDate(!autoCancelOnDate)}
                  className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", autoCancelOnDate ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white")}>
                  {autoCancelOnDate && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm">ยกเลิกอัตโนมัติเมื่อวันนัดหมายผ่านไปแล้วด้วย</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Smartphone size={18} />} label="Flex Templates" value={`${flexCount}`} sub="แก้ไขได้" color="text-[#06C755]" bg="bg-[#06C755]/10" />
        <StatCard icon={<Users size={18} />} label="Visitor" value={`${visitorTemplates.filter(t => t.type === "flex").length}`} sub="templates" color="text-green-600" bg="bg-green-50" />
        <StatCard icon={<Briefcase size={18} />} label="Officer" value={`${officerTemplates.filter(t => t.type === "flex").length}`} sub="templates" color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={<Zap size={18} />} label="Active" value={`${activeCount}/${templates.length}`} sub="เปิดใช้งาน" color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* 2-column Editor */}
      <div className="grid grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          {/* Flow Tabs */}
          <div className="flex gap-2">
            <button onClick={() => { setActiveTab("visitor"); setSelectedStateId(visitorTemplates[0]?.stateId || ""); }}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === "visitor" ? "bg-[#06C755] text-white shadow-md" : "bg-white text-text-secondary border border-border")}>
              <Users size={14} /> Visitor Flow
            </button>
            <button onClick={() => { setActiveTab("officer"); setSelectedStateId(officerTemplates[0]?.stateId || ""); }}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === "officer" ? "bg-primary text-white shadow-md" : "bg-white text-text-secondary border border-border")}>
              <Briefcase size={14} /> Officer Flow
            </button>
          </div>

          {/* State List */}
          <Card>
            <div className="divide-y divide-border">
              {displayedTemplates.map((t, i) => (
                <button key={t.stateId} onClick={() => setSelectedStateId(t.stateId)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    selectedStateId === t.stateId ? "bg-[#06C755]/5 border-l-4 border-l-[#06C755]" : "hover:bg-gray-50 border-l-4 border-l-transparent")}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    selectedStateId === t.stateId ? "bg-[#06C755] text-white" : "bg-gray-200 text-gray-500")}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", selectedStateId === t.stateId ? "text-[#06C755]" : "text-text-primary")}>{t.name}</p>
                    <p className="text-[10px] text-text-muted truncate">{t.nameEn}</p>
                  </div>
                  {t.type === "liff" && <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] font-bold rounded-full">LIFF</span>}
                  {t.type === "text" && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded-full">Text</span>}
                  {t.type === "flex" && <span className={cn("w-2 h-2 rounded-full", t.isActive ? "bg-[#06C755]" : "bg-gray-300")} />}
                </button>
              ))}
            </div>
          </Card>

          {/* Section Editor */}
          {currentTemplate && currentTemplate.type === "flex" && (
            <Card>
              <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-bold">{currentTemplate.name}</h3>
                <button onClick={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, isActive: !t.isActive }))} className="flex items-center gap-1 text-xs font-medium">
                  {currentTemplate.isActive ? <ToggleRight size={18} className="text-[#06C755]" /> : <ToggleLeft size={18} className="text-gray-400" />}
                  <span className={currentTemplate.isActive ? "text-[#06C755]" : "text-gray-400"}>{currentTemplate.isActive ? "Active" : "Off"}</span>
                </button>
              </div>

              <EditorSection title="Header" id="header" expanded={expandedSection === "header"} onToggle={setExpandedSection}>
                <div className="space-y-3">
                  <InputField label="Title" value={currentTemplate.headerTitle} onChange={(v) => updateTemplate(currentTemplate.stateId, t => ({ ...t, headerTitle: v }))} />
                  <InputField label="Subtitle" value={currentTemplate.headerSubtitle || ""} onChange={(v) => updateTemplate(currentTemplate.stateId, t => ({ ...t, headerSubtitle: v || undefined }))} placeholder="(optional)" />
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">Color</label>
                    <div className="flex gap-2">
                      {headerColors.map(c => (
                        <button key={c.value} onClick={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, headerColor: c.value }))}
                          className={cn("w-8 h-8 rounded-lg border-2", c.bg,
                            currentTemplate.headerColor === c.value ? "border-gray-900 scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100")} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">Style</label>
                    <select value={currentTemplate.headerVariant} onChange={(e) => updateTemplate(currentTemplate.stateId, t => ({ ...t, headerVariant: e.target.value as HeaderVariant }))}
                      className="w-full h-9 px-3 rounded-lg border border-border text-sm">
                      {headerVariants.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
              </EditorSection>

              <EditorSection title="Status Badge" id="badge" expanded={expandedSection === "badge"} onToggle={setExpandedSection}
                enabled={currentTemplate.showStatusBadge} onEnableToggle={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, showStatusBadge: !t.showStatusBadge }))}>
                <div className="space-y-2">
                  <InputField label="Badge Text" value={currentTemplate.statusBadgeText || ""} onChange={(v) => updateTemplate(currentTemplate.stateId, t => ({ ...t, statusBadgeText: v }))} />
                  <div><label className="text-xs font-medium text-text-secondary mb-1 block">Type</label>
                    <select value={currentTemplate.statusBadgeType || "pending"} onChange={(e) => updateTemplate(currentTemplate.stateId, t => ({ ...t, statusBadgeType: e.target.value as any }))}
                      className="w-full h-9 px-3 rounded-lg border border-border text-sm">
                      {["pending","approved","rejected","checked-in","checked-out"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select></div>
                </div>
              </EditorSection>

              <EditorSection title={`Body Rows (${currentTemplate.rows.filter(r => r.enabled).length}/${currentTemplate.rows.length})`} id="rows" expanded={expandedSection === "rows"} onToggle={setExpandedSection}>
                <div className="space-y-1.5">
                  {currentTemplate.rows.sort((a, b) => a.sortOrder - b.sortOrder).map((row) => (
                    <div key={row.id} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg", row.enabled ? "bg-white" : "bg-gray-50 opacity-50")}>
                      <GripVertical size={12} className="text-gray-300 shrink-0" />
                      <button onClick={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, rows: t.rows.map(r => r.id === row.id ? { ...r, enabled: !r.enabled } : r) }))}>
                        {row.enabled ? <Check size={14} className="text-[#06C755]" /> : <div className="w-3.5 h-3.5 rounded border border-gray-300" />}
                      </button>
                      {editingField === row.id ? (
                        <input type="text" value={row.label} autoFocus
                          onChange={(e) => updateTemplate(currentTemplate.stateId, t => ({ ...t, rows: t.rows.map(r => r.id === row.id ? { ...r, label: e.target.value } : r) }))}
                          onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                          className="flex-1 h-7 px-2 rounded border border-[#06C755] text-xs bg-[#06C755]/5 focus:outline-none" />
                      ) : (
                        <span className="flex-1 text-xs">{row.label}</span>
                      )}
                      <code className="text-[9px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded shrink-0">{`{{${row.variable}}}`}</code>
                      <button onClick={() => setEditingField(row.id)} className="p-0.5 hover:bg-gray-100 rounded"><Pencil size={11} className="text-gray-400" /></button>
                    </div>
                  ))}
                </div>
              </EditorSection>

              <EditorSection title="Info Box" id="infobox" expanded={expandedSection === "infobox"} onToggle={setExpandedSection}
                enabled={currentTemplate.infoBox?.enabled}
                onEnableToggle={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, infoBox: t.infoBox ? { ...t.infoBox, enabled: !t.infoBox.enabled } : { text: "", color: "blue", enabled: true } }))}>
                {currentTemplate.infoBox && (
                  <div className="space-y-2">
                    <textarea value={currentTemplate.infoBox.text} onChange={(e) => updateTemplate(currentTemplate.stateId, t => ({ ...t, infoBox: t.infoBox ? { ...t.infoBox, text: e.target.value } : undefined }))}
                      className="w-full rounded-lg border border-border p-2 text-xs h-16 resize-none focus:outline-none focus:ring-2 focus:ring-[#06C755]/30" />
                    <div className="flex gap-1.5">
                      {(["green","orange","blue","red","gray"] as const).map(c => (
                        <button key={c} onClick={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, infoBox: t.infoBox ? { ...t.infoBox, color: c } : undefined }))}
                          className={cn("px-3 py-1 rounded-lg text-[10px] font-bold border",
                            currentTemplate.infoBox?.color === c ? "border-gray-900 shadow-sm" : "border-transparent opacity-60",
                            c === "green" && "bg-green-100 text-green-700", c === "orange" && "bg-orange-100 text-orange-700",
                            c === "blue" && "bg-blue-100 text-blue-700", c === "red" && "bg-red-100 text-red-700", c === "gray" && "bg-gray-100 text-gray-700")}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}
              </EditorSection>

              <EditorSection title="QR Code" id="qr" expanded={expandedSection === "qr"} onToggle={setExpandedSection}
                enabled={currentTemplate.showQrCode} onEnableToggle={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, showQrCode: !t.showQrCode }))}>
                <InputField label="QR Label" value={currentTemplate.qrLabel || ""} onChange={(v) => updateTemplate(currentTemplate.stateId, t => ({ ...t, qrLabel: v }))} placeholder="QR Check-in" />
              </EditorSection>

              <EditorSection title={`Buttons (${currentTemplate.buttons.filter(b => b.enabled).length}/${currentTemplate.buttons.length})`} id="buttons" expanded={expandedSection === "buttons"} onToggle={setExpandedSection}>
                <div className="space-y-1.5">
                  {currentTemplate.buttons.sort((a, b) => a.sortOrder - b.sortOrder).map((btn) => (
                    <div key={btn.id} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg", btn.enabled ? "bg-white" : "bg-gray-50 opacity-50")}>
                      <GripVertical size={12} className="text-gray-300 shrink-0" />
                      <button onClick={() => updateTemplate(currentTemplate.stateId, t => ({ ...t, buttons: t.buttons.map(b => b.id === btn.id ? { ...b, enabled: !b.enabled } : b) }))}>
                        {btn.enabled ? <Check size={14} className="text-[#06C755]" /> : <div className="w-3.5 h-3.5 rounded border border-gray-300" />}
                      </button>
                      {editingField === btn.id ? (
                        <input type="text" value={btn.label} autoFocus
                          onChange={(e) => updateTemplate(currentTemplate.stateId, t => ({ ...t, buttons: t.buttons.map(b => b.id === btn.id ? { ...b, label: e.target.value } : b) }))}
                          onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                          className="flex-1 h-7 px-2 rounded border border-[#06C755] text-xs bg-[#06C755]/5 focus:outline-none" />
                      ) : (
                        <span className="flex-1 text-xs">{btn.label}</span>
                      )}
                      <select value={btn.variant} onChange={(e) => updateTemplate(currentTemplate.stateId, t => ({ ...t, buttons: t.buttons.map(b => b.id === btn.id ? { ...b, variant: e.target.value as ButtonVariant } : b) }))}
                        className="text-[10px] h-7 px-1.5 rounded border border-border bg-gray-50">
                        <option value="green">Green</option><option value="primary">Primary</option><option value="outline">Outline</option><option value="red">Red</option>
                      </select>
                      <button onClick={() => setEditingField(btn.id)} className="p-0.5 hover:bg-gray-100 rounded"><Pencil size={11} className="text-gray-400" /></button>
                    </div>
                  ))}
                </div>
              </EditorSection>

              <div className="px-4 py-3 bg-gray-50 border-t border-border">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Available Variables</p>
                <div className="flex flex-wrap gap-1">
                  {currentTemplate.availableVariables.map(v => (
                    <code key={v} className="text-[9px] font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {currentTemplate && currentTemplate.type !== "flex" && (
            <Card><CardContent className="p-6 text-center">
              <span className="text-2xl mb-2 block">{currentTemplate.type === "liff" ? "📱" : "💬"}</span>
              <h3 className="font-bold">{currentTemplate.name}</h3>
              <p className="text-xs text-text-muted mt-1">{currentTemplate.type === "liff" ? "State นี้เปิด LIFF App — ไม่มี Flex Message" : "ส่งข้อความ Text ธรรมดา"}</p>
            </CardContent></Card>
          )}
        </div>

        {/* Live Preview */}
        <div className="sticky top-40 self-start">
          <Card className="overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2"><MessageCircle size={14} className="text-[#06C755]" /><span className="text-xs font-bold text-white">Live Preview</span></div>
              <span className="text-[9px] text-gray-500 font-mono">{selectedStateId}</span>
            </div>
            {currentTemplate && <FlexMessagePreview template={currentTemplate} />}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 3: Email Config & Templates
// ════════════════════════════════════════════════════

function EmailConfigTab() {
  const [smtpHost, setSmtpHost] = useState("smtp.mots.go.th");
  const [smtpPort, setSmtpPort] = useState(587);
  const [encryption, setEncryption] = useState<"ssl" | "tls" | "none">("tls");
  const [smtpUser, setSmtpUser] = useState("vms@mots.go.th");
  const [smtpPass, setSmtpPass] = useState("••••••••");
  const [fromEmail, setFromEmail] = useState("vms-noreply@mots.go.th");
  const [fromName, setFromName] = useState("eVMES MOT");
  const [replyTo, setReplyTo] = useState("");
  const [emailActive, setEmailActive] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  // Email templates (editable)
  const [emailTemplates, setEmailTemplates] = useState([
    { id: 1, trigger: "booking-confirmed", name: "ยืนยันการจอง", channel: "email", isActive: true, subject: "ยืนยันการจองเข้าพื้นที่ — {{bookingCode}}", bodyTh: "เรียน คุณ{{visitorName}}\nการจอง {{bookingCode}} ได้รับการยืนยัน...", variables: ["visitorName", "bookingCode", "date", "time", "location", "hostName"] },
    { id: 2, trigger: "booking-approved", name: "อนุมัติแล้ว", channel: "email", isActive: true, subject: "คำขอเข้าพื้นที่ {{bookingCode}} อนุมัติแล้ว", bodyTh: "เรียน คุณ{{visitorName}}\nคำขอ {{bookingCode}} อนุมัติแล้ว...", variables: ["visitorName", "bookingCode", "approverName", "date"] },
    { id: 3, trigger: "booking-rejected", name: "ไม่อนุมัติ", channel: "email", isActive: true, subject: "คำขอเข้าพื้นที่ {{bookingCode}} ไม่อนุมัติ", bodyTh: "เรียน คุณ{{visitorName}}\nคำขอ {{bookingCode}} ไม่อนุมัติ...", variables: ["visitorName", "bookingCode", "reason"] },
    { id: 4, trigger: "booking-auto-cancelled", name: "ยกเลิกอัตโนมัติ", channel: "email", isActive: true, subject: "นัดหมาย {{bookingCode}} ถูกยกเลิกอัตโนมัติ", bodyTh: "เรียน คุณ{{visitorName}}\nนัดหมาย {{bookingCode}} ถูกยกเลิกเนื่องจากไม่ได้รับการอนุมัติภายในเวลาที่กำหนด...", variables: ["visitorName", "bookingCode", "timeoutHours"] },
    { id: 5, trigger: "reminder-1day", name: "เตือนล่วงหน้า 1 วัน", channel: "email", isActive: true, subject: "เตือน: พรุ่งนี้มีนัดหมาย {{bookingCode}}", bodyTh: "เรียน คุณ{{visitorName}}\nพรุ่งนี้คุณมีนัดหมาย...", variables: ["visitorName", "bookingCode", "date", "time", "location"] },
    { id: 6, trigger: "checkin-welcome", name: "ต้อนรับ Check-in", channel: "email", isActive: false, subject: "ยินดีต้อนรับ — Check-in สำเร็จ", bodyTh: "เรียน คุณ{{visitorName}}\nเข้าพื้นที่สำเร็จ...", variables: ["visitorName", "checkinTime", "zone"] },
    { id: 7, trigger: "wifi-credentials", name: "ข้อมูล WiFi", channel: "email", isActive: false, subject: "ข้อมูล WiFi สำหรับผู้เยี่ยม", bodyTh: "SSID: {{wifiSSID}}\nPassword: {{wifiPassword}}...", variables: ["wifiSSID", "wifiPassword", "expiry"] },
  ]);

  const [selectedEmailId, setSelectedEmailId] = useState(1);
  const selectedEmail = emailTemplates.find(t => t.id === selectedEmailId);

  const sendTest = () => { setTestStatus("sending"); setTimeout(() => setTestStatus("success"), 1500); };

  return (
    <div className="space-y-6">
      <InfoBanner text="ตั้งค่า SMTP Server, ข้อมูลผู้ส่ง และเทมเพลตอีเมลแจ้งเตือน" sub="ระบบส่งอีเมลอัตโนมัติเมื่อเกิด event ต่างๆ เช่น ยืนยันจอง, อนุมัติ, เตือน" />

      <div className="grid grid-cols-2 gap-6">
        {/* SMTP */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <SectionHeader icon={<Mail size={18} />} title="SMTP Server" color="text-blue-600" bg="bg-blue-50" />
            <Input label="SMTP Host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Port" type="number" value={String(smtpPort)} onChange={(e) => setSmtpPort(Number(e.target.value))} />
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">Encryption</label>
                <div className="flex gap-1">
                  {(["ssl", "tls", "none"] as const).map(e => (
                    <button key={e} onClick={() => setEncryption(e)}
                      className={cn("flex-1 h-10 rounded-lg text-xs font-bold border transition-all",
                        encryption === e ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-white border-border text-text-muted hover:bg-gray-50")}>
                      {e.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Input label="Username" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
            <div className="relative">
              <Input label="Password" type={showPass ? "text" : "password"} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sender + Test */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={<Send size={18} />} title="ข้อมูลผู้ส่ง (Sender)" color="text-purple-600" bg="bg-purple-50" />
              <Input label="From Email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              <Input label="From Display Name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              <Input label="Reply-To Email (ถ้ามี)" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="optional" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-4">
              <SectionHeader icon={<Wifi size={18} />} title="สถานะและทดสอบ" color="text-emerald-600" bg="bg-emerald-50" />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold">Email System</p><p className="text-xs text-text-muted">{emailActive ? "เปิดใช้งาน" : "ปิด"}</p></div>
                <button onClick={() => setEmailActive(!emailActive)}>{emailActive ? <ToggleRight size={28} className="text-[#06C755]" /> : <ToggleLeft size={28} className="text-gray-400" />}</button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="email@test.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1" />
                <button onClick={sendTest} disabled={!testEmail || testStatus === "sending"}
                  className="h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                  {testStatus === "sending" ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} ทดสอบ
                </button>
              </div>
              {testStatus === "success" && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> ส่งอีเมลทดสอบสำเร็จ</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Templates */}
      <h3 className="text-base font-bold text-text-primary mt-6">เทมเพลตอีเมลแจ้งเตือน (Email Notification Templates)</h3>
      <div className="grid grid-cols-[1fr_400px] gap-6">
        <Card>
          <div className="divide-y divide-border">
            {emailTemplates.map(t => (
              <button key={t.id} onClick={() => setSelectedEmailId(t.id)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  selectedEmailId === t.id ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50 border-l-4 border-l-transparent")}>
                <Mail size={16} className={selectedEmailId === t.id ? "text-blue-600" : "text-gray-400"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{t.trigger}</p>
                </div>
                <span className={cn("w-2 h-2 rounded-full", t.isActive ? "bg-[#06C755]" : "bg-gray-300")} />
              </button>
            ))}
          </div>
        </Card>

        {selectedEmail && (
          <Card>
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-blue-700">{selectedEmail.name}</h4>
                <p className="text-[10px] text-blue-500">trigger: {selectedEmail.trigger}</p>
              </div>
              <button onClick={() => setEmailTemplates(prev => prev.map(t => t.id === selectedEmail.id ? { ...t, isActive: !t.isActive } : t))}>
                {selectedEmail.isActive ? <ToggleRight size={22} className="text-[#06C755]" /> : <ToggleLeft size={22} className="text-gray-400" />}
              </button>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Subject</label>
                <input value={selectedEmail.subject}
                  onChange={(e) => setEmailTemplates(prev => prev.map(t => t.id === selectedEmail.id ? { ...t, subject: e.target.value } : t))}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Body (Thai)</label>
                <textarea value={selectedEmail.bodyTh}
                  onChange={(e) => setEmailTemplates(prev => prev.map(t => t.id === selectedEmail.id ? { ...t, bodyTh: e.target.value } : t))}
                  className="w-full rounded-lg border border-border p-3 text-xs h-32 resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Variables (คลิกเพื่อแทรก)</p>
                <div className="flex flex-wrap gap-1">
                  {selectedEmail.variables.map(v => (
                    <button key={v} onClick={() => {
                      setEmailTemplates(prev => prev.map(t => t.id === selectedEmail.id ? { ...t, bodyTh: t.bodyTh + `{{${v}}}` } : t));
                    }}
                      className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer">{`{{${v}}}`}</button>
                  ))}
                </div>
              </div>
              {/* Email Preview */}
              <div className="border-t border-border pt-3">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Preview</p>
                <div className="bg-white border border-border rounded-lg p-4 shadow-inner">
                  <div className="border-b border-gray-200 pb-2 mb-2">
                    <p className="text-[10px] text-text-muted">From: {fromName} &lt;{fromEmail}&gt;</p>
                    <p className="text-[10px] text-text-muted">To: visitor@example.com</p>
                    <p className="text-xs font-bold text-text-primary mt-1">{selectedEmail.subject.replace(/\{\{(\w+)\}\}/g, (_, v) => {
                      const map: Record<string, string> = { bookingCode: "eVMS-20260402-1042", visitorName: "พุทธิพงษ์ คาดสนิท" };
                      return map[v] || `[${v}]`;
                    })}</p>
                  </div>
                  <p className="text-xs text-text-primary whitespace-pre-line leading-relaxed">{selectedEmail.bodyTh.replace(/\{\{(\w+)\}\}/g, (_, v) => {
                    const map: Record<string, string> = {
                      visitorName: "พุทธิพงษ์ คาดสนิท", bookingCode: "eVMS-20260402-1042", date: "2 เม.ย. 2569",
                      time: "10:00 - 11:00", location: "อาคาร C ชั้น 4", hostName: "สมชาย รักชาติ",
                      approverName: "สมศรี รักษ์ดี", reason: "-", timeoutHours: "24",
                      checkinTime: "09:45", zone: "ชั้น 4", wifiSSID: "MOTS-Guest", wifiPassword: "mots2026", expiry: "16:30",
                    };
                    return map[v] || `[${v}]`;
                  })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════

function InfoBanner({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="bg-[#06C755]/5 border border-[#06C755]/20 rounded-xl p-4 flex items-start gap-3">
      <Info size={18} className="text-[#06C755] shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-text-primary font-medium">{text}</p>
        <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, color, bg }: { icon: React.ReactNode; title: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg, color)}>{icon}</div>
      <h3 className="font-bold text-text-primary">{title}</h3>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg, color)}>{icon}</div>
        <div><p className="text-xl font-extrabold text-text-primary">{value}</p><p className="text-[10px] text-text-muted">{label} — {sub}</p></div>
      </div>
    </Card>
  );
}

function EditorSection({ title, id, expanded, onToggle, children, enabled, onEnableToggle }: {
  title: string; id: string; expanded: boolean; onToggle: (id: string) => void; children: React.ReactNode; enabled?: boolean; onEnableToggle?: () => void;
}) {
  return (
    <div className="border-b border-border">
      <button onClick={() => onToggle(expanded ? "" : id)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
        {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        {onEnableToggle && (
          <span onClick={(e) => { e.stopPropagation(); onEnableToggle(); }} className="shrink-0">
            {enabled ? <ToggleRight size={16} className="text-[#06C755]" /> : <ToggleLeft size={16} className="text-gray-400" />}
          </span>
        )}
        <span className={cn("text-sm font-medium", expanded ? "text-text-primary" : "text-text-secondary")}>{title}</span>
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-secondary mb-1 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]/30 focus:border-[#06C755]" />
    </div>
  );
}
