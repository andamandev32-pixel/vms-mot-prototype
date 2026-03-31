"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import {
  Settings,
  Check,
  X,
  UserSearch,
  ShieldCheck,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Building2,
  ArrowUpDown,
  Info,
  QrCode,
  CircleDot,
  Wifi,
  Users,
  Save,
  Camera,
  CameraOff,
  FileText,
  IdCard,
  Calendar,
} from "lucide-react";
import {
  visitPurposeConfigs,
  departments,
  approverGroups,
  identityDocumentTypes,
  type VisitPurposeConfig,
  type DepartmentRule,
  type EntryChannelConfig,
  type EntryMode,
  getDepartmentLocation,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* ── helper: bool icon cell ────────────────────── */
function BoolIcon({
  value,
  trueIcon,
  trueClass = "bg-success-light text-success",
  falseClass = "bg-gray-100 text-text-muted",
}: {
  value: boolean;
  trueIcon: React.ReactNode;
  trueClass?: string;
  falseClass?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full",
        value ? trueClass : falseClass
      )}
    >
      {value ? trueIcon : <X size={12} />}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function VisitPurposeSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("visit-purposes")!;
  const flowData = getFlowByPageId("visit-purposes")!;
  const apiDoc = getApiDocByPageId("visit-purposes");
  const [configs, setConfigs] = useState<VisitPurposeConfig[]>(visitPurposeConfigs);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  /* drawer state */
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editingConfig, setEditingConfig] = useState<VisitPurposeConfig | null>(null);
  const [deptDrawer, setDeptDrawer] = useState<{ configId: number; rule?: DepartmentRule } | null>(null);

  const openAdd = () => { setEditingConfig(null); setDrawerMode("add"); };
  const openEdit = (config: VisitPurposeConfig) => { setEditingConfig(config); setDrawerMode("edit"); };
  const closeDrawer = () => { setDrawerMode(null); setEditingConfig(null); };
  const openAddDept = (configId: number) => setDeptDrawer({ configId });
  const openEditDept = (configId: number, rule: DepartmentRule) => setDeptDrawer({ configId, rule });
  const closeDeptDrawer = () => setDeptDrawer(null);

  const toggle = (id: number) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  /* stats */
  const activeConfigs = configs.filter((c) => c.isActive);
  const totalDeptRules = activeConfigs.reduce(
    (sum, c) => sum + c.departmentRules.filter((r) => r.isActive).length,
    0
  );
  const needApproval = activeConfigs.reduce(
    (sum, c) =>
      sum + c.departmentRules.filter((r) => r.isActive && r.requireApproval).length,
    0
  );
  const onLine = activeConfigs.filter((c) => c.showOnLine).length;
  const onWeb = activeConfigs.filter((c) => c.showOnWeb).length;
  const onKiosk = activeConfigs.filter((c) => c.showOnKiosk).length;
  const onCounter = activeConfigs.filter((c) => c.showOnCounter).length;

  return (
    <>
      <Topbar title="ตั้งค่าวัตถุประสงค์การเข้าพื้นที่" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              เงื่อนไขการเข้าพื้นที่
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              กำหนดประเภทวัตถุประสงค์ เลือกแผนกที่ต้องการ
              แล้วตั้งค่าเงื่อนไขแยกรายแผนกได้อิสระ
            </p>
          </div>
          <Button variant="secondary" className="h-10 shadow-sm" onClick={openAdd}>
            <Plus size={18} className="mr-2" />
            เพิ่มวัตถุประสงค์ใหม่
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="border-none shadow-sm bg-info-light border-l-4 !border-l-info">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={20} className="text-info mt-0.5 shrink-0" />
            <div className="text-sm text-info">
              <p className="font-medium">ขั้นตอน: วัตถุประสงค์ → แผนก → เงื่อนไข</p>
              <ul className="mt-1.5 space-y-0.5 text-xs opacity-90 list-none">
                <li>
                  1. เลือก<strong>วัตถุประสงค์</strong>การเข้าพื้นที่
                </li>
                <li>
                  2. เลือก<strong>แผนก</strong>ที่อนุญาตให้เข้า
                  — แต่ละแผนกตั้งค่าเงื่อนไขแยกกันได้
                </li>
                <li>
                  3. กำหนดว่าแต่ละแผนกต้อง<strong>ระบุชื่อบุคคล</strong>หรือไม่
                  (หากต้องระบุ จะมีช่องค้นหาชื่อก่อนดำเนินการ)
                </li>
                <li>
                  4.
                  กำหนดว่าต้อง<strong>อนุมัติ</strong>หรือไม่
                  — ถ้าไม่ต้อง ระบบจะสร้าง QR Check-in ทันที / Kiosk
                  เข้าพื้นที่ได้เลย
                </li>
                <li>
                  5. เลือก<strong>ช่องทางแสดงผล</strong> LINE OA / Kiosk /
                  Counter ที่ตัววัตถุประสงค์ แล้วกำหนดแผนกรับงานจากช่องทางไหนบ้าง
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* ─── Purpose Cards ─────────────────────────── */}
        <div className="space-y-4">
          {configs.map((config) => (
            <PurposeCard
              key={config.id}
              config={config}
              isExpanded={expandedRow === config.id}
              onToggle={() => toggle(config.id)}
              onEdit={() => openEdit(config)}
              onAddDept={() => openAddDept(config.id)}
              onEditDept={(rule) => openEditDept(config.id, rule)}
            />
          ))}
        </div>

        {/* ─── Summary ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="วัตถุประสงค์ที่เปิดใช้"
            value={activeConfigs.length}
            sub={`จากทั้งหมด ${configs.length}`}
            color="text-primary"
            bgColor="bg-primary-50"
          />
          <SummaryCard
            label="เงื่อนไขรายแผนก"
            value={totalDeptRules}
            sub="แผนก-วัตถุประสงค์"
            color="text-accent-600"
            bgColor="bg-accent-50"
          />
          <SummaryCard
            label="ต้องอนุมัติ"
            value={needApproval}
            sub="เงื่อนไขรายแผนก"
            color="text-warning"
            bgColor="bg-warning-light"
          />
          <SummaryCard
            label="LINE / Web / Kiosk / Counter"
            value={onLine}
            sub={`LINE ${onLine} · Web ${onWeb} · Kiosk ${onKiosk} · Counter ${onCounter}`}
            color="text-success"
            bgColor="bg-success-light"
          />
        </div>

        {/* ─── Purpose Add/Edit Drawer ───────────── */}
        <PurposeDrawer
          mode={drawerMode}
          config={editingConfig}
          onClose={closeDrawer}
        />

        {/* ─── Department Rule Drawer ────────────── */}
        <DeptRuleDrawer
          data={deptDrawer}
          onClose={closeDeptDrawer}
        />
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════
   PURPOSE CARD  — one per visit purpose
   ══════════════════════════════════════════════════ */
