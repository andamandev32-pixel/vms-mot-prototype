# Module 1: การสร้างนัดหมาย (Appointment Creation)

> ทดสอบการสร้างนัดหมายผ่าน API `POST /api/appointments` ในสถานการณ์ต่างๆ
> ครอบคลุม validation, channel control, blocklist, period mode, และ purpose/dept rules

---

### TC-AC-01: สร้างนัดหมายปกติ (require_approval=true, require_person_name=true)

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_approval=true` และ `require_person_name=true`
- มี Staff (host) ที่ active อยู่ในระบบ
- Visitor ยังไม่ถูก block

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม body:
   - `visitorName`, `visitorPhone`, `purposeId`, `deptId`, `hostStaffId`, `dateStart`, `timeStart`, `timeEnd`
2. ตรวจสอบ response

**Expected Result:**
- Response status `201 Created`
- `status` = `"pending"` (เพราะ require_approval=true)
- `hostStaffId` ถูกบันทึกตรงกับที่ส่งมา
- `appointmentCode` ถูก generate อัตโนมัติ
- Record ถูกบันทึกใน database พร้อม `createdAt`

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_approval`, `VisitRule.require_person_name`
- File: `src/api/appointments/create.ts`, `src/services/appointmentService.ts`

---

### TC-AC-02: สร้างนัดหมาย ไม่ต้องระบุ host (require_person_name=false)

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_person_name=false`
- Visitor ยังไม่ถูก block

**Steps:**
1. ส่ง `POST /api/appointments` โดยไม่ส่ง `hostStaffId` (หรือส่งเป็น null)
2. ตรวจสอบ response

**Expected Result:**
- Response status `201 Created`
- `hostStaffId` = `null`
- Appointment ถูกสร้างสำเร็จโดยไม่มี host

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_person_name`
- File: `src/api/appointments/create.ts`

---

### TC-AC-03: สร้างนัดหมายจาก channel ที่ไม่อนุญาต (acceptFromWeb=false)

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `acceptFromWeb=false`
- Request มาจาก channel = `"web"`

**Steps:**
1. ส่ง `POST /api/appointments` จาก web channel พร้อม purposeId + deptId ที่ไม่อนุญาต web
2. ตรวจสอบ response

**Expected Result:**
- Response status `403 Forbidden`
- Error message ระบุว่า channel นี้ไม่ได้รับอนุญาตสำหรับ purpose/dept ที่เลือก
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.acceptFromWeb`, `VisitRule.acceptFromLINE`, `VisitRule.acceptFromKiosk`
- File: `src/api/appointments/create.ts`, `src/middleware/channelValidation.ts`

---

### TC-AC-04: สร้างนัดหมาย visitor ถูก block (isBlocked=true)

**Preconditions:**
- มี Visitor record ที่ `isBlocked=true` (เคยถูก block ไว้)
- มี VisitRule ที่ตรงกับ purposeId + deptId

**Steps:**
1. ส่ง `POST /api/appointments` โดยใช้ `visitorPhone` หรือ `visitorIdCard` ของ visitor ที่ถูก block
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request` หรือ `403 Forbidden`
- Error message ระบุว่า visitor ถูก block ไม่สามารถสร้างนัดหมายได้
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `Visitor.isBlocked`
- File: `src/api/appointments/create.ts`, `src/services/visitorService.ts`

---

### TC-AC-05: สร้างนัดหมาย period mode สำเร็จ

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `allowPeriod=true`
- กำหนด `dateStart` และ `dateEnd` ที่ถูกต้อง (dateEnd > dateStart)

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม body ที่มี `dateStart`, `dateEnd`, `mode="period"`
2. ตรวจสอบ response

**Expected Result:**
- Response status `201 Created`
- `mode` = `"period"`
- `dateStart` และ `dateEnd` ถูกบันทึกตรงกับที่ส่งมา
- Appointment สามารถ check-in ได้หลายวันภายใน range

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.allowPeriod`
- File: `src/api/appointments/create.ts`, `src/services/periodService.ts`

---

### TC-AC-06: สร้างนัดหมาย period mode ไม่มี dateEnd

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `allowPeriod=true`

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม `mode="period"` แต่ไม่ส่ง `dateEnd`
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message ระบุว่า `dateEnd` จำเป็นสำหรับ period mode
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.allowPeriod`, validation schema
- File: `src/api/appointments/create.ts`, `src/validators/appointmentValidator.ts`

---

### TC-AC-07: สร้างนัดหมาย period mode ที่ purpose ไม่อนุญาต

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `allowPeriod=false`

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม `mode="period"`, `dateStart`, `dateEnd`
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message ระบุว่า purpose/dept นี้ไม่อนุญาตให้ใช้ period mode
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.allowPeriod`
- File: `src/api/appointments/create.ts`

---

### TC-AC-08: สร้างนัดหมาย purpose+dept ที่ไม่มี rule

**Preconditions:**
- ไม่มี VisitRule record สำหรับ purposeId + deptId ที่จะส่ง

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม purposeId + deptId ที่ไม่มี VisitRule match
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message ระบุว่าไม่พบ rule สำหรับ purpose/dept ที่เลือก
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule` lookup logic
- File: `src/api/appointments/create.ts`, `src/services/visitRuleService.ts`

---

### TC-AC-09: สร้างนัดหมาย require_person_name=true แต่ไม่ส่ง hostStaffId

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_person_name=true`

**Steps:**
1. ส่ง `POST /api/appointments` โดยไม่ส่ง `hostStaffId` (หรือส่งเป็น null)
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message ระบุว่าต้องระบุ hostStaffId เมื่อ rule กำหนด require_person_name=true
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_person_name`
- File: `src/api/appointments/create.ts`, `src/validators/appointmentValidator.ts`

---

### TC-AC-10: สร้างนัดหมาย dateEnd <= dateStart (period mode)

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `allowPeriod=true`

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม `mode="period"`, `dateStart="2026-04-10"`, `dateEnd="2026-04-09"` (dateEnd ก่อน dateStart)
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message ระบุว่า dateEnd ต้องมากกว่า dateStart
- ไม่มี record ถูกสร้างใน database

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.allowPeriod`, date validation
- File: `src/api/appointments/create.ts`, `src/validators/appointmentValidator.ts`
