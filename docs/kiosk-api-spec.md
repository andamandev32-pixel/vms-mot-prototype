# Kiosk API Specification

> RESTful API สำหรับ Kiosk Flutter App — แต่ละ State ใช้ API อะไร, Request/Response, และตั้งค่าจาก Web App ที่ไหน
> อ้างอิงจาก: `lib/kiosk/kiosk-api-data.ts`, `lib/kiosk/kiosk-state-machine.ts`, `lib/kiosk/kiosk-config-resolver.ts`

---

## Base URL

```
https://api.evms.mots.go.th/v1
```

## Authentication

ทุก request จาก Kiosk ต้องส่ง Header:

```
Authorization: Bearer <kiosk_device_token>
X-Kiosk-Serial: KIOSK-C1-L001
X-Kiosk-Id: 1
```

Token ได้จาก Device Registration ครั้งแรก (ผูกกับ `service_points.serial_number`)

---

## Walk-in Flow (ลำดับใหม่)

```
WELCOME → PDPA → SELECT_PURPOSE+DEPT → SELECT_ID → VERIFY_ID → DATA_PREVIEW → FACE+WIFI → SUCCESS
   1        2            3                  4           5            6              7          8
```

**Walk-in ที่ยืนยันแล้ว** (ข้ามขั้นตอน ID):

```
WELCOME → PDPA → SELECT_PURPOSE+DEPT → FACE+WIFI → SUCCESS
   1        2            3                  4          5
```

## Appointment Flow

```
WELCOME → PDPA → QR_SCAN → APPOINTMENT_PREVIEW → VERIFY_ID → FACE → WIFI → SUCCESS
   1        2       3              4                  5         6      7       8
```

---

## สรุป API ตาม State

| # | State | Method | Endpoint | สรุป | Web Settings |
|---|-------|--------|----------|------|--------------|
| 1 | WELCOME | `GET` | `/api/kiosk/{spId}/config` | โหลด config ตู้ + สถานะ + เวลาทำการ | Service Points, Business Hours |
| 2 | PDPA_CONSENT | `GET` | `/api/kiosk/pdpa/latest` | ดึงข้อความ PDPA ล่าสุด | PDPA Consent |
| 2b | PDPA_CONSENT | `POST` | `/api/kiosk/pdpa/consent` | บันทึกการยินยอม | |
| 3 | SELECT_PURPOSE | `GET` | `/api/kiosk/{spId}/purposes` | ดึงวัตถุประสงค์ + แผนก | Visit Purposes, Locations |
| 3b | SELECT_PURPOSE | `GET` | `/api/kiosk/visitor/{id}/check-verified` | ตรวจว่ายืนยันแล้วหรือไม่ | |
| 4 | SELECT_ID_METHOD | `GET` | `/api/kiosk/{spId}/id-methods` | ดึงเอกสารที่ตู้รองรับ | Document Types, Service Points |
| 5 | ID_VERIFICATION | `POST` | `/api/kiosk/identity/verify` | ยืนยันตัวตน + ตรวจ Blocklist | Service Points, Blocklist |
| 6 | DATA_PREVIEW | — | *(ใช้ข้อมูลจาก state)* | | |
| 7 | FACE_CAPTURE | `POST` | `/api/kiosk/identity/photo` | อัปโหลดภาพใบหน้า | Visit Purposes, Service Points |
| 8 | SUCCESS | `POST` | `/api/kiosk/checkin` | สร้าง visit + QR/Slip + แจ้งเตือน | Visit Slips, Notifications, Access Zones |
| 8b | SUCCESS | `POST` | `/api/kiosk/slip/print` | บันทึกสถานะพิมพ์ slip | |
| A1 | QR_SCAN | `POST` | `/api/kiosk/appointment/lookup` | ค้นหานัดหมายจาก QR | Service Points |
| A2 | APPOINTMENT_PREVIEW | — | *(ใช้ข้อมูลจาก lookup)* | | |
| A3 | APPOINTMENT_VERIFY_ID | `POST` | `/api/kiosk/appointment/verify-identity` | ยืนยันตัวตนกับนัดหมาย | Service Points, Blocklist |
| — | WIFI_OFFER | `POST` | `/api/kiosk/wifi/generate` | สร้าง WiFi credentials | Service Points |
| — | ERROR | `POST` | `/api/kiosk/error-log` | รายงาน error (optional) | |

