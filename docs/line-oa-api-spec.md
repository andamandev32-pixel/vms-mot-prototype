# LINE OA API Specification — eVMS

> สำหรับ DEV: เอกสาร API ทั้งหมดที่ใช้ใน LINE OA Integration
> ครอบคลุม Visitor Flow (12 states) + Officer Flow (6 states) = 18 states
> อ้างอิงจาก Flow Data (`lib/line-oa-flow-data.ts`) และ Database Schema (`lib/database-schema.ts`)

---

## Base URL

```
https://api.evms.mots.go.th/v1
```

## Authentication

### Webhook (LINE → Backend)

ทุก Webhook request จาก LINE Platform ต้องตรวจสอบ:

```
X-Line-Signature: <HMAC-SHA256 ของ request body ด้วย channel_secret>
```

ระบบ validate signature ก่อนประมวลผล — ถ้าไม่ตรงให้ return `401 Unauthorized`

### LIFF (Frontend → Backend)

```javascript
await liff.init({ liffId: LIFF_ID });
const profile = await liff.getProfile();
// ส่ง liff.getAccessToken() ไป backend เพื่อยืนยันตัวตน
```

Backend ใช้ `line_access_token` เรียก LINE API verify → ได้ `userId` → ผูกกับ `user_accounts`

### Push Message (Backend → LINE)

ใช้ Channel Access Token จาก `line_oa_config`:

```
Authorization: Bearer <channel_access_token>
```

### LIFF User Token (Authenticated API Calls)

หลังลงทะเบียนสำเร็จ ระบบออก JWT token:

```
Authorization: Bearer <user_jwt_token>
```

---

## Implemented API Stubs

> ⚠️ ระบบปัจจุบันมี stub endpoints สำหรับ LINE integration — ยังไม่เชื่อม LINE SDK จริง

### POST /api/line/webhook (Stub)
- **File:** `app/api/line/webhook/route.ts`
- **สถานะ:** Stub — รับ webhook events แล้ว log ไว้ ไม่ process จริง
- **TODO Production:** Validate X-Line-Signature, parse events, route to handlers

### POST /api/line/push-message (Stub)
- **File:** `app/api/line/push-message/route.ts`
- **Auth:** ต้อง login (evms_session cookie)
- **สถานะ:** Stub — log intent แล้ว return queued status ไม่ส่ง LINE message จริง
- **Request:** `{ to: "LINE_USER_ID", templateId: "...", variables: {...} }`
- **TODO Production:** ใช้ @line/bot-sdk client.pushMessage()

### Mobile Booking Integration
- **File:** `app/mobile/(app)/booking/page.tsx`
- **การเปลี่ยนแปลง:** 
  - เพิ่ม department selection dropdown (dynamic ตาม acceptFromLine)
  - เพิ่ม approval badge (อนุมัติอัตโนมัติ / รออนุมัติ)
  - `canProceed` ปรับ: ถ้า requirePersonName=false → ไม่ต้องเลือก host
  - Submit ส่ง `channel: "line"` ไป POST /api/appointments

---

## สรุป API ตาม LINE Flow State

| # | State | UserType | Method | Endpoint | สรุป |
|---|-------|----------|--------|----------|------|
| 1 | new-friend | both | POST | `/api/line/webhook` | รับ follow event + ส่งข้อความต้อนรับ |
| 1b | new-friend | both | POST | `/api/line/richmenu/assign` | กำหนด Rich Menu ผู้ใช้ใหม่ |
| 2 | visitor-register | visitor | POST | `/api/auth/register` | ลงทะเบียน visitor ผ่าน LIFF |
| 2b | visitor-register | visitor | POST | `/api/users/me/line/link` | ผูก LINE account กับ user |
| 2c | visitor-register | visitor | POST | `/api/line/richmenu/assign` | เปลี่ยนเป็น Visitor Rich Menu |
| 3 | visitor-registered | visitor | POST | `/api/line/push-message` | ส่ง Flex ยืนยันลงทะเบียน |
| 4 | visitor-booking | visitor | GET | `/api/visit-purposes?channel=line` | ดึงวัตถุประสงค์ (showOnLine=true) |
| 4b | visitor-booking | visitor | GET | `/api/staff` | ค้นหาเจ้าหน้าที่ผู้รับพบ |
| 4c | visitor-booking | visitor | POST | `/api/appointments` | สร้างนัดหมาย |
| 4d | visitor-booking | visitor | POST | `/api/pdpa-consents` | บันทึกยินยอม PDPA |
| 5 | visitor-booking-confirmed | visitor | POST | `/api/line/push-message` | ส่ง Flex ยืนยันนัดหมาย + QR |
| 5b | visitor-booking-confirmed | visitor | POST | `/api/notifications/send` | แจ้ง host officer |
| 6 | visitor-approval-result | visitor | PATCH | `/api/appointments/:id/status` | อัปเดตสถานะอนุมัติ/ปฏิเสธ |
| 6b | visitor-approval-result | visitor | POST | `/api/line/push-message` | แจ้งผล visitor ทาง LINE |
| 7 | visitor-auto-cancelled | visitor | GET | `/api/appointments/pending-expired` | ดึงนัดหมายหมดเวลาอนุมัติ |
| 7b | visitor-auto-cancelled | visitor | PATCH | `/api/appointments/:id/status` | ยกเลิกอัตโนมัติ |
| 7c | visitor-auto-cancelled | visitor | POST | `/api/line/push-message` | แจ้ง visitor ว่าถูกยกเลิก |
| 8 | visitor-reminder | visitor | GET | `/api/appointments/upcoming` | ดึงนัดหมายที่ใกล้ถึง |
| 8b | visitor-reminder | visitor | POST | `/api/line/push-message` | ส่งเตือนล่วงหน้า |
| 9 | visitor-checkin-kiosk | visitor | POST | `/api/kiosk/checkin` | สร้าง visit_entry |
| 9b | visitor-checkin-kiosk | visitor | POST | `/api/counter/checkin` | Check-in ทาง Counter |
| 9c | visitor-checkin-kiosk | visitor | POST | `/api/line/push-message` | แจ้ง visitor + host |
| 10 | visitor-wifi-credentials | visitor | POST | `/api/kiosk/wifi/accept` | ยอมรับ WiFi |
| 10b | visitor-wifi-credentials | visitor | POST | `/api/line/push-message` | ส่ง WiFi credentials ทาง LINE |
| 11 | visitor-slip-line | visitor | POST | `/api/line/push-message` | ส่ง Flex Slip ทาง LINE |
| 11b | visitor-slip-line | visitor | POST | `/api/kiosk/slip/print` | บันทึกการออก slip |
| 12 | visitor-checkout | visitor | PATCH | `/api/entries/:id/checkout` | Check-out visitor |
| 12b | visitor-checkout | visitor | POST | `/api/line/push-message` | ส่งขอบคุณ + สรุปเวลา |
| 13 | officer-register | officer | POST | `/api/auth/register` | ลงทะเบียน officer ผ่าน LIFF |
| 13b | officer-register | officer | GET | `/api/staff/lookup` | ค้นหาข้อมูลพนักงาน |
| 13c | officer-register | officer | POST | `/api/users/me/line/link` | ผูก LINE account |
| 13d | officer-register | officer | POST | `/api/line/richmenu/assign` | เปลี่ยนเป็น Officer Rich Menu |
| 14 | officer-registered | officer | POST | `/api/line/push-message` | ส่ง Flex ยืนยันลงทะเบียน |
| 15 | officer-new-request | officer | POST | `/api/line/push-message` | ส่ง Flex คำขอใหม่ + ปุ่มอนุมัติ |
| 15b | officer-new-request | officer | GET | `/api/appointments/:id` | ดึงรายละเอียดนัดหมาย |
| 16 | officer-approve-action | officer | PATCH | `/api/appointments/:id/status` | อนุมัติ/ปฏิเสธนัดหมาย |
| 16b | officer-approve-action | officer | POST | `/api/line/push-message` | แจ้งผล visitor |
| 17 | officer-checkin-alert | officer | POST | `/api/line/push-message` | แจ้ง officer ว่า visitor check-in แล้ว |
| 18 | officer-overstay-alert | officer | GET | `/api/entries/overstay` | ดึงรายการ overstay |
| 18b | officer-overstay-alert | officer | POST | `/api/line/push-message` | แจ้ง officer + security |

