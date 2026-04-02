# Kiosk API Specification

> ออกแบบ RESTful API สำหรับ Kiosk Flutter App — แต่ละ State ใช้ API อะไร, Request/Response เป็นอย่างไร
> อ้างอิงจาก Database Schema (`lib/database-schema.ts`) และ State Machine (`lib/kiosk/kiosk-state-machine.ts`)

---

## Base URL

```
https://api.evms.mots.go.th/v1
```

## Authentication

ทุก request จาก Kiosk ต้องส่ง Header:

```
Authorization: Bearer <kiosk_device_token>
X-Kiosk-Serial: <serial_number>
X-Kiosk-Id: <service_point_id>
```

Token ได้จาก Device Registration ครั้งแรก (ผูกกับ `service_points.serial_number`)

---

## API Reuse Strategy — การใช้ API ร่วมกับ Web App

> **หมายเหตุ:** Kiosk ไม่ได้สร้าง API routes เฉพาะ (`/api/kiosk/*`) แต่ reuse existing endpoints ของ Web App
> โดยใช้ React hooks จาก `lib/hooks/use-kiosk.ts` เป็น abstraction layer

| Kiosk State | Hook | Existing API Endpoint |
|------------|------|----------------------|
| WELCOME | `useKioskConfig(servicePointId)` | GET /api/service-points/:id |
| SELECT_PURPOSE | `useKioskPurposes()` | GET /api/visit-purposes |
| ID_VERIFICATION | `useSearchVisitor()` | GET /api/search/visitors |
| ID_VERIFICATION | `useKioskBlocklistCheck()` | POST /api/blocklist/check |
| PENDING_APPROVAL | `useCreatePendingAppointment()` | POST /api/appointments |
| PENDING_APPROVAL | `usePollAppointmentStatus(id)` | GET /api/appointments/:id (poll 10s) |
| SUCCESS | `useKioskCheckin()` | POST /api/entries |
| QR_SCAN | `useAppointmentLookup()` | GET /api/search/appointments |
| PDPA_CONSENT | `useRecordPdpaConsent()` | POST /api/pdpa/accept |

**Hooks file:** `lib/hooks/use-kiosk.ts`
**Component ใหม่:** `components/kiosk/PendingApprovalScreen.tsx` — Polling UI สำหรับ PENDING_APPROVAL state

---

## สรุป API ตาม Kiosk State

| # | State | Method | Endpoint | สรุป |
|---|-------|--------|----------|------|
| 1 | WELCOME | GET | `/kiosk/config` | โหลด config ตู้ + เช็คสถานะ online |
| 2 | PDPA_CONSENT | GET | `/kiosk/pdpa` | ดึงข้อความ PDPA เวอร์ชันล่าสุด |
| 2b | PDPA_CONSENT | POST | `/kiosk/pdpa/consent` | บันทึกการยินยอม PDPA |
| 3 | SELECT_ID_METHOD | GET | `/kiosk/id-methods` | ดึงวิธียืนยันตัวตนที่ตู้นี้รองรับ |
| 4 | ID_VERIFICATION | POST | `/kiosk/verify-identity` | ส่งข้อมูลจากเครื่องอ่านบัตร + เช็ค blocklist |
| 5 | DATA_PREVIEW | — | *(ใช้ข้อมูลจาก state, ไม่ต้องเรียก API)* | |
| 6 | SELECT_PURPOSE | GET | `/kiosk/purposes` | ดึงวัตถุประสงค์ที่แสดงบน Kiosk |
| 7 | FACE_CAPTURE | POST | `/kiosk/face-photo` | อัปโหลดภาพถ่ายใบหน้า |
| 8 | WIFI_OFFER | POST | `/kiosk/wifi/generate` | สร้าง WiFi Credentials |
| 9 | SUCCESS | POST | `/kiosk/checkin` | สร้าง visit_entry + ออก QR/Slip |
| 9b | SUCCESS | POST | `/kiosk/slip/print` | บันทึกว่าพิมพ์ slip แล้ว |
| 10 | QR_SCAN | POST | `/kiosk/appointment/lookup-qr` | ค้นหานัดหมายจาก QR Code |
| 11 | APPOINTMENT_PREVIEW | — | *(ใช้ข้อมูลจาก lookup, ไม่ต้องเรียก API)* | |
| 12 | APPOINTMENT_VERIFY_ID | POST | `/kiosk/appointment/verify` | ยืนยันตัวตนกับนัดหมาย |
| 13 | Appointment No-QR | POST | `/kiosk/appointment/lookup-id` | ค้นหานัดหมายจากบัตรประชาชน |
| 14 | PENDING_APPROVAL | POST | `/api/appointments` | สร้าง appointment (status=pending) สำหรับ walk-in ที่ต้องอนุมัติ |
| 14b | PENDING_APPROVAL | GET | `/api/appointments/:id` | poll ทุก 10 วินาทีเพื่อเช็คสถานะอนุมัติ |
| — | ERROR | POST | `/kiosk/error-log` | รายงาน error ไป backend (optional) |

> **Total States: 15** (รวม PENDING_APPROVAL ที่เพิ่มใหม่สำหรับ walk-in approval flow)

---

## 1. WELCOME — โหลด Config ตู้

เรียกตอน boot หรือ reset กลับหน้าแรก — ดึงข้อมูล service_points + business_hours_rules

### `GET /kiosk/config`

**Tables ที่ใช้:** `service_points`, `business_hours_rules`, `service_point_purposes`, `service_point_documents`

**Response:**

