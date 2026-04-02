# Dynamic Form Rules Specification

> eVMS -- Visitor Management System  
> Version 1.0 | Last updated: 2026-04-02

---

## Table of Contents

1. [Overview](#overview)
2. [Rule Tables](#rule-tables)
3. [Rule Fields and Their Effects](#rule-fields-and-their-effects)
4. [Channel Filtering](#channel-filtering)
5. [Form Behavior per Channel](#form-behavior-per-channel)
6. [Period Mode Validation Rules](#period-mode-validation-rules)
7. [Rule Resolution Flow](#rule-resolution-flow)
8. [Configuration Examples](#configuration-examples)

---

## Overview

eVMS ใช้ตาราง `visit_purpose_department_rules` เป็นตัวกำหนดพฤติกรรมของฟอร์มนัดหมายแบบ dynamic ตาม combination ของ **วัตถุประสงค์ (VisitPurpose)** และ **แผนก (Department)**

กฎเหล่านี้ส่งผลต่อ:
- ฟิลด์ที่ต้องกรอก / ไม่ต้องกรอก
- ช่องทางที่อนุญาตให้ใช้งาน
- ขั้นตอนอนุมัติ
- การเสนอ WiFi
- Entry mode ที่อนุญาต

---

## Rule Tables

### Primary: `visit_purpose_department_rules`

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INT (PK) | auto | |
| `visit_purpose_id` | INT (FK) | -- | วัตถุประสงค์ |
| `department_id` | INT (FK) | -- | แผนก |
| `require_person_name` | BOOLEAN | `false` | ต้องระบุบุคคลที่ต้องการพบ (hostStaffId) |
| `require_approval` | BOOLEAN | `false` | ต้องผ่านการอนุมัติ |
| `approver_group_id` | INT (FK, nullable) | `null` | กลุ่มผู้อนุมัติ (ใช้เมื่อ requireApproval = true) |
| `offer_wifi` | BOOLEAN | `false` | เสนอ WiFi ให้ผู้เยี่ยมชม |
| `accept_from_line` | BOOLEAN | `true` | อนุญาตจาก LINE OA |
| `accept_from_web` | BOOLEAN | `true` | อนุญาตจาก Web |
| `accept_from_kiosk` | BOOLEAN | `true` | อนุญาตจาก Kiosk |
| `accept_from_counter` | BOOLEAN | `true` | อนุญาตจาก Counter |
| `is_active` | BOOLEAN | `true` | สถานะใช้งาน |

### Supporting: `visit_purposes`

| Column | Type | Description |
|---|---|---|
| `allowed_entry_modes` | VARCHAR(50) | เช่น `"single"`, `"single,period"` -- กำหนดว่า purpose นี้อนุญาต mode ใดบ้าง |
| `show_on_line` | BOOLEAN | แสดงบน LINE OA |
| `show_on_web` | BOOLEAN | แสดงบน Web |
| `show_on_kiosk` | BOOLEAN | แสดงบน Kiosk |
| `show_on_counter` | BOOLEAN | แสดงบน Counter |

### Supporting: `visit_purpose_channel_configs`

| Column | Type | Description |
|---|---|---|
| `visit_purpose_id` | INT (FK) | วัตถุประสงค์ |
| `channel` | VARCHAR(20) | `web` / `line` / `kiosk` / `counter` |
| `require_photo` | BOOLEAN | ต้องถ่ายรูปหรือไม่ |

### Supporting: `visit_purpose_channel_documents`

| Column | Type | Description |
|---|---|---|
| `channel_config_id` | INT (FK) | config ของช่องทาง |
| `identity_document_type_id` | INT (FK) | ประเภทเอกสารที่ยอมรับ (บัตร ปชช., passport, ...) |

---

## Rule Fields and Their Effects

### `requirePersonName`

| Value | Effect on Form | API Behavior |
|---|---|---|
| `true` | ฟิลด์ "บุคคลที่ต้องการพบ" เป็น required -- แสดง staff picker | `POST /api/appointments` จะ reject ถ้าไม่มี `hostStaffId` (error: `HOST_REQUIRED`) |
| `false` | ฟิลด์เป็น optional -- ซ่อนหรือแสดงแบบ optional | `hostStaffId` เป็น nullable ใน schema |

ตัวอย่าง use case:
- **ส่งเอกสาร** -> `requirePersonName = true` (ต้องระบุผู้รับ)
- **เยี่ยมชมทั่วไป** -> `requirePersonName = false`

### `requireApproval`

| Value | Effect on Form | API Behavior |
|---|---|---|
| `true` | แสดงข้อความ "นัดหมายจะถูกส่งไปรออนุมัติ" | status = `pending`; ส่ง `approval-needed` notification |
| `false` | แสดงข้อความ "นัดหมายอนุมัติอัตโนมัติ" | status = `approved`; `approvedBy` = staff id |

เมื่อ `requireApproval = true`:
- `approverGroupId` กำหนดกลุ่มผู้อนุมัติ
- Kiosk จะเข้าสถานะ `PENDING_APPROVAL` (รอสูงสุด timeout แล้วแสดง error)

### `offerWifi`

| Value | Effect on Form | API Behavior |
|---|---|---|
| `true` | แสดงตัวเลือก "ต้องการ WiFi หรือไม่" บน form + Kiosk WIFI_OFFER screen | `appointment.offerWifi = true` |
| `false` | ไม่แสดง WiFi option; Kiosk ข้าม WIFI_OFFER screen | `appointment.offerWifi = false` |

### `acceptFrom*` Fields

4 fields ที่ควบคุมว่าช่องทางใดอนุญาตให้สร้างนัดหมาย:

| Field | Channel | ถ้า `false` |
|---|---|---|
| `acceptFromLine` | LINE OA | ไม่อนุญาตจาก LINE -> error `CHANNEL_BLOCKED` (HTTP 403) |
| `acceptFromWeb` | Web Portal | ไม่อนุญาตจาก Web |
| `acceptFromKiosk` | Kiosk | ไม่อนุญาตจาก Kiosk (walk-in) |
| `acceptFromCounter` | Counter | ไม่อนุญาตจาก Counter |

---

## Channel Filtering

### Two-Layer Filtering

การแสดงวัตถุประสงค์บนแต่ละช่องทางผ่าน 2 ชั้น:

**Layer 1: VisitPurpose visibility** (กรองว่า purpose แสดงบน channel นั้นหรือไม่)

```sql
-- Kiosk จะแสดงเฉพาะ purpose ที่ show_on_kiosk = true
SELECT * FROM visit_purposes WHERE show_on_kiosk = true AND is_active = true
```

**Layer 2: Department Rule acceptance** (กรองว่า purpose+department อนุญาตจาก channel นั้นหรือไม่)

```sql
-- หลังจากเลือก purpose + department แล้ว ตรวจสอบ rule
SELECT * FROM visit_purpose_department_rules 
WHERE visit_purpose_id = ? AND department_id = ? AND accept_from_kiosk = true AND is_active = true
```

### Filter Matrix

| | Web | LINE | Kiosk | Counter |
|---|:---:|:---:|:---:|:---:|
| **Purpose Visibility** | `show_on_web` | `show_on_line` | `show_on_kiosk` | `show_on_counter` |
| **Rule Acceptance** | `accept_from_web` | `accept_from_line` | `accept_from_kiosk` | `accept_from_counter` |
| **Channel Config** | `channel = "web"` | `channel = "line"` | `channel = "kiosk"` | `channel = "counter"` |

---

## Form Behavior per Channel

### Web Portal

| Rule Field | Form Effect |
|---|---|
| `requirePersonName` | "ผู้ที่ต้องการพบ" field เป็น required, แสดง staff search/dropdown |
| `requireApproval` | แสดง badge "ต้องอนุมัติ" บน purpose card |
| `offerWifi` | แสดง WiFi checkbox ในฟอร์ม |
| Entry mode | แสดง radio "ครั้งเดียว / ช่วงเวลา" ถ้า purpose อนุญาต period |

ฟอร์ม Web แสดงครบทุกฟิลด์: visitor info, purpose, department, host, date/time, companions, equipment, notes

### LINE OA (Mobile / LIFF)

| Rule Field | Form Effect |
|---|---|
| `requirePersonName` | แสดง step "เลือกผู้ที่ต้องการพบ" -- ใช้ LIFF form |
| `requireApproval` | แสดงข้อความ "นัดหมายจะส่งไปรออนุมัติ" |
| `offerWifi` | แสดงปุ่ม "ต้องการ WiFi" ใน Flex Message |
| Entry mode | LINE รองรับ period mode ผ่าน LIFF form พิเศษ |

LINE OA มี state เพิ่มเติม 18 states (รวม Rich Menu interaction)

### Kiosk

| Rule Field | Form Effect |
|---|---|
| `requirePersonName` | ถ้า walk-in + requirePersonName -> ต้องค้นหา/เลือก staff ก่อนดำเนินการ |
| `requireApproval` | Walk-in -> เข้า `PENDING_APPROVAL` state รอการอนุมัติ real-time |
| `offerWifi` | แสดงหน้า `WIFI_OFFER` ก่อน SUCCESS |
| Channel docs | `visit_purpose_channel_documents` กำหนดวิธียืนยันตัวตนที่ Kiosk ยอมรับ |

Kiosk state machine: 14 states + `PENDING_APPROVAL` = 15 states (ดูรายละเอียดใน `channel-integration-spec.md`)

### Counter

| Rule Field | Form Effect |
|---|---|
| `requirePersonName` | เจ้าหน้าที่เคาน์เตอร์ต้องกรอก host staff |
| `requireApproval` | เจ้าหน้าที่สามารถอนุมัติได้ทันที (ถ้ามีสิทธิ์) หรือส่งไปรอ |
| `offerWifi` | แสดง WiFi toggle ใน form |
| Entry mode | รองรับทั้ง single + period |

Counter มี 15 states (รวม manual approval + manual override)

---

## Period Mode Validation Rules

### Conditions for Period Mode Availability

```
1. visit_purposes.allowed_entry_modes ต้องมี "period"
2. visit_purpose_department_rules ต้อง active
3. Request body ต้องมี dateEnd > dateStart
```

### Validation at Appointment Creation (`POST /api/appointments`)

```typescript
if (resolvedEntryMode === "period") {
  // ตรวจ: purpose อนุญาต period mode หรือไม่
  if (!visitPurpose.allowedEntryModes.includes("period"))
    -> error: PERIOD_NOT_ALLOWED

  // ตรวจ: dateEnd ต้องระบุ
  if (!dateEnd) 
    -> error: DATE_END_REQUIRED

  // ตรวจ: dateEnd ต้องมากกว่า dateStart
  if (dateEnd <= dateStart) 
    -> error: DATE_END_INVALID
}
```

### Validation at Check-in (`POST /api/entries`)

```typescript
if (appt.entryMode === "single") {
  // ตรวจ: ยังไม่เคย check-in
  const existing = await findFirst({ appointmentId });
  if (existing) -> error: SINGLE_ENTRY_USED (HTTP 409)
}

if (appt.entryMode === "period") {
  // ตรวจ: วันนี้อยู่ในช่วง dateStart - dateEnd
  if (today < dateStart) -> error: BEFORE_DATE_RANGE
  if (today > dateEnd)   -> error: APPOINTMENT_EXPIRED (HTTP 410)
  
  // ตรวจ: ไม่ซ้ำวันเดียวกัน (ต้อง check-out ก่อน)
  const todayEntry = await findFirst({ appointmentId, checkinAt: today, status: "checked-in" });
  if (todayEntry) -> error: ALREADY_CHECKED_IN_TODAY (HTTP 409)
}
```

### Period Mode + DaySchedule

เมื่อใช้ period mode กับ batch group ที่มี `daySchedules`:
- แต่ละวันอาจมีเวลาเข้า-ออกต่างกัน
- Overstay checker จะใช้ daySchedule ของวันนั้นเป็น priority สูงสุด
- ถ้าวันที่ check-in ไม่มี daySchedule -> ใช้ group default time

---

## Rule Resolution Flow

แผนภาพแสดงลำดับการ resolve กฎเมื่อผู้ใช้สร้างนัดหมาย:

```
User selects: VisitPurpose + Department
         │
         ▼
┌─────────────────────────────────────┐
│ SELECT FROM visit_purpose_department│
│ _rules WHERE purpose=? AND dept=?  │
│ AND is_active=true                  │
└──────────────┬──────────────────────┘
               │
         ┌─────┴─────┐
         │ rule found?│
         └─────┬──┬──┘
          No   │  │ Yes
               ▼  ▼
        ┌──────┐  ┌──────────────────────┐
        │ 400  │  │ Apply rule fields:   │
        │ RULE │  │ - requirePersonName  │
        │ _NOT │  │ - requireApproval    │
        │ _FOUND│ │ - offerWifi          │
        └──────┘  │ - acceptFrom*        │
                  └──────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │ Channel allowed?│
                    └───┬─────────┬──┘
                   No   │         │ Yes
                        ▼         ▼
                 ┌──────────┐  ┌──────────────────┐
                 │ 403      │  │ Continue with     │
                 │ CHANNEL  │  │ form rendering    │
                 │ _BLOCKED │  │ based on rule     │
                 └──────────┘  └──────────────────┘
```

---

## Configuration Examples

### Example 1: "ประชุม" + "ฝ่ายขาย"

```json
{
  "visitPurposeId": 1,
  "departmentId": 3,
  "requirePersonName": true,
  "requireApproval": false,
  "offerWifi": true,
  "acceptFromLine": true,
  "acceptFromWeb": true,
  "acceptFromKiosk": true,
  "acceptFromCounter": true
}
```

ผล: ต้องระบุผู้ที่พบ, อนุมัติอัตโนมัติ, เสนอ WiFi, เข้าได้ทุกช่องทาง

### Example 2: "ส่งเอกสาร" + "ฝ่ายบุคคล"

```json
{
  "visitPurposeId": 4,
  "departmentId": 7,
  "requirePersonName": true,
  "requireApproval": false,
  "offerWifi": false,
  "acceptFromLine": false,
  "acceptFromWeb": true,
  "acceptFromKiosk": true,
  "acceptFromCounter": true
}
```

ผล: ต้องระบุผู้รับ, ไม่เสนอ WiFi, ไม่รับจาก LINE (ต้องมาที่ kiosk หรือ counter)

### Example 3: "ผู้รับเหมา" + "ฝ่ายอาคาร" (Period mode)

```json
{
  "visitPurposeId": 5,
  "departmentId": 9,
  "requirePersonName": true,
  "requireApproval": true,
  "approverGroupId": 2,
  "offerWifi": false,
  "acceptFromLine": false,
  "acceptFromWeb": true,
  "acceptFromKiosk": false,
  "acceptFromCounter": true
}
```

VisitPurpose `allowedEntryModes = "single,period"`

ผล: ต้องระบุผู้ดูแล, ต้องอนุมัติ (กลุ่ม 2), ไม่เสนอ WiFi, จองได้เฉพาะ Web + Counter, รองรับ period mode
