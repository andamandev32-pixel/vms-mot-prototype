# Counter API Specification

> ออกแบบ RESTful API สำหรับ Counter Flutter App — แต่ละ State ใช้ API อะไร, Request/Response เป็นอย่างไร
> อ้างอิงจาก Database Schema (`lib/database-schema.ts`) และ Counter State Machine (`components/counter/CounterStatePanel.tsx`)

---

## Base URL

```
https://api.evms.mots.go.th/v1
```

## Authentication

ทุก request จาก Counter ต้องส่ง Header:

```
Authorization: Bearer <officer_session_token>
X-Counter-Id: <service_point_id>
X-Officer-Id: <staff_id>
```

Token ได้จาก Officer Login (PIN + ข้อมูลเจ้าหน้าที่) — ผูกกับ `staff.id` + `service_points.id`

---

## สรุป API ตาม Counter State

| # | State | Method | Endpoint | สรุป |
|---|-------|--------|----------|------|
| 1 | COUNTER_SELECTION | GET | `/counter/service-points` | โหลดรายการจุดบริการ Counter ที่ว่าง |
| 1b | COUNTER_SELECTION | POST | `/counter/session` | เจ้าหน้าที่เข้าประจำจุด Counter |
| 2 | IDLE | GET | `/counter/dashboard` | โหลดสรุปสถิติประจำวัน + Queue |
| 3 | WALKIN_IDENTITY | POST | `/counter/identity/card-read` | อ่านข้อมูลจากเครื่องอ่านบัตร + เช็ค blocklist |
| 3b | WALKIN_IDENTITY | POST | `/counter/identity/manual` | กรอกข้อมูลด้วยมือ (manual entry) |
| 4 | WALKIN_PURPOSE | GET | `/counter/purposes` | ดึงวัตถุประสงค์ที่ Counter รองรับ |
| 5 | WALKIN_DEPARTMENT | GET | `/counter/departments` | ดึงหน่วยงานตาม purpose |
| 6 | WALKIN_CONTACT | — | *(ใช้ข้อมูลจาก state, ไม่ต้องเรียก API)* | |
| 7 | WALKIN_PHOTO | POST | `/counter/visitor-photo` | อัปโหลดภาพถ่ายผู้เยี่ยม (Webcam) |
| 8 | WALKIN_REVIEW | POST | `/counter/walkin/checkin` | สร้าง visit_record สำหรับ walk-in |
| 9 | APPOINTMENT_SEARCH | GET | `/counter/appointments/today` | ค้นหานัดหมายวันนี้ |
| 10 | APPOINTMENT_IDENTITY | POST | `/counter/appointments/{id}/verify` | ยืนยันตัวตนกับนัดหมาย |
| 11 | APPOINTMENT_REVIEW | POST | `/counter/appointments/{id}/checkin` | เช็คอินจากนัดหมาย |
| 12 | CHECKOUT_SCAN | GET | `/counter/visits/active/{badgeCode}` | ค้นหาผู้เยี่ยมจาก badge/QR |
| 13 | CHECKOUT_CONFIRM | POST | `/counter/visits/{id}/checkout` | ยืนยัน checkout |
| 14 | PRINT_SLIP | POST | `/counter/badge/print` | บันทึกการพิมพ์บัตร + ดึง slip layout |
| 15 | SUCCESS | GET | `/counter/visits/{id}/summary` | ดึงสรุปข้อมูล check-in สำเร็จ |

---

## 1. COUNTER_SELECTION — เลือกจุดบริการ

เจ้าหน้าที่เลือกจุด Counter ที่จะปฏิบัติงาน — โหลดรายการ Counter ที่ status = online

### `GET /counter/service-points`

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

### `POST /counter/session`

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

### `GET /counter/dashboard`

โหลดสรุปสถิติประจำวันและรายชื่อผู้เยี่ยมในคิว

