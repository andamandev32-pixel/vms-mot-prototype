// ===== eVMS FLOWCHART & VALIDATION RULES =====
// สำหรับ DEV Reference: แต่ละเมนูตั้งค่า มี flow อะไร เงื่อนไขอะไร validate อะไรบ้าง

// ===== TYPES =====

export interface FlowStep {
  id: string;
  label: string;
  labelEn?: string;
  type: "start" | "process" | "decision" | "end" | "subprocess" | "io";
  description?: string;
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface FlowChart {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  steps: FlowStep[];
  connections: FlowConnection[];
}

export interface ValidationRule {
  field: string;
  fieldEn?: string;
  rules: string[];
  rulesEn?: string[];
}

export interface BusinessCondition {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  conditions: string[];
}

export interface PageFlowData {
  pageId: string;
  menuName: string;
  menuNameEn: string;
  path: string;
  summary: string;
  summaryEn?: string;
  flowcharts: FlowChart[];
  validationRules: ValidationRule[];
  businessConditions: BusinessCondition[];
}

// ════════════════════════════════════════════════════
// 1. วัตถุประสงค์เข้าพื้นที่ (Visit Purposes)
// ════════════════════════════════════════════════════

const visitPurposesFlow: PageFlowData = {
  pageId: "visit-purposes",
  menuName: "วัตถุประสงค์เข้าพื้นที่",
  menuNameEn: "Visit Purposes",
  path: "/web/settings/visit-purposes",
  summary: "กำหนดวัตถุประสงค์การเข้าพื้นที่ ตั้งค่าเงื่อนไขแต่ละแผนก และช่องทางการเข้า",
  flowcharts: [
    {
      id: "vp-crud",
      title: "การจัดการวัตถุประสงค์",
      titleEn: "Visit Purpose CRUD Flow",
      description: "ขั้นตอนการสร้าง/แก้ไข/ปิดใช้งานวัตถุประสงค์",
      steps: [
        { id: "s1", label: "เริ่มต้น", type: "start" },
        { id: "s2", label: "กดปุ่ม \"เพิ่มวัตถุประสงค์\"", type: "process" },
        { id: "s3", label: "กรอกข้อมูลพื้นฐาน\n(ชื่อ TH/EN, ไอคอน, ลำดับ)", type: "process" },
        { id: "s4", label: "ตั้งค่าเงื่อนไขแต่ละแผนก\n(Department Rules)", type: "subprocess" },
        { id: "s5", label: "ช่องทางการเข้า\n(LINE / Kiosk)", type: "subprocess" },
        { id: "s6", label: "Validate ข้อมูลครบ?", type: "decision" },
        { id: "s7", label: "แสดง Error", type: "process" },
        { id: "s8", label: "บันทึกข้อมูล", type: "process" },
        { id: "s9", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s7", label: "ไม่ผ่าน", condition: "invalid" },
        { from: "s6", to: "s8", label: "ผ่าน", condition: "valid" },
        { from: "s7", to: "s3", label: "แก้ไข" },
        { from: "s8", to: "s9" },
      ],
    },
    {
      id: "vp-dept-rule",
      title: "เงื่อนไขแผนก (Department Rules)",
      titleEn: "Department Rule Configuration",
      description: "ขั้นตอนตั้งค่าเงื่อนไขต่อแผนกของแต่ละวัตถุประสงค์",
      steps: [
        { id: "d1", label: "เลือกแผนก", type: "start" },
        { id: "d2", label: "ต้องระบุชื่อบุคคลพบ?", type: "decision" },
        { id: "d3", label: "ต้องอนุมัติก่อนเข้า?", type: "decision" },
        { id: "d4", label: "เลือกกลุ่มผู้อนุมัติ\n(Approver Group)", type: "process" },
        { id: "d5", label: "ต้องถ่ายรูป?", type: "decision" },
        { id: "d6", label: "เลือกเอกสารที่ต้องใช้\n(Document Types)", type: "process" },
        { id: "d7", label: "เสนอ WiFi?", type: "decision" },
        { id: "d8", label: "บันทึกเงื่อนไขแผนก", type: "end" },
      ],
      connections: [
        { from: "d1", to: "d2" },
        { from: "d2", to: "d3", label: "ใช่/ไม่" },
        { from: "d3", to: "d4", label: "ใช่" },
        { from: "d3", to: "d5", label: "ไม่" },
        { from: "d4", to: "d5" },
        { from: "d5", to: "d6", label: "ใช่/ไม่" },
        { from: "d6", to: "d7" },
        { from: "d7", to: "d8", label: "ใช่/ไม่" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อวัตถุประสงค์ (TH)",
      fieldEn: "Purpose Name (TH)",
      rules: [
        "ห้ามว่าง (Required)",
        "ความยาวไม่เกิน 100 ตัวอักษร",
        "ห้ามซ้ำกับวัตถุประสงค์อื่นที่ active อยู่",
      ],
    },
    {
      field: "ชื่อวัตถุประสงค์ (EN)",
      fieldEn: "Purpose Name (EN)",
      rules: [
        "ห้ามว่าง (Required)",
        "ความยาวไม่เกิน 100 ตัวอักษร",
      ],
    },
    {
      field: "ลำดับการแสดงผล",
      fieldEn: "Sort Order",
      rules: [
        "ต้องเป็นจำนวนเต็มบวก (> 0)",
        "ห้ามซ้ำกัน (Unique)",
      ],
    },
    {
      field: "เงื่อนไขแผนก",
      fieldEn: "Department Rules",
      rules: [
        "ถ้าเปิด require_approval ต้องเลือก Approver Group อย่างน้อย 1 กลุ่ม",
        "ถ้าเปิด require_document ต้องเลือก Document Type อย่างน้อย 1 ประเภท",
        "แผนกเดียวกันตั้งได้ 1 กฎต่อ 1 วัตถุประสงค์เท่านั้น",
      ],
    },
    {
      field: "ช่องทางการเข้า",
      fieldEn: "Entry Channels",
      rules: [
        "ต้องเปิดอย่างน้อย 1 ช่องทาง (LINE หรือ Kiosk)",
        "ถ้าเปิด Kiosk ต้องมี Service Point ที่ active อยู่",
      ],
    },
  ],
  businessConditions: [
    {
      title: "การเปิด/ปิดวัตถุประสงค์",
      titleEn: "Enable/Disable Purpose",
      description: "เมื่อปิดวัตถุประสงค์ จะส่งผลกระทบกับส่วนอื่น",
      conditions: [
        "วัตถุประสงค์ที่ปิด (inactive) จะไม่แสดงใน LINE LIFF สำหรับผู้เยี่ยมชม",
        "วัตถุประสงค์ที่ปิด จะไม่แสดงใน Kiosk",
        "นัดหมายที่ใช้วัตถุประสงค์ที่ปิด ที่สถานะ pending/approved ยังคงทำงานปกต",
        "แนะนำ: ไม่ลบวัตถุประสงค์ ใช้ปิด (inactive) แทน เพื่อรักษาข้อมูลอ้างอิง",
      ],
    },
    {
      title: "เงื่อนไขการอนุมัติ (Approval Flow)",
      titleEn: "Approval Conditions",
      description: "หากเปิด require_approval สำหรับแผนกใด",
      conditions: [
        "ต้องมี Approver Group ที่ถูกกำหนดให้กับแผนกนั้น",
        "กลุ่มผู้อนุมัติต้องมีสมาชิกอย่างน้อย 1 คน",
        "เมื่อมีคำขอเข้าพื้นที่ → ระบบจะแจ้งเตือนกลุ่มผู้อนุมัติที่กำหนดไว้",
        "ถ้าไม่มี Approver Group ที่ map กัน → คำขอจะค้างสถานะ pending",
      ],
    },
    {
      title: "เอกสารแสดงตน (Identity Documents)",
      titleEn: "Required Documents",
      description: "ตั้งค่าเอกสารที่ต้องใช้ต่อแผนก",
      conditions: [
        "ถ้าระบุ required_documents → ผู้เยี่ยมชมต้องอัปโหลดในขั้นตอนลงทะเบียน",
        "รองรับเอกสารหลายประเภท: บัตรประชาชน, Passport, ใบขับขี่ ฯลฯ",
        "Kiosk: ใช้เครื่องสแกนอ่านเลขเอกสารอัตโนมัติ",
        "LINE: ผู้เยี่ยมชมถ่ายรูปและอัปโหลดเอง",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 2. ประเภทเอกสาร (Document Types)
// ════════════════════════════════════════════════════

const documentTypesFlow: PageFlowData = {
  pageId: "document-types",
  menuName: "ประเภทเอกสาร",
  menuNameEn: "Document Types",
  path: "/web/settings/document-types",
  summary: "กำหนดรายการเอกสารแสดงตนที่ใช้ในการลงทะเบียนเข้าพื้นที่",
  flowcharts: [
    {
      id: "dt-crud",
      title: "การจัดการประเภทเอกสาร",
      titleEn: "Document Type Management Flow",
      steps: [
        { id: "s1", label: "เริ่มต้น", type: "start" },
        { id: "s2", label: "เลือก เพิ่ม/แก้ไข", type: "decision" },
        { id: "s3", label: "กรอกข้อมูลเอกสาร\n(ชื่อ TH/EN, รูปแบบเลข)", type: "process" },
        { id: "s4", label: "กำหนดรูปแบบ Regex\n(สำหรับ Validate เลขเอกสาร)", type: "process" },
        { id: "s5", label: "Validate ข้อมูล", type: "decision" },
        { id: "s6", label: "บันทึกสำเร็จ", type: "end" },
        { id: "s7", label: "แสดง Error", type: "process" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3", label: "เพิ่ม/แก้ไข" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6", label: "ผ่าน" },
        { from: "s5", to: "s7", label: "ไม่ผ่าน" },
        { from: "s7", to: "s3" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อเอกสาร (TH)",
      fieldEn: "Document Name (TH)",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร", "ห้ามซ้ำกับเอกสารอื่น"],
    },
    {
      field: "ชื่อเอกสาร (EN)",
      fieldEn: "Document Name (EN)",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร"],
    },
    {
      field: "รูปแบบเลขเอกสาร (Regex)",
      fieldEn: "Document Number Pattern",
      rules: [
        "ต้องเป็น Regex ที่ถูกต้อง (Valid Pattern)",
        "ถ้าไม่ระบุ → ระบบจะไม่ validate เลขเอกสาร",
        "ตัวอย่าง: บัตรประชาชน → ^[0-9]{13}$",
        "ตัวอย่าง: Passport → ^[A-Z]{1,2}[0-9]{6,9}$",
      ],
    },
  ],
  businessConditions: [
    {
      title: "ผลกระทบเมื่อลบ/ปิดใช้งาน",
      titleEn: "Impact of Delete/Disable",
      description: "การลบหรือปิดใช้งานเอกสารมีผลกระทบ",
      conditions: [
        "เอกสารที่ถูกอ้างอิงใน Visit Purpose Rules ไม่สามารถลบได้",
        "ถ้าปิด (inactive) → จะไม่แสดงเป็นตัวเลือกในหน้าลงทะเบียนใหม่",
        "ข้อมูลเก่าที่ใช้เอกสารนี้ยังคงเก็บไว้",
      ],
    },
    {
      title: "การ Validate เลขเอกสาร",
      titleEn: "Document Number Validation",
      description: "ระบบจะ validate เลขเอกสารตาม Regex ที่กำหนด",
      conditions: [
        "Validate ตอนลงทะเบียน (LINE LIFF / Kiosk / Counter)",
        "ถ้า Regex ว่าง → รับค่าใดก็ได้",
        "ถ้า Regex ไม่ match → แจ้งผู้เยี่ยมชมว่าเลขเอกสารไม่ถูกต้อง",
        "ระบบตรวจ duplicate: ถ้าเลขเอกสารเคยลงทะเบียนแล้ว → แจ้งซ้ำ",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 3. สถานที่ / แผนก (Locations)
// ════════════════════════════════════════════════════

const locationsFlow: PageFlowData = {
  pageId: "locations",
  menuName: "สถานที่ / แผนก",
  menuNameEn: "Locations & Departments",
  path: "/web/settings/locations",
  summary: "จัดการโครงสร้างอาคาร ชั้น แผนก — เป็นข้อมูลอ้างอิงที่ใช้ทั่วทั้งระบบ",
  flowcharts: [
    {
      id: "loc-hierarchy",
      title: "โครงสร้างลำดับชั้น",
      titleEn: "Building → Floor → Department Hierarchy",
      description: "การจัดลำดับ อาคาร > ชั้น > แผนก",
      steps: [
        { id: "s1", label: "เริ่มต้น", type: "start" },
        { id: "s2", label: "สร้าง/เลือกอาคาร\n(Building)", type: "process" },
        { id: "s3", label: "สร้าง/เลือกชั้น\n(Floor)", type: "process" },
        { id: "s4", label: "สร้างแผนก\n(Department)", type: "process" },
        { id: "s5", label: "ผูก Access Group\n(ถ้ามี)", type: "subprocess" },
        { id: "s6", label: "Validate ข้อมูล", type: "decision" },
        { id: "s7", label: "บันทึก", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s7", label: "ผ่าน" },
        { from: "s6", to: "s4", label: "ไม่ผ่าน" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่ออาคาร",
      fieldEn: "Building Name",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร", "ห้ามซ้ำกัน"],
    },
    {
      field: "ชื่อชั้น",
      fieldEn: "Floor Name",
      rules: ["ห้ามว่าง (Required)", "ต้องผูกกับอาคาร (FK → building)", "ห้ามซ้ำภายในอาคารเดียวกัน"],
    },
    {
      field: "ชื่อแผนก",
      fieldEn: "Department Name",
      rules: [
        "ห้ามว่าง (Required)",
        "ความยาวไม่เกิน 100 ตัวอักษร",
        "ต้องผูกกับชั้น (FK → floor)",
        "ห้ามซ้ำภายในชั้นเดียวกัน",
      ],
    },
  ],
  businessConditions: [
    {
      title: "การลบอาคาร/ชั้น/แผนก",
      titleEn: "Deleting Building/Floor/Department",
      description: "ข้อมูลที่ถูกอ้างอิงจากส่วนอื่นไม่สามารถลบได้",
      conditions: [
        "อาคารที่มี Floor อยู่ → ไม่สามารถลบได้ ต้องลบ Floor ก่อน",
        "Floor ที่มี Department อยู่ → ไม่สามารถลบได้ ต้องลบ Department ก่อน",
        "Department ที่มี Staff/Appointment อ้างอิง → แนะนำใช้ปิด (inactive) แทนลบ",
        "Department ที่ถูกผูกใน Visit Purpose Rules → ต้องลบ Rule ก่อน",
      ],
    },
    {
      title: "ผลกระทบต่อส่วนอื่น",
      titleEn: "Cross-system Impact",
      description: "แผนกเป็นข้อมูลหลักที่ใช้ทั่วระบบ",
      conditions: [
        "ใช้ใน Visit Purpose Rules → กำหนดเงื่อนไขต่อแผนก",
        "ใช้ใน Approver Groups → กำหนดกลุ่มผู้อนุมัติต่อแผนก",
        "ใช้ใน Staff → สังกัดแผนก",
        "ใช้ใน Access Zones → กำหนด Department Access Mapping",
        "ใช้ใน Appointment → ระบุแผนกปลายทาง",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 4. เทมเพลตแจ้งเตือน (Notification Templates)
// ════════════════════════════════════════════════════

const notificationTemplatesFlow: PageFlowData = {
  pageId: "notification-templates",
  menuName: "เทมเพลตแจ้งเตือน",
  menuNameEn: "Notification Templates",
  path: "/web/settings/notification-templates",
  summary: "ออกแบบข้อความแจ้งเตือนสำหรับ LINE, Email, SMS — พร้อมตัวแปรแทนที่อัตโนมัติ",
  flowcharts: [
    {
      id: "nt-crud",
      title: "การจัดการเทมเพลต",
      titleEn: "Notification Template Flow",
      steps: [
        { id: "s1", label: "เริ่มต้น", type: "start" },
        { id: "s2", label: "เลือก Trigger Event\n(เช่น อนุมัติ, Check-in)", type: "process" },
        { id: "s3", label: "เลือกช่องทาง\n(LINE / Email / SMS)", type: "process" },
        { id: "s4", label: "เขียนข้อความ TH/EN\nใส่ตัวแปร {{variable}}", type: "process" },
        { id: "s5", label: "Preview ข้อความ", type: "subprocess" },
        { id: "s6", label: "Validate", type: "decision" },
        { id: "s7", label: "บันทึก", type: "end" },
        { id: "s8", label: "แสดง Error", type: "process" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s7", label: "ผ่าน" },
        { from: "s6", to: "s8", label: "ไม่ผ่าน" },
        { from: "s8", to: "s4" },
      ],
    },
    {
      id: "nt-trigger",
      title: "การทำงานเมื่อเกิด Event",
      titleEn: "Notification Trigger Flow",
      description: "ระบบส่งแจ้งเตือนอัตโนมัติเมื่อเกิด Event ต่างๆ",
      steps: [
        { id: "t1", label: "Event เกิดขึ้น\n(เช่น นัดหมายใหม่)", type: "start" },
        { id: "t2", label: "ดึง Template ตาม\nTrigger Event", type: "process" },
        { id: "t3", label: "มี Template?", type: "decision" },
        { id: "t4", label: "แทนที่ตัวแปร\n{{variable}} → ค่าจริง", type: "process" },
        { id: "t5", label: "ส่งผ่านช่องทาง\n(LINE/Email/SMS)", type: "io" },
        { id: "t6", label: "ไม่ส่งแจ้งเตือน", type: "end" },
        { id: "t7", label: "ส่งสำเร็จ", type: "end" },
      ],
      connections: [
        { from: "t1", to: "t2" },
        { from: "t2", to: "t3" },
        { from: "t3", to: "t4", label: "มี" },
        { from: "t3", to: "t6", label: "ไม่มี" },
        { from: "t4", to: "t5" },
        { from: "t5", to: "t7" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อเทมเพลต",
      fieldEn: "Template Name",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร"],
    },
    {
      field: "Trigger Event",
      fieldEn: "Trigger Event",
      rules: [
        "ต้องเลือก 1 event",
        "Event ที่รองรับ: appointment_created, appointment_approved, appointment_rejected, checkin, checkout, reminder",
      ],
    },
    {
      field: "ช่องทาง (Channel)",
      fieldEn: "Notification Channel",
      rules: ["ต้องเลือกอย่างน้อย 1 ช่องทาง", "ช่องทางที่รองรับ: LINE, Email, SMS"],
    },
    {
      field: "ข้อความเทมเพลต (TH/EN)",
      fieldEn: "Template Message",
      rules: [
        "ห้ามว่าง (Required) อย่างน้อยภาษาไทย",
        "ตัวแปรต้องอยู่ในรูป {{variableName}}",
        "ตัวแปรที่รองรับ: {{visitorName}}, {{hostName}}, {{date}}, {{time}}, {{location}}, {{purpose}}, {{code}}, {{qrCode}}",
        "ตัวแปรที่ไม่รู้จักจะแสดงเป็น text ตรงๆ (ไม่ error)",
      ],
    },
  ],
  businessConditions: [
    {
      title: "ลำดับความสำคัญของเทมเพลต",
      titleEn: "Template Priority",
      description: "เมื่อมีหลาย Template ต่อ 1 Event",
      conditions: [
        "1 Trigger + 1 Channel = ใช้ได้ 1 Template เท่านั้น (ไม่ซ้ำ)",
        "ถ้ายังไม่มี Template → ระบบจะไม่ส่งแจ้งเตือน (silent fail)",
        "Template ที่ inactive จะไม่ถูกใช้งาน",
      ],
    },
    {
      title: "ตัวแปรแทนที่ (Template Variables)",
      titleEn: "Template Variable Substitution",
      description: "ระบบจะแทนที่ตัวแปรเมื่อส่งแจ้งเตือนจริง",
      conditions: [
        "{{visitorName}} → ชื่อผู้เยี่ยมชม",
        "{{hostName}} → ชื่อผู้รับผิดชอบ/เจ้าหน้าที่",
        "{{date}} → วันที่นัดหมาย (พ.ศ.)",
        "{{time}} → เวลานัดหมาย",
        "{{location}} → สถานที่ (อาคาร/ชั้น/แผนก)",
        "{{purpose}} → วัตถุประสงค์",
        "{{code}} → รหัสนัดหมาย",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 5. จุดบริการ (Service Points)
// ════════════════════════════════════════════════════

const servicePointsFlow: PageFlowData = {
  pageId: "service-points",
  menuName: "จุดบริการ",
  menuNameEn: "Service Points (Kiosk / Counter)",
  path: "/web/settings/service-points",
  summary: "จัดการอุปกรณ์ Kiosk และ Counter — ตั้งค่าที่ตั้ง สถานะ วัตถุประสงค์ที่รองรับ",
  flowcharts: [
    {
      id: "counter-login",
      title: "Counter Login Flow",
      titleEn: "Counter Guard Login Flow",
      steps: [
        { id: "cl1", label: "เริ่มต้น", type: "start" },
        { id: "cl2", label: "เลือกชื่อเจ้าหน้าที่ รปภ.\n+ กรอกรหัสผ่าน", type: "process" },
        { id: "cl3", label: "ตรวจสอบสิทธิ์", type: "decision" },
        { id: "cl4", label: "แสดง Counter\nที่มีสิทธิ์เท่านั้น", type: "subprocess" },
        { id: "cl5", label: "มี Counter เดียว?", type: "decision" },
        { id: "cl6", label: "เลือก Counter", type: "process" },
        { id: "cl7", label: "Auto-select", type: "process" },
        { id: "cl8", label: "เข้า Dashboard", type: "end" },
        { id: "cl9", label: "แสดงข้อความ:\nยังไม่มีสิทธิ์", type: "end" },
      ],
      connections: [
        { from: "cl1", to: "cl2" },
        { from: "cl2", to: "cl3" },
        { from: "cl3", to: "cl4", label: "ผ่าน" },
        { from: "cl3", to: "cl2", label: "ไม่ผ่าน" },
        { from: "cl4", to: "cl5" },
        { from: "cl5", to: "cl7", label: "1 จุด" },
        { from: "cl5", to: "cl6", label: "หลายจุด" },
        { from: "cl5", to: "cl9", label: "0 จุด" },
        { from: "cl6", to: "cl8" },
        { from: "cl7", to: "cl8" },
      ],
    },
    {
      id: "sp-setup",
      title: "การตั้งค่าจุดบริการใหม่",
      titleEn: "Service Point Setup Flow",
      steps: [
        { id: "s1", label: "เริ่มต้น", type: "start" },
        { id: "s2", label: "เลือกประเภท\n(Kiosk / Counter)", type: "decision" },
        { id: "s3", label: "กำหนดข้อมูลพื้นฐาน\n(ชื่อ, ที่ตั้ง, IP)", type: "process" },
        { id: "s4", label: "เลือกอาคาร/ชั้น", type: "process" },
        { id: "s5", label: "เลือกวัตถุประสงค์ที่รองรับ", type: "subprocess" },
        { id: "s6", label: "เลือกเอกสารที่ยอมรับ", type: "subprocess" },
        { id: "s6b", label: "ตั้งค่า Timeout แต่ละหน้า\n(Kiosk เท่านั้น)", type: "process" },
        { id: "s6c", label: "ตั้งค่า WiFi\n(SSID, Password, อายุ)", type: "process" },
        { id: "s6d", label: "ตั้งค่า PDPA\n(เลื่อนอ่าน, วันเก็บข้อมูล)", type: "process" },
        { id: "s6e", label: "ตั้งค่าใบ Slip\n(Header, Footer)", type: "process" },
        { id: "s6f", label: "ตั้งค่าขั้นสูง\n(เวลาทำการ, ปิดบังเลขบัตร, PIN)", type: "process" },
        { id: "s7", label: "กำหนดเจ้าหน้าที่ประจำ\n(Counter: M:N หลายคน)", type: "process" },
        { id: "s8", label: "Validate", type: "decision" },
        { id: "s9", label: "บันทึก & ตั้งสถานะ", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3", label: "Kiosk" },
        { from: "s2", to: "s3", label: "Counter" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s6b" },
        { from: "s6b", to: "s6c" },
        { from: "s6c", to: "s6d" },
        { from: "s6d", to: "s6e" },
        { from: "s6e", to: "s6f" },
        { from: "s6f", to: "s7" },
        { from: "s7", to: "s8" },
        { from: "s8", to: "s9", label: "ผ่าน" },
        { from: "s8", to: "s3", label: "ไม่ผ่าน" },
      ],
    },
    {
      id: "sp-status",
      title: "การเปลี่ยนสถานะจุดบริการ",
      titleEn: "Service Point Status Flow",
      steps: [
        { id: "st1", label: "สถานะปัจจุบัน", type: "start" },
        { id: "st2", label: "เลือกสถานะใหม่", type: "decision" },
        { id: "st3", label: "Online\n(พร้อมใช้งาน)", type: "end" },
        { id: "st4", label: "Offline\n(ปิดให้บริการ)", type: "end" },
        { id: "st5", label: "Maintenance\n(ซ่อมบำรุง)", type: "end" },
      ],
      connections: [
        { from: "st1", to: "st2" },
        { from: "st2", to: "st3", label: "Online" },
        { from: "st2", to: "st4", label: "Offline" },
        { from: "st2", to: "st5", label: "Maintenance" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อจุดบริการ",
      fieldEn: "Service Point Name",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร", "ห้ามซ้ำ"],
    },
    {
      field: "IP Address",
      fieldEn: "IP Address",
      rules: ["ต้องเป็นรูปแบบ IPv4 ที่ถูกต้อง (x.x.x.x)", "ห้ามซ้ำกับจุดบริการอื่น"],
    },
    {
      field: "ที่ตั้ง",
      fieldEn: "Location",
      rules: ["ต้องเลือกอาคาร (Required)", "ต้องเลือกชั้น (Required)"],
    },
    {
      field: "เจ้าหน้าที่ (Counter)",
      fieldEn: "Assigned Staff",
      rules: [
        "Counter ต้องกำหนดเจ้าหน้าที่อย่างน้อย 1 คน (ผ่าน counter_staff_assignments)",
        "เจ้าหน้าที่ต้อง active และ role = security หรือ officer",
        "Kiosk ไม่ต้องกำหนดเจ้าหน้าที่",
        "พนักงาน 1 คนสามารถ assign ได้หลาย counter (M:N)",
        "แต่ละ counter ควรมี is_primary = true อย่างน้อย 1 คน",
      ],
    },
    {
      field: "WiFi Config",
      fieldEn: "WiFi Configuration",
      rules: [
        "wifi_ssid: ไม่เกิน 50 ตัวอักษร (optional, default: MOTS-Guest)",
        "wifi_password_pattern: รองรับตัวแปร {year}, {month}, {day}",
        "wifi_validity_mode: ต้องเป็น 'business-hours-close' หรือ 'fixed-duration'",
        "wifi_fixed_duration_min: ถ้า mode = fixed-duration ต้อง >= 30 นาที",
      ],
    },
    {
      field: "Admin PIN",
      fieldEn: "Admin PIN",
      rules: [
        "ต้องเป็นตัวเลข 5 หลัก",
        "default: '10210'",
        "ใช้สำหรับ unlock เมนูตั้งค่าบน Kiosk",
      ],
    },
  ],
  businessConditions: [
    {
      title: "สถานะจุดบริการ",
      titleEn: "Service Point Status Rules",
      description: "แต่ละสถานะมีผลต่อการทำงาน",
      conditions: [
        "Online → รับ Walk-in / Check-in ได้ตามปกติ",
        "Offline → ไม่แสดงเป็นตัวเลือกในระบบ (ผู้เยี่ยมชมไม่เห็น)",
        "Maintenance → แสดงข้อความ \"อยู่ระหว่างซ่อมบำรุง\" ให้ผู้เยี่ยมชม",
        "เปลี่ยนสถานะได้ทุกเมื่อ ไม่ต้อง approve",
      ],
    },
    {
      title: "ความสัมพันธ์กับ Business Hours",
      titleEn: "Relation with Business Hours",
      description: "จุดบริการทำงานภายใต้เวลาทำการ",
      conditions: [
        "ถ้า follow_business_hours = true → Kiosk ตรวจสอบเวลาทำการจาก business_hours_rules",
        "ถ้า follow_business_hours = false → Kiosk เปิดตลอด ไม่จำกัดเวลา",
        "Kiosk อนุญาตตามเวลาที่ Business Hours กำหนดให้ช่อง \"Kiosk\"",
        "Counter อนุญาตตามเวลาที่ Business Hours กำหนดให้ช่อง \"Counter\"",
        "นอกเวลาทำการ → Kiosk แสดงว่า \"ปิดให้บริการ\"",
        "Counter guard ยังสามารถ manual check-in ได้แม้นอกเวลา (override)",
      ],
    },
    {
      title: "WiFi สำหรับผู้เยี่ยม",
      titleEn: "Visitor WiFi Config",
      description: "ตั้งค่า WiFi ที่แสดงบน Kiosk และใบ slip",
      conditions: [
        "wifi_ssid → ชื่อ WiFi ที่แสดงบนหน้า Face Capture และใบ slip",
        "wifi_password_pattern → รองรับตัวแปร {year}, {month}, {day} เช่น mots{year} → mots2568",
        "wifi_validity_mode = 'business-hours-close' → แสดงเวลาปิดทำการเป็นเวลาหมดอายุ WiFi",
        "wifi_validity_mode = 'fixed-duration' → คำนวณจาก เวลาปัจจุบัน + wifi_fixed_duration_min",
        "ถ้าไม่ตั้งค่า → ใช้ default: SSID='MOTS-Guest', password='mots{year}', mode='business-hours-close'",
        "★ wifi_requested (visit_records) = ผู้จองขอ WiFi ไว้ตอนนัดหมาย → Kiosk pre-select ไว้ให้ แก้ไขได้",
        "★ ถ้าไม่ได้ขอไว้ → Kiosk ถามตามปกติ",
      ],
    },
    {
      title: "PDPA / ความเป็นส่วนตัว",
      titleEn: "PDPA Config",
      description: "ตั้งค่าการแสดงข้อความ PDPA บน Kiosk",
      conditions: [
        "pdpa_require_scroll = true → ผู้ใช้ต้องเลื่อนอ่านจนสุดก่อนกดยินยอม",
        "pdpa_retention_days → แสดงในข้อความ PDPA ว่าเก็บข้อมูลกี่วัน (default: 90)",
        "Kiosk อ่านค่า retentionDays จาก service_points → แสดงแบบ dynamic",
      ],
    },
    {
      title: "ใบ Slip (Thermal Print)",
      titleEn: "Slip Config",
      description: "กำหนดข้อความบนใบ slip ที่ Kiosk พิมพ์",
      conditions: [
        "slip_header_text → ข้อความบรรทัดแรกของใบ slip (เช่น ชื่อหน่วยงาน)",
        "slip_footer_text → ข้อความบรรทัดสุดท้ายของใบ slip",
        "ถ้าไม่ตั้งค่า → ใช้ default: header='กระทรวงการท่องเที่ยวและกีฬา'",
        "★ line_linked = true → ถามก่อนพิมพ์ slip (เพราะส่ง LINE ได้)",
        "★ ถ้าเลือก 'ไม่พิมพ์' → ส่ง Visitor Pass ผ่าน LINE แทน (ลดกระดาษ)",
        "★ ถ้าไม่มี LINE → พิมพ์อัตโนมัติตามปกติ",
      ],
    },
    {
      title: "การปิดบังเลขบัตร (ID Masking)",
      titleEn: "ID Masking",
      description: "รูปแบบการแสดงเลขบัตรบนใบ slip",
      conditions: [
        "show-last-4 → แสดงเฉพาะ 4 ตัวสุดท้าย เช่น x-xxxx-xxxxx-xx-1",
        "show-first-last → แสดงหัวและท้าย เช่น 1-xxxx-xxxxx-xx-1",
        "full-mask → ปิดทั้งหมด เช่น x-xxxx-xxxxx-xx-x",
        "Kiosk อ่านค่าจาก service_points.id_masking_pattern",
      ],
    },
    {
      title: "PIN ผู้ดูแล Kiosk",
      titleEn: "Admin PIN",
      description: "รหัสสำหรับเข้าเมนูตั้งค่าบนตัวเครื่อง Kiosk",
      conditions: [
        "admin_pin = รหัส 5 หลัก (default: '10210')",
        "กด icon เฟือง ที่มุมล่างซ้ายของ Kiosk → popup ขอ PIN",
        "PIN ถูกต้อง → เข้าหน้าเลือก Kiosk / ดูสถานะ",
        "PIN ไม่ถูกต้อง → แสดงข้อความ error, ล้างอัตโนมัติ",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 6. เจ้าหน้าที่ / บุคลากร (Staff)
// ════════════════════════════════════════════════════

const staffFlow: PageFlowData = {
  pageId: "staff",
  menuName: "เจ้าหน้าที่ / บุคลากร",
  menuNameEn: "Staff Management",
  path: "/web/settings/staff",
  summary: "จัดการข้อมูลเจ้าหน้าที่ — สร้าง แก้ไข กำหนดบทบาท และสังกัดแผนก",
  flowcharts: [
    {
      id: "staff-crud",
      title: "การจัดการเจ้าหน้าที่",
      titleEn: "Staff CRUD Flow",
      steps: [
        { id: "s1", label: "เริ่มต้น", type: "start" },
        { id: "s2", label: "เลือก เพิ่ม/แก้ไข/นำเข้า", type: "decision" },
        { id: "s3", label: "กรอกข้อมูลเจ้าหน้าที่\n(ชื่อ, รหัส, email, เบอร์)", type: "process" },
        { id: "s4", label: "กำหนดบทบาท (Role)\n(Admin/Staff/Security)", type: "process" },
        { id: "s5", label: "เลือกแผนก", type: "process" },
        { id: "s6", label: "ผูก LINE UserId\n(ถ้ามี)", type: "process" },
        { id: "s7", label: "Validate", type: "decision" },
        { id: "s8", label: "บันทึก", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3", label: "เพิ่ม/แก้ไข" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s7" },
        { from: "s7", to: "s8", label: "ผ่าน" },
        { from: "s7", to: "s3", label: "ไม่ผ่าน" },
      ],
    },
  ],
  validationRules: [
    {
      field: "รหัสพนักงาน",
      fieldEn: "Employee ID",
      rules: ["ห้ามว่าง (Required)", "ห้ามซ้ำ (Unique)", "ต้องเป็นตัวเลขหรือตัวอักษร A-Z0-9"],
    },
    {
      field: "ชื่อ-สกุล (TH)",
      fieldEn: "Full Name (TH)",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร"],
    },
    {
      field: "Email",
      fieldEn: "Email Address",
      rules: ["ห้ามว่าง (Required)", "ต้องเป็นรูปแบบ email ที่ถูกต้อง", "ห้ามซ้ำ (Unique)"],
    },
    {
      field: "บทบาท (Role)",
      fieldEn: "Role",
      rules: [
        "ต้องเลือก 1 บทบาท",
        "Admin → เข้าถึง Web Admin ได้ทั้งหมด",
        "Staff → ใช้ Officer App อนุมัติ/ต้อนรับ",
        "Security → ใช้ Counter App check-in/out",
      ],
    },
    {
      field: "แผนก",
      fieldEn: "Department",
      rules: ["ต้องเลือก 1 แผนก (Required)", "แผนกต้อง active"],
    },
  ],
  businessConditions: [
    {
      title: "การปิดใช้งาน (Deactivate)",
      titleEn: "Staff Deactivation",
      description: "การปิดใช้งานเจ้าหน้าที่มีผลกระทบ",
      conditions: [
        "เจ้าหน้าที่ที่ inactive จะไม่สามารถ login เข้าระบบได้",
        "ถูกลบออกจาก Approver Group โดยอัตโนมัติ (หรือแจ้งเตือน)",
        "นัดหมายที่เป็น Host → ยังคงแสดงข้อมูลเดิม (ไม่เปลี่ยน)",
        "ไม่แนะนำให้ลบ → ใช้ปิดการใช้งานแทน เพื่อเก็บ audit trail",
      ],
    },
    {
      title: "สิทธิ์ตามบทบาท (Role-Based Access)",
      titleEn: "Role-Based Access Control",
      description: "บทบาทกำหนดสิทธิ์การเข้าถึง",
      conditions: [
        "Admin → Web Admin ทั้งหมด + ตั้งค่าระบบ + ดู Dashboard",
        "Supervisor → อนุมัติ/ปฏิเสธคำขอ + ดู Officer Dashboard",
        "Officer → ต้อนรับผู้เยี่ยมชม + จัดการ hospitality",
        "Security → Counter check-in/out + ตรวจสอบ blocklist",
        "ระบบต้องมี Admin อย่างน้อย 1 คน (ป้องกัน lock-out)",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 7. เวลาทำการ (Business Hours)
// ════════════════════════════════════════════════════

const businessHoursFlow: PageFlowData = {
  pageId: "business-hours",
  menuName: "เวลาทำการ",
  menuNameEn: "Business Hours",
  path: "/web/settings/business-hours",
  summary: "กำหนดเวลาเปิด-ปิดระบบ สำหรับวันปกติ วันหยุด และงานพิเศษ — ควบคุม Walk-in/Kiosk/Counter",
  flowcharts: [
    {
      id: "bh-check",
      title: "ตรวจสอบเวลาทำการ (Runtime)",
      titleEn: "Business Hours Check Flow",
      description: "ขั้นตอนที่ระบบตรวจสอบว่าอยู่ในเวลาทำการหรือไม่",
      steps: [
        { id: "s1", label: "มีคำขอเข้าพื้นที่\n(Walk-in / Kiosk)", type: "start" },
        { id: "s2", label: "ตรวจวันนี้เป็นวันหยุด?", type: "decision" },
        { id: "s3", label: "ใช้กฎ Holiday", type: "process" },
        { id: "s4", label: "ตรวจวันนี้เป็นวันพิเศษ?", type: "decision" },
        { id: "s5", label: "ใช้กฎ Special", type: "process" },
        { id: "s6", label: "ใช้กฎ Regular\n(ตามวันในสัปดาห์)", type: "process" },
        { id: "s7", label: "อยู่ในช่วงเวลา?", type: "decision" },
        { id: "s8", label: "อนุญาตเข้าพื้นที่", type: "end" },
        { id: "s9", label: "ปฏิเสธ\n(แจ้งนอกเวลาทำการ)", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3", label: "ใช่" },
        { from: "s2", to: "s4", label: "ไม่" },
        { from: "s4", to: "s5", label: "ใช่" },
        { from: "s4", to: "s6", label: "ไม่" },
        { from: "s3", to: "s7" },
        { from: "s5", to: "s7" },
        { from: "s6", to: "s7" },
        { from: "s7", to: "s8", label: "ใช่" },
        { from: "s7", to: "s9", label: "ไม่" },
      ],
    },
    {
      id: "bh-crud",
      title: "การจัดการกฎเวลา",
      titleEn: "Business Hours Rule Management",
      steps: [
        { id: "c1", label: "เริ่มต้น", type: "start" },
        { id: "c2", label: "เลือกประเภทกฎ\n(ปกติ/วันหยุด/พิเศษ)", type: "decision" },
        { id: "c3", label: "กฎปกติ:\nเลือกวันในสัปดาห์ + เวลา", type: "process" },
        { id: "c4", label: "กฎวันหยุด:\nกำหนดวันที่ + ปิดทำการ", type: "process" },
        { id: "c5", label: "กฎพิเศษ:\nกำหนดช่วงวัน + เวลาพิเศษ", type: "process" },
        { id: "c6", label: "เลือกช่องทางที่เปิด\n(Walk-in/Kiosk/Counter)", type: "process" },
        { id: "c7", label: "Validate", type: "decision" },
        { id: "c8", label: "บันทึก", type: "end" },
      ],
      connections: [
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3", label: "ปกติ" },
        { from: "c2", to: "c4", label: "วันหยุด" },
        { from: "c2", to: "c5", label: "พิเศษ" },
        { from: "c3", to: "c6" },
        { from: "c4", to: "c6" },
        { from: "c5", to: "c6" },
        { from: "c6", to: "c7" },
        { from: "c7", to: "c8", label: "ผ่าน" },
        { from: "c7", to: "c2", label: "ไม่ผ่าน" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อกฎ",
      fieldEn: "Rule Name",
      rules: ["ห้ามว่าง (Required)", "ความยาวไม่เกิน 100 ตัวอักษร"],
    },
    {
      field: "ประเภทกฎ",
      fieldEn: "Rule Type",
      rules: ["ต้องเลือก 1 ประเภท: regular, holiday, special"],
    },
    {
      field: "วันในสัปดาห์ (Regular)",
      fieldEn: "Days of Week",
      rules: [
        "กฎ regular ต้องเลือกวันอย่างน้อย 1 วัน",
        "ค่า: [0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์]",
        "ห้ามมีกฎ regular ซ้ำวันเดียวกัน",
      ],
    },
    {
      field: "เวลาเปิด-ปิด",
      fieldEn: "Open/Close Time",
      rules: [
        "เวลาเปิดต้องน้อยกว่าเวลาปิด",
        "รูปแบบ HH:mm (24 ชม.)",
        "ถ้าเป็น Holiday → เวลาเปิด/ปิด เป็น null (ปิดทั้งวัน)",
      ],
    },
    {
      field: "ช่องทาง (Channels)",
      fieldEn: "Service Channels",
      rules: [
        "ต้องเลือกอย่างน้อย 1 ช่องทางที่เปิดใช้งาน (ยกเว้น Holiday)",
        "ช่องทาง: walkin, kiosk, counter",
      ],
    },
  ],
  businessConditions: [
    {
      title: "ลำดับความสำคัญของกฎ (Priority)",
      titleEn: "Rule Priority Order",
      description: "เมื่อมีหลายกฎตรงวันเดียวกัน ใช้ลำดับ",
      conditions: [
        "1. Holiday (สำคัญสุด) → ถ้าตรงกับวันหยุด ใช้กฎ Holiday",
        "2. Special → ถ้าอยู่ในช่วงวันพิเศษ ใช้กฎ Special",
        "3. Regular → ใช้กฎปกติตามวันในสัปดาห์",
        "ตัวอย่าง: วันจันทร์ ถ้าเป็นวันหยุดนักขัตฤกษ์ → ใช้กฎ Holiday ไม่ใช่กฎจันทร์",
      ],
    },
    {
      title: "ผลกระทบต่อ Kiosk / Counter",
      titleEn: "Impact on Kiosk / Counter",
      description: "เวลาทำการส่งผลต่อการทำงานของ Kiosk และ Counter",
      conditions: [
        "Kiosk: นอกเวลา → แสดงหน้า \"ปิดให้บริการ\"",
        "Counter: นอกเวลา → guard ยัง login ได้ แต่ระบบแจ้งเตือนว่านอกเวลา",
        "LINE Booking: ไม่ได้ถูกจำกัดด้วย Business Hours (จองล่วงหน้าได้)",
        "Walk-in Counter: ถ้าช่อง counter ปิด → guard ต้องยืนยัน override",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 8. บัตรผ่าน / สลิป (Visit Slips)
// ════════════════════════════════════════════════════

const visitSlipsFlow: PageFlowData = {
  pageId: "visit-slips",
  menuName: "แบบฟอร์ม Visit Slip",
  menuNameEn: "Visit Slip Templates",
  path: "/web/settings/visit-slips",
  summary: "จัดการ Visit Slip (Thermal 80mm) — ตั้งค่า Section, อัปโหลดโลโก้/ปรับขนาด, ลงชื่อเจ้าหน้าที่/ประทับตรา, เปิด/ปิด Field, แก้ไข Label, Live Preview, และสลิปพิมพ์จาก Kiosk",
  flowcharts: [
    {
      id: "vs-section-edit",
      title: "การแก้ไข Section & Field บนสลิป",
      titleEn: "Section & Field Configuration Flow",
      description: "ขั้นตอนการปรับแต่ง Visit Slip ผ่าน Logo Upload, Section Editor, Officer Sign + Live Preview",
      steps: [
        { id: "s1", label: "เปิดหน้า Visit Slip Editor", type: "start" },
        { id: "s1a", label: "อัปโหลดโลโก้หน่วยงาน\n(PNG/JPG/SVG/WebP ≤200KB)", type: "subprocess" },
        { id: "s1b", label: "ปรับขนาดโลโก้\n(Slider 20–100px)", type: "process" },
        { id: "s2", label: "แสดง 10 Sections\n(Header, SlipNo, Visitor,\nHost, Time, Extras, WiFi,\nQR, OfficerSign, Footer)", type: "process" },
        { id: "s3", label: "Toggle Section\nเปิด/ปิด", type: "subprocess" },
        { id: "s4", label: "Expand Section\nดู Fields ภายใน", type: "process" },
        { id: "s5", label: "Toggle Field\nเปิด/ปิด", type: "subprocess" },
        { id: "s6", label: "Field editable?", type: "decision" },
        { id: "s7", label: "แก้ไข Label (TH)\nInline Edit", type: "process" },
        { id: "s8", label: "Live Preview อัปเดต\n(Thermal 80mm / 302px)", type: "io" },
        { id: "s9", label: "กดบันทึก", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s1a" },
        { from: "s1a", to: "s1b" },
        { from: "s1b", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s7", label: "ใช่ (editable)" },
        { from: "s6", to: "s8", label: "ไม่ (readonly)" },
        { from: "s7", to: "s8" },
        { from: "s8", to: "s9" },
      ],
    },
    {
      id: "vs-print",
      title: "การพิมพ์สลิปตอน Check-in (Runtime)",
      titleEn: "Slip Print Flow at Check-in",
      description: "Flow เมื่อผู้เยี่ยม Check-in → ระบบสร้างสลิปจาก Template → พิมพ์ Thermal",
      steps: [
        { id: "p1", label: "ผู้เยี่ยม Check-in\n(Kiosk / Counter)", type: "start" },
        { id: "p2", label: "ดึง Visit Purpose\nของนัดหมาย", type: "process" },
        { id: "p3", label: "มี Template ผูก\nกับ Purpose?", type: "decision" },
        { id: "p4", label: "ใช้ Default Template", type: "process" },
        { id: "p5", label: "ใช้ Template ที่ผูก", type: "process" },
        { id: "p6", label: "โหลด Sections\n(เฉพาะ is_enabled=true)", type: "subprocess" },
        { id: "p7", label: "โหลด Fields ในแต่ละ Section\n(เฉพาะ is_enabled=true)", type: "subprocess" },
        { id: "p8", label: "แทนที่ข้อมูลจริง\n(ชื่อ, เวลา, WiFi, QR...)", type: "process" },
        { id: "p9", label: "Render สลิป\n(302px Thermal)", type: "io" },
        { id: "p10", label: "พิมพ์ Thermal Printer", type: "end" },
      ],
      connections: [
        { from: "p1", to: "p2" },
        { from: "p2", to: "p3" },
        { from: "p3", to: "p4", label: "ไม่มี" },
        { from: "p3", to: "p5", label: "มี" },
        { from: "p4", to: "p6" },
        { from: "p5", to: "p6" },
        { from: "p6", to: "p7" },
        { from: "p7", to: "p8" },
        { from: "p8", to: "p9" },
        { from: "p9", to: "p10" },
      ],
    },
  ],
  validationRules: [
    {
      field: "Section",
      fieldEn: "Slip Section",
      rules: [
        "ต้องเปิดอย่างน้อย 1 Section",
        "Section ที่ปิด → Field ทั้งหมดใน Section จะไม่แสดง",
        "ลำดับ Section สามารถเรียงใหม่ได้ (Drag & Drop)",
      ],
    },
    {
      field: "Field",
      fieldEn: "Slip Field",
      rules: [
        "เปิด/ปิดแต่ละ Field ได้อิสระ",
        "Field ที่มี is_editable=true สามารถแก้ไข Label (TH) ได้",
        "Field ที่มี is_editable=false เช่น orgLogo, slipNumber, wifiSsid → แก้ Label ไม่ได้",
      ],
    },
    {
      field: "โลโก้หน่วยงาน",
      fieldEn: "Organization Logo",
      rules: [
        "รองรับไฟล์ PNG, JPG, SVG, WebP — แนะนำไม่เกิน 200KB",
        "ปรับขนาดได้ 20–100px ผ่าน Slider (ค่าเริ่มต้น 40px)",
        "ลบโลโก้ที่อัปโหลด → กลับไปใช้โลโก้เริ่มต้นของหน่วยงาน",
        "Live Preview อัปเดตทันทีเมื่ออัปโหลดหรือปรับขนาด",
      ],
    },
    {
      field: "ลงชื่อเจ้าหน้าที่ / ประทับตรา",
      fieldEn: "Officer Signature & Stamp",
      rules: [
        "เปิด/ปิดทั้ง Section ได้ — ปิดแล้วจะไม่แสดงส่วนลงชื่อและประทับตราบนสลิป",
        "แก้ไข Label ลงชื่อ (TH/EN) ได้ เช่น 'ลงชื่อเจ้าหน้าที่' → 'ลงชื่อผู้อนุมัติ'",
        "แก้ไข Label ประทับตรา ได้ เช่น 'ประทับตรา / Stamp' → 'ตราประจำตำแหน่ง'",
        "แก้ไขข้อความใต้ตรา ได้ เช่น 'ประทับตราหน่วยงาน' → 'ตราหน่วยงาน'",
        "เส้นลงชื่อ (Signature Line) เปิด/ปิดได้แต่แก้ไขข้อความไม่ได้",
      ],
    },
    {
      field: "WiFi Section",
      fieldEn: "WiFi Info",
      rules: [
        "SSID, Password, Valid Until จะถูกดึงจาก WiFi Config ของระบบ",
        "ปิด WiFi Section → ไม่แสดงข้อมูล WiFi บนสลิป",
      ],
    },
    {
      field: "QR Code Section",
      fieldEn: "Checkout QR Code",
      rules: [
        "QR Code ใช้สำหรับ Self Check-out",
        "ข้อมูลใน QR = Slip Number (eVMS-YYYYMMDD-XXXX)",
        "Label ใต้ QR แก้ไขได้ผ่าน qrLabel field",
      ],
    },
  ],
  businessConditions: [
    {
      title: "ขนาดกระดาษ Thermal 80mm",
      titleEn: "Thermal 80mm Paper Size",
      description: "สลิปพิมพ์บนกระดาษ Thermal ความกว้าง 80mm (302px)",
      conditions: [
        "ความกว้างคงที่ 302px — ความยาวขึ้นอยู่กับจำนวน Section/Field ที่เปิด",
        "Live Preview แสดงที่ 90% ของขนาดจริง",
        "รองรับ Thermal Printer มาตรฐาน (Epson TM-T82, Star TSP100 ฯลฯ)",
      ],
    },
    {
      title: "การพิมพ์สลิป",
      titleEn: "Printing Behavior",
      description: "พฤติกรรมเมื่อพิมพ์ Visit Slip",
      conditions: [
        "Kiosk → แสดง Preview บนหน้าจอ + พิมพ์อัตโนมัติ (ถ้ามี Printer)",
        "Counter → Guard กดพิมพ์เอง + เลือก Printer ได้",
        "LINE → แสดง Digital Badge บนแชท (ไม่พิมพ์กระดาษ)",
        "Slip Number format: eVMS-YYYYMMDD-XXXX (running number ต่อวัน)",
      ],
    },
    {
      title: "Section \"ข้อมูลเพิ่มเติม\" (Extras)",
      titleEn: "Additional Info Section",
      description: "Section ที่ปิดเป็นค่าเริ่มต้น — เปิดเมื่อต้องการข้อมูลพิเศษ",
      conditions: [
        "ผู้ติดตาม (Companions) — แสดงจำนวนคนที่มาพร้อมกัน",
        "ทะเบียนรถ (Vehicle Plate) — สำหรับผู้เยี่ยมที่ขับรถมา",
        "ปิดเป็นค่าเริ่มต้น เพราะไม่จำเป็นสำหรับผู้เยี่ยมทั่วไป",
      ],
    },
    {
      title: "โลโก้หน่วยงาน (Organization Logo)",
      titleEn: "Organization Logo Upload & Sizing",
      description: "อัปโหลดและปรับขนาดโลโก้ที่แสดงบน Header ของ Visit Slip",
      conditions: [
        "อัปโหลดได้ PNG, JPG, SVG, WebP — แนะนำไม่เกิน 200KB เพื่อความเร็วในการพิมพ์",
        "ปรับขนาด 20–100px ผ่าน Slider — ค่าเริ่มต้น 40px",
        "เก็บไฟล์ใน /uploads/ → บันทึก path ลง visit_slip_templates.logo_url",
        "ลบโลโก้ → set logo_url = null → fallback เป็นโลโก้เริ่มต้น (/images/mot_logo_slip.png)",
        "Live Preview อัปเดตทันทีเมื่อเปลี่ยนรูปหรือขนาด",
      ],
    },
    {
      title: "ลงชื่อเจ้าหน้าที่ / ประทับตรา (Officer Signature & Stamp)",
      titleEn: "Officer Signature & Stamp Section",
      description: "ส่วนลงชื่อเจ้าหน้าที่ผู้รับผิดชอบและประทับตราหน่วยงาน — อยู่ระหว่าง QR Code กับ Footer",
      conditions: [
        "แบ่งเป็น 2 คอลัมน์: ซ้าย = เส้นลงชื่อ + ชื่อเจ้าหน้าที่ / ขวา = ช่องประทับตรา",
        "เปิดเป็นค่าเริ่มต้น — ปิดได้ถ้าหน่วยงานไม่ต้องการ",
        "Label ทั้ง 4 fields แก้ไขได้ (ยกเว้น Signature Line)",
        "ตอน Runtime (พิมพ์จริง) — เส้นลงชื่อเป็นช่องว่างให้เจ้าหน้าที่เซ็นด้วยมือ",
        "ตอน Runtime — ช่องประทับตราเป็นพื้นที่ว่างให้ประทับตรายาง",
        "Counter App → เจ้าหน้าที่เซ็นชื่อ + ประทับตราก่อนมอบสลิปให้ผู้เยี่ยม",
        "Kiosk → พิมพ์ช่องว่างไว้ — เจ้าหน้าที่ที่ผู้เยี่ยมไปพบเซ็น + ประทับตราภายหลัง",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 9. กลุ่มผู้อนุมัติ (Approver Groups)
// ════════════════════════════════════════════════════

const approverGroupsFlow: PageFlowData = {
  pageId: "approver-groups",
  menuName: "กลุ่มผู้อนุมัติ",
  menuNameEn: "Approver Groups",
  path: "/web/settings/approver-groups",
  summary: "กำหนดกลุ่มผู้อนุมัติ สมาชิก ช่องทางแจ้งเตือน และผูกกับวัตถุประสงค์/แผนก",
  flowcharts: [
    {
      id: "ag-approval",
      title: "ขั้นตอนการอนุมัติคำขอ",
      titleEn: "Approval Request Flow",
      description: "Flow เมื่อมีคำขอเข้าพื้นที่ที่ต้องอนุมัต",
      steps: [
        { id: "a1", label: "คำขอเข้าพื้นที่ใหม่\n(สถานะ: Pending)", type: "start" },
        { id: "a2", label: "ดึง Department Rules\nจาก Visit Purpose", type: "process" },
        { id: "a3", label: "ต้อง Approve?", type: "decision" },
        { id: "a4", label: "อนุมัติอัตโนมัติ\n(Auto-approve)", type: "process" },
        { id: "a5", label: "ดึง Approver Group\nของแผนกนั้น", type: "process" },
        { id: "a6", label: "แจ้งเตือนสมาชิก\n(LINE/Email/Web)", type: "io" },
        { id: "a7", label: "รอผู้อนุมัติตอบ", type: "process" },
        { id: "a8", label: "ผลการอนุมัติ?", type: "decision" },
        { id: "a9", label: "อนุมัติ ✓\n(สถานะ: Approved)", type: "end" },
        { id: "a10", label: "ปฏิเสธ ✗\n(สถานะ: Rejected)", type: "end" },
      ],
      connections: [
        { from: "a1", to: "a2" },
        { from: "a2", to: "a3" },
        { from: "a3", to: "a4", label: "ไม่ต้อง" },
        { from: "a3", to: "a5", label: "ต้อง" },
        { from: "a4", to: "a9" },
        { from: "a5", to: "a6" },
        { from: "a6", to: "a7" },
        { from: "a7", to: "a8" },
        { from: "a8", to: "a9", label: "อนุมัติ" },
        { from: "a8", to: "a10", label: "ปฏิเสธ" },
      ],
    },
    {
      id: "ag-crud",
      title: "การจัดการกลุ่มผู้อนุมัติ",
      titleEn: "Approver Group CRUD",
      steps: [
        { id: "g1", label: "เริ่มต้น", type: "start" },
        { id: "g2", label: "สร้างกลุ่มใหม่\n(ชื่อ TH/EN)", type: "process" },
        { id: "g3", label: "เลือกแผนก\n(Department)", type: "process" },
        { id: "g4", label: "เพิ่มสมาชิก\n(จาก Staff)", type: "subprocess" },
        { id: "g5", label: "เลือกช่องทางแจ้งเตือน\n(LINE/Email/Web)", type: "process" },
        { id: "g6", label: "Validate", type: "decision" },
        { id: "g7", label: "บันทึก", type: "end" },
      ],
      connections: [
        { from: "g1", to: "g2" },
        { from: "g2", to: "g3" },
        { from: "g3", to: "g4" },
        { from: "g4", to: "g5" },
        { from: "g5", to: "g6" },
        { from: "g6", to: "g7", label: "ผ่าน" },
        { from: "g6", to: "g2", label: "ไม่ผ่าน" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อกลุ่ม (TH)",
      fieldEn: "Group Name (TH)",
      rules: ["ห้ามว่าง (Required)", "ห้ามซ้ำ (Unique)", "ความยาวไม่เกิน 100 ตัวอักษร"],
    },
    {
      field: "แผนก",
      fieldEn: "Department",
      rules: ["ต้องเลือก 1 แผนก", "แผนกต้อง active"],
    },
    {
      field: "สมาชิก (Members)",
      fieldEn: "Members",
      rules: [
        "ต้องมีอย่างน้อย 1 คน",
        "สมาชิกต้องเป็น Staff ที่ active",
        "สมาชิกควรอยู่ในแผนกเดียวกัน (แนะนำ ไม่บังคับ)",
        "1 คนเป็นสมาชิกได้หลายกลุ่ม",
      ],
    },
    {
      field: "ช่องทางแจ้งเตือน",
      fieldEn: "Notification Channels",
      rules: [
        "ต้องเลือกอย่างน้อย 1 ช่องทาง",
        "LINE → ต้องมี lineUserId ใน Staff",
        "Email → ต้องมี Email ใน Staff",
        "Web App → แจ้งเตือนใน Officer Dashboard",
      ],
    },
  ],
  businessConditions: [
    {
      title: "กลุ่มที่ไม่มีสมาชิก Active",
      titleEn: "Group with No Active Members",
      description: "เกิดอะไรถ้ากลุ่มไม่มีสมาชิกที่ active",
      conditions: [
        "ถ้าสมาชิกทุกคน inactive → คำขอจะค้าง Pending ไม่มีใครอนุมัติ",
        "ระบบควรแจ้งเตือน Admin เมื่อมีกลุ่มที่ไม่มีสมาชิก active",
        "แนะนำ: ทุกกลุ่มควรมีสมาชิก active อย่างน้อย 2 คน (ป้องกันกรณีคน 1 ลา)",
      ],
    },
    {
      title: "ความสัมพันธ์กับ Visit Purpose",
      titleEn: "Relation with Visit Purposes",
      description: "กลุ่มผู้อนุมัติถูกอ้างอิงจาก Visit Purpose Rules",
      conditions: [
        "Visit Purpose Rule → require_approval = true → ต้องระบุ Approver Group",
        "ถ้าลบกลุ่ม → ต้องอัปเดต Visit Purpose Rules ที่อ้างอิง",
        "1 กลุ่มรับได้หลาย Purpose/Department",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 10. โซนเข้าพื้นที่ (Access Zones)
// ════════════════════════════════════════════════════

const accessZonesFlow: PageFlowData = {
  pageId: "access-zones",
  menuName: "โซนเข้าพื้นที่",
  menuNameEn: "Access Zones (Hikvision)",
  path: "/web/settings/access-zones",
  summary: "จัดการโซนเข้าพื้นที่ กลุ่มสิทธิ์ QR Code และ Integration กับ Hikvision Door Controller",
  flowcharts: [
    {
      id: "az-checkin",
      title: "Flow การเข้าพื้นที่ผ่านประตู",
      titleEn: "Door Access Check-in Flow",
      description: "ขั้นตอนเมื่อผู้เยี่ยมชมสแกน QR ที่ประตู",
      steps: [
        { id: "z1", label: "ผู้เยี่ยมชมสแกน QR\nที่ Hikvision Reader", type: "start" },
        { id: "z2", label: "ระบบรับรหัส QR\nจาก Reader", type: "io" },
        { id: "z3", label: "ตรวจสอบนัดหมาย\n(Appointment)", type: "process" },
        { id: "z4", label: "นัดหมาย Valid?", type: "decision" },
        { id: "z5", label: "ตรวจสถานะ\n(Approved/Checked-in)", type: "decision" },
        { id: "z6", label: "ตรวจ Access Group\nมีสิทธิ์โซนนี้?", type: "decision" },
        { id: "z7", label: "ตรวจเวลา\nอยู่ในกำหนด?", type: "decision" },
        { id: "z8", label: "เปิดประตู ✓", type: "end" },
        { id: "z9", label: "ปฏิเสธ ✗\n(ล็อค + แจ้งเตือน)", type: "end" },
      ],
      connections: [
        { from: "z1", to: "z2" },
        { from: "z2", to: "z3" },
        { from: "z3", to: "z4" },
        { from: "z4", to: "z5", label: "Valid" },
        { from: "z4", to: "z9", label: "Invalid" },
        { from: "z5", to: "z6", label: "OK" },
        { from: "z5", to: "z9", label: "ไม่ได้รับอนุมัติ" },
        { from: "z6", to: "z7", label: "มีสิทธิ์" },
        { from: "z6", to: "z9", label: "ไม่มีสิทธิ์" },
        { from: "z7", to: "z8", label: "อยู่ในเวลา" },
        { from: "z7", to: "z9", label: "เลยเวลา" },
      ],
    },
    {
      id: "az-setup",
      title: "การตั้งค่า Access Zone & Group",
      titleEn: "Access Zone & Group Setup",
      steps: [
        { id: "a1", label: "เริ่มต้น", type: "start" },
        { id: "a2", label: "สร้าง Access Zone\n(ชื่อ, ชั้น, ประเภท)", type: "process" },
        { id: "a3", label: "ผูก Hikvision Door ID", type: "process" },
        { id: "a4", label: "สร้าง Access Group\n(กลุ่มสิทธิ์)", type: "process" },
        { id: "a5", label: "เพิ่ม Zone เข้า Group", type: "subprocess" },
        { id: "a6", label: "ตั้งเวลาเข้า\n(Schedule)", type: "process" },
        { id: "a7", label: "ผูก Department\nเข้ากับ Access Group", type: "subprocess" },
        { id: "a8", label: "Validate", type: "decision" },
        { id: "a9", label: "บันทึก", type: "end" },
      ],
      connections: [
        { from: "a1", to: "a2" },
        { from: "a2", to: "a3" },
        { from: "a3", to: "a4" },
        { from: "a4", to: "a5" },
        { from: "a5", to: "a6" },
        { from: "a6", to: "a7" },
        { from: "a7", to: "a8" },
        { from: "a8", to: "a9", label: "ผ่าน" },
        { from: "a8", to: "a2", label: "ไม่ผ่าน" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อ Zone",
      fieldEn: "Zone Name",
      rules: ["ห้ามว่าง (Required)", "ห้ามซ้ำ (Unique)", "ความยาวไม่เกิน 100 ตัวอักษร"],
    },
    {
      field: "ประเภท Zone",
      fieldEn: "Zone Type",
      rules: [
        "ต้องเลือก 1 ประเภท",
        "ค่าที่รองรับ: main_entrance, floor_entrance, restricted_area, parking, elevator",
      ],
    },
    {
      field: "Hikvision Door ID",
      fieldEn: "Hikvision Door ID",
      rules: [
        "ห้ามว่างถ้า Zone active (Required for active zones)",
        "ต้องเป็นค่า Unique",
        "รูปแบบ: ตัวอักษร/ตัวเลข (จาก Hikvision iVMS)",
      ],
    },
    {
      field: "ชื่อ Access Group",
      fieldEn: "Access Group Name",
      rules: ["ห้ามว่าง (Required)", "ห้ามซ้ำ (Unique)"],
    },
    {
      field: "Zone ใน Access Group",
      fieldEn: "Zones in Access Group",
      rules: ["ต้องมีอย่างน้อย 1 Zone", "Zone ต้อง active"],
    },
    {
      field: "Department Mapping",
      fieldEn: "Department Access Mapping",
      rules: [
        "1 Department ผูกได้หลาย Access Group",
        "1 Access Group ผูกได้หลาย Department",
        "Department ต้อง active",
      ],
    },
  ],
  businessConditions: [
    {
      title: "การเปิด/ปิด Zone",
      titleEn: "Enable/Disable Zone",
      description: "ผลกระทบเมื่อปิด Zone",
      conditions: [
        "Zone ที่ inactive → ประตูจะไม่เปิดให้ผู้เยี่ยมชม",
        "Zone ที่ inactive → ถูกลบออกจาก Access Group อัตโนมัติ",
        "ถ้า Access Group ไม่มี Zone เหลือ → Group จะถูก mark เป็น empty",
        "Log การเข้าถึงยังคงเก็บแม้ Zone inactive",
      ],
    },
    {
      title: "Hikvision Integration",
      titleEn: "Hikvision Door Controller",
      description: "การเชื่อมต่อกับระบบควบคุมประตู Hikvision",
      conditions: [
        "ใช้ Hikvision iVMS-4200 API สำหรับ push QR code",
        "เมื่อ Visitor check-in → ระบบส่ง QR ไปยัง Hikvision Controller",
        "เมื่อ Visitor check-out หรือ expired → ระบบลบ QR ออก",
        "ถ้า Hikvision offline → ระบบ queue คำสั่งไว้ส่งทีหลัง",
        "Emergency → สามารถสั่งเปิดประตูทุกบานจาก Web Admin",
      ],
    },
    {
      title: "QR Code สิทธิ์เข้าพื้นที่",
      titleEn: "Access QR Code Rules",
      description: "กฎการใช้ QR Code เข้าพื้นที่",
      conditions: [
        "QR Code ถูกสร้างเมื่อนัดหมาย Approved / Check-in",
        "QR มีอายุถึงเวลา check-out ที่กำหนด",
        "QR ใช้ได้เฉพาะ Zone ที่อยู่ใน Access Group ของแผนกที่ไป",
        "1 นัดหมาย = 1 QR Code (ใช้ซ้ำเข้าออกได้จนหมดอายุ)",
        "QR ถูก revoke ทันทีเมื่อ check-out หรือ blocklist",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 11. PDPA / นโยบายคุ้มครองข้อมูลส่วนบุคคล
// ════════════════════════════════════════════════════

const pdpaConsentFlow: PageFlowData = {
  pageId: "pdpa-consent",
  menuName: "PDPA / นโยบายคุ้มครองข้อมูล",
  menuNameEn: "PDPA Consent Settings",
  path: "/web/settings/pdpa-consent",
  summary: "จัดการข้อความ PDPA 2 ภาษา — สร้างใหม่/แก้ไขนโยบาย, เลือกช่องทางแสดง (Kiosk/LINE OA), ตั้งค่า retention, และบันทึก consent ของผู้เยี่ยม",
  flowcharts: [
    {
      id: "pdpa-create-new",
      title: "การสร้างรายการ PDPA ใหม่",
      titleEn: "Create New PDPA Item Flow",
      description: "ขั้นตอนเมื่อ Admin สร้างรายการ PDPA ใหม่ตั้งแต่ต้น",
      steps: [
        { id: "n1", label: "กดปุ่ม \"สร้างรายการใหม่\"\n(หน้ารายการเวอร์ชัน)", type: "start" },
        { id: "n2", label: "เปิด Editor เปล่า\n(ไม่มีข้อมูลเดิม)", type: "process" },
        { id: "n3", label: "เลือกภาษา\n(TH / EN Tab)", type: "process" },
        { id: "n4", label: "กรอกเนื้อหานโยบาย\n(ทั้ง TH และ EN)", type: "process" },
        { id: "n5", label: "เลือกช่องทางแสดง\n(Kiosk / LINE OA)", type: "process" },
        { id: "n6", label: "ตั้งค่า Retention Days\n+ Require Scroll", type: "process" },
        { id: "n7", label: "ใส่หมายเหตุ\nการเปลี่ยนแปลง", type: "process" },
        { id: "n8", label: "กดบันทึก\n\"สร้างรายการใหม่\"", type: "process" },
        { id: "n9", label: "สร้าง Version ใหม่\n(pdpa_consent_versions)\n+ display_channels", type: "subprocess" },
        { id: "n10", label: "กลับหน้ารายการ\n(สถานะ: ไม่ได้ใช้งาน)", type: "end" },
      ],
      connections: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" },
        { from: "n5", to: "n6" },
        { from: "n6", to: "n7" },
        { from: "n7", to: "n8" },
        { from: "n8", to: "n9" },
        { from: "n9", to: "n10" },
      ],
    },
    {
      id: "pdpa-config-edit",
      title: "การแก้ไขนโยบาย PDPA",
      titleEn: "PDPA Config Edit Flow",
      description: "ขั้นตอนเมื่อ Admin แก้ไขข้อความ PDPA จากเวอร์ชันที่มีอยู่",
      steps: [
        { id: "c1", label: "เปิดหน้า PDPA Settings", type: "start" },
        { id: "c2", label: "เลือกเวอร์ชัน\nกดปุ่ม \"แก้ไข\"", type: "process" },
        { id: "c3", label: "แก้ไขเนื้อหานโยบาย\n(TH / EN Tab)", type: "process" },
        { id: "c4", label: "เลือกช่องทางแสดง\n(Kiosk / LINE OA)", type: "process" },
        { id: "c5", label: "ตั้งค่า Retention Days\n+ Require Scroll", type: "process" },
        { id: "c6", label: "ดู Preview บน Kiosk?", type: "decision" },
        { id: "c7", label: "แสดง Preview\n(จำลอง Kiosk UI)", type: "io" },
        { id: "c8", label: "กดบันทึก\n\"บันทึกเวอร์ชันใหม่\"", type: "process" },
        { id: "c9", label: "สร้าง Version ใหม่\n(pdpa_consent_versions)\n+ display_channels", type: "subprocess" },
        { id: "c10", label: "อัปเดต Config\n(version++)", type: "end" },
      ],
      connections: [
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
        { from: "c3", to: "c4" },
        { from: "c4", to: "c5" },
        { from: "c5", to: "c6" },
        { from: "c6", to: "c7", label: "ดู" },
        { from: "c6", to: "c8", label: "ไม่ดู" },
        { from: "c7", to: "c8" },
        { from: "c8", to: "c9" },
        { from: "c9", to: "c10" },
      ],
    },
    {
      id: "pdpa-kiosk-consent",
      title: "การแสดง PDPA บน Kiosk/LINE OA (Runtime)",
      titleEn: "PDPA Consent Capture on Kiosk/LINE OA",
      description: "Flow เมื่อผู้เยี่ยมเห็น PDPA บน Kiosk หรือ LINE OA และยอมรับ — ระบบตรวจ display_channels ก่อนแสดง",
      steps: [
        { id: "k1", label: "ผู้เยี่ยมถึงขั้นตอน PDPA\n(Kiosk / LINE OA)", type: "start" },
        { id: "k2", label: "ดึง Config ล่าสุด\n(pdpa_consent_configs)", type: "process" },
        { id: "k2b", label: "ตรวจ display_channels\nมีช่องทางนี้หรือไม่?", type: "decision" },
        { id: "k2c", label: "ข้ามขั้นตอน PDPA\n(ไม่แสดง)", type: "end" },
        { id: "k3", label: "แสดงข้อความนโยบาย\n(ตามภาษาที่เลือก)", type: "io" },
        { id: "k4", label: "Require Scroll?", type: "decision" },
        { id: "k5", label: "รอเลื่อนอ่านจนจบ\n(Checkbox ถูกล็อก)", type: "process" },
        { id: "k6", label: "Checkbox เปิดให้กด", type: "process" },
        { id: "k7", label: "ผู้เยี่ยมกด✓ ยอมรับ", type: "process" },
        { id: "k8", label: "กดปุ่ม\n\"ยอมรับและดำเนินการต่อ\"", type: "process" },
        { id: "k9", label: "บันทึก Consent Log\n(pdpa_consent_logs)\n+ consent_channel", type: "subprocess" },
        { id: "k10", label: "คำนวณ expires_at\n(+retention_days)", type: "process" },
        { id: "k11", label: "ดำเนินการต่อ\n(ขั้นตอนถัดไป)", type: "end" },
      ],
      connections: [
        { from: "k1", to: "k2" },
        { from: "k2", to: "k2b" },
        { from: "k2b", to: "k2c", label: "ไม่มี (ช่องทางนี้ไม่อยู่ใน display_channels)" },
        { from: "k2b", to: "k3", label: "มี (ช่องทางอยู่ใน display_channels)" },
        { from: "k3", to: "k4" },
        { from: "k4", to: "k5", label: "ใช่ (require_scroll=true)" },
        { from: "k4", to: "k6", label: "ไม่ (require_scroll=false)" },
        { from: "k5", to: "k6" },
        { from: "k6", to: "k7" },
        { from: "k7", to: "k8" },
        { from: "k8", to: "k9" },
        { from: "k9", to: "k10" },
        { from: "k10", to: "k11" },
      ],
    },
  ],
  validationRules: [
    {
      field: "เนื้อหา PDPA (TH)",
      fieldEn: "PDPA Text (TH)",
      rules: ["ห้ามว่าง (Required)", "ต้องมีเนื้อหาอย่างน้อย 100 ตัวอักษร", "รองรับ Unicode / ภาษาไทย"],
    },
    {
      field: "เนื้อหา PDPA (EN)",
      fieldEn: "PDPA Text (EN)",
      rules: ["ห้ามว่าง (Required)", "ต้องมีเนื้อหาอย่างน้อย 100 ตัวอักษร", "ใช้แสดงเมื่อผู้เยี่ยมเลือกภาษาอังกฤษ"],
    },
    {
      field: "ระยะเวลาเก็บข้อมูล",
      fieldEn: "Retention Days",
      rules: ["ต้องเป็นจำนวนเต็มบวก", "ค่าต่ำสุด 1 วัน / ค่าสูงสุด 365 วัน", "ค่าเริ่มต้น 90 วัน"],
    },
    {
      field: "Require Scroll",
      fieldEn: "Require Scroll Before Accept",
      rules: ["Boolean toggle", "เปิด = ผู้เยี่ยมต้องเลื่อนอ่านข้อความจนจบ ก่อน checkbox จะเปิดให้กด", "ค่าเริ่มต้น = เปิด (true)"],
    },
    {
      field: "ช่องทางแสดง (Display Channels)",
      fieldEn: "Display Channels",
      rules: [
        "ต้องเลือกอย่างน้อย 1 ช่องทาง",
        "ค่าที่เลือกได้: kiosk, line",
        "ค่าเริ่มต้น: [\"kiosk\", \"line\"] (แสดงทุกช่องทาง)",
        "Kiosk และ LINE OA อาจแสดง consent ต่างเวอร์ชันกันได้",
        "เก็บเป็น JSON Array ใน DB",
      ],
    },
  ],
  businessConditions: [
    {
      title: "Version Control",
      titleEn: "PDPA Version History",
      description: "ทุกครั้งที่สร้างใหม่หรือแก้ไขข้อความ PDPA จะสร้าง Version ใหม่อัตโนมัติ",
      conditions: [
        "เวอร์ชันปัจจุบัน → pdpa_consent_configs.version",
        "ประวัติทุกเวอร์ชัน → pdpa_consent_versions (audit trail)",
        "Consent Log อ้างอิงเวอร์ชันที่ผู้เยี่ยมยินยอม ณ ขณะนั้น",
        "หากข้อความเปลี่ยน → ผู้เยี่ยมใหม่จะเห็นเวอร์ชันล่าสุดเสมอ",
        "สามารถสร้างรายการ PDPA ใหม่ตั้งแต่ต้น หรือแก้ไขจากเวอร์ชันเดิม",
      ],
    },
    {
      title: "Display Channels (ช่องทางแสดง)",
      titleEn: "Channel-specific PDPA Display",
      description: "แต่ละเวอร์ชัน PDPA สามารถกำหนดให้แสดงเฉพาะ Kiosk หรือ LINE OA หรือทั้งคู่",
      conditions: [
        "display_channels เก็บเป็น JSON Array เช่น [\"kiosk\"], [\"line\"], [\"kiosk\",\"line\"]",
        "Runtime: Kiosk/LINE OA ตรวจ display_channels ก่อนแสดง consent",
        "ถ้าช่องทางไม่อยู่ใน display_channels → ข้ามขั้นตอน PDPA (ไม่แสดง)",
        "ใช้กรณี: consent Kiosk กับ LINE OA ต้องแสดงข้อความต่างกัน",
        "Admin เลือกช่องทางได้ตอนสร้างใหม่หรือแก้ไข",
      ],
    },
    {
      title: "Retention & Auto-delete",
      titleEn: "Data Retention Policy",
      description: "ข้อมูลผู้เยี่ยมจะถูกลบอัตโนมัติเมื่อครบกำหนด",
      conditions: [
        "เมื่อ consent → คำนวณ expires_at = consented_at + retention_days",
        "Batch job ทำงานรายวัน → ลบข้อมูลที่ expires_at < NOW()",
        "ค่าเริ่มต้น 90 วัน — เปลี่ยนได้จากหน้าตั้งค่า",
        "ข้อมูลที่ลบ: ภาพถ่าย, สำเนาบัตร, ข้อมูลส่วนบุคคล",
      ],
    },
    {
      title: "Kiosk / LINE OA Display",
      titleEn: "Kiosk & LINE OA PDPA Display Behavior",
      description: "พฤติกรรมการแสดง PDPA บนหน้าจอ Kiosk และ LINE OA",
      conditions: [
        "ตรวจ display_channels ว่าช่องทางปัจจุบันอยู่ในรายการหรือไม่",
        "แสดงข้อความตามภาษาที่ผู้เยี่ยมเลือก (TH/EN)",
        "ถ้า require_scroll=true → Checkbox จะ disabled จนกว่าจะเลื่อนอ่านจนจบ",
        "ปุ่ม 'ยอมรับและดำเนินการต่อ' → disabled จนกว่า Checkbox จะถูกเลือก",
        "สี Checkbox & ปุ่ม ใช้ Accent Gold (#C8A84E) ตาม Design System",
      ],
    },
    {
      title: "คืนค่าเริ่มต้น",
      titleEn: "Reset to Default",
      description: "ปุ่มคืนค่า PDPA เป็นข้อความเริ่มต้นของระบบ",
      conditions: [
        "คืนข้อความ TH/EN เป็นค่า default ของระบบ",
        "คืน retention_days เป็น 90 วัน",
        "คืน display_channels เป็น [\"kiosk\", \"line\"]",
        "ไม่สร้าง version ใหม่จนกว่าจะกดบันทึก",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 12. การนัดหมาย (Appointments)
// ════════════════════════════════════════════════════

const appointmentsFlow: PageFlowData = {
  pageId: "appointments",
  menuName: "การนัดหมาย",
  menuNameEn: "Appointments",
  path: "/web/appointments",
  summary:
    "จัดการนัดหมายผู้มาติดต่อ — สร้างนัดหมาย, อนุมัติ/ปฏิเสธ, ติดตามสถานะ, จัดการ WiFi และผู้ติดตาม",
  flowcharts: [
    {
      id: "appointment-create",
      title: "สร้างนัดหมายใหม่ (Admin)",
      titleEn: "Create New Appointment (Admin)",
      description: "ขั้นตอนการสร้างนัดหมายใหม่โดย Admin",
      steps: [
        { id: "ac1", label: "เปิดหน้านัดหมาย", type: "start" },
        { id: "ac2", label: "กดสร้างใหม่", type: "process" },
        { id: "ac3", label: "เลือกผู้มาติดต่อ", type: "process" },
        { id: "ac4", label: "ตรวจ Blocklist?", type: "decision" },
        { id: "ac5", label: "แจ้งเตือนและหยุด\n(ผู้มาติดต่ออยู่ใน Blocklist)", type: "end" },
        {
          id: "ac6",
          label: "กรอกข้อมูล\n(วัน/เวลา/สถานที่/ประเภท)",
          type: "process",
        },
        { id: "ac7", label: "เลือก Entry Mode\n(single/period)", type: "process" },
        { id: "ac8", label: "เพิ่มผู้ติดตาม?", type: "decision" },
        { id: "ac8b", label: "เพิ่มผู้ติดตาม (0-10 คน)", type: "process" },
        { id: "ac9", label: "เสนอ WiFi?", type: "decision" },
        { id: "ac9b", label: "ตั้งค่า WiFi credentials", type: "process" },
        { id: "ac10", label: "บันทึก", type: "process" },
        { id: "ac11", label: "ส่ง Notification\nให้ผู้อนุมัติ", type: "io" },
        { id: "ac12", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "ac1", to: "ac2" },
        { from: "ac2", to: "ac3" },
        { from: "ac3", to: "ac4" },
        { from: "ac4", to: "ac5", label: "อยู่ใน Blocklist", condition: "blocked" },
        { from: "ac4", to: "ac6", label: "ไม่อยู่ใน Blocklist", condition: "clear" },
        { from: "ac6", to: "ac7" },
        { from: "ac7", to: "ac8" },
        { from: "ac8", to: "ac8b", label: "ใช่", condition: "yes" },
        { from: "ac8", to: "ac9", label: "ไม่", condition: "no" },
        { from: "ac8b", to: "ac9" },
        { from: "ac9", to: "ac9b", label: "ใช่", condition: "yes" },
        { from: "ac9", to: "ac10", label: "ไม่", condition: "no" },
        { from: "ac9b", to: "ac10" },
        { from: "ac10", to: "ac11" },
        { from: "ac11", to: "ac12" },
      ],
    },
    {
      id: "appointment-approve",
      title: "อนุมัติ/ปฏิเสธนัดหมาย",
      titleEn: "Approve / Reject Appointment",
      description: "ขั้นตอนการอนุมัติหรือปฏิเสธนัดหมาย",
      steps: [
        { id: "aa1", label: "เจ้าหน้าที่เปิดรายการ pending", type: "start" },
        { id: "aa2", label: "ดูรายละเอียด", type: "process" },
        { id: "aa3", label: "ตัดสินใจ?", type: "decision" },
        {
          id: "aa4",
          label: "อัปเดต status=approved\nส่ง notification ให้ผู้จอง",
          type: "process",
        },
        {
          id: "aa5",
          label: "ใส่เหตุผล\nอัปเดต status=rejected\nส่ง notification",
          type: "process",
        },
        { id: "aa6", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "aa1", to: "aa2" },
        { from: "aa2", to: "aa3" },
        { from: "aa3", to: "aa4", label: "อนุมัติ", condition: "approve" },
        { from: "aa3", to: "aa5", label: "ปฏิเสธ", condition: "reject" },
        { from: "aa4", to: "aa6" },
        { from: "aa5", to: "aa6" },
      ],
    },
    {
      id: "appointment-checkin-checkout",
      title: "Check-in / Check-out",
      titleEn: "Visitor Check-in / Check-out",
      description: "ขั้นตอนการ Check-in และ Check-out ผู้มาติดต่อ",
      steps: [
        { id: "aco1", label: "ผู้มาถึง", type: "start" },
        { id: "aco2", label: "ตรวจสอบ QR/บัตร", type: "process" },
        { id: "aco3", label: "ตรวจ Blocklist?", type: "decision" },
        { id: "aco3b", label: "ปฏิเสธเข้าพื้นที่", type: "end" },
        {
          id: "aco4",
          label: "อัปเดต status=checked-in\nบันทึก checkin_at",
          type: "process",
        },
        { id: "aco5", label: "ถึงเวลาออก", type: "process" },
        { id: "aco6", label: "กด Check-out", type: "process" },
        {
          id: "aco7",
          label: "อัปเดต status=checked-out\nบันทึก checkout_at",
          type: "process",
        },
        { id: "aco8", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "aco1", to: "aco2" },
        { from: "aco2", to: "aco3" },
        { from: "aco3", to: "aco3b", label: "อยู่ใน Blocklist", condition: "blocked" },
        { from: "aco3", to: "aco4", label: "ผ่าน", condition: "clear" },
        { from: "aco4", to: "aco5" },
        { from: "aco5", to: "aco6" },
        { from: "aco6", to: "aco7" },
        { from: "aco7", to: "aco8" },
      ],
    },
  ],
  validationRules: [
    {
      field: "วันที่นัดหมาย",
      fieldEn: "Appointment Date",
      rules: ["ต้องเป็นวันปัจจุบันหรืออนาคต", "ห้ามเป็นวันที่ผ่านมาแล้ว"],
    },
    {
      field: "เวลาเริ่มต้น",
      fieldEn: "Start Time",
      rules: ["ต้องอยู่ในเวลาทำการ", "ต้องก่อนเวลาสิ้นสุด"],
    },
    {
      field: "ผู้มาติดต่อ",
      fieldEn: "Visitor",
      rules: ["ห้ามว่าง (Required)", "ต้องไม่อยู่ใน Blocklist"],
    },
    {
      field: "ผู้ติดตาม",
      fieldEn: "Companions",
      rules: ["0-10 คน", "ไม่บังคับ"],
    },
    {
      field: "Entry Mode (period)",
      fieldEn: "Entry Mode Period",
      rules: ["date_end ต้อง > date", "ใช้เมื่อ entry_mode=period"],
    },
  ],
  businessConditions: [
    {
      title: "Blocklist Check (ตรวจด้วยชื่อ+นามสกุล)",
      titleEn: "Name-based Blocklist Verification",
      description: "ตรวจสอบ Blocklist ด้วยชื่อ+นามสกุล (ไม่ใช้เลขบัตร) ก่อนสร้างนัดหมายและก่อน check-in ทุกช่องทาง",
      conditions: [
        "ตรวจด้วย first_name + last_name (partial match, case-insensitive) — ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID",
        "Kiosk: ตรวจเมื่อสแกน QR/walk-in → ปฏิเสธถ้าพบ",
        "Counter: ตรวจเมื่อเจ้าหน้าที่ค้นหาผู้มาติดต่อ → แจ้งเตือน",
        "LINE OA: ตรวจเมื่อจองนัดหมาย → ปฏิเสธการจอง",
        "Web (เจ้าหน้าที่): ตรวจเมื่อสร้างนัดหมายให้ → แสดง alert",
        "ผู้ติดตาม (companion) ก็ถูกตรวจทุกคน",
        "ตรวจทั้ง permanent และ temporary (ดู expiry_date ด้วย)",
      ],
    },
    {
      title: "Auto Check-out",
      titleEn: "Automatic Check-out",
      description: "ระบบ auto checkout เมื่อเกินเวลา",
      conditions: [
        "เมื่อเกินเวลานัดหมาย → ระบบ auto checkout",
        "อัปเดต status=checked-out อัตโนมัติ",
      ],
    },
    {
      title: "WiFi",
      titleEn: "WiFi Credential Provisioning",
      description: "สร้าง WiFi credentials เมื่ออนุมัตินัดหมายที่เสนอ WiFi",
      conditions: [
        "สร้าง credentials เมื่อ status=approved + offer_wifi=true",
        "ส่ง credentials ให้ผู้มาติดต่อผ่าน notification",
      ],
    },
    {
      title: "Notification",
      titleEn: "Status Change Notification",
      description: "ส่ง notification ทุกครั้งที่เปลี่ยนสถานะ",
      conditions: [
        "สร้างนัดหมาย → แจ้งผู้อนุมัติ",
        "อนุมัติ/ปฏิเสธ → แจ้งผู้จอง",
        "Check-in / Check-out → บันทึก log",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 13. ค้นหาผู้ติดต่อ (Visitor Search)
// ════════════════════════════════════════════════════

const searchFlow: PageFlowData = {
  pageId: "search",
  menuName: "ค้นหาผู้ติดต่อ",
  menuNameEn: "Visitor Search",
  path: "/web/search",
  summary:
    "ค้นหาผู้มาติดต่อ — ค้นหาตามชื่อ/บริษัท/รหัส, กรองตามประเภทและสถานะ, ดูรายละเอียด",
  flowcharts: [
    {
      id: "search-filter",
      title: "ค้นหาและกรองข้อมูล",
      titleEn: "Search & Filter Visitors",
      description: "ขั้นตอนการค้นหาและกรองข้อมูลผู้มาติดต่อ",
      steps: [
        { id: "sf1", label: "เปิดหน้าค้นหา", type: "start" },
        { id: "sf2", label: "แสดงรายการวันนี้\n(default)", type: "process" },
        { id: "sf3", label: "ค้นหา\n(ชื่อ/บริษัท/รหัส)", type: "process" },
        {
          id: "sf4",
          label: "เลือกตัวกรอง\n(ประเภท/สถานะ/ช่วงวัน)",
          type: "process",
        },
        { id: "sf5", label: "แสดงผลลัพธ์", type: "process" },
        { id: "sf6", label: "เปลี่ยนจำนวนแสดง/หน้า", type: "process" },
        { id: "sf7", label: "ล้างตัวกรอง", type: "process" },
        { id: "sf8", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "sf1", to: "sf2" },
        { from: "sf2", to: "sf3" },
        { from: "sf3", to: "sf4" },
        { from: "sf4", to: "sf5" },
        { from: "sf5", to: "sf6" },
        { from: "sf6", to: "sf8" },
        { from: "sf5", to: "sf7", label: "ล้างตัวกรอง" },
        { from: "sf7", to: "sf2" },
      ],
    },
    {
      id: "search-view-detail",
      title: "ดูรายละเอียดผู้มาติดต่อ",
      titleEn: "View Visitor Detail",
      description: "ขั้นตอนการดูรายละเอียดผู้มาติดต่อ",
      steps: [
        { id: "sd1", label: "คลิกรายการ", type: "start" },
        { id: "sd2", label: "เปิดรายละเอียด", type: "process" },
        {
          id: "sd3",
          label: "แสดงข้อมูลนัดหมาย\n+ ผู้มาติดต่อ\n+ สถานะ + ประวัติ",
          type: "io",
        },
        { id: "sd4", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "sd1", to: "sd2" },
        { from: "sd2", to: "sd3" },
        { from: "sd3", to: "sd4" },
      ],
    },
  ],
  validationRules: [
    {
      field: "คำค้นหา",
      fieldEn: "Search Keyword",
      rules: ["minimum 1 ตัวอักษร", "ค้นหาแบบ partial match"],
    },
    {
      field: "Pagination",
      fieldEn: "Pagination",
      rules: ["5/10/20/50 per page", "ค่าเริ่มต้น 10 per page"],
    },
    {
      field: "วันที่",
      fieldEn: "Date Filter",
      rules: ["กรอง \"วันนี้เท่านั้น\" default เปิด", "สามารถปิดเพื่อดูทุกวันได้"],
    },
  ],
  businessConditions: [
    {
      title: "Default View",
      titleEn: "Default View Filter",
      description: "แสดงเฉพาะวันนี้เป็นค่าเริ่มต้น",
      conditions: [
        "เปิดหน้าค้นหาครั้งแรก → แสดงเฉพาะรายการวันนี้",
        "ผู้ใช้สามารถปิดตัวกรองวันที่เพื่อดูทุกวันได้",
      ],
    },
    {
      title: "Search Scope",
      titleEn: "Cross-field Search",
      description: "ค้นหาข้ามฟิลด์",
      conditions: [
        "ค้นหาจากชื่อผู้มาติดต่อ",
        "ค้นหาจากชื่อบริษัท",
        "ค้นหาจากรหัสนัดหมาย",
        "ค้นหาจากชื่อผู้พบ (เจ้าหน้าที่)",
      ],
    },
    {
      title: "Real-time",
      titleEn: "Real-time Status Update",
      description: "อัปเดตสถานะอัตโนมัติ",
      conditions: [
        "สถานะนัดหมายอัปเดตแบบ real-time",
        "ไม่ต้อง refresh หน้าเพื่อดูสถานะล่าสุด",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 14. Blocklist Management
// ════════════════════════════════════════════════════

const blocklistFlow: PageFlowData = {
  pageId: "blocklist",
  menuName: "Blocklist",
  menuNameEn: "Blocklist Management",
  path: "/web/blocklist",
  summary:
    "จัดการรายชื่อผู้ถูกบล็อก — ตรวจสอบด้วย ชื่อ+นามสกุล (ไม่ใช้เลขบัตร เพราะระบบไม่ได้เก็บ ID) ตรวจอัตโนมัติทุกช่องทาง: Kiosk, Counter, LINE OA นัดหมาย, เจ้าหน้าที่สร้างให้",
  flowcharts: [
    {
      id: "blocklist-add",
      title: "เพิ่มรายชื่อ Blocklist",
      titleEn: "Add to Blocklist",
      description: "ขั้นตอนการเพิ่มรายชื่อผู้ถูกบล็อก — บันทึกชื่อ+นามสกุล (ไม่ใช้เลขบัตร)",
      steps: [
        { id: "ba1", label: "กดเพิ่มรายชื่อ", type: "start" },
        { id: "ba2", label: "กรอกชื่อ + นามสกุล\n(+ บริษัท ถ้ามี)", type: "process" },
        { id: "ba3", label: "เลือกประเภท\n(ถาวร/ชั่วคราว)", type: "decision" },
        { id: "ba4", label: "กำหนดวันหมดอายุ", type: "process" },
        { id: "ba5", label: "ใส่เหตุผล", type: "process" },
        { id: "ba6", label: "บันทึก\n(first_name + last_name)", type: "process" },
        { id: "ba7", label: "ทุกช่องทาง ตรวจชื่อนี้\nอัตโนมัติ (Kiosk/Counter/\nLINE OA/เจ้าหน้าที่สร้าง)", type: "io" },
        { id: "ba8", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "ba1", to: "ba2" },
        { from: "ba2", to: "ba3" },
        { from: "ba3", to: "ba4", label: "ชั่วคราว", condition: "temporary" },
        { from: "ba3", to: "ba5", label: "ถาวร", condition: "permanent" },
        { from: "ba4", to: "ba5" },
        { from: "ba5", to: "ba6" },
        { from: "ba6", to: "ba7" },
        { from: "ba7", to: "ba8" },
      ],
    },
    {
      id: "blocklist-check",
      title: "ตรวจสอบ Blocklist ด้วยชื่อ+นามสกุล (Runtime — ทุกช่องทาง)",
      titleEn: "Blocklist Name-based Check (All Channels)",
      description: "ตรวจ Blocklist ทุกครั้งที่มีการระบุชื่อ-นามสกุล — ใช้ทุกช่องทาง: Kiosk สแกน QR/walk-in, Counter เจ้าหน้าที่ตรวจ, LINE OA จองนัดหมาย, Web เจ้าหน้าที่สร้างให้ — ตรวจด้วย first_name + last_name (partial match, case-insensitive) ไม่ใช้เลขบัตร",
      steps: [
        { id: "bc1", label: "ระบุชื่อ-นามสกุลผู้มาติดต่อ\n(ทุกช่องทาง)", type: "start" },
        { id: "bc1b", label: "ช่องทางที่ตรวจ:\n① Kiosk (สแกน QR/walk-in)\n② Counter (เจ้าหน้าที่ตรวจ)\n③ LINE OA (จองนัดหมาย)\n④ Web (เจ้าหน้าที่สร้างให้)", type: "io" },
        { id: "bc2", label: "ค้นหา blocklist\nWHERE first_name LIKE %ชื่อ%\nAND last_name LIKE %นามสกุล%\nAND is_active=true", type: "process" },
        { id: "bc3", label: "พบรายชื่อตรง?", type: "decision" },
        { id: "bc4", label: "อนุญาตดำเนินการต่อ", type: "end" },
        { id: "bc5", label: "ตรวจ type?", type: "decision" },
        { id: "bc6", label: "ปฏิเสธ + แจ้งเจ้าหน้าที่\n+ บันทึก blocklist_check_logs", type: "end" },
        { id: "bc7", label: "ตรวจ expiry_date > now?", type: "decision" },
        { id: "bc8", label: "อัปเดต is_active=false\n+ อนุญาตดำเนินการ", type: "process" },
        { id: "bc9", label: "ปฏิเสธ + แจ้งเจ้าหน้าที่\n+ บันทึก log", type: "end" },
        { id: "bc10", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "bc1", to: "bc1b" },
        { from: "bc1b", to: "bc2" },
        { from: "bc2", to: "bc3" },
        { from: "bc3", to: "bc4", label: "ไม่พบ (ชื่อ-นามสกุลไม่ตรง)" },
        { from: "bc3", to: "bc5", label: "พบ (ชื่อ-นามสกุลตรง)" },
        { from: "bc5", to: "bc6", label: "permanent" },
        { from: "bc5", to: "bc7", label: "temporary" },
        { from: "bc7", to: "bc8", label: "หมดอายุแล้ว" },
        { from: "bc7", to: "bc9", label: "ยังไม่หมดอายุ" },
        { from: "bc8", to: "bc10" },
      ],
    },
    {
      id: "blocklist-manage",
      title: "แก้ไข/ลบรายชื่อ",
      titleEn: "Edit / Remove Blocklist Entry",
      description: "ขั้นตอนการแก้ไขหรือลบรายชื่อจาก Blocklist",
      steps: [
        { id: "bm1", label: "ค้นหา/กรองรายชื่อ", type: "start" },
        { id: "bm2", label: "เลือกรายการ", type: "process" },
        { id: "bm3", label: "เลือกการกระทำ?", type: "decision" },
        { id: "bm4", label: "แก้ไข\n(เปลี่ยนชื่อ/ประเภท/เหตุผล/วันหมดอายุ)", type: "process" },
        { id: "bm5", label: "ยืนยันลบ", type: "process" },
        { id: "bm6", label: "บันทึก", type: "process" },
        { id: "bm7", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "bm1", to: "bm2" },
        { from: "bm2", to: "bm3" },
        { from: "bm3", to: "bm4", label: "แก้ไข", condition: "edit" },
        { from: "bm3", to: "bm5", label: "ลบ", condition: "delete" },
        { from: "bm4", to: "bm6" },
        { from: "bm5", to: "bm6" },
        { from: "bm6", to: "bm7" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ชื่อ-นามสกุล",
      fieldEn: "First Name + Last Name",
      rules: ["ห้ามว่างทั้งคู่ (ชื่อ + นามสกุล Required)", "ใช้ตรวจสอบ Blocklist ทุกช่องทาง (partial match, case-insensitive)", "ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID ไว้"],
    },
    {
      field: "เหตุผล",
      fieldEn: "Reason",
      rules: ["ห้ามว่าง (Required)", "อย่างน้อย 10 ตัวอักษร"],
    },
    {
      field: "วันหมดอายุ (temporary)",
      fieldEn: "Expiry Date (Temporary)",
      rules: ["ต้องเป็นอนาคต", "บังคับเมื่อ type=temporary"],
    },
    {
      field: "ผู้มาติดต่อ",
      fieldEn: "Visitor",
      rules: ["ตรวจซ้ำก่อนเพิ่ม (ห้ามชื่อ+นามสกุลซ้ำ)", "visitor_id เป็น nullable — สามารถบล็อกคนที่ยังไม่เคยเข้าระบบได้"],
    },
  ],
  businessConditions: [
    {
      title: "การตรวจสอบด้วยชื่อ-นามสกุล (Name-based Matching)",
      titleEn: "Name-based Blocklist Matching",
      description: "ระบบตรวจ Blocklist ด้วย ชื่อ+นามสกุล เท่านั้น — ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID ไว้",
      conditions: [
        "ตรวจด้วย first_name + last_name แบบ partial match, case-insensitive",
        "ไม่ตรวจด้วยเลขบัตรประชาชน/passport เพราะระบบไม่ได้เก็บ ID ไว้",
        "กรณีชื่อซ้ำ → ใช้ company ช่วยยืนยันตัวตน + แจ้งเจ้าหน้าที่ตัดสิน",
        "Query: WHERE LOWER(first_name) LIKE LOWER(%input%) AND LOWER(last_name) LIKE LOWER(%input%) AND is_active=true",
      ],
    },
    {
      title: "ตรวจทุกช่องทาง (All Channel Check)",
      titleEn: "All Channel Blocklist Verification",
      description: "ตรวจ blocklist ทุกครั้งที่มีการระบุชื่อ-นามสกุล ไม่ว่าจะเข้าจากช่องทางไหน",
      conditions: [
        "① Kiosk: ตรวจเมื่อสแกน QR / walk-in กรอกชื่อ → พบ = แสดงหน้าจอปฏิเสธ",
        "② Counter: ตรวจเมื่อเจ้าหน้าที่ค้นหา/ตรวจสอบผู้มาติดต่อ → พบ = แจ้งเตือนบนหน้าจอ",
        "③ LINE OA: ตรวจเมื่อผู้ใช้จองนัดหมาย → พบ = ปฏิเสธการจอง + แจ้งเหตุผล",
        "④ Web (เจ้าหน้าที่): ตรวจเมื่อสร้างนัดหมายให้ → พบ = แสดง alert + ไม่ให้บันทึก",
        "ผู้ติดตาม (companion) ก็ถูกตรวจด้วย — ทุกคนต้องผ่าน blocklist check",
      ],
    },
    {
      title: "Auto-expiry",
      titleEn: "Automatic Expiry Check",
      description: "ระบบตรวจสอบ expiry_date รายวัน",
      conditions: [
        "Batch job ตรวจ expiry_date ทุกวัน",
        "อัปเดต is_active=false เมื่อ expiry_date < NOW()",
        "รายการที่หมดอายุจะไม่บล็อกผู้มาติดต่ออีกต่อไป",
        "Runtime: ถ้าตรวจแล้วเจอ temporary ที่ expiry_date < now → auto อัปเดต is_active=false แล้วอนุญาต",
      ],
    },
    {
      title: "Notification & Audit Log",
      titleEn: "Block Attempt Notification & Audit",
      description: "แจ้งเตือนและบันทึกทุกครั้งที่ตรวจพบรายชื่อ blocklist",
      conditions: [
        "ส่ง notification ให้เจ้าหน้าที่ Counter/Admin ทันทีที่ตรวจพบ",
        "บันทึก blocklist_check_logs ทุกครั้ง: ชื่อที่ตรง, ช่องทาง, การกระทำ",
        "ใช้สำหรับ audit trail และรายงานความปลอดภัย",
      ],
    },
    {
      title: "Audit",
      titleEn: "Audit Trail",
      description: "บันทึกทุกการเปลี่ยนแปลง",
      conditions: [
        "บันทึกการเพิ่มรายชื่อ (เพิ่มโดยใคร, เมื่อไหร่)",
        "บันทึกการแก้ไข (เปลี่ยนอะไร, โดยใคร)",
        "บันทึกการลบ (ลบโดยใคร, เมื่อไหร่)",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 15. รายงาน (Reports)
// ════════════════════════════════════════════════════

const reportsFlow: PageFlowData = {
  pageId: "reports",
  menuName: "รายงาน",
  menuNameEn: "Reports",
  path: "/web/reports",
  summary:
    "รายงานสถิติผู้มาติดต่อ — สรุปรายวัน/สัปดาห์/เดือน, กราฟแนวโน้ม, วิเคราะห์ตามประเภท/แผนก, ส่งออก Excel/PDF",
  flowcharts: [
    {
      id: "report-view",
      title: "ดูรายงานสถิติ",
      titleEn: "View Report Dashboard",
      description: "ขั้นตอนการดูรายงานสถิติผู้มาติดต่อ",
      steps: [
        { id: "rv1", label: "เปิดหน้ารายงาน", type: "start" },
        {
          id: "rv2",
          label: "เลือกช่วงเวลา\n(วันนี้/สัปดาห์/เดือน/กำหนดเอง)",
          type: "process",
        },
        {
          id: "rv3",
          label: "แสดง Dashboard\n(KPI cards + กราฟ)",
          type: "io",
        },
        { id: "rv4", label: "กรองตามแผนก/ประเภท", type: "process" },
        { id: "rv5", label: "Refresh ข้อมูล", type: "process" },
        { id: "rv6", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "rv1", to: "rv2" },
        { from: "rv2", to: "rv3" },
        { from: "rv3", to: "rv4" },
        { from: "rv4", to: "rv5" },
        { from: "rv5", to: "rv6" },
      ],
    },
    {
      id: "report-export",
      title: "ส่งออกรายงาน",
      titleEn: "Export Report",
      description: "ขั้นตอนการส่งออกรายงานเป็น Excel หรือ PDF",
      steps: [
        { id: "re1", label: "เลือกช่วงเวลา", type: "start" },
        { id: "re2", label: "เลือกรูปแบบ\n(Excel/PDF)", type: "process" },
        { id: "re3", label: "เลือกข้อมูลที่ต้องการ", type: "process" },
        { id: "re4", label: "กดส่งออก", type: "process" },
        { id: "re5", label: "ระบบ generate ไฟล์", type: "subprocess" },
        { id: "re6", label: "Download", type: "io" },
        { id: "re7", label: "สำเร็จ", type: "end" },
      ],
      connections: [
        { from: "re1", to: "re2" },
        { from: "re2", to: "re3" },
        { from: "re3", to: "re4" },
        { from: "re4", to: "re5" },
        { from: "re5", to: "re6" },
        { from: "re6", to: "re7" },
      ],
    },
  ],
  validationRules: [
    {
      field: "ช่วงเวลา",
      fieldEn: "Date Range",
      rules: ["วันเริ่มต้น ≤ วันสิ้นสุด", "ไม่เกิน 1 ปี"],
    },
    {
      field: "Export",
      fieldEn: "Export Format",
      rules: ["รองรับ Excel (.xlsx) และ PDF", "เลือกได้ครั้งละ 1 รูปแบบ"],
    },
  ],
  businessConditions: [
    {
      title: "Real-time Dashboard",
      titleEn: "Real-time KPI Dashboard",
      description: "KPI อัปเดตทุก 5 นาที",
      conditions: [
        "KPI cards อัปเดตอัตโนมัติทุก 5 นาที",
        "กราฟอัปเดตตาม interval ที่กำหนด",
        "สามารถกด Refresh เพื่ออัปเดตทันทีได้",
      ],
    },
    {
      title: "Data Aggregation",
      titleEn: "Data Aggregation Sources",
      description: "สรุปข้อมูลจากหลายตาราง",
      conditions: [
        "รวมข้อมูลจาก appointments",
        "รวมข้อมูลจาก visitors",
        "รวมข้อมูลจาก pdpa_consent_logs",
      ],
    },
    {
      title: "Department Breakdown",
      titleEn: "Department Statistics Breakdown",
      description: "แยกสถิติตามแผนก",
      conditions: [
        "แสดงจำนวนผู้มาติดต่อแยกตามแผนก",
        "เปรียบเทียบระหว่างแผนกได้",
      ],
    },
    {
      title: "Visit Type Analysis",
      titleEn: "Visit Type Proportion Analysis",
      description: "วิเคราะห์สัดส่วนประเภทการติดต่อ",
      conditions: [
        "แสดงสัดส่วนประเภทการติดต่อเป็น Pie/Donut chart",
        "กรองตามช่วงเวลาได้",
      ],
    },
    {
      title: "Trend",
      titleEn: "Trend Comparison",
      description: "แสดงแนวโน้มเทียบช่วงเวลาก่อนหน้า",
      conditions: [
        "เปรียบเทียบกับช่วงเวลาก่อนหน้า (เช่น สัปดาห์นี้ vs สัปดาห์ที่แล้ว)",
        "แสดง % เพิ่ม/ลดบน KPI cards",
        "แสดง trend line บนกราฟ",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 16. จัดการผู้ใช้งาน (User Management)
// ════════════════════════════════════════════════════

const userManagementFlow: PageFlowData = {
  pageId: "user-management",
  menuName: "จัดการผู้ใช้งาน",
  menuNameEn: "User Management",
  path: "/web/settings/users",
  summary: "จัดการบัญชีผู้ใช้ทั้งหมด — ดูรายชื่อ, เปลี่ยนสิทธิ์ (Role), ล็อก/ปลดล็อกบัญชี, รีเซ็ตรหัสผ่าน, ผูก/ยกเลิก LINE",
  summaryEn: "Manage all user accounts — view list, change role, lock/unlock, reset password, LINE link/unlink",
  flowcharts: [
    {
      id: "um-register",
      title: "การสมัครสมาชิก (Registration)",
      titleEn: "User Registration Flow",
      description: "ขั้นตอนการสมัคร → ได้ role default → admin เปลี่ยนสิทธิ์ภายหลัง",
      steps: [
        { id: "r1", label: "เริ่มต้น", type: "start" },
        { id: "r2", label: "ผู้ใช้เปิดหน้า /web/register", type: "process" },
        { id: "r3", label: "เลือกประเภท:\nVisitor / Staff", type: "decision" },
        { id: "r4", label: "กรอกข้อมูล Visitor\n(ชื่อ, email, บริษัท, เลขบัตร)", type: "process" },
        { id: "r5", label: "กรอกข้อมูล Staff\n(ชื่อ, email, รหัสพนักงาน, แผนก)", type: "process" },
        { id: "r6", label: "กรอก Password\n+ Confirm Password", type: "process" },
        { id: "r7", label: "Validate ข้อมูล?", type: "decision" },
        { id: "r8", label: "แสดง Error", type: "process" },
        { id: "r9", label: "สร้าง user_accounts\nrole = visitor (default)", type: "subprocess", description: "ถ้าเลือก Visitor → role = visitor" },
        { id: "r10", label: "สร้าง user_accounts\nrole = staff (default)", type: "subprocess", description: "ถ้าเลือก Staff → role = staff" },
        { id: "r11", label: "สมัครสำเร็จ\nRedirect → Login", type: "end" },
      ],
      connections: [
        { from: "r1", to: "r2" },
        { from: "r2", to: "r3" },
        { from: "r3", to: "r4", label: "Visitor" },
        { from: "r3", to: "r5", label: "Staff" },
        { from: "r4", to: "r6" },
        { from: "r5", to: "r6" },
        { from: "r6", to: "r7" },
        { from: "r7", to: "r8", label: "ไม่ผ่าน", condition: "ข้อมูลไม่ครบ / email ซ้ำ / password ไม่ตรง" },
        { from: "r8", to: "r6" },
        { from: "r7", to: "r9", label: "Visitor", condition: "ข้อมูลครบถ้วน + user_type = visitor" },
        { from: "r7", to: "r10", label: "Staff", condition: "ข้อมูลครบถ้วน + user_type = staff" },
        { from: "r9", to: "r11" },
        { from: "r10", to: "r11" },
      ],
    },
    {
      id: "um-change-role",
      title: "การเปลี่ยนสิทธิ์ (Change Role)",
      titleEn: "Role Change Flow",
      description: "เฉพาะ Admin เท่านั้นที่เปลี่ยนสิทธิ์ได้",
      steps: [
        { id: "c1", label: "เริ่มต้น", type: "start" },
        { id: "c2", label: "Admin เปิดหน้า\nจัดการผู้ใช้งาน", type: "process" },
        { id: "c3", label: "เลือก user\nที่ต้องการเปลี่ยนสิทธิ์", type: "process" },
        { id: "c4", label: "คลิก Role badge\n→ Dropdown เปิด", type: "process" },
        { id: "c5", label: "เลือก Role ใหม่:\nvisitor / staff / supervisor\n/ security / admin", type: "decision" },
        { id: "c6", label: "บันทึก role ใหม่\nลง user_accounts", type: "subprocess" },
        { id: "c7", label: "บันทึก audit_log\n(who, when, old→new)", type: "subprocess" },
        { id: "c8", label: "แจ้ง user ทาง email\n(role เปลี่ยนแล้ว)", type: "io" },
        { id: "c9", label: "Sidebar เมนูเปลี่ยน\nตาม role ใหม่ทันที", type: "end" },
      ],
      connections: [
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
        { from: "c3", to: "c4" },
        { from: "c4", to: "c5" },
        { from: "c5", to: "c6" },
        { from: "c6", to: "c7" },
        { from: "c7", to: "c8" },
        { from: "c8", to: "c9" },
      ],
    },
    {
      id: "um-lock-unlock",
      title: "ล็อก / ปลดล็อกบัญชี",
      titleEn: "Lock / Unlock Account Flow",
      steps: [
        { id: "l1", label: "เริ่มต้น", type: "start" },
        { id: "l2", label: "Admin กดปุ่ม\nล็อก/ปลดล็อก", type: "process" },
        { id: "l3", label: "แสดง Confirm Modal\n(ยืนยันการกระทำ)", type: "decision" },
        { id: "l4", label: "ยกเลิก", type: "end" },
        { id: "l5", label: "อัปเดต is_active\nใน user_accounts", type: "subprocess" },
        { id: "l6", label: "บัญชีถูกล็อก?\n(is_active = false)", type: "decision" },
        { id: "l7", label: "User ไม่สามารถ\nlogin ได้ทุกช่องทาง", type: "end" },
        { id: "l8", label: "User สามารถ\nlogin ได้ตามปกติ", type: "end" },
      ],
      connections: [
        { from: "l1", to: "l2" },
        { from: "l2", to: "l3" },
        { from: "l3", to: "l4", label: "ยกเลิก" },
        { from: "l3", to: "l5", label: "ยืนยัน" },
        { from: "l5", to: "l6" },
        { from: "l6", to: "l7", label: "ล็อก", condition: "is_active = false" },
        { from: "l6", to: "l8", label: "ปลดล็อก", condition: "is_active = true" },
      ],
    },
    {
      id: "um-reset-password",
      title: "รีเซ็ตรหัสผ่าน (Admin)",
      titleEn: "Admin Reset Password Flow",
      steps: [
        { id: "p1", label: "เริ่มต้น", type: "start" },
        { id: "p2", label: "Admin กดปุ่ม\nรีเซ็ตรหัสผ่าน", type: "process" },
        { id: "p3", label: "แสดง Confirm Modal", type: "decision" },
        { id: "p4", label: "ยกเลิก", type: "end" },
        { id: "p5", label: "สร้าง reset_token\n+ reset_token_expires\n(หมดอายุ 24 ชม.)", type: "subprocess" },
        { id: "p6", label: "ส่ง email ไปยัง user\nพร้อมลิงก์ reset", type: "io" },
        { id: "p7", label: "User กดลิงก์จาก email\n→ หน้าตั้งรหัสใหม่", type: "process" },
        { id: "p8", label: "Token ยังไม่หมดอายุ?", type: "decision" },
        { id: "p9", label: "แสดง Error:\nลิงก์หมดอายุ", type: "end" },
        { id: "p10", label: "กรอก password ใหม่\n+ confirm", type: "process" },
        { id: "p11", label: "บันทึก password_hash ใหม่\nลบ reset_token", type: "subprocess" },
        { id: "p12", label: "เปลี่ยนรหัสผ่านสำเร็จ\nRedirect → Login", type: "end" },
      ],
      connections: [
        { from: "p1", to: "p2" },
        { from: "p2", to: "p3" },
        { from: "p3", to: "p4", label: "ยกเลิก" },
        { from: "p3", to: "p5", label: "ยืนยัน" },
        { from: "p5", to: "p6" },
        { from: "p6", to: "p7" },
        { from: "p7", to: "p8" },
        { from: "p8", to: "p9", label: "หมดอายุ", condition: "NOW() > reset_token_expires" },
        { from: "p8", to: "p10", label: "ยังใช้ได้" },
        { from: "p10", to: "p11" },
        { from: "p11", to: "p12" },
      ],
    },
    {
      id: "um-line-link",
      title: "ผูก / เปลี่ยน / ยกเลิกบัญชี LINE",
      titleEn: "LINE Account Link / Change / Unlink Flow",
      description: "User ผูก LINE ผ่าน LIFF, เปลี่ยนบัญชี LINE, หรือยกเลิกการผูก (ตัวเอง/Admin) — ใช้ได้ทั้ง Mobile Profile และ Web Profile (/web/profile)",
      steps: [
        { id: "ln1", label: "เริ่มต้น", type: "start" },
        { id: "ln2", label: "ใครเป็นผู้ดำเนินการ?", type: "decision" },
        // === User ดำเนินการเอง (Mobile Profile) ===
        { id: "ln3", label: "User เปิดหน้า Profile\n(Mobile /profile หรือ Web /web/profile)", type: "process" },
        { id: "ln4", label: "มี LINE ผูกอยู่แล้ว?", type: "decision" },
        // ยังไม่ผูก → ผูกใหม่
        { id: "ln5", label: "กดปุ่ม 'ผูกบัญชี LINE'", type: "process" },
        { id: "ln6", label: "Redirect → LINE Login\n(LIFF / LINE Login v2.1)", type: "io" },
        { id: "ln7", label: "User ยืนยันตัวตนบน LINE\n→ ได้ access_token", type: "process" },
        { id: "ln8", label: "Backend ดึง line_user_id\nจาก LINE Profile API", type: "subprocess" },
        { id: "ln9", label: "line_user_id ซ้ำในระบบ?", type: "decision" },
        { id: "ln10", label: "แสดง Error:\nLINE นี้ผูกกับบัญชีอื่นแล้ว", type: "end" },
        { id: "ln11", label: "บันทึก line_user_id\n+ line_display_name\n+ line_linked_at", type: "subprocess" },
        { id: "ln12", label: "ผูก LINE สำเร็จ\nรับ notification ได้", type: "end" },
        // ผูกแล้ว → เปลี่ยน
        { id: "ln13", label: "กดปุ่ม 'เปลี่ยนบัญชี LINE'", type: "process" },
        { id: "ln14", label: "ลบ line_user_id เดิม\n→ Redirect LINE Login ใหม่", type: "subprocess", description: "เหมือน flow ผูกใหม่ แต่ลบค่าเดิมก่อน" },
        // ผูกแล้ว → ยกเลิก
        { id: "ln15", label: "กดปุ่ม 'ยกเลิกการผูก'", type: "process" },
        { id: "ln16", label: "แสดง Confirm Modal\n(แจ้งผลกระทบ)", type: "decision" },
        { id: "ln17", label: "ยกเลิก", type: "end" },
        { id: "ln18", label: "SET line_user_id = NULL\nline_display_name = NULL\nline_linked_at = NULL", type: "subprocess" },
        { id: "ln19", label: "ยกเลิกผูก LINE สำเร็จ\nไม่รับ notification แล้ว", type: "end" },
        // === Admin ดำเนินการ (Web Admin) ===
        { id: "ln20", label: "Admin เปิดหน้า\nจัดการผู้ใช้งาน", type: "process" },
        { id: "ln21", label: "Admin กดเมนู ⋯\n→ 'ยกเลิกผูก LINE'", type: "process" },
        { id: "ln22", label: "แสดง Confirm Modal\n(แจ้งชื่อ LINE + ผลกระทบ)", type: "decision" },
        { id: "ln23", label: "ยกเลิก", type: "end" },
        { id: "ln24", label: "SET line_user_id = NULL\n(admin force unlink)", type: "subprocess" },
        { id: "ln25", label: "บันทึก audit_log\n(admin_id, user_id, action)", type: "subprocess" },
        { id: "ln26", label: "ยกเลิกผูก LINE สำเร็จ\nUser ต้องผูกใหม่เอง", type: "end" },
      ],
      connections: [
        { from: "ln1", to: "ln2" },
        { from: "ln2", to: "ln3", label: "User เอง" },
        { from: "ln2", to: "ln20", label: "Admin" },
        { from: "ln3", to: "ln4" },
        { from: "ln4", to: "ln5", label: "ยังไม่ผูก" },
        { from: "ln4", to: "ln13", label: "ผูกแล้ว (เปลี่ยน)" },
        { from: "ln4", to: "ln15", label: "ผูกแล้ว (ยกเลิก)" },
        { from: "ln5", to: "ln6" },
        { from: "ln6", to: "ln7" },
        { from: "ln7", to: "ln8" },
        { from: "ln8", to: "ln9" },
        { from: "ln9", to: "ln10", label: "ซ้ำ", condition: "line_user_id UNIQUE constraint" },
        { from: "ln9", to: "ln11", label: "ไม่ซ้ำ" },
        { from: "ln11", to: "ln12" },
        { from: "ln13", to: "ln14" },
        { from: "ln14", to: "ln6" },
        { from: "ln15", to: "ln16" },
        { from: "ln16", to: "ln17", label: "ยกเลิก" },
        { from: "ln16", to: "ln18", label: "ยืนยัน" },
        { from: "ln18", to: "ln19" },
        { from: "ln20", to: "ln21" },
        { from: "ln21", to: "ln22" },
        { from: "ln22", to: "ln23", label: "ยกเลิก" },
        { from: "ln22", to: "ln24", label: "ยืนยัน" },
        { from: "ln24", to: "ln25" },
        { from: "ln25", to: "ln26" },
      ],
    },
  ],
  validationRules: [
    { field: "email", fieldEn: "Email", rules: ["ต้องกรอก (required)", "รูปแบบ email ถูกต้อง", "ไม่ซ้ำในระบบ (UNIQUE)"] },
    { field: "password", fieldEn: "Password", rules: ["ต้องกรอก (required)", "อย่างน้อย 8 ตัวอักษร", "แนะนำ: มี ตัวพิมพ์ใหญ่ + ตัวเลข + อักขระพิเศษ"] },
    { field: "confirm_password", fieldEn: "Confirm Password", rules: ["ต้องตรงกับ password"] },
    { field: "first_name / last_name", fieldEn: "Name", rules: ["ต้องกรอก (required)", "ไม่เกิน 100 ตัวอักษร"] },
    { field: "role (เปลี่ยนสิทธิ์)", fieldEn: "Role Change", rules: ["เฉพาะ Admin เท่านั้นที่เปลี่ยนได้", "ค่าที่เลือกได้: visitor, staff, supervisor, security, admin", "บันทึก audit log ทุกครั้งที่เปลี่ยน"] },
    { field: "reset_token", fieldEn: "Reset Token", rules: ["สร้างด้วย crypto.randomBytes(32)", "หมดอายุ 24 ชั่วโมง", "ใช้ได้ครั้งเดียว (ลบหลังใช้)"] },
    { field: "line_user_id", fieldEn: "LINE User ID", rules: ["ได้จาก LINE Login / LIFF SDK (Profile API)", "UNIQUE — 1 LINE account ผูกได้กับ 1 user account เท่านั้น", "null = ยังไม่ผูก", "ยกเลิกผูก → set null (ไม่ลบ user)"] },
    { field: "line_display_name", fieldEn: "LINE Display Name", rules: ["ได้จาก LINE Profile API พร้อม line_user_id", "แสดงใน admin panel เพื่อระบุตัวตน", "อัปเดตทุกครั้งที่ผูกใหม่"] },
  ],
  businessConditions: [
    {
      title: "สิทธิ์เริ่มต้น (Default Role)",
      titleEn: "Default Role on Registration",
      description: "เมื่อสมัครสมาชิก ระบบกำหนดสิทธิ์เริ่มต้นตามประเภทที่เลือก",
      conditions: [
        "เลือก 'ผู้มาติดต่อ' → role = visitor",
        "เลือก 'เจ้าหน้าที่' → role = staff",
        "ต้องการเปลี่ยนเป็น supervisor / security / admin → ให้ Admin เปลี่ยนในหน้าจัดการผู้ใช้งาน",
        "ไม่สามารถเลือก role เองได้ตอนสมัคร (ป้องกัน privilege escalation)",
      ],
    },
    {
      title: "การล็อกบัญชี",
      titleEn: "Account Locking Rules",
      description: "เงื่อนไขการล็อกและผลกระทบ",
      conditions: [
        "Admin ล็อกบัญชีด้วยมือ → is_active = false",
        "บัญชีถูกล็อก → ไม่สามารถ login ได้ทุกช่องทาง (Web, LINE, Counter PIN)",
        "บัญชีถูกล็อก → session ที่มีอยู่จะถูกยกเลิกทันที",
        "ปลดล็อก → is_active = true → user login ได้ตามปกติ",
        "(อนาคต) Auto-lock หลัง login ผิดติดกัน 5 ครั้ง",
      ],
    },
    {
      title: "การเปลี่ยน Role",
      titleEn: "Role Change Rules",
      description: "เงื่อนไขและผลกระทบของการเปลี่ยนสิทธิ์",
      conditions: [
        "เฉพาะ Admin เท่านั้นที่เปลี่ยน role ได้",
        "เปลี่ยน role → เมนู Sidebar เปลี่ยนตาม permission matrix ทันที",
        "เปลี่ยนจาก staff → visitor → จะไม่เห็นเมนู Dashboard, Settings",
        "เปลี่ยนจาก visitor → staff → จะเห็น Dashboard แผนก, สร้างนัดหมายได้",
        "เปลี่ยนเป็น supervisor → เห็น Dashboard ทุกแผนก + Blocklist + รายงาน",
        "เปลี่ยนเป็น security → ใช้ Counter app, ไม่เห็น Web menu",
        "ส่ง email แจ้ง user ทุกครั้งที่เปลี่ยน role",
        "บันทึก audit log: who changed, when, old_role → new_role",
      ],
    },
    {
      title: "Forgot Password / Reset Password",
      titleEn: "Password Reset Rules",
      description: "เงื่อนไขการรีเซ็ตรหัสผ่าน",
      conditions: [
        "User กดลืมรหัสผ่าน → ส่ง email พร้อม reset link",
        "Admin กดรีเซ็ตรหัสผ่านให้ user → ส่ง email เช่นกัน",
        "Reset token หมดอายุ 24 ชั่วโมง",
        "Reset token ใช้ได้ครั้งเดียว (ลบหลังใช้สำเร็จ)",
        "Password ใหม่ต้องผ่าน validation (≥ 8 ตัวอักษร)",
        "ส่ง email จากค่า SMTP ที่ตั้งในหน้า Settings > ตั้งค่าอีเมลระบบ (ไม่ hardcode)",
      ],
    },
    {
      title: "การผูก / เปลี่ยน / ยกเลิกบัญชี LINE",
      titleEn: "LINE Account Link / Change / Unlink Rules",
      description: "เงื่อนไขการจัดการบัญชี LINE ของ user",
      conditions: [
        "User ผูก LINE ผ่าน LIFF SDK หรือ LINE Login v2.1 บนหน้า Mobile Profile หรือ Web Profile (/web/profile)",
        "Staff/Admin เข้าถึงหน้าจัดการ LINE ของตัวเองได้ผ่าน Topbar avatar dropdown → 'โปรไฟล์ของฉัน' หรือ Sidebar footer",
        "1 LINE account ผูกได้กับ 1 user account เท่านั้น (UNIQUE constraint)",
        "ถ้า LINE account ซ้ำ → แสดง error 'LINE นี้ผูกกับบัญชีอื่นแล้ว'",
        "User เปลี่ยนบัญชี LINE ได้เอง → ลบค่าเดิม → redirect LINE Login ใหม่",
        "User ยกเลิกผูก LINE ได้เอง → แสดง confirm modal พร้อมผลกระทบ",
        "Admin ยกเลิกผูก LINE ให้ user ได้ผ่านหน้าจัดการผู้ใช้งาน (เมนู ⋯)",
        "Admin ไม่สามารถผูก LINE ให้ user ได้ — user ต้องผูกเอง (เพื่อยืนยัน ownership)",
        "ยกเลิกผูก LINE → user ไม่ได้รับ notification ผ่าน LINE อีกต่อไป",
        "ยกเลิกผูก LINE → user ต้องผูกใหม่ด้วยตัวเอง",
        "ผูก LINE แล้ว → ระบบส่ง notification ผ่าน LINE Messaging API (นัดหมาย, สถานะอนุมัติ, Visit Slip)",
        "ผูก LINE แล้ว → Kiosk ถาม 'ต้องการพิมพ์ Visit Slip หรือไม่?' (เพราะส่ง LINE ได้)",
        "บันทึก audit_log ทุกครั้งที่ admin ยกเลิกผูก LINE ให้ user",
      ],
    },
    {
      title: "Permission Matrix (Sidebar)",
      titleEn: "Menu Visibility by Role",
      description: "แต่ละ role เห็นเมนูอะไรบ้าง",
      conditions: [
        "visitor → เฉพาะ 'การนัดหมาย' (ของตัวเอง)",
        "staff → Dashboard (แผนก), การนัดหมาย (แผนก), ค้นหาผู้ติดต่อ, รายงาน (แผนก)",
        "supervisor → เหมือน staff + Dashboard (ทุกแผนก), Blocklist, รายงาน (ทั้งหมด)",
        "security → ใช้ Counter app เท่านั้น (ไม่เห็น Web menu)",
        "admin → เห็นทุกเมนู รวม Settings ทั้งหมด",
        "ควบคุมผ่าน canAccess(role, resource) ใน lib/auth-config.ts",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// 17. โปรไฟล์ของฉัน (My Profile — Web)
// ════════════════════════════════════════════════════

const myProfileFlow: PageFlowData = {
  pageId: "my-profile",
  menuName: "โปรไฟล์ของฉัน",
  menuNameEn: "My Profile",
  path: "/web/profile",
  summary: "ดูข้อมูลส่วนตัว, ผูก/เปลี่ยน/ยกเลิกบัญชี LINE, เปลี่ยนรหัสผ่าน — ทุก role เข้าถึงได้",
  summaryEn: "View personal info, LINE account link/change/unlink, change password — all roles",
  flowcharts: [
    {
      id: "mp-line-link",
      title: "ผูก / เปลี่ยน / ยกเลิกบัญชี LINE (Self-Service)",
      titleEn: "LINE Account Self-Service Flow",
      description: "Staff/Admin จัดการบัญชี LINE ของตัวเองผ่านหน้า Web Profile",
      steps: [
        { id: "ml1", label: "เริ่มต้น", type: "start" },
        { id: "ml2", label: "User เปิดหน้า\n/web/profile\n(คลิก avatar หรือ Sidebar)", type: "process" },
        { id: "ml3", label: "มี LINE ผูกอยู่แล้ว?", type: "decision" },
        // ยังไม่ผูก
        { id: "ml4", label: "แสดงปุ่ม\n'ผูกบัญชี LINE'", type: "process" },
        { id: "ml5", label: "กดปุ่ม → Confirm Modal\n(แสดง LINE OA + ข้อดี)", type: "decision" },
        { id: "ml6", label: "ยกเลิก", type: "end" },
        { id: "ml7", label: "Redirect → LINE Login\n(LIFF / LINE Login v2.1)", type: "io" },
        { id: "ml8", label: "LINE ส่ง access_token กลับ\n→ Backend ดึง line_user_id", type: "subprocess" },
        { id: "ml9", label: "line_user_id ซ้ำ?", type: "decision" },
        { id: "ml10", label: "Error: LINE นี้\nผูกกับบัญชีอื่นแล้ว", type: "end" },
        { id: "ml11", label: "บันทึก line_user_id\n+ display_name + linked_at", type: "subprocess" },
        { id: "ml12", label: "ผูก LINE สำเร็จ\nแสดง Toast + อัปเดต UI", type: "end" },
        // ผูกแล้ว → เปลี่ยน
        { id: "ml13", label: "แสดงชื่อ LINE + วันที่ผูก\n+ ปุ่ม 'เปลี่ยน' / 'ยกเลิก'", type: "process" },
        { id: "ml14", label: "กด 'เปลี่ยนบัญชี LINE'", type: "process" },
        { id: "ml15", label: "ลบ line_user_id เดิม\n→ Redirect LINE Login ใหม่", type: "subprocess" },
        // ผูกแล้ว → ยกเลิก
        { id: "ml16", label: "กด 'ยกเลิกการผูก'", type: "process" },
        { id: "ml17", label: "Confirm Modal:\nแจ้งผลกระทบ 3 ข้อ", type: "decision" },
        { id: "ml18", label: "ยกเลิก", type: "end" },
        { id: "ml19", label: "SET line_user_id = NULL\nline_display_name = NULL\nline_linked_at = NULL", type: "subprocess" },
        { id: "ml20", label: "ยกเลิกผูก LINE สำเร็จ\nUI เปลี่ยนเป็น 'ยังไม่ผูก'", type: "end" },
      ],
      connections: [
        { from: "ml1", to: "ml2" },
        { from: "ml2", to: "ml3" },
        { from: "ml3", to: "ml4", label: "ยังไม่ผูก" },
        { from: "ml3", to: "ml13", label: "ผูกแล้ว" },
        { from: "ml4", to: "ml5" },
        { from: "ml5", to: "ml6", label: "ยกเลิก" },
        { from: "ml5", to: "ml7", label: "ยืนยัน" },
        { from: "ml7", to: "ml8" },
        { from: "ml8", to: "ml9" },
        { from: "ml9", to: "ml10", label: "ซ้ำ", condition: "UNIQUE constraint" },
        { from: "ml9", to: "ml11", label: "ไม่ซ้ำ" },
        { from: "ml11", to: "ml12" },
        { from: "ml13", to: "ml14", label: "เปลี่ยน" },
        { from: "ml13", to: "ml16", label: "ยกเลิก" },
        { from: "ml14", to: "ml15" },
        { from: "ml15", to: "ml7" },
        { from: "ml16", to: "ml17" },
        { from: "ml17", to: "ml18", label: "ยกเลิก" },
        { from: "ml17", to: "ml19", label: "ยืนยัน" },
        { from: "ml19", to: "ml20" },
      ],
    },
    {
      id: "mp-change-password",
      title: "เปลี่ยนรหัสผ่าน (Self-Service)",
      titleEn: "Change Password Flow",
      description: "User เปลี่ยนรหัสผ่านของตัวเองโดยต้องกรอกรหัสเดิมก่อน",
      steps: [
        { id: "pw1", label: "เริ่มต้น", type: "start" },
        { id: "pw2", label: "กดปุ่ม\n'เปลี่ยนรหัสผ่าน'", type: "process" },
        { id: "pw3", label: "แสดง Modal:\nกรอกรหัสเดิม + ใหม่ + ยืนยัน", type: "process" },
        { id: "pw4", label: "Validate\nrealtime", type: "decision" },
        { id: "pw5", label: "แสดง Error:\n- รหัสใหม่ < 8 ตัว\n- ยืนยันไม่ตรง", type: "process" },
        { id: "pw6", label: "ส่ง API:\nPOST /change-password\n(old + new)", type: "subprocess" },
        { id: "pw7", label: "Backend: bcrypt.compare\nรหัสเดิมถูกต้อง?", type: "decision" },
        { id: "pw8", label: "Error 401:\nรหัสผ่านเดิมไม่ถูกต้อง", type: "end" },
        { id: "pw9", label: "bcrypt.hash(new)\nบันทึก password_hash ใหม่", type: "subprocess" },
        { id: "pw10", label: "เปลี่ยนรหัสผ่านสำเร็จ\nแสดง Toast", type: "end" },
      ],
      connections: [
        { from: "pw1", to: "pw2" },
        { from: "pw2", to: "pw3" },
        { from: "pw3", to: "pw4" },
        { from: "pw4", to: "pw5", label: "ไม่ผ่าน" },
        { from: "pw5", to: "pw3" },
        { from: "pw4", to: "pw6", label: "ผ่าน" },
        { from: "pw6", to: "pw7" },
        { from: "pw7", to: "pw8", label: "ไม่ถูกต้อง" },
        { from: "pw7", to: "pw9", label: "ถูกต้อง" },
        { from: "pw9", to: "pw10" },
      ],
    },
  ],
  validationRules: [
    { field: "line_user_id (ผูก LINE)", fieldEn: "LINE Link", rules: ["ได้จาก LINE Login / LIFF SDK", "UNIQUE — 1 LINE = 1 user", "ถ้าซ้ำ → แสดง error"] },
    { field: "old_password (เปลี่ยนรหัสผ่าน)", fieldEn: "Old Password", rules: ["ต้องกรอก (required)", "bcrypt.compare กับ password_hash ปัจจุบัน"] },
    { field: "new_password", fieldEn: "New Password", rules: ["ต้องกรอก (required)", "อย่างน้อย 8 ตัวอักษร", "แนะนำ: ตัวพิมพ์ใหญ่ + ตัวเลข + อักขระพิเศษ"] },
    { field: "confirm_password", fieldEn: "Confirm Password", rules: ["ต้องตรงกับ new_password", "Validate realtime บน frontend"] },
  ],
  businessConditions: [
    {
      title: "สิทธิ์การเข้าถึง",
      titleEn: "Access Control",
      description: "ใครเข้าหน้านี้ได้บ้าง",
      conditions: [
        "ทุก role ที่ login แล้วสามารถเข้าหน้า /web/profile ได้",
        "เข้าผ่าน Topbar → คลิก avatar → 'โปรไฟล์ของฉัน'",
        "เข้าผ่าน Sidebar → คลิกชื่อ user ล่างซ้าย",
        "อ่าน/แก้ไขได้เฉพาะข้อมูลของตัวเอง (WHERE id = session.user_id)",
        "email, role, user_type → อ่านอย่างเดียว ไม่ให้แก้ไข",
      ],
    },
    {
      title: "การจัดการ LINE (Self-Service)",
      titleEn: "LINE Self-Service Rules",
      description: "เงื่อนไขการผูก/เปลี่ยน/ยกเลิก LINE ของตัวเอง",
      conditions: [
        "ผูก LINE: redirect ไป LINE Login → ได้ access_token → backend ดึง profile → บันทึก line_user_id",
        "1 LINE account ผูกได้กับ 1 user เท่านั้น (UNIQUE)",
        "เปลี่ยน LINE: ลบค่าเดิม → redirect LINE Login ใหม่ (เหมือนผูกใหม่)",
        "ยกเลิก LINE: แสดง confirm + ผลกระทบ → SET null ทั้ง 3 fields",
        "ยกเลิกแล้ว → ไม่ได้รับ notification ผ่าน LINE, ต้องผูกใหม่เอง",
        "ผูก LINE สำเร็จ → รับ notification นัดหมาย, อนุมัติ, Visit Slip ผ่าน LINE",
      ],
    },
    {
      title: "การเปลี่ยนรหัสผ่าน",
      titleEn: "Password Change Rules",
      description: "เงื่อนไขการเปลี่ยนรหัสผ่านของตัวเอง",
      conditions: [
        "ต้องกรอกรหัสผ่านเดิมก่อน (ป้องกัน session hijack)",
        "รหัสใหม่อย่างน้อย 8 ตัวอักษร",
        "ยืนยันรหัสใหม่ต้องตรงกัน (validate realtime)",
        "Backend: bcrypt.compare(old, hash) → ถ้าไม่ตรง return 401",
        "สำเร็จ: bcrypt.hash(new) → update password_hash",
        "ไม่ invalidate session ปัจจุบัน (อยู่ login ต่อได้)",
        "password_hash ห้ามส่งไป frontend เด็ดขาด",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// EXPORT & LOOKUP
// ════════════════════════════════════════════════════

// ════════════════════════════════════════════════════
// LINE Message Templates + System Settings Flow
// ════════════════════════════════════════════════════

const lineMessageTemplatesFlow: PageFlowData = {
  pageId: "line-message-templates",
  menuName: "LINE OA & การแจ้งเตือน",
  menuNameEn: "LINE OA & Notifications",
  path: "/web/settings/line-message-templates",
  summary: "ตั้งค่า LINE OA, Flex Message Templates, Email Templates และ Approval Timeout",
  flowcharts: [
    {
      id: "lmt-flex-edit",
      title: "การแก้ไข Flex Message Template",
      titleEn: "Edit Flex Message Template",
      steps: [
        { id: "s1", label: "Admin เลือก State\n(Visitor/Officer Flow)", type: "start" },
        { id: "s2", label: "แก้ไข Header\n(title, color, variant)", type: "process" },
        { id: "s3", label: "แก้ไข Body Rows\n(เปิด/ปิด, เรียงลำดับ)", type: "process" },
        { id: "s4", label: "แก้ไข Buttons\n(label, variant, เปิด/ปิด)", type: "process" },
        { id: "s5", label: "แก้ไข Info Box & QR\n(ข้อความ, สี)", type: "process" },
        { id: "s6", label: "ดู Live Preview", type: "subprocess" },
        { id: "s7", label: "กดบันทึก", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4" },
        { from: "s4", to: "s5" },
        { from: "s5", to: "s6" },
        { from: "s6", to: "s7" },
      ],
    },
    {
      id: "lmt-auto-cancel",
      title: "Auto-Cancel Flow (Approval Timeout)",
      titleEn: "Automatic Cancellation Flow",
      description: "นัดหมายที่รอ approval เกิน X ชั่วโมง → ยกเลิกอัตโนมัติ + แจ้ง visitor ทาง LINE",
      steps: [
        { id: "a1", label: "Cron Job ทำงาน\n(ทุก 1 ชั่วโมง)", type: "start" },
        { id: "a2", label: "ดึง appointments\nstatus = pending", type: "process" },
        { id: "a3", label: "pending > timeout?", type: "decision" },
        { id: "a4", label: "PATCH status\n→ auto-cancelled", type: "process" },
        { id: "a5", label: "ดึง Flex Template\n(visitor-auto-cancelled)", type: "process" },
        { id: "a6", label: "แทนที่ {{variables}}\nส่ง LINE Push Message", type: "io" },
        { id: "a7", label: "ส่ง Email\n(ถ้าเปิดใช้งาน)", type: "io" },
        { id: "a8", label: "Log notification", type: "end" },
        { id: "a9", label: "ข้ามรายการนี้", type: "end" },
      ],
      connections: [
        { from: "a1", to: "a2" },
        { from: "a2", to: "a3" },
        { from: "a3", to: "a4", label: "ใช่" },
        { from: "a3", to: "a9", label: "ไม่" },
        { from: "a4", to: "a5" },
        { from: "a5", to: "a6" },
        { from: "a6", to: "a7" },
        { from: "a7", to: "a8" },
      ],
    },
  ],
  validationRules: [
    { field: "approval_timeout_hours", rules: ["ต้อง > 0 และ ≤ 168 (7 วัน)", "เป็นจำนวนเต็ม"] },
    { field: "header_title", rules: ["ต้องไม่ว่าง (สำหรับ flex type)"] },
    { field: "email subject", rules: ["ต้องไม่ว่าง", "รองรับ {{variables}}"] },
    { field: "email body_th", rules: ["ต้องไม่ว่าง"] },
    { field: "LINE OA Config", rules: ["Channel ID, Secret, Access Token ต้องกรอกก่อนเปิดใช้งาน"] },
  ],
  businessConditions: [
    { title: "Flex Message Delivery", description: "Flex Message จะส่งเฉพาะเมื่อ template.is_active = true", conditions: ["template.is_active = true", "visitor.line_user_id IS NOT NULL"] },
    { title: "Auto-Cancel Logic", description: "ยกเลิกอัตโนมัติเมื่อรออนุมัติเกินกำหนด", conditions: ["pending_hours > approval_timeout_hours", "OR (auto_cancel_on_date_passed AND date < TODAY)"] },
    { title: "Email Delivery", description: "Email จะส่งเมื่อระบบเปิดและ template active", conditions: ["email_active = true", "template.is_active = true", "visitor.email IS NOT NULL"] },
    { title: "Fallback Channel", description: "ถ้า visitor ไม่ได้ผูก LINE → ส่ง Email แทน", conditions: ["visitor.line_user_id IS NULL", "visitor.email IS NOT NULL"] },
  ],
};

export const allFlowData: PageFlowData[] = [
  visitPurposesFlow,
  documentTypesFlow,
  locationsFlow,
  notificationTemplatesFlow,
  servicePointsFlow,
  staffFlow,
  businessHoursFlow,
  visitSlipsFlow,
  approverGroupsFlow,
  accessZonesFlow,
  pdpaConsentFlow,
  appointmentsFlow,
  searchFlow,
  blocklistFlow,
  reportsFlow,
  userManagementFlow,
  myProfileFlow,
  lineMessageTemplatesFlow,
];

export function getFlowByPageId(pageId: string): PageFlowData | undefined {
  return allFlowData.find((f) => f.pageId === pageId);
}
