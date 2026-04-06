# Counter API Specification

> ออกแบบ RESTful API สำหรับ Counter Flutter App — แต่ละ State ใช้ API อะไร, Request/Response เป็นอย่างไร
> อ้างอิงจาก Database Schema (`lib/database-schema.ts`) และ Counter State Machine (`components/counter/CounterStatePanel.tsx`)

---

## Base URL

```
https://evms.mots.go.th    (Prototype — Next.js App Router)
```

## Authentication

Prototype ใช้ cookie-based auth (`evms_session` JWT cookie) — ทุก API call ส่ง cookie อัตโนมัติ

> **Production Roadmap:** อาจเปลี่ยนเป็น officer session auth สำหรับ standalone counter:
> ```
> Authorization: Bearer <officer_session_token>
> X-Counter-Id: <service_point_id>
> X-Officer-Id: <staff_id>
> ```

### Response Envelope

ทุก API ใช้ response format มาตรฐาน:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

---

## API Reuse Strategy — การใช้ API ร่วมกับ Web App

> **หมายเหตุ:** Counter ไม่ได้สร้าง API routes เฉพาะ (`/api/counter/*`) แต่ reuse existing endpoints
> โดยใช้ React hooks จาก `lib/hooks/use-counter.ts`

| Counter State | Hook | Existing API Endpoint |
|--------------|------|----------------------|
| COUNTER_SELECTION | `useCounterConfig(servicePointId)` | GET /api/service-points/:id |
| IDLE | `useCounterDashboard()` | GET /api/dashboard/kpis + GET /api/entries/today |
| WALKIN_PURPOSE | `useCounterPurposes()` | GET /api/visit-purposes |
| WALKIN_IDENTITY | `useCounterSearchVisitor()` | GET /api/search/visitors |
| WALKIN_IDENTITY | `useCounterBlocklistCheck()` | POST /api/blocklist/check |
| WALKIN_REVIEW (approve) | `useCounterCreateAppointment()` | POST /api/appointments |
| WALKIN_REVIEW (checkin) | `useCounterCheckin()` | POST /api/entries |
| WALKIN_REVIEW (inline approve) | `useInlineApprove()` | POST /api/appointments/:id/approve |
| APPOINTMENT_SEARCH | `useTodayAppointments(search)` | GET /api/appointments?date=today |
| APPOINTMENT_REVIEW | `useCounterCheckin()` | POST /api/entries |
| CHECKOUT_CONFIRM | `useCounterCheckout(entryId)` | POST /api/entries/:id/checkout |

**Hooks file:** `lib/hooks/use-counter.ts`

---

## สรุป API ตาม Counter State

| # | State | Method | Actual Endpoint | Hook | สถานะ |
|---|-------|--------|----------------|------|-------|
| 1 | COUNTER_SELECTION | GET | `/api/service-points/:id` | `useCounterConfig` | ✅ Implemented |
| 1b | COUNTER_SELECTION | POST | *(ยังไม่มี session endpoint)* | — | 🔲 Planned |
| 2 | IDLE | GET | `/api/dashboard/kpis` + `/api/entries/today` | `useCounterDashboard` | ✅ Implemented |
| 3 | WALKIN_IDENTITY | GET | `/api/search/visitors?q=` | `useCounterSearchVisitor` | ✅ Implemented |
| 3b | WALKIN_IDENTITY | POST | `/api/blocklist/check` | `useCounterBlocklistCheck` | ✅ Implemented |
| 4 | WALKIN_PURPOSE | GET | `/api/visit-purposes` | `useCounterPurposes` | ✅ Implemented |
| 5 | WALKIN_DEPARTMENT | — | *(ใช้ข้อมูลจาก visit-purposes response)* | — | ✅ Frontend-only |
| 6 | WALKIN_CONTACT | — | *(ใช้ข้อมูลจาก state)* | — | ✅ Frontend-only |
| 7 | WALKIN_PHOTO | POST | *(ยังไม่มี endpoint)* | — | 🔲 Planned |
| 8 | WALKIN_REVIEW | POST | `/api/entries` | `useCounterCheckin` | ✅ Implemented |
| 8b | WALKIN_REVIEW | POST | `/api/appointments` | `useCounterCreateAppointment` | ✅ Implemented |
| 8c | WALKIN_REVIEW | POST | `/api/appointments/:id/approve` | `useInlineApprove` | ✅ Implemented |
| 8d | WALKIN_REVIEW | POST | `/api/appointments/:id/reject` | `useInlineReject` | ✅ Implemented |
| 9 | APPOINTMENT_SEARCH | GET | `/api/appointments?date=today&search=` | `useTodayAppointments` | ✅ Implemented |
| 10 | APPOINTMENT_IDENTITY | — | *(ใช้ search/visitors + blocklist/check)* | — | ✅ Reuse existing |
| 11 | APPOINTMENT_REVIEW | POST | `/api/entries` | `useCounterCheckin` | ✅ Implemented |
| 12 | CHECKOUT_SCAN | — | *(ยังไม่มี badge lookup endpoint)* | — | 🔲 Planned |
| 13 | CHECKOUT_CONFIRM | POST | `/api/entries/:id/checkout` | `useCounterCheckout` | ✅ Implemented |
| 14 | PRINT_SLIP | GET | `/api/visit-slips/template` | `useVisitSlipTemplate` | ✅ Implemented |
| 15 | SUCCESS | — | *(ใช้ข้อมูลจาก checkin response)* | — | ✅ Frontend-only |
| 16 | — | GET | `/api/entries/today` | `useCounterDashboard` | ✅ Implemented |

> **Total: 11 Implemented API endpoints** — reuse จาก Web App ผ่าน hooks ใน `lib/hooks/use-counter.ts`
> **Planned: 3 endpoints** — session, visitor-photo, badge-lookup (ต้องสร้างเพิ่มสำหรับ production)

> **หมายเหตุ API Summary:**
> - **Rule Enforcement:** State 5 (WALKIN_DEPARTMENT) → fetch `visit_purpose_department_rules` เพื่อกำหนด requireApproval + requirePersonName ก่อนดำเนินการต่อ
> - **Period Handling:** State 9 (APPOINTMENT_SEARCH) + State 11 (APPOINTMENT_REVIEW) รองรับ `entryMode = "period"` — นัดหมายหลายวัน, ตรวจ duplicate, แสดง history
> - **Inline Approval:** State 8 (WALKIN_REVIEW) + State 11 (APPOINTMENT_REVIEW) รองรับการอนุมัติ inline ที่หน้า Counter สำหรับเจ้าหน้าที่ที่มี canApprove = true
> - **notifyOnCheckin:** State 8 + State 11 — เมื่อ check-in สำเร็จ ถ้า appointment.notifyOnCheckin = true → แจ้งเตือน createdByStaff + hostStaff ผ่าน LINE/Email

---

## 1. COUNTER_SELECTION — เลือกจุดบริการ

เจ้าหน้าที่เลือกจุด Counter ที่จะปฏิบัติงาน — โหลดรายการ Counter ที่ status = online

### `GET /api/service-points/:id`

> **Hook:** `useCounterConfig(servicePointId)` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented

**Tables ที่ใช้:** `service_points`, `business_hours_rules`, `service_point_purposes`, `service_point_documents`

**Query Parameters:**
- `type=counter` — กรองเฉพาะ counter
- `status=online` — เฉพาะที่ online

**Response:**