```json
{
  "servicePoint": {
    "id": 1,
    "name": "Kiosk ล็อบบี้ ชั้น 1 (ซ้าย)",
    "nameEn": "Lobby Kiosk 1F (Left)",
    "type": "kiosk",
    "status": "online",
    "serialNumber": "KIOSK-C1-L001",
    "location": "ชั้น 1 ล็อบบี้ ศูนย์ราชการ อาคาร C",
    "wifi": {
      "ssid": "MOTS-Guest",
      "passwordPattern": "MOTSGuest{YYYY}",
      "validityMode": "end-of-day",
      "fixedDurationMin": null
    },
    "slip": {
      "headerText": "กระทรวงการท่องเที่ยวและกีฬา",
      "footerText": "ขอบคุณที่มาเยือน — กรุณาคืนบัตรผู้เยี่ยมก่อนออก"
    },
    "supportedDocuments": [
      { "id": 1, "code": "thai-id-card", "name": "บัตรประชาชน", "nameEn": "Thai National ID Card" },
      { "id": 2, "code": "passport", "name": "หนังสือเดินทาง", "nameEn": "Passport" },
      { "id": 5, "code": "thai-id-app", "name": "แอป ThaiID", "nameEn": "ThaiID App" }
    ],
    "supportedPurposes": [1, 2, 3, 4, 5, 6, 7]
  },
  "businessHours": {
    "isOpen": true,
    "allowWalkin": true,
    "allowKiosk": true,
    "todaySchedule": {
      "openTime": "08:00",
      "closeTime": "17:00"
    },
    "message": null
  },
  "serverTime": "2026-03-15T08:30:00+07:00"
}
```

---

## 2. PDPA_CONSENT — ข้อความ PDPA

### `GET /kiosk/pdpa`

**Tables ที่ใช้:** `pdpa_consent_configs`, `pdpa_consent_versions`

**Response:**

```json
{
  "version": 3,
  "titleTh": "นโยบายคุ้มครองข้อมูลส่วนบุคคล",
  "titleEn": "Personal Data Protection Policy",
  "bodyTh": "กระทรวงการท่องเที่ยวและกีฬา มีความจำเป็นต้องเก็บรวบรวม...",
  "bodyEn": "The Ministry of Tourism and Sports needs to collect...",
  "retentionDays": 90,
  "requireScrollToBottom": true,
  "showDetailedPurpose": true,
  "effectiveDate": "2026-01-15"
}
```

### `POST /kiosk/pdpa/consent`

บันทึกว่าผู้เยี่ยมกดยินยอมแล้ว (อาจบันทึกก่อนหรือหลัง verify ก็ได้ ขึ้นกับ design)

**Tables ที่ใช้:** `pdpa_consent_logs`

**Request:**

```json
{
  "configVersion": 3,
  "consentChannel": "kiosk",
  "servicePointId": 1,
  "visitorIdNumber": "1234567890123",
  "consentGiven": true,
  "ipAddress": "192.168.1.100"
}
```

**Response:**

```json
{
  "consentId": 42,
  "recordedAt": "2026-03-15T09:01:00+07:00"
}
```

---

## 3. SELECT_ID_METHOD — วิธียืนยันตัวตน

### `GET /kiosk/id-methods`

ดึงจาก config ตอน boot ได้เลย (cached จาก `/kiosk/config`) แต่ถ้าแยก API:

**Tables ที่ใช้:** `identity_document_types`, `service_point_documents`, `visit_purpose_channel_documents`

**Response:**

```json
{
  "methods": [
    {
      "id": 1,
      "code": "thai-id-card",
      "name": "บัตรประชาชน",
      "nameEn": "Thai National ID Card",
      "icon": "credit-card",
      "deviceRequired": "id-reader",
      "description": "เสียบบัตรประชาชนที่ช่องอ่านบัตร",
      "descriptionEn": "Insert your Thai ID card into the reader"
    },
    {
      "id": 2,
      "code": "passport",
      "name": "หนังสือเดินทาง",
      "nameEn": "Passport",
      "icon": "book-open",
      "deviceRequired": "passport-reader",
      "description": "วางหนังสือเดินทางบนเครื่องสแกน",
      "descriptionEn": "Place your passport on the scanner"
    },
    {
      "id": 5,
      "code": "thai-id-app",
      "name": "แอป ThaiID (Digital ID)",
      "nameEn": "ThaiID App",
      "icon": "smartphone",
      "deviceRequired": "qr-reader",
      "description": "สแกน QR จากแอป ThaiID",
      "descriptionEn": "Scan QR from ThaiID app"
    }
  ]
}
```

---

## 4. ID_VERIFICATION — ยืนยันตัวตน + เช็ค Blocklist

เมื่อเครื่องอ่านบัตร/Passport/ThaiID อ่านข้อมูลได้แล้ว → ส่งข้อมูลไป backend เพื่อตรวจ blocklist + บันทึกผู้เยี่ยม

### `POST /kiosk/verify-identity`

**Tables ที่ใช้:** `visitors` (upsert), `blocklist` (check), `visit_entries` (check existing)

**Request:**

```json
{
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "fullNameTh": "นายสมชาย ใจดี",
  "fullNameEn": "MR. SOMCHAI JAIDEE",
  "dateOfBirth": "1985-06-15",
  "address": "123 ถ.ราชดำเนิน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพ 10200",
  "issueDate": "2022-01-10",
  "expiryDate": "2031-01-09",
  "photo": "<base64_photo_from_id_card>",
  "servicePointId": 1
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
      "purposeNameEn": "Meeting / Seminar",
      "hostName": "นางสาวพิมพา เกษมศรี",
      "department": "กองการต่างประเทศ",
      "date": "2026-03-15",
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
  "message": "ท่านถูกระงับการเข้าพื้นที่ กรุณาติดต่อเจ้าหน้าที่"
}
```

---

## 5. DATA_PREVIEW

**ไม่ต้องเรียก API** — ใช้ข้อมูลจาก response ของ `POST /kiosk/verify-identity` แสดงบนหน้าจอให้ผู้เยี่ยมตรวจสอบ

---

## 6. SELECT_PURPOSE — เลือกวัตถุประสงค์

### `GET /kiosk/purposes`