> **Total: 18 States**, ใช้ API Endpoints หลัก 14 ตัว

---

## Visitor Flow (12 States)

### 1. new-friend — ผู้ใช้เพิ่มเพื่อน LINE OA

ผู้ใช้เพิ่มเพื่อน LINE OA ของระบบ → ระบบส่งข้อความต้อนรับ + แสดง Rich Menu สำหรับผู้ใช้ใหม่

**Trigger:**
- User follows LINE OA (`@evms-mots`)
- LINE Follow Event webhook

**Action:**
1. ระบบรับ Follow Event จาก LINE Platform
2. Validate `X-Line-Signature`
3. Log event ลง `line_webhook_events`
4. ส่งข้อความต้อนรับ (Welcome Flex Message)
5. Assign Rich Menu `new-friend` ให้ผู้ใช้

**API Endpoints:**

#### `POST /api/line/webhook`

รับ Webhook Events จาก LINE Platform

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| events | LineEvent[] | Yes | Array of LINE events (follow, message, postback) |
| destination | string | Yes | LINE OA user ID ปลายทาง |

**Response:**

```json
{ "status": "ok" }
```

**Notes:**
- Verify `X-Line-Signature` header ด้วย `channel_secret`
- Event types: `follow`, `unfollow`, `message`, `postback`
- Follow event → ส่งข้อความต้อนรับ + assign Rich Menu (new-friend)
- Postback event → handle approve/reject action

#### `POST /api/line/richmenu/assign`

กำหนด Rich Menu ให้ผู้ใช้ตามประเภท

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| line_user_id | string | Yes | LINE user ID |
| menu_type | string | Yes | `'new-friend'` \| `'visitor'` \| `'officer'` |

**Response:**

```json
{
  "status": "assigned",
  "rich_menu_id": "richmenu-abc123",
  "menu_type": "visitor",
  "assigned_at": "2026-03-30T09:00:00Z"
}
```

**DB Tables:** `line_oa_config`, `line_webhook_events`

**Flex Message:** ข้อความต้อนรับ — แสดงโลโก้ eVMS + แนะนำระบบ + ปุ่ม "ลงทะเบียน"

**Next States:** `visitor-register`, `officer-register`

---

### 2. visitor-register — ลงทะเบียนผู้มาติดต่อ (LIFF)

เปิด LIFF App → เลือกประเภท 'ผู้มาติดต่อ' → กรอกข้อมูลส่วนบุคคล → ระบบสร้าง user account + ผูก LINE → เปลี่ยน Rich Menu เป็น Visitor Menu

**Trigger:**
- User taps 'Registration Now' on Rich Menu
- LIFF app opened

**Action:**
1. LIFF init → ดึง LINE Profile
2. ผู้ใช้เลือกประเภท "ผู้มาติดต่อ"
3. กรอกข้อมูล: ชื่อ, นามสกุล, เบอร์โทร, อีเมล, บริษัท
4. ส่ง registration data + `line_access_token` ไป backend
5. ระบบสร้าง `user_accounts` + `visitor_profiles`
6. ผูก LINE account → เปลี่ยน Rich Menu เป็น Visitor Menu

**API Endpoints:**

#### `POST /api/auth/register`

ลงทะเบียนผู้ใช้ผ่าน LIFF (Visitor หรือ Officer)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_type | string | Yes | `'visitor'` \| `'staff'` |
| first_name | string | Yes | ชื่อ |
| last_name | string | Yes | นามสกุล |
| phone | string | Yes | เบอร์โทรศัพท์ |
| email | string | No | อีเมล |
| company | string | No | บริษัท/หน่วยงาน (visitor only) |
| employee_id | string | No | รหัสพนักงาน (staff only) |
| national_id | string | No | เลขบัตรประชาชน (staff lookup) |
| line_access_token | string | Yes | LIFF access token สำหรับผูก LINE |

**Response:**

```json
{
  "status": "registered",
  "user": {
    "id": 42,
    "email": "puttipong@company.com",
    "user_type": "visitor",
    "first_name": "พุทธิพงษ์",
    "last_name": "คาดสนิท",
    "phone": "081-302-5678",
    "company": "บริษัท สยามเทค จำกัด",
    "line_user_id": "U1234567890",
    "line_display_name": "พุทธิพงษ์",
    "line_linked_at": "2026-03-30T09:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `POST /api/users/me/line/link`

ผูก LINE account กับ user account (เรียกหลัง register สำเร็จ)

#### `POST /api/line/richmenu/assign`

เปลี่ยน Rich Menu เป็น `visitor` (ดู spec ที่ State 1)

**DB Tables:** `user_accounts`, `visitor_profiles`, `line_oa_config`

**Flex Message:** ไม่มี (ใช้ LIFF App สำหรับ UI)

**Next States:** `visitor-registered`

**Code Example (LIFF Frontend):**

```javascript
import liff from '@line/liff';

await liff.init({ liffId: LIFF_ID });
const profile = await liff.getProfile();
// profile.userId = 'U1234567890'
// profile.displayName = 'พุทธิพงษ์'

