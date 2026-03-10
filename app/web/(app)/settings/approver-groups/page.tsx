"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Mail,
  Smartphone,
  Monitor,
  Bell,
  UserCheck,
  UserX,
  Building2,
  Info,
  Check,
} from "lucide-react";
import {
  approverGroups,
  departments,
  staffMembers,
  visitPurposeConfigs,
  type ApproverGroup,
  type ApproverMember,
  type ApproverNotifyChannel,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* ── helpers ───────────────────────────────────── */

function deptName(id: string) {
  return departments.find((d) => d.id === id)?.name ?? id;
}

function staffInfo(staffId: string) {
  return staffMembers.find((s) => s.id === staffId);
}

function purposeName(id: string) {
  const p = visitPurposeConfigs.find((v) => v.id === id);
  return p ? `${p.icon} ${p.name}` : id;
}

const channelConfig: Record<
  ApproverNotifyChannel,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  line: {
    label: "LINE",
    icon: <Smartphone size={13} />,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  email: {
    label: "Email",
    icon: <Mail size={13} />,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  "web-app": {
    label: "Web App",
    icon: <Monitor size={13} />,
    color: "text-primary-700",
    bg: "bg-primary-50",
  },
};

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function ApproverGroupsPage() {
  const [groups] = useState<ApproverGroup[]>(approverGroups);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const activeGroups = groups.filter((g) => g.isActive);
  const totalApprovers = activeGroups.reduce(
    (s, g) => s + g.members.filter((m) => m.canApprove).length,
    0
  );
  const totalNotifiers = activeGroups.reduce(
    (s, g) => s + g.members.filter((m) => m.receiveNotification).length,
    0
  );

  return (
    <>
      <Topbar title="กลุ่มผู้อนุมัติ" />
      <main className="flex-1 p-6 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck size={22} className="text-primary" />
              กลุ่มผู้อนุมัติและการแจ้งเตือน
            </h3>
            <p className="text-sm text-text-muted mt-1">
              กำหนดกลุ่มผู้รับผิดชอบอนุมัติรายการเข้าพื้นที่
              พร้อมช่องทางการแจ้งเตือน
            </p>
          </div>
          <Button variant="secondary" className="h-10 shadow-sm">
            <Plus size={18} className="mr-2" />
            เพิ่มกลุ่มผู้อนุมัติ
          </Button>
        </div>

        {/* info */}
        <Card className="border-none shadow-sm bg-info-light border-l-4 !border-l-info">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={20} className="text-info mt-0.5 shrink-0" />
            <div className="text-sm text-info">
              <p className="font-medium">หน้าที่ของกลุ่มผู้อนุมัติ</p>
              <ul className="mt-1.5 space-y-0.5 text-xs opacity-90 list-none">
                <li>
                  1. <strong>การแจ้งเตือน</strong> — เมื่อมีรายการใหม่
                  ระบบจะแจ้งเตือนไปยัง LINE และ/หรือ Email
                  ของทุกคนในกลุ่มที่เปิดรับแจ้งเตือน
                </li>
                <li>
                  2. <strong>การอนุมัติผ่าน Web App</strong> —
                  สมาชิกที่มีสิทธิ์อนุมัติ login เข้า Web App
                  จะมีเมนูอนุมัติรายการให้ทำได้ทันที
                  (ต้องการผู้อนุมัติ 1 คน)
                </li>
                <li>
                  3. เลือกช่องทางแจ้งเตือนได้<strong>มากกว่า 1 ช่องทาง</strong>{" "}
                  พร้อมกัน (LINE + Email + Web App)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* group cards */}
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isExpanded={expandedId === group.id}
              onToggle={() => toggle(group.id)}
            />
          ))}
        </div>

        {/* summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="กลุ่มที่เปิดใช้"
            value={activeGroups.length}
            sub={`จากทั้งหมด ${groups.length}`}
            color="text-primary"
            bgColor="bg-primary-50"
          />
          <SummaryCard
            label="ผู้อนุมัติทั้งหมด"
            value={totalApprovers}
            sub="คนที่อนุมัติได้"
            color="text-success"
            bgColor="bg-success-light"
          />
          <SummaryCard
            label="ผู้รับแจ้งเตือน"
            value={totalNotifiers}
            sub="คนที่ได้รับ notification"
            color="text-warning"
            bgColor="bg-warning-light"
          />
        </div>
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════
   GROUP CARD
   ══════════════════════════════════════════════════ */
function GroupCard({
  group,
  isExpanded,
  onToggle,
}: {
  group: ApproverGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const approvers = group.members.filter((m) => m.canApprove);
  const notifiers = group.members.filter((m) => m.receiveNotification);

  return (
    <Card
      className={cn(
        "border-none shadow-sm transition-shadow",
        !group.isActive && "opacity-50",
        isExpanded && "ring-2 ring-primary/20 shadow-md"
      )}
    >
      {/* header */}
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <CardContent className="p-5 flex items-center gap-4">
          {/* icon */}
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} className="text-primary" />
          </div>

          {/* name & dept */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-text-primary text-base truncate">
                {group.name}
              </p>
              {group.isActive ? (
                <Badge variant="approved">เปิดใช้</Badge>
              ) : (
                <Badge variant="rejected">ปิดใช้</Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
              <Building2 size={12} />
              {deptName(group.departmentId)}
            </p>
            {/* visit purpose badges */}
            <div className="flex flex-wrap gap-1 mt-1">
              {group.visitPurposeIds.map((vpId) => (
                <span
                  key={vpId}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-50 text-accent-600 border border-accent-100"
                >
                  {purposeName(vpId)}
                </span>
              ))}
            </div>
          </div>

          {/* quick stats */}
          <div className="hidden md:flex items-center gap-5 text-xs text-text-secondary shrink-0 mr-2">
            <span className="flex items-center gap-1.5">
              <UserCheck size={14} className="text-success" />
              {approvers.length} ผู้อนุมัติ
            </span>
            <span className="flex items-center gap-1.5">
              <Bell size={14} className="text-warning" />
              {notifiers.length} รับแจ้งเตือน
            </span>
            {/* channel badges */}
            <div className="flex items-center gap-1">
              {group.notifyChannels.map((ch) => {
                const c = channelConfig[ch];
                return (
                  <span
                    key={ch}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      c.bg,
                      c.color
                    )}
                  >
                    {c.icon}
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* actions */}
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

          <div className="shrink-0 text-text-muted">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </CardContent>
      </button>

      {/* expanded detail */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* description + channels */}
          <div className="px-5 py-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* left: info */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase text-text-muted tracking-wide mb-1">
                  รายละเอียด
                </p>
                <p className="text-sm text-text-secondary">
                  {group.description}
                </p>
              </div>
            </div>

            {/* right: notify channels */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-text-muted tracking-wide">
                ช่องทางการแจ้งเตือน
              </p>
              <div className="space-y-2">
                {(["line", "email", "web-app"] as ApproverNotifyChannel[]).map(
                  (ch) => {
                    const c = channelConfig[ch];
                    const enabled = group.notifyChannels.includes(ch);
                    return (
                      <div
                        key={ch}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          enabled
                            ? "border-border bg-white"
                            : "border-dashed border-gray-200 bg-gray-50 opacity-50"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full",
                            enabled ? c.bg : "bg-gray-100"
                          )}
                        >
                          {enabled ? (
                            <span className={c.color}>{c.icon}</span>
                          ) : (
                            <UserX size={14} className="text-text-muted" />
                          )}
                        </span>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              enabled
                                ? "text-text-primary"
                                : "text-text-muted line-through"
                            )}
                          >
                            {ch === "line" &&
                              "แจ้งเตือนผ่าน LINE + Email ของทุกคนในกลุ่ม"}
                            {ch === "email" &&
                              "ส่ง Email แจ้งเตือนไปยังสมาชิกทุกคน"}
                            {ch === "web-app" &&
                              "อนุมัติผ่าน Web App (login แล้วมีเมนูอนุมัติ)"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {ch === "line" &&
                              "ส่ง push notification ผ่าน LINE OA ทันทีเมื่อมีรายการใหม่"}
                            {ch === "email" &&
                              "ส่ง email พร้อมรายละเอียดผู้มาติดต่อ + ลิงก์อนุมัติ"}
                            {ch === "web-app" &&
                              "สมาชิกที่มีสิทธิ์ login จะเห็นรายการรออนุมัติในเมนู"}
                          </p>
                        </div>
                        {enabled ? (
                          <Check
                            size={18}
                            className="text-success shrink-0"
                          />
                        ) : (
                          <span className="text-xs text-text-muted shrink-0">
                            ปิด
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* members table */}
          <div className="px-5 py-3 bg-white border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase text-text-muted tracking-wide flex items-center gap-1.5">
                <Users size={14} className="text-primary" />
                สมาชิกในกลุ่ม ({group.members.length} คน)
              </p>
              <Button variant="outline" className="h-8 text-xs px-3">
                <Plus size={14} className="mr-1" />
                เพิ่มสมาชิก
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3">ชื่อ — ตำแหน่ง</th>
                    <th className="px-4 py-3">แผนก</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">สิทธิ์อนุมัติ</th>
                    <th className="px-4 py-3 text-center">รับแจ้งเตือน</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.members.map((member) => (
                    <MemberRow key={member.staffId} member={member} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* flow preview */}
          <div className="px-5 py-4 bg-primary-50/30 border-t border-border">
            <p className="text-xs font-bold uppercase text-text-muted tracking-wide mb-3">
              ตัวอย่าง Flow เมื่อมีรายการเข้าพื้นที่ใหม่
            </p>
            <FlowPreview group={group} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   MEMBER ROW
   ══════════════════════════════════════════════════ */
function MemberRow({ member }: { member: ApproverMember }) {
  const staff = staffInfo(member.staffId);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold shrink-0">
            {staff?.name.slice(3, 5) ?? "??"}
          </div>
          <div>
            <p className="font-medium text-text-primary text-sm">
              {staff?.name ?? member.staffId}
            </p>
            <p className="text-xs text-text-muted">
              {staff?.position ?? "-"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary">
        {staff?.department.name ?? "-"}
      </td>
      <td className="px-4 py-3 text-xs text-text-muted">
        {staff?.email ?? "-"}
      </td>
      <td className="px-4 py-3 text-center">
        {member.canApprove ? (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-success-light text-success">
            <UserCheck size={14} />
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-text-muted">
            <UserX size={12} />
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {member.receiveNotification ? (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warning-light text-warning">
            <Bell size={14} />
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-text-muted">
            <Bell size={12} />
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
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
   FLOW PREVIEW (visual)
   ══════════════════════════════════════════════════ */
function FlowPreview({ group }: { group: ApproverGroup }) {
  const approverNames = group.members
    .filter((m) => m.canApprove)
    .map((m) => staffInfo(m.staffId)?.name ?? m.staffId);

  const notifyNames = group.members
    .filter((m) => m.receiveNotification)
    .map((m) => staffInfo(m.staffId)?.name ?? m.staffId);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {/* step 1 */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-border px-3 py-2">
        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
          1
        </span>
        <span className="text-text-secondary">ผู้มาติดต่อขอเข้าพื้นที่</span>
      </div>

      <span className="text-text-muted">→</span>

      {/* step 2: notify */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-border px-3 py-2">
        <span className="w-6 h-6 rounded-full bg-warning text-white flex items-center justify-center text-[10px] font-bold">
          2
        </span>
        <div>
          <span className="text-text-secondary">แจ้งเตือนไปยัง </span>
          <span className="font-medium text-text-primary">
            {notifyNames.length} คน
          </span>
          <div className="flex gap-1 mt-0.5">
            {group.notifyChannels.map((ch) => (
              <span
                key={ch}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-medium",
                  channelConfig[ch].bg,
                  channelConfig[ch].color
                )}
              >
                {channelConfig[ch].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <span className="text-text-muted">→</span>

      {/* step 3: approve */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-border px-3 py-2">
        <span className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-[10px] font-bold">
          3
        </span>
        <div>
          <span className="text-text-secondary">อนุมัติ </span>
          <span className="font-medium text-text-primary">
            1 คน
          </span>
          <span className="text-text-muted">
            {" "}
            จากผู้อนุมัติ {approverNames.length} คน
          </span>
        </div>
      </div>

      <span className="text-text-muted">→</span>

      {/* step 4 */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-success px-3 py-2">
        <span className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-[10px] font-bold">
          ✓
        </span>
        <span className="text-success font-medium">
          สร้าง QR เข้าพื้นที่
        </span>
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
