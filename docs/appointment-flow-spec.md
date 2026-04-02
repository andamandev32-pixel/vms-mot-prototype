# Appointment Flow Specification

> eVMS -- Visitor Management System  
> Version 1.0 | Last updated: 2026-04-02

---

## Table of Contents

1. [Overview](#overview)
2. [Single Appointment Creation](#single-appointment-creation)
3. [Batch Creation with AppointmentGroup](#batch-creation-with-appointmentgroup)
4. [Period Mode](#period-mode)
5. [Auto-Approve Logic](#auto-approve-logic)
6. [Approval Flow](#approval-flow)
7. [Check-in Flow](#check-in-flow)
8. [Arrival Dashboard](#arrival-dashboard)
9. [State Diagrams](#state-diagrams)
10. [API Reference Summary](#api-reference-summary)
11. [Database Tables](#database-tables)

---

## Overview

ระบบ eVMS รองรับการนัดหมายผู้เยี่ยมชม 2 รูปแบบหลัก:

- **Single Appointment** -- นัดหมายรายบุคคล สร้างผ่าน `POST /api/appointments`
- **Batch Appointment** -- นัดหมายหมู่ สร้างผ่าน `POST /api/appointments/batch` โดยผูกกับ `AppointmentGroup`

ทั้ง 2 รูปแบบรองรับ entry mode 2 แบบ: `single` (เข้าได้ครั้งเดียว) และ `period` (เข้าได้หลายวันในช่วงวันที่กำหนด)

---

## Single Appointment Creation

### Endpoint

```
POST /api/appointments
```

### Request Body (key fields)

| Field | Type | Required | Description |
|---|---|---|---|
| `visitorId` | number | Yes | ID ผู้เยี่ยมชมที่ลงทะเบียนแล้ว |
| `hostStaffId` | number | Conditional | บุคคลที่ต้องการพบ -- required ถ้า rule.requirePersonName = true |
| `visitPurposeId` | number | Yes | วัตถุประสงค์การเยี่ยมชม |
| `departmentId` | number | Yes | แผนกปลายทาง |
| `type` | string | Yes | ประเภท เช่น `meeting`, `contractor`, `official` |
| `entryMode` | string | No | `single` (default) หรือ `period` |
| `date` | string | Yes | วันที่นัดหมาย (YYYY-MM-DD) |
| `dateEnd` | string | Conditional | วันสิ้นสุด -- required เมื่อ entryMode = `period` |
| `timeStart` / `timeEnd` | string | Yes | เวลาเข้า-ออก (HH:MM) |
| `notifyOnCheckin` | boolean | No | default `true` -- เปิด/ปิดการแจ้งเตือนเมื่อ check-in |
| `groupId` | number | No | ผูกกับ AppointmentGroup (ถ้ามี) |
| `channel` | string | No | `web` / `line` / `kiosk` / `counter` |
| `companions` | number | No | จำนวนผู้ติดตาม |
| `companionNames` | array | No | รายชื่อผู้ติดตาม |
| `equipment` | array | No | อุปกรณ์ที่นำเข้า |

### Processing Flow

1. **Authentication** -- ตรวจสอบ `evms_session` cookie
2. **Rule Lookup** -- ค้นหา `visit_purpose_department_rules` ที่ตรง visitPurposeId + departmentId
3. **Channel Validation** -- ตรวจสอบว่า channel ที่ขอได้รับอนุญาต (`acceptFromWeb`, `acceptFromLine`, ...)
4. **Host Validation** -- ถ้า `rule.requirePersonName = true` ต้องระบุ `hostStaffId`
5. **Period Validation** -- ถ้า entryMode = `period`: ตรวจสอบว่า visitPurpose อนุญาต + dateEnd ถูกต้อง
6. **Blocklist Check** -- ตรวจสอบว่า visitor ไม่ถูกบล็อก
7. **Auto-approve Decision** -- ถ้า `rule.requireApproval = false` -> status = `approved`; มิฉะนั้น status = `pending`
8. **Booking Code Generation** -- รูปแบบ `eVMS-YYYYMMDD-XXXX`
9. **Create Record** -- บันทึก Appointment + Companions + Equipment + StatusLog ในครั้งเดียว

### Response

```json
{
  "success": true,
  "data": {
    "appointment": { ... },
    "autoApproved": true,
    "rule": {
      "requirePersonName": false,
      "requireApproval": false,
      "offerWifi": true,
      "approverGroupId": null
    }
  }
}
```

---

## Batch Creation with AppointmentGroup

### Endpoint

```
POST /api/appointments/batch
```

สิทธิ์: เฉพาะ staff / admin / supervisor (visitor ไม่อนุญาต)

### Request Body

```json
{
  "group": {
    "name": "คณะดูงานจาก XYZ",
    "visitPurposeId": 3,
    "departmentId": 5,
    "hostStaffId": 12,
    "entryMode": "single",
    "dateStart": "2026-04-10",
    "timeStart": "09:00",
    "timeEnd": "16:00",
    "notifyOnCheckin": true,
    "daySchedules": [
      { "date": "2026-04-10", "timeStart": "09:00", "timeEnd": "12:00", "notes": "ช่วงเช้า" },
      { "date": "2026-04-11", "timeStart": "13:00", "timeEnd": "16:00", "notes": "ช่วงบ่าย" }
    ]
  },
  "visitors": [
    { "firstName": "สมชาย", "lastName": "ใจดี", "company": "ABC Corp", "phone": "081-xxx-xxxx" },
    { "firstName": "สมหญิง", "lastName": "รักดี", "phone": "082-xxx-xxxx" }
  ]
}
```

### Processing Flow

1. ตรวจสอบ rule enforcement เดียวกับ single appointment
2. สร้าง `AppointmentGroup` record
3. สร้าง `AppointmentGroupDaySchedule` records (ถ้ามี)
4. สำหรับแต่ละ visitor: upsert visitor record -> สร้าง Appointment ผูกกับ group
5. ทั้งหมดอยู่ใน Prisma `$transaction` -- ถ้า fail จะ rollback ทั้งหมด
6. Visitor ที่ไม่มีชื่อจะถูก skip

### Response

```json
{
  "success": true,
  "data": {
    "group": { "id": 5, "name": "คณะดูงานจาก XYZ", ... },
    "created": 15,
    "skipped": 0,
    "autoApproved": true,
    "appointments": [...]
  }
}
```

---

## Period Mode

Period mode อนุญาตให้ผู้เยี่ยมชมเข้าได้หลายวันภายในช่วงวันที่ที่กำหนด (เช่น ผู้รับเหมา, ที่ปรึกษาประจำ)

### Validation Rules (enforced at `POST /api/entries`)

| Rule | Description |
|---|---|
| **Date Range** | ต้องอยู่ภายในช่วง `dateStart` - `dateEnd` |
| **Single Guard** | entryMode = `single` -> check-in ได้ 1 ครั้งเท่านั้น ตลอดอายุนัดหมาย |
| **Same-day Duplicate** | entryMode = `period` -> ไม่อนุญาตให้ check-in ซ้ำในวันเดียวกัน (ต้อง check-out ก่อน) |
| **Before Range** | ถ้ายังไม่ถึง dateStart -> error `BEFORE_DATE_RANGE` |
| **After Range** | ถ้าเลย dateEnd แล้ว -> error `APPOINTMENT_EXPIRED` (HTTP 410) |

### DaySchedule Override

สำหรับ batch/group ที่มี `daySchedules` -- เวลาเข้า-ออกจะแตกต่างกันในแต่ละวัน ส่งผลต่อ overstay detection:

```
Priority: DaySchedule (วันนั้นๆ) > Group default time > Appointment time > Business hours
```

---

## Auto-Approve Logic

การอนุมัติอัตโนมัติขึ้นอยู่กับ `visit_purpose_department_rules.require_approval`:

```
IF rule.requireApproval = false
  THEN status = "approved", approvedBy = staffId, approvedAt = now
  ELSE status = "pending"
```

เมื่อ auto-approve จะบันทึก StatusLog: "สร้างการนัดหมาย -- อนุมัติอัตโนมัติ (ไม่ต้องอนุมัติ)"

---

## Approval Flow

### Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/appointments/:id/approve` | อนุมัติ -- เปลี่ยนจาก `pending` -> `approved` |
| POST | `/api/appointments/:id/reject` | ปฏิเสธ -- เปลี่ยนจาก `pending` -> `rejected` |
| POST | `/api/appointments/:id/cancel` | ยกเลิก |

### Approval Process

1. ตรวจสอบว่า appointment อยู่ในสถานะ `pending`
2. อัปเดต status -> `approved`
3. บันทึก `approvedBy` (staff id), `approvedAt`
4. สร้าง `AppointmentStatusLog` (from: pending, to: approved)
5. (Optional) ส่ง notification ไปยัง visitor / creator

### Approval via Notification

เมื่อ `rule.requireApproval = true` ระบบจะ:
1. ค้นหา `approverGroupId` จาก rule
2. ค้นหาสมาชิกใน `ApproverGroup` ที่ `receiveNotification = true`
3. ส่ง notification type `approval-needed` ผ่าน LINE / Email ตาม `notifyChannels`
4. ผู้อนุมัติกดอนุมัติ/ปฏิเสธผ่าน LINE Rich Menu หรือ Web Dashboard

---

## Check-in Flow

### Endpoint

```
POST /api/entries
```

### Key Fields

| Field | Type | Description |
|---|---|---|
| `appointmentId` | number (optional) | ถ้ามี -> เช็คอินตามนัดหมาย; ถ้าไม่มี -> walk-in |
| `visitorId` | number | ผู้เยี่ยมชม |
| `checkinChannel` | string | `kiosk` / `counter` / `web` / `line` |
| `area`, `building`, `floor` | string | สถานที่เข้า |
| `idMethod` | string | วิธียืนยันตัวตน: `thai-id-card` / `passport` / `thai-id-app` |

### Check-in Validation Sequence

```
1. Verify visitor exists + not blocked
2. If appointmentId:
   a. Verify appointment exists + status = approved/pending
   b. Entry mode validation:
      - single: ไม่เคยมี entry -> OK
      - period: อยู่ในช่วงวัน + ไม่ซ้ำวันเดียวกัน
3. Generate entryCode: eVMS-ENTRY-YYYYMMDD-XXXX
4. Create VisitEntry record
5. Send check-in notification (async, non-blocking)
```

### Notification Trigger

หลัง check-in สำเร็จ ถ้า `appointmentId` มีค่า:
- ตรวจสอบ `appointment.notifyOnCheckin`
- ถ้า `true` -> ส่ง notification ให้ผู้สร้างนัดหมาย + host staff (ถ้าคนละคน)
- ช่องทาง: LINE (ถ้ามี lineUserId) + Email (ถ้ามี email)

---

## Arrival Dashboard

### Endpoint

```
GET /api/appointments/groups
```

แสดงข้อมูลกลุ่มนัดหมายพร้อมสถิติการมาถึงวันนี้:

```json
{
  "groups": [
    {
      "id": 5,
      "name": "คณะดูงานจาก XYZ",
      "totalExpected": 20,
      "stats": {
        "totalExpected": 20,
        "arrivedToday": 12,
        "notArrivedToday": 8
      },
      "_count": {
        "appointments": 20,
        "daySchedules": 3
      }
    }
  ]
}
```

### RBAC Scoping

| Role | Scope |
|---|---|
| `staff` | เห็นเฉพาะ group ที่ตนเองสร้าง |
| `supervisor` / `admin` | เห็นทุก group |
| `visitor` | ไม่อนุญาต (HTTP 403) |

---

## State Diagrams

### Appointment Status Lifecycle

```
                    +-- auto-approve ---> [approved] ---> [checked-in]
                    |                         |
[created] --> [pending] --+                   +---> [expired] (cron)
                    |     |
                    |     +-- reject -------> [rejected]
                    |
                    +-- approve ---------> [approved]
                    |
                    +-- cancel ----------> [cancelled]

[approved] ----- (เลยวัน dateStart/dateEnd) -----> [expired]
[pending]  ----- (เลยวัน dateStart/dateEnd) -----> [expired]
```

### Entry Mode State Flow

```
=== Single Mode ===
[approved] --check-in--> [VisitEntry created] ---(ไม่อนุญาตอีก)

=== Period Mode ===
[approved] --check-in Day 1--> [VisitEntry #1] --check-out-->
           --check-in Day 2--> [VisitEntry #2] --check-out-->
           ...
           --dateEnd passed--> [expired]
```

### AppointmentGroup Lifecycle

```
[active] --- (all appointments expired/cancelled) ---> [completed]
```

ตรวจสอบโดย `autoExpireAppointments()` ใน `lib/overstay-checker.ts`

---

## API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/appointments` | รายการนัดหมาย (RBAC scoped) |
| POST | `/api/appointments` | สร้างนัดหมายใหม่ |
| GET | `/api/appointments/:id` | ดูรายละเอียด |
| PATCH | `/api/appointments/:id` | แก้ไข |
| POST | `/api/appointments/:id/approve` | อนุมัติ |
| POST | `/api/appointments/:id/reject` | ปฏิเสธ |
| POST | `/api/appointments/:id/cancel` | ยกเลิก |
| PATCH | `/api/appointments/:id/notify` | เปิด/ปิด notifyOnCheckin |
| GET | `/api/appointments/:id/companions` | รายชื่อผู้ติดตาม |
| POST | `/api/appointments/batch` | สร้าง batch |
| GET | `/api/appointments/groups` | รายการกลุ่ม |
| GET | `/api/appointments/groups/:id` | รายละเอียดกลุ่ม |
| PATCH | `/api/appointments/groups/:id` | แก้ไขกลุ่ม |
| POST | `/api/entries` | Check-in |
| GET | `/api/entries` | รายการ entry |
| GET | `/api/entries/today` | entry วันนี้ |
| PATCH | `/api/entries/:id/checkout` | Check-out |

---

## Database Tables

| Table | Prisma Model | Description |
|---|---|---|
| `appointments` | `Appointment` | นัดหมายหลัก -- มี `notifyOnCheckin`, `groupId`, optional `hostStaffId`, `entryMode` |
| `appointment_groups` | `AppointmentGroup` | กลุ่มนัดหมาย (batch) -- มี `notifyOnCheckin`, `totalExpected` |
| `appointment_group_day_schedules` | `AppointmentGroupDaySchedule` | ตารางเวลาเฉพาะวัน -- unique constraint `[groupId, date]` |
| `appointment_companions` | `AppointmentCompanion` | ผู้ติดตาม |
| `appointment_equipment` | `AppointmentEquipment` | อุปกรณ์ |
| `appointment_status_logs` | `AppointmentStatusLog` | ประวัติการเปลี่ยนสถานะ |
| `visit_entries` | `VisitEntry` | บันทึกการเข้า (check-in/check-out) |
| `visitors` | `Visitor` | ข้อมูลผู้เยี่ยมชม |
| `visit_purpose_department_rules` | `VisitPurposeDepartmentRule` | กฎควบคุมต่อ purpose+department |
