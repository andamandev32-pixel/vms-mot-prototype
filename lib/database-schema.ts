// ===== VMS DATABASE SCHEMA DEFINITION =====
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสวัตถุประสงค์ (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อวัตถุประสงค์ (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อวัตถุประสงค์ (ภาษาอังกฤษ)" },
        { name: "icon", type: "VARCHAR(10)", nullable: true, comment: "ไอคอน Emoji แสดงหน้าเมนู" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผล (1=แรกสุด)" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "vpc-1", name: "ติดต่อราชการ", name_en: "Official Business", icon: "🏛️", is_active: true, sort_order: 1 },
        { id: "vpc-2", name: "ประชุม / สัมมนา", name_en: "Meeting / Seminar", icon: "📋", is_active: true, sort_order: 2 },
        { id: "vpc-3", name: "ส่งเอกสาร / พัสดุ", name_en: "Document / Parcel Delivery", icon: "📄", is_active: true, sort_order: 3 },
        { id: "vpc-4", name: "ผู้รับเหมา / ซ่อมบำรุง", name_en: "Contractor / Maintenance", icon: "🔧", is_active: true, sort_order: 4 },
        { id: "vpc-5", name: "สมัครงาน / สัมภาษณ์", name_en: "Job Application / Interview", icon: "💼", is_active: true, sort_order: 5 },
        { id: "vpc-6", name: "เยี่ยมชม / ศึกษาดูงาน", name_en: "Study Visit / Tour", icon: "🎓", is_active: true, sort_order: 6 },
        { id: "vpc-7", name: "รับ-ส่งสินค้า", name_en: "Delivery / Pickup", icon: "📦", is_active: true, sort_order: 7 },
        { id: "vpc-8", name: "อื่นๆ", name_en: "Other", icon: "🔖", is_active: false, sort_order: 8 },
      ],
    },
    {
      name: "visit_purpose_department_rules",
      comment: "เงื่อนไขการเข้าพื้นที่ แยกตามแผนก (ของแต่ละวัตถุประสงค์)",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "visit_purpose_id", type: "VARCHAR(20)", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
        { name: "department_id", type: "VARCHAR(20)", nullable: false, comment: "FK → departments.id — แผนกที่ใช้กฎนี้", isForeignKey: true, references: "departments.id" },
        { name: "require_person_name", type: "BOOLEAN", nullable: false, comment: "ต้องระบุชื่อบุคคลที่ต้องการพบ", defaultValue: "false" },
        { name: "require_approval", type: "BOOLEAN", nullable: false, comment: "ต้องมีการอนุมัติก่อนเข้าพื้นที่", defaultValue: "false" },
        { name: "approver_group_id", type: "VARCHAR(20)", nullable: true, comment: "FK → approver_groups.id — กลุ่มผู้อนุมัติ (ใช้เมื่อ require_approval=true)", isForeignKey: true, references: "approver_groups.id" },
        { name: "offer_wifi", type: "BOOLEAN", nullable: false, comment: "เสนอ WiFi Credentials ให้ผู้เข้าเยี่ยม", defaultValue: "false" },
        { name: "show_on_line", type: "BOOLEAN", nullable: false, comment: "แสดงตัวเลือกนี้บน LINE OA + Web App", defaultValue: "true" },
        { name: "show_on_kiosk", type: "BOOLEAN", nullable: false, comment: "แสดงตัวเลือกนี้บน Kiosk", defaultValue: "true" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
      ],
      seedData: [
        // vpc-1: ติดต่อราชการ
        { id: 1, visit_purpose_id: "vpc-1", department_id: "dept-1", require_person_name: true, require_approval: true, approver_group_id: "apg-1", offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 2, visit_purpose_id: "vpc-1", department_id: "dept-2", require_person_name: true, require_approval: true, approver_group_id: "apg-3", offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 3, visit_purpose_id: "vpc-1", department_id: "dept-3", require_person_name: true, require_approval: true, approver_group_id: "apg-5", offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 4, visit_purpose_id: "vpc-1", department_id: "dept-4", require_person_name: true, require_approval: true, approver_group_id: "apg-6", offer_wifi: false, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 5, visit_purpose_id: "vpc-1", department_id: "dept-5", require_person_name: true, require_approval: false, approver_group_id: null, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 6, visit_purpose_id: "vpc-1", department_id: "dept-8", require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 7, visit_purpose_id: "vpc-1", department_id: "dept-9", require_person_name: true, require_approval: true, approver_group_id: "apg-10", offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        // vpc-2: ประชุม / สัมมนา
        { id: 8, visit_purpose_id: "vpc-2", department_id: "dept-1", require_person_name: true, require_approval: true, approver_group_id: "apg-1", offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 9, visit_purpose_id: "vpc-2", department_id: "dept-3", require_person_name: true, require_approval: true, approver_group_id: "apg-5", offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 10, visit_purpose_id: "vpc-2", department_id: "dept-4", require_person_name: true, require_approval: false, approver_group_id: null, offer_wifi: true, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 11, visit_purpose_id: "vpc-2", department_id: "dept-9", require_person_name: true, require_approval: true, approver_group_id: "apg-10", offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        // vpc-3: ส่งเอกสาร / พัสดุ
        { id: 12, visit_purpose_id: "vpc-3", department_id: "dept-1", require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 13, visit_purpose_id: "vpc-3", department_id: "dept-2", require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 14, visit_purpose_id: "vpc-3", department_id: "dept-4", require_person_name: true, require_approval: true, approver_group_id: "apg-6", offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        // vpc-4: ผู้รับเหมา
        { id: 15, visit_purpose_id: "vpc-4", department_id: "dept-2", require_person_name: false, require_approval: true, approver_group_id: "apg-4", offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        { id: 16, visit_purpose_id: "vpc-4", department_id: "dept-6", require_person_name: false, require_approval: true, approver_group_id: "apg-9", offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        // vpc-5: สมัครงาน
        { id: 17, visit_purpose_id: "vpc-5", department_id: "dept-2", require_person_name: true, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        // vpc-6: เยี่ยมชม
        { id: 18, visit_purpose_id: "vpc-6", department_id: "dept-4", require_person_name: true, require_approval: true, approver_group_id: "apg-7", offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 19, visit_purpose_id: "vpc-6", department_id: "dept-5", require_person_name: true, require_approval: true, approver_group_id: "apg-8", offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: true },
        { id: 20, visit_purpose_id: "vpc-6", department_id: "dept-7", require_person_name: false, require_approval: true, approver_group_id: null, offer_wifi: true, show_on_line: true, show_on_kiosk: false, is_active: false },
        // vpc-7: รับ-ส่งสินค้า
        { id: 21, visit_purpose_id: "vpc-7", department_id: "dept-1", require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        { id: 22, visit_purpose_id: "vpc-7", department_id: "dept-2", require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        { id: 23, visit_purpose_id: "vpc-7", department_id: "dept-4", require_person_name: false, require_approval: false, approver_group_id: null, offer_wifi: false, show_on_line: false, show_on_kiosk: true, is_active: true },
        // vpc-8: อื่นๆ
        { id: 24, visit_purpose_id: "vpc-8", department_id: "dept-1", require_person_name: false, require_approval: true, approver_group_id: "apg-2", offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
        { id: 25, visit_purpose_id: "vpc-8", department_id: "dept-2", require_person_name: false, require_approval: true, approver_group_id: "apg-3", offer_wifi: false, show_on_line: true, show_on_kiosk: true, is_active: true },
      ],
    },
    {
      name: "visit_purpose_channel_configs",
      comment: "ตั้งค่าช่องทางเข้า (Kiosk / Counter) ของแต่ละวัตถุประสงค์ — เอกสารที่รับ และการถ่ายรูป",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "visit_purpose_id", type: "VARCHAR(20)", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
        { name: "channel", type: "ENUM('kiosk','counter')", nullable: false, comment: "ช่องทาง: kiosk = ตู้อัตโนมัติ / counter = เคาน์เตอร์ รปภ." },
        { name: "require_photo", type: "BOOLEAN", nullable: false, comment: "ต้องถ่ายภาพใบหน้า", defaultValue: "false" },
      ],
      seedData: [
        // vpc-1
        { id: 1, visit_purpose_id: "vpc-1", channel: "kiosk", require_photo: true },
        { id: 2, visit_purpose_id: "vpc-1", channel: "counter", require_photo: true },
        // vpc-2
        { id: 3, visit_purpose_id: "vpc-2", channel: "kiosk", require_photo: true },
        { id: 4, visit_purpose_id: "vpc-2", channel: "counter", require_photo: false },
        // vpc-3
        { id: 5, visit_purpose_id: "vpc-3", channel: "kiosk", require_photo: true },
        { id: 6, visit_purpose_id: "vpc-3", channel: "counter", require_photo: false },
        // vpc-4
        { id: 7, visit_purpose_id: "vpc-4", channel: "kiosk", require_photo: true },
        { id: 8, visit_purpose_id: "vpc-4", channel: "counter", require_photo: true },
        // vpc-5
        { id: 9, visit_purpose_id: "vpc-5", channel: "kiosk", require_photo: true },
        { id: 10, visit_purpose_id: "vpc-5", channel: "counter", require_photo: true },
        // vpc-6
        { id: 11, visit_purpose_id: "vpc-6", channel: "kiosk", require_photo: true },
        { id: 12, visit_purpose_id: "vpc-6", channel: "counter", require_photo: false },
        // vpc-7
        { id: 13, visit_purpose_id: "vpc-7", channel: "kiosk", require_photo: false },
        { id: 14, visit_purpose_id: "vpc-7", channel: "counter", require_photo: false },
        // vpc-8
        { id: 15, visit_purpose_id: "vpc-8", channel: "kiosk", require_photo: false },
        { id: 16, visit_purpose_id: "vpc-8", channel: "counter", require_photo: false },
      ],
    },
    {
      name: "visit_purpose_channel_documents",
      comment: "เอกสารที่อนุญาตใช้ ณ แต่ละช่องทาง(Kiosk/Counter) ของแต่ละวัตถุประสงค์ (many-to-many)",
      columns: [
        { name: "channel_config_id", type: "INT", nullable: false, comment: "FK → visit_purpose_channel_configs.id", isForeignKey: true, references: "visit_purpose_channel_configs.id" },
        { name: "identity_document_type_id", type: "VARCHAR(30)", nullable: false, comment: "FK → identity_document_types.id — ประเภทเอกสารที่รับ", isForeignKey: true, references: "identity_document_types.id" },
      ],
      seedData: [
        // vpc-1 kiosk: national-id, passport, gov-card, thai-id-app
        { channel_config_id: 1, identity_document_type_id: "doc-national-id" },
        { channel_config_id: 1, identity_document_type_id: "doc-passport" },
        { channel_config_id: 1, identity_document_type_id: "doc-gov-card" },
        { channel_config_id: 1, identity_document_type_id: "doc-thai-id-app" },
        // vpc-1 counter: + driver-license
        { channel_config_id: 2, identity_document_type_id: "doc-national-id" },
        { channel_config_id: 2, identity_document_type_id: "doc-passport" },
        { channel_config_id: 2, identity_document_type_id: "doc-driver-license" },
        { channel_config_id: 2, identity_document_type_id: "doc-gov-card" },
        { channel_config_id: 2, identity_document_type_id: "doc-thai-id-app" },
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสอาคาร (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่ออาคาร (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่ออาคาร (ภาษาอังกฤษ)" },
        { name: "total_floors", type: "INT", nullable: false, comment: "จำนวนชั้นทั้งหมด" },
        { name: "description", type: "TEXT", nullable: true, comment: "รายละเอียดเพิ่มเติม" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "bld-C", name: "ศูนย์ราชการ อาคาร C", name_en: "Government Center Building C", total_floors: 9, description: "กระทรวงการท่องเที่ยวและกีฬา — ทุกหน่วยงานในตึกเดียว", is_active: true },
      ],
    },
    {
      name: "floors",
      comment: "ตารางชั้นในอาคาร",
      columns: [
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสชั้น (PK)", isPrimaryKey: true },
        { name: "building_id", type: "VARCHAR(20)", nullable: false, comment: "FK → buildings.id — อาคารที่ชั้นนี้อยู่", isForeignKey: true, references: "buildings.id" },
        { name: "floor_number", type: "INT", nullable: false, comment: "หมายเลขชั้น (1, 2, 3, ...)" },
        { name: "name", type: "VARCHAR(150)", nullable: false, comment: "ชื่อชั้น (ไทย) เช่น 'ชั้น 1 — ล็อบบี้'" },
        { name: "name_en", type: "VARCHAR(150)", nullable: false, comment: "ชื่อชั้น (อังกฤษ)" },
      ],
      seedData: [
        { id: "fl-C1", building_id: "bld-C", floor_number: 1, name: "ชั้น 1 — ล็อบบี้ / ประชาสัมพันธ์ / รปภ.", name_en: "1F — Lobby / Reception / Security" },
        { id: "fl-C2", building_id: "bld-C", floor_number: 2, name: "ชั้น 2 — กองกลาง", name_en: "2F — General Admin" },
        { id: "fl-C3", building_id: "bld-C", floor_number: 3, name: "ชั้น 3 — สำนักงานปลัด", name_en: "3F — OPS" },
        { id: "fl-C4", building_id: "bld-C", floor_number: 4, name: "ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน", name_en: "4F — Tourism Affairs & Policy" },
        { id: "fl-C5", building_id: "bld-C", floor_number: 5, name: "ชั้น 5 — กองการต่างประเทศ", name_en: "5F — International Affairs" },
        { id: "fl-C6", building_id: "bld-C", floor_number: 6, name: "ชั้น 6 — กรมการท่องเที่ยว / ททท.", name_en: "6F — Dept. of Tourism / TAT" },
        { id: "fl-C7", building_id: "bld-C", floor_number: 7, name: "ชั้น 7 — กรมพลศึกษา / มกช.", name_en: "7F — Dept. of PE / NSU" },
        { id: "fl-C8", building_id: "bld-C", floor_number: 8, name: "ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท.", name_en: "8F — SAT / Tourist Police / DASTA" },
        { id: "fl-C9", building_id: "bld-C", floor_number: 9, name: "ชั้น 9 — สำนักงานรัฐมนตรี / ห้องประชุมอเนกประสงค์", name_en: "9F — Minister's Office / Conference" },
      ],
    },
    {
      name: "departments",
      comment: "ตารางแผนก / หน่วยงาน",
      columns: [
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสแผนก (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(200)", nullable: false, comment: "ชื่อแผนก (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(200)", nullable: false, comment: "ชื่อแผนก (ภาษาอังกฤษ)" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "dept-1", name: "สำนักงานปลัดกระทรวง", name_en: "Office of the Permanent Secretary", is_active: true },
        { id: "dept-2", name: "กองกลาง", name_en: "General Administration Division", is_active: true },
        { id: "dept-3", name: "กองการต่างประเทศ", name_en: "International Affairs Division", is_active: true },
        { id: "dept-4", name: "กองกิจการท่องเที่ยว", name_en: "Tourism Affairs Division", is_active: true },
        { id: "dept-5", name: "กรมการท่องเที่ยว", name_en: "Department of Tourism", is_active: true },
        { id: "dept-6", name: "กรมพลศึกษา", name_en: "Department of Physical Education", is_active: true },
        { id: "dept-7", name: "การกีฬาแห่งประเทศไทย", name_en: "Sports Authority of Thailand", is_active: true },
        { id: "dept-8", name: "สำนักนโยบายและแผน", name_en: "Policy and Planning Division", is_active: true },
        { id: "dept-9", name: "สำนักงานรัฐมนตรี", name_en: "Minister's Office", is_active: true },
        { id: "dept-10", name: "การท่องเที่ยวแห่งประเทศไทย", name_en: "Tourism Authority of Thailand", is_active: true },
        { id: "dept-11", name: "มหาวิทยาลัยการกีฬาแห่งชาติ", name_en: "National Sports University", is_active: true },
        { id: "dept-12", name: "กองบัญชาการตำรวจท่องเที่ยว", name_en: "Tourist Police Bureau", is_active: true },
        { id: "dept-13", name: "องค์การบริหารการพัฒนาพื้นที่พิเศษเพื่อการท่องเที่ยวอย่างยั่งยืน (อพท.)", name_en: "DASTA", is_active: true },
      ],
    },
    {
      name: "floor_departments",
      comment: "ตารางเชื่อม ชั้น ↔ แผนก (Many-to-Many) — แผนกใดอยู่ชั้นไหน",
      columns: [
        { name: "floor_id", type: "VARCHAR(20)", nullable: false, comment: "FK → floors.id", isForeignKey: true, references: "floors.id" },
        { name: "department_id", type: "VARCHAR(20)", nullable: false, comment: "FK → departments.id", isForeignKey: true, references: "departments.id" },
      ],
      seedData: [
        { floor_id: "fl-C2", department_id: "dept-2" },
        { floor_id: "fl-C3", department_id: "dept-1" },
        { floor_id: "fl-C4", department_id: "dept-4" },
        { floor_id: "fl-C4", department_id: "dept-8" },
        { floor_id: "fl-C5", department_id: "dept-3" },
        { floor_id: "fl-C6", department_id: "dept-5" },
        { floor_id: "fl-C6", department_id: "dept-10" },
        { floor_id: "fl-C7", department_id: "dept-6" },
        { floor_id: "fl-C7", department_id: "dept-11" },
        { floor_id: "fl-C8", department_id: "dept-7" },
        { floor_id: "fl-C8", department_id: "dept-12" },
        { floor_id: "fl-C8", department_id: "dept-13" },
        { floor_id: "fl-C9", department_id: "dept-9" },
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
        { name: "id", type: "VARCHAR(30)", nullable: false, comment: "รหัสโซน (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อโซน (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อโซน (ภาษาอังกฤษ)" },
        { name: "floor_id", type: "VARCHAR(20)", nullable: false, comment: "FK → floors.id — ชั้นที่โซนนี้อยู่", isForeignKey: true, references: "floors.id" },
        { name: "building_id", type: "VARCHAR(20)", nullable: false, comment: "FK → buildings.id — อาคาร", isForeignKey: true, references: "buildings.id" },
        { name: "type", type: "ENUM('office','meeting-room','lobby','parking','common','restricted','service')", nullable: false, comment: "ประเภทโซน: office=สำนักงาน, meeting-room=ห้องประชุม, lobby=ล็อบบี้, parking=ที่จอดรถ, common=ส่วนกลาง, restricted=ควบคุม, service=ซ่อมบำรุง" },
        { name: "hikvision_door_id", type: "VARCHAR(50)", nullable: false, comment: "รหัสประตู Hikvision สำหรับ Integration", isUnique: true },
        { name: "description", type: "TEXT", nullable: true, comment: "รายละเอียดเพิ่มเติม" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "az-lobby", name: "ล็อบบี้ ชั้น 1", name_en: "Lobby 1F", floor_id: "fl-C1", building_id: "bld-C", type: "lobby", hikvision_door_id: "HIK-DOOR-C1-01", is_active: true },
        { id: "az-parking", name: "ลานจอดรถ", name_en: "Parking", floor_id: "fl-C1", building_id: "bld-C", type: "parking", hikvision_door_id: "HIK-DOOR-C1-PK", is_active: true },
        { id: "az-service", name: "พื้นที่ซ่อมบำรุง", name_en: "Maintenance Area", floor_id: "fl-C1", building_id: "bld-C", type: "service", hikvision_door_id: "HIK-DOOR-C1-SVC", is_active: true },
        { id: "az-f2-office", name: "สำนักงาน กองกลาง", name_en: "General Admin Office", floor_id: "fl-C2", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C2-01", is_active: true },
        { id: "az-f2-meeting", name: "ห้องประชุม ชั้น 2", name_en: "Meeting Room 2F", floor_id: "fl-C2", building_id: "bld-C", type: "meeting-room", hikvision_door_id: "HIK-DOOR-C2-MR", is_active: true },
        { id: "az-f3-office", name: "สำนักงานปลัด", name_en: "OPS Office", floor_id: "fl-C3", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C3-01", is_active: true },
        { id: "az-f3-meeting", name: "ห้องประชุม ชั้น 3", name_en: "Meeting Room 3F", floor_id: "fl-C3", building_id: "bld-C", type: "meeting-room", hikvision_door_id: "HIK-DOOR-C3-MR", is_active: true },
        { id: "az-f4-office", name: "สำนักงาน กองกิจการ / นโยบาย", name_en: "Tourism & Policy Office", floor_id: "fl-C4", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C4-01", is_active: true },
        { id: "az-f4-meeting", name: "ห้องประชุม ชั้น 4", name_en: "Meeting Room 4F", floor_id: "fl-C4", building_id: "bld-C", type: "meeting-room", hikvision_door_id: "HIK-DOOR-C4-MR", is_active: true },
        { id: "az-f5-office", name: "สำนักงาน กองต่างประเทศ", name_en: "International Office", floor_id: "fl-C5", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C5-01", is_active: true },
        { id: "az-f5-meeting", name: "ห้องประชุม ชั้น 5", name_en: "Meeting Room 5F", floor_id: "fl-C5", building_id: "bld-C", type: "meeting-room", hikvision_door_id: "HIK-DOOR-C5-MR", is_active: true },
        { id: "az-f6-office", name: "กรมการท่องเที่ยว / ททท.", name_en: "Tourism Dept. / TAT", floor_id: "fl-C6", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C6-01", is_active: true },
        { id: "az-f6-meeting", name: "ห้องประชุม ชั้น 6", name_en: "Meeting Room 6F", floor_id: "fl-C6", building_id: "bld-C", type: "meeting-room", hikvision_door_id: "HIK-DOOR-C6-MR", is_active: true },
        { id: "az-f7-office", name: "กรมพลศึกษา / มกช.", name_en: "PE Dept. / NSU", floor_id: "fl-C7", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C7-01", is_active: true },
        { id: "az-f7-meeting", name: "ห้องประชุม ชั้น 7", name_en: "Meeting Room 7F", floor_id: "fl-C7", building_id: "bld-C", type: "meeting-room", hikvision_door_id: "HIK-DOOR-C7-MR", is_active: true },
        { id: "az-f8-office", name: "กกท. / ตร.ท่องเที่ยว / อพท.", name_en: "SAT / Tourist Police / DASTA", floor_id: "fl-C8", building_id: "bld-C", type: "office", hikvision_door_id: "HIK-DOOR-C8-01", is_active: true },
        { id: "az-f8-restricted", name: "พื้นที่ควบคุม ตร.ท่องเที่ยว", name_en: "Tourist Police Restricted", floor_id: "fl-C8", building_id: "bld-C", type: "restricted", hikvision_door_id: "HIK-DOOR-C8-02", is_active: true },
        { id: "az-f9-vip", name: "สำนักงานรัฐมนตรี (VIP)", name_en: "Minister's Office (VIP)", floor_id: "fl-C9", building_id: "bld-C", type: "restricted", hikvision_door_id: "HIK-DOOR-C9-01", is_active: true },
        { id: "az-f9-meeting", name: "ห้องประชุมรัฐมนตรี", name_en: "Minister's Conference", floor_id: "fl-C9", building_id: "bld-C", type: "restricted", hikvision_door_id: "HIK-DOOR-C9-MR", is_active: true },
        { id: "az-f9-multipurpose", name: "ห้องอเนกประสงค์", name_en: "Multipurpose Hall", floor_id: "fl-C9", building_id: "bld-C", type: "common", hikvision_door_id: "HIK-DOOR-C9-MP", is_active: true },
      ],
    },
    {
      name: "access_groups",
      comment: "กลุ่มสิทธิ์การเข้าพื้นที่ — ใช้สำหรับออก QR Code และส่งสิทธิ์ผ่าน Hikvision",
      columns: [
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสกลุ่ม (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาอังกฤษ)" },
        { name: "description", type: "TEXT", nullable: false, comment: "คำอธิบายขอบเขตการเข้าถึง" },
        { name: "hikvision_group_id", type: "VARCHAR(50)", nullable: false, comment: "รหัสกลุ่มบน Hikvision สำหรับ Integration", isUnique: true },
        { name: "qr_code_prefix", type: "VARCHAR(20)", nullable: false, comment: "Prefix ของ QR Code เช่น VMS-GEN, VMS-OFA" },
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
        { id: "ag-1", name: "ผู้เยี่ยมชมทั่วไป", name_en: "General Visitor", description: "เข้าได้เฉพาะล็อบบี้และพื้นที่ส่วนกลาง ชั้น 1", hikvision_group_id: "HIK-GRP-GENERAL", qr_code_prefix: "VMS-GEN", validity_minutes: 60, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#6B7280", is_active: true },
        { id: "ag-2", name: "ติดต่อราชการ ชั้น 2-5", name_en: "Official — Floor 2-5", description: "เข้าล็อบบี้ + สำนักงานชั้น 2-5", hikvision_group_id: "HIK-GRP-FL2-5", qr_code_prefix: "VMS-OFA", validity_minutes: 120, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#6A0DAD", is_active: true },
        { id: "ag-3", name: "ติดต่อราชการ ชั้น 6", name_en: "Official — Floor 6", description: "เข้าล็อบบี้ + ชั้น 6", hikvision_group_id: "HIK-GRP-FL6", qr_code_prefix: "VMS-OFB", validity_minutes: 120, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#2563EB", is_active: true },
        { id: "ag-4", name: "ติดต่อราชการ ชั้น 7-8", name_en: "Official — Floor 7-8", description: "เข้าล็อบบี้ + ชั้น 7-8", hikvision_group_id: "HIK-GRP-FL7-8", qr_code_prefix: "VMS-OFC", validity_minutes: 120, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "08:00", schedule_end_time: "17:00", color: "#059669", is_active: true },
        { id: "ag-5", name: "ห้องประชุมรวม", name_en: "All Meeting Rooms", description: "เข้าได้เฉพาะห้องประชุมทุกชั้น (ไม่รวมห้องประชุมรัฐมนตรี)", hikvision_group_id: "HIK-GRP-MEETING", qr_code_prefix: "VMS-MTG", validity_minutes: 180, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "07:30", schedule_end_time: "18:00", color: "#0891B2", is_active: true },
        { id: "ag-6", name: "VIP — สำนักงานรัฐมนตรี", name_en: "VIP — Minister's Office", description: "เข้าชั้น 9 (ต้องได้รับอนุมัติพิเศษ)", hikvision_group_id: "HIK-GRP-VIP", qr_code_prefix: "VMS-VIP", validity_minutes: 60, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "09:00", schedule_end_time: "16:00", color: "#DC2626", is_active: true },
        { id: "ag-7", name: "ผู้รับเหมา / ซ่อมบำรุง", name_en: "Contractor / Maintenance", description: "เข้าพื้นที่ซ่อมบำรุง + ที่จอดรถ", hikvision_group_id: "HIK-GRP-MAINT", qr_code_prefix: "VMS-CTR", validity_minutes: 240, schedule_days_of_week: [1,2,3,4,5,6], schedule_start_time: "07:00", schedule_end_time: "18:00", color: "#92400E", is_active: true },
        { id: "ag-8", name: "ที่จอดรถ", name_en: "Parking Only", description: "เข้าได้เฉพาะลานจอดรถ", hikvision_group_id: "HIK-GRP-PARK", qr_code_prefix: "VMS-PKG", validity_minutes: 480, schedule_days_of_week: [1,2,3,4,5], schedule_start_time: "06:00", schedule_end_time: "20:00", color: "#4B5563", is_active: true },
        { id: "ag-9", name: "รับ-ส่งสินค้า", name_en: "Delivery / Pickup", description: "เข้าล็อบบี้ + ที่จอดรถ (จำกัดเวลา 30 นาที)", hikvision_group_id: "HIK-GRP-DELIVERY", qr_code_prefix: "VMS-DLV", validity_minutes: 30, schedule_days_of_week: [1,2,3,4,5,6], schedule_start_time: "06:00", schedule_end_time: "18:00", color: "#7C3AED", is_active: true },
      ],
    },
    {
      name: "access_group_zones",
      comment: "ตารางเชื่อม กลุ่มสิทธิ์ ↔ โซน (Many-to-Many) — กลุ่มนี้เข้าโซนไหนได้บ้าง",
      columns: [
        { name: "access_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → access_groups.id", isForeignKey: true, references: "access_groups.id" },
        { name: "access_zone_id", type: "VARCHAR(30)", nullable: false, comment: "FK → access_zones.id", isForeignKey: true, references: "access_zones.id" },
      ],
      seedData: [
        // ag-1: General → lobby + multipurpose
        { access_group_id: "ag-1", access_zone_id: "az-lobby" },
        { access_group_id: "ag-1", access_zone_id: "az-f9-multipurpose" },
        // ag-2: Official 2-5
        { access_group_id: "ag-2", access_zone_id: "az-lobby" },
        { access_group_id: "ag-2", access_zone_id: "az-f2-office" },
        { access_group_id: "ag-2", access_zone_id: "az-f2-meeting" },
        { access_group_id: "ag-2", access_zone_id: "az-f3-office" },
        { access_group_id: "ag-2", access_zone_id: "az-f3-meeting" },
        { access_group_id: "ag-2", access_zone_id: "az-f4-office" },
        { access_group_id: "ag-2", access_zone_id: "az-f4-meeting" },
        { access_group_id: "ag-2", access_zone_id: "az-f5-office" },
        { access_group_id: "ag-2", access_zone_id: "az-f5-meeting" },
        // ag-3: Official 6
        { access_group_id: "ag-3", access_zone_id: "az-lobby" },
        { access_group_id: "ag-3", access_zone_id: "az-f6-office" },
        { access_group_id: "ag-3", access_zone_id: "az-f6-meeting" },
        // ag-6: VIP
        { access_group_id: "ag-6", access_zone_id: "az-lobby" },
        { access_group_id: "ag-6", access_zone_id: "az-f9-vip" },
        { access_group_id: "ag-6", access_zone_id: "az-f9-meeting" },
        // ag-7: Contractor
        { access_group_id: "ag-7", access_zone_id: "az-lobby" },
        { access_group_id: "ag-7", access_zone_id: "az-parking" },
        { access_group_id: "ag-7", access_zone_id: "az-service" },
        // ag-9: Delivery
        { access_group_id: "ag-9", access_zone_id: "az-lobby" },
        { access_group_id: "ag-9", access_zone_id: "az-parking" },
      ],
    },
    {
      name: "access_group_visit_types",
      comment: "ตารางเชื่อม กลุ่มสิทธิ์ ↔ ประเภทการเยี่ยม (Many-to-Many)",
      columns: [
        { name: "access_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → access_groups.id", isForeignKey: true, references: "access_groups.id" },
        { name: "visit_type", type: "ENUM('official','meeting','document','contractor','delivery','other')", nullable: false, comment: "ประเภทการเยี่ยมที่กลุ่มนี้รองรับ" },
      ],
      seedData: [
        { access_group_id: "ag-1", visit_type: "document" },
        { access_group_id: "ag-1", visit_type: "delivery" },
        { access_group_id: "ag-1", visit_type: "other" },
        { access_group_id: "ag-2", visit_type: "official" },
        { access_group_id: "ag-2", visit_type: "meeting" },
        { access_group_id: "ag-2", visit_type: "document" },
        { access_group_id: "ag-5", visit_type: "meeting" },
        { access_group_id: "ag-6", visit_type: "official" },
        { access_group_id: "ag-6", visit_type: "meeting" },
        { access_group_id: "ag-7", visit_type: "contractor" },
        { access_group_id: "ag-9", visit_type: "delivery" },
      ],
    },
    {
      name: "department_access_mappings",
      comment: "จับคู่แผนก ↔ กลุ่มสิทธิ์เริ่มต้น — ใช้กำหนดว่าผู้เยี่ยมแผนกนี้ได้รับสิทธิ์กลุ่มอะไร",
      columns: [
        { name: "department_id", type: "VARCHAR(20)", nullable: false, comment: "FK → departments.id (PK)", isPrimaryKey: true, isForeignKey: true, references: "departments.id" },
        { name: "default_access_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → access_groups.id — กลุ่มสิทธิ์หลัก", isForeignKey: true, references: "access_groups.id" },
      ],
      seedData: [
        { department_id: "dept-1", default_access_group_id: "ag-2" },
        { department_id: "dept-2", default_access_group_id: "ag-2" },
        { department_id: "dept-3", default_access_group_id: "ag-2" },
        { department_id: "dept-4", default_access_group_id: "ag-2" },
        { department_id: "dept-5", default_access_group_id: "ag-3" },
        { department_id: "dept-6", default_access_group_id: "ag-4" },
        { department_id: "dept-7", default_access_group_id: "ag-4" },
        { department_id: "dept-8", default_access_group_id: "ag-2" },
        { department_id: "dept-9", default_access_group_id: "ag-6" },
        { department_id: "dept-10", default_access_group_id: "ag-3" },
        { department_id: "dept-11", default_access_group_id: "ag-4" },
        { department_id: "dept-12", default_access_group_id: "ag-4" },
        { department_id: "dept-13", default_access_group_id: "ag-4" },
      ],
    },
    {
      name: "department_additional_access_groups",
      comment: "กลุ่มสิทธิ์เสริม (นอกเหนือจาก default) ของแต่ละแผนก",
      columns: [
        { name: "department_id", type: "VARCHAR(20)", nullable: false, comment: "FK → departments.id", isForeignKey: true, references: "departments.id" },
        { name: "access_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → access_groups.id", isForeignKey: true, references: "access_groups.id" },
      ],
      seedData: [
        { department_id: "dept-1", access_group_id: "ag-5" },
        { department_id: "dept-2", access_group_id: "ag-5" },
        { department_id: "dept-3", access_group_id: "ag-5" },
        { department_id: "dept-4", access_group_id: "ag-5" },
        { department_id: "dept-5", access_group_id: "ag-5" },
        { department_id: "dept-6", access_group_id: "ag-5" },
        { department_id: "dept-7", access_group_id: "ag-5" },
        { department_id: "dept-8", access_group_id: "ag-5" },
        { department_id: "dept-9", access_group_id: "ag-2" },
        { department_id: "dept-10", access_group_id: "ag-5" },
        { department_id: "dept-11", access_group_id: "ag-5" },
        { department_id: "dept-13", access_group_id: "ag-5" },
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสกลุ่ม (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(150)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(150)", nullable: false, comment: "ชื่อกลุ่ม (ภาษาอังกฤษ)" },
        { name: "description", type: "TEXT", nullable: false, comment: "คำอธิบายรายละเอียดกลุ่ม" },
        { name: "department_id", type: "VARCHAR(20)", nullable: false, comment: "FK → departments.id — แผนกที่กลุ่มนี้รับผิดชอบ", isForeignKey: true, references: "departments.id" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "apg-1", name: "ผู้อนุมัติ สำนักงานปลัด (ราชการ+ประชุม)", name_en: "OPS Approvers (Official+Meeting)", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานปลัดกระทรวง", department_id: "dept-1", is_active: true },
        { id: "apg-2", name: "ผู้อนุมัติ สำนักงานปลัด (อื่นๆ)", name_en: "OPS Approvers (Other)", description: "กลุ่มผู้อนุมัติสำหรับ วัตถุประสงค์อื่นๆ ที่ สำนักงานปลัดกระทรวง", department_id: "dept-1", is_active: true },
        { id: "apg-3", name: "ผู้อนุมัติ กองกลาง (ราชการ+อื่นๆ)", name_en: "General Admin Approvers (Official+Other)", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / อื่นๆ ที่ กองกลาง", department_id: "dept-2", is_active: true },
        { id: "apg-4", name: "ผู้อนุมัติ กองกลาง (ผู้รับเหมา)", name_en: "General Admin Approvers (Contractor)", description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กองกลาง", department_id: "dept-2", is_active: true },
        { id: "apg-5", name: "ผู้อนุมัติ กองการต่างประเทศ", name_en: "International Approvers", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ กองการต่างประเทศ", department_id: "dept-3", is_active: true },
        { id: "apg-6", name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (ราชการ+เอกสาร)", name_en: "Tourism Affairs Approvers (Official+Docs)", description: "กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ส่งเอกสาร ที่ กองกิจการท่องเที่ยว", department_id: "dept-4", is_active: true },
        { id: "apg-7", name: "ผู้อนุมัติ กองกิจการท่องเที่ยว (เยี่ยมชม)", name_en: "Tourism Affairs Approvers (Tour)", description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กองกิจการท่องเที่ยว", department_id: "dept-4", is_active: true },
        { id: "apg-8", name: "ผู้อนุมัติ กรมการท่องเที่ยว (เยี่ยมชม)", name_en: "Dept. of Tourism Approvers (Tour)", description: "กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กรมการท่องเที่ยว", department_id: "dept-5", is_active: true },
        { id: "apg-9", name: "ผู้อนุมัติ กรมพลศึกษา (ผู้รับเหมา)", name_en: "Dept. of PE Approvers (Contractor)", description: "กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กรมพลศึกษา", department_id: "dept-6", is_active: true },
        { id: "apg-10", name: "ผู้อนุมัติ สำนักงานรัฐมนตรี (VIP)", name_en: "Minister Office Approvers (VIP)", description: "กลุ่มผู้อนุมัติ VIP สำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานรัฐมนตรี", department_id: "dept-9", is_active: true },
      ],
    },
    {
      name: "approver_group_members",
      comment: "สมาชิกในกลุ่มผู้อนุมัติ — ระบุสิทธิ์การอนุมัติ/ปฏิเสธ และการรับแจ้งเตือน",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "approver_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → approver_groups.id", isForeignKey: true, references: "approver_groups.id" },
        { name: "staff_id", type: "VARCHAR(20)", nullable: false, comment: "FK → staff.id — พนักงานที่เป็นสมาชิก", isForeignKey: true, references: "staff.id" },
        { name: "can_approve", type: "BOOLEAN", nullable: false, comment: "สามารถกดอนุมัติ/ปฏิเสธได้หรือไม่", defaultValue: "false" },
        { name: "receive_notification", type: "BOOLEAN", nullable: false, comment: "ได้รับแจ้งเตือนเมื่อมีรายการใหม่", defaultValue: "true" },
      ],
      seedData: [
        // apg-1: OPS (Official+Meeting)
        { id: 1, approver_group_id: "apg-1", staff_id: "staff-5", can_approve: true, receive_notification: true },
        { id: 2, approver_group_id: "apg-1", staff_id: "staff-1", can_approve: true, receive_notification: true },
        { id: 3, approver_group_id: "apg-1", staff_id: "staff-4", can_approve: false, receive_notification: true },
        // apg-2: OPS (Other)
        { id: 4, approver_group_id: "apg-2", staff_id: "staff-5", can_approve: true, receive_notification: true },
        { id: 5, approver_group_id: "apg-2", staff_id: "staff-4", can_approve: true, receive_notification: true },
        // apg-3: General Admin (Official+Other)
        { id: 6, approver_group_id: "apg-3", staff_id: "staff-2", can_approve: true, receive_notification: true },
        { id: 7, approver_group_id: "apg-3", staff_id: "staff-6", can_approve: false, receive_notification: true },
        // apg-4: General Admin (Contractor)
        { id: 8, approver_group_id: "apg-4", staff_id: "staff-2", can_approve: true, receive_notification: true },
        // apg-5: International
        { id: 9, approver_group_id: "apg-5", staff_id: "staff-3", can_approve: true, receive_notification: true },
        // apg-6: Tourism Affairs (Official+Docs)
        { id: 10, approver_group_id: "apg-6", staff_id: "staff-1", can_approve: true, receive_notification: true },
        { id: 11, approver_group_id: "apg-6", staff_id: "staff-4", can_approve: true, receive_notification: true },
        // apg-7: Tourism Affairs (Tour)
        { id: 12, approver_group_id: "apg-7", staff_id: "staff-1", can_approve: true, receive_notification: true },
        { id: 13, approver_group_id: "apg-7", staff_id: "staff-4", can_approve: true, receive_notification: true },
        // apg-8: Dept. of Tourism (Tour)
        { id: 14, approver_group_id: "apg-8", staff_id: "staff-1", can_approve: true, receive_notification: true },
        { id: 15, approver_group_id: "apg-8", staff_id: "staff-3", can_approve: true, receive_notification: false },
        // apg-9: Dept. of PE (Contractor)
        { id: 16, approver_group_id: "apg-9", staff_id: "staff-2", can_approve: true, receive_notification: true },
        // apg-10: Minister Office (VIP)
        { id: 17, approver_group_id: "apg-10", staff_id: "staff-5", can_approve: true, receive_notification: true },
        { id: 18, approver_group_id: "apg-10", staff_id: "staff-1", can_approve: true, receive_notification: true },
        { id: 19, approver_group_id: "apg-10", staff_id: "staff-4", can_approve: true, receive_notification: true },
      ],
    },
    {
      name: "approver_group_purposes",
      comment: "วัตถุประสงค์ที่แต่ละกลุ่มรับผิดชอบอนุมัติ (Many-to-Many)",
      columns: [
        { name: "approver_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → approver_groups.id", isForeignKey: true, references: "approver_groups.id" },
        { name: "visit_purpose_id", type: "VARCHAR(20)", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
      ],
      seedData: [
        { approver_group_id: "apg-1", visit_purpose_id: "vpc-1" },
        { approver_group_id: "apg-1", visit_purpose_id: "vpc-2" },
        { approver_group_id: "apg-2", visit_purpose_id: "vpc-8" },
        { approver_group_id: "apg-3", visit_purpose_id: "vpc-1" },
        { approver_group_id: "apg-3", visit_purpose_id: "vpc-8" },
        { approver_group_id: "apg-4", visit_purpose_id: "vpc-4" },
        { approver_group_id: "apg-5", visit_purpose_id: "vpc-1" },
        { approver_group_id: "apg-5", visit_purpose_id: "vpc-2" },
        { approver_group_id: "apg-6", visit_purpose_id: "vpc-1" },
        { approver_group_id: "apg-6", visit_purpose_id: "vpc-3" },
        { approver_group_id: "apg-7", visit_purpose_id: "vpc-6" },
        { approver_group_id: "apg-8", visit_purpose_id: "vpc-6" },
        { approver_group_id: "apg-9", visit_purpose_id: "vpc-4" },
        { approver_group_id: "apg-10", visit_purpose_id: "vpc-1" },
        { approver_group_id: "apg-10", visit_purpose_id: "vpc-2" },
      ],
    },
    {
      name: "approver_group_notify_channels",
      comment: "ช่องทางแจ้งเตือนของกลุ่มผู้อนุมัติ (สามารถเลือกหลายช่องทาง)",
      columns: [
        { name: "approver_group_id", type: "VARCHAR(20)", nullable: false, comment: "FK → approver_groups.id", isForeignKey: true, references: "approver_groups.id" },
        { name: "channel", type: "ENUM('line','email','web-app')", nullable: false, comment: "ช่องทาง: line / email / web-app" },
      ],
      seedData: [
        { approver_group_id: "apg-1", channel: "line" }, { approver_group_id: "apg-1", channel: "email" }, { approver_group_id: "apg-1", channel: "web-app" },
        { approver_group_id: "apg-2", channel: "line" }, { approver_group_id: "apg-2", channel: "web-app" },
        { approver_group_id: "apg-3", channel: "line" }, { approver_group_id: "apg-3", channel: "email" },
        { approver_group_id: "apg-4", channel: "line" }, { approver_group_id: "apg-4", channel: "email" },
        { approver_group_id: "apg-5", channel: "line" }, { approver_group_id: "apg-5", channel: "web-app" },
        { approver_group_id: "apg-6", channel: "email" }, { approver_group_id: "apg-6", channel: "web-app" },
        { approver_group_id: "apg-7", channel: "email" }, { approver_group_id: "apg-7", channel: "web-app" },
        { approver_group_id: "apg-8", channel: "line" }, { approver_group_id: "apg-8", channel: "email" }, { approver_group_id: "apg-8", channel: "web-app" },
        { approver_group_id: "apg-9", channel: "web-app" },
        { approver_group_id: "apg-10", channel: "line" }, { approver_group_id: "apg-10", channel: "email" }, { approver_group_id: "apg-10", channel: "web-app" },
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสพนักงานในระบบ (PK)", isPrimaryKey: true },
        { name: "employee_id", type: "VARCHAR(20)", nullable: false, comment: "รหัสพนักงาน (EMP-001, SEC-001)", isUnique: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อ-นามสกุล (ภาษาอังกฤษ)" },
        { name: "position", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่ง เช่น ผู้อำนวยการกอง / เจ้าหน้าที่ รปภ." },
        { name: "department_id", type: "VARCHAR(20)", nullable: false, comment: "FK → departments.id — แผนกที่สังกัด", isForeignKey: true, references: "departments.id" },
        { name: "email", type: "VARCHAR(100)", nullable: false, comment: "อีเมลราชการ" },
        { name: "phone", type: "VARCHAR(20)", nullable: false, comment: "เบอร์โทรศัพท์" },
        { name: "line_user_id", type: "VARCHAR(50)", nullable: true, comment: "LINE User ID (สำหรับแจ้งเตือนผ่าน LINE)" },
        { name: "avatar_url", type: "VARCHAR(255)", nullable: true, comment: "URL รูปภาพโปรไฟล์" },
        { name: "role", type: "ENUM('admin','supervisor','officer','staff','security','visitor')", nullable: false, comment: "บทบาท: admin=ผู้ดูแลระบบ, staff=เจ้าหน้าที่, security=รปภ." },
        { name: "status", type: "ENUM('active','inactive','locked')", nullable: false, comment: "สถานะ: active=ใช้งาน, inactive=ปิดใช้งาน, locked=ล็อก", defaultValue: "'active'" },
        { name: "shift", type: "ENUM('morning','afternoon','night')", nullable: true, comment: "กะการทำงาน (เฉพาะ security)" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "staff-1", employee_id: "EMP-001", name: "คุณสมศรี รักงาน", name_en: "Somsri Rakngarn", position: "ผู้อำนวยการกองกิจการท่องเที่ยว", department_id: "dept-4", email: "somsri.r@mots.go.th", phone: "02-283-1500", role: "staff", status: "active", shift: null },
        { id: "staff-2", employee_id: "EMP-002", name: "คุณประเสริฐ ศรีวิโล", name_en: "Prasert Srivilo", position: "หัวหน้ากลุ่มงานบริหารทั่วไป", department_id: "dept-2", email: "prasert.s@mots.go.th", phone: "02-283-1501", role: "staff", status: "active", shift: null },
        { id: "staff-3", employee_id: "EMP-003", name: "คุณกมลพร วงศ์สวัสดิ์", name_en: "Kamonporn Wongsawad", position: "ผู้เชี่ยวชาญด้านต่างประเทศ", department_id: "dept-3", email: "kamonporn.w@mots.go.th", phone: "02-283-1502", role: "staff", status: "active", shift: null },
        { id: "staff-4", employee_id: "EMP-004", name: "คุณวิภาดา ชัยมงคล", name_en: "Wipada Chaimongkol", position: "นักวิเคราะห์นโยบายและแผน", department_id: "dept-8", email: "wipada.c@mots.go.th", phone: "02-283-1503", role: "staff", status: "active", shift: null },
        { id: "staff-5", employee_id: "EMP-005", name: "คุณอนันต์ มั่นคง", name_en: "Anan Mankong", position: "ผู้ดูแลระบบ", department_id: "dept-1", email: "anan.m@mots.go.th", phone: "02-283-1504", role: "admin", status: "active", shift: null },
        { id: "staff-6", employee_id: "SEC-001", name: "คุณสมชาย ปลอดภัย", name_en: "Somchai Plodpai", position: "เจ้าหน้าที่รักษาความปลอดภัย", department_id: "dept-2", email: "somchai.p@mots.go.th", phone: "02-283-1510", role: "security", status: "active", shift: "morning" },
        { id: "staff-7", employee_id: "EMP-006", name: "คุณธนพล จิตรดี", name_en: "Thanapon Jitdee", position: "นักวิชาการท่องเที่ยว", department_id: "dept-5", email: "thanapon.j@mots.go.th", phone: "02-283-1505", role: "staff", status: "active", shift: null },
        { id: "staff-8", employee_id: "EMP-007", name: "คุณปิยะนุช สุขใจ", name_en: "Piyanuch Sukjai", position: "เจ้าหน้าที่บริหารงานทั่วไป", department_id: "dept-6", email: "piyanuch.s@mots.go.th", phone: "02-283-1506", role: "staff", status: "active", shift: null },
        { id: "staff-9", employee_id: "EMP-008", name: "คุณนภดล เรืองศักดิ์", name_en: "Noppadon Ruangsak", position: "นักจัดการงานทั่วไป", department_id: "dept-1", email: "noppadon.r@mots.go.th", phone: "02-283-1507", role: "staff", status: "inactive", shift: null },
        { id: "staff-10", employee_id: "SEC-002", name: "คุณชัยวัฒน์ กล้าหาญ", name_en: "Chaiwat Klahan", position: "เจ้าหน้าที่รักษาความปลอดภัย", department_id: "dept-2", email: "chaiwat.k@mots.go.th", phone: "02-283-1511", role: "security", status: "inactive", shift: "night" },
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสจุดบริการ (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อจุดบริการ (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อจุดบริการ (ภาษาอังกฤษ)" },
        { name: "type", type: "ENUM('kiosk','counter')", nullable: false, comment: "ประเภท: kiosk=ตู้อัตโนมัติ / counter=เคาน์เตอร์ รปภ." },
        { name: "status", type: "ENUM('online','offline','maintenance')", nullable: false, comment: "สถานะปัจจุบัน: online=ออนไลน์, offline=ออฟไลน์, maintenance=ซ่อมบำรุง", defaultValue: "'online'" },
        { name: "location", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่งที่ตั้ง (ภาษาไทย)" },
        { name: "location_en", type: "VARCHAR(150)", nullable: false, comment: "ตำแหน่งที่ตั้ง (ภาษาอังกฤษ)" },
        { name: "building", type: "VARCHAR(100)", nullable: false, comment: "อาคาร" },
        { name: "floor", type: "VARCHAR(20)", nullable: false, comment: "ชั้น" },
        { name: "ip_address", type: "VARCHAR(15)", nullable: false, comment: "IP Address ของอุปกรณ์" },
        { name: "mac_address", type: "VARCHAR(17)", nullable: false, comment: "MAC Address ของอุปกรณ์" },
        { name: "serial_number", type: "VARCHAR(30)", nullable: false, comment: "หมายเลขซีเรียล", isUnique: true },
        { name: "today_transactions", type: "INT", nullable: false, comment: "จำนวนธุรกรรมวันนี้ (reset ทุกวัน)", defaultValue: "0" },
        { name: "last_online", type: "TIMESTAMP", nullable: true, comment: "เวลาที่ออนไลน์ล่าสุด" },
        { name: "assigned_staff_id", type: "VARCHAR(20)", nullable: true, comment: "FK → staff.id — เจ้าหน้าที่ประจำจุด (เฉพาะ counter)", isForeignKey: true, references: "staff.id" },
        { name: "notes", type: "TEXT", nullable: true, comment: "หมายเหตุ" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "sp-1", name: "ตู้ Kiosk ล็อบบี้หลัก", name_en: "Main Lobby Kiosk", type: "kiosk", status: "online", location: "ล็อบบี้ ชั้น 1 ประตูหลัก", location_en: "Main Lobby, Gate 1", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.101", mac_address: "AA:BB:CC:DD:01:01", serial_number: "KIOSK-2024-001", today_transactions: 42, last_online: "2569-03-08T14:30:00", assigned_staff_id: null, is_active: true },
        { id: "sp-2", name: "ตู้ Kiosk ล็อบบี้ฝั่งตะวันออก", name_en: "East Lobby Kiosk", type: "kiosk", status: "offline", location: "ล็อบบี้ ชั้น 1 ประตูฝั่งตะวันออก", location_en: "East Lobby, Side Gate", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.102", mac_address: "AA:BB:CC:DD:01:02", serial_number: "KIOSK-2024-002", today_transactions: 28, last_online: "2569-03-08T14:28:00", assigned_staff_id: null, is_active: true },
        { id: "sp-3", name: "จุดบริการ Counter 1", name_en: "Service Counter 1", type: "counter", status: "online", location: "เคาน์เตอร์ รปภ. ประตูหลัก", location_en: "Security Counter, Main Gate", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.201", mac_address: "AA:BB:CC:DD:02:01", serial_number: "CTR-2024-001", today_transactions: 67, last_online: "2569-03-08T14:30:00", assigned_staff_id: "staff-6", is_active: true },
        { id: "sp-4", name: "จุดบริการ Counter 2", name_en: "Service Counter 2", type: "counter", status: "online", location: "เคาน์เตอร์ รปภ. ประตูหลัก", location_en: "Security Counter, Main Gate", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 1", ip_address: "192.168.1.202", mac_address: "AA:BB:CC:DD:02:02", serial_number: "CTR-2024-002", today_transactions: 53, last_online: "2569-03-08T14:29:00", assigned_staff_id: "staff-7", is_active: true },
      ],
    },
    {
      name: "service_point_purposes",
      comment: "วัตถุประสงค์ที่จุดบริการนี้รองรับ (Many-to-Many)",
      columns: [
        { name: "service_point_id", type: "VARCHAR(20)", nullable: false, comment: "FK → service_points.id", isForeignKey: true, references: "service_points.id" },
        { name: "visit_purpose_id", type: "VARCHAR(20)", nullable: false, comment: "FK → visit_purposes.id", isForeignKey: true, references: "visit_purposes.id" },
      ],
      seedData: [
        { service_point_id: "sp-1", visit_purpose_id: "vpc-1" }, { service_point_id: "sp-1", visit_purpose_id: "vpc-2" }, { service_point_id: "sp-1", visit_purpose_id: "vpc-5" },
        { service_point_id: "sp-2", visit_purpose_id: "vpc-1" }, { service_point_id: "sp-2", visit_purpose_id: "vpc-3" }, { service_point_id: "sp-2", visit_purpose_id: "vpc-4" },
        { service_point_id: "sp-3", visit_purpose_id: "vpc-1" }, { service_point_id: "sp-3", visit_purpose_id: "vpc-2" }, { service_point_id: "sp-3", visit_purpose_id: "vpc-3" }, { service_point_id: "sp-3", visit_purpose_id: "vpc-4" }, { service_point_id: "sp-3", visit_purpose_id: "vpc-5" },
        { service_point_id: "sp-4", visit_purpose_id: "vpc-1" }, { service_point_id: "sp-4", visit_purpose_id: "vpc-2" }, { service_point_id: "sp-4", visit_purpose_id: "vpc-3" }, { service_point_id: "sp-4", visit_purpose_id: "vpc-4" }, { service_point_id: "sp-4", visit_purpose_id: "vpc-5" },
      ],
    },
    {
      name: "service_point_documents",
      comment: "ประเภทเอกสารที่จุดบริการนี้รับ (Many-to-Many)",
      columns: [
        { name: "service_point_id", type: "VARCHAR(20)", nullable: false, comment: "FK → service_points.id", isForeignKey: true, references: "service_points.id" },
        { name: "identity_document_type_id", type: "VARCHAR(30)", nullable: false, comment: "FK → identity_document_types.id", isForeignKey: true, references: "identity_document_types.id" },
      ],
      seedData: [
        { service_point_id: "sp-1", identity_document_type_id: "doc-national-id" }, { service_point_id: "sp-1", identity_document_type_id: "doc-passport" }, { service_point_id: "sp-1", identity_document_type_id: "doc-gov-card" }, { service_point_id: "sp-1", identity_document_type_id: "doc-thai-id-app" },
        { service_point_id: "sp-2", identity_document_type_id: "doc-national-id" }, { service_point_id: "sp-2", identity_document_type_id: "doc-driver-license" }, { service_point_id: "sp-2", identity_document_type_id: "doc-thai-id-app" },
        { service_point_id: "sp-3", identity_document_type_id: "doc-national-id" }, { service_point_id: "sp-3", identity_document_type_id: "doc-passport" }, { service_point_id: "sp-3", identity_document_type_id: "doc-driver-license" }, { service_point_id: "sp-3", identity_document_type_id: "doc-gov-card" }, { service_point_id: "sp-3", identity_document_type_id: "doc-thai-id-app" },
        { service_point_id: "sp-4", identity_document_type_id: "doc-national-id" }, { service_point_id: "sp-4", identity_document_type_id: "doc-passport" }, { service_point_id: "sp-4", identity_document_type_id: "doc-driver-license" }, { service_point_id: "sp-4", identity_document_type_id: "doc-gov-card" }, { service_point_id: "sp-4", identity_document_type_id: "doc-thai-id-app" },
      ],
    },
  ],
  relationships: [
    "service_points N ──→ 1 staff (เจ้าหน้าที่ประจำจุด — optional, เฉพาะ counter)",
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
        { name: "id", type: "VARCHAR(30)", nullable: false, comment: "รหัสเอกสาร (PK) เช่น doc-national-id", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเอกสาร (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อเอกสาร (ภาษาอังกฤษ)" },
        { name: "icon", type: "VARCHAR(10)", nullable: true, comment: "ไอคอน Emoji" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผล" },
      ],
      seedData: [
        { id: "doc-national-id", name: "บัตรประจำตัวประชาชน", name_en: "National ID Card", icon: "🪪", is_active: true, sort_order: 1 },
        { id: "doc-passport", name: "หนังสือเดินทาง (Passport)", name_en: "Passport", icon: "📕", is_active: true, sort_order: 2 },
        { id: "doc-driver-license", name: "ใบขับขี่", name_en: "Driver's License", icon: "🚗", is_active: true, sort_order: 3 },
        { id: "doc-gov-card", name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", name_en: "Government Officer Card", icon: "🏛️", is_active: true, sort_order: 4 },
        { id: "doc-thai-id-app", name: "AppThaiID", name_en: "AppThaiID", icon: "📱", is_active: true, sort_order: 5 },
      ],
    },
    {
      name: "document_types",
      comment: "ตารางประเภทเอกสารเพิ่มเติมที่ผู้เยี่ยมอาจต้องแนบ (เอกสารมอบอำนาจ, ทะเบียนรถ ฯลฯ)",
      columns: [
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสเอกสาร (PK)", isPrimaryKey: true },
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
        { id: "doc-1", name: "บัตรประจำตัวประชาชน", name_en: "Thai National ID Card", category: "identification", is_required: true, require_photo: true, description: "บัตรประชาชนตัวจริง สำหรับบุคคลสัญชาติไทย", is_active: true, sort_order: 1 },
        { id: "doc-2", name: "หนังสือเดินทาง (Passport)", name_en: "Passport", category: "identification", is_required: true, require_photo: true, description: "สำหรับบุคคลต่างชาติ", is_active: true, sort_order: 2 },
        { id: "doc-3", name: "ใบขับขี่", name_en: "Driver's License", category: "identification", is_required: false, require_photo: true, description: "ใช้แทนบัตรประชาชนได้เฉพาะกรณี walk-in", is_active: true, sort_order: 3 },
        { id: "doc-4", name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", name_en: "Government Officer ID", category: "identification", is_required: false, require_photo: true, description: "บัตรประจำตัวข้าราชการ", is_active: true, sort_order: 4 },
      ],
    },
    {
      name: "document_type_visit_types",
      comment: "ประเภทเอกสารใช้ได้กับประเภทการเยี่ยมใด (Many-to-Many)",
      columns: [
        { name: "document_type_id", type: "VARCHAR(20)", nullable: false, comment: "FK → document_types.id", isForeignKey: true, references: "document_types.id" },
        { name: "visit_type", type: "ENUM('official','meeting','document','contractor','delivery','other')", nullable: false, comment: "ประเภทการเยี่ยม" },
      ],
      seedData: [
        // doc-1: all visit types
        { document_type_id: "doc-1", visit_type: "official" }, { document_type_id: "doc-1", visit_type: "meeting" }, { document_type_id: "doc-1", visit_type: "document" }, { document_type_id: "doc-1", visit_type: "contractor" }, { document_type_id: "doc-1", visit_type: "delivery" }, { document_type_id: "doc-1", visit_type: "other" },
        // doc-2: all
        { document_type_id: "doc-2", visit_type: "official" }, { document_type_id: "doc-2", visit_type: "meeting" }, { document_type_id: "doc-2", visit_type: "document" }, { document_type_id: "doc-2", visit_type: "contractor" }, { document_type_id: "doc-2", visit_type: "delivery" }, { document_type_id: "doc-2", visit_type: "other" },
        // doc-3: all
        { document_type_id: "doc-3", visit_type: "official" }, { document_type_id: "doc-3", visit_type: "meeting" }, { document_type_id: "doc-3", visit_type: "document" }, { document_type_id: "doc-3", visit_type: "contractor" }, { document_type_id: "doc-3", visit_type: "delivery" }, { document_type_id: "doc-3", visit_type: "other" },
        // doc-4: official + meeting only
        { document_type_id: "doc-4", visit_type: "official" }, { document_type_id: "doc-4", visit_type: "meeting" },
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสกฎ (PK)", isPrimaryKey: true },
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
        { id: "bh-1", name: "วันทำการปกติ (จ-ศ)", name_en: "Regular Weekdays (Mon-Fri)", type: "regular", days_of_week: [1,2,3,4,5], specific_date: null, open_time: "08:30", close_time: "16:30", allow_walkin: true, allow_kiosk: true, is_active: true },
        { id: "bh-2", name: "วันเสาร์ (เปิดครึ่งวัน)", name_en: "Saturday (Half Day)", type: "regular", days_of_week: [6], specific_date: null, open_time: "09:00", close_time: "12:00", allow_walkin: true, allow_kiosk: true, notes: "เปิดเฉพาะบางแผนก", is_active: true },
        { id: "bh-3", name: "วันอาทิตย์ (ปิด)", name_en: "Sunday (Closed)", type: "regular", days_of_week: [0], specific_date: null, open_time: "00:00", close_time: "00:00", allow_walkin: false, allow_kiosk: false, is_active: true },
        { id: "bh-4", name: "วันจักรี", name_en: "Chakri Memorial Day", type: "holiday", days_of_week: null, specific_date: "2569-04-06", open_time: "00:00", close_time: "00:00", allow_walkin: false, allow_kiosk: false, notes: "วันหยุดราชการ", is_active: true },
        { id: "bh-5", name: "สงกรานต์", name_en: "Songkran Festival", type: "holiday", days_of_week: null, specific_date: "2569-04-13", open_time: "00:00", close_time: "00:00", allow_walkin: false, allow_kiosk: false, notes: "วันหยุดสงกรานต์ 13-15 เม.ย.", is_active: true },
        { id: "bh-6", name: "งานสัมมนาพิเศษ", name_en: "Special Seminar Event", type: "special", days_of_week: null, specific_date: "2569-03-20", open_time: "07:00", close_time: "20:00", allow_walkin: true, allow_kiosk: true, notes: "เปิดนอกเวลาสำหรับสัมมนาประจำปี", is_active: true },
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
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสเทมเพลต (PK)", isPrimaryKey: true },
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
        { id: "nt-1", name: "แจ้งยืนยันจอง (LINE)", name_en: "Booking Confirmed (LINE)", trigger_event: "booking-confirmed", channel: "line", subject: null, body_th: "สวัสดีค่ะ คุณ{{visitorName}} 🎉\nการจองเลขที่ {{bookingCode}} ได้รับการยืนยันแล้ว\n📅 วันที่: {{date}}\n⏰ เวลา: {{time}}\n📍 {{location}}", body_en: "Hello {{visitorName}} 🎉\nBooking {{bookingCode}} confirmed.", is_active: true },
        { id: "nt-2", name: "แจ้งอนุมัติ (LINE)", name_en: "Approved (LINE)", trigger_event: "booking-approved", channel: "line", subject: null, body_th: "✅ คำขอเข้าพื้นที่ {{bookingCode}} ได้รับการอนุมัติแล้ว\nผู้อนุมัติ: {{approverName}}", body_en: "✅ Visit request {{bookingCode}} approved by {{approverName}}", is_active: true },
        { id: "nt-3", name: "แจ้งไม่อนุมัติ (LINE)", name_en: "Rejected (LINE)", trigger_event: "booking-rejected", channel: "line", subject: null, body_th: "❌ คำขอเข้าพื้นที่ {{bookingCode}} ไม่ได้รับการอนุมัติ\nเหตุผล: {{reason}}", body_en: "❌ Visit request {{bookingCode}} rejected. Reason: {{reason}}", is_active: true },
        { id: "nt-4", name: "เตือนล่วงหน้า 1 วัน (LINE)", name_en: "1-Day Reminder (LINE)", trigger_event: "reminder-1day", channel: "line", subject: null, body_th: "📢 เตือน: พรุ่งนี้คุณมีนัดหมาย {{bookingCode}}\n📅 {{date}} เวลา {{time}}\n📍 {{location}}", body_en: "📢 Reminder: Tomorrow you have appointment {{bookingCode}}", is_active: true },
        { id: "nt-5", name: "ต้อนรับ Check-in (LINE)", name_en: "Welcome Check-in (LINE)", trigger_event: "checkin-welcome", channel: "line", subject: null, body_th: "🏢 ยินดีต้อนรับคุณ {{visitorName}}\nเข้าพื้นที่สำเร็จเมื่อ {{checkinTime}}\n📍 {{zone}}", body_en: "🏢 Welcome {{visitorName}} — Checked in at {{checkinTime}}", is_active: true },
        { id: "nt-6", name: "แจ้งยืนยัน (Email)", name_en: "Booking Confirmed (Email)", trigger_event: "booking-confirmed", channel: "email", subject: "ยืนยันการจองเข้าพื้นที่ — {{bookingCode}}", body_th: "เรียน คุณ{{visitorName}}\n\nการจองเลขที่ {{bookingCode}} ได้รับการยืนยัน\nวันที่: {{date}} เวลา: {{time}} สถานที่: {{location}}\nผู้ติดต่อ: {{hostName}}", body_en: "Dear {{visitorName}},\nYour visit {{bookingCode}} has been confirmed.", is_active: true },
        { id: "nt-7", name: "แจ้งเตือนเกินเวลา (LINE)", name_en: "Overstay Alert (LINE)", trigger_event: "overstay-alert", channel: "line", subject: null, body_th: "⚠️ คุณ {{visitorName}} อยู่เกินเวลา\nเวลาที่ควรออก: {{checkoutTime}}", body_en: "⚠️ {{visitorName}} has exceeded allowed time.", is_active: true },
        { id: "nt-8", name: "ข้อมูล WiFi (LINE)", name_en: "WiFi Credentials (LINE)", trigger_event: "wifi-credentials", channel: "line", subject: null, body_th: "📶 WiFi: {{wifiSSID}}\nUser: {{wifiUsername}}\nPass: {{wifiPassword}}\nใช้ได้ถึง: {{expiry}}", body_en: "📶 WiFi: {{wifiSSID}} User: {{wifiUsername}} Pass: {{wifiPassword}}", is_active: true },
      ],
    },
    {
      name: "notification_template_variables",
      comment: "ตัวแปรที่แต่ละเทมเพลตรองรับ (ใช้แทนค่าด้วย {{variable_name}})",
      columns: [
        { name: "template_id", type: "VARCHAR(20)", nullable: false, comment: "FK → notification_templates.id", isForeignKey: true, references: "notification_templates.id" },
        { name: "variable_name", type: "VARCHAR(50)", nullable: false, comment: "ชื่อตัวแปร เช่น visitorName, bookingCode, date" },
      ],
      seedData: [
        // nt-1
        { template_id: "nt-1", variable_name: "visitorName" }, { template_id: "nt-1", variable_name: "bookingCode" }, { template_id: "nt-1", variable_name: "date" }, { template_id: "nt-1", variable_name: "time" }, { template_id: "nt-1", variable_name: "location" },
        // nt-2
        { template_id: "nt-2", variable_name: "bookingCode" }, { template_id: "nt-2", variable_name: "approverName" },
        // nt-3
        { template_id: "nt-3", variable_name: "bookingCode" }, { template_id: "nt-3", variable_name: "reason" }, { template_id: "nt-3", variable_name: "contactNumber" },
        // nt-5
        { template_id: "nt-5", variable_name: "visitorName" }, { template_id: "nt-5", variable_name: "checkinTime" }, { template_id: "nt-5", variable_name: "zone" }, { template_id: "nt-5", variable_name: "checkoutTime" },
        // nt-6
        { template_id: "nt-6", variable_name: "visitorName" }, { template_id: "nt-6", variable_name: "bookingCode" }, { template_id: "nt-6", variable_name: "date" }, { template_id: "nt-6", variable_name: "time" }, { template_id: "nt-6", variable_name: "location" }, { template_id: "nt-6", variable_name: "hostName" },
        // nt-8
        { template_id: "nt-8", variable_name: "wifiSSID" }, { template_id: "nt-8", variable_name: "wifiUsername" }, { template_id: "nt-8", variable_name: "wifiPassword" }, { template_id: "nt-8", variable_name: "expiry" },
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
  description: "จัดการแบบฟอร์มบัตรผู้เยี่ยม — ขนาด, ฟิลด์ที่แสดง, header/footer, และจับคู่กับวัตถุประสงค์",
  tables: [
    {
      name: "visit_slip_templates",
      comment: "ตารางแบบฟอร์มบัตรผู้เยี่ยม (Visit Slip) — กำหนดขนาด, แนวพิมพ์, องค์ประกอบที่แสดง",
      columns: [
        { name: "id", type: "VARCHAR(20)", nullable: false, comment: "รหัสแบบฟอร์ม (PK)", isPrimaryKey: true },
        { name: "name", type: "VARCHAR(100)", nullable: false, comment: "ชื่อแบบฟอร์ม (ภาษาไทย)" },
        { name: "name_en", type: "VARCHAR(100)", nullable: false, comment: "ชื่อแบบฟอร์ม (ภาษาอังกฤษ)" },
        { name: "description", type: "TEXT", nullable: false, comment: "คำอธิบายการใช้งาน" },
        { name: "size", type: "ENUM('a4','a5','thermal-80mm','thermal-58mm','badge-card')", nullable: false, comment: "ขนาดกระดาษ: a4, a5, thermal-80mm, thermal-58mm, badge-card(CR80)" },
        { name: "orientation", type: "ENUM('portrait','landscape')", nullable: false, comment: "แนวพิมพ์: portrait=แนวตั้ง, landscape=แนวนอน" },
        { name: "show_logo", type: "BOOLEAN", nullable: false, comment: "แสดงโลโก้กระทรวง", defaultValue: "true" },
        { name: "show_qr_code", type: "BOOLEAN", nullable: false, comment: "แสดง QR Code", defaultValue: "true" },
        { name: "show_photo", type: "BOOLEAN", nullable: false, comment: "แสดงรูปถ่ายผู้เยี่ยม", defaultValue: "false" },
        { name: "show_barcode", type: "BOOLEAN", nullable: false, comment: "แสดง Barcode", defaultValue: "false" },
        { name: "header_text", type: "VARCHAR(200)", nullable: false, comment: "ข้อความส่วนหัว" },
        { name: "footer_text", type: "VARCHAR(200)", nullable: false, comment: "ข้อความส่วนท้าย" },
        { name: "is_default", type: "BOOLEAN", nullable: false, comment: "เป็นแบบฟอร์มเริ่มต้น (ใช้เมื่อไม่ได้ระบุ)", defaultValue: "false" },
        { name: "is_active", type: "BOOLEAN", nullable: false, comment: "สถานะเปิด/ปิดใช้งาน", defaultValue: "true" },
        { name: "preview_color", type: "VARCHAR(10)", nullable: false, comment: "สี Hex สำหรับ Preview UI", defaultValue: "'#6A0DAD'" },
        { name: "created_at", type: "TIMESTAMP", nullable: false, comment: "วันที่สร้าง", defaultValue: "CURRENT_TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP", nullable: false, comment: "วันที่แก้ไขล่าสุด", defaultValue: "CURRENT_TIMESTAMP" },
      ],
      seedData: [
        { id: "slip-1", name: "แบบมาตรฐาน (A5)", name_en: "Standard (A5)", description: "แบบฟอร์มมาตรฐาน พิมพ์ A5 สำหรับผู้เยี่ยมทั่วไป", size: "a5", orientation: "portrait", show_logo: true, show_qr_code: true, show_photo: false, show_barcode: true, header_text: "บัตรผู้เยี่ยม / Visitor Pass — กระทรวงการท่องเที่ยวและกีฬา", footer_text: "กรุณาคืนบัตรเมื่อออกจากพื้นที่", is_default: true, is_active: true, preview_color: "#6A0DAD" },
        { id: "slip-2", name: "แบบ Badge Card", name_en: "Badge Card", description: "บัตรติดหน้าอก ขนาด CR80 สำหรับงานประชุม/สัมมนา", size: "badge-card", orientation: "landscape", show_logo: true, show_qr_code: true, show_photo: true, show_barcode: false, header_text: "บัตรผู้เยี่ยม / Visitor Badge", footer_text: "กรุณาติดบัตรตลอดเวลาที่อยู่ในพื้นที่", is_default: false, is_active: true, preview_color: "#D4AF37" },
        { id: "slip-3", name: "แบบ Thermal 80mm (ใบเสร็จ)", name_en: "Thermal 80mm Receipt", description: "พิมพ์จาก thermal สำหรับ Kiosk / Counter", size: "thermal-80mm", orientation: "portrait", show_logo: true, show_qr_code: true, show_photo: false, show_barcode: true, header_text: "=== บัตรผู้เยี่ยม ===", footer_text: "--- กรุณาคืนบัตรเมื่อออก ---", is_default: false, is_active: true, preview_color: "#333333" },
        { id: "slip-4", name: "แบบ VIP (A5 สีทอง)", name_en: "VIP Pass (A5 Gold)", description: "สำหรับแขก VIP / ผู้บริหารระดับสูง", size: "a5", orientation: "portrait", show_logo: true, show_qr_code: true, show_photo: true, show_barcode: false, header_text: "VIP Visitor Pass — Ministry of Tourism and Sports", footer_text: "Welcome to the Ministry of Tourism and Sports", is_default: false, is_active: true, preview_color: "#D4AF37" },
        { id: "slip-5", name: "แบบผู้รับเหมา (A5)", name_en: "Contractor Pass (A5)", description: "สำหรับผู้รับเหมา/ซ่อมบำรุง แสดงข้อมูลเครื่องมือ", size: "a5", orientation: "portrait", show_logo: true, show_qr_code: true, show_photo: false, show_barcode: true, header_text: "บัตรผู้รับเหมา / Contractor Pass", footer_text: "ห้ามเข้าพื้นที่นอกเหนือจากที่ระบุ", is_default: false, is_active: true, preview_color: "#E65100" },
      ],
    },
    {
      name: "visit_slip_fields",
      comment: "ฟิลด์ข้อมูลที่แสดงบนบัตรผู้เยี่ยม — เปิด/ปิดได้ตามแบบฟอร์ม",
      columns: [
        { name: "id", type: "SERIAL", nullable: false, comment: "รหัส Auto-increment (PK)", isPrimaryKey: true },
        { name: "template_id", type: "VARCHAR(20)", nullable: false, comment: "FK → visit_slip_templates.id", isForeignKey: true, references: "visit_slip_templates.id" },
        { name: "field_key", type: "VARCHAR(30)", nullable: false, comment: "Key ของฟิลด์ เช่น visitorName, hostName, accessZone" },
        { name: "label", type: "VARCHAR(80)", nullable: false, comment: "ป้ายกำกับ (ภาษาไทย)" },
        { name: "label_en", type: "VARCHAR(80)", nullable: false, comment: "ป้ายกำกับ (ภาษาอังกฤษ)" },
        { name: "is_enabled", type: "BOOLEAN", nullable: false, comment: "เปิดแสดงในแบบฟอร์มนี้หรือไม่", defaultValue: "true" },
        { name: "sort_order", type: "INT", nullable: false, comment: "ลำดับการแสดงผลบนบัตร" },
      ],
      seedData: [
        // slip-1: Standard — all fields enabled except companions, vehiclePlate, wifiInfo
        { id: 1, template_id: "slip-1", field_key: "visitorName", label: "ชื่อ-นามสกุล ผู้เยี่ยม", label_en: "Visitor Name", is_enabled: true, sort_order: 1 },
        { id: 2, template_id: "slip-1", field_key: "visitorCompany", label: "บริษัท / หน่วยงาน", label_en: "Company", is_enabled: true, sort_order: 2 },
        { id: 3, template_id: "slip-1", field_key: "idNumber", label: "เลขบัตร / Passport", label_en: "ID Number", is_enabled: true, sort_order: 3 },
        { id: 4, template_id: "slip-1", field_key: "hostName", label: "ผู้ติดต่อ / ผู้รับ", label_en: "Host Name", is_enabled: true, sort_order: 4 },
        { id: 5, template_id: "slip-1", field_key: "department", label: "แผนก / หน่วยงานที่พบ", label_en: "Department", is_enabled: true, sort_order: 5 },
        { id: 6, template_id: "slip-1", field_key: "visitPurpose", label: "วัตถุประสงค์", label_en: "Visit Purpose", is_enabled: true, sort_order: 6 },
        { id: 7, template_id: "slip-1", field_key: "visitDate", label: "วันที่เข้าพื้นที่", label_en: "Visit Date", is_enabled: true, sort_order: 7 },
        { id: 8, template_id: "slip-1", field_key: "timeIn", label: "เวลาเข้า", label_en: "Time In", is_enabled: true, sort_order: 8 },
        { id: 9, template_id: "slip-1", field_key: "timeOut", label: "เวลาที่ต้องออก", label_en: "Time Out", is_enabled: true, sort_order: 9 },
        { id: 10, template_id: "slip-1", field_key: "accessZone", label: "โซนที่อนุญาต", label_en: "Allowed Zone", is_enabled: true, sort_order: 10 },
        { id: 11, template_id: "slip-1", field_key: "bookingCode", label: "รหัสนัดหมาย", label_en: "Booking Code", is_enabled: true, sort_order: 11 },
      ],
    },
    {
      name: "purpose_slip_mappings",
      comment: "จับคู่ วัตถุประสงค์ ↔ แบบฟอร์ม Visit Slip — กำหนดว่าวัตถุประสงค์ใดใช้แบบฟอร์มไหน",
      columns: [
        { name: "visit_purpose_id", type: "VARCHAR(20)", nullable: false, comment: "FK → visit_purposes.id (PK)", isPrimaryKey: true, isForeignKey: true, references: "visit_purposes.id" },
        { name: "slip_template_id", type: "VARCHAR(20)", nullable: true, comment: "FK → visit_slip_templates.id — null = ใช้แบบ default", isForeignKey: true, references: "visit_slip_templates.id" },
      ],
      seedData: [
        { visit_purpose_id: "vpc-1", slip_template_id: null },
        { visit_purpose_id: "vpc-2", slip_template_id: "slip-2" },
        { visit_purpose_id: "vpc-3", slip_template_id: "slip-3" },
        { visit_purpose_id: "vpc-4", slip_template_id: "slip-5" },
        { visit_purpose_id: "vpc-5", slip_template_id: null },
        { visit_purpose_id: "vpc-6", slip_template_id: "slip-4" },
        { visit_purpose_id: "vpc-7", slip_template_id: "slip-3" },
        { visit_purpose_id: "vpc-8", slip_template_id: null },
      ],
    },
  ],
  relationships: [
    "visit_slip_templates 1 ──→ N visit_slip_fields (แต่ละแบบฟอร์มมีฟิลด์หลายตัว)",
    "visit_slip_templates 1 ←──→ N visit_purposes ผ่าน purpose_slip_mappings",
    "purpose_slip_mappings.slip_template_id = null หมายถึงใช้แบบฟอร์มที่ is_default=true",
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
];

/** ค้น schema ตาม pageId */
export function getSchemaByPageId(pageId: string): PageSchema | undefined {
  return allPageSchemas.find((s) => s.pageId === pageId);
}
