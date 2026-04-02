# Notification System Specification

> eVMS -- Visitor Management System  
> Version 1.0 | Last updated: 2026-04-02

---

## Table of Contents

1. [Overview](#overview)
2. [Trigger Events](#trigger-events)
3. [Per-Appointment Toggle](#per-appointment-toggle)
4. [Channel Routing](#channel-routing)
5. [Overstay Detection Logic](#overstay-detection-logic)
6. [Auto-Expire Appointments](#auto-expire-appointments)
7. [Architecture](#architecture)
8. [API Reference](#api-reference)
9. [Database Tables](#database-tables)

---

## Overview

ระบบ notification ของ eVMS รับผิดชอบการส่งข้อความแจ้งเตือนผ่าน 3 ช่องทาง: LINE OA, Email และ Web-app โดยใช้ queue-based architecture (ปัจจุบันเป็น in-memory queue สำหรับ prototype, ออกแบบให้เปลี่ยนเป็น Redis/BullMQ ได้ในอนาคต)

Source code: `lib/notification-service.ts`, `lib/overstay-checker.ts`

---

## Trigger Events

ระบบรองรับ 10 ประเภท notification events:

| Event Type | Trigger Point | ผู้รับ | Description |
|---|---|---|---|
| `booking-confirmed` | สร้างนัดหมายสำเร็จ | Visitor | ยืนยันว่าระบบได้รับนัดหมายแล้ว |
| `approval-needed` | สร้างนัดหมายที่ต้องอนุมัติ | Approver Group members | แจ้งให้ผู้มีสิทธิ์อนุมัติตรวจสอบ |
| `booking-approved` | อนุมัตินัดหมาย | Visitor + Creator | แจ้งว่านัดหมายได้รับอนุมัติ |
| `booking-rejected` | ปฏิเสธนัดหมาย | Visitor + Creator | แจ้งว่านัดหมายถูกปฏิเสธ พร้อมเหตุผล |
| `checkin-alert` | Check-in สำเร็จ | Creator + Host Staff | แจ้งว่าผู้เยี่ยมชมมาถึงแล้ว |
| `checkin-welcome` | Check-in สำเร็จ | Visitor | ข้อความต้อนรับ + รายละเอียดสถานที่ |
| `overstay-alert` | ตรวจพบ overstay | Creator + Host + Admin | แจ้งว่าผู้เยี่ยมชมอยู่เกินเวลา |
| `auto-cancelled` | Auto-expire นัดหมาย | Visitor + Creator | แจ้งว่านัดหมายถูกยกเลิกอัตโนมัติ (เลยวัน) |
| `batch-summary` | สร้าง batch สำเร็จ | Creator | สรุปจำนวนนัดหมายที่สร้างใน batch |
| `reminder-1day` | 1 วันก่อนนัดหมาย | Visitor + Host | เตือนล่วงหน้า 1 วัน (cron job) |

### Event Type Definition (TypeScript)

```typescript
export interface NotificationPayload {
  type:
    | "booking-confirmed"
    | "approval-needed"
    | "booking-approved"
    | "booking-rejected"
    | "checkin-alert"
    | "checkin-welcome"
    | "overstay-alert"
    | "auto-cancelled"
    | "batch-summary";
  recipientStaffId?: number;
  recipientVisitorId?: number;
  recipientLineUserId?: string;
  recipientEmail?: string;
  channel?: "line" | "email" | "web-app";
  variables: Record<string, string>;
}
```

> หมายเหตุ: `reminder-1day` จะถูก trigger จาก cron job ภายนอก ไม่ผ่าน NotificationPayload type ปัจจุบัน

---

## Per-Appointment Toggle

### Field: `notifyOnCheckin`

ทุก Appointment มี field `notifyOnCheckin` (default: `true`) ที่ควบคุมว่าจะส่ง check-in notification หรือไม่

**ผลของ toggle:**

| `notifyOnCheckin` | Behavior |
|---|---|
| `true` | เมื่อ visitor check-in -> ส่ง `checkin-alert` ให้ creator + host |
| `false` | Silent mode -- ไม่ส่ง notification ใดๆ เมื่อ check-in |

### Toggle API

```
PATCH /api/appointments/:id/notify
Body: { "notifyOnCheckin": false }
```

สิทธิ์: เฉพาะ staff / admin / supervisor

### Code Implementation

จาก `lib/notification-service.ts`:

```typescript
export async function sendCheckinNotification(params: CheckinNotificationParams) {
  const appointment = await prisma.appointment.findUnique({ ... });
  if (!appointment) return;
  if (!appointment.notifyOnCheckin) return; // Silent mode -- หยุดทันที
  // ... ส่ง notification ต่อ
}
```

### Group-level Toggle

`AppointmentGroup` ก็มี `notifyOnCheckin` เช่นกัน (default: `false`)  
เมื่อสร้าง batch ค่านี้จะถูกคัดลอกไปยังแต่ละ Appointment ใน group

---

## Channel Routing

### Supported Channels

| Channel | Description | Recipient Lookup |
|---|---|---|
| `line` | LINE OA messaging | `staff.lineUserId` หรือ `visitor.lineUserId` |
| `email` | Email | `staff.email` หรือ `visitor.email` |
| `web-app` | In-app notification | `staff.id` (web dashboard) |

### Routing Logic

#### Check-in Alert Routing

```
1. Load appointment -> include createdByStaff, hostStaff
2. ถ้า notifyOnCheckin = false -> STOP
3. สำหรับ createdByStaff:
   a. ถ้ามี lineUserId -> enqueue (channel: line)
   b. ถ้ามี email -> enqueue (channel: email)
4. สำหรับ hostStaff (ถ้าคนละคนกับ creator):
   a. ถ้ามี lineUserId -> enqueue (channel: line)
```

#### Approval Notification Routing

```
1. Load ApproverGroup -> include members (where receiveNotification = true)
2. Load notifyChannels ของ group
3. สำหรับแต่ละ member:
   a. ถ้า notifyChannels มี "line" + member มี lineUserId -> enqueue
   b. ถ้า notifyChannels มี "email" + member มี email -> enqueue
```

### Variables Template

แต่ละ notification type มี variables ที่ต่างกัน:

| Event Type | Variables |
|---|---|
| `checkin-alert` | `visitorName`, `checkinTime`, `entryCode`, `location`, `groupName` |
| `approval-needed` | `visitorName`, `company`, `purpose`, `bookingCode` |
| `overstay-alert` | `visitorName`, `company`, `checkinAt`, `expectedCheckout`, `overstayDuration`, `location`, `groupName` |

---

## Overstay Detection Logic

### Overview

ระบบ overstay checker (`lib/overstay-checker.ts`) ทำงานผ่าน cron job ทุก 15 นาที ตรวจสอบ VisitEntry ที่ยัง checked-in อยู่และเลยเวลาที่ควร check-out

### Expected Checkout Time Resolution

ระบบใช้ priority chain ในการหาเวลาสิ้นสุด:

```
Priority 1: AppointmentGroupDaySchedule (เฉพาะวัน)
    ↓ ถ้าไม่มี
Priority 2: AppointmentGroup.timeEnd (default ของ group)
    ↓ ถ้าไม่อยู่ใน group
Priority 3: Appointment.timeEnd
    ↓ ถ้าเป็น walk-in (ไม่มี appointment)
Priority 4: BusinessHoursRule.closeTime (เวลาปิดทำการ)
```

### Resolution Flow (Pseudocode)

```
function resolveExpectedCheckout(entry):
  today = entry.checkinAt.toDate()
  
  if entry.appointmentId:
    appointment = load appointment with group + daySchedules
    
    // Priority 1: DaySchedule สำหรับวันนี้
    if appointment.group?.daySchedules has today:
      return daySchedule.timeEnd (source: "daySchedule (YYYY-MM-DD)")
    
    // Priority 2: Group default
    if appointment.group:
      return group.timeEnd (source: "group default")
    
    // Priority 3: Appointment
    return appointment.timeEnd (source: "appointment")
  
  // Priority 4: Business hours (walk-in)
  businessRule = load BusinessHoursRule (type: "regular", isActive: true)
  if businessRule:
    return businessRule.closeTime (source: "business hours")
  
  return null  // ไม่สามารถหาเวลาได้
```

### Detection Process

```typescript
export async function checkOverstayEntries(): Promise<{
  checked: number;
  overstay: number;
  notified: number;
}>
```

1. ค้นหา VisitEntry ทั้งหมดที่ `status = "checked-in"` AND `checkoutAt = null`
2. สำหรับแต่ละ entry -> resolve expected checkout time
3. ถ้า `now > expectedCheckout`:
   - อัปเดต `visitEntry.status` -> `"overstay"`
   - คำนวณระยะเวลาเกิน (แสดงเป็น "X ชม. Y นาที")
   - ส่ง `overstay-alert` notification
4. Return สรุป: จำนวนที่ตรวจ, overstay, แจ้งเตือนแล้ว

### Overstay Alert Payload

```typescript
{
  type: "overstay-alert",
  variables: {
    visitorName: "สมชาย ใจดี",
    company: "ABC Corp",
    checkinAt: "09:30",
    expectedCheckout: "16:00",
    overstayDuration: "1 ชม. 15 นาที",
    location: "อาคาร A ชั้น 3",
    groupName: "คณะดูงาน XYZ"
  }
}
```

---

## Auto-Expire Appointments

### Function

```typescript
export async function autoExpireAppointments(): Promise<number>
```

เรียกจาก cron job เดียวกับ overstay checker

### Logic

1. **Single mode**: ถ้า `dateStart < today` AND status = `approved`/`pending` -> status = `expired`
2. **Period mode**: ถ้า `dateEnd < today` AND status = `approved`/`pending`/`confirmed` -> status = `expired`
3. **Group completion**: ถ้าทุก appointment ใน group เป็น `expired`/`cancelled` -> group status = `completed`

---

## Architecture

### Current Implementation (Prototype)

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  API Routes  │────>│  notification-       │────>│  In-Memory   │
│  (triggers)  │     │  service.ts          │     │  Queue       │
└──────────────┘     │  - sendCheckin...    │     └──────────────┘
                     │  - sendApproval...   │
                     │  - sendOverstay...   │
                     └─────────────────────┘

┌──────────────┐     ┌─────────────────────┐
│  Cron Job    │────>│  overstay-checker.ts │
│  (15 min)    │     │  - checkOverstay...  │
│              │     │  - autoExpire...     │
│              │     └─────────────────────┘
└──────────────┘
```

### Production Target Architecture

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  API Routes  │────>│  notification-       │────>│  Redis/SQS/  │
│  (triggers)  │     │  service.ts          │     │  BullMQ      │
└──────────────┘     └─────────────────────┘     └──────┬───────┘
                                                        │
                     ┌──────────────────────────────────┘
                     ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │  LINE OA     │  │  Email        │  │  Web-App     │
              │  Worker      │  │  Worker       │  │  Worker      │
              │  (Flex Msg)  │  │  (SMTP/SES)   │  │  (WebSocket) │
              └──────────────┘  └──────────────┘  └──────────────┘
```

### Key Design Decisions

1. **Non-blocking** -- notification ส่งแบบ async ไม่ block API response (`.catch()` error handling)
2. **Per-appointment control** -- `notifyOnCheckin` ให้ staff ปิดเสียงเป็นรายนัดหมาย
3. **Multi-channel** -- staff 1 คนอาจได้รับทั้ง LINE + Email สำหรับ event เดียวกัน
4. **Deduplication** -- hostStaff จะไม่ได้รับซ้ำถ้าเป็นคนเดียวกับ creator (`hostStaffId !== createdByStaffId`)
5. **Approver granularity** -- สมาชิก approver group เลือกรับ notification ได้ (`receiveNotification`)

---

## API Reference

| Method | Endpoint | Related Notifications |
|---|---|---|
| POST | `/api/appointments` | `booking-confirmed`, `approval-needed` |
| POST | `/api/appointments/batch` | `batch-summary`, `approval-needed` |
| POST | `/api/appointments/:id/approve` | `booking-approved` |
| POST | `/api/appointments/:id/reject` | `booking-rejected` |
| POST | `/api/entries` | `checkin-alert`, `checkin-welcome` |
| PATCH | `/api/appointments/:id/notify` | Toggle `notifyOnCheckin` |

---

## Database Tables

| Table | Prisma Model | Notification Role |
|---|---|---|
| `appointments` | `Appointment` | `notifyOnCheckin` flag; ผูก visitor, creator, host |
| `appointment_groups` | `AppointmentGroup` | `notifyOnCheckin` default สำหรับ batch |
| `appointment_group_day_schedules` | `AppointmentGroupDaySchedule` | กำหนดเวลาสิ้นสุดเฉพาะวัน (overstay priority 1) |
| `visit_entries` | `VisitEntry` | `status` track overstay; `checkinAt` trigger notification |
| `approver_groups` | `ApproverGroup` | กลุ่มผู้อนุมัติ |
| `approver_group_members` | `ApproverGroupMember` | `receiveNotification` flag ต่อสมาชิก |
| `approver_group_notify_channels` | `ApproverGroupNotifyChannel` | ช่องทางที่ group ใช้ (line/email) |
| `staff` | `Staff` | `lineUserId`, `email` สำหรับ routing |
| `visitors` | `Visitor` | `lineUserId`, `email` สำหรับ routing |
| `business_hours_rules` | `BusinessHoursRule` | เวลาปิดทำการ (overstay priority 4) |
| `line_flex_templates` | `LineFlexTemplate` | template สำหรับ LINE Flex Message |
