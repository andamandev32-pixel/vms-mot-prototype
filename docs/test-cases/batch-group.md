# Module 4: Batch/Group

> ทดสอบการสร้างและจัดการ batch group (นัดหมายกลุ่ม)
> ครอบคลุม single/period mode, daySchedules, group list/detail, cancel cascade, notify toggle

---

### TC-BG-01: สร้าง batch group (single mode) 5 คน — 5 appointments + 1 group

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId
- เตรียมข้อมูล visitors 5 คน (name, phone)

**Steps:**
1. ส่ง `POST /api/appointments/batch` พร้อม body:
   - `mode="single"`, `purposeId`, `deptId`, `dateStart`, `timeStart`, `timeEnd`
   - `visitors`: array ของ 5 คน พร้อม `name`, `phone`
2. ตรวจสอบ response

**Expected Result:**
- Response status `201 Created`
- Response มี `group` object พร้อม `groupId`
- Response มี `appointments` array ขนาด 5
- แต่ละ appointment มี `groupId` เดียวกัน
- แต่ละ appointment มี `appointmentCode` ที่ต่างกัน
- Group record มี `totalVisitors=5`

**Related:**
- API: `POST /api/appointments/batch`
- Rule: Batch creation logic
- File: `src/api/appointments/batch.ts`, `src/services/groupService.ts`

---

### TC-BG-02: สร้าง batch group (period mode) 3 คน 2 วัน — 3 appointments + 1 group + dateEnd

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `allowPeriod=true`
- เตรียมข้อมูล visitors 3 คน

**Steps:**
1. ส่ง `POST /api/appointments/batch` พร้อม body:
   - `mode="period"`, `dateStart="2026-04-10"`, `dateEnd="2026-04-11"`, `timeStart`, `timeEnd`
   - `visitors`: array ของ 3 คน
2. ตรวจสอบ response

**Expected Result:**
- Response status `201 Created`
- Response มี `group` object พร้อม `groupId`, `mode="period"`, `dateEnd="2026-04-11"`
- Response มี `appointments` array ขนาด 3
- แต่ละ appointment มี `mode="period"`, `dateStart`, `dateEnd` ตรงกัน
- แต่ละ appointment สามารถ check-in ได้ทั้ง 2 วัน

**Related:**
- API: `POST /api/appointments/batch`
- Rule: Period batch creation
- File: `src/api/appointments/batch.ts`, `src/services/groupService.ts`

---

### TC-BG-03: สร้าง batch group + daySchedules (เวลาแยกรายวัน) — สร้าง DaySchedule records

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `allowPeriod=true`
- เตรียม daySchedules data สำหรับแต่ละวัน

**Steps:**
1. ส่ง `POST /api/appointments/batch` พร้อม body:
   - `mode="period"`, `dateStart="2026-04-10"`, `dateEnd="2026-04-12"`
   - `daySchedules`: `[{"date":"2026-04-10","timeStart":"09:00","timeEnd":"12:00"},{"date":"2026-04-11","timeStart":"13:00","timeEnd":"17:00"},{"date":"2026-04-12","timeStart":"09:00","timeEnd":"11:00"}]`
   - `visitors`: array ของ visitors
2. ตรวจสอบ response และ DaySchedule records

**Expected Result:**
- Response status `201 Created`
- DaySchedule records ถูกสร้าง 3 records (1 ต่อวัน)
- แต่ละ DaySchedule มี `timeStart`, `timeEnd` ตรงกับที่ส่งมา
- DaySchedule ถูกผูกกับ `groupId`
- เมื่อ check-in วันที่ 10 จะใช้เวลา 09:00-12:00, วันที่ 11 ใช้ 13:00-17:00

**Related:**
- API: `POST /api/appointments/batch`
- Rule: DaySchedule creation
- File: `src/api/appointments/batch.ts`, `src/models/DaySchedule.ts`

---

### TC-BG-04: ดึง group list (GET /api/appointments/groups) — arrival stats

**Preconditions:**
- มี Groups หลายกลุ่มในระบบ (ทั้ง single และ period mode)
- บาง group มี visitors ที่ check-in แล้ว วันนี้

