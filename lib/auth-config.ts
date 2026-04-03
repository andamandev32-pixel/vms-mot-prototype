// ===== eVMS AUTH & PERMISSION CONFIG =====
// Role-based access control configuration
// ใช้ควบคุม menu visibility + action permissions

export type AppRole = "visitor" | "staff" | "supervisor" | "security" | "admin";

export type Resource =
  | "dashboard"
  | "appointments"
  | "approvals"
  | "appointment-groups"
  | "search"
  | "blocklist"
  | "reports"
  | "settings"
  | "settings.visit-purposes"
  | "settings.locations"
  | "settings.access-zones"
  | "settings.approver-groups"
  | "settings.staff"
  | "settings.service-points"
  | "settings.document-types"
  | "settings.business-hours"
  | "settings.notification-templates"
  | "settings.visit-slips"
  | "settings.pdpa-consent"
  | "settings.email-system"
  | "settings.line-oa-config";

export type Action = "view" | "create" | "edit" | "delete" | "approve" | "export";

export type Scope = "own" | "department" | "all";

interface Permission {
  action: Action;
  scope: Scope;
}

// ===== Role Display Config =====

export const roleConfig: Record<AppRole, {
  label: string;
  labelEn: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  visitor: {
    label: "ผู้มาติดต่อ",
    labelEn: "Visitor",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    description: "จองนัดหมาย, ดู QR, ตรวจสอบสถานะ, ประวัติตัวเอง",
  },
  staff: {
    label: "เจ้าหน้าที่",
    labelEn: "Staff",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    description: "สร้างนัดหมาย, อนุมัติ (ถ้าอยู่ใน approver group), Dashboard แผนกตัวเอง",
  },
  supervisor: {
    label: "หัวหน้า/ผู้บังคับบัญชา",
    labelEn: "Supervisor",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    description: "เหมือน staff + Dashboard ทุกแผนก + Blocklist + รายงานทั้งหมด",
  },
  security: {
    label: "เจ้าหน้าที่ รปภ.",
    labelEn: "Security",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    description: "Check-in/out, ตรวจบัตร, Walk-in, ออกบัตรผู้ติดต่อ",
  },
  admin: {
    label: "ผู้ดูแลระบบ",
    labelEn: "Admin",
    color: "text-red-700",
    bgColor: "bg-red-50",
    description: "ตั้งค่าทั้งหมด + จัดการ User/Role + ทุกอย่าง",
  },
};

// ===== Permission Matrix =====

const permissionMatrix: Record<AppRole, Record<string, Permission[]>> = {
  visitor: {
    appointments: [
      { action: "view", scope: "own" },
      { action: "create", scope: "own" },
    ],
  },
  staff: {
    dashboard: [{ action: "view", scope: "department" }],
    appointments: [
      { action: "view", scope: "department" },
      { action: "create", scope: "department" },
      { action: "edit", scope: "department" },
      { action: "approve", scope: "department" }, // ต้องอยู่ใน approver group ด้วย
    ],
    approvals: [
      { action: "view", scope: "department" },
      { action: "approve", scope: "department" },
    ],
    "appointment-groups": [
      { action: "view", scope: "own" },
      { action: "create", scope: "department" },
      { action: "edit", scope: "own" },
    ],
    search: [{ action: "view", scope: "department" }],
    reports: [{ action: "view", scope: "department" }],
  },
  supervisor: {
    dashboard: [{ action: "view", scope: "all" }],
    appointments: [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
      { action: "approve", scope: "all" },
    ],
    approvals: [
      { action: "view", scope: "all" },
      { action: "approve", scope: "all" },
    ],
    "appointment-groups": [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
    ],
    search: [{ action: "view", scope: "all" }],
    blocklist: [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
      { action: "delete", scope: "all" },
    ],
    reports: [
      { action: "view", scope: "all" },
      { action: "export", scope: "all" },
    ],
  },
  security: {
    // Security uses Counter app, not Web App
  },
  admin: {
    dashboard: [{ action: "view", scope: "all" }],
    appointments: [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
      { action: "delete", scope: "all" },
      { action: "approve", scope: "all" },
    ],
    approvals: [
      { action: "view", scope: "all" },
      { action: "approve", scope: "all" },
    ],
    "appointment-groups": [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
      { action: "delete", scope: "all" },
    ],
    search: [{ action: "view", scope: "all" }],
    blocklist: [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
      { action: "delete", scope: "all" },
    ],
    reports: [
      { action: "view", scope: "all" },
      { action: "export", scope: "all" },
    ],
    settings: [
      { action: "view", scope: "all" },
      { action: "create", scope: "all" },
      { action: "edit", scope: "all" },
      { action: "delete", scope: "all" },
    ],
    "settings.visit-purposes": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.locations": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.access-zones": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.approver-groups": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.staff": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.service-points": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.document-types": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.business-hours": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.notification-templates": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.visit-slips": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.pdpa-consent": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.email-system": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
    "settings.line-oa-config": [{ action: "view", scope: "all" }, { action: "edit", scope: "all" }],
  },
};

// ===== Helper Functions =====

/** ตรวจสอบว่า role นี้มีสิทธิ์เข้าถึง resource + action ไหม */
export function canAccess(role: AppRole, resource: string, action: Action = "view"): boolean {
  const perms = permissionMatrix[role]?.[resource];
  if (!perms) return false;
  return perms.some((p) => p.action === action);
}

/** ดึง scope ของ role สำหรับ resource + action */
export function getScope(role: AppRole, resource: string, action: Action = "view"): Scope | null {
  const perms = permissionMatrix[role]?.[resource];
  if (!perms) return null;
  const perm = perms.find((p) => p.action === action);
  return perm?.scope ?? null;
}

/** ดึง redirect path หลัง login ตาม role */
export function getLoginRedirect(role: AppRole): string {
  switch (role) {
    case "visitor": return "/web/appointments";
    case "security": return "/counter";
    default: return "/web/dashboard";
  }
}

// ===== Sidebar Menu Config =====

export interface SidebarMenuItem {
  label: string;
  labelEn?: string;
  href: string;
  icon: string; // lucide icon name
  resource: string; // for permission check
  children?: SidebarMenuItem[];
}

/** ได้ menu items ที่ role นี้มีสิทธิ์เห็น */
export function getMenuForRole(role: AppRole): string[] {
  const visibleResources: string[] = [];
  const matrix = permissionMatrix[role] ?? {};
  for (const resource of Object.keys(matrix)) {
    if (matrix[resource].some((p) => p.action === "view")) {
      visibleResources.push(resource);
    }
  }
  return visibleResources;
}
