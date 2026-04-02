# Test Cases: Arrival Dashboard

> หน้า Dashboard แสดงข้อมูลการมาถึงของ visitor (สำหรับ officer)

---

### TC-AD-01: ดูรายการ groups (GET /api/appointments/groups) -- แสดง stats arrivedToday

**Preconditions:**
- Officer login เข้า Web Dashboard แล้ว
- มี appointment groups หลายกลุ่มสำหรับวันนี้
- บาง visitor ใน group check-in แล้ว, บางคนยังไม่มา

**Steps:**
1. Officer เปิดหน้า Arrival Dashboard
2. ระบบเรียก `GET /api/appointments/groups?date=today`
3. แสดงรายการ groups

**Expected Result:**
- แสดง group list พร้อม stats แต่ละ group:
  - ชื่อ group
  - จำนวน visitor ทั้งหมด
  - `arrivedToday`: จำนวนที่ check-in แล้ววันนี้
  - `pending`: จำนวนที่ยังไม่มา
  - สถานะ group (active, completed)
- เรียงลำดับตามเวลานัดหมาย
- Stats ตรงกับข้อมูลจริงใน database

**Related:**
- API: `GET /api/appointments/groups?date=today`
- Rule: Stats calculated from `visitor_entries` where `entryDate = today`
- File: `dashboard/ArrivalDashboard.tsx`, `services/groupService.ts`

---

### TC-AD-02: เข้า group detail (single mode) -- progress bar + ตาราง visitor

**Preconditions:**
- มี appointment group แบบ `type = single` (นัดครั้งเดียว)
- Group มี visitor 5 คน, 2 คน check-in แล้ว

**Steps:**
1. Officer กดเข้า group detail จากรายการ
2. ระบบเรียก `GET /api/appointments/groups/:id`

**Expected Result:**
- แสดง progress bar: 2/5 (40%)
- แสดงตาราง visitor:
  - ชื่อ, เบอร์โทร, ID number
  - สถานะ: checked-in (สีเขียว) / ยังไม่มา (สีเทา)
  - เวลา check-in (ถ้า check-in แล้ว)
- มี toggle `notifyOnCheckin` ระดับ group
- มี toggle `notifyOnCheckin` ทีละ appointment

**Related:**
- API: `GET /api/appointments/groups/:id`
- Rule: Single mode shows all visitors in flat table
- File: `dashboard/GroupDetail.tsx`, `components/VisitorTable.tsx`

---

### TC-AD-03: เข้า group detail (period mode) -- date selector + stats แยกรายวัน

**Preconditions:**
- มี appointment group แบบ `type = period` (นัดหลายวัน)
- `dateStart = 2026-04-01`, `dateEnd = 2026-04-05`
- วันนี้ = 2026-04-02 (วันที่ 2 จาก 5)

**Steps:**
1. Officer กดเข้า group detail จากรายการ
2. ระบบเรียก `GET /api/appointments/groups/:id?date=today`

**Expected Result:**
- แสดง date selector (calendar/dropdown) ให้เลือกวันในช่วง period
- Default เลือกวันนี้ (2026-04-02)
- แสดง stats ของวันที่เลือก:
  - `arrivedToday`: จำนวน check-in วันนี้
  - `totalVisitors`: จำนวน visitor ทั้งหมด
- แสดงตาราง visitor พร้อม `todayEntry` (check-in วันนี้หรือยัง)
- แสดง "วันที่ 2/5" indicator

**Related:**
- API: `GET /api/appointments/groups/:id?date=2026-04-02`
- Rule: Period mode shows per-day stats with date navigation
- File: `dashboard/GroupDetail.tsx`, `components/DateSelector.tsx`

---

### TC-AD-04: เลือกวันอื่นใน period -- stats เปลี่ยน + todayEntry อัปเดต

**Preconditions:**
- อยู่ที่หน้า group detail ของ period appointment (จาก TC-AD-03)
- วันที่ 2026-04-01 มี visitor check-in 3 คน
- วันที่ 2026-04-02 มี visitor check-in 1 คน

**Steps:**
1. Officer เลือกวันที่ 2026-04-01 จาก date selector
2. ระบบเรียก `GET /api/appointments/groups/:id?date=2026-04-01`

**Expected Result:**
- Stats อัปเดตเป็นข้อมูลของ 2026-04-01:
  - `arrivedToday = 3`
- ตาราง visitor อัปเดต `todayEntry` ตามวันที่เลือก
- Visitor ที่ check-in วันที่ 01 แสดงสถานะ checked-in
- Visitor ที่ไม่ได้ check-in วันที่ 01 แสดง "ยังไม่มา"
- Date selector highlight วันที่เลือก