```json
{
  "servicePoints": [
    {
      "id": 3,
      "name": "เคาน์เตอร์ รปภ. ประตู 1",
      "nameEn": "Security Counter Gate 1",
      "type": "counter",
      "status": "online",
      "location": "ชั้น 1 ประตูทางเข้าหลัก",
      "locationEn": "1F Main Entrance",
      "currentOfficer": null,
      "allowedPurposeIds": [1, 2, 3, 4, 5, 6, 7],
      "allowedDocumentIds": [1, 2, 5],
      "slipConfig": {
        "headerText": "กระทรวงการท่องเที่ยวและกีฬา",
        "footerText": "กรุณาคืนบัตรผู้เยี่ยมก่อนออก",
        "printBadge": true
      }
    },
    {
      "id": 4,
      "name": "เคาน์เตอร์ รปภ. ประตู 2",
      "nameEn": "Security Counter Gate 2",
      "type": "counter",
      "status": "online",
      "location": "ชั้น 1 ประตูฝั่งลานจอดรถ",
      "locationEn": "1F Parking Side Entrance",
      "currentOfficer": { "id": 5, "name": "นายสมศักดิ์" },
      "allowedPurposeIds": [1, 2, 3, 7],
      "allowedDocumentIds": [1, 2],
      "slipConfig": {
        "headerText": "กระทรวงการท่องเที่ยวและกีฬา",
        "footerText": "กรุณาคืนบัตรผู้เยี่ยมก่อนออก",
        "printBadge": true
      }
    }
  ]
}
```

### `POST /counter/session` *(Planned — ยังไม่มี endpoint)*

> **Status:** 🔲 Planned — Prototype ใช้ web login (ไม่มี PIN-based counter session)

เจ้าหน้าที่เข้าประจำจุด Counter — สร้าง session

**Tables ที่ใช้:** `service_points` (update), `staff`

**Request:**

```json
{
  "servicePointId": 3,
  "officerPin": "1234",
  "staffId": 8
}
```

**Response:**

```json
{
  "sessionId": "CTR-20260315-003",
  "servicePoint": {
    "id": 3,
    "name": "เคาน์เตอร์ รปภ. ประตู 1",
    "nameEn": "Security Counter Gate 1"
  },
  "officer": {
    "id": 8,
    "name": "สิบตำรวจโท วีรชัย แสนดี",
    "nameEn": "Pol.Cpl. Weerachai Saendee",
    "role": "security_guard"
  },
  "config": {
    "allowedPurposeIds": [1, 2, 3, 4, 5, 6, 7],
    "allowedDocumentIds": [1, 2, 5],
    "supportedInputMethods": ["card-reader", "passport-reader", "manual", "qr-scan", "thai-id-app"]
  },
  "token": "<officer_session_token>"
}
```

---

## 2. IDLE — หน้าหลัก พร้อมรับ

### `GET /api/dashboard/kpis` + `GET /api/entries/today`

> **Hook:** `useCounterDashboard()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented — parallel fetch 2 endpoints

โหลดสรุปสถิติประจำวันและรายชื่อผู้เยี่ยมในคิว

**Tables ที่ใช้:** `visit_entries`, `visitors`, `service_points`, `appointments`

**Query Parameters:**
- `date=2026-03-15` — วันที่ (default = today)

**Response:**

```json
{
  "stats": {
    "todayTotal": 45,
    "walkin": 28,
    "appointment": 17,
    "checkedOut": 30,
    "currentlyInside": 15,
    "pendingQueue": 3
  },
  "recentEntries": [
    {
      "entryId": 41,
      "visitorName": "นายประเสริฐ มั่นคง",
      "purpose": "ติดต่อราชการ",
      "department": "กองกลาง",
      "checkinAt": "2026-03-15T08:45:00+07:00",
      "status": "checked-in",
      "appointmentId": null
    }
  ],
  "upcomingAppointments": [
    {
      "bookingCode": "eVMS-20260315-0042",
      "visitorName": "นายสมชาย ใจดี",
      "hostName": "นางสาวพิมพา เกษมศรี",
      "timeSlot": "10:00-11:30",
      "status": "approved"
    }
  ]
}
```

---

## 3. WALKIN_IDENTITY — ยืนยันตัวตน (Walk-in)

รองรับหลาย input methods: card reader, passport reader, manual, QR scan, ThaiID app

> **Implementation:** Prototype ใช้ 2 API calls:
> 1. `GET /api/search/visitors?q=` — ค้นหา/upsert visitor
> 2. `POST /api/blocklist/check` — เช็ค blocklist
> (Spec เดิมออกแบบเป็น `/counter/identity/card-read` และ `/counter/identity/manual`)

### `GET /api/search/visitors?q={search}`

> **Hook:** `useCounterSearchVisitor()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented

อ่านข้อมูลจากเครื่องอ่านบัตรประชาชน / Passport → ส่งไป backend เช็ค blocklist + upsert visitor

### `POST /api/blocklist/check`

> **Hook:** `useCounterBlocklistCheck()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented

### `POST /counter/identity/card-read` *(Original Design)*

อ่านข้อมูลจากเครื่องอ่านบัตรประชาชน / Passport → ส่งไป backend เช็ค blocklist + upsert visitor

**Tables ที่ใช้:** `visitors` (upsert), `blocklist` (check), `visit_entries` (check existing)

**Request:**

```json
{
  "inputMethod": "card-reader",
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "fullNameTh": "นายสมชาย ใจดี",
  "fullNameEn": "MR. SOMCHAI JAIDEE",
  "dateOfBirth": "1985-06-15",
  "address": "123 ถ.ราชดำเนิน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพ 10200",
  "issueDate": "2022-01-10",
  "expiryDate": "2031-01-09",
  "photo": "<base64_photo_from_id_card>",
  "servicePointId": 3
}
```

**Response — สำเร็จ:**

```json
{
  "status": "ok",
  "visitorId": 15,
  "isNewVisitor": false,
  "isBlocked": false,
  "existingAppointments": [
    {
      "bookingCode": "eVMS-20260315-0042",
      "purposeName": "ประชุม / สัมมนา",
      "hostName": "นางสาวพิมพา เกษมศรี",
      "department": "กองการต่างประเทศ",
      "timeSlot": "10:00-11:30",
      "status": "approved"
    }
  ],
  "previousVisitCount": 3,
  "verifiedData": {
    "fullNameTh": "นายสมชาย ใจดี",
    "fullNameEn": "MR. SOMCHAI JAIDEE",
    "idNumber": "1-2345-67890-12-3",
    "dateOfBirth": "15 มิ.ย. 2528",
    "photo": "<base64_or_url>"
  }
}
```

**Response — Blocked:**

```json
{
  "status": "blocked",
  "isBlocked": true,
  "blockReason": "ประพฤติไม่เหมาะสมในพื้นที่ราชการ",
  "blockedAt": "2025-12-01",
  "message": "บุคคลนี้ถูกระงับการเข้าพื้นที่ — กรุณาแจ้งผู้บังคับบัญชา"
}
```

### `POST /counter/identity/manual` *(Original Design — now uses `GET /api/search/visitors`)*

กรอกข้อมูลด้วยมือ — สำหรับกรณีเครื่องอ่านบัตรเสีย หรือเอกสารอื่น

**Tables ที่ใช้:** `visitors` (upsert), `blocklist` (check)

**Request:**

```json
{
  "inputMethod": "manual",
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "titleTh": "นาย",
  "firstNameTh": "สมชาย",
  "lastNameTh": "ใจดี",
  "firstNameEn": "SOMCHAI",
  "lastNameEn": "JAIDEE",
  "phone": "081-234-5678",
  "organization": "บริษัท ทดสอบ จำกัด",
  "servicePointId": 3,
  "officerNote": "บัตรหมดอายุ — ใช้ใบขับขี่ยืนยัน"
}
```

**Response:**

```json
{
  "status": "ok",
  "visitorId": 16,
  "isNewVisitor": true,
  "isBlocked": false,
  "verifiedData": {
    "fullNameTh": "นายสมชาย ใจดี",
    "fullNameEn": "SOMCHAI JAIDEE",
    "idNumber": "1-2345-67890-12-3"
  }
}
```

---

## 4. WALKIN_PURPOSE — เลือกวัตถุประสงค์

### `GET /api/visit-purposes`

> **Hook:** `useCounterPurposes()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented

