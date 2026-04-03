# eVMS Test Cases — Settings CRUD Operations

> ทดสอบการ เพิ่ม แก้ไข ลบ ของหน้าตั้งค่าทั้งหมด 9 หน้า
> ตรวจสอบว่าข้อมูลบันทึกลงฐานข้อมูลจริง (ไม่ใช่แค่ state ใน UI)

## สรุปผลการทดสอบ

| # | หน้าตั้งค่า | Path | เพิ่ม | แก้ไข | ลบ | DB Persist |
|---|------------|------|------|-------|-----|-----------|
| 1 | โซนเข้าพื้นที่ | `/web/settings/access-zones` | ✅ | ✅ | ✅ | ✅ |
| 2 | กลุ่มผู้อนุมัติ | `/web/settings/approver-groups` | ✅ | ✅ | ✅ | ✅ |
| 3 | ผู้ใช้งาน | `/web/settings/users` | ✅ | ✅ | ✅ (Lock) | ✅ |
| 4 | พนักงาน | `/web/settings/staff` | ✅ | ✅ | ✅ (Soft) | ✅ |
| 5 | จุดให้บริการ | `/web/settings/service-points` | ✅ | ✅ | ✅ | ✅ |
| 6 | ประเภทเอกสาร | `/web/settings/document-types` | ✅ | ✅ | ✅ | ✅ |
| 7 | เวลาทำการ | `/web/settings/business-hours` | ✅ | ✅ | ✅ | ✅ |
| 8 | LINE / แจ้งเตือน | `/web/settings/line-message-templates` | ✅ | ✅ | ✅ | ✅ |
| 9 | PDPA | `/web/settings/pdpa-consent` | ✅ | ✅ | N/A (versioned) | ✅ |

**วันที่ทดสอบ:** 2 เมษายน 2569  
**ทดสอบโดย:** API Automated Test Script (`scripts/test-crud-verify.mjs`)  
**ผลรวม:** ✅ ผ่านทุกรายการ

---

## TC-SET-01: โซนเข้าพื้นที่ (Access Zones)

**API Endpoint:** `/api/access-zones`  
**Methods:** GET, POST, PUT `/:id`, DELETE `/:id`

### TC-SET-01-1: เพิ่มโซนเข้าพื้นที่ใหม่

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/access-zones` |
| **Required Fields** | `name`, `nameEn`, `type`, `hikvisionDoorId`, `buildingId`, `floorId` |
| **Optional Fields** | `description`, `isActive` (default: true) |
| **Auth** | admin only |
| **สถานะ** | ✅ ผ่าน |

**Steps:**
1. POST ด้วย body: `{ name, nameEn, type: "door", hikvisionDoorId: "unique_id", buildingId: 1, floorId: 1 }`
2. ตรวจ response: `success: true`, `data.zone.id` มีค่า
3. GET `/api/access-zones` → พบ record ที่สร้าง

**Expected:** สร้างสำเร็จ, ข้อมูลอยู่ใน DB  
**Actual:** ✅ ผ่าน — record ปรากฏใน GET list

### TC-SET-01-2: แก้ไขโซนเข้าพื้นที่

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/access-zones/:id` |
| **สถานะ** | ✅ ผ่าน |

**Steps:**
1. PUT ด้วย body: `{ name: "Updated Name", nameEn: "Updated EN", type, hikvisionDoorId }`
2. GET → ตรวจว่า `name` เปลี่ยนแล้ว

**Expected:** อัปเดตสำเร็จ  
**Actual:** ✅ ผ่าน

### TC-SET-01-3: ลบโซนเข้าพื้นที่

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/access-zones/:id` |
| **สถานะ** | ✅ ผ่าน |

**Steps:**
1. DELETE → `success: true`
2. GET → ไม่พบ record

**Expected:** ลบจาก DB จริง  
**Actual:** ✅ ผ่าน

---

## TC-SET-02: กลุ่มผู้อนุมัติ (Approver Groups)

**API Endpoint:** `/api/approver-groups`  
**Methods:** GET, POST, PUT `/:id`, DELETE `/:id`

### TC-SET-02-1: เพิ่มกลุ่มผู้อนุมัติ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/approver-groups` |
| **Required Fields** | `name`, `nameEn`, `departmentId` |
| **Optional Fields** | `description`, `isActive` (default: true) |
| **Auth** | admin only |
| **สถานะ** | ✅ ผ่าน |

**Steps:**
1. POST ด้วย body: `{ name, nameEn, departmentId: 1, description }`
2. ตรวจ response: `success: true`, `data.group.id` มีค่า
3. GET → พบ record

**Actual:** ✅ ผ่าน