**Query Parameters:**
- `servicePointId` — กรองเฉพาะวัตถุประสงค์ที่ตู้นี้รองรับ

**Tables ที่ใช้:** `visit_purposes`, `visit_purpose_department_rules` (where `show_on_kiosk = true`), `visit_purpose_channel_configs` (where `channel = 'kiosk'`), `service_point_purposes`

**Response:**

```json
{
  "purposes": [
    {
      "id": 1,
      "name": "ติดต่อราชการ",
      "nameEn": "Official Business",
      "icon": "🏛️",
      "requirePhoto": true,
      "departments": [
        {
          "departmentId": 1,
          "departmentName": "สำนักงานปลัดกระทรวง",
          "departmentNameEn": "Office of the Permanent Secretary",
          "floor": "ชั้น 3",
          "requirePersonName": true,
          "requireApproval": true,
          "offerWifi": true
        },
        {
          "departmentId": 2,
          "departmentName": "กองกลาง",
          "departmentNameEn": "General Administration Division",
          "floor": "ชั้น 2",
          "requirePersonName": true,
          "requireApproval": true,
          "offerWifi": true
        }
      ]
    },
    {
      "id": 2,
      "name": "ประชุม / สัมมนา",
      "nameEn": "Meeting / Seminar",
      "icon": "📋",
      "requirePhoto": true,
      "departments": [
        {
          "departmentId": 1,
          "departmentName": "สำนักงานปลัดกระทรวง",
          "departmentNameEn": "Office of the Permanent Secretary",
          "floor": "ชั้น 3",
          "requirePersonName": true,
          "requireApproval": true,
          "offerWifi": true
        }
      ]
    },
    {
      "id": 3,
      "name": "ส่งเอกสาร / พัสดุ",
      "nameEn": "Document / Parcel Delivery",
      "icon": "📄",
      "requirePhoto": true,
      "departments": [
        {
          "departmentId": 1,
          "departmentName": "สำนักงานปลัดกระทรวง",
          "departmentNameEn": "Office of the Permanent Secretary",
          "floor": "ชั้น 3",
          "requirePersonName": false,
          "requireApproval": false,
          "offerWifi": false
        }
      ]
    },
    {
      "id": 7,
      "name": "รับ-ส่งสินค้า",
      "nameEn": "Delivery / Pickup",
      "icon": "📦",
      "requirePhoto": false,
      "departments": [
        {
          "departmentId": 1,
          "departmentName": "สำนักงานปลัดกระทรวง",
          "departmentNameEn": "Office of the Permanent Secretary",
          "floor": "ชั้น 3",
          "requirePersonName": false,
          "requireApproval": false,
          "offerWifi": false
        }
      ]
    }
  ]
}
```

### Transition Logic หลังเลือกวัตถุประสงค์ + แผนก

เมื่อผู้เยี่ยม walk-in เลือก purpose + department แล้ว ระบบจะ fetch `visit_purpose_department_rules` เพื่อตรวจสอบ:

1. **`requireApproval`**:
   - ถ้า `true` → transition ไป **PENDING_APPROVAL** (ไม่ไป FACE_CAPTURE โดยตรง) — ระบบสร้าง appointment (status=pending) แล้วรอการอนุมัติ
   - ถ้า `false` → transition ไป **FACE_CAPTURE** / **ID_VERIFICATION** ตามปกติ (auto-approve, check-in ได้เลย)

2. **`requirePersonName`**:
   - ถ้า `true` → แสดงหน้าเลือก host staff (ผู้ที่จะไปพบ) ก่อน transition ถัดไป
   - ถ้า `false` → ข้ามขั้นตอนเลือก host staff

---

## 6b. PENDING_APPROVAL — รอการอนุมัติ (Walk-in ที่ต้องอนุมัติ)

State นี้ใช้สำหรับ walk-in visitor ที่เลือก purpose + department ที่มี `requireApproval = true` ใน `visit_purpose_department_rules`

### Trigger

หลังจาก **SELECT_PURPOSE** เมื่อ rule.requireApproval = true:
1. ระบบสร้าง appointment ใหม่ (`POST /api/appointments` status=pending)
2. ส่ง notification ไปยังกลุ่มผู้อนุมัติ (approver group) ผ่าน LINE / Email / Web-app
3. เข้าสู่ state PENDING_APPROVAL

### `POST /api/appointments`

สร้าง appointment แบบ pending สำหรับ walk-in ที่ต้องรอการอนุมัติ

**Tables ที่ใช้:** `appointments` (INSERT), `notification_templates`, `staff` (approver group lookup)

**Request:**

```json
{
  "visitorId": 15,
  "visitPurposeId": 1,
  "departmentId": 1,
  "hostStaffId": null,
  "servicePointId": 1,
  "source": "kiosk-walkin",
  "status": "pending",
  "date": "2026-03-15",
  "notes": "Walk-in visitor — รอการอนุมัติจาก Kiosk"
}
```

**Response:**

```json
{
  "id": 99,
  "bookingCode": "eVMS-20260315-0099",
  "status": "pending",
  "createdAt": "2026-03-15T09:02:00+07:00",
  "notificationSent": true,
  "approverGroup": "สำนักงานปลัดกระทรวง — ผู้อนุมัติ",
  "estimatedWaitMinutes": 5
}
```

### `GET /api/appointments/:id` (Poll)

Kiosk poll ทุก 10 วินาทีเพื่อเช็คว่าผู้อนุมัติ approve/reject แล้วหรือยัง

**Response — ยังรออนุมัติ:**

```json
{
  "id": 99,
  "status": "pending",
  "elapsedSeconds": 30
}
```

**Response — อนุมัติแล้ว:**

```json
{
  "id": 99,
  "status": "approved",
  "approvedAt": "2026-03-15T09:04:30+07:00",
  "approvedBy": {
    "staffId": 5,
    "name": "นางสาวพิมพา เกษมศรี",
    "department": "สำนักงานปลัดกระทรวง"
  }
}
```