ดึงวัตถุประสงค์ที่ Counter นี้รองรับ — frontend filter `showOnCounter = true`

**Tables ที่ใช้:** `visit_purposes`, `visit_purpose_department_rules`, `service_point_purposes`

**Query Parameters:**
- `servicePointId=3`

**Response:**

```json
{
  "purposes": [
    {
      "id": 1,
      "name": "ติดต่อราชการ",
      "nameEn": "Official Business",
      "icon": "🏛️",
      "allowedDepartmentIds": [1, 2, 3, 4, 5, 8, 9]
    },
    {
      "id": 2,
      "name": "ประชุม / สัมมนา",
      "nameEn": "Meeting / Seminar",
      "icon": "📋",
      "allowedDepartmentIds": [1, 3, 4, 9]
    },
    {
      "id": 3,
      "name": "ส่งเอกสาร / พัสดุ",
      "nameEn": "Document / Parcel Delivery",
      "icon": "📄",
      "allowedDepartmentIds": [1, 2, 4]
    },
    {
      "id": 4,
      "name": "ผู้รับเหมา / ซ่อมบำรุง",
      "nameEn": "Contractor / Maintenance",
      "icon": "🔧",
      "allowedDepartmentIds": [2, 6]
    },
    {
      "id": 5,
      "name": "สมัครงาน / สัมภาษณ์",
      "nameEn": "Job Application / Interview",
      "icon": "💼",
      "allowedDepartmentIds": [2]
    },
    {
      "id": 7,
      "name": "รับ-ส่งสินค้า",
      "nameEn": "Delivery / Pickup",
      "icon": "📦",
      "allowedDepartmentIds": [1, 2, 4]
    }
  ]
}
```

> **Dynamic Form Rules:** หลังเลือก purpose แล้ว เมื่อเลือก department ในขั้นตอนถัดไป ระบบจะ fetch `visit_purpose_department_rules` เพื่อกำหนดว่า WALKIN_CONTACT จำเป็นหรือไม่ (ดู section 5 + 5b)

---

## 5. WALKIN_DEPARTMENT — เลือกหน่วยงาน

### *ใช้ข้อมูลจาก visit-purposes response* — `GET /counter/departments` *(Original Design)*

> **Status:** ✅ Frontend-only — departments ดึงจาก `departmentRules` ใน `GET /api/visit-purposes` response

ดึงหน่วยงานตาม purpose ที่เลือก — filter ตาม `visit_purpose_department_rules`

**Tables ที่ใช้:** `departments`, `floors`, `floor_departments`, `visit_purpose_department_rules`

**Query Parameters:**
- `purposeId=1` — วัตถุประสงค์ที่เลือก
- `servicePointId=3`

**Response:**

```json
{
  "departments": [
    {
      "id": 1,
      "name": "สำนักงานปลัดกระทรวง",
      "nameEn": "Office of the Permanent Secretary",
      "abbreviation": "สป.",
      "floor": "ชั้น 3",
      "floorEn": "3F",
      "building": "อาคาร C ศูนย์ราชการ",
      "requirePersonName": true,
      "requireApproval": true,
      "offerWifi": true
    },
    {
      "id": 2,
      "name": "กองกลาง",
      "nameEn": "General Administration Division",
      "abbreviation": "กก.",
      "floor": "ชั้น 2",
      "floorEn": "2F",
      "building": "อาคาร C ศูนย์ราชการ",
      "requirePersonName": true,
      "requireApproval": true,
      "offerWifi": true
    },
    {
      "id": 3,
      "name": "กองการต่างประเทศ",
      "nameEn": "International Affairs Division",
      "abbreviation": "กต.",
      "floor": "ชั้น 5",
      "floorEn": "5F",
      "building": "อาคาร C ศูนย์ราชการ",
      "requirePersonName": true,
      "requireApproval": true,
      "offerWifi": true
    }
  ],
  "floors": [
    { "floor": "ชั้น 2", "count": 1 },
    { "floor": "ชั้น 3", "count": 1 },
    { "floor": "ชั้น 5", "count": 1 }
  ]
}
```

### 5b. *ใช้ข้อมูลจาก visit-purposes response* — `GET /counter/purpose-department-rules` *(Original Design)*

> **Status:** ✅ Frontend-only — rules ดึงจาก `departmentRules` ใน `GET /api/visit-purposes` response

ดึง rules สำหรับคู่ purpose + department ที่เลือก — ใช้กำหนดพฤติกรรมของ form ในขั้นตอนถัดไป

**Tables ที่ใช้:** `visit_purpose_department_rules`

**Query Parameters:**
- `purposeId=1` — วัตถุประสงค์ที่เลือก
- `departmentId=1` — หน่วยงานที่เลือก

**Response:**

```json
{
  "rule": {
    "purposeId": 1,
    "departmentId": 1,
    "requireApproval": true,
    "requirePersonName": true,
    "approverGroupId": 5,
    "approverGroupName": "ผู้อนุมัติ สำนักงานปลัด",
    "notifyOnCheckin": true,
    "offerWifi": true
  }
}
```

> **การใช้ rules:**
> - `requireApproval` → ถ้า `true` ต้องสร้าง appointment status=pending ก่อน check-in (ดู section 8)
> - `requirePersonName` → ถ้า `false` ขั้นตอน WALKIN_CONTACT เป็น optional (ไม่บังคับกรอกข้อมูล host)
> - `notifyOnCheckin` → ถ้า `true` เมื่อ check-in สำเร็จจะแจ้งเตือน createdByStaff + hostStaff ผ่าน LINE/Email

---

## 6. WALKIN_CONTACT — ข้อมูลการติดต่อ

**ไม่ต้องเรียก API** — เจ้าหน้าที่กรอกชื่อผู้ที่มาพบ / เบอร์โทร ในฟอร์ม แล้วเก็บไว้ใน state

> **Dynamic Form Rules (จาก `visit_purpose_department_rules`):**
> - ถ้า `requirePersonName = true` → WALKIN_CONTACT **จำเป็น** (ต้องกรอกชื่อผู้ที่มาพบ / host info)
> - ถ้า `requirePersonName = false` → WALKIN_CONTACT **เป็น optional** (ข้ามได้ ไม่บังคับกรอก host info)
> - UI ควรแสดง label "(จำเป็น)" หรือ "(ไม่บังคับ)" ตาม rules

---

## 7. WALKIN_PHOTO — ถ่ายภาพผู้เยี่ยม

### `POST /counter/visitor-photo` *(Planned — ยังไม่มี endpoint)*

> **Status:** 🔲 Planned — ต้องสร้างสำหรับ production

ถ่ายภาพผู้เยี่ยมด้วย Webcam แล้วอัปโหลดไป backend

**Tables ที่ใช้:** *(file storage)*, `visit_entries.face_photo_path`

**Request:** `multipart/form-data`

```
photo: <binary_jpeg>
visitorId: 15
servicePointId: 3
capturedBy: "officer"
```

**Response:**

```json
{
  "photoPath": "/photos/2026/03/15/visitor-15-counter.jpg",
  "faceDetected": true,
  "quality": "good"
}
```

---

## 8. WALKIN_REVIEW — ตรวจสอบ + สร้าง Visit Entry

### Rule Enforcement ก่อน Check-in

ก่อนเรียก `POST /api/entries` ระบบต้องตรวจ `visit_purpose_department_rules` สำหรับคู่ purpose + department ที่เลือก:

1. **ถ้า `requireApproval = true`:**
   - สร้าง appointment ด้วย `POST /api/appointments` (status = `pending`)
   - ส่ง notification ไปยัง approver group ที่กำหนด
   - เจ้าหน้าที่ที่มี `canApprove = true` ใน approver group สามารถอนุมัติ inline ที่หน้า Counter ได้ (แสดงปุ่ม **"อนุมัติ"**)
   - ถ้าเจ้าหน้าที่ปัจจุบันไม่มีสิทธิ์อนุมัติ → รอการอนุมัติจาก approver (แสดงสถานะ "รอการอนุมัติ")
   - เมื่อ approved แล้ว → เรียก `POST /api/entries` ต่อได้

2. **ถ้า `requireApproval = false`:**
   - Check-in ได้โดยตรง (auto-approve) → เรียก `POST /api/entries` เลย

### 8b. `POST /api/appointments` — สร้าง appointment จาก walk-in (กรณี requireApproval = true)

**Tables ที่ใช้:** `appointments` (INSERT), `visit_purpose_department_rules`, `staff` (approver group)

**Request:**

```json
{
  "type": "walkin",
  "visitorId": 15,
  "visitPurposeId": 1,
  "departmentId": 1,
  "hostContactName": "คุณสมหวัง สุขสมบูรณ์",
  "hostPhone": "02-123-4567 ต่อ 1234",
  "servicePointId": 3,
  "officerId": 8,
  "requestedDate": "2026-03-15",
  "note": "Walk-in ที่ต้องรออนุมัติ"
}
```

**Response:**

```json
{
  "appointment": {
    "id": 99,
    "bookingCode": "eVMS-20260315-0099",
    "status": "pending",
    "createdAt": "2026-03-15T09:00:00+07:00",
    "approverGroup": {
      "id": 5,
      "name": "ผู้อนุมัติ สำนักงานปลัด"
    }
  },
  "officerCanApprove": true,
  "notificationSent": true
}
```

> ถ้า `officerCanApprove = true` → UI แสดงปุ่ม **"อนุมัติ"** เพื่อ approve inline แล้ว check-in ต่อได้ทันที
> ถ้า `officerCanApprove = false` → UI แสดงสถานะ "รอการอนุมัติ" + แจ้งให้ผู้เยี่ยมรอ

### `POST /api/entries` (Walk-in Check-in)

> **Hook:** `useCounterCheckin()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented (sends `checkinChannel: "counter"`)
> **หมายเหตุ:** Spec เดิมออกแบบเป็น `POST /counter/walkin/checkin`

**นี่คือ API หลักสำหรับ Walk-in** — สร้าง `visit_entry` (ที่มี `appointment_id: null` หรือ `appointment_id: <id>` ถ้าสร้าง appointment ก่อน), assign `access_group`, generate badge & QR

**Tables ที่ใช้:** `visit_entries` (INSERT), `appointments` (link ถ้ามี), `access_groups`, `access_group_zones`, `department_access_mappings`, `visit_slip_templates`, `visit_slip_sections`, `visit_slip_fields`, `purpose_slip_mappings`, `visitors`

**Request:**

```json
{
  "type": "walkin",
  "visitorId": 15,
  "servicePointId": 3,
  "visitPurposeId": 1,
  "departmentId": 1,
  "appointmentId": 99,
  "hostContactName": "คุณสมหวัง สุขสมบูรณ์",
  "hostPhone": "02-123-4567 ต่อ 1234",
  "idMethod": "card-reader",
  "documentType": "thai-id-card",
  "facePhotoPath": "/photos/2026/03/15/visitor-15-counter.jpg",
  "officerId": 8,
  "vehiclePlate": null,
  "companionsCount": 0,
  "officerNote": null
}
```

> **หมายเหตุ:** `appointmentId` เป็น optional — ส่งเฉพาะกรณีที่สร้าง appointment ก่อน (requireApproval = true)

**Response:**

```json
{
  "entry": {
    "id": 42,
    "entryCode": "eVMS-20260315-0099",
    "appointmentId": 99,
    "status": "checked-in",
    "checkinAt": "2026-03-15T09:05:00+07:00",
    "checkinBy": "officer",
    "checkinOfficerId": 8
  },
  "accessControl": {
    "accessGroupId": 2,
    "accessGroupName": "ติดต่อราชการ ชั้น 2-5",
    "qrCodeData": "eVMS-OFA-20260315-0099-A2B3C4",
    "qrCodeExpiry": "2026-03-15T17:00:00+07:00",
    "allowedZones": [
      { "id": 1, "name": "ล็อบบี้ ชั้น 1", "nameEn": "Lobby 1F" },
      { "id": 3, "name": "สำนักงานปลัด ชั้น 3", "nameEn": "OPS 3F" }
    ],
    "hikvisionSynced": true
  },
  "badge": {
    "badgeNumber": "V-20260315-0099",
    "slipNumber": "eVMS-25680315-0099",
    "askPrint": true
  },
  "notification": {
    "hostNotified": true,
    "channel": "line",
    "notifiedTo": "คุณสมหวัง สุขสมบูรณ์"
  }
}
```

> **notifyOnCheckin:** ถ้า appointment (ที่สร้างจาก walk-in หรือจากระบบจอง) มี `notifyOnCheckin = true` → ระบบจะส่ง notification ไปยัง `createdByStaff` + `hostStaff` ผ่าน LINE/Email เมื่อ check-in สำเร็จ

**Error Response:**

```json
{
  "error": "DUPLICATE_ACTIVE_ENTRY",
  "message": "ผู้เยี่ยมนี้ยังมี entry ที่ checked-in อยู่ — กรุณาเช็คเอาท์ก่อน",
  "existingEntryId": 38
}
```

```json
{
  "error": "APPROVAL_REQUIRED",
  "message": "วัตถุประสงค์ + หน่วยงานนี้ต้องได้รับการอนุมัติก่อน check-in — กรุณาสร้างใบนัดหมายก่อน",
  "requireApproval": true,
  "approverGroupId": 5
}
```

---

## 9. APPOINTMENT_SEARCH — ค้นหานัดหมาย

### `GET /api/appointments?date=today&search={keyword}`

> **Hook:** `useTodayAppointments(search)` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented
> **หมายเหตุ:** Spec เดิมออกแบบเป็น `GET /counter/appointments/today`

ค้นหานัดหมายวันนี้ — filter ด้วย keyword (ชื่อ, เลขบัตร, booking code, ชื่อ host)

> **Period Awareness:** นัดหมายแบบ period (หลายวัน) จะแสดงเมื่อวันนี้อยู่ในช่วง dateStart-dateEnd ไม่ใช่เฉพาะวันที่ dateStart = today
> **Filter Logic:** `WHERE dateStart <= TODAY AND (dateEnd >= TODAY OR dateEnd IS NULL)`

**Tables ที่ใช้:** `appointments`, `visitors`, `staff`, `departments`, `visit_purposes`

**Query Parameters:**
- `keyword=สมชาย` — ค้นจากชื่อ/เลขบัตร/booking code/ชื่อ host
- `status=approved,confirmed,pending` — กรองสถานะ (default = approved,confirmed)
- `servicePointId=3`
- `includePeriod=true` — รวมนัดหมายแบบ period ที่วันนี้อยู่ในช่วง (default = true)

**Response:**

```json
{
  "appointments": [
    {
      "id": 42,
      "bookingCode": "eVMS-20260315-0042",
      "entryMode": "single",
      "visitor": {
        "name": "นายสมชาย ใจดี",
        "nameEn": "SOMCHAI JAIDEE",
        "idNumber": "1-2345-XXXXX-XX-3",
        "phone": "081-234-5678"
      },
      "host": {
        "name": "นางสาวพิมพา เกษมศรี",
        "department": "กองการต่างประเทศ",
        "floor": "ชั้น 5"
      },
      "purpose": "ประชุม / สัมมนา",
      "purposeEn": "Meeting / Seminar",
      "timeSlot": "10:00-11:30",
      "status": "approved",
      "companionsCount": 0,
      "notes": null
    },
    {
      "id": 55,
      "bookingCode": "eVMS-20260310-0055",
      "entryMode": "period",
      "dateStart": "2026-03-10",
      "dateEnd": "2026-03-20",
      "periodInfo": {
        "totalDays": 11,
        "currentDay": 6,
        "displayText": "นัดหมายหลายวัน: 10 มี.ค. - 20 มี.ค. | วันนี้: วันที่ 6/11"
      },
      "visitor": {
        "name": "นายวิชัย ช่างซ่อม",
        "nameEn": "WICHAI CHANGSOM",
        "idNumber": "5-6789-XXXXX-XX-1",
        "phone": "089-999-8888"
      },
      "host": {
        "name": "นายอนันต์ มั่นคง",
        "department": "กองกลาง",
        "floor": "ชั้น 2"
      },
      "purpose": "ผู้รับเหมา / ซ่อมบำรุง",
      "purposeEn": "Contractor / Maintenance",
      "timeSlot": "08:00-17:00",
      "status": "approved",
      "companionsCount": 2,
      "notes": "งานซ่อมระบบไฟฟ้า ชั้น 2",
      "badges": ["หลายวัน", "วันที่ 6/11"]
    }
  ],
  "total": 2
}
```

> **การแสดงผล Period:**
> - แสดง badge **"หลายวัน"** สำหรับนัดหมายที่มี `entryMode = "period"`
> - แสดง badge **"วันที่ X/Y"** เพื่อบอกว่าวันนี้เป็นวันที่เท่าไหร่ของช่วง
> - `periodInfo.displayText` ใช้แสดงข้อความสรุปในหน้า review

---

## 10. APPOINTMENT_IDENTITY — ยืนยันตัวตน (นัดหมาย)

### *ใช้ API จาก Section 3* — `POST /counter/appointments/{id}/verify` *(Original Design)*

> **Status:** ✅ Reuse existing — ใช้ `GET /api/search/visitors` + `POST /api/blocklist/check`
> Spec เดิมออกแบบเป็น `POST /counter/appointments/{id}/verify`

ยืนยันตัวตนผู้เยี่ยมที่มีนัดหมาย — ตรวจว่าเลขบัตรตรงกับข้อมูลนัดหมาย

**Tables ที่ใช้:** `visitors`, `appointments`, `blocklist`

**Request:**

```json
{
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "inputMethod": "card-reader",
  "fullNameTh": "นายสมชาย ใจดี",
  "servicePointId": 3
}
```

**Response — สำเร็จ:**

```json
{
  "status": "matched",
  "visitorId": 15,
  "isBlocked": false,
  "matchResult": {
    "nameMatch": true,
    "idMatch": true,
    "confidence": 1.0
  },
  "verifiedData": {
    "fullNameTh": "นายสมชาย ใจดี",
    "fullNameEn": "SOMCHAI JAIDEE",
    "idNumber": "1-2345-67890-12-3",
    "photo": "<base64_or_url>"
  }
}
```

**Response — ไม่ตรง:**

```json
{
  "status": "mismatch",
  "matchResult": {
    "nameMatch": false,
    "idMatch": false,
    "confidence": 0.0
  },
  "message": "ข้อมูลบัตรไม่ตรงกับผู้จองนัดหมาย"
}
```

---

## 11. APPOINTMENT_REVIEW — เช็คอินจากนัดหมาย

### Period Handling (สำหรับ entryMode = "period")

สำหรับนัดหมายแบบหลายวัน (`entryMode = "period"`):

1. **แสดงข้อมูล period:** `"นัดหมายหลายวัน: {dateStart} - {dateEnd} | วันนี้: วันที่ X/Y"`
2. **Validate:** ตรวจสอบว่า TODAY อยู่ในช่วง `dateStart` ถึง `dateEnd`
3. **ตรวจ duplicate:** ไม่อนุญาตให้ check-in ซ้ำในวันเดียวกัน (same-day duplicate entry)
4. **แสดง history:** ประวัติ check-in/check-out ของวันก่อนหน้าในช่วง period

### Inline Approval (สำหรับ status = pending)

ถ้านัดหมายมี `status = pending` และเจ้าหน้าที่ปัจจุบันมี `canApprove = true`:
- แสดงปุ่ม **"อนุมัติ"** เพื่อ approve inline ที่หน้า Counter
- เมื่อกดอนุมัติ → เรียก `POST /api/appointments/:id/approve` แล้ว check-in ต่อได้ทันที

### `POST /api/entries` (Appointment Check-in)

> **Hook:** `useCounterCheckin()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented (sends `checkinChannel: "counter"` + `appointmentId`)
> **หมายเหตุ:** Spec เดิมออกแบบเป็น `POST /counter/appointments/{id}/checkin`

