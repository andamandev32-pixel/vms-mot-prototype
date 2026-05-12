# Group Appointment → Check-in Data Flow

> Flow doc: การไหลของข้อมูล จากหน้า [`/web/appointments/groups/create`](../app/web/(app)/appointments/groups/create/page.tsx) ไปจนเกิด `visit_entries` ผ่าน kiosk หรือ counter

> **Audience:** Dev / PM / QA ที่ต้องเข้าใจภาพรวมตั้งแต่ form ถึง entry — สำหรับ detail ของแต่ละ endpoint อ่าน spec ที่ link ไว้ปลายไฟล์

---

## Overview

ระบบใช้ **unified table design** — นัดหมายแบบกลุ่ม (batch) ที่สร้างผ่านหน้า web จะถูก **materialize เป็น `Appointment` record รายบุคคล** ตั้งแต่ตอนสร้าง โดยทุก record มี `bookingCode` ของตัวเองและมี `groupId` (FK → `AppointmentGroup`) เป็น metadata อ้างอิงกลุ่ม

ผลลัพธ์คือ downstream (kiosk / counter) **ไม่ต้องมี logic แยกสำหรับ group เลย** — query ตาราง `appointments` ตรงๆ ก็เจอทั้งนัดเดี่ยวและสมาชิกกลุ่มเหมือนกัน

```
┌─────────────────────────────────────────────────────────────┐
│                         FLOW OVERVIEW                        │
└─────────────────────────────────────────────────────────────┘

   [Web]                       [DB]                  [Visitor]
   /web/appointments/                                    │
   groups/create                                         │
        │                                                │
        │ POST /api/appointments/batch                   │
        ▼                                                │
   ┌─────────────────┐                                   │
   │ Batch handler   │──┬─► appointment_groups (1)       │
   │ — materialize   │  ├─► appointment_group_           │
   │   visitors      │  │   day_schedules (N)            │
   └─────────────────┘  ├─► appointments (N: 1/visitor)  │
                        ├─► visitors (upsert)            │
                        └─► appointment_status_logs (N)  │
                                  │                      │
                                  │ notification         │
                                  └────► email/LINE ────►│
                                                         │
                                              [วันที่นัด] │
                                                         ▼
                                       ┌─────────────────────────┐
                                       │   3 Check-in paths     │
                                       │   (Stage 3 ด้านล่าง)    │
                                       └─────────────────────────┘
                                                  │
                                                  ▼
                                            visit_entries
```

---

## Stage 1 — Group Creation (Web)

**Frontend:** [`app/web/(app)/appointments/groups/create/page.tsx`](../app/web/(app)/appointments/groups/create/page.tsx)
**API:** `POST /api/appointments/batch` ([handler](../app/api/appointments/batch/route.ts))

### Request Payload (สรุป)

```json
{
  "group": {
    "name": "อบรมระบบ ERP รุ่นที่ 3",
    "visitPurposeId": 4,
    "departmentId": 2,
    "dateStart": "2026-05-15",
    "dateEnd": null,
    "timeStart": "09:00",
    "timeEnd": "16:00",
    "entryMode": "single",
    "approveOnCreate": true,
    "approverGroupId": 7,
    "staffNotifyConfig": {
      "creator": true,
      "responsibleGroup": false,
      "additionalStaff": [12, 18],
      "additionalApproverGroups": [9]
    },
    "sendVisitorEmail": true,
    "notifyOnCheckin": true
  },
  "visitors": [
    { "name": "นายสมชาย ใจดี", "phone": "081-234-5678", "idNumber": "1-2345-XXXXX-XX-3" },
    { "name": "นางสาวพิมพา เกษม", "phone": "081-555-1234" }
  ]
}
```

### DB Writes

