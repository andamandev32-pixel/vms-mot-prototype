# Module 3: Period Mode

> ทดสอบการทำงานของ period mode (นัดหมายที่ check-in ได้หลายวัน)
> ครอบคลุม check-in หลายวัน, check-in ซ้ำ, boundary dates, single mode comparison, Kiosk/Counter display

---

### TC-PM-01: Check-in วันแรกของ period — สร้าง entry สำเร็จ

**Preconditions:**
- มี Appointment ที่ `mode="period"`, `status="approved"`, `dateStart="2026-04-10"`, `dateEnd="2026-04-12"`
- วันปัจจุบัน = `2026-04-10` (วันแรกของ period)
- ยังไม่มี Entry record สำหรับวันนี้

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode` ของ appointment นี้
2. ตรวจสอบ response และ Entry record

**Expected Result:**
- Response status `200 OK`
- Entry record ถูกสร้างใหม่ มี `checkinAt` = timestamp ปัจจุบัน
- Entry มี `entryDate` = `"2026-04-10"`
- Appointment `status` ยังคงเป็น `"approved"` (ไม่เปลี่ยนเป็น completed เพราะยังมีวันเหลือ)

**Related:**
- API: `POST /api/checkin`
- Rule: Period mode check-in logic
- File: `src/api/checkin/index.ts`, `src/services/periodService.ts`

---

### TC-PM-02: Check-in วันที่ 2 — สร้าง entry ใหม่สำเร็จ (คนละ entry จากวันที่ 1)

**Preconditions:**
- มี Appointment เดิมจาก TC-PM-01
- มี Entry record สำหรับวันที่ `2026-04-10` (check-out แล้ว)
- วันปัจจุบัน = `2026-04-11`

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode` เดิม
2. ตรวจสอบ response และ Entry records ทั้งหมด

**Expected Result:**
- Response status `200 OK`
- Entry record ใหม่ถูกสร้าง มี `entryDate` = `"2026-04-11"`
- Entry เดิมของวันที่ `2026-04-10` ยังอยู่ (ไม่ถูก overwrite)
- รวมมี 2 Entry records สำหรับ appointment นี้

**Related:**
- API: `POST /api/checkin`
- Rule: Period mode multi-day entry
- File: `src/api/checkin/index.ts`, `src/services/periodService.ts`

---

### TC-PM-03: Check-in ซ้ำวันเดียวกัน (มี checked-in entry อยู่)

**Preconditions:**
- มี Appointment ที่ `mode="period"`, `status="approved"`
- มี Entry record สำหรับวันปัจจุบัน ที่ยังไม่ check-out (`checkoutAt=null`)

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode` เดิมในวันเดียวกัน
2. ตรวจสอบ response

**Expected Result:**
- Response status `409 Conflict`
- Error message ระบุว่าได้ check-in แล้ววันนี้
- ไม่มี Entry record ใหม่ถูกสร้าง

**Related:**
- API: `POST /api/checkin`
- Rule: Duplicate check-in prevention
- File: `src/api/checkin/index.ts`, `src/services/periodService.ts`

---

### TC-PM-04: Check-in ก่อน dateStart

**Preconditions:**
- มี Appointment ที่ `mode="period"`, `status="approved"`, `dateStart="2026-04-10"`
- วันปัจจุบัน = `2026-04-09` (ก่อน dateStart)

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode`
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message: `"ยังไม่ถึงวันนัดหมาย"` หรือข้อความที่สื่อความหมายเดียวกัน
- ไม่มี Entry record ถูกสร้าง

**Related:**
- API: `POST /api/checkin`
- Rule: Date range validation
- File: `src/api/checkin/index.ts`, `src/services/periodService.ts`

---

### TC-PM-05: Check-in หลัง dateEnd

**Preconditions:**
- มี Appointment ที่ `mode="period"`, `status="approved"`, `dateEnd="2026-04-12"`
- วันปัจจุบัน = `2026-04-13` (หลัง dateEnd)

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode`
2. ตรวจสอบ response

**Expected Result:**
- Response status `410 Gone`
- Error message: `"นัดหมายหมดอายุ"` หรือข้อความที่สื่อความหมายเดียวกัน
- ไม่มี Entry record ถูกสร้าง

**Related:**
- API: `POST /api/checkin`
- Rule: Date range validation, expiration
- File: `src/api/checkin/index.ts`, `src/services/periodService.ts`

---

### TC-PM-06: Single mode check-in ครั้งแรก — สำเร็จ

**Preconditions:**
- มี Appointment ที่ `mode="single"`, `status="approved"`
- ยังไม่มี Entry record

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode`
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- Entry record ถูกสร้าง มี `checkinAt` = timestamp ปัจจุบัน
- Appointment ถูก mark เป็นใช้สิทธิ์แล้ว

