# VMS Database Schema — Settings Module

> **สำหรับ DEV**: เอกสารนี้แสดง Schema ฐานข้อมูลทั้งหมดที่ใช้ในส่วนตั้งค่า (Settings)
> ออกแบบจาก Mock-up Data ที่ใช้ใน Prototype — พร้อมตัวอย่างข้อมูล Seed

---

## สารบัญ

| # | เมนู | ตาราง | Path |
|---|------|-------|------|
| 1 | [วัตถุประสงค์เข้าพื้นที่](#1-วัตถุประสงค์เข้าพื้นที่) | 4 ตาราง | `/web/settings/visit-purposes` |
| 2 | [สถานที่และแผนก](#2-สถานที่และแผนก) | 4 ตาราง | `/web/settings/locations` |
| 3 | [โซนเข้าพื้นที่](#3-โซนเข้าพื้นที่) | 6 ตาราง | `/web/settings/access-zones` |
| 4 | [กลุ่มผู้อนุมัติ](#4-กลุ่มผู้อนุมัติ) | 4 ตาราง | `/web/settings/approver-groups` |
| 5 | [จัดการพนักงาน](#5-จัดการพนักงาน) | 1 ตาราง | `/web/settings/staff` |
| 6 | [จุดให้บริการ Kiosk/Counter](#6-จุดให้บริการ-kioskcounter) | 3 ตาราง | `/web/settings/service-points` |
| 7 | [ประเภทเอกสาร](#7-ประเภทเอกสาร) | 3 ตาราง | `/web/settings/document-types` |
| 8 | [เวลาทำการ](#8-เวลาทำการ) | 1 ตาราง | `/web/settings/business-hours` |
| 9 | [เทมเพลตแจ้งเตือน](#9-เทมเพลตแจ้งเตือน) | 2 ตาราง | `/web/settings/notification-templates` |
| 10 | [แบบฟอร์ม Visit Slip](#10-แบบฟอร์ม-visit-slip) | 3 ตาราง | `/web/settings/visit-slips` |

**รวมทั้งหมด: 31 ตาราง**

---

## Entity Relationship Overview

```
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│     buildings         │────▶│       floors          │────▶│   access_zones       │
│  (อาคาร)              │     │  (ชั้น)                │     │  (โซน Hikvision)      │
└──────────────────────┘     └────────┬─────────────┘     └────────┬─────────────┘
                                      │                            │
                              floor_departments              access_group_zones
                                      │                            │
                              ┌───────▼────────────┐     ┌────────▼─────────────┐
                              │   departments       │     │   access_groups       │
                              │  (แผนก)              │     │  (กลุ่มสิทธิ์)        │
                              └───┬────┬────┬───────┘     └────────┬─────────────┘
                                  │    │    │                      │
                    ┌─────────────┘    │    └─────────┐    dept_access_mappings
                    │                  │              │            │
            ┌───────▼──────┐  ┌───────▼──────┐ ┌─────▼──────────┐│
            │    staff      │  │approver_groups│ │visit_purpose_  ││
            │  (พนักงาน)    │  │(กลุ่มผู้อนุมัติ)│ │dept_rules      ││
            └───────┬──────┘  └──────┬───────┘ └──────┬─────────┘│
                    │                │                │           │
                    │    approver_group_members        │           │
                    │    approver_group_purposes        │           │
                    │                │                │           │
            ┌───────▼──────┐  ┌──────▼───────┐ ┌─────▼──────────┐
            │service_points │  │notification_ │ │visit_purposes  │
            │(จุดบริการ)    │  │templates     │ │(วัตถุประสงค์)   │
            └──────────────┘  └──────────────┘ └──────┬─────────┘
                                                       │
                                               purpose_slip_mappings
                                                       │
                                               ┌──────▼─────────┐
                                               │visit_slip_      │
                                               │templates        │
                                               │(แบบฟอร์มบัตร)   │
                                               └────────────────┘
```

---

## 1. วัตถุประสงค์เข้าพื้นที่

**เมนู:** ตั้งค่าวัตถุประสงค์การเข้าพื้นที่
**Path:** `/web/settings/visit-purposes`
**คำอธิบาย:** กำหนดวัตถุประสงค์การเข้าพื้นที่ พร้อมเงื่อนไขแต่ละแผนก และช่องทางการเข้า (Kiosk/Counter)

### 1.1 `visit_purposes` — ตารางวัตถุประสงค์การเข้าพื้นที่หลัก

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสวัตถุประสงค์ (PK) | |
| name | VARCHAR(100) | ✗ | ชื่อวัตถุประสงค์ (ภาษาไทย) | |
| name_en | VARCHAR(100) | ✗ | ชื่อวัตถุประสงค์ (ภาษาอังกฤษ) | |
| icon | VARCHAR(10) | ✓ | ไอคอน Emoji แสดงหน้าเมนู | |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| sort_order | INT | ✗ | ลำดับการแสดงผล (1=แรกสุด) | |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (8 rows)</summary>

| id | name | name_en | icon | is_active | sort_order |
|----|------|---------|------|-----------|------------|
| vpc-1 | ติดต่อราชการ | Official Business | 🏛️ | ✅ | 1 |
| vpc-2 | ประชุม / สัมมนา | Meeting / Seminar | 📋 | ✅ | 2 |
| vpc-3 | ส่งเอกสาร / พัสดุ | Document / Parcel Delivery | 📄 | ✅ | 3 |
| vpc-4 | ผู้รับเหมา / ซ่อมบำรุง | Contractor / Maintenance | 🔧 | ✅ | 4 |
| vpc-5 | สมัครงาน / สัมภาษณ์ | Job Application / Interview | 💼 | ✅ | 5 |
| vpc-6 | เยี่ยมชม / ศึกษาดูงาน | Study Visit / Tour | 🎓 | ✅ | 6 |
| vpc-7 | รับ-ส่งสินค้า | Delivery / Pickup | 📦 | ✅ | 7 |
| vpc-8 | อื่นๆ | Other | 🔖 | ❌ | 8 |

</details>

### 1.2 `visit_purpose_department_rules` — เงื่อนไขการเข้าพื้นที่ แยกตามแผนก

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) | |
| visit_purpose_id 🔗 | VARCHAR(20) | ✗ | FK → visit_purposes.id | |
| department_id 🔗 | VARCHAR(20) | ✗ | FK → departments.id — แผนกที่ใช้กฎนี้ | |
| require_person_name | BOOLEAN | ✗ | ต้องระบุชื่อบุคคลที่ต้องการพบ | false |
| require_approval | BOOLEAN | ✗ | ต้องมีการอนุมัติก่อนเข้าพื้นที่ | false |
| approver_group_id 🔗 | VARCHAR(20) | ✓ | FK → approver_groups.id — กลุ่มผู้อนุมัติ | |
| offer_wifi | BOOLEAN | ✗ | เสนอ WiFi Credentials ให้ผู้เข้าเยี่ยม | false |
| show_on_line | BOOLEAN | ✗ | แสดงตัวเลือกนี้บน LINE OA + Web App | true |
| show_on_kiosk | BOOLEAN | ✗ | แสดงตัวเลือกนี้บน Kiosk | true |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |

<details>
<summary>📦 Seed Data (25 rows) — ตัวอย่างบางส่วน</summary>

| id | visit_purpose_id | department_id | require_person_name | require_approval | approver_group_id | offer_wifi | show_on_line | show_on_kiosk |
|----|-----------------|---------------|---------------------|-----------------|-------------------|-----------|-------------|---------------|
| 1 | vpc-1 | dept-1 | ✅ | ✅ | apg-1 | ✅ | ✅ | ✅ |
| 2 | vpc-1 | dept-2 | ✅ | ✅ | apg-3 | ✅ | ✅ | ✅ |
| 5 | vpc-1 | dept-5 | ✅ | ❌ | — | ✅ | ✅ | ✅ |
| 8 | vpc-2 | dept-1 | ✅ | ✅ | apg-1 | ✅ | ✅ | ✅ |
| 15 | vpc-4 | dept-2 | ❌ | ✅ | apg-4 | ❌ | ❌ | ✅ |

</details>

### 1.3 `visit_purpose_channel_configs` — ตั้งค่าช่องทางเข้า (Kiosk/Counter)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) | |
| visit_purpose_id 🔗 | VARCHAR(20) | ✗ | FK → visit_purposes.id | |
| channel | ENUM('kiosk','counter') | ✗ | ช่องทาง: kiosk / counter | |
| require_photo | BOOLEAN | ✗ | ต้องถ่ายภาพใบหน้า | false |

### 1.4 `visit_purpose_channel_documents` — เอกสารที่อนุญาตใช้ ณ แต่ละช่องทาง

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| channel_config_id 🔗 | INT | ✗ | FK → visit_purpose_channel_configs.id |
| identity_document_type_id 🔗 | VARCHAR(30) | ✗ | FK → identity_document_types.id |

**ความสัมพันธ์:**
- `visit_purposes` 1 ──→ N `visit_purpose_department_rules`
- `visit_purposes` 1 ──→ N `visit_purpose_channel_configs`
- `visit_purpose_channel_configs` 1 ──→ N `visit_purpose_channel_documents`
- `visit_purpose_department_rules` N ──→ 1 `departments`
- `visit_purpose_department_rules` N ──→ 1 `approver_groups`

---

## 2. สถานที่และแผนก

**เมนู:** ตั้งค่าสถานที่และแผนก
**Path:** `/web/settings/locations`
**คำอธิบาย:** จัดการอาคาร ชั้น และแผนก — รวมถึงการจับคู่แผนกกับชั้นที่ตั้ง

### 2.1 `buildings` — ตารางอาคาร

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสอาคาร (PK) | |
| name | VARCHAR(100) | ✗ | ชื่ออาคาร (ภาษาไทย) | |
| name_en | VARCHAR(100) | ✗ | ชื่ออาคาร (ภาษาอังกฤษ) | |
| total_floors | INT | ✗ | จำนวนชั้นทั้งหมด | |
| description | TEXT | ✓ | รายละเอียดเพิ่มเติม | |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |

<details>
<summary>📦 Seed Data (1 row)</summary>

| id | name | name_en | total_floors |
|----|------|---------|-------------|
| bld-C | ศูนย์ราชการ อาคาร C | Government Center Building C | 9 |

</details>

### 2.2 `floors` — ตารางชั้นในอาคาร

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสชั้น (PK) |
| building_id 🔗 | VARCHAR(20) | ✗ | FK → buildings.id |
| floor_number | INT | ✗ | หมายเลขชั้น (1, 2, 3, ...) |
| name | VARCHAR(150) | ✗ | ชื่อชั้น (ไทย) |
| name_en | VARCHAR(150) | ✗ | ชื่อชั้น (อังกฤษ) |

<details>
<summary>📦 Seed Data (9 rows)</summary>

| id | floor_number | name |
|----|-------------|------|
| fl-C1 | 1 | ชั้น 1 — ล็อบบี้ / ประชาสัมพันธ์ / รปภ. |
| fl-C2 | 2 | ชั้น 2 — กองกลาง |
| fl-C3 | 3 | ชั้น 3 — สำนักงานปลัด |
| fl-C4 | 4 | ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน |
| fl-C5 | 5 | ชั้น 5 — กองการต่างประเทศ |
| fl-C6 | 6 | ชั้น 6 — กรมการท่องเที่ยว / ททท. |
| fl-C7 | 7 | ชั้น 7 — กรมพลศึกษา / มกช. |
| fl-C8 | 8 | ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท. |
| fl-C9 | 9 | ชั้น 9 — สำนักงานรัฐมนตรี / ห้องประชุมอเนกประสงค์ |

</details>

### 2.3 `departments` — ตารางแผนก / หน่วยงาน

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสแผนก (PK) | |
| name | VARCHAR(200) | ✗ | ชื่อแผนก (ภาษาไทย) | |
| name_en | VARCHAR(200) | ✗ | ชื่อแผนก (ภาษาอังกฤษ) | |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |

<details>
<summary>📦 Seed Data (13 rows)</summary>

| id | name | name_en |
|----|------|---------|
| dept-1 | สำนักงานปลัดกระทรวง | Office of the Permanent Secretary |
| dept-2 | กองกลาง | General Administration Division |
| dept-3 | กองการต่างประเทศ | International Affairs Division |
| dept-4 | กองกิจการท่องเที่ยว | Tourism Affairs Division |
| dept-5 | กรมการท่องเที่ยว | Department of Tourism |
| dept-6 | กรมพลศึกษา | Department of Physical Education |
| dept-7 | การกีฬาแห่งประเทศไทย | Sports Authority of Thailand |
| dept-8 | สำนักนโยบายและแผน | Policy and Planning Division |
| dept-9 | สำนักงานรัฐมนตรี | Minister's Office |
| dept-10 | การท่องเที่ยวแห่งประเทศไทย | Tourism Authority of Thailand |
| dept-11 | มหาวิทยาลัยการกีฬาแห่งชาติ | National Sports University |
| dept-12 | กองบัญชาการตำรวจท่องเที่ยว | Tourist Police Bureau |
| dept-13 | อพท. | DASTA |

</details>

### 2.4 `floor_departments` — ตารางเชื่อม ชั้น ↔ แผนก (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| floor_id 🔗 | VARCHAR(20) | ✗ | FK → floors.id |
| department_id 🔗 | VARCHAR(20) | ✗ | FK → departments.id |

**ความสัมพันธ์:**
- `buildings` 1 ──→ N `floors`
- `floors` N ←──→ N `departments` ผ่าน `floor_departments`

---

## 3. โซนเข้าพื้นที่

**เมนู:** จัดการโซนเข้าพื้นที่ / Access Groups
**Path:** `/web/settings/access-zones`
**คำอธิบาย:** จัดการโซนเข้าพื้นที่ (ประตู Hikvision), กลุ่มสิทธิ์ (Access Groups), และการจับคู่แผนก

### 3.1 `access_zones` — ตารางโซน/พื้นที่ควบคุมด้วย Hikvision

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(30) | ✗ | รหัสโซน (PK) |
| name | VARCHAR(100) | ✗ | ชื่อโซน (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อโซน (ภาษาอังกฤษ) |
| floor_id 🔗 | VARCHAR(20) | ✗ | FK → floors.id |
| building_id 🔗 | VARCHAR(20) | ✗ | FK → buildings.id |
| type | ENUM | ✗ | ประเภทโซน: office / meeting-room / lobby / parking / common / restricted / service |
| hikvision_door_id 🔒 | VARCHAR(50) | ✗ | รหัสประตู Hikvision (UNIQUE) |
| description | TEXT | ✓ | รายละเอียดเพิ่มเติม |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน |

<details>
<summary>📦 Seed Data (20 rows)</summary>

| id | name | type | hikvision_door_id |
|----|------|------|-------------------|
| az-lobby | ล็อบบี้ ชั้น 1 | lobby | HIK-DOOR-C1-01 |
| az-parking | ลานจอดรถ | parking | HIK-DOOR-C1-PK |
| az-service | พื้นที่ซ่อมบำรุง | service | HIK-DOOR-C1-SVC |
| az-f2-office | สำนักงาน กองกลาง | office | HIK-DOOR-C2-01 |
| az-f2-meeting | ห้องประชุม ชั้น 2 | meeting-room | HIK-DOOR-C2-MR |
| az-f9-vip | สำนักงานรัฐมนตรี (VIP) | restricted | HIK-DOOR-C9-01 |
| ... | ... | ... | ... |

</details>

### 3.2 `access_groups` — กลุ่มสิทธิ์การเข้าพื้นที่

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสกลุ่ม (PK) |
| name / name_en | VARCHAR(100) | ✗ | ชื่อกลุ่ม |
| description | TEXT | ✗ | คำอธิบายขอบเขตการเข้าถึง |
| hikvision_group_id 🔒 | VARCHAR(50) | ✗ | รหัสกลุ่มบน Hikvision (UNIQUE) |
| qr_code_prefix | VARCHAR(20) | ✗ | Prefix QR Code เช่น VMS-GEN |
| validity_minutes | INT | ✗ | อายุ QR Code (นาที) |
| schedule_days_of_week | JSON | ✗ | วันที่อนุญาต [0=อา..6=ส] |
| schedule_start_time / end_time | TIME | ✗ | เวลาเริ่ม-สิ้นสุด |
| color | VARCHAR(10) | ✗ | สี Hex สำหรับ Badge |
| is_active | BOOLEAN | ✗ | สถานะ |

<details>
<summary>📦 Seed Data (9 rows)</summary>

| id | name | qr_code_prefix | validity_minutes | color |
|----|------|----------------|-----------------|-------|
| ag-1 | ผู้เยี่ยมชมทั่วไป | VMS-GEN | 60 | #6B7280 |
| ag-2 | ติดต่อราชการ ชั้น 2-5 | VMS-OFA | 120 | #6A0DAD |
| ag-3 | ติดต่อราชการ ชั้น 6 | VMS-OFB | 120 | #2563EB |
| ag-4 | ติดต่อราชการ ชั้น 7-8 | VMS-OFC | 120 | #059669 |
| ag-5 | ห้องประชุมรวม | VMS-MTG | 180 | #0891B2 |
| ag-6 | VIP — สำนักงานรัฐมนตรี | VMS-VIP | 60 | #DC2626 |
| ag-7 | ผู้รับเหมา / ซ่อมบำรุง | VMS-CTR | 240 | #92400E |
| ag-8 | ที่จอดรถ | VMS-PKG | 480 | #4B5563 |
| ag-9 | รับ-ส่งสินค้า | VMS-DLV | 30 | #7C3AED |

</details>

### 3.3 `access_group_zones` — กลุ่มสิทธิ์ ↔ โซน (M:N)

### 3.4 `access_group_visit_types` — กลุ่มสิทธิ์ ↔ ประเภทการเยี่ยม (M:N)

### 3.5 `department_access_mappings` — แผนก → กลุ่มสิทธิ์เริ่มต้น

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **department_id** 🔑🔗 | VARCHAR(20) | ✗ | FK → departments.id (PK) |
| default_access_group_id 🔗 | VARCHAR(20) | ✗ | FK → access_groups.id — กลุ่มสิทธิ์หลัก |

### 3.6 `department_additional_access_groups` — กลุ่มสิทธิ์เสริม (M:N)

**ความสัมพันธ์:**
- `access_zones` N ──→ 1 `floors` / `buildings`
- `access_groups` N ←──→ N `access_zones` ผ่าน `access_group_zones`
- `departments` 1 ──→ 1 `department_access_mappings` (default)
- `departments` 1 ──→ N `department_additional_access_groups` (เสริม)

---

## 4. กลุ่มผู้อนุมัติ

**เมนู:** กลุ่มผู้อนุมัติ
**Path:** `/web/settings/approver-groups`

### 4.1 `approver_groups` — ตารางกลุ่มผู้อนุมัติหลัก

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสกลุ่ม (PK) |
| name / name_en | VARCHAR(150) | ✗ | ชื่อกลุ่ม |
| description | TEXT | ✗ | คำอธิบายรายละเอียดกลุ่ม |
| department_id 🔗 | VARCHAR(20) | ✗ | FK → departments.id — แผนกที่กลุ่มนี้รับผิดชอบ |
| is_active | BOOLEAN | ✗ | สถานะ |

<details>
<summary>📦 Seed Data (10 rows)</summary>

| id | name | department_id |
|----|------|--------------|
| apg-1 | ผู้อนุมัติ สำนักงานปลัด (ราชการ+ประชุม) | dept-1 |
| apg-2 | ผู้อนุมัติ สำนักงานปลัด (อื่นๆ) | dept-1 |
| apg-3 | ผู้อนุมัติ กองกลาง (ราชการ+อื่นๆ) | dept-2 |
| apg-4 | ผู้อนุมัติ กองกลาง (ผู้รับเหมา) | dept-2 |
| apg-5 | ผู้อนุมัติ กองการต่างประเทศ | dept-3 |
| apg-6 | ผู้อนุมัติ กองกิจการท่องเที่ยว (ราชการ+เอกสาร) | dept-4 |
| apg-7 | ผู้อนุมัติ กองกิจการท่องเที่ยว (เยี่ยมชม) | dept-4 |
| apg-8 | ผู้อนุมัติ กรมการท่องเที่ยว (เยี่ยมชม) | dept-5 |
| apg-9 | ผู้อนุมัติ กรมพลศึกษา (ผู้รับเหมา) | dept-6 |
| apg-10 | ผู้อนุมัติ สำนักงานรัฐมนตรี (VIP) | dept-9 |

</details>

### 4.2 `approver_group_members` — สมาชิกในกลุ่มผู้อนุมัติ

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | SERIAL | ✗ | PK |
| approver_group_id 🔗 | VARCHAR(20) | ✗ | FK → approver_groups.id |
| staff_id 🔗 | VARCHAR(20) | ✗ | FK → staff.id |
| can_approve | BOOLEAN | ✗ | สามารถกดอนุมัติ/ปฏิเสธได้ |
| receive_notification | BOOLEAN | ✗ | ได้รับแจ้งเตือนเมื่อมีรายการใหม่ |

### 4.3 `approver_group_purposes` — กลุ่ม ↔ วัตถุประสงค์ (M:N)

### 4.4 `approver_group_notify_channels` — ช่องทางแจ้งเตือน

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| approver_group_id 🔗 | VARCHAR(20) | ✗ | FK → approver_groups.id |
| channel | ENUM('line','email','web-app') | ✗ | ช่องทางแจ้งเตือน |

---

## 5. จัดการพนักงาน

**เมนู:** จัดการพนักงาน
**Path:** `/web/settings/staff`

### 5.1 `staff` — ตารางพนักงาน / เจ้าหน้าที่

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสพนักงานในระบบ (PK) | |
| employee_id 🔒 | VARCHAR(20) | ✗ | รหัสพนักงาน (UNIQUE) | |
| name / name_en | VARCHAR(100) | ✗ | ชื่อ-นามสกุล | |
| position | VARCHAR(150) | ✗ | ตำแหน่ง | |
| department_id 🔗 | VARCHAR(20) | ✗ | FK → departments.id | |
| email | VARCHAR(100) | ✗ | อีเมลราชการ | |
| phone | VARCHAR(20) | ✗ | เบอร์โทรศัพท์ | |
| line_user_id | VARCHAR(50) | ✓ | LINE User ID | |
| avatar_url | VARCHAR(255) | ✓ | URL รูปโปรไฟล์ | |
| role | ENUM | ✗ | บทบาท: admin / supervisor / officer / staff / security | |
| status | ENUM | ✗ | สถานะ: active / inactive / locked | 'active' |
| shift | ENUM | ✓ | กะ: morning / afternoon / night (เฉพาะ security) | |

<details>
<summary>📦 Seed Data (10 rows)</summary>

| id | employee_id | name | role | status | shift |
|----|------------|------|------|--------|-------|
| staff-1 | EMP-001 | คุณสมศรี รักงาน | staff | active | — |
| staff-2 | EMP-002 | คุณประเสริฐ ศรีวิโล | staff | active | — |
| staff-3 | EMP-003 | คุณกมลพร วงศ์สวัสดิ์ | staff | active | — |
| staff-4 | EMP-004 | คุณวิภาดา ชัยมงคล | staff | active | — |
| staff-5 | EMP-005 | คุณอนันต์ มั่นคง | admin | active | — |
| staff-6 | SEC-001 | คุณสมชาย ปลอดภัย | security | active | morning |
| staff-7 | EMP-006 | คุณธนพล จิตรดี | staff | active | — |
| staff-8 | EMP-007 | คุณปิยะนุช สุขใจ | staff | active | — |
| staff-9 | EMP-008 | คุณนภดล เรืองศักดิ์ | staff | inactive | — |
| staff-10 | SEC-002 | คุณชัยวัฒน์ กล้าหาญ | security | inactive | night |

</details>

---

## 6. จุดให้บริการ Kiosk/Counter

**เมนู:** จัดการจุดให้บริการ
**Path:** `/web/settings/service-points`

### 6.1 `service_points` — ตารางจุดให้บริการ

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | รหัสจุดบริการ (PK) |
| name / name_en | VARCHAR(100) | ✗ | ชื่อจุดบริการ |
| type | ENUM('kiosk','counter') | ✗ | ประเภท |
| status | ENUM('online','offline','maintenance') | ✗ | สถานะปัจจุบัน |
| location / location_en | VARCHAR(150) | ✗ | ตำแหน่งที่ตั้ง |
| building / floor | VARCHAR | ✗ | อาคาร / ชั้น |
| ip_address | VARCHAR(15) | ✗ | IP Address |
| mac_address | VARCHAR(17) | ✗ | MAC Address |
| serial_number 🔒 | VARCHAR(30) | ✗ | Serial Number (UNIQUE) |
| today_transactions | INT | ✗ | ธุรกรรมวันนี้ |
| last_online | TIMESTAMP | ✓ | ออนไลน์ล่าสุด |
| assigned_staff_id 🔗 | VARCHAR(20) | ✓ | FK → staff.id (เฉพาะ counter) |
| notes | TEXT | ✓ | หมายเหตุ |
| is_active | BOOLEAN | ✗ | สถานะ |

### 6.2 `service_point_purposes` — จุดบริการ ↔ วัตถุประสงค์ (M:N)

### 6.3 `service_point_documents` — จุดบริการ ↔ เอกสาร (M:N)

<details>
<summary>📦 Seed Data (4 rows)</summary>

| id | name | type | status | serial_number |
|----|------|------|--------|---------------|
| sp-1 | ตู้ Kiosk ล็อบบี้หลัก | kiosk | online | KIOSK-2024-001 |
| sp-2 | ตู้ Kiosk ล็อบบี้ฝั่งตะวันออก | kiosk | offline | KIOSK-2024-002 |
| sp-3 | จุดบริการ Counter 1 | counter | online | CTR-2024-001 |
| sp-4 | จุดบริการ Counter 2 | counter | online | CTR-2024-002 |

</details>

---

## 7. ประเภทเอกสาร

**เมนู:** ตั้งค่าประเภทเอกสาร
**Path:** `/web/settings/document-types`

### 7.1 `identity_document_types` — เอกสารระบุตัวตนที่ Kiosk/Counter รับ

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(30) | ✗ | รหัสเอกสาร (PK) |
| name / name_en | VARCHAR(100) | ✗ | ชื่อเอกสาร |
| icon | VARCHAR(10) | ✓ | ไอคอน Emoji |
| is_active | BOOLEAN | ✗ | สถานะ |
| sort_order | INT | ✗ | ลำดับ |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | name | icon |
|----|------|------|
| doc-national-id | บัตรประจำตัวประชาชน | 🪪 |
| doc-passport | หนังสือเดินทาง (Passport) | 📕 |
| doc-driver-license | ใบขับขี่ | 🚗 |
| doc-gov-card | บัตรข้าราชการ / บัตรพนักงานรัฐ | 🏛️ |
| doc-thai-id-app | AppThaiID | 📱 |

</details>

### 7.2 `document_types` — เอกสารเพิ่มเติมที่ผู้เยี่ยมอาจต้องแนบ

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | PK |
| name / name_en | VARCHAR(100) | ✗ | ชื่อเอกสาร |
| category | ENUM | ✗ | หมวดหมู่: identification / authorization / vehicle / other |
| is_required | BOOLEAN | ✗ | จำเป็นต้องแนบ |
| require_photo | BOOLEAN | ✗ | ต้องถ่ายรูป |
| description | TEXT | ✓ | คำอธิบาย |

### 7.3 `document_type_visit_types` — เอกสาร ↔ ประเภทการเยี่ยม (M:N)

---

## 8. เวลาทำการ

**เมนู:** เวลาทำการ
**Path:** `/web/settings/business-hours`

### 8.1 `business_hours_rules` — กฎเวลาทำการ

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | PK |
| name / name_en | VARCHAR(100) | ✗ | ชื่อกฎ |
| type | ENUM('regular','special','holiday') | ✗ | ประเภท |
| days_of_week | JSON | ✓ | วันในสัปดาห์ (เฉพาะ regular) |
| specific_date | DATE | ✓ | วันที่เฉพาะ (เฉพาะ special/holiday) |
| open_time / close_time | TIME | ✗ | เวลาเปิด-ปิด (00:00 = ปิดทั้งวัน) |
| allow_walkin | BOOLEAN | ✗ | เปิดรับ Walk-in |
| allow_kiosk | BOOLEAN | ✗ | เปิดให้ Kiosk ลงทะเบียน |
| notes | TEXT | ✓ | หมายเหตุ |
| is_active | BOOLEAN | ✗ | สถานะ |

<details>
<summary>📦 Seed Data (6 rows)</summary>

| id | name | type | open_time | close_time | allow_walkin | allow_kiosk |
|----|------|------|-----------|------------|-------------|-------------|
| bh-1 | วันทำการปกติ (จ-ศ) | regular | 08:30 | 16:30 | ✅ | ✅ |
| bh-2 | วันเสาร์ (เปิดครึ่งวัน) | regular | 09:00 | 12:00 | ✅ | ✅ |
| bh-3 | วันอาทิตย์ (ปิด) | regular | 00:00 | 00:00 | ❌ | ❌ |
| bh-4 | วันจักรี | holiday | 00:00 | 00:00 | ❌ | ❌ |
| bh-5 | สงกรานต์ | holiday | 00:00 | 00:00 | ❌ | ❌ |
| bh-6 | งานสัมมนาพิเศษ | special | 07:00 | 20:00 | ✅ | ✅ |

</details>

---

## 9. เทมเพลตแจ้งเตือน

**เมนู:** ตั้งค่าเทมเพลตการแจ้งเตือน
**Path:** `/web/settings/notification-templates`

### 9.1 `notification_templates` — เทมเพลตแจ้งเตือน

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | PK |
| name / name_en | VARCHAR(100) | ✗ | ชื่อเทมเพลต |
| trigger_event | ENUM | ✗ | เหตุการณ์ที่ทำให้ส่ง |
| channel | ENUM('line','email','sms') | ✗ | ช่องทาง |
| subject | VARCHAR(200) | ✓ | หัวข้อ (เฉพาะ email) |
| body_th / body_en | TEXT | ✗ | เนื้อหา (ใช้ {{variable}}) |
| is_active | BOOLEAN | ✗ | สถานะ |

### 9.2 `notification_template_variables` — ตัวแปรของเทมเพลต

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| template_id 🔗 | VARCHAR(20) | ✗ | FK → notification_templates.id |
| variable_name | VARCHAR(50) | ✗ | ชื่อตัวแปร เช่น visitorName, bookingCode |

<details>
<summary>📦 Seed Data (8 templates)</summary>

| id | name | trigger | channel |
|----|------|---------|---------|
| nt-1 | แจ้งยืนยันจอง (LINE) | booking-confirmed | line |
| nt-2 | แจ้งอนุมัติ (LINE) | booking-approved | line |
| nt-3 | แจ้งไม่อนุมัติ (LINE) | booking-rejected | line |
| nt-4 | เตือนล่วงหน้า 1 วัน (LINE) | reminder-1day | line |
| nt-5 | ต้อนรับ Check-in (LINE) | checkin-welcome | line |
| nt-6 | แจ้งยืนยัน (Email) | booking-confirmed | email |
| nt-7 | แจ้งเตือนเกินเวลา (LINE) | overstay-alert | line |
| nt-8 | ข้อมูล WiFi (LINE) | wifi-credentials | line |

**ตัวแปรที่รองรับ:** `visitorName`, `bookingCode`, `date`, `time`, `location`, `approverName`, `reason`, `contactNumber`, `checkinTime`, `zone`, `checkoutTime`, `hostName`, `wifiSSID`, `wifiUsername`, `wifiPassword`, `expiry`

</details>

---

## 10. แบบฟอร์ม Visit Slip

**เมนู:** ตั้งค่าแบบฟอร์มบัตรผู้เยี่ยม
**Path:** `/web/settings/visit-slips`

### 10.1 `visit_slip_templates` — แบบฟอร์มบัตรผู้เยี่ยม

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | VARCHAR(20) | ✗ | PK |
| name / name_en | VARCHAR(100) | ✗ | ชื่อแบบฟอร์ม |
| description | TEXT | ✗ | คำอธิบายการใช้งาน |
| size | ENUM | ✗ | ขนาด: a4 / a5 / thermal-80mm / thermal-58mm / badge-card |
| orientation | ENUM | ✗ | แนวพิมพ์: portrait / landscape |
| show_logo / show_qr_code / show_photo / show_barcode | BOOLEAN | ✗ | องค์ประกอบที่แสดง |
| header_text / footer_text | VARCHAR(200) | ✗ | ข้อความหัว/ท้าย |
| is_default | BOOLEAN | ✗ | เป็นแบบฟอร์มเริ่มต้น |
| is_active | BOOLEAN | ✗ | สถานะ |
| preview_color | VARCHAR(10) | ✗ | สี Preview |

### 10.2 `visit_slip_fields` — ฟิลด์ข้อมูลบนบัตรผู้เยี่ยม

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | SERIAL | ✗ | PK |
| template_id 🔗 | VARCHAR(20) | ✗ | FK → visit_slip_templates.id |
| field_key | VARCHAR(30) | ✗ | Key เช่น visitorName, hostName |
| label / label_en | VARCHAR(80) | ✗ | ป้ายกำกับ |
| is_enabled | BOOLEAN | ✗ | เปิดแสดงในแบบฟอร์มนี้หรือไม่ |
| sort_order | INT | ✗ | ลำดับแสดงผล |

### 10.3 `purpose_slip_mappings` — วัตถุประสงค์ → แบบฟอร์ม

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **visit_purpose_id** 🔑🔗 | VARCHAR(20) | ✗ | FK → visit_purposes.id (PK) |
| slip_template_id 🔗 | VARCHAR(20) | ✓ | FK → visit_slip_templates.id (null = ใช้ default) |

<details>
<summary>📦 Seed Data — Mapping</summary>

| วัตถุประสงค์ | แบบฟอร์ม |
|-------------|---------|
| ติดต่อราชการ | ⭐ Default (แบบมาตรฐาน A5) |
| ประชุม / สัมมนา | Badge Card |
| ส่งเอกสาร / พัสดุ | Thermal 80mm |
| ผู้รับเหมา | Contractor Pass (A5) |
| สมัครงาน | ⭐ Default |
| เยี่ยมชม / ศึกษาดูงาน | VIP Pass (A5) |
| รับ-ส่งสินค้า | Thermal 80mm |
| อื่นๆ | ⭐ Default |

</details>

---

## Legend

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| 🔑 | Primary Key |
| 🔗 | Foreign Key |
| 🔒 | Unique Constraint |
| M:N | Many-to-Many relationship |
| ✅ / ❌ | true / false |
| ⭐ | Default value |

---

> **หมายเหตุ:** Schema นี้ออกแบบจาก Mock-up ของ Prototype สำหรับใช้สื่อสารกับทีม DEV
> สามารถดูรายละเอียด schema เต็มพร้อม seed data ได้ที่ `lib/database-schema.ts`
> หรือกดปุ่ม 🗄️ DB Schema ที่ header ของแต่ละหน้าตั้งค่าใน Web App
