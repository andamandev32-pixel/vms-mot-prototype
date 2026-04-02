# Test Cases: Counter Check-in

> ระบบ check-in ผ่าน Counter (เจ้าหน้าที่ดำเนินการ)

---

### TC-CC-01: Walk-in check-in ปกติ (requireApproval=false) -- checked-in

**Preconditions:**
- Officer login เข้า Counter app แล้ว
- Organization setting: `requireApproval = false`
- Visitor มาถึง counter พร้อมบัตรประชาชน/passport

**Steps:**
1. Officer เลือก "Walk-in Check-in"
2. กรอกข้อมูล visitor: ชื่อ, เบอร์โทร, ID number
3. เลือกแผนก/ผู้ติดต่อ (contact person)
4. ถ่ายรูป visitor (webcam)
5. กด "Check-in"

**Expected Result:**
- ระบบสร้าง `visitor_entry` ด้วย `status = checked-in`
- ไม่ต้องรอ approval (bypass เพราะ `requireApproval = false`)
- แสดงหน้ายืนยัน check-in สำเร็จ
- Badge พร้อมพิมพ์

**Related:**
- API: `POST /api/counter/walkin-checkin`
- Rule: `requireApproval = false` bypass approval flow
- File: `counter/WalkinCheckinForm.tsx`, `services/checkinService.ts`

---

### TC-CC-02: Walk-in check-in (requireApproval=true) -- สร้าง pending appointment -- แจ้ง approver

**Preconditions:**
- Officer login เข้า Counter app แล้ว
- Organization setting: `requireApproval = true`
- Officer ไม่มีสิทธิ์ approve (`canApprove = false`)

**Steps:**
1. Officer เลือก "Walk-in Check-in"
2. กรอกข้อมูล visitor ครบถ้วน
3. เลือกแผนก/ผู้ติดต่อ
4. กด "ส่งคำขออนุมัติ"

**Expected Result:**
- ระบบสร้าง appointment ด้วย `status = pending`
- ส่ง notification ไปยัง approver (LINE OA / Web Dashboard)
- Counter แสดงข้อความ "ส่งคำขออนุมัติแล้ว กรุณารอ"
- Visitor entry ยังไม่ถูกสร้าง (รอ approve ก่อน)

**Related:**
- API: `POST /api/counter/walkin-checkin`, `POST /api/notifications/approval-request`
- Rule: `requireApproval = true` + `canApprove = false` triggers approval flow
- File: `counter/WalkinCheckinForm.tsx`, `services/approvalService.ts`

---

### TC-CC-03: Officer inline approve (canApprove=true) -- อนุมัติ + check-in ทันที

**Preconditions:**
- Officer login เข้า Counter app ด้วย role ที่มี `canApprove = true`
- Organization setting: `requireApproval = true`
- Visitor มาถึง counter

**Steps:**
1. Officer เลือก "Walk-in Check-in"
2. กรอกข้อมูล visitor ครบถ้วน
3. ระบบแสดง checkbox "อนุมัติและ check-in ทันที"
4. Officer ติ๊ก checkbox แล้วกด "อนุมัติ + Check-in"

**Expected Result:**
- ระบบสร้าง appointment ด้วย `status = approved` (auto-approve)
- สร้าง `visitor_entry` ด้วย `status = checked-in` ทันที
- `approvedBy` = officer ปัจจุบัน
- `approvedAt` = timestamp ปัจจุบัน
- ไม่ส่ง notification ไปยัง approver อื่น (เพราะ approve แล้ว)

**Related:**
- API: `POST /api/counter/walkin-checkin` with `inlineApprove = true`
- Rule: `canApprove = true` allows inline approval at counter
- File: `counter/WalkinCheckinForm.tsx`, `services/inlineApprovalService.ts`

---

### TC-CC-04: Appointment check-in -- verify ID -- match -- checked-in

**Preconditions:**
- มี appointment ที่ `status = approved` และ `dateStart = today`
- Visitor มาถึง counter พร้อมบัตรประชาชน

**Steps:**
1. Officer เลือก "Appointment Check-in"
2. ค้นหา appointment จากชื่อ, เบอร์โทร, หรือ ID number
3. เลือก appointment ที่ตรงกัน
4. Officer scan/กรอก ID number ของ visitor
5. ระบบ verify ID ตรงกับ appointment
6. กด "Check-in"

**Expected Result:**
- ID verification ผ่าน (`idNumber` ตรงกับ appointment record)
- สร้าง `visitor_entry` ด้วย `status = checked-in`
- `checkinMethod = counter`
- แสดงหน้ายืนยัน check-in สำเร็จ

**Related:**
- API: `GET /api/appointments/search`, `POST /api/counter/appointment-checkin`
- Rule: ID must match appointment's registered idNumber
- File: `counter/AppointmentCheckinForm.tsx`, `utils/idVerification.ts`

---

### TC-CC-05: Appointment check-in -- verify ID -- mismatch -- error

**Preconditions:**
- มี appointment ที่ `status = approved`
- Visitor มาถึง counter แต่ ID ไม่ตรงกับที่ลงทะเบียน

**Steps:**
1. Officer เลือก "Appointment Check-in"
2. ค้นหาและเลือก appointment
3. Officer scan/กรอก ID number ของ visitor
4. ระบบ verify ID ไม่ตรงกับ appointment

**Expected Result:**
- แสดง error "เลข ID ไม่ตรงกับข้อมูลการนัดหมาย"
- ไม่สร้าง `visitor_entry`
- แสดงตัวเลือก: "ลองใหม่" หรือ "ข้ามการตรวจสอบ (ต้อง override)"
- ถ้า officer กด override ต้องบันทึก `overrideReason`

