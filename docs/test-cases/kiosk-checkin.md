# Test Cases: Kiosk Check-in

> ระบบ check-in ผ่าน Kiosk (Self-service terminal)

---

### TC-KC-01: Walk-in check-in ปกติ (requireApproval=false) -- checked-in ทันที

**Preconditions:**
- Kiosk พร้อมใช้งาน, เชื่อมต่อ backend ปกติ
- Organization setting: `requireApproval = false`
- Visitor ยังไม่เคยลงทะเบียนในระบบ (new walk-in)

**Steps:**
1. Visitor เลือก "Walk-in" ที่หน้า Kiosk
2. กรอกข้อมูล: ชื่อ, เบอร์โทร, บัตรประชาชน/passport
3. ถ่ายรูป face capture
4. เลือกแผนก/ผู้ติดต่อ (contact person)
5. กด "ยืนยัน"

**Expected Result:**
- ระบบสร้าง `visitor_entry` ใหม่ด้วย `status = checked-in`
- ไม่มีขั้นตอน approval (skip PENDING_APPROVAL state)
- แสดงหน้า SUCCESS พร้อมข้อมูล badge
- Kiosk พิมพ์ badge/slip (ถ้ามี printer)

**Related:**
- API: `POST /api/kiosk/walkin-checkin`
- Rule: `requireApproval = false` bypass approval flow
- File: `kiosk/WalkinFlow.tsx`, `services/checkinService.ts`

---

### TC-KC-02: Walk-in check-in (requireApproval=true) -- เข้า PENDING_APPROVAL -- รอ approve

**Preconditions:**
- Organization setting: `requireApproval = true`
- มี approver อย่างน้อย 1 คนที่ active

**Steps:**
1. Visitor เลือก "Walk-in" ที่หน้า Kiosk
2. กรอกข้อมูลครบถ้วน
3. เลือกแผนก/ผู้ติดต่อ
4. กด "ยืนยัน"

**Expected Result:**
- ระบบสร้าง pending appointment ด้วย `status = pending`
- Kiosk เข้าสู่ state `PENDING_APPROVAL` แสดงข้อความ "กรุณารอการอนุมัติ"
- ส่ง notification ไปยัง approver (LINE OA / Web Dashboard)
- Kiosk แสดง spinner + countdown timer (5 นาที)

**Related:**
- API: `POST /api/kiosk/walkin-checkin`, `POST /api/notifications/approval-request`
- Rule: `requireApproval = true` triggers approval flow
- File: `kiosk/PendingApprovalScreen.tsx`, `services/approvalService.ts`

---

### TC-KC-03: PENDING_APPROVAL -- approved -- FACE_CAPTURE -- SUCCESS

**Preconditions:**
- Visitor อยู่ที่หน้า PENDING_APPROVAL (จาก TC-KC-02)
- Approver เปิด notification พร้อมอนุมัติ

**Steps:**
1. Approver กด "อนุมัติ" ผ่าน LINE OA หรือ Web Dashboard
2. ระบบส่ง approval event กลับมาที่ Kiosk (WebSocket/polling)
3. Kiosk เปลี่ยนเป็น state `FACE_CAPTURE`
4. Visitor ถ่ายรูป face capture
5. กด "ยืนยัน"

**Expected Result:**
- Appointment status เปลี่ยนเป็น `approved`
- Kiosk เปลี่ยนจาก PENDING_APPROVAL เป็น FACE_CAPTURE อัตโนมัติ
- หลัง face capture สำเร็จ สร้าง `visitor_entry` ด้วย `status = checked-in`
- แสดงหน้า SUCCESS

**Related:**
- API: `PATCH /api/appointments/:id/approve`, `POST /api/kiosk/face-capture`
- Rule: Approval triggers state transition PENDING_APPROVAL -> FACE_CAPTURE -> SUCCESS
- File: `kiosk/FaceCaptureScreen.tsx`, `hooks/useApprovalPolling.ts`

---

### TC-KC-04: PENDING_APPROVAL -- rejected -- ERROR "คำขอถูกปฏิเสธ"

**Preconditions:**
- Visitor อยู่ที่หน้า PENDING_APPROVAL (จาก TC-KC-02)
- Approver เปิด notification พร้อมปฏิเสธ

**Steps:**
1. Approver กด "ปฏิเสธ" ผ่าน LINE OA หรือ Web Dashboard
2. Approver ใส่เหตุผลการปฏิเสธ (optional)
3. ระบบส่ง rejection event กลับมาที่ Kiosk

**Expected Result:**
- Appointment status เปลี่ยนเป็น `rejected`
- Kiosk แสดง ERROR screen ข้อความ "คำขอถูกปฏิเสธ"
- แสดงเหตุผลการปฏิเสธ (ถ้ามี)
- มีปุ่ม "กลับหน้าแรก" เพื่อ reset Kiosk