function PurposeCard({
  config,
  isExpanded,
  onToggle,
  onEdit,
  onAddDept,
  onEditDept,
}: {
  config: VisitPurposeConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onAddDept: () => void;
  onEditDept: (rule: DepartmentRule) => void;
}) {
  const activeRules = config.departmentRules.filter((r) => r.isActive);

  return (
    <Card
      className={cn(
        "border-none shadow-sm transition-shadow",
        !config.isActive && "opacity-50",
        isExpanded && "ring-2 ring-primary/20 shadow-md"
      )}
    >
      {/* ─── Header row ──────────────────────── */}
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggle}
      >
        <CardContent className="p-5 flex items-center gap-4">
          {/* icon + name */}
          <span className="text-3xl shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-text-primary text-base truncate">
                {config.name}
              </p>
              {config.isActive ? (
                <Badge variant="approved">เปิดใช้</Badge>
              ) : (
                <Badge variant="rejected">ปิดใช้</Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">{config.nameEn}</p>
          </div>

          {/* quick stats */}
          <div className="hidden md:flex items-center gap-5 text-xs text-text-secondary shrink-0 mr-2">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-primary" />
              {activeRules.length} แผนก
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-warning" />
              {activeRules.filter((r) => r.requireApproval).length} ต้องอนุมัติ
            </span>
            <span className="flex items-center gap-1.5">
              <IdCard size={14} className="text-info" />
              {config.kioskConfig.allowedDocuments.length} เอกสาร
            </span>
            <span className="flex items-center gap-1.5">
              {config.kioskConfig.requirePhoto || config.counterConfig.requirePhoto ? (
                <><Camera size={14} className="text-success" /> ถ่ายภาพ</>
              ) : (
                <><CameraOff size={14} className="text-text-muted" /> ไม่ถ่ายภาพ</>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-purple-600" />
              {config.allowedEntryModes.includes("single") && config.allowedEntryModes.includes("period")
                ? "ครั้งเดียว+ช่วงเวลา"
                : config.allowedEntryModes.includes("period")
                  ? "ช่วงเวลา"
                  : "ครั้งเดียว"}
            </span>
            <span className="flex items-center gap-1">
              {config.showOnLine && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">LINE</span>}
              {config.showOnWeb && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">Web</span>}
              {config.showOnKiosk && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">Kiosk</span>}
              {config.showOnCounter && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">Counter</span>}
            </span>
          </div>

          {/* action buttons */}
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-text-muted hover:text-primary" onClick={onEdit}>
              <Pencil size={16} />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-text-muted hover:text-error">
              <Trash2 size={16} />
            </button>
          </div>

          {/* chevron */}
          <div className="shrink-0 text-text-muted">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </CardContent>
      </button>

      {/* ─── Expanded: entry channel configs + per-department table ─── */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* ── Entry Channel Configs (Kiosk / Counter) ── */}
          <div className="px-5 py-4 bg-gradient-to-r from-primary-50/30 to-accent-50/30">
            <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-3">
              <IdCard size={14} className="text-primary" />
              เอกสารยืนยันตัวตน &amp; การถ่ายภาพ — แยกตาม Kiosk / Counter
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChannelConfigCard
                label="Kiosk"
                icon={<Monitor size={16} className="text-blue-600" />}
                config={config.kioskConfig}
              />
              <ChannelConfigCard
                label="Counter"
                icon={<Users size={16} className="text-amber-600" />}
                config={config.counterConfig}
              />
            </div>
          </div>
          {/* toolbar */}
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-primary" />
              เงื่อนไขแยกรายแผนก ({config.departmentRules.length} แผนก)
            </p>
            <Button variant="outline" className="h-8 text-xs px-3" onClick={onAddDept}>
              <Plus size={14} className="mr-1" />
              เพิ่มแผนก
            </Button>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-gray-50/60 border-b border-border">
                <tr>
                  <th className="px-5 py-3">แผนก</th>
                  <th className="px-5 py-3">ชั้น / อาคาร</th>
                  <th className="px-5 py-3 text-center">ระบุชื่อบุคคล</th>
                  <th className="px-5 py-3 text-center">ต้องอนุมัติ</th>
                  <th className="px-5 py-3 text-center">กลุ่มผู้อนุมัติ</th>
                  <th className="px-5 py-3 text-center">WiFi</th>
                  <th className="px-5 py-3 text-center">รับจาก LINE</th>
                  <th className="px-5 py-3 text-center">รับจาก Web</th>
                  <th className="px-5 py-3 text-center">รับจาก Kiosk</th>
                  <th className="px-5 py-3 text-center">รับจาก Counter</th>
                  <th className="px-5 py-3 text-center">สถานะ</th>
                  <th className="px-5 py-3 text-center">Flow</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {config.departmentRules.map((rule) => (
                  <DeptRuleRow key={rule.departmentId} rule={rule} onEdit={() => onEditDept(rule)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* legend */}
          <div className="px-5 py-3 bg-gray-50/40 border-t border-border flex flex-wrap gap-4 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <UserSearch size={11} className="text-primary" /> ต้องค้นหาชื่อบุคคลก่อนเข้าพบ
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-warning" /> ต้องรออนุมัติก่อนเข้าพื้นที่
            </span>
            <span className="flex items-center gap-1">
              <QrCode size={11} className="text-success" /> สร้าง QR / Kiosk เข้าพื้นที่ทันที
            </span>
            <span className="flex items-center gap-1">
              <Wifi size={11} className="text-purple-600" /> เสนอ WiFi ให้ผู้เข้าเยี่ยม
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   DEPT RULE ROW
   ══════════════════════════════════════════════════ */
function DeptRuleRow({ rule, onEdit }: { rule: DepartmentRule; onEdit: () => void }) {
  const dept = departments.find((d) => d.id === rule.departmentId);

  return (
    <tr
      className={cn(
        "hover:bg-gray-50 transition-colors",
        !rule.isActive && "opacity-40"
      )}
    >
      {/* dept name */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <CircleDot
            size={10}
            className={rule.isActive ? "text-primary" : "text-gray-300"}
          />
          <span className="font-medium text-text-primary">
            {dept?.name ?? rule.departmentId}
          </span>
        </div>
      </td>

      {/* floor / building */}
      <td className="px-5 py-3.5 text-text-muted text-xs">
        {dept ? (() => { const loc = getDepartmentLocation(dept.id); return loc ? `${loc.floor} · ${loc.building}` : "-"; })() : "-"}
      </td>

      {/* require person */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.requirePersonName}
          trueIcon={<UserSearch size={13} />}
          trueClass="bg-primary-50 text-primary"
        />
      </td>

      {/* require approval */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.requireApproval}
          trueIcon={<ShieldCheck size={13} />}
          trueClass="bg-warning-light text-warning"
        />
      </td>

      {/* approver group */}
      <td className="px-5 py-3.5 text-center">
        {rule.approverGroupId ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium bg-primary-50 px-2 py-0.5 rounded-full max-w-[120px] truncate" title={approverGroups.find((g) => g.id === rule.approverGroupId)?.name}>
            <Users size={11} />
            {approverGroups.find((g) => g.id === rule.approverGroupId)?.name?.replace(/ผู้อนุมัติ\s*/, "").slice(0, 15) ?? rule.approverGroupId}
          </span>
        ) : (
          <span className="text-text-muted text-xs">—</span>
        )}
      </td>

      {/* WiFi */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.offerWifi}
          trueIcon={<Wifi size={13} />}
          trueClass="bg-purple-50 text-purple-600"
        />
      </td>

      {/* acceptFromLine */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.acceptFromLine}
          trueIcon={<Smartphone size={13} />}
          trueClass="bg-green-50 text-green-600"
        />
      </td>

      {/* acceptFromWeb */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.acceptFromWeb}
          trueIcon={<Monitor size={13} />}
          trueClass="bg-indigo-50 text-indigo-600"
        />
      </td>

      {/* acceptFromKiosk */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.acceptFromKiosk}
          trueIcon={<Monitor size={13} />}
          trueClass="bg-blue-50 text-blue-600"
        />
      </td>

      {/* acceptFromCounter */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.acceptFromCounter}
          trueIcon={<Users size={13} />}
          trueClass="bg-amber-50 text-amber-600"
        />
      </td>

      {/* status */}
      <td className="px-5 py-3.5 text-center">
        {rule.isActive ? (
          <Badge variant="approved">เปิด</Badge>
        ) : (
          <Badge variant="rejected">ปิด</Badge>
        )}
      </td>

      {/* flow preview */}
      <td className="px-5 py-3.5 text-center">
        {rule.requireApproval ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-warning font-medium bg-warning-light px-2 py-0.5 rounded-full">
            <ShieldCheck size={11} />
            รออนุมัติ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium bg-success-light px-2 py-0.5 rounded-full">
            <QrCode size={11} />
            QR ทันที
          </span>
        )}
      </td>

      {/* actions */}
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary" onClick={onEdit}>
            <Pencil size={14} />
          </button>
          <button className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-text-muted hover:text-error">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════
   PURPOSE DRAWER (Add / Edit)
   ══════════════════════════════════════════════════ */
function PurposeDrawer({
  mode,
  config,
  onClose,
}: {
  mode: "add" | "edit" | null;
  config: VisitPurposeConfig | null;
  onClose: () => void;
}) {
  const defaultChannel: EntryChannelConfig = { allowedDocuments: [1], requirePhoto: false };

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [icon, setIcon] = useState("📌");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);
  const [showOnLine, setShowOnLine] = useState(true);
  const [showOnWeb, setShowOnWeb] = useState(true);
  const [showOnKiosk, setShowOnKiosk] = useState(true);
  const [showOnCounter, setShowOnCounter] = useState(true);
  const [kioskDocs, setKioskDocs] = useState<number[]>(defaultChannel.allowedDocuments);
  const [kioskPhoto, setKioskPhoto] = useState(false);
  const [counterDocs, setCounterDocs] = useState<number[]>(defaultChannel.allowedDocuments);
  const [counterPhoto, setCounterPhoto] = useState(false);
  const [allowedModes, setAllowedModes] = useState<EntryMode[]>(["single"]);

  /* reset form when drawer opens */
  const isOpen = mode !== null;
  useState(() => {
    if (mode === "edit" && config) {
      setName(config.name);
      setNameEn(config.nameEn);
      setIcon(config.icon);
      setIsActive(config.isActive);
      setOrder(config.order);
      setShowOnLine(config.showOnLine);
      setShowOnWeb(config.showOnWeb);
      setShowOnKiosk(config.showOnKiosk);
      setShowOnCounter(config.showOnCounter);
      setKioskDocs(config.kioskConfig.allowedDocuments);
      setKioskPhoto(config.kioskConfig.requirePhoto);
      setCounterDocs(config.counterConfig.allowedDocuments);
      setCounterPhoto(config.counterConfig.requirePhoto);
      setAllowedModes(config.allowedEntryModes);
    } else {
      setName("");
      setNameEn("");
      setIcon("📌");
      setIsActive(true);
      setOrder(visitPurposeConfigs.length + 1);
      setShowOnLine(true);
      setShowOnWeb(true);
      setShowOnKiosk(true);
      setShowOnCounter(true);
      setKioskDocs([1]);
      setKioskPhoto(false);
      setCounterDocs([1]);
      setCounterPhoto(false);
      setAllowedModes(["single"]);
    }
  });

  const toggleDoc = (list: number[], setList: (v: number[]) => void, docId: number) => {
    setList(list.includes(docId) ? list.filter((d) => d !== docId) : [...list, docId]);
  };

  const toggleEntryMode = (mode: EntryMode) => {
    setAllowedModes(prev => {
      if (prev.includes(mode)) {
        if (prev.length <= 1) return prev;
        return prev.filter(m => m !== mode);
      }
      return [...prev, mode];
    });
  };

  const iconOptions = ["🏛️", "📋", "📄", "🔧", "💼", "🎓", "📦", "🔖", "📌", "🏢", "🤝", "📝"];

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={mode === "add" ? "เพิ่มวัตถุประสงค์ใหม่" : "แก้ไขวัตถุประสงค์"}
      subtitle={mode === "add" ? "กำหนดวัตถุประสงค์การเข้าพื้นที่ใหม่" : `แก้ไข: ${config?.name ?? ""}`}
    >
      <div className="p-6 space-y-5">
        {/* Icon selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">ไอคอน</label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  "w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all",
                  icon === ic ? "border-primary bg-primary-50 shadow-sm" : "border-border hover:border-primary/30"
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Name TH */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">ชื่อวัตถุประสงค์ (ภาษาไทย) <span className="text-error">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ติดต่อราชการ"
            className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Name EN */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">ชื่อวัตถุประสงค์ (English)</label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Official Business"
            className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Order */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">ลำดับการแสดงผล</label>
          <input
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-24 h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-text-primary">เปิดใช้งาน</p>
            <p className="text-xs text-text-muted">แสดงวัตถุประสงค์นี้ในระบบ</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-12 h-7 rounded-full transition-colors relative",
              isActive ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
              isActive ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
        </div>

        {/* ─── Channel Visibility (Purpose Level) ── */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Smartphone size={16} className="text-green-600" />
            ช่องทางที่แสดงวัตถุประสงค์นี้
          </p>
          <p className="text-xs text-text-muted">เลือกช่องทางที่จะแสดงวัตถุประสงค์นี้ให้ผู้ใช้เลือก (ระดับวัตถุประสงค์)</p>

          <ToggleOption
            icon={<Smartphone size={16} className="text-green-600" />}
            label="LINE OA"
            description="แสดงวัตถุประสงค์นี้บน LINE OA"
            value={showOnLine}
            onChange={setShowOnLine}
          />
          <ToggleOption
            icon={<Monitor size={16} className="text-indigo-600" />}
            label="Web App"
            description="แสดงวัตถุประสงค์นี้บน Web App"
            value={showOnWeb}
            onChange={setShowOnWeb}
          />
          <ToggleOption
            icon={<Monitor size={16} className="text-blue-600" />}
            label="Kiosk"
            description="แสดงวัตถุประสงค์นี้บนตู้ Kiosk"
            value={showOnKiosk}
            onChange={setShowOnKiosk}
          />
          <ToggleOption
            icon={<Users size={16} className="text-amber-600" />}
            label="Counter"
            description="แสดงวัตถุประสงค์นี้ที่เคาน์เตอร์ รปภ."
            value={showOnCounter}
            onChange={setShowOnCounter}
          />
        </div>

        {/* ─── Entry Mode Config ── */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Calendar size={16} className="text-purple-600" />
            ประเภทการเข้าพื้นที่ที่อนุญาต
          </p>
          <p className="text-xs text-text-muted">เลือกอย่างน้อย 1 ประเภท — ผู้ใช้จะเห็นเฉพาะประเภทที่เปิดไว้เมื่อสร้างนัดหมาย</p>
          <label className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-blue-100">
            <input
              type="checkbox"
              checked={allowedModes.includes("single")}
              onChange={() => toggleEntryMode("single")}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium">🔹 ขออนุญาตแบบ 1 ครั้ง</p>
              <p className="text-[11px] text-text-muted">กำหนดวันที่ เวลาเริ่ม และเวลาสิ้นสุด (เข้าได้ครั้งเดียว)</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors border border-purple-100">
            <input
              type="checkbox"
              checked={allowedModes.includes("period")}
              onChange={() => toggleEntryMode("period")}
              className="w-4 h-4 rounded border-border text-purple-600 focus:ring-purple-500/20 accent-purple-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium flex items-center gap-1.5"><Calendar size={13} /> ขออนุญาตตามช่วงเวลา</p>
              <p className="text-[11px] text-text-muted">กำหนดวันเวลาเริ่ม — วันเวลาสิ้นสุด (เข้าได้หลายครั้งในช่วงนั้น)</p>
            </div>
          </label>
        </div>

        {/* ─── Kiosk Channel Config ── */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Monitor size={16} className="text-blue-600" />
            Kiosk — เอกสารยืนยันตัวตน
          </p>
          <div className="space-y-2">
            {identityDocumentTypes.map((doc) => (
              <label key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={kioskDocs.includes(doc.id)}
                  onChange={() => toggleDoc(kioskDocs, setKioskDocs, doc.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary-500"
                />
                <span className="text-base">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{doc.name}</p>
                  <p className="text-[11px] text-text-muted">{doc.nameEn}</p>
                </div>
              </label>
            ))}
          </div>
          <ToggleOption
            icon={<Camera size={16} className="text-blue-600" />}
            label="ถ่ายภาพ (Kiosk)"
            description="ถ่ายภาพผู้เข้าเยี่ยมผ่าน Kiosk"
            value={kioskPhoto}
            onChange={setKioskPhoto}
          />
        </div>

        {/* ─── Counter Channel Config ── */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users size={16} className="text-amber-600" />
            Counter — เอกสารยืนยันตัวตน
          </p>
          <div className="space-y-2">
            {identityDocumentTypes.map((doc) => (
              <label key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-amber-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={counterDocs.includes(doc.id)}
                  onChange={() => toggleDoc(counterDocs, setCounterDocs, doc.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary-500"
                />
                <span className="text-base">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{doc.name}</p>
                  <p className="text-[11px] text-text-muted">{doc.nameEn}</p>
                </div>
              </label>
            ))}
          </div>
          <ToggleOption
            icon={<Camera size={16} className="text-amber-600" />}
            label="ถ่ายภาพ (Counter)"
            description="ถ่ายภาพผู้เข้าเยี่ยมที่เคาน์เตอร์"
            value={counterPhoto}
            onChange={setCounterPhoto}
          />
        </div>

        {/* Preview */}
        <div className="p-4 bg-primary-50/50 rounded-lg border border-primary/10">
          <p className="text-xs font-medium text-text-muted mb-2">ตัวอย่าง</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-bold text-text-primary">{name || "ชื่อวัตถุประสงค์"}</p>
              <p className="text-xs text-text-muted">{nameEn || "Purpose Name"}</p>
            </div>
            {isActive ? <Badge variant="approved">เปิดใช้</Badge> : <Badge variant="rejected">ปิดใช้</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white rounded-md p-2 border border-border">
              <p className="font-medium text-text-secondary mb-1">Kiosk</p>
              <p>{kioskDocs.length} เอกสาร · {kioskPhoto ? "ถ่ายภาพ" : "ไม่ถ่ายภาพ"}</p>
            </div>
            <div className="bg-white rounded-md p-2 border border-border">
              <p className="font-medium text-text-secondary mb-1">Counter</p>
              <p>{counterDocs.length} เอกสาร · {counterPhoto ? "ถ่ายภาพ" : "ไม่ถ่ายภาพ"}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <Calendar size={12} className="text-purple-600" />
            <span className="text-text-secondary">ประเภทการเข้า:</span>
            {allowedModes.includes("single") && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">ครั้งเดียว</span>
            )}
            {allowedModes.includes("period") && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">ช่วงเวลา</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <Smartphone size={12} className="text-green-600" />
            <span className="text-text-secondary">ช่องทาง:</span>
            {showOnLine && <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">LINE</span>}
            {showOnWeb && <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">Web</span>}
            {showOnKiosk && <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Kiosk</span>}
            {showOnCounter && <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Counter</span>}
            {!showOnLine && !showOnWeb && !showOnKiosk && !showOnCounter && <span className="text-text-muted">ไม่มีช่องทาง</span>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-border flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button variant="primary" onClick={onClose}>
          <Save size={16} className="mr-2" />
          {mode === "add" ? "เพิ่มวัตถุประสงค์" : "บันทึกการเปลี่ยนแปลง"}
        </Button>
      </div>
    </Drawer>
  );
}

/* ══════════════════════════════════════════════════
   DEPARTMENT RULE DRAWER (Add / Edit)
   ══════════════════════════════════════════════════ */
function DeptRuleDrawer({
  data,
  onClose,
}: {
  data: { configId: number; rule?: DepartmentRule } | null;
  onClose: () => void;
}) {
  const isEditing = !!data?.rule;
  const rule = data?.rule;

  const [deptId, setDeptId] = useState(rule?.departmentId ?? 0);
  const [requirePersonName, setRequirePersonName] = useState(rule?.requirePersonName ?? false);
  const [requireApproval, setRequireApproval] = useState(rule?.requireApproval ?? false);
  const [approverGroupId, setApproverGroupId] = useState(rule?.approverGroupId ?? 0);
  const [offerWifi, setOfferWifi] = useState(rule?.offerWifi ?? false);
  const [acceptFromLine, setAcceptFromLine] = useState(rule?.acceptFromLine ?? true);
  const [acceptFromWeb, setAcceptFromWeb] = useState(rule?.acceptFromWeb ?? true);
  const [acceptFromKiosk, setAcceptFromKiosk] = useState(rule?.acceptFromKiosk ?? true);
  const [acceptFromCounter, setAcceptFromCounter] = useState(rule?.acceptFromCounter ?? true);
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);

  /* reset when drawer data changes */
  useState(() => {
    if (rule) {
      setDeptId(rule.departmentId);
      setRequirePersonName(rule.requirePersonName);
      setRequireApproval(rule.requireApproval);
      setApproverGroupId(rule.approverGroupId ?? 0);
      setOfferWifi(rule.offerWifi);
      setAcceptFromLine(rule.acceptFromLine);
      setAcceptFromWeb(rule.acceptFromWeb);
      setAcceptFromKiosk(rule.acceptFromKiosk);
      setAcceptFromCounter(rule.acceptFromCounter);
      setIsActive(rule.isActive);
    } else {
      setDeptId(0);
      setRequirePersonName(false);
      setRequireApproval(false);
      setApproverGroupId(0);
      setOfferWifi(false);
      setAcceptFromLine(true);
      setAcceptFromWeb(true);
      setAcceptFromKiosk(true);
      setAcceptFromCounter(true);
      setIsActive(true);
    }
  });

  const selectedDept = departments.find((d) => d.id === deptId);

  return (
    <Drawer
      open={data !== null}
      onClose={onClose}
      title={isEditing ? "แก้ไขเงื่อนไขแผนก" : "เพิ่มแผนก"}
      subtitle={isEditing ? `แผนก: ${selectedDept?.name ?? deptId}` : "เลือกแผนกและกำหนดเงื่อนไข"}
    >
      <div className="p-6 space-y-5">
        {/* Department selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">แผนก <span className="text-error">*</span></label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(Number(e.target.value))}
            disabled={isEditing}
            className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            <option value="">— เลือกแผนก —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({getDepartmentLocation(d.id)?.floor ?? ""})</option>
            ))}
          </select>
        </div>

        {selectedDept && (
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-text-secondary">
            <p><strong>{selectedDept.name}</strong></p>
            <p>{selectedDept.nameEn} · {(() => { const loc = getDepartmentLocation(selectedDept.id); return loc ? `${loc.floor} · ${loc.building}` : "ยังไม่กำหนดชั้น"; })()}</p>
          </div>
        )}

        {/* Toggle options */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-text-primary">เงื่อนไข</p>

          <ToggleOption
            icon={<UserSearch size={16} className="text-primary" />}
            label="ต้องระบุชื่อบุคคล"
            description="ผู้เข้าเยี่ยมต้องค้นหาชื่อบุคคลก่อนเข้าพบ"
            value={requirePersonName}
            onChange={setRequirePersonName}
          />

          <ToggleOption
            icon={<ShieldCheck size={16} className="text-warning" />}
            label="ต้องอนุมัติ"
            description="ต้องรออนุมัติจากผู้มีสิทธิ์ก่อนเข้าพื้นที่"
            value={requireApproval}
            onChange={setRequireApproval}
          />

          {requireApproval && (
            <div className="ml-8">
              <label className="block text-xs font-medium text-text-secondary mb-1">กลุ่มผู้อนุมัติ</label>
              <select
                value={approverGroupId}
                onChange={(e) => setApproverGroupId(Number(e.target.value))}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— เลือกกลุ่มผู้อนุมัติ —</option>
                {approverGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <ToggleOption
            icon={<Wifi size={16} className="text-purple-600" />}
            label="เสนอ WiFi"
            description="เสนอ WiFi Voucher ให้ผู้เข้าเยี่ยม"
            value={offerWifi}
            onChange={setOfferWifi}
          />
        </div>

        {/* Channel acceptance */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-text-primary">แผนกรับงานจากช่องทาง</p>
          <p className="text-xs text-text-muted">กำหนดว่าแผนกนี้จะโผล่ให้เลือกเมื่อผู้ใช้เข้าจากช่องทางไหนบ้าง</p>

          <ToggleOption
            icon={<Smartphone size={16} className="text-green-600" />}
            label="รับจาก LINE OA"
            description="แผนกนี้โผล่ให้เลือกเมื่อผู้ใช้เข้าจาก LINE OA"
            value={acceptFromLine}
            onChange={setAcceptFromLine}
          />

          <ToggleOption
            icon={<Monitor size={16} className="text-indigo-600" />}
            label="รับจาก Web App"
            description="แผนกนี้โผล่ให้เลือกเมื่อผู้ใช้เข้าจาก Web App"
            value={acceptFromWeb}
            onChange={setAcceptFromWeb}
          />

          <ToggleOption
            icon={<Monitor size={16} className="text-blue-600" />}
            label="รับจาก Kiosk"
            description="แผนกนี้โผล่ให้เลือกเมื่อผู้ใช้เข้าจาก Kiosk"
            value={acceptFromKiosk}
            onChange={setAcceptFromKiosk}
          />

          <ToggleOption
            icon={<Users size={16} className="text-amber-600" />}
            label="รับจาก Counter"
            description="แผนกนี้โผล่ให้เลือกเมื่อผู้ใช้เข้าจากเคาน์เตอร์ รปภ."
            value={acceptFromCounter}
            onChange={setAcceptFromCounter}
          />
        </div>

        {/* Status */}
        <ToggleOption
          icon={<CircleDot size={16} className="text-success" />}
          label="เปิดใช้งาน"
          description="เงื่อนไขแผนกนี้เปิดใช้งาน"
          value={isActive}
          onChange={setIsActive}
        />

        {/* Flow preview */}
        <div className="p-4 bg-primary-50/50 rounded-lg border border-primary/10">
          <p className="text-xs font-medium text-text-muted mb-2">สรุป Flow</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-white rounded border border-border">ผู้มาติดต่อ</span>
            <span className="text-text-muted">→</span>
            {requirePersonName && (
              <>
                <span className="px-2 py-1 bg-primary-50 text-primary rounded border border-primary/20">ระบุชื่อบุคคล</span>
                <span className="text-text-muted">→</span>
              </>
            )}
            {requireApproval ? (
              <span className="px-2 py-1 bg-warning-light text-warning rounded border border-warning/20">รออนุมัติ</span>
            ) : (
              <span className="px-2 py-1 bg-success-light text-success rounded border border-success/20">QR ทันที</span>
            )}
            <span className="text-text-muted">→</span>
            <span className="px-2 py-1 bg-success-light text-success rounded border border-success/20 font-medium">เข้าพื้นที่</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-border flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button variant="primary" onClick={onClose}>
          <Save size={16} className="mr-2" />
          {isEditing ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มแผนก"}
        </Button>
      </div>
    </Drawer>
  );
}

/* ── Toggle option helper ──────────────────────── */
function ToggleOption({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative shrink-0",
          value ? "bg-primary" : "bg-gray-300"
        )}
      >
        <span className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
          value ? "translate-x-5" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CHANNEL CONFIG CARD (Kiosk / Counter display)
   ══════════════════════════════════════════════════ */
function ChannelConfigCard({
  label,
  icon,
  config,
}: {
  label: string;
  icon: React.ReactNode;
  config: EntryChannelConfig;
}) {
  const docs = identityDocumentTypes.filter((d) =>
    config.allowedDocuments.includes(d.id)
  );

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-text-primary">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {config.requirePhoto ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium bg-success-light px-2 py-0.5 rounded-full">
              <Camera size={11} /> ถ่ายภาพ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              <CameraOff size={11} /> ไม่ถ่ายภาพ
            </span>
          )}
        </div>
      </div>
      <div>
        <p className="text-[11px] text-text-muted mb-1.5">เอกสารที่ยอมรับ ({docs.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {docs.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1 text-[11px] text-text-secondary bg-gray-50 border border-border px-2 py-1 rounded-lg"
            >
              <span>{doc.icon}</span>
              {doc.name}
            </span>
          ))}
          {docs.length === 0 && (
            <span className="text-[11px] text-text-muted italic">ไม่ได้กำหนด</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SUMMARY CARD
   ══════════════════════════════════════════════════ */
function SummaryCard({
  label,
  value,
  sub,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold",
            bgColor,
            color
          )}
        >
          {value}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