---

## 1. WELCOME — โหลด Config ตู้

### `GET /api/kiosk/{servicePointId}/config`

โหลด config ตู้ Kiosk ทั้งหมด — เรียก 1 ครั้งตอน boot หรือ reset กลับหน้าแรก

**Response:**

```json
{
  "servicePoint": {
    "id": 1,
    "name": "Kiosk ล็อบบี้ ชั้น 1 (ซ้าย)",
    "type": "kiosk",
    "status": "online",
    "serialNumber": "KIOSK-C1-L001",
    "location": "ชั้น 1 อาคาร A (ฝั่งซ้าย)",
    "adminPin": "10210"
  },
  "supportedDocuments": [
    { "id": 1, "code": "thai-id-card", "name": "บัตรประชาชน", "nameEn": "Thai National ID Card", "icon": "🪪" },
    { "id": 2, "code": "passport", "name": "หนังสือเดินทาง", "nameEn": "Passport", "icon": "📘" },
    { "id": 5, "code": "thai-id-app", "name": "แอป ThaiID", "nameEn": "ThaiID App", "icon": "📱" }
  ],
  "supportedPurposeIds": [1, 2, 3, 4, 5, 7],
  "wifi": { "ssid": "MOTS-Guest", "passwordPattern": "mots{year}" },
  "timeouts": {
    "pdpaConsent": 120, "selectIdMethod": 60, "idVerification": 60,
    "dataPreview": 120, "selectPurpose": 60, "faceCapture": 60,
    "qrScan": 60, "appointmentPreview": 120, "successRedirect": 10
  },
  "pdpa": { "requireScroll": true, "retentionDays": 90 },
  "slip": { "headerText": "กระทรวงการท่องเที่ยวและกีฬา", "footerText": "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร" },
  "idMaskingPattern": "show-first1-last5",
  "businessHours": {
    "followBusinessHours": true,
    "isOpen": true,
    "allowWalkin": true,
    "allowKiosk": true,
    "currentRule": "เวลาทำการปกติ (จ-ศ)",
    "todaySchedule": { "openTime": "08:30", "closeTime": "16:30" }
  },
  "serverTime": "2026-03-26T09:00:00+07:00"
}
```

**DB Tables:** `service_points`, `business_hours_rules`, `service_point_purposes`, `service_point_documents`

**Web Settings ที่เกี่ยวข้อง:**

| Settings Page | Fields | การใช้งาน |
|---|---|---|
| **Service Points** (`/web/settings/service-points`) | `status`, `type`, `location`, `follow_business_hours` | กำหนดสถานะตู้, ตำแหน่ง, เปิดตามเวลาทำการ |
| **Business Hours** (`/web/settings/business-hours`) | `days_of_week`, `open_time`, `close_time`, `allow_kiosk` | ตรวจสอบเวลาเปิด-ปิด + อนุญาต Kiosk |

**Dev Notes:**
- เรียก API ตอน boot + refresh ทุก 5 นาที (health check)
- ถ้า `status ≠ online` → แสดงหน้า "ปิดปรับปรุง"
- ถ้า `isOpen=false` → แสดงหน้า "นอกเวลาทำการ"
- Flutter: สร้าง `KioskConfigRepository` เก็บ config ไว้ใน memory

---

## 2. PDPA_CONSENT — ยินยอม PDPA

### `GET /api/kiosk/pdpa/latest`

ดึงข้อความ PDPA เวอร์ชันล่าสุด

**Response:**