**Related:**
- API: `POST /api/checkin`
- Rule: Single mode check-in logic
- File: `src/api/checkin/index.ts`

---

### TC-PM-07: Single mode check-in ครั้งที่ 2 — 409

**Preconditions:**
- มี Appointment ที่ `mode="single"`, `status="approved"`
- มี Entry record อยู่แล้ว (check-in ครั้งแรกเรียบร้อย)

**Steps:**
1. ส่ง `POST /api/checkin` พร้อม `appointmentCode` เดิม
2. ตรวจสอบ response

**Expected Result:**
- Response status `409 Conflict`
- Error message: `"ใช้สิทธิ์แล้ว"` หรือข้อความที่สื่อความหมายเดียวกัน
- ไม่มี Entry record ใหม่ถูกสร้าง

**Related:**
- API: `POST /api/checkin`
- Rule: Single mode one-time check-in
- File: `src/api/checkin/index.ts`

---

### TC-PM-08: Period appointment ที่ Kiosk — แสดง "วันที่ X/Y"

**Preconditions:**
- มี Appointment ที่ `mode="period"`, `dateStart="2026-04-10"`, `dateEnd="2026-04-12"` (3 วัน)
- วันปัจจุบัน = `2026-04-11` (วันที่ 2)
- Kiosk scan QR code ของ appointment นี้

**Steps:**
1. Scan QR code ที่ Kiosk
2. ระบบดึงข้อมูล appointment และคำนวณวัน
3. ตรวจสอบหน้าจอ Kiosk

**Expected Result:**
- Kiosk แสดงข้อมูล appointment ถูกต้อง
- แสดงข้อความ `"วันที่ 2/3"` (วันที่ 2 จาก 3 วัน)
- แสดง dateStart, dateEnd, และจำนวนวันคงเหลือ
- ปุ่ม Check-in พร้อมใช้งาน

**Related:**
- API: `GET /api/checkin/info/:code`
- Rule: Period day calculation
- File: `src/pages/kiosk/CheckinScreen.tsx`, `src/utils/periodHelper.ts`

---

### TC-PM-09: Period appointment ที่ Counter — แสดง history วันก่อนหน้า

**Preconditions:**
- มี Appointment ที่ `mode="period"`, มี Entry records วันก่อนหน้า 2 วัน
- วันปัจจุบัน = วันที่ 3 ของ period
- Staff เปิดหน้า Counter check-in

**Steps:**
1. Staff ค้นหา appointment ที่ counter
2. ระบบแสดงรายละเอียด appointment
3. ตรวจสอบ history section

**Expected Result:**
- แสดง entry history ของวันก่อนหน้า (วันที่ 1, วันที่ 2) พร้อม checkinAt, checkoutAt
- แสดงสถานะวันปัจจุบัน (ยังไม่ check-in หรือ checked-in แล้ว)
- Staff สามารถ check-in visitor ได้สำหรับวันปัจจุบัน

**Related:**
- API: `GET /api/appointments/:id/entries`
- Rule: Period entry history
- File: `src/pages/counter/AppointmentDetail.tsx`, `src/services/entryService.ts`

---

### TC-PM-10: Period + batch + arrival dashboard — stats แยกรายวัน

**Preconditions:**
- มี Batch group ที่ `mode="period"`, 5 visitors, `dateStart="2026-04-10"`, `dateEnd="2026-04-12"`
- วันที่ 1: 3 คน check-in, วันที่ 2: 4 คน check-in
- วันปัจจุบัน = `2026-04-11` (วันที่ 2)

**Steps:**
1. เปิด Arrival Dashboard
2. เลือก filter วันที่ `2026-04-11`
3. ตรวจสอบ stats ของ group

**Expected Result:**
- Dashboard แสดง stats สำหรับวันปัจจุบัน: `arrivedToday=4`, `totalExpected=5`
- ไม่รวม stats ของวันที่ 1 เข้ามา (stats แยกรายวัน)
- Group card แสดง progress bar ตาม arrivedToday / totalExpected
- สามารถ drill-down ดูรายบุคคลว่าใคร check-in แล้ว ใครยัง

**Related:**
- API: `GET /api/dashboard/arrivals?date=2026-04-11`
- Rule: Daily stats calculation for period groups
- File: `src/pages/dashboard/ArrivalDashboard.tsx`, `src/services/dashboardService.ts`