| ลำดับ | ตาราง | จำนวน record | บันทึกอะไร |
|---|---|---|---|
| 1 | `appointment_groups` | 1 | metadata กลุ่ม (`name`, `visitPurposeId`, `departmentId`, date/time, `approverGroupId`, `staffNotifyConfig` JSON, `createdByStaffId`) |
| 2 | `appointment_group_day_schedules` | N (1/วัน) | เฉพาะ period mode + มี `daySchedules` |
| 3 | `visitors` | N (upsert) | match จาก phone+name → reuse, ไม่งั้นสร้างใหม่ พร้อม synthetic `idNumber` ถ้าไม่ได้ส่งมา |
| 4 | `appointments` | **N (1/visitor)** | นัดรายบุคคล — มี `bookingCode` แยก, มี `groupId` ชี้กลับ table 1, status = `approved`/`pending` |
| 5 | `appointment_status_logs` | N | log การเปลี่ยน status (เช่น ตอน auto-approve) |

### Logic ของ Status (สำคัญ)

```
ruleAllowsAuto = !rule.requireApproval
autoApprove   = ruleAllowsAuto || group.approveOnCreate === true
status        = autoApprove ? "approved" : "pending"
```

- ถ้า rule ไม่ต้องการ approval → ทุก Appointment เป็น `approved` ทันที
- ถ้า rule ต้อง approval แต่ creator กด "อนุมัติเลยในฐานะเจ้าหน้าที่" (self-approve modal) → `approveOnCreate=true` → ทุกตัวก็เป็น `approved`
- กรณีอื่น → `pending` (ต้องรออนุมัติก่อนถึงจะ check-in ได้)

> สำคัญ: **ถ้ากลุ่มยัง `pending` Stage 3 ทุก path จะหาไม่เจอ** เพราะ filter `status ∈ {approved, confirmed}`

---

## Stage 2 — Notification (กระจาย bookingCode)

หลังสร้างกลุ่มเสร็จ ระบบจะส่ง notification ตาม config:

| Recipient | กระตุ้นโดย | ช่องทาง |
|---|---|---|
| Creator | `staffNotifyConfig.creator = true` | in-app notification |
| Responsible approver group | `staffNotifyConfig.responsibleGroup = true` | in-app + email |
| Additional staff/groups | `staffNotifyConfig.additionalStaff[]`, `additionalApproverGroups[]` | in-app + email |
| Visitor (แต่ละคนในกลุ่ม) | `group.sendVisitorEmail = true` | email พร้อม `bookingCode` ของตัวเอง |

> **ปลายทางสำคัญ:** visitor แต่ละคนได้รับ email ที่มี **`bookingCode` ของตัวเอง** (ไม่ใช่ของกลุ่ม) — bookingCode นี้เป็นที่มาของ QR ที่ใช้ใน Stage 3a

> รายละเอียดของ notification engine: [notification-system-spec.md](./notification-system-spec.md), [channel-integration-spec.md](./channel-integration-spec.md)

---

## Stage 3 — Visitor Arrival (3 Paths)

ในวันที่นัด visitor มาถึง ระบบมี 3 วิธีตรวจว่ามีนัดอยู่หรือไม่ — ทั้งหมด query ตาราง `appointments` ตรงๆ ด้วย `prisma.appointment.findFirst/findMany`

### 3a. Kiosk QR Scan

```
Visitor                 Kiosk App                      Backend
   │                        │                             │
   │── สแกน QR ──────────►  │                             │
   │                        │── POST /api/kiosk/          │
   │                        │   appointment/lookup ─────► │
   │                        │   { qrCodeData: "eVMS-..." }│
   │                        │                             │
   │                        │                             ├─► appointment.findFirst({
   │                        │                             │     bookingCode: { OR exact|contains }
   │                        │                             │   })
   │                        │                             │
   │                        │                             │ ตรวจ: dateStart === today
   │                        │                             │       status ∈ {approved, confirmed}
   │                        │                             │
   │                        │ ◄── { found, appointment } ─│
   │                        │                             │
   │ ◄── หน้า Preview ─────│                             │
   │                        │                             │
   │── ยืนยัน ─────────────►│── (ไป Stage 4) ─────────────│
```