```json
{
  "version": 3,
  "titleTh": "นโยบายคุ้มครองข้อมูลส่วนบุคคล",
  "titleEn": "Personal Data Protection Policy",
  "bodyTh": "กระทรวงการท่องเที่ยวและกีฬา ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน...",
  "bodyEn": "The Ministry of Tourism and Sports values the protection of your personal data...",
  "retentionDays": 90,
  "requireScrollToBottom": true,
  "effectiveDate": "2026-01-15"
}
```

### `POST /api/kiosk/pdpa/consent`

บันทึกการยินยอม PDPA (หลังกดยอมรับ)

**Request:**

```json
{
  "configVersion": 3,
  "consentChannel": "kiosk",
  "servicePointId": 1,
  "consentGiven": true,
  "locale": "th"
}
```

**Response:**

```json
{
  "consentId": 42,
  "recordedAt": "2026-03-26T09:01:00+07:00"
}
```

**DB Tables:** `pdpa_consent_configs`, `pdpa_consent_versions`, `pdpa_consent_logs`

**Web Settings ที่เกี่ยวข้อง:**

| Settings Page | Fields | การใช้งาน |
|---|---|---|
| **PDPA Consent** (`/web/settings/pdpa-consent`) | `body_th`, `body_en`, `retention_days` | ข้อความ PDPA + จำนวนวันเก็บข้อมูล |
| **Service Points** (`/web/settings/service-points`) | `pdpa_config.require_scroll`, `pdpa_config.retention_days` | Override ค่า PDPA ต่อ Kiosk |

**Dev Notes:**
- ★ Flow ใหม่: PDPA → **SELECT_PURPOSE** (ไม่ใช่ ID verification แล้ว)
- บันทึกหลังกดยอมรับ — ยังไม่มี `visitorIdNumber` (ยังไม่ยืนยันตัวตน)
- `consentId` ต้องเก็บไว้ใน state เพื่อใช้ตอน checkin
- ถ้า `requireScrollToBottom=true` → ปุ่มยอมรับ disable จนกว่าจะ scroll จนสุด

---

## 3. SELECT_PURPOSE — เลือกวัตถุประสงค์ + แผนก

> ★ **Flow ใหม่**: ขั้นตอนนี้มาก่อน ID verification

### `GET /api/kiosk/{servicePointId}/purposes`

ดึงวัตถุประสงค์ + แผนกที่แสดงบน Kiosk

**Response:**

```json
{
  "purposes": [
    {
      "id": 1,
      "name": "ติดต่อราชการ",
      "nameEn": "Official Business",
      "icon": "🏛️",
      "order": 1,
      "wifiEnabled": true,
      "requirePhoto": true,
      "departments": [
        {
          "departmentId": 1,
          "name": "สำนักงานปลัดกระทรวง",
          "nameEn": "Office of the Permanent Secretary",
          "floor": "ชั้น 3",
          "building": "อาคาร A",
          "requireApproval": true,
          "approverGroupId": 2,
          "offerWifi": true
        },
        {
          "departmentId": 4,
          "name": "กองกิจการท่องเที่ยว",
          "nameEn": "Tourism Affairs Division",
          "floor": "ชั้น 4",
          "building": "อาคาร A",
          "requireApproval": false,
          "offerWifi": true
        }
      ]
    },
    {
      "id": 3,
      "name": "ส่งเอกสาร / พัสดุ",
      "nameEn": "Document Delivery",
      "icon": "📄",
      "order": 3,
      "wifiEnabled": false,
      "requirePhoto": true,
      "departments": [
        { "departmentId": 2, "name": "กองกลาง", "floor": "ชั้น 2", "requireApproval": false, "offerWifi": false }
      ]
    }
  ]
}
```

### `GET /api/kiosk/visitor/{idNumber}/check-verified`

ตรวจสอบว่า walk-in เคยยืนยันตัวตนแล้วหรือไม่ (สำหรับ returning visitor)

**Response (verified):**

