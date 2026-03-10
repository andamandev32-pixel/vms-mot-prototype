"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import {
  visitPurposeConfigs,
  departments,
  approverGroups,
  type VisitPurposeConfig,
  type DepartmentRule,
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
  const [configs] = useState<VisitPurposeConfig[]>(visitPurposeConfigs);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggle = (id: string) =>
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
  const onLine = activeConfigs.reduce(
    (sum, c) =>
      sum + c.departmentRules.filter((r) => r.isActive && r.showOnLine).length,
    0
  );
  const onKiosk = activeConfigs.reduce(
    (sum, c) =>
      sum + c.departmentRules.filter((r) => r.isActive && r.showOnKiosk).length,
    0
  );

  return (
    <>
      <Topbar title="ตั้งค่าวัตถุประสงค์การเข้าพื้นที่" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              เงื่อนไขการเข้าพื้นที่
            </h3>
            <p className="text-sm text-text-muted mt-1">
              กำหนดประเภทวัตถุประสงค์ เลือกแผนกที่ต้องการ
              แล้วตั้งค่าเงื่อนไขแยกรายแผนกได้อิสระ
            </p>
          </div>
          <Button variant="secondary" className="h-10 shadow-sm">
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
                  5. เลือก<strong>ช่องทางแสดงผล</strong> LINE OA / Kiosk
                  แยกรายแผนก
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
            label="LINE / Kiosk"
            value={onLine}
            sub={`LINE ${onLine} · Kiosk ${onKiosk}`}
            color="text-success"
            bgColor="bg-success-light"
          />
        </div>
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
}: {
  config: VisitPurposeConfig;
  isExpanded: boolean;
  onToggle: () => void;
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
              <QrCode size={14} className="text-success" />
              {activeRules.filter((r) => !r.requireApproval).length} QR ทันที
            </span>
          </div>

          {/* action buttons */}
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-text-muted hover:text-primary">
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

      {/* ─── Expanded: per-department table ─── */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* toolbar */}
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-primary" />
              เงื่อนไขแยกรายแผนก ({config.departmentRules.length} แผนก)
            </p>
            <Button variant="outline" className="h-8 text-xs px-3">
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
                  <th className="px-5 py-3 text-center">LINE+Web</th>
                  <th className="px-5 py-3 text-center">Kiosk</th>
                  <th className="px-5 py-3 text-center">สถานะ</th>
                  <th className="px-5 py-3 text-center">Flow</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {config.departmentRules.map((rule) => (
                  <DeptRuleRow key={rule.departmentId} rule={rule} />
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
function DeptRuleRow({ rule }: { rule: DepartmentRule }) {
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
        {dept ? `${dept.floor} · ${dept.building}` : "-"}
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

      {/* LINE+Web */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.showOnLine}
          trueIcon={<Smartphone size={13} />}
          trueClass="bg-green-50 text-green-600"
        />
      </td>

      {/* Kiosk */}
      <td className="px-5 py-3.5 text-center">
        <BoolIcon
          value={rule.showOnKiosk}
          trueIcon={<Monitor size={13} />}
          trueClass="bg-blue-50 text-blue-600"
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
          <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary">
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