**Endpoint:** `POST /api/kiosk/appointment/lookup` ([route.ts:20](../app/api/kiosk/appointment/lookup/route.ts))
**Response สรุป:**

```json
{
  "success": true,
  "data": {
    "found": true,
    "appointment": {
      "id": 152,
      "bookingCode": "eVMS-20260515-0152",
      "visitorName": "นายสมชาย ใจดี",
      "hostName": "นางสาวพิมพา เกษมศรี",
      "purposeName": "อบรม / สัมมนา",
      "timeSlot": "09:00 — 16:00",
      "status": "approved"
    }
  }
}
```

**Reason ที่อาจคืน `found: false`:** `not-found` (ไม่พบ bookingCode), `wrong-date` (มาผิดวัน)

### 3b. Kiosk Walk-in Auto-Match

ใช้กรณี visitor ไม่มี QR แต่กรอก ID/passport/ชื่อแล้วระบบเช็คให้อัตโนมัติว่ามีนัดวันนี้หรือไม่

```
Visitor                 Kiosk App                       Backend
   │                        │                              │
   │── กรอก idNumber ─────►│                              │
   │                        │── POST /api/kiosk/           │
   │                        │   appointment/match-by-      │
   │                        │   identity ────────────────► │
   │                        │   { idNumber, departmentId?, │
   │                        │     visitPurposeId? }        │
   │                        │                              │
   │                        │                              ├─► appointment.findMany({
   │                        │                              │     visitor: { OR: identity },
   │                        │                              │     dateStart: today,
   │                        │                              │     status ∈ {approved, confirmed}
   │                        │                              │   })
   │                        │                              │
   │                        │ ◄── { hasAppointment,       │
   │                        │       suggestion,            │
   │                        │       appointments[] } ─────│
   │                        │                              │
   │                        │  ┌───────────────────┐       │
   │                        │  │ hasAppointment?   │       │
   │                        │  │  Yes → use แสดง   │       │
   │                        │  │  No  → walk-in    │       │
   │                        │  └───────────────────┘       │
```

**Endpoint:** `POST /api/kiosk/appointment/match-by-identity` ([route.ts:59](../app/api/kiosk/appointment/match-by-identity/route.ts))
**Suggestion field:** `proceed-walkin` (ไม่มีนัด) / `use-appointment` (มีนัดและตรง dept+purpose) / `confirm-with-visitor` (มีนัดแต่ไม่ตรง — ถามผู้ใช้)

> หมายเหตุ: คนคนเดียวอาจมีหลายนัดในวันเดียว (เช่น เป็นสมาชิกของหลายกลุ่ม) — endpoint นี้คืน array ทั้งหมด

### 3c. Counter Search

```
Counter Staff             Counter App                    Backend
     │                        │                              │
     │── พิมพ์ชื่อ/บัตร ────►│                              │
     │                        │── GET /api/appointments?     │
     │                        │   date=YYYY-MM-DD&search=─► │
     │                        │   (hook: useTodayAppointments│
     │                        │    lib/hooks/use-counter.ts) │
     │                        │                              │
     │                        │                              ├─► appointment.findMany({
     │                        │                              │     dateStart: { gte: today },
     │                        │                              │     OR: bookingCode/purpose/
     │                        │                              │         visitor.name/visitor.phone/
     │                        │                              │         hostStaff.name
     │                        │                              │   }) + RBAC scope
     │                        │ ◄── { appointments[] } ─────│
     │                        │                              │
     │── เลือกแถว ──────────►│                              │
     │                        │── POST /api/counter/         │
     │                        │   appointments/[id]/verify ─►│
     │                        │   { idNumber? , fullNameTh? }│
     │                        │                              │
     │                        │                              ├─► blocklist.findMany(...)
     │                        │                              ├─► appointment.findUnique({id})
     │                        │                              │   match visitor.idNumber
     │                        │                              │   หรือ visitor.name
     │                        │ ◄── { status: matched|       │
     │                        │       mismatch|blocked } ───│
     │                        │                              │
     │── กด Check-in ───────►│── (ไป Stage 4) ──────────────│
```