### TC-SET-02-2: แก้ไขกลุ่มผู้อนุมัติ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/approver-groups/:id` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-02-3: ลบกลุ่มผู้อนุมัติ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/approver-groups/:id` |
| **สถานะ** | ✅ ผ่าน |

---

## TC-SET-03: ผู้ใช้งาน (Users)

**API Endpoint:** `/api/users`  
**Methods:** GET, POST, PATCH `/:id/role`, PATCH `/:id/lock`

### TC-SET-03-1: เพิ่มผู้ใช้งาน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/users` |
| **Required Fields** | `email`, `password`, `firstName`, `lastName`, `role`, `userType` |
| **Valid userType** | `staff`, `visitor`, `external` |
| **Valid role** | `visitor`, `staff`, `supervisor`, `security`, `admin` |
| **Optional Fields** | `username`, `phone` |
| **Auth** | admin only |
| **สถานะ** | ✅ ผ่าน |

**Steps:**
1. POST ด้วย body: `{ username, email, password, firstName, lastName, role: "staff", userType: "staff" }`
2. ตรวจ response: `success: true`, `data.user.id` มีค่า
3. GET `/api/users` → พบ user ใหม่

**Actual:** ✅ ผ่าน

### TC-SET-03-2: เปลี่ยน Role ผู้ใช้

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PATCH `/api/users/:id/role` |
| **Body** | `{ role: "supervisor" }` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-03-3: ล็อก/ปลดล็อกผู้ใช้

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PATCH `/api/users/:id/lock` |
| **Body** | `{ isActive: false }` |
| **สถานะ** | ✅ ผ่าน |

**หมายเหตุ:** ระบบไม่มีการลบผู้ใช้จริง — ใช้ Lock/Unlock แทน

---

## TC-SET-04: พนักงาน (Staff)

**API Endpoint:** `/api/staff`  
**Methods:** GET, POST, GET `/:id`, PUT `/:id`, DELETE `/:id`

### TC-SET-04-1: เพิ่มพนักงาน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/staff` |
| **Required Fields** | `employeeId`, `name`, `nameEn`, `position`, `departmentId`, `email`, `phone`, `role` |
| **Optional Fields** | `status` (default: "active"), `shift` |
| **Auth** | admin / supervisor |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-04-2: แก้ไขพนักงาน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/staff/:id` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-04-3: ลบพนักงาน (Soft Delete)

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/staff/:id` |
| **พฤติกรรม** | เปลี่ยน status เป็น "inactive" (ไม่ลบจริง) |
| **สถานะ** | ✅ ผ่าน |

---

## TC-SET-05: จุดให้บริการ (Service Points)

**API Endpoint:** `/api/service-points`  
**Methods:** GET, POST, PUT `/:id`, DELETE `/:id`

### TC-SET-05-1: เพิ่มจุดให้บริการ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/service-points` |
| **Required Fields** | `name`, `nameEn`, `type`, `serialNumber`, `location`, `locationEn`, `building`, `floor`, `ipAddress`, `macAddress` |
| **Optional Fields** | `status`, `assignedStaffId`, `notes`, `isActive`, `wifiSsid`, `wifiPasswordPattern`, `wifiValidityMode`, `wifiFixedDurationMin`, `pdpaRequireScroll`, `pdpaRetentionDays`, `slipHeaderText`, `slipFooterText`, `followBusinessHours`, `idMaskingPattern`, `adminPin` |
| **Auth** | admin / supervisor |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-05-2: แก้ไขจุดให้บริการ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/service-points/:id` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-05-3: ลบจุดให้บริการ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/service-points/:id` |
| **สถานะ** | ✅ ผ่าน |

---

## TC-SET-06: ประเภทเอกสาร (Document Types)

**API Endpoint:** `/api/document-types`  
**Methods:** GET, POST, PUT `/:id`, DELETE `/:id`

### TC-SET-06-1: เพิ่มประเภทเอกสาร

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/document-types` |
| **Required Fields** | `name`, `nameEn`, `category` |
| **Optional Fields** | `isRequired`, `requirePhoto`, `description`, `isActive`, `sortOrder` |
| **Auth** | admin / supervisor |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-06-2: แก้ไขประเภทเอกสาร

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/document-types/:id` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-06-3: ลบประเภทเอกสาร

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/document-types/:id` |
| **สถานะ** | ✅ ผ่าน |

---

## TC-SET-07: เวลาทำการ (Business Hours)

**API Endpoint:** `/api/business-hours`  
**Methods:** GET, PUT (upsert array), POST `/holidays`, DELETE `/holidays?date=`

### TC-SET-07-1: เพิ่ม/อัปเดตกฎเวลาทำการ

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/business-hours` |
| **Body** | `{ rules: [{ name, nameEn, type, openTime, closeTime, ... }] }` |
| **Required Fields (per rule)** | `name`, `nameEn`, `type`, `openTime` (HH:MM), `closeTime` (HH:MM) |
| **Optional Fields** | `id` (ถ้ามี = update, ไม่มี = create), `daysOfWeek`, `specificDate`, `allowWalkin`, `allowKiosk`, `notes`, `isActive` |
| **Auth** | admin / supervisor |
| **สถานะ** | ✅ ผ่าน |

