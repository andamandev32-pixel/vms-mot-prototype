// ===== eVMS DATABASE SCHEMA DEFINITION =====
// สำหรับ DEV Reference: แต่ละเมนูตั้งค่า ใช้ตารางอะไรบ้าง
// พร้อม seed data จาก mock-up

// ===== TYPES =====

export interface ColumnDef {
  name: string;           // ชื่อคอลัมน์
  type: string;           // ประเภทข้อมูล (SQL)
  nullable: boolean;      // อนุญาตค่าว่าง
  comment: string;        // คำอธิบายภาษาไทย
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: string;    // ตาราง.คอลัมน์ ที่อ้างอิง
  defaultValue?: string;
  isUnique?: boolean;
}

export interface TableDef {
  name: string;           // ชื่อตาราง
  comment: string;        // คำอธิบายภาษาไทย
  columns: ColumnDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seedData: Record<string, any>[];
}

export interface PageSchema {
  pageId: string;         // รหัสหน้า
  menuName: string;       // ชื่อเมนูภาษาไทย
  menuNameEn: string;     // ชื่อเมนูภาษาอังกฤษ
  path: string;           // URL path
  description: string;    // คำอธิบายหน้า
  tables: TableDef[];
  relationships: string[]; // ความสัมพันธ์ระหว่างตาราง
}

// ════════════════════════════════════════════════════
// 1. วัตถุประสงค์เข้าพื้นที่ (Visit Purposes)
// ════════════════════════════════════════════════════