```json
{
  "verified": true,
  "visitorId": 15,
  "lastVerifiedAt": "2026-03-26T08:30:00+07:00",
  "lastIdMethod": "thai-id-card",
  "fullNameTh": "นายสมชาย ใจดี",
  "fullNameEn": "MR. SOMCHAI JAIDEE",
  "photoPath": "/photos/visitor-15-face.jpg"
}
```

**Response (not verified):**

```json
{ "verified": false, "message": "ไม่พบข้อมูลยืนยันตัวตน" }
```

**DB Tables:** `visit_purposes`, `visit_purpose_department_rules`, `visit_purpose_channel_configs`, `service_point_purposes`, `departments`, `floors`, `visitors`, `visit_records`

**Web Settings ที่เกี่ยวข้อง:**

| Settings Page | Fields | การใช้งาน |
|---|---|---|
| **Visit Purposes** (`/web/settings/visit-purposes`) | `name`, `icon`, `order`, `show_on_kiosk`, `offer_wifi`, `require_approval`, `require_photo` | กำหนดวัตถุประสงค์ + เงื่อนไขแต่ละแผนก |
| **Service Points** (`/web/settings/service-points`) | `allowed_purpose_ids` | กรองวัตถุประสงค์เฉพาะที่ตู้นี้รองรับ |
| **Locations** (`/web/settings/locations`) | `departments.name`, `departments.floor`, `departments.building` | ข้อมูลแผนก/ชั้น/อาคาร |
| **Approver Groups** (`/web/settings/approver-groups`) | `approver_groups.id`, `members` | ส่งแจ้งกลุ่มผู้อนุมัติหลัง checkin |

**Dev Notes:**
- กรองเฉพาะ `show_on_kiosk = true` + `allowed_purpose_ids`
- ถ้า dept เดียว → auto-select ไม่ต้องแสดงหน้าเลือกแผนก
- เก็บ `purposeId` + `departmentId` ใน state → ใช้ตอน checkin
- ถ้า `identityVerified=true` → ข้ามไป FACE_CAPTURE (ไม่ผ่าน ID verification)

---

## 4. SELECT_ID_METHOD — เลือกวิธียืนยันตัวตน

> ข้ามขั้นตอนนี้ทั้งหมดถ้า `state.identityVerified = true`

### `GET /api/kiosk/{servicePointId}/id-methods`

**Response:**

```json
{
  "methods": [
    { "id": 1, "code": "thai-id-card", "name": "บัตรประชาชน", "nameEn": "Thai National ID Card", "icon": "🪪", "deviceRequired": "id-reader" },
    { "id": 2, "code": "passport", "name": "หนังสือเดินทาง", "nameEn": "Passport", "icon": "📘", "deviceRequired": "passport-reader" },
    { "id": 5, "code": "thai-id-app", "name": "แอป ThaiID", "nameEn": "ThaiID App", "icon": "📱", "deviceRequired": "qr-reader" }
  ]
}
```

**Web Settings:** Document Types (`/web/settings/document-types`), Service Points (`allowed_document_ids`)

**Dev Notes:**
- ใช้ข้อมูลจาก `/kiosk/config` ได้ (cached) — ไม่ต้องเรียกซ้ำ
- `GO_BACK` → กลับไป **SELECT_PURPOSE** (ไม่ใช่ PDPA แล้ว)

---

## 5. ID_VERIFICATION — ยืนยันตัวตน

> ข้ามถ้า `identityVerified = true`

### `POST /api/kiosk/identity/verify`

ยืนยันตัวตน + ตรวจ Blocklist + Upsert visitor

**Request:**

```json
{
  "servicePointId": 1,
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "fullNameTh": "นายสมชาย ใจดี",
  "fullNameEn": "MR. SOMCHAI JAIDEE",
  "dateOfBirth": "2528-06-15",
  "address": "123 ถ.ราชดำเนิน เขตพระนคร กรุงเทพฯ 10200",
  "issueDate": "2565-01-15",
  "expiryDate": "2574-06-14",
  "photo": "<base64_from_card>"
}
```