**Endpoints:**
- รายการ + ค้น: `GET /api/appointments?date=YYYY-MM-DD&search={q}` ([route.ts:14](../app/api/appointments/route.ts))
- Verify ตัวตน: `POST /api/counter/appointments/[id]/verify` ([route.ts:33](../app/api/counter/appointments/[id]/verify/route.ts))

> **หมายเหตุ:** มี `GET /api/counter/appointments/today` อยู่จริง แต่ frontend ใช้ `/api/appointments` ตัว general — endpoint counter/today อาจเป็น dead code

---

## Stage 4 — Check-in (สร้าง VisitEntry)

หลัง visitor ถูกระบุตัวตนสำเร็จ → สร้าง `visit_entries` row

| Channel | Endpoint | Channel marker |
|---|---|---|
| Kiosk | `POST /api/kiosk/checkin` | `checkinChannel = "kiosk"` |
| Counter | `POST /api/counter/appointments/[id]/checkin` ([route.ts:21](../app/api/counter/appointments/[id]/checkin/route.ts)) | `checkinChannel = "counter"` |

### DB Write: `visit_entries`

```
{
  entryCode:        "eVMS-ENTRY-20260515-1234"  (auto-generated)
  appointmentId:    → ผูกกลับ Appointment row ที่ visitor นี้
  visitorId:        → ผูกกลับ Visitor row
  status:           "checked-in"
  visitType:        "appointment"
  hostStaffId:      copy จาก appointment
  departmentId:     copy จาก appointment
  checkinAt:        now
  checkinChannel:   "kiosk" | "counter"
  servicePointId:   จากตู้ kiosk หรือ session counter
  facePhotoPath:    ถ่ายจาก kiosk (optional)
}
```

### Side Effects

- **`notifyOnCheckin` notification** — ทั้ง [`/api/kiosk/checkin`](../app/api/kiosk/checkin/route.ts) (เฉพาะ checkin ที่มี `appointmentId`) และ [`/api/counter/appointments/[id]/checkin`](../app/api/counter/appointments/[id]/checkin/route.ts) เรียก [`sendCheckinNotification()`](../lib/notification-service.ts) แบบ fire-and-forget หลังสร้าง `visit_entries` สำเร็จ
- **WiFi credentials** — สร้าง (ถ้า `wifiRequested`)
- **Slip / badge print** — kiosk ออก slip, counter พิมพ์ badge

### Notification Recipients (เมื่อ `appointment.notifyOnCheckin = true`)

`sendCheckinNotification()` ส่ง LINE + email ให้ทุกคนต่อไปนี้ (deduplicate ด้วย `staff.id`):

| Source | กระตุ้นเมื่อ | Resolve เป็น staff ยังไง |
|---|---|---|
| Creator | เสมอ | `appointment.createdByStaff` |
| Host | เสมอ (ถ้าต่างจาก creator) | `appointment.hostStaff` |
| `staffNotifyConfig.responsibleGroup` | flag = true | members ของ `group.approverGroup.members` (filter `receiveNotification = true`) |
| `staffNotifyConfig.additionalStaff[]` | array มี id | `prisma.staff.findMany({ id: in [...] })` |
| `staffNotifyConfig.additionalApproverGroups[]` | array มี id | members ของแต่ละ `ApproverGroup` (filter `receiveNotification = true`) |

> ถ้า `appointment.notifyOnCheckin = false` → return ทันที ไม่ส่งให้ใครเลยแม้ตั้ง config

> Variables ที่ส่งใน Flex template: `visitorName`, `checkinTime`, `entryCode`, `location`, `groupName` (ว่างถ้าไม่ใช่นัดกลุ่ม)

---

## Data Lineage (Form → Entry)

