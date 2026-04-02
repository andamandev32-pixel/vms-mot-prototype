# Test Cases: Overstay & Auto-Expire

> ระบบตรวจจับ overstay และ auto-expire สำหรับ appointment/entry

---

### TC-OE-01: Overstay detect -- entry ที่ checked-in + NOW > timeEnd -- status=overstay

**Preconditions:**
- มี `visitor_entry` ที่ `status = checked-in`
- เวลาปัจจุบัน (NOW) เกิน `timeEnd` ที่กำหนด
- Cron job `overstayChecker` active

**Steps:**
1. Cron job รันตาม schedule (ทุก 5 นาที)
2. Query entries: `status = checked-in AND NOW > resolvedTimeEnd`
3. พบ entry ที่เข้าเงื่อนไข overstay

**Expected Result:**
- `visitor_entry.status` เปลี่ยนเป็น `overstay`
- `visitor_entry.overstayDetectedAt` = timestamp ปัจจุบัน
- Trigger overstay notification (ส่งไปยัง officer + security)
- บันทึก log: entry ID, expected timeEnd, detected time

**Related:**
- API: Internal cron (ไม่มี public API)
- Rule: Overstay = `checked-in` entry where `NOW > resolvedTimeEnd`
- File: `cron/overstayChecker.ts`, `services/overstayService.ts`

---

### TC-OE-02: Overstay ใช้ daySchedule timeEnd (priority 1)

**Preconditions:**
- มี `visitor_entry` ที่ `status = checked-in`
- Appointment เป็นแบบ period และมี `daySchedule` กำหนดไว้
- `daySchedule` ของวันนี้: `{ timeEnd: "16:00" }`
- Group-level `timeEnd = "17:00"`
- Appointment-level `timeEnd = "18:00"`
- เวลาปัจจุบัน = 16:05

**Steps:**
1. Cron job รัน overstay check
2. ระบบ resolve `timeEnd` ตาม priority:
   - Priority 1: `daySchedule.timeEnd`
   - Priority 2: `group.timeEnd`
   - Priority 3: `appointment.timeEnd`
   - Priority 4: `business_hours.closeTime`

**Expected Result:**
- ระบบใช้ `daySchedule.timeEnd = 16:00` (priority สูงสุด)
- ตรวจพบ overstay เพราะ 16:05 > 16:00
- ไม่ใช้ group (17:00) หรือ appointment (18:00)
- `resolvedTimeEnd` ใน log = "16:00"

**Related:**
- API: Internal cron
- Rule: timeEnd priority: daySchedule > group > appointment > business_hours
- File: `cron/overstayChecker.ts`, `utils/timeEndResolver.ts`

---

### TC-OE-03: Overstay ใช้ group.timeEnd เมื่อไม่มี daySchedule (priority 2)

**Preconditions:**
- มี `visitor_entry` ที่ `status = checked-in`
- Appointment เป็นแบบ period แต่ไม่มี `daySchedule` สำหรับวันนี้
- Group-level `timeEnd = "17:00"`
- Appointment-level `timeEnd = "18:00"`
- เวลาปัจจุบัน = 17:05

**Steps:**
1. Cron job รัน overstay check
2. ระบบ resolve `timeEnd`:
   - Priority 1: `daySchedule` = ไม่มี (skip)
   - Priority 2: `group.timeEnd` = "17:00" (ใช้ตัวนี้)

**Expected Result:**
- ระบบใช้ `group.timeEnd = 17:00`
- ตรวจพบ overstay เพราะ 17:05 > 17:00
- ไม่ใช้ appointment.timeEnd (18:00) เพราะ group มี priority สูงกว่า
- `resolvedTimeEnd` ใน log = "17:00"

**Related:**
- API: Internal cron
- Rule: timeEnd priority: daySchedule > group > appointment > business_hours
- File: `cron/overstayChecker.ts`, `utils/timeEndResolver.ts`

---

### TC-OE-04: Overstay ใช้ appointment.timeEnd เมื่อไม่มี group (priority 3)

**Preconditions:**
- มี `visitor_entry` ที่ `status = checked-in`
- Appointment เป็นแบบ single (ไม่มี group หรือ group ไม่มี timeEnd)
- ไม่มี `daySchedule`
- Appointment-level `timeEnd = "15:00"`
- เวลาปัจจุบัน = 15:10

**Steps:**
1. Cron job รัน overstay check
2. ระบบ resolve `timeEnd`:
   - Priority 1: `daySchedule` = ไม่มี (skip)
   - Priority 2: `group.timeEnd` = ไม่มี (skip)
   - Priority 3: `appointment.timeEnd` = "15:00" (ใช้ตัวนี้)

**Expected Result:**
- ระบบใช้ `appointment.timeEnd = 15:00`
- ตรวจพบ overstay เพราะ 15:10 > 15:00
- `resolvedTimeEnd` ใน log = "15:00"