**Response (success):**

```json
{
  "status": "ok",
  "visitorId": 15,
  "isNewVisitor": false,
  "isBlocked": false,
  "previousVisitCount": 3,
  "lastVisitDate": "2026-03-20",
  "existingAppointments": [],
  "maskedIdNumber": "1-xxxx-xxxxx-90-3",
  "verifiedData": {
    "fullNameTh": "นายสมชาย ใจดี",
    "fullNameEn": "MR. SOMCHAI JAIDEE",
    "idNumber": "1-xxxx-xxxxx-90-3",
    "dateOfBirth": "15 มิ.ย. 2528"
  }
}
```

**Response (blocked):**

```json
{
  "status": "blocked",
  "isBlocked": true,
  "blockReason": "ประพฤติไม่เหมาะสม",
  "blockedAt": "2026-01-10T00:00:00+07:00",
  "message": "ท่านถูกระงับการเข้าพื้นที่ กรุณาติดต่อเจ้าหน้าที่"
}
```

**DB Tables:** `visitors`, `blocklist`, `visit_records`

**Web Settings:**

| Settings Page | Fields | การใช้งาน |
|---|---|---|
| **Service Points** | `id_masking_pattern` | mask เลขบัตร: show-first1-last5 |
| **Blocklist** (`/web/blocklist`) | `id_number`, `full_name`, `reason` | ตรวจ Blocklist ทั้ง idNumber + ชื่อ |

**Dev Notes:**
- Upsert visitor — ถ้ามีอยู่แล้วอัปเดต, ถ้าใหม่สร้าง record
- ตรวจ Blocklist ก่อน — ถ้า blocked → ERROR state
- Hardware: SmartCardReader / PassportReader / QR Scanner (ThaiID)
- Flutter plugin: `smart_card_reader` / `passport_reader` / `flutter_barcode_scanner`

---

## 6. DATA_PREVIEW — ตรวจสอบข้อมูล

**ไม่ต้องเรียก API** — ใช้ข้อมูลจาก verify-identity response ที่อยู่ใน state

**Dev Notes:**
- `CONFIRM_DATA` → ไปหน้า **FACE_CAPTURE** (flow ใหม่: ไม่ผ่าน SELECT_PURPOSE อีกแล้ว)
- `GO_BACK` → กลับ ID_VERIFICATION
- แสดง ID number แบบ masked ตาม `idMaskingPattern`

---

## 7. FACE_CAPTURE — ถ่ายภาพใบหน้า + WiFi

### `POST /api/kiosk/identity/photo`

**Content-Type:** `multipart/form-data`

**Request:**

```json
{
  "photo": "<binary_jpeg>",
  "visitorId": 15,
  "servicePointId": 1,
  "purposeId": 1
}
```

**Response:**

```json
{
  "photoPath": "/photos/2026/03/26/visitor-15-face.jpg",
  "faceDetected": true,
  "faceCount": 1,
  "quality": "good",
  "faceMatchScore": 0.92
}
```

**Web Settings:**

| Settings Page | Fields | การใช้งาน |
|---|---|---|
| **Visit Purposes** | `require_photo`, `offer_wifi` | ตรวจว่าต้องถ่ายรูป + แสดง WiFi offer |
| **Service Points** | `wifi_config.ssid`, `wifi_config.password_pattern`, `wifi_config.validity_mode` | WiFi SSID, password pattern, ระยะเวลา |

**Dev Notes:**
- Compress JPEG 80% ก่อนอัปโหลด
- ถ้า `requirePhoto = false` → ข้ามถ่ายภาพได้
- WiFi ถามในหน้าเดียวกัน — ถ้า `wifiEnabled = false` → ไม่แสดง
- WiFi password: ใช้ pattern เช่น `mots{year}` → `mots2026`
- Hardware: USB Camera — `camera` / `google_mlkit_face_detection`
- `GO_BACK` → DATA_PREVIEW (ถ้า `identityVerified=true` → SELECT_PURPOSE)