**Response — ปฏิเสธ:**

```json
{
  "id": 99,
  "status": "rejected",
  "rejectedAt": "2026-03-15T09:04:30+07:00",
  "rejectedBy": {
    "staffId": 5,
    "name": "นางสาวพิมพา เกษมศรี"
  },
  "rejectReason": "ไม่มีนัดหมายล่วงหน้า กรุณาติดต่อนัดหมายก่อน"
}
```

### State Transitions

| Event | Next State | เงื่อนไข |
|-------|-----------|---------|
| APPOINTMENT_APPROVED | FACE_CAPTURE | status เปลี่ยนเป็น `approved` จาก poll |
| APPOINTMENT_REJECTED | ERROR | status เปลี่ยนเป็น `rejected` จาก poll |
| GO_BACK | SELECT_PURPOSE | ผู้เยี่ยมกดย้อนกลับ |
| TIMEOUT | ERROR | รอเกิน 5 นาที (300 วินาที) ไม่มีการ approve/reject |

### Notification

เมื่อสร้าง appointment (status=pending) ระบบส่ง notification ไปยัง:
- **Approver group** ของ department ที่เลือก (ผ่าน LINE / Email / Web-app)
- ข้อความ: "ผู้เยี่ยม {visitorName} ขอเข้าพบ {departmentName} — กรุณาอนุมัติหรือปฏิเสธ"

### UI Display

แสดงข้อความ:
```
รายการของท่านถูกส่งไปยังผู้อนุมัติแล้ว กรุณารอ...
```
พร้อม spinner animation และแสดงเวลาที่รอ (elapsed time)

---

## 7. FACE_CAPTURE — อัปโหลดภาพถ่ายใบหน้า

### `POST /kiosk/face-photo`

**Tables ที่ใช้:** *(file storage)*, `visit_entries.face_photo_path`

**Request:** `multipart/form-data`

```
photo: <binary_jpeg>
visitorId: 15
servicePointId: 1
```

**Response:**

```json
{
  "photoPath": "/photos/2026/03/15/visitor-15-face.jpg",
  "faceDetected": true,
  "faceCount": 1,
  "quality": "good"
}
```

---

## 8. WIFI_OFFER — สร้าง WiFi Credentials

### `POST /kiosk/wifi/generate`

**Tables ที่ใช้:** `service_points` (wifi config), `visit_entries` (update wifi fields)

**Request:**

```json
{
  "visitorId": 15,
  "servicePointId": 1,
  "accepted": true
}
```

**Response:**

```json
{
  "ssid": "MOTS-Guest",
  "password": "MOTSGuest2026",
  "validUntil": "2026-03-15T17:00:00+07:00",
  "validityDisplay": "ถึง 17:00 น. วันนี้",
  "validityDisplayEn": "Until 17:00 today"
}
```

---

## 9. SUCCESS — สร้าง Visit Entry + ออก QR/Slip

### `POST /kiosk/checkin`

**นี่คือ API หลัก** — รวม transaction: สร้าง `visit_entry`, assign `access_group`, generate QR Code, resolve slip template

- **Walk-in**: สร้าง `visit_entry` ที่มี `appointment_id: null` (หรือ `appointment_id: <id>` ถ้าผ่าน PENDING_APPROVAL flow)
- **Appointment**: สร้าง `visit_entry` ที่มี `appointment_id: <id>` (ไม่ได้ update appointment status เป็น checked-in — appointment status คงเดิม)

### Period Validation

| entryMode | Validation | Error |
|-----------|-----------|-------|
| `single` | อนุญาตแค่ 1 entry เท่านั้น — ถ้ามี entry อยู่แล้วจะ reject | `409 ENTRY_ALREADY_ACTIVE` |
| `period` | ตรวจว่า TODAY อยู่ในช่วง dateStart-dateEnd + ไม่มี entry ของวันเดียวกันที่ status=checked-in | `409 ENTRY_ALREADY_ACTIVE` (ถ้า check-in วันนี้แล้ว) หรือ `410 APPOINTMENT_EXPIRED` (ถ้าเลยช่วง) |

### notifyOnCheckin Flag

- ถ้า `notifyOnCheckin = true` ระบบจะส่ง notification ไปยัง `appointment.createdByStaff` + `hostStaff` (ถ้ามี) ผ่านช่องทางที่ตั้งค่าไว้ (LINE/Email)
- ถ้า appointment ถูก auto-approve (จาก rule ที่ `requireApproval = false`) ค่า `approvedAt` จะถูก set ไว้แล้วตั้งแต่ตอนสร้าง

**Tables ที่ใช้:** `visit_entries` (INSERT), `appointments` (lookup), `access_groups`, `access_group_zones`, `department_access_mappings`, `visit_slip_templates`, `visit_slip_sections`, `visit_slip_fields`, `purpose_slip_mappings`

### Walk-in Check-in

**Request:**

```json
{
  "type": "walkin",
  "visitorId": 15,
  "servicePointId": 1,
  "visitPurposeId": 1,
  "departmentId": 1,
  "hostStaffId": null,
  "idMethod": "thai-id-card",
  "facePhotoPath": "/photos/2026/03/15/visitor-15-face.jpg",
  "wifiAccepted": true,
  "companionsCount": 0,
  "vehiclePlate": null,
  "pdpaConsentId": 42
}
```

### Appointment Check-in

**Request:**

```json
{
  "type": "appointment",
  "bookingCode": "eVMS-20260315-0042",
  "visitorId": 15,
  "servicePointId": 1,
  "idMethod": "thai-id-card",
  "facePhotoPath": "/photos/2026/03/15/visitor-15-face.jpg",
  "wifiAccepted": true,
  "pdpaConsentId": 42
}
```

### Response (ทั้ง walk-in และ appointment):