const res = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    user_type: 'visitor',
    first_name, last_name, phone, email, company,
    line_access_token: liff.getAccessToken(),
  })
});
// → ระบบ link LINE account + assign Visitor Rich Menu
```

---

### 3. visitor-registered — ลงทะเบียนสำเร็จ

ระบบส่ง Flex Message ยืนยันการลงทะเบียน + เปลี่ยน Rich Menu → ผู้ใช้สามารถจองนัดหมาย, ดูข้อมูลส่วนตัว

**Trigger:**
- Registration API returns success

**Action:**
1. Backend ส่ง Flex Message ยืนยันลงทะเบียนสำเร็จ
2. แสดงข้อมูลผู้ใช้ที่ลงทะเบียน
3. แสดงปุ่ม "บันทึกนัดหมาย" เพื่อเข้าสู่ขั้นตอนถัดไป

**API Endpoints:**

#### `POST /api/line/push-message`

ส่ง Push Message / Flex Message ไปยังผู้ใช้

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| to | string | Yes | LINE user ID ปลายทาง |
| template_id | string | Yes | รหัส notification template |
| variables | object | No | ตัวแปรแทนที่ใน template (e.g. `visitor_name`, `date`) |
| flex_message | object | No | LINE Flex Message JSON (ถ้าไม่ใช้ template) |

**Response:**

```json
{
  "status": "sent",
  "message_id": "msg-20260330-001",
  "sent_at": "2026-03-30T09:00:00Z",
  "recipient_line_id": "U1234567890"
}
```

**DB Tables:** `user_accounts`, `visitor_profiles`

**Flex Message:** ยืนยันลงทะเบียน — แสดงชื่อ, เบอร์โทร, บริษัท + ปุ่ม "บันทึกนัดหมาย"

**Next States:** `visitor-booking`

---

### 4. visitor-booking — จองนัดหมาย (LIFF)

เปิด LIFF → เลือกวัตถุประสงค์ (filter showOnLine=true) → เลือกวัน/เวลา → เลือกเจ้าหน้าที่ → กรอกรายละเอียด → ยืนยัน PDPA → ส่งคำขอ

**Trigger:**
- User taps 'บันทึกนัดหมาย' on Rich Menu or Flex Message button

**Action:**
1. เปิด LIFF App หน้าจองนัดหมาย
2. ดึงรายการวัตถุประสงค์ที่ `showOnLine=true`
3. ผู้ใช้เลือกวัตถุประสงค์ → เลือกวัน/เวลา → ค้นหาเจ้าหน้าที่
4. กรอกรายละเอียดเพิ่มเติม (จำนวนผู้ติดตาม, อุปกรณ์)
5. ยืนยัน PDPA consent
6. ส่ง POST สร้างนัดหมาย

**API Endpoints:**

#### `GET /api/visit-purposes?channel=line`

ดึงรายการวัตถุประสงค์ที่เปิดใช้งานบน LINE channel

#### `GET /api/staff`

ค้นหาเจ้าหน้าที่ผู้รับพบ (search by name / department)

#### `POST /api/appointments`

สร้างนัดหมายใหม่ (จาก LINE LIFF หรือ Web)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| visit_purpose_id | number | Yes | รหัสวัตถุประสงค์ |
| host_staff_id | number | Yes | รหัสเจ้าหน้าที่ผู้รับพบ |
| date | string | Yes | วันนัดหมาย (YYYY-MM-DD) |
| time_start | string | Yes | เวลาเริ่ม (HH:mm) |
| time_end | string | Yes | เวลาสิ้นสุด (HH:mm) |
| companions | number | No | จำนวนผู้ติดตาม |
| purpose_note | string | No | หมายเหตุวัตถุประสงค์ |
| equipment | object[] | No | รายการอุปกรณ์นำเข้า |
| channel | string | Yes | `'line'` \| `'web'` \| `'counter'` |

**Response:**

```json
{
  "status": "created",
  "appointment": {
    "id": 1042,
    "code": "eVMS-20260330-1042",
    "visit_purpose": "ติดต่อราชการ",
    "host": { "name": "สมชาย รักชาติ", "department": "สำนักนโยบายและยุทธศาสตร์" },
    "date": "2026-04-02",
    "time_start": "10:00",
    "time_end": "11:00",
    "status": "pending",
    "require_approval": true,
    "qr_code_data": "eVMS-20260402-1042",
    "created_at": "2026-03-30T09:15:00Z"
  },
  "notifications_sent": [
    { "to": "host_officer", "channel": "line", "template": "new-request" },
    { "to": "approver_group", "channel": "line", "template": "approval-needed" }
  ]
}
```

#### `POST /api/pdpa-consents`

บันทึกยินยอม PDPA ของผู้ใช้

**DB Tables:** `appointments`, `visit_purposes`, `visit_purpose_department_rules`, `pdpa_consents`

**Flex Message:** ไม่มี (ใช้ LIFF App)

**Next States:** `visitor-booking-confirmed`

**Code Example (LIFF Frontend):**

```javascript
const purposes = await fetch('/api/visit-purposes?channel=line');
const staff = await fetch('/api/staff?search=' + query);

const res = await fetch('/api/appointments', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    visit_purpose_id: 1,
    host_staff_id: 5,
    date: '2026-04-02',
    time_start: '10:00',
    time_end: '11:00',
    companions: 0,
    channel: 'line',
  })
});
// → สร้าง appointment + ส่ง notification ไปยัง host
```

---

### 5. visitor-booking-confirmed — ยืนยันการจอง

ระบบส่ง Flex Message แสดงรายละเอียดนัดหมาย + QR Code + สถานะ 'รอดำเนินการ' → ส่ง notification ไปยังเจ้าหน้าที่ผู้รับพบ

**Trigger:**
- `POST /api/appointments` returns success
- Appointment created in DB

**Action:**
1. สร้าง Flex Message จาก notification template `visitor-booking-confirmed`
2. แทนที่ variables: `bookingCode`, `purposeName`, `date`, `hostName`
3. Push Flex Message ไปยัง visitor
4. ส่ง notification ไปยัง host officer ผ่าน LINE + Web

**API Endpoints:**

#### `POST /api/line/push-message`

ส่ง Flex Message ยืนยันนัดหมาย (ดู spec ที่ State 3)

#### `POST /api/notifications/send`

ส่ง notification ไปยัง host officer (multi-channel)

**DB Tables:** `appointments`, `notification_logs`

**Flex Message:** ยืนยันนัดหมาย — แสดง booking code, วัตถุประสงค์, วัน/เวลา, ชื่อเจ้าหน้าที่, QR Code, สถานะ "รอดำเนินการ"

**Next States:** `visitor-approval-result`

**Code Example (Backend):**

```javascript
const template = await getFlexTemplate('visitor-booking-confirmed');
const flexMsg = buildFlexMessage(template, {
  bookingCode: appointment.code,
  purposeName: purpose.name,
  date: formatDate(appointment.date),
  hostName: host.name,
});