เจ้าหน้าที่ยืนยัน check-in จากนัดหมาย — สร้าง `visit_entry` ที่มี `appointment_id: <id>` (appointment status ไม่เปลี่ยน)

**Tables ที่ใช้:** `visit_entries` (INSERT), `appointments` (lookup), `access_groups`, `access_group_zones`, `department_access_mappings`, `visit_slip_templates`, `purpose_slip_mappings`

**Request:**

```json
{
  "visitorId": 15,
  "servicePointId": 3,
  "idMethod": "card-reader",
  "documentType": "thai-id-card",
  "facePhotoPath": "/photos/2026/03/15/visitor-15-counter.jpg",
  "officerId": 8
}
```

**Response (single mode):**

```json
{
  "entry": {
    "id": 42,
    "entryCode": "eVMS-20260315-0042",
    "appointmentId": 42,
    "status": "checked-in",
    "checkinAt": "2026-03-15T10:02:00+07:00",
    "checkinBy": "officer",
    "checkinOfficerId": 8
  },
  "accessControl": {
    "accessGroupId": 3,
    "accessGroupName": "ประชุม ชั้น 5",
    "qrCodeData": "eVMS-OFA-20260315-0042-X5Y6Z7",
    "qrCodeExpiry": "2026-03-15T11:30:00+07:00",
    "allowedZones": [
      { "id": 1, "name": "ล็อบบี้ ชั้น 1" },
      { "id": 5, "name": "กองการต่างประเทศ ชั้น 5" }
    ],
    "hikvisionSynced": true
  },
  "badge": {
    "badgeNumber": "V-20260315-0042",
    "slipNumber": "eVMS-25680315-0042",
    "askPrint": true
  },
  "notification": {
    "hostNotified": true,
    "channel": "line",
    "notifiedTo": "นางสาวพิมพา เกษมศรี"
  }
}
```

**Response (period mode — เพิ่มเติม):**

```json
{
  "entry": {
    "id": 88,
    "entryCode": "eVMS-20260315-0088",
    "appointmentId": 55,
    "status": "checked-in",
    "checkinAt": "2026-03-15T08:10:00+07:00",
    "checkinBy": "officer",
    "checkinOfficerId": 8
  },
  "periodInfo": {
    "entryMode": "period",
    "dateStart": "2026-03-10",
    "dateEnd": "2026-03-20",
    "totalDays": 11,
    "currentDay": 6,
    "displayText": "นัดหมายหลายวัน: 10 มี.ค. - 20 มี.ค. | วันนี้: วันที่ 6/11",
    "previousEntries": [
      { "date": "2026-03-10", "checkinAt": "08:05", "checkoutAt": "16:50" },
      { "date": "2026-03-11", "checkinAt": "08:12", "checkoutAt": "17:02" },
      { "date": "2026-03-12", "checkinAt": "08:00", "checkoutAt": "16:45" },
      { "date": "2026-03-13", "checkinAt": "08:20", "checkoutAt": "16:55" },
      { "date": "2026-03-14", "checkinAt": "08:08", "checkoutAt": "17:10" }
    ]
  },
  "accessControl": {
    "accessGroupId": 4,
    "accessGroupName": "ผู้รับเหมา ชั้น 2",
    "qrCodeData": "eVMS-OFA-20260315-0055-P6Q7R8",
    "qrCodeExpiry": "2026-03-15T17:00:00+07:00",
    "allowedZones": [
      { "id": 1, "name": "ล็อบบี้ ชั้น 1" },
      { "id": 2, "name": "กองกลาง ชั้น 2" }
    ],
    "hikvisionSynced": true
  },
  "badge": {
    "badgeNumber": "V-20260315-0088",
    "slipNumber": "eVMS-25680315-0088",
    "askPrint": true
  },
  "notification": {
    "hostNotified": true,
    "channel": "line",
    "notifiedTo": "นายอนันต์ มั่นคง"
  }
}
```