**หมายเหตุ:** ใช้ PUT เดียวทั้ง create และ update — ส่ง `id` มา = update, ไม่ส่ง = create ใหม่

### TC-SET-07-2: เพิ่มวันหยุด

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/business-hours/holidays` |
| **Body** | `{ date: "YYYY-MM-DD", name: "ชื่อวันหยุด" }` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-07-3: ลบวันหยุด

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/business-hours/holidays?date=YYYY-MM-DD` |
| **สถานะ** | ✅ ผ่าน |

---

## TC-SET-08: เทมเพลตแจ้งเตือน / LINE (Notification Templates)

**API Endpoint:** `/api/notification-templates`  
**Methods:** GET, POST, PUT `/:id`, DELETE `/:id`

### TC-SET-08-1: เพิ่มเทมเพลตแจ้งเตือน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | POST `/api/notification-templates` |
| **Required Fields** | `name`, `nameEn`, `channel`, `triggerEvent`, `bodyTh`, `bodyEn` |
| **Optional Fields** | `subject`, `isActive`, `variables` (string[]) |
| **Auth** | admin only |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-08-2: แก้ไขเทมเพลตแจ้งเตือน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/notification-templates/:id` |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-08-3: ลบเทมเพลตแจ้งเตือน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | DELETE `/api/notification-templates/:id` |
| **สถานะ** | ✅ ผ่าน |

**หน้า LINE Message Templates ยังรวม:**
- LINE OA Config: GET/PUT `/api/settings/line-oa` ✅
- LINE Flex Templates: GET/PUT `/api/settings/line-oa/flex-templates` ✅
- Email Config: GET/PUT `/api/settings/email` ✅

---

## TC-SET-09: PDPA Consent

**API Endpoint:** `/api/pdpa/config`  
**Methods:** GET, PUT (version-immutable)

### TC-SET-09-1: ดู PDPA Config ปัจจุบัน

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | GET `/api/pdpa/config` |
| **Response** | `data.config` พร้อม version history |
| **สถานะ** | ✅ ผ่าน |

### TC-SET-09-2: สร้าง PDPA Version ใหม่

| รายละเอียด | ค่า |
|-----------|------|
| **Method** | PUT `/api/pdpa/config` |
| **Required Fields** | `titleTh`, `titleEn`, `contentTh`, `contentEn`, `retentionDays`, `requireScroll`, `displayChannels`, `changeNotes` |
| **พฤติกรรม** | สร้าง version ใหม่เสมอ (ไม่ overwrite version เก่า) |
| **Auth** | admin only |
| **สถานะ** | ✅ ผ่าน |

**หมายเหตุ:** PDPA ใช้ version-immutable pattern — ทุกการแก้ไขจะสร้าง version ใหม่ ไม่มีการลบ

---

## API Response Format

ทุก API ใช้ format เดียวกัน:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "ข้อความแสดงข้อผิดพลาด" } }
```

## Authentication

- **Cookie:** `evms_session` (JWT, httpOnly, 8 ชั่วโมง)
- **Login:** POST `/api/auth/login` → `{ usernameOrEmail, password }`
- **Admin credentials:** `admin` / `admin1234`

## Data Response Keys

| Endpoint | GET Response Key | POST Response Key |
|----------|-----------------|-------------------|
| access-zones | `data.zones` | `data.zone` |
| approver-groups | `data.groups` | `data.group` |
| users | `data.users` + `data.pagination` | `data.user` |
| staff | `data.staff` + `data.pagination` | `data.staff` |
| service-points | `data.servicePoints` | `data.servicePoint` |
| document-types | `data.documentTypes` | `data.documentType` |
| business-hours | `data.rules` | `data.rules` (array) |
| notification-templates | `data.templates` | `data.template` |
| pdpa/config | `data.config` | `data.config` |

---

## Automated Test Script

สามารถรัน test อัตโนมัติได้ด้วย:

```bash
node scripts/test-crud-verify.mjs
```

Script จะทำการ:
1. Login ด้วย admin account
2. สร้าง record ใหม่ในทุกตาราง
3. ตรวจสอบว่า record อยู่ใน DB (ผ่าน GET API)
4. อัปเดต record
5. ตรวจสอบว่าข้อมูลเปลี่ยนใน DB
6. ลบ record
7. ตรวจสอบว่า record ถูกลบจาก DB
8. แสดงผลรวม PASS/FAIL