**Related:**
- API: Internal cron
- Rule: timeEnd priority: daySchedule > group > appointment > business_hours
- File: `cron/overstayChecker.ts`, `utils/timeEndResolver.ts`

---

### TC-OE-05: Overstay ใช้ business_hours.closeTime สำหรับ walk-in (priority 4)

**Preconditions:**
- มี `visitor_entry` ที่ `status = checked-in` จาก walk-in (ไม่มี appointment)
- ไม่มี `daySchedule`, `group`, หรือ `appointment` timeEnd
- Organization `business_hours.closeTime = "17:30"`
- เวลาปัจจุบัน = 17:35

**Steps:**
1. Cron job รัน overstay check
2. ระบบ resolve `timeEnd`:
   - Priority 1-3: ไม่มี (skip ทั้งหมด)
   - Priority 4: `business_hours.closeTime` = "17:30" (fallback)

**Expected Result:**
- ระบบใช้ `business_hours.closeTime = 17:30`
- ตรวจพบ overstay เพราะ 17:35 > 17:30
- `resolvedTimeEnd` ใน log = "17:30"
- Walk-in entries ใช้ business hours เป็น fallback เสมอ

**Related:**
- API: Internal cron
- Rule: Walk-in entries fallback to business_hours.closeTime
- File: `cron/overstayChecker.ts`, `utils/timeEndResolver.ts`, `config/businessHours.ts`

---

### TC-OE-06: Auto-expire single appointment (dateStart < today) -- status=expired

**Preconditions:**
- มี appointment แบบ `type = single`
- `dateStart = 2026-04-01` (เมื่อวาน)
- `status = approved` (ไม่ได้มา check-in)
- วันนี้ = 2026-04-02
- Cron job `appointmentExpirer` active

**Steps:**
1. Cron job รันตาม schedule (ทุกวัน เช่น 00:05)
2. Query appointments: `type = single AND dateStart < today AND status IN (approved, pending)`
3. พบ appointment ที่เข้าเงื่อนไข

**Expected Result:**
- `appointment.status` เปลี่ยนเป็น `expired`
- `appointment.expiredAt` = timestamp ปัจจุบัน
- QR Code ของ appointment นี้ใช้ไม่ได้อีก
- ไม่ส่ง notification (silent expiry)
- บันทึก log: appointment ID, original dateStart, expiry time

**Related:**
- API: Internal cron (ไม่มี public API)
- Rule: Single appointment expires when `dateStart` has passed
- File: `cron/appointmentExpirer.ts`, `services/expiryService.ts`

---

### TC-OE-07: Auto-expire period appointment (dateEnd < today) -- status=expired

**Preconditions:**
- มี appointment แบบ `type = period`
- `dateStart = 2026-03-25`, `dateEnd = 2026-04-01` (เมื่อวาน)
- `status = approved`
- วันนี้ = 2026-04-02
- Cron job `appointmentExpirer` active

**Steps:**
1. Cron job รันตาม schedule
2. Query appointments: `type = period AND dateEnd < today AND status IN (approved, pending)`
3. พบ appointment ที่เข้าเงื่อนไข

**Expected Result:**
- `appointment.status` เปลี่ยนเป็น `expired`
- `appointment.expiredAt` = timestamp ปัจจุบัน
- Period appointment ใช้ `dateEnd` (ไม่ใช่ `dateStart`) ในการตรวจสอบ
- `visitor_entries` ที่สร้างก่อนหน้าไม่ถูกกระทบ (ยังคงอยู่)
- QR Code ใช้ไม่ได้อีก

**Related:**
- API: Internal cron
- Rule: Period appointment expires when `dateEnd` has passed
- File: `cron/appointmentExpirer.ts`, `services/expiryService.ts`

---

### TC-OE-08: Group auto-complete (ทุก appointment expired/cancelled -- group.status=completed)

**Preconditions:**
- มี appointment group ที่มี appointment 3 รายการ
- Appointment A: `status = expired`
- Appointment B: `status = cancelled`
- Appointment C: `status = expired` (เพิ่ง expire โดย cron)

**Steps:**
1. Cron job expire Appointment C (ตัวสุดท้าย)
2. ระบบตรวจสอบ group: ทุก appointment อยู่ใน terminal state หรือไม่
3. ทุก appointment เป็น `expired` หรือ `cancelled`

**Expected Result:**
- `group.status` เปลี่ยนเป็น `completed`
- `group.completedAt` = timestamp ปัจจุบัน
- Group ไม่แสดงใน active dashboard อีก (ย้ายไป history)
- ไม่กระทบ `visitor_entries` ที่สร้างไว้ก่อนหน้า
- บันทึก log: group ID, completion reason = "all appointments terminal"

**Related:**
- API: Internal cron
- Rule: Group completes when ALL appointments are in terminal state (expired, cancelled, rejected)
- File: `cron/appointmentExpirer.ts`, `services/groupCompletionService.ts`