await lineClient.pushMessage(visitor.lineUserId, {
  type: 'flex',
  altText: `นัดหมาย ${appointment.code} ยืนยันแล้ว`,
  contents: flexMsg,
});
```

---

### 6. visitor-approval-result — แจ้งผลอนุมัติ

เจ้าหน้าที่อนุมัติ/ปฏิเสธ → ระบบส่ง Flex Message แจ้ง visitor ทาง LINE → ถ้าอนุมัติ = แสดง QR Code สำหรับ check-in ที่ kiosk

**Trigger:**
- Officer approves/rejects via LINE or Web
- `PATCH /api/appointments/:id/status`

**Action:**
1. Officer กดอนุมัติ/ปฏิเสธ
2. ระบบอัปเดต `appointments.status` = `'approved'` หรือ `'rejected'`
3. ส่ง Flex Message แจ้ง visitor:
   - **อนุมัติ:** แสดง QR Code + วัน/เวลา + สถานที่ + ปุ่ม "เพิ่มในปฏิทิน"
   - **ปฏิเสธ:** แสดงเหตุผล + ปุ่ม "จองนัดหมายใหม่"

**API Endpoints:**

#### `PATCH /api/appointments/:id/status`

อนุมัติ หรือ ปฏิเสธนัดหมาย

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | Yes | `'approved'` \| `'rejected'` |
| reject_reason | string | No | เหตุผลการปฏิเสธ (required if rejected) |
| officer_note | string | No | หมายเหตุจากเจ้าหน้าที่ |

**Response:**

```json
{
  "status": "updated",
  "appointment": {
    "id": 1042,
    "status": "approved",
    "approved_at": "2026-03-30T10:30:00Z",
    "approved_by": { "id": 5, "name": "สมศรี รักษ์ดี" }
  },
  "notifications_sent": [
    { "to": "visitor", "channel": "line", "template": "approval-approved" }
  ]
}
```

#### `POST /api/line/push-message`

ส่งผลอนุมัติไปยัง visitor (ดู spec ที่ State 3)

**DB Tables:** `appointments`, `notification_logs`, `approver_groups`

**Flex Message:**
- **อนุมัติ:** สีเขียว — QR Code + วัน/เวลา/สถานที่ + ปุ่ม "เพิ่มในปฏิทิน"
- **ปฏิเสธ:** สีแดง — เหตุผล + ปุ่ม "จองนัดหมายใหม่"

**Next States:** `visitor-reminder`, `visitor-checkin-kiosk`, `visitor-auto-cancelled`

---

### 7. visitor-auto-cancelled — ยกเลิกอัตโนมัติ (หมดเวลาอนุมัติ)

นัดหมายไม่ได้รับการอนุมัติภายในเวลาที่กำหนด (เช่น 24 ชม. หรือก่อนวันนัด) → ระบบยกเลิกอัตโนมัติ + ส่ง Flex Message แจ้ง visitor พร้อมปุ่มจองใหม่

**Trigger:**
- Scheduled cron job ตรวจสอบ appointments ที่ `status='pending'` เกินเวลา
- `approval_timeout_hours` (ค่าจาก settings เช่น 24 ชม.)
- หรือ ถ้าวันนัดหมายผ่านไปแล้วยังไม่อนุมัติ → ยกเลิกอัตโนมัติ

**Action:**
1. Cron job เรียก `GET /api/appointments/pending-expired` ทุก 1 ชม.
2. สำหรับแต่ละ appointment ที่หมดเวลา:
   - `PATCH /api/appointments/:id/status` → `status: 'auto-cancelled'`
   - ส่ง LINE notification แจ้ง visitor + host officer
3. Visitor ได้รับ Flex Message พร้อมปุ่ม "จองนัดหมายใหม่"

**API Endpoints:**

#### `GET /api/appointments/pending-expired`

ดึงรายการนัดหมายที่หมดเวลาอนุมัติ (pending เกินกำหนด)

**Response:**

```json
{
  "data": [
    {
      "appointment_id": 1042,
      "code": "eVMS-20260402-1042",
      "visitor_name": "พุทธิพงษ์ คาดสนิท",
      "host_name": "สมชาย รักชาติ",
      "date": "2026-04-02",
      "created_at": "2026-03-30T09:15:00Z",
      "pending_hours": 48,
      "approval_timeout_hours": 24,
      "reason": "exceeded_approval_timeout"
    }
  ],
  "auto_cancelled": 1
}
```

**Notes:**
- เงื่อนไขยกเลิก: `pending_hours > approval_timeout_hours` OR `date < TODAY`
- `approval_timeout_hours` กำหนดใน `system_settings` (default: 24 ชม.)
- เมื่อยกเลิก → `PATCH /api/appointments/:id/status { status: 'auto-cancelled' }`
- ส่ง LINE notification แจ้ง visitor + host officer

#### `PATCH /api/appointments/:id/status`

อัปเดตสถานะเป็น `auto-cancelled` (ดู spec ที่ State 6)

#### `POST /api/line/push-message`

แจ้ง visitor ว่านัดหมายถูกยกเลิก (ดู spec ที่ State 3)

**DB Tables:** `appointments`, `notification_logs`, `notification_templates`, `system_settings`

**Flex Message:** แจ้งยกเลิก — สีเหลือง/ส้ม + ข้อความ "นัดหมายถูกยกเลิกเนื่องจากไม่ได้รับการอนุมัติในเวลาที่กำหนด" + ปุ่ม "จองนัดหมายใหม่"

**Next States:** `visitor-booking`

---

### 8. visitor-reminder — แจ้งเตือนล่วงหน้า

ระบบส่ง Push Message เตือนผู้มาติดต่อ 1 วันก่อน + เช้าวันนัด → แสดง QR Code + สถานที่ + เวลา

**Trigger:**
- Scheduled cron job (T-1 day, T-2 hours)
- `notification_schedule` trigger

**Action:**
1. Cron job ตรวจสอบ appointments ที่จะถึงกำหนดใน 24 ชม. และ 2 ชม.
2. สำหรับแต่ละ appointment:
   - ส่ง Flex Message เตือน + QR Code
   - แสดงข้อมูล: วัน/เวลา, สถานที่, ชื่อเจ้าหน้าที่, ปุ่ม "นำทาง"

**API Endpoints:**

#### `GET /api/appointments/upcoming`

ดึงรายการนัดหมายที่ใกล้ถึงกำหนด (สำหรับ cron job)

#### `POST /api/line/push-message`

ส่งเตือนล่วงหน้า (ดู spec ที่ State 3)

**DB Tables:** `appointments`, `notification_logs`, `notification_templates`

**Flex Message:** เตือนนัดหมาย — แสดง QR Code + วัน/เวลา + สถานที่ + ชื่อเจ้าหน้าที่ + ปุ่ม "นำทาง" / "ยกเลิก"

**Next States:** `visitor-checkin-kiosk`

---

### 9. visitor-checkin-kiosk — Check-in ที่ Kiosk/Counter

ผู้มาติดต่อสแกน QR ที่ kiosk → ยืนยันตัวตน → ถ่ายรูป → ระบบสร้าง visit_entry record + ส่ง Flex Message แจ้งทั้ง visitor และ host officer

**Trigger:**
- QR scanned at kiosk
- ID verified at counter
- `POST /api/kiosk/checkin`

**Action:**
1. Kiosk สแกน QR Code → lookup appointment
2. ยืนยันตัวตน (บัตรประชาชน/Passport/ThaID)
3. ถ่ายรูปใบหน้า
4. สร้าง `visit_entries` record
5. ส่ง Flex Message แจ้ง visitor: "Check-in สำเร็จ"
6. ส่ง Push Message แจ้ง host officer: "มีผู้มาติดต่อ check-in แล้ว"

**API Endpoints:**

#### `POST /api/kiosk/checkin`

สร้าง visit_entry จาก Kiosk

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appointment_id | number | No | รหัสนัดหมาย (null = walk-in) |
| visitor_id | number | Yes | รหัสผู้มาติดต่อ |
| service_point_id | number | Yes | รหัส Kiosk/Counter |
| id_method | string | Yes | `'thai-id'` \| `'passport'` \| `'thaiid-app'` |
| face_photo | string | No | Base64 face photo |
| wifi_accepted | boolean | No | ผู้ใช้ยอมรับ WiFi |
| print_slip | boolean | Yes | `true` = พิมพ์, `false` = ส่งทาง LINE |

**Response:**

```json
{
  "status": "checked-in",
  "entry": {
    "id": 5001,
    "entry_code": "eVMS-25690330-0099",
    "appointment_id": 1042,
    "slip_number": "eVMS-25690330-0099",
    "checkin_at": "2026-03-30T09:45:00Z",
    "wifi": { "ssid": "MOTS-Guest", "password": "mots2026", "valid_until": "2026-03-30T16:30:00Z" }
  },
  "slip": {
    "slip_number": "eVMS-25690330-0099",
    "visitor_name": "พุทธิพงษ์ คาดสนิท",
    "visit_purpose": "ติดต่อราชการ",
    "department": "สำนักนโยบายและยุทธศาสตร์",
    "access_zone": "ชั้น 4 อาคาร C",
    "time_in": "09:45",
    "time_out": "11:00",
    "qr_code_data": "eVMS-OFA-20260330-0099-A2B3C4"
  },
  "notifications_sent": [
    { "to": "host_officer", "channel": "line", "template": "visitor-checkin" },
    { "to": "visitor", "channel": "line", "template": "checkin-welcome" }
  ]
}
```

#### `POST /api/counter/checkin`

Check-in ทาง Counter (เจ้าหน้าที่ดำเนินการแทน — request body เหมือน `/api/kiosk/checkin`)

#### `POST /api/line/push-message`

แจ้ง visitor + host officer (ดู spec ที่ State 3)

**DB Tables:** `visit_entries`, `appointments`, `notification_logs`

**Flex Message:**
- **Visitor:** "Check-in สำเร็จ" — แสดง slip number, เวลา check-in, สถานที่, QR สำหรับ check-out
- **Officer:** "มีผู้มาติดต่อ" — แสดงชื่อ visitor, เวลา check-in, สถานที่

**Next States:** `visitor-wifi-credentials`, `visitor-slip-line`

---

### 10. visitor-wifi-credentials — ส่ง WiFi ทาง LINE

ถ้าวัตถุประสงค์มี `offerWifi=true` และผู้ใช้ผูก LINE → ส่ง Flex Message พร้อม SSID + Password + ระยะเวลาใช้งาน

**Trigger:**
- Check-in success + `purpose.offerWifi=true` + `user.lineLinked=true`

**Action:**
1. ตรวจสอบว่า visit purpose มี `offerWifi=true`
2. สร้าง WiFi session ใน `wifi_sessions`
3. ส่ง Flex Message พร้อม SSID, Password, เวลาหมดอายุ
4. ผู้ใช้สามารถกดคัดลอก password ได้

**API Endpoints:**

#### `POST /api/kiosk/wifi/accept`

ผู้ใช้ยอมรับ WiFi → ส่ง credentials ทาง LINE

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entry_id | number | Yes | รหัส check-in |
| send_via_line | boolean | No | ส่ง credentials ทาง LINE ด้วย |

**Response:**

```json
{
  "wifi": {
    "ssid": "MOTS-Guest",
    "password": "mots2026",
    "valid_until": "2026-03-30T16:30:00Z"
  },
  "line_sent": true
}
```

#### `POST /api/line/push-message`

ส่ง WiFi credentials ทาง LINE (ดู spec ที่ State 3)

**DB Tables:** `visit_entries`, `wifi_sessions`, `visit_purpose_department_rules`

**Flex Message:** WiFi credentials — แสดง SSID, Password (คัดลอกได้), เวลาหมดอายุ, หมายเหตุการใช้งาน

**Next States:** `visitor-slip-line`

---

### 11. visitor-slip-line — ส่งใบ Slip ทาง LINE

แทนการพิมพ์ thermal slip → ส่ง Flex Message แสดงข้อมูล slip + QR Code สำหรับ check-out → kiosk ถามก่อนว่า 'ส่งทาง LINE' หรือ 'พิมพ์'

**Trigger:**
- User selects 'ส่งทาง LINE' at kiosk SUCCESS screen
- `lineLinked=true`

**Action:**
1. สร้าง `visit_slips` record ด้วย `delivery_method='line'`
2. สร้าง Flex Message แสดงข้อมูล slip ทั้งหมด
3. Push ไปยัง visitor ทาง LINE
4. Flex แสดง QR Code สำหรับ check-out

**API Endpoints:**

#### `POST /api/line/push-message`

ส่ง Flex Slip ทาง LINE (ดู spec ที่ State 3)

#### `POST /api/kiosk/slip/print`

บันทึกว่า slip ถูกออกแล้ว (ใช้ร่วมกับ kiosk)

**DB Tables:** `visit_entries`, `visit_slips`

**Flex Message:** Visit Slip — แสดง slip number, ชื่อ visitor, วัตถุประสงค์, แผนก, โซนเข้า, เวลาเข้า/ออก, QR Code สำหรับ check-out

**Next States:** `visitor-checkout`

---

### 12. visitor-checkout — Check-out / ขอบคุณ

เมื่อ visitor check-out (สแกน QR ที่ gate หรือ auto-checkout เมื่อหมดเวลา) → ส่ง Push Message ขอบคุณ + สรุปเวลาเข้า-ออก

**Trigger:**
- QR scanned at exit gate
- Auto-checkout scheduled job
- `PATCH /api/entries/:id/checkout`

**Action:**
1. อัปเดต `visit_entries.checkout_at`
2. คำนวณ `duration_minutes`
3. ส่ง Flex Message ขอบคุณ + สรุปเวลาเข้า/ออก + ระยะเวลา

**API Endpoints:**

#### `PATCH /api/entries/:id/checkout`

Check-out ผู้มาติดต่อ (สแกน QR หรือ auto)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| checkout_method | string | Yes | `'qr-scan'` \| `'manual'` \| `'auto'` |
| checkout_by | number | No | รหัสเจ้าหน้าที่ (manual only) |

**Response:**

```json
{
  "status": "checked-out",
  "entry": {
    "id": 5001,
    "checkout_at": "2026-03-30T11:05:00Z",
    "duration_minutes": 80,
    "checkout_method": "qr-scan"
  },
  "notifications_sent": [
    { "to": "visitor", "channel": "line", "template": "checkout-thankyou" }
  ]
}
```

#### `POST /api/line/push-message`

ส่งข้อความขอบคุณ (ดู spec ที่ State 3)

**DB Tables:** `visit_entries`, `notification_logs`

**Flex Message:** ขอบคุณ — สีเขียว + "ขอบคุณที่มาติดต่อ" + เวลาเข้า/ออก + ระยะเวลา + ปุ่ม "ให้คะแนน"

**Next States:** *(จบ flow)*

---

## Officer Flow (6 States)

### 13. officer-register — ลงทะเบียนเจ้าหน้าที่ (LIFF)

เปิด LIFF App → เลือก 'พนักงาน' → ป้อนรหัสพนักงาน/เลขบัตร → ระบบ lookup จากฐานข้อมูลบุคลากร → ยืนยัน + ผูก LINE → เปลี่ยน Rich Menu เป็น Officer Menu

**Trigger:**
- User taps 'Registration Now' on Rich Menu
- LIFF app opened → selects Officer

**Action:**
1. LIFF init → ดึง LINE Profile
2. ผู้ใช้เลือกประเภท "พนักงาน"
3. ป้อนรหัสพนักงาน หรือ เลขบัตรประชาชน
4. ระบบ lookup จาก `staff` table → แสดงข้อมูลยืนยัน
5. สร้าง `user_accounts` + ผูก LINE
6. เปลี่ยน Rich Menu เป็น Officer Menu

**API Endpoints:**

#### `POST /api/auth/register`

ลงทะเบียน officer (ดู spec ที่ State 2 — ส่ง `user_type: 'staff'` + `employee_id` / `national_id`)

#### `GET /api/staff/lookup`

ค้นหาข้อมูลพนักงานจากรหัสพนักงาน หรือ เลขบัตรประชาชน

#### `POST /api/users/me/line/link`

ผูก LINE account กับ user account

#### `POST /api/line/richmenu/assign`

เปลี่ยน Rich Menu เป็น `officer` (ดู spec ที่ State 1)

**DB Tables:** `user_accounts`, `staff`, `line_oa_config`

**Flex Message:** ไม่มี (ใช้ LIFF App)

**Next States:** `officer-registered`

---

### 14. officer-registered — ลงทะเบียน Officer สำเร็จ

ส่ง Flex Message ยืนยันการผูก LINE → แสดง Rich Menu สำหรับ Officer: ข้อมูลส่วนตัว, ดูคำขอ

**Trigger:**
- Staff registration + LINE link success

**Action:**
1. ส่ง Flex Message ยืนยันลงทะเบียนสำเร็จ
2. แสดงข้อมูลพนักงาน: ชื่อ, แผนก, ตำแหน่ง
3. Rich Menu เปลี่ยนเป็น Officer Menu

**API Endpoints:**

#### `POST /api/line/push-message`

ส่ง Flex ยืนยันลงทะเบียน officer (ดู spec ที่ State 3)

**DB Tables:** `user_accounts`, `staff`

**Flex Message:** ยืนยันลงทะเบียน officer — แสดงชื่อ, แผนก, ตำแหน่ง + ปุ่ม "ดูคำขอ" / "ข้อมูลส่วนตัว"

**Next States:** `officer-new-request`

---

### 15. officer-new-request — แจ้งคำขอใหม่

เมื่อ visitor สร้างนัดหมายที่ต้อง approval → ระบบส่ง Flex Message ไปยัง host officer + approver group → แสดงรายละเอียด visitor + วัตถุประสงค์ + ปุ่ม อนุมัติ/ปฏิเสธ

**Trigger:**
- `POST /api/appointments` creates new appointment with `require_approval=true`

**Action:**
1. ระบบตรวจสอบ appointment ใหม่ที่ต้องอนุมัติ
2. ค้นหา host officer + approver group
3. ส่ง Flex Message พร้อมปุ่ม "อนุมัติ" / "ปฏิเสธ" (Postback Action)
4. แสดงข้อมูล visitor: ชื่อ, บริษัท, วัตถุประสงค์, วัน/เวลา

**API Endpoints:**

#### `POST /api/line/push-message`

ส่ง Flex คำขอใหม่ (ดู spec ที่ State 3)

#### `GET /api/appointments/:id`

ดึงรายละเอียดนัดหมาย (สำหรับสร้าง Flex Message)

**DB Tables:** `appointments`, `approver_groups`, `notification_logs`

**Flex Message:** คำขอใหม่ — สีน้ำเงิน + ข้อมูล visitor + วัตถุประสงค์ + วัน/เวลา + ปุ่ม "อนุมัติ" (สีเขียว) / "ปฏิเสธ" (สีแดง)

**Postback Data:**
```
action=approve&appointment_id=1042
action=reject&appointment_id=1042
```

**Next States:** `officer-approve-action`

---

### 16. officer-approve-action — อนุมัติ / ปฏิเสธ

Officer กดปุ่ม 'อนุมัติ' หรือ 'ปฏิเสธ' บน Flex Message → เปิด LIFF เพื่อยืนยัน → ระบบอัปเดตสถานะ → แจ้ง visitor

**Trigger:**
- Officer taps approve/reject on Flex Message
- LINE Postback Event

**Action:**
1. LINE ส่ง Postback Event → webhook รับ
2. Parse action data: `approve` / `reject`
3. เปิด LIFF ยืนยัน (ถ้า reject → กรอกเหตุผล)
4. `PATCH /api/appointments/:id/status`
5. ส่ง notification แจ้ง visitor ทาง LINE

**API Endpoints:**

#### `PATCH /api/appointments/:id/status`

อนุมัติ/ปฏิเสธนัดหมาย (ดู spec ที่ State 6)

#### `POST /api/line/push-message`

แจ้งผล visitor (ดู spec ที่ State 3)

**DB Tables:** `appointments`, `notification_logs`

**Flex Message:** ผลการดำเนินการ — "คุณอนุมัตินัดหมาย [code] แล้ว" หรือ "คุณปฏิเสธนัดหมาย [code]"

**Next States:** `officer-checkin-alert`

---

### 17. officer-checkin-alert — แจ้งเตือน Visitor Check-in

เมื่อ visitor check-in ที่ kiosk/counter → ระบบส่ง Push Message แจ้ง host officer → แสดงชื่อ visitor, เวลา check-in, สถานที่

**Trigger:**
- `POST /api/kiosk/checkin` or `/api/counter/checkin` success

**Action:**
1. ตรวจสอบว่า appointment มี `notifyOnCheckin=true` (default: true)
2. ค้นหา host officer จาก `appointments.host_staff_id`
3. ส่ง Push Message แจ้ง officer: ชื่อ visitor, เวลา check-in, สถานที่

**API Endpoints:**

#### `POST /api/line/push-message`

แจ้ง officer ว่า visitor check-in (ดู spec ที่ State 3)

**DB Tables:** `visit_entries`, `notification_logs`

**Flex Message:** แจ้ง check-in — "ผู้มาติดต่อ [visitor_name] check-in แล้ว" + เวลา check-in + สถานที่ + ปุ่ม "ดูรายละเอียด"

**Next States:** `officer-overstay-alert`

---

### 18. officer-overstay-alert — แจ้งเตือน Overstay

ถ้า visitor อยู่เกินเวลาที่นัด → ระบบส่ง Push Message แจ้ง host officer + security → แสดงข้อมูล visitor + เวลาที่เกิน

**Trigger:**
- Scheduled cron job checks overdue check-ins
- `check_in.timeEnd < NOW()`

**Action:**
1. Cron job เรียก `GET /api/entries/overstay`
2. สำหรับแต่ละ entry ที่เกินเวลา:
   - ส่ง Push Message แจ้ง host officer + security
   - แสดงข้อมูล: ชื่อ visitor, เวลาเกิน, สถานที่

**API Endpoints:**

#### `GET /api/entries/overstay`

ดึงรายการ visitor ที่เกินเวลานัด

**Response:**

```json
{
  "data": [
    {
      "entry_id": 5001,
      "visitor_name": "สมศักดิ์ จริงใจ",
      "host_name": "สมศรี รักษ์ดี",
      "expected_out": "11:00",
      "overstay_minutes": 45,
      "location": "ชั้น 4 อาคาร C"
    }
  ],
  "total": 1
}
```

#### `POST /api/line/push-message`

แจ้ง officer + security (ดู spec ที่ State 3)

**DB Tables:** `visit_entries`, `notification_logs`

**Flex Message:** แจ้ง overstay — สีแดง/ส้ม + "ผู้มาติดต่อ [visitor_name] อยู่เกินเวลา [X] นาที" + สถานที่ + ปุ่ม "ดำเนินการ"

**Next States:** *(จบ flow)*

---

## Rich Menu Configurations

### 1. new-friend (ผู้ใช้ใหม่)

| พื้นที่ | Label | Action |
|---------|-------|--------|
| ซ้าย | Registration Now | เปิด LIFF ลงทะเบียน |
| ขวา | Help / ช่วยเหลือ | ส่งข้อความ "ติดต่อเจ้าหน้าที่" |

### 2. visitor (ผู้มาติดต่อ)

| พื้นที่ | Label | Action |
|---------|-------|--------|
| ซ้ายบน | ข้อมูลส่วนตัว | เปิด LIFF หน้าโปรไฟล์ |
| กลางบน | บันทึกนัดหมาย | เปิด LIFF หน้าจองนัดหมาย |
| ขวาบน | ประวัติ | เปิด LIFF หน้าประวัตินัดหมาย |
| ซ้ายล่าง | QR Code | แสดง QR Code สำหรับ check-in |
| กลางล่าง | แจ้งปัญหา | ส่งข้อความ "ติดต่อเจ้าหน้าที่" |
| ขวาล่าง | Help | ส่งข้อความช่วยเหลือ |

### 3. officer (เจ้าหน้าที่)

| พื้นที่ | Label | Action |
|---------|-------|--------|
| ซ้ายบน | ข้อมูลส่วนตัว | เปิด LIFF หน้าโปรไฟล์ |
| กลางบน | คำขอนัดหมาย | เปิด LIFF หน้ารายการคำขอ |
| ขวาบน | Bulletin | เปิด LIFF หน้าประกาศ |
| ซ้ายล่าง | ผู้มาติดต่อวันนี้ | เปิด LIFF หน้ารายการวันนี้ |
| กลางล่าง | สถิติ | เปิด LIFF หน้าสถิติ |
| ขวาล่าง | Help | ส่งข้อความช่วยเหลือ |

---

## Webhook Events

### follow — เพิ่มเพื่อน

```json
{
  "type": "follow",
  "source": { "type": "user", "userId": "U1234567890" },
  "replyToken": "abc123...",
  "timestamp": 1711785600000
}
```

**Handler:**
1. Log event ลง `line_webhook_events`
2. ส่งข้อความต้อนรับ (Flex Message)
3. Assign Rich Menu `new-friend`

### unfollow — ลบเพื่อน

```json
{
  "type": "unfollow",
  "source": { "type": "user", "userId": "U1234567890" },
  "timestamp": 1711785600000
}
```

**Handler:**
1. Log event ลง `line_webhook_events`
2. Deactivate user: อัปเดต `user_accounts.line_linked = false`
3. ไม่ต้องส่งข้อความ (ส่งไม่ได้เพราะ user ลบเพื่อนแล้ว)

### message — ข้อความจากผู้ใช้

```json
{
  "type": "message",
  "source": { "type": "user", "userId": "U1234567890" },
  "replyToken": "abc123...",
  "message": { "type": "text", "id": "msg001", "text": "สวัสดี" }
}
```

**Handler:**
1. Log event ลง `line_webhook_events`
2. ตรวจสอบ keyword mapping:
   - "นัดหมาย" / "จอง" → ตอบ Flex พร้อมปุ่มเปิด LIFF จองนัดหมาย
   - "ประวัติ" → ตอบ Flex แสดงประวัติล่าสุด
   - "ช่วยเหลือ" / "help" → ตอบข้อความช่วยเหลือ
3. ข้อความอื่น → ตอบ default message

### postback — การกดปุ่มบน Flex Message

```json
{
  "type": "postback",
  "source": { "type": "user", "userId": "U1234567890" },
  "replyToken": "abc123...",
  "postback": {
    "data": "action=approve&appointment_id=1042"
  }
}
```

**Handler:**
1. Log event ลง `line_webhook_events`
2. Parse `postback.data` → ดึง action + parameters
3. Route ตาม action:
   - `action=approve` → เปิด LIFF ยืนยันอนุมัติ
   - `action=reject` → เปิด LIFF กรอกเหตุผลปฏิเสธ
   - `action=view` → เปิด LIFF แสดงรายละเอียด
   - `action=rebook` → เปิด LIFF จองนัดหมายใหม่

---

## Integration with New Features

### Auto-Approve

**เกี่ยวข้องกับ State:** `visitor-booking-confirmed`

เมื่อ `visit_purpose_department_rules.requireApproval = false`:
1. ข้ามขั้นตอนอนุมัติ → ตั้งสถานะ `approved` ทันที
2. ส่ง Flex Message แจ้ง visitor: "อนุมัติแล้ว" + QR Code
3. ไม่ส่ง notification ไปยัง approver group
4. Flow: `visitor-booking-confirmed` → ข้าม `visitor-approval-result` → ตรงไป `visitor-reminder`

```
IF requireApproval = false:
  appointment.status = 'approved'
  → ส่ง Flex "อนุมัติแล้ว" + QR ทันที
  → ข้าม officer-new-request / officer-approve-action
