# Module 5: Notification

> ทดสอบระบบแจ้งเตือน (notification) ในสถานการณ์ต่างๆ
> ครอบคลุม check-in notify, approval flow, overstay alerts, auto-cancel, และ toggle settings

---

### TC-NF-01: Check-in พร้อม notifyOnCheckin=true — notification ส่ง

**Preconditions:**
- มี Appointment ที่ `status="approved"` และ `notifyOnCheckin=true`
- มี Host staff ที่ผูกกับ appointment พร้อม LINE userId หรือ notification channel

**Steps:**
1. Visitor check-in ผ่าน Kiosk หรือ Counter (`POST /api/checkin`)
2. ตรวจสอบ notification ที่ถูกส่ง

**Expected Result:**
- Check-in สำเร็จ (status `200 OK`)
- Notification ถูกส่งไป host staff
- Notification มีข้อมูล: ชื่อ visitor, เวลา check-in, สถานที่
- Notification record ถูกบันทึกใน database พร้อม `sentAt`, `recipientId`, `type="checkin"`

**Related:**
- API: `POST /api/checkin`
- Rule: `Appointment.notifyOnCheckin`
- File: `src/services/notificationService.ts`, `src/services/checkinService.ts`

---

### TC-NF-02: Check-in พร้อม notifyOnCheckin=false — ไม่มี notification

**Preconditions:**
- มี Appointment ที่ `status="approved"` และ `notifyOnCheckin=false`
- มี Host staff ที่ผูกกับ appointment

**Steps:**
1. Visitor check-in ผ่าน Kiosk หรือ Counter (`POST /api/checkin`)
2. ตรวจสอบว่าไม่มี notification ถูกส่ง

**Expected Result:**
- Check-in สำเร็จ (status `200 OK`)
- ไม่มี notification ถูกส่งไป host staff
- ไม่มี notification record ใหม่ใน database สำหรับ event นี้

**Related:**
- API: `POST /api/checkin`
- Rule: `Appointment.notifyOnCheckin`
- File: `src/services/notificationService.ts`, `src/services/checkinService.ts`

---

### TC-NF-03: Approval needed — ส่ง notification ไป approver group members

**Preconditions:**
- มี VisitRule ที่ `require_approval=true` และผูกกับ ApproverGroup ที่มี members 3 คน
- Members ทั้ง 3 มี LINE userId หรือ notification channel

**Steps:**
1. ส่ง `POST /api/appointments` สร้างนัดหมายที่ต้อง approve
2. ตรวจสอบ notification ที่ถูกส่ง