---

## 8. SUCCESS — Checkin + Slip + Notifications

### `POST /api/kiosk/checkin`

> ★ **API หลัก** — รวม transaction ทั้งหมดในครั้งเดียว

**Request:**

```json
{
  "type": "walkin",
  "visitorId": 15,
  "servicePointId": 1,
  "visitPurposeId": 1,
  "departmentId": 4,
  "idMethod": "thai-id-card",
  "facePhotoPath": "/photos/2026/03/26/visitor-15-face.jpg",
  "wifiAccepted": true,
  "pdpaConsentId": 42
}
```

**Response:**

```json
{
  "visitRecord": {
    "id": 99,
    "bookingCode": "eVMS-25690326-0099",
    "status": "checked-in",
    "checkinTime": "2026-03-26T09:15:00+07:00",
    "expectedCheckout": "2026-03-26T16:30:00+07:00"
  },
  "accessControl": {
    "accessGroupId": 2,
    "accessGroupName": "ติดต่อราชการ ชั้น 2-5",
    "qrCodeData": "eVMS-OFA-20260326-0099-A2B3C4",
    "allowedZones": ["ล็อบบี้ ชั้น 1", "สำนักงานกองกิจการท่องเที่ยว ชั้น 4"],
    "validityMinutes": 120,
    "hikvisionSynced": true,
    "hikvisionDoorIds": ["DOOR-4F-MAIN"]
  },
  "slip": {
    "slipNumber": "eVMS-25690326-0099",
    "templateId": 1,
    "headerText": "กระทรวงการท่องเที่ยวและกีฬา",
    "footerText": "กรุณาส่งคืนบัตรเมื่อออกจากอาคาร",
    "visitorName": "นายสมชาย ใจดี",
    "idNumber": "1-xxxx-xxxxx-90-3",
    "visitPurpose": "ติดต่อราชการ",
    "department": "กองกิจการท่องเที่ยว",
    "accessZone": "ชั้น 4 อาคาร A",
    "date": "26 มี.ค. 2569",
    "timeIn": "09:15",
    "timeOut": "16:30 น.",
    "wifi": { "ssid": "MOTS-Guest", "password": "mots2026", "validUntil": "16:30 น." },
    "qrCodeData": "eVMS-OFA-20260326-0099-A2B3C4",
    "lineLinked": false,
    "askPrint": false
  },
  "notifications": [
    { "trigger": "checkin-welcome", "channel": "line", "sent": true, "recipient": "host" },
    { "trigger": "wifi-credentials", "channel": "line", "sent": false, "reason": "visitor not LINE-linked" }
  ]
}
```

### `POST /api/kiosk/slip/print`

```json
// Request
{ "visitRecordId": 99, "printed": true, "printMethod": "thermal-80mm" }

// Response
{ "updated": true, "slipPrinted": true }
```

**DB Tables:** `visit_records`, `visitors`, `visit_purposes`, `departments`, `access_groups`, `access_group_zones`, `department_access_mappings`, `visit_slip_templates`, `visit_slip_fields`, `notification_templates`, `notification_logs`

**Web Settings:**

| Settings Page | Fields | การใช้งาน |
|---|---|---|
| **Visit Slips** (`/web/settings/visit-slips`) | `size`, `fields`, `header_text`, `footer_text` | รูปแบบ slip: ขนาด, field ที่แสดง |
| **Notification Templates** (`/web/settings/notification-templates`) | `trigger`, `channel`, `body_th`, `variables` | ข้อความแจ้งเตือน: checkin-welcome, wifi-credentials |
| **Access Zones** (`/web/settings/access-zones`) | `access_groups`, `access_group_zones`, `department_access_mappings` | access group → zone → sync Hikvision door |
| **Service Points** | `slip_config.header_text`, `slip_config.footer_text` | Override slip header/footer ต่อ Kiosk |