```

### Batch/Group Notification

**เกี่ยวข้องกับ State:** `officer-new-request`

เมื่อมีนัดหมายใหม่หลายรายการในช่วงเวลาสั้น:
1. รวม notification เป็น batch summary
2. ส่ง Flex Message สรุป: "มีคำขอใหม่ X รายการ" + ปุ่ม "ดูทั้งหมด"
3. ลด notification spam ให้ officer

```
IF pending_requests.count > 3 within 30 minutes:
  → ส่ง batch summary แทน individual notifications
  → Flex: "มีคำขอใหม่ 5 รายการรอดำเนินการ" + ปุ่ม "ดูทั้งหมด"
```

### Period Mode (นัดหมายแบบช่วงวัน)

**เกี่ยวข้องกับ State:** `visitor-reminder`

สำหรับนัดหมายที่ครอบคลุมหลายวัน (เช่น 2-5 เม.ย.):
1. ระบบส่ง reminder ทุกวันในช่วง (ไม่ใช่แค่วันแรก)
2. แสดงข้อมูลวันที่เหลือ: "วันที่ 2/4 ของนัดหมาย"
3. ส่ง QR Code ที่ valid สำหรับวันนั้น

```
FOR each day in appointment.dateRange:
  IF day >= TODAY && day.reminderTime < NOW:
    → ส่ง reminder: "วันนี้เป็นวันที่ X/Y ของนัดหมาย"
    → แสดง QR Code + เวลาวันนี้
