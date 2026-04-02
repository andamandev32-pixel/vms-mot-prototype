# Test Cases: LINE OA Flow

> ระบบ LINE Official Account สำหรับ visitor และ officer

---

### TC-LN-01: Follow LINE OA -- new-friend -- Welcome Flex + Rich Menu (new-friend)

**Preconditions:**
- LINE OA ของระบบ eVMS ถูก setup และ active
- User ยังไม่เคย follow LINE OA นี้

**Steps:**
1. User กด "เพิ่มเพื่อน" (follow) LINE OA
2. LINE Platform ส่ง `follow` webhook event
3. Backend รับ event และตรวจสอบ LINE userId

**Expected Result:**
- ระบบส่ง Welcome Flex Message:
  - ข้อความต้อนรับ
  - ปุ่ม "ลงทะเบียนผู้เยี่ยม" (visitor)
  - ปุ่ม "ลงทะเบียนเจ้าหน้าที่" (officer)
- ตั้ง Rich Menu เป็น `new-friend` template (แสดงเมนูลงทะเบียน)
- บันทึก LINE userId ใน `line_users` table ด้วย `role = unregistered`

**Related:**
- API: `POST /api/webhooks/line` (follow event handler)
- Rule: new-friend Rich Menu shows registration options only
- File: `webhooks/lineWebhook.ts`, `services/lineRichMenuService.ts`, `flex/welcomeFlex.ts`

---

### TC-LN-02: Visitor register -- LIFF form -- สร้าง user_account + link LINE -- Rich Menu (visitor)

**Preconditions:**
- User follow LINE OA แล้ว (`role = unregistered`)
- LIFF app สำหรับ visitor registration ถูก deploy

**Steps:**
1. User กดปุ่ม "ลงทะเบียนผู้เยี่ยม" จาก Welcome Flex หรือ Rich Menu
2. เปิด LIFF app: visitor registration form
3. กรอกข้อมูล: ชื่อ-นามสกุล, เบอร์โทร, email, เลขบัตรประชาชน/passport
4. กด "ลงทะเบียน"

**Expected Result:**
- สร้าง `user_account` ใหม่ด้วย `role = visitor`
- Link `lineUserId` กับ `user_account`
- เปลี่ยน Rich Menu เป็น `visitor` template (แสดงเมนูจองนัดหมาย, ประวัติ ฯลฯ)
- ส่ง Flex Message "ลงทะเบียนสำเร็จ"
- ปิด LIFF app กลับไปที่ LINE chat

**Related:**
- API: `POST /api/auth/register-visitor`
- Rule: 1 LINE userId ผูกได้กับ 1 user_account เท่านั้น
- File: `liff/VisitorRegistration.tsx`, `services/lineUserService.ts`

---

### TC-LN-03: Officer register -- LIFF -- lookup staff -- link LINE -- Rich Menu (officer)

**Preconditions:**
- User follow LINE OA แล้ว (`role = unregistered`)
- มี staff record ใน `staff` table ที่ยังไม่ link LINE

**Steps:**
1. User กดปุ่ม "ลงทะเบียนเจ้าหน้าที่" จาก Welcome Flex หรือ Rich Menu
2. เปิด LIFF app: officer registration form
3. กรอก employee ID หรือ email ขององค์กร
4. ระบบ lookup staff record
5. ยืนยัน OTP (ส่งไปยัง email/SMS ขององค์กร)
6. กด "ลงทะเบียน"

**Expected Result:**
- Link `lineUserId` กับ `staff` record ที่มีอยู่
- เปลี่ยน Rich Menu เป็น `officer` template (แสดงเมนูอนุมัติ, dashboard ฯลฯ)
- ส่ง Flex Message "ลงทะเบียนเจ้าหน้าที่สำเร็จ"
- `line_users.role` เปลี่ยนเป็น `officer`

**Related:**
- API: `POST /api/auth/register-officer`, `GET /api/staff/lookup`
- Rule: Officer registration requires valid staff record + OTP verification
- File: `liff/OfficerRegistration.tsx`, `services/staffLookupService.ts`

---

### TC-LN-04: Visitor booking -- LIFF form -- POST /api/appointments -- Flex "รอดำเนินการ"

**Preconditions:**
- Visitor ลงทะเบียนแล้ว (`role = visitor`, Rich Menu = visitor)
- Organization setting: `requireApproval = true`