**Dev Notes:**
- ★ Transaction สำคัญที่สุด — ต้อง handle failure gracefully
- ใช้ `booking_code` เป็น idempotency key — กัน double checkin
- Hikvision sync ทำ async ฝั่ง backend (ไม่ block kiosk)
- ถ้า `lineLinked=true` → ถามก่อนพิมพ์ slip (ส่ง LINE แทนได้)
- ถ้า `lineLinked=false` → พิมพ์ slip อัตโนมัติ
- QR code ใช้สำหรับ scan ที่ประตู (Hikvision Access Control)
- Hardware: Thermal Printer (80mm) — `esc_pos_printer`
- Redirect กลับ WELCOME หลัง `successRedirect` timeout (default 10s)

---

## A1. QR_SCAN — สแกน QR Code นัดหมาย (Appointment)

### `POST /api/kiosk/appointment/lookup`

**Request:**

```json
{
  "qrCodeData": "eVMS-20260326-0042",
  "servicePointId": 1
}
```

**Response (found):**

```json
{
  "found": true,
  "appointment": {
    "bookingCode": "eVMS-20260326-0042",
    "visitorName": "นายสมชาย ใจดี",
    "visitorCompany": "บจก. ท่องเที่ยวสยาม",
    "hostName": "นางสาวพิมพา เกษมศรี",
    "hostDepartment": "กองการต่างประเทศ",
    "hostFloor": "ชั้น 5",
    "location": "กระทรวงการท่องเที่ยวและกีฬา",
    "date": "26 มีนาคม 2569",
    "timeSlot": "10:00 — 11:30",
    "purposeName": "ประชุม / สัมมนา",
    "purposeIcon": "📋",
    "status": "approved",
    "wifiRequested": true,
    "lineLinked": true
  }
}
```

**Response (not found):**

```json
{ "found": false, "reason": "not-found", "message": "ไม่พบนัดหมายที่ตรงกับ QR Code นี้" }
```

**Dev Notes:**
- ตรวจสถานะ `approved` ก่อน check-in
- ถ้า `pending` → แสดง "รอการอนุมัติ" / ถ้า `rejected` → แสดง "นัดหมายถูกปฏิเสธ"
- Hardware: QR Scanner — `usb_serial` / `flutter_barcode_scanner`
- "ไม่มี QR" → ไปหน้า SELECT_ID_METHOD

---

## A2. APPOINTMENT_PREVIEW — ข้อมูลนัดหมาย

**ไม่ต้องเรียก API** — ใช้ข้อมูลจาก lookup response

---

## A3. APPOINTMENT_VERIFY_ID — ยืนยันตัวตน (นัดหมาย)

### `POST /api/kiosk/appointment/verify-identity`

**Request:**

```json
{
  "bookingCode": "eVMS-20260326-0042",
  "documentType": "thai-id-card",
  "idNumber": "1234567890123",
  "fullNameTh": "นายสมชาย ใจดี",
  "servicePointId": 1
}
```

**Response (matched):**

```json
{
  "status": "matched",
  "visitorId": 15,
  "isBlocked": false,
  "matchResult": { "nameMatch": true, "idMatch": true, "confidence": 1.0 }
}
```

**Response (mismatch):**

```json
{
  "status": "mismatch",
  "matchResult": { "nameMatch": false, "idMatch": false, "confidence": 0.0 },
  "message": "ข้อมูลบัตรไม่ตรงกับผู้จองนัดหมาย"
}
```

---

## WIFI_OFFER — WiFi Credentials (Appointment)

### `POST /api/kiosk/wifi/generate`

**Request:**

```json
{ "visitorId": 15, "servicePointId": 1, "visitRecordId": 42, "accepted": true }
```

**Response:**

```json
{
  "ssid": "MOTS-Guest",
  "password": "mots2026",
  "validUntil": "2026-03-26T16:30:00+07:00",
  "validityDisplay": "ถึง 16:30 น. วันนี้"
}
```