```

### notifyOnCheckin

**เกี่ยวข้องกับ State:** `officer-checkin-alert`

ส่ง notification ไปยัง officer เฉพาะเมื่อ `appointment.notifyOnCheckin = true`:
1. ตรวจสอบ flag ก่อนส่ง
2. ถ้า `false` → ข้าม notification (ไม่ส่ง)
3. ใช้สำหรับนัดหมายที่ officer ไม่ต้องการรับแจ้ง (เช่น walk-in ปริมาณมาก)

```
IF appointment.notifyOnCheckin = true:
  → ส่ง Push Message แจ้ง host officer
ELSE:
  → ข้าม (ไม่ส่ง notification)
```

### Overstay with DaySchedule

**เกี่ยวข้องกับ State:** `officer-overstay-alert`

สำหรับนัดหมายแบบ Period Mode ที่มี `daySchedule` แต่ละวัน:
1. ใช้ `daySchedule[today].timeEnd` แทน `appointment.time_end`
2. ตรวจสอบ overstay ตามเวลาสิ้นสุดของวันนั้น ๆ

```
const todaySchedule = appointment.daySchedule[TODAY];
const timeEnd = todaySchedule?.timeEnd || appointment.time_end;

IF NOW > timeEnd + grace_period:
  → ส่ง overstay alert
  → แจ้งเวลาที่เกินตาม daySchedule ของวันนั้น
