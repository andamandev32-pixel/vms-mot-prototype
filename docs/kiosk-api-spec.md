# Kiosk API Specification

> ออกแบบ RESTful API สำหรับ Kiosk Flutter App — แต่ละ State ใช้ API อะไร, Request/Response เป็นอย่างไร
> อ้างอิงจาก Database Schema (`lib/database-schema.ts`) และ State Machine (`lib/kiosk/kiosk-state-machine.ts`)

---

## Base URL

```
https://evms.mots.go.th    (Prototype — Next.js App Router)
```

## Authentication — Device Token Auth

Kiosk ใช้ **Device Token Authentication** (opaque token) แทน cookie-based auth

```
Authorization: Bearer <kiosk_device_token>
X-Kiosk-Id: <service_point_id>
```

### Token Format

- Prefix: `kvms_` + 64 hex characters (256-bit random)
- ตัวอย่าง: `kvms_a1b2c3d4e5f6...`
- เก็บใน DB เป็น SHA-256 hash (ไม่เก็บ raw token)

### การลงทะเบียน Device

**วิธีที่ 1 — Auto-generate ตอนสร้างจุดบริการ (แนะนำ)**
1. Admin สร้าง Service Point ประเภท "kiosk" ที่หน้า `/web/settings/service-points`
2. ระบบจะ auto-create KioskDevice + generate token อัตโนมัติ
3. Token แสดงในการ์ดจุดบริการ พร้อมปุ่ม **Copy** ให้ copy ไปใช้งาน

**วิธีที่ 2 — สร้างทีหลังจากหน้า Settings**
1. ที่หน้า `/web/settings/service-points` กดปุ่ม **"สร้าง Device Token"** ในการ์ด Kiosk
2. ระบบจะเรียก `POST /api/kiosk-devices` → สร้าง token ให้

**ตั้งค่าที่ Kiosk**
1. ที่ Kiosk เปิด Settings (ใช้ adminPin) → ใส่ token ใน Device Token section
2. Token เก็บใน localStorage (`evms_kiosk_device_token`)
3. ทุก API call จะแนบ `Authorization: Bearer <token>` อัตโนมัติ

### Auth Flow ใน API Routes

ทุก endpoint รองรับ 4 แบบ (เช็คตามลำดับ):
1. **Staff cookie** (`evms_session`) — สำหรับ Web App / Counter
2. **Staff Bearer token** (`Authorization: Bearer <jwt>`) — สำหรับ Mobile App / API Client (ได้จาก `POST /api/auth/login`)
3. **Visitor cookie** (`evms_visitor_session`) — สำหรับ Visitor Portal
4. **Device token** (`Authorization: Bearer kvms_...`) — สำหรับ Kiosk

### Endpoints ที่ Kiosk ใช้

| Endpoint | Auth Required | หมายเหตุ |
|----------|:------------:|----------|
| `GET /api/service-points/:id` | ✅ Device Token | โหลด config จุดบริการ |
| `POST /api/pdpa/accept` | ❌ Public | ไม่ต้อง auth |
| `GET /api/search/visitors` | ✅ Device Token | ค้นหาผู้เยี่ยม |
| `POST /api/blocklist/check` | ✅ Device Token | ตรวจ blocklist |
| `GET /api/visit-purposes` | ✅ Device Token | โหลดวัตถุประสงค์ |
| `POST /api/appointments` | ✅ Device Token | สร้าง walk-in appointment |
| `GET /api/appointments/:id` | ✅ Device Token | Poll สถานะอนุมัติ |
| `GET /api/search/appointments` | ✅ Device Token | ค้นหานัดหมาย (QR) |
| `POST /api/entries` | ✅ Device Token | Check-in |
| `GET /api/visit-slips/template` | ❌ Public | ไม่ต้อง auth |