**Tables ที่ใช้:** `visit_records`, `visitors`, `service_points`

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
  "recentVisitors": [
    {
      "visitId": 41,
      "visitorName": "นายประเสริฐ มั่นคง",
      "purpose": "ติดต่อราชการ",
      "department": "กองกลาง",
      "checkinAt": "2026-03-15T08:45:00+07:00",
      "status": "checked-in"
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

### `POST /counter/identity/card-read`

อ่านข้อมูลจากเครื่องอ่านบัตรประชาชน / Passport → ส่งไป backend เช็ค blocklist + upsert visitor

**Tables ที่ใช้:** `visitors` (upsert), `blocklist` (check), `visit_records` (check existing)

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

### `POST /counter/identity/manual`

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

### `GET /counter/purposes`

ดึงวัตถุประสงค์ที่ Counter นี้รองรับ — filter ตาม `service_point_purposes`

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

---

## 5. WALKIN_DEPARTMENT — เลือกหน่วยงาน

### `GET /counter/departments`

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

---

## 6. WALKIN_CONTACT — ข้อมูลการติดต่อ

**ไม่ต้องเรียก API** — เจ้าหน้าที่กรอกชื่อผู้ที่มาพบ / เบอร์โทร ในฟอร์ม แล้วเก็บไว้ใน state (fields เป็น optional)

---

## 7. WALKIN_PHOTO — ถ่ายภาพผู้เยี่ยม

### `POST /counter/visitor-photo`

ถ่ายภาพผู้เยี่ยมด้วย Webcam แล้วอัปโหลดไป backend

**Tables ที่ใช้:** *(file storage)*, `visit_records.face_photo_path`

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

## 8. WALKIN_REVIEW — ตรวจสอบ + สร้าง Visit Record

### `POST /counter/walkin/checkin`

**นี่คือ API หลักสำหรับ Walk-in** — รวม transaction: สร้าง `visit_record`, assign `access_group`, generate badge & QR

**Tables ที่ใช้:** `visit_records` (INSERT), `access_groups`, `access_group_zones`, `department_access_mappings`, `visit_slip_templates`, `visit_slip_sections`, `visit_slip_fields`, `purpose_slip_mappings`, `visitors`

**Request:**

```json
{
  "type": "walkin",
  "visitorId": 15,
  "servicePointId": 3,
  "visitPurposeId": 1,
  "departmentId": 1,
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

**Response:**

```json
{
  "visitRecord": {
    "id": 42,
    "bookingCode": "eVMS-20260315-0099",
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

**Error Response:**

```json
{
  "error": "DUPLICATE_ACTIVE_VISIT",
  "message": "ผู้เยี่ยมนี้ยังเช็คอินอยู่ — กรุณาเช็คเอาท์ก่อน",
  "existingVisitId": 38
}
```

---

## 9. APPOINTMENT_SEARCH — ค้นหานัดหมาย

### `GET /counter/appointments/today`

ค้นหานัดหมายวันนี้ — filter ด้วย keyword (ชื่อ, เลขบัตร, booking code, ชื่อ host)

**Tables ที่ใช้:** `visit_records`, `visitors`, `staff`, `departments`, `visit_purposes`

**Query Parameters:**
- `keyword=สมชาย` — ค้นจากชื่อ/เลขบัตร/booking code/ชื่อ host
- `status=approved,confirmed` — กรองสถานะ (default = approved,confirmed)
- `servicePointId=3`

**Response:**

```json
{
  "appointments": [
    {
      "id": 42,
      "bookingCode": "eVMS-20260315-0042",
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
    }
  ],
  "total": 1
}
```

---

## 10. APPOINTMENT_IDENTITY — ยืนยันตัวตน (นัดหมาย)

### `POST /counter/appointments/{id}/verify`

ยืนยันตัวตนผู้เยี่ยมที่มีนัดหมาย — ตรวจว่าเลขบัตรตรงกับข้อมูลนัดหมาย

**Tables ที่ใช้:** `visitors`, `visit_records`, `blocklist`

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

### `POST /counter/appointments/{id}/checkin`

เจ้าหน้าที่ยืนยัน check-in จากนัดหมาย — สร้าง visit_record + update appointment status

**Tables ที่ใช้:** `visit_records` (UPDATE), `access_groups`, `access_group_zones`, `department_access_mappings`, `visit_slip_templates`, `purpose_slip_mappings`

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

**Response:**

```json
{
  "visitRecord": {
    "id": 42,
    "bookingCode": "eVMS-20260315-0042",
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

---

## 12. CHECKOUT_SCAN — สแกนออก

### `GET /counter/visits/active/{badgeCode}`

ค้นหาผู้เยี่ยมที่ยัง check-in อยู่ จาก badge barcode / QR code

**Tables ที่ใช้:** `visit_records`, `visitors`, `departments`, `visit_purposes`

**Response — พบ:**

```json
{
  "found": true,
  "visit": {
    "id": 42,
    "bookingCode": "eVMS-20260315-0099",
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

### `POST /counter/visits/{id}/checkout`

เจ้าหน้าที่กดยืนยัน checkout — update visit_record status + revoke access

**Tables ที่ใช้:** `visit_records` (UPDATE), `access_groups` (revoke)

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
  "visit": {
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

### `POST /counter/badge/print`

ส่งข้อมูลสำหรับพิมพ์บัตรผู้เยี่ยม + ดึง slip template

**Tables ที่ใช้:** `visit_slip_templates`, `visit_slip_sections`, `visit_slip_fields`, `purpose_slip_mappings`, `visit_records`

**Request:**

```json
{
  "visitRecordId": 42,
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

### `GET /counter/visits/{id}/summary`

ดึงข้อมูลสรุปหลัง check-in สำเร็จ — แสดง overlay + ข้อมูลสำหรับ reprint

**Tables ที่ใช้:** `visit_records`, `visitors`, `departments`, `visit_purposes`

**Response:**

```json
{
  "visit": {
    "id": 42,
    "bookingCode": "eVMS-20260315-0099",
    "badgeNumber": "V-20260315-0099",
    "status": "checked-in",
    "type": "walkin",
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
| `DUPLICATE_ACTIVE_VISIT` | 409 | ผู้เยี่ยมยังมี visit ที่ active อยู่ |
| `APPOINTMENT_NOT_FOUND` | 404 | ไม่พบนัดหมาย |
| `APPOINTMENT_STATUS_INVALID` | 400 | นัดหมายไม่ได้อยู่ในสถานะ approved/confirmed |
| `IDENTITY_MISMATCH` | 400 | ข้อมูลบัตรไม่ตรงกับนัดหมาย |
| `PRINTER_OFFLINE` | 503 | เครื่องพิมพ์ไม่พร้อม |
| `BADGE_NOT_FOUND` | 404 | ไม่พบบัตรผู้เยี่ยมจาก barcode/QR |
| `INTERNAL_ERROR` | 500 | ข้อผิดพลาดภายใน |

---

## Sequence Diagram — Walk-in Flow

```
Officer              Counter App              Backend
  │                      │                       │
  │  SELECT_COUNTER      │                       │
  │─────────────────────>│  POST /counter/session │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ sessionToken
  │                      │                       │
  │  INSERT CARD         │                       │
  │─────────────────────>│  POST /identity/card-read
  │                      │──────────────────────>│
  │                      │<──────────────────────│ visitor data + blocklist check
  │                      │                       │
  │  SELECT PURPOSE      │                       │
  │─────────────────────>│  GET /counter/purposes│
  │                      │──────────────────────>│
  │                      │<──────────────────────│ purposes list
  │                      │                       │
  │  SELECT DEPT         │                       │
  │─────────────────────>│  GET /counter/departments
  │                      │──────────────────────>│
  │                      │<──────────────────────│ departments by purpose
  │                      │                       │
  │  FILL CONTACT        │                       │
  │─────────────────────>│  (local state only)   │
  │                      │                       │
  │  CAPTURE PHOTO       │                       │
  │─────────────────────>│  POST /visitor-photo  │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ photoPath
  │                      │                       │
  │  CONFIRM             │                       │
  │─────────────────────>│  POST /walkin/checkin  │
  │                      │──────────────────────>│
  │                      │<──────────────────────│ visit_record + QR + badge
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
  │─────────────────────>│  GET /visits/active/{code}
  │                      │──────────────────────>│
  │                      │<──────────────────────│ visitor + visit data
  │                      │                       │
  │  CONFIRM CHECKOUT    │                       │
  │─────────────────────>│  POST /visits/{id}/checkout
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