const visitPurposesSchema: PageSchema = {
  pageId: "visit-purposes",
  menuName: "วัตถุประสงค์เข้าพื้นที่",
  menuNameEn: "Visit Purposes",
  path: "/web/settings/visit-purposes",
  description: "กำหนดวัตถุประสงค์การเข้าพื้นที่ พร้อมเงื่อนไขแต่ละแผนก และช่องทางการเข้า (Kiosk/Counter)",
  tables: [
    {
      name: "visit_purposes",
      comment: "ตารางวัตถุประสงค์การเข้าพื้นที่หลัก",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสวัตถุประสงค์ (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อวัตถุประสงค์ (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อวัตถุประสงค์ (ภาษาอังกฤษ)" },
        { name: "icon", type: "VARCHAR(10)", nullable: true, comment: "ไอคอน Emoji แสดงหน้าเมนู" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "allowed_entry_modes", type: "VARCHAR(50)", nullable: false, comment: "ประเภทการเข้าพื้นที่ที่อนุญาต (comma-separated: single,period)", defaultValue: "'single'" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผล (1=แรกสุด)" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "ติดต่อราชการ", name_en: "Official Business", icon: "🏛️", is_active: true, allowed_entry_modes: "single,period", sort_order: 1 },
        { id: 2, name: "ประชุม / สัมมนา", name_en: "Meeting / Seminar", icon: "📋", is_active: true, allowed_entry_modes: "single,period", sort_order: 2 },
        { id: 3, name: "ส่งเอกสาร / พัสดุ", name_en: "Document / Parcel Delivery", icon: "📄", is_active: true, allowed_entry_modes: "single", sort_order: 3 },
        { id: 4, name: "ผู้รับเหมา / ซ่อมบำรุง", name_en: "Contractor / Maintenance", icon: "🔧", is_active: true, allowed_entry_modes: "single,period", sort_order: 4 },
        { id: 5, name: "สมัครงาน / สัมภาษณ์", name_en: "Job Application / Interview", icon: "💼", is_active: true, allowed_entry_modes: "single", sort_order: 5 },
        { id: 6, name: "เยี่ยมชม / ศึกษาดูงาน", name_en: "Study Visit / Tour", icon: "🎓", is_active: true, allowed_entry_modes: "single,period", sort_order: 6 },
        { id: 7, name: "รับ-ส่งสินค้า", name_en: "Delivery / Pickup", icon: "📦", is_active: true, allowed_entry_modes: "single", sort_order: 7 },
        { id: 8, name: "อื่นๆ", name_en: "Other", icon: "🔖", is_active: false, allowed_entry_modes: "single", sort_order: 8 },
      ],
    },
    {
      name: "visit_purpose_department_rules",
      comment: "เงื่อนไขการเข้าพื้นที่ แยกตามแผนก (ของแต่ละวัตถุประสงค์)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id — แผนกที่ใช้กฎนี้", isForeignKey: true, references: "departments.id" },
        { name: "require_person_name", type: "BOOLEAN", nullable: false, comment: "ต้องระบุชื่อบุคคลที่ต้องการพบ", defaultValue: "false" },
        { name: "require_approval", type: "BOOLEAN", nullable: false, comment: "ต้องมีการอนุมัติก่อนเข้าพื้นที่", defaultValue: "false" },
        { name: "approver_group_id", type: "INT", nullable: true, comment: "FK → approver_groups.id — กลุ่มผู้อนุมัติ (ใช้เมื่อ require_approval=true)", isForeignKey: true, references: "approver_groups.id" },
        { name: "offer_wifi", type: "BOOLEAN", nullable: false, comment: "เสนอ WiFi Credentials ให้ผู้เข้าเยี่ยม", defaultValue: "false" },
        { name: "show_on_line", type: "BOOLEAN", nullable: false, comment: "แสดงตัวเลือกนี้บน LINE OA + Web App", defaultValue: "true" },
        { name: "show_on_kiosk", type: "BOOLEAN", nullable: false, comment: "แสดงตัวเลือกนี้บน Kiosk", defaultValue: "true" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
      ],
      seedData: [
        // vpc-1: ติดต่อราชการ
        { id: 1, visit_purpose_id: 1, department_id: 1, require_person_name: true, require_approval: true, approver_group_id: 1, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 2, visit_purpose_id: 1, department_id: 2, require_person_name: true, require_approval: true, approver_group_id: 3, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 3, visit_purpose_id: 1, department_id: 3, require_person_name: true, require_approval: true, approver_group_id: 5, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 4, visit_purpose_id: 1, department_id: 4, require_person_name: true, require_approval: true, approver_group_id: 6, offer_wifi: false, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 5, visit_purpose_id: 1, department_id: 5, require_person_name: true, require_approval: false, approver_group_id: null, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 6, visit_purpose_id: 1, department_id: 8, require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 7, visit_purpose_id: 1, department_id: 9, require_person_name: true, require_approval: true, approver_group_id: 10, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        // vpc-2: ประชุม / สัมมนา
        { id: 8, visit_purpose_id: 2, department_id: 1, require_person_name: true, require_approval: true, approver_group_id: 1, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 9, visit_purpose_id: 2, department_id: 3, require_person_name: true, require_approval: true, approver_group_id: 5, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 10, visit_purpose_id: 2, department_id: 4, require_person_name: true, require_approval: false, approver_group_id: null, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 11, visit_purpose_id: 2, department_id: 9, require_person_name: true, require_approval: true, approver_group_id: 10, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        // vpc-3: ส่งเอกสาร / พัสดุ
        { id: 12, visit_purpose_id: 3, department_id: 1, require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 13, visit_purpose_id: 3, department_id: 2, require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 14, visit_purpose_id: 3, department_id: 4, require_person_name: true, require_approval: true, approver_group_id: 6, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        // vpc-4: ผู้รับเหมา
        { id: 15, visit_purpose_id: 4, department_id: 2, require_person_name: false, require_approval: true, approver_group_id: 4, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        { id: 16, visit_purpose_id: 4, department_id: 6, require_person_name: false, require_approval: true, approver_group_id: 9, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        // vpc-5: สมัครงาน
        { id: 17, visit_purpose_id: 5, department_id: 2, require_person_name: true, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        // vpc-6: เยี่ยมชม
        { id: 18, visit_purpose_id: 6, department_id: 4, require_person_name: true, require_approval: true, approver_group_id: 7, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 19, visit_purpose_id: 6, department_id: 5, require_person_name: true, require_approval: true, approver_group_id: 8, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 20, visit_purpose_id: 6, department_id: 7, require_person_name: false, require_approval: true, approver_group_id: null, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: false },
        // vpc-7: รับ-ส่งสินค้า
        { id: 21, visit_purpose_id: 7, department_id: 1, require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        { id: 22, visit_purpose_id: 7, department_id: 2, require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        { id: 23, visit_purpose_id: 7, department_id: 4, require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        // vpc-8: อื่นๆ
        { id: 24, visit_purpose_id: 8, department_id: 1, require_person_name: false, require_approval: true, approver_group_id: 2, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 25, visit_purpose_id: 8, department_id: 2, require_person_name: false, require_approval: true, approver_group_id: 3, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
      ],
    },
    {
      name: "visit_purpose_channel_configs",
      comment: "ตั้งค่าช่องทางเข้า (Kiosk / Counter) ของแต่ละวัตถุประสงค์ — เอกสารที่รับ และการถ่ายรูป",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
        { name: "channel", type: "ENUM('kiosk','counter')", nullable: false, comment: "ช่องทาง: kiosk = ตู้อัตโนมัติ / counter = เคาน์เตอร์ รปภ." },
        { name: "require_photo", type: "BOOLEAN", nullable: false, comment: "ต้องถ่ายภาพใบหน้า", defaultValue: "false" },
      ],
      seedData: [
        // vpc-1
        { id: 1, visit_purpose_id: 1, channel: "kiosk", require_photo: true },
        { id: 2, visit_purpose_id: 1, channel: "counter", require_photo: true },
        // vpc-2
        { id: 3, visit_purpose_id: 2, channel: "kiosk", require_photo: true },
        { id: 4, visit_purpose_id: 2, channel: "counter", require_photo: false },
        // vpc-3
        { id: 5, visit_purpose_id: 3, channel: "kiosk", require_photo: true },
        { id: 6, visit_purpose_id: 3, channel: "counter", require_photo: false },
        // vpc-4
        { id: 7, visit_purpose_id: 4, channel: "kiosk", require_photo: true },
        { id: 8, visit_purpose_id: 4, channel: "counter", require_photo: true },
        // vpc-5
        { id: 9, visit_purpose_id: 5, channel: "kiosk", require_photo: true },
        { id: 10, visit_purpose_id: 5, channel: "counter", require_photo: true },
        // vpc-6
        { id: 11, visit_purpose_id: 6, channel: "kiosk", require_photo: true },
        { id: 12, visit_purpose_id: 6, channel: "counter", require_photo: false },
        // vpc-7
        { id: 13, visit_purpose_id: 7, channel: "kiosk", require_photo: false },
        { id: 14, visit_purpose_id: 7, channel: "counter", require_photo: false },
        // vpc-8
        { id: 15, visit_purpose_id: 8, channel: "kiosk", require_photo: false },
        { id: 16, visit_purpose_id: 8, channel: "counter", require_photo: false },
      ],
    },
    {
      name: "visit_purpose_channel_documents",
      comment: "เอกสารที่อนุญาตใช้ ณ แต่ละช่องทาง(Kiosk/Counter) ของแต่ละวัตถุประสงค์ (many-to-many)",
      columns: [
        { name: "channel_config_id", type: "INT", nullable: false, comment: "FK → visit_purpose_channel_configs.id", isPrimaryKey: true, isForeignKey: true, references: "visit_purpose_channel_configs.id" },
        { name: "identity_document_type_id", type: "INT", nullable: false, comment: "FK → identity_document_types.id — ประเภทเอกสารที่รับ", isPrimaryKey: true, isForeignKey: true, references: "identity_document_types.id" },
      ],
      seedData: [
        // vpc-1 kiosk: national-id, passport, gov-card, thai-id-app
        { channel_config_id: 1, identity_document_type_id: 1 },
        { channel_config_id: 1, identity_document_type_id: 2 },
        { channel_config_id: 1, identity_document_type_id: 4 },
        { channel_config_id: 1, identity_document_type_id: 5 },
        // vpc-1 counter: + driver-license
        { channel_config_id: 2, identity_document_type_id: 1 },
        { channel_config_id: 2, identity_document_type_id: 2 },
        { channel_config_id: 2, identity_document_type_id: 3 },
        { channel_config_id: 2, identity_document_type_id: 4 },
        { channel_config_id: 2, identity_document_type_id: 5 },
      ],
    },
  ],
  relationships: [
    "visit_purposes 1 ──→ N visit_purpose_department_rules (แต่ละวัตถุประสงค์มีเงื่อนไขหลายแผนก)",
    "visit_purposes 1 ──→ N visit_purpose_channel_configs (แต่ละวัตถุประสงค์มีตั้งค่า Kiosk + Counter)",
    "visit_purpose_channel_configs 1 ──→ N visit_purpose_channel_documents (แต่ละช่องทางรับเอกสารหลายประเภท)",
    "visit_purpose_department_rules N ──→ 1 departments (เงื่อนไขผูกกับแผนก)",
    "visit_purpose_department_rules N ──→ 1 approver_groups (กฎที่ต้องอนุมัติ อ้างอิงกลุ่มผู้อนุมัติ)",
  ],
};

// ════════════════════════════════════════════════════
// 2. สถานที่และแผนก (Locations)
// ════════════════════════════════════════════════════

const locationsSchema: PageSchema = {
  pageId: "locations",
  menuName: "สถานที่และแผนก",
  menuNameEn: "Locations & Departments",
  path: "/web/settings/locations",
  description: "จัดการอาคาร ชั้น และแผนก — รวมถึงการจับคู่แผนกกับชั้นที่ตั้ง",
  tables: [
    {
      name: "buildings",
      comment: "ตารางอาคาร (ในโปรเจกต์นี้มีอาคารเดียว)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสอาคาร (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่ออาคาร (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่ออาคาร (ภาษาอังกฤษ)" },
        { name: "total_floors", type: "INT", nullable: false, comment: "จำนวนชั้นทั้งหมด" },
        { name: "description", type: "TEXT", nullable: true, comment: "รายละเอียดเพิ่มเติม" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "ศูนย์ราชการ อาคาร C", name_en: "Government Center Building C", total_floors: 9, description: "กระทรวงการท่องเที่ยวและกีฬา — ทุกหน่วยงานในตึกเดียว", is_active: true },
      ],
    },
    {
      name: "floors",
      comment: "ตารางชั้นในอาคาร",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสชั้น (PK)", isPrimaryKey: true },
        { name: "building_id", type: "INT", nullable: false, comment: "FK → buildings.id — อาคารที่ชั้นนี้อยู่", isForeignKey: true, references: "buildings.id" },
        { name: "floor_number", type: "INT", nullable: false, comment: "หมายเลขชั้น (1, 2, 3, ...)" },
        { name: "name", type: "VARCHAR(150)", nullable: false, comment: "ชื่อชั้น (ไทย) เช่น 'ชั้น 1 — ล็อบบี้'" },
        { name: "name_en", type: "VARCHAR(150)", nullable: false, comment: "ชื่อชั้น (อังกฤษ)" },
      ],
      seedData: [
        { id: 1, building_id: 1, floor_number: 1, name: "ชั้น 1 — ล็อบบี้ / ประชาสัมพันธ์ / รปภ.", name_en: "1F — Lobby / Reception / Security" },
        { id: 2, building_id: 1, floor_number: 2, name: "ชั้น 2 — กองกลาง", name_en: "2F — General Admin" },
        { id: 3, building_id: 1, floor_number: 3, name: "ชั้น 3 — สำนักงานปลัด", name_en: "3F — OPS" },
        { id: 4, building_id: 1, floor_number: 4, name: "ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน", name_en: "4F — Tourism Affairs & Policy" },
        { id: 5, building_id: 1, floor_number: 5, name: "ชั้น 5 — กองการต่างประเทศ", name_en: "5F — International Affairs" },
        { id: 6, building_id: 1, floor_number: 6, name: "ชั้น 6 — กรมการท่องเที่ยว / ททท.", name_en: "6F — Dept. of Tourism / TAT" },
        { id: 7, building_id: 1, floor_number: 7, name: "ชั้น 7 — กรมพลศึกษา / มกช.", name_en: "7F — Dept. of PE / NSU" },
        { id: 8, building_id: 1, floor_number: 8, name: "ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท.", name_en: "8F — SAT / Tourist Police / DASTA" },
        { id: 9, building_id: 1, floor_number: 9, name: "ชั้น 9 — สำนักงานรัฐมนตรี / ห้องประชุมอเนกประสงค์", name_en: "9F — Minister's Office / Conference" },
      ],
    },
    {
      name: "departments",
      comment: "ตารางแผนก / หน่วยงาน",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสแผนก (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(200)", nullable: false, comment: "ชื่อแผนก (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(200)", nullable: false, comment: "ชื่อแผนก (ภาษาอังกฤษ)" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "สำนักงานปลัดกระทรวง", name_en: "Office of the Permanent Secretary", is_active: true },
        { id: 2, name: "กองกลาง", name_en: "General Administration Division", is_active: true },
        { id: 3, name: "กองการต่างประเทศ", name_en: "International Affairs Division", is_active: true },
        { id: 4, name: "กองกิจการท่องเที่ยว", name_en: "Tourism Affairs Division", is_active: true },
        { id: 5, name: "กรมการท่องเที่ยว", name_en: "Department of Tourism", is_active: true },
        { id: 6, name: "กรมพลศึกษา", name_en: "Department of Physical Education", is_active: true },
        { id: 7, name: "การกีฬาแห่งประเทศไทย", name_en: "Sports Authority of Thailand", is_active: true },
        { id: 8, name: "สำนักนโยบายและแผน", name_en: "Policy and Planning Division", is_active: true },
        { id: 9, name: "สำนักงานรัฐมนตรี", name_en: "Minister's Office", is_active: true },
        { id: 10, name: "การท่องเที่ยวแห่งประเทศไทย", name_en: "Tourism Authority of Thailand", is_active: true },
        { id: 11, name: "มหาวิทยาลัยการกีฬาแห่งชาติ", name_en: "National Sports University", is_active: true },
        { id: 12, name: "กองบัญชาการตำรวจท่องเที่ยว", name_en: "Tourist Police Bureau", is_active: true },
        { id: 13, name: "องค์การบริหารการพัฒนาพื้นที่พิเศษเพื่อการท่องเที่ยวอย่างยั่งยืน (อพท.)", name_en: "DASTA", is_active: true },
      ],
    },
    {
      name: "floor_departments",
      comment: "ตารางเชื่อม ชั้น ↔ แผนก (Many-to-Many) — แผนกใดอยู่ชั้นไหน",
      columns: [
        { name: "floor_id", type: "INT", nullable: false, comment: "FK → floors.id", isPrimaryKey: true, isForeignKey: true, references: "floors.id" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id", isPrimaryKey: true, isForeignKey: true, references: "departments.id" },
      ],
      seedData: [
        { floor_id: 2, department_id: 2 },
        { floor_id: 3, department_id: 1 },
        { floor_id: 4, department_id: 4 },
        { floor_id: 4, department_id: 8 },
        { floor_id: 5, department_id: 3 },
        { floor_id: 6, department_id: 5 },
        { floor_id: 6, department_id: 10 },
        { floor_id: 7, department_id: 6 },
        { floor_id: 7, department_id: 11 },
        { floor_id: 8, department_id: 7 },
        { floor_id: 8, department_id: 12 },
        { floor_id: 8, department_id: 13 },
        { floor_id: 9, department_id: 9 },
      ],
    },
  ],
  relationships: [
    "buildings 1 ──→ N floors (อาคาร 1 หลัง มีหลายชั้น)",
    "floors N ←──→ N departments ผ่าน floor_departments (ชั้นมีหลายแผนก, แผนกอาจอยู่หลายชั้น)",
  ],
};

// ════════════════════════════════════════════════════
// 3. โซนเข้าพื้นที่ (Access Zones)
// ════════════════════════════════════════════════════

const accessZonesSchema: PageSchema = {
  pageId: "access-zones",
  menuName: "โซนเข้าพื้นที่",
  menuNameEn: "Access Zones",
  path: "/web/settings/access-zones",
  description: "จัดการโซนเข้าพื้นที่ (ประตู Hikvision), กลุ่มสิทธิ์การเข้าพื้นที่ (Access Groups), และการจับคู่แผนก ↔ กลุ่มสิทธิ์",
  tables: [
    {
      name: "access_zones",
      comment: "ตารางโซน/พื้นที่ที่ควบคุมด้วย Hikvision (ประตู/เครื่องอ่านบัตร)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสโซน (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อโซน (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อโซน (ภาษาอังกฤษ)" },
        { name: "floor_id", type: "INT", nullable: false, comment: "FK → floors.id — ชั้นที่โซนนี้อยู่", isForeignKey: true, references: "floors.id" },
        { name: "building_id", type: "INT", nullable: false, comment: "FK → buildings.id — อาคาร", isForeignKey: true, references: "buildings.id" },
        { name: "type", type: "ENUM('office','meeting-room','lobby','parking','common','restricted','service')", nullable: false, comment: "ประเภทโซน: office=สำนักงาน, meeting-room=ห้องประชุม, lobby=ล็อบบี้, parking=ที่จอดรถ, common=ส่วนกลาง, restricted=ควบคุม, service=ซ่อมบำรุง" },
        { name: "hikvision_door_id", type: "VARCHAR(50)", nullable: false, comment: "รหัสประตู Hikvision สำหรับ Integration", isUnique: true },
        { name: "description", type: "TEXT", nullable: true, comment: "รายละเอียดเพิ่มเติม" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "ล็อบบี้ ชั้น 1", name_en: "Lobby 1F", floor_id: 1, building_id: 1, type: "lobby", hikvision_door_id: "HIK-DOOR-C1-01", is_active: true },
        { id: 2, name: "ลานจอดรถ", name_en: "Parking", floor_id: 1, building_id: 1, type: "parking", hikvision_door_id: "HIK-DOOR-C1-PK", is_active: true },
        { id: 3, name: "พื้นที่ซ่อมบำรุง", name_en: "Maintenance Area", floor_id: 1, building_id: 1, type: "service", hikvision_door_id: "HIK-DOOR-C1-SVC", is_active: true },
        { id: 4, name: "สำนักงาน กองกลาง", name_en: "General Admin Office", floor_id: 2, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C2-01", is_active: true },
        { id: 5, name: "ห้องประชุม ชั้น 2", name_en: "Meeting Room 2F", floor_id: 2, building_id: 1, type: "meeting-room", hikvision_door_id: "HIK-DOOR-C2-MR", is_active: true },
        { id: 6, name: "สำนักงานปลัด", name_en: "OPS Office", floor_id: 3, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C3-01", is_active: true },
        { id: 7, name: "ห้องประชุม ชั้น 3", name_en: "Meeting Room 3F", floor_id: 3, building_id: 1, type: "meeting-room", hikvision_door_id: "HIK-DOOR-C3-MR", is_active: true },
        { id: 8, name: "สำนักงาน กองกิจการ / นโยบาย", name_en: "Tourism & Policy Office", floor_id: 4, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C4-01", is_active: true },
        { id: 9, name: "ห้องประชุม ชั้น 4", name_en: "Meeting Room 4F", floor_id: 4, building_id: 1, type: "meeting-room", hikvision_door_id: "HIK-DOOR-C4-MR", is_active: true },
        { id: 10, name: "สำนักงาน กองต่างประเทศ", name_en: "International Office", floor_id: 5, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C5-01", is_active: true },
        { id: 11, name: "ห้องประชุม ชั้น 5", name_en: "Meeting Room 5F", floor_id: 5, building_id: 1, type: "meeting-room", hikvision_door_id: "HIK-DOOR-C5-MR", is_active: true },
        { id: 12, name: "กรมการท่องเที่ยว / ททท.", name_en: "Tourism Dept. / TAT", floor_id: 6, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C6-01", is_active: true },
        { id: 13, name: "ห้องประชุม ชั้น 6", name_en: "Meeting Room 6F", floor_id: 6, building_id: 1, type: "meeting-room", hikvision_door_id: "HIK-DOOR-C6-MR", is_active: true },
        { id: 14, name: "กรมพลศึกษา / มกช.", name_en: "PE Dept. / NSU", floor_id: 7, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C7-01", is_active: true },
        { id: 15, name: "ห้องประชุม ชั้น 7", name_en: "Meeting Room 7F", floor_id: 7, building_id: 1, type: "meeting-room", hikvision_door_id: "HIK-DOOR-C7-MR", is_active: true },
        { id: 16, name: "กกท. / ตร.ท่องเที่ยว / อพท.", name_en: "SAT / Tourist Police / DASTA", floor_id: 8, building_id: 1, type: "office", hikvision_door_id: "HIK-DOOR-C8-01", is_active: true },
        { id: 17, name: "พื้นที่ควบคุม ตร.ท่องเที่ยว", name_en: "Tourist Police Restricted", floor_id: 8, building_id: 1, type: "restricted", hikvision_door_id: "HIK-DOOR-C8-02", is_active: true },
        { id: 18, name: "สำนักงานรัฐมนตรี (VIP)", name_en: "Minister's Office (VIP)", floor_id: 9, building_id: 1, type: "restricted", hikvision_door_id: "HIK-DOOR-C9-01", is_active: true },
        { id: 19, name: "ห้องประชุมรัฐมนตรี", name_en: "Minister's Conference", floor_id: 9, building_id: 1, type: "restricted", hikvision_door_id: "HIK-DOOR-C9-MR", is_active: true },
        { id: 20, name: "ห้องอเนกประสงค์", name_en: "Multipurpose Hall", floor_id: 9, building_id: 1, type: "common", hikvision_door_id: "HIK-DOOR-C9-MP", is_active: true },
      ],
    },
    {
      name: "access_groups",
      comment: "กลุ่มสิทธิ์การเข้าพื้นที่ — ใช้สำหรับออก QR Code และส่งสิทธิ์ผ่าน Hikvision",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสกลุ่ม (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาอังกฤษ)" },
        { name: "description", type: "TEXT", nullable: false, comment: "คำอธิบายขอบเขตการเข้าถึง" },
        { name: "hikvision_group_id", type: "VARCHAR(50)", nullable: false, comment: "รหัสกลุ่มบน Hikvision สำหรับ Integration", isUnique: true },
        { name: "qr_code_prefix", type: "VARCHAR(20)", nullable: false, comment: "Prefix ของ QR Code เช่น eVMS-GEN, eVMS-OFA" },
        { name: "validity_minutes", type: "INT", nullable: false, comment: "อายุ QR Code (นาที) เช่น 60, 120, 480" },
        { name: "schedule_days_of_week", type: "JSON", nullable: false, comment: "วันที่อนุญาต [0=อา, 1=จ, ... 6=ส] เช่น [1,2,3,4,5]" },
        { name: "schedule_start_time", type: "TIME", nullable: false, comment: "เวลาเริ่ม (HH:mm)" },
        { name: "schedule_end_time", type: "TIME", nullable: false, comment: "เวลาสิ้นสุด (HH:mm)" },
        { name: "color", type: "VARCHAR(10)", nullable: false, comment: "สี Hex สำหรับแสดง Badge เช่น #6A0DAD" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "ผู้เยี่ยมชมทั่วไป", name_en: "General Visitor", description: "เข้าได้เฉพาะล็อบบี้และพื้นที่ส่วนกลาง ชั้น 1", hikvision_group_id: "HIK-GRP-GENERAL", qr_code_prefix: "eVMS-GEN", validity_minutes: 60, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#6B7280", is_active: true },
        { id: 2, name: "ติดต่อราชการ ชั้น 2-5", name_en: "Official — Floor 2-5", description: "เข้าล็อบบี้ + สำนักงานชั้น 2-5", hikvision_group_id: "HIK-GRP-FL2-5", qr_code_prefix: "eVMS-OFA", validity_minutes: 120, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#6A0DAD", is_active: true },
        { id: 3, name: "ติดต่อราชการ ชั้น 6", name_en: "Official — Floor 6", description: "เข้าล็อบบี้ + ชั้น 6", hikvision_group_id: "HIK-GRP-FL6", qr_code_prefix: "eVMS-OFB", validity_minutes: 120, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#2563EB", is_active: true },
        { id: 4, name: "ติดต่อราชการ ชั้น 7-8", name_en: "Official — Floor 7-8", description: "เข้าล็อบบี้ + ชั้น 7-8", hikvision_group_id: "HIK-GRP-FL7-8", qr_code_prefix: "eVMS-OFC", validity_minutes: 120, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#059669", is_active: true },
        { id: 5, name: "ห้องประชุมรวม", name_en: "All Meeting Rooms", description: "เข้าได้เฉพาะห้องประชุมทุกชั้น (ไม่รวมห้องประชุมรัฐมนตรี)", hikvision_group_id: "HIK-GRP-MEETING", qr_code_prefix: "eVMS-MTG", validity_minutes: 180, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "07:30", schedule_end_time: "18:00", color: "#0891B2", is_active: true },
        { id: 6, name: "VIP — สำนักงานรัฐมนตรี", name_en: "VIP — Minister's Office", description: "เข้าชั้น 9 (ต้องได้รับอนุมัติพิเศษ)", hikvision_group_id: "HIK-GRP-VIP", qr_code_prefix: "eVMS-VIP", validity_minutes: 60, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "09:00", schedule_end_time: "16:00", color: "#DC2626", is_active: true },
        { id: 7, name: "ผู้รับเหมา / ซ่อมบำรุง", name_en: "Contractor / Maintenance", description: "เข้าพื้นที่ซ่อมบำรุง + ที่จอดรถ", hikvision_group_id: "HIK-GRP-MAINT", qr_code_prefix: "eVMS-CTR", validity_minutes: 240, schedule_days_of_week: [1,2,3,4,5,6], schedule_start_time: "07:00", schedule_end_time: "18:00", color: "#92400E", is_active: true },
        { id: 8, name: "ที่จอดรถ", name_en: "Parking Only", description: "เข้าได้เฉพาะลานจอดรถ", hikvision_group_id: "HIK-GRP-PARK", qr_code_prefix: "eVMS-PKG", validity_minutes: 480, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "06:00", schedule_end_time: "20:00", color: "#4B5563", is_active: true },
        { id: 9, name: "รับ-ส่งสินค้า", name_en: "Delivery / Pickup", description: "เข้าล็อบบี้ + ที่จอดรถ (จำกัดเวลา 30 นาที)", hikvision_group_id: "HIK-GRP-DELIVERY", qr_code_prefix: "eVMS-DLV", validity_minutes: 30, schedule_days_of_week: [1,2,3,4,5,6], schedule_start_time: "06:00", schedule_end_time: "18:00", color: "#7C3AED", is_active: true },
      ],
    },
    {
      name: "access_group_zones",
      comment: "ตารางเชื่อม กลุ่มสิทธิ์ ↔ โซน (Many-to-Many) — กลุ่มนี้เข้าโซนไหนได้บ้าง",
      columns: [
        { name: "access_group_id", type: "INT", nullable: false, comment: "FK → access_groups.id", isPrimaryKey: true, isForeignKey: true, references: "access_groups.id" },
        { name: "access_zone_id", type: "INT", nullable: false, comment: "FK → access_zones.id", isPrimaryKey: true, isForeignKey: true, references: "access_zones.id" },
      ],
      seedData: [
        // ag-1: General → lobby + multipurpose
        { access_group_id: 1, access_zone_id: 1 },
        { access_group_id: 1, access_zone_id: 20 },
        // ag-2: Official 2-5
        { access_group_id: 2, access_zone_id: 1 },
        { access_group_id: 2, access_zone_id: 4 },
        { access_group_id: 2, access_zone_id: 5 },
        { access_group_id: 2, access_zone_id: 6 },
        { access_group_id: 2, access_zone_id: 7 },
        { access_group_id: 2, access_zone_id: 8 },
        { access_group_id: 2, access_zone_id: 9 },
        { access_group_id: 2, access_zone_id: 10 },
        { access_group_id: 2, access_zone_id: 11 },
        // ag-3: Official 6
        { access_group_id: 3, access_zone_id: 1 },
        { access_group_id: 3, access_zone_id: 12 },
        { access_group_id: 3, access_zone_id: 13 },
        // ag-6: VIP
        { access_group_id: 6, access_zone_id: 1 },
        { access_group_id: 6, access_zone_id: 18 },
        { access_group_id: 6, access_zone_id: 19 },
        // ag-7: Contractor
        { access_group_id: 7, access_zone_id: 1 },
        { access_group_id: 7, access_zone_id: 2 },
        { access_group_id: 7, access_zone_id: 3 },
        // ag-9: Delivery
        { access_group_id: 9, access_zone_id: 1 },
        { access_group_id: 9, access_zone_id: 2 },
      ],
    },
    {
      name: "access_group_visit_types",
      comment: "ตารางเชื่อม กลุ่มสิทธิ์ ↔ ประเภทการเยี่ยม (Many-to-Many)",
      columns: [
        { name: "access_group_id", type: "INT", nullable: false, comment: "FK → access_groups.id", isPrimaryKey: true, isForeignKey: true, references: "access_groups.id" },
        { name: "visit_type", type: "ENUM('official','meeting','document','contractor','delivery','other')", nullable: false, comment: "ประเภทการเยี่ยมที่กลุ่มนี้รองรับ", isPrimaryKey: true },
      ],
      seedData: [
        { access_group_id: 1, visit_type: "document" },
        { access_group_id: 1, visit_type: "delivery" },
        { access_group_id: 1, visit_type: "other" },
        { access_group_id: 2, visit_type: "official" },
        { access_group_id: 2, visit_type: "meeting" },
        { access_group_id: 2, visit_type: "document" },
        { access_group_id: 5, visit_type: "meeting" },
        { access_group_id: 6, visit_type: "official" },
        { access_group_id: 6, visit_type: "meeting" },
        { access_group_id: 7, visit_type: "contractor" },
        { access_group_id: 9, visit_type: "delivery" },
      ],
    },
    {
      name: "department_access_mappings",
      comment: "จับคู่แผนก ↔ กลุ่มสิทธิ์เริ่มต้น — ใช้กำหนดว่าผู้เยี่ยมแผนกนี้ได้รับสิทธิ์กลุ่มอะไร",
      columns: [
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id (PK)", isPrimaryKey: true, isForeignKey: true, references: "departments.id" },
        { name: "default_access_group_id", type: "INT", nullable: false, comment: "FK → access_groups.id — กลุ่มสิทธิ์หลัก", isForeignKey: true, references: "access_groups.id" },
      ],
      seedData: [
        { department_id: 1, default_access_group_id: 2 },
        { department_id: 2, default_access_group_id: 2 },
        { department_id: 3, default_access_group_id: 2 },
        { department_id: 4, default_access_group_id: 2 },
        { department_id: 5, default_access_group_id: 3 },
        { department_id: 6, default_access_group_id: 4 },
        { department_id: 7, default_access_group_id: 4 },
        { department_id: 8, default_access_group_id: 2 },
        { department_id: 9, default_access_group_id: 6 },
        { department_id: 10, default_access_group_id: 3 },
        { department_id: 11, default_access_group_id: 4 },
        { department_id: 12, default_access_group_id: 4 },
        { department_id: 13, default_access_group_id: 4 },
      ],
    },
    {
      name: "department_additional_access_groups",
      comment: "กลุ่มสิทธิ์เสริม (นอกเหนือจาก default) ของแต่ละแผนก",
      columns: [
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id", isPrimaryKey: true, isForeignKey: true, references: "departments.id" },
        { name: "access_group_id", type: "INT", nullable: false, comment: "FK → access_groups.id", isPrimaryKey: true, isForeignKey: true, references: "access_groups.id" },
      ],
      seedData: [
        { department_id: 1, access_group_id: 5 },
        { department_id: 2, access_group_id: 5 },
        { department_id: 3, access_group_id: 5 },
        { department_id: 4, access_group_id: 5 },
        { department_id: 5, access_group_id: 5 },
        { department_id: 6, access_group_id: 5 },
        { department_id: 7, access_group_id: 5 },
        { department_id: 8, access_group_id: 5 },
        { department_id: 9, access_group_id: 2 },
        { department_id: 10, access_group_id: 5 },
        { department_id: 11, access_group_id: 5 },
        { department_id: 13, access_group_id: 5 },
      ],
    },
  ],
  relationships: [
    "access_zones N ──→ 1 floors (โซนอยู่บนชั้นใดชั้นหนึ่ง)",
    "access_zones N ──→ 1 buildings (โซนอยู่ในอาคารใดอาคารหนึ่ง)",
    "access_groups N ←──→ N access_zones ผ่าน access_group_zones",
    "access_groups N ←──→ N visit_types ผ่าน access_group_visit_types",
    "departments 1 ──→ 1 department_access_mappings (กลุ่มสิทธิ์เริ่มต้น)",
    "departments 1 ──→ N department_additional_access_groups (กลุ่มสิทธิ์เสริม)",
  ],
};

// ════════════════════════════════════════════════════
// 4. กลุ่มผู้อนุมัติ (Approver Groups)
// ════════════════════════════════════════════════════

const approverGroupsSchema: PageSchema = {
  pageId: "approver-groups",
  menuName: "กลุ่มผู้อนุมัติ",
  menuNameEn: "Approver Groups",
  path: "/web/settings/approver-groups",
  description: "จัดกลุ่มผู้อนุมัติ — กำหนดสมาชิก สิทธิ์การอนุมัติ/ปฏิเสธ ช่องทางแจ้งเตือน และวัตถุประสงค์ที่ดูแล",
  tables: [
    {
      name: "approver_groups",
      comment: "ตารางกลุ่มผู้อนุมัติหลัก",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสกลุ่ม (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(150)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(150)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาอังกฤษ)" },
        { name: "description", type: "TEXT", nullable: false, comment: "คำอธิบายรายละเอียดกลุ่ม" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id — แผนกที่กลุ่มนี้รับผิดชอบ", isForeignKey: true, references: "departments.id" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "ผู้อนุมัติ สำนักงานปลัด (ราชการ+ประชุม)", name_en: "OPS Approvers (Official+Meeting)", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานปลัดกระทรวง", department_id: 1, is_active: true },
        { id: 2, name: "ผู้อนุมัติ สำนักงานปลัด (อื่นๆ)", name_en: "OPS Approvers (Other)", description: "กลุ่มผู้อนุมัติสำหรับ วัตถุประสงค์อื่นๆ ที่ สำนักงานปลัดกระทรวง", department_id: 1, is_active: true },
        { id: 3, name: "ผู้อนุมัติ กองกลาง (ราชการ+อื่นๆ)", name_en: "General Admin Approvers (Official+Other)", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / อื่นๆ ที่ กองกลาง", department_id: 2, is_active: true },
        { id: 4, name: "ผู้อนุมัติ กองกลาง (ผู้รับเหมา)", name_en: "General Admin Approvers (Contractor)", description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กองกลาง", department_id: 2, is_active: true },
        { id: 5, name: "ผู้อนุมัติ กองการต่างประเทศ", name_en: "International Approvers", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ กองการต่างประเทศ", department_id: 3, is_active: true },
        { id: 6, name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (ราชการ+เอกสาร)", name_en: "Tourism Affairs Approvers (Official+Docs)", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ส่งเอกสาร ที่ กองกิจการท่องเที่ยว", department_id: 4, is_active: true },
        { id: 7, name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (เยี่ยมชม)", name_en: "Tourism Affairs Approvers (Tour)", description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กองกิจการท่องเที่ยว", department_id: 4, is_active: true },
        { id: 8, name: "ผู้อนุมัติ กรมการท่องเที่ยว (เยี่ยมชม)", name_en: "Dept. of Tourism Approvers (Tour)", description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กรมการท่องเที่ยว", department_id: 5, is_active: true },
        { id: 9, name: "ผู้อนุมัติ กรมพลศึกษา (ผู้รับเหมา)", name_en: "Dept. of PE Approvers (Contractor)", description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กรมพลศึกษา", department_id: 6, is_active: true },
        { id: 10, name: "ผู้อนุมัติ สำนักงานรัฐมนตรี (VIP)", name_en: "Minister Office Approvers (VIP)", description: "กลุ่มผู้อนุมัติ VIP สำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานรัฐมนตรี", department_id: 9, is_active: true },
      ],
    },
    {
      name: "approver_group_members",
      comment: "สมาชิกในกลุ่มผู้อนุมัติ — ระบุสิทธิ์การอนุมัติ/ปฏิเสธ และการรับแจ้งเตือน",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "approver_group_id", type: "INT", nullable: false, comment: "FK → approver_groups.id", isForeignKey: true, references: "approver_groups.id" },
        { name: "staff_id", type: "INT", nullable: false, comment: "FK → staff.id — พนักงานที่เป็นสมาชิก", isForeignKey: true, references: "staff.id" },
        { name: "can_approve", type: "BOOLEAN", nullable: false, comment: "สามารถกดอนุมัติ/ปฏิเสธได้หรือไม่", defaultValue: "false" },
        { name: "receive_notification", type: "BOOLEAN", nullable: false, comment: "ได้รับแจ้งเตือนเมื่อมีรายการใหม่", defaultValue: "true" },
      ],
      seedData: [
        // apg-1: OPS (Official+Meeting)
        { id: 1, approver_group_id: 1, staff_id: 5, can_approve: true, receive_notification: true },
        { id: 2, approver_group_id: 1, staff_id: 1, can_approve: true, receive_notification: true },
        { id: 3, approver_group_id: 1, staff_id: 4, can_approve: false, receive_notification: true },
        // apg-2: OPS (Other)
        { id: 4, approver_group_id: 2, staff_id: 5, can_approve: true, receive_notification: true },
        { id: 5, approver_group_id: 2, staff_id: 4, can_approve: true, receive_notification: true },
        // apg-3: General Admin (Official+Other)
        { id: 6, approver_group_id: 3, staff_id: 2, can_approve: true, receive_notification: true },
        { id: 7, approver_group_id: 3, staff_id: 6, can_approve: false, receive_notification: true },
        // apg-4: General Admin (Contractor)
        { id: 8, approver_group_id: 4, staff_id: 2, can_approve: true, receive_notification: true },
        // apg-5: International
        { id: 9, approver_group_id: 5, staff_id: 3, can_approve: true, receive_notification: true },
        // apg-6: Tourism Affairs (Official+Docs)
        { id: 10, approver_group_id: 6, staff_id: 1, can_approve: true, receive_notification: true },
        { id: 11, approver_group_id: 6, staff_id: 4, can_approve: true, receive_notification: true },
        // apg-7: Tourism Affairs (Tour)
        { id: 12, approver_group_id: 7, staff_id: 1, can_approve: true, receive_notification: true },
        { id: 13, approver_group_id: 7, staff_id: 4, can_approve: true, receive_notification: true },
        // apg-8: Dept. of Tourism (Tour)
        { id: 14, approver_group_id: 8, staff_id: 1, can_approve: true, receive_notification: true },
        { id: 15, approver_group_id: 8, staff_id: 3, can_approve: true, receive_notification: false },
        // apg-9: Dept. of PE (Contractor)
        { id: 16, approver_group_id: 9, staff_id: 2, can_approve: true, receive_notification: true },
        // apg-10: Minister Office (VIP)
        { id: 17, approver_group_id: 10, staff_id: 5, can_approve: true, receive_notification: true },
        { id: 18, approver_group_id: 10, staff_id: 1, can_approve: true, receive_notification: true },
        { id: 19, approver_group_id: 10, staff_id: 4, can_approve: true, receive_notification: true },
      ],
    },
    {
      name: "approver_group_purposes",
      comment: "วัตถุประสงค์ที่แต่ละกลุ่มรับผิดชอบอนุมัติ (Many-to-Many)",
      columns: [
        { name: "approver_group_id", type: "INT", nullable: false, comment: "FK → approver_groups.id", isPrimaryKey: true, isForeignKey: true, references: "approver_groups.id" },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id", isPrimaryKey: true, isForeignKey: true, references: "visit_purposes.id" },
      ],
      seedData: [
        { approver_group_id: 1, visit_purpose_id: 1 },
        { approver_group_id: 1, visit_purpose_id: 2 },
        { approver_group_id: 2, visit_purpose_id: 8 },
        { approver_group_id: 3, visit_purpose_id: 1 },
        { approver_group_id: 3, visit_purpose_id: 8 },
        { approver_group_id: 4, visit_purpose_id: 4 },
        { approver_group_id: 5, visit_purpose_id: 1 },
        { approver_group_id: 5, visit_purpose_id: 2 },
        { approver_group_id: 6, visit_purpose_id: 1 },
        { approver_group_id: 6, visit_purpose_id: 3 },
        { approver_group_id: 7, visit_purpose_id: 6 },
        { approver_group_id: 8, visit_purpose_id: 6 },
        { approver_group_id: 9, visit_purpose_id: 4 },
        { approver_group_id: 10, visit_purpose_id: 1 },
        { approver_group_id: 10, visit_purpose_id: 2 },
      ],
    },
    {
      name: "approver_group_notify_channels",
      comment: "ช่องทางแจ้งเตือนของกลุ่มผู้อนุมัติ (สามารถเลือกหลายช่องทาง)",
      columns: [
        { name: "approver_group_id", type: "INT", nullable: false, comment: "FK → approver_groups.id", isPrimaryKey: true, isForeignKey: true, references: "approver_groups.id" },
        { name: "channel", type: "ENUM('line','email','web-app')", nullable: false, comment: "ช่องทาง: line / email / web-app", isPrimaryKey: true },
      ],
      seedData: [
        { approver_group_id: 1, channel: "line" }, { approver_group_id: 1, channel: "email" }, { approver_group_id: 1, channel: "web-app" },
        { approver_group_id: 2, channel: "line" }, { approver_group_id: 2, channel: "web-app" },
        { approver_group_id: 3, channel: "line" }, { approver_group_id: 3, channel: "email" },
        { approver_group_id: 4, channel: "line" }, { approver_group_id: 4, channel: "email" },
        { approver_group_id: 5, channel: "line" }, { approver_group_id: 5, channel: "web-app" },
        { approver_group_id: 6, channel: "email" }, { approver_group_id: 6, channel: "web-app" },
        { approver_group_id: 7, channel: "email" }, { approver_group_id: 7, channel: "web-app" },
        { approver_group_id: 8, channel: "line" }, { approver_group_id: 8, channel: "email" }, { approver_group_id: 8, channel: "web-app" },
        { approver_group_id: 9, channel: "web-app" },
        { approver_group_id: 10, channel: "line" }, { approver_group_id: 10, channel: "email" }, { approver_group_id: 10, channel: "web-app" },
      ],
    },
  ],
  relationships: [
    "approver_groups N ──→ 1 departments (กลุ่มผูกกับแผนกที่รับผิดชอบ)",
    "approver_groups N ←──→ N staff ผ่าน approver_group_members (กลุ่มมีสมาชิกหลายคน)",
    "approver_groups N ←──→ N visit_purposes ผ่าน approver_group_purposes",
    "approver_groups 1 ──→ N approver_group_notify_channels (ช่องทางแจ้งเตือน)",
    "approver_groups ←── visit_purpose_department_rules.approver_group_id (ถูกอ้างอิงจากเงื่อนไขแผนก)",
  ],
};

// ════════════════════════════════════════════════════
// 5. จัดการพนักงาน (Staff)
// ════════════════════════════════════════════════════

const staffSchema: PageSchema = {
  pageId: "staff",
  menuName: "จัดการพนักงาน",
  menuNameEn: "Staff Management",
  path: "/web/settings/staff",
  description: "จัดการข้อมูลพนักงาน — ชื่อ ตำแหน่ง แผนก บทบาท สิทธิ์ และกะการทำงาน",
  tables: [
    {
      name: "staff",
      comment: "ตารางพนักงาน / เจ้าหน้าที่ (รวม admin, staff, security)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสพนักงานในระบบ (PK)", isPrimaryKey: true },
        { name: "employee_id", type: "VARCHAR(20)", nullable: false, comment: "รหัสพนักงาน (EMP-001, SEC-001)", isUnique: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาอังกฤษ)" },
        { name: "position", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่ง เช่น ผู้อำนวยการกอง / เจ้าหน้าที่ รปภ." },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id — แผนกที่สังกัด", isForeignKey: true, references: "departments.id" },
        { name: "email", type: "VARCHAR(100)", nullable: false, comment: "อีเมลราชการ" },
        { name: "phone", type: "VARCHAR(20)", nullable: false, comment: "เบอร์โทรศัพท์" },
        { name: "line_user_id", type: "VARCHAR(50)", nullable: true, comment: "LINE User ID (สำหรับแจ้งเตือนผ่าน LINE)" },
        { name: "avatar_url", type: "VARCHAR(255)", nullable: true, comment: "URL รูปภาพโปรไฟล์" },
        { name: "role", type: "ENUM('admin','supervisor','officer','staff','security','visitor')", nullable: false, comment: "บทบาท: admin=ผู้ดูแลระบบ, staff=เจ้าหน้าที่, security=รปภ." },
        { name: "status", type: "ENUM('active','inactive','locked')", nullable: false, comment: "สถานะ: active=ใช้งาน, inactive=ปิดใช้งาน, locked=ล็อก", defaultValue: "active" },
        { name: "shift", type: "ENUM('morning','afternoon','night')", nullable: true, comment: "กะการทำงาน (เฉพาะ security)" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, employee_id: "EMP-001", name: "คุณสมศรี รักงาน", name_en: "Somsri Rakngarn", position: "ผู้อำนวยการกองกิจการท่องเที่ยว", department_id: 4, email: "somsri.r@mots.go.th", phone: "02-283-1500", role: "staff", status: "active", shift: null },
        { id: 2, employee_id: "EMP-002", name: "คุณประเสริฐ ศรีวิโล", name_en: "Prasert Srivilo", position: "หัวหน้ากลุ่มงานบริหารทั่วไป", department_id: 2, email: "prasert.s@mots.go.th", phone: "02-283-1501", role: "staff", status: "active", shift: null },
        { id: 3, employee_id: "EMP-003", name: "คุณกมลพร วงศ์สวัสดิ์", name_en: "Kamonporn Wongsawad", position: "ผู้เชี่ยวชาญด้านต่างประเทศ", department_id: 3, email: "kamonporn.w@mots.go.th", phone: "02-283-1502", role: "staff", status: "active", shift: null },
        { id: 4, employee_id: "EMP-004", name: "คุณวิภาดา ชัยมงคล", name_en: "Wipada Chaimongkol", position: "นักวิเคราะห์นโยบายและแผน", department_id: 8, email: "wipada.c@mots.go.th", phone: "02-283-1503", role: "staff", status: "active", shift: null },
        { id: 5, employee_id: "EMP-005", name: "คุณอนันต์ มั่นคง", name_en: "Anan Mankong", position: "ผู้ดูแลระบบ", department_id: 1, email: "anan.m@mots.go.th", phone: "02-283-1504", role: "admin", status: "active", shift: null },
        { id: 6, employee_id: "SEC-001", name: "คุณสมชาย ปลอดภัย", name_en: "Somchai Plodpai", position: "เจ้าหน้าที่รักษาความปลอดภัย", department_id: 2, email: "somchai.p@mots.go.th", phone: "02-283-1510", role: "security", status: "active", shift: "morning" },
        { id: 7, employee_id: "EMP-006", name: "คุณธนพล จิตรดี", name_en: "Thanapon Jitdee", position: "นักวิชาการท่องเที่ยว", department_id: 5, email: "thanapon.j@mots.go.th", phone: "02-283-1505", role: "staff", status: "active", shift: null },
        { id: 8, employee_id: "EMP-007", name: "คุณปิยะนุช สุขใจ", name_en: "Piyanuch Sukjai", position: "เจ้าหน้าที่บริหารงานทั่วไป", department_id: 6, email: "piyanuch.s@mots.go.th", phone: "02-283-1506", role: "staff", status: "active", shift: null },
        { id: 9, employee_id: "EMP-008", name: "คุณนภดล เรืองศักดิ์", name_en: "Noppadon Ruangsak", position: "นักจัดการงานทั่วไป", department_id: 1, email: "noppadon.r@mots.go.th", phone: "02-283-1507", role: "staff", status: "inactive", shift: null },
        { id: 10, employee_id: "SEC-002", name: "คุณชัยวัฒน์ กล้าหาญ", name_en: "Chaiwat Klahan", position: "เจ้าหน้าที่รักษาความปลอดภัย", department_id: 2, email: "chaiwat.k@mots.go.th", phone: "02-283-1511", role: "security", status: "inactive", shift: "night" },
      ],
    },
  ],
  relationships: [
    "staff N ──→ 1 departments (พนักงานสังกัดแผนก)",
    "staff N ←──→ N approver_groups ผ่าน approver_group_members (พนักงานเป็นสมาชิกกลุ่มผู้อนุมัติ)",
    "staff 1 ←── N service_points.assigned_staff_id (ประจำจุดบริการ — optional)",
  ],
};

// ════════════════════════════════════════════════════
// 6. จุดให้บริการ Kiosk/Counter (Service Points)
// ════════════════════════════════════════════════════

const servicePointsSchema: PageSchema = {
  pageId: "service-points",
  menuName: "จุดให้บริการ Kiosk/Counter",
  menuNameEn: "Service Points",
  path: "/web/settings/service-points",
  description: "จัดการจุดบริการ (ตู้ Kiosk / เคาน์เตอร์ รปภ.) — ข้อมูลอุปกรณ์ ตำแหน่งที่ตั้ง สถานะ และวัตถุประสงค์/เอกสารที่รับ",
  tables: [
    {
      name: "service_points",
      comment: "ตารางจุดให้บริการ (Kiosk / Counter)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสจุดบริการ (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อจุดบริการ (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อจุดบริการ (ภาษาอังกฤษ)" },
        { name: "type", type: "ENUM('kiosk','counter')", nullable: false, comment: "ประเภท: kiosk=ตู้อัตโนมัติ / counter=เคาน์เตอร์ รปภ." },
        { name: "status", type: "ENUM('online','offline','maintenance')", nullable: false, comment: "สถานะปัจจุบัน: online=ออนไลน์, offline=ออฟไลน์, maintenance=ซ่อมบำรุง", defaultValue: "online" },
        { name: "location", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่งที่ตั้ง (ภาษาไทย)" },
        { name: "location_en", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่งที่ตั้ง (ภาษาอังกฤษ)" },
        { name: "building", type: "VARCHAR(100)", nullable: false, comment: "อาคาร" },
        { name: "floor", type: "VARCHAR(20)", nullable: false, comment: "ชั้น" },
        { name: "ip_address", type: "VARCHAR(15)", nullable: false, comment: "IP Address ของอุปกรณ์" },
        { name: "mac_address", type: "VARCHAR(17)", nullable: false, comment: "MAC Address ของอุปกรณ์" },
        { name: "serial_number", type: "VARCHAR(30)", nullable: false, comment: "หมายเลขซีเรียล", isUnique: true },
        { name: "today_transactions", type: "INT", nullable: false, comment: "จำนวนธุรกรรมวันนี้ (reset ทุกวัน)", defaultValue: "0" },
        { name: "last_online", type: "TIMESTAMP", nullable: true, comment: "เวลาที่ออนไลน์ล่าสุด" },
        { name: "assigned_staff_id", type: "INT", nullable: true, comment: "FK → staff.id — เจ้าหน้าที่ประจำจุด (เฉพาะ counter)", isForeignKey: true, references: "staff.id" },
        { name: "notes", type: "TEXT", nullable: true, comment: "หมายเหตุ" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "wifi_ssid", type: "VARCHAR(50)", nullable: true, comment: "WiFi SSID สำหรับผู้เยี่ยม เช่น MOTS-Guest" },
        { name: "wifi_password_pattern", type: "VARCHAR(50)", nullable: true, comment: "รูปแบบรหัสผ่าน WiFi เช่น mots{year}" },
        { name: "wifi_validity_mode", type: "ENUM('business-hours-close','fixed-duration')", nullable: true, comment: "วิธีคำนวณหมดอายุ WiFi" },
        { name: "wifi_fixed_duration_min", type: "INT", nullable: true, comment: "ระยะเวลา WiFi (นาที) ถ้าใช้ fixed-duration" },
        { name: "pdpa_require_scroll", type: "BOOLEAN", nullable: true, comment: "บังคับเลื่อนอ่าน PDPA ก่อนยินยอม", defaultValue: "true" },
        { name: "pdpa_retention_days", type: "INT", nullable: true, comment: "จำนวนวันเก็บข้อมูลที่แสดงในข้อความ PDPA", defaultValue: "90" },
        { name: "slip_header_text", type: "VARCHAR(200)", nullable: true, comment: "ข้อความหัวใบ slip" },
        { name: "slip_footer_text", type: "VARCHAR(200)", nullable: true, comment: "ข้อความท้ายใบ slip" },
        { name: "follow_business_hours", type: "BOOLEAN", nullable: true, comment: "ใช้เวลาทำการหรือเปิดตลอด", defaultValue: "true" },
        { name: "id_masking_pattern", type: "VARCHAR(30)", nullable: true, comment: "รูปแบบปิดบังเลขบัตร: show-last-4, show-first-last, full-mask" },
        { name: "admin_pin", type: "VARCHAR(5)", nullable: true, comment: "PIN 5 หลักสำหรับเข้าเมนูตั้งค่าบน Kiosk", defaultValue: "10210" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "ตู้ Kiosk ล็อบบี้หลัก", name_en: "Main Lobby Kiosk", type: "kiosk", status: "online", location: "ล็อบบี้ ชั้น 1 ประตูหลัก", location_en: "Main Lobby, Gate 1", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.101", mac_address: "AA:BB:CC:DD:01:01", serial_number: "KIOSK-2024-001", today_transactions: 42, last_online: "2569-03-08T14:30:00", assigned_staff_id: null, is_active: true },
        { id: 2, name: "ตู้ Kiosk ล็อบบี้ฝั่งตะวันออก", name_en: "East Lobby Kiosk", type: "kiosk", status: "offline", location: "ล็อบบี้ ชั้น 1 ประตูฝั่งตะวันออก", location_en: "East Lobby, Side Gate", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.102", mac_address: "AA:BB:CC:DD:01:02", serial_number: "KIOSK-2024-002", today_transactions: 28, last_online: "2569-03-08T14:28:00", assigned_staff_id: null, is_active: true },
        { id: 3, name: "จุดบริการ Counter 1", name_en: "Service Counter 1", type: "counter", status: "online", location: "เคาน์เตอร์ รปภ. ประตูหลัก", location_en: "Security Counter, Main Gate", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.201", mac_address: "AA:BB:CC:DD:02:01", serial_number: "CTR-2024-001", today_transactions: 67, last_online: "2569-03-08T14:30:00", assigned_staff_id: 6, is_active: true },
        { id: 4, name: "จุดบริการ Counter 2", name_en: "Service Counter 2", type: "counter", status: "online", location: "เคาน์เตอร์ รปภ. ประตูหลัก", location_en: "Security Counter, Main Gate", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.202", mac_address: "AA:BB:CC:DD:02:02", serial_number: "CTR-2024-002", today_transactions: 53, last_online: "2569-03-08T14:29:00", assigned_staff_id: 7, is_active: true },
      ],
    },
    {
      name: "service_point_purposes",
      comment: "วัตถุประสงค์ที่จุดบริการนี้รองรับ (Many-to-Many)",
      columns: [
        { name: "service_point_id", type: "INT", nullable: false, comment: "FK → service_points.id", isPrimaryKey: true, isForeignKey: true, references: "service_points.id" },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id", isPrimaryKey: true, isForeignKey: true, references: "visit_purposes.id" },
      ],
      seedData: [
        { service_point_id: 1, visit_purpose_id: 1 }, { service_point_id: 1, visit_purpose_id: 2 }, { service_point_id: 1, visit_purpose_id: 5 },
        { service_point_id: 2, visit_purpose_id: 1 }, { service_point_id: 2, visit_purpose_id: 3 }, { service_point_id: 2, visit_purpose_id: 4 },
        { service_point_id: 3, visit_purpose_id: 1 }, { service_point_id: 3, visit_purpose_id: 2 }, { service_point_id: 3, visit_purpose_id: 3 }, { service_point_id: 3, visit_purpose_id: 4 }, { service_point_id: 3, visit_purpose_id: 5 },
        { service_point_id: 4, visit_purpose_id: 1 }, { service_point_id: 4, visit_purpose_id: 2 }, { service_point_id: 4, visit_purpose_id: 3 }, { service_point_id: 4, visit_purpose_id: 4 }, { service_point_id: 4, visit_purpose_id: 5 },
      ],
    },
    {
      name: "service_point_documents",
      comment: "ประเภทเอกสารที่จุดบริการนี้รับ (Many-to-Many)",
      columns: [
        { name: "service_point_id", type: "INT", nullable: false, comment: "FK → service_points.id", isPrimaryKey: true, isForeignKey: true, references: "service_points.id" },
        { name: "identity_document_type_id", type: "INT", nullable: false, comment: "FK → identity_document_types.id", isPrimaryKey: true, isForeignKey: true, references: "identity_document_types.id" },
      ],
      seedData: [
        { service_point_id: 1, identity_document_type_id: 1 }, { service_point_id: 1, identity_document_type_id: 2 }, { service_point_id: 1, identity_document_type_id: 4 }, { service_point_id: 1, identity_document_type_id: 5 },
        { service_point_id: 2, identity_document_type_id: 1 }, { service_point_id: 2, identity_document_type_id: 3 }, { service_point_id: 2, identity_document_type_id: 5 },
        { service_point_id: 3, identity_document_type_id: 1 }, { service_point_id: 3, identity_document_type_id: 2 }, { service_point_id: 3, identity_document_type_id: 3 }, { service_point_id: 3, identity_document_type_id: 4 }, { service_point_id: 3, identity_document_type_id: 5 },
        { service_point_id: 4, identity_document_type_id: 1 }, { service_point_id: 4, identity_document_type_id: 2 }, { service_point_id: 4, identity_document_type_id: 3 }, { service_point_id: 4, identity_document_type_id: 4 }, { service_point_id: 4, identity_document_type_id: 5 },
      ],
    },
    {
      name: "counter_staff_assignments",
      comment: "เจ้าหน้าที่ที่ได้รับมอบหมายประจำ Counter (Many-to-Many)",
      columns: [
        { name: "id", type: "INT AUTO_INCREMENT", nullable: false, comment: "รหัส assignment (PK) — เลข run อัตโนมัติ", isPrimaryKey: true },
        { name: "service_point_id", type: "INT", nullable: false, comment: "FK → service_points.id (เฉพาะ type=counter)", isForeignKey: true, references: "service_points.id" },
        { name: "staff_id", type: "INT", nullable: false, comment: "FK → staff.id (role=security/officer)", isForeignKey: true, references: "staff.id" },
        { name: "is_primary", type: "BOOLEAN", nullable: false, comment: "เจ้าหน้าที่หลักประจำ counter นี้", defaultValue: "false" },
        { name: "assigned_at", type: "TIMESTAMP", nullable: false, comment: "วันที่มอบหมาย", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, service_point_id: 3, staff_id: 6, is_primary: true, assigned_at: "2569-01-15T09:00:00" },
        { id: 2, service_point_id: 3, staff_id: 11, is_primary: false, assigned_at: "2569-02-01T09:00:00" },
        { id: 3, service_point_id: 4, staff_id: 12, is_primary: true, assigned_at: "2569-01-15T09:00:00" },
        { id: 4, service_point_id: 4, staff_id: 6, is_primary: false, assigned_at: "2569-02-10T09:00:00" },
        { id: 5, service_point_id: 4, staff_id: 11, is_primary: false, assigned_at: "2569-03-01T09:00:00" },
      ],
    },
  ],
  relationships: [
    "service_points N ←──→ N staff ผ่าน counter_staff_assignments (เจ้าหน้าที่ประจำ counter)",
    "service_points N ←──→ N visit_purposes ผ่าน service_point_purposes",
    "service_points N ←──→ N identity_document_types ผ่าน service_point_documents",
  ],
};

// ════════════════════════════════════════════════════
// 7. ประเภทเอกสาร (Document Types)
// ════════════════════════════════════════════════════

const documentTypesSchema: PageSchema = {
  pageId: "document-types",
  menuName: "ประเภทเอกสาร",
  menuNameEn: "Document Types",
  path: "/web/settings/document-types",
  description: "กำหนดประเภทเอกสารที่ใช้ยืนยันตัวตน — บัตรประชาชน, Passport, ใบขับขี่, บัตรข้าราชการ ฯลฯ",
  tables: [
    {
      name: "identity_document_types",
      comment: "ตารางประเภทเอกสารระบุตัวตนที่ Kiosk/Counter รับได้ (ใช้ตอนสแกน/ลงทะเบียน)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสเอกสาร (PK) เช่น doc-national-id", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเอกสาร (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเอกสาร (ภาษาอังกฤษ)" },
        { name: "icon", type: "VARCHAR(10)", nullable: true, comment: "ไอคอน Emoji" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผล" },
      ],
      seedData: [
        { id: 1, name: "บัตรประจำตัวประชาชน", name_en: "National ID Card", icon: "🪪", is_active: true, sort_order: 1 },
        { id: 2, name: "หนังสือเดินทาง (Passport)", name_en: "Passport", icon: "📕", is_active: true, sort_order: 2 },
        { id: 3, name: "ใบขับขี่", name_en: "Driver's License", icon: "🚗", is_active: true, sort_order: 3 },
        { id: 4, name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", name_en: "Government Officer Card", icon: "🏛️", is_active: true, sort_order: 4 },
        { id: 5, name: "AppThaiID", name_en: "AppThaiID", icon: "📱", is_active: true, sort_order: 5 },
      ],
    },
    {
      name: "document_types",
      comment: "ตารางประเภทเอกสารเพิ่มเติมที่ผู้เยี่ยมอาจต้องแนบ (เอกสารมอบอำนาจ, ทะเบียนรถ ฯลฯ)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสเอกสาร (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเอกสาร (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเอกสาร (ภาษาอังกฤษ)" },
        { name: "category", type: "ENUM('identification','authorization','vehicle','other')", nullable: false, comment: "หมวดหมู่: identification=ยืนยันตัวตน, authorization=มอบอำนาจ, vehicle=ยานพาหนะ, other=อื่นๆ" },
        { name: "is_required", type: "BOOLEAN", nullable: false, comment: "จำเป็นต้องแนบหรือไม่", defaultValue: "false" },
        { name: "require_photo", type: "BOOLEAN", nullable: false, comment: "ต้องถ่ายรูปเอกสาร", defaultValue: "false" },
        { name: "description", type: "TEXT", nullable: true, comment: "คำอธิบายวิธีใช้" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผล" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "บัตรประจำตัวประชาชน", name_en: "Thai National ID Card", category: "identification", is_required: true, require_photo: true, description: "บัตรประชาชนตัวจริง สำหรับบุคคลสัญชาติไทย", is_active: true, sort_order: 1 },
        { id: 2, name: "หนังสือเดินทาง (Passport)", name_en: "Passport", category: "identification", is_required: true, require_photo: true, description: "สำหรับบุคคลต่างชาติ", is_active: true, sort_order: 2 },
        { id: 3, name: "ใบขับขี่", name_en: "Driver's License", category: "identification", is_required: false, require_photo: true, description: "ใช้แทนบัตรประชาชนได้เฉพาะกรณี walk-in", is_active: true, sort_order: 3 },
        { id: 4, name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", name_en: "Government Officer ID", category: "identification", is_required: false, require_photo: true, description: "บัตรประจำตัวข้าราชการ", is_active: true, sort_order: 4 },
      ],
    },
    {
      name: "document_type_visit_types",
      comment: "ประเภทเอกสารใช้ได้กับประเภทการเยี่ยมใด (Many-to-Many)",
      columns: [
        { name: "document_type_id", type: "INT", nullable: false, comment: "FK → document_types.id", isPrimaryKey: true, isForeignKey: true, references: "document_types.id" },
        { name: "visit_type", type: "ENUM('official','meeting','document','contractor','delivery','other')", nullable: false, comment: "ประเภทการเยี่ยม", isPrimaryKey: true },
      ],
      seedData: [
        // doc-1: all visit types
        { document_type_id: 1, visit_type: "official" }, { document_type_id: 1, visit_type: "meeting" }, { document_type_id: 1, visit_type: "document" }, { document_type_id: 1, visit_type: "contractor" }, { document_type_id: 1, visit_type: "delivery" }, { document_type_id: 1, visit_type: "other" },
        // doc-2: all
        { document_type_id: 2, visit_type: "official" }, { document_type_id: 2, visit_type: "meeting" }, { document_type_id: 2, visit_type: "document" }, { document_type_id: 2, visit_type: "contractor" }, { document_type_id: 2, visit_type: "delivery" }, { document_type_id: 2, visit_type: "other" },
        // doc-3: all
        { document_type_id: 3, visit_type: "official" }, { document_type_id: 3, visit_type: "meeting" }, { document_type_id: 3, visit_type: "document" }, { document_type_id: 3, visit_type: "contractor" }, { document_type_id: 3, visit_type: "delivery" }, { document_type_id: 3, visit_type: "other" },
        // doc-4: official + meeting only
        { document_type_id: 4, visit_type: "official" }, { document_type_id: 4, visit_type: "meeting" },
      ],
    },
  ],
  relationships: [
    "identity_document_types ←── visit_purpose_channel_documents (ใช้ตอนตั้งค่าช่องทางเข้าของวัตถุประสงค์)",
    "identity_document_types ←── service_point_documents (ใช้ตอนกำหนดเอกสารที่จุดบริการรับ)",
    "document_types N ←──→ N visit_types ผ่าน document_type_visit_types",
  ],
};

// ════════════════════════════════════════════════════
// 8. เวลาทำการ (Business Hours)
// ════════════════════════════════════════════════════

const businessHoursSchema: PageSchema = {
  pageId: "business-hours",
  menuName: "เวลาทำการ",
  menuNameEn: "Business Hours",
  path: "/web/settings/business-hours",
  description: "กำหนดเวลาเปิด/ปิดทำการ — วันทำการปกติ, วันหยุดราชการ, และวันพิเศษ พร้อมกำหนดว่าเปิดรับ Walk-in / Kiosk หรือไม่",
  tables: [
    {
      name: "business_hours_rules",
      comment: "กฎเวลาทำการ — กำหนดเวลาเปิด/ปิด และช่องทางที่อนุญาต",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสกฎ (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อกฎ (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อกฎ (ภาษาอังกฤษ)" },
        { name: "type", type: "ENUM('regular','special','holiday')", nullable: false, comment: "ประเภท: regular=ปกติ(ทุกสัปดาห์), special=วันพิเศษ, holiday=วันหยุด" },
        { name: "days_of_week", type: "JSON", nullable: true, comment: "วันในสัปดาห์ [0=อา..6=ส] (เฉพาะ type=regular)" },
        { name: "specific_date", type: "DATE", nullable: true, comment: "วันที่เฉพาะ YYYY-MM-DD (เฉพาะ type=special/holiday)" },
        { name: "open_time", type: "TIME", nullable: false, comment: "เวลาเปิดทำการ (HH:mm) — 00:00 = ปิดทั้งวัน" },
        { name: "close_time", type: "TIME", nullable: false, comment: "เวลาปิดทำการ (HH:mm) — 00:00 = ปิดทั้งวัน" },
        { name: "allow_walkin", type: "BOOLEAN", nullable: false, comment: "เปิดรับ Walk-in ผู้เยี่ยมชม", defaultValue: "true" },
        { name: "allow_kiosk", type: "BOOLEAN", nullable: false, comment: "เปิดให้ Kiosk ลงทะเบียนได้", defaultValue: "true" },
        { name: "notes", type: "TEXT", nullable: true, comment: "หมายเหตุเพิ่มเติม" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "วันทำการปกติ (จ-ศ)", name_en: "Regular Weekdays (Mon-Fri)", type: "regular", days_of_week: [1,2,3,4,5], specific_date: null, open_time: "08:30", close_time: "16:30", allow_walkin: true, allow_kiosk: true, is_active: true },
        { id: 2, name: "วันเสาร์ (เปิดครึ่งวัน)", name_en: "Saturday (Half Day)", type: "regular", days_of_week: [6], specific_date: null, open_time: "09:00", close_time: "12:00", allow_walkin: true, allow_kiosk: true, notes: "เปิดเฉพาะบางแผนก", is_active: true },
        { id: 3, name: "วันอาทิตย์ (ปิด)", name_en: "Sunday (Closed)", type: "regular", days_of_week: [0], specific_date: null, open_time: "00:00", close_time: "00:00", allow_walkin: false, allow_kiosk: false, is_active: true },
        { id: 4, name: "วันจักรี", name_en: "Chakri Memorial Day", type: "holiday", days_of_week: null, specific_date: "2569-04-06", open_time: "00:00", close_time: "00:00", allow_walkin: false, allow_kiosk: false, notes: "วันหยุดราชการ", is_active: true },
        { id: 5, name: "สงกรานต์", name_en: "Songkran Festival", type: "holiday", days_of_week: null, specific_date: "2569-04-13", open_time: "00:00", close_time: "00:00", allow_walkin: false, allow_kiosk: false, notes: "วันหยุดสงกรานต์ 13-15 เม.ย.", is_active: true },
        { id: 6, name: "งานสัมมนาพิเศษ", name_en: "Special Seminar Event", type: "special", days_of_week: null, specific_date: "2569-03-20", open_time: "07:00", close_time: "20:00", allow_walkin: true, allow_kiosk: true, notes: "เปิดนอกเวลาสำหรับสัมมนาประจำปี", is_active: true },
      ],
    },
  ],
  relationships: [
    "business_hours_rules — ใช้ตรวจสอบเวลาเปิด/ปิดก่อนอนุญาต Walk-in / Kiosk registration",
    "holiday rules override regular rules เมื่อตรงวันที่เดียวกัน",
  ],
};

// ════════════════════════════════════════════════════
// 9. เทมเพลตแจ้งเตือน (Notification Templates)
// ════════════════════════════════════════════════════

const notificationTemplatesSchema: PageSchema = {
  pageId: "notification-templates",
  menuName: "เทมเพลตแจ้งเตือน",
  menuNameEn: "Notification Templates",
  path: "/web/settings/notification-templates",
  description: "จัดการเทมเพลตข้อความแจ้งเตือน — LINE, Email, SMS พร้อมตัวแปรที่รองรับ ({{variable}})",
  tables: [
    {
      name: "notification_templates",
      comment: "ตารางเทมเพลตแจ้งเตือน — กำหนดข้อความสำหรับแต่ละ event + ช่องทาง",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัสเทมเพลต (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเทมเพลต (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเทมเพลต (ภาษาอังกฤษ)" },
        { name: "trigger_event", type: "ENUM('booking-confirmed','booking-approved','booking-rejected','reminder-1day','reminder-1hour','checkin-welcome','checkout-thankyou','overstay-alert','wifi-credentials')", nullable: false, comment: "เหตุการณ์ที่ทำให้ส่ง: booking-confirmed=ยืนยันจอง, booking-approved=อนุมัติ, reminder-1day=เตือน1วัน ฯลฯ" },
        { name: "channel", type: "ENUM('line','email','sms')", nullable: false, comment: "ช่องทางส่ง: line / email / sms" },
        { name: "subject", type: "VARCHAR(200)", nullable: true, comment: "หัวข้อ (เฉพาะ email)" },
        { name: "body_th", type: "TEXT", nullable: false, comment: "เนื้อหาภาษาไทย — ใช้ {{variable}} สำหรับตัวแปร" },
        { name: "body_en", type: "TEXT", nullable: false, comment: "เนื้อหาภาษาอังกฤษ" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "แจ้งยืนยันจอง (LINE)", name_en: "Booking Confirmed (LINE)", trigger_event: "booking-confirmed", channel: "line", subject: null, body_th: "สวัสดีค่ะ คุณ{{visitorName}} 🎉\nการจองเลขที่ {{bookingCode}} ได้รับการยืนยันแล้ว\n📅 วันที่: {{date}}\n⏰ เวลา: {{time}}\n📍 {{location}}", body_en: "Hello {{visitorName}} 🎉\nBooking {{bookingCode}} confirmed.", is_active: true },
        { id: 2, name: "แจ้งอนุมัติ (LINE)", name_en: "Approved (LINE)", trigger_event: "booking-approved", channel: "line", subject: null, body_th: "✅ คำขอเข้าพื้นที่ {{bookingCode}} ได้รับการอนุมัติแล้ว\nผู้อนุมัติ: {{approverName}}", body_en: "✅ Visit request {{bookingCode}} approved by {{approverName}}", is_active: true },
        { id: 3, name: "แจ้งไม่อนุมัติ (LINE)", name_en: "Rejected (LINE)", trigger_event: "booking-rejected", channel: "line", subject: null, body_th: "❌ คำขอเข้าพื้นที่ {{bookingCode}} ไม่ได้รับการอนุมัติ\nเหตุผล: {{reason}}", body_en: "❌ Visit request {{bookingCode}} rejected. Reason: {{reason}}", is_active: true },
        { id: 4, name: "เตือนล่วงหน้า 1 วัน (LINE)", name_en: "1-Day Reminder (LINE)", trigger_event: "reminder-1day", channel: "line", subject: null, body_th: "📢 เตือน: พรุ่งนี้คุณมีนัดหมาย {{bookingCode}}\n📅 {{date}} เวลา {{time}}\n📍 {{location}}", body_en: "📢 Reminder: Tomorrow you have appointment {{bookingCode}}", is_active: true },
        { id: 5, name: "ต้อนรับ Check-in (LINE)", name_en: "Welcome Check-in (LINE)", trigger_event: "checkin-welcome", channel: "line", subject: null, body_th: "🏢 ยินดีต้อนรับคุณ {{visitorName}}\nเข้าพื้นที่สำเร็จเมื่อ {{checkinTime}}\n📍 {{zone}}", body_en: "🏢 Welcome {{visitorName}} — Checked in at {{checkinTime}}", is_active: true },
        { id: 6, name: "แจ้งยืนยัน (Email)", name_en: "Booking Confirmed (Email)", trigger_event: "booking-confirmed", channel: "email", subject: "ยืนยันการจองเข้าพื้นที่ — {{bookingCode}}", body_th: "เรียน คุณ{{visitorName}}\n\nการจองเลขที่ {{bookingCode}} ได้รับการยืนยัน\nวันที่: {{date}} เวลา: {{time}} สถานที่: {{location}}\nผู้ติดต่อ: {{hostName}}", body_en: "Dear {{visitorName}},\nYour visit {{bookingCode}} has been confirmed.", is_active: true },
        { id: 7, name: "แจ้งเตือนเกินเวลา (LINE)", name_en: "Overstay Alert (LINE)", trigger_event: "overstay-alert", channel: "line", subject: null, body_th: "⚠️ คุณ {{visitorName}} อยู่เกินเวลา\nเวลาที่ควรออก: {{checkoutTime}}", body_en: "⚠️ {{visitorName}} has exceeded allowed time.", is_active: true },
        { id: 8, name: "ข้อมูล WiFi (LINE)", name_en: "WiFi Credentials (LINE)", trigger_event: "wifi-credentials", channel: "line", subject: null, body_th: "📶 WiFi: {{wifiSSID}}\nUser: {{wifiUsername}}\nPass: {{wifiPassword}}\nใช้ได้ถึง: {{expiry}}", body_en: "📶 WiFi: {{wifiSSID}} User: {{wifiUsername}} Pass: {{wifiPassword}}", is_active: true },
      ],
    },
    {
      name: "notification_template_variables",
      comment: "ตัวแปรที่แต่ละเทมเพลตรองรับ (ใช้แทนค่าด้วย {{variable_name}})",
      columns: [
        { name: "template_id", type: "INT", nullable: false, comment: "FK → notification_templates.id", isPrimaryKey: true, isForeignKey: true, references: "notification_templates.id" },
        { name: "variable_name", type: "VARCHAR(50)", nullable: false, comment: "ชื่อตัวแปร เช่น visitorName, bookingCode, date", isPrimaryKey: true },
      ],
      seedData: [
        // nt-1
        { template_id: 1, variable_name: "visitorName" }, { template_id: 1, variable_name: "bookingCode" }, { template_id: 1, variable_name: "date" }, { template_id: 1, variable_name: "time" }, { template_id: 1, variable_name: "location" },
        // nt-2
        { template_id: 2, variable_name: "bookingCode" }, { template_id: 2, variable_name: "approverName" },
        // nt-3
        { template_id: 3, variable_name: "bookingCode" }, { template_id: 3, variable_name: "reason" }, { template_id: 3, variable_name: "contactNumber" },
        // nt-5
        { template_id: 5, variable_name: "visitorName" }, { template_id: 5, variable_name: "checkinTime" }, { template_id: 5, variable_name: "zone" }, { template_id: 5, variable_name: "checkoutTime" },
        // nt-6
        { template_id: 6, variable_name: "visitorName" }, { template_id: 6, variable_name: "bookingCode" }, { template_id: 6, variable_name: "date" }, { template_id: 6, variable_name: "time" }, { template_id: 6, variable_name: "location" }, { template_id: 6, variable_name: "hostName" },
        // nt-8
        { template_id: 8, variable_name: "wifiSSID" }, { template_id: 8, variable_name: "wifiUsername" }, { template_id: 8, variable_name: "wifiPassword" }, { template_id: 8, variable_name: "expiry" },
      ],
    },
  ],
  relationships: [
    "notification_templates 1 ──→ N notification_template_variables (แต่ละเทมเพลตมีตัวแปรหลายตัว)",
    "notification_templates ←── ระบบ Event (ถูกเรียกใช้เมื่อเกิด event เช่น booking, checkin)",
    "notification_templates ←── approver_group_notify_channels (กลุ่มผู้อนุมัติอ้างอิงช่องทาง)",
  ],
};

// ════════════════════════════════════════════════════
// 10. แบบฟอร์ม Visit Slip (Visit Slips)
// ════════════════════════════════════════════════════

const visitSlipsSchema: PageSchema = {
  pageId: "visit-slips",
  menuName: "แบบฟอร์ม Visit Slip",
  menuNameEn: "Visit Slip Templates",
  path: "/web/settings/visit-slips",
  description: "จัดการ Visit Slip (Thermal 80mm) — กำหนด Section ที่แสดง, ฟิลด์, ป้ายกำกับ, WiFi, QR Code, และ Live Preview",
  tables: [
    {
      name: "visit_slip_templates",
      comment: "ตาราง Template สลิปผู้เยี่ยม — กำหนดขนาดกระดาษ, header/footer, สถานะ, และ metadata",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Template (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ Template (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ Template (ภาษาอังกฤษ)" },
        { name: "description", type: "TEXT", nullable: true, comment: "คำอธิบายการใช้งาน" },
        { name: "paper_size", type: "ENUM('thermal-80mm','thermal-58mm')", nullable: false, comment: "ขนาดกระดาษ Thermal", defaultValue: "thermal-80mm" },
        { name: "paper_width_px", type: "INT", nullable: false, comment: "ความกว้าง (pixels) สำหรับ render", defaultValue: "302" },
        { name: "org_name", type: "VARCHAR(200)", nullable: false, comment: "ชื่อหน่วยงานบน Header (TH)", defaultValue: "กระทรวงการท่องเที่ยวและกีฬา" },
        { name: "org_name_en", type: "VARCHAR(200)", nullable: false, comment: "ชื่อหน่วยงานบน Header (EN)", defaultValue: "Ministry of Tourism and Sports" },
        { name: "slip_title", type: "VARCHAR(100)", nullable: false, comment: "หัวข้อสลิป เช่น VISITOR PASS", defaultValue: "VISITOR PASS" },
        { name: "footer_text_th", type: "VARCHAR(200)", nullable: false, comment: "ข้อความท้ายสลิป (TH)", defaultValue: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร" },
        { name: "footer_text_en", type: "VARCHAR(200)", nullable: false, comment: "ข้อความท้ายสลิป (EN)", defaultValue: "Please return this pass when leaving" },
        { name: "show_org_logo", type: "BOOLEAN", nullable: false, comment: "แสดงโลโก้หน่วยงานบน Header", defaultValue: "true" },
        { name: "is_default", type: "BOOLEAN", nullable: false, comment: "เป็น Template เริ่มต้น (ใช้เมื่อไม่ระบุ)", defaultValue: "false" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "Thermal 80mm มาตรฐาน", name_en: "Standard Thermal 80mm", description: "สลิป Thermal 80mm สำหรับ Kiosk / Counter", paper_size: "thermal-80mm", paper_width_px: 302, org_name: "กระทรวงการท่องเที่ยวและกีฬา", org_name_en: "Ministry of Tourism and Sports", slip_title: "VISITOR PASS", footer_text_th: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร", footer_text_en: "Please return this pass when leaving", show_org_logo: true, is_default: true, is_active: true },
      ],
    },
    {
      name: "visit_slip_sections",
      comment: "ส่วน (Section) ของสลิป — จัดกลุ่มฟิลด์เป็น Section เปิด/ปิดได้ ลำดับเรียงได้",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Section (PK)", isPrimaryKey: true },
        { name: "template_id", type: "INT", nullable: false, comment: "FK → visit_slip_templates.id", isForeignKey: true, references: "visit_slip_templates.id" },
        { name: "section_key", type: "VARCHAR(30)", nullable: false, comment: "Key เช่น header, visitor, host, wifi, qrCode" },
        { name: "name", type: "VARCHAR(80)", nullable: false, comment: "ชื่อ Section (TH)" },
        { name: "name_en", type: "VARCHAR(80)", nullable: false, comment: "ชื่อ Section (EN)" },
        { name: "is_enabled", type: "BOOLEAN", nullable: false, comment: "เปิดแสดง Section นี้", defaultValue: "true" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผล" },
      ],
      seedData: [
        { id: 1, template_id: 1, section_key: "header", name: "ส่วนหัว (Header)", name_en: "Header Section", is_enabled: true, sort_order: 1 },
        { id: 2, template_id: 1, section_key: "slipNumber", name: "เลขที่ Slip", name_en: "Slip Number", is_enabled: true, sort_order: 2 },
        { id: 3, template_id: 1, section_key: "visitor", name: "ข้อมูลผู้เยี่ยม", name_en: "Visitor Info", is_enabled: true, sort_order: 3 },
        { id: 4, template_id: 1, section_key: "host", name: "ข้อมูลผู้รับ", name_en: "Host Info", is_enabled: true, sort_order: 4 },
        { id: 5, template_id: 1, section_key: "time", name: "วันที่-เวลา", name_en: "Date & Time", is_enabled: true, sort_order: 5 },
        { id: 6, template_id: 1, section_key: "extras", name: "ข้อมูลเพิ่มเติม", name_en: "Additional Info", is_enabled: false, sort_order: 6 },
        { id: 7, template_id: 1, section_key: "wifi", name: "WiFi สำหรับผู้เยี่ยม", name_en: "Guest WiFi", is_enabled: true, sort_order: 7 },
        { id: 8, template_id: 1, section_key: "qrCode", name: "QR Code (Check-out)", name_en: "Checkout QR Code", is_enabled: true, sort_order: 8 },
        { id: 9, template_id: 1, section_key: "footer", name: "ส่วนท้าย (Footer)", name_en: "Footer Section", is_enabled: true, sort_order: 9 },
      ],
    },
    {
      name: "visit_slip_fields",
      comment: "ฟิลด์ข้อมูลแต่ละรายการใน Section — เปิด/ปิด, แก้ไข Label, เรียงลำดับได้",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "section_id", type: "INT", nullable: false, comment: "FK → visit_slip_sections.id", isForeignKey: true, references: "visit_slip_sections.id" },
        { name: "field_key", type: "VARCHAR(30)", nullable: false, comment: "Key ของฟิลด์ เช่น visitorName, wifiSsid" },
        { name: "label", type: "VARCHAR(100)", nullable: false, comment: "ป้ายกำกับ (TH) — แก้ไขได้ถ้า is_editable=true" },
        { name: "label_en", type: "VARCHAR(100)", nullable: false, comment: "ป้ายกำกับ (EN)" },
        { name: "is_enabled", type: "BOOLEAN", nullable: false, comment: "เปิดแสดง Field นี้หรือไม่", defaultValue: "true" },
        { name: "is_editable", type: "BOOLEAN", nullable: false, comment: "อนุญาตให้แก้ไข Label ได้หรือไม่", defaultValue: "false" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับภายใน Section" },
      ],
      seedData: [
        // Section 1: Header
        { id: 1, section_id: 1, field_key: "orgLogo", label: "โลโก้หน่วยงาน", label_en: "Organization Logo", is_enabled: true, is_editable: false, sort_order: 1 },
        { id: 2, section_id: 1, field_key: "orgName", label: "กระทรวงการท่องเที่ยวและกีฬา", label_en: "Ministry of Tourism and Sports", is_enabled: true, is_editable: true, sort_order: 2 },
        { id: 3, section_id: 1, field_key: "orgNameEn", label: "Ministry of Tourism and Sports", label_en: "Org Name (EN)", is_enabled: true, is_editable: true, sort_order: 3 },
        { id: 4, section_id: 1, field_key: "slipTitle", label: "VISITOR PASS", label_en: "Slip Title", is_enabled: true, is_editable: true, sort_order: 4 },
        // Section 2: Slip Number
        { id: 5, section_id: 2, field_key: "slipNumberLabel", label: "เลขที่ / Slip No.", label_en: "Label", is_enabled: true, is_editable: true, sort_order: 1 },
        { id: 6, section_id: 2, field_key: "slipNumber", label: "eVMS-25680315-0042", label_en: "Number", is_enabled: true, is_editable: false, sort_order: 2 },
        // Section 3: Visitor Info
        { id: 7, section_id: 3, field_key: "visitorName", label: "ชื่อ / Name", label_en: "Visitor Name", is_enabled: true, is_editable: true, sort_order: 1 },
        { id: 8, section_id: 3, field_key: "visitorNameEn", label: "ชื่อ (EN)", label_en: "Name (EN)", is_enabled: true, is_editable: true, sort_order: 2 },
        { id: 9, section_id: 3, field_key: "idNumber", label: "เลขบัตร / ID", label_en: "ID Number", is_enabled: true, is_editable: true, sort_order: 3 },
        { id: 10, section_id: 3, field_key: "visitPurpose", label: "วัตถุประสงค์ / Purpose", label_en: "Visit Purpose", is_enabled: true, is_editable: true, sort_order: 4 },
        { id: 11, section_id: 3, field_key: "visitPurposeEn", label: "Purpose (EN)", label_en: "Purpose (EN)", is_enabled: true, is_editable: true, sort_order: 5 },
        // Section 4: Host Info
        { id: 12, section_id: 4, field_key: "hostName", label: "ผู้รับ / Host", label_en: "Host Name", is_enabled: true, is_editable: true, sort_order: 1 },
        { id: 13, section_id: 4, field_key: "department", label: "หน่วยงาน / Dept", label_en: "Department", is_enabled: true, is_editable: true, sort_order: 2 },
        { id: 14, section_id: 4, field_key: "accessZone", label: "พื้นที่ / Zone", label_en: "Access Zone", is_enabled: true, is_editable: true, sort_order: 3 },
        // Section 5: Date & Time
        { id: 15, section_id: 5, field_key: "visitDate", label: "วันที่ / Date", label_en: "Date", is_enabled: true, is_editable: true, sort_order: 1 },
        { id: 16, section_id: 5, field_key: "timeIn", label: "เข้า / In", label_en: "Time In", is_enabled: true, is_editable: true, sort_order: 2 },
        { id: 17, section_id: 5, field_key: "timeOut", label: "ออก / Out", label_en: "Time Out", is_enabled: true, is_editable: true, sort_order: 3 },
        // Section 6: Extras (disabled by default)
        { id: 18, section_id: 6, field_key: "companions", label: "ผู้ติดตาม", label_en: "Companions", is_enabled: false, is_editable: true, sort_order: 1 },
        { id: 19, section_id: 6, field_key: "vehiclePlate", label: "ทะเบียนรถ", label_en: "Vehicle Plate", is_enabled: false, is_editable: true, sort_order: 2 },
        // Section 7: WiFi
        { id: 20, section_id: 7, field_key: "wifiSsid", label: "SSID", label_en: "Network Name", is_enabled: true, is_editable: false, sort_order: 1 },
        { id: 21, section_id: 7, field_key: "wifiPass", label: "รหัส WiFi", label_en: "Password", is_enabled: true, is_editable: false, sort_order: 2 },
        { id: 22, section_id: 7, field_key: "wifiExpiry", label: "ใช้ได้ถึง", label_en: "Valid Until", is_enabled: true, is_editable: false, sort_order: 3 },
        // Section 8: QR Code
        { id: 23, section_id: 8, field_key: "qrCode", label: "QR Code", label_en: "QR Code", is_enabled: true, is_editable: false, sort_order: 1 },
        { id: 24, section_id: 8, field_key: "qrLabel", label: "สแกนเพื่อ Check-out / Scan to Check-out", label_en: "QR Label", is_enabled: true, is_editable: true, sort_order: 2 },
        // Section 9: Footer
        { id: 25, section_id: 9, field_key: "footerTh", label: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร", label_en: "Footer TH", is_enabled: true, is_editable: true, sort_order: 1 },
        { id: 26, section_id: 9, field_key: "footerEn", label: "Please return this pass when leaving", label_en: "Footer EN", is_enabled: true, is_editable: true, sort_order: 2 },
      ],
    },
    {
      name: "purpose_slip_mappings",
      comment: "จับคู่ วัตถุประสงค์ ↔ Template Visit Slip — กำหนดว่าวัตถุประสงค์ใดใช้ Template ไหน",
      columns: [
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id (PK)", isPrimaryKey: true, isForeignKey: true, references: "visit_purposes.id" },
        { name: "slip_template_id", type: "INT", nullable: true, comment: "FK → visit_slip_templates.id — null = ใช้ Template default", isForeignKey: true, references: "visit_slip_templates.id" },
      ],
      seedData: [
        { visit_purpose_id: 1, slip_template_id: null },
        { visit_purpose_id: 2, slip_template_id: null },
        { visit_purpose_id: 3, slip_template_id: 1 },
        { visit_purpose_id: 4, slip_template_id: 1 },
      ],
    },
  ],
  relationships: [
    "visit_slip_templates 1 ──→ N visit_slip_sections (แต่ละ Template มีหลาย Section)",
    "visit_slip_sections 1 ──→ N visit_slip_fields (แต่ละ Section มีหลาย Field)",
    "visit_slip_templates 1 ←──→ N visit_purposes ผ่าน purpose_slip_mappings",
    "purpose_slip_mappings.slip_template_id = null → ใช้ Template ที่ is_default=true",
  ],
};

// ════════════════════════════════════════════════════
// 11. PDPA / นโยบายคุ้มครองข้อมูลส่วนบุคคล
// ════════════════════════════════════════════════════

const pdpaConsentSchema: PageSchema = {
  pageId: "pdpa-consent",
  menuName: "PDPA / นโยบายคุ้มครองข้อมูล",
  menuNameEn: "PDPA Consent Settings",
  path: "/web/settings/pdpa-consent",
  description: "จัดการข้อความนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) 2 ภาษา — แสดงบน Kiosk/LINE OA, ตั้งค่า retention, เลือกช่องทางแสดง, ประวัติเวอร์ชัน, และ log การยินยอม",
  tables: [
    {
      name: "pdpa_consent_configs",
      comment: "ตารางการตั้งค่า PDPA หลัก — ข้อความนโยบาย 2 ภาษา, ระยะเวลาเก็บข้อมูล, เงื่อนไข UI, ช่องทางแสดง",
      columns: [
        { name: "id", type: "INT AUTO_INCREMENT", nullable: false, comment: "รหัสการตั้งค่า (PK)", isPrimaryKey: true },
        { name: "text_th", type: "TEXT", nullable: false, comment: "เนื้อหานโยบาย PDPA (ภาษาไทย)" },
        { name: "text_en", type: "TEXT", nullable: false, comment: "เนื้อหานโยบาย PDPA (ภาษาอังกฤษ)" },
        { name: "retention_days", type: "INT", nullable: false, comment: "ระยะเวลาจัดเก็บข้อมูล (วัน)", defaultValue: "90" },
        { name: "require_scroll", type: "BOOLEAN", nullable: false, comment: "ต้องเลื่อนอ่านจบก่อนยอมรับ", defaultValue: "true" },
        { name: "display_channels", type: "JSON", nullable: false, comment: "ช่องทางที่แสดง consent เช่น [\"kiosk\",\"line\"] — บางเวอร์ชันอาจแสดงเฉพาะ Kiosk หรือ LINE OA", defaultValue: "[\"kiosk\",\"line\"]" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "version", type: "INT", nullable: false, comment: "เลขเวอร์ชัน (เพิ่มทุกครั้งที่แก้ไขข้อความ)", defaultValue: "1" },
        { name: "updated_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้แก้ไขล่าสุด", isForeignKey: true, references: "staff.id" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, text_th: "พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)\n\nกระทรวงการท่องเที่ยวและกีฬา (\"หน่วยงาน\") จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน...", text_en: "Personal Data Protection Act B.E. 2562 (PDPA)\n\nThe Ministry of Tourism and Sports (\"the Organization\") will collect, use, and disclose your personal data...", retention_days: 90, require_scroll: true, display_channels: '["kiosk","line"]', is_active: true, version: 1, updated_by: null },
      ],
    },
    {
      name: "pdpa_consent_versions",
      comment: "ประวัติเวอร์ชัน PDPA — เก็บทุกครั้งที่มีการแก้ไขข้อความหรือสร้างใหม่ สำหรับ audit trail",
      columns: [
        { name: "id", type: "INT AUTO_INCREMENT", nullable: false, comment: "รหัสเวอร์ชัน (PK)", isPrimaryKey: true },
        { name: "config_id", type: "INT", nullable: false, comment: "FK → pdpa_consent_configs.id", isForeignKey: true, references: "pdpa_consent_configs.id" },
        { name: "version", type: "INT", nullable: false, comment: "เลขเวอร์ชัน" },
        { name: "text_th", type: "TEXT", nullable: false, comment: "เนื้อหา TH ณ เวอร์ชันนั้น" },
        { name: "text_en", type: "TEXT", nullable: false, comment: "เนื้อหา EN ณ เวอร์ชันนั้น" },
        { name: "retention_days", type: "INT", nullable: false, comment: "ระยะเวลาเก็บข้อมูล ณ เวอร์ชันนั้น" },
        { name: "require_scroll", type: "BOOLEAN", nullable: false, comment: "ต้องเลื่อนอ่านจบก่อนยอมรับ", defaultValue: "true" },
        { name: "display_channels", type: "JSON", nullable: false, comment: "ช่องทางที่แสดง consent ณ เวอร์ชันนั้น เช่น [\"kiosk\"] หรือ [\"kiosk\",\"line\"]", defaultValue: "[\"kiosk\",\"line\"]" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "เวอร์ชันที่ใช้งานอยู่ (active ได้ 1 เวอร์ชัน)", defaultValue: "false" },
        { name: "effective_date", type: "DATE", nullable: false, comment: "วันที่มีผลบังคับใช้" },
        { name: "changed_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้แก้ไข", isForeignKey: true, references: "staff.id" },
        { name: "change_note", type: "VARCHAR(255)", nullable: true, comment: "หมายเหตุการเปลี่ยนแปลง" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่บันทึกเวอร์ชัน", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, config_id: 1, version: 1, text_th: "(ข้อความ PDPA v1)...", text_en: "(PDPA text v1)...", retention_days: 90, require_scroll: true, display_channels: '["kiosk","line"]', is_active: false, effective_date: "2025-01-01", changed_by: null, change_note: "เวอร์ชันเริ่มต้น" },
        { id: 2, config_id: 1, version: 2, text_th: "(ข้อความ PDPA v2 + สิทธิเจ้าของข้อมูล)...", text_en: "(PDPA text v2 + data subject rights)...", retention_days: 90, require_scroll: true, display_channels: '["kiosk","line"]', is_active: false, effective_date: "2025-06-01", changed_by: 1, change_note: "เพิ่มสิทธิเจ้าของข้อมูล + ทะเบียนรถ" },
        { id: 3, config_id: 1, version: 3, text_th: "(ข้อความ PDPA v3 + การเปิดเผยข้อมูล)...", text_en: "(PDPA text v3 + data disclosure)...", retention_days: 120, require_scroll: true, display_channels: '["kiosk"]', is_active: true, effective_date: "2026-01-15", changed_by: 1, change_note: "เพิ่มหมวดการเปิดเผยข้อมูล + retention 120 วัน" },
      ],
    },
    {
      name: "pdpa_consent_logs",
      comment: "บันทึกการยินยอม PDPA ของผู้เยี่ยม — เก็บทุกครั้งที่ผู้เยี่ยมกดยอมรับบน Kiosk/LINE OA",
      columns: [
        { name: "id", type: "INT AUTO_INCREMENT", nullable: false, comment: "รหัส Log (PK)", isPrimaryKey: true },
        { name: "visitor_id", type: "INT", nullable: false, comment: "FK → visitors.id ผู้เยี่ยมที่ยินยอม", isForeignKey: true, references: "visitors.id" },
        { name: "config_version", type: "INT", nullable: false, comment: "เลขเวอร์ชัน PDPA ที่ยินยอม" },
        { name: "consent_channel", type: "ENUM('kiosk','line','counter','web')", nullable: false, comment: "ช่องทางที่ยินยอม" },
        { name: "ip_address", type: "VARCHAR(45)", nullable: true, comment: "IP ของอุปกรณ์ที่ใช้" },
        { name: "device_id", type: "VARCHAR(100)", nullable: true, comment: "รหัส Kiosk/อุปกรณ์" },
        { name: "consented_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่ยินยอม", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "expires_at", type: "TIMESTAMP", nullable: false, comment: "วันหมดอายุ (consented_at + retention_days)" },
      ],
      seedData: [
        { id: 1, visitor_id: 1, config_version: 1, consent_channel: "kiosk", ip_address: "192.168.1.100", device_id: "KIOSK-01", consented_at: "2026-03-15 09:30:00", expires_at: "2026-06-13 09:30:00" },
        { id: 2, visitor_id: 2, config_version: 1, consent_channel: "line", ip_address: null, device_id: null, consented_at: "2026-03-15 10:15:00", expires_at: "2026-06-13 10:15:00" },
        { id: 3, visitor_id: 3, config_version: 1, consent_channel: "counter", ip_address: "192.168.1.50", device_id: "COUNTER-01", consented_at: "2026-03-14 14:00:00", expires_at: "2026-06-12 14:00:00" },
      ],
    },
  ],
  relationships: [
    "pdpa_consent_configs 1 ──→ N pdpa_consent_versions (ทุกครั้งที่แก้ไขหรือสร้างใหม่ → สร้าง version ใหม่)",
    "pdpa_consent_logs.config_version ──→ pdpa_consent_versions.version (อ้างอิงเวอร์ชันที่ยินยอม)",
    "pdpa_consent_logs.visitor_id ──→ visitors.id (ผู้เยี่ยมที่ยินยอม)",
    "pdpa_consent_configs.updated_by ──→ staff.id (ผู้แก้ไขล่าสุด)",
    "Kiosk/LINE OA ──→ ตรวจ display_channels ก่อนแสดง consent (แสดงเฉพาะช่องทางที่กำหนด)",
  ],
};

// ════════════════════════════════════════════════════
// 12. ตารางข้อมูลธุรกรรม (Transactional — Visit Records)
// ════════════════════════════════════════════════════

const visitRecordsSchema: PageSchema = {
  pageId: "visit-records",
  menuName: "ข้อมูลธุรกรรมการเข้าพื้นที่",
  menuNameEn: "Visit Records (Transactional)",
  path: "/web/appointments",
  description: "ตารางเก็บข้อมูลการนัดหมายและเข้าพื้นที่ — สร้างจาก LINE / Web / Kiosk / Counter",
  tables: [
    {
      name: "visit_records",
      comment: "ตารางบันทึกการนัดหมาย/เข้าพื้นที่ — ทุกช่องทาง",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสธุรกรรม (PK, running number เริ่มจาก 1)", isPrimaryKey: true },
        { name: "booking_code", type: "VARCHAR(30)", nullable: false, comment: "รหัสนัดหมาย eVMS-YYYYMMDD-XXXX", isUnique: true },
        { name: "visitor_id", type: "INT", nullable: false, comment: "FK → visitors.id", isForeignKey: true, references: "visitors.id" },
        { name: "host_staff_id", type: "INT", nullable: true, comment: "FK → staff.id ผู้ที่ต้องการพบ", isForeignKey: true, references: "staff.id" },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id", isForeignKey: true, references: "departments.id" },
        { name: "entry_mode", type: "ENUM('single','period')", nullable: false, comment: "ครั้งเดียว / ช่วงเวลา", defaultValue: "single" },
        { name: "date_start", type: "DATE", nullable: false, comment: "วันเริ่มต้น" },
        { name: "date_end", type: "DATE", nullable: true, comment: "วันสิ้นสุด (เฉพาะ period mode)" },
        { name: "time_start", type: "TIME", nullable: false, comment: "เวลาเริ่ม" },
        { name: "time_end", type: "TIME", nullable: false, comment: "เวลาสิ้นสุด" },
        { name: "status", type: "ENUM('pending','approved','rejected','checked-in','checked-out','cancelled','expired','no-show')", nullable: false, comment: "สถานะรายการ", defaultValue: "pending" },
        { name: "created_channel", type: "ENUM('line','web','kiosk','counter')", nullable: false, comment: "ช่องทางที่สร้างรายการ" },
        { name: "checkin_channel", type: "ENUM('kiosk','counter')", nullable: true, comment: "ช่องทางที่ Check-in จริง" },
        { name: "wifi_requested", type: "BOOLEAN", nullable: false, comment: "ผู้จองขอรับ WiFi ไว้ตอนนัดหมายล่วงหน้า (LINE/Web)", defaultValue: "false" },
        { name: "wifi_accepted", type: "BOOLEAN", nullable: true, comment: "ผู้เยี่ยมยืนยันรับ WiFi ตอน Check-in (Kiosk/Counter)" },
        { name: "wifi_ssid", type: "VARCHAR(50)", nullable: true, comment: "SSID ที่แจก (ถ้ารับ WiFi)" },
        { name: "wifi_password", type: "VARCHAR(50)", nullable: true, comment: "รหัส WiFi ที่แจก" },
        { name: "wifi_valid_until", type: "TIMESTAMP", nullable: true, comment: "WiFi ใช้ได้ถึงเมื่อไร" },
        { name: "line_linked", type: "BOOLEAN", nullable: false, comment: "ผู้เยี่ยมผูก LINE OA ไว้ — ใช้ตัดสินถามพิมพ์ slip", defaultValue: "false" },
        { name: "slip_printed", type: "BOOLEAN", nullable: true, comment: "พิมพ์ slip หรือไม่ (null = ไม่ได้ถาม, true = พิมพ์, false = ไม่พิมพ์/ส่ง LINE)" },
        { name: "slip_number", type: "VARCHAR(30)", nullable: true, comment: "เลขที่ slip eVMS-25680315-0042" },
        { name: "companions_count", type: "INT", nullable: false, comment: "จำนวนผู้ติดตาม", defaultValue: "0" },
        { name: "vehicle_plate", type: "VARCHAR(20)", nullable: true, comment: "เลขทะเบียนรถ (ถ้ามี)" },
        { name: "face_photo_path", type: "VARCHAR(255)", nullable: true, comment: "ที่เก็บภาพถ่ายใบหน้า" },
        { name: "id_method", type: "ENUM('thai-id-card','passport','thai-id-app')", nullable: true, comment: "วิธียืนยันตัวตนที่ใช้ตอน Check-in" },
        { name: "service_point_id", type: "INT", nullable: true, comment: "FK → service_points.id จุดบริการที่ Check-in", isForeignKey: true, references: "service_points.id" },
        { name: "checkin_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-in จริง" },
        { name: "checkout_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-out" },
        { name: "checkout_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้ทำ Check-out", isForeignKey: true, references: "staff.id" },
        { name: "approved_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้อนุมัติ", isForeignKey: true, references: "staff.id" },
        { name: "approved_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่อนุมัติ" },
        { name: "rejected_reason", type: "TEXT", nullable: true, comment: "เหตุผลที่ไม่อนุมัติ" },
        { name: "notes", type: "TEXT", nullable: true, comment: "หมายเหตุเพิ่มเติม" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, booking_code: "eVMS-20260315-0042", visitor_id: 1, host_staff_id: 2, visit_purpose_id: 2, department_id: 3, entry_mode: "single", date_start: "2026-03-15", time_start: "10:00", time_end: "11:30", status: "approved", created_channel: "line", wifi_requested: true, line_linked: true, slip_printed: null, companions_count: 0, created_at: "2026-03-14 15:30:00" },
        { id: 2, booking_code: "eVMS-20260315-0043", visitor_id: 2, host_staff_id: 3, visit_purpose_id: 1, department_id: 1, entry_mode: "single", date_start: "2026-03-15", time_start: "14:00", time_end: "15:00", status: "checked-in", created_channel: "web", wifi_requested: false, line_linked: false, slip_printed: true, companions_count: 1, checkin_channel: "kiosk", checkin_at: "2026-03-15 13:55:00", service_point_id: 1, created_at: "2026-03-13 09:00:00" },
        { id: 3, booking_code: "eVMS-20260315-0044", visitor_id: 3, host_staff_id: 5, visit_purpose_id: 5, department_id: 2, entry_mode: "single", date_start: "2026-03-15", time_start: "09:00", time_end: "10:30", status: "checked-in", created_channel: "line", wifi_requested: true, line_linked: true, slip_printed: false, companions_count: 0, checkin_channel: "kiosk", checkin_at: "2026-03-15 08:50:00", service_point_id: 1, created_at: "2026-03-12 11:00:00" },
      ],
    },
  ],
  relationships: [
    "visit_records.visitor_id ──→ visitors.id (ผู้เยี่ยม)",
    "visit_records.host_staff_id ──→ staff.id (ผู้ที่ต้องการพบ)",
    "visit_records.visit_purpose_id ──→ visit_purposes.id (วัตถุประสงค์)",
    "visit_records.department_id ──→ departments.id (แผนก)",
    "visit_records.service_point_id ──→ service_points.id (จุดบริการที่ Check-in)",
    "visit_records.approved_by ──→ staff.id (ผู้อนุมัติ)",
    "visit_records.checkout_by ──→ staff.id (ผู้ทำ Check-out)",
    "wifi_requested = true → Kiosk จะ pre-select WiFi ให้อัตโนมัติ",
    "line_linked = true + slip_printed = false → ส่งผ่าน LINE แทนพิมพ์ (ลดกระดาษ)",
    "line_linked = true → หน้า SUCCESS ถามว่าต้องการพิมพ์ slip หรือไม่",
  ],
};

// ════════════════════════════════════════════════════
// 13. การนัดหมาย (Appointments)
// ════════════════════════════════════════════════════

const appointmentsSchema: PageSchema = {
  pageId: "appointments",
  menuName: "การนัดหมาย",
  menuNameEn: "Appointments",
  path: "/web/appointments",
  description: "จัดการนัดหมายผู้มาติดต่อ — สร้าง/อนุมัติ/ปฏิเสธ, ค้นหา, ติดตามสถานะ, จัดการผู้ติดตาม, WiFi\n\nAPI Endpoints:\n• GET /api/appointments — รายการนัดหมาย (filter: status, date, type, created_by, search)\n• GET /api/appointments/:id — รายละเอียดนัดหมาย\n• POST /api/appointments — สร้างนัดหมายใหม่\n• PATCH /api/appointments/:id — แก้ไข/อนุมัติ/ปฏิเสธ\n• DELETE /api/appointments/:id — ยกเลิกนัดหมาย\n• GET /api/appointments/:id/companions — รายชื่อผู้ติดตาม\n• POST /api/appointments/:id/companions — เพิ่มผู้ติดตาม\n• GET /api/appointments/:id/equipment — รายการอุปกรณ์",
  tables: [
    {
      name: "visitors",
      comment: "ตารางผู้มาติดต่อ — เก็บข้อมูลผู้เยี่ยมทุกคนที่เคยลงทะเบียนในระบบ",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสผู้มาติดต่อ (PK, running number เริ่มจาก 1)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: true, comment: "ชื่อ-นามสกุล (ภาษาอังกฤษ)" },
        { name: "id_number", type: "VARCHAR(20)", nullable: false, comment: "เลขบัตรประชาชน / Passport" },
        { name: "id_type", type: "ENUM('thai-id','passport','driver-license')", nullable: false, comment: "ประเภทเอกสารยืนยันตัวตน" },
        { name: "company", type: "VARCHAR(150)", nullable: true, comment: "บริษัท / หน่วยงาน" },
        { name: "phone", type: "VARCHAR(20)", nullable: false, comment: "เบอร์โทรศัพท์" },
        { name: "email", type: "VARCHAR(100)", nullable: true, comment: "อีเมล" },
        { name: "line_user_id", type: "VARCHAR(50)", nullable: true, comment: "LINE User ID (ถ้าผูก LINE OA)" },
        { name: "photo", type: "VARCHAR(255)", nullable: true, comment: "URL รูปถ่ายใบหน้า" },
        { name: "nationality", type: "VARCHAR(50)", nullable: true, comment: "สัญชาติ" },
        { name: "is_blocked", type: "BOOLEAN", nullable: false, comment: "สถานะถูกบล็อก", defaultValue: "false" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, name: "นายวิชัย สุขสำราญ", name_en: "Wichai Suksamran", id_number: "1100700123456", id_type: "thai-id", company: "บจก. เทคโนโลยีสยาม", phone: "081-234-5678", email: "wichai@siamtech.co.th", nationality: "ไทย", is_blocked: false },
        { id: 2, name: "นางสาวพรทิพย์ มีสุข", name_en: "Porntip Meesuk", id_number: "1103700234567", id_type: "thai-id", company: "บจก. ท่องเที่ยวไทย", phone: "089-876-5432", email: "porntip@tourismthai.com", nationality: "ไทย", is_blocked: false },
        { id: 3, name: "Mr. James Wilson", name_en: "James Wilson", id_number: "AB1234567", id_type: "passport", company: "World Tourism Org", phone: "092-345-6789", email: "j.wilson@unwto.org", nationality: "British", is_blocked: false },
        { id: 4, name: "นายสมศักดิ์ จริงใจ", name_en: "Somsak Jingjai", id_number: "1100700345678", id_type: "thai-id", company: "บจก. คอนสตรัคชั่น พลัส", phone: "086-111-2222", nationality: "ไทย", is_blocked: false },
        { id: 5, name: "นางสาวอรุณี แสงดาว", name_en: "Arunee Saengdao", id_number: "1101800456789", id_type: "thai-id", company: "สำนักข่าว TNN", phone: "085-333-4444", email: "arunee@tnn.co.th", nationality: "ไทย", is_blocked: false },
      ],
    },
    {
      name: "staff",
      comment: "ตารางเจ้าหน้าที่ / พนักงาน — ใช้เป็น host ผู้ที่ต้องการพบ และผู้อนุมัติ",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสเจ้าหน้าที่ (PK, running number เริ่มจาก 1)", isPrimaryKey: true },
        { name: "employee_id", type: "VARCHAR(20)", nullable: false, comment: "รหัสพนักงาน เช่น EMP-001", isUnique: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาอังกฤษ)" },
        { name: "position", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่ง" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id แผนกที่สังกัด", isForeignKey: true, references: "departments.id" },
        { name: "email", type: "VARCHAR(100)", nullable: false, comment: "อีเมลราชการ" },
        { name: "phone", type: "VARCHAR(20)", nullable: false, comment: "เบอร์โทรศัพท์" },
        { name: "role", type: "ENUM('admin','supervisor','officer','staff','security','visitor')", nullable: false, comment: "บทบาทในระบบ" },
        { name: "status", type: "ENUM('active','inactive','locked')", nullable: false, comment: "สถานะบัญชี", defaultValue: "active" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, employee_id: "EMP-001", name: "คุณสมศรี รักงาน", name_en: "Somsri Rakngarn", position: "ผู้อำนวยการกองกิจการท่องเที่ยว", department_id: 4, email: "somsri.r@mots.go.th", phone: "02-283-1500", role: "staff", status: "active" },
        { id: 2, employee_id: "EMP-002", name: "คุณประวิทย์ ศรีสุข", name_en: "Prawit Srisuk", position: "หัวหน้าฝ่ายบริหารทั่วไป", department_id: 2, email: "prawit.s@mots.go.th", phone: "02-283-1501", role: "supervisor", status: "active" },
        { id: 3, employee_id: "EMP-003", name: "คุณนภา ใจดี", name_en: "Napa Jaidee", position: "นักวิเคราะห์นโยบาย", department_id: 8, email: "napa.j@mots.go.th", phone: "02-283-1502", role: "staff", status: "active" },
        { id: 4, employee_id: "EMP-004", name: "คุณธนกร วงศ์สวัสดิ์", name_en: "Thanakorn Wongsawat", position: "เจ้าหน้าที่ รปภ.", department_id: 2, email: "thanakorn.w@mots.go.th", phone: "02-283-1510", role: "security", status: "active" },
        { id: 5, employee_id: "EMP-005", name: "คุณอรพิณ วรรณภา", name_en: "Orapin Wannapa", position: "ผู้อำนวยการกองการต่างประเทศ", department_id: 3, email: "orapin.w@mots.go.th", phone: "02-283-1520", role: "staff", status: "active" },
      ],
    },
    {
      name: "appointments",
      comment: "หลัก — ข้อมูลนัดหมาย (id เป็น INT running number ไม่ใช่ SERIAL — generate ฝั่ง application)",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสนัดหมาย (PK, running number เริ่มจาก 1 — generate ฝั่ง app: SELECT COALESCE(MAX(id),0)+1)", isPrimaryKey: true },
        { name: "code", type: "VARCHAR(30)", nullable: false, comment: "รหัสนัดหมาย format: eVMS-YYYYMMDD-XXXX (running 4 หลัก reset ทุกวัน)", isUnique: true },
        { name: "visitor_id", type: "INT", nullable: false, comment: "FK → visitors.id ผู้มาติดต่อ", isForeignKey: true, references: "visitors.id" },
        { name: "host_id", type: "INT", nullable: false, comment: "FK → staff.id ผู้ที่ต้องการพบ", isForeignKey: true, references: "staff.id" },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id วัตถุประสงค์", isForeignKey: true, references: "visit_purposes.id" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id แผนกที่ไป", isForeignKey: true, references: "departments.id" },
        { name: "type", type: "ENUM('official','meeting','document','contractor','delivery','other')", nullable: false, comment: "ประเภทการนัดหมาย (VisitType)" },
        { name: "status", type: "ENUM('pending','approved','rejected','confirmed','checked-in','checked-out','auto-checkout','overstay','blocked','cancelled')", nullable: false, comment: "สถานะนัดหมาย (VisitStatus)", defaultValue: "pending" },
        { name: "entry_mode", type: "ENUM('single','period')", nullable: false, comment: "ครั้งเดียว / ช่วงเวลา", defaultValue: "single" },
        { name: "date_start", type: "DATE", nullable: false, comment: "วันเริ่มต้นนัดหมาย" },
        { name: "date_end", type: "DATE", nullable: true, comment: "วันสิ้นสุด (เฉพาะ period mode)" },
        { name: "time_start", type: "TIME", nullable: false, comment: "เวลาเริ่ม" },
        { name: "time_end", type: "TIME", nullable: false, comment: "เวลาสิ้นสุด" },
        { name: "purpose", type: "VARCHAR(255)", nullable: false, comment: "วัตถุประสงค์การนัดหมาย (ข้อความอิสระ)" },
        { name: "companions_count", type: "INT", nullable: false, comment: "จำนวนผู้ติดตาม", defaultValue: "0" },
        { name: "created_by", type: "ENUM('visitor','staff')", nullable: false, comment: "สร้างโดยผู้มาติดต่อหรือเจ้าหน้าที่" },
        { name: "created_by_staff_id", type: "INT", nullable: true, comment: "FK → staff.id ถ้าสร้างโดยเจ้าหน้าที่", isForeignKey: true, references: "staff.id" },
        { name: "offer_wifi", type: "BOOLEAN", nullable: false, comment: "เสนอ WiFi ให้ผู้มาติดต่อ", defaultValue: "false" },
        { name: "wifi_requested", type: "BOOLEAN", nullable: false, comment: "ผู้มาติดต่อขอรับ WiFi", defaultValue: "false" },
        { name: "wifi_username", type: "VARCHAR(50)", nullable: true, comment: "ชื่อผู้ใช้ WiFi ที่แจก" },
        { name: "wifi_password", type: "VARCHAR(50)", nullable: true, comment: "รหัส WiFi ที่แจก" },
        { name: "slip_printed", type: "BOOLEAN", nullable: true, comment: "พิมพ์ slip หรือไม่ (null=ยังไม่ถึงขั้นตอน)" },
        { name: "area", type: "VARCHAR(100)", nullable: true, comment: "พื้นที่" },
        { name: "building", type: "VARCHAR(100)", nullable: true, comment: "อาคาร" },
        { name: "floor", type: "VARCHAR(20)", nullable: true, comment: "ชั้น" },
        { name: "room", type: "VARCHAR(50)", nullable: true, comment: "ห้อง" },
        { name: "vehicle_plate", type: "VARCHAR(20)", nullable: true, comment: "เลขทะเบียนรถ (ถ้ามี)" },
        { name: "notes", type: "TEXT", nullable: true, comment: "หมายเหตุเพิ่มเติม" },
        { name: "approved_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้อนุมัติ", isForeignKey: true, references: "staff.id" },
        { name: "approved_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่อนุมัติ" },
        { name: "rejected_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ปฏิเสธ" },
        { name: "rejected_reason", type: "TEXT", nullable: true, comment: "เหตุผลที่ปฏิเสธ" },
        { name: "checkin_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-in" },
        { name: "checkin_channel", type: "ENUM('kiosk','counter')", nullable: true, comment: "ช่องทางที่ Check-in" },
        { name: "checkout_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-out" },
        { name: "checkout_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้ทำ Check-out (null = auto)", isForeignKey: true, references: "staff.id" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, code: "eVMS-20260320-0001", visitor_id: 1, host_id: 2, visit_purpose_id: 1, department_id: 2, type: "official", status: "approved", entry_mode: "single", date_start: "2026-03-20", time_start: "10:00", time_end: "11:30", purpose: "ประชุมโครงการจัดงาน", companions_count: 0, created_by: "visitor", offer_wifi: true, wifi_requested: true, area: "กองกลาง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 2", room: "ห้องประชุม 201", created_at: "2026-03-19 14:00:00", approved_by: 2, approved_at: "2026-03-19 15:30:00" },
        { id: 2, code: "eVMS-20260320-0002", visitor_id: 2, host_id: 3, visit_purpose_id: 3, department_id: 8, type: "document", status: "checked-in", entry_mode: "single", date_start: "2026-03-20", time_start: "14:00", time_end: "15:00", purpose: "ส่งเอกสารโครงการ", companions_count: 1, created_by: "staff", created_by_staff_id: 4, offer_wifi: false, wifi_requested: false, slip_printed: true, area: "สำนักนโยบาย", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4", checkin_at: "2026-03-20 13:55:00", checkin_channel: "kiosk", created_at: "2026-03-18 09:00:00", approved_by: 3, approved_at: "2026-03-18 10:00:00" },
        { id: 3, code: "eVMS-20260321-0001", visitor_id: 3, host_id: 5, visit_purpose_id: 2, department_id: 3, type: "meeting", status: "pending", entry_mode: "single", date_start: "2026-03-21", time_start: "09:00", time_end: "10:30", purpose: "ประชุมความร่วมมือด้านการท่องเที่ยวระหว่างประเทศ", companions_count: 2, created_by: "staff", created_by_staff_id: 5, offer_wifi: true, wifi_requested: false, area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 501", created_at: "2026-03-17 11:00:00" },
        { id: 4, code: "eVMS-20260321-0002", visitor_id: 4, host_id: 1, visit_purpose_id: 4, department_id: 4, type: "contractor", status: "approved", entry_mode: "period", date_start: "2026-03-21", date_end: "2026-03-25", time_start: "08:00", time_end: "17:00", purpose: "ซ่อมบำรุงระบบแอร์ ชั้น 4", companions_count: 3, created_by: "staff", created_by_staff_id: 1, offer_wifi: false, area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4", vehicle_plate: "กข-1234", created_at: "2026-03-16 08:30:00", approved_by: 1, approved_at: "2026-03-16 09:00:00" },
        { id: 5, code: "eVMS-20260320-0003", visitor_id: 5, host_id: 3, visit_purpose_id: 1, department_id: 8, type: "official", status: "checked-out", entry_mode: "single", date_start: "2026-03-20", time_start: "09:00", time_end: "11:00", purpose: "สัมภาษณ์ข่าวนโยบายท่องเที่ยว", companions_count: 0, created_by: "visitor", offer_wifi: true, wifi_requested: true, wifi_username: "guest-0320-05", wifi_password: "Mots@2026", area: "สำนักนโยบาย", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4", checkin_at: "2026-03-20 08:50:00", checkin_channel: "counter", checkout_at: "2026-03-20 10:45:00", checkout_by: 4, created_at: "2026-03-19 16:00:00", approved_by: 3, approved_at: "2026-03-19 17:00:00" },
      ],
    },
    {
      name: "appointment_companions",
      comment: "ตารางผู้ติดตาม — แยกรายชื่อแต่ละคนสำหรับ check-in แยก",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสผู้ติดตาม (PK, running number)", isPrimaryKey: true },
        { name: "appointment_id", type: "INT", nullable: false, comment: "FK → appointments.id", isForeignKey: true, references: "appointments.id" },
        { name: "first_name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ" },
        { name: "last_name", type: "VARCHAR(100)", nullable: false, comment: "นามสกุล" },
        { name: "company", type: "VARCHAR(150)", nullable: true, comment: "บริษัท/หน่วยงาน" },
        { name: "phone", type: "VARCHAR(20)", nullable: true, comment: "เบอร์โทร" },
        { name: "is_checked_in", type: "BOOLEAN", nullable: false, comment: "Check-in แล้วหรือยัง", defaultValue: "false" },
        { name: "checkin_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-in" },
        { name: "is_blacklisted", type: "BOOLEAN", nullable: false, comment: "ตรวจพบอยู่ใน Blocklist", defaultValue: "false" },
      ],
      seedData: [
        { id: 1, appointment_id: 2, first_name: "สมศักดิ์", last_name: "มั่นคง", company: "บจก. ท่องเที่ยวไทย", phone: "081-999-8888", is_checked_in: true, checkin_at: "2026-03-20 13:55:00", is_blacklisted: false },
        { id: 2, appointment_id: 3, first_name: "Sarah", last_name: "Johnson", company: "World Tourism Org", phone: null, is_checked_in: false, is_blacklisted: false },
        { id: 3, appointment_id: 3, first_name: "David", last_name: "Lee", company: "UNWTO Asia-Pacific", phone: null, is_checked_in: false, is_blacklisted: false },
        { id: 4, appointment_id: 4, first_name: "สมชาย", last_name: "ช่างดี", company: "บจก. คอนสตรัคชั่น พลัส", phone: "086-222-3333", is_checked_in: false, is_blacklisted: false },
        { id: 5, appointment_id: 4, first_name: "วิชัย", last_name: "ช่างเก่ง", company: "บจก. คอนสตรัคชั่น พลัส", phone: "086-444-5555", is_checked_in: false, is_blacklisted: false },
        { id: 6, appointment_id: 4, first_name: "สุรศักดิ์", last_name: "แข็งแรง", company: "บจก. คอนสตรัคชั่น พลัส", phone: "086-666-7777", is_checked_in: false, is_blacklisted: false },
      ],
    },
    {
      name: "appointment_equipment",
      comment: "อุปกรณ์ที่นำเข้า — ผูกกับนัดหมาย",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสอุปกรณ์ (PK, running number)", isPrimaryKey: true },
        { name: "appointment_id", type: "INT", nullable: false, comment: "FK → appointments.id", isForeignKey: true, references: "appointments.id" },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่ออุปกรณ์" },
        { name: "quantity", type: "INT", nullable: false, comment: "จำนวน", defaultValue: "1" },
        { name: "serial_number", type: "VARCHAR(100)", nullable: true, comment: "หมายเลขเครื่อง / Serial" },
        { name: "description", type: "TEXT", nullable: true, comment: "รายละเอียดเพิ่มเติม" },
      ],
      seedData: [
        { id: 1, appointment_id: 3, name: "โน้ตบุ๊ก", quantity: 2, serial_number: "SN-WTO-001", description: "Laptop สำหรับนำเสนอ" },
        { id: 2, appointment_id: 4, name: "เครื่องมือซ่อมบำรุง", quantity: 1, serial_number: null, description: "ชุดเครื่องมือช่างแอร์" },
        { id: 3, appointment_id: 4, name: "อะไหล่", quantity: 5, serial_number: null, description: "Filter แอร์ ชั้น 4" },
      ],
    },
    {
      name: "appointment_status_logs",
      comment: "บันทึกการเปลี่ยนสถานะนัดหมาย — สำหรับ audit trail",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัส Log (PK, running number)", isPrimaryKey: true },
        { name: "appointment_id", type: "INT", nullable: false, comment: "FK → appointments.id", isForeignKey: true, references: "appointments.id" },
        { name: "from_status", type: "VARCHAR(30)", nullable: true, comment: "สถานะเดิม (null = สร้างใหม่)" },
        { name: "to_status", type: "VARCHAR(30)", nullable: false, comment: "สถานะใหม่" },
        { name: "changed_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้เปลี่ยน (null = system/visitor)", isForeignKey: true, references: "staff.id" },
        { name: "reason", type: "TEXT", nullable: true, comment: "เหตุผลการเปลี่ยนสถานะ" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่เปลี่ยน", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, appointment_id: 1, from_status: null, to_status: "pending", changed_by: null, reason: "สร้างนัดหมายผ่าน LINE OA", created_at: "2026-03-19 14:00:00" },
        { id: 2, appointment_id: 1, from_status: "pending", to_status: "approved", changed_by: 2, reason: "อนุมัติ", created_at: "2026-03-19 15:30:00" },
        { id: 3, appointment_id: 2, from_status: null, to_status: "pending", changed_by: 4, reason: "เจ้าหน้าที่สร้างให้", created_at: "2026-03-18 09:00:00" },
        { id: 4, appointment_id: 2, from_status: "pending", to_status: "approved", changed_by: 3, reason: "อนุมัติ", created_at: "2026-03-18 10:00:00" },
        { id: 5, appointment_id: 2, from_status: "approved", to_status: "checked-in", changed_by: null, reason: "Check-in ผ่าน Kiosk", created_at: "2026-03-20 13:55:00" },
      ],
    },
  ],
  relationships: [
    "appointments.visitor_id ──→ visitors.id (ผู้มาติดต่อ)",
    "appointments.host_id ──→ staff.id (ผู้ที่ต้องการพบ — เจ้าหน้าที่ผู้รับ)",
    "appointments.visit_purpose_id ──→ visit_purposes.id (วัตถุประสงค์)",
    "appointments.department_id ──→ departments.id (แผนกปลายทาง)",
    "appointments.approved_by ──→ staff.id (ผู้อนุมัติ)",
    "appointments.checkout_by ──→ staff.id (ผู้ทำ Check-out)",
    "appointments.created_by_staff_id ──→ staff.id (เจ้าหน้าที่ผู้สร้างนัดหมาย)",
    "appointment_companions.appointment_id ──→ appointments.id (ผู้ติดตาม — check-in แยกรายคน)",
    "appointment_equipment.appointment_id ──→ appointments.id (อุปกรณ์ที่นำเข้า)",
    "appointment_status_logs.appointment_id ──→ appointments.id (ประวัติเปลี่ยนสถานะ — audit trail)",
    "ID Generation: appointments.id ใช้ INT running number — app generate ด้วย SELECT COALESCE(MAX(id),0)+1 (ไม่ใช้ SERIAL/AUTO_INCREMENT)",
    "Code Format: eVMS-YYYYMMDD-XXXX — running 4 หลัก reset ทุกวัน",
  ],
};

// ════════════════════════════════════════════════════
// 14. ค้นหาผู้ติดต่อ (Visitor Search)
// ════════════════════════════════════════════════════

const searchSchema: PageSchema = {
  pageId: "search",
  menuName: "ค้นหาผู้ติดต่อ",
  menuNameEn: "Visitor Search",
  path: "/web/search",
  description: "ค้นหาผู้มาติดต่อ — ค้นหาตามชื่อ/บริษัท/รหัส, กรองตามประเภท/สถานะ/วัน, แสดงรายละเอียดผู้มาติดต่อ",
  tables: [
    {
      name: "visitors",
      comment: "ตารางผู้มาติดต่อ (reference — read-only search view)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: true, comment: "ชื่อ-นามสกุล (ภาษาอังกฤษ)" },
        { name: "company", type: "VARCHAR(150)", nullable: true, comment: "บริษัท / หน่วยงาน" },
        { name: "id_card", type: "VARCHAR(20)", nullable: true, comment: "เลขบัตรประชาชน / Passport" },
        { name: "phone", type: "VARCHAR(20)", nullable: true, comment: "เบอร์โทรศัพท์" },
        { name: "email", type: "VARCHAR(100)", nullable: true, comment: "อีเมล" },
        { name: "image_url", type: "VARCHAR(255)", nullable: true, comment: "URL รูปโปรไฟล์" },
      ],
      seedData: [],
    },
    {
      name: "appointments",
      comment: "ตารางนัดหมาย (reference — read-only search view)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "code", type: "VARCHAR(30)", nullable: false, comment: "รหัสนัดหมาย", isUnique: true },
        { name: "visitor_id", type: "INT", nullable: false, comment: "FK → visitors.id", isForeignKey: true, references: "visitors.id" },
        { name: "host_id", type: "INT", nullable: false, comment: "FK → staff.id", isForeignKey: true, references: "staff.id" },
        { name: "type", type: "ENUM('general','delivery','interview','maintenance','vip','contractor')", nullable: false, comment: "ประเภทการนัดหมาย" },
        { name: "status", type: "ENUM('pending','approved','rejected','checked-in','checked-out','cancelled','expired','no-show')", nullable: false, comment: "สถานะนัดหมาย" },
        { name: "date", type: "DATE", nullable: false, comment: "วันที่นัดหมาย" },
        { name: "time_start", type: "TIME", nullable: false, comment: "เวลาเริ่ม" },
        { name: "time_end", type: "TIME", nullable: false, comment: "เวลาสิ้นสุด" },
        { name: "purpose", type: "VARCHAR(255)", nullable: false, comment: "วัตถุประสงค์" },
        { name: "checkin_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-in" },
        { name: "checkout_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-out" },
      ],
      seedData: [],
    },
  ],
  relationships: [
    "appointments.visitor_id ──→ visitors.id (ผู้มาติดต่อ)",
    "appointments.host_id ──→ staff.id (ผู้ที่ต้องการพบ)",
    "Note: This is a search/read-only page — references appointments and visitors tables",
  ],
};

// ════════════════════════════════════════════════════
// 15. Blocklist (Blocklist Management)
// ════════════════════════════════════════════════════

const blocklistSchema: PageSchema = {
  pageId: "blocklist",
  menuName: "Blocklist",
  menuNameEn: "Blocklist Management",
  path: "/web/blocklist",
  description: "จัดการรายชื่อผู้ถูกบล็อก — ตรวจสอบด้วยชื่อ+นามสกุล (ไม่ใช้เลขบัตร เพราะระบบไม่เก็บ ID), ตรวจอัตโนมัติทุกช่องทาง: Kiosk, Counter, LINE OA, เจ้าหน้าที่สร้างนัดหมาย",
  tables: [
    {
      name: "blocklist",
      comment: "ตารางรายชื่อผู้ถูกบล็อก — ตรวจด้วย first_name + last_name (partial match, case-insensitive) ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID ไว้",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "first_name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อผู้ถูกบล็อก (ใช้ในการตรวจสอบ — match แบบ partial, case-insensitive)" },
        { name: "last_name", type: "VARCHAR(100)", nullable: false, comment: "นามสกุลผู้ถูกบล็อก (ใช้คู่กับ first_name ในการตรวจสอบ)" },
        { name: "company", type: "VARCHAR(200)", nullable: true, comment: "บริษัท/หน่วยงาน (เพื่อช่วยยืนยันตัวตน กรณีชื่อซ้ำ)" },
        { name: "visitor_id", type: "INT", nullable: true, comment: "FK → visitors.id อ้างอิงถ้ามีในระบบ (nullable — อาจบล็อกคนที่ยังไม่เคยเข้า)", isForeignKey: true, references: "visitors.id" },
        { name: "reason", type: "TEXT", nullable: false, comment: "เหตุผลที่บล็อก" },
        { name: "type", type: "ENUM('permanent','temporary')", nullable: false, comment: "ประเภทการบล็อก (ถาวร/ชั่วคราว)" },
        { name: "expiry_date", type: "DATE", nullable: true, comment: "วันหมดอายุ (เฉพาะ temporary)" },
        { name: "added_by", type: "INT", nullable: false, comment: "FK → staff.id ผู้เพิ่มรายการ", isForeignKey: true, references: "staff.id" },
        { name: "added_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่เพิ่ม", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะใช้งาน", defaultValue: "true" },
      ],
      seedData: [
        { id: 1, first_name: "สมศักดิ์", last_name: "ปัญญาดี", company: null, visitor_id: 10, reason: "พฤติกรรมไม่เหมาะสมในพื้นที่สำนักงาน", type: "permanent", expiry_date: null, added_by: 1, added_at: "2026-01-15 10:00:00", is_active: true },
        { id: 2, first_name: "John", last_name: "Smith", company: "ABC Corp", visitor_id: null, reason: "นำอุปกรณ์ต้องห้ามเข้าพื้นที่", type: "temporary", expiry_date: "2026-06-30", added_by: 2, added_at: "2026-03-01 14:30:00", is_active: true },
      ],
    },
    {
      name: "blocklist_check_logs",
      comment: "บันทึกการตรวจสอบ Blocklist ทุกครั้ง — เก็บทุก hit (พบ) และ attempt (พยายามเข้า) สำหรับ audit",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Log (PK)", isPrimaryKey: true },
        { name: "blocklist_id", type: "INT", nullable: false, comment: "FK → blocklist.id รายการที่ตรง", isForeignKey: true, references: "blocklist.id" },
        { name: "matched_name", type: "VARCHAR(200)", nullable: false, comment: "ชื่อ-นามสกุลที่ตรวจแล้วตรง" },
        { name: "check_channel", type: "ENUM('kiosk','counter','line','web_staff')", nullable: false, comment: "ช่องทางที่ตรวจพบ" },
        { name: "action_taken", type: "ENUM('denied','alerted','expired_allow')", nullable: false, comment: "การกระทำ: ปฏิเสธ/แจ้งเตือน/หมดอายุ-อนุญาต" },
        { name: "checked_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่ตรวจ", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "checked_by", type: "INT", nullable: true, comment: "FK → staff.id (ถ้าเป็นเจ้าหน้าที่ตรวจ)", isForeignKey: true, references: "staff.id" },
      ],
      seedData: [
        { id: 1, blocklist_id: 1, matched_name: "สมศักดิ์ ปัญญาดี", check_channel: "kiosk", action_taken: "denied", checked_at: "2026-03-20 09:15:00", checked_by: null },
      ],
    },
  ],
  relationships: [
    "blocklist.visitor_id ──→ visitors.id (อ้างอิงผู้ถูกบล็อก — nullable)",
    "blocklist.added_by ──→ staff.id (ผู้เพิ่มรายการ)",
    "blocklist_check_logs.blocklist_id ──→ blocklist.id (log การตรวจพบ)",
    "ตรวจสอบด้วย first_name + last_name (partial match) — ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID",
    "ตรวจทุกช่องทาง: Kiosk (สแกน QR/walk-in) → Counter (เจ้าหน้าที่ตรวจ) → LINE OA (จองนัดหมาย) → Web (เจ้าหน้าที่สร้างให้)",
  ],
};

// ════════════════════════════════════════════════════
// 16. รายงาน (Reports)
// ════════════════════════════════════════════════════

const reportsSchema: PageSchema = {
  pageId: "reports",
  menuName: "รายงาน",
  menuNameEn: "Reports",
  path: "/web/reports",
  description: "รายงานสถิติผู้มาติดต่อ — สรุปรายวัน/รายสัปดาห์/รายเดือน, กราฟแนวโน้ม, วิเคราะห์ตามประเภท/แผนก/ช่องทาง, ส่งออก Excel/PDF",
  tables: [
    {
      name: "report_daily_summary",
      comment: "สรุปรายวัน — aggregate view",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "date", type: "DATE", nullable: false, comment: "วันที่", isUnique: true },
        { name: "total_visitors", type: "INT", nullable: false, comment: "จำนวนผู้มาติดต่อทั้งหมด", defaultValue: "0" },
        { name: "total_appointments", type: "INT", nullable: false, comment: "จำนวนนัดหมายทั้งหมด", defaultValue: "0" },
        { name: "walkin_count", type: "INT", nullable: false, comment: "จำนวน Walk-in", defaultValue: "0" },
        { name: "checked_in", type: "INT", nullable: false, comment: "จำนวนที่ Check-in แล้ว", defaultValue: "0" },
        { name: "checked_out", type: "INT", nullable: false, comment: "จำนวนที่ Check-out แล้ว", defaultValue: "0" },
        { name: "overstay_count", type: "INT", nullable: false, comment: "จำนวนที่อยู่เกินเวลา", defaultValue: "0" },
        { name: "avg_visit_duration_min", type: "INT", nullable: true, comment: "ระยะเวลาเฉลี่ยการเข้าพื้นที่ (นาที)" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, date: "2026-03-20", total_visitors: 45, total_appointments: 38, walkin_count: 7, checked_in: 42, checked_out: 40, overstay_count: 2, avg_visit_duration_min: 65, created_at: "2026-03-20 23:59:00" },
        { id: 2, date: "2026-03-21", total_visitors: 52, total_appointments: 44, walkin_count: 8, checked_in: 50, checked_out: 48, overstay_count: 1, avg_visit_duration_min: 58, created_at: "2026-03-21 23:59:00" },
        { id: 3, date: "2026-03-22", total_visitors: 30, total_appointments: 25, walkin_count: 5, checked_in: 28, checked_out: 28, overstay_count: 0, avg_visit_duration_min: 72, created_at: "2026-03-22 23:59:00" },
        { id: 4, date: "2026-03-23", total_visitors: 60, total_appointments: 50, walkin_count: 10, checked_in: 55, checked_out: 52, overstay_count: 3, avg_visit_duration_min: 55, created_at: "2026-03-23 23:59:00" },
        { id: 5, date: "2026-03-24", total_visitors: 48, total_appointments: 40, walkin_count: 8, checked_in: 46, checked_out: 44, overstay_count: 1, avg_visit_duration_min: 62, created_at: "2026-03-24 23:59:00" },
      ],
    },
    {
      name: "report_department_stats",
      comment: "สถิติตามแผนก — aggregate view",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "date", type: "DATE", nullable: false, comment: "วันที่" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id", isForeignKey: true, references: "departments.id" },
        { name: "department_name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อแผนก (denormalized)" },
        { name: "visitor_count", type: "INT", nullable: false, comment: "จำนวนผู้มาติดต่อ", defaultValue: "0" },
        { name: "appointment_count", type: "INT", nullable: false, comment: "จำนวนนัดหมาย", defaultValue: "0" },
      ],
      seedData: [
        { id: 1, date: "2026-03-20", department_id: 1, department_name: "ฝ่ายบุคคล", visitor_count: 12, appointment_count: 10 },
        { id: 2, date: "2026-03-20", department_id: 2, department_name: "ฝ่ายไอที", visitor_count: 8, appointment_count: 7 },
        { id: 3, date: "2026-03-20", department_id: 3, department_name: "ฝ่ายการเงิน", visitor_count: 15, appointment_count: 13 },
        { id: 4, date: "2026-03-21", department_id: 1, department_name: "ฝ่ายบุคคล", visitor_count: 14, appointment_count: 12 },
        { id: 5, date: "2026-03-21", department_id: 2, department_name: "ฝ่ายไอที", visitor_count: 10, appointment_count: 9 },
      ],
    },
    {
      name: "report_visit_type_stats",
      comment: "สถิติตามประเภทการนัดหมาย — aggregate view",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "date", type: "DATE", nullable: false, comment: "วันที่" },
        { name: "visit_type", type: "ENUM('general','delivery','interview','maintenance','vip','contractor')", nullable: false, comment: "ประเภทการนัดหมาย" },
        { name: "visitor_count", type: "INT", nullable: false, comment: "จำนวนผู้มาติดต่อ", defaultValue: "0" },
      ],
      seedData: [
        { id: 1, date: "2026-03-20", visit_type: "general", visitor_count: 20 },
        { id: 2, date: "2026-03-20", visit_type: "delivery", visitor_count: 10 },
        { id: 3, date: "2026-03-20", visit_type: "interview", visitor_count: 5 },
        { id: 4, date: "2026-03-20", visit_type: "maintenance", visitor_count: 4 },
        { id: 5, date: "2026-03-20", visit_type: "vip", visitor_count: 6 },
      ],
    },
  ],
  relationships: [
    "report_department_stats.department_id ──→ departments.id (แผนก)",
    "Aggregated from appointments + visitors tables",
  ],
};

// ════════════════════════════════════════════════════
// 17. ภาพรวม Dashboard
// ════════════════════════════════════════════════════

const dashboardSchema: PageSchema = {
  pageId: "dashboard",
  menuName: "ภาพรวม",
  menuNameEn: "Dashboard",
  path: "/web/dashboard",
  description: "หน้าภาพรวมระบบ — แสดง KPI, สถานะวันนี้, แยกตามประเภท, รายการรออนุมัติ, ตารางผู้มาติดต่อทั้งหมด\n\nAPI Endpoints:\n• GET /api/dashboard/stats — สถิติภาพรวมวันนี้ (KPI cards)\n• GET /api/dashboard/status-overview — จำนวนแยกตามสถานะ\n• GET /api/dashboard/by-type — จำนวนแยกตามประเภทการเข้าพื้นที่\n• GET /api/dashboard/pending — รายการรออนุมัติ\n• GET /api/appointments?date=today — รายการผู้มาติดต่อวันนี้ (paginated, filterable)",
  tables: [
    {
      name: "appointments",
      comment: "ตารางนัดหมาย — แหล่งข้อมูลหลักของทุก section บน Dashboard (id = INT running number)",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสนัดหมาย (PK, running number)", isPrimaryKey: true },
        { name: "code", type: "VARCHAR(30)", nullable: false, comment: "รหัสนัดหมาย eVMS-YYYYMMDD-XXXX", isUnique: true },
        { name: "visitor_id", type: "INT", nullable: false, comment: "FK → visitors.id", isForeignKey: true, references: "visitors.id" },
        { name: "host_id", type: "INT", nullable: false, comment: "FK → staff.id ผู้ที่ต้องการพบ", isForeignKey: true, references: "staff.id" },
        { name: "visit_purpose_id", type: "INT", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id", isForeignKey: true, references: "departments.id" },
        { name: "type", type: "ENUM('official','meeting','document','contractor','delivery','other')", nullable: false, comment: "ประเภทการนัดหมาย — ใช้แยกข้อมูล Section 3 (By Visit Type)" },
        { name: "status", type: "ENUM('pending','approved','rejected','confirmed','checked-in','checked-out','auto-checkout','overstay','blocked','cancelled')", nullable: false, comment: "สถานะ — ใช้นับ KPI ทุก Section" },
        { name: "entry_mode", type: "ENUM('single','period')", nullable: false, comment: "ครั้งเดียว / ช่วงเวลา" },
        { name: "date_start", type: "DATE", nullable: false, comment: "วันเริ่มต้น — ใช้ filter วันนี้" },
        { name: "date_end", type: "DATE", nullable: true, comment: "วันสิ้นสุด (period mode)" },
        { name: "time_start", type: "TIME", nullable: false, comment: "เวลาเริ่ม" },
        { name: "time_end", type: "TIME", nullable: false, comment: "เวลาสิ้นสุด" },
        { name: "companions_count", type: "INT", nullable: false, comment: "จำนวนผู้ติดตาม", defaultValue: "0" },
        { name: "checkin_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-in" },
        { name: "checkout_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ Check-out" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [],
    },
    {
      name: "visitors",
      comment: "ข้อมูลผู้มาติดต่อ — JOIN กับ appointments เพื่อแสดงชื่อ/บริษัทในตาราง",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสผู้มาติดต่อ (PK, running number)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: true, comment: "ชื่อ-นามสกุล (อังกฤษ)" },
        { name: "company", type: "VARCHAR(150)", nullable: true, comment: "บริษัท / หน่วยงาน" },
        { name: "phone", type: "VARCHAR(20)", nullable: false, comment: "เบอร์โทรศัพท์" },
        { name: "photo", type: "VARCHAR(255)", nullable: true, comment: "URL รูปถ่าย" },
      ],
      seedData: [],
    },
    {
      name: "staff",
      comment: "ข้อมูลเจ้าหน้าที่ — JOIN เพื่อแสดง host/ผู้พบ ในตาราง",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสเจ้าหน้าที่ (PK, running number)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล" },
        { name: "department_id", type: "INT", nullable: false, comment: "FK → departments.id", isForeignKey: true, references: "departments.id" },
      ],
      seedData: [],
    },
    {
      name: "departments",
      comment: "แผนก — JOIN เพื่อแสดงชื่อแผนกในตาราง",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสแผนก (PK, running number)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(200)", nullable: false, comment: "ชื่อแผนก (ไทย)" },
        { name: "name_en", type: "VARCHAR(200)", nullable: false, comment: "ชื่อแผนก (อังกฤษ)" },
      ],
      seedData: [],
    },
  ],
  relationships: [
    "appointments.visitor_id ──→ visitors.id (แสดงชื่อ/บริษัทผู้มาติดต่อ)",
    "appointments.host_id ──→ staff.id (แสดงชื่อผู้พบ)",
    "staff.department_id ──→ departments.id (แสดงแผนกผู้พบ)",
    "appointments.department_id ──→ departments.id (แผนกปลายทาง)",
    "appointments.visit_purpose_id ──→ visit_purposes.id (วัตถุประสงค์)",
    "",
    "── Dashboard Sections → Query ──",
    "Section 1 (KPI Strip): SELECT COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY status",
    "Section 2 (Status Overview): SELECT status, COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY status",
    "Section 3 (By Visit Type): SELECT type, status, COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY type, status",
    "Section 4 (Pending): SELECT * FROM appointments JOIN visitors JOIN staff WHERE date_start = CURDATE() AND status = 'pending'",
    "Section 5 (All Today): SELECT * FROM appointments JOIN visitors JOIN staff WHERE date_start = CURDATE() ORDER BY time_start — with pagination, search, filter",
  ],
};

// ════════════════════════════════════════════════════
// 18. ระบบผู้ใช้งาน (User Accounts & Permissions)
// ════════════════════════════════════════════════════

const userManagementSchema: PageSchema = {
  pageId: "user-management",
  menuName: "ระบบผู้ใช้งาน",
  menuNameEn: "User Management",
  path: "/web/settings/staff",
  description: "จัดการบัญชีผู้ใช้งาน, สิทธิ์การเข้าถึง, Login/Register, ลืมรหัสผ่าน\n\nAPI Endpoints:\n• POST /api/auth/login — เข้าสู่ระบบ\n• POST /api/auth/register — สมัครสมาชิก\n• POST /api/auth/forgot-password — ส่ง link reset password\n• POST /api/auth/reset-password — ตั้งรหัสผ่านใหม่\n• GET /api/users — รายชื่อผู้ใช้ (admin only)\n• PATCH /api/users/:id/role — เปลี่ยน role (admin only)",
  tables: [
    {
      name: "user_accounts",
      comment: "ตารางบัญชีผู้ใช้งาน — ใช้สำหรับ Login ทุกช่องทาง (Web, LINE, Counter PIN)",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัสบัญชี (PK, running number)", isPrimaryKey: true },
        { name: "email", type: "VARCHAR(100)", nullable: false, comment: "อีเมล — ใช้เป็น username สำหรับ login", isUnique: true },
        { name: "password_hash", type: "VARCHAR(255)", nullable: false, comment: "bcrypt hash ของรหัสผ่าน" },
        { name: "user_type", type: "ENUM('visitor','staff')", nullable: false, comment: "ประเภทตอนสมัคร (ใช้เป็น default role)" },
        { name: "role", type: "ENUM('visitor','staff','supervisor','security','admin')", nullable: false, comment: "สิทธิ์ปัจจุบัน — admin เป็นคนเปลี่ยน" },
        { name: "ref_id", type: "INT", nullable: true, comment: "FK → visitors.id (ถ้า visitor) หรือ staff.id (ถ้า staff)" },
        { name: "first_name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ" },
        { name: "last_name", type: "VARCHAR(100)", nullable: false, comment: "นามสกุล" },
        { name: "phone", type: "VARCHAR(20)", nullable: true, comment: "เบอร์โทรศัพท์" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะบัญชี (active/locked)", defaultValue: "true" },
        { name: "is_email_verified", type: "BOOLEAN", nullable: false, comment: "ยืนยันอีเมลแล้วหรือยัง", defaultValue: "false" },
        { name: "reset_token", type: "VARCHAR(255)", nullable: true, comment: "Token สำหรับ reset password (null = ไม่มี request)" },
        { name: "reset_token_expires", type: "TIMESTAMP", nullable: true, comment: "วันหมดอายุ token reset" },
        { name: "last_login_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ login ล่าสุด" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่สมัคร", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, email: "admin@mots.go.th", password_hash: "$2b$10$xxx", user_type: "staff", role: "admin", ref_id: 5, first_name: "อนันต์", last_name: "มั่นคง", phone: "02-283-1500", is_active: true, is_email_verified: true, last_login_at: "2026-03-25 08:00:00" },
        { id: 2, email: "somsri.r@mots.go.th", password_hash: "$2b$10$xxx", user_type: "staff", role: "staff", ref_id: 1, first_name: "สมศรี", last_name: "รักงาน", phone: "02-283-1501", is_active: true, is_email_verified: true, last_login_at: "2026-03-25 09:15:00" },
        { id: 3, email: "prawit.s@mots.go.th", password_hash: "$2b$10$xxx", user_type: "staff", role: "supervisor", ref_id: 2, first_name: "ประเสริฐ", last_name: "ศรีวิโล", phone: "02-283-1502", is_active: true, is_email_verified: true, last_login_at: "2026-03-24 14:30:00" },
        { id: 4, email: "somchai.p@mots.go.th", password_hash: "$2b$10$xxx", user_type: "staff", role: "security", ref_id: 6, first_name: "สมชาย", last_name: "ปลอดภัย", phone: "02-283-1510", is_active: true, is_email_verified: true, last_login_at: "2026-03-25 06:45:00" },
        { id: 5, email: "wichai@siamtech.co.th", password_hash: "$2b$10$xxx", user_type: "visitor", role: "visitor", ref_id: 1, first_name: "วิชัย", last_name: "สุขสำราญ", phone: "081-234-5678", is_active: true, is_email_verified: true, last_login_at: "2026-03-20 10:00:00" },
        { id: 6, email: "porntip@tourismthai.com", password_hash: "$2b$10$xxx", user_type: "visitor", role: "visitor", ref_id: 2, first_name: "พรทิพย์", last_name: "มีสุข", phone: "089-876-5432", is_active: true, is_email_verified: false },
      ],
    },
    {
      name: "role_permissions",
      comment: "ตารางสิทธิ์ตาม Role — กำหนด resource + action + scope",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัส (PK, running number)", isPrimaryKey: true },
        { name: "role", type: "ENUM('visitor','staff','supervisor','security','admin')", nullable: false, comment: "บทบาท" },
        { name: "resource", type: "VARCHAR(50)", nullable: false, comment: "ทรัพยากร เช่น dashboard, appointments, settings" },
        { name: "action", type: "ENUM('view','create','edit','delete','approve','export')", nullable: false, comment: "การกระทำ" },
        { name: "scope", type: "ENUM('own','department','all')", nullable: false, comment: "ขอบเขต: ตัวเอง / แผนก / ทั้งหมด", defaultValue: "own" },
        { name: "is_allowed", type: "BOOLEAN", nullable: false, comment: "อนุญาตหรือไม่", defaultValue: "true" },
      ],
      seedData: [
        { id: 1, role: "visitor", resource: "appointments", action: "view", scope: "own", is_allowed: true },
        { id: 2, role: "visitor", resource: "appointments", action: "create", scope: "own", is_allowed: true },
        { id: 3, role: "staff", resource: "dashboard", action: "view", scope: "department", is_allowed: true },
        { id: 4, role: "staff", resource: "appointments", action: "view", scope: "department", is_allowed: true },
        { id: 5, role: "staff", resource: "appointments", action: "create", scope: "department", is_allowed: true },
        { id: 6, role: "staff", resource: "appointments", action: "approve", scope: "department", is_allowed: true },
        { id: 7, role: "staff", resource: "search", action: "view", scope: "department", is_allowed: true },
        { id: 8, role: "supervisor", resource: "dashboard", action: "view", scope: "all", is_allowed: true },
        { id: 9, role: "supervisor", resource: "appointments", action: "view", scope: "all", is_allowed: true },
        { id: 10, role: "supervisor", resource: "blocklist", action: "view", scope: "all", is_allowed: true },
        { id: 11, role: "supervisor", resource: "reports", action: "view", scope: "all", is_allowed: true },
        { id: 12, role: "admin", resource: "settings", action: "view", scope: "all", is_allowed: true },
        { id: 13, role: "admin", resource: "settings", action: "edit", scope: "all", is_allowed: true },
      ],
    },
  ],
  relationships: [
    "user_accounts.ref_id ──→ visitors.id (ถ้า user_type = 'visitor')",
    "user_accounts.ref_id ──→ staff.id (ถ้า user_type = 'staff')",
    "role_permissions.role ──→ user_accounts.role (สิทธิ์ตาม role ของ user)",
    "สมัครสมาชิก: user_type = 'visitor' → role = 'visitor' / user_type = 'staff' → role = 'staff' (default)",
    "Admin เป็นคนเปลี่ยน role ผ่านหน้า Settings > Staff",
  ],
};

// ════════════════════════════════════════════════════
// 19. ตั้งค่าอีเมลระบบ (Email System Config)
// ════════════════════════════════════════════════════

const emailSystemSchema: PageSchema = {
  pageId: "email-system",
  menuName: "ตั้งค่าอีเมลระบบ",
  menuNameEn: "Email System Settings",
  path: "/web/settings/email-system",
  description: "กำหนดค่า SMTP สำหรับส่งอีเมลแจ้งเตือน, ลืมรหัสผ่าน, อนุมัติ — ไม่ hardcode ในโค้ด\n\nAPI Endpoints:\n• GET /api/settings/email — ดึงค่า SMTP ปัจจุบัน\n• PUT /api/settings/email — บันทึกค่า SMTP\n• POST /api/settings/email/test — ทดสอบส่งอีเมล",
  tables: [
    {
      name: "email_config",
      comment: "ตั้งค่า SMTP สำหรับส่งอีเมลระบบ — มีได้ 1 row (singleton)",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัส (PK)", isPrimaryKey: true },
        { name: "smtp_host", type: "VARCHAR(100)", nullable: false, comment: "SMTP Server Host เช่น smtp.gmail.com" },
        { name: "smtp_port", type: "INT", nullable: false, comment: "SMTP Port เช่น 465, 587, 25" },
        { name: "encryption", type: "ENUM('ssl','tls','none')", nullable: false, comment: "ประเภทการเข้ารหัส", defaultValue: "tls" },
        { name: "smtp_username", type: "VARCHAR(100)", nullable: false, comment: "Username สำหรับ SMTP Authentication" },
        { name: "smtp_password", type: "VARCHAR(255)", nullable: false, comment: "Password (encrypted ในฐานข้อมูล)" },
        { name: "from_email", type: "VARCHAR(100)", nullable: false, comment: "อีเมลผู้ส่ง เช่น noreply@mots.go.th" },
        { name: "from_display_name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อผู้ส่งที่แสดง เช่น eVMS กระทรวงการท่องเที่ยว" },
        { name: "reply_to_email", type: "VARCHAR(100)", nullable: true, comment: "Reply-To Email (ถ้าต่างจาก from_email)" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "เปิด/ปิดระบบส่งอีเมล", defaultValue: "true" },
        { name: "last_test_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ทดสอบล่าสุด" },
        { name: "last_test_result", type: "VARCHAR(255)", nullable: true, comment: "ผลลัพธ์การทดสอบล่าสุด" },
        { name: "updated_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้แก้ไขล่าสุด", isForeignKey: true, references: "staff.id" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, smtp_host: "smtp.gmail.com", smtp_port: 587, encryption: "tls", smtp_username: "evms.noreply@mots.go.th", smtp_password: "***encrypted***", from_email: "noreply@mots.go.th", from_display_name: "eVMS กระทรวงการท่องเที่ยวและกีฬา", reply_to_email: "support@mots.go.th", is_active: true, last_test_at: "2026-03-20 10:00:00", last_test_result: "OK — ส่งสำเร็จ", updated_by: 5 },
      ],
    },
  ],
  relationships: [
    "email_config.updated_by ──→ staff.id (ผู้แก้ไขล่าสุด)",
    "ใช้ส่ง: forgot-password, approval notification, checkin welcome, overstay alert",
  ],
};

// ════════════════════════════════════════════════════
// 20. ตั้งค่า LINE OA (LINE Official Account Config)
// ════════════════════════════════════════════════════

const lineOaConfigSchema: PageSchema = {
  pageId: "line-oa-config",
  menuName: "ตั้งค่า LINE OA",
  menuNameEn: "LINE OA Configuration",
  path: "/web/settings/line-oa-config",
  description: "กำหนดค่า LINE Messaging API, LIFF, Webhook, Rich Menu — ไม่ hardcode ในโค้ด\n\nAPI Endpoints:\n• GET /api/settings/line-oa — ดึงค่า LINE OA ปัจจุบัน\n• PUT /api/settings/line-oa — บันทึกค่า LINE OA\n• POST /api/settings/line-oa/test-message — ทดสอบส่งข้อความ\n• POST /api/settings/line-oa/verify-webhook — ตรวจสอบ Webhook",
  tables: [
    {
      name: "line_oa_config",
      comment: "ตั้งค่า LINE Official Account — มีได้ 1 row (singleton)",
      columns: [
        { name: "id", type: "INT", nullable: false, comment: "รหัส (PK)", isPrimaryKey: true },
        { name: "channel_id", type: "VARCHAR(50)", nullable: false, comment: "LINE Channel ID" },
        { name: "channel_secret", type: "VARCHAR(100)", nullable: false, comment: "LINE Channel Secret (encrypted)" },
        { name: "channel_access_token", type: "TEXT", nullable: false, comment: "Long-lived Channel Access Token (encrypted)" },
        { name: "bot_basic_id", type: "VARCHAR(50)", nullable: true, comment: "Bot Basic ID เช่น @evms-mots" },
        { name: "liff_app_id", type: "VARCHAR(50)", nullable: true, comment: "LIFF App ID สำหรับ LIFF integration" },
        { name: "liff_endpoint_url", type: "VARCHAR(255)", nullable: true, comment: "LIFF Endpoint URL" },
        { name: "webhook_url", type: "VARCHAR(255)", nullable: true, comment: "Webhook URL (auto-generated)" },
        { name: "webhook_active", type: "BOOLEAN", nullable: false, comment: "Webhook เปิด/ปิด", defaultValue: "false" },
        { name: "rich_menu_visitor_id", type: "VARCHAR(50)", nullable: true, comment: "Rich Menu ID สำหรับ Visitor" },
        { name: "rich_menu_officer_id", type: "VARCHAR(50)", nullable: true, comment: "Rich Menu ID สำหรับ Officer" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "เปิด/ปิดระบบ LINE OA", defaultValue: "true" },
        { name: "last_test_at", type: "TIMESTAMP", nullable: true, comment: "วันเวลาที่ทดสอบล่าสุด" },
        { name: "last_test_result", type: "VARCHAR(255)", nullable: true, comment: "ผลลัพธ์การทดสอบล่าสุด" },
        { name: "updated_by", type: "INT", nullable: true, comment: "FK → staff.id ผู้แก้ไขล่าสุด", isForeignKey: true, references: "staff.id" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันเวลาที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: 1, channel_id: "1234567890", channel_secret: "***encrypted***", channel_access_token: "***encrypted***", bot_basic_id: "@evms-mots", liff_app_id: "1234567890-abcdefgh", liff_endpoint_url: "https://evms.mots.go.th/liff", webhook_url: "https://evms.mots.go.th/api/line/webhook", webhook_active: true, rich_menu_visitor_id: "richmenu-visitor-001", rich_menu_officer_id: "richmenu-officer-001", is_active: true, last_test_at: "2026-03-20 11:00:00", last_test_result: "OK — ส่งข้อความทดสอบสำเร็จ", updated_by: 5 },
      ],
    },
  ],
  relationships: [
    "line_oa_config.updated_by ──→ staff.id (ผู้แก้ไขล่าสุด)",
    "ใช้กับ: LINE OA Registration (LIFF), Notification Push, Rich Menu, Webhook events",
  ],
};

// ════════════════════════════════════════════════════
// EXPORT: รวมทุก schema
// ════════════════════════════════════════════════════

export const allPageSchemas: PageSchema[] = [
  visitPurposesSchema,
  locationsSchema,
  accessZonesSchema,
  approverGroupsSchema,
  staffSchema,
  servicePointsSchema,
  documentTypesSchema,
  businessHoursSchema,
  notificationTemplatesSchema,
  visitSlipsSchema,
  pdpaConsentSchema,
  visitRecordsSchema,
  appointmentsSchema,
  dashboardSchema,
  searchSchema,
  blocklistSchema,
  reportsSchema,
  userManagementSchema,
  emailSystemSchema,
  lineOaConfigSchema,
];

/** ค้น schema ตาม pageId */
export function getSchemaByPageId(pageId: string): PageSchema | undefined {
  return allPageSchemas.find((s) => s.pageId === pageId);
}
