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
  summary: "จัดการ Visit Slip (Thermal 80mm) — ตั้งค่า Section, เปิด/ปิด Field, แก้ไข Label, Live Preview, และสลิปพิมพ์จาก Kiosk",
  flowcharts: [
    {
      id: "vs-section-edit",
      title: "การแก้ไข Section & Field บนสลิป",
      titleEn: "Section & Field Configuration Flow",
      description: "ขั้นตอนการปรับแต่ง Visit Slip ผ่าน Section Editor + Live Preview",
      steps: [
        { id: "s1", label: "เปิดหน้า Visit Slip Editor", type: "start" },
        { id: "s2", label: "แสดง 9 Sections\n(Header, SlipNo, Visitor,\nHost, Time, Extras, WiFi,\nQR, Footer)", type: "process" },
        { id: "s3", label: "Toggle Section\nเปิด/ปิด", type: "subprocess" },
        { id: "s4", label: "Expand Section\nดู Fields ภายใน", type: "process" },
        { id: "s5", label: "Toggle Field\nเปิด/ปิด", type: "subprocess" },
        { id: "s6", label: "Field editable?", type: "decision" },
        { id: "s7", label: "แก้ไข Label (TH)\nInline Edit", type: "process" },
        { id: "s8", label: "Live Preview อัปเดต\n(Thermal 80mm / 302px)", type: "io" },
        { id: "s9", label: "กดบันทึก", type: "end" },
      ],
      connections: [
        { from: "s1", to: "s2" },
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
  summary: "จัดการข้อความ PDPA 2 ภาษา — แก้ไขนโยบาย, ตั้งค่า retention, และบันทึก consent ของผู้เยี่ยมบน Kiosk",
  flowcharts: [
    {
      id: "pdpa-config-edit",
      title: "การแก้ไขนโยบาย PDPA",
      titleEn: "PDPA Config Edit Flow",
      description: "ขั้นตอนเมื่อ Admin แก้ไขข้อความ PDPA บนหน้าตั้งค่า",
      steps: [
        { id: "c1", label: "เปิดหน้า PDPA Settings", type: "start" },
        { id: "c2", label: "เลือกภาษา\n(TH / EN Tab)", type: "process" },
        { id: "c3", label: "แก้ไขเนื้อหานโยบาย\n(Textarea)", type: "process" },
        { id: "c4", label: "ตั้งค่า Retention Days\n(จำนวนวันเก็บข้อมูล)", type: "process" },
        { id: "c5", label: "ตั้งค่า Require Scroll\n(ต้องเลื่อนอ่านก่อน)", type: "process" },
        { id: "c6", label: "ดู Preview บน Kiosk?", type: "decision" },
        { id: "c7", label: "แสดง Preview\n(จำลอง Kiosk UI)", type: "io" },
        { id: "c8", label: "กดบันทึก", type: "process" },
        { id: "c9", label: "สร้าง Version ใหม่\n(pdpa_consent_versions)", type: "subprocess" },
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
      title: "การแสดง PDPA บน Kiosk (Runtime)",
      titleEn: "PDPA Consent Capture on Kiosk",
      description: "Flow เมื่อผู้เยี่ยมเห็น PDPA บน Kiosk และยอมรับ",
      steps: [
        { id: "k1", label: "ผู้เยี่ยมถึงขั้นตอน PDPA\n(Kiosk Flow)", type: "start" },
        { id: "k2", label: "ดึง Config ล่าสุด\n(pdpa_consent_configs)", type: "process" },
        { id: "k3", label: "แสดงข้อความนโยบาย\n(ตามภาษาที่เลือก)", type: "io" },
        { id: "k4", label: "Require Scroll?", type: "decision" },
        { id: "k5", label: "รอเลื่อนอ่านจนจบ\n(Checkbox ถูกล็อก)", type: "process" },
        { id: "k6", label: "Checkbox เปิดให้กด", type: "process" },
        { id: "k7", label: "ผู้เยี่ยมกด✓ ยอมรับ", type: "process" },
        { id: "k8", label: "กดปุ่ม\n\"ยอมรับและดำเนินการต่อ\"", type: "process" },
        { id: "k9", label: "บันทึก Consent Log\n(pdpa_consent_logs)", type: "subprocess" },
        { id: "k10", label: "คำนวณ expires_at\n(+retention_days)", type: "process" },
        { id: "k11", label: "ดำเนินการต่อ\n(ขั้นตอนถัดไป)", type: "end" },
      ],
      connections: [
        { from: "k1", to: "k2" },
        { from: "k2", to: "k3" },
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
  ],
  businessConditions: [
    {
      title: "Version Control",
      titleEn: "PDPA Version History",
      description: "ทุกครั้งที่แก้ไขข้อความ PDPA จะสร้าง Version ใหม่อัตโนมัติ",
      conditions: [
        "เวอร์ชันปัจจุบัน → pdpa_consent_configs.version",
        "ประวัติทุกเวอร์ชัน → pdpa_consent_versions (audit trail)",
        "Consent Log อ้างอิงเวอร์ชันที่ผู้เยี่ยมยินยอม ณ ขณะนั้น",
        "หากข้อความเปลี่ยน → ผู้เยี่ยมใหม่จะเห็นเวอร์ชันล่าสุดเสมอ",
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
      title: "Kiosk Display",
      titleEn: "Kiosk PDPA Display Behavior",
      description: "พฤติกรรมการแสดง PDPA บนหน้าจอ Kiosk",
      conditions: [
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
        "ไม่สร้าง version ใหม่จนกว่าจะกดบันทึก",
      ],
    },
  ],
};

// ════════════════════════════════════════════════════
// EXPORT & LOOKUP
// ════════════════════════════════════════════════════

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
];

export function getFlowByPageId(pageId: string): PageFlowData | undefined {
  return allFlowData.find((f) => f.pageId === pageId);
}