**Dev Notes:**
- ถ้า `appointment.wifiRequested=true` → pre-select "รับ WiFi" ไว้ให้ (แก้ได้)
- Password generate ตาม pattern: `mots{year}` → `mots2026`
- อาจ generate ฝั่ง Kiosk ตาม pattern จาก config — ไม่ต้องเรียก API

---

## ERROR — รายงาน Error Log

### `POST /api/kiosk/error-log`

**Request:**

```json
{
  "servicePointId": 1,
  "errorType": "hardware",
  "device": "id-reader",
  "stateAtError": "ID_VERIFICATION",
  "message": "Card reader timeout after 60s",
  "stackTrace": "..."
}
```

**Response:**

```json
{ "logged": true, "errorId": "ERR-20260326-0001" }
```

**Dev Notes:** Optional — ส่ง async ไม่ต้องรอ response, ใช้สำหรับ monitoring dashboard

---

## Web Settings → Kiosk Behavior Mapping (สรุป)

| Web Settings Page | Kiosk State ที่ใช้ | การใช้งาน |
|---|---|---|
| **Service Points** | ทุก state | สถานะตู้, timeouts, WiFi, PDPA, slip, ID masking, allowedPurposeIds, allowedDocumentIds |
| **Business Hours** | WELCOME | เวลาเปิด-ปิด, allowKiosk |
| **Visit Purposes** | SELECT_PURPOSE, FACE_CAPTURE | วัตถุประสงค์ + เงื่อนไขแผนก + requirePhoto + offerWifi |
| **PDPA Consent** | PDPA_CONSENT | ข้อความ PDPA, retentionDays, requireScroll |
| **Document Types** | SELECT_ID_METHOD | ชื่อ/ไอคอนเอกสาร |
| **Locations** | SELECT_PURPOSE | แผนก/ชั้น/อาคาร |
| **Approver Groups** | SELECT_PURPOSE → SUCCESS | กลุ่มผู้อนุมัติ |
| **Visit Slips** | SUCCESS | รูปแบบ slip |
| **Notification Templates** | SUCCESS | ข้อความแจ้งเตือน (checkin-welcome, wifi-credentials) |
| **Access Zones** | SUCCESS | access group → zone → Hikvision door |
| **Blocklist** | ID_VERIFICATION, APPOINTMENT_VERIFY_ID | ตรวจสอบผู้เยี่ยม |

---

## Timeout Config (ต่อหน้า)

| หน้า | Default (วินาที) | Config Field |
|------|:-:|---|
| PDPA Consent | 120 | `timeouts.pdpaConsent` |
| Select ID Method | 60 | `timeouts.selectIdMethod` |
| ID Verification | 60 | `timeouts.idVerification` |
| Data Preview | 120 | `timeouts.dataPreview` |
| Select Purpose | 60 | `timeouts.selectPurpose` |
| Face Capture | 60 | `timeouts.faceCapture` |
| QR Scan | 60 | `timeouts.qrScan` |
| Appointment Preview | 120 | `timeouts.appointmentPreview` |
| Success Redirect | 10 | `timeouts.successRedirect` |

---

## Source Files

| ไฟล์ | คำอธิบาย |
|------|----------|
| `lib/kiosk/kiosk-api-data.ts` | API spec data ทุก state (TypeScript) |
| `lib/kiosk/kiosk-state-machine.ts` | State machine reducer |
| `lib/kiosk/kiosk-flow-config.ts` | Step definitions (walk-in / appointment) |
| `lib/kiosk/kiosk-config-resolver.ts` | Web Settings → Kiosk Config resolver |
| `lib/kiosk/kiosk-types.ts` | Type definitions |
| `lib/kiosk/kiosk-mock-data.ts` | Mock data |
| `components/kiosk/KioskApiDocModal.tsx` | API Doc modal UI |
| `components/kiosk/StatePanel.tsx` | State panel (shows API per state) |