```json
{
  "entry": {
    "id": 42,
    "entryCode": "eVMS-20260315-0099",
    "appointmentId": null,
    "status": "checked-in",
    "checkinAt": "2026-03-15T09:05:00+07:00"
  },
  "accessControl": {
    "accessGroupId": 2,
    "accessGroupName": "ติดต่อราชการ ชั้น 2-5",
    "qrCodeData": "eVMS-OFA-20260315-0099-A2B3C4",
    "qrCodeExpiry": "2026-03-15T11:05:00+07:00",
    "allowedZones": [
      { "id": 1, "name": "ล็อบบี้ ชั้น 1", "nameEn": "Lobby 1F" },
      { "id": 6, "name": "สำนักงานปลัด", "nameEn": "OPS Office" },
      { "id": 7, "name": "ห้องประชุม ชั้น 3", "nameEn": "Meeting Room 3F" }
    ],
    "hikvisionSynced": true
  },
  "slip": {
    "slipNumber": "eVMS-25680315-0099",
    "templateId": 1,
    "data": {
      "orgName": "กระทรวงการท่องเที่ยวและกีฬา",
      "orgNameEn": "Ministry of Tourism and Sports",
      "slipTitle": "บัตรผู้เยี่ยม / Visitor Pass",
      "visitorName": "นายสมชาย ใจดี",
      "visitorNameEn": "MR. SOMCHAI JAIDEE",
      "idNumber": "1-2345-XXXX-XX-3",
      "visitPurpose": "ติดต่อราชการ",
      "visitPurposeEn": "Official Business",
      "hostName": "-",
      "department": "สำนักงานปลัดกระทรวง",
      "departmentEn": "Office of the Permanent Secretary",
      "accessZone": "ล็อบบี้ ชั้น 1, สำนักงานปลัด",
      "date": "15 มี.ค. 2569",
      "timeIn": "09:05",
      "timeOut": "-",
      "companions": 0,
      "vehiclePlate": null,
      "wifi": {
        "ssid": "MOTS-Guest",
        "password": "MOTSGuest2026",
        "validUntil": "17:00"
      },
      "qrCodeData": "eVMS-OFA-20260315-0099-A2B3C4",
      "footer": "ขอบคุณที่มาเยือน — กรุณาคืนบัตรผู้เยี่ยมก่อนออก"
    },
    "lineLinked": false,
    "askPrint": false
  },
  "notification": {
    "hostNotified": true,
    "channel": "line",
    "message": "ผู้เยี่ยม นายสมชาย ใจดี ได้ Check-in แล้ว"
  }
}
```

### `POST /kiosk/slip/print`

บันทึกว่าพิมพ์ slip แล้วหรือเลือกไม่พิมพ์ (กรณีผูก LINE)

**Request:**

```json
{
  "entryId": 42,
  "printed": true
}
```

**Response:**

```json
{
  "updated": true,
  "slipPrinted": true
}
```

---

## 10. QR_SCAN — ค้นหานัดหมายจาก QR Code

### `POST /kiosk/appointment/lookup-qr`

**Tables ที่ใช้:** `appointments`, `visitors`, `staff`, `departments`, `visit_purposes`, `floor_departments`, `floors`

**Request:**

```json
{
  "qrCodeData": "eVMS-20260315-0042",
  "servicePointId": 1
}
```

**Response — พบนัดหมาย:**

```json
{
  "found": true,
  "appointment": {
    "bookingCode": "eVMS-20260315-0042",
    "visitorName": "นายสมชาย ใจดี",
    "visitorCompany": "บริษัท ABC จำกัด",
    "hostName": "นางสาวพิมพา เกษมศรี",
    "hostDepartment": "กองการต่างประเทศ",
    "hostFloor": "ชั้น 5",
    "location": "ศูนย์ราชการ อาคาร C",
    "locationEn": "Government Center Building C",
    "date": "2026-03-15",
    "dateEnd": null,
    "timeSlot": "10:00-11:30",
    "entryMode": "single",
    "purposeName": "ประชุม / สัมมนา",
    "purposeNameEn": "Meeting / Seminar",
    "purposeIcon": "📋",
    "status": "approved",
    "wifiRequested": true,
    "lineLinked": true,
    "requirePhoto": true
  }
}
```

**Response — ไม่พบ:**

```json
{
  "found": false,
  "reason": "not-found",
  "message": "ไม่พบนัดหมายที่ตรงกับ QR Code นี้",
  "messageEn": "No appointment found for this QR code"
}
```

**Response — นัดหมายยังไม่ได้อนุมัติ:**

```json
{
  "found": true,
  "canCheckin": false,
  "reason": "pending-approval",
  "message": "นัดหมายนี้ยังรอการอนุมัติ",
  "messageEn": "This appointment is still pending approval",
  "appointment": { "..." : "..." }
}
```

---

## 11. APPOINTMENT_PREVIEW

**ไม่ต้องเรียก API** — ใช้ข้อมูลจาก response ของ `POST /kiosk/appointment/lookup-qr` แสดงบนหน้าจอ

### Period Mode Handling (entryMode = "period")

สำหรับนัดหมายแบบหลายวัน (`entryMode: "period"`):

**UI Display:**
```
นัดหมายแบบหลายวัน: {dateStart} - {dateEnd}
วันนี้: วันที่ X/Y
```

**Validation Logic (ฝั่ง Kiosk):**

| เงื่อนไข | ผลลัพธ์ | ข้อความแสดง |
|----------|---------|------------|
| TODAY < dateStart | ไม่อนุญาต check-in | "ยังไม่ถึงวันนัดหมาย" |
| TODAY > dateEnd | ไม่อนุญาต check-in | "นัดหมายหมดอายุแล้ว" |
| TODAY อยู่ในช่วง dateStart-dateEnd | อนุญาต check-in | แสดง "วันที่ X/Y" |
| มี entry วันนี้ที่ status=checked-in อยู่แล้ว | ไม่อนุญาต check-in ซ้ำ | "วันนี้ check-in แล้ว" |