> **notifyOnCheckin:** ถ้า appointment มี `notifyOnCheckin = true` → ระบบจะส่ง notification ไปยัง `createdByStaff` + `hostStaff` ผ่าน LINE/Email เมื่อ check-in สำเร็จ (ทั้ง single และ period mode)

**Error Response — Period Duplicate:**

```json
{
  "error": "PERIOD_DUPLICATE_ENTRY",
  "message": "นัดหมายนี้มีการ check-in วันนี้แล้ว — ไม่อนุญาตให้ check-in ซ้ำในวันเดียวกัน",
  "existingEntryId": 87,
  "existingCheckinAt": "2026-03-15T08:10:00+07:00"
}
```

```json
{
  "error": "PERIOD_DATE_OUT_OF_RANGE",
  "message": "วันนี้ไม่อยู่ในช่วงวันที่ของนัดหมาย (10 มี.ค. - 20 มี.ค.)",
  "dateStart": "2026-03-10",
  "dateEnd": "2026-03-20"
}
```

---

## 12. CHECKOUT_SCAN — สแกนออก

### `GET /counter/entries/active/{badgeCode}` *(Planned — ยังไม่มี endpoint)*

> **Status:** 🔲 Planned — ต้องสร้างสำหรับ production

ค้นหาผู้เยี่ยมที่ยัง check-in อยู่ จาก badge barcode / QR code

**Tables ที่ใช้:** `visit_entries`, `visitors`, `departments`, `visit_purposes`

**Response — พบ:**

```json
{
  "found": true,
  "entry": {
    "id": 42,
    "entryCode": "eVMS-20260315-0099",
    "badgeNumber": "V-20260315-0099",
    "visitor": {
      "name": "นายสมชาย ใจดี",
      "nameEn": "SOMCHAI JAIDEE",
      "idNumber": "1-2345-XXXXX-XX-3",
      "photo": "<url>"
    },
    "purpose": "ติดต่อราชการ",
    "department": "สำนักงานปลัดกระทรวง",
    "floor": "ชั้น 3",
    "checkinAt": "2026-03-15T09:05:00+07:00",
    "duration": "2 ชั่วโมง 30 นาที",
    "status": "checked-in"
  }
}
```

**Response — ไม่พบ:**

```json
{
  "found": false,
  "reason": "not-found",
  "message": "ไม่พบข้อมูลผู้เยี่ยมจากรหัสนี้"
}
```

---

## 13. CHECKOUT_CONFIRM — ยืนยัน Checkout

### `POST /api/entries/:id/checkout`

> **Hook:** `useCounterCheckout(entryId)` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented
> **หมายเหตุ:** Spec เดิมออกแบบเป็น `POST /counter/entries/{id}/checkout`

เจ้าหน้าที่กดยืนยัน checkout — update `visit_entry.status` เป็น `checked-out` + revoke access

**Tables ที่ใช้:** `visit_entries` (UPDATE status → checked-out), `access_groups` (revoke)

**Request:**

```json
{
  "officerId": 8,
  "returnedBadge": true,
  "returnedItems": ["บัตรผู้เยี่ยม"],
  "officerNote": null
}
```

**Response:**

```json
{
  "success": true,
  "entry": {
    "id": 42,
    "status": "checked-out",
    "checkoutAt": "2026-03-15T11:35:00+07:00",
    "checkoutBy": "officer",
    "checkoutOfficerId": 8,
    "totalDuration": "2 ชั่วโมง 30 นาที"
  },
  "accessRevoked": true
}
```

---

## 14. PRINT_SLIP — พิมพ์บัตรผู้เยี่ยม

### `GET /api/visit-slips/template` (Public — ไม่ต้อง auth)

ดึง Visit Slip Template (default) สำหรับ Counter ใช้ preview + พิมพ์บัตรผู้เยี่ยม
Counter จะเรียก endpoint นี้ตอน mount เพื่อดึง template ที่ admin ตั้งค่าไว้ในหน้า `/web/settings/visit-slips`

**Tables ที่ใช้:** `visit_slip_templates`, `visit_slip_sections`, `visit_slip_fields`

**Response:**

```json
{
  "success": true,
  "data": {
    "template": {
      "id": 1,
      "name": "แบบ Thermal 80mm มาตรฐาน",
      "logoUrl": "/images/mot_logo_slip.png",
      "logoSizePx": 50,
      "orgName": "กระทรวงการท่องเที่ยวและกีฬา",
      "orgNameEn": "Ministry of Tourism and Sports",
      "slipTitle": "VISITOR PASS",
      "footerTextTh": "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
      "footerTextEn": "Please return this pass when leaving",
      "paperSize": "thermal-80mm",
      "paperWidthPx": 302,
      "sections": [
        {
          "id": "header",
          "name": "ส่วนหัว (Header)",
          "nameEn": "Header Section",
          "enabled": true,
          "fields": [
            { "key": "orgLogo", "label": "โลโก้หน่วยงาน", "labelEn": "Organization Logo", "enabled": true, "editable": false }
          ]
        }
      ]
    }
  }
}
```

> **หมายเหตุ:** Response `sections` ถูก map จาก DB (`sectionKey` → `id`, `isEnabled` → `enabled`, `fieldKey` → `key`) ให้ตรงกับ `ThermalSection[]` type

**Frontend Hook:** `useVisitSlipTemplate()` จาก `lib/hooks/use-settings.ts` — cache 5 นาที

**การใช้งานใน Counter:**
- เรียกตอน mount → ส่ง `slipSections`, `slipLogoUrl`, `slipLogoSize` ให้ Success Overlay
- Success Overlay render `ThermalSlipPreview` ตาม template ที่ admin ตั้งค่า (แสดงคู่กับ summary)
- ปุ่ม "พิมพ์บัตร" จะส่งข้อมูลไปที่ thermal printer

### `POST /counter/badge/print` *(Planned — ยังไม่มี endpoint)*

> **Status:** 🔲 Planned — Prototype ใช้ `GET /api/visit-slips/template` แทน

ส่งข้อมูลสำหรับพิมพ์บัตรผู้เยี่ยม + ดึง slip template

**Tables ที่ใช้:** `visit_slip_templates`, `visit_slip_sections`, `visit_slip_fields`, `purpose_slip_mappings`, `visit_entries`

**Request:**

```json
{
  "entryId": 42,
  "servicePointId": 3,
  "printType": "badge",
  "copies": 1
}
```

**Response:**

```json
{
  "printJob": {
    "id": "PRT-20260315-042",
    "status": "sent",
    "template": {
      "templateId": 1,
      "templateName": "บัตรผู้เยี่ยมมาตรฐาน",
      "size": "80mm"
    }
  },
  "badgeData": {
    "header": "กระทรวงการท่องเที่ยวและกีฬา",
    "visitorName": "นายสมชาย ใจดี",
    "badgeNumber": "V-20260315-0099",
    "purpose": "ติดต่อราชการ",
    "department": "สำนักงานปลัด ชั้น 3",
    "validDate": "15 มี.ค. 2569",
    "validTime": "09:05-17:00",
    "qrCode": "eVMS-OFA-20260315-0099-A2B3C4",
    "photo": "<base64_or_url>",
    "footer": "กรุณาคืนบัตรผู้เยี่ยมก่อนออก"
  }
}
```

