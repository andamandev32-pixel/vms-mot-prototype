# Module 2: Auto-Approve

> ทดสอบ logic การ approve/reject appointment อัตโนมัติและแบบ manual
> ครอบคลุม require_approval flag, batch auto-approve, cancel, และ error cases

---

### TC-AA-01: Auto-approve (require_approval=false) — status=approved ทันที

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_approval=false`
- Visitor ยังไม่ถูก block

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม purposeId + deptId ที่ match rule ดังกล่าว
2. ตรวจสอบ response status และ appointment data

**Expected Result:**
- Response status `201 Created`
- `status` = `"approved"`
- `approvedAt` ถูก set เป็น timestamp ปัจจุบัน
- `autoApproved` = `true`
- ไม่ต้องรอ manual approve

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_approval`
- File: `src/services/appointmentService.ts`, `src/services/approvalService.ts`

---

### TC-AA-02: Manual approve needed (require_approval=true) — status=pending

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_approval=true`
- มี approver group ที่ผูกกับ rule

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม purposeId + deptId ที่ match rule ดังกล่าว
2. ตรวจสอบ response status และ appointment data

**Expected Result:**
- Response status `201 Created`
- `status` = `"pending"`
- `approvedAt` = `null`
- `autoApproved` = `false`
- Notification ถูกส่งไป approver group members

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_approval`, `ApproverGroup`
- File: `src/services/appointmentService.ts`, `src/services/notificationService.ts`

---

### TC-AA-03: Approve appointment — status=approved + approvedAt set

**Preconditions:**
- มี Appointment ที่ `status="pending"`
- User เป็น member ของ approver group ที่มีสิทธิ์ approve

**Steps:**
1. ส่ง `PATCH /api/appointments/:id/approve` พร้อม header authentication ของ approver
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- `status` = `"approved"`
- `approvedAt` ถูก set เป็น timestamp ปัจจุบัน
- `approvedBy` = userId ของ approver
- Notification ถูกส่งไป visitor (แจ้งนัดหมายได้รับอนุมัติ)

**Related:**
- API: `PATCH /api/appointments/:id/approve`
- Rule: `ApproverGroup` membership
- File: `src/api/appointments/approve.ts`, `src/services/notificationService.ts`

---

### TC-AA-04: Reject appointment — status=rejected + reason + notification

**Preconditions:**
- มี Appointment ที่ `status="pending"`
- User เป็น member ของ approver group ที่มีสิทธิ์ reject

**Steps:**
1. ส่ง `PATCH /api/appointments/:id/reject` พร้อม body `{ "reason": "ไม่อยู่ในช่วงเวลาทำการ" }`
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- `status` = `"rejected"`
- `rejectedReason` = `"ไม่อยู่ในช่วงเวลาทำการ"`
- `rejectedAt` ถูก set เป็น timestamp ปัจจุบัน
- Notification ถูกส่งไป visitor พร้อมเหตุผลที่ปฏิเสธ

**Related:**
- API: `PATCH /api/appointments/:id/reject`
- Rule: `ApproverGroup` membership
- File: `src/api/appointments/reject.ts`, `src/services/notificationService.ts`

---

### TC-AA-05: Auto-approve + batch — ทุก appointment ใน group = approved

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_approval=false`
- สร้าง batch group ที่มี visitors 3 คน

**Steps:**
1. ส่ง `POST /api/appointments/batch` พร้อม visitors 3 คน และ purposeId + deptId ที่ auto-approve
2. ตรวจสอบ response และ appointment ทุกตัวใน group

**Expected Result:**
- Response status `201 Created`
- ทุก appointment ใน group มี `status` = `"approved"`
- ทุก appointment มี `autoApproved` = `true`
- Group record ถูกสร้างพร้อม link ไปทุก appointment

**Related:**
- API: `POST /api/appointments/batch`
- Rule: `VisitRule.require_approval`
- File: `src/api/appointments/batch.ts`, `src/services/approvalService.ts`

---

### TC-AA-06: Cancel appointment — status=cancelled

**Preconditions:**
- มี Appointment ที่ `status="pending"` หรือ `"approved"` (ยังไม่ check-in)

**Steps:**
1. ส่ง `PATCH /api/appointments/:id/cancel`
2. ตรวจสอบ response

**Expected Result:**
- Response status `200 OK`
- `status` = `"cancelled"`
- `cancelledAt` ถูก set เป็น timestamp ปัจจุบัน
- Appointment ไม่สามารถ check-in ได้อีก

**Related:**
- API: `PATCH /api/appointments/:id/cancel`
- Rule: Cancellation policy
- File: `src/api/appointments/cancel.ts`

---

### TC-AA-07: Approve ที่ไม่ใช่ pending — error

**Preconditions:**
- มี Appointment ที่ `status="approved"` (หรือ `"rejected"`, `"cancelled"`)

**Steps:**
1. ส่ง `PATCH /api/appointments/:id/approve`
2. ตรวจสอบ response

**Expected Result:**
- Response status `400 Bad Request`
- Error message ระบุว่า appointment ไม่อยู่ในสถานะ pending ไม่สามารถ approve ได้
- สถานะ appointment ไม่เปลี่ยนแปลง

**Related:**
- API: `PATCH /api/appointments/:id/approve`
- Rule: Status transition validation
- File: `src/api/appointments/approve.ts`

---

### TC-AA-08: Auto-approve response มี autoApproved=true + rule info

**Preconditions:**
- มี VisitRule ที่ตรงกับ purposeId + deptId โดย `require_approval=false`

**Steps:**
1. ส่ง `POST /api/appointments` พร้อม purposeId + deptId ที่ auto-approve
2. ตรวจสอบ response body อย่างละเอียด

**Expected Result:**
- Response status `201 Created`
- Response body มี field `autoApproved` = `true`
- Response body มี field `appliedRule` ที่ระบุ rule ID และ rule name ที่ใช้
- `appliedRule.require_approval` = `false`
- สามารถ trace ได้ว่า auto-approve เพราะ rule ใด

**Related:**
- API: `POST /api/appointments`
- Rule: `VisitRule.require_approval`, rule info in response
- File: `src/services/appointmentService.ts`, `src/services/visitRuleService.ts`