> **หมายเหตุ**: ข้อมูล `dateEnd` และ `entryMode` ได้จาก response ของ `POST /kiosk/appointment/lookup-qr` — Kiosk ตรวจสอบ logic ฝั่ง client ก่อนแสดงปุ่มยืนยัน และ backend จะ validate ซ้ำอีกครั้งตอน `POST /kiosk/checkin`

---

## 12. APPOINTMENT_VERIFY_ID — ยืนยันตัวตนกับนัดหมาย

### `POST /kiosk/appointment/verify`

เช่นเดียวกับ `POST /kiosk/verify-identity` แต่เพิ่มการตรวจสอบว่าข้อมูลตรงกับนัดหมายหรือไม่

**Tables ที่ใช้:** `visitors`, `appointments`, `blocklist`

**Request:**

```json
{
  "bookingCode": "eVMS-20260315-0042",
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "fullNameTh": "นายสมชาย ใจดี",
  "fullNameEn": "MR. SOMCHAI JAIDEE",
  "dateOfBirth": "1985-06-15",
  "photo": "<base64>",
  "servicePointId": 1
}
```

**Response — ตรงกัน:**

```json
{
  "status": "matched",
  "visitorId": 15,
  "isBlocked": false,
  "matchResult": {
    "nameMatch": true,
    "idMatch": true,
    "confidence": 1.0
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
  "message": "ข้อมูลบัตรไม่ตรงกับผู้จองนัดหมาย",
  "messageEn": "ID data does not match the appointment holder"
}
```

---

## 13. Appointment No-QR Path — ค้นหานัดหมายจากบัตรประชาชน

กรณีผู้เยี่ยมไม่มี QR Code → ใช้บัตร ปชช. ค้นหานัดหมาย

### `POST /kiosk/appointment/lookup-id`

**Tables ที่ใช้:** `appointments`, `visitors`

**Request:**

```json
{
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "servicePointId": 1,
  "date": "2026-03-15"
}
```

**Response:**

```json
{
  "found": true,
  "appointments": [
    {
      "bookingCode": "eVMS-20260315-0042",
      "purposeName": "ประชุม / สัมมนา",
      "purposeNameEn": "Meeting / Seminar",
      "purposeIcon": "📋",
      "hostName": "นางสาวพิมพา เกษมศรี",
      "hostDepartment": "กองการต่างประเทศ",
      "hostFloor": "ชั้น 5",
      "timeSlot": "10:00-11:30",
      "status": "approved",
      "wifiRequested": true,
      "lineLinked": true
    }
  ]
}
```

---

## ERROR — รายงาน Error (Optional)

### `POST /kiosk/error-log`

**Request:**

```json
{
  "servicePointId": 1,
  "errorType": "hardware",
  "device": "id-reader",
  "stateAtError": "ID_VERIFICATION",
  "message": "Card reader timeout after 60s",
  "visitorId": 15,
  "timestamp": "2026-03-15T09:10:00+07:00"
}
```

**Response:**

```json
{
  "logged": true,
  "errorId": "ERR-20260315-0001"
}
```

---

## Flow Diagram — API ตาม State