---

## 15. SUCCESS — สรุปข้อมูลสำเร็จ

### `GET /counter/entries/{id}/summary` *(Planned — ยังไม่มี endpoint)*

> **Status:** ✅ Frontend-only — ใช้ข้อมูลจาก `POST /api/entries` response แสดง overlay

ดึงข้อมูลสรุปหลัง check-in สำเร็จ — แสดง overlay + ข้อมูลสำหรับ reprint

**Tables ที่ใช้:** `visit_entries`, `visitors`, `departments`, `visit_purposes`

**Response:**

```json
{
  "entry": {
    "id": 42,
    "entryCode": "eVMS-20260315-0099",
    "badgeNumber": "V-20260315-0099",
    "status": "checked-in",
    "type": "walkin",
    "appointmentId": null,
    "checkinAt": "2026-03-15T09:05:00+07:00"
  },
  "visitor": {
    "name": "นายสมชาย ใจดี",
    "nameEn": "SOMCHAI JAIDEE"
  },
  "destination": {
    "purpose": "ติดต่อราชการ",
    "department": "สำนักงานปลัด",
    "floor": "ชั้น 3",
    "hostName": "คุณสมหวัง สุขสมบูรณ์"
  },
  "accessControl": {
    "qrCodeData": "eVMS-OFA-20260315-0099-A2B3C4",
    "allowedZones": ["ล็อบบี้ ชั้น 1", "สำนักงานปลัด ชั้น 3"],
    "validUntil": "17:00 น."
  },
  "canReprint": true
}
```

---

## 16. GET /api/entries/today — รายการ Entry วันนี้

### `GET /api/entries/today`

> **Hook:** `useCounterDashboard()` from `lib/hooks/use-counter.ts`
> **Status:** ✅ Implemented

ดึงรายการ visit entries ทั้งหมดของวันนี้ — ใช้สำหรับแสดง dashboard / ตรวจสอบสถานะ

**Tables ที่ใช้:** `visit_entries`, `visitors`, `departments`, `visit_purposes`, `appointments`

**Query Parameters:**
- `date=2026-03-15` — วันที่ (default = today)
- `status=checked-in,checked-out` — กรองสถานะ entry (checked-in, checked-out, auto-checkout, overstay)
- `servicePointId=3`
- `keyword=สมชาย` — ค้นจากชื่อ/เลขบัตร/entryCode

**Response:**

```json
{
  "entries": [
    {
      "id": 42,
      "entryCode": "eVMS-20260315-0099",
      "appointmentId": null,
      "status": "checked-in",
      "visitor": {
        "name": "นายสมชาย ใจดี",
        "nameEn": "SOMCHAI JAIDEE",
        "idNumber": "1-2345-XXXXX-XX-3"
      },
      "purpose": "ติดต่อราชการ",
      "department": "สำนักงานปลัดกระทรวง",
      "floor": "ชั้น 3",
      "checkinAt": "2026-03-15T09:05:00+07:00",
      "checkoutAt": null,
      "checkinBy": "officer",
      "badgeNumber": "V-20260315-0099"
    },
    {
      "id": 43,
      "entryCode": "eVMS-20260315-0100",
      "appointmentId": 55,
      "status": "checked-out",
      "visitor": {
        "name": "นางสาวพรทิพย์ สว่างจิต",
        "nameEn": "PORNTIP SAWANGJIT",
        "idNumber": "3-1234-XXXXX-XX-9"
      },
      "purpose": "ประชุม / สัมมนา",
      "department": "กองการต่างประเทศ",
      "floor": "ชั้น 5",
      "checkinAt": "2026-03-15T10:00:00+07:00",
      "checkoutAt": "2026-03-15T12:30:00+07:00",
      "checkinBy": "kiosk",
      "badgeNumber": "V-20260315-0100"
    }
  ],
  "total": 2,
  "summary": {
    "checkedIn": 1,
    "checkedOut": 1,
    "autoCheckout": 0,
    "overstay": 0
  }
}
```

> **หมายเหตุ:** Entry status values: `checked-in`, `checked-out`, `auto-checkout`, `overstay`
> Appointment status values (แยกจาก entry): `pending`, `approved`, `rejected`, `confirmed`, `cancelled`, `expired`

---

## Error Codes (ทุก Endpoint)

```json
{
  "error": "<ERROR_CODE>",
  "message": "ข้อความอธิบาย",
  "messageEn": "English description",
  "details": {}
}
```

| Error Code | HTTP | สาเหตุ |
|-----------|------|--------|
| `UNAUTHORIZED` | 401 | Token หมดอายุ / ไม่ถูกต้อง |
| `COUNTER_OFFLINE` | 403 | Counter ไม่ได้ online |
| `SESSION_EXPIRED` | 401 | Session เจ้าหน้าที่หมดอายุ |
| `VISITOR_BLOCKED` | 403 | ผู้เยี่ยมอยู่ใน blocklist |
| `DUPLICATE_ACTIVE_ENTRY` | 409 | ผู้เยี่ยมยังมี entry ที่ checked-in อยู่ |
| `APPOINTMENT_NOT_FOUND` | 404 | ไม่พบนัดหมาย |
| `APPOINTMENT_STATUS_INVALID` | 400 | นัดหมายไม่ได้อยู่ในสถานะ approved/confirmed |
| `IDENTITY_MISMATCH` | 400 | ข้อมูลบัตรไม่ตรงกับนัดหมาย |
| `APPROVAL_REQUIRED` | 403 | ต้องได้รับอนุมัติก่อน check-in (requireApproval = true) |
| `PERIOD_DUPLICATE_ENTRY` | 409 | นัดหมาย period — มี check-in วันนี้แล้ว |
| `PERIOD_DATE_OUT_OF_RANGE` | 400 | วันนี้ไม่อยู่ในช่วง dateStart-dateEnd ของนัดหมาย |
| `PRINTER_OFFLINE` | 503 | เครื่องพิมพ์ไม่พร้อม |
| `ENTRY_NOT_FOUND` | 404 | ไม่พบ entry ผู้เยี่ยมจาก barcode/QR |
| `INTERNAL_ERROR` | 500 | ข้อผิดพลาดภายใน |

---

## Sequence Diagram — Walk-in Flow

```
Officer              Counter App              Backend
  │                      │                       │
  │  SELECT_COUNTER      │                       │
  │─────────────────────>│  🔲 POST /counter/session (Planned) │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ sessionToken
  │                      │                       │
  │  INSERT CARD         │                       │
  │─────────────────────>│  POST /identity/card-read
  │                      │──────────────────────>│
  │                      │<──────────────────────│ visitor data + blocklist check
  │                      │                       │
  │  SELECT PURPOSE      │                       │
  │─────────────────────>│  GET /api/visit-purposes │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ purposes list
  │                      │                       │
  │  SELECT DEPT         │                       │
  │─────────────────────>│  (derived from visit-purposes) │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ departments by purpose
  │                      │                       │
  │                      │  GET /purpose-department-rules  ← NEW
  │                      │──────────────────────>│
  │                      │<──────────────────────│ rules (requireApproval, requirePersonName)
  │                      │                       │
  │  FILL CONTACT        │                       │
  │─────────────────────>│  (local state only)   │
  │                      │  ※ required/optional ตาม requirePersonName
  │                      │                       │
  │  CAPTURE PHOTO       │                       │
  │─────────────────────>│  POST /visitor-photo  │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ photoPath
  │                      │                       │
  │  CONFIRM             │                       │
  │                      │  [if requireApproval]  │
  │                      │  POST /api/appointments ← NEW
  │                      │──────────────────────>│
  │                      │<──────────────────────│ appointment (pending)
  │                      │  [if canApprove] → approve inline
  │                      │  [else] → wait for approval
  │                      │                       │
  │─────────────────────>│  POST /walkin/checkin  │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ visit_entry + QR + badge
  │                      │  ※ notifyOnCheckin → LINE/Email to host
  │                      │                       │
  │                      │  POST /badge/print    │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ print job
  │                      │                       │
  │  SUCCESS ✓           │                       │
```

