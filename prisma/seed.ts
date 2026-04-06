import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting eVMS database seed...\n");

  await prisma.$transaction(async (tx) => {
    // ── Clear existing data (reverse dependency order) ──────────────
    console.log("🗑️  Clearing existing data...");

    // --- New entity clears (reverse dependency order) ---
    await tx.blocklistCheckLog.deleteMany();
    await tx.blocklist.deleteMany();
    await tx.pdpaConsentLog.deleteMany();
    await tx.pdpaConsentVersion.deleteMany();
    await tx.pdpaConsentConfig.deleteMany();
    await tx.lineOaConfig.deleteMany();
    await tx.emailConfig.deleteMany();
    await tx.notificationTemplateVariable.deleteMany();
    await tx.notificationTemplate.deleteMany();
    await tx.visitSlipField.deleteMany();
    await tx.visitSlipSection.deleteMany();
    await tx.purposeSlipMapping.deleteMany();
    await tx.visitSlipTemplate.deleteMany();
    await tx.counterStaffAssignment.deleteMany();
    await tx.servicePointDocument.deleteMany();
    await tx.servicePointPurpose.deleteMany();
    await tx.servicePoint.deleteMany();
    await tx.documentTypeVisitType.deleteMany();
    await tx.documentType.deleteMany();
    await tx.visitPurposeChannelDocument.deleteMany();
    await tx.visitPurposeChannelConfig.deleteMany();
    await tx.identityDocumentType.deleteMany();
    await tx.businessHoursRule.deleteMany();
    await tx.approverGroupNotifyChannel.deleteMany();
    await tx.approverGroupPurpose.deleteMany();
    await tx.approverGroupMember.deleteMany();
    await tx.approverGroup.deleteMany();
    await tx.accessZone.deleteMany();
    await tx.floorDepartment.deleteMany();
    await tx.floor.deleteMany();
    await tx.building.deleteMany();
    await tx.visitPurposeChannelDocument.deleteMany();
    await tx.visitPurposeChannelConfig.deleteMany();
    await tx.visitPurposeDepartmentRule.deleteMany();

    // --- Original entity clears ---
    await tx.systemSetting.deleteMany();
    await tx.appointmentGroupDaySchedule.deleteMany();
    await tx.appointmentGroup.deleteMany();
    await tx.visitEntry.deleteMany();
    await tx.appointmentEquipment.deleteMany();
    await tx.appointmentCompanion.deleteMany();
    await tx.appointmentStatusLog.deleteMany();
    await tx.appointment.deleteMany();
    await tx.visitRecord.deleteMany();
    await tx.visitor.deleteMany();
    await tx.visitPurpose.deleteMany();
    await tx.userAccount.deleteMany();
    await tx.staff.deleteMany();
    await tx.department.deleteMany();

    console.log("✅ Existing data cleared.\n");

    // ── 1. Departments ──────────────────────────────────────────────
    console.log("📂 Seeding departments...");

    await tx.department.createMany({
      data: [
        { id: 1, name: "สำนักงานปลัดกระทรวง", nameEn: "Office of the Permanent Secretary", isActive: true },
        { id: 2, name: "กองกลาง", nameEn: "General Administration Division", isActive: true },
        { id: 3, name: "กองการต่างประเทศ", nameEn: "International Affairs Division", isActive: true },
        { id: 4, name: "กองกิจการท่องเที่ยว", nameEn: "Tourism Affairs Division", isActive: true },
        { id: 5, name: "กรมการท่องเที่ยว", nameEn: "Department of Tourism", isActive: true },
        { id: 6, name: "กรมพลศึกษา", nameEn: "Department of Physical Education", isActive: true },
        { id: 7, name: "การกีฬาแห่งประเทศไทย", nameEn: "Sports Authority of Thailand", isActive: true },
        { id: 8, name: "สำนักนโยบายและแผน", nameEn: "Policy and Planning Division", isActive: true },
        { id: 9, name: "สำนักงานรัฐมนตรี", nameEn: "Minister's Office", isActive: true },
        { id: 10, name: "การท่องเที่ยวแห่งประเทศไทย", nameEn: "Tourism Authority of Thailand", isActive: true },
        { id: 11, name: "มหาวิทยาลัยการกีฬาแห่งชาติ", nameEn: "National Sports University", isActive: true },
        { id: 12, name: "กองบัญชาการตำรวจท่องเที่ยว", nameEn: "Tourist Police Bureau", isActive: true },
        { id: 13, name: "องค์การบริหารการพัฒนาพื้นที่พิเศษเพื่อการท่องเที่ยวอย่างยั่งยืน (อพท.)", nameEn: "DASTA", isActive: true },
      ],
    });

    console.log("✅ 13 departments seeded.\n");

    // ── 2. Staff ────────────────────────────────────────────────────
    console.log("👤 Seeding staff...");

    await tx.staff.createMany({
      data: [
        { id: 1, employeeId: "EMP-001", name: "คุณสมศรี รักงาน", nameEn: "Somsri Rakngarn", position: "ผู้อำนวยการกองกิจการท่องเที่ยว", departmentId: 4, email: "somsri.r@mots.go.th", phone: "02-283-1500", role: "staff", status: "active" },
        { id: 2, employeeId: "EMP-002", name: "คุณประเสริฐ ศรีวิโล", nameEn: "Prasert Srivilo", position: "หัวหน้ากลุ่มงานบริหารทั่วไป", departmentId: 2, email: "prasert.s@mots.go.th", phone: "02-283-1501", role: "staff", status: "active" },
        { id: 3, employeeId: "EMP-003", name: "คุณกมลพร วงศ์สวัสดิ์", nameEn: "Kamonporn Wongsawad", position: "ผู้เชี่ยวชาญด้านต่างประเทศ", departmentId: 3, email: "kamonporn.w@mots.go.th", phone: "02-283-1502", role: "staff", status: "active" },
        { id: 4, employeeId: "EMP-004", name: "คุณวิภาดา ชัยมงคล", nameEn: "Wipada Chaimongkol", position: "นักวิเคราะห์นโยบายและแผน", departmentId: 8, email: "wipada.c@mots.go.th", phone: "02-283-1503", role: "staff", status: "active" },
        { id: 5, employeeId: "EMP-005", name: "คุณอนันต์ มั่นคง", nameEn: "Anan Mankong", position: "ผู้ดูแลระบบ", departmentId: 1, email: "anan.m@mots.go.th", phone: "02-283-1504", role: "admin", status: "active" },
        { id: 6, employeeId: "SEC-001", name: "คุณสมชาย ปลอดภัย", nameEn: "Somchai Plodpai", position: "เจ้าหน้าที่รักษาความปลอดภัย", departmentId: 2, email: "somchai.p@mots.go.th", phone: "02-283-1510", role: "security", status: "active", shift: "morning" },
        { id: 7, employeeId: "EMP-006", name: "คุณธนพล จิตรดี", nameEn: "Thanapon Jitdee", position: "นักวิชาการท่องเที่ยว", departmentId: 5, email: "thanapon.j@mots.go.th", phone: "02-283-1505", role: "staff", status: "active" },
        { id: 8, employeeId: "EMP-007", name: "คุณปิยะนุช สุขใจ", nameEn: "Piyanuch Sukjai", position: "เจ้าหน้าที่บริหารงานทั่วไป", departmentId: 6, email: "piyanuch.s@mots.go.th", phone: "02-283-1506", role: "staff", status: "active" },
        { id: 9, employeeId: "EMP-008", name: "คุณนภดล เรืองศักดิ์", nameEn: "Noppadon Ruangsak", position: "นักจัดการงานทั่วไป", departmentId: 1, email: "noppadon.r@mots.go.th", phone: "02-283-1507", role: "staff", status: "inactive" },
        { id: 10, employeeId: "SEC-002", name: "คุณชัยวัฒน์ กล้าหาญ", nameEn: "Chaiwat Klahan", position: "เจ้าหน้าที่รักษาความปลอดภัย", departmentId: 2, email: "chaiwat.k@mots.go.th", phone: "02-283-1511", role: "security", status: "inactive", shift: "night" },
        { id: 11, employeeId: "SEC-003", name: "คุณวิรัตน์ เก่งกาจ", nameEn: "Wirat Kengkaj", position: "เจ้าหน้าที่รักษาความปลอดภัย", departmentId: 2, email: "wirat.k@mots.go.th", phone: "02-283-1512", role: "security", status: "active", shift: "morning" },
        { id: 12, employeeId: "SEC-004", name: "คุณประยุทธ์ แก้วมั่นคง", nameEn: "Prayut Kaewmankong", position: "เจ้าหน้าที่รักษาความปลอดภัย", departmentId: 2, email: "prayut.k@mots.go.th", phone: "02-283-1513", role: "security", status: "active", shift: "afternoon" },
      ],
    });

    console.log("✅ 12 staff members seeded.\n");

    // ── 3. User Accounts ────────────────────────────────────────────
    console.log("🔐 Seeding user accounts...");

    const adminHash = bcrypt.hashSync("admin1234", 10);
    const passHash = bcrypt.hashSync("pass1234", 10);

    await tx.userAccount.createMany({
      data: [
        { id: 1, username: "admin", email: "admin@mots.go.th", passwordHash: adminHash, role: "admin", firstName: "อนันต์", lastName: "มั่นคง", userType: "staff", refId: 5 },
        { id: 2, username: "prawit.s", email: "prawit.s@mots.go.th", passwordHash: passHash, role: "supervisor", firstName: "ประเสริฐ", lastName: "ศรีวิโล", userType: "staff", refId: 2 },
        { id: 3, username: "somsri.r", email: "somsri.r@mots.go.th", passwordHash: passHash, role: "staff", firstName: "สมศรี", lastName: "รักงาน", userType: "staff", refId: 1 },
        { id: 4, username: "somchai.p", email: "somchai.p@mots.go.th", passwordHash: passHash, role: "security", firstName: "สมชาย", lastName: "ปลอดภัย", userType: "staff", refId: 6 },
        { id: 5, username: "wichai.m", email: "wichai@siamtech.co.th", passwordHash: passHash, role: "visitor", firstName: "วิชัย", lastName: "มั่นคง", userType: "visitor", refId: 1 },
      ],
    });

    console.log("✅ 5 user accounts seeded.\n");

    // ── 4. Visitors ─────────────────────────────────────────────────
    console.log("🧑‍💼 Seeding visitors...");

    await tx.visitor.createMany({
      data: [
        { id: 1, firstName: "วิชัย", lastName: "มั่นคง", firstNameEn: "Wichai", lastNameEn: "Mankong", name: "นายวิชัย มั่นคง", nameEn: "Wichai Mankong", idNumber: "1-3045-00123-45-6", idType: "thai-id", company: "บริษัท ทัวร์ไทย จำกัด", phone: "081-234-5678", email: "wichai@tourthai.co.th", lineUserId: "U1234567890", nationality: "ไทย", isBlocked: false },
        { id: 2, firstName: "อัญชลี", lastName: "แสงทอง", firstNameEn: "Anchalee", lastNameEn: "Saengthong", name: "นางอัญชลี แสงทอง", nameEn: "Anchalee Saengthong", idNumber: "1-1234-56789-01-2", idType: "thai-id", company: "สมาคมส่งเสริมการท่องเที่ยวไทย", phone: "089-876-5432", email: "anchalee@tat.or.th", lineUserId: "U0987654321", nationality: "ไทย", isBlocked: false },
        { id: 3, firstName: "James", lastName: "Wilson", firstNameEn: "James", lastNameEn: "Wilson", name: "Mr. James Wilson", nameEn: "James Wilson", idNumber: "AB1234567", idType: "passport", company: "World Tourism Organization", phone: "+66-92-345-6789", email: "james.wilson@unwto.org", nationality: "American", isBlocked: false },
        { id: 4, firstName: "ธนพล", lastName: "สุขสำราญ", firstNameEn: "Thanapol", lastNameEn: "Suksamran", name: "นายธนพล สุขสำราญ", nameEn: "Thanapol Suksamran", idNumber: "3-5678-01234-56-7", idType: "thai-id", company: "บริษัท ก่อสร้างเอก จำกัด", phone: "086-111-2222", email: "thanapol@ekconstruction.com", nationality: "ไทย", isBlocked: false },
        { id: 5, firstName: "พิมพ์ใจ", lastName: "รุ่งเรือง", firstNameEn: "Pimjai", lastNameEn: "Rungreung", name: "นางสาวพิมพ์ใจ รุ่งเรือง", nameEn: "Pimjai Rungreung", idNumber: "1-2345-67890-12-3", idType: "thai-id", company: "สำนักข่าว Thai PBS", phone: "083-333-4444", email: "pimjai@thaipbs.or.th", lineUserId: "U5555555555", nationality: "ไทย", isBlocked: false },
        { id: 6, firstName: "สุรศักดิ์", lastName: "อันตราย", firstNameEn: "Surasak", lastNameEn: "Antarai", name: "นายสุรศักดิ์ อันตราย", nameEn: "Surasak Antarai", idNumber: "1-9876-54321-09-8", idType: "thai-id", company: "-", phone: "099-999-0000", nationality: "ไทย", isBlocked: true },
        { id: 7, firstName: "Yuki", lastName: "Tanaka", firstNameEn: "Yuki", lastNameEn: "Tanaka", name: "Ms. Yuki Tanaka", nameEn: "Yuki Tanaka", idNumber: "TK8901234", idType: "passport", company: "Japan National Tourism Organization", phone: "+66-95-678-9012", email: "yuki.tanaka@jnto.go.jp", nationality: "Japanese", isBlocked: false },
        { id: 8, firstName: "พิพัฒน์", lastName: "เจริญกิจ", firstNameEn: "Pipat", lastNameEn: "Charoenkij", name: "นายพิพัฒน์ เจริญกิจ", nameEn: "Pipat Charoenkij", idNumber: "1-4567-89012-34-5", idType: "thai-id", company: "บริษัท ไอที โซลูชั่น จำกัด", phone: "084-555-6666", email: "pipat@itsolution.co.th", nationality: "ไทย", isBlocked: false },
      ],
    });

    console.log("✅ 8 visitors seeded.\n");

    // ── 5. Visit Purposes ───────────────────────────────────────────
    console.log("🎯 Seeding visit purposes...");

    await tx.visitPurpose.createMany({
      data: [
        { id: 1, name: "ติดต่อราชการ", nameEn: "Official Business", icon: "🏛️", isActive: true, sortOrder: 1, showOnLine: true, showOnWeb: true, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single,period" },
        { id: 2, name: "ประชุม / สัมมนา", nameEn: "Meeting / Seminar", icon: "📋", isActive: true, sortOrder: 2, showOnLine: true, showOnWeb: true, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single,period" },
        { id: 3, name: "ส่งเอกสาร / พัสดุ", nameEn: "Document / Parcel Delivery", icon: "📄", isActive: true, sortOrder: 3, showOnLine: true, showOnWeb: true, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single" },
        { id: 4, name: "ผู้รับเหมา / ซ่อมบำรุง", nameEn: "Contractor / Maintenance", icon: "🔧", isActive: true, sortOrder: 4, showOnLine: false, showOnWeb: false, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single,period" },
        { id: 5, name: "สมัครงาน / สัมภาษณ์", nameEn: "Job Application / Interview", icon: "💼", isActive: true, sortOrder: 5, showOnLine: true, showOnWeb: true, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single" },
        { id: 6, name: "เยี่ยมชม / ศึกษาดูงาน", nameEn: "Study Visit / Tour", icon: "🎓", isActive: true, sortOrder: 6, showOnLine: true, showOnWeb: true, showOnKiosk: false, showOnCounter: true, allowedEntryModes: "single,period" },
        { id: 7, name: "รับ-ส่งสินค้า", nameEn: "Delivery / Pickup", icon: "📦", isActive: true, sortOrder: 7, showOnLine: false, showOnWeb: false, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single" },
        { id: 8, name: "อื่นๆ", nameEn: "Other", icon: "🔖", isActive: false, sortOrder: 8, showOnLine: true, showOnWeb: true, showOnKiosk: true, showOnCounter: true, allowedEntryModes: "single" },
      ],
    });

    console.log("✅ 8 visit purposes seeded.\n");

    // ── 6. System Settings ──────────────────────────────────────────
    console.log("⚙️  Seeding system settings...");

    await tx.systemSetting.createMany({
      data: [
        { key: "approval_timeout_hours", value: "24", description: "Hours before unapproved appointments auto-expire" },
        { key: "auto_cancel_enabled", value: "true", description: "Enable automatic cancellation of expired appointments" },
        { key: "auto_checkout_enabled", value: "true", description: "Enable automatic checkout for overstay visitors" },
      ],
    });

    console.log("✅ 3 system settings seeded.\n");

    // ── 7. Appointments ─────────────────────────────────────────────
    console.log("📅 Seeding appointments...");

    const today = new Date();
    const d = (daysOffset: number) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + daysOffset);
      return dt;
    };
    const time = (h: number, m: number = 0) => new Date(1970, 0, 1, h, m, 0);

    await tx.appointment.createMany({
      data: [
        // 1 — approved, official, visitor 1 → host 1 (dept 4)
        {
          id: 1, bookingCode: "eVMS-APT-0001", visitorId: 1, hostStaffId: 1, visitPurposeId: 1, departmentId: 4,
          type: "official", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(9, 0), timeEnd: time(10, 30),
          purpose: "หารือแนวทางส่งเสริมการท่องเที่ยวเชิงนิเวศ", companionsCount: 0,
          createdBy: "visitor", offerWifi: true,
          area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4", room: "ห้องประชุม 1",
          approvedBy: 1, approvedAt: d(-1),
        },
        // 2 — approved, meeting, visitor 2 → host 2 (dept 2)
        {
          id: 2, bookingCode: "eVMS-APT-0002", visitorId: 2, hostStaffId: 2, visitPurposeId: 2, departmentId: 2,
          type: "meeting", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(10, 0), timeEnd: time(11, 0),
          purpose: "ประชุมเตรียมงานมหกรรมท่องเที่ยวนานาชาติ", companionsCount: 2,
          createdBy: "visitor", offerWifi: true,
          area: "กองกลาง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 2", room: "ห้องประชุมใหญ่",
          approvedBy: 2, approvedAt: d(-2),
        },
        // 3 — approved, official, visitor 3 (foreigner) → host 3 (dept 3)
        {
          id: 3, bookingCode: "eVMS-APT-0003", visitorId: 3, hostStaffId: 3, visitPurposeId: 1, departmentId: 3,
          type: "official", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(13, 0), timeEnd: time(14, 30),
          purpose: "Discuss bilateral tourism cooperation agreement", companionsCount: 1,
          createdBy: "staff", createdByStaffId: 3, offerWifi: true,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5",
          approvedBy: 3, approvedAt: d(-2),
        },
        // 4 — pending, contractor, visitor 4 → host 2 (dept 2), period
        {
          id: 4, bookingCode: "eVMS-APT-0004", visitorId: 4, hostStaffId: 2, visitPurposeId: 4, departmentId: 2,
          type: "contractor", status: "pending", entryMode: "period",
          dateStart: d(0), dateEnd: d(4), timeStart: time(8, 0), timeEnd: time(17, 0),
          purpose: "สำรวจพื้นที่ซ่อมแซมห้องประชุมชั้น 3", companionsCount: 3,
          createdBy: "staff", createdByStaffId: 2,
          area: "กองกลาง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
        },
        // 5 — pending, official, visitor 5 → host 4 (dept 8)
        {
          id: 5, bookingCode: "eVMS-APT-0005", visitorId: 5, hostStaffId: 4, visitPurposeId: 1, departmentId: 8,
          type: "official", status: "pending", entryMode: "single",
          dateStart: d(1), timeStart: time(10, 0), timeEnd: time(11, 30),
          purpose: "สัมภาษณ์ผู้บริหารเรื่องแผนส่งเสริมท่องเที่ยวปี 2570", companionsCount: 1,
          createdBy: "visitor",
          area: "สำนักนโยบายและแผน", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
        },
        // 6 — approved, official (confirmed today), visitor 1 → host 1 (dept 4)
        {
          id: 6, bookingCode: "eVMS-APT-0006", visitorId: 1, hostStaffId: 1, visitPurposeId: 1, departmentId: 4,
          type: "official", status: "confirmed", entryMode: "single",
          dateStart: d(0), timeStart: time(9, 0), timeEnd: time(10, 0),
          purpose: "ติดตามผลโครงการท่องเที่ยวชุมชน", companionsCount: 0,
          createdBy: "visitor", offerWifi: true,
          area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          approvedBy: 1, approvedAt: d(-1),
        },
        // 7 — approved, meeting, period (past, completed), visitor 7 → host 3 (dept 3)
        {
          id: 7, bookingCode: "eVMS-APT-0007", visitorId: 7, hostStaffId: 3, visitPurposeId: 2, departmentId: 3,
          type: "meeting", status: "approved", entryMode: "period",
          dateStart: d(-3), dateEnd: d(-1), timeStart: time(9, 0), timeEnd: time(17, 0),
          purpose: "Workshop on Japan-Thailand tourism exchange program", companionsCount: 0,
          createdBy: "staff", createdByStaffId: 3, offerWifi: true,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 2",
          approvedBy: 3, approvedAt: d(-5),
        },
        // 8 — rejected, visitor 5
        {
          id: 8, bookingCode: "eVMS-APT-0008", visitorId: 5, hostStaffId: 4, visitPurposeId: 6, departmentId: 8,
          type: "other", status: "rejected", entryMode: "single",
          dateStart: d(2), timeStart: time(14, 0), timeEnd: time(15, 0),
          purpose: "เยี่ยมชมสำนักงาน", companionsCount: 0,
          createdBy: "visitor",
          area: "สำนักนโยบายและแผน", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          rejectedAt: d(-1), rejectedReason: "ไม่ตรงตามวัตถุประสงค์",
        },
        // 9 — confirmed, contractor, visitor 8 → host 5 (dept 1)
        {
          id: 9, bookingCode: "eVMS-APT-0009", visitorId: 8, hostStaffId: 5, visitPurposeId: 4, departmentId: 1,
          type: "contractor", status: "confirmed", entryMode: "single",
          dateStart: d(0), timeStart: time(8, 30), timeEnd: time(12, 0),
          purpose: "ติดตั้งระบบเครือข่ายชั้น 3", companionsCount: 1,
          createdBy: "staff", createdByStaffId: 5,
          area: "สำนักงานปลัดกระทรวง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
          approvedBy: 5, approvedAt: d(-2),
        },
        // 10 — approved, meeting, visitor 2 → host 4 (dept 8)
        {
          id: 10, bookingCode: "eVMS-APT-0010", visitorId: 2, hostStaffId: 4, visitPurposeId: 2, departmentId: 8,
          type: "meeting", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(9, 30), timeEnd: time(11, 0),
          purpose: "หารือแผนนโยบายการท่องเที่ยวปี 2570", companionsCount: 0,
          createdBy: "visitor",
          area: "สำนักนโยบายและแผน", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          approvedBy: 4, approvedAt: d(-1),
        },
        // 11 — approved, contractor, period, visitor 4 → host 8 (dept 6)
        {
          id: 11, bookingCode: "eVMS-APT-0011", visitorId: 4, hostStaffId: 8, visitPurposeId: 4, departmentId: 6,
          type: "contractor", status: "approved", entryMode: "period",
          dateStart: d(-1), dateEnd: d(1), timeStart: time(8, 0), timeEnd: time(17, 0),
          purpose: "ซ่อมบำรุงระบบปรับอากาศ ชั้น 7", companionsCount: 2,
          createdBy: "staff", createdByStaffId: 8,
          area: "กรมพลศึกษา", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 7",
          approvedBy: 8, approvedAt: d(-3),
        },
        // 12 — approved, meeting, visitor 7 → host 3 (dept 3)
        {
          id: 12, bookingCode: "eVMS-APT-0012", visitorId: 7, hostStaffId: 3, visitPurposeId: 2, departmentId: 3,
          type: "meeting", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(13, 30), timeEnd: time(15, 0),
          purpose: "ติดตามความร่วมมือท่องเที่ยวญี่ปุ่น-ไทย", companionsCount: 0,
          createdBy: "visitor", offerWifi: true,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 2",
          approvedBy: 3, approvedAt: d(-1),
        },
        // 13 — approved, official, visitor 5 → host 1 (dept 4)
        {
          id: 13, bookingCode: "eVMS-APT-0013", visitorId: 5, hostStaffId: 1, visitPurposeId: 1, departmentId: 4,
          type: "official", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(8, 0), timeEnd: time(9, 0),
          purpose: "ส่งมอบเอกสารผลวิจัยท่องเที่ยว", companionsCount: 1,
          createdBy: "visitor",
          area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          approvedBy: 1, approvedAt: d(-2),
        },
        // 14 — approved, document, visitor 3 → host 7 (dept 5)
        {
          id: 14, bookingCode: "eVMS-APT-0014", visitorId: 3, hostStaffId: 7, visitPurposeId: 3, departmentId: 5,
          type: "document", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(9, 0), timeEnd: time(10, 0),
          purpose: "Submit tourism survey results report", companionsCount: 1,
          createdBy: "staff", createdByStaffId: 7,
          area: "กรมการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 6",
          approvedBy: 7, approvedAt: d(-2),
        },
        // 15 — cancelled
        {
          id: 15, bookingCode: "eVMS-APT-0015", visitorId: 1, hostStaffId: 4, visitPurposeId: 2, departmentId: 8,
          type: "meeting", status: "cancelled", entryMode: "single",
          dateStart: d(0), timeStart: time(15, 0), timeEnd: time(16, 0),
          purpose: "ประชุมติดตามแผนงาน (ยกเลิก)", companionsCount: 0,
          createdBy: "visitor",
          area: "สำนักนโยบายและแผน", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
        },
        // 16 — approved, document, visitor 1 → host 7 (dept 5)
        {
          id: 16, bookingCode: "eVMS-APT-0016", visitorId: 1, hostStaffId: 7, visitPurposeId: 3, departmentId: 5,
          type: "document", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(7, 30), timeEnd: time(8, 30),
          purpose: "ส่งรายงานท่องเที่ยวประจำเดือน", companionsCount: 0,
          createdBy: "visitor",
          area: "กรมการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 6",
          approvedBy: 7, approvedAt: d(-1),
        },
        // 17 — approved, delivery, visitor 8 → host 5 (dept 1)
        {
          id: 17, bookingCode: "eVMS-APT-0017", visitorId: 8, hostStaffId: 5, visitPurposeId: 7, departmentId: 1,
          type: "delivery", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(14, 0), timeEnd: time(15, 0),
          purpose: "ส่งอุปกรณ์เครือข่ายเพิ่มเติม", companionsCount: 0,
          createdBy: "visitor",
          area: "สำนักงานปลัดกระทรวง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
          approvedBy: 5, approvedAt: d(-1),
        },
        // 18 — pending, meeting, visitor 2 → host 1 (dept 4)
        {
          id: 18, bookingCode: "eVMS-APT-0018", visitorId: 2, hostStaffId: 1, visitPurposeId: 2, departmentId: 4,
          type: "meeting", status: "pending", entryMode: "single",
          dateStart: d(2), timeStart: time(10, 0), timeEnd: time(12, 0),
          purpose: "ประชุมคณะทำงานส่งเสริมการท่องเที่ยว", companionsCount: 0,
          createdBy: "visitor",
          area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4", room: "ห้องประชุม 1",
        },
        // 19 — approved, document, visitor 5 → host 4 (dept 8)
        {
          id: 19, bookingCode: "eVMS-APT-0019", visitorId: 5, hostStaffId: 4, visitPurposeId: 3, departmentId: 8,
          type: "document", status: "approved", entryMode: "single",
          dateStart: d(0), timeStart: time(14, 30), timeEnd: time(15, 30),
          purpose: "ส่งเอกสารแผนยุทธศาสตร์ท่องเที่ยว 5 ปี", companionsCount: 0,
          createdBy: "visitor",
          area: "สำนักนโยบายและแผน", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          approvedBy: 4, approvedAt: d(-1),
        },
        // 20 — confirmed, contractor, visitor 4 → host 5 (dept 1)
        {
          id: 20, bookingCode: "eVMS-APT-0020", visitorId: 4, hostStaffId: 5, visitPurposeId: 4, departmentId: 1,
          type: "contractor", status: "confirmed", entryMode: "single",
          dateStart: d(0), timeStart: time(10, 0), timeEnd: time(12, 0),
          purpose: "ตรวจสอบระบบดับเพลิงประจำปี", companionsCount: 1,
          createdBy: "staff", createdByStaffId: 5,
          area: "สำนักงานปลัดกระทรวง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
          approvedBy: 5, approvedAt: d(-2),
        },
      ],
    });

    console.log("✅ 20 appointments seeded.\n");

    // ── 8. Appointment Companions ───────────────────────────────────
    console.log("👥 Seeding appointment companions...");

    await tx.appointmentCompanion.createMany({
      data: [
        // Appointment 2 — 2 companions
        { appointmentId: 2, firstName: "สุรชัย", lastName: "วิทยา", company: "สมาคมส่งเสริมการท่องเที่ยวไทย", phone: "081-111-2222" },
        { appointmentId: 2, firstName: "ปรียา", lastName: "สุขสวัสดิ์", company: "สมาคมส่งเสริมการท่องเที่ยวไทย", phone: "081-333-4444" },
        // Appointment 3 — 1 companion
        { appointmentId: 3, firstName: "Sarah", lastName: "Johnson", company: "World Tourism Organization", phone: "+66-92-111-2222" },
        // Appointment 4 — 3 companions
        { appointmentId: 4, firstName: "วิทยา", lastName: "ช่างดี", company: "บริษัท ก่อสร้างเอก จำกัด" },
        { appointmentId: 4, firstName: "สุภาพ", lastName: "แข็งแรง", company: "บริษัท ก่อสร้างเอก จำกัด" },
        { appointmentId: 4, firstName: "อดิศร", lastName: "ไฟฟ้า", company: "บริษัท ก่อสร้างเอก จำกัด" },
        // Appointment 5 — 1 companion
        { appointmentId: 5, firstName: "สมชาย", lastName: "ช่างภาพ", company: "สำนักข่าว Thai PBS" },
        // Appointment 9 — 1 companion
        { appointmentId: 9, firstName: "สมหมาย", lastName: "ขับรถ", company: "บริษัท ไอที โซลูชั่น จำกัด" },
        // Appointment 11 — 2 companions
        { appointmentId: 11, firstName: "วิทยา", lastName: "ช่างแอร์", company: "บริษัท ก่อสร้างเอก จำกัด" },
        { appointmentId: 11, firstName: "สุภาพ", lastName: "ช่างไฟ", company: "บริษัท ก่อสร้างเอก จำกัด" },
        // Appointment 13 — 1 companion
        { appointmentId: 13, firstName: "สมชาย", lastName: "ช่างภาพ", company: "สำนักข่าว Thai PBS" },
        // Appointment 14 — 1 companion
        { appointmentId: 14, firstName: "Sarah", lastName: "Johnson", company: "World Tourism Organization" },
        // Appointment 20 — 1 companion
        { appointmentId: 20, firstName: "สุภาพ", lastName: "ช่างตรวจ", company: "บริษัท ก่อสร้างเอก จำกัด" },
      ],
    });

    console.log("✅ 13 appointment companions seeded.\n");

    // ── 9. Appointment Equipment ────────────────────────────────────
    console.log("🔧 Seeding appointment equipment...");

    await tx.appointmentEquipment.createMany({
      data: [
        // Appointment 4
        { appointmentId: 4, name: "กล่องเครื่องมือช่าง", quantity: 2 },
        { appointmentId: 4, name: "บันได้อลูมิเนียม", quantity: 1 },
        // Appointment 5
        { appointmentId: 5, name: "กล้องถ่ายรูป", quantity: 1 },
        { appointmentId: 5, name: "ขาตั้งกล้อง", quantity: 1 },
        // Appointment 9
        { appointmentId: 9, name: "กล่องอุปกรณ์เครือข่าย", quantity: 5 },
        // Appointment 11
        { appointmentId: 11, name: "เครื่องมือซ่อมแอร์", quantity: 1 },
        { appointmentId: 11, name: "อะไหล่", quantity: 3 },
        // Appointment 17
        { appointmentId: 17, name: "Switch Hub", quantity: 2 },
        // Appointment 20
        { appointmentId: 20, name: "เครื่องมือตรวจสอบ", quantity: 1 },
      ],
    });

    console.log("✅ 9 equipment items seeded.\n");

    // ── 10. Appointment Status Logs ─────────────────────────────────
    console.log("📋 Seeding appointment status logs...");

    await tx.appointmentStatusLog.createMany({
      data: [
        // Appointment 1: pending → approved
        { appointmentId: 1, fromStatus: null, toStatus: "pending", changedBy: null, createdAt: d(-3) },
        { appointmentId: 1, fromStatus: "pending", toStatus: "approved", changedBy: 1, createdAt: d(-1) },
        // Appointment 2: pending → approved
        { appointmentId: 2, fromStatus: null, toStatus: "pending", changedBy: null, createdAt: d(-4) },
        { appointmentId: 2, fromStatus: "pending", toStatus: "approved", changedBy: 2, createdAt: d(-2) },
        // Appointment 3: pending → approved
        { appointmentId: 3, fromStatus: null, toStatus: "pending", changedBy: 3, createdAt: d(-4) },
        { appointmentId: 3, fromStatus: "pending", toStatus: "approved", changedBy: 3, createdAt: d(-2) },
        // Appointment 6: pending → approved → confirmed
        { appointmentId: 6, fromStatus: null, toStatus: "pending", changedBy: null, createdAt: d(-3) },
        { appointmentId: 6, fromStatus: "pending", toStatus: "approved", changedBy: 1, createdAt: d(-1) },
        { appointmentId: 6, fromStatus: "approved", toStatus: "confirmed", changedBy: null, createdAt: d(0) },
        // Appointment 8: pending → rejected
        { appointmentId: 8, fromStatus: null, toStatus: "pending", changedBy: null, createdAt: d(-3) },
        { appointmentId: 8, fromStatus: "pending", toStatus: "rejected", changedBy: 4, reason: "ไม่ตรงตามวัตถุประสงค์", createdAt: d(-1) },
        // Appointment 15: pending → cancelled
        { appointmentId: 15, fromStatus: null, toStatus: "pending", changedBy: null, createdAt: d(-2) },
        { appointmentId: 15, fromStatus: "pending", toStatus: "cancelled", changedBy: null, reason: "ผู้นัดหมายยกเลิก", createdAt: d(-1) },
      ],
    });

    console.log("✅ 13 status logs seeded.\n");

    // ── 11. Visit Entries ───────────────────────────────────────────
    console.log("🚪 Seeding visit entries...");

    const todayAt = (h: number, m: number = 0) => {
      const dt = new Date(today);
      dt.setHours(h, m, 0, 0);
      return dt;
    };
    const dayAt = (daysOffset: number, h: number, m: number = 0) => {
      const dt = d(daysOffset);
      dt.setHours(h, m, 0, 0);
      return dt;
    };

    await tx.visitEntry.createMany({
      data: [
        // --- Entries linked to appointments ---
        // 1: checked-in via kiosk (appointment 6)
        {
          id: 1, entryCode: "eVMS-ENTRY-0001", appointmentId: 6, visitorId: 1,
          status: "checked-in", visitType: "official", hostStaffId: 1, departmentId: 4,
          checkinAt: todayAt(8, 55), checkinChannel: "kiosk",
          area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          slipPrinted: true, wifiUsername: "guest_wichai", wifiPassword: "MOTS2569x",
          companionsCount: 0, idMethod: "thai-id-card",
        },
        // 2: checked-in via counter (appointment 9)
        {
          id: 2, entryCode: "eVMS-ENTRY-0002", appointmentId: 9, visitorId: 8,
          status: "checked-in", visitType: "contractor", hostStaffId: 5, departmentId: 1,
          checkinAt: todayAt(8, 25), checkinChannel: "counter",
          area: "สำนักงานปลัดกระทรวง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
          slipPrinted: true, companionsCount: 1,
        },
        // 3: checked-in via kiosk (appointment 10)
        {
          id: 3, entryCode: "eVMS-ENTRY-0003", appointmentId: 10, visitorId: 2,
          status: "checked-in", visitType: "meeting", hostStaffId: 4, departmentId: 8,
          checkinAt: todayAt(9, 25), checkinChannel: "kiosk",
          area: "สำนักนโยบายและแผน", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          companionsCount: 0, idMethod: "thai-id-card",
        },
        // 4: checked-in via kiosk (appointment 12)
        {
          id: 4, entryCode: "eVMS-ENTRY-0004", appointmentId: 12, visitorId: 7,
          status: "checked-in", visitType: "meeting", hostStaffId: 3, departmentId: 3,
          checkinAt: todayAt(13, 20), checkinChannel: "kiosk",
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 2",
          slipPrinted: true, wifiUsername: "guest_yuki", wifiPassword: "MOTS2569y",
          companionsCount: 0, idMethod: "passport",
        },
        // 5: checked-out (appointment 13)
        {
          id: 5, entryCode: "eVMS-ENTRY-0005", appointmentId: 13, visitorId: 5,
          status: "checked-out", visitType: "official", hostStaffId: 1, departmentId: 4,
          checkinAt: todayAt(7, 50), checkinChannel: "kiosk",
          checkoutAt: todayAt(9, 10), checkoutBy: 1,
          area: "กองกิจการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 4",
          companionsCount: 1,
        },
        // 6: auto-checkout (appointment 14)
        {
          id: 6, entryCode: "eVMS-ENTRY-0006", appointmentId: 14, visitorId: 3,
          status: "auto-checkout", visitType: "document", hostStaffId: 7, departmentId: 5,
          checkinAt: todayAt(8, 50), checkinChannel: "counter",
          checkoutAt: todayAt(12, 0),
          area: "กรมการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 6",
          companionsCount: 1,
        },
        // 7: checked-out (appointment 16)
        {
          id: 7, entryCode: "eVMS-ENTRY-0007", appointmentId: 16, visitorId: 1,
          status: "checked-out", visitType: "document", hostStaffId: 7, departmentId: 5,
          checkinAt: todayAt(7, 25), checkinChannel: "counter",
          checkoutAt: todayAt(8, 20), checkoutBy: 7,
          area: "กรมการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 6",
          companionsCount: 0,
        },
        // 8: checked-in (appointment 20)
        {
          id: 8, entryCode: "eVMS-ENTRY-0008", appointmentId: 20, visitorId: 4,
          status: "checked-in", visitType: "contractor", hostStaffId: 5, departmentId: 1,
          checkinAt: todayAt(9, 55), checkinChannel: "kiosk",
          area: "สำนักงานปลัดกระทรวง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
          companionsCount: 1, idMethod: "thai-id-card",
        },
        // 9: overstay (appointment 11 — period)
        {
          id: 9, entryCode: "eVMS-ENTRY-0009", appointmentId: 11, visitorId: 4,
          status: "overstay", visitType: "contractor", hostStaffId: 8, departmentId: 6,
          checkinAt: todayAt(7, 55), checkinChannel: "counter",
          area: "กรมพลศึกษา", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 7",
          companionsCount: 2, notes: "เกินเวลา 17:00 — ยังอยู่ในพื้นที่",
        },
        // --- Past entries for period appointment 7 ---
        // 10: checked-out (day -3)
        {
          id: 10, entryCode: "eVMS-ENTRY-0010", appointmentId: 7, visitorId: 7,
          status: "checked-out", visitType: "meeting", hostStaffId: 3, departmentId: 3,
          checkinAt: dayAt(-3, 9, 10), checkinChannel: "kiosk",
          checkoutAt: dayAt(-3, 16, 45), checkoutBy: 3,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 2",
          companionsCount: 0, idMethod: "passport",
        },
        // 11: checked-out (day -2)
        {
          id: 11, entryCode: "eVMS-ENTRY-0011", appointmentId: 7, visitorId: 7,
          status: "checked-out", visitType: "meeting", hostStaffId: 3, departmentId: 3,
          checkinAt: dayAt(-2, 9, 5), checkinChannel: "kiosk",
          checkoutAt: dayAt(-2, 17, 0), checkoutBy: 3,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 2",
          companionsCount: 0,
        },
        // 12: checked-out (day -1)
        {
          id: 12, entryCode: "eVMS-ENTRY-0012", appointmentId: 7, visitorId: 7,
          status: "checked-out", visitType: "meeting", hostStaffId: 3, departmentId: 3,
          checkinAt: dayAt(-1, 9, 50), checkinChannel: "kiosk",
          checkoutAt: dayAt(-1, 12, 15), checkoutBy: 3,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5", room: "ห้องประชุม 2",
          companionsCount: 0,
        },
        // --- Walk-in entries (no appointment) ---
        // 13: walk-in, checked-in
        {
          id: 13, entryCode: "eVMS-ENTRY-0013", appointmentId: null, visitorId: 5,
          status: "checked-in", purpose: "สอบถามข้อมูลทุนการศึกษาด้านกีฬา",
          visitType: "official", hostStaffId: 8, departmentId: 6,
          checkinAt: todayAt(10, 30), checkinChannel: "counter",
          area: "กรมพลศึกษา", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 6",
          companionsCount: 0, idMethod: "thai-id-card",
        },
        // 14: walk-in, checked-out
        {
          id: 14, entryCode: "eVMS-ENTRY-0014", appointmentId: null, visitorId: 3,
          status: "checked-out", purpose: "Drop off documents for bilateral agreement",
          visitType: "document", hostStaffId: 3, departmentId: 3,
          checkinAt: todayAt(11, 0), checkinChannel: "counter",
          checkoutAt: todayAt(11, 25), checkoutBy: 6,
          area: "กองการต่างประเทศ", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 5",
          companionsCount: 0, idMethod: "passport",
        },
        // 15: walk-in, checked-in (delivery)
        {
          id: 15, entryCode: "eVMS-ENTRY-0015", appointmentId: null, visitorId: 8,
          status: "checked-in", purpose: "ส่งอุปกรณ์เครือข่ายเพิ่มเติม",
          visitType: "delivery", hostStaffId: 5, departmentId: 1,
          checkinAt: todayAt(14, 0), checkinChannel: "kiosk",
          area: "สำนักงานปลัดกระทรวง", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 3",
          companionsCount: 0, idMethod: "thai-id-card",
        },
        // 16: walk-in, checked-out
        {
          id: 16, entryCode: "eVMS-ENTRY-0016", appointmentId: null, visitorId: 2,
          status: "checked-out", purpose: "ติดต่อสอบถามเรื่องใบอนุญาตมัคคุเทศก์",
          visitType: "other", hostStaffId: 7, departmentId: 5,
          checkinAt: todayAt(9, 0), checkinChannel: "counter",
          checkoutAt: todayAt(9, 45), checkoutBy: 6,
          area: "กรมการท่องเที่ยว", building: "ศูนย์ราชการ อาคาร C", floor: "ชั้น 6",
          companionsCount: 0, idMethod: "thai-id-card",
        },
      ],
    });

    console.log("✅ 16 visit entries seeded.\n");

    // ── 12. Visit Slip Template ─────────────────────────────────────
    console.log("🧾 Seeding visit slip template...");

    const tpl = await tx.visitSlipTemplate.create({
      data: {
        name: "แบบ Thermal 80mm มาตรฐาน",
        nameEn: "Standard Thermal 80mm",
        description: "เทมเพลต Visit Slip สำหรับเครื่องพิมพ์ Thermal 80mm",
        paperSize: "thermal-80mm",
        paperWidthPx: 302,
        orgName: "กระทรวงการท่องเที่ยวและกีฬา",
        orgNameEn: "Ministry of Tourism and Sports",
        slipTitle: "VISITOR PASS",
        footerTextTh: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
        footerTextEn: "Please return this pass when leaving",
        showOrgLogo: true,
        logoUrl: "/images/mot_logo_slip.png",
        logoSizePx: 40,
        isDefault: true,
        isActive: true,
      },
    });

    const sectionDefs = [
      { key: "header", name: "ส่วนหัว (Header)", nameEn: "Header Section", enabled: true, sort: 1, fields: [
        { key: "orgLogo", label: "โลโก้หน่วยงาน", labelEn: "Organization Logo", enabled: true, editable: false },
        { key: "orgName", label: "กระทรวงการท่องเที่ยวและกีฬา", labelEn: "Ministry of Tourism and Sports", enabled: true, editable: true },
        { key: "orgNameEn", label: "Ministry of Tourism and Sports", labelEn: "Org Name (EN)", enabled: true, editable: true },
        { key: "slipTitle", label: "VISITOR PASS", labelEn: "Slip Title", enabled: true, editable: true },
      ]},
      { key: "slipNumber", name: "เลขที่ Slip", nameEn: "Slip Number", enabled: true, sort: 2, fields: [
        { key: "slipNumberLabel", label: "เลขที่ / Slip No.", labelEn: "Label", enabled: true, editable: true },
        { key: "slipNumber", label: "eVMS-25680315-0042", labelEn: "Number", enabled: true, editable: false },
      ]},
      { key: "visitor", name: "ข้อมูลผู้เยี่ยม", nameEn: "Visitor Info", enabled: true, sort: 3, fields: [
        { key: "visitorName", label: "ชื่อ / Name", labelEn: "Visitor Name", enabled: true, editable: true },
        { key: "visitorNameEn", label: "ชื่อ (EN)", labelEn: "Name (EN)", enabled: true, editable: true },
        { key: "idNumber", label: "เลขบัตร / ID", labelEn: "ID Number", enabled: true, editable: true },
        { key: "visitPurpose", label: "วัตถุประสงค์ / Purpose", labelEn: "Visit Purpose", enabled: true, editable: true },
        { key: "visitPurposeEn", label: "Purpose (EN)", labelEn: "Purpose (EN)", enabled: true, editable: true },
      ]},
      { key: "host", name: "ผู้พบ / แผนก", nameEn: "Host / Department", enabled: true, sort: 4, fields: [
        { key: "hostName", label: "ผู้พบ / Host", labelEn: "Host Name", enabled: true, editable: true },
        { key: "department", label: "แผนก / Department", labelEn: "Department", enabled: true, editable: true },
        { key: "accessZone", label: "พื้นที่เข้า / Zone", labelEn: "Access Zone", enabled: true, editable: true },
      ]},
      { key: "time", name: "วันเวลา", nameEn: "Date & Time", enabled: true, sort: 5, fields: [
        { key: "visitDate", label: "วันที่ / Date", labelEn: "Visit Date", enabled: true, editable: true },
        { key: "timeIn", label: "เข้า / In", labelEn: "Time In", enabled: true, editable: true },
        { key: "timeOut", label: "ออก / Out", labelEn: "Time Out", enabled: true, editable: true },
      ]},
      { key: "extras", name: "ข้อมูลเสริม", nameEn: "Extras", enabled: true, sort: 6, fields: [
        { key: "companions", label: "ผู้ติดตาม / Companions", labelEn: "Companions", enabled: true, editable: true },
        { key: "vehiclePlate", label: "ทะเบียนรถ / Plate", labelEn: "Vehicle Plate", enabled: true, editable: true },
      ]},
      { key: "wifi", name: "Guest WiFi", nameEn: "Guest WiFi", enabled: true, sort: 7, fields: [
        { key: "wifiSsid", label: "SSID", labelEn: "SSID", enabled: true, editable: false },
        { key: "wifiPass", label: "Password", labelEn: "Password", enabled: true, editable: false },
        { key: "wifiExpiry", label: "ใช้ได้ถึง / Valid Until", labelEn: "Valid Until", enabled: true, editable: true },
      ]},
      { key: "qrCode", name: "QR Code (Checkout)", nameEn: "QR Code (Checkout)", enabled: true, sort: 8, fields: [
        { key: "qrCheckout", label: "Scan เพื่อ Checkout", labelEn: "Scan to Checkout", enabled: true, editable: true },
      ]},
      { key: "officerSign", name: "เจ้าหน้าที่ลงชื่อ", nameEn: "Officer Signature & Stamp", enabled: true, sort: 9, fields: [
        { key: "officerSignLabel", label: "เจ้าหน้าที่ / Officer", labelEn: "Officer Sign", enabled: true, editable: true },
        { key: "stampLabel", label: "ตราประทับ / Stamp", labelEn: "Stamp Label", enabled: true, editable: true },
        { key: "stampPlaceholder", label: "ประทับตราที่นี่", labelEn: "Stamp Here", enabled: true, editable: true },
      ]},
      { key: "footer", name: "ท้ายกระดาษ (Footer)", nameEn: "Footer", enabled: true, sort: 10, fields: [
        { key: "footerTh", label: "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร", labelEn: "Footer TH", enabled: true, editable: true },
        { key: "footerEn", label: "Please return this pass when leaving", labelEn: "Footer EN", enabled: true, editable: true },
      ]},
    ];

    for (const sec of sectionDefs) {
      const section = await tx.visitSlipSection.create({
        data: {
          templateId: tpl.id,
          sectionKey: sec.key,
          name: sec.name,
          nameEn: sec.nameEn,
          isEnabled: sec.enabled,
          sortOrder: sec.sort,
        },
      });
      for (let fi = 0; fi < sec.fields.length; fi++) {
        const f = sec.fields[fi];
        await tx.visitSlipField.create({
          data: {
            sectionId: section.id,
            fieldKey: f.key,
            label: f.label,
            labelEn: f.labelEn,
            isEnabled: f.enabled,
            isEditable: f.editable,
            sortOrder: fi + 1,
          },
        });
      }
    }

    console.log("✅ Visit slip template with 10 sections seeded.\n");

    // ── 13. Buildings ─────────────────────────────────────────────
    console.log("🏢 Seeding buildings...");

    await tx.building.createMany({
      data: [
        { id: 1, name: "อาคาร C ศูนย์ราชการ", nameEn: "Government Complex Building C", totalFloors: 9, description: "อาคาร C ศูนย์ราชการเฉลิมพระเกียรติ ถ.แจ้งวัฒนะ กรุงเทพฯ", isActive: true },
        { id: 2, name: "อาคารกรมพลศึกษา", nameEn: "Dept. of Physical Education Building", totalFloors: 4, description: "อาคารกรมพลศึกษา ถ.รามคำแหง กรุงเทพฯ", isActive: true },
      ],
    });

    console.log("✅ 2 buildings seeded.\n");

    // ── 14. Floors ────────────────────────────────────────────────
    console.log("🏗️  Seeding floors...");

    await tx.floor.createMany({
      data: [
        { id: 1, buildingId: 1, floorNumber: 1, name: "ชั้น 1 (ล็อบบี้)", nameEn: "Floor 1 (Lobby)" },
        { id: 2, buildingId: 1, floorNumber: 2, name: "ชั้น 2", nameEn: "Floor 2" },
        { id: 3, buildingId: 1, floorNumber: 3, name: "ชั้น 3", nameEn: "Floor 3" },
        { id: 4, buildingId: 1, floorNumber: 4, name: "ชั้น 4", nameEn: "Floor 4" },
        { id: 5, buildingId: 1, floorNumber: 5, name: "ชั้น 5", nameEn: "Floor 5" },
        { id: 6, buildingId: 1, floorNumber: 6, name: "ชั้น 6", nameEn: "Floor 6" },
        { id: 7, buildingId: 1, floorNumber: 7, name: "ชั้น 7", nameEn: "Floor 7" },
        { id: 8, buildingId: 1, floorNumber: 8, name: "ชั้น 8", nameEn: "Floor 8" },
        { id: 9, buildingId: 1, floorNumber: 9, name: "ชั้น 9", nameEn: "Floor 9" },
        { id: 10, buildingId: 2, floorNumber: 1, name: "ชั้น 1", nameEn: "Floor 1" },
      ],
    });

    console.log("✅ 10 floors seeded.\n");

    // ── 15. Floor-Department Mappings ─────────────────────────────
    console.log("🔗 Seeding floor-department mappings...");

    await tx.floorDepartment.createMany({
      data: [
        { floorId: 1, departmentId: 2 },   // กองกลาง — ล็อบบี้
        { floorId: 2, departmentId: 2 },   // กองกลาง — ชั้น 2
        { floorId: 3, departmentId: 1 },   // สำนักงานปลัดฯ — ชั้น 3
        { floorId: 4, departmentId: 4 },   // กองกิจการท่องเที่ยว — ชั้น 4
        { floorId: 4, departmentId: 8 },   // สำนักนโยบายและแผน — ชั้น 4
        { floorId: 5, departmentId: 3 },   // กองการต่างประเทศ — ชั้น 5
        { floorId: 5, departmentId: 9 },   // สำนักงานรัฐมนตรี — ชั้น 5
        { floorId: 6, departmentId: 5 },   // กรมการท่องเที่ยว — ชั้น 6
        { floorId: 7, departmentId: 6 },   // กรมพลศึกษา — ชั้น 7
        { floorId: 7, departmentId: 7 },   // การกีฬาแห่งประเทศไทย — ชั้น 7
        { floorId: 8, departmentId: 10 },  // ททท. — ชั้น 8
        { floorId: 9, departmentId: 11 },  // ม.กีฬาแห่งชาติ — ชั้น 9
        { floorId: 10, departmentId: 6 },  // กรมพลศึกษา — อาคาร 2
      ],
    });

    console.log("✅ 13 floor-department mappings seeded.\n");

    // ── 16. Access Zones ──────────────────────────────────────────
    console.log("🚪 Seeding access zones...");

    await tx.accessZone.createMany({
      data: [
        { id: 1, name: "ประตูทางเข้าหลัก", nameEn: "Main Entrance Gate", buildingId: 1, floorId: 1, type: "entrance", hikvisionDoorId: "HIK-DOOR-C-001", description: "ประตูทางเข้าหลักอาคาร C ชั้น 1", isActive: true },
        { id: 2, name: "ประตูทางออกหลัก", nameEn: "Main Exit Gate", buildingId: 1, floorId: 1, type: "exit", hikvisionDoorId: "HIK-DOOR-C-002", description: "ประตูทางออกหลักอาคาร C ชั้น 1", isActive: true },
        { id: 3, name: "ประตูที่จอดรถ", nameEn: "Parking Gate", buildingId: 1, floorId: 1, type: "parking", hikvisionDoorId: "HIK-DOOR-C-003", description: "ประตูที่จอดรถใต้ดินอาคาร C", isActive: true },
        { id: 4, name: "ห้องประชุมใหญ่ ชั้น 2", nameEn: "Main Conference Room Floor 2", buildingId: 1, floorId: 2, type: "common", hikvisionDoorId: "HIK-DOOR-C-004", description: "ห้องประชุมใหญ่สำหรับงานประชุม/สัมมนา", isActive: true },
        { id: 5, name: "โซนปลอดภัย ชั้น 3", nameEn: "Secure Zone Floor 3", buildingId: 1, floorId: 3, type: "secure", hikvisionDoorId: "HIK-DOOR-C-005", description: "โซนสำนักงานปลัดกระทรวง — ต้องมีสิทธิ์เข้า", isActive: true },
        { id: 6, name: "ห้องเซิร์ฟเวอร์ ชั้น 3", nameEn: "Server Room Floor 3", buildingId: 1, floorId: 3, type: "restricted", hikvisionDoorId: "HIK-DOOR-C-006", description: "ห้องเซิร์ฟเวอร์ — เฉพาะผู้ได้รับอนุญาต", isActive: true },
        { id: 7, name: "โซนสำนักงาน ชั้น 4", nameEn: "Office Zone Floor 4", buildingId: 1, floorId: 4, type: "common", hikvisionDoorId: "HIK-DOOR-C-007", description: "โซนกองกิจการท่องเที่ยว / สำนักนโยบาย", isActive: true },
        { id: 8, name: "โซนสำนักงาน ชั้น 5", nameEn: "Office Zone Floor 5", buildingId: 1, floorId: 5, type: "common", hikvisionDoorId: "HIK-DOOR-C-008", description: "โซนกองการต่างประเทศ / สำนักงานรัฐมนตรี", isActive: true },
      ],
    });

    console.log("✅ 8 access zones seeded.\n");

    // ── 17. Approver Groups ───────────────────────────────────────
    console.log("👥 Seeding approver groups...");

    await tx.approverGroup.createMany({
      data: [
        { id: 1, name: "ผู้อนุมัติ กองกิจการท่องเที่ยว", nameEn: "Tourism Affairs Approvers", description: "กลุ่มผู้อนุมัตินัดหมายสำหรับกองกิจการท่องเที่ยว", departmentId: 4, isActive: true },
        { id: 2, name: "ผู้อนุมัติ กองกลาง", nameEn: "General Admin Approvers", description: "กลุ่มผู้อนุมัตินัดหมายสำหรับกองกลาง รวมงานผู้รับเหมา", departmentId: 2, isActive: true },
        { id: 3, name: "ผู้อนุมัติ กองการต่างประเทศ", nameEn: "International Affairs Approvers", description: "กลุ่มผู้อนุมัตินัดหมายด้านต่างประเทศ", departmentId: 3, isActive: true },
      ],
    });

    await tx.approverGroupMember.createMany({
      data: [
        { id: 1, approverGroupId: 1, staffId: 1, canApprove: true, receiveNotification: true },
        { id: 2, approverGroupId: 1, staffId: 7, canApprove: false, receiveNotification: true },
        { id: 3, approverGroupId: 2, staffId: 2, canApprove: true, receiveNotification: true },
        { id: 4, approverGroupId: 2, staffId: 5, canApprove: true, receiveNotification: true },
        { id: 5, approverGroupId: 3, staffId: 3, canApprove: true, receiveNotification: true },
        { id: 6, approverGroupId: 3, staffId: 4, canApprove: false, receiveNotification: true },
      ],
    });

    await tx.approverGroupPurpose.createMany({
      data: [
        { approverGroupId: 1, visitPurposeId: 1 }, { approverGroupId: 1, visitPurposeId: 2 }, { approverGroupId: 1, visitPurposeId: 6 },
        { approverGroupId: 2, visitPurposeId: 4 }, { approverGroupId: 2, visitPurposeId: 7 },
        { approverGroupId: 3, visitPurposeId: 1 }, { approverGroupId: 3, visitPurposeId: 2 },
      ],
    });

    await tx.approverGroupNotifyChannel.createMany({
      data: [
        { approverGroupId: 1, channel: "email" }, { approverGroupId: 1, channel: "line" },
        { approverGroupId: 2, channel: "email" },
        { approverGroupId: 3, channel: "email" }, { approverGroupId: 3, channel: "line" },
      ],
    });

    console.log("✅ 3 approver groups seeded.\n");

    // ── 18. Service Points ────────────────────────────────────────
    console.log("📺 Seeding service points...");

    await tx.servicePoint.createMany({
      data: [
        { id: 1, name: "ตู้คีออส A", nameEn: "Kiosk A", type: "kiosk", status: "online", location: "ล็อบบี้ ชั้น 1 ฝั่งซ้าย", locationEn: "Lobby Floor 1 Left Side", building: "อาคาร C ศูนย์ราชการ", floor: "ชั้น 1", ipAddress: "192.168.1.101", macAddress: "AA:BB:CC:11:22:01", serialNumber: "KIOSK-C1-001", wifiSsid: "MOTS-Guest", wifiPasswordPattern: "MOTS{YYYYMMDD}", wifiValidityMode: "fixed-minutes", wifiFixedDurationMin: 480, slipHeaderText: "กระทรวงการท่องเที่ยวและกีฬา", slipFooterText: "ขอบคุณที่มาเยี่ยมชม", followBusinessHours: true, adminPin: "10210", isActive: true },
        { id: 2, name: "ตู้คีออส B", nameEn: "Kiosk B", type: "kiosk", status: "online", location: "ล็อบบี้ ชั้น 1 ฝั่งขวา", locationEn: "Lobby Floor 1 Right Side", building: "อาคาร C ศูนย์ราชการ", floor: "ชั้น 1", ipAddress: "192.168.1.102", macAddress: "AA:BB:CC:11:22:02", serialNumber: "KIOSK-C1-002", wifiSsid: "MOTS-Guest", wifiPasswordPattern: "MOTS{YYYYMMDD}", wifiValidityMode: "fixed-minutes", wifiFixedDurationMin: 480, slipHeaderText: "กระทรวงการท่องเที่ยวและกีฬา", slipFooterText: "ขอบคุณที่มาเยี่ยมชม", followBusinessHours: true, adminPin: "10210", isActive: true },
        { id: 3, name: "เคาน์เตอร์ประชาสัมพันธ์ 1", nameEn: "Reception Counter 1", type: "counter", status: "online", location: "เคาน์เตอร์ประชาสัมพันธ์ ชั้น 1", locationEn: "Reception Counter Floor 1", building: "อาคาร C ศูนย์ราชการ", floor: "ชั้น 1", ipAddress: "192.168.1.201", macAddress: "AA:BB:CC:11:22:03", serialNumber: "CNTR-C1-001", assignedStaffId: 6, wifiSsid: "MOTS-Guest", slipHeaderText: "กระทรวงการท่องเที่ยวและกีฬา", slipFooterText: "ขอบคุณที่มาเยี่ยมชม", followBusinessHours: true, adminPin: "10210", isActive: true },
        { id: 4, name: "เคาน์เตอร์ประชาสัมพันธ์ 2", nameEn: "Reception Counter 2", type: "counter", status: "offline", location: "เคาน์เตอร์ประชาสัมพันธ์ ชั้น 1", locationEn: "Reception Counter Floor 1", building: "อาคาร C ศูนย์ราชการ", floor: "ชั้น 1", ipAddress: "192.168.1.202", macAddress: "AA:BB:CC:11:22:04", serialNumber: "CNTR-C1-002", assignedStaffId: 11, wifiSsid: "MOTS-Guest", slipHeaderText: "กระทรวงการท่องเที่ยวและกีฬา", slipFooterText: "ขอบคุณที่มาเยี่ยมชม", followBusinessHours: true, adminPin: "10210", isActive: true },
      ],
    });

    console.log("✅ 4 service points seeded.\n");

    // ── 19. Identity Document Types ───────────────────────────────
    console.log("🪪 Seeding identity document types...");

    await tx.identityDocumentType.createMany({
      data: [
        { id: 1, name: "บัตรประจำตัวประชาชน", nameEn: "Thai National ID Card", isActive: true, sortOrder: 1 },
        { id: 2, name: "หนังสือเดินทาง", nameEn: "Passport", isActive: true, sortOrder: 2 },
        { id: 3, name: "ใบขับขี่", nameEn: "Driver's License", isActive: true, sortOrder: 3 },
        { id: 4, name: "บัตรข้าราชการ / บัตรพนักงานรัฐ", nameEn: "Government Officer ID", isActive: true, sortOrder: 4 },
      ],
    });

    console.log("✅ 4 identity document types seeded.\n");

    // ── 19a. Service Point Purposes & Documents ──────────────────
    console.log("🎯 Seeding service point purposes & documents...");

    await tx.servicePointPurpose.createMany({
      data: [
        // ตู้คีออส A (id=1): ติดต่อราชการ + รับ-ส่งสินค้า
        { servicePointId: 1, visitPurposeId: 1 },
        { servicePointId: 1, visitPurposeId: 7 },
        // ตู้คีออส B (id=2): ติดต่อราชการ
        { servicePointId: 2, visitPurposeId: 1 },
        // เคาน์เตอร์ 1 (id=3): ติดต่อราชการ + ประชุม + รับ-ส่งสินค้า
        { servicePointId: 3, visitPurposeId: 1 },
        { servicePointId: 3, visitPurposeId: 2 },
        { servicePointId: 3, visitPurposeId: 7 },
        // เคาน์เตอร์ 2 (id=4): ติดต่อราชการ
        { servicePointId: 4, visitPurposeId: 1 },
      ],
    });

    await tx.servicePointDocument.createMany({
      data: [
        // ตู้คีออส A (id=1): บัตรประชาชน + หนังสือเดินทาง
        { servicePointId: 1, identityDocumentTypeId: 1 },
        { servicePointId: 1, identityDocumentTypeId: 2 },
        // ตู้คีออส B (id=2): บัตรประชาชน + หนังสือเดินทาง
        { servicePointId: 2, identityDocumentTypeId: 1 },
        { servicePointId: 2, identityDocumentTypeId: 2 },
        // เคาน์เตอร์ 1 (id=3): บัตรประชาชน + หนังสือเดินทาง + ใบขับขี่ + บัตรข้าราชการ
        { servicePointId: 3, identityDocumentTypeId: 1 },
        { servicePointId: 3, identityDocumentTypeId: 2 },
        { servicePointId: 3, identityDocumentTypeId: 3 },
        { servicePointId: 3, identityDocumentTypeId: 4 },
        // เคาน์เตอร์ 2 (id=4): บัตรประชาชน + หนังสือเดินทาง
        { servicePointId: 4, identityDocumentTypeId: 1 },
        { servicePointId: 4, identityDocumentTypeId: 2 },
      ],
    });

    console.log("✅ Service point purposes & documents seeded.\n");

    // ── 19b. Visit Purpose Department Rules ───────────────────────
    // (must come after approver groups + departments + visit purposes)
    console.log("📋 Seeding visit purpose department rules...");

    await tx.visitPurposeDepartmentRule.createMany({
      data: [
        // Purpose 1: ติดต่อราชการ (7 rules)
        { visitPurposeId: 1, departmentId: 1, requirePersonName: true,  requireApproval: true,  approverGroupId: 1,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        { visitPurposeId: 1, departmentId: 2, requirePersonName: true,  requireApproval: true,  approverGroupId: 3,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        { visitPurposeId: 1, departmentId: 3, requirePersonName: true,  requireApproval: true,  approverGroupId: 3,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        { visitPurposeId: 1, departmentId: 4, requirePersonName: true,  requireApproval: true,  approverGroupId: 1,    offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        { visitPurposeId: 1, departmentId: 5, requirePersonName: true,  requireApproval: false, approverGroupId: null, offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        { visitPurposeId: 1, departmentId: 8, requirePersonName: false, requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        { visitPurposeId: 1, departmentId: 9, requirePersonName: true,  requireApproval: true,  approverGroupId: 3,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  followBusinessHours: true, isActive: true },
        // Purpose 2: ประชุม / สัมมนา (4 rules)
        { visitPurposeId: 2, departmentId: 1, requirePersonName: true,  requireApproval: true,  approverGroupId: 1,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 2, departmentId: 3, requirePersonName: true,  requireApproval: true,  approverGroupId: 3,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 2, departmentId: 4, requirePersonName: true,  requireApproval: false, approverGroupId: null, offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 2, departmentId: 9, requirePersonName: true,  requireApproval: true,  approverGroupId: 3,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  isActive: true },
        // Purpose 3: ส่งเอกสาร / พัสดุ (3 rules)
        { visitPurposeId: 3, departmentId: 1, requirePersonName: false, requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 3, departmentId: 2, requirePersonName: false, requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 3, departmentId: 4, requirePersonName: true,  requireApproval: true,  approverGroupId: 1,    offerWifi: false, acceptFromLine: false, acceptFromWeb: false, acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        // Purpose 4: ผู้รับเหมา / ซ่อมบำรุง (2 rules)
        { visitPurposeId: 4, departmentId: 2, requirePersonName: false, requireApproval: true,  approverGroupId: 2,    offerWifi: false, acceptFromLine: false, acceptFromWeb: false, acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 4, departmentId: 6, requirePersonName: false, requireApproval: true,  approverGroupId: null, offerWifi: false, acceptFromLine: false, acceptFromWeb: false, acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        // Purpose 5: สมัครงาน / สัมภาษณ์ (1 rule)
        { visitPurposeId: 5, departmentId: 2, requirePersonName: true,  requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        // Purpose 6: เยี่ยมชม / ศึกษาดูงาน (3 rules)
        { visitPurposeId: 6, departmentId: 4, requirePersonName: true,  requireApproval: true,  approverGroupId: 1,    offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 6, departmentId: 5, requirePersonName: true,  requireApproval: true,  approverGroupId: null, offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 6, departmentId: 7, requirePersonName: false, requireApproval: true,  approverGroupId: null, offerWifi: true,  acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: false, acceptFromCounter: true,  isActive: false },
        // Purpose 7: รับ-ส่งสินค้า (3 rules)
        { visitPurposeId: 7, departmentId: 1, requirePersonName: false, requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: false, acceptFromWeb: false, acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 7, departmentId: 2, requirePersonName: false, requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: false, acceptFromWeb: false, acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 7, departmentId: 4, requirePersonName: false, requireApproval: false, approverGroupId: null, offerWifi: false, acceptFromLine: false, acceptFromWeb: false, acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        // Purpose 8: อื่นๆ (2 rules)
        { visitPurposeId: 8, departmentId: 1, requirePersonName: false, requireApproval: true,  approverGroupId: 2,    offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
        { visitPurposeId: 8, departmentId: 2, requirePersonName: false, requireApproval: true,  approverGroupId: 3,    offerWifi: false, acceptFromLine: true,  acceptFromWeb: true,  acceptFromKiosk: true,  acceptFromCounter: true,  isActive: true },
      ],
    });

    console.log("✅ 25 department rules seeded.\n");

    // ── 19c. Visit Purpose Channel Configs ────────────────────────
    // (must come after identity document types + visit purposes)
    console.log("📺 Seeding visit purpose channel configs...");

    const channelConfigSeedData: { visitPurposeId: number; channel: string; requirePhoto: boolean; docIds: number[] }[] = [
      // Purpose 1
      { visitPurposeId: 1, channel: "kiosk",   requirePhoto: true,  docIds: [1, 2, 4] },
      { visitPurposeId: 1, channel: "counter", requirePhoto: true,  docIds: [1, 2, 3, 4] },
      // Purpose 2
      { visitPurposeId: 2, channel: "kiosk",   requirePhoto: true,  docIds: [1, 2, 4] },
      { visitPurposeId: 2, channel: "counter", requirePhoto: false, docIds: [1, 2, 3, 4] },
      // Purpose 3
      { visitPurposeId: 3, channel: "kiosk",   requirePhoto: true,  docIds: [1, 3] },
      { visitPurposeId: 3, channel: "counter", requirePhoto: false, docIds: [1, 2, 3] },
      // Purpose 4
      { visitPurposeId: 4, channel: "kiosk",   requirePhoto: true,  docIds: [1, 3] },
      { visitPurposeId: 4, channel: "counter", requirePhoto: true,  docIds: [1, 2, 3, 4] },
      // Purpose 5
      { visitPurposeId: 5, channel: "kiosk",   requirePhoto: true,  docIds: [1, 2] },
      { visitPurposeId: 5, channel: "counter", requirePhoto: true,  docIds: [1, 2, 3, 4] },
      // Purpose 6
      { visitPurposeId: 6, channel: "kiosk",   requirePhoto: true,  docIds: [1, 2] },
      { visitPurposeId: 6, channel: "counter", requirePhoto: false, docIds: [1, 2, 3, 4] },
      // Purpose 7
      { visitPurposeId: 7, channel: "kiosk",   requirePhoto: false, docIds: [1, 3] },
      { visitPurposeId: 7, channel: "counter", requirePhoto: false, docIds: [1, 3] },
      // Purpose 8
      { visitPurposeId: 8, channel: "kiosk",   requirePhoto: false, docIds: [1, 2] },
      { visitPurposeId: 8, channel: "counter", requirePhoto: false, docIds: [1, 2, 3] },
    ];

    for (const cc of channelConfigSeedData) {
      await tx.visitPurposeChannelConfig.create({
        data: {
          visitPurposeId: cc.visitPurposeId,
          channel: cc.channel,
          requirePhoto: cc.requirePhoto,
          channelDocuments: {
            create: cc.docIds.map((docId) => ({
              identityDocumentTypeId: docId,
            })),
          },
        },
      });
    }

    console.log("✅ 16 channel configs with documents seeded.\n");

    // ── 20. Document Types ────────────────────────────────────────
    console.log("📑 Seeding document types...");

    await tx.documentType.createMany({
      data: [
        { id: 1, name: "สำเนาบัตรประชาชน", nameEn: "ID Card Copy", category: "identification", isRequired: true, requirePhoto: false, description: "สำเนาบัตรประจำตัวประชาชนสำหรับผู้เยี่ยมชมชาวไทย", sortOrder: 1, isActive: true },
        { id: 2, name: "สำเนาหนังสือเดินทาง", nameEn: "Passport Copy", category: "identification", isRequired: true, requirePhoto: false, description: "สำเนาหนังสือเดินทางสำหรับผู้เยี่ยมชมต่างชาติ", sortOrder: 2, isActive: true },
        { id: 3, name: "หนังสือมอบอำนาจ", nameEn: "Power of Attorney", category: "authorization", isRequired: false, requirePhoto: false, description: "หนังสือมอบอำนาจในกรณีที่ดำเนินการแทน", sortOrder: 3, isActive: true },
        { id: 4, name: "หนังสือนำส่งเอกสาร", nameEn: "Document Transmittal Letter", category: "correspondence", isRequired: false, requirePhoto: false, description: "หนังสือนำส่งเอกสารราชการ", sortOrder: 4, isActive: true },
        { id: 5, name: "ใบอนุญาตทำงาน (ผู้รับเหมา)", nameEn: "Contractor Work Permit", category: "contractor", isRequired: true, requirePhoto: true, description: "ใบอนุญาตทำงานสำหรับผู้รับเหมา", sortOrder: 5, isActive: true },
        { id: 6, name: "บัตรผู้สื่อข่าว", nameEn: "Press Card", category: "media", isRequired: false, requirePhoto: false, description: "บัตรผู้สื่อข่าวสำหรับผู้แทนสื่อมวลชน", sortOrder: 6, isActive: true },
      ],
    });

    console.log("✅ 6 document types seeded.\n");

    // ── 21. Business Hours ────────────────────────────────────────
    console.log("🕐 Seeding business hours...");

    const bTime = (h: number, m: number = 0) => new Date(1970, 0, 1, h, m, 0);
    const closedTime = new Date(1970, 0, 1, 0, 0, 0);

    await tx.businessHoursRule.createMany({
      data: [
        { id: 1, name: "วันจันทร์", nameEn: "Monday", type: "regular", daysOfWeek: [1], openTime: bTime(8, 30), closeTime: bTime(16, 30), allowWalkin: true, allowKiosk: true, notes: "เวลาราชการปกติ", isActive: true },
        { id: 2, name: "วันอังคาร", nameEn: "Tuesday", type: "regular", daysOfWeek: [2], openTime: bTime(8, 30), closeTime: bTime(16, 30), allowWalkin: true, allowKiosk: true, notes: "เวลาราชการปกติ", isActive: true },
        { id: 3, name: "วันพุธ", nameEn: "Wednesday", type: "regular", daysOfWeek: [3], openTime: bTime(8, 30), closeTime: bTime(16, 30), allowWalkin: true, allowKiosk: true, notes: "เวลาราชการปกติ", isActive: true },
        { id: 4, name: "วันพฤหัสบดี", nameEn: "Thursday", type: "regular", daysOfWeek: [4], openTime: bTime(8, 30), closeTime: bTime(16, 30), allowWalkin: true, allowKiosk: true, notes: "เวลาราชการปกติ", isActive: true },
        { id: 5, name: "วันศุกร์", nameEn: "Friday", type: "regular", daysOfWeek: [5], openTime: bTime(8, 30), closeTime: bTime(16, 30), allowWalkin: true, allowKiosk: true, notes: "เวลาราชการปกติ", isActive: true },
        { id: 6, name: "วันเสาร์", nameEn: "Saturday", type: "regular", daysOfWeek: [6], openTime: closedTime, closeTime: closedTime, allowWalkin: false, allowKiosk: false, notes: "วันหยุดราชการ", isActive: true },
        { id: 7, name: "วันอาทิตย์", nameEn: "Sunday", type: "regular", daysOfWeek: [0], openTime: closedTime, closeTime: closedTime, allowWalkin: false, allowKiosk: false, notes: "วันหยุดราชการ", isActive: true },
        { id: 8, name: "วันจักรี", nameEn: "Chakri Memorial Day", type: "holiday", specificDate: new Date("2026-04-06"), openTime: closedTime, closeTime: closedTime, allowWalkin: false, allowKiosk: false, notes: "วันหยุดราชการ — วันจักรี", isActive: true },
        { id: 9, name: "วันสงกรานต์", nameEn: "Songkran Festival", type: "holiday", specificDate: new Date("2026-04-13"), openTime: closedTime, closeTime: closedTime, allowWalkin: false, allowKiosk: false, notes: "วันหยุดราชการ — เทศกาลสงกรานต์", isActive: true },
      ],
    });

    console.log("✅ 9 business hours rules seeded.\n");

    // ── 22. Notification Templates ────────────────────────────────
    console.log("🔔 Seeding notification templates...");

    await tx.notificationTemplate.createMany({
      data: [
        { id: 1, name: "แจ้งเตือนนัดหมายใหม่ (อีเมล)", nameEn: "New Appointment (Email)", triggerEvent: "appointment_created", channel: "email", subject: "แจ้งเตือน: นัดหมายใหม่ {{bookingCode}}", bodyTh: "สวัสดี {{hostName}}\n\nมีนัดหมายใหม่รอการอนุมัติ\nรหัส: {{bookingCode}}\nผู้เยี่ยมชม: {{visitorName}}\nวันที่: {{date}}\nเวลา: {{timeStart}} - {{timeEnd}}\nวัตถุประสงค์: {{purpose}}\nแผนก: {{department}}\n\nกรุณาตรวจสอบและอนุมัติในระบบ eVMS", bodyEn: "Dear {{hostName}},\n\nNew appointment pending approval.\nCode: {{bookingCode}}\nVisitor: {{visitorName}}\nDate: {{date}}\nTime: {{timeStart}} - {{timeEnd}}\nPurpose: {{purpose}}\nDepartment: {{department}}\n\nPlease review in the eVMS system.", isActive: true },
        { id: 2, name: "แจ้งเตือนนัดหมายใหม่ (LINE)", nameEn: "New Appointment (LINE)", triggerEvent: "appointment_created", channel: "line", bodyTh: "📋 มีนัดหมายใหม่\nรหัส: {{bookingCode}}\nผู้เยี่ยมชม: {{visitorName}}\nวันที่: {{date}} เวลา: {{timeStart}}\nวัตถุประสงค์: {{purpose}}", bodyEn: "📋 New appointment\nCode: {{bookingCode}}\nVisitor: {{visitorName}}\nDate: {{date}} Time: {{timeStart}}\nPurpose: {{purpose}}", isActive: true },
        { id: 3, name: "แจ้งอนุมัตินัดหมาย (อีเมล)", nameEn: "Appointment Approved (Email)", triggerEvent: "appointment_approved", channel: "email", subject: "นัดหมาย {{bookingCode}} ได้รับการอนุมัติ", bodyTh: "สวัสดี {{visitorName}}\n\nนัดหมายของท่านได้รับการอนุมัติแล้ว\nรหัส: {{bookingCode}}\nวันที่: {{date}}\nเวลา: {{timeStart}} - {{timeEnd}}\nผู้ติดต่อ: {{hostName}}\nแผนก: {{department}}\nอาคาร: {{building}} {{floor}}\n\nกรุณาแสดง QR Code ที่จุดลงทะเบียน", bodyEn: "Dear {{visitorName}},\n\nYour appointment has been approved.\nCode: {{bookingCode}}\nDate: {{date}}\nTime: {{timeStart}} - {{timeEnd}}\nHost: {{hostName}}\nDepartment: {{department}}\nBuilding: {{building}} {{floor}}\n\nPlease present your QR code at the registration point.", isActive: true },
        { id: 4, name: "แจ้งอนุมัตินัดหมาย (LINE)", nameEn: "Appointment Approved (LINE)", triggerEvent: "appointment_approved", channel: "line", bodyTh: "✅ นัดหมายอนุมัติแล้ว\nรหัส: {{bookingCode}}\nวันที่: {{date}} เวลา: {{timeStart}}\nผู้ติดต่อ: {{hostName}}\nอาคาร: {{building}} {{floor}}", bodyEn: "✅ Appointment approved\nCode: {{bookingCode}}\nDate: {{date}} Time: {{timeStart}}\nHost: {{hostName}}\nBuilding: {{building}} {{floor}}", isActive: true },
        { id: 5, name: "แจ้งปฏิเสธนัดหมาย (อีเมล)", nameEn: "Appointment Rejected (Email)", triggerEvent: "appointment_rejected", channel: "email", subject: "นัดหมาย {{bookingCode}} ถูกปฏิเสธ", bodyTh: "สวัสดี {{visitorName}}\n\nนัดหมายของท่านถูกปฏิเสธ\nรหัส: {{bookingCode}}\nวันที่: {{date}}\nเหตุผล: {{reason}}\n\nหากมีข้อสงสัยกรุณาติดต่อผู้ประสานงาน", bodyEn: "Dear {{visitorName}},\n\nYour appointment has been rejected.\nCode: {{bookingCode}}\nDate: {{date}}\nReason: {{reason}}\n\nPlease contact the coordinator for more information.", isActive: true },
        { id: 6, name: "แจ้งเช็คอินผู้เยี่ยมชม (อีเมล)", nameEn: "Visitor Checked In (Email)", triggerEvent: "visitor_checkin", channel: "email", subject: "แจ้งเตือน: {{visitorName}} เช็คอินแล้ว", bodyTh: "สวัสดี {{hostName}}\n\nผู้เยี่ยมชมของท่านเช็คอินแล้ว\nชื่อ: {{visitorName}}\nรหัส: {{bookingCode}}\nเวลาเข้า: {{timeStart}}\nอาคาร: {{building}} {{floor}}\n\nกรุณาไปรับที่จุดประชาสัมพันธ์", bodyEn: "Dear {{hostName}},\n\nYour visitor has checked in.\nName: {{visitorName}}\nCode: {{bookingCode}}\nCheck-in: {{timeStart}}\nBuilding: {{building}} {{floor}}\n\nPlease meet them at the reception.", isActive: true },
        { id: 7, name: "แจ้งเช็คอินผู้เยี่ยมชม (LINE)", nameEn: "Visitor Checked In (LINE)", triggerEvent: "visitor_checkin", channel: "line", bodyTh: "🔔 ผู้เยี่ยมชมเช็คอินแล้ว\nชื่อ: {{visitorName}}\nรหัส: {{bookingCode}}\nเวลา: {{timeStart}}\nกรุณาไปรับที่ล็อบบี้", bodyEn: "🔔 Visitor checked in\nName: {{visitorName}}\nCode: {{bookingCode}}\nTime: {{timeStart}}\nPlease meet at lobby.", isActive: true },
        { id: 8, name: "แจ้งเตือนอยู่เกินเวลา (อีเมล)", nameEn: "Overstay Alert (Email)", triggerEvent: "visitor_overstay", channel: "email", subject: "แจ้งเตือน: ผู้เยี่ยมชมอยู่เกินเวลา", bodyTh: "สวัสดี {{hostName}}\n\nผู้เยี่ยมชมอยู่เกินเวลาที่กำหนด\nชื่อ: {{visitorName}}\nรหัส: {{bookingCode}}\nเวลาที่ควรออก: {{timeEnd}}\nแผนก: {{department}}\n\nกรุณาดำเนินการตรวจสอบ", bodyEn: "Dear {{hostName}},\n\nA visitor has exceeded their scheduled time.\nName: {{visitorName}}\nCode: {{bookingCode}}\nExpected checkout: {{timeEnd}}\nDepartment: {{department}}\n\nPlease follow up.", isActive: true },
      ],
    });

    await tx.notificationTemplateVariable.createMany({
      data: [
        { templateId: 1, variableName: "bookingCode" }, { templateId: 1, variableName: "visitorName" }, { templateId: 1, variableName: "hostName" }, { templateId: 1, variableName: "date" }, { templateId: 1, variableName: "timeStart" }, { templateId: 1, variableName: "timeEnd" }, { templateId: 1, variableName: "purpose" }, { templateId: 1, variableName: "department" },
        { templateId: 2, variableName: "bookingCode" }, { templateId: 2, variableName: "visitorName" }, { templateId: 2, variableName: "date" }, { templateId: 2, variableName: "timeStart" }, { templateId: 2, variableName: "purpose" },
        { templateId: 3, variableName: "bookingCode" }, { templateId: 3, variableName: "visitorName" }, { templateId: 3, variableName: "hostName" }, { templateId: 3, variableName: "date" }, { templateId: 3, variableName: "timeStart" }, { templateId: 3, variableName: "timeEnd" }, { templateId: 3, variableName: "department" }, { templateId: 3, variableName: "building" }, { templateId: 3, variableName: "floor" },
        { templateId: 4, variableName: "bookingCode" }, { templateId: 4, variableName: "date" }, { templateId: 4, variableName: "timeStart" }, { templateId: 4, variableName: "hostName" }, { templateId: 4, variableName: "building" }, { templateId: 4, variableName: "floor" },
        { templateId: 5, variableName: "bookingCode" }, { templateId: 5, variableName: "visitorName" }, { templateId: 5, variableName: "date" }, { templateId: 5, variableName: "reason" },
        { templateId: 6, variableName: "bookingCode" }, { templateId: 6, variableName: "visitorName" }, { templateId: 6, variableName: "hostName" }, { templateId: 6, variableName: "timeStart" }, { templateId: 6, variableName: "building" }, { templateId: 6, variableName: "floor" },
        { templateId: 7, variableName: "bookingCode" }, { templateId: 7, variableName: "visitorName" }, { templateId: 7, variableName: "timeStart" },
        { templateId: 8, variableName: "bookingCode" }, { templateId: 8, variableName: "visitorName" }, { templateId: 8, variableName: "hostName" }, { templateId: 8, variableName: "timeEnd" }, { templateId: 8, variableName: "department" },
      ],
    });

    console.log("✅ 8 notification templates seeded.\n");

    // ── 23. Blocklist ─────────────────────────────────────────────
    console.log("🚫 Seeding blocklist...");

    await tx.blocklist.createMany({
      data: [
        { id: 1, firstName: "สุรศักดิ์", lastName: "อันตราย", company: "-", visitorId: 6, reason: "พฤติกรรมก้าวร้าว คุกคามเจ้าหน้าที่ประชาสัมพันธ์", type: "person", addedBy: 5, isActive: true },
        { id: 2, firstName: "ชาติชาย", lastName: "ปลอมเอกสาร", company: "บริษัท ไม่จริง จำกัด", reason: "ใช้เอกสารปลอมในการลงทะเบียนเข้าอาคาร", type: "person", expiryDate: new Date("2027-01-01"), addedBy: 5, isActive: true },
        { id: 3, firstName: "บริษัท ก่อสร้างเถื่อน", lastName: "จำกัด", company: "บริษัท ก่อสร้างเถื่อน จำกัด", reason: "ใบอนุญาตก่อสร้างถูกเพิกถอน ห้ามเข้าพื้นที่ทุกกรณี", type: "company", expiryDate: new Date("2026-12-31"), addedBy: 2, isActive: true },
      ],
    });

    console.log("✅ 3 blocklist entries seeded.\n");

    // ── 24. PDPA Consent Config ───────────────────────────────────
    console.log("🔒 Seeding PDPA consent config...");

    const pdpaTextTh = `นโยบายความเป็นส่วนตัว — ระบบจัดการผู้เยี่ยมชม (eVMS)

กระทรวงการท่องเที่ยวและกีฬา ("หน่วยงาน") มีความจำเป็นต้องเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 เพื่อวัตถุประสงค์ในการจัดการผู้เยี่ยมชม ดังต่อไปนี้:

1. ข้อมูลที่เก็บรวบรวม: ชื่อ-นามสกุล, เลขบัตรประจำตัวประชาชน/หนังสือเดินทาง, หมายเลขโทรศัพท์, อีเมล, ภาพถ่าย, ข้อมูลบริษัท/องค์กร
2. วัตถุประสงค์: เพื่อความปลอดภัยของหน่วยงาน, การบริหารจัดการผู้เยี่ยมชม, การออกบัตรผ่าน, การติดต่อประสานงาน
3. ระยะเวลาเก็บรักษา: 90 วันนับจากวันที่เยี่ยมชม
4. สิทธิของเจ้าของข้อมูล: ท่านมีสิทธิขอเข้าถึง แก้ไข ลบ หรือระงับการใช้ข้อมูลส่วนบุคคลของท่านได้ตามที่กฎหมายกำหนด

ติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO): dpo@mots.go.th`;

    const pdpaTextEn = `Privacy Policy — Visitor Management System (eVMS)

The Ministry of Tourism and Sports ("Organization") needs to collect, use, and disclose your personal data in accordance with the Personal Data Protection Act B.E. 2562 (2019) for visitor management purposes as follows:

1. Data Collected: Full name, National ID / Passport number, Phone number, Email, Photo, Company / Organization
2. Purpose: Facility security, Visitor management, Visitor pass issuance, Communication and coordination
3. Retention Period: 90 days from the date of visit
4. Data Subject Rights: You have the right to access, rectify, delete, or restrict the processing of your personal data as provided by law.

Contact Data Protection Officer (DPO): dpo@mots.go.th`;

    await tx.pdpaConsentConfig.create({
      data: { id: 1, textTh: pdpaTextTh, textEn: pdpaTextEn, retentionDays: 90, requireScroll: true, displayChannels: ["kiosk", "line", "web"], isActive: true, version: 1, updatedBy: 5 },
    });

    await tx.pdpaConsentVersion.create({
      data: { id: 1, configId: 1, version: 1, textTh: pdpaTextTh, textEn: pdpaTextEn, retentionDays: 90, requireScroll: true, displayChannels: ["kiosk", "line", "web"], isActive: true, effectiveDate: today, changedBy: 5, changeNote: "เวอร์ชันเริ่มต้น" },
    });

    console.log("✅ PDPA consent config seeded.\n");

    // ── 25. Email Config ──────────────────────────────────────────
    console.log("📧 Seeding email config...");

    await tx.emailConfig.create({
      data: { id: 1, smtpHost: "smtp.mots.go.th", smtpPort: 587, encryption: "tls", smtpUsername: "evms-noreply@mots.go.th", smtpPassword: "smtp-password-placeholder", fromEmail: "evms-noreply@mots.go.th", fromDisplayName: "ระบบ eVMS กระทรวงการท่องเที่ยวฯ", replyToEmail: "evms-admin@mots.go.th", isActive: true, updatedBy: 5 },
    });

    console.log("✅ Email config seeded.\n");

    // ── 26. LINE OA Config ────────────────────────────────────────
    console.log("💚 Seeding LINE OA config...");

    await tx.lineOaConfig.create({
      data: { id: 1, channelId: "1234567890", channelSecret: "placeholder-channel-secret", channelAccessToken: "placeholder-access-token", botBasicId: "@evms-mots", liffAppId: "1234567890-abcdefgh", liffEndpointUrl: "https://evms.mots.go.th/liff", webhookUrl: "https://evms.mots.go.th/api/webhooks/line", webhookActive: false, isActive: true, updatedBy: 5 },
    });

    console.log("✅ LINE OA config seeded.\n");
  });

  console.log("🎉 eVMS seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