```

---

## LINE-specific Database Tables

### 1. line_webhook_events

**วัตถุประสงค์:** Log ทุก Webhook Event จาก LINE Platform

**ใช้ใน States:** `new-friend`, `officer-approve-action`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGSERIAL | No | PK |
| event_type | VARCHAR(30) | No | follow \| unfollow \| message \| postback |
| line_user_id | VARCHAR(50) | No | LINE User ID ผู้ส่ง |
| reply_token | VARCHAR(100) | Yes | Reply Token (ใช้ได้ 1 ครั้ง 30 วิ) |
| event_data | JSONB | Yes | Raw event JSON จาก LINE |
| processed | BOOLEAN | No | ประมวลผลแล้วหรือยัง |
| created_at | TIMESTAMP | No | เวลาที่รับ event |

---

### 2. notification_logs

**วัตถุประสงค์:** Log การส่ง Notification ทุกช่องทาง (LINE, Email, SMS)

**ใช้ใน States:** `visitor-booking-confirmed`, `visitor-approval-result`, `visitor-auto-cancelled`, `visitor-reminder`, `visitor-checkin-kiosk`, `visitor-wifi-credentials`, `visitor-slip-line`, `visitor-checkout`, `officer-new-request`, `officer-checkin-alert`, `officer-overstay-alert`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGSERIAL | No | PK |
| channel | ENUM('line','email','sms') | No | ช่องทางการส่ง |
| template_id | INT | Yes | FK → notification_templates.id |
| recipient_user_id | INT | No | FK → user_accounts.id |
| recipient_line_id | VARCHAR(50) | Yes | LINE user ID ปลายทาง |
| appointment_id | INT | Yes | FK → appointments.id |
| entry_id | INT | Yes | FK → visit_entries.id |
| subject | VARCHAR(200) | Yes | หัวข้อ (email/sms) |
| body_snapshot | TEXT | Yes | เนื้อหาที่ส่ง (snapshot) |
| status | ENUM('sent','failed','queued') | No | สถานะการส่ง |
| error_message | TEXT | Yes | ข้อความ error (ถ้า failed) |
| sent_at | TIMESTAMP | Yes | เวลาที่ส่งสำเร็จ |
| created_at | TIMESTAMP | No | เวลาที่สร้าง record |

---

### 3. notification_templates

**วัตถุประสงค์:** แม่แบบข้อความแจ้งเตือน สำหรับแต่ละ Event

**ใช้ใน States:** `visitor-registered`, `visitor-booking-confirmed`, `visitor-approval-result`, `visitor-auto-cancelled`, `visitor-reminder`, `visitor-checkin-kiosk`, `visitor-wifi-credentials`, `visitor-slip-line`, `visitor-checkout`, `officer-registered`, `officer-new-request`, `officer-checkin-alert`, `officer-overstay-alert`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | PK |
| trigger_name | VARCHAR(50) | No | ชื่อ event trigger (e.g. checkin-welcome, approval-approved) |
| channel | ENUM('line','email','sms') | No | ช่องทาง |
| subject_th | VARCHAR(200) | Yes | หัวข้อภาษาไทย |
| body_th | TEXT | No | เนื้อหาภาษาไทย (support `{{variables}}`) |
| body_en | TEXT | Yes | เนื้อหาภาษาอังกฤษ |
| flex_json | JSONB | Yes | LINE Flex Message JSON template |
| variables | TEXT[] | Yes | รายการ variables ที่ใช้ได้ (e.g. visitor_name, date) |
| is_active | BOOLEAN | No | เปิด/ปิดใช้งาน |
| updated_at | TIMESTAMP | No | แก้ไขล่าสุด |

---

### 4. wifi_sessions

**วัตถุประสงค์:** รายการ WiFi ที่แจกให้ visitor

**ใช้ใน States:** `visitor-wifi-credentials`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | PK |
| entry_id | INT | No | FK → visit_entries.id |
| ssid | VARCHAR(50) | No | ชื่อ WiFi |
| password | VARCHAR(50) | No | รหัส WiFi |
| valid_from | TIMESTAMP | No | เริ่มใช้งาน |
| valid_until | TIMESTAMP | No | หมดอายุ |
| sent_via_line | BOOLEAN | No | ส่งทาง LINE แล้วหรือไม่ |
| created_at | TIMESTAMP | No | สร้างเมื่อ |

---

### 5. visit_slips

**วัตถุประสงค์:** ข้อมูล Visit Slip ที่ออก (ทั้งพิมพ์และส่งทาง LINE)

**ใช้ใน States:** `visitor-slip-line`, `visitor-checkin-kiosk`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | PK |
| slip_number | VARCHAR(30) | No | เลขที่ slip (e.g. eVMS-25690330-0099) |
| entry_id | INT | No | FK → visit_entries.id |
| delivery_method | ENUM('print','line','both') | No | วิธีส่ง slip |
| printed_at | TIMESTAMP | Yes | เวลาที่พิมพ์ |
| line_sent_at | TIMESTAMP | Yes | เวลาที่ส่งทาง LINE |
| qr_code_data | VARCHAR(100) | No | QR code สำหรับ check-out |
| slip_data | JSONB | No | ข้อมูล slip ทั้งหมด (JSON) |
| created_at | TIMESTAMP | No | สร้างเมื่อ |

---

## Error Handling

### LINE API Errors

| Error | HTTP Status | สาเหตุ | แนวทางแก้ไข |
|-------|-------------|---------|-------------|
| Rate Limit | 429 | ส่ง message เกิน quota (default: 500/min) | Implement retry with exponential backoff + queue |
| Invalid Token | 401 | Channel Access Token หมดอายุ | Refresh token จาก LINE Console หรือใช้ long-lived token |
| Invalid User | 400 | LINE User ID ไม่ถูกต้อง หรือ user block bot | Log error + skip notification |
| Server Error | 500 | LINE Platform error | Retry 3 ครั้ง + alert admin |
| Timeout | 408 | Network timeout | Retry with backoff |

### Webhook Signature Validation Failure

```javascript
// ตรวจสอบ X-Line-Signature
const crypto = require('crypto');
const signature = req.headers['x-line-signature'];
const body = JSON.stringify(req.body);
const hash = crypto.createHmac('SHA256', CHANNEL_SECRET)
  .update(body).digest('base64');