| Field | Form (`page.tsx`) | Batch payload | DB column | Check-in lookup field | VisitEntry |
|---|---|---|---|---|---|
| ชื่อ event | `groupName` | `group.name` | `appointment_groups.name` | — | — |
| Purpose | `purposeId` | `group.visitPurposeId` | `appointment_groups.visit_purpose_id` + `appointments.visit_purpose_id` | match-by-identity filter | — |
| Department | `departmentId` | `group.departmentId` | `appointment_groups.department_id` + `appointments.department_id` | match-by-identity filter | `visit_entries.department_id` |
| Booking code | (auto) | — | `appointments.booking_code` | **kiosk QR lookup**, counter search | — |
| Visitor name | `visitors[].name` | `visitors[].name` | `visitors.name` | match-by-identity, counter search | — |
| Visitor ID | `visitors[].idNumber` | `visitors[].idNumber` | `visitors.id_number` | match-by-identity, counter verify | — |
| Group link | (auto) | — | `appointments.group_id` | (metadata, ไม่ใช้ใน lookup) | — |
| Status | (auto จาก rule + `approveOnCreate`) | `group.approveOnCreate` | `appointments.status` | **filter ทุก lookup** (`approved`/`confirmed`) | — |
| Check-in channel | — | — | — | — | `visit_entries.checkin_channel` |
| `notifyOnCheckin` | toggle | `group.notifyOnCheckin` | `appointment_groups.notify_on_checkin` → cascade ไป `appointments.notify_on_checkin` | — | trigger notification หลังสร้าง entry |

---

## Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| กลุ่มยัง `pending` (ไม่ได้ self-approve, rule ต้อง approval) | ทุก lookup ใน Stage 3 หาไม่เจอ → visitor ถูกถือเป็น walk-in (ต้องอนุมัติก่อน) |
| Group ถูก cancel หลังสร้าง | Cascade ทุก Appointment → `cancelled` (ดู [appointment-flow-spec § Group Status Cascade](./appointment-flow-spec.md#group-status-cascade-patch-apiappointmentsgroupsid)) → lookup หาไม่เจอ |
| Group ถูกเปิดกลับ (cancelled → active) | Appointment กลับเป็น `pending` (clear `approvedBy`) → ต้องอนุมัติใหม่ |
| Period mode (`entryMode = "period"`) | Visitor check-in ได้ทุกวันในช่วง `dateStart-dateEnd` — kiosk lookup ใช้ `dateStart === today`, counter ใช้ `dateStart >= today` |
| Visitor มาผิดวัน | kiosk lookup คืน `found: false, reason: "wrong-date"` |
| มี QR แต่ visitor ตัวจริงไม่ตรงกับ record | counter verify คืน `status: "mismatch"` — staff ตัดสินใจต่อ |
| Visitor ติด blocklist | counter verify คืน `status: "blocked"` พร้อม reason — block ก่อน check-in |
| สมาชิกคนเดียวอยู่หลายกลุ่ม วันเดียวกัน | match-by-identity คืน array ทุกนัด — kiosk ให้เลือก |

---

## Cross-references

| ต้องการรู้อะไร | ดูที่ |
|---|---|
| Spec ของ AppointmentGroup, lifecycle, cascade | [appointment-flow-spec.md](./appointment-flow-spec.md) |
| Detail kiosk endpoints + state machine | [kiosk-api-spec.md](./kiosk-api-spec.md) (โดยเฉพาะ § Group Appointment Compatibility) |
| Detail counter endpoints + state machine | [counter-api-spec.md](./counter-api-spec.md) (โดยเฉพาะ § 9b Group Appointment Compatibility) |
| Notification engine | [notification-system-spec.md](./notification-system-spec.md) |
| Test cases — group creation | [test-cases/batch-group.md](./test-cases/batch-group.md) |
| Test cases — kiosk check-in | [test-cases/kiosk-checkin.md](./test-cases/kiosk-checkin.md) |
| Test cases — counter check-in | [test-cases/counter-checkin.md](./test-cases/counter-checkin.md) |