**Expected Result:**
- Appointment ถูกสร้าง `status="pending"`
- Notification ถูกส่งไป approver group members ทั้ง 3 คน
- Notification มีข้อมูล: ชื่อ visitor, purpose, dept, วันเวลา, link สำหรับ approve/reject
- Notification records 3 records ถูกบันทึก (`type="approval_request"`)

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_approval`, `ApproverGroup`
- File: `src/services/notificationService.ts`, `src/services/approvalService.ts`

---

### TC-NF-04: Approve — ส่ง notification ไป visitor

**Preconditions:**
- มี Appointment ที่ `status="pending"`
- Visitor มี LINE userId หรือ email สำหรับรับ notification

**Steps:**
1. Approver ส่ง `PATCH /api/appointments/:id/approve`
2. ตรวจสอบ notification ที่ถูกส่งไป visitor

**Expected Result:**
- Appointment เปลี่ยนเป็น `status="approved"`
- Notification ถูกส่งไป visitor
- Notification มีข้อมูล: สถานะ approved, วันเวลานัดหมาย, QR code หรือ link สำหรับ check-in
- Notification record ถูกบันทึก (`type="approval_approved"`)

**Related:**
- API: `PATCH /api/appointments/:id/approve`
- Rule: Approval notification to visitor
- File: `src/services/notificationService.ts`, `src/api/appointments/approve.ts`

---

### TC-NF-05: Reject — ส่ง notification พร้อมเหตุผลไป visitor

**Preconditions:**
- มี Appointment ที่ `status="pending"`
- Visitor มี LINE userId หรือ email สำหรับรับ notification

**Steps:**
1. Approver ส่ง `PATCH /api/appointments/:id/reject` พร้อม `{ "reason": "เอกสารไม่ครบถ้วน" }`
2. ตรวจสอบ notification ที่ถูกส่งไป visitor

**Expected Result:**
- Appointment เปลี่ยนเป็น `status="rejected"`
- Notification ถูกส่งไป visitor
- Notification มีข้อมูล: สถานะ rejected พร้อมเหตุผล `"เอกสารไม่ครบถ้วน"`
- Notification record ถูกบันทึก (`type="approval_rejected"`, `metadata.reason`)

**Related:**
- API: `PATCH /api/appointments/:id/reject`
- Rule: Rejection notification with reason
- File: `src/services/notificationService.ts`, `src/api/appointments/reject.ts`

---

### TC-NF-06: Overstay detected — ส่งแจ้งเตือน staff + host

**Preconditions:**
- มี Entry ที่ `checkinAt` ผ่านมาแล้ว เกิน `timeEnd` ของ appointment (เช่น timeEnd=17:00, เวลาปัจจุบัน=17:15)
- Overstay cron job ทำงาน
- มี Host staff ที่ผูกกับ appointment

**Steps:**
1. Overstay detection cron job ทำงาน (หรือ trigger manual)
2. ระบบตรวจพบ entry ที่ overstay
3. ตรวจสอบ notification ที่ถูกส่ง

**Expected Result:**
- Notification ถูกส่งไป host staff (แจ้งว่า visitor ยังไม่ check-out)
- Notification ถูกส่งไป security/admin staff (ถ้า config กำหนด)
- Notification มีข้อมูล: ชื่อ visitor, เวลา check-in, เวลาที่ควร check-out, ระยะเวลาเกิน
- Entry ถูก mark `isOverstay=true`

**Related:**
- API: Cron job / `POST /api/admin/check-overstay`
- Rule: Overstay detection threshold
- File: `src/services/overstayService.ts`, `src/services/notificationService.ts`

---

### TC-NF-07: Overstay ใช้ daySchedule timeEnd (ไม่ใช่ group default)

**Preconditions:**
- มี Group (period mode) ที่มี default `timeEnd="17:00"`
- มี DaySchedule สำหรับวันนี้ที่ `timeEnd="15:00"` (เร็วกว่า default)
- มี Entry ที่ check-in แล้ว เวลาปัจจุบัน = 15:15

**Steps:**
1. Overstay detection cron job ทำงาน
2. ระบบตรวจสอบ timeEnd โดย priority: DaySchedule > Group default
3. ตรวจสอบ notification

**Expected Result:**
- ระบบใช้ `timeEnd="15:00"` จาก DaySchedule (ไม่ใช่ 17:00 จาก group default)
- Notification overstay ถูกส่งตั้งแต่ 15:00+ (ไม่ต้องรอจนถึง 17:00)
- Entry ถูก mark `isOverstay=true`

**Related:**
- API: Cron job / `POST /api/admin/check-overstay`
- Rule: DaySchedule priority over group default timeEnd
- File: `src/services/overstayService.ts`, `src/models/DaySchedule.ts`

---

### TC-NF-08: Auto-cancel (pending > timeout) — notification ส่ง visitor

**Preconditions:**
- มี Appointment ที่ `status="pending"` สร้างมาเกิน timeout threshold (เช่น 24 ชั่วโมง)
- Auto-cancel cron job ทำงาน

**Steps:**
1. Auto-cancel cron job ทำงาน
2. ระบบตรวจพบ appointment ที่ pending เกิน timeout
3. ตรวจสอบ status และ notification

**Expected Result:**
- Appointment เปลี่ยนเป็น `status="cancelled"`
- `cancelledAt` ถูก set
- `cancelReason` = `"auto_cancel_timeout"` หรือข้อความที่สื่อว่า timeout
- Notification ถูกส่งไป visitor แจ้งว่านัดหมายถูกยกเลิกอัตโนมัติเนื่องจากไม่ได้รับอนุมัติภายในเวลาที่กำหนด

**Related:**
- API: Cron job / `POST /api/admin/auto-cancel`
- Rule: Pending timeout threshold
- File: `src/services/autoCancelService.ts`, `src/services/notificationService.ts`

---

### TC-NF-09: Toggle notify per-appointment (PATCH /api/appointments/:id/notify)

**Preconditions:**
- มี Appointment ที่ `notifyOnCheckin=true`

**Steps:**
1. ส่ง `PATCH /api/appointments/:id/notify` พร้อม body `{ "notifyOnCheckin": false }`
2. ตรวจสอบ response
3. Visitor check-in
4. ตรวจสอบว่าไม่มี notification ถูกส่ง

**Expected Result:**
- PATCH response status `200 OK`
- Appointment `notifyOnCheckin` = `false`
- เมื่อ check-in ไม่มี notification ถูกส่งไป host
- การเปลี่ยนแปลงมีผลเฉพาะ appointment นี้ ไม่กระทบ appointment อื่นใน group เดียวกัน

**Related:**
- API: `PATCH /api/appointments/:id/notify`
- Rule: Per-appointment notify toggle
- File: `src/api/appointments/notify.ts`, `src/services/notificationService.ts`

---

### TC-NF-10: Toggle notify ระดับ group — cascade ทั้ง group

**Preconditions:**
- มี Group ที่มี appointments 4 ตัว ทุกตัว `notifyOnCheckin=true`

**Steps:**
1. ส่ง `PATCH /api/appointments/groups/:groupId/notify` พร้อม body `{ "notifyOnCheckin": false }`
2. ตรวจสอบ response
3. ดึง appointments ทุกตัวใน group
4. ตรวจสอบ `notifyOnCheckin` ของแต่ละ appointment

**Expected Result:**
- PATCH response status `200 OK`
- ทุก appointment ใน group เปลี่ยนเป็น `notifyOnCheckin=false`
- Group record มี `notifyOnCheckin=false`
- เมื่อ check-in visitor คนใดใน group จะไม่มี notification ถูกส่ง

**Related:**
- API: `PATCH /api/appointments/groups/:groupId/notify`
- Rule: Cascade notify toggle at group level
- File: `src/api/appointments/groups.ts`, `src/services/notificationService.ts`