**Steps:**
1. ส่ง `GET /api/appointments/groups?date=2026-04-10`
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- Response มี array ของ groups
- แต่ละ group มี field: `groupId`, `purposeName`, `deptName`, `totalVisitors`, `arrivedToday`, `mode`
- `arrivedToday` นับเฉพาะ check-in ของวันที่ filter (ไม่รวมวันอื่น)
- Groups เรียงลำดับตาม `dateStart` หรือ `createdAt`

**Related:**
- API: `GET /api/appointments/groups`
- Rule: Group list with arrival stats
- File: `src/api/appointments/groups.ts`, `src/services/groupService.ts`

---

### TC-BG-05: ดึง group detail วันที่ 1 — stats + todayEntry per visitor

**Preconditions:**
- มี Group (period mode) ที่ `dateStart="2026-04-10"`, `dateEnd="2026-04-12"`, visitors 5 คน
- วันที่ 10: 3 คน check-in แล้ว

**Steps:**
1. ส่ง `GET /api/appointments/groups/:groupId?date=2026-04-10`
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- `stats.arrivedToday` = `3`
- `stats.totalVisitors` = `5`
- `stats.pendingToday` = `2`
- `visitors` array มี 5 คน แต่ละคนมี `todayEntry` (null หรือ entry object)
- Visitors ที่ check-in แล้วมี `todayEntry.checkinAt` ไม่เป็น null

**Related:**
- API: `GET /api/appointments/groups/:groupId`
- Rule: Daily stats per group
- File: `src/api/appointments/groups.ts`, `src/services/groupService.ts`

---

### TC-BG-06: ดึง group detail วันที่ 2 — stats ต่าง (อาจ 0 arrivedToday)

**Preconditions:**
- มี Group เดิมจาก TC-BG-05
- วันที่ 11: ยังไม่มีใคร check-in

**Steps:**
1. ส่ง `GET /api/appointments/groups/:groupId?date=2026-04-11`
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- `stats.arrivedToday` = `0` (ยังไม่มีใคร check-in วันที่ 11)
- `stats.totalVisitors` = `5`
- `visitors` array ทุกคนมี `todayEntry` = `null`
- Stats ไม่รวม entry ของวันที่ 10 เข้ามา

**Related:**
- API: `GET /api/appointments/groups/:groupId`
- Rule: Daily stats isolation
- File: `src/api/appointments/groups.ts`, `src/services/groupService.ts`

---

### TC-BG-07: ยกเลิก group (PATCH status=cancelled) — cascade ทุก appointment

**Preconditions:**
- มี Group ที่มี appointments 5 ตัว ทั้งหมด `status="approved"`
- ยังไม่มี entry ที่ active (ไม่มีใคร check-in อยู่)

**Steps:**
1. ส่ง `PATCH /api/appointments/groups/:groupId` พร้อม body `{ "status": "cancelled" }`
2. ตรวจสอบ response และ appointments ทุกตัว

**Expected Result:**
- Response status `200 OK`
- Group `status` = `"cancelled"`
- ทุก appointment ใน group เปลี่ยนเป็น `status="cancelled"`
- ทุก appointment มี `cancelledAt` ถูก set
- ไม่สามารถ check-in appointment ใดใน group ได้อีก

**Related:**
- API: `PATCH /api/appointments/groups/:groupId`
- Rule: Cascade cancellation
- File: `src/api/appointments/groups.ts`, `src/services/groupService.ts`

---

### TC-BG-08: Toggle notifyOnCheckin ระดับ group — cascade ทุก appointment

**Preconditions:**
- มี Group ที่มี appointments 5 ตัว ทุกตัว `notifyOnCheckin=true`

**Steps:**
1. ส่ง `PATCH /api/appointments/groups/:groupId/notify` พร้อม body `{ "notifyOnCheckin": false }`
2. ตรวจสอบ response และ appointments ทุกตัว

**Expected Result:**
- Response status `200 OK`
- ทุก appointment ใน group เปลี่ยนเป็น `notifyOnCheckin=false`
- เมื่อ check-in visitor คนใดใน group จะไม่ส่ง notification
- Group record มี `notifyOnCheckin=false`

**Related:**
- API: `PATCH /api/appointments/groups/:groupId/notify`
- Rule: Cascade notify toggle
- File: `src/api/appointments/groups.ts`, `src/services/notificationService.ts`