**Related:**
- API: `POST /api/counter/appointment-checkin` returns 400
- Rule: ID mismatch blocks check-in unless officer overrides
- File: `counter/AppointmentCheckinForm.tsx`, `utils/idVerification.ts`

---

### TC-CC-06: Period appointment -- แสดง history + check-in วันใหม่

**Preconditions:**
- มี appointment แบบ `type = period`, `status = approved`
- `dateStart <= today <= dateEnd`
- มี `visitor_entry` จากวันก่อนหน้าแล้ว (เช่น เมื่อวาน)
- วันนี้ยังไม่มี entry

**Steps:**
1. Officer ค้นหาและเลือก period appointment
2. Counter แสดง entry history (วันที่เคย check-in)
3. Officer ยืนยัน check-in สำหรับวันนี้

**Expected Result:**
- แสดง history table: วันที่, เวลา check-in, เวลา check-out ของทุกวัน
- แสดง "วันที่ X จาก Y วัน"
- สร้าง `visitor_entry` ใหม่สำหรับวันนี้ ด้วย `status = checked-in`
- `entryDate = today`

**Related:**
- API: `GET /api/visitor-entries?appointmentId=xxx`, `POST /api/counter/appointment-checkin`
- Rule: Period appointment creates new entry per day
- File: `counter/PeriodAppointmentView.tsx`, `services/periodCheckinService.ts`

---

### TC-CC-07: Period appointment -- ซ้ำวันเดียวกัน -- error

**Preconditions:**
- มี appointment แบบ `type = period`, `status = approved`
- วันนี้มี `visitor_entry` อยู่แล้ว (`entryDate = today`)

**Steps:**
1. Officer ค้นหาและเลือก period appointment
2. Counter แสดง entry history
3. Officer พยายามกด "Check-in"

**Expected Result:**
- แสดง error "Visitor นี้ได้ check-in วันนี้แล้ว"
- แสดงเวลาที่ check-in ก่อนหน้า
- ปุ่ม "Check-in" ถูก disable
- ไม่สร้าง `visitor_entry` ซ้ำ

**Related:**
- API: `POST /api/counter/appointment-checkin` returns 409 Conflict
- Rule: 1 entry per day per appointment (duplicate prevention)
- File: `services/periodCheckinService.ts`, `utils/entryValidator.ts`

---

### TC-CC-08: Checkout -- scan badge -- confirm -- checked-out

**Preconditions:**
- Visitor มี `visitor_entry` ที่ `status = checked-in`
- Visitor มี badge/slip ที่มี barcode/QR

**Steps:**
1. Officer เลือก "Check-out"
2. Scan barcode/QR จาก badge ของ visitor
3. ระบบแสดงข้อมูล visitor entry (ชื่อ, เวลา check-in, แผนก)
4. Officer กด "ยืนยัน Check-out"

**Expected Result:**
- `visitor_entry.status` เปลี่ยนเป็น `checked-out`
- `visitor_entry.checkoutTime` = timestamp ปัจจุบัน
- แสดงระยะเวลาที่อยู่ในอาคาร (duration)
- แสดงหน้ายืนยัน check-out สำเร็จ

**Related:**
- API: `POST /api/counter/checkout`
- Rule: Only `checked-in` entries can be checked out
- File: `counter/CheckoutForm.tsx`, `services/checkoutService.ts`

---

### TC-CC-09: Badge print -- thermal printer -- slip data

**Preconditions:**
- Visitor check-in สำเร็จแล้ว (มี `visitor_entry`)
- Thermal printer เชื่อมต่อกับ Counter PC

**Steps:**
1. หลัง check-in สำเร็จ กด "พิมพ์ Badge"
2. ระบบ generate badge data
3. ส่งไปยัง thermal printer

**Expected Result:**
- Badge/slip แสดงข้อมูล:
  - ชื่อ visitor
  - รูปถ่าย (ถ้ามี)
  - แผนก/ผู้ติดต่อ
  - วันที่ + เวลา check-in
  - QR/barcode สำหรับ check-out
  - หมายเลข badge
- พิมพ์สำเร็จ ไม่มี error

**Related:**
- API: `GET /api/counter/badge-data/:entryId`
- Rule: Badge template configurable per organization
- File: `counter/BadgePrint.tsx`, `services/printService.ts`, `templates/badgeTemplate.ts`

---

### TC-CC-10: requirePersonName=false -- WALKIN_CONTACT optional (skip ได้)

**Preconditions:**
- Organization setting: `requirePersonName = false`
- Officer อยู่ที่หน้า Walk-in Check-in form

**Steps:**
1. Officer เลือก "Walk-in Check-in"
2. กรอกข้อมูล visitor (ชื่อ, ID)
3. ข้าม field "ผู้ติดต่อ" (contact person) -- ไม่กรอก
4. กด "Check-in"

**Expected Result:**
- ระบบอนุญาตให้ check-in โดยไม่ต้องระบุผู้ติดต่อ
- Field "ผู้ติดต่อ" แสดงเป็น optional (ไม่มี * required)
- `visitor_entry.contactPerson` = null
- Check-in สำเร็จปกติ

**Related:**
- API: `POST /api/counter/walkin-checkin` with `contactPerson = null`
- Rule: `requirePersonName = false` makes WALKIN_CONTACT step optional
- File: `counter/WalkinCheckinForm.tsx`, `config/organizationSettings.ts`