if (hash !== signature) {
  // Log ลง line_webhook_events { processed: false, error: 'invalid_signature' }
  return res.status(401).json({ error: 'Invalid signature' });
}
```

**แนวทาง:**
- Return `401` ทันที — ไม่ประมวลผล event
- Log event ด้วย `processed: false` เพื่อตรวจสอบภายหลัง
- ตรวจสอบว่า `CHANNEL_SECRET` ตรงกับ LINE Console

### LIFF Initialization Errors

| Error Code | สาเหตุ | แนวทางแก้ไข |
|------------|---------|-------------|
| INIT_FAILED | LIFF ID ไม่ถูกต้อง | ตรวจสอบ LIFF ID ใน LINE Console |
| UNAUTHORIZED | User ยังไม่ login LINE | แสดงหน้า login → `liff.login()` |
| INVALID_CONFIG | Domain ไม่ตรงกับที่ลงทะเบียน | ตรวจสอบ Endpoint URL ใน LIFF settings |
| FORBIDDEN | LIFF app ถูกระงับ | ติดต่อ LINE support |

```javascript
try {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return;
  }
  const profile = await liff.getProfile();
  // proceed...
} catch (err) {
  // แสดง error page + ปุ่ม "ลองใหม่"
  console.error('LIFF init failed:', err);
  showErrorPage(err.code, err.message);
}
```

---

## Flow Diagram

### Visitor Full Journey

```
new-friend
  │
  ├─ (เลือก "ผู้มาติดต่อ")
  │
  ▼
visitor-register ──► visitor-registered
                          │
                          ▼
                    visitor-booking ──► visitor-booking-confirmed
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                          ▼                 ▼                 ▼
                  visitor-auto-      visitor-approval-   (auto-approve)
                  cancelled          result                   │
                      │                 │                     │
                      │    ┌────────────┘                     │
                      │    │                                  │
                      │    ▼                                  │
                      │  visitor-reminder ◄───────────────────┘
                      │    │
                      │    ▼
                      │  visitor-checkin-kiosk
                      │    │
                      │    ├──► visitor-wifi-credentials
                      │    │         │
                      │    │         ▼
                      │    └──► visitor-slip-line
                      │              │
                      │              ▼
                      │         visitor-checkout
                      │
                      └──► visitor-booking (จองใหม่)
```

### Officer Full Journey

```
new-friend
  │
  ├─ (เลือก "พนักงาน")
  │
  ▼
officer-register ──► officer-registered
                          │
                          ▼
                    officer-new-request
                          │
                          ▼
                    officer-approve-action
                          │
                          ▼
                    officer-checkin-alert
                          │
                          ▼
                    officer-overstay-alert
```

### Cross-Flow Interaction

```
VISITOR                              OFFICER
═══════                              ═══════
visitor-booking ─────────────────►  officer-new-request
                                         │
visitor-approval-result  ◄───────  officer-approve-action
         │
visitor-checkin-kiosk ───────────►  officer-checkin-alert
         │
         │ (overstay)
         └───────────────────────►  officer-overstay-alert
```

---

> อ้างอิง: `lib/line-oa-flow-data.ts` — source of truth สำหรับ states, API endpoints, DB tables ทั้งหมด
