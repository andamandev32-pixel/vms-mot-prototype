"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  Shield, Save, Eye, Globe, RotateCcw, List, FileEdit, ScrollText,
  CheckCircle2, XCircle, ChevronDown, Search, Clock, Monitor, Smartphone, User,
} from "lucide-react";
import {
  pdpaVersions as initialVersions,
  pdpaConsentLogs,
  type PdpaVersion,
  type PdpaConsentLog,
} from "@/lib/mock-data";

type TabId = "versions" | "editor" | "logs";

// ── Tab 1: Version List ───────────────────────────────────────────────
function VersionListTab({
  versions,
  onActivate,
  onEdit,
}: {
  versions: PdpaVersion[];
  onActivate: (id: number) => void;
  onEdit: (v: PdpaVersion) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">ทั้งหมด {versions.length} เวอร์ชัน</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-text-muted">
              <th className="px-4 py-3 font-medium">เวอร์ชัน</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">วันมีผล</th>
              <th className="px-4 py-3 font-medium">Retention</th>
              <th className="px-4 py-3 font-medium">ต้องเลื่อนอ่าน</th>
              <th className="px-4 py-3 font-medium">แก้ไขโดย</th>
              <th className="px-4 py-3 font-medium">หมายเหตุ</th>
              <th className="px-4 py-3 font-medium">สร้างเมื่อ</th>
              <th className="px-4 py-3 font-medium text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...versions].reverse().map((v) => (
              <tr key={v.id} className={cn("transition-colors", v.isActive ? "bg-green-50/60" : "hover:bg-surface/60")}>
                <td className="px-4 py-3 font-bold text-text-primary">v{v.version}</td>
                <td className="px-4 py-3">
                  {v.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                      <CheckCircle2 size={12} /> ใช้งานอยู่
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                      ไม่ได้ใช้งาน
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{v.effectiveDate}</td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{v.retentionDays} วัน</td>
                <td className="px-4 py-3 text-center">
                  {v.requireScroll ? (
                    <CheckCircle2 size={16} className="text-success mx-auto" />
                  ) : (
                    <XCircle size={16} className="text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{v.changedByName ?? "ระบบ"}</td>
                <td className="px-4 py-3 text-text-muted text-xs max-w-[200px] truncate">{v.changeNote}</td>
                <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{v.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(v)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface transition-colors"
                    >
                      ดู/แก้ไข
                    </button>
                    {!v.isActive && (
                      <button
                        onClick={() => onActivate(v.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
                      >
                        เปิดใช้งาน
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 2: Editor ─────────────────────────────────────────────────────
function EditorTab({
  editingVersion,
  onSaveNewVersion,
}: {
  editingVersion: PdpaVersion | null;
  onSaveNewVersion: (data: {
    textTh: string;
    textEn: string;
    retentionDays: number;
    requireScroll: boolean;
    changeNote: string;
  }) => void;
}) {
  const [activeLang, setActiveLang] = useState<"th" | "en">("th");
  const [textTh, setTextTh] = useState(editingVersion?.textTh ?? "");
  const [textEn, setTextEn] = useState(editingVersion?.textEn ?? "");
  const [retentionDays, setRetentionDays] = useState(String(editingVersion?.retentionDays ?? 90));
  const [requireScroll, setRequireScroll] = useState(editingVersion?.requireScroll ?? true);
  const [changeNote, setChangeNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentText = activeLang === "th" ? textTh : textEn;
  const setCurrentText = activeLang === "th" ? setTextTh : setTextEn;

  const handleSave = () => {
    onSaveNewVersion({
      textTh,
      textEn,
      retentionDays: Number(retentionDays) || 90,
      requireScroll,
      changeNote: changeNote || "แก้ไขข้อความ PDPA",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">
          {editingVersion
            ? `กำลังแก้ไขจาก v${editingVersion.version} — บันทึกจะสร้างเวอร์ชันใหม่`
            : "สร้างเวอร์ชันใหม่ (บนพื้นฐานเวอร์ชันปัจจุบัน)"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              preview ? "bg-primary-50 border-primary-200 text-primary-700" : "border-border text-text-secondary hover:bg-surface"
            )}
          >
            <Eye size={16} />
            {preview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              saved ? "bg-success text-white" : "bg-primary-600 text-white hover:bg-primary-700"
            )}
          >
            <Save size={16} />
            {saved ? "บันทึกแล้ว ✓" : "บันทึกเวอร์ชันใหม่"}
          </button>
        </div>
      </div>

      <div className={cn("grid gap-6", preview ? "grid-cols-2" : "grid-cols-1")}>
        {/* Editor card */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="flex border-b border-border">
                {(["th", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeLang === lang
                        ? "border-primary-600 text-primary-700 bg-primary-50/50"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    )}
                  >
                    <Globe size={14} />
                    {lang === "th" ? "ภาษาไทย (TH)" : "English (EN)"}
                  </button>
                ))}
              </div>
              <div className="p-4">
                <textarea
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  className="w-full h-[400px] p-4 rounded-lg border border-border bg-surface text-sm text-text-primary leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 font-sans"
                  placeholder={activeLang === "th" ? "ใส่ข้อความ PDPA ภาษาไทย..." : "Enter PDPA text in English..."}
                />
                <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                  <span>{currentText.length} ตัวอักษร</span>
                  <span>{activeLang === "th" ? "ภาษาไทย" : "English"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-text-primary">ตั้งค่าเพิ่มเติม</h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">ต้องเลื่อนอ่านก่อนยอมรับ</p>
                  <p className="text-xs text-text-muted">ผู้ใช้ต้องเลื่อนอ่านข้อความถึงด้านล่างก่อน checkbox จึงจะเปิดให้กด</p>
                </div>
                <button
                  onClick={() => setRequireScroll(!requireScroll)}
                  className={cn(
                    "w-12 h-7 rounded-full flex items-center px-1 transition-colors",
                    requireScroll ? "bg-primary-600 justify-end" : "bg-gray-300 justify-start"
                  )}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">ระยะเวลาเก็บข้อมูล (วัน)</p>
                  <p className="text-xs text-text-muted">กำหนดระยะเวลาในการจัดเก็บข้อมูลผู้มาติดต่อ</p>
                </div>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-300"
                  min="1"
                  max="365"
                />
              </div>

              {/* Change note */}
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">หมายเหตุการเปลี่ยนแปลง</p>
                <input
                  type="text"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="เช่น เพิ่มหมวดการเปิดเผยข้อมูล"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {preview && (
          <Card className="h-fit sticky top-6">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Eye size={16} className="text-primary-600" />
                ตัวอย่างบน Kiosk
              </div>
              <div className="rounded-xl border-2 border-border bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <Shield size={14} className="text-[#1B2B5E]" />
                  <span className="text-[11px] font-bold text-[#1B2B5E]">
                    {activeLang === "th" ? "นโยบายคุ้มครองข้อมูลส่วนบุคคล" : "Privacy Policy (PDPA)"}
                  </span>
                </div>
                <div className="p-3 h-[300px] overflow-y-auto">
                  <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {currentText}
                  </p>
                </div>
                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-[#C8A84E] bg-[#C8A84E] flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                    <span className="text-[9px] text-gray-600">
                      {activeLang === "th" ? "ข้าพเจ้ายอมรับนโยบาย..." : "I accept the policy..."}
                    </span>
                  </div>
                  <div className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#C8A84E] to-[#B8960B] text-center text-[10px] font-bold text-white">
                    {activeLang === "th" ? "ยอมรับและดำเนินการต่อ" : "Accept & Continue"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Consent Logs ───────────────────────────────────────────────
const channelConfig: Record<PdpaConsentLog["consentChannel"], { label: string; icon: typeof Monitor }> = {
  kiosk: { label: "Kiosk", icon: Monitor },
  line: { label: "LINE", icon: Smartphone },
  counter: { label: "Counter", icon: User },
  web: { label: "Web", icon: Globe },
};

function ConsentLogsTab({ logs }: { logs: PdpaConsentLog[] }) {
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterVersion, setFilterVersion] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  const filtered = logs.filter((log) => {
    if (filterChannel !== "all" && log.consentChannel !== filterChannel) return false;
    if (filterVersion !== "all" && String(log.configVersion) !== filterVersion) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        log.visitorName.toLowerCase().includes(q) ||
        log.visitorIdCard.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueVersions = [...new Set(logs.map((l) => l.configVersion))].sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาชื่อ / เลขบัตร..."
            className="pl-9 pr-3 py-2 rounded-lg border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="all">ทุกช่องทาง</option>
            <option value="kiosk">Kiosk</option>
            <option value="line">LINE</option>
            <option value="counter">Counter</option>
            <option value="web">Web</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterVersion}
            onChange={(e) => setFilterVersion(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="all">ทุกเวอร์ชัน</option>
            {uniqueVersions.map((v) => (
              <option key={v} value={String(v)}>v{v}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        <span className="text-sm text-text-muted ml-auto">แสดง {filtered.length} / {logs.length} รายการ</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-text-muted">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">ชื่อผู้เยี่ยม</th>
              <th className="px-4 py-3 font-medium">เลขบัตร</th>
              <th className="px-4 py-3 font-medium">เวอร์ชัน</th>
              <th className="px-4 py-3 font-medium">ช่องทาง</th>
              <th className="px-4 py-3 font-medium">อุปกรณ์</th>
              <th className="px-4 py-3 font-medium">วันที่ยินยอม</th>
              <th className="px-4 py-3 font-medium">หมดอายุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">ไม่พบข้อมูล</td>
              </tr>
            ) : (
              filtered.map((log) => {
                const ch = channelConfig[log.consentChannel];
                const Icon = ch.icon;
                const isExpired = new Date(log.expiresAt) < new Date();
                return (
                  <tr key={log.id} className="hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-3 text-text-muted">{log.id}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{log.visitorName}</td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{log.visitorIdCard}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                        v{log.configVersion}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-text-secondary">
                        <Icon size={14} />
                        {ch.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{log.deviceId ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">{log.consentedAt}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={isExpired ? "text-error font-semibold" : "text-text-secondary"}>
                        {log.expiresAt}
                        {isExpired && " (หมดอายุ)"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function PdpaConsentSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("pdpa-consent")!;
  const flowData = getFlowByPageId("pdpa-consent")!;

  const [activeTab, setActiveTab] = useState<TabId>("versions");
  const [versions, setVersions] = useState<PdpaVersion[]>(initialVersions);
  const [editingVersion, setEditingVersion] = useState<PdpaVersion | null>(null);

  // Activate a version (deactivate all others)
  const handleActivate = (id: number) => {
    setVersions((prev) =>
      prev.map((v) => ({ ...v, isActive: v.id === id }))
    );
  };

  // Open editor with a specific version
  const handleEdit = (v: PdpaVersion) => {
    setEditingVersion(v);
    setActiveTab("editor");
  };

  // Save creates a new version
  const handleSaveNewVersion = (data: {
    textTh: string;
    textEn: string;
    retentionDays: number;
    requireScroll: boolean;
    changeNote: string;
  }) => {
    const maxVersion = Math.max(...versions.map((v) => v.version));
    const newVersion: PdpaVersion = {
      id: Math.max(...versions.map((v) => v.id)) + 1,
      configId: 1,
      version: maxVersion + 1,
      textTh: data.textTh,
      textEn: data.textEn,
      retentionDays: data.retentionDays,
      requireScroll: data.requireScroll,
      isActive: false,
      effectiveDate: new Date().toISOString().split("T")[0],
      changedBy: 1,
      changedByName: "สมชาย วิชาญ",
      changeNote: data.changeNote,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    setVersions((prev) => [...prev, newVersion]);
    setEditingVersion(newVersion);
  };

  const activeVersion = versions.find((v) => v.isActive);

  const tabs: { id: TabId; label: string; icon: typeof List }[] = [
    { id: "versions", label: "รายการเวอร์ชัน", icon: List },
    { id: "editor", label: "แก้ไขข้อความ", icon: FileEdit },
    { id: "logs", label: "ประวัติการยินยอม", icon: ScrollText },
  ];

  return (
    <div>
      <Topbar title="PDPA / นโยบายคุ้มครองข้อมูลส่วนบุคคล" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Shield size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                จัดการ PDPA — เวอร์ชัน & ประวัติการยินยอม
                <DbSchemaButton onClick={() => setShowSchema(true)} />
                <FlowRulesButton onClick={() => setShowFlow(true)} />
              </h2>
              <p className="text-sm text-text-muted">
                จัดการเวอร์ชันข้อความ PDPA, เปิด/ปิดใช้งาน, และดูประวัติการยินยอมของผู้เยี่ยม
              </p>
            </div>
          </div>

          {/* Active version badge */}
          {activeVersion && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle2 size={16} className="text-success" />
              <div className="text-sm">
                <span className="text-text-muted">เวอร์ชันที่ใช้งาน: </span>
                <span className="font-bold text-success">v{activeVersion.version}</span>
                <span className="text-text-muted ml-2">({activeVersion.retentionDays} วัน)</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-700 bg-primary-50/50"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab contents */}
        {activeTab === "versions" && (
          <VersionListTab
            versions={versions}
            onActivate={handleActivate}
            onEdit={handleEdit}
          />
        )}
        {activeTab === "editor" && (
          <EditorTab
            key={editingVersion?.id ?? "new"}
            editingVersion={editingVersion ?? activeVersion ?? null}
            onSaveNewVersion={handleSaveNewVersion}
          />
        )}
        {activeTab === "logs" && <ConsentLogsTab logs={pdpaConsentLogs} />}
      </div>
    </div>
  );
}