**Related:**
- API: `PATCH /api/appointments/:id/reject`
- Rule: Rejection ends flow, no entry created
- File: `kiosk/ErrorScreen.tsx`, `hooks/useApprovalPolling.ts`

---

### TC-KC-05: PENDING_APPROVAL -- timeout 5 นาที -- ERROR "หมดเวลา"

**Preconditions:**
- Visitor อยู่ที่หน้า PENDING_APPROVAL (จาก TC-KC-02)
- Approver ไม่ตอบกลับภายใน 5 นาที

**Steps:**
1. Visitor รอที่หน้า PENDING_APPROVAL
2. Countdown timer นับถอยหลังจนครบ 5 นาที (300 วินาที)
3. ไม่มี approval/rejection event เข้ามา

**Expected Result:**
- Kiosk แสดง ERROR screen ข้อความ "หมดเวลารอการอนุมัติ"
- Appointment status เปลี่ยนเป็น `timeout` หรือ `expired`
- แสดงคำแนะนำ: "กรุณาติดต่อเคาน์เตอร์ประชาสัมพันธ์"
- มีปุ่ม "กลับหน้าแรก" เพื่อ reset Kiosk

**Related:**
- API: `PATCH /api/appointments/:id/timeout`
- Rule: PENDING_APPROVAL timeout = 300 seconds (configurable)
- File: `kiosk/PendingApprovalScreen.tsx`, `config/kioskSettings.ts`

---

### TC-KC-06: Appointment check-in ผ่าน QR -- APPOINTMENT_PREVIEW -- verify -- SUCCESS

**Preconditions:**
- มี appointment ที่ `status = approved` และ `dateStart = today`
- Visitor มี QR Code (ได้รับจาก LINE OA หลัง approve)

**Steps:**
1. Visitor เลือก "นัดหมายล่วงหน้า" ที่หน้า Kiosk
2. Scan QR Code ด้วย Kiosk scanner
3. ระบบ decode QR ได้ appointment ID
4. Kiosk แสดง APPOINTMENT_PREVIEW (ชื่อ, วันเวลา, ผู้ติดต่อ)
5. Visitor กด "ยืนยัน check-in"
6. ถ่ายรูป face capture

**Expected Result:**
- QR decode สำเร็จ, ดึง appointment data ถูกต้อง
- APPOINTMENT_PREVIEW แสดงข้อมูลตรงกับ appointment
- สร้าง `visitor_entry` ด้วย `status = checked-in`
- แสดงหน้า SUCCESS

**Related:**
- API: `GET /api/appointments/:id`, `POST /api/kiosk/appointment-checkin`
- Rule: QR contains encrypted appointment ID
- File: `kiosk/QRScanScreen.tsx`, `kiosk/AppointmentPreviewScreen.tsx`

---

### TC-KC-07: Appointment check-in ไม่มี QR (no-QR path) -- ID -- appointment lookup -- SUCCESS

**Preconditions:**
- มี appointment ที่ `status = approved` และ `dateStart = today`
- Visitor ไม่มี QR Code (ลืม, โทรศัพท์หาย ฯลฯ)

**Steps:**
1. Visitor เลือก "นัดหมายล่วงหน้า" ที่หน้า Kiosk
2. เลือก "ไม่มี QR Code"
3. กรอกเลขบัตรประชาชน/passport
4. ระบบ lookup appointment จาก ID document
5. แสดง APPOINTMENT_PREVIEW
6. Visitor กด "ยืนยัน check-in"

**Expected Result:**
- ระบบค้นหา appointment จาก `idNumber` สำเร็จ
- แสดง appointment ที่ตรงกับวันนี้ (อาจมีหลายรายการให้เลือก)
- หลัง verify สร้าง `visitor_entry` ด้วย `status = checked-in`
- แสดงหน้า SUCCESS

**Related:**
- API: `GET /api/appointments/lookup?idNumber=xxx&date=today`
- Rule: Lookup by ID returns only today's approved appointments
- File: `kiosk/NoQRFlow.tsx`, `services/appointmentLookupService.ts`

---

### TC-KC-08: Appointment status=pending -- แสดง "รอการอนุมัติ" ไม่ให้ check-in

**Preconditions:**
- มี appointment ที่ `status = pending` (ยังไม่ได้รับ approve)
- Visitor มา check-in ที่ Kiosk

**Steps:**
1. Visitor scan QR Code หรือกรอก ID
2. ระบบดึง appointment ได้ status = `pending`

**Expected Result:**
- Kiosk แสดงข้อความ "การนัดหมายของคุณยังรอการอนุมัติ"
- ไม่แสดงปุ่ม "ยืนยัน check-in"
- แสดงคำแนะนำ: "กรุณารอการอนุมัติจากเจ้าหน้าที่"
- ไม่สร้าง `visitor_entry`