**Related:**
- API: `GET /api/appointments/groups/:id?date=2026-04-01`
- Rule: Each date shows independent entry records
- File: `dashboard/GroupDetail.tsx`, `components/DateSelector.tsx`

---

### TC-AD-05: Toggle notifyOnCheckin ระดับ group -- cascade ทุก appointment

**Preconditions:**
- อยู่ที่หน้า group detail
- Group มี appointment 5 รายการ
- ทุก appointment มี `notifyOnCheckin = false`

**Steps:**
1. Officer toggle switch "แจ้งเตือนเมื่อ check-in" ระดับ group เป็น ON
2. ระบบส่ง API update

**Expected Result:**
- เรียก API update group-level notification setting
- ทุก appointment ใน group เปลี่ยน `notifyOnCheckin = true` (cascade)
- UI อัปเดต toggle ของทุก appointment เป็น ON
- แสดง toast "เปิดการแจ้งเตือนสำหรับทุกคนในกลุ่ม"

**Related:**
- API: `PATCH /api/appointments/groups/:id/notify` with `{ notifyOnCheckin: true, cascade: true }`
- Rule: Group-level toggle cascades to all child appointments
- File: `dashboard/GroupDetail.tsx`, `services/notificationSettingService.ts`

---

### TC-AD-06: Toggle notifyOnCheckin ทีละ appointment -- เฉพาะ appointment นั้น

**Preconditions:**
- อยู่ที่หน้า group detail
- Group มี appointment 5 รายการ
- Appointment A มี `notifyOnCheckin = false`

**Steps:**
1. Officer toggle switch "แจ้งเตือน" ของ Appointment A เป็น ON
2. ระบบส่ง API update

**Expected Result:**
- เรียก API update เฉพาะ Appointment A
- Appointment A เปลี่ยน `notifyOnCheckin = true`
- Appointment อื่นไม่เปลี่ยน (ยังเป็น false)
- Group-level toggle แสดง indeterminate state (ถ้ามี mixed values)
- แสดง toast "เปิดการแจ้งเตือนสำหรับ [ชื่อ visitor]"

**Related:**
- API: `PATCH /api/appointments/:id` with `{ notifyOnCheckin: true }`
- Rule: Individual toggle does not affect other appointments in group
- File: `dashboard/GroupDetail.tsx`, `components/VisitorTable.tsx`

---

### TC-AD-07: Filter "ยังไม่มา" -- แสดงเฉพาะ visitor ที่ todayEntry = null

**Preconditions:**
- อยู่ที่หน้า group detail
- Group มี visitor 5 คน: 3 คน check-in แล้ว, 2 คนยังไม่มา

**Steps:**
1. Officer กดปุ่ม filter "ยังไม่มา"
2. ตาราง visitor ถูก filter

**Expected Result:**
- ตารางแสดงเฉพาะ visitor ที่ `todayEntry = null` (2 คน)
- Visitor ที่ check-in แล้วถูกซ่อน
- Stats bar ยังแสดงตัวเลขรวมทั้งหมด (2/5)
- มีปุ่ม "แสดงทั้งหมด" เพื่อ clear filter
- Filter state ไม่หายเมื่อ auto-refresh

**Related:**
- API: Client-side filtering (ไม่เรียก API ใหม่)
- Rule: Filter applies to display only, does not affect data
- File: `dashboard/GroupDetail.tsx`, `components/VisitorTable.tsx`

---

### TC-AD-08: Auto-refresh ทุก 30 วินาที -- stats อัปเดต เมื่อ visitor check-in ใหม่

**Preconditions:**
- อยู่ที่หน้า group detail
- Group มี 5 visitor: 2 check-in แล้ว (stats = 2/5)
- Visitor คนที่ 3 กำลังจะ check-in ที่ Kiosk

**Steps:**
1. Officer เปิดหน้า group detail ค้างไว้
2. Visitor คนที่ 3 check-in สำเร็จที่ Kiosk
3. รอ auto-refresh cycle (30 วินาที)

**Expected Result:**
- หลัง 30 วินาที ระบบเรียก API ใหม่อัตโนมัติ
- Stats อัปเดตจาก 2/5 เป็น 3/5
- Progress bar อัปเดต
- ตาราง visitor อัปเดต: visitor คนที่ 3 แสดงสถานะ checked-in
- ไม่มี full page reload (partial update)
- ถ้า officer กำลัง interact (scroll, filter) ไม่ reset scroll position

**Related:**
- API: `GET /api/appointments/groups/:id?date=today` (polling every 30s)
- Rule: Auto-refresh interval = 30 seconds (configurable)
- File: `dashboard/GroupDetail.tsx`, `hooks/useAutoRefresh.ts`