```
┌──────────────────────────────────────────────────────────────────────┐
│                         WALK-IN FLOW                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WELCOME ──────────── GET /kiosk/config                              │
│    │                                                                 │
│    ▼                                                                 │
│  PDPA_CONSENT ─────── GET /kiosk/pdpa                                │
│    │                  POST /kiosk/pdpa/consent                       │
│    ▼                                                                 │
│  SELECT_ID_METHOD ─── GET /kiosk/id-methods (or cached)              │
│    │                                                                 │
│    ▼                                                                 │
│  ID_VERIFICATION ──── POST /kiosk/verify-identity                    │
│    │                  ✓ blocklist check                               │
│    ▼                  ✓ upsert visitor                                │
│  DATA_PREVIEW ─────── (no API — display verified data)               │
│    │                                                                 │
│    ▼                                                                 │
│  SELECT_PURPOSE ───── GET /kiosk/purposes                            │
│    │                                                                 │
│    ├─ [requireApproval = true] ──────────────────┐                   │
│    │                                             ▼                   │
│    │                        PENDING_APPROVAL                         │
│    │                          POST /api/appointments (pending)       │
│    │                          GET /api/appointments/:id (poll 10s)   │
│    │                          │                                      │
│    │                          ├─ [approved] ──┐                      │
│    │                          │               ▼                      │
│    │                          │         FACE_CAPTURE                 │
│    │                          ├─ [rejected] → ERROR                  │
│    │                          └─ [timeout 5m] → ERROR                │
│    │                                                                 │
│    └─ [requireApproval = false] ─────────────────┐                   │
│                                                  ▼                   │
│  FACE_CAPTURE ─────── POST /kiosk/face-photo                         │
│    │                                                                 │
│    ▼                                                                 │
│  WIFI_OFFER ──────── POST /kiosk/wifi/generate (if accepted)         │
│    │                                                                 │
│    ▼                                                                 │
│  SUCCESS ──────────── POST /kiosk/checkin                             │
│                       POST /kiosk/slip/print                         │
│                       → visit_entry created                          │
│                       → QR code generated                            │
│                       → Hikvision synced                             │
│                       → slip printed                                 │
│                       → host notified                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                       APPOINTMENT FLOW                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WELCOME ──────────── GET /kiosk/config                              │
│    │                                                                 │
│    ▼                                                                 │
│  PDPA_CONSENT ─────── GET /kiosk/pdpa                                │
│    │                  POST /kiosk/pdpa/consent                       │
│    ▼                                                                 │
│  QR_SCAN ──────────── POST /kiosk/appointment/lookup-qr              │
│    │                                                                 │
│    ├─ (has QR) ──────────────────────────┐                           │
│    │                                     ▼                           │
│    │                   APPOINTMENT_PREVIEW (no API)                   │
│    │                                     │                           │
│    │                                     ▼                           │
│    │                   APPOINTMENT_VERIFY_ID                          │
│    │                     POST /kiosk/appointment/verify               │
│    │                                     │                           │
│    └─ (no QR) ─── SELECT_ID_METHOD       │                           │
│                     │                    │                           │
│                     ▼                    │                           │
│                   ID_VERIFICATION        │                           │
│                     POST /kiosk/verify-identity                      │
│                     │                    │                           │
│                     ▼                    │                           │
│                   POST /kiosk/appointment/lookup-id                  │
│                     │                    │                           │
│                     ▼                    │                           │
│                   APPOINTMENT_PREVIEW    │                           │
│                     │                    │                           │
│                     ▼                    ▼                           │
│                   FACE_CAPTURE ── POST /kiosk/face-photo             │
│                     │                                                │
│                     ▼                                                │
│                   WIFI_OFFER ─── POST /kiosk/wifi/generate           │
│                     │                                                │
│                     ▼                                                │
│                   SUCCESS ────── POST /kiosk/checkin                  │
│                                  POST /kiosk/slip/print              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Database Tables ↔ API Mapping

| Table | Used by API |
|-------|------------|
| `service_points` | `GET /kiosk/config` |
| `service_point_documents` | `GET /kiosk/config`, `GET /kiosk/id-methods` |
| `service_point_purposes` | `GET /kiosk/config`, `GET /kiosk/purposes` |
| `business_hours_rules` | `GET /kiosk/config` |
| `pdpa_consent_configs` | `GET /kiosk/pdpa` |
| `pdpa_consent_versions` | `GET /kiosk/pdpa` |
| `pdpa_consent_logs` | `POST /kiosk/pdpa/consent` |
| `identity_document_types` | `GET /kiosk/id-methods` |
| `visitors` | `POST /kiosk/verify-identity` (upsert) |
| `blocklist` | `POST /kiosk/verify-identity` (check) |
| `visit_purposes` | `GET /kiosk/purposes` |
| `visit_purpose_department_rules` | `GET /kiosk/purposes` |
| `visit_purpose_channel_configs` | `GET /kiosk/purposes` |
| `visit_purpose_channel_documents` | `GET /kiosk/id-methods` |
| `departments` | `GET /kiosk/purposes` |
| `floors` | `GET /kiosk/purposes` (join) |
| `floor_departments` | `GET /kiosk/purposes` (join) |
| `visit_entries` | `POST /kiosk/checkin` (INSERT), lookup APIs |
| `appointments` | `POST /kiosk/checkin` (lookup), appointment lookup APIs |
| `access_groups` | `POST /kiosk/checkin` (resolve) |
| `access_group_zones` | `POST /kiosk/checkin` (resolve) |
| `access_zones` | `POST /kiosk/checkin` (resolve) |
| `department_access_mappings` | `POST /kiosk/checkin` (resolve) |
| `visit_slip_templates` | `POST /kiosk/checkin` (resolve) |
| `visit_slip_sections` | `POST /kiosk/checkin` (resolve) |
| `visit_slip_fields` | `POST /kiosk/checkin` (resolve) |
| `purpose_slip_mappings` | `POST /kiosk/checkin` (resolve) |
| `notification_templates` | `POST /kiosk/checkin` (trigger) |
| `staff` | lookup host, approvers |

---

## Error Responses (Standard)

ทุก API ใช้รูปแบบ error เหมือนกัน:

```json
{
  "error": {
    "code": "KIOSK_OFFLINE",
    "message": "ตู้ Kiosk ไม่พร้อมใช้งาน",
    "messageEn": "Kiosk is currently unavailable",
    "details": null
  }
}
```

### Error Codes

| Code | HTTP Status | คำอธิบาย |
|------|------------|----------|
| `KIOSK_OFFLINE` | 503 | ตู้ถูกปิดการใช้งาน |
| `OUTSIDE_BUSINESS_HOURS` | 403 | นอกเวลาทำการ |
| `VISITOR_BLOCKED` | 403 | ผู้เยี่ยมอยู่ใน blocklist |
| `APPOINTMENT_NOT_FOUND` | 404 | ไม่พบนัดหมาย |
| `APPOINTMENT_EXPIRED` | 410 | นัดหมายหมดอายุ |
| `APPOINTMENT_PENDING` | 409 | นัดหมายยังรออนุมัติ |
| `ENTRY_ALREADY_ACTIVE` | 409 | ผู้เยี่ยมยังมี entry ที่ checked-in อยู่ |
| `ID_MISMATCH` | 422 | ข้อมูลบัตรไม่ตรงกับนัดหมาย |
| `DEVICE_ERROR` | 502 | อุปกรณ์ฮาร์ดแวร์ขัดข้อง |
| `HIKVISION_SYNC_FAILED` | 502 | ส่งสิทธิ์ไป Hikvision ไม่สำเร็จ |
| `INVALID_QR_CODE` | 422 | QR Code ไม่ถูกต้อง |
| `FACE_NOT_DETECTED` | 422 | ตรวจไม่พบใบหน้าในภาพ |
| `UNAUTHORIZED` | 401 | Token ไม่ถูกต้อง |
| `INTERNAL_ERROR` | 500 | ข้อผิดพลาดภายใน |

---

## Sequence Diagram — Walk-in Full Flow

```
Kiosk App                Backend API                     Database                  Hikvision
   │                         │                              │                         │
   │── GET /kiosk/config ───▶│── SELECT service_points ────▶│                         │
   │◀── config + hours ──────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │── GET /kiosk/pdpa ─────▶│── SELECT pdpa_consent_* ───▶│                         │
   │◀── PDPA text ───────────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User accepts PDPA]     │                              │                         │
   │── POST /pdpa/consent ──▶│── INSERT pdpa_consent_logs ─▶│                         │
   │◀── consentId ───────────│◀── id ──────────────────────│                         │
   │                         │                              │                         │
   │ [User inserts ID card]  │                              │                         │
   │── POST /verify-identity▶│── SELECT blocklist ─────────▶│                         │
   │                         │── UPSERT visitors ──────────▶│                         │
   │◀── verifiedData ────────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User confirms data]    │                              │                         │
   │── GET /kiosk/purposes ─▶│── SELECT visit_purposes ───▶│                         │
   │                         │── JOIN dept_rules + channels▶│                         │
   │◀── purposes list ───────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User selects purpose]  │                              │                         │
   │ [Camera captures face]  │                              │                         │
   │── POST /face-photo ────▶│── STORE photo ──────────────▶│ (file storage)          │
   │◀── photoPath ───────────│◀── path ────────────────────│                         │
   │                         │                              │                         │
   │ [User accepts WiFi]     │                              │                         │
   │── POST /wifi/generate ─▶│── GENERATE credentials ─────▶│                         │
   │◀── wifi creds ──────────│◀── creds ───────────────────│                         │
   │                         │                              │                         │
   │── POST /kiosk/checkin ─▶│── INSERT visit_entries ─────▶│                         │
   │                         │── RESOLVE access_group ─────▶│                         │
   │                         │── GENERATE QR code ──────────│                         │
   │                         │── RESOLVE slip template ────▶│                         │
   │                         │── SYNC access rights ────────│────── POST /person ────▶│
   │                         │── SEND notification ─────────│     + POST /access ────▶│
   │◀── visit + QR + slip ───│◀── complete ────────────────│◀── ACK ────────────────│
   │                         │                              │                         │
   │ [Print slip]            │                              │                         │
   │── POST /slip/print ────▶│── UPDATE visit_entries ─────▶│                         │
   │◀── ok ──────────────────│◀── done ────────────────────│                         │
