"use client";

import { useState, useMemo } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Search, Users, ShieldCheck, Lock, Unlock, KeyRound, MoreHorizontal,
  UserCog, ChevronDown, CheckCircle2, XCircle, Clock, Mail, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleConfig, type AppRole } from "@/lib/auth-config";

// ===== Mock User Accounts =====
interface UserAccount {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: "visitor" | "staff";
  role: AppRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  refName?: string;       // ชื่อ staff/visitor ที่เชื่อม
  department?: string;    // แผนก (staff)
  company?: string;       // บริษัท (visitor)
}

const mockUsers: UserAccount[] = [
  { id: 1, email: "admin@mots.go.th", firstName: "อนันต์", lastName: "มั่นคง", phone: "02-283-1500", userType: "staff", role: "admin", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-25 08:00", createdAt: "2025-01-15", refName: "อนันต์ มั่นคง", department: "สำนักงานปลัดกระทรวง" },
  { id: 2, email: "somsri.r@mots.go.th", firstName: "สมศรี", lastName: "รักงาน", phone: "02-283-1501", userType: "staff", role: "staff", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-25 09:15", createdAt: "2025-02-01", refName: "สมศรี รักงาน", department: "กองกิจการท่องเที่ยว" },
  { id: 3, email: "prawit.s@mots.go.th", firstName: "ประเสริฐ", lastName: "ศรีวิโล", phone: "02-283-1502", userType: "staff", role: "supervisor", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-24 14:30", createdAt: "2025-02-01", refName: "ประเสริฐ ศรีวิโล", department: "กองกลาง" },
  { id: 4, email: "somchai.p@mots.go.th", firstName: "สมชาย", lastName: "ปลอดภัย", phone: "02-283-1510", userType: "staff", role: "security", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-25 06:45", createdAt: "2025-03-01", refName: "สมชาย ปลอดภัย", department: "กองกลาง (รปภ.)" },
  { id: 5, email: "napa.j@mots.go.th", firstName: "นภา", lastName: "ใจดี", phone: "02-283-1503", userType: "staff", role: "staff", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-23 10:00", createdAt: "2025-03-15", refName: "นภา ใจดี", department: "สำนักนโยบายและแผน" },
  { id: 6, email: "orapin.w@mots.go.th", firstName: "อรพิณ", lastName: "วรรณภา", phone: "02-283-1520", userType: "staff", role: "staff", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-22 11:30", createdAt: "2025-04-01", refName: "อรพิณ วรรณภา", department: "กองการต่างประเทศ" },
  { id: 7, email: "wichai@siamtech.co.th", firstName: "วิชัย", lastName: "สุขสำราญ", phone: "081-234-5678", userType: "visitor", role: "visitor", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-20 10:00", createdAt: "2026-01-10", company: "บจก. เทคโนโลยีสยาม" },
  { id: 8, email: "porntip@tourismthai.com", firstName: "พรทิพย์", lastName: "มีสุข", phone: "089-876-5432", userType: "visitor", role: "visitor", isActive: true, isEmailVerified: false, lastLoginAt: null, createdAt: "2026-02-20", company: "บจก. ท่องเที่ยวไทย" },
  { id: 9, email: "j.wilson@unwto.org", firstName: "James", lastName: "Wilson", phone: "092-345-6789", userType: "visitor", role: "visitor", isActive: true, isEmailVerified: true, lastLoginAt: "2026-03-18 14:00", createdAt: "2026-03-01", company: "World Tourism Org" },
  { id: 10, email: "noppadon.r@mots.go.th", firstName: "นภดล", lastName: "เรืองศักดิ์", phone: "02-283-1505", userType: "staff", role: "staff", isActive: false, isEmailVerified: true, lastLoginAt: "2026-01-10 09:00", createdAt: "2025-01-20", refName: "นภดล เรืองศักดิ์", department: "สำนักงานปลัดกระทรวง" },
  { id: 11, email: "chaiwat.k@mots.go.th", firstName: "ชัยวัฒน์", lastName: "กล้าหาญ", phone: "02-283-1511", userType: "staff", role: "security", isActive: false, isEmailVerified: true, lastLoginAt: "2025-12-15 22:00", createdAt: "2025-06-01", refName: "ชัยวัฒน์ กล้าหาญ", department: "กองกลาง (รปภ.)" },
];

const allRoles: AppRole[] = ["visitor", "staff", "supervisor", "security", "admin"];

type TabFilter = "all" | "staff" | "visitor" | "locked";

export default function UserManagementPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("user-management");
  const flowData = getFlowByPageId("user-management");

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [users, setUsers] = useState(mockUsers);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: "lock" | "unlock" | "reset" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Filtered users
  const filtered = useMemo(() => {
    let result = [...users];
    if (activeTab === "staff") result = result.filter((u) => u.userType === "staff");
    if (activeTab === "visitor") result = result.filter((u) => u.userType === "visitor");
    if (activeTab === "locked") result = result.filter((u) => !u.isActive);
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.department?.toLowerCase().includes(q)) ||
        (u.company?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [users, activeTab, roleFilter, searchQuery]);

  // Stats
  const stats = {
    total: users.length,
    staff: users.filter((u) => u.userType === "staff").length,
    visitor: users.filter((u) => u.userType === "visitor").length,
    locked: users.filter((u) => !u.isActive).length,
    unverified: users.filter((u) => !u.isEmailVerified).length,
  };

  // Actions
  const handleChangeRole = (userId: number, newRole: AppRole) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    setEditingRole(null);
    showToast("เปลี่ยนสิทธิ์สำเร็จ");
  };

  const handleToggleLock = (userId: number) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    setConfirmAction(null);
    const user = users.find((u) => u.id === userId);
    showToast(user?.isActive ? "ล็อกบัญชีสำเร็จ" : "ปลดล็อกบัญชีสำเร็จ");
  };

  const handleResetPassword = (userId: number) => {
    setConfirmAction(null);
    const user = users.find((u) => u.id === userId);
    showToast(`ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ ${user?.email} แล้ว`);
  };

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: stats.total },
    { key: "staff", label: "เจ้าหน้าที่", count: stats.staff },
    { key: "visitor", label: "ผู้มาติดต่อ", count: stats.visitor },
    { key: "locked", label: "ถูกล็อก", count: stats.locked },
  ];

  return (
    <>
      <Topbar title="จัดการผู้ใช้งาน" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}

      <main className="flex-1 p-6 space-y-6">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} /> {toast}
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Users size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              จัดการผู้ใช้งาน — User Management
              {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
              {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
            </h2>
            <p className="text-sm text-text-muted">ดูรายชื่อ user ทั้งหมด, เปลี่ยนสิทธิ์, ล็อก/ปลดล็อก, รีเซ็ตรหัสผ่าน</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "ผู้ใช้ทั้งหมด", value: stats.total, icon: <Users size={18} />, color: "text-primary bg-primary-50" },
            { label: "เจ้าหน้าที่", value: stats.staff, icon: <UserCog size={18} />, color: "text-emerald-600 bg-emerald-50" },
            { label: "ผู้มาติดต่อ", value: stats.visitor, icon: <Users size={18} />, color: "text-blue-600 bg-blue-50" },
            { label: "ถูกล็อก", value: stats.locked, icon: <Lock size={18} />, color: "text-error bg-error-light" },
            { label: "ยังไม่ยืนยันอีเมล", value: stats.unverified, icon: <Mail size={18} />, color: "text-warning bg-warning-light" },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.color)}>{kpi.icon}</div>
                <div>
                  <p className="text-2xl font-extrabold text-text-primary">{kpi.value}</p>
                  <p className="text-xs text-text-muted">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.label}
              <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full", activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-gray-200 text-text-muted")}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full md:w-auto">
              <Input placeholder="ค้นหาชื่อ / อีเมล / แผนก / บริษัท" leftIcon={<Search size={18} />} className="h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="w-full md:w-48">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as AppRole | "all")} className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <option value="all">สิทธิ์ทั้งหมด</option>
                {allRoles.map((r) => <option key={r} value={r}>{roleConfig[r].label} ({roleConfig[r].labelEn})</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-5 py-4">ผู้ใช้งาน</th>
                  <th className="px-5 py-4">อีเมล</th>
                  <th className="px-5 py-4">ประเภท</th>
                  <th className="px-5 py-4">สิทธิ์ (Role)</th>
                  <th className="px-5 py-4">สถานะ</th>
                  <th className="px-5 py-4">Login ล่าสุด</th>
                  <th className="px-5 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => {
                  const rc = roleConfig[user.role];
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      {/* User info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", rc.bgColor, rc.color)}>
                            {user.firstName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-text-muted">{user.department || user.company || "-"}</p>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-4">
                        <p className="text-text-primary font-mono text-xs">{user.email}</p>
                        {!user.isEmailVerified && (
                          <span className="text-[10px] text-warning bg-warning-light px-1.5 py-0.5 rounded-full">ยังไม่ยืนยัน</span>
                        )}
                      </td>
                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", user.userType === "staff" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>
                          {user.userType === "staff" ? "เจ้าหน้าที่" : "ผู้มาติดต่อ"}
                        </span>
                      </td>
                      {/* Role */}
                      <td className="px-5 py-4">
                        {editingRole === user.id ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value as AppRole)}
                            onBlur={() => setEditingRole(null)}
                            autoFocus
                            className="border border-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {allRoles.map((r) => <option key={r} value={r}>{roleConfig[r].label}</option>)}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingRole(user.id)}
                            className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-colors hover:ring-2 hover:ring-primary/20", rc.bgColor, rc.color)}
                            title="คลิกเพื่อเปลี่ยนสิทธิ์"
                          >
                            <ShieldCheck size={12} />
                            {rc.label}
                            <ChevronDown size={10} className="opacity-50" />
                          </button>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-light px-2 py-1 rounded-full">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-error bg-error-light px-2 py-1 rounded-full">
                            <Lock size={12} /> Locked
                          </span>
                        )}
                      </td>
                      {/* Last login */}
                      <td className="px-5 py-4">
                        {user.lastLoginAt ? (
                          <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Clock size={12} className="text-text-muted" />
                            {user.lastLoginAt}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">ยังไม่เคย login</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Lock/Unlock */}
                          {user.isActive ? (
                            <button
                              onClick={() => setConfirmAction({ id: user.id, action: "lock" })}
                              className="h-8 w-8 rounded-full bg-red-50 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors border border-red-200"
                              title="ล็อกบัญชี"
                            >
                              <Lock size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmAction({ id: user.id, action: "unlock" })}
                              className="h-8 w-8 rounded-full bg-green-50 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors border border-green-200"
                              title="ปลดล็อก"
                            >
                              <Unlock size={14} />
                            </button>
                          )}
                          {/* Reset password */}
                          <button
                            onClick={() => setConfirmAction({ id: user.id, action: "reset" })}
                            className="h-8 w-8 rounded-full bg-amber-50 text-warning hover:bg-warning hover:text-white flex items-center justify-center transition-colors border border-amber-200"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <KeyRound size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-border text-xs text-text-muted">
              แสดง {filtered.length} จากทั้งหมด {users.length} รายการ
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
            {(() => {
              const user = users.find((u) => u.id === confirmAction.id);
              if (!user) return null;
              const isLock = confirmAction.action === "lock";
              const isUnlock = confirmAction.action === "unlock";
              const isReset = confirmAction.action === "reset";
              return (
                <>
                  <div className="flex justify-center mb-4">
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", isLock ? "bg-red-100" : isUnlock ? "bg-green-100" : "bg-amber-100")}>
                      {isLock && <Lock size={24} className="text-error" />}
                      {isUnlock && <Unlock size={24} className="text-success" />}
                      {isReset && <KeyRound size={24} className="text-warning" />}
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-bold text-text-primary mb-1">
                    {isLock ? "ล็อกบัญชี" : isUnlock ? "ปลดล็อกบัญชี" : "รีเซ็ตรหัสผ่าน"}
                  </h3>
                  <p className="text-center text-sm text-text-secondary mb-1">
                    <span className="font-bold">{user.firstName} {user.lastName}</span>
                  </p>
                  <p className="text-center text-xs text-text-muted mb-6 font-mono">{user.email}</p>
                  {isLock && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะปลดล็อก</span>
                    </div>
                  )}
                  {isReset && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 flex items-start gap-2">
                      <Mail size={14} className="shrink-0 mt-0.5" />
                      <span>ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของผู้ใช้</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={() => setConfirmAction(null)}>ยกเลิก</Button>
                    <Button
                      variant={isLock ? "destructive" : "primary"}
                      fullWidth
                      onClick={() => {
                        if (isLock || isUnlock) handleToggleLock(confirmAction.id);
                        else handleResetPassword(confirmAction.id);
                      }}
                    >
                      {isLock ? "ล็อกบัญชี" : isUnlock ? "ปลดล็อก" : "ส่งลิงก์รีเซ็ต"}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
