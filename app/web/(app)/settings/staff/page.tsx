"use client";

import { useState, useMemo } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Drawer } from "@/components/ui/Drawer";
import {
  UserCog,
  Plus,
  Upload,
  Building2,
  ShieldCheck,
  DoorOpen,
  Calendar,
  Pencil,
  Info,
  ToggleLeft,
  ToggleRight,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  staffMembers,
  departments,
  approverGroups,
  appointments,
  type Staff,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* ── helpers ───────────────────────────────────── */

/** Approver groups where this staff is a member */
function staffApproverGroups(staffId: string) {
  return approverGroups.filter((g) =>
    g.members.some((m) => m.staffId === staffId)
  );
}

/** Appointments where this staff is the host */
function staffAppointments(staffId: string) {
  return appointments.filter((a) => a.host.id === staffId);
}

const roleLabels: Record<string, { th: string; color: string; bg: string }> = {
  admin: { th: "ผู้ดูแลระบบ", color: "text-primary-700", bg: "bg-primary-50" },
  staff: { th: "พนักงาน", color: "text-blue-700", bg: "bg-blue-50" },
  security: { th: "รปภ.", color: "text-amber-700", bg: "bg-amber-50" },
};

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function StaffPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("staff")!;
  const flowData = getFlowByPageId("staff")!;
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [drawerData, setDrawerData] = useState<{ mode: "add" | "edit"; staff?: Staff } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    return staffMembers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.employeeId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);
      const matchDept = filterDept === "all" || s.department.id === filterDept;
      const matchStatus = filterStatus === "all" || s.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [search, filterDept, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeCount = staffMembers.filter((s) => s.status === "active").length;
  const inactiveCount = staffMembers.filter((s) => s.status === "inactive").length;

  return (
    <>
      <Topbar title="จัดการพนักงาน" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      <main className="flex-1 p-6 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <UserCog size={22} className="text-primary" />
              รายชื่อพนักงานและเจ้าหน้าที่
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
            </h3>
            <p className="text-sm text-text-muted mt-1">
              จัดการข้อมูลพนักงาน กำหนดสถานะ
              และดูการมอบหมายในระบบ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 shadow-sm">
              <Upload size={18} className="mr-2" />
              นำเข้า Excel
            </Button>
            <Button variant="secondary" className="h-10 shadow-sm" onClick={() => setDrawerData({ mode: "add" })}>
              <Plus size={18} className="mr-2" />
              เพิ่มพนักงาน
            </Button>
          </div>
        </div>

        {/* info */}
        <Card className="border-none shadow-sm bg-info-light border-l-4 !border-l-info">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={20} className="text-info mt-0.5 shrink-0" />
            <div className="text-sm text-info">
              <p className="font-medium">การจัดการพนักงาน</p>
              <ul className="mt-1.5 space-y-0.5 text-xs opacity-90 list-none">
                <li>
                  1. นำเข้าข้อมูลจาก <strong>ไฟล์ Excel</strong> ได้ —
                  ข้อมูลจะเข้ามาเป็นสถานะ &quot;active&quot; อัตโนมัติ
                </li>
                <li>
                  2. ไม่มีปุ่มลบ — ใช้การ <strong>ปิดใช้งาน (inactive)</strong>{" "}
                  แทน เพื่อรักษาประวัติการมอบหมาย
                </li>
                <li>
                  3. ดู <strong>การมอบหมาย</strong> ของพนักงานแต่ละคน
                  (กลุ่มผู้อนุมัติ, นัดหมาย) ได้จากแท็กด้านขวา
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="พนักงานทั้งหมด"
            value={staffMembers.length}
            sub="ในระบบ"
            color="text-primary"
            bgColor="bg-primary-50"
          />
          <SummaryCard
            label="เปิดใช้งาน"
            value={activeCount}
            sub="active"
            color="text-success"
            bgColor="bg-success-light"
          />
          <SummaryCard
            label="ปิดใช้งาน"
            value={inactiveCount}
            sub="inactive"
            color="text-warning"
            bgColor="bg-warning-light"
          />
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
            className="w-80"
          />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">ทุกแผนก</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "active" | "inactive")
            }
            className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
        </div>

        {/* table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3">รหัส</th>
                    <th className="px-4 py-3">ชื่อ — ตำแหน่ง</th>
                    <th className="px-4 py-3">แผนก</th>
                    <th className="px-4 py-3">อีเมล</th>
                    <th className="px-4 py-3 text-center">บทบาท</th>
                    <th className="px-4 py-3 text-center">สถานะ</th>
                    <th className="px-4 py-3">การมอบหมาย</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((staff) => (
                    <StaffRow key={staff.id} staff={staff} onEdit={() => setDrawerData({ mode: "edit", staff })} />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-text-muted"
                      >
                        ไม่พบข้อมูลพนักงาน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > pageSize && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  แสดง {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} จาก {filtered.length} รายการ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                        pg === safePage
                          ? "bg-primary text-white"
                          : "hover:bg-gray-50 text-text-secondary"
                      )}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drawer */}
        <StaffDrawer data={drawerData} onClose={() => setDrawerData(null)} />
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════
   STAFF ROW
   ══════════════════════════════════════════════════ */
function StaffRow({ staff, onEdit }: { staff: Staff; onEdit: () => void }) {
  const groups = staffApproverGroups(staff.id);
  const apts = staffAppointments(staff.id);
  const role = roleLabels[staff.role] ?? {
    th: staff.role,
    color: "text-gray-700",
    bg: "bg-gray-50",
  };

  return (
    <tr
      className={cn(
        "transition-colors",
        staff.status === "inactive" ? "opacity-50" : "hover:bg-gray-50"
      )}
    >
      {/* employee id */}
      <td className="px-4 py-3 text-xs text-text-muted font-mono">
        {staff.employeeId}
      </td>

      {/* name + position */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold shrink-0">
            {staff.name.slice(3, 5)}
          </div>
          <div>
            <p className="font-medium text-text-primary text-sm">
              {staff.name}
            </p>
            <p className="text-xs text-text-muted">{staff.position}</p>
          </div>
        </div>
      </td>

      {/* department */}
      <td className="px-4 py-3">
        <p className="text-xs text-text-secondary flex items-center gap-1">
          <Building2 size={12} className="text-text-muted" />
          {staff.department.name}
        </p>
        <p className="text-[10px] text-text-muted">{staff.department.floor}</p>
      </td>

      {/* email */}
      <td className="px-4 py-3 text-xs text-text-muted">{staff.email}</td>

      {/* role */}
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
            role.bg,
            role.color
          )}
        >
          {role.th}
        </span>
      </td>

      {/* status */}
      <td className="px-4 py-3 text-center">
        {staff.status === "active" ? (
          <Badge variant="approved">เปิดใช้</Badge>
        ) : (
          <Badge variant="rejected">ปิดใช้</Badge>
        )}
      </td>

      {/* assignments */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 max-w-[260px]">
          {groups.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary-50 text-primary-700 border border-primary-100"
              title={g.name}
            >
              <ShieldCheck size={9} />
              {g.name.length > 20 ? g.name.slice(0, 18) + "…" : g.name}
            </span>
          ))}
          {apts.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent-50 text-accent-600 border border-accent-100">
              <Calendar size={9} />
              {apts.length} นัดหมาย
            </span>
          )}
          {groups.length === 0 && apts.length === 0 && (
            <span className="text-[10px] text-text-muted">—</span>
          )}
        </div>
      </td>

      {/* actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-text-muted hover:text-primary"
            title="แก้ไข"
            onClick={onEdit}
          >
            <Pencil size={16} />
          </button>
          <button
            className={cn(
              "p-2 rounded-lg transition-colors",
              staff.status === "active"
                ? "hover:bg-warning-light text-text-muted hover:text-warning"
                : "hover:bg-success-light text-text-muted hover:text-success"
            )}
            title={
              staff.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"
            }
          >
            {staff.status === "active" ? (
              <ToggleRight size={16} />
            ) : (
              <ToggleLeft size={16} />
            )}
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

/* ══════════════════════════════════════════════════
   STAFF DRAWER (Add / Edit)
   ══════════════════════════════════════════════════ */
const roleOptions = [
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "staff", label: "พนักงาน" },
  { value: "security", label: "รปภ." },
];