**Related:**
- API: `GET /api/appointments/:id` returns `status = pending`
- Rule: Only `approved` appointments can proceed to check-in
- File: `kiosk/AppointmentPreviewScreen.tsx`, `utils/appointmentValidator.ts`

---

### TC-KC-09: Appointment status=rejected -- แสดงเหตุผล ไม่ให้ check-in

**Preconditions:**
- มี appointment ที่ `status = rejected` พร้อม `rejectionReason`
- Visitor มา check-in ที่ Kiosk

**Steps:**
1. Visitor scan QR Code หรือกรอก ID
2. ระบบดึง appointment ได้ status = `rejected`

**Expected Result:**
- Kiosk แสดงข้อความ "การนัดหมายของคุณถูกปฏิเสธ"
- แสดง `rejectionReason` (ถ้ามี)
- ไม่แสดงปุ่ม "ยืนยัน check-in"
- แสดงคำแนะนำ: "กรุณาติดต่อเคาน์เตอร์ประชาสัมพันธ์"
- ไม่สร้าง `visitor_entry`

**Related:**
- API: `GET /api/appointments/:id` returns `status = rejected`
- Rule: Rejected appointments cannot check-in at any channel
- File: `kiosk/AppointmentPreviewScreen.tsx`, `utils/appointmentValidator.ts`

---

### TC-KC-10: Period appointment -- แสดง "วันที่ X/Y" -- check-in สำเร็จ

**Preconditions:**
- มี appointment แบบ `type = period` ที่ `dateStart <= today <= dateEnd`
- Appointment `status = approved`
- วันนี้ยังไม่มี `visitor_entry` สำหรับ appointment นี้

**Steps:**
1. Visitor scan QR Code หรือกรอก ID
2. ระบบดึง period appointment
3. Kiosk แสดง APPOINTMENT_PREVIEW พร้อมข้อมูล period
4. Visitor กด "ยืนยัน check-in"

**Expected Result:**
- แสดงข้อมูล "วันที่ X จาก Y วัน" (เช่น "วันที่ 3/10")
- แสดง `dateStart` - `dateEnd` ของ period
- สร้าง `visitor_entry` ด้วย `status = checked-in` สำหรับวันนี้
- `visitor_entry.entryDate = today`
- แสดงหน้า SUCCESS

**Related:**
- API: `POST /api/kiosk/appointment-checkin`, `GET /api/visitor-entries?appointmentId=xxx`
- Rule: Period appointment สร้าง entry ได้ทุกวันใน range
- File: `kiosk/AppointmentPreviewScreen.tsx`, `services/periodCheckinService.ts`

---

### TC-KC-11: Period appointment -- วันนี้ check-in แล้ว -- แสดง "วันนี้ check-in แล้ว"

**Preconditions:**
- มี appointment แบบ `type = period`
- วันนี้มี `visitor_entry` อยู่แล้วสำหรับ appointment นี้ (`entryDate = today`)

**Steps:**
1. Visitor scan QR Code หรือกรอก ID
2. ระบบดึง period appointment
3. ระบบตรวจสอบ `visitor_entry` ของวันนี้

**Expected Result:**
- Kiosk แสดงข้อความ "คุณได้ check-in วันนี้แล้ว"
- แสดงเวลาที่ check-in ก่อนหน้า
- ไม่แสดงปุ่ม "ยืนยัน check-in"
- ไม่สร้าง `visitor_entry` ซ้ำ

**Related:**
- API: `GET /api/visitor-entries?appointmentId=xxx&date=today`
- Rule: 1 entry per day per appointment (duplicate prevention)
- File: `services/periodCheckinService.ts`, `utils/entryValidator.ts`

---

### TC-KC-12: Visitor ถูก block -- DATA_PREVIEW แสดง blocklist warning -- ไม่ให้ผ่าน

**Preconditions:**
- Visitor มี record ใน `blocklist` table (`isBlocked = true`)
- มี `blockReason` ระบุไว้

**Steps:**
1. Visitor เลือก Walk-in หรือ Appointment check-in
2. กรอก ID หรือ scan QR
3. ระบบตรวจสอบ blocklist จาก `idNumber`

**Expected Result:**
- Kiosk แสดง DATA_PREVIEW พร้อม warning สีแดง "บุคคลนี้อยู่ในรายการบล็อก"
- แสดง `blockReason`
- ไม่แสดงปุ่ม "ยืนยัน check-in"
- ไม่สร้าง `visitor_entry`
- บันทึก log การพยายาม check-in ของ blocked visitor

**Related:**
- API: `GET /api/blocklist/check?idNumber=xxx`
- Rule: Blocklist check runs before any check-in flow
- File: `services/blocklistService.ts`, `kiosk/DataPreviewScreen.tsx`