**Steps:**
1. Visitor กดเมนู "จองนัดหมาย" จาก Rich Menu
2. เปิด LIFF app: booking form
3. กรอกข้อมูล: วันที่, เวลา, แผนก, ผู้ติดต่อ, วัตถุประสงค์
4. กด "ส่งคำขอ"

**Expected Result:**
- สร้าง appointment ด้วย `status = pending`
- ส่ง Flex Message ไปยัง visitor: "คำขอนัดหมายของคุณอยู่ระหว่างรอดำเนินการ"
  - แสดงรายละเอียด: วันที่, เวลา, แผนก
  - สถานะ: "รอดำเนินการ"
- ส่ง notification ไปยัง approver
- ปิด LIFF app

**Related:**
- API: `POST /api/appointments`
- Rule: `requireApproval = true` sets initial status to `pending`
- File: `liff/BookingForm.tsx`, `flex/bookingStatusFlex.ts`

---

### TC-LN-05: Visitor booking auto-approve -- Flex "อนุมัติแล้ว" + QR Code (ไม่ต้องรอ)

**Preconditions:**
- Visitor ลงทะเบียนแล้ว (`role = visitor`)
- Organization setting: `requireApproval = false` (auto-approve)

**Steps:**
1. Visitor กดเมนู "จองนัดหมาย" จาก Rich Menu
2. เปิด LIFF app: booking form
3. กรอกข้อมูลครบถ้วน
4. กด "ส่งคำขอ"

**Expected Result:**
- สร้าง appointment ด้วย `status = approved` ทันที (auto-approve)
- ส่ง Flex Message ไปยัง visitor: "นัดหมายได้รับการอนุมัติแล้ว"
  - แสดงรายละเอียด: วันที่, เวลา, แผนก
  - แสดง QR Code สำหรับ check-in
  - สถานะ: "อนุมัติแล้ว"
- ไม่ส่ง notification ไปยัง approver (ไม่จำเป็น)

**Related:**
- API: `POST /api/appointments` with auto-approve logic
- Rule: `requireApproval = false` auto-approves and generates QR immediately
- File: `liff/BookingForm.tsx`, `services/autoApproveService.ts`, `flex/approvedFlex.ts`

---

### TC-LN-06: Officer ได้รับ Flex "คำขอใหม่" -- กด อนุมัติ -- LIFF confirm -- visitor ได้ Flex "อนุมัติ" + QR

**Preconditions:**
- มี appointment ที่ `status = pending`
- Officer ลงทะเบียน LINE OA แล้ว และเป็น approver ของแผนกที่เกี่ยวข้อง
- Officer setting: `notifyOnNewRequest = true`

**Steps:**
1. Officer ได้รับ Flex Message "คำขอนัดหมายใหม่" พร้อมปุ่ม "อนุมัติ" / "ปฏิเสธ"
2. Officer กดปุ่ม "อนุมัติ"
3. เปิด LIFF app: approval confirmation
4. Officer ตรวจสอบรายละเอียดและกด "ยืนยันอนุมัติ"

**Expected Result:**
- Appointment status เปลี่ยนเป็น `approved`
- `approvedBy` = officer ID
- `approvedAt` = timestamp ปัจจุบัน
- ส่ง Flex Message ไปยัง visitor: "นัดหมายได้รับการอนุมัติ" + QR Code
- Officer ได้รับข้อความยืนยัน "อนุมัติเรียบร้อย"

**Related:**
- API: `PATCH /api/appointments/:id/approve`
- Rule: Approval generates QR Code and notifies visitor
- File: `liff/ApprovalConfirm.tsx`, `flex/approvedFlex.ts`, `services/qrCodeService.ts`

---

### TC-LN-07: Officer ได้รับ Flex "คำขอใหม่" -- กด ปฏิเสธ -- ใส่เหตุผล -- visitor ได้ Flex "ถูกปฏิเสธ"

**Preconditions:**
- มี appointment ที่ `status = pending`
- Officer ลงทะเบียน LINE OA แล้ว และเป็น approver

**Steps:**
1. Officer ได้รับ Flex Message "คำขอนัดหมายใหม่"
2. Officer กดปุ่ม "ปฏิเสธ"
3. เปิด LIFF app: rejection form
4. Officer กรอกเหตุผลการปฏิเสธ
5. กด "ยืนยันปฏิเสธ"