function StaffDrawer({
  data,
  onClose,
}: {
  data: { mode: "add" | "edit"; staff?: Staff } | null;
  onClose: () => void;
}) {
  const staff = data?.staff;
  const isEdit = data?.mode === "edit";

  const [name, setName] = useState(staff?.name ?? "");
  const [nameEn, setNameEn] = useState(staff?.nameEn ?? "");
  const [employeeId, setEmployeeId] = useState(staff?.employeeId ?? "");
  const [position, setPosition] = useState(staff?.position ?? "");
  const [departmentId, setDepartmentId] = useState(staff?.department.id ?? "");
  const [email, setEmail] = useState(staff?.email ?? "");
  const [phone, setPhone] = useState(staff?.phone ?? "");
  const [role, setRole] = useState(staff?.role ?? "staff");
  const [status, setStatus] = useState<"active" | "inactive">(
    (staff?.status === "active" || staff?.status === "inactive") ? staff.status : "active"
  );

  useState(() => {
    if (staff) {
      setName(staff.name); setNameEn(staff.nameEn); setEmployeeId(staff.employeeId);
      setPosition(staff.position); setDepartmentId(staff.department.id);
      setEmail(staff.email); setPhone(staff.phone); setRole(staff.role);
      setStatus(staff.status === "inactive" ? "inactive" : "active");
    }
  });

  return (
    <Drawer
      open={data !== null}
      onClose={onClose}
      title={isEdit ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
      subtitle={isEdit ? staff?.name : "กรอกข้อมูลพนักงาน"}
    >
      <div className="p-6 space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-lg font-bold">
            {name.slice(3, 5) || "??"}
          </div>
          <div>
            <p className="font-bold text-text-primary">{name || "ชื่อพนักงาน"}</p>
            <p className="text-xs text-text-muted">{nameEn || "Staff Name"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">รหัสพนักงาน <span className="text-error">*</span></label>
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-001" className="w-full h-10 px-3 text-sm font-mono rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">บทบาท</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Staff["role"])} className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">ชื่อ-นามสกุล (ไทย) <span className="text-error">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="นายสมชาย ใจดี" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">ชื่อ-นามสกุล (EN)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Somchai Jaidee" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">ตำแหน่ง</label>
          <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="นักวิชาการ" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">แผนก <span className="text-error">*</span></label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">— เลือกแผนก —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.floor})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">อีเมล <span className="text-error">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="somchai@mots.go.th" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">โทรศัพท์</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081-xxx-xxxx" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-text-primary">สถานะ</p>
            <p className="text-xs text-text-muted">{status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</p>
          </div>
          <button type="button" onClick={() => setStatus(status === "active" ? "inactive" : "active")} className={cn("w-12 h-7 rounded-full transition-colors relative", status === "active" ? "bg-primary" : "bg-gray-300")}>
            <span className={cn("absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform", status === "active" ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>

        {/* Assignments preview (edit mode) */}
        {isEdit && staff && (
          <div className="p-4 bg-primary-50/50 rounded-lg border border-primary/10">
            <p className="text-xs font-medium text-text-muted mb-2">การมอบหมายปัจจุบัน</p>
            <div className="flex flex-wrap gap-1">
              {staffApproverGroups(staff.id).map((g) => (
                <span key={g.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary border border-primary/20">
                  <ShieldCheck size={10} /> {g.name}
                </span>
              ))}
              {staffAppointments(staff.id).length > 0 && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-50 text-accent-600 border border-accent-200">
                  <Calendar size={10} /> {staffAppointments(staff.id).length} นัดหมาย
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-border flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button variant="primary" onClick={onClose}>
          <Save size={16} className="mr-2" />
          {isEdit ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มพนักงาน"}
        </Button>
      </div>
    </Drawer>
  );
}