```

---

## Status Values

### Entry Status (visit_entries)
`checked-in`, `checked-out`, `auto-checkout`, `overstay`

### Appointment Status (appointments)
`pending`, `approved`, `rejected`, `confirmed`, `cancelled`, `expired`

> Appointment จะ **ไม่มี** status `checked-in`, `checked-out`, `overstay`, `auto-checkout` อีกต่อไป — สถานะเหล่านี้อยู่ที่ `visit_entries` เท่านั้น

---

## หมายเหตุสำหรับ Dev

1. **Caching**: `GET /kiosk/config`, `GET /kiosk/pdpa`, `GET /kiosk/purposes` สามารถ cache ฝั่ง Kiosk ได้ (refresh ทุก 5 นาที หรือเมื่อ reset)
2. **Offline Mode**: Kiosk ควรมี cached config เพื่อแสดง "offline" message ได้แม้ไม่มี internet
3. **Retry Logic**: API ที่เป็น write (POST) ควรมี idempotency key เพื่อป้องกัน duplicate — ใช้ `booking_code` เป็น key
4. **Photo Upload**: แนะนำ compress JPEG quality 80% ก่อนอัปโหลด เพื่อลด bandwidth
5. **WiFi Generation**: อาจ generate ฝั่ง Kiosk ได้ตาม pattern จาก config (ไม่ต้องเรียก API) — แต่ถ้าต้องการ central control ใช้ API
6. **Hikvision Sync**: ทำ async ฝั่ง backend — ไม่ต้องรอ response ก่อนตอบ Kiosk (eventual consistency)
7. **PDPA Consent**: บันทึกก่อน verify-identity ได้ (ใช้ idNumber จาก card read — หรือบันทึกทีหลังพร้อม checkin)
8. **Blocklist Check**: ตรวจหลัง DATA_PREVIEW (ก่อน CONFIRM_DATA) — ถ้าพบ permanent block แสดง error ไม่ให้ดำเนินการต่อ

---

## Blocklist Check (เพิ่มเติม — State: DATA_PREVIEW)

### เมื่อไหร่ที่ตรวจ?
ตรวจที่ **DATA_PREVIEW** เมื่อผู้ใช้กดยืนยันข้อมูล (CONFIRM_DATA) → ระบบตรวจ Blocklist ก่อน
- ถ้าไม่พบ → ดำเนินการต่อ (FACE_CAPTURE)
- ถ้าพบ permanent → แสดงข้อความ error "ไม่สามารถเข้าพื้นที่ได้" + ปิดปุ่มยืนยัน
- ถ้าพบ temporary + หมดอายุ → อนุญาตต่อได้

### API: POST `/api/blocklist/check`

```json
// Request
{
  "first_name": "สุรศักดิ์",
  "last_name": "อันตราย",
  "channel": "kiosk",
  "checked_by": null
}

// Response (blocked)
{
  "is_blocked": true,
  "entry": {
    "id": 1,
    "type": "permanent",
    "reason": "พฤติกรรมไม่เหมาะสม",
    "expiry_date": null
  }
}
```

### Logic:
- ตรวจชื่อ-นามสกุล partial match (case-insensitive) ทั้งไทยและอังกฤษ
- **ไม่ตรวจเลขบัตร** — ระบบเก็บเฉพาะ mask
- Kiosk แยกชื่อจาก `fullNameTh` โดยตัดคำนำหน้า (นาย/นาง/นางสาว/Mr./Ms.) แล้ว split
- Log ทุกครั้งใน `blocklist_check_logs`

### Visitor Name Fields (updated)
| Column | Type | Description |
|--------|------|-------------|
| first_name | VARCHAR(100) | ชื่อ (ไม่รวมคำนำหน้า) |
| last_name | VARCHAR(100) | นามสกุล |
| first_name_en | VARCHAR(100) | First Name (English) |
| last_name_en | VARCHAR(100) | Last Name (English) |
| name | VARCHAR(200) | ชื่อเต็ม (computed, backward compat) |