**Expected Result:**
- Appointment status เปลี่ยนเป็น `rejected`
- `rejectedBy` = officer ID
- `rejectionReason` = เหตุผลที่กรอก
- ส่ง Flex Message ไปยัง visitor: "นัดหมายถูกปฏิเสธ"
  - แสดงเหตุผลการปฏิเสธ
  - แสดงปุ่ม "จองใหม่" (ถ้าต้องการ)
- Officer ได้รับข้อความยืนยัน "ปฏิเสธเรียบร้อย"

**Related:**
- API: `PATCH /api/appointments/:id/reject`
- Rule: Rejection reason is required
- File: `liff/RejectionForm.tsx`, `flex/rejectedFlex.ts`

---

### TC-LN-08: Visitor check-in ที่ Kiosk -- ส่ง Flex "ยินดีต้อนรับ" + WiFi (ถ้า offer)

**Preconditions:**
- Visitor ลงทะเบียน LINE OA แล้ว
- Visitor check-in สำเร็จที่ Kiosk (มี `visitor_entry` ที่ `status = checked-in`)
- Organization setting: `wifiOffer = true` (optional)

**Steps:**
1. Visitor check-in สำเร็จที่ Kiosk
2. Backend trigger LINE notification หลัง check-in

**Expected Result:**
- ส่ง Flex Message ไปยัง visitor: "ยินดีต้อนรับสู่ [ชื่อองค์กร]"
  - แสดงข้อมูล: แผนก, ผู้ติดต่อ, ชั้น/ห้อง
  - แสดงเวลา check-in
- ถ้า `wifiOffer = true`:
  - แสดง WiFi SSID + password ใน Flex Message
- ถ้า `wifiOffer = false`:
  - ไม่แสดงส่วน WiFi

**Related:**
- API: `POST /api/notifications/checkin-welcome`
- Rule: WiFi info shown only when `wifiOffer = true`
- File: `services/lineNotificationService.ts`, `flex/welcomeCheckinFlex.ts`

---

### TC-LN-09: Officer checkin-alert -- ส่งถ้า notifyOnCheckin=true / ไม่ส่งถ้า false

**Preconditions:**
- Visitor check-in สำเร็จ (มี `visitor_entry`)
- Appointment มี `contactPerson` ที่เป็น officer ลงทะเบียน LINE

**Steps:**
1. Visitor check-in สำเร็จ
2. Backend ตรวจสอบ `notifyOnCheckin` setting ของ appointment/officer

**Expected Result:**
- ถ้า `notifyOnCheckin = true`:
  - ส่ง Flex Message ไปยัง officer: "[ชื่อ visitor] มาถึงแล้ว"
  - แสดงข้อมูล: ชื่อ visitor, เวลา check-in, จุด check-in
- ถ้า `notifyOnCheckin = false`:
  - ไม่ส่ง notification ใด ๆ ไปยัง officer
- ไม่มี error ในทั้งสองกรณี

**Related:**
- API: `POST /api/notifications/checkin-alert`
- Rule: `notifyOnCheckin` flag controls per-appointment/per-officer notification
- File: `services/lineNotificationService.ts`, `services/notificationRouter.ts`

---

### TC-LN-10: Overstay alert -- ส่ง Flex เตือนไป officer + security

**Preconditions:**
- Visitor มี `visitor_entry` ที่ `status = overstay` (ตรวจพบโดย cron job)
- มี officer (contactPerson) และ security team ลงทะเบียน LINE

**Steps:**
1. Cron job ตรวจพบ entry ที่เกิน `timeEnd` (overstay)
2. ระบบ update `visitor_entry.status = overstay`
3. Trigger overstay notification

**Expected Result:**
- ส่ง Flex Message ไปยัง officer (contactPerson):
  - "[ชื่อ visitor] อยู่เกินเวลากำหนด"
  - แสดงเวลาที่ควร check-out vs เวลาปัจจุบัน
  - ปุ่ม "ขยายเวลา" / "แจ้ง security"
- ส่ง Flex Message ไปยัง security team:
  - แจ้งเตือน overstay พร้อมรายละเอียด visitor
  - แสดงตำแหน่ง/แผนกที่เข้าไป
- บันทึก `notification_log` สำหรับทุก notification ที่ส่ง

**Related:**
- API: `POST /api/notifications/overstay-alert`
- Rule: Overstay alerts sent to both contactPerson and security
- File: `cron/overstayChecker.ts`, `flex/overstayAlertFlex.ts`, `services/lineNotificationService.ts`