### Admin API สำหรับจัดการ Kiosk Devices

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/kiosk-devices` | รายการ devices ทั้งหมด |
| POST | `/api/kiosk-devices` | ลงทะเบียน device ใหม่ → return token ครั้งเดียว |
| GET | `/api/kiosk-devices/:id` | รายละเอียด device |
| PUT | `/api/kiosk-devices/:id` | แก้ไขข้อมูล device (name, status) |
| DELETE | `/api/kiosk-devices/:id` | เพิกถอน device (soft delete → status=revoked) |
| POST | `/api/kiosk-devices/:id/rotate-token` | สร้าง token ใหม่ (token เก่าใช้ไม่ได้ทันที) |

### Database Table: `kiosk_devices`

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | INT AUTO_INCREMENT | PK |
| name | VARCHAR(100) | ชื่ออุปกรณ์ |
| serial_number | VARCHAR(50) UNIQUE | S/N ของเครื่อง |
| service_point_id | INT FK | จุดบริการที่เชื่อมต่อ |
| token | VARCHAR(255) NULL | raw token สำหรับแสดงให้ admin copy |
| token_hash | VARCHAR(255) | SHA-256 hash ของ token (ใช้ verify) |
| token_prefix | VARCHAR(20) | prefix สำหรับ fast DB lookup |
| status | VARCHAR(20) | active / revoked / suspended |
| last_seen_at | DATETIME | เวลาใช้งานล่าสุด |
| last_ip_address | VARCHAR(45) | IP ล่าสุด |
| registered_by_id | INT FK | admin ที่ลงทะเบียน |
| expires_at | DATETIME NULL | วันหมดอายุ (null = ไม่หมดอายุ) |
| created_at | DATETIME | วันที่สร้าง |
| updated_at | DATETIME | วันที่แก้ไขล่าสุด |

### Security Notes

- Token เก็บทั้ง raw (ให้ admin ดู/copy ได้จากหน้า Settings) และ SHA-256 hash (ใช้ verify)
- Token จะถูก auto-generate ตอนสร้างจุดบริการ หรือกดปุ่ม "สร้าง Device Token"
- รองรับ revoke ทันที (เปลี่ยน status → "revoked")
- รองรับ token rotation (สร้าง token ใหม่ token เก่าใช้ไม่ได้ทันที)
- `lastSeenAt` + `lastIpAddress` update ทุกครั้งที่ใช้งาน (fire-and-forget)

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

> **หมายเหตุ:** Kiosk ไม่ได้สร้าง API routes เฉพาะ (`/api/kiosk/*`) แต่ reuse existing endpoints ของ Web App
> โดยใช้ React hooks จาก `lib/hooks/use-kiosk.ts` เป็น abstraction layer
> ทุก hook ใช้ `kioskApiFetch` / `kioskApiPost` จาก `lib/kiosk/kiosk-auth-context.tsx` ที่ inject `Authorization: Bearer <device_token>` อัตโนมัติ

| Kiosk State | Hook | Existing API Endpoint | Auth |
|------------|------|----------------------|------|
| WELCOME | `useKioskConfig(servicePointId)` | GET /api/service-points/:id | Device Token |
| SELECT_PURPOSE | `useKioskPurposes()` | GET /api/visit-purposes | Device Token |
| ID_VERIFICATION | `useSearchVisitor()` | GET /api/search/visitors | Device Token |
| ID_VERIFICATION | `useKioskBlocklistCheck()` | POST /api/blocklist/check | Device Token |
| PENDING_APPROVAL | `useCreatePendingAppointment()` | POST /api/appointments | Device Token |
| PENDING_APPROVAL | `usePollAppointmentStatus(id)` | GET /api/appointments/:id (poll 10s) | Device Token |
| SUCCESS | `useKioskCheckin()` | POST /api/entries | Device Token |
| QR_SCAN | `useAppointmentLookup()` | GET /api/search/appointments | Device Token |
| PDPA_CONSENT | `useRecordPdpaConsent()` | POST /api/pdpa/accept | Public (ไม่ต้อง auth) |

**Hooks file:** `lib/hooks/use-kiosk.ts`
**Auth context:** `lib/kiosk/kiosk-auth-context.tsx` — `KioskAuthProvider` + `kioskApiFetch` / `kioskApiPost`
**Auth library:** `lib/kiosk-auth.ts` — `generateDeviceToken`, `verifyKioskDeviceToken`, `getAuthUserOrKiosk`, `getStaffOrKiosk`
**Component ใหม่:** `components/kiosk/PendingApprovalScreen.tsx` — Polling UI สำหรับ PENDING_APPROVAL state

---

## สรุป API ตาม Kiosk State

| # | State | Method | Actual Endpoint | Hook | Auth | สถานะ |
|---|-------|--------|----------------|------|------|-------|
| 1 | WELCOME | GET | `/api/service-points/:id` | `useKioskConfig` | Device Token | ✅ Implemented |
| 2 | PDPA_CONSENT | POST | `/api/pdpa/accept` | `useRecordPdpaConsent` | Public | ✅ Implemented |
| 3 | SELECT_ID_METHOD | — | *(config จาก service-point, cached)* | — | — | ✅ Frontend-only |
| 4 | ID_VERIFICATION | GET | `/api/search/visitors?q=` | `useSearchVisitor` | Device Token | ✅ Implemented |
| 4b | ID_VERIFICATION | POST | `/api/blocklist/check` | `useKioskBlocklistCheck` | Device Token | ✅ Implemented |
| 5 | DATA_PREVIEW | — | *(ใช้ข้อมูลจาก state)* | — | — | ✅ Frontend-only |
| 6 | SELECT_PURPOSE | GET | `/api/visit-purposes` | `useKioskPurposes` | Device Token | ✅ Implemented |
| 6b | PENDING_APPROVAL | POST | `/api/appointments` | `useCreatePendingAppointment` | Device Token | ✅ Implemented |
| 6c | PENDING_APPROVAL | GET | `/api/appointments/:id` | `usePollAppointmentStatus` | Device Token | ✅ Implemented (poll 10s) |
| 7 | FACE_CAPTURE | POST | *(ยังไม่มี endpoint)* | — | — | 🔲 Planned |
| 8 | WIFI_OFFER | POST | *(ยังไม่มี endpoint)* | — | — | 🔲 Planned |
| 9 | SUCCESS | POST | `/api/entries` | `useKioskCheckin` | Device Token | ✅ Implemented |
| 9b | SUCCESS | GET | `/api/visit-slips/template` | `useVisitSlipTemplate` | Public | ✅ Implemented |
| 10 | QR_SCAN | GET | `/api/search/appointments?q=` | `useAppointmentLookup` | Device Token | ✅ Implemented |
| 11 | APPOINTMENT_PREVIEW | — | *(ใช้ข้อมูลจาก lookup)* | — | — | ✅ Frontend-only |
| 12 | APPOINTMENT_VERIFY_ID | — | *(ใช้ search/visitors + blocklist/check)* | — | Device Token | ✅ Reuse existing |
| — | ERROR | POST | *(ยังไม่มี endpoint)* | — | — | 🔲 Planned |

> **Total: 9 Implemented API endpoints** — reuse จาก Web App ผ่าน hooks ใน `lib/hooks/use-kiosk.ts`
> **Auth: 8 endpoints ใช้ Device Token** (`Authorization: Bearer kvms_...`), 2 endpoints เป็น Public (PDPA + visit-slips)
> **Planned: 3 endpoints** — face-photo, wifi, error-log (ต้องสร้างเพิ่มสำหรับ production)

---

## 1. WELCOME — โหลด Config ตู้

เรียกตอน boot หรือ reset กลับหน้าแรก — ดึงข้อมูล service_points + business_hours_rules

### `GET /api/service-points/:id`

> **Hook:** `useKioskConfig(servicePointId)` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented

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

### `POST /api/pdpa/accept`

> **Hook:** `useRecordPdpaConsent()` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented — Public endpoint (ไม่ต้อง auth)
> **หมายเหตุ:** Spec เดิมออกแบบแยก `GET /kiosk/pdpa` + `POST /kiosk/pdpa/consent`
> แต่ implementation รวมเป็น `POST /api/pdpa/accept` ตัวเดียว (ดึง config + บันทึก consent)

**Request:**

```json
{
  "visitorId": 15,
  "consentChannel": "kiosk",
  "ipAddress": "10.0.0.1",
  "deviceId": "KIOSK-C1-L001"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "consent": {
      "id": 42,
      "visitorId": 15,
      "configVersion": 3,
      "consentChannel": "kiosk",
      "expiresAt": "2027-03-15T00:00:00Z"
    },
    "message": "PDPA consent recorded",
    "alreadyConsented": false
  }
}
```

**Tables ที่ใช้:** `pdpa_consent_configs`, `pdpa_consent_logs`

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

### `POST /kiosk/pdpa/consent` *(Original Design — now merged into `POST /api/pdpa/accept`)*

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

> **Status:** ✅ Frontend-only — ใช้ config จาก `GET /api/service-points/:id` (ไม่มี dedicated endpoint)
> ID methods ถูกกำหนดจาก `service_point_documents` ที่ดึงมาพร้อมกับ config

### *ไม่ต้องเรียก API แยก* — ใช้ข้อมูลจาก service point config

ดึงจาก config ตอน boot ได้เลย (cached จาก `/api/service-points/:id`)

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

> **Implementation:** Prototype แยกเป็น 2 API calls:
> 1. `GET /api/search/visitors?q={idNumber}` — ค้นหา/upsert visitor
> 2. `POST /api/blocklist/check` — เช็ค blocklist
> (Spec เดิมออกแบบเป็น `POST /kiosk/verify-identity` ตัวเดียว)

### `GET /api/search/visitors?q={idNumber}`

> **Hook:** `useSearchVisitor()` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented

**Query Parameters:** `q` — ค้นจาก firstName, lastName, name, nameEn, idNumber, company, phone

**Response:**

```json
{
  "success": true,
  "data": {
    "visitors": [{ "id": 15, "firstName": "สมชาย", "lastName": "ใจดี", "name": "นายสมชาย ใจดี", "nameEn": "MR. SOMCHAI JAIDEE", "idNumber": "1234567890123", "company": "บริษัท ABC จำกัด", "phone": "081-234-5678" }],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

### `POST /api/blocklist/check`

> **Hook:** `useKioskBlocklistCheck()` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented

**Request:**

```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isBlocked": false,
    "blockReason": null,
    "blockType": null
  }
}
```

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

**ไม่ต้องเรียก API** — ใช้ข้อมูลจาก response ของ `GET /api/search/visitors` แสดงบนหน้าจอให้ผู้เยี่ยมตรวจสอบ

---

## 6. SELECT_PURPOSE — เลือกวัตถุประสงค์

### `GET /api/visit-purposes`

> **Hook:** `useKioskPurposes()` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented

**Query Parameters:** ไม่มี — ดึงทั้งหมด, frontend filter `showOnKiosk = true`

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

> **Status:** 🔲 Planned — ยังไม่มี API endpoint (ต้องสร้างสำหรับ production)

### `POST /api/face-photo` *(Planned)*

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

> **Status:** 🔲 Planned — ยังไม่มี API endpoint (ต้องสร้างสำหรับ production)

### `POST /api/wifi/generate` *(Planned)*

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

### `POST /api/entries`

> **Hook:** `useKioskCheckin()` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented

**นี่คือ API หลัก** — สร้าง `visit_entry` + assign access

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

### `GET /api/visit-slips/template` (Public — ไม่ต้อง auth)

ดึง Visit Slip Template (default) สำหรับ Kiosk / Counter ใช้พิมพ์บัตรผู้เยี่ยม
Kiosk และ Counter จะเรียก endpoint นี้ตอน mount เพื่อดึง template ที่ admin ตั้งค่าไว้ในหน้า `/web/settings/visit-slips`

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
            { "key": "orgLogo", "label": "โลโก้หน่วยงาน", "labelEn": "Organization Logo", "enabled": true, "editable": false },
            { "key": "orgName", "label": "กระทรวงการท่องเที่ยวและกีฬา", "labelEn": "Ministry of Tourism and Sports", "enabled": true, "editable": true }
          ]
        },
        {
          "id": "visitor",
          "name": "ข้อมูลผู้เยี่ยม",
          "nameEn": "Visitor Info",
          "enabled": true,
          "fields": [
            { "key": "visitorName", "label": "ชื่อ / Name", "labelEn": "Visitor Name", "enabled": true, "editable": true }
          ]
        }
      ]
    }
  }
}
```

> **หมายเหตุ:** Response `sections` ถูก map จาก DB schema (`sectionKey` → `id`, `isEnabled` → `enabled`, `fieldKey` → `key`) ให้ตรงกับ `ThermalSection[]` type ที่ `ThermalSlipPreview` component ใช้

**Frontend Hook:** `useVisitSlipTemplate()` จาก `lib/hooks/use-settings.ts` — cache 5 นาที

**การใช้งานใน Kiosk:**
- เรียกตอน mount → ส่ง `slipSections`, `slipLogoUrl`, `slipLogoSize` ให้ `SuccessScreen`
- `SuccessScreen` render `ThermalSlipPreview` ตาม template ที่ admin ตั้งค่า

### `POST /kiosk/slip/print` *(Planned — ยังไม่มี endpoint)*

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

### `GET /api/search/appointments?q={bookingCode}`

> **Hook:** `useAppointmentLookup()` from `lib/hooks/use-kiosk.ts`
> **Status:** ✅ Implemented
> **หมายเหตุ:** Spec เดิมออกแบบเป็น `POST /kiosk/appointment/lookup-qr` แต่ implementation ใช้ search endpoint

**Query Parameters:**
- `q` — bookingCode, visitor name, purpose name

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

**ไม่ต้องเรียก API** — ใช้ข้อมูลจาก response ของ `GET /api/search/appointments` แสดงบนหน้าจอ

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

> **หมายเหตุ**: ข้อมูล `dateEnd` และ `entryMode` ได้จาก response ของ `GET /api/search/appointments` — Kiosk ตรวจสอบ logic ฝั่ง client ก่อนแสดงปุ่มยืนยัน และ backend จะ validate ซ้ำอีกครั้งตอน `POST /api/entries`

---

## 12. APPOINTMENT_VERIFY_ID — ยืนยันตัวตนกับนัดหมาย

> **Status:** ✅ Reuse existing — ใช้ `GET /api/search/visitors` + `POST /api/blocklist/check` (เหมือน section 4)
> Spec เดิมออกแบบเป็น `POST /kiosk/appointment/verify` แต่ implementation ใช้ search + blocklist check แยก

### *ใช้ API จาก Section 4* (`GET /api/search/visitors` + `POST /api/blocklist/check`)

เช่นเดียวกับ Section 4 แต่เพิ่มการตรวจสอบว่าข้อมูลตรงกับนัดหมายหรือไม่ (ตรวจสอบฝั่ง frontend)

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

> **Status:** ✅ Reuse existing — ใช้ `GET /api/search/appointments?q={idNumber}`
> Spec เดิมออกแบบเป็น `POST /kiosk/appointment/lookup-id` แต่ implementation ใช้ search endpoint

### `GET /api/search/appointments?q={idNumber}`

> **Hook:** `useAppointmentLookup()` from `lib/hooks/use-kiosk.ts`

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

> **Status:** 🔲 Planned — ยังไม่มี API endpoint (ต้องสร้างสำหรับ production)

### `POST /api/error-log` *(Planned)*

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

## Flow Diagram — API ตาม State (Sequence Diagram)

> **หมายเหตุ:** Diagram นี้แสดง API endpoints ที่ implement จริงแล้ว (ดู Flow Diagram หลักด้านบน)

---

## Database Tables ↔ API Mapping

| Table | Used by API |
|-------|------------|
| `kiosk_devices` | Device Token auth (verify), `GET/POST /api/kiosk-devices` (admin) |
| `service_points` | `GET /api/service-points/:id` |
| `service_point_documents` | `GET /api/service-points/:id` |
| `service_point_purposes` | `GET /api/service-points/:id` |
| `business_hours_rules` | `GET /api/service-points/:id` |
| `pdpa_consent_configs` | `POST /api/pdpa/accept` |
| `pdpa_consent_logs` | `POST /api/pdpa/accept` |
| `identity_document_types` | (cached from service-point config) |
| `visitors` | `GET /api/search/visitors` |
| `blocklist` | `POST /api/blocklist/check` |
| `visit_purposes` | `GET /api/visit-purposes` |
| `visit_purpose_department_rules` | `GET /api/visit-purposes` |
| `visit_purpose_channel_configs` | `GET /api/visit-purposes` |
| `departments` | `GET /api/visit-purposes` |
| `floors` | `GET /api/visit-purposes` (join) |
| `floor_departments` | `GET /api/visit-purposes` (join) |
| `visit_entries` | `POST /api/entries` (INSERT), `GET /api/entries` |
| `appointments` | `POST /api/appointments`, `GET /api/appointments/:id` |
| `access_groups` | `POST /api/entries` (resolve) |
| `access_group_zones` | `POST /api/entries` (resolve) |
| `access_zones` | `POST /api/entries` (resolve) |
| `department_access_mappings` | `POST /api/entries` (resolve) |
| `visit_slip_templates` | `GET /api/visit-slips/template` |
| `visit_slip_sections` | `GET /api/visit-slips/template` |
| `visit_slip_fields` | `GET /api/visit-slips/template` |
| `purpose_slip_mappings` | `POST /api/entries` (resolve) |
| `notification_templates` | `POST /api/entries` (trigger — planned) |
| `staff` | lookup host, approvers |
| `user_accounts` | `kiosk_devices.registered_by_id` FK |

---

## Error Responses (Standard)

ทุก API ใช้ response envelope มาตรฐาน:

```json
{
  "success": false,
  "error": {
    "code": "KIOSK_OFFLINE",
    "message": "ตู้ Kiosk ไม่พร้อมใช้งาน"
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
   │── GET /api/service-    ▶│── SELECT service_points ────▶│                         │
   │   points/:id           ─│                              │                         │
   │◀── config + hours ──────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User accepts PDPA]     │                              │                         │
   │── POST /api/pdpa/     ─▶│── SELECT pdpa_consent_* ───▶│                         │
   │   accept                │── INSERT pdpa_consent_logs ─▶│                         │
   │◀── consent ─────────────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User inserts ID card]  │                              │                         │
   │── GET /api/search/    ─▶│── SELECT visitors ──────────▶│                         │
   │   visitors?q=           │                              │                         │
   │── POST /api/blocklist/─▶│── SELECT blocklist ─────────▶│                         │
   │   check                 │                              │                         │
   │◀── visitorData ─────────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User confirms data]    │                              │                         │
   │── GET /api/visit-     ─▶│── SELECT visit_purposes ───▶│                         │
   │   purposes              │── JOIN dept_rules + channels▶│                         │
   │◀── purposes list ───────│◀── result ──────────────────│                         │
   │                         │                              │                         │
   │ [User selects purpose]  │                              │                         │
   │ FACE_CAPTURE (🔲 planned)                              │                         │
   │ WIFI_OFFER  (🔲 planned)                               │                         │
   │                         │                              │                         │
   │── POST /api/entries ───▶│── INSERT visit_entries ─────▶│                         │
   │                         │── RESOLVE access_group ─────▶│                         │
   │                         │── GENERATE entry code ───────│                         │
   │◀── entry data ──────────│◀── complete ────────────────│                         │
   │                         │                              │                         │
   │── GET /api/visit-slips/▶│── SELECT slip_templates ───▶│                         │
   │   template              │                              │                         │
   │◀── slip template ───────│◀── result ──────────────────│                         │
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

1. **Device Token Auth**: Kiosk ใช้ `Authorization: Bearer kvms_...` ทุก API call (ยกเว้น PDPA + visit-slips ที่เป็น public) — token เก็บใน localStorage key `evms_kiosk_device_token`
2. **Token Security**: token แสดงครั้งเดียวตอน register, เก็บเป็น SHA-256 hash ใน DB, รองรับ revoke + rotation ผ่าน admin API
3. **Auth Library**: `lib/kiosk-auth.ts` — ใช้ `getStaffOrKiosk()` หรือ `getAuthUserOrKiosk()` ใน API routes ที่ kiosk ต้องเข้าถึง
4. **Kiosk Auth Context**: `lib/kiosk/kiosk-auth-context.tsx` — React context ที่ wrap kiosk layout, provide `kioskApiFetch` / `kioskApiPost` ที่ inject auth headers อัตโนมัติ
5. **Caching**: `GET /api/service-points/:id`, `POST /api/pdpa/accept`, `GET /api/visit-purposes` สามารถ cache ฝั่ง Kiosk ได้ (refresh ทุก 5 นาที หรือเมื่อ reset)
6. **Offline Mode**: Kiosk ควรมี cached config เพื่อแสดง "offline" message ได้แม้ไม่มี internet
7. **Retry Logic**: API ที่เป็น write (POST) ควรมี idempotency key เพื่อป้องกัน duplicate — ใช้ `booking_code` เป็น key
8. **Photo Upload**: แนะนำ compress JPEG quality 80% ก่อนอัปโหลด เพื่อลด bandwidth
9. **WiFi Generation**: อาจ generate ฝั่ง Kiosk ได้ตาม pattern จาก config (ไม่ต้องเรียก API) — แต่ถ้าต้องการ central control ใช้ API
10. **Hikvision Sync**: ทำ async ฝั่ง backend — ไม่ต้องรอ response ก่อนตอบ Kiosk (eventual consistency)
11. **PDPA Consent**: บันทึกก่อน verify-identity ได้ (ใช้ idNumber จาก card read — หรือบันทึกทีหลังพร้อม checkin)
12. **Blocklist Check**: ตรวจหลัง DATA_PREVIEW (ก่อน CONFIRM_DATA) — ถ้าพบ permanent block แสดง error ไม่ให้ดำเนินการต่อ

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

---

## ผลการทดสอบ Walk-in Check-in Flow (Kiosk)

> ทดสอบ: 6 เมษายน 2569
> Script: `scripts/test-walkin-flow.mjs`
> Target: `https://vms-prototype-delta.vercel.app`
> ผลรวม: ✅ ผ่านทุกรายการ

### Kiosk Walk-in (requireApproval=false) — Phase 4

| # | Endpoint | Method | Auth | ผลทดสอบ |
|---|----------|--------|------|---------|
| 1 | `/api/service-points/:id` | GET | Device Token | ✅ โหลด config สำเร็จ |
| 2 | `/api/pdpa/accept` | POST | Public | ✅ บันทึก consent สำเร็จ |
| 3 | `/api/search/visitors?q=` | GET | Device Token | ✅ ค้นหา visitor สำเร็จ |
| 4 | `/api/blocklist/check` | POST | Device Token | ✅ ตรวจ blocklist สำเร็จ (not blocked) |
| 5 | `/api/visit-purposes` | GET | Device Token | ✅ โหลด purposes สำเร็จ |
| 6 | `/api/entries` | POST | Device Token | ✅ สร้าง walk-in entry สำเร็จ (channel=kiosk) |
| 7 | `/api/entries/today` | GET | Staff Cookie | ✅ entry ปรากฏใน today list |
| 8 | `/api/entries/:id/checkout` | POST | Staff Cookie | ✅ checkout สำเร็จ (ผ่าน admin) |

### Kiosk Walk-in (requireApproval=true) — Phase 5

| # | Endpoint | Method | Auth | ผลทดสอบ |
|---|----------|--------|------|---------|
| 1 | `/api/appointments` | POST | Device Token | ✅ สร้าง pending appointment สำเร็จ |
| 2 | `/api/appointments?search=` | GET | Device Token | ✅ poll status = pending |
| 3 | `/api/appointments/:id/approve` | POST | Staff Cookie | ✅ admin approve สำเร็จ |
| 4 | `/api/appointments?search=` | GET | Device Token | ✅ poll status = approved |
| 5 | `/api/entries` | POST | Device Token | ✅ check-in linked to appointment สำเร็จ |
| 6 | `/api/entries/today` | GET | Staff Cookie | ✅ entry ปรากฏใน today list |

### ข้อจำกัดที่พบ (Auth Limitations)

| Endpoint | Kiosk Auth | Staff Cookie | หมายเหตุ |
|----------|:----------:|:------------:|----------|
| `POST /api/entries/:id/checkout` | ❌ | ✅ | Kiosk ไม่สามารถ checkout ได้ (ต้องใช้ staff cookie) |
| `POST /api/appointments/:id/approve` | ❌ | ✅ | Kiosk ไม่สามารถ approve ได้ (ต้องใช้ staff cookie) |

### Bug Fix ที่พบระหว่างทดสอบ

| Issue | รายละเอียด | สถานะ |
|-------|-----------|-------|
| `kiosk_devices.token_prefix` | Column เป็น `VARCHAR(10)` แต่ token prefix (`kvms_` + 8 hex = 13 chars) เกิน → 500 Server Error ตอนสร้าง device | ✅ แก้แล้ว → `VARCHAR(20)` |

### Business Hours Note

- ถ้าวันทดสอบเป็นวันหยุด (เช่น วันจักรี) appointment ที่ใช้ `followBusinessHours=true` จะถูก reject
- Script ใช้ purpose+dept combo ที่ `followBusinessHours=false` เพื่อทดสอบได้ทุกวัน

---

## ผลการทดสอบ Appointment Check-in Flow (Kiosk)

> ทดสอบ: 6 เมษายน 2569
> Script: `scripts/test-appointment-checkin.mjs`
> Target: `https://vms-prototype-delta.vercel.app`
> ผลรวม: ✅ ผ่านทุกรายการ (100/100 tests)

### Kiosk — Appointment Lookup & Check-in (QR Scan Flow) — Phase 4

| # | Endpoint | Method | Auth | ผลทดสอบ |
|---|----------|--------|------|---------|
| 1 | `/api/search/appointments?q={bookingCode}` | GET | Device Token | ✅ ค้นหานัดหมายจาก QR code สำเร็จ |
| 2 | `/api/appointments/:id` | GET | Device Token | ✅ ดึง detail (visitor, host, companions, statusLogs) |
| 3 | `/api/pdpa/accept` | POST | Public | ✅ บันทึก PDPA consent |
| 4 | `/api/entries` | POST | Device Token | ✅ check-in linked to appointment (channel=kiosk) |
| 5 | `/api/visit-slips/template` | GET | Public | ✅ ดึง slip template (Thermal 80mm) |
| 6 | `/api/entries/today` | GET | Staff Cookie | ✅ entry ปรากฏใน today list |

### Kiosk — Pending & Rejected Appointment — Phase 5

| # | ทดสอบ | ผลทดสอบ |
|---|-------|---------|
| 1 | สร้าง pending appointment | ✅ status = pending |
| 2 | Kiosk lookup ค้นหานัดหมายที่ pending | ✅ พบ, status = pending |
| 3 | Check-in บน pending appointment | ⚠️ API อนุญาต (frontend ต้อง block) |
| 4 | Reject appointment | ✅ status = rejected, มี reason + statusLog |
| 5 | Check-in บน rejected appointment | ✅ ถูก block ด้วย `INVALID_APPOINTMENT_STATUS` |

### Kiosk — Period Appointment — Phase 6

| # | ทดสอบ | ผลทดสอบ |
|---|-------|---------|
| 1 | สร้าง period appointment (5 วัน) | ✅ entryMode=period, มี dateEnd |
| 2 | Kiosk lookup period appointment | ✅ พบ, entryMode=period |
| 3 | Check-in วันแรก | ✅ สร้าง entry สำเร็จ |
| 4 | Check-in ซ้ำวันเดียวกัน | ✅ ถูก reject 409 `ALREADY_CHECKED_IN_TODAY` |

### ข้อค้นพบสำคัญ

| Issue | รายละเอียด | ระดับ |
|-------|-----------|-------|
| Pending check-in ไม่ถูก block ที่ API | `POST /api/entries` อนุญาตให้ check-in เมื่อ appointment status=pending — frontend ต้อง validate ก่อนเรียก API | ⚠️ Frontend ต้อง block |
| Rejected check-in ถูก block ที่ API | `POST /api/entries` reject ด้วย `INVALID_APPOINTMENT_STATUS` เมื่อ status=rejected | ✅ ทำงานถูกต้อง |
| Single mode ไม่ให้ re-entry แม้ checkout แล้ว | หลัง checkout แล้วก็ไม่สามารถ check-in อีกครั้ง → `SINGLE_ENTRY_USED` | ✅ ทำงานถูกต้อง |
