// ════════════════════════════════════════════════════
// API Documentation Data — ใช้คู่กับ ApiDocModal
// ════════════════════════════════════════════════════

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  summaryEn: string;
  auth: "public" | "user" | "admin";
  requestBody?: ApiParam[];
  queryParams?: ApiParam[];
  pathParams?: ApiParam[];
  responseExample?: string;
  notes?: string[];
}

export interface PageApiDoc {
  pageId: string;
  menuName: string;
  menuNameEn: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
}

// ════════════════════════════════════════════════════
// 1. User Management
// ════════════════════════════════════════════════════

const userManagementApi: PageApiDoc = {
  pageId: "user-management",
  menuName: "จัดการผู้ใช้งาน",
  menuNameEn: "User Management",
  baseUrl: "/api",
  endpoints: [
    {
      method: "GET",
      path: "/api/users",
      summary: "ดึงรายชื่อผู้ใช้ทั้งหมด",
      summaryEn: "List all users",
      auth: "admin",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ (default: 1)" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
        { name: "search", type: "string", required: false, description: "ค้นหาชื่อ / อีเมล / แผนก / บริษัท" },
        { name: "user_type", type: "string", required: false, description: "กรอง: visitor | staff" },
        { name: "role", type: "string", required: false, description: "กรอง: visitor | staff | supervisor | security | admin" },
        { name: "is_active", type: "boolean", required: false, description: "กรอง: true = active, false = locked" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "email": "admin@mots.go.th",
      "first_name": "อนันต์",
      "last_name": "มั่นคง",
      "phone": "02-283-1500",
      "user_type": "staff",
      "role": "admin",
      "is_active": true,
      "is_email_verified": true,
      "line_user_id": "U1234567890",
      "line_display_name": "อนันต์ Admin",
      "line_linked_at": "2025-06-10T09:00:00Z",
      "last_login_at": "2026-03-25T08:00:00Z",
      "created_at": "2025-01-15T00:00:00Z"
    }
  ],
  "total": 11,
  "page": 1,
  "limit": 20
}`,
    },
    {
      method: "POST",
      path: "/api/users",
      summary: "สร้างผู้ใช้ใหม่ (Admin)",
      summaryEn: "Create new user",
      auth: "admin",
      requestBody: [
        { name: "email", type: "string", required: true, description: "อีเมล (unique)" },
        { name: "first_name", type: "string", required: true, description: "ชื่อ" },
        { name: "last_name", type: "string", required: true, description: "นามสกุล" },
        { name: "phone", type: "string", required: false, description: "เบอร์โทรศัพท์" },
        { name: "user_type", type: "string", required: true, description: "visitor | staff" },
        { name: "role", type: "string", required: true, description: "visitor | staff | supervisor | security | admin" },
        { name: "department", type: "string", required: false, description: "แผนก (ถ้า staff)" },
        { name: "company", type: "string", required: false, description: "บริษัท (ถ้า visitor)" },
      ],
      notes: ["ระบบจะส่งอีเมลเชิญพร้อมลิงก์ตั้งรหัสผ่านไปยังผู้ใช้ใหม่"],
    },
    {
      method: "PATCH",
      path: "/api/users/:id/role",
      summary: "เปลี่ยน Role ผู้ใช้",
      summaryEn: "Change user role",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "User ID" },
      ],
      requestBody: [
        { name: "role", type: "string", required: true, description: "visitor | staff | supervisor | security | admin" },
      ],
      notes: ["บันทึก audit_log ทุกครั้ง", "ส่ง email แจ้ง user"],
    },
    {
      method: "PATCH",
      path: "/api/users/:id/lock",
      summary: "ล็อก / ปลดล็อกบัญชี",
      summaryEn: "Lock / Unlock user account",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "User ID" },
      ],
      requestBody: [
        { name: "is_active", type: "boolean", required: true, description: "true = ปลดล็อก, false = ล็อก" },
      ],
      notes: ["ล็อก → ยกเลิก session ทันที", "ล็อก → ไม่สามารถ login ทุกช่องทาง"],
    },
    {
      method: "POST",
      path: "/api/users/:id/reset-password",
      summary: "ส่งลิงก์รีเซ็ตรหัสผ่าน",
      summaryEn: "Send password reset link",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "User ID" },
      ],
      notes: ["สร้าง reset_token (crypto.randomBytes)", "หมดอายุ 24 ชม.", "ส่ง email ไปยัง user"],
    },
    {
      method: "DELETE",
      path: "/api/users/:id/line/unlink",
      summary: "Admin ยกเลิกผูก LINE ให้ user",
      summaryEn: "Admin unlink user LINE account",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "User ID" },
      ],
      notes: ["SET line_user_id = NULL, line_display_name = NULL, line_linked_at = NULL", "บันทึก audit_log"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 2. My Profile
// ════════════════════════════════════════════════════

const myProfileApi: PageApiDoc = {
  pageId: "my-profile",
  menuName: "โปรไฟล์ของฉัน",
  menuNameEn: "My Profile",
  baseUrl: "/api/users/me",
  endpoints: [
    {
      method: "GET",
      path: "/api/users/me",
      summary: "ดึงข้อมูลโปรไฟล์ตัวเอง",
      summaryEn: "Get my profile",
      auth: "user",
      responseExample: `{
  "id": 2,
  "email": "somsri.r@mots.go.th",
  "first_name": "สมศรี",
  "last_name": "รักงาน",
  "phone": "02-283-1501",
  "user_type": "staff",
  "role": "staff",
  "is_active": true,
  "is_email_verified": true,
  "line_user_id": "U0987654321",
  "line_display_name": "สมศรี R.",
  "line_linked_at": "2025-08-20T14:30:00Z",
  "created_at": "2025-02-01T00:00:00Z"
}`,
      notes: ["ไม่ส่ง password_hash ไป frontend เด็ดขาด"],
    },
    {
      method: "PATCH",
      path: "/api/users/me",
      summary: "แก้ไขข้อมูลส่วนตัว",
      summaryEn: "Update my profile",
      auth: "user",
      requestBody: [
        { name: "first_name", type: "string", required: false, description: "ชื่อ" },
        { name: "last_name", type: "string", required: false, description: "นามสกุล" },
        { name: "phone", type: "string", required: false, description: "เบอร์โทรศัพท์" },
      ],
      notes: ["email, role, user_type เปลี่ยนไม่ได้"],
    },
    {
      method: "POST",
      path: "/api/users/me/line/link",
      summary: "ผูกบัญชี LINE",
      summaryEn: "Link LINE account",
      auth: "user",
      requestBody: [
        { name: "access_token", type: "string", required: true, description: "LINE access token จาก LIFF SDK" },
      ],
      notes: [
        "Backend ใช้ access_token ดึง profile จาก LINE API",
        "ได้ line_user_id + display_name",
        "ถ้า line_user_id ซ้ำ → return 409 Conflict",
        "บันทึก line_user_id, line_display_name, line_linked_at",
      ],
      responseExample: `{
  "line_user_id": "U0987654321",
  "line_display_name": "สมศรี R.",
  "line_linked_at": "2025-08-20T14:30:00Z"
}`,
    },
    {
      method: "DELETE",
      path: "/api/users/me/line/unlink",
      summary: "ยกเลิกผูก LINE (ตัวเอง)",
      summaryEn: "Unlink my LINE account",
      auth: "user",
      notes: ["SET line_user_id = NULL, line_display_name = NULL, line_linked_at = NULL", "ไม่ต้อง confirm ที่ backend (frontend ถามแล้ว)"],
    },
    {
      method: "POST",
      path: "/api/users/me/change-password",
      summary: "เปลี่ยนรหัสผ่าน",
      summaryEn: "Change my password",
      auth: "user",
      requestBody: [
        { name: "old_password", type: "string", required: true, description: "รหัสผ่านเดิม" },
        { name: "new_password", type: "string", required: true, description: "รหัสผ่านใหม่ (≥ 8 ตัวอักษร)" },
      ],
      notes: [
        "bcrypt.compare(old_password, password_hash) → ถ้าไม่ตรง return 401",
        "bcrypt.hash(new_password) → update password_hash",
        "ไม่ invalidate session ปัจจุบัน",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 3. Auth (Login / Register / Forgot Password)
// ════════════════════════════════════════════════════

const authApi: PageApiDoc = {
  pageId: "auth",
  menuName: "ระบบยืนยันตัวตน",
  menuNameEn: "Authentication",
  baseUrl: "/api/auth",
  endpoints: [
    {
      method: "POST",
      path: "/api/auth/login",
      summary: "เข้าสู่ระบบ",
      summaryEn: "Login",
      auth: "public",
      requestBody: [
        { name: "email", type: "string", required: true, description: "อีเมล" },
        { name: "password", type: "string", required: true, description: "รหัสผ่าน" },
      ],
      responseExample: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "email": "somsri.r@mots.go.th",
    "role": "staff",
    "first_name": "สมศรี",
    "last_name": "รักงาน"
  }
}`,
      notes: ["ตรวจ is_active = true ก่อน", "อัปเดต last_login_at"],
    },
    {
      method: "POST",
      path: "/api/auth/register",
      summary: "สมัครสมาชิก",
      summaryEn: "Register",
      auth: "public",
      requestBody: [
        { name: "email", type: "string", required: true, description: "อีเมล (unique)" },
        { name: "password", type: "string", required: true, description: "รหัสผ่าน (≥ 8 ตัวอักษร)" },
        { name: "first_name", type: "string", required: true, description: "ชื่อ" },
        { name: "last_name", type: "string", required: true, description: "นามสกุล" },
        { name: "phone", type: "string", required: false, description: "เบอร์โทรศัพท์" },
        { name: "user_type", type: "string", required: true, description: "visitor | staff" },
      ],
      notes: ["role = user_type default (visitor → visitor, staff → staff)", "ส่ง verification email"],
    },
    {
      method: "POST",
      path: "/api/auth/forgot-password",
      summary: "ขอลิงก์รีเซ็ตรหัสผ่าน",
      summaryEn: "Request password reset",
      auth: "public",
      requestBody: [
        { name: "email", type: "string", required: true, description: "อีเมลที่ลงทะเบียน" },
      ],
      notes: ["สร้าง reset_token + หมดอายุ 24 ชม.", "ส่ง email พร้อมลิงก์", "ถ้าไม่พบ email → return 200 (ไม่เปิดเผยว่ามีหรือไม่)"],
    },
    {
      method: "POST",
      path: "/api/auth/reset-password",
      summary: "ตั้งรหัสผ่านใหม่ (จากลิงก์)",
      summaryEn: "Reset password with token",
      auth: "public",
      requestBody: [
        { name: "token", type: "string", required: true, description: "Reset token จาก email" },
        { name: "new_password", type: "string", required: true, description: "รหัสผ่านใหม่ (≥ 8 ตัวอักษร)" },
      ],
      notes: ["ตรวจ token ยังไม่หมดอายุ", "ลบ reset_token หลังใช้สำเร็จ", "ใช้ได้ครั้งเดียว"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 4. Visit Purposes
// ════════════════════════════════════════════════════

const visitPurposesApi: PageApiDoc = {
  pageId: "visit-purposes",
  menuName: "วัตถุประสงค์เข้าพื้นที่",
  menuNameEn: "Visit Purposes",
  baseUrl: "/api/visit-purposes",
  endpoints: [
    {
      method: "GET",
      path: "/api/visit-purposes",
      summary: "ดึงรายการวัตถุประสงค์ทั้งหมด",
      summaryEn: "List all visit purposes",
      auth: "user",
      queryParams: [
        { name: "is_active", type: "boolean", required: false, description: "กรอง: true = ใช้งาน, false = ปิดใช้งาน" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name_th": "ประชุม/สัมมนา",
      "name_en": "Meeting/Seminar",
      "requires_approval": true,
      "max_visitors": 50,
      "is_active": true,
      "sort_order": 1,
      "created_at": "2025-01-15T00:00:00Z"
    },
    {
      "id": 2,
      "name_th": "ติดต่อราชการ",
      "name_en": "Government Contact",
      "requires_approval": false,
      "max_visitors": null,
      "is_active": true,
      "sort_order": 2,
      "created_at": "2025-01-15T00:00:00Z"
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/visit-purposes",
      summary: "สร้างวัตถุประสงค์ใหม่",
      summaryEn: "Create visit purpose",
      auth: "admin",
      requestBody: [
        { name: "name_th", type: "string", required: true, description: "ชื่อภาษาไทย" },
        { name: "name_en", type: "string", required: false, description: "ชื่อภาษาอังกฤษ" },
        { name: "requires_approval", type: "boolean", required: false, description: "ต้องอนุมัติก่อน (default: false)" },
        { name: "max_visitors", type: "number", required: false, description: "จำนวนผู้เยี่ยมสูงสุด (null = ไม่จำกัด)" },
        { name: "sort_order", type: "number", required: false, description: "ลำดับการแสดงผล" },
      ],
    },
    {
      method: "PUT",
      path: "/api/visit-purposes/:id",
      summary: "แก้ไขวัตถุประสงค์",
      summaryEn: "Update visit purpose",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Visit Purpose ID" },
      ],
      requestBody: [
        { name: "name_th", type: "string", required: false, description: "ชื่อภาษาไทย" },
        { name: "name_en", type: "string", required: false, description: "ชื่อภาษาอังกฤษ" },
        { name: "requires_approval", type: "boolean", required: false, description: "ต้องอนุมัติก่อน" },
        { name: "max_visitors", type: "number", required: false, description: "จำนวนผู้เยี่ยมสูงสุด" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
        { name: "sort_order", type: "number", required: false, description: "ลำดับการแสดงผล" },
      ],
    },
    {
      method: "DELETE",
      path: "/api/visit-purposes/:id",
      summary: "ลบวัตถุประสงค์",
      summaryEn: "Delete visit purpose",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Visit Purpose ID" },
      ],
      notes: ["Soft delete (set is_active = false) ถ้ามี appointment อ้างอิงอยู่", "Hard delete ถ้ายังไม่มีการใช้งาน"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 5. Locations
// ════════════════════════════════════════════════════

const locationsApi: PageApiDoc = {
  pageId: "locations",
  menuName: "อาคาร / ชั้น / แผนก",
  menuNameEn: "Locations",
  baseUrl: "/api/locations",
  endpoints: [
    {
      method: "GET",
      path: "/api/locations/buildings",
      summary: "ดึงรายการอาคารทั้งหมด",
      summaryEn: "List all buildings",
      auth: "user",
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name_th": "อาคาร กท.",
      "name_en": "MOTS Building",
      "code": "MOTS-MAIN",
      "floors": [
        {
          "id": 1,
          "name_th": "ชั้น 1",
          "floor_number": 1,
          "departments": [
            { "id": 1, "name_th": "ประชาสัมพันธ์", "name_en": "Public Relations" }
          ]
        }
      ],
      "is_active": true
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/locations/buildings",
      summary: "สร้างอาคารใหม่",
      summaryEn: "Create building",
      auth: "admin",
      requestBody: [
        { name: "name_th", type: "string", required: true, description: "ชื่ออาคาร (ไทย)" },
        { name: "name_en", type: "string", required: false, description: "ชื่ออาคาร (อังกฤษ)" },
        { name: "code", type: "string", required: true, description: "รหัสอาคาร (unique)" },
      ],
    },
    {
      method: "POST",
      path: "/api/locations/buildings/:buildingId/floors",
      summary: "เพิ่มชั้นในอาคาร",
      summaryEn: "Add floor to building",
      auth: "admin",
      pathParams: [
        { name: "buildingId", type: "number", required: true, description: "Building ID" },
      ],
      requestBody: [
        { name: "name_th", type: "string", required: true, description: "ชื่อชั้น เช่น ชั้น 1" },
        { name: "floor_number", type: "number", required: true, description: "ลำดับชั้น" },
      ],
    },
    {
      method: "POST",
      path: "/api/locations/floors/:floorId/departments",
      summary: "เพิ่มแผนกในชั้น",
      summaryEn: "Add department to floor",
      auth: "admin",
      pathParams: [
        { name: "floorId", type: "number", required: true, description: "Floor ID" },
      ],
      requestBody: [
        { name: "name_th", type: "string", required: true, description: "ชื่อแผนก (ไทย)" },
        { name: "name_en", type: "string", required: false, description: "ชื่อแผนก (อังกฤษ)" },
      ],
    },
    {
      method: "DELETE",
      path: "/api/locations/:type/:id",
      summary: "ลบอาคาร/ชั้น/แผนก",
      summaryEn: "Delete building/floor/department",
      auth: "admin",
      pathParams: [
        { name: "type", type: "string", required: true, description: "buildings | floors | departments" },
        { name: "id", type: "number", required: true, description: "ID ของรายการ" },
      ],
      notes: ["ลบอาคาร → cascade ลบชั้นและแผนกที่อยู่ภายใน", "ถ้ามี appointment อ้างอิง → soft delete"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 6. Access Zones
// ════════════════════════════════════════════════════

const accessZonesApi: PageApiDoc = {
  pageId: "access-zones",
  menuName: "โซนเข้าพื้นที่",
  menuNameEn: "Access Zones",
  baseUrl: "/api/access-zones",
  endpoints: [
    {
      method: "GET",
      path: "/api/access-zones",
      summary: "ดึงรายการโซนทั้งหมด",
      summaryEn: "List all access zones",
      auth: "admin",
      queryParams: [
        { name: "building_id", type: "number", required: false, description: "กรองตามอาคาร" },
        { name: "security_level", type: "string", required: false, description: "กรอง: public | restricted | confidential" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name_th": "โซน A - ล็อบบี้",
      "name_en": "Zone A - Lobby",
      "security_level": "public",
      "building_id": 1,
      "building_name": "อาคาร กท.",
      "hikvision_door_id": "DOOR-001",
      "hikvision_reader_id": "RDR-001",
      "requires_escort": false,
      "is_active": true
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/access-zones",
      summary: "สร้างโซนใหม่",
      summaryEn: "Create access zone",
      auth: "admin",
      requestBody: [
        { name: "name_th", type: "string", required: true, description: "ชื่อโซน (ไทย)" },
        { name: "name_en", type: "string", required: false, description: "ชื่อโซน (อังกฤษ)" },
        { name: "security_level", type: "string", required: true, description: "public | restricted | confidential" },
        { name: "building_id", type: "number", required: true, description: "อาคารที่สังกัด" },
        { name: "hikvision_door_id", type: "string", required: false, description: "รหัสประตู Hikvision" },
        { name: "hikvision_reader_id", type: "string", required: false, description: "รหัส Reader Hikvision" },
        { name: "requires_escort", type: "boolean", required: false, description: "ต้องมีผู้พาเข้า (default: false)" },
      ],
    },
    {
      method: "PUT",
      path: "/api/access-zones/:id",
      summary: "แก้ไขโซน",
      summaryEn: "Update access zone",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Access Zone ID" },
      ],
      requestBody: [
        { name: "name_th", type: "string", required: false, description: "ชื่อโซน (ไทย)" },
        { name: "name_en", type: "string", required: false, description: "ชื่อโซน (อังกฤษ)" },
        { name: "security_level", type: "string", required: false, description: "public | restricted | confidential" },
        { name: "hikvision_door_id", type: "string", required: false, description: "รหัสประตู Hikvision" },
        { name: "hikvision_reader_id", type: "string", required: false, description: "รหัส Reader Hikvision" },
        { name: "requires_escort", type: "boolean", required: false, description: "ต้องมีผู้พาเข้า" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
      ],
    },
    {
      method: "POST",
      path: "/api/access-zones/:id/test-connection",
      summary: "ทดสอบเชื่อมต่อ Hikvision",
      summaryEn: "Test Hikvision connection",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Access Zone ID" },
      ],
      responseExample: `{
  "status": "connected",
  "door_status": "closed",
  "reader_status": "online",
  "last_event": "2026-03-25T09:15:00Z"
}`,
      notes: ["เรียก Hikvision ISAPI เพื่อตรวจสถานะ", "timeout 10 วินาที"],
    },
    {
      method: "DELETE",
      path: "/api/access-zones/:id",
      summary: "ลบโซน",
      summaryEn: "Delete access zone",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Access Zone ID" },
      ],
      notes: ["Soft delete ถ้ามี appointment อ้างอิง"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 7. Approver Groups
// ════════════════════════════════════════════════════

const approverGroupsApi: PageApiDoc = {
  pageId: "approver-groups",
  menuName: "กลุ่มผู้อนุมัติ",
  menuNameEn: "Approver Groups",
  baseUrl: "/api/approver-groups",
  endpoints: [
    {
      method: "GET",
      path: "/api/approver-groups",
      summary: "ดึงรายการกลุ่มผู้อนุมัติทั้งหมด",
      summaryEn: "List all approver groups",
      auth: "admin",
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name": "ผู้อนุมัติระดับผู้อำนวยการ",
      "description": "กลุ่มผู้อนุมัติสำหรับการเข้าพื้นที่ชั้น confidential",
      "is_active": true,
      "members": [
        { "id": 1, "user_id": 3, "first_name": "วิชัย", "last_name": "อนุมัติดี", "role": "supervisor" },
        { "id": 2, "user_id": 5, "first_name": "สุภาพร", "last_name": "ตรวจสอบ", "role": "supervisor" }
      ],
      "created_at": "2025-03-01T00:00:00Z"
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/approver-groups",
      summary: "สร้างกลุ่มผู้อนุมัติใหม่",
      summaryEn: "Create approver group",
      auth: "admin",
      requestBody: [
        { name: "name", type: "string", required: true, description: "ชื่อกลุ่ม" },
        { name: "description", type: "string", required: false, description: "รายละเอียด" },
        { name: "member_user_ids", type: "number[]", required: true, description: "รายการ User ID ของสมาชิก" },
      ],
      notes: ["สมาชิกต้องมี role = supervisor หรือ admin เท่านั้น"],
    },
    {
      method: "PUT",
      path: "/api/approver-groups/:id",
      summary: "แก้ไขกลุ่มผู้อนุมัติ",
      summaryEn: "Update approver group",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Approver Group ID" },
      ],
      requestBody: [
        { name: "name", type: "string", required: false, description: "ชื่อกลุ่ม" },
        { name: "description", type: "string", required: false, description: "รายละเอียด" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
      ],
    },
    {
      method: "POST",
      path: "/api/approver-groups/:id/members",
      summary: "เพิ่มสมาชิกในกลุ่ม",
      summaryEn: "Add member to group",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Approver Group ID" },
      ],
      requestBody: [
        { name: "user_id", type: "number", required: true, description: "User ID ที่ต้องการเพิ่ม" },
      ],
      notes: ["ตรวจ role ของ user ต้องเป็น supervisor | admin"],
    },
    {
      method: "DELETE",
      path: "/api/approver-groups/:id/members/:userId",
      summary: "ลบสมาชิกออกจากกลุ่ม",
      summaryEn: "Remove member from group",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Approver Group ID" },
        { name: "userId", type: "number", required: true, description: "User ID ที่ต้องการลบ" },
      ],
      notes: ["ต้องมีสมาชิกอย่างน้อย 1 คนในกลุ่ม"],
    },
    {
      method: "DELETE",
      path: "/api/approver-groups/:id",
      summary: "ลบกลุ่มผู้อนุมัติ",
      summaryEn: "Delete approver group",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Approver Group ID" },
      ],
      notes: ["ไม่สามารถลบได้ถ้ามี visit purpose อ้างอิงอยู่"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 8. Staff
// ════════════════════════════════════════════════════

const staffApi: PageApiDoc = {
  pageId: "staff",
  menuName: "จัดการพนักงาน",
  menuNameEn: "Staff Management",
  baseUrl: "/api/staff",
  endpoints: [
    {
      method: "GET",
      path: "/api/staff",
      summary: "ดึงรายชื่อพนักงานทั้งหมด",
      summaryEn: "List all staff",
      auth: "admin",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ (default: 1)" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
        { name: "search", type: "string", required: false, description: "ค้นหาชื่อ / รหัสพนักงาน / แผนก" },
        { name: "department_id", type: "number", required: false, description: "กรองตามแผนก" },
        { name: "is_active", type: "boolean", required: false, description: "กรอง: true = ทำงาน, false = ลาออก" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "first_name": "สมชาย",
      "last_name": "ทำงานดี",
      "email": "somchai@mots.go.th",
      "phone": "02-283-1510",
      "department_id": 1,
      "department_name": "กองบริหาร",
      "position": "เจ้าหน้าที่บริหารงานทั่วไป",
      "is_active": true,
      "user_id": 4,
      "created_at": "2025-01-15T00:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}`,
    },
    {
      method: "POST",
      path: "/api/staff",
      summary: "เพิ่มพนักงานใหม่",
      summaryEn: "Create staff record",
      auth: "admin",
      requestBody: [
        { name: "employee_code", type: "string", required: true, description: "รหัสพนักงาน (unique)" },
        { name: "first_name", type: "string", required: true, description: "ชื่อ" },
        { name: "last_name", type: "string", required: true, description: "นามสกุล" },
        { name: "email", type: "string", required: true, description: "อีเมล" },
        { name: "phone", type: "string", required: false, description: "เบอร์โทรศัพท์" },
        { name: "department_id", type: "number", required: true, description: "แผนก ID" },
        { name: "position", type: "string", required: false, description: "ตำแหน่ง" },
      ],
      notes: ["สร้าง user account (user_type=staff) ให้อัตโนมัติถ้ายังไม่มี"],
    },
    {
      method: "PUT",
      path: "/api/staff/:id",
      summary: "แก้ไขข้อมูลพนักงาน",
      summaryEn: "Update staff record",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Staff ID" },
      ],
      requestBody: [
        { name: "first_name", type: "string", required: false, description: "ชื่อ" },
        { name: "last_name", type: "string", required: false, description: "นามสกุล" },
        { name: "phone", type: "string", required: false, description: "เบอร์โทรศัพท์" },
        { name: "department_id", type: "number", required: false, description: "แผนก ID" },
        { name: "position", type: "string", required: false, description: "ตำแหน่ง" },
        { name: "is_active", type: "boolean", required: false, description: "สถานะการทำงาน" },
      ],
    },
    {
      method: "DELETE",
      path: "/api/staff/:id",
      summary: "ลบพนักงาน",
      summaryEn: "Delete staff record",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Staff ID" },
      ],
      notes: ["Soft delete (set is_active = false)", "ไม่ลบ user account ที่เชื่อมโยง"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 9. Service Points
// ════════════════════════════════════════════════════

const servicePointsApi: PageApiDoc = {
  pageId: "service-points",
  menuName: "จุดบริการ (Kiosk/Counter)",
  menuNameEn: "Service Points",
  baseUrl: "/api/service-points",
  endpoints: [
    {
      method: "GET",
      path: "/api/service-points",
      summary: "ดึงรายการจุดบริการทั้งหมด",
      summaryEn: "List all service points",
      auth: "admin",
      queryParams: [
        { name: "type", type: "string", required: false, description: "กรอง: kiosk | counter" },
        { name: "building_id", type: "number", required: false, description: "กรองตามอาคาร" },
        { name: "is_active", type: "boolean", required: false, description: "กรอง: true = ใช้งาน" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name": "Kiosk ล็อบบี้ ชั้น 1",
      "type": "kiosk",
      "building_id": 1,
      "building_name": "อาคาร กท.",
      "floor_id": 1,
      "device_code": "KSK-001",
      "ip_address": "192.168.1.101",
      "is_active": true,
      "last_heartbeat": "2026-03-25T09:30:00Z"
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/service-points",
      summary: "สร้างจุดบริการใหม่",
      summaryEn: "Create service point",
      auth: "admin",
      requestBody: [
        { name: "name", type: "string", required: true, description: "ชื่อจุดบริการ" },
        { name: "type", type: "string", required: true, description: "kiosk | counter" },
        { name: "building_id", type: "number", required: true, description: "อาคาร ID" },
        { name: "floor_id", type: "number", required: false, description: "ชั้น ID" },
        { name: "device_code", type: "string", required: true, description: "รหัสอุปกรณ์ (unique)" },
        { name: "ip_address", type: "string", required: false, description: "IP address ของอุปกรณ์" },
      ],
    },
    {
      method: "PUT",
      path: "/api/service-points/:id",
      summary: "แก้ไขจุดบริการ",
      summaryEn: "Update service point",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Service Point ID" },
      ],
      requestBody: [
        { name: "name", type: "string", required: false, description: "ชื่อจุดบริการ" },
        { name: "type", type: "string", required: false, description: "kiosk | counter" },
        { name: "ip_address", type: "string", required: false, description: "IP address" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
      ],
    },
    {
      method: "DELETE",
      path: "/api/service-points/:id",
      summary: "ลบจุดบริการ",
      summaryEn: "Delete service point",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Service Point ID" },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 10. Document Types
// ════════════════════════════════════════════════════

const documentTypesApi: PageApiDoc = {
  pageId: "document-types",
  menuName: "ประเภทเอกสาร",
  menuNameEn: "Document Types",
  baseUrl: "/api/document-types",
  endpoints: [
    {
      method: "GET",
      path: "/api/document-types",
      summary: "ดึงรายการประเภทเอกสารทั้งหมด",
      summaryEn: "List all document types",
      auth: "user",
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name_th": "บัตรประชาชน",
      "name_en": "National ID Card",
      "code": "NID",
      "is_required_for_checkin": true,
      "is_active": true,
      "sort_order": 1
    },
    {
      "id": 2,
      "name_th": "หนังสือเดินทาง",
      "name_en": "Passport",
      "code": "PASSPORT",
      "is_required_for_checkin": true,
      "is_active": true,
      "sort_order": 2
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/document-types",
      summary: "สร้างประเภทเอกสารใหม่",
      summaryEn: "Create document type",
      auth: "admin",
      requestBody: [
        { name: "name_th", type: "string", required: true, description: "ชื่อภาษาไทย" },
        { name: "name_en", type: "string", required: false, description: "ชื่อภาษาอังกฤษ" },
        { name: "code", type: "string", required: true, description: "รหัสเอกสาร (unique)" },
        { name: "is_required_for_checkin", type: "boolean", required: false, description: "ต้องสแกนเมื่อ check-in (default: false)" },
        { name: "sort_order", type: "number", required: false, description: "ลำดับการแสดงผล" },
      ],
    },
    {
      method: "PUT",
      path: "/api/document-types/:id",
      summary: "แก้ไขประเภทเอกสาร",
      summaryEn: "Update document type",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Document Type ID" },
      ],
      requestBody: [
        { name: "name_th", type: "string", required: false, description: "ชื่อภาษาไทย" },
        { name: "name_en", type: "string", required: false, description: "ชื่อภาษาอังกฤษ" },
        { name: "is_required_for_checkin", type: "boolean", required: false, description: "ต้องสแกนเมื่อ check-in" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
      ],
    },
    {
      method: "DELETE",
      path: "/api/document-types/:id",
      summary: "ลบประเภทเอกสาร",
      summaryEn: "Delete document type",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Document Type ID" },
      ],
      notes: ["Soft delete ถ้ามีเอกสารที่อ้างอิงอยู่"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 11. Business Hours
// ════════════════════════════════════════════════════

const businessHoursApi: PageApiDoc = {
  pageId: "business-hours",
  menuName: "เวลาทำการ",
  menuNameEn: "Business Hours",
  baseUrl: "/api/business-hours",
  endpoints: [
    {
      method: "GET",
      path: "/api/business-hours",
      summary: "ดึงเวลาทำการปัจจุบัน",
      summaryEn: "Get current business hours",
      auth: "user",
      responseExample: `{
  "timezone": "Asia/Bangkok",
  "schedule": [
    { "day": "monday", "open": "08:30", "close": "16:30", "is_open": true },
    { "day": "tuesday", "open": "08:30", "close": "16:30", "is_open": true },
    { "day": "wednesday", "open": "08:30", "close": "16:30", "is_open": true },
    { "day": "thursday", "open": "08:30", "close": "16:30", "is_open": true },
    { "day": "friday", "open": "08:30", "close": "16:30", "is_open": true },
    { "day": "saturday", "open": null, "close": null, "is_open": false },
    { "day": "sunday", "open": null, "close": null, "is_open": false }
  ],
  "holidays": [
    { "date": "2026-04-13", "name": "วันสงกรานต์" },
    { "date": "2026-04-14", "name": "วันสงกรานต์" },
    { "date": "2026-04-15", "name": "วันสงกรานต์" }
  ],
  "allow_after_hours_booking": false,
  "updated_at": "2026-01-10T09:00:00Z"
}`,
    },
    {
      method: "PUT",
      path: "/api/business-hours",
      summary: "อัปเดตเวลาทำการ",
      summaryEn: "Update business hours",
      auth: "admin",
      requestBody: [
        { name: "schedule", type: "DaySchedule[]", required: true, description: "ตารางเวลาแต่ละวัน (7 วัน)" },
        { name: "holidays", type: "Holiday[]", required: false, description: "รายการวันหยุดพิเศษ" },
        { name: "allow_after_hours_booking", type: "boolean", required: false, description: "อนุญาตจองนอกเวลาทำการ" },
      ],
      notes: ["มีได้แค่ 1 record ในระบบ (singleton config)", "บันทึก audit_log ทุกครั้ง"],
    },
    {
      method: "POST",
      path: "/api/business-hours/holidays",
      summary: "เพิ่มวันหยุดพิเศษ",
      summaryEn: "Add holiday",
      auth: "admin",
      requestBody: [
        { name: "date", type: "string", required: true, description: "วันที่ (YYYY-MM-DD)" },
        { name: "name", type: "string", required: true, description: "ชื่อวันหยุด" },
      ],
    },
    {
      method: "DELETE",
      path: "/api/business-hours/holidays/:date",
      summary: "ลบวันหยุดพิเศษ",
      summaryEn: "Remove holiday",
      auth: "admin",
      pathParams: [
        { name: "date", type: "string", required: true, description: "วันที่ (YYYY-MM-DD)" },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 12. Notification Templates
// ════════════════════════════════════════════════════

const notificationTemplatesApi: PageApiDoc = {
  pageId: "notification-templates",
  menuName: "เทมเพลตแจ้งเตือน",
  menuNameEn: "Notification Templates",
  baseUrl: "/api/notification-templates",
  endpoints: [
    {
      method: "GET",
      path: "/api/notification-templates",
      summary: "ดึงรายการเทมเพลตทั้งหมด",
      summaryEn: "List all notification templates",
      auth: "admin",
      queryParams: [
        { name: "channel", type: "string", required: false, description: "กรอง: email | line | sms" },
        { name: "event_type", type: "string", required: false, description: "กรอง: appointment_created | appointment_approved | checkin | checkout" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name": "นัดหมายได้รับอนุมัติ (Email)",
      "event_type": "appointment_approved",
      "channel": "email",
      "subject": "นัดหมายของท่านได้รับอนุมัติ - {{appointment_code}}",
      "body_template": "เรียน {{visitor_name}},\\nนัดหมาย {{appointment_code}} วันที่ {{date}} ได้รับอนุมัติแล้ว...",
      "variables": ["visitor_name", "appointment_code", "date", "time", "location"],
      "is_active": true,
      "updated_at": "2026-02-15T10:00:00Z"
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/api/notification-templates",
      summary: "สร้างเทมเพลตใหม่",
      summaryEn: "Create notification template",
      auth: "admin",
      requestBody: [
        { name: "name", type: "string", required: true, description: "ชื่อเทมเพลต" },
        { name: "event_type", type: "string", required: true, description: "ประเภทเหตุการณ์ที่ trigger" },
        { name: "channel", type: "string", required: true, description: "email | line | sms" },
        { name: "subject", type: "string", required: false, description: "หัวข้อ (สำหรับ email)" },
        { name: "body_template", type: "string", required: true, description: "เนื้อหา (รองรับ {{variable}})" },
      ],
      notes: ["ตัวแปรที่ใช้ได้: visitor_name, appointment_code, date, time, location, host_name, purpose, qr_code_url"],
    },
    {
      method: "PUT",
      path: "/api/notification-templates/:id",
      summary: "แก้ไขเทมเพลต",
      summaryEn: "Update notification template",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Template ID" },
      ],
      requestBody: [
        { name: "name", type: "string", required: false, description: "ชื่อเทมเพลต" },
        { name: "subject", type: "string", required: false, description: "หัวข้อ" },
        { name: "body_template", type: "string", required: false, description: "เนื้อหา" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
      ],
    },
    {
      method: "POST",
      path: "/api/notification-templates/:id/preview",
      summary: "พรีวิวเทมเพลตด้วยข้อมูลตัวอย่าง",
      summaryEn: "Preview template with sample data",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Template ID" },
      ],
      responseExample: `{
  "subject": "นัดหมายของท่านได้รับอนุมัติ - VMS-2026-001",
  "body": "เรียน คุณสมศรี รักงาน,\\nนัดหมาย VMS-2026-001 วันที่ 25/03/2026 ได้รับอนุมัติแล้ว..."
}`,
      notes: ["ใช้ข้อมูล mock สำหรับ preview"],
    },
    {
      method: "DELETE",
      path: "/api/notification-templates/:id",
      summary: "ลบเทมเพลต",
      summaryEn: "Delete notification template",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Template ID" },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 13. Visit Slips
// ════════════════════════════════════════════════════

const visitSlipsApi: PageApiDoc = {
  pageId: "visit-slips",
  menuName: "แบบฟอร์ม Visit Slip",
  menuNameEn: "Visit Slip Settings",
  baseUrl: "/api/visit-slips",
  endpoints: [
    {
      method: "GET",
      path: "/api/visit-slips/config",
      summary: "ดึงการตั้งค่า Visit Slip ปัจจุบัน (รวมโลโก้ + Officer Sign)",
      summaryEn: "Get visit slip configuration (incl. logo & officer sign)",
      auth: "admin",
      responseExample: `{
  "header_text": "กระทรวงการท่องเที่ยวและกีฬา",
  "header_text_en": "Ministry of Tourism and Sports",
  "logo_url": "/uploads/logo-mots.png",
  "logo_size_px": 40,
  "show_qr_code": true,
  "show_photo": true,
  "show_purpose": true,
  "show_host_info": true,
  "show_access_zones": true,
  "show_officer_sign": true,
  "officer_sign_label_th": "ลงชื่อเจ้าหน้าที่ / Officer Signature",
  "officer_sign_label_en": "ประทับตรา / Stamp",
  "stamp_placeholder": "ประทับตราหน่วยงาน",
  "footer_text": "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
  "footer_text_en": "Please return this pass when leaving",
  "slip_size": "thermal-80mm",
  "expiry_display": true,
  "custom_fields": [
    { "label": "เลขทะเบียนรถ", "field_key": "vehicle_plate", "is_visible": true }
  ],
  "updated_at": "2026-01-20T10:00:00Z"
}`,
    },
    {
      method: "PUT",
      path: "/api/visit-slips/config",
      summary: "อัปเดตการตั้งค่า Visit Slip (รวมโลโก้ขนาด + Officer Sign)",
      summaryEn: "Update visit slip configuration (incl. logo size & officer sign)",
      auth: "admin",
      requestBody: [
        { name: "header_text", type: "string", required: false, description: "หัวข้อบนบัตร (ไทย)" },
        { name: "header_text_en", type: "string", required: false, description: "หัวข้อบนบัตร (อังกฤษ)" },
        { name: "logo_size_px", type: "number", required: false, description: "ขนาดโลโก้ (px) 20–100 — ค่าเริ่มต้น 40" },
        { name: "show_qr_code", type: "boolean", required: false, description: "แสดง QR Code" },
        { name: "show_photo", type: "boolean", required: false, description: "แสดงรูปผู้เยี่ยม" },
        { name: "show_purpose", type: "boolean", required: false, description: "แสดงวัตถุประสงค์" },
        { name: "show_host_info", type: "boolean", required: false, description: "แสดงข้อมูลผู้นัดหมาย" },
        { name: "show_officer_sign", type: "boolean", required: false, description: "แสดงส่วนลงชื่อเจ้าหน้าที่/ประทับตรา" },
        { name: "officer_sign_label_th", type: "string", required: false, description: "Label ลงชื่อเจ้าหน้าที่ (TH)" },
        { name: "officer_sign_label_en", type: "string", required: false, description: "Label ประทับตรา (EN)" },
        { name: "stamp_placeholder", type: "string", required: false, description: "ข้อความใต้ช่องประทับตรา" },
        { name: "slip_size", type: "string", required: false, description: "ขนาดกระดาษ: thermal-80mm | thermal-58mm" },
        { name: "footer_text", type: "string", required: false, description: "ข้อความท้ายบัตร (TH)" },
        { name: "footer_text_en", type: "string", required: false, description: "ข้อความท้ายบัตร (EN)" },
        { name: "custom_fields", type: "CustomField[]", required: false, description: "ฟิลด์เพิ่มเติม" },
      ],
      notes: ["Singleton config — มีได้ 1 record", "บันทึก audit_log", "logo_size_px ต้องอยู่ในช่วง 20–100"],
    },
    {
      method: "POST",
      path: "/api/visit-slips/logo",
      summary: "อัปโหลดโลโก้หน่วยงานสำหรับ Visit Slip",
      summaryEn: "Upload organization logo for visit slip",
      auth: "admin",
      requestBody: [
        { name: "file", type: "File (multipart/form-data)", required: true, description: "ไฟล์ภาพ PNG, JPG, SVG, หรือ WebP — แนะนำไม่เกิน 200KB" },
      ],
      responseExample: `{
  "logo_url": "/uploads/slip-logos/logo-1711785600.png",
  "file_name": "mot_logo_custom.png",
  "file_size_kb": 42,
  "width": 200,
  "height": 200,
  "uploaded_at": "2026-03-30T10:00:00Z"
}`,
      notes: [
        "รองรับ MIME: image/png, image/jpeg, image/svg+xml, image/webp",
        "ขนาดไฟล์สูงสุด 500KB — แนะนำไม่เกิน 200KB",
        "บันทึกไฟล์ใน /uploads/slip-logos/ → อัปเดต visit_slip_templates.logo_url",
        "ลบไฟล์เก่าอัตโนมัติเมื่ออัปโหลดใหม่",
      ],
    },
    {
      method: "DELETE",
      path: "/api/visit-slips/logo",
      summary: "ลบโลโก้ที่อัปโหลด (กลับไปใช้โลโก้เริ่มต้น)",
      summaryEn: "Remove uploaded logo (revert to default)",
      auth: "admin",
      responseExample: `{
  "message": "Logo removed, reverted to default",
  "default_logo_url": "/images/mot_logo_slip.png"
}`,
      notes: [
        "ลบไฟล์ใน /uploads/slip-logos/",
        "set visit_slip_templates.logo_url = null",
        "set visit_slip_templates.logo_size_px = 40 (ค่าเริ่มต้น)",
        "บันทึก audit_log",
      ],
    },
    {
      method: "GET",
      path: "/api/visit-slips/preview",
      summary: "พรีวิว Visit Slip ด้วยข้อมูลตัวอย่าง (รวมโลโก้ + Officer Sign)",
      summaryEn: "Preview visit slip with sample data (incl. logo & officer sign)",
      auth: "admin",
      responseExample: `{
  "preview_html": "<div class='visit-slip'>...</div>",
  "preview_image_url": "/api/visit-slips/preview.png"
}`,
      notes: ["ใช้ข้อมูล mock สำหรับ preview", "คืน HTML หรือ image URL สำหรับ frontend render", "แสดงโลโก้ปัจจุบัน + ขนาดปัจจุบัน + Officer Sign section"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 14. PDPA Consent
// ════════════════════════════════════════════════════

const pdpaConsentApi: PageApiDoc = {
  pageId: "pdpa-consent",
  menuName: "แบบฟอร์ม PDPA Consent",
  menuNameEn: "PDPA Consent Settings",
  baseUrl: "/api/pdpa-consent",
  endpoints: [
    {
      method: "GET",
      path: "/api/pdpa-consent/config",
      summary: "ดึงฟอร์ม PDPA Consent ปัจจุบัน",
      summaryEn: "Get current PDPA consent form",
      auth: "user",
      responseExample: `{
  "version": "2.1",
  "title_th": "แบบฟอร์มขอความยินยอมเก็บข้อมูลส่วนบุคคล",
  "title_en": "Personal Data Consent Form",
  "content_th": "กระทรวงการท่องเที่ยวและกีฬา มีความจำเป็นต้องเก็บรวบรวมข้อมูลส่วนบุคคลของท่าน...",
  "content_en": "The Ministry of Tourism and Sports needs to collect your personal data...",
  "data_collected": ["ชื่อ-นามสกุล", "เลขบัตรประชาชน", "รูปถ่าย", "เบอร์โทรศัพท์"],
  "retention_days": 365,
  "is_mandatory": true,
  "effective_date": "2026-01-01",
  "updated_at": "2025-12-20T10:00:00Z"
}`,
    },
    {
      method: "PUT",
      path: "/api/pdpa-consent/config",
      summary: "อัปเดตฟอร์ม PDPA Consent",
      summaryEn: "Update PDPA consent form",
      auth: "admin",
      requestBody: [
        { name: "title_th", type: "string", required: false, description: "หัวข้อ (ไทย)" },
        { name: "title_en", type: "string", required: false, description: "หัวข้อ (อังกฤษ)" },
        { name: "content_th", type: "string", required: false, description: "เนื้อหา (ไทย)" },
        { name: "content_en", type: "string", required: false, description: "เนื้อหา (อังกฤษ)" },
        { name: "data_collected", type: "string[]", required: false, description: "รายการข้อมูลที่จัดเก็บ" },
        { name: "retention_days", type: "number", required: false, description: "จำนวนวันเก็บข้อมูล" },
        { name: "is_mandatory", type: "boolean", required: false, description: "บังคับยินยอมก่อนใช้งาน" },
        { name: "effective_date", type: "string", required: false, description: "วันที่มีผลบังคับใช้ (YYYY-MM-DD)" },
      ],
      notes: ["อัปเดต version อัตโนมัติ", "ผู้เยี่ยมที่ยินยอม version เก่าจะต้องยินยอมใหม่", "บันทึก audit_log"],
    },
    {
      method: "POST",
      path: "/api/pdpa-consent/accept",
      summary: "ผู้เยี่ยมยินยอม PDPA",
      summaryEn: "Accept PDPA consent",
      auth: "public",
      requestBody: [
        { name: "visitor_id", type: "number", required: true, description: "Visitor ID (จากระบบหรือ Kiosk)" },
        { name: "consent_version", type: "string", required: true, description: "Version ที่ยินยอม" },
        { name: "ip_address", type: "string", required: false, description: "IP ที่ยินยอม (auto-detect)" },
      ],
      notes: ["บันทึก timestamp + IP + version", "ต้องยินยอมก่อนทำนัดหมาย"],
    },
    {
      method: "GET",
      path: "/api/pdpa-consent/logs",
      summary: "ดึง log การยินยอม PDPA",
      summaryEn: "Get PDPA consent logs",
      auth: "admin",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า" },
        { name: "visitor_id", type: "number", required: false, description: "กรองตาม Visitor ID" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "visitor_id": 10,
      "visitor_name": "จิรภัทร์ เยี่ยมชม",
      "consent_version": "2.1",
      "accepted_at": "2026-03-25T08:30:00Z",
      "ip_address": "203.150.10.55"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}`,
    },
  ],
};

// ════════════════════════════════════════════════════
// 15. Appointments
// ════════════════════════════════════════════════════

const appointmentsApi: PageApiDoc = {
  pageId: "appointments",
  menuName: "การนัดหมาย",
  menuNameEn: "Appointments",
  baseUrl: "/api/appointments",
  endpoints: [
    {
      method: "GET",
      path: "/api/appointments",
      summary: "ดึงรายการนัดหมายทั้งหมด",
      summaryEn: "List all appointments",
      auth: "user",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ (default: 1)" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
        { name: "status", type: "string", required: false, description: "กรอง: pending | approved | rejected | checked_in | checked_out | cancelled | expired" },
        { name: "date_from", type: "string", required: false, description: "วันที่เริ่มต้น (YYYY-MM-DD)" },
        { name: "date_to", type: "string", required: false, description: "วันที่สิ้นสุด (YYYY-MM-DD)" },
        { name: "host_id", type: "number", required: false, description: "กรองตาม Host (Staff ID)" },
        { name: "purpose_id", type: "number", required: false, description: "กรองตามวัตถุประสงค์" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "appointment_code": "VMS-2026-0001",
      "visitor_name": "จิรภัทร์ เยี่ยมชม",
      "visitor_email": "jiraphat@example.com",
      "visitor_phone": "089-123-4567",
      "visitor_company": "บริษัท ทดสอบ จำกัด",
      "host_id": 4,
      "host_name": "สมชาย ทำงานดี",
      "purpose_id": 1,
      "purpose_name": "ประชุม/สัมมนา",
      "visit_date": "2026-03-25",
      "visit_time_start": "10:00",
      "visit_time_end": "12:00",
      "location": "อาคาร กท. ชั้น 3 ห้องประชุม 301",
      "status": "approved",
      "checked_in_at": null,
      "checked_out_at": null,
      "qr_code_url": "/api/appointments/1/qr",
      "created_at": "2026-03-20T14:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}`,
    },
    {
      method: "POST",
      path: "/api/appointments",
      summary: "สร้างนัดหมายใหม่",
      summaryEn: "Create new appointment",
      auth: "user",
      requestBody: [
        { name: "visitor_name", type: "string", required: true, description: "ชื่อผู้เยี่ยม" },
        { name: "visitor_email", type: "string", required: false, description: "อีเมลผู้เยี่ยม" },
        { name: "visitor_phone", type: "string", required: true, description: "เบอร์โทรผู้เยี่ยม" },
        { name: "visitor_company", type: "string", required: false, description: "บริษัทผู้เยี่ยม" },
        { name: "visitor_id_card", type: "string", required: false, description: "เลขบัตรประชาชน/พาสปอร์ต" },
        { name: "host_id", type: "number", required: true, description: "Staff ID ผู้นัดหมาย" },
        { name: "purpose_id", type: "number", required: true, description: "วัตถุประสงค์ ID" },
        { name: "visit_date", type: "string", required: true, description: "วันที่เยี่ยม (YYYY-MM-DD)" },
        { name: "visit_time_start", type: "string", required: true, description: "เวลาเริ่ม (HH:mm)" },
        { name: "visit_time_end", type: "string", required: true, description: "เวลาสิ้นสุด (HH:mm)" },
        { name: "location", type: "string", required: false, description: "สถานที่นัดหมาย" },
        { name: "access_zone_ids", type: "number[]", required: false, description: "โซนที่อนุญาตเข้า" },
        { name: "notes", type: "string", required: false, description: "หมายเหตุ" },
      ],
      notes: ["สร้าง appointment_code อัตโนมัติ (VMS-YYYY-NNNN)", "ถ้า purpose requires_approval → status = pending", "ถ้าไม่ → status = approved", "สร้าง QR Code อัตโนมัติ", "ส่ง notification ไป host + visitor"],
    },
    {
      method: "GET",
      path: "/api/appointments/:id",
      summary: "ดึงรายละเอียดนัดหมาย",
      summaryEn: "Get appointment details",
      auth: "user",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Appointment ID" },
      ],
    },
    {
      method: "POST",
      path: "/api/appointments/:id/approve",
      summary: "อนุมัตินัดหมาย",
      summaryEn: "Approve appointment",
      auth: "user",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Appointment ID" },
      ],
      requestBody: [
        { name: "comment", type: "string", required: false, description: "ความเห็นผู้อนุมัติ" },
      ],
      notes: ["เฉพาะ supervisor/admin หรือสมาชิกกลุ่มผู้อนุมัติ", "เปลี่ยน status → approved", "ส่ง notification ไป visitor + host"],
    },
    {
      method: "POST",
      path: "/api/appointments/:id/reject",
      summary: "ปฏิเสธนัดหมาย",
      summaryEn: "Reject appointment",
      auth: "user",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Appointment ID" },
      ],
      requestBody: [
        { name: "reason", type: "string", required: true, description: "เหตุผลที่ปฏิเสธ" },
      ],
      notes: ["เฉพาะ supervisor/admin หรือสมาชิกกลุ่มผู้อนุมัติ", "เปลี่ยน status → rejected", "ส่ง notification ไป visitor + host"],
    },
    {
      method: "POST",
      path: "/api/appointments/:id/cancel",
      summary: "ยกเลิกนัดหมาย",
      summaryEn: "Cancel appointment",
      auth: "user",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Appointment ID" },
      ],
      requestBody: [
        { name: "reason", type: "string", required: false, description: "เหตุผลยกเลิก" },
      ],
      notes: ["host หรือ admin สามารถยกเลิกได้", "เปลี่ยน status → cancelled"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 16. Search
// ════════════════════════════════════════════════════

const searchApi: PageApiDoc = {
  pageId: "search",
  menuName: "ค้นหาผู้เยี่ยม/ผู้ติดต่อ",
  menuNameEn: "Search Visitors/Contacts",
  baseUrl: "/api/search",
  endpoints: [
    {
      method: "GET",
      path: "/api/search/visitors",
      summary: "ค้นหาผู้เยี่ยม",
      summaryEn: "Search visitors",
      auth: "user",
      queryParams: [
        { name: "q", type: "string", required: true, description: "คำค้นหา (ชื่อ / เบอร์โทร / อีเมล / บัตรประชาชน)" },
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 10,
      "name": "จิรภัทร์ เยี่ยมชม",
      "email": "jiraphat@example.com",
      "phone": "089-123-4567",
      "company": "บริษัท ทดสอบ จำกัด",
      "total_visits": 5,
      "last_visit_date": "2026-03-20",
      "is_blocklisted": false
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20
}`,
    },
    {
      method: "GET",
      path: "/api/search/contacts",
      summary: "ค้นหาผู้ติดต่อ (พนักงาน/Host)",
      summaryEn: "Search contacts (staff/host)",
      auth: "user",
      queryParams: [
        { name: "q", type: "string", required: true, description: "คำค้นหา (ชื่อ / แผนก / รหัสพนักงาน)" },
        { name: "department_id", type: "number", required: false, description: "กรองตามแผนก" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 4,
      "employee_code": "EMP-001",
      "name": "สมชาย ทำงานดี",
      "department": "กองบริหาร",
      "position": "เจ้าหน้าที่บริหารงานทั่วไป",
      "phone": "02-283-1510",
      "email": "somchai@mots.go.th"
    }
  ],
  "total": 1
}`,
    },
    {
      method: "GET",
      path: "/api/search/appointments",
      summary: "ค้นหานัดหมาย",
      summaryEn: "Search appointments",
      auth: "user",
      queryParams: [
        { name: "q", type: "string", required: true, description: "คำค้นหา (รหัสนัดหมาย / ชื่อผู้เยี่ยม / host)" },
        { name: "status", type: "string", required: false, description: "กรองตามสถานะ" },
        { name: "date_from", type: "string", required: false, description: "วันที่เริ่มต้น (YYYY-MM-DD)" },
        { name: "date_to", type: "string", required: false, description: "วันที่สิ้นสุด (YYYY-MM-DD)" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "appointment_code": "VMS-2026-0001",
      "visitor_name": "จิรภัทร์ เยี่ยมชม",
      "host_name": "สมชาย ทำงานดี",
      "visit_date": "2026-03-25",
      "status": "approved"
    }
  ],
  "total": 1
}`,
    },
  ],
};

// ════════════════════════════════════════════════════
// 17. Blocklist
// ════════════════════════════════════════════════════

const blocklistApi: PageApiDoc = {
  pageId: "blocklist",
  menuName: "บัญชีดำ (Blocklist)",
  menuNameEn: "Blocklist",
  baseUrl: "/api/blocklist",
  endpoints: [
    {
      method: "GET",
      path: "/api/blocklist",
      summary: "ดึงรายชื่อ Blocklist ทั้งหมด",
      summaryEn: "List all blocklisted entries",
      auth: "admin",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า (default: 20)" },
        { name: "search", type: "string", required: false, description: "ค้นหาชื่อ / เลขบัตร / บริษัท" },
        { name: "is_active", type: "boolean", required: false, description: "กรอง: true = บล็อกอยู่" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "name": "นายทดสอบ ต้องห้าม",
      "id_card_number": "1-1234-56789-01-0",
      "company": "บริษัท ไม่ดี จำกัด",
      "reason": "พฤติกรรมไม่เหมาะสม ขโมยทรัพย์สิน",
      "blocked_by": "อนันต์ มั่นคง",
      "blocked_at": "2026-02-10T09:00:00Z",
      "expires_at": null,
      "is_active": true
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20
}`,
    },
    {
      method: "POST",
      path: "/api/blocklist",
      summary: "เพิ่มรายชื่อใน Blocklist",
      summaryEn: "Add to blocklist",
      auth: "admin",
      requestBody: [
        { name: "name", type: "string", required: true, description: "ชื่อ-นามสกุล" },
        { name: "id_card_number", type: "string", required: false, description: "เลขบัตรประชาชน/พาสปอร์ต" },
        { name: "company", type: "string", required: false, description: "บริษัท" },
        { name: "reason", type: "string", required: true, description: "เหตุผลที่บล็อก" },
        { name: "expires_at", type: "string", required: false, description: "วันหมดอายุ (null = ถาวร)" },
      ],
      notes: ["ตรวจซ้ำด้วย id_card_number", "ถ้ามีนัดหมายที่ approved อยู่ → ยกเลิกอัตโนมัติ"],
    },
    {
      method: "PUT",
      path: "/api/blocklist/:id",
      summary: "แก้ไขรายการ Blocklist",
      summaryEn: "Update blocklist entry",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Blocklist ID" },
      ],
      requestBody: [
        { name: "reason", type: "string", required: false, description: "เหตุผล" },
        { name: "expires_at", type: "string", required: false, description: "วันหมดอายุ" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดการบล็อก" },
      ],
    },
    {
      method: "POST",
      path: "/api/blocklist/check",
      summary: "ตรวจสอบชื่อ-นามสกุลกับ Blocklist (ใช้โดย Kiosk/Counter)",
      summaryEn: "Check name against blocklist",
      auth: "admin",
      requestBody: [
        { name: "first_name", type: "string", required: true, description: "ชื่อ" },
        { name: "last_name", type: "string", required: true, description: "นามสกุล" },
        { name: "channel", type: "string", required: true, description: "ช่องทาง: kiosk | counter | web | line" },
        { name: "checked_by", type: "number", required: false, description: "รหัสเจ้าหน้าที่ (counter only)" },
      ],
      responseExample: `{
  "is_blocked": true,
  "entry": {
    "id": 1,
    "first_name": "สุรศักดิ์",
    "last_name": "อันตราย",
    "type": "permanent",
    "reason": "พฤติกรรมไม่เหมาะสม — ก่อความวุ่นวายในพื้นที่",
    "expiry_date": null,
    "added_by": "อนันต์ มั่นคง",
    "added_at": "2569-01-16T10:00:00Z"
  },
  "check_logged": true
}`,
      notes: [
        "ตรวจ partial match (case-insensitive) กับทั้งชื่อไทยและอังกฤษ",
        "ไม่ตรวจเลขบัตร — ระบบเก็บเฉพาะ mask (หลักหน้า+4หลักท้าย)",
        "ทุกครั้งที่ตรวจจะ log ใน blocklist_check_logs",
        "ถ้าพบ permanent → Kiosk แสดง error, Counter แสดง warning",
        "ถ้าพบ temporary + expired → อนุญาตดำเนินการต่อ",
      ],
    },
    {
      method: "DELETE",
      path: "/api/blocklist/:id",
      summary: "ลบรายชื่อออกจาก Blocklist",
      summaryEn: "Remove from blocklist",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Blocklist ID" },
      ],
      notes: ["บันทึก audit_log ว่าใครลบ"],
    },
  ],
};

// ════════════════════════════════════════════════════
// 18. Reports
// ════════════════════════════════════════════════════

const reportsApi: PageApiDoc = {
  pageId: "reports",
  menuName: "รายงาน / สถิติ",
  menuNameEn: "Reports & Analytics",
  baseUrl: "/api/reports",
  endpoints: [
    {
      method: "GET",
      path: "/api/reports/visits",
      summary: "รายงานการเข้าเยี่ยม",
      summaryEn: "Visit report",
      auth: "admin",
      queryParams: [
        { name: "date_from", type: "string", required: true, description: "วันที่เริ่มต้น (YYYY-MM-DD)" },
        { name: "date_to", type: "string", required: true, description: "วันที่สิ้นสุด (YYYY-MM-DD)" },
        { name: "group_by", type: "string", required: false, description: "จัดกลุ่ม: day | week | month" },
        { name: "purpose_id", type: "number", required: false, description: "กรองตามวัตถุประสงค์" },
        { name: "building_id", type: "number", required: false, description: "กรองตามอาคาร" },
      ],
      responseExample: `{
  "summary": {
    "total_visits": 245,
    "total_visitors": 180,
    "avg_duration_minutes": 95,
    "peak_hour": "10:00",
    "approval_rate": 92.5
  },
  "by_period": [
    { "date": "2026-03-01", "visits": 12, "unique_visitors": 10 },
    { "date": "2026-03-02", "visits": 8, "unique_visitors": 7 }
  ],
  "by_purpose": [
    { "purpose": "ประชุม/สัมมนา", "count": 120 },
    { "purpose": "ติดต่อราชการ", "count": 85 }
  ]
}`,
    },
    {
      method: "GET",
      path: "/api/reports/visitors",
      summary: "รายงานผู้เยี่ยมถี่",
      summaryEn: "Frequent visitors report",
      auth: "admin",
      queryParams: [
        { name: "date_from", type: "string", required: true, description: "วันที่เริ่มต้น" },
        { name: "date_to", type: "string", required: true, description: "วันที่สิ้นสุด" },
        { name: "min_visits", type: "number", required: false, description: "จำนวนครั้งขั้นต่ำ (default: 3)" },
        { name: "limit", type: "number", required: false, description: "จำนวนผลลัพธ์ (default: 50)" },
      ],
      responseExample: `{
  "data": [
    {
      "visitor_name": "จิรภัทร์ เยี่ยมชม",
      "company": "บริษัท ทดสอบ จำกัด",
      "total_visits": 15,
      "last_visit": "2026-03-25",
      "avg_duration_minutes": 120
    }
  ]
}`,
    },
    {
      method: "GET",
      path: "/api/reports/export",
      summary: "ส่งออกรายงาน (Excel/CSV)",
      summaryEn: "Export report (Excel/CSV)",
      auth: "admin",
      queryParams: [
        { name: "report_type", type: "string", required: true, description: "visits | visitors | appointments | blocklist" },
        { name: "format", type: "string", required: true, description: "xlsx | csv" },
        { name: "date_from", type: "string", required: true, description: "วันที่เริ่มต้น (YYYY-MM-DD)" },
        { name: "date_to", type: "string", required: true, description: "วันที่สิ้นสุด (YYYY-MM-DD)" },
      ],
      notes: ["คืน file download (Content-Disposition: attachment)", "จำกัดช่วงวันที่ไม่เกิน 365 วัน"],
    },
    {
      method: "GET",
      path: "/api/reports/audit-log",
      summary: "ดึง Audit Log",
      summaryEn: "Get audit log",
      auth: "admin",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า" },
        { name: "user_id", type: "number", required: false, description: "กรองตาม User ID" },
        { name: "action", type: "string", required: false, description: "กรองตาม action เช่น create, update, delete, login" },
        { name: "date_from", type: "string", required: false, description: "วันที่เริ่มต้น" },
        { name: "date_to", type: "string", required: false, description: "วันที่สิ้นสุด" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 100,
      "user_id": 1,
      "user_name": "อนันต์ มั่นคง",
      "action": "update",
      "resource": "appointment",
      "resource_id": 25,
      "details": "เปลี่ยนสถานะ pending → approved",
      "ip_address": "192.168.1.50",
      "created_at": "2026-03-25T09:15:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}`,
    },
  ],
};

// ════════════════════════════════════════════════════
// 19. Dashboard
// ════════════════════════════════════════════════════

const dashboardApi: PageApiDoc = {
  pageId: "dashboard",
  menuName: "แดชบอร์ด",
  menuNameEn: "Dashboard",
  baseUrl: "/api/dashboard",
  endpoints: [
    {
      method: "GET",
      path: "/api/dashboard/kpis",
      summary: "ดึง KPI สรุปภาพรวม",
      summaryEn: "Get dashboard KPIs",
      auth: "user",
      responseExample: `{
  "today": {
    "total_appointments": 18,
    "checked_in": 12,
    "checked_out": 5,
    "pending_approval": 3,
    "currently_in_building": 7
  },
  "this_week": {
    "total_appointments": 85,
    "approval_rate": 94.2,
    "avg_wait_time_minutes": 8
  },
  "this_month": {
    "total_appointments": 245,
    "total_unique_visitors": 180,
    "busiest_day": "2026-03-15",
    "busiest_day_count": 22
  }
}`,
    },
    {
      method: "GET",
      path: "/api/dashboard/today",
      summary: "ดึงข้อมูลนัดหมายวันนี้",
      summaryEn: "Get today's appointments",
      auth: "user",
      queryParams: [
        { name: "status", type: "string", required: false, description: "กรอง: pending | approved | checked_in" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 50,
      "appointment_code": "VMS-2026-0050",
      "visitor_name": "จิรภัทร์ เยี่ยมชม",
      "host_name": "สมชาย ทำงานดี",
      "purpose": "ประชุม/สัมมนา",
      "time_start": "10:00",
      "time_end": "12:00",
      "status": "approved",
      "location": "อาคาร กท. ชั้น 3"
    }
  ],
  "total": 18
}`,
    },
    {
      method: "GET",
      path: "/api/dashboard/chart/visits-by-hour",
      summary: "กราฟจำนวนผู้เยี่ยมตามชั่วโมง",
      summaryEn: "Visits by hour chart data",
      auth: "user",
      queryParams: [
        { name: "date", type: "string", required: false, description: "วันที่ (default: วันนี้)" },
      ],
      responseExample: `{
  "labels": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
  "datasets": [
    { "label": "Check-in", "data": [2, 5, 8, 3, 1, 4, 6, 2, 1] },
    { "label": "Check-out", "data": [0, 1, 2, 4, 3, 1, 2, 5, 3] }
  ]
}`,
    },
    {
      method: "GET",
      path: "/api/dashboard/chart/visits-by-purpose",
      summary: "กราฟสัดส่วนวัตถุประสงค์",
      summaryEn: "Visits by purpose chart data",
      auth: "user",
      queryParams: [
        { name: "date_from", type: "string", required: false, description: "วันที่เริ่มต้น (default: 7 วันย้อนหลัง)" },
        { name: "date_to", type: "string", required: false, description: "วันที่สิ้นสุด (default: วันนี้)" },
      ],
      responseExample: `{
  "data": [
    { "purpose": "ประชุม/สัมมนา", "count": 45, "percentage": 48.9 },
    { "purpose": "ติดต่อราชการ", "count": 30, "percentage": 32.6 },
    { "purpose": "ส่งเอกสาร", "count": 10, "percentage": 10.9 },
    { "purpose": "อื่นๆ", "count": 7, "percentage": 7.6 }
  ]
}`,
    },
  ],
};

// ════════════════════════════════════════════════════
// 20. Email System
// ════════════════════════════════════════════════════

const emailSystemApi: PageApiDoc = {
  pageId: "email-system",
  menuName: "ตั้งค่า Email / SMTP",
  menuNameEn: "Email / SMTP Settings",
  baseUrl: "/api/email-system",
  endpoints: [
    {
      method: "GET",
      path: "/api/email-system/config",
      summary: "ดึงการตั้งค่า SMTP ปัจจุบัน",
      summaryEn: "Get SMTP configuration",
      auth: "admin",
      responseExample: `{
  "smtp_host": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_secure": true,
  "smtp_user": "vms-noreply@mots.go.th",
  "smtp_password_set": true,
  "from_name": "VMS กระทรวงการท่องเที่ยวและกีฬา",
  "from_email": "vms-noreply@mots.go.th",
  "reply_to": "admin@mots.go.th",
  "is_active": true,
  "last_test_at": "2026-03-20T10:00:00Z",
  "last_test_status": "success"
}`,
      notes: ["ไม่ส่ง smtp_password จริง — ส่ง smtp_password_set: true/false แทน"],
    },
    {
      method: "PUT",
      path: "/api/email-system/config",
      summary: "อัปเดตการตั้งค่า SMTP",
      summaryEn: "Update SMTP configuration",
      auth: "admin",
      requestBody: [
        { name: "smtp_host", type: "string", required: false, description: "SMTP server host" },
        { name: "smtp_port", type: "number", required: false, description: "SMTP port (587, 465, 25)" },
        { name: "smtp_secure", type: "boolean", required: false, description: "ใช้ TLS/SSL" },
        { name: "smtp_user", type: "string", required: false, description: "SMTP username" },
        { name: "smtp_password", type: "string", required: false, description: "SMTP password (เข้ารหัสก่อนบันทึก)" },
        { name: "from_name", type: "string", required: false, description: "ชื่อผู้ส่ง" },
        { name: "from_email", type: "string", required: false, description: "อีเมลผู้ส่ง" },
        { name: "reply_to", type: "string", required: false, description: "Reply-To email" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดระบบส่งอีเมล" },
      ],
      notes: ["smtp_password เข้ารหัส AES-256 ก่อนบันทึก", "บันทึก audit_log"],
    },
    {
      method: "POST",
      path: "/api/email-system/test",
      summary: "ส่งอีเมลทดสอบ",
      summaryEn: "Send test email",
      auth: "admin",
      requestBody: [
        { name: "to_email", type: "string", required: true, description: "อีเมลปลายทาง" },
      ],
      responseExample: `{
  "success": true,
  "message": "ส่งอีเมลทดสอบสำเร็จ",
  "sent_at": "2026-03-25T10:00:00Z",
  "message_id": "<abc123@smtp.office365.com>"
}`,
      notes: ["ใช้การตั้งค่าปัจจุบัน", "timeout 30 วินาที", "บันทึก last_test_at + last_test_status"],
    },
    {
      method: "GET",
      path: "/api/email-system/logs",
      summary: "ดึง log การส่งอีเมล",
      summaryEn: "Get email send logs",
      auth: "admin",
      queryParams: [
        { name: "page", type: "number", required: false, description: "หน้าที่ต้องการ" },
        { name: "limit", type: "number", required: false, description: "จำนวนต่อหน้า" },
        { name: "status", type: "string", required: false, description: "กรอง: success | failed" },
        { name: "date_from", type: "string", required: false, description: "วันที่เริ่มต้น" },
        { name: "date_to", type: "string", required: false, description: "วันที่สิ้นสุด" },
      ],
      responseExample: `{
  "data": [
    {
      "id": 1,
      "to_email": "jiraphat@example.com",
      "subject": "นัดหมายของท่านได้รับอนุมัติ - VMS-2026-0001",
      "template_name": "appointment_approved",
      "status": "success",
      "sent_at": "2026-03-25T09:30:00Z",
      "error_message": null
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 20
}`,
    },
  ],
};

// ════════════════════════════════════════════════════
// 21. LINE OA Config
// ════════════════════════════════════════════════════

const lineOaConfigApi: PageApiDoc = {
  pageId: "line-oa-config",
  menuName: "ตั้งค่า LINE OA",
  menuNameEn: "LINE OA Configuration",
  baseUrl: "/api/line-oa-config",
  endpoints: [
    {
      method: "GET",
      path: "/api/line-oa-config",
      summary: "ดึงการตั้งค่า LINE OA ปัจจุบัน",
      summaryEn: "Get LINE OA configuration",
      auth: "admin",
      responseExample: `{
  "channel_id": "1234567890",
  "channel_secret_set": true,
  "channel_access_token_set": true,
  "liff_id": "1234567890-abcdefgh",
  "webhook_url": "https://vms.mots.go.th/api/line/webhook",
  "bot_basic_id": "@motsvms",
  "bot_display_name": "VMS กท.",
  "is_active": true,
  "rich_menu_id": "richmenu-abc123",
  "greeting_message": "สวัสดีครับ ยินดีต้อนรับสู่ระบบนัดหมาย กระทรวงการท่องเที่ยวและกีฬา",
  "last_webhook_at": "2026-03-25T09:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z"
}`,
      notes: ["ไม่ส่ง channel_secret / channel_access_token จริง — ส่ง _set: true/false แทน"],
    },
    {
      method: "PUT",
      path: "/api/line-oa-config",
      summary: "อัปเดตการตั้งค่า LINE OA",
      summaryEn: "Update LINE OA configuration",
      auth: "admin",
      requestBody: [
        { name: "channel_id", type: "string", required: false, description: "LINE Channel ID" },
        { name: "channel_secret", type: "string", required: false, description: "LINE Channel Secret (เข้ารหัสก่อนบันทึก)" },
        { name: "channel_access_token", type: "string", required: false, description: "LINE Channel Access Token (เข้ารหัสก่อนบันทึก)" },
        { name: "liff_id", type: "string", required: false, description: "LIFF App ID" },
        { name: "greeting_message", type: "string", required: false, description: "ข้อความต้อนรับ" },
        { name: "rich_menu_id", type: "string", required: false, description: "Rich Menu ID" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดระบบ LINE OA" },
      ],
      notes: ["channel_secret, channel_access_token เข้ารหัส AES-256 ก่อนบันทึก", "บันทึก audit_log"],
    },
    {
      method: "POST",
      path: "/api/line-oa-config/test",
      summary: "ทดสอบส่งข้อความ LINE",
      summaryEn: "Send test LINE message",
      auth: "admin",
      requestBody: [
        { name: "to_user_id", type: "string", required: true, description: "LINE User ID ปลายทาง" },
        { name: "message", type: "string", required: false, description: "ข้อความทดสอบ (default: ข้อความทดสอบระบบ)" },
      ],
      responseExample: `{
  "success": true,
  "message": "ส่งข้อความทดสอบสำเร็จ",
  "sent_at": "2026-03-25T10:05:00Z"
}`,
      notes: ["ใช้ Push Message API", "ตรวจว่า to_user_id ได้ follow bot แล้ว"],
    },
    {
      method: "POST",
      path: "/api/line-oa-config/verify-webhook",
      summary: "ตรวจสอบ Webhook URL",
      summaryEn: "Verify webhook URL",
      auth: "admin",
      responseExample: `{
  "success": true,
  "webhook_url": "https://vms.mots.go.th/api/line/webhook",
  "is_valid": true,
  "verified_at": "2026-03-25T10:06:00Z"
}`,
      notes: ["เรียก LINE API verify webhook endpoint", "ตรวจว่า webhook URL ถูกต้องและรับ request ได้"],
    },
  ],
};

// ════════════════════════════════════════════════════
// LINE Message Templates + System Settings API
// ════════════════════════════════════════════════════

const lineMessageTemplatesApi: PageApiDoc = {
  pageId: "line-message-templates",
  menuName: "LINE OA & การแจ้งเตือน",
  menuNameEn: "LINE OA & Notifications",
  baseUrl: "/api",
  endpoints: [
    {
      method: "GET",
      path: "/api/settings/line-flex-templates",
      summary: "ดึง Flex Message template ทั้งหมด",
      summaryEn: "List all LINE Flex Message templates",
      auth: "admin",
      responseExample: `{
  "data": [
    {
      "id": 1,
      "state_id": "visitor-registered",
      "name": "ลงทะเบียนสำเร็จ",
      "type": "flex",
      "is_active": true,
      "header_title": "Registration Complete",
      "header_color": "green",
      "header_variant": "standard",
      "rows": [
        { "id": "r1", "label": "ชื่อ", "variable": "visitorName", "enabled": true }
      ],
      "buttons": [
        { "id": "b1", "label": "สร้างนัดหมาย", "variant": "green", "enabled": true }
      ]
    }
  ],
  "total": 17
}`,
    },
    {
      method: "PUT",
      path: "/api/settings/line-flex-templates/:stateId",
      summary: "แก้ไข Flex Message template ตาม state",
      summaryEn: "Update LINE Flex Message template by state ID",
      auth: "admin",
      pathParams: [
        { name: "stateId", type: "string", required: true, description: "LINE flow state ID (e.g. visitor-registered)" },
      ],
      requestBody: [
        { name: "header_title", type: "string", required: false, description: "ข้อความหัวข้อ" },
        { name: "header_color", type: "string", required: false, description: "สี: primary|green|orange|red|blue" },
        { name: "header_variant", type: "string", required: false, description: "รูปแบบ header" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
        { name: "rows", type: "object[]", required: false, description: "Body rows array" },
        { name: "buttons", type: "object[]", required: false, description: "Buttons array" },
        { name: "info_box", type: "object", required: false, description: "Info box config" },
        { name: "show_qr_code", type: "boolean", required: false, description: "แสดง QR Code" },
      ],
      responseExample: `{ "status": "updated", "state_id": "visitor-registered", "updated_at": "2026-03-30T12:00:00Z" }`,
    },
    {
      method: "GET",
      path: "/api/settings/system",
      summary: "ดึง System Settings (approval timeout, auto-cancel)",
      summaryEn: "Get system settings",
      auth: "admin",
      responseExample: `{
  "data": {
    "approval_timeout_hours": 24,
    "auto_cancel_on_date_passed": true
  }
}`,
    },
    {
      method: "PUT",
      path: "/api/settings/system",
      summary: "แก้ไข System Settings",
      summaryEn: "Update system settings",
      auth: "admin",
      requestBody: [
        { name: "approval_timeout_hours", type: "number", required: false, description: "ชั่วโมงรออนุมัติ (1-168)" },
        { name: "auto_cancel_on_date_passed", type: "boolean", required: false, description: "ยกเลิกเมื่อวันนัดผ่าน" },
      ],
      responseExample: `{ "status": "updated", "updated_at": "2026-03-30T12:00:00Z" }`,
    },
    {
      method: "GET",
      path: "/api/settings/email-templates",
      summary: "ดึง Email notification templates ทั้งหมด",
      summaryEn: "List all email notification templates",
      auth: "admin",
      responseExample: `{
  "data": [
    {
      "id": 1,
      "trigger_event": "booking-confirmed",
      "name": "ยืนยันการจอง",
      "is_active": true,
      "subject": "ยืนยันการจอง — {{bookingCode}}",
      "body_th": "เรียน คุณ{{visitorName}}...",
      "variables": ["visitorName", "bookingCode", "date", "time"]
    }
  ],
  "total": 7
}`,
    },
    {
      method: "PUT",
      path: "/api/settings/email-templates/:id",
      summary: "แก้ไข Email template",
      summaryEn: "Update email notification template",
      auth: "admin",
      pathParams: [
        { name: "id", type: "number", required: true, description: "Template ID" },
      ],
      requestBody: [
        { name: "subject", type: "string", required: false, description: "หัวข้ออีเมล" },
        { name: "body_th", type: "string", required: false, description: "เนื้อหาภาษาไทย" },
        { name: "body_en", type: "string", required: false, description: "เนื้อหาภาษาอังกฤษ" },
        { name: "is_active", type: "boolean", required: false, description: "เปิด/ปิดใช้งาน" },
      ],
      responseExample: `{ "status": "updated", "id": 1, "updated_at": "2026-03-30T12:00:00Z" }`,
    },
    {
      method: "POST",
      path: "/api/settings/email-templates/test",
      summary: "ทดสอบส่ง Email template",
      summaryEn: "Send test email",
      auth: "admin",
      requestBody: [
        { name: "template_id", type: "number", required: true, description: "Template ID ที่ต้องการทดสอบ" },
        { name: "to_email", type: "string", required: true, description: "อีเมลปลายทาง" },
      ],
      responseExample: `{ "status": "sent", "to": "test@example.com", "sent_at": "2026-03-30T12:00:00Z" }`,
    },
  ],
};

// ════════════════════════════════════════════════════
// EXPORT & LOOKUP
// ════════════════════════════════════════════════════

export const allApiDocs: PageApiDoc[] = [
  userManagementApi,
  myProfileApi,
  authApi,
  visitPurposesApi,
  locationsApi,
  accessZonesApi,
  approverGroupsApi,
  staffApi,
  servicePointsApi,
  documentTypesApi,
  businessHoursApi,
  notificationTemplatesApi,
  visitSlipsApi,
  pdpaConsentApi,
  appointmentsApi,
  searchApi,
  blocklistApi,
  reportsApi,
  dashboardApi,
  emailSystemApi,
  lineOaConfigApi,
  lineMessageTemplatesApi,
];

export function getApiDocByPageId(pageId: string): PageApiDoc | undefined {
  return allApiDocs.find((d) => d.pageId === pageId);
}
