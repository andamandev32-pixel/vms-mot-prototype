# Channel Integration Specification

> eVMS -- Visitor Management System  
> Version 1.0 | Last updated: 2026-04-02

---

## Table of Contents

1. [Overview](#overview)
2. [Channel Summary](#channel-summary)
3. [Web Portal](#web-portal)
4. [LINE OA](#line-oa)
5. [Kiosk](#kiosk)
6. [Counter](#counter)
7. [State Synchronization Table](#state-synchronization-table)
8. [Period Mode Cross-Channel Behavior](#period-mode-cross-channel-behavior)
9. [Channel Selection at API Level](#channel-selection-at-api-level)

---

## Overview

eVMS รองรับ 4 ช่องทาง (channels) ที่ผู้เยี่ยมชมและเจ้าหน้าที่สามารถสร้างนัดหมาย / check-in:

| Channel | Code | Primary User | Booking | Check-in |
|---|---|---|:---:|:---:|
| **Web Portal** | `web` | Staff / Admin | Yes | Yes (manual) |
| **LINE OA** | `line` | Visitor (self-service) | Yes | Yes (QR) |
| **Kiosk** | `kiosk` | Visitor (on-site) | Walk-in only | Yes |
| **Counter** | `counter` | Counter Staff | Yes | Yes |

ทุก channel เข้าถึง API เดียวกัน (`POST /api/appointments`, `POST /api/entries`) แต่มีพฤติกรรมและ state machine ที่แตกต่างกัน

---

## Web Portal

### Capabilities

- สร้างนัดหมายเดี่ยว (single) และ batch
- อนุมัติ / ปฏิเสธ / ยกเลิกนัดหมาย
- ดู Arrival Dashboard (group stats)
- จัดการ check-in / check-out (manual)
- ตั้งค่า rules, purposes, departments

### RBAC Roles

| Role | See | Create | Approve | Manage |
|---|---|---|---|---|
| `visitor` | Own appointments | Single (self) | No | No |
| `staff` | Own dept appointments | Single + Batch | No | No |
| `supervisor` | All | All | Yes | Limited |
| `admin` | All | All | Yes | Full |

### Web States (Appointment Lifecycle)

Web portal ไม่มี state machine แบบ linear -- ใช้ CRUD operations บน appointment status:

```
pending -> approved -> checked-in -> checked-out
pending -> rejected
pending -> cancelled
approved -> expired (auto)
approved -> cancelled
```

---

## LINE OA

### Capabilities

- Visitor self-service booking ผ่าน Rich Menu
- รับ notification (Flex Message): booking confirmed, approved, rejected, check-in alert
- Check-in ด้วย QR Code ที่ Kiosk
- ดูสถานะนัดหมาย
- ยกเลิกนัดหมาย

### LINE OA States (18 States)

LINE OA มี state flow ที่ครอบคลุมทั้ง conversation flow และ LIFF integration:

| # | State | Description |
|---|---|---|
| 1 | `IDLE` | Rich Menu แสดง -- รอ user กดเมนู |
| 2 | `MENU_BOOKING` | เลือกเมนู "จองนัดหมาย" |
| 3 | `SELECT_PURPOSE` | เลือกวัตถุประสงค์ (Flex Carousel) |
| 4 | `SELECT_DEPARTMENT` | เลือกแผนก |
| 5 | `SELECT_HOST` | เลือกผู้ที่ต้องการพบ (ถ้า requirePersonName) |
| 6 | `INPUT_DATE_TIME` | กรอกวันที่-เวลา (LIFF DatePicker) |
| 7 | `INPUT_VISITOR_INFO` | กรอกข้อมูลผู้เยี่ยมชม (LIFF Form) |
| 8 | `INPUT_PERIOD` | กรอก dateEnd (ถ้า period mode, LIFF) |
| 9 | `CONFIRM_BOOKING` | สรุปข้อมูล + ยืนยัน |
| 10 | `BOOKING_SUBMITTED` | ส่งแล้ว -- รอผล (pending/approved) |
| 11 | `BOOKING_APPROVED` | ได้รับอนุมัติ -- แสดง QR Code |
| 12 | `BOOKING_REJECTED` | ถูกปฏิเสธ -- แสดงเหตุผล |
| 13 | `VIEW_MY_BOOKINGS` | ดูรายการนัดหมายของตนเอง |
| 14 | `VIEW_BOOKING_DETAIL` | ดูรายละเอียด + QR Code |
| 15 | `CANCEL_CONFIRM` | ยืนยันยกเลิก |
| 16 | `CHECKIN_QR_SHOWN` | แสดง QR สำหรับ scan ที่ Kiosk |
| 17 | `CHECKIN_COMPLETE` | Check-in สำเร็จ (Flex: ยินดีต้อนรับ) |
| 18 | `NOTIFICATION_RECEIVED` | รับ push notification (alert/reminder) |

### LINE Flow Diagram

```
[IDLE]
  ├── กดเมนู "จองนัดหมาย" ──> [MENU_BOOKING] ──> [SELECT_PURPOSE]
  │     ──> [SELECT_DEPARTMENT] ──> [SELECT_HOST]* ──> [INPUT_DATE_TIME]
  │     ──> [INPUT_VISITOR_INFO] ──> [INPUT_PERIOD]* ──> [CONFIRM_BOOKING]
  │     ──> [BOOKING_SUBMITTED] ──> [BOOKING_APPROVED] / [BOOKING_REJECTED]
  │
  ├── กดเมนู "นัดหมายของฉัน" ──> [VIEW_MY_BOOKINGS] ──> [VIEW_BOOKING_DETAIL]
  │     ──> [CANCEL_CONFIRM] / [CHECKIN_QR_SHOWN]
  │
  └── รับ push ──> [NOTIFICATION_RECEIVED]
        ──> [CHECKIN_COMPLETE] (เมื่อ scan QR ที่ Kiosk สำเร็จ)

* = conditional states (ขึ้นอยู่กับ rules)
```

---

## Kiosk

### Capabilities

- Walk-in check-in (ไม่มีนัดหมายล่วงหน้า)
- Appointment check-in (scan QR หรือค้นหาด้วย ID)
- ถ่ายรูปผู้เยี่ยมชม
- ยืนยันตัวตนด้วยบัตรประชาชน / Passport / ThaiID App
- เสนอ WiFi
- พิมพ์ slip
- PDPA consent

### Kiosk States (14 + PENDING_APPROVAL = 15 States)

จาก `lib/kiosk/kiosk-types.ts` -- `KioskStateType`:

| # | State | Category | Description |
|---|---|---|---|
| 1 | `WELCOME` | Common | หน้าต้อนรับ -- เลือก Walk-in หรือ Appointment |
| 2 | `PDPA_CONSENT` | Common | ยินยอม PDPA ก่อนดำเนินการ |
| 3 | `SELECT_ID_METHOD` | Common | เลือกวิธียืนยันตัวตน (บัตร ปชช./Passport/ThaiID) |
| 4 | `ID_VERIFICATION` | Common | อ่านข้อมูลจากเอกสาร |
| 5 | `DATA_PREVIEW` | Common | ตรวจสอบข้อมูลที่อ่านได้ |
| 6 | `WIFI_OFFER` | Common | เสนอ WiFi (ถ้า rule.offerWifi = true) |
| 7 | `SUCCESS` | Common | สำเร็จ -- เลือกพิมพ์ slip หรือไม่ |
| 8 | `SELECT_PURPOSE` | Walk-in | เลือกวัตถุประสงค์ |
| 9 | `FACE_CAPTURE` | Walk-in | ถ่ายรูปใบหน้า |
| 10 | `QR_SCAN` | Appointment | Scan QR Code จาก LINE / Email |
| 11 | `APPOINTMENT_PREVIEW` | Appointment | แสดงรายละเอียดนัดหมาย |
| 12 | `APPOINTMENT_VERIFY_ID` | Appointment | ยืนยันตัวตนหลังดูนัดหมาย |
| 13 | `ERROR` | System | แสดง error + ปุ่ม retry |
| 14 | `TIMEOUT` | System | หมดเวลา -- กลับ WELCOME |
| 15 | `PENDING_APPROVAL` | Approval | Walk-in ที่ต้องรออนุมัติ real-time |

### Kiosk Walk-in Flow

```
[WELCOME] ──SELECT_WALKIN──> [PDPA_CONSENT] ──ACCEPT──> [SELECT_PURPOSE]
  ──SELECT_PURPOSE──> [SELECT_ID_METHOD] ──CHOOSE_ID──> [ID_VERIFICATION]
  ──ID_READ_SUCCESS──> [DATA_PREVIEW] ──CONFIRM──> [FACE_CAPTURE]
  ──FACE_CAPTURED──> [WIFI_OFFER]* ──ACCEPT/DECLINE──> [SUCCESS]

* ถ้า offerWifi = false: ข้าม WIFI_OFFER ไปที่ SUCCESS
```

### Kiosk Appointment Flow

```
[WELCOME] ──SELECT_APPOINTMENT──> [PDPA_CONSENT] ──ACCEPT──> [QR_SCAN]
  ├── QR_SCANNED ──> [APPOINTMENT_PREVIEW] ──CONFIRM──> [APPOINTMENT_VERIFY_ID]
  │     ──ID_READ_SUCCESS──> [FACE_CAPTURE] ──> [WIFI_OFFER] ──> [SUCCESS]
  │
  └── NO_QR_CODE ──> [SELECT_ID_METHOD] ──> [ID_VERIFICATION]
        ──ID_READ_SUCCESS──> [APPOINTMENT_PREVIEW] (ค้นหาจาก ID)
```

### Kiosk Approval Flow (Walk-in + requireApproval)

```
[SELECT_PURPOSE] ──(rule.requireApproval = true)──> [PENDING_APPROVAL]
  ├── APPOINTMENT_APPROVED ──> [FACE_CAPTURE] ──> ...
  ├── APPOINTMENT_REJECTED ──> [ERROR: "คำขอถูกปฏิเสธ กรุณาติดต่อเคาน์เตอร์"]
  └── TIMEOUT ──> [ERROR: "หมดเวลารออนุมัติ กรุณาติดต่อเคาน์เตอร์"]
```

### Hardware Devices per State

| State | Active Device |
|---|---|
| `QR_SCAN` | `qr-reader` |
| `ID_VERIFICATION` | `id-reader` / `passport-reader` |
| `FACE_CAPTURE` | `camera` |
| `SUCCESS` (print) | `printer` |

---

## Counter

### Capabilities

- สร้างนัดหมาย (single + batch)
- Check-in ผู้เยี่ยมชมโดยเจ้าหน้าที่
- Check-out
- อนุมัติ / ปฏิเสธนัดหมายที่ต้องอนุมัติ
- ยืนยันตัวตน (scan บัตร ปชช. + ถ่ายรูป)
- พิมพ์ slip
- จัดการ walk-in + PDPA

### Counter States (15 States)

| # | State | Description |
|---|---|---|
| 1 | `IDLE` | หน้าหลักเคาน์เตอร์ -- รอผู้เยี่ยมชม |
| 2 | `SELECT_MODE` | เลือก: นัดหมายล่วงหน้า / Walk-in |
| 3 | `SEARCH_APPOINTMENT` | ค้นหานัดหมาย (booking code, ชื่อ, เบอร์โทร) |
| 4 | `APPOINTMENT_DETAIL` | แสดงรายละเอียดนัดหมาย |
| 5 | `WALKIN_PURPOSE` | เลือกวัตถุประสงค์ (walk-in) |
| 6 | `WALKIN_FORM` | กรอกข้อมูล visitor (walk-in) |
| 7 | `ID_VERIFICATION` | Scan บัตร ปชช. / Passport |
| 8 | `FACE_CAPTURE` | ถ่ายรูปผู้เยี่ยมชม |
| 9 | `APPROVAL_REQUIRED` | แสดงว่าต้องอนุมัติ + ส่งคำขอ |
| 10 | `PENDING_APPROVAL` | รออนุมัติ (real-time) |
| 11 | `MANUAL_APPROVE` | เจ้าหน้าที่อนุมัติเอง (ถ้ามีสิทธิ์) |
| 12 | `WIFI_OFFER` | เสนอ WiFi |
| 13 | `CHECKIN_CONFIRM` | ยืนยัน check-in + เลือก area/building/floor |
| 14 | `PRINT_SLIP` | พิมพ์ slip |
| 15 | `COMPLETE` | สำเร็จ -- กลับ IDLE |

### Counter Differences from Kiosk

| Aspect | Kiosk | Counter |
|---|---|---|
| Operator | ผู้เยี่ยมชม (self-service) | เจ้าหน้าที่ |
| Walk-in booking | ไม่สร้าง appointment | สร้าง appointment ได้ |
| Approval | รอ real-time | อนุมัติเองได้ (ถ้ามีสิทธิ์) |
| Batch | ไม่รองรับ | รองรับ |
| Timeout | Auto-reset | ไม่มี timeout |
| PDPA | ผู้เยี่ยมชมกดยอมรับเอง | เจ้าหน้าที่อ่านและขอความยินยอม |

---

## State Synchronization Table

ตารางแสดง state mapping ข้าม channel สำหรับ appointment lifecycle เดียวกัน:

| Appointment Status | Web | LINE OA | Kiosk | Counter |
|---|---|---|---|---|
| **Created (pending)** | แสดงใน list "รอดำเนินการ" | `BOOKING_SUBMITTED` | N/A (kiosk ไม่สร้าง appointment) | แสดงใน queue |
| **Approved** | แสดง badge "อนุมัติแล้ว" | `BOOKING_APPROVED` + QR | Scan QR -> `APPOINTMENT_PREVIEW` | ค้นหาได้ใน `SEARCH_APPOINTMENT` |
| **Rejected** | แสดง badge "ถูกปฏิเสธ" | `BOOKING_REJECTED` + เหตุผล | N/A | แสดงเหตุผล |
| **Checked-in** | อัปเดตใน dashboard real-time | `CHECKIN_COMPLETE` push | `SUCCESS` screen | `COMPLETE` |
| **Overstay** | แสดง alert badge สีแดง | Push `overstay-alert` | N/A | แสดง alert ใน dashboard |
| **Expired** | แสดง badge "หมดอายุ" | Push `auto-cancelled` | Scan -> error "หมดอายุ" | แสดง "หมดอายุ" |
| **Cancelled** | แสดง badge "ยกเลิก" | Push notification | Scan -> error "ยกเลิก" | แสดง "ยกเลิก" |

### Real-time Sync Mechanism

| From | To | Mechanism |
|---|---|---|
| Web approve | LINE | Push Flex Message (`booking-approved`) |
| Web approve | Kiosk (PENDING_APPROVAL) | WebSocket / polling |
| Kiosk check-in | Web dashboard | Database poll / WebSocket |
| Kiosk check-in | LINE | Push Flex Message (`checkin-welcome`) |
| Counter check-in | Web dashboard | Database update (same API) |
| Cron overstay | All channels | Push notifications |

---

## Period Mode Cross-Channel Behavior

Period mode มีพฤติกรรมเฉพาะเมื่อใช้ข้าม channel:

### Booking Phase

| Aspect | Web | LINE | Kiosk | Counter |
|---|---|---|---|---|
| สร้าง period appointment | Yes (form) | Yes (LIFF) | No (walk-in only) | Yes (form) |
| กำหนด dateEnd | DatePicker | LIFF DatePicker | N/A | DatePicker |
| DaySchedule | Batch form | N/A | N/A | Batch form |

### Check-in Phase (Daily)

| Aspect | Behavior |
|---|---|
| **Kiosk scan QR** | ระบบตรวจ: วันนี้อยู่ในช่วง? + ยังไม่ check-in วันนี้? |
| **Counter search** | แสดง badge "Period: วันที่ X - Y" + สถานะ check-in วันนี้ |
| **LINE QR** | QR Code เดียวกันใช้ได้ทุกวันในช่วง |
| **Web manual** | Staff กด check-in + ระบบตรวจ period rules |

### Error Handling Cross-Channel

| Error | Kiosk Display | LINE Display | Counter Display |
|---|---|---|---|
| `SINGLE_ENTRY_USED` | "ใช้สิทธิ์ check-in แล้ว" | Flex: "นัดหมายนี้ check-in แล้ว" | Alert: "single mode -- ใช้แล้ว" |
| `BEFORE_DATE_RANGE` | "ยังไม่ถึงวันนัดหมาย" | Flex: "ยังไม่ถึงวัน" | Alert + วันเริ่ม |
| `APPOINTMENT_EXPIRED` | "นัดหมายหมดอายุแล้ว" | Flex: "หมดอายุ" | Alert + วันสิ้นสุด |
| `ALREADY_CHECKED_IN_TODAY` | "วันนี้ check-in แล้ว กรุณา check-out ก่อน" | Flex: "check-in แล้ววันนี้" | Alert + entry code |

---

## Channel Selection at API Level

### Appointment Creation

```
POST /api/appointments
Body: { ..., "channel": "web" | "line" | "kiosk" | "counter" }
```

ถ้าไม่ระบุ `channel`:
- visitor role -> default `"line"`
- staff/admin role -> default `"web"`

### Channel Validation

API ตรวจสอบ `visit_purpose_department_rules`:

```typescript
if (channel === "line" && !rule.acceptFromLine)
  -> 403: CHANNEL_BLOCKED
if (channel === "web" && !rule.acceptFromWeb)
  -> 403: CHANNEL_BLOCKED
if (channel === "kiosk" && !rule.acceptFromKiosk)
  -> 403: CHANNEL_BLOCKED
if (channel === "counter" && !rule.acceptFromCounter)
  -> 403: CHANNEL_BLOCKED
```

### Check-in Channel Tracking

```
POST /api/entries
Body: { ..., "checkinChannel": "kiosk" | "counter" | "web" | "line" }
```

บันทึกใน `visit_entries.checkin_channel` เพื่อ analytics:
- สถิติว่าผู้เยี่ยมชม check-in ผ่านช่องทางใดมากที่สุด
- ตรวจสอบว่า Kiosk ถูกใช้งานจริงหรือไม่
- รายงานประสิทธิภาพ Counter vs. Self-service

---

## Database Tables Related to Channels

| Table | Channel Relevance |
|---|---|
| `visit_purposes` | `show_on_line`, `show_on_web`, `show_on_kiosk`, `show_on_counter` |
| `visit_purpose_department_rules` | `accept_from_line`, `accept_from_web`, `accept_from_kiosk`, `accept_from_counter` |
| `visit_purpose_channel_configs` | Per-channel config: `require_photo`, document types |
| `visit_purpose_channel_documents` | เอกสารที่ยอมรับต่อ channel |
| `visit_entries` | `checkin_channel` -- track ว่า check-in จากช่องทางไหน |
| `visit_records` | `created_channel`, `checkin_channel` |
| `service_points` | Kiosk / Counter device mapping |
| `kiosk_device_configs` | (runtime) การตั้งค่า Kiosk แต่ละเครื่อง |