---

## Sequence Diagram — Checkout Flow

```
Officer              Counter App              Backend
  │                      │                       │
  │  SCAN BADGE          │                       │
  │─────────────────────>│  GET /entries/active/{code}
  │                      │──────────────────────>│
  │                      │<──────────────────────│ visitor + entry data
  │                      │                       │
  │  CONFIRM CHECKOUT    │                       │
  │─────────────────────>│  POST /entries/{id}/checkout
  │                      │──────────────────────>│
  │                      │<──────────────────────│ checkout confirmed
  │                      │                       │
  │  DONE ✓              │                       │
```

---

## Blocklist Check (เพิ่มเติม — ตรวจหลัง Identity Input)

### เมื่อไหร่ที่ตรวจ?
ตรวจ **หลังขั้นตอน Identity Input** (ป้อนชื่อ-สกุลเสร็จ) ก่อนเลือกวัตถุประสงค์

### API: POST `/api/blocklist/check`

```
POST /v1/blocklist/check
Authorization: Bearer <officer_session_token>
Content-Type: application/json
```

**Request:**
```json
{
  "first_name": "สุรศักดิ์",
  "last_name": "อันตราย",
  "channel": "counter",
  "checked_by": 5
}
```

**Response (ถ้าพบ):**
```json
{
  "is_blocked": true,
  "entry": {
    "id": 1,
    "first_name": "สุรศักดิ์",
    "last_name": "อันตราย",
    "type": "permanent",
    "reason": "พฤติกรรมไม่เหมาะสม — ก่อความวุ่นวายในพื้นที่",
    "expiry_date": null,
    "added_by": "อนันต์ มั่นคง"
  }
}
```

**Response (ไม่พบ):**
```json
{
  "is_blocked": false,
  "entry": null
}
```

### Logic:
- ตรวจ partial match (case-insensitive) กับชื่อ-นามสกุลทั้งไทยและอังกฤษ
- **ไม่ตรวจเลขบัตร** — ระบบเก็บเฉพาะ mask (หลักหน้า + 4 หลักท้าย)
- ถ้า `type: "permanent"` → แสดง Warning Modal + **ปิดปุ่มดำเนินการต่อ**
- ถ้า `type: "temporary"` + หมดอายุแล้ว → อนุญาตดำเนินการต่อได้
- ทุกครั้งที่ตรวจ log ใน `blocklist_check_logs`

### Visitor Name Fields (updated)
```
visitors table:
  first_name      VARCHAR(100)   — ชื่อ (ไม่รวมคำนำหน้า)
  last_name       VARCHAR(100)   — นามสกุล
  first_name_en   VARCHAR(100)   — First Name (English)
  last_name_en    VARCHAR(100)   — Last Name (English)
  name            VARCHAR(200)   — ชื่อเต็ม (computed, backward compat)
  name_en         VARCHAR(200)   — ชื่อเต็ม English (computed)
```

---

## ผลการทดสอบ Walk-in Check-in Flow (Counter)

> ทดสอบ: 6 เมษายน 2569
> Script: `scripts/test-walkin-flow.mjs`
> Target: `https://vms-prototype-delta.vercel.app`
> ผลรวม: ✅ ผ่านทุกรายการ

### Counter Walk-in (requireApproval=false) — Phase 1

| # | Endpoint | Method | ผลทดสอบ |
|---|----------|--------|---------|
| 1 | `/api/service-points/:id` | GET | ✅ โหลด counter config สำเร็จ |
| 2 | `/api/visit-purposes` | GET | ✅ โหลด purposes สำเร็จ |
| 3 | `/api/search/visitors?q=` | GET | ✅ ค้นหา visitor สำเร็จ |
| 4 | `/api/blocklist/check` | POST | ✅ ตรวจ blocklist สำเร็จ (not blocked) |
| 5 | `/api/entries` | POST | ✅ สร้าง walk-in entry สำเร็จ (channel=counter, no appointment) |
| 6 | `/api/entries/today` | GET | ✅ entry ปรากฏใน today list, status=checked-in |
| 7 | `/api/entries/:id/checkout` | POST | ✅ checkout สำเร็จ, status=checked-out |
| 8 | `/api/entries/today` | GET | ✅ status เปลี่ยนเป็น checked-out |
| 9 | `/api/dashboard/kpis` | GET | ✅ KPIs แสดงตัวเลขถูกต้อง |

### Counter Walk-in (requireApproval=true + inline approve) — Phase 2

| # | Endpoint | Method | ผลทดสอบ |
|---|----------|--------|---------|
| 1 | `/api/appointments` | POST | ✅ สร้าง pending appointment สำเร็จ (status=pending) |
| 2 | `/api/appointments/:id/approve` | POST | ✅ admin approve inline สำเร็จ (status=approved) |
| 3 | `/api/appointments?search=` | GET | ✅ ตรวจยืนยัน appointment approved |
| 4 | `/api/entries` | POST | ✅ สร้าง entry linked to appointment สำเร็จ |
| 5 | `/api/entries/:id/checkout` | POST | ✅ checkout สำเร็จ |

### Counter Walk-in (period mode) — Phase 3

| # | Endpoint | Method | ผลทดสอบ |
|---|----------|--------|---------|
| 1 | `/api/appointments` | POST | ✅ สร้าง period appointment สำเร็จ (entryMode=period, dateEnd) |
| 2 | `/api/appointments/:id/approve` | POST | ✅ approve period appointment |
| 3 | `/api/entries` | POST | ✅ สร้าง entry วันที่ 1 สำเร็จ (status=checked-in) |
| 4 | `/api/entries` | POST | ✅ ซ้ำวันเดียวกัน → reject 409 `ALREADY_CHECKED_IN_TODAY` |
| 5 | `/api/entries/:id/checkout` | POST | ✅ checkout entry สำเร็จ |

### Edge Cases — Phase 6

| # | Test Case | ผลทดสอบ |
|---|-----------|---------|
| 6a | Single mode duplicate entry (entryMode=single) | ✅ ครั้งแรกสำเร็จ, ครั้งที่ 2 reject 409 `SINGLE_ENTRY_USED` |
| 6b | Auth limitations documented | ✅ checkout/approve ต้องใช้ staff cookie auth |

### Entry Mode Validation Summary

| entryMode | พฤติกรรม | Error Code | HTTP Status |
|-----------|---------|------------|:-----------:|
| `single` | อนุญาต 1 entry เท่านั้น ตลอด appointment | `SINGLE_ENTRY_USED` | 409 |
| `period` | อนุญาต 1 entry ต่อวัน (ในช่วง dateStart-dateEnd) | `ALREADY_CHECKED_IN_TODAY` | 409 |
| `period` | หลังวันสิ้นสุด | `APPOINTMENT_EXPIRED` | 410 |
| `period` | ก่อนวันเริ่มต้น | `BEFORE_DATE_RANGE` | 400 |

### Business Hours Note

- วันหยุดราชการ (เช่น วันจักรี 6 เม.ย.) → appointment ที่ `followBusinessHours=true` ถูก reject ด้วย `BUSINESS_HOURS_CLOSED`
- Purpose+Dept ที่ `followBusinessHours=false` สามารถนัดหมายได้ทุกวัน
