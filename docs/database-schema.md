# eVMS Database Schema — Settings Module

> **สำหรับ DEV**: เอกสารนี้แสดง Schema ฐานข้อมูลทั้งหมดที่ใช้ในส่วนตั้งค่า (Settings)
> ออกแบบจาก Mock-up Data ที่ใช้ใน Prototype — พร้อมตัวอย่างข้อมูล Seed
> **Auto-generated from `lib/database-schema.ts`** — อย่าแก้ไขไฟล์นี้โดยตรง

---

## สารบัญ

| # | เมนู | ตาราง | Path |
|---|------|-------|------|
| 1 | [วัตถุประสงค์เข้าพื้นที่](#1-วัตถุประสงค์เข้าพื้นที่) | 4 ตาราง | `/web/settings/visit-purposes` |
| 2 | [สถานที่และแผนก](#2-สถานที่และแผนก) | 4 ตาราง | `/web/settings/locations` |
| 3 | [โซนเข้าพื้นที่](#3-โซนเข้าพื้นที่) | 6 ตาราง | `/web/settings/access-zones` |
| 4 | [กลุ่มผู้อนุมัติ](#4-กลุ่มผู้อนุมัติ) | 4 ตาราง | `/web/settings/approver-groups` |
| 5 | [จัดการพนักงาน](#5-จัดการพนักงาน) | 1 ตาราง | `/web/settings/staff` |
| 6 | [จุดให้บริการ Kiosk/Counter](#6-จุดให้บริการ-KioskCounter) | 4 ตาราง | `/web/settings/service-points` |
| 7 | [ประเภทเอกสาร](#7-ประเภทเอกสาร) | 3 ตาราง | `/web/settings/document-types` |
| 8 | [เวลาทำการ](#8-เวลาทำการ) | 1 ตาราง | `/web/settings/business-hours` |
| 9 | [เทมเพลตแจ้งเตือน](#9-เทมเพลตแจ้งเตือน) | 2 ตาราง | `/web/settings/notification-templates` |
| 10 | [แบบฟอร์ม Visit Slip](#10-แบบฟอร์ม-Visit-Slip) | 4 ตาราง | `/web/settings/visit-slips` |
| 11 | [PDPA / นโยบายคุ้มครองข้อมูล](#11-PDPA--นโยบายคุ้มครองข้อมูล) | 3 ตาราง | `/web/settings/pdpa-consent` |
| 12 | [ข้อมูลธุรกรรมการเข้าพื้นที่](#12-ข้อมูลธุรกรรมการเข้าพื้นที่) | 1 ตาราง | `/web/appointments` |
| 13 | [การนัดหมาย](#13-การนัดหมาย) | 6 ตาราง | `/web/appointments` |
| 14 | [บันทึกการเข้าพื้นที่](#14-บันทึกการเข้าพื้นที่) | 1 ตาราง | `/web/visit-entries` |
| 15 | [ภาพรวม](#15-ภาพรวม) | 4 ตาราง | `/web/dashboard` |
| 16 | [ค้นหาผู้ติดต่อ](#16-ค้นหาผู้ติดต่อ) | 2 ตาราง | `/web/search` |
| 17 | [Blocklist](#17-Blocklist) | 2 ตาราง | `/web/blocklist` |
| 18 | [รายงาน](#18-รายงาน) | 3 ตาราง | `/web/reports` |
| 19 | [ระบบผู้ใช้งาน](#19-ระบบผู้ใช้งาน) | 2 ตาราง | `/web/settings/staff` |
| 20 | [ตั้งค่าอีเมลระบบ](#20-ตั้งค่าอีเมลระบบ) | 1 ตาราง | `/web/settings/email-system` |
| 21 | [ตั้งค่า LINE OA](#21-ตั้งค่า-LINE-OA) | 1 ตาราง | `/web/settings/line-oa-config` |
| 22 | [โปรไฟล์ของฉัน](#22-โปรไฟล์ของฉัน) | 1 ตาราง | `/web/profile` |
| 23 | [LINE OA & การแจ้งเตือน](#23-LINE-OA-&-การแจ้งเตือน) | 5 ตาราง | `/web/settings/line-message-templates` |
| 24 | [กลุ่มนัดหมาย (Batch/Period)](#24-กลุ่มนัดหมาย-BatchPeriod) | 2 ตาราง | `/web/appointments/groups` |

**รวมทั้งหมด: 67 ตาราง**

---

## 1. วัตถุประสงค์เข้าพื้นที่

**เมนู:** วัตถุประสงค์เข้าพื้นที่
**Path:** `/web/settings/visit-purposes`
**คำอธิบาย:** กำหนดวัตถุประสงค์การเข้าพื้นที่ พร้อมเงื่อนไขแต่ละแผนก และช่องทางการเข้า (Kiosk/Counter)

### 1.1 `visit_purposes` — ตารางวัตถุประสงค์การเข้าพื้นที่หลัก

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสวัตถุประสงค์ (PK) |
| name | VARCHAR(100) | ✗ | ชื่อวัตถุประสงค์ (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อวัตถุประสงค์ (ภาษาอังกฤษ) |
| icon | VARCHAR(10) | ✓ | ไอคอน Emoji แสดงหน้าเมนู |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| show_on_line | BOOLEAN | ✗ | แสดงวัตถุประสงค์นี้บน LINE OA | true |
| show_on_web | BOOLEAN | ✗ | แสดงวัตถุประสงค์นี้บน Web App | true |
| show_on_kiosk | BOOLEAN | ✗ | แสดงวัตถุประสงค์นี้บน Kiosk | true |
| show_on_counter | BOOLEAN | ✗ | แสดงวัตถุประสงค์นี้บน Counter | true |
| allowed_entry_modes | VARCHAR(50) | ✗ | ประเภทการเข้าพื้นที่ที่อนุญาต (comma-separated: single,period) | 'single' |
| sort_order | INT | ✗ | ลำดับการแสดงผล (1=แรกสุด) |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (8 rows)</summary>

| id | name | name_en | icon | is_active | show_on_line | show_on_web | show_on_kiosk | show_on_counter | allowed_entry_modes | sort_order |
|----|----|----|----|----|----|----|----|----|----|----|
| 1 | ติดต่อราชการ | Official Business | 🏛️ | ✅ | ✅ | ✅ | ✅ | ✅ | single,period | 1 |
| 2 | ประชุม / สัมมนา | Meeting / Seminar | 📋 | ✅ | ✅ | ✅ | ✅ | ✅ | single,period | 2 |
| 3 | ส่งเอกสาร / พัสดุ | Document / Parcel Delivery | 📄 | ✅ | ✅ | ✅ | ✅ | ✅ | single | 3 |
| 4 | ผู้รับเหมา / ซ่อมบำรุง | Contractor / Maintenance | 🔧 | ✅ | ❌ | ❌ | ✅ | ✅ | single,period | 4 |
| 5 | สมัครงาน / สัมภาษณ์ | Job Application / Interview | 💼 | ✅ | ✅ | ✅ | ✅ | ✅ | single | 5 |
| 6 | เยี่ยมชม / ศึกษาดูงาน | Study Visit / Tour | 🎓 | ✅ | ✅ | ✅ | ❌ | ✅ | single,period | 6 |
| 7 | รับ-ส่งสินค้า | Delivery / Pickup | 📦 | ✅ | ❌ | ❌ | ✅ | ✅ | single | 7 |
| 8 | อื่นๆ | Other | 🔖 | ❌ | ✅ | ✅ | ✅ | ✅ | single | 8 |

</details>

### 1.2 `visit_purpose_department_rules` — เงื่อนไขการเข้าพื้นที่ แยกตามแผนก (ของแต่ละวัตถุประสงค์)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| visit_purpose_id 🔗 | INT | ✗ | FK → visit_purposes.id |
| department_id 🔗 | INT | ✗ | FK → departments.id — แผนกที่ใช้กฎนี้ |
| require_person_name | BOOLEAN | ✗ | ต้องระบุชื่อบุคคลที่ต้องการพบ | false |
| require_approval | BOOLEAN | ✗ | ต้องมีการอนุมัติก่อนเข้าพื้นที่ | false |
| approver_group_id 🔗 | INT | ✓ | FK → approver_groups.id — กลุ่มผู้อนุมัติ (ใช้เมื่อ require_approval=true) |
| offer_wifi | BOOLEAN | ✗ | เสนอ WiFi Credentials ให้ผู้เข้าเยี่ยม | false |
| accept_from_line | BOOLEAN | ✗ | แผนกนี้รับจาก LINE OA | true |
| accept_from_web | BOOLEAN | ✗ | แผนกนี้รับจาก Web App | true |
| accept_from_kiosk | BOOLEAN | ✗ | แผนกนี้รับจาก Kiosk | true |
| accept_from_counter | BOOLEAN | ✗ | แผนกนี้รับจาก Counter | true |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |

<details>
<summary>📦 Seed Data (25 rows — แสดง 10 แรก)</summary>

| id | visit_purpose_id | department_id | require_person_name | require_approval | approver_group_id | offer_wifi | accept_from_line | accept_from_web | accept_from_kiosk | accept_from_counter | is_active |
|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | 1 | 1 | ✅ | ✅ | 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | 1 | 2 | ✅ | ✅ | 3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | 1 | 3 | ✅ | ✅ | 5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | 1 | 4 | ✅ | ✅ | 6 | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 5 | 1 | 5 | ✅ | ❌ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | 1 | 8 | ❌ | ❌ | — | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | 1 | 9 | ✅ | ✅ | 10 | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 8 | 2 | 1 | ✅ | ✅ | 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | 2 | 3 | ✅ | ✅ | 5 | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 10 | 2 | 4 | ✅ | ❌ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*(... อีก 15 rows)*
</details>

### 1.3 `visit_purpose_channel_configs` — ตั้งค่าช่องทางเข้า (Kiosk / Counter) ของแต่ละวัตถุประสงค์ — เอกสารที่รับ และการถ่ายรูป

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| visit_purpose_id 🔗 | INT | ✗ | FK → visit_purposes.id |
| channel | ENUM('kiosk','counter') | ✗ | ช่องทาง: kiosk = ตู้อัตโนมัติ / counter = เคาน์เตอร์ รปภ. |
| require_photo | BOOLEAN | ✗ | ต้องถ่ายภาพใบหน้า | false |

<details>
<summary>📦 Seed Data (16 rows — แสดง 10 แรก)</summary>

| id | visit_purpose_id | channel | require_photo |
|----|----|----|----|
| 1 | 1 | kiosk | ✅ |
| 2 | 1 | counter | ✅ |
| 3 | 2 | kiosk | ✅ |
| 4 | 2 | counter | ❌ |
| 5 | 3 | kiosk | ✅ |
| 6 | 3 | counter | ❌ |
| 7 | 4 | kiosk | ✅ |
| 8 | 4 | counter | ✅ |
| 9 | 5 | kiosk | ✅ |
| 10 | 5 | counter | ✅ |

*(... อีก 6 rows)*
</details>

### 1.4 `visit_purpose_channel_documents` — เอกสารที่อนุญาตใช้ ณ แต่ละช่องทาง(Kiosk/Counter) ของแต่ละวัตถุประสงค์ (many-to-many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **channel_config_id** 🔑 | INT | ✗ | FK → visit_purpose_channel_configs.id |
| **identity_document_type_id** 🔑 | INT | ✗ | FK → identity_document_types.id — ประเภทเอกสารที่รับ |

<details>
<summary>📦 Seed Data (9 rows)</summary>

| channel_config_id | identity_document_type_id |
|----|----|
| 1 | 1 |
| 1 | 2 |
| 1 | 4 |
| 1 | 5 |
| 2 | 1 |
| 2 | 2 |
| 2 | 3 |
| 2 | 4 |
| 2 | 5 |

</details>

**ความสัมพันธ์:**
- visit_purposes 1 ──→ N visit_purpose_department_rules (แต่ละวัตถุประสงค์มีเงื่อนไขหลายแผนก)
- visit_purposes 1 ──→ N visit_purpose_channel_configs (แต่ละวัตถุประสงค์มีตั้งค่า Kiosk + Counter)
- visit_purpose_channel_configs 1 ──→ N visit_purpose_channel_documents (แต่ละช่องทางรับเอกสารหลายประเภท)
- visit_purpose_department_rules N ──→ 1 departments (เงื่อนไขผูกกับแผนก)
- visit_purpose_department_rules N ──→ 1 approver_groups (กฎที่ต้องอนุมัติ อ้างอิงกลุ่มผู้อนุมัติ)

---
## 2. สถานที่และแผนก

**เมนู:** สถานที่และแผนก
**Path:** `/web/settings/locations`
**คำอธิบาย:** จัดการอาคาร ชั้น และแผนก — รวมถึงการจับคู่แผนกกับชั้นที่ตั้ง

### 2.1 `buildings` — ตารางอาคาร (ในโปรเจกต์นี้มีอาคารเดียว)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสอาคาร (PK) |
| name | VARCHAR(100) | ✗ | ชื่ออาคาร (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่ออาคาร (ภาษาอังกฤษ) |
| total_floors | INT | ✗ | จำนวนชั้นทั้งหมด |
| description | TEXT | ✓ | รายละเอียดเพิ่มเติม |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | name | name_en | total_floors | description | is_active |
|----|----|----|----|----|----|
| 1 | ศูนย์ราชการ อาคาร C | Government Center Building C | 9 | กระทรวงการท่องเที่ยวและกีฬา — ทุกหน่วยงานในตึกเดียว | ✅ |

</details>

### 2.2 `floors` — ตารางชั้นในอาคาร

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | SERIAL | ✗ | รหัสชั้น (PK) |
| building_id 🔗 | INT | ✗ | FK → buildings.id — อาคารที่ชั้นนี้อยู่ |
| floor_number | INT | ✗ | หมายเลขชั้น (1, 2, 3, ...) |
| name | VARCHAR(150) | ✗ | ชื่อชั้น (ไทย) เช่น 'ชั้น 1 — ล็อบบี้' |
| name_en | VARCHAR(150) | ✗ | ชื่อชั้น (อังกฤษ) |

<details>
<summary>📦 Seed Data (9 rows)</summary>

| id | building_id | floor_number | name | name_en |
|----|----|----|----|----|
| 1 | 1 | 1 | ชั้น 1 — ล็อบบี้ / ประชาสัมพันธ์ / รปภ. | 1F — Lobby / Reception / Security |
| 2 | 1 | 2 | ชั้น 2 — กองกลาง | 2F — General Admin |
| 3 | 1 | 3 | ชั้น 3 — สำนักงานปลัด | 3F — OPS |
| 4 | 1 | 4 | ชั้น 4 — กองกิจการท่องเที่ยว / นโยบายและแผน | 4F — Tourism Affairs & Policy |
| 5 | 1 | 5 | ชั้น 5 — กองการต่างประเทศ | 5F — International Affairs |
| 6 | 1 | 6 | ชั้น 6 — กรมการท่องเที่ยว / ททท. | 6F — Dept. of Tourism / TAT |
| 7 | 1 | 7 | ชั้น 7 — กรมพลศึกษา / มกช. | 7F — Dept. of PE / NSU |
| 8 | 1 | 8 | ชั้น 8 — กกท. / ตร.ท่องเที่ยว / อพท. | 8F — SAT / Tourist Police / DASTA |
| 9 | 1 | 9 | ชั้น 9 — สำนักงานรัฐมนตรี / ห้องประชุมอเนกประสงค์ | 9F — Minister's Office / Conference |

</details>

### 2.3 `departments` — ตารางแผนก / หน่วยงาน

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสแผนก (PK) |
| name | VARCHAR(200) | ✗ | ชื่อแผนก (ภาษาไทย) |
| name_en | VARCHAR(200) | ✗ | ชื่อแผนก (ภาษาอังกฤษ) |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (13 rows — แสดง 10 แรก)</summary>

| id | name | name_en | is_active |
|----|----|----|----|
| 1 | สำนักงานปลัดกระทรวง | Office of the Permanent Secretary | ✅ |
| 2 | กองกลาง | General Administration Division | ✅ |
| 3 | กองการต่างประเทศ | International Affairs Division | ✅ |
| 4 | กองกิจการท่องเที่ยว | Tourism Affairs Division | ✅ |
| 5 | กรมการท่องเที่ยว | Department of Tourism | ✅ |
| 6 | กรมพลศึกษา | Department of Physical Education | ✅ |
| 7 | การกีฬาแห่งประเทศไทย | Sports Authority of Thailand | ✅ |
| 8 | สำนักนโยบายและแผน | Policy and Planning Division | ✅ |
| 9 | สำนักงานรัฐมนตรี | Minister's Office | ✅ |
| 10 | การท่องเที่ยวแห่งประเทศไทย | Tourism Authority of Thailand | ✅ |

*(... อีก 3 rows)*
</details>

### 2.4 `floor_departments` — ตารางเชื่อม ชั้น ↔ แผนก (Many-to-Many) — แผนกใดอยู่ชั้นไหน

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **floor_id** 🔑 | INT | ✗ | FK → floors.id |
| **department_id** 🔑 | INT | ✗ | FK → departments.id |

<details>
<summary>📦 Seed Data (13 rows — แสดง 10 แรก)</summary>

| floor_id | department_id |
|----|----|
| 2 | 2 |
| 3 | 1 |
| 4 | 4 |
| 4 | 8 |
| 5 | 3 |
| 6 | 5 |
| 6 | 10 |
| 7 | 6 |
| 7 | 11 |
| 8 | 7 |

*(... อีก 3 rows)*
</details>

**ความสัมพันธ์:**
- buildings 1 ──→ N floors (อาคาร 1 หลัง มีหลายชั้น)
- floors N ←──→ N departments ผ่าน floor_departments (ชั้นมีหลายแผนก, แผนกอาจอยู่หลายชั้น)

---
## 3. โซนเข้าพื้นที่

**เมนู:** โซนเข้าพื้นที่
**Path:** `/web/settings/access-zones`
**คำอธิบาย:** จัดการโซนเข้าพื้นที่ (ประตู Hikvision), กลุ่มสิทธิ์การเข้าพื้นที่ (Access Groups), และการจับคู่แผนก ↔ กลุ่มสิทธิ์

### 3.1 `access_zones` — ตารางโซน/พื้นที่ที่ควบคุมด้วย Hikvision (ประตู/เครื่องอ่านบัตร)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสโซน (PK) |
| name | VARCHAR(100) | ✗ | ชื่อโซน (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อโซน (ภาษาอังกฤษ) |
| floor_id 🔗 | INT | ✗ | FK → floors.id — ชั้นที่โซนนี้อยู่ |
| building_id 🔗 | INT | ✗ | FK → buildings.id — อาคาร |
| type | ENUM('office','meeting-room','lobby','parking','common','restricted','service') | ✗ | ประเภทโซน: office=สำนักงาน, meeting-room=ห้องประชุม, lobby=ล็อบบี้, parking=ที่จอดรถ, common=ส่วนกลาง, restricted=ควบคุม, service=ซ่อมบำรุง |
| hikvision_door_id 🔒 | VARCHAR(50) | ✗ | รหัสประตู Hikvision สำหรับ Integration |
| description | TEXT | ✓ | รายละเอียดเพิ่มเติม |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (20 rows — แสดง 10 แรก)</summary>

| id | name | name_en | floor_id | building_id | type | hikvision_door_id | is_active |
|----|----|----|----|----|----|----|----|
| 1 | ล็อบบี้ ชั้น 1 | Lobby 1F | 1 | 1 | lobby | HIK-DOOR-C1-01 | ✅ |
| 2 | ลานจอดรถ | Parking | 1 | 1 | parking | HIK-DOOR-C1-PK | ✅ |
| 3 | พื้นที่ซ่อมบำรุง | Maintenance Area | 1 | 1 | service | HIK-DOOR-C1-SVC | ✅ |
| 4 | สำนักงาน กองกลาง | General Admin Office | 2 | 1 | office | HIK-DOOR-C2-01 | ✅ |
| 5 | ห้องประชุม ชั้น 2 | Meeting Room 2F | 2 | 1 | meeting-room | HIK-DOOR-C2-MR | ✅ |
| 6 | สำนักงานปลัด | OPS Office | 3 | 1 | office | HIK-DOOR-C3-01 | ✅ |
| 7 | ห้องประชุม ชั้น 3 | Meeting Room 3F | 3 | 1 | meeting-room | HIK-DOOR-C3-MR | ✅ |
| 8 | สำนักงาน กองกิจการ / นโยบาย | Tourism & Policy Office | 4 | 1 | office | HIK-DOOR-C4-01 | ✅ |
| 9 | ห้องประชุม ชั้น 4 | Meeting Room 4F | 4 | 1 | meeting-room | HIK-DOOR-C4-MR | ✅ |
| 10 | สำนักงาน กองต่างประเทศ | International Office | 5 | 1 | office | HIK-DOOR-C5-01 | ✅ |

*(... อีก 10 rows)*
</details>

### 3.2 `access_groups` — กลุ่มสิทธิ์การเข้าพื้นที่ — ใช้สำหรับออก QR Code และส่งสิทธิ์ผ่าน Hikvision

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสกลุ่ม (PK) |
| name | VARCHAR(100) | ✗ | ชื่อกลุ่ม (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อกลุ่ม (ภาษาอังกฤษ) |
| description | TEXT | ✗ | คำอธิบายขอบเขตการเข้าถึง |
| hikvision_group_id 🔒 | VARCHAR(50) | ✗ | รหัสกลุ่มบน Hikvision สำหรับ Integration |
| qr_code_prefix | VARCHAR(20) | ✗ | Prefix ของ QR Code เช่น eVMS-GEN, eVMS-OFA |
| validity_minutes | INT | ✗ | อายุ QR Code (นาที) เช่น 60, 120, 480 |
| schedule_days_of_week | JSON | ✗ | วันที่อนุญาต [0=อา, 1=จ, ... 6=ส] เช่น [1,2,3,4,5] |
| schedule_start_time | TIME | ✗ | เวลาเริ่ม (HH:mm) |
| schedule_end_time | TIME | ✗ | เวลาสิ้นสุด (HH:mm) |
| color | VARCHAR(10) | ✗ | สี Hex สำหรับแสดง Badge เช่น #6A0DAD |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (9 rows)</summary>

| id | name | name_en | description | hikvision_group_id | qr_code_prefix | validity_minutes | schedule_days_of_week | schedule_start_time | schedule_end_time | color | is_active |
|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | ผู้เยี่ยมชมทั่วไป | General Visitor | เข้าได้เฉพาะล็อบบี้และพื้นที่ส่วนกลาง ชั้น 1 | HIK-GRP-GENERAL | eVMS-GEN | 60 | [1,2,3,4,5] | 08:00 | 17:00 | #6B7280 | ✅ |
| 2 | ติดต่อราชการ ชั้น 2-5 | Official — Floor 2-5 | เข้าล็อบบี้ + สำนักงานชั้น 2-5 | HIK-GRP-FL2-5 | eVMS-OFA | 120 | [1,2,3,4,5] | 08:00 | 17:00 | #6A0DAD | ✅ |
| 3 | ติดต่อราชการ ชั้น 6 | Official — Floor 6 | เข้าล็อบบี้ + ชั้น 6 | HIK-GRP-FL6 | eVMS-OFB | 120 | [1,2,3,4,5] | 08:00 | 17:00 | #2563EB | ✅ |
| 4 | ติดต่อราชการ ชั้น 7-8 | Official — Floor 7-8 | เข้าล็อบบี้ + ชั้น 7-8 | HIK-GRP-FL7-8 | eVMS-OFC | 120 | [1,2,3,4,5] | 08:00 | 17:00 | #059669 | ✅ |
| 5 | ห้องประชุมรวม | All Meeting Rooms | เข้าได้เฉพาะห้องประชุมทุกชั้น (ไม่รวมห้องประชุมรัฐมนตรี) | HIK-GRP-MEETING | eVMS-MTG | 180 | [1,2,3,4,5] | 07:30 | 18:00 | #0891B2 | ✅ |
| 6 | VIP — สำนักงานรัฐมนตรี | VIP — Minister's Office | เข้าชั้น 9 (ต้องได้รับอนุมัติพิเศษ) | HIK-GRP-VIP | eVMS-VIP | 60 | [1,2,3,4,5] | 09:00 | 16:00 | #DC2626 | ✅ |
| 7 | ผู้รับเหมา / ซ่อมบำรุง | Contractor / Maintenance | เข้าพื้นที่ซ่อมบำรุง + ที่จอดรถ | HIK-GRP-MAINT | eVMS-CTR | 240 | [1,2,3,4,5,6] | 07:00 | 18:00 | #92400E | ✅ |
| 8 | ที่จอดรถ | Parking Only | เข้าได้เฉพาะลานจอดรถ | HIK-GRP-PARK | eVMS-PKG | 480 | [1,2,3,4,5] | 06:00 | 20:00 | #4B5563 | ✅ |
| 9 | รับ-ส่งสินค้า | Delivery / Pickup | เข้าล็อบบี้ + ที่จอดรถ (จำกัดเวลา 30 นาที) | HIK-GRP-DELIVERY | eVMS-DLV | 30 | [1,2,3,4,5,6] | 06:00 | 18:00 | #7C3AED | ✅ |

</details>

### 3.3 `access_group_zones` — ตารางเชื่อม กลุ่มสิทธิ์ ↔ โซน (Many-to-Many) — กลุ่มนี้เข้าโซนไหนได้บ้าง

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **access_group_id** 🔑 | INT | ✗ | FK → access_groups.id |
| **access_zone_id** 🔑 | INT | ✗ | FK → access_zones.id |

<details>
<summary>📦 Seed Data (22 rows — แสดง 10 แรก)</summary>

| access_group_id | access_zone_id |
|----|----|
| 1 | 1 |
| 1 | 20 |
| 2 | 1 |
| 2 | 4 |
| 2 | 5 |
| 2 | 6 |
| 2 | 7 |
| 2 | 8 |
| 2 | 9 |
| 2 | 10 |

*(... อีก 12 rows)*
</details>

### 3.4 `access_group_visit_types` — ตารางเชื่อม กลุ่มสิทธิ์ ↔ ประเภทการเยี่ยม (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **access_group_id** 🔑 | INT | ✗ | FK → access_groups.id |
| **visit_type** 🔑 | ENUM('official','meeting','document','contractor','delivery','other') | ✗ | ประเภทการเยี่ยมที่กลุ่มนี้รองรับ |

<details>
<summary>📦 Seed Data (11 rows — แสดง 10 แรก)</summary>

| access_group_id | visit_type |
|----|----|
| 1 | document |
| 1 | delivery |
| 1 | other |
| 2 | official |
| 2 | meeting |
| 2 | document |
| 5 | meeting |
| 6 | official |
| 6 | meeting |
| 7 | contractor |

*(... อีก 1 rows)*
</details>

### 3.5 `department_access_mappings` — จับคู่แผนก ↔ กลุ่มสิทธิ์เริ่มต้น — ใช้กำหนดว่าผู้เยี่ยมแผนกนี้ได้รับสิทธิ์กลุ่มอะไร

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **department_id** 🔑 | INT | ✗ | FK → departments.id (PK) |
| default_access_group_id 🔗 | INT | ✗ | FK → access_groups.id — กลุ่มสิทธิ์หลัก |

<details>
<summary>📦 Seed Data (13 rows — แสดง 10 แรก)</summary>

| department_id | default_access_group_id |
|----|----|
| 1 | 2 |
| 2 | 2 |
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |
| 6 | 4 |
| 7 | 4 |
| 8 | 2 |
| 9 | 6 |
| 10 | 3 |

*(... อีก 3 rows)*
</details>

### 3.6 `department_additional_access_groups` — กลุ่มสิทธิ์เสริม (นอกเหนือจาก default) ของแต่ละแผนก

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **department_id** 🔑 | INT | ✗ | FK → departments.id |
| **access_group_id** 🔑 | INT | ✗ | FK → access_groups.id |

<details>
<summary>📦 Seed Data (12 rows — แสดง 10 แรก)</summary>

| department_id | access_group_id |
|----|----|
| 1 | 5 |
| 2 | 5 |
| 3 | 5 |
| 4 | 5 |
| 5 | 5 |
| 6 | 5 |
| 7 | 5 |
| 8 | 5 |
| 9 | 2 |
| 10 | 5 |

*(... อีก 2 rows)*
</details>

**ความสัมพันธ์:**
- access_zones N ──→ 1 floors (โซนอยู่บนชั้นใดชั้นหนึ่ง)
- access_zones N ──→ 1 buildings (โซนอยู่ในอาคารใดอาคารหนึ่ง)
- access_groups N ←──→ N access_zones ผ่าน access_group_zones
- access_groups N ←──→ N visit_types ผ่าน access_group_visit_types
- departments 1 ──→ 1 department_access_mappings (กลุ่มสิทธิ์เริ่มต้น)
- departments 1 ──→ N department_additional_access_groups (กลุ่มสิทธิ์เสริม)

---
## 4. กลุ่มผู้อนุมัติ

**เมนู:** กลุ่มผู้อนุมัติ
**Path:** `/web/settings/approver-groups`
**คำอธิบาย:** จัดกลุ่มผู้อนุมัติ — กำหนดสมาชิก สิทธิ์การอนุมัติ/ปฏิเสธ ช่องทางแจ้งเตือน และวัตถุประสงค์ที่ดูแล

### 4.1 `approver_groups` — ตารางกลุ่มผู้อนุมัติหลัก

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสกลุ่ม (PK) |
| name | VARCHAR(150) | ✗ | ชื่อกลุ่ม (ภาษาไทย) |
| name_en | VARCHAR(150) | ✗ | ชื่อกลุ่ม (ภาษาอังกฤษ) |
| description | TEXT | ✗ | คำอธิบายรายละเอียดกลุ่ม |
| department_id 🔗 | INT | ✗ | FK → departments.id — แผนกที่กลุ่มนี้รับผิดชอบ |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (10 rows)</summary>

| id | name | name_en | description | department_id | is_active |
|----|----|----|----|----|----|
| 1 | ผู้อนุมัติ สำนักงานปลัด (ราชการ+ประชุม) | OPS Approvers (Official+Meeting) | กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานปลัดกระทรวง | 1 | ✅ |
| 2 | ผู้อนุมัติ สำนักงานปลัด (อื่นๆ) | OPS Approvers (Other) | กลุ่มผู้อนุมัติสำหรับ วัตถุประสงค์อื่นๆ ที่ สำนักงานปลัดกระทรวง | 1 | ✅ |
| 3 | ผู้อนุมัติ กองกลาง (ราชการ+อื่นๆ) | General Admin Approvers (Official+Other) | กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / อื่นๆ ที่ กองกลาง | 2 | ✅ |
| 4 | ผู้อนุมัติ กองกลาง (ผู้รับเหมา) | General Admin Approvers (Contractor) | กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กองกลาง | 2 | ✅ |
| 5 | ผู้อนุมัติ กองการต่างประเทศ | International Approvers | กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ประชุม ที่ กองการต่างประเทศ | 3 | ✅ |
| 6 | ผู้อนุมัติ กองกิจการท่องเที่ยว (ราชการ+เอกสาร) | Tourism Affairs Approvers (Official+Docs) | กลุ่มผู้อนุมัติสำหรับ ติดต่อราชการ / ส่งเอกสาร ที่ กองกิจการท่องเที่ยว | 4 | ✅ |
| 7 | ผู้อนุมัติ กองกิจการท่องเที่ยว (เยี่ยมชม) | Tourism Affairs Approvers (Tour) | กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กองกิจการท่องเที่ยว | 4 | ✅ |
| 8 | ผู้อนุมัติ กรมการท่องเที่ยว (เยี่ยมชม) | Dept. of Tourism Approvers (Tour) | กลุ่มผู้อนุมัติสำหรับ เยี่ยมชม/ศึกษาดูงาน ที่ กรมการท่องเที่ยว | 5 | ✅ |
| 9 | ผู้อนุมัติ กรมพลศึกษา (ผู้รับเหมา) | Dept. of PE Approvers (Contractor) | กลุ่มผู้อนุมัติสำหรับ ผู้รับเหมา/ซ่อมบำรุง ที่ กรมพลศึกษา | 6 | ✅ |
| 10 | ผู้อนุมัติ สำนักงานรัฐมนตรี (VIP) | Minister Office Approvers (VIP) | กลุ่มผู้อนุมัติ VIP สำหรับ ติดต่อราชการ / ประชุม ที่ สำนักงานรัฐมนตรี | 9 | ✅ |

</details>

### 4.2 `approver_group_members` — สมาชิกในกลุ่มผู้อนุมัติ — ระบุสิทธิ์การอนุมัติ/ปฏิเสธ และการรับแจ้งเตือน

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| approver_group_id 🔗 | INT | ✗ | FK → approver_groups.id |
| staff_id 🔗 | INT | ✗ | FK → staff.id — พนักงานที่เป็นสมาชิก |
| can_approve | BOOLEAN | ✗ | สามารถกดอนุมัติ/ปฏิเสธได้หรือไม่ | false |
| receive_notification | BOOLEAN | ✗ | ได้รับแจ้งเตือนเมื่อมีรายการใหม่ | true |

<details>
<summary>📦 Seed Data (19 rows — แสดง 10 แรก)</summary>

| id | approver_group_id | staff_id | can_approve | receive_notification |
|----|----|----|----|----|
| 1 | 1 | 5 | ✅ | ✅ |
| 2 | 1 | 1 | ✅ | ✅ |
| 3 | 1 | 4 | ❌ | ✅ |
| 4 | 2 | 5 | ✅ | ✅ |
| 5 | 2 | 4 | ✅ | ✅ |
| 6 | 3 | 2 | ✅ | ✅ |
| 7 | 3 | 6 | ❌ | ✅ |
| 8 | 4 | 2 | ✅ | ✅ |
| 9 | 5 | 3 | ✅ | ✅ |
| 10 | 6 | 1 | ✅ | ✅ |

*(... อีก 9 rows)*
</details>

### 4.3 `approver_group_purposes` — วัตถุประสงค์ที่แต่ละกลุ่มรับผิดชอบอนุมัติ (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **approver_group_id** 🔑 | INT | ✗ | FK → approver_groups.id |
| **visit_purpose_id** 🔑 | INT | ✗ | FK → visit_purposes.id |

<details>
<summary>📦 Seed Data (15 rows — แสดง 10 แรก)</summary>

| approver_group_id | visit_purpose_id |
|----|----|
| 1 | 1 |
| 1 | 2 |
| 2 | 8 |
| 3 | 1 |
| 3 | 8 |
| 4 | 4 |
| 5 | 1 |
| 5 | 2 |
| 6 | 1 |
| 6 | 3 |

*(... อีก 5 rows)*
</details>

### 4.4 `approver_group_notify_channels` — ช่องทางแจ้งเตือนของกลุ่มผู้อนุมัติ (สามารถเลือกหลายช่องทาง)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **approver_group_id** 🔑 | INT | ✗ | FK → approver_groups.id |
| **channel** 🔑 | ENUM('line','email','web-app') | ✗ | ช่องทาง: line / email / web-app |

<details>
<summary>📦 Seed Data (22 rows — แสดง 10 แรก)</summary>

| approver_group_id | channel |
|----|----|
| 1 | line |
| 1 | email |
| 1 | web-app |
| 2 | line |
| 2 | web-app |
| 3 | line |
| 3 | email |
| 4 | line |
| 4 | email |
| 5 | line |

*(... อีก 12 rows)*
</details>

**ความสัมพันธ์:**
- approver_groups N ──→ 1 departments (กลุ่มผูกกับแผนกที่รับผิดชอบ)
- approver_groups N ←──→ N staff ผ่าน approver_group_members (กลุ่มมีสมาชิกหลายคน)
- approver_groups N ←──→ N visit_purposes ผ่าน approver_group_purposes
- approver_groups 1 ──→ N approver_group_notify_channels (ช่องทางแจ้งเตือน)
- approver_groups ←── visit_purpose_department_rules.approver_group_id (ถูกอ้างอิงจากเงื่อนไขแผนก)

---
## 5. จัดการพนักงาน

**เมนู:** จัดการพนักงาน
**Path:** `/web/settings/staff`
**คำอธิบาย:** จัดการข้อมูลพนักงาน — ชื่อ ตำแหน่ง แผนก บทบาท สิทธิ์ และกะการทำงาน

### 5.1 `staff` — ตารางพนักงาน / เจ้าหน้าที่ (รวม admin, staff, security)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสพนักงานในระบบ (PK) |
| employee_id 🔒 | VARCHAR(20) | ✗ | รหัสพนักงาน (EMP-001, SEC-001) |
| name | VARCHAR(100) | ✗ | ชื่อ-นามสกุล (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อ-นามสกุล (ภาษาอังกฤษ) |
| position | VARCHAR(150) | ✗ | ตำแหน่ง เช่น ผู้อำนวยการกอง / เจ้าหน้าที่ รปภ. |
| department_id 🔗 | INT | ✗ | FK → departments.id — แผนกที่สังกัด |
| email | VARCHAR(100) | ✗ | อีเมลราชการ |
| phone | VARCHAR(20) | ✗ | เบอร์โทรศัพท์ |
| line_user_id 🔒 | VARCHAR(50) | ✓ | LINE User ID — ได้จาก LINE Login/LIFF (null = ยังไม่ผูก) |
| line_display_name | VARCHAR(100) | ✓ | LINE Display Name — อัปเดตทุกครั้งที่ผูกใหม่ |
| line_linked_at | TIMESTAMP | ✓ | วันเวลาที่ผูกบัญชี LINE |
| avatar_url | VARCHAR(255) | ✓ | URL รูปภาพโปรไฟล์ |
| role | ENUM('admin','supervisor','officer','staff','security','visitor') | ✗ | บทบาท: admin=ผู้ดูแลระบบ, staff=เจ้าหน้าที่, security=รปภ. |
| status | ENUM('active','inactive','locked') | ✗ | สถานะ: active=ใช้งาน, inactive=ปิดใช้งาน, locked=ล็อก | active |
| shift | ENUM('morning','afternoon','night') | ✓ | กะการทำงาน (เฉพาะ security) |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (10 rows)</summary>

| id | employee_id | name | name_en | position | department_id | email | phone | role | status | shift |
|----|----|----|----|----|----|----|----|----|----|----|
| 1 | EMP-001 | คุณสมศรี รักงาน | Somsri Rakngarn | ผู้อำนวยการกองกิจการท่องเที่ยว | 4 | somsri.r@mots.go.th | 02-283-1500 | staff | active | — |
| 2 | EMP-002 | คุณประเสริฐ ศรีวิโล | Prasert Srivilo | หัวหน้ากลุ่มงานบริหารทั่วไป | 2 | prasert.s@mots.go.th | 02-283-1501 | staff | active | — |
| 3 | EMP-003 | คุณกมลพร วงศ์สวัสดิ์ | Kamonporn Wongsawad | ผู้เชี่ยวชาญด้านต่างประเทศ | 3 | kamonporn.w@mots.go.th | 02-283-1502 | staff | active | — |
| 4 | EMP-004 | คุณวิภาดา ชัยมงคล | Wipada Chaimongkol | นักวิเคราะห์นโยบายและแผน | 8 | wipada.c@mots.go.th | 02-283-1503 | staff | active | — |
| 5 | EMP-005 | คุณอนันต์ มั่นคง | Anan Mankong | ผู้ดูแลระบบ | 1 | anan.m@mots.go.th | 02-283-1504 | admin | active | — |
| 6 | SEC-001 | คุณสมชาย ปลอดภัย | Somchai Plodpai | เจ้าหน้าที่รักษาความปลอดภัย | 2 | somchai.p@mots.go.th | 02-283-1510 | security | active | morning |
| 7 | EMP-006 | คุณธนพล จิตรดี | Thanapon Jitdee | นักวิชาการท่องเที่ยว | 5 | thanapon.j@mots.go.th | 02-283-1505 | staff | active | — |
| 8 | EMP-007 | คุณปิยะนุช สุขใจ | Piyanuch Sukjai | เจ้าหน้าที่บริหารงานทั่วไป | 6 | piyanuch.s@mots.go.th | 02-283-1506 | staff | active | — |
| 9 | EMP-008 | คุณนภดล เรืองศักดิ์ | Noppadon Ruangsak | นักจัดการงานทั่วไป | 1 | noppadon.r@mots.go.th | 02-283-1507 | staff | inactive | — |
| 10 | SEC-002 | คุณชัยวัฒน์ กล้าหาญ | Chaiwat Klahan | เจ้าหน้าที่รักษาความปลอดภัย | 2 | chaiwat.k@mots.go.th | 02-283-1511 | security | inactive | night |

</details>

**ความสัมพันธ์:**
- staff N ──→ 1 departments (พนักงานสังกัดแผนก)
- staff N ←──→ N approver_groups ผ่าน approver_group_members (พนักงานเป็นสมาชิกกลุ่มผู้อนุมัติ)
- staff 1 ←── N service_points.assigned_staff_id (ประจำจุดบริการ — optional)

---
## 6. จุดให้บริการ Kiosk/Counter

**เมนู:** จุดให้บริการ Kiosk/Counter
**Path:** `/web/settings/service-points`
**คำอธิบาย:** จัดการจุดบริการ (ตู้ Kiosk / เคาน์เตอร์ รปภ.) — ข้อมูลอุปกรณ์ ตำแหน่งที่ตั้ง สถานะ และวัตถุประสงค์/เอกสารที่รับ

### 6.1 `service_points` — ตารางจุดให้บริการ (Kiosk / Counter)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสจุดบริการ (PK) |
| name | VARCHAR(100) | ✗ | ชื่อจุดบริการ (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อจุดบริการ (ภาษาอังกฤษ) |
| type | ENUM('kiosk','counter') | ✗ | ประเภท: kiosk=ตู้อัตโนมัติ / counter=เคาน์เตอร์ รปภ. |
| status | ENUM('online','offline','maintenance') | ✗ | สถานะปัจจุบัน: online=ออนไลน์, offline=ออฟไลน์, maintenance=ซ่อมบำรุง | online |
| location | VARCHAR(150) | ✗ | ตำแหน่งที่ตั้ง (ภาษาไทย) |
| location_en | VARCHAR(150) | ✗ | ตำแหน่งที่ตั้ง (ภาษาอังกฤษ) |
| building | VARCHAR(100) | ✗ | อาคาร |
| floor | VARCHAR(20) | ✗ | ชั้น |
| ip_address | VARCHAR(15) | ✗ | IP Address ของอุปกรณ์ |
| mac_address | VARCHAR(17) | ✗ | MAC Address ของอุปกรณ์ |
| serial_number 🔒 | VARCHAR(30) | ✗ | หมายเลขซีเรียล |
| today_transactions | INT | ✗ | จำนวนธุรกรรมวันนี้ (reset ทุกวัน) | 0 |
| last_online | TIMESTAMP | ✓ | เวลาที่ออนไลน์ล่าสุด |
| assigned_staff_id 🔗 | INT | ✓ | FK → staff.id — เจ้าหน้าที่ประจำจุด (เฉพาะ counter) |
| notes | TEXT | ✓ | หมายเหตุ |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| wifi_ssid | VARCHAR(50) | ✓ | WiFi SSID สำหรับผู้เยี่ยม เช่น MOTS-Guest |
| wifi_password_pattern | VARCHAR(50) | ✓ | รูปแบบรหัสผ่าน WiFi เช่น mots{year} |
| wifi_validity_mode | ENUM('business-hours-close','fixed-duration') | ✓ | วิธีคำนวณหมดอายุ WiFi |
| wifi_fixed_duration_min | INT | ✓ | ระยะเวลา WiFi (นาที) ถ้าใช้ fixed-duration |
| pdpa_require_scroll | BOOLEAN | ✓ | บังคับเลื่อนอ่าน PDPA ก่อนยินยอม | true |
| pdpa_retention_days | INT | ✓ | จำนวนวันเก็บข้อมูลที่แสดงในข้อความ PDPA | 90 |
| slip_header_text | VARCHAR(200) | ✓ | ข้อความหัวใบ slip |
| slip_footer_text | VARCHAR(200) | ✓ | ข้อความท้ายใบ slip |
| follow_business_hours | BOOLEAN | ✓ | ใช้เวลาทำการหรือเปิดตลอด | true |
| id_masking_pattern | VARCHAR(30) | ✓ | รูปแบบปิดบังเลขบัตร: show-last-4, show-first-last, full-mask |
| admin_pin | VARCHAR(5) | ✓ | PIN 5 หลักสำหรับเข้าเมนูตั้งค่าบน Kiosk | 10210 |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (4 rows)</summary>

| id | name | name_en | type | status | location | location_en | building | floor | ip_address | mac_address | serial_number | today_transactions | last_online | assigned_staff_id | is_active |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | ตู้ Kiosk ล็อบบี้หลัก | Main Lobby Kiosk | kiosk | online | ล็อบบี้ ชั้น 1 ประตูหลัก | Main Lobby, Gate 1 | ศูนย์ราชการ อาคาร C | ชั้น 1 | 192.168.1.101 | AA:BB:CC:DD:01:01 | KIOSK-2024-001 | 42 | 2569-03-08T14:30:00 | — | ✅ |
| 2 | ตู้ Kiosk ล็อบบี้ฝั่งตะวันออก | East Lobby Kiosk | kiosk | offline | ล็อบบี้ ชั้น 1 ประตูฝั่งตะวันออก | East Lobby, Side Gate | ศูนย์ราชการ อาคาร C | ชั้น 1 | 192.168.1.102 | AA:BB:CC:DD:01:02 | KIOSK-2024-002 | 28 | 2569-03-08T14:28:00 | — | ✅ |
| 3 | จุดบริการ Counter 1 | Service Counter 1 | counter | online | เคาน์เตอร์ รปภ. ประตูหลัก | Security Counter, Main Gate | ศูนย์ราชการ อาคาร C | ชั้น 1 | 192.168.1.201 | AA:BB:CC:DD:02:01 | CTR-2024-001 | 67 | 2569-03-08T14:30:00 | 6 | ✅ |
| 4 | จุดบริการ Counter 2 | Service Counter 2 | counter | online | เคาน์เตอร์ รปภ. ประตูหลัก | Security Counter, Main Gate | ศูนย์ราชการ อาคาร C | ชั้น 1 | 192.168.1.202 | AA:BB:CC:DD:02:02 | CTR-2024-002 | 53 | 2569-03-08T14:29:00 | 7 | ✅ |

</details>

### 6.2 `service_point_purposes` — วัตถุประสงค์ที่จุดบริการนี้รองรับ (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **service_point_id** 🔑 | INT | ✗ | FK → service_points.id |
| **visit_purpose_id** 🔑 | INT | ✗ | FK → visit_purposes.id |

<details>
<summary>📦 Seed Data (16 rows — แสดง 10 แรก)</summary>

| service_point_id | visit_purpose_id |
|----|----|
| 1 | 1 |
| 1 | 2 |
| 1 | 5 |
| 2 | 1 |
| 2 | 3 |
| 2 | 4 |
| 3 | 1 |
| 3 | 2 |
| 3 | 3 |
| 3 | 4 |

*(... อีก 6 rows)*
</details>

### 6.3 `service_point_documents` — ประเภทเอกสารที่จุดบริการนี้รับ (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **service_point_id** 🔑 | INT | ✗ | FK → service_points.id |
| **identity_document_type_id** 🔑 | INT | ✗ | FK → identity_document_types.id |

<details>
<summary>📦 Seed Data (17 rows — แสดง 10 แรก)</summary>

| service_point_id | identity_document_type_id |
|----|----|
| 1 | 1 |
| 1 | 2 |
| 1 | 4 |
| 1 | 5 |
| 2 | 1 |
| 2 | 3 |
| 2 | 5 |
| 3 | 1 |
| 3 | 2 |
| 3 | 3 |

*(... อีก 7 rows)*
</details>

### 6.4 `counter_staff_assignments` — เจ้าหน้าที่ที่ได้รับมอบหมายประจำ Counter (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT AUTO_INCREMENT | ✗ | รหัส assignment (PK) — เลข run อัตโนมัติ |
| service_point_id 🔗 | INT | ✗ | FK → service_points.id (เฉพาะ type=counter) |
| staff_id 🔗 | INT | ✗ | FK → staff.id (role=security/officer) |
| is_primary | BOOLEAN | ✗ | เจ้าหน้าที่หลักประจำ counter นี้ | false |
| assigned_at | TIMESTAMP | ✗ | วันที่มอบหมาย | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | service_point_id | staff_id | is_primary | assigned_at |
|----|----|----|----|----|
| 1 | 3 | 6 | ✅ | 2569-01-15T09:00:00 |
| 2 | 3 | 11 | ❌ | 2569-02-01T09:00:00 |
| 3 | 4 | 12 | ✅ | 2569-01-15T09:00:00 |
| 4 | 4 | 6 | ❌ | 2569-02-10T09:00:00 |
| 5 | 4 | 11 | ❌ | 2569-03-01T09:00:00 |

</details>

**ความสัมพันธ์:**
- service_points N ←──→ N staff ผ่าน counter_staff_assignments (เจ้าหน้าที่ประจำ counter)
- service_points N ←──→ N visit_purposes ผ่าน service_point_purposes
- service_points N ←──→ N identity_document_types ผ่าน service_point_documents

---
## 7. ประเภทเอกสาร

**เมนู:** ประเภทเอกสาร
**Path:** `/web/settings/document-types`
**คำอธิบาย:** กำหนดประเภทเอกสารที่ใช้ยืนยันตัวตน — บัตรประชาชน, Passport, ใบขับขี่, บัตรข้าราชการ ฯลฯ

### 7.1 `identity_document_types` — ตารางประเภทเอกสารระบุตัวตนที่ Kiosk/Counter รับได้ (ใช้ตอนสแกน/ลงทะเบียน)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสเอกสาร (PK) เช่น doc-national-id |
| name | VARCHAR(100) | ✗ | ชื่อเอกสาร (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อเอกสาร (ภาษาอังกฤษ) |
| icon | VARCHAR(10) | ✓ | ไอคอน Emoji |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| sort_order | INT | ✗ | ลำดับการแสดงผล |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | name | name_en | icon | is_active | sort_order |
|----|----|----|----|----|----|
| 1 | บัตรประจำตัวประชาชน | National ID Card | 🪪 | ✅ | 1 |
| 2 | หนังสือเดินทาง (Passport) | Passport | 📕 | ✅ | 2 |
| 3 | ใบขับขี่ | Driver's License | 🚗 | ✅ | 3 |
| 4 | บัตรข้าราชการ / บัตรพนักงานรัฐ | Government Officer Card | 🏛️ | ✅ | 4 |
| 5 | AppThaiID | AppThaiID | 📱 | ✅ | 5 |

</details>

### 7.2 `document_types` — ตารางประเภทเอกสารเพิ่มเติมที่ผู้เยี่ยมอาจต้องแนบ (เอกสารมอบอำนาจ, ทะเบียนรถ ฯลฯ)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสเอกสาร (PK) |
| name | VARCHAR(100) | ✗ | ชื่อเอกสาร (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อเอกสาร (ภาษาอังกฤษ) |
| category | ENUM('identification','authorization','vehicle','other') | ✗ | หมวดหมู่: identification=ยืนยันตัวตน, authorization=มอบอำนาจ, vehicle=ยานพาหนะ, other=อื่นๆ |
| is_required | BOOLEAN | ✗ | จำเป็นต้องแนบหรือไม่ | false |
| require_photo | BOOLEAN | ✗ | ต้องถ่ายรูปเอกสาร | false |
| description | TEXT | ✓ | คำอธิบายวิธีใช้ |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| sort_order | INT | ✗ | ลำดับการแสดงผล |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (4 rows)</summary>

| id | name | name_en | category | is_required | require_photo | description | is_active | sort_order |
|----|----|----|----|----|----|----|----|----|
| 1 | บัตรประจำตัวประชาชน | Thai National ID Card | identification | ✅ | ✅ | บัตรประชาชนตัวจริง สำหรับบุคคลสัญชาติไทย | ✅ | 1 |
| 2 | หนังสือเดินทาง (Passport) | Passport | identification | ✅ | ✅ | สำหรับบุคคลต่างชาติ | ✅ | 2 |
| 3 | ใบขับขี่ | Driver's License | identification | ❌ | ✅ | ใช้แทนบัตรประชาชนได้เฉพาะกรณี walk-in | ✅ | 3 |
| 4 | บัตรข้าราชการ / บัตรพนักงานรัฐ | Government Officer ID | identification | ❌ | ✅ | บัตรประจำตัวข้าราชการ | ✅ | 4 |

</details>

### 7.3 `document_type_visit_types` — ประเภทเอกสารใช้ได้กับประเภทการเยี่ยมใด (Many-to-Many)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **document_type_id** 🔑 | INT | ✗ | FK → document_types.id |
| **visit_type** 🔑 | ENUM('official','meeting','document','contractor','delivery','other') | ✗ | ประเภทการเยี่ยม |

<details>
<summary>📦 Seed Data (20 rows — แสดง 10 แรก)</summary>

| document_type_id | visit_type |
|----|----|
| 1 | official |
| 1 | meeting |
| 1 | document |
| 1 | contractor |
| 1 | delivery |
| 1 | other |
| 2 | official |
| 2 | meeting |
| 2 | document |
| 2 | contractor |

*(... อีก 10 rows)*
</details>

**ความสัมพันธ์:**
- identity_document_types ←── visit_purpose_channel_documents (ใช้ตอนตั้งค่าช่องทางเข้าของวัตถุประสงค์)
- identity_document_types ←── service_point_documents (ใช้ตอนกำหนดเอกสารที่จุดบริการรับ)
- document_types N ←──→ N visit_types ผ่าน document_type_visit_types

---
## 8. เวลาทำการ

**เมนู:** เวลาทำการ
**Path:** `/web/settings/business-hours`
**คำอธิบาย:** กำหนดเวลาเปิด/ปิดทำการ — วันทำการปกติ, วันหยุดราชการ, และวันพิเศษ พร้อมกำหนดว่าเปิดรับ Walk-in / Kiosk หรือไม่

### 8.1 `business_hours_rules` — กฎเวลาทำการ — กำหนดเวลาเปิด/ปิด และช่องทางที่อนุญาต

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสกฎ (PK) |
| name | VARCHAR(100) | ✗ | ชื่อกฎ (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อกฎ (ภาษาอังกฤษ) |
| type | ENUM('regular','special','holiday') | ✗ | ประเภท: regular=ปกติ(ทุกสัปดาห์), special=วันพิเศษ, holiday=วันหยุด |
| days_of_week | JSON | ✓ | วันในสัปดาห์ [0=อา..6=ส] (เฉพาะ type=regular) |
| specific_date | DATE | ✓ | วันที่เฉพาะ YYYY-MM-DD (เฉพาะ type=special/holiday) |
| open_time | TIME | ✗ | เวลาเปิดทำการ (HH:mm) — 00:00 = ปิดทั้งวัน |
| close_time | TIME | ✗ | เวลาปิดทำการ (HH:mm) — 00:00 = ปิดทั้งวัน |
| allow_walkin | BOOLEAN | ✗ | เปิดรับ Walk-in ผู้เยี่ยมชม | true |
| allow_kiosk | BOOLEAN | ✗ | เปิดให้ Kiosk ลงทะเบียนได้ | true |
| notes | TEXT | ✓ | หมายเหตุเพิ่มเติม |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (6 rows)</summary>

| id | name | name_en | type | days_of_week | specific_date | open_time | close_time | allow_walkin | allow_kiosk | is_active |
|----|----|----|----|----|----|----|----|----|----|----|
| 1 | วันทำการปกติ (จ-ศ) | Regular Weekdays (Mon-Fri) | regular | [1,2,3,4,5] | — | 08:30 | 16:30 | ✅ | ✅ | ✅ |
| 2 | วันเสาร์ (เปิดครึ่งวัน) | Saturday (Half Day) | regular | [6] | — | 09:00 | 12:00 | ✅ | ✅ | ✅ |
| 3 | วันอาทิตย์ (ปิด) | Sunday (Closed) | regular | [0] | — | 00:00 | 00:00 | ❌ | ❌ | ✅ |
| 4 | วันจักรี | Chakri Memorial Day | holiday | — | 2569-04-06 | 00:00 | 00:00 | ❌ | ❌ | ✅ |
| 5 | สงกรานต์ | Songkran Festival | holiday | — | 2569-04-13 | 00:00 | 00:00 | ❌ | ❌ | ✅ |
| 6 | งานสัมมนาพิเศษ | Special Seminar Event | special | — | 2569-03-20 | 07:00 | 20:00 | ✅ | ✅ | ✅ |

</details>

**ความสัมพันธ์:**
- business_hours_rules — ใช้ตรวจสอบเวลาเปิด/ปิดก่อนอนุญาต Walk-in / Kiosk registration
- holiday rules override regular rules เมื่อตรงวันที่เดียวกัน

---
## 9. เทมเพลตแจ้งเตือน

**เมนู:** เทมเพลตแจ้งเตือน
**Path:** `/web/settings/notification-templates`
**คำอธิบาย:** จัดการเทมเพลตข้อความแจ้งเตือน — LINE, Email, SMS พร้อมตัวแปรที่รองรับ ({{variable}})

### 9.1 `notification_templates` — ตารางเทมเพลตแจ้งเตือน — กำหนดข้อความสำหรับแต่ละ event + ช่องทาง

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสเทมเพลต (PK) |
| name | VARCHAR(100) | ✗ | ชื่อเทมเพลต (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อเทมเพลต (ภาษาอังกฤษ) |
| trigger_event | ENUM('booking-confirmed','booking-approved','booking-rejected','reminder-1day','reminder-1hour','checkin-welcome','checkout-thankyou','overstay-alert','wifi-credentials') | ✗ | เหตุการณ์ที่ทำให้ส่ง: booking-confirmed=ยืนยันจอง, booking-approved=อนุมัติ, reminder-1day=เตือน1วัน ฯลฯ |
| channel | ENUM('line','email','sms') | ✗ | ช่องทางส่ง: line / email / sms |
| subject | VARCHAR(200) | ✓ | หัวข้อ (เฉพาะ email) |
| body_th | TEXT | ✗ | เนื้อหาภาษาไทย — ใช้ {{variable}} สำหรับตัวแปร |
| body_en | TEXT | ✗ | เนื้อหาภาษาอังกฤษ |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (8 rows)</summary>

| id | name | name_en | trigger_event | channel | subject | body_th | body_en | is_active |
|----|----|----|----|----|----|----|----|----|
| 1 | แจ้งยืนยันจอง (LINE) | Booking Confirmed (LINE) | booking-confirmed | line | — | สวัสดีค่ะ คุณ{{visitorName}} 🎉
การจองเลขที่ {{bookingCode}} ได้รับการยืนยันแล้ว
📅 วันที่: {{date}}
⏰ เวลา: {{time}}
📍 {{location}} | Hello {{visitorName}} 🎉
Booking {{bookingCode}} confirmed. | ✅ |
| 2 | แจ้งอนุมัติ (LINE) | Approved (LINE) | booking-approved | line | — | ✅ คำขอเข้าพื้นที่ {{bookingCode}} ได้รับการอนุมัติแล้ว
ผู้อนุมัติ: {{approverName}} | ✅ Visit request {{bookingCode}} approved by {{approverName}} | ✅ |
| 3 | แจ้งไม่อนุมัติ (LINE) | Rejected (LINE) | booking-rejected | line | — | ❌ คำขอเข้าพื้นที่ {{bookingCode}} ไม่ได้รับการอนุมัติ
เหตุผล: {{reason}} | ❌ Visit request {{bookingCode}} rejected. Reason: {{reason}} | ✅ |
| 4 | เตือนล่วงหน้า 1 วัน (LINE) | 1-Day Reminder (LINE) | reminder-1day | line | — | 📢 เตือน: พรุ่งนี้คุณมีนัดหมาย {{bookingCode}}
📅 {{date}} เวลา {{time}}
📍 {{location}} | 📢 Reminder: Tomorrow you have appointment {{bookingCode}} | ✅ |
| 5 | ต้อนรับ Check-in (LINE) | Welcome Check-in (LINE) | checkin-welcome | line | — | 🏢 ยินดีต้อนรับคุณ {{visitorName}}
เข้าพื้นที่สำเร็จเมื่อ {{checkinTime}}
📍 {{zone}} | 🏢 Welcome {{visitorName}} — Checked in at {{checkinTime}} | ✅ |
| 6 | แจ้งยืนยัน (Email) | Booking Confirmed (Email) | booking-confirmed | email | ยืนยันการจองเข้าพื้นที่ — {{bookingCode}} | เรียน คุณ{{visitorName}}

การจองเลขที่ {{bookingCode}} ได้รับการยืนยัน
วันที่: {{date}} เวลา: {{time}} สถานที่: {{location}}
ผู้ติดต่อ: {{hostName}} | Dear {{visitorName}},
Your visit {{bookingCode}} has been confirmed. | ✅ |
| 7 | แจ้งเตือนเกินเวลา (LINE) | Overstay Alert (LINE) | overstay-alert | line | — | ⚠️ คุณ {{visitorName}} อยู่เกินเวลา
เวลาที่ควรออก: {{checkoutTime}} | ⚠️ {{visitorName}} has exceeded allowed time. | ✅ |
| 8 | ข้อมูล WiFi (LINE) | WiFi Credentials (LINE) | wifi-credentials | line | — | 📶 WiFi: {{wifiSSID}}
User: {{wifiUsername}}
Pass: {{wifiPassword}}
ใช้ได้ถึง: {{expiry}} | 📶 WiFi: {{wifiSSID}} User: {{wifiUsername}} Pass: {{wifiPassword}} | ✅ |

</details>

### 9.2 `notification_template_variables` — ตัวแปรที่แต่ละเทมเพลตรองรับ (ใช้แทนค่าด้วย {{variable_name}})

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **template_id** 🔑 | INT | ✗ | FK → notification_templates.id |
| **variable_name** 🔑 | VARCHAR(50) | ✗ | ชื่อตัวแปร เช่น visitorName, bookingCode, date |

<details>
<summary>📦 Seed Data (24 rows — แสดง 10 แรก)</summary>

| template_id | variable_name |
|----|----|
| 1 | visitorName |
| 1 | bookingCode |
| 1 | date |
| 1 | time |
| 1 | location |
| 2 | bookingCode |
| 2 | approverName |
| 3 | bookingCode |
| 3 | reason |
| 3 | contactNumber |

*(... อีก 14 rows)*
</details>

**ความสัมพันธ์:**
- notification_templates 1 ──→ N notification_template_variables (แต่ละเทมเพลตมีตัวแปรหลายตัว)
- notification_templates ←── ระบบ Event (ถูกเรียกใช้เมื่อเกิด event เช่น booking, checkin)
- notification_templates ←── approver_group_notify_channels (กลุ่มผู้อนุมัติอ้างอิงช่องทาง)

---
## 10. แบบฟอร์ม Visit Slip

**เมนู:** แบบฟอร์ม Visit Slip
**Path:** `/web/settings/visit-slips`
**คำอธิบาย:** จัดการ Visit Slip (Thermal 80mm) — กำหนด Section ที่แสดง, ฟิลด์, ป้ายกำกับ, โลโก้ (Upload/ปรับขนาด), ลงชื่อเจ้าหน้าที่/ประทับตรา, WiFi, QR Code, และ Live Preview

### 10.1 `visit_slip_templates` — ตาราง Template สลิปผู้เยี่ยม — กำหนดขนาดกระดาษ, header/footer, สถานะ, และ metadata

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Template (PK) |
| name | VARCHAR(100) | ✗ | ชื่อ Template (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อ Template (ภาษาอังกฤษ) |
| description | TEXT | ✓ | คำอธิบายการใช้งาน |
| paper_size | ENUM('thermal-80mm','thermal-58mm') | ✗ | ขนาดกระดาษ Thermal | thermal-80mm |
| paper_width_px | INT | ✗ | ความกว้าง (pixels) สำหรับ render | 302 |
| org_name | VARCHAR(200) | ✗ | ชื่อหน่วยงานบน Header (TH) | กระทรวงการท่องเที่ยวและกีฬา |
| org_name_en | VARCHAR(200) | ✗ | ชื่อหน่วยงานบน Header (EN) | Ministry of Tourism and Sports |
| slip_title | VARCHAR(100) | ✗ | หัวข้อสลิป เช่น VISITOR PASS | VISITOR PASS |
| footer_text_th | VARCHAR(200) | ✗ | ข้อความท้ายสลิป (TH) | กรุณาส่งคืนบัตรเมื่อออกจากอาคาร |
| footer_text_en | VARCHAR(200) | ✗ | ข้อความท้ายสลิป (EN) | Please return this pass when leaving |
| show_org_logo | BOOLEAN | ✗ | แสดงโลโก้หน่วยงานบน Header | true |
| logo_url | VARCHAR(500) | ✓ | URL/path โลโก้ที่อัปโหลด — null = ใช้โลโก้เริ่มต้น | null |
| logo_size_px | INT | ✗ | ขนาดโลโก้ (px) บนสลิป — ปรับได้ 20-100 | 40 |
| is_default | BOOLEAN | ✗ | เป็น Template เริ่มต้น (ใช้เมื่อไม่ระบุ) | false |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | name | name_en | description | paper_size | paper_width_px | org_name | org_name_en | slip_title | footer_text_th | footer_text_en | show_org_logo | logo_url | logo_size_px | is_default | is_active |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | Thermal 80mm มาตรฐาน | Standard Thermal 80mm | สลิป Thermal 80mm สำหรับ Kiosk / Counter | thermal-80mm | 302 | กระทรวงการท่องเที่ยวและกีฬา | Ministry of Tourism and Sports | VISITOR PASS | กรุณาส่งคืนบัตรเมื่อออกจากอาคาร | Please return this pass when leaving | ✅ | — | 40 | ✅ | ✅ |

</details>

### 10.2 `visit_slip_sections` — ส่วน (Section) ของสลิป — จัดกลุ่มฟิลด์เป็น Section เปิด/ปิดได้ ลำดับเรียงได้

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Section (PK) |
| template_id 🔗 | INT | ✗ | FK → visit_slip_templates.id |
| section_key | VARCHAR(30) | ✗ | Key เช่น header, visitor, host, wifi, qrCode |
| name | VARCHAR(80) | ✗ | ชื่อ Section (TH) |
| name_en | VARCHAR(80) | ✗ | ชื่อ Section (EN) |
| is_enabled | BOOLEAN | ✗ | เปิดแสดง Section นี้ | true |
| sort_order | INT | ✗ | ลำดับการแสดงผล |

<details>
<summary>📦 Seed Data (10 rows)</summary>

| id | template_id | section_key | name | name_en | is_enabled | sort_order |
|----|----|----|----|----|----|----|
| 1 | 1 | header | ส่วนหัว (Header) | Header Section | ✅ | 1 |
| 2 | 1 | slipNumber | เลขที่ Slip | Slip Number | ✅ | 2 |
| 3 | 1 | visitor | ข้อมูลผู้เยี่ยม | Visitor Info | ✅ | 3 |
| 4 | 1 | host | ข้อมูลผู้รับ | Host Info | ✅ | 4 |
| 5 | 1 | time | วันที่-เวลา | Date & Time | ✅ | 5 |
| 6 | 1 | extras | ข้อมูลเพิ่มเติม | Additional Info | ❌ | 6 |
| 7 | 1 | wifi | WiFi สำหรับผู้เยี่ยม | Guest WiFi | ✅ | 7 |
| 8 | 1 | qrCode | QR Code (Check-out) | Checkout QR Code | ✅ | 8 |
| 9 | 1 | officerSign | ลงชื่อเจ้าหน้าที่ / ประทับตรา | Officer Signature & Stamp | ✅ | 9 |
| 10 | 1 | footer | ส่วนท้าย (Footer) | Footer Section | ✅ | 10 |

</details>

### 10.3 `visit_slip_fields` — ฟิลด์ข้อมูลแต่ละรายการใน Section — เปิด/ปิด, แก้ไข Label, เรียงลำดับได้

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| section_id 🔗 | INT | ✗ | FK → visit_slip_sections.id |
| field_key | VARCHAR(30) | ✗ | Key ของฟิลด์ เช่น visitorName, wifiSsid |
| label | VARCHAR(100) | ✗ | ป้ายกำกับ (TH) — แก้ไขได้ถ้า is_editable=true |
| label_en | VARCHAR(100) | ✗ | ป้ายกำกับ (EN) |
| is_enabled | BOOLEAN | ✗ | เปิดแสดง Field นี้หรือไม่ | true |
| is_editable | BOOLEAN | ✗ | อนุญาตให้แก้ไข Label ได้หรือไม่ | false |
| sort_order | INT | ✗ | ลำดับภายใน Section |

<details>
<summary>📦 Seed Data (30 rows — แสดง 10 แรก)</summary>

| id | section_id | field_key | label | label_en | is_enabled | is_editable | sort_order |
|----|----|----|----|----|----|----|----|
| 1 | 1 | orgLogo | โลโก้หน่วยงาน | Organization Logo | ✅ | ❌ | 1 |
| 2 | 1 | orgName | กระทรวงการท่องเที่ยวและกีฬา | Ministry of Tourism and Sports | ✅ | ✅ | 2 |
| 3 | 1 | orgNameEn | Ministry of Tourism and Sports | Org Name (EN) | ✅ | ✅ | 3 |
| 4 | 1 | slipTitle | VISITOR PASS | Slip Title | ✅ | ✅ | 4 |
| 5 | 2 | slipNumberLabel | เลขที่ / Slip No. | Label | ✅ | ✅ | 1 |
| 6 | 2 | slipNumber | eVMS-25680315-0042 | Number | ✅ | ❌ | 2 |
| 7 | 3 | visitorName | ชื่อ / Name | Visitor Name | ✅ | ✅ | 1 |
| 8 | 3 | visitorNameEn | ชื่อ (EN) | Name (EN) | ✅ | ✅ | 2 |
| 9 | 3 | idNumber | เลขบัตร / ID | ID Number | ✅ | ✅ | 3 |
| 10 | 3 | visitPurpose | วัตถุประสงค์ / Purpose | Visit Purpose | ✅ | ✅ | 4 |

*(... อีก 20 rows)*
</details>

### 10.4 `purpose_slip_mappings` — จับคู่ วัตถุประสงค์ ↔ Template Visit Slip — กำหนดว่าวัตถุประสงค์ใดใช้ Template ไหน

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **visit_purpose_id** 🔑 | INT | ✗ | FK → visit_purposes.id (PK) |
| slip_template_id 🔗 | INT | ✓ | FK → visit_slip_templates.id — null = ใช้ Template default |

<details>
<summary>📦 Seed Data (4 rows)</summary>

| visit_purpose_id | slip_template_id |
|----|----|
| 1 | — |
| 2 | — |
| 3 | 1 |
| 4 | 1 |

</details>

**ความสัมพันธ์:**
- visit_slip_templates 1 ──→ N visit_slip_sections (แต่ละ Template มีหลาย Section — 10 sections default)
- visit_slip_sections 1 ──→ N visit_slip_fields (แต่ละ Section มีหลาย Field — 30 fields default)
- visit_slip_templates 1 ←──→ N visit_purposes ผ่าน purpose_slip_mappings
- visit_slip_templates.logo_url → ไฟล์โลโก้ที่อัปโหลดใน /uploads/ (null = ใช้ค่าเริ่มต้น)
- purpose_slip_mappings.slip_template_id = null → ใช้ Template ที่ is_default=true

---
## 11. PDPA / นโยบายคุ้มครองข้อมูล

**เมนู:** PDPA / นโยบายคุ้มครองข้อมูล
**Path:** `/web/settings/pdpa-consent`
**คำอธิบาย:** จัดการข้อความนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) 2 ภาษา — แสดงบน Kiosk/LINE OA, ตั้งค่า retention, เลือกช่องทางแสดง, ประวัติเวอร์ชัน, และ log การยินยอม

### 11.1 `pdpa_consent_configs` — ตารางการตั้งค่า PDPA หลัก — ข้อความนโยบาย 2 ภาษา, ระยะเวลาเก็บข้อมูล, เงื่อนไข UI, ช่องทางแสดง

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT AUTO_INCREMENT | ✗ | รหัสการตั้งค่า (PK) |
| text_th | TEXT | ✗ | เนื้อหานโยบาย PDPA (ภาษาไทย) |
| text_en | TEXT | ✗ | เนื้อหานโยบาย PDPA (ภาษาอังกฤษ) |
| retention_days | INT | ✗ | ระยะเวลาจัดเก็บข้อมูล (วัน) | 90 |
| require_scroll | BOOLEAN | ✗ | ต้องเลื่อนอ่านจบก่อนยอมรับ | true |
| display_channels | JSON | ✗ | ช่องทางที่แสดง consent เช่น ["kiosk","line"] — บางเวอร์ชันอาจแสดงเฉพาะ Kiosk หรือ LINE OA | ["kiosk","line"] |
| is_active | BOOLEAN | ✗ | สถานะเปิด/ปิดใช้งาน | true |
| version | INT | ✗ | เลขเวอร์ชัน (เพิ่มทุกครั้งที่แก้ไขข้อความ) | 1 |
| updated_by 🔗 | INT | ✓ | FK → staff.id ผู้แก้ไขล่าสุด |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | text_th | text_en | retention_days | require_scroll | display_channels | is_active | version | updated_by |
|----|----|----|----|----|----|----|----|----|
| 1 | พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

กระทรวงการท่องเที่ยวและกีฬา ("หน่วยงาน") จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน... | Personal Data Protection Act B.E. 2562 (PDPA)

The Ministry of Tourism and Sports ("the Organization") will collect, use, and disclose your personal data... | 90 | ✅ | ["kiosk","line"] | ✅ | 1 | — |

</details>

### 11.2 `pdpa_consent_versions` — ประวัติเวอร์ชัน PDPA — เก็บทุกครั้งที่มีการแก้ไขข้อความหรือสร้างใหม่ สำหรับ audit trail

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT AUTO_INCREMENT | ✗ | รหัสเวอร์ชัน (PK) |
| config_id 🔗 | INT | ✗ | FK → pdpa_consent_configs.id |
| version | INT | ✗ | เลขเวอร์ชัน |
| text_th | TEXT | ✗ | เนื้อหา TH ณ เวอร์ชันนั้น |
| text_en | TEXT | ✗ | เนื้อหา EN ณ เวอร์ชันนั้น |
| retention_days | INT | ✗ | ระยะเวลาเก็บข้อมูล ณ เวอร์ชันนั้น |
| require_scroll | BOOLEAN | ✗ | ต้องเลื่อนอ่านจบก่อนยอมรับ | true |
| display_channels | JSON | ✗ | ช่องทางที่แสดง consent ณ เวอร์ชันนั้น เช่น ["kiosk"] หรือ ["kiosk","line"] | ["kiosk","line"] |
| is_active | BOOLEAN | ✗ | เวอร์ชันที่ใช้งานอยู่ (active ได้ 1 เวอร์ชัน) | false |
| effective_date | DATE | ✗ | วันที่มีผลบังคับใช้ |
| changed_by 🔗 | INT | ✓ | FK → staff.id ผู้แก้ไข |
| change_note | VARCHAR(255) | ✓ | หมายเหตุการเปลี่ยนแปลง |
| created_at | TIMESTAMP | ✗ | วันที่บันทึกเวอร์ชัน | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (3 rows)</summary>

| id | config_id | version | text_th | text_en | retention_days | require_scroll | display_channels | is_active | effective_date | changed_by | change_note |
|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | 1 | 1 | (ข้อความ PDPA v1)... | (PDPA text v1)... | 90 | ✅ | ["kiosk","line"] | ❌ | 2025-01-01 | — | เวอร์ชันเริ่มต้น |
| 2 | 1 | 2 | (ข้อความ PDPA v2 + สิทธิเจ้าของข้อมูล)... | (PDPA text v2 + data subject rights)... | 90 | ✅ | ["kiosk","line"] | ❌ | 2025-06-01 | 1 | เพิ่มสิทธิเจ้าของข้อมูล + ทะเบียนรถ |
| 3 | 1 | 3 | (ข้อความ PDPA v3 + การเปิดเผยข้อมูล)... | (PDPA text v3 + data disclosure)... | 120 | ✅ | ["kiosk"] | ✅ | 2026-01-15 | 1 | เพิ่มหมวดการเปิดเผยข้อมูล + retention 120 วัน |

</details>

### 11.3 `pdpa_consent_logs` — บันทึกการยินยอม PDPA ของผู้เยี่ยม — เก็บทุกครั้งที่ผู้เยี่ยมกดยอมรับบน Kiosk/LINE OA

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT AUTO_INCREMENT | ✗ | รหัส Log (PK) |
| visitor_id 🔗 | INT | ✗ | FK → visitors.id ผู้เยี่ยมที่ยินยอม |
| config_version | INT | ✗ | เลขเวอร์ชัน PDPA ที่ยินยอม |
| consent_channel | ENUM('kiosk','line','counter','web') | ✗ | ช่องทางที่ยินยอม |
| ip_address | VARCHAR(45) | ✓ | IP ของอุปกรณ์ที่ใช้ |
| device_id | VARCHAR(100) | ✓ | รหัส Kiosk/อุปกรณ์ |
| consented_at | TIMESTAMP | ✗ | วันเวลาที่ยินยอม | CURRENT_TIMESTAMP |
| expires_at | TIMESTAMP | ✗ | วันหมดอายุ (consented_at + retention_days) |

<details>
<summary>📦 Seed Data (3 rows)</summary>

| id | visitor_id | config_version | consent_channel | ip_address | device_id | consented_at | expires_at |
|----|----|----|----|----|----|----|----|
| 1 | 1 | 1 | kiosk | 192.168.1.100 | KIOSK-01 | 2026-03-15 09:30:00 | 2026-06-13 09:30:00 |
| 2 | 2 | 1 | line | — | — | 2026-03-15 10:15:00 | 2026-06-13 10:15:00 |
| 3 | 3 | 1 | counter | 192.168.1.50 | COUNTER-01 | 2026-03-14 14:00:00 | 2026-06-12 14:00:00 |

</details>

**ความสัมพันธ์:**
- pdpa_consent_configs 1 ──→ N pdpa_consent_versions (ทุกครั้งที่แก้ไขหรือสร้างใหม่ → สร้าง version ใหม่)
- pdpa_consent_logs.config_version ──→ pdpa_consent_versions.version (อ้างอิงเวอร์ชันที่ยินยอม)
- pdpa_consent_logs.visitor_id ──→ visitors.id (ผู้เยี่ยมที่ยินยอม)
- pdpa_consent_configs.updated_by ──→ staff.id (ผู้แก้ไขล่าสุด)
- Kiosk/LINE OA ──→ ตรวจ display_channels ก่อนแสดง consent (แสดงเฉพาะช่องทางที่กำหนด)

---
## 12. ข้อมูลธุรกรรมการเข้าพื้นที่

**เมนู:** ข้อมูลธุรกรรมการเข้าพื้นที่
**Path:** `/web/appointments`
**คำอธิบาย:** ตารางเก็บข้อมูลการนัดหมายและเข้าพื้นที่ — สร้างจาก LINE / Web / Kiosk / Counter

### 12.1 `visit_records` — ตารางบันทึกการนัดหมาย/เข้าพื้นที่ — ทุกช่องทาง

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสธุรกรรม (PK, running number เริ่มจาก 1) |
| booking_code 🔒 | VARCHAR(30) | ✗ | รหัสนัดหมาย eVMS-YYYYMMDD-XXXX |
| visitor_id 🔗 | INT | ✗ | FK → visitors.id |
| host_staff_id 🔗 | INT | ✓ | FK → staff.id ผู้ที่ต้องการพบ |
| visit_purpose_id 🔗 | INT | ✗ | FK → visit_purposes.id |
| department_id 🔗 | INT | ✗ | FK → departments.id |
| entry_mode | ENUM('single','period') | ✗ | ครั้งเดียว / ช่วงเวลา | single |
| date_start | DATE | ✗ | วันเริ่มต้น |
| date_end | DATE | ✓ | วันสิ้นสุด (เฉพาะ period mode) |
| time_start | TIME | ✗ | เวลาเริ่ม |
| time_end | TIME | ✗ | เวลาสิ้นสุด |
| status | ENUM('pending','approved','rejected','checked-in','checked-out','cancelled','expired','no-show') | ✗ | สถานะรายการ | pending |
| created_channel | ENUM('line','web','kiosk','counter') | ✗ | ช่องทางที่สร้างรายการ |
| checkin_channel | ENUM('kiosk','counter') | ✓ | ช่องทางที่ Check-in จริง |
| wifi_requested | BOOLEAN | ✗ | ผู้จองขอรับ WiFi ไว้ตอนนัดหมายล่วงหน้า (LINE/Web) | false |
| wifi_accepted | BOOLEAN | ✓ | ผู้เยี่ยมยืนยันรับ WiFi ตอน Check-in (Kiosk/Counter) |
| wifi_ssid | VARCHAR(50) | ✓ | SSID ที่แจก (ถ้ารับ WiFi) |
| wifi_password | VARCHAR(50) | ✓ | รหัส WiFi ที่แจก |
| wifi_valid_until | TIMESTAMP | ✓ | WiFi ใช้ได้ถึงเมื่อไร |
| line_linked | BOOLEAN | ✗ | ผู้เยี่ยมผูก LINE OA ณ เวลา check-in — snapshot จาก visitors.line_user_id IS NOT NULL (denormalize เพื่อ performance, ไม่ต้อง JOIN) | false |
| slip_printed | BOOLEAN | ✓ | พิมพ์ slip หรือไม่ (null = ไม่ได้ถาม, true = พิมพ์, false = ไม่พิมพ์/ส่ง LINE) |
| slip_number | VARCHAR(30) | ✓ | เลขที่ slip eVMS-25680315-0042 |
| companions_count | INT | ✗ | จำนวนผู้ติดตาม | 0 |
| vehicle_plate | VARCHAR(20) | ✓ | เลขทะเบียนรถ (ถ้ามี) |
| face_photo_path | VARCHAR(255) | ✓ | ที่เก็บภาพถ่ายใบหน้า |
| id_method | ENUM('thai-id-card','passport','thai-id-app') | ✓ | วิธียืนยันตัวตนที่ใช้ตอน Check-in |
| service_point_id 🔗 | INT | ✓ | FK → service_points.id จุดบริการที่ Check-in |
| checkin_at | TIMESTAMP | ✓ | วันเวลาที่ Check-in จริง |
| checkout_at | TIMESTAMP | ✓ | วันเวลาที่ Check-out |
| checkout_by 🔗 | INT | ✓ | FK → staff.id ผู้ทำ Check-out |
| approved_by 🔗 | INT | ✓ | FK → staff.id ผู้อนุมัติ |
| approved_at | TIMESTAMP | ✓ | วันเวลาที่อนุมัติ |
| rejected_reason | TEXT | ✓ | เหตุผลที่ไม่อนุมัติ |
| notes | TEXT | ✓ | หมายเหตุเพิ่มเติม |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (3 rows)</summary>

| id | booking_code | visitor_id | host_staff_id | visit_purpose_id | department_id | entry_mode | date_start | time_start | time_end | status | created_channel | wifi_requested | line_linked | slip_printed | companions_count | created_at |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | eVMS-20260315-0042 | 1 | 2 | 2 | 3 | single | 2026-03-15 | 10:00 | 11:30 | approved | line | ✅ | ✅ | — | 0 | 2026-03-14 15:30:00 |
| 2 | eVMS-20260315-0043 | 2 | 3 | 1 | 1 | single | 2026-03-15 | 14:00 | 15:00 | checked-in | web | ❌ | ❌ | ✅ | 1 | 2026-03-13 09:00:00 |
| 3 | eVMS-20260315-0044 | 3 | 5 | 5 | 2 | single | 2026-03-15 | 09:00 | 10:30 | checked-in | line | ✅ | ✅ | ❌ | 0 | 2026-03-12 11:00:00 |

</details>

**ความสัมพันธ์:**
- visit_records.visitor_id ──→ visitors.id (ผู้เยี่ยม)
- visit_records.host_staff_id ──→ staff.id (ผู้ที่ต้องการพบ)
- visit_records.visit_purpose_id ──→ visit_purposes.id (วัตถุประสงค์)
- visit_records.department_id ──→ departments.id (แผนก)
- visit_records.service_point_id ──→ service_points.id (จุดบริการที่ Check-in)
- visit_records.approved_by ──→ staff.id (ผู้อนุมัติ)
- visit_records.checkout_by ──→ staff.id (ผู้ทำ Check-out)
- wifi_requested = true → Kiosk จะ pre-select WiFi ให้อัตโนมัติ
- line_linked = true + slip_printed = false → ส่งผ่าน LINE แทนพิมพ์ (ลดกระดาษ)
- line_linked = true → หน้า SUCCESS ถามว่าต้องการพิมพ์ slip หรือไม่

---
## 13. การนัดหมาย

**เมนู:** การนัดหมาย
**Path:** `/web/appointments`
**คำอธิบาย:** จัดการนัดหมายผู้มาติดต่อ — สร้าง/อนุมัติ/ปฏิเสธ, ค้นหา, ติดตามสถานะ, จัดการผู้ติดตาม, WiFi

API Endpoints:
• GET /api/appointments — รายการนัดหมาย (filter: status, date, type, created_by, search)
• GET /api/appointments/:id — รายละเอียดนัดหมาย
• POST /api/appointments — สร้างนัดหมายใหม่
• PATCH /api/appointments/:id — แก้ไข/อนุมัติ/ปฏิเสธ
• DELETE /api/appointments/:id — ยกเลิกนัดหมาย
• GET /api/appointments/:id/companions — รายชื่อผู้ติดตาม
• POST /api/appointments/:id/companions — เพิ่มผู้ติดตาม
• GET /api/appointments/:id/equipment — รายการอุปกรณ์

### 13.1 `visitors` — ตารางผู้มาติดต่อ — เก็บข้อมูลผู้เยี่ยมทุกคนที่เคยลงทะเบียนในระบบ

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสผู้มาติดต่อ (PK, running number เริ่มจาก 1) |
| first_name | VARCHAR(100) | ✗ | ชื่อ (ไม่รวมคำนำหน้า) |
| last_name | VARCHAR(100) | ✗ | นามสกุล |
| first_name_en | VARCHAR(100) | ✓ | ชื่อ (English) |
| last_name_en | VARCHAR(100) | ✓ | นามสกุล (English) |
| name | VARCHAR(200) | ✗ | ชื่อเต็ม (คำนำหน้า+ชื่อ+สกุล) — generated/computed |
| name_en | VARCHAR(200) | ✓ | ชื่อเต็ม English — generated/computed |
| id_number | VARCHAR(20) | ✗ | เลขบัตรประชาชน / Passport |
| id_type | ENUM('thai-id','passport','driver-license') | ✗ | ประเภทเอกสารยืนยันตัวตน |
| company | VARCHAR(150) | ✓ | บริษัท / หน่วยงาน |
| phone | VARCHAR(20) | ✗ | เบอร์โทรศัพท์ |
| email | VARCHAR(100) | ✓ | อีเมล |
| line_user_id 🔒 | VARCHAR(50) | ✓ | LINE User ID — ได้จาก LINE Login/LIFF (null = ยังไม่ผูก) |
| line_display_name | VARCHAR(100) | ✓ | LINE Display Name |
| line_linked_at | TIMESTAMP | ✓ | วันเวลาที่ผูกบัญชี LINE |
| photo | VARCHAR(255) | ✓ | URL รูปถ่ายใบหน้า |
| nationality | VARCHAR(50) | ✓ | สัญชาติ |
| is_blocked | BOOLEAN | ✗ | สถานะถูกบล็อก | false |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | name | name_en | id_number | id_type | company | phone | email | nationality | is_blocked |
|----|----|----|----|----|----|----|----|----|----|
| 1 | นายวิชัย สุขสำราญ | Wichai Suksamran | 1100700123456 | thai-id | บจก. เทคโนโลยีสยาม | 081-234-5678 | wichai@siamtech.co.th | ไทย | ❌ |
| 2 | นางสาวพรทิพย์ มีสุข | Porntip Meesuk | 1103700234567 | thai-id | บจก. ท่องเที่ยวไทย | 089-876-5432 | porntip@tourismthai.com | ไทย | ❌ |
| 3 | Mr. James Wilson | James Wilson | AB1234567 | passport | World Tourism Org | 092-345-6789 | j.wilson@unwto.org | British | ❌ |
| 4 | นายสมศักดิ์ จริงใจ | Somsak Jingjai | 1100700345678 | thai-id | บจก. คอนสตรัคชั่น พลัส | 086-111-2222 | undefined | ไทย | ❌ |
| 5 | นางสาวอรุณี แสงดาว | Arunee Saengdao | 1101800456789 | thai-id | สำนักข่าว TNN | 085-333-4444 | arunee@tnn.co.th | ไทย | ❌ |

</details>

### 13.2 `staff` — ตารางเจ้าหน้าที่ / พนักงาน — ใช้เป็น host ผู้ที่ต้องการพบ และผู้อนุมัติ

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสเจ้าหน้าที่ (PK, running number เริ่มจาก 1) |
| employee_id 🔒 | VARCHAR(20) | ✗ | รหัสพนักงาน เช่น EMP-001 |
| name | VARCHAR(100) | ✗ | ชื่อ-นามสกุล (ภาษาไทย) |
| name_en | VARCHAR(100) | ✗ | ชื่อ-นามสกุล (ภาษาอังกฤษ) |
| position | VARCHAR(150) | ✗ | ตำแหน่ง |
| department_id 🔗 | INT | ✗ | FK → departments.id แผนกที่สังกัด |
| email | VARCHAR(100) | ✗ | อีเมลราชการ |
| phone | VARCHAR(20) | ✗ | เบอร์โทรศัพท์ |
| role | ENUM('admin','supervisor','officer','staff','security','visitor') | ✗ | บทบาทในระบบ |
| status | ENUM('active','inactive','locked') | ✗ | สถานะบัญชี | active |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | employee_id | name | name_en | position | department_id | email | phone | role | status |
|----|----|----|----|----|----|----|----|----|----|
| 1 | EMP-001 | คุณสมศรี รักงาน | Somsri Rakngarn | ผู้อำนวยการกองกิจการท่องเที่ยว | 4 | somsri.r@mots.go.th | 02-283-1500 | staff | active |
| 2 | EMP-002 | คุณประวิทย์ ศรีสุข | Prawit Srisuk | หัวหน้าฝ่ายบริหารทั่วไป | 2 | prawit.s@mots.go.th | 02-283-1501 | supervisor | active |
| 3 | EMP-003 | คุณนภา ใจดี | Napa Jaidee | นักวิเคราะห์นโยบาย | 8 | napa.j@mots.go.th | 02-283-1502 | staff | active |
| 4 | EMP-004 | คุณธนกร วงศ์สวัสดิ์ | Thanakorn Wongsawat | เจ้าหน้าที่ รปภ. | 2 | thanakorn.w@mots.go.th | 02-283-1510 | security | active |
| 5 | EMP-005 | คุณอรพิณ วรรณภา | Orapin Wannapa | ผู้อำนวยการกองการต่างประเทศ | 3 | orapin.w@mots.go.th | 02-283-1520 | staff | active |

</details>

### 13.3 `appointments` — หลัก — ข้อมูลนัดหมาย (id เป็น INT running number ไม่ใช่ SERIAL — generate ฝั่ง application)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสนัดหมาย (PK, running number เริ่มจาก 1 — generate ฝั่ง app: SELECT COALESCE(MAX(id),0)+1) |
| booking_code 🔒 | VARCHAR(30) | ✗ | รหัสนัดหมาย format: eVMS-YYYYMMDD-XXXX (running 4 หลัก reset ทุกวัน) |
| visitor_id 🔗 | INT | ✗ | FK → visitors.id ผู้มาติดต่อ |
| host_staff_id 🔗 | INT | ✓ | FK → staff.id ผู้ที่ต้องการพบ (null ถ้า require_person_name=false) |
| visit_purpose_id 🔗 | INT | ✗ | FK → visit_purposes.id วัตถุประสงค์ |
| department_id 🔗 | INT | ✗ | FK → departments.id แผนกที่ไป |
| type | ENUM('official','meeting','document','contractor','delivery','other') | ✗ | ประเภทการนัดหมาย (VisitType) |
| status | ENUM('pending','approved','rejected','confirmed','cancelled','expired') | ✗ | สถานะนัดหมาย (VisitStatus) | pending |
| entry_mode | ENUM('single','period') | ✗ | ครั้งเดียว / ช่วงเวลา | single |
| date_start | DATE | ✗ | วันเริ่มต้นนัดหมาย |
| date_end | DATE | ✓ | วันสิ้นสุด (เฉพาะ period mode) |
| time_start | TIME | ✗ | เวลาเริ่ม |
| time_end | TIME | ✗ | เวลาสิ้นสุด |
| purpose | VARCHAR(255) | ✗ | วัตถุประสงค์การนัดหมาย (ข้อความอิสระ) |
| companions_count | INT | ✗ | จำนวนผู้ติดตาม | 0 |
| created_by | ENUM('visitor','staff') | ✗ | สร้างโดยผู้มาติดต่อหรือเจ้าหน้าที่ |
| created_by_staff_id 🔗 | INT | ✓ | FK → staff.id ถ้าสร้างโดยเจ้าหน้าที่ |
| offer_wifi | BOOLEAN | ✗ | เสนอ WiFi ให้ผู้มาติดต่อ | false |
| wifi_requested | BOOLEAN | ✗ | ผู้มาติดต่อขอรับ WiFi | false |
| notify_on_checkin | BOOLEAN | ✗ | แจ้งเตือนเมื่อ visitor check-in (ปิดได้ทีละรายการ) | true |
| group_id 🔗 | INT | ✓ | FK → appointment_groups.id (null = ไม่ได้อยู่ใน group) |
| area | VARCHAR(100) | ✓ | พื้นที่ |
| building | VARCHAR(100) | ✓ | อาคาร |
| floor | VARCHAR(20) | ✓ | ชั้น |
| room | VARCHAR(50) | ✓ | ห้อง |
| vehicle_plate | VARCHAR(20) | ✓ | เลขทะเบียนรถ (ถ้ามี) |
| notes | TEXT | ✓ | หมายเหตุเพิ่มเติม |
| approved_by 🔗 | INT | ✓ | FK → staff.id ผู้อนุมัติ |
| approved_at | TIMESTAMP | ✓ | วันเวลาที่อนุมัติ |
| rejected_at | TIMESTAMP | ✓ | วันเวลาที่ปฏิเสธ |
| rejected_reason | TEXT | ✓ | เหตุผลที่ปฏิเสธ |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | code | visitor_id | host_id | visit_purpose_id | department_id | type | status | entry_mode | date_start | time_start | time_end | purpose | companions_count | created_by | offer_wifi | wifi_requested | area | building | floor | room | created_at | approved_by | approved_at |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | eVMS-20260320-0001 | 1 | 2 | 1 | 2 | official | approved | single | 2026-03-20 | 10:00 | 11:30 | ประชุมโครงการจัดงาน | 0 | visitor | ✅ | ✅ | กองกลาง | ศูนย์ราชการ อาคาร C | ชั้น 2 | ห้องประชุม 201 | 2026-03-19 14:00:00 | 2 | 2026-03-19 15:30:00 |
| 2 | eVMS-20260320-0002 | 2 | 3 | 3 | 8 | document | confirmed | single | 2026-03-20 | 14:00 | 15:00 | ส่งเอกสารโครงการ | 1 | staff | ❌ | ❌ | สำนักนโยบาย | ศูนย์ราชการ อาคาร C | ชั้น 4 | undefined | 2026-03-18 09:00:00 | 3 | 2026-03-18 10:00:00 |
| 3 | eVMS-20260321-0001 | 3 | 5 | 2 | 3 | meeting | pending | single | 2026-03-21 | 09:00 | 10:30 | ประชุมความร่วมมือด้านการท่องเที่ยวระหว่างประเทศ | 2 | staff | ✅ | ❌ | กองการต่างประเทศ | ศูนย์ราชการ อาคาร C | ชั้น 5 | ห้องประชุม 501 | 2026-03-17 11:00:00 | undefined | undefined |
| 4 | eVMS-20260321-0002 | 4 | 1 | 4 | 4 | contractor | approved | period | 2026-03-21 | 08:00 | 17:00 | ซ่อมบำรุงระบบแอร์ ชั้น 4 | 3 | staff | ❌ | undefined | กองกิจการท่องเที่ยว | ศูนย์ราชการ อาคาร C | ชั้น 4 | undefined | 2026-03-16 08:30:00 | 1 | 2026-03-16 09:00:00 |
| 5 | eVMS-20260320-0003 | 5 | 3 | 1 | 8 | official | expired | single | 2026-03-20 | 09:00 | 11:00 | สัมภาษณ์ข่าวนโยบายท่องเที่ยว | 0 | visitor | ✅ | ✅ | สำนักนโยบาย | ศูนย์ราชการ อาคาร C | ชั้น 4 | undefined | 2026-03-19 16:00:00 | 3 | 2026-03-19 17:00:00 |

</details>

### 13.4 `appointment_companions` — ตารางผู้ติดตาม — แยกรายชื่อแต่ละคนสำหรับ check-in แยก

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสผู้ติดตาม (PK, running number) |
| appointment_id 🔗 | INT | ✗ | FK → appointments.id |
| first_name | VARCHAR(100) | ✗ | ชื่อ |
| last_name | VARCHAR(100) | ✗ | นามสกุล |
| company | VARCHAR(150) | ✓ | บริษัท/หน่วยงาน |
| phone | VARCHAR(20) | ✓ | เบอร์โทร |
| is_checked_in | BOOLEAN | ✗ | Check-in แล้วหรือยัง | false |
| checkin_at | TIMESTAMP | ✓ | วันเวลาที่ Check-in |
| is_blacklisted | BOOLEAN | ✗ | ตรวจพบอยู่ใน Blocklist | false |

<details>
<summary>📦 Seed Data (6 rows)</summary>

| id | appointment_id | first_name | last_name | company | phone | is_checked_in | checkin_at | is_blacklisted |
|----|----|----|----|----|----|----|----|----|
| 1 | 2 | สมศักดิ์ | มั่นคง | บจก. ท่องเที่ยวไทย | 081-999-8888 | ✅ | 2026-03-20 13:55:00 | ❌ |
| 2 | 3 | Sarah | Johnson | World Tourism Org | — | ❌ | undefined | ❌ |
| 3 | 3 | David | Lee | UNWTO Asia-Pacific | — | ❌ | undefined | ❌ |
| 4 | 4 | สมชาย | ช่างดี | บจก. คอนสตรัคชั่น พลัส | 086-222-3333 | ❌ | undefined | ❌ |
| 5 | 4 | วิชัย | ช่างเก่ง | บจก. คอนสตรัคชั่น พลัส | 086-444-5555 | ❌ | undefined | ❌ |
| 6 | 4 | สุรศักดิ์ | แข็งแรง | บจก. คอนสตรัคชั่น พลัส | 086-666-7777 | ❌ | undefined | ❌ |

</details>

### 13.5 `appointment_equipment` — อุปกรณ์ที่นำเข้า — ผูกกับนัดหมาย

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสอุปกรณ์ (PK, running number) |
| appointment_id 🔗 | INT | ✗ | FK → appointments.id |
| name | VARCHAR(100) | ✗ | ชื่ออุปกรณ์ |
| quantity | INT | ✗ | จำนวน | 1 |
| serial_number | VARCHAR(100) | ✓ | หมายเลขเครื่อง / Serial |
| description | TEXT | ✓ | รายละเอียดเพิ่มเติม |

<details>
<summary>📦 Seed Data (3 rows)</summary>

| id | appointment_id | name | quantity | serial_number | description |
|----|----|----|----|----|----|
| 1 | 3 | โน้ตบุ๊ก | 2 | SN-WTO-001 | Laptop สำหรับนำเสนอ |
| 2 | 4 | เครื่องมือซ่อมบำรุง | 1 | — | ชุดเครื่องมือช่างแอร์ |
| 3 | 4 | อะไหล่ | 5 | — | Filter แอร์ ชั้น 4 |

</details>

### 13.6 `appointment_status_logs` — บันทึกการเปลี่ยนสถานะนัดหมาย — สำหรับ audit trail

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัส Log (PK, running number) |
| appointment_id 🔗 | INT | ✗ | FK → appointments.id |
| from_status | VARCHAR(30) | ✓ | สถานะเดิม (null = สร้างใหม่) |
| to_status | VARCHAR(30) | ✗ | สถานะใหม่ |
| changed_by 🔗 | INT | ✓ | FK → staff.id ผู้เปลี่ยน (null = system/visitor) |
| reason | TEXT | ✓ | เหตุผลการเปลี่ยนสถานะ |
| created_at | TIMESTAMP | ✗ | วันเวลาที่เปลี่ยน | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | appointment_id | from_status | to_status | changed_by | reason | created_at |
|----|----|----|----|----|----|----|
| 1 | 1 | — | pending | — | สร้างนัดหมายผ่าน LINE OA | 2026-03-19 14:00:00 |
| 2 | 1 | pending | approved | 2 | อนุมัติ | 2026-03-19 15:30:00 |
| 3 | 2 | — | pending | 4 | เจ้าหน้าที่สร้างให้ | 2026-03-18 09:00:00 |
| 4 | 2 | pending | approved | 3 | อนุมัติ | 2026-03-18 10:00:00 |
| 5 | 2 | approved | checked-in | — | Check-in ผ่าน Kiosk | 2026-03-20 13:55:00 |

</details>

**ความสัมพันธ์:**
- appointments.visitor_id ──→ visitors.id (ผู้มาติดต่อ)
- appointments.host_id ──→ staff.id (ผู้ที่ต้องการพบ — เจ้าหน้าที่ผู้รับ)
- appointments.visit_purpose_id ──→ visit_purposes.id (วัตถุประสงค์)
- appointments.department_id ──→ departments.id (แผนกปลายทาง)
- appointments.approved_by ──→ staff.id (ผู้อนุมัติ)
- appointments.created_by_staff_id ──→ staff.id (เจ้าหน้าที่ผู้สร้างนัดหมาย)
- appointment_companions.appointment_id ──→ appointments.id (ผู้ติดตาม — check-in แยกรายคน)
- appointment_equipment.appointment_id ──→ appointments.id (อุปกรณ์ที่นำเข้า)
- appointment_status_logs.appointment_id ──→ appointments.id (ประวัติเปลี่ยนสถานะ — audit trail)
- ID Generation: appointments.id ใช้ INT running number — app generate ด้วย SELECT COALESCE(MAX(id),0)+1 (ไม่ใช้ SERIAL/AUTO_INCREMENT)
- Code Format: eVMS-YYYYMMDD-XXXX — running 4 หลัก reset ทุกวัน

---
## 14. บันทึกการเข้าพื้นที่

**เมนู:** บันทึกการเข้าพื้นที่
**Path:** `/web/visit-entries`
**คำอธิบาย:** บันทึกการเข้าพื้นที่ — แยกจาก appointments เพื่อรองรับทั้ง walk-in และ appointment-linked entries รวมถึง period appointment ที่มีหลาย entries

### 14.1 `visit_entries` — ตารางบันทึกการเข้าพื้นที่ — แยก entry records จาก appointments (รองรับ walk-in และ appointment-linked)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสการเข้าพื้นที่ (PK, auto-increment) |
| entry_code 🔒 | VARCHAR(30) | ✗ | รหัสเข้าพื้นที่ format: eVMS-ENTRY-YYYYMMDD-XXXX |
| appointment_id 🔗 | INT | ✓ | FK → appointments.id (NULL = walk-in) |
| visitor_id 🔗 | INT | ✗ | FK → visitors.id |
| status | ENUM('checked-in','checked-out','auto-checkout','overstay') | ✗ | สถานะการเข้าพื้นที่ |
| purpose | VARCHAR(200) | ✓ | Walk-in only: วัตถุประสงค์ |
| visit_type | ENUM('official','meeting','document','contractor','delivery','other') | ✓ | Walk-in only: ประเภทการเข้าพื้นที่ |
| host_staff_id 🔗 | INT | ✓ | Walk-in only: FK → staff.id |
| department_id 🔗 | INT | ✓ | Walk-in only: FK → departments.id |
| checkin_at | TIMESTAMP | ✗ | เวลาเข้าจริง |
| checkin_channel | ENUM('kiosk','counter') | ✗ | ช่องทาง check-in |
| checkout_at | TIMESTAMP | ✓ | เวลาออก |
| checkout_by 🔗 | INT | ✓ | FK → staff.id (เจ้าหน้าที่ทำ checkout) |
| area | VARCHAR(100) | ✗ | พื้นที่ |
| building | VARCHAR(100) | ✗ | อาคาร |
| floor | VARCHAR(20) | ✗ | ชั้น |
| room | VARCHAR(50) | ✓ | ห้อง |
| slip_printed | BOOLEAN | ✓ | พิมพ์ slip แล้วหรือไม่ |
| wifi_username | VARCHAR(50) | ✓ | WiFi username |
| wifi_password | VARCHAR(50) | ✓ | WiFi password |
| id_method | ENUM('thai-id-card','passport','thai-id-app') | ✓ | วิธียืนยันตัวตน |
| service_point_id 🔗 | INT | ✓ | FK → service_points.id |
| face_photo_path | VARCHAR(255) | ✓ | รูปถ่ายหน้า |
| companions_count | INT | ✗ | จำนวนผู้ติดตาม | 0 |
| notes | TEXT | ✓ | หมายเหตุ |
| created_at | TIMESTAMP | ✗ | เวลาสร้าง | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (8 rows)</summary>

| id | entry_code | appointment_id | visitor_id | status | purpose | visit_type | host_staff_id | department_id | checkin_at | checkin_channel | checkout_at | checkout_by | area | building | floor | room | slip_printed | wifi_username | wifi_password | id_method | service_point_id | face_photo_path | companions_count | notes |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | eVMS-ENTRY-20260320-0001 | — | 1 | checked-out | ส่งเอกสารด่วน | document | 2 | 2 | 2026-03-20 09:15:00 | counter | 2026-03-20 09:45:00 | 4 | กองกลาง | ศูนย์ราชการ อาคาร C | ชั้น 2 | — | ✅ | — | — | thai-id-card | 1 | — | 0 | — |
| 2 | eVMS-ENTRY-20260320-0002 | — | 4 | checked-in | ซ่อมแอร์ ชั้น 3 | contractor | 1 | 4 | 2026-03-20 10:30:00 | kiosk | — | — | กองกิจการท่องเที่ยว | ศูนย์ราชการ อาคาร C | ชั้น 3 | — | ✅ | — | — | thai-id-card | 2 | /photos/entry-2.jpg | 1 | ผู้รับเหมา walk-in |
| 3 | eVMS-ENTRY-20260320-0003 | 2 | 2 | checked-out | — | — | — | — | 2026-03-20 13:55:00 | kiosk | 2026-03-20 14:50:00 | 4 | สำนักนโยบาย | ศูนย์ราชการ อาคาร C | ชั้น 4 | — | ✅ | — | — | thai-id-card | 1 | — | 1 | — |
| 4 | eVMS-ENTRY-20260320-0004 | 5 | 5 | checked-out | — | — | — | — | 2026-03-20 08:50:00 | counter | 2026-03-20 10:45:00 | 4 | สำนักนโยบาย | ศูนย์ราชการ อาคาร C | ชั้น 4 | — | ❌ | guest-0320-05 | Mots@2026 | thai-id-card | 1 | — | 0 | — |
| 5 | eVMS-ENTRY-20260321-0001 | 4 | 4 | checked-out | — | — | — | — | 2026-03-21 08:10:00 | kiosk | 2026-03-21 17:05:00 | 4 | กองกิจการท่องเที่ยว | ศูนย์ราชการ อาคาร C | ชั้น 4 | — | ✅ | — | — | thai-id-card | 2 | /photos/entry-5.jpg | 3 | ซ่อมบำรุงระบบแอร์ วันที่ 1 |
| 6 | eVMS-ENTRY-20260322-0001 | 4 | 4 | checked-out | — | — | — | — | 2026-03-22 08:05:00 | kiosk | 2026-03-22 16:50:00 | 4 | กองกิจการท่องเที่ยว | ศูนย์ราชการ อาคาร C | ชั้น 4 | — | ✅ | — | — | thai-id-card | 2 | /photos/entry-6.jpg | 3 | ซ่อมบำรุงระบบแอร์ วันที่ 2 |
| 7 | eVMS-ENTRY-20260323-0001 | 4 | 4 | checked-in | — | — | — | — | 2026-03-23 08:15:00 | kiosk | — | — | กองกิจการท่องเที่ยว | ศูนย์ราชการ อาคาร C | ชั้น 4 | — | ✅ | — | — | thai-id-card | 2 | /photos/entry-7.jpg | 3 | ซ่อมบำรุงระบบแอร์ วันที่ 3 |
| 8 | eVMS-ENTRY-20260320-0005 | — | 3 | overstay | ประสานงานโครงการ | official | 5 | 3 | 2026-03-20 14:00:00 | counter | — | — | กองการต่างประเทศ | ศูนย์ราชการ อาคาร C | ชั้น 5 | ห้อง 502 | ✅ | guest-0320-08 | Mots@2026 | passport | 1 | /photos/entry-8.jpg | 0 | ประสานงานล่วงเวลา |

</details>

**ความสัมพันธ์:**
- visit_entries.appointment_id ──→ appointments.id (นัดหมายที่เกี่ยวข้อง, NULL = walk-in)
- visit_entries.visitor_id ──→ visitors.id (ผู้มาติดต่อ)
- visit_entries.host_staff_id ──→ staff.id (Walk-in: ผู้ที่ต้องการพบ)
- visit_entries.department_id ──→ departments.id (Walk-in: แผนกปลายทาง)
- visit_entries.checkout_by ──→ staff.id (เจ้าหน้าที่ทำ checkout)
- visit_entries.service_point_id ──→ service_points.id (จุดบริการที่ check-in)
- appointments (1) ──→ (N) visit_entries (via appointment_id — period appointment มีหลาย entries)
- visitors (1) ──→ (N) visit_entries (via visitor_id)
- Entry Code Format: eVMS-ENTRY-YYYYMMDD-XXXX — running 4 หลัก reset ทุกวัน

---
## 15. ภาพรวม

**เมนู:** ภาพรวม
**Path:** `/web/dashboard`
**คำอธิบาย:** หน้าภาพรวมระบบ — แสดง KPI, สถานะวันนี้, แยกตามประเภท, รายการรออนุมัติ, ตารางผู้มาติดต่อทั้งหมด

API Endpoints:
• GET /api/dashboard/stats — สถิติภาพรวมวันนี้ (KPI cards)
• GET /api/dashboard/status-overview — จำนวนแยกตามสถานะ
• GET /api/dashboard/by-type — จำนวนแยกตามประเภทการเข้าพื้นที่
• GET /api/dashboard/pending — รายการรออนุมัติ
• GET /api/appointments?date=today — รายการผู้มาติดต่อวันนี้ (paginated, filterable)

### 15.1 `appointments` — ตารางนัดหมาย — แหล่งข้อมูลหลักของทุก section บน Dashboard (id = INT running number)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสนัดหมาย (PK, running number) |
| booking_code 🔒 | VARCHAR(30) | ✗ | รหัสนัดหมาย eVMS-YYYYMMDD-XXXX |
| visitor_id 🔗 | INT | ✗ | FK → visitors.id |
| host_staff_id 🔗 | INT | ✗ | FK → staff.id ผู้ที่ต้องการพบ |
| visit_purpose_id 🔗 | INT | ✗ | FK → visit_purposes.id |
| department_id 🔗 | INT | ✗ | FK → departments.id |
| type | ENUM('official','meeting','document','contractor','delivery','other') | ✗ | ประเภทการนัดหมาย — ใช้แยกข้อมูล Section 3 (By Visit Type) |
| status | ENUM('pending','approved','rejected','confirmed','checked-in','checked-out','auto-checkout','overstay','blocked','cancelled') | ✗ | สถานะ — ใช้นับ KPI ทุก Section |
| entry_mode | ENUM('single','period') | ✗ | ครั้งเดียว / ช่วงเวลา |
| date_start | DATE | ✗ | วันเริ่มต้น — ใช้ filter วันนี้ |
| date_end | DATE | ✓ | วันสิ้นสุด (period mode) |
| time_start | TIME | ✗ | เวลาเริ่ม |
| time_end | TIME | ✗ | เวลาสิ้นสุด |
| companions_count | INT | ✗ | จำนวนผู้ติดตาม | 0 |
| checkin_at | TIMESTAMP | ✓ | วันเวลาที่ Check-in |
| checkout_at | TIMESTAMP | ✓ | วันเวลาที่ Check-out |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สร้าง | CURRENT_TIMESTAMP |


### 15.2 `visitors` — ข้อมูลผู้มาติดต่อ — JOIN กับ appointments เพื่อแสดงชื่อ/บริษัทในตาราง

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | INT | ✗ | รหัสผู้มาติดต่อ (PK, running number) |
| name | VARCHAR(100) | ✗ | ชื่อ-นามสกุล (ไทย) |
| name_en | VARCHAR(100) | ✓ | ชื่อ-นามสกุล (อังกฤษ) |
| company | VARCHAR(150) | ✓ | บริษัท / หน่วยงาน |
| phone | VARCHAR(20) | ✗ | เบอร์โทรศัพท์ |
| photo | VARCHAR(255) | ✓ | URL รูปถ่าย |


### 15.3 `staff` — ข้อมูลเจ้าหน้าที่ — JOIN เพื่อแสดง host/ผู้พบ ในตาราง

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | INT | ✗ | รหัสเจ้าหน้าที่ (PK, running number) |
| name | VARCHAR(100) | ✗ | ชื่อ-นามสกุล |
| department_id 🔗 | INT | ✗ | FK → departments.id |


### 15.4 `departments` — แผนก — JOIN เพื่อแสดงชื่อแผนกในตาราง

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | INT | ✗ | รหัสแผนก (PK, running number) |
| name | VARCHAR(200) | ✗ | ชื่อแผนก (ไทย) |
| name_en | VARCHAR(200) | ✗ | ชื่อแผนก (อังกฤษ) |


**ความสัมพันธ์:**
- appointments.visitor_id ──→ visitors.id (แสดงชื่อ/บริษัทผู้มาติดต่อ)
- appointments.host_id ──→ staff.id (แสดงชื่อผู้พบ)
- staff.department_id ──→ departments.id (แสดงแผนกผู้พบ)
- appointments.department_id ──→ departments.id (แผนกปลายทาง)
- appointments.visit_purpose_id ──→ visit_purposes.id (วัตถุประสงค์)
- 
- ── Dashboard Sections → Query ──
- Section 1 (KPI Strip): SELECT COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY status
- Section 2 (Status Overview): SELECT status, COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY status
- Section 3 (By Visit Type): SELECT type, status, COUNT(*) FROM appointments WHERE date_start = CURDATE() GROUP BY type, status
- Section 4 (Pending): SELECT * FROM appointments JOIN visitors JOIN staff WHERE date_start = CURDATE() AND status = 'pending'
- Section 5 (All Today): SELECT * FROM appointments JOIN visitors JOIN staff WHERE date_start = CURDATE() ORDER BY time_start — with pagination, search, filter

---
## 16. ค้นหาผู้ติดต่อ

**เมนู:** ค้นหาผู้ติดต่อ
**Path:** `/web/search`
**คำอธิบาย:** ค้นหาผู้มาติดต่อ — ค้นหาตามชื่อ/บริษัท/รหัส, กรองตามประเภท/สถานะ/วัน, แสดงรายละเอียดผู้มาติดต่อ

### 16.1 `visitors` — ตารางผู้มาติดต่อ (reference — read-only search view)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| name | VARCHAR(100) | ✗ | ชื่อ-นามสกุล (ภาษาไทย) |
| name_en | VARCHAR(100) | ✓ | ชื่อ-นามสกุล (ภาษาอังกฤษ) |
| company | VARCHAR(150) | ✓ | บริษัท / หน่วยงาน |
| id_card | VARCHAR(20) | ✓ | เลขบัตรประชาชน / Passport |
| phone | VARCHAR(20) | ✓ | เบอร์โทรศัพท์ |
| email | VARCHAR(100) | ✓ | อีเมล |
| image_url | VARCHAR(255) | ✓ | URL รูปโปรไฟล์ |


### 16.2 `appointments` — ตารางนัดหมาย (reference — read-only search view)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| booking_code 🔒 | VARCHAR(30) | ✗ | รหัสนัดหมาย eVMS-YYYYMMDD-XXXX |
| visitor_id 🔗 | INT | ✗ | FK → visitors.id |
| host_staff_id 🔗 | INT | ✗ | FK → staff.id ผู้ที่ต้องการพบ |
| type | ENUM('general','delivery','interview','maintenance','vip','contractor') | ✗ | ประเภทการนัดหมาย |
| status | ENUM('pending','approved','rejected','checked-in','checked-out','cancelled','expired','no-show') | ✗ | สถานะนัดหมาย |
| date | DATE | ✗ | วันที่นัดหมาย |
| time_start | TIME | ✗ | เวลาเริ่ม |
| time_end | TIME | ✗ | เวลาสิ้นสุด |
| purpose | VARCHAR(255) | ✗ | วัตถุประสงค์ |
| checkin_at | TIMESTAMP | ✓ | วันเวลาที่ Check-in |
| checkout_at | TIMESTAMP | ✓ | วันเวลาที่ Check-out |


**ความสัมพันธ์:**
- appointments.visitor_id ──→ visitors.id (ผู้มาติดต่อ)
- appointments.host_id ──→ staff.id (ผู้ที่ต้องการพบ)
- Note: This is a search/read-only page — references appointments and visitors tables

---
## 17. Blocklist

**เมนู:** Blocklist
**Path:** `/web/blocklist`
**คำอธิบาย:** จัดการรายชื่อผู้ถูกบล็อก — ตรวจสอบด้วยชื่อ+นามสกุล (ไม่ใช้เลขบัตร เพราะระบบไม่เก็บ ID), ตรวจอัตโนมัติทุกช่องทาง: Kiosk, Counter, LINE OA, เจ้าหน้าที่สร้างนัดหมาย

### 17.1 `blocklist` — ตารางรายชื่อผู้ถูกบล็อก — ตรวจด้วย first_name + last_name (partial match, case-insensitive) ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID ไว้

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| first_name | VARCHAR(100) | ✗ | ชื่อผู้ถูกบล็อก (ใช้ในการตรวจสอบ — match แบบ partial, case-insensitive) |
| last_name | VARCHAR(100) | ✗ | นามสกุลผู้ถูกบล็อก (ใช้คู่กับ first_name ในการตรวจสอบ) |
| company | VARCHAR(200) | ✓ | บริษัท/หน่วยงาน (เพื่อช่วยยืนยันตัวตน กรณีชื่อซ้ำ) |
| visitor_id 🔗 | INT | ✓ | FK → visitors.id อ้างอิงถ้ามีในระบบ (nullable — อาจบล็อกคนที่ยังไม่เคยเข้า) |
| reason | TEXT | ✗ | เหตุผลที่บล็อก |
| type | ENUM('permanent','temporary') | ✗ | ประเภทการบล็อก (ถาวร/ชั่วคราว) |
| expiry_date | DATE | ✓ | วันหมดอายุ (เฉพาะ temporary) |
| added_by 🔗 | INT | ✗ | FK → staff.id ผู้เพิ่มรายการ |
| added_at | TIMESTAMP | ✗ | วันเวลาที่เพิ่ม | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |
| is_active | BOOLEAN | ✗ | สถานะใช้งาน | true |

<details>
<summary>📦 Seed Data (2 rows)</summary>

| id | first_name | last_name | company | visitor_id | reason | type | expiry_date | added_by | added_at | is_active |
|----|----|----|----|----|----|----|----|----|----|----|
| 1 | สมศักดิ์ | ปัญญาดี | — | 10 | พฤติกรรมไม่เหมาะสมในพื้นที่สำนักงาน | permanent | — | 1 | 2026-01-15 10:00:00 | ✅ |
| 2 | John | Smith | ABC Corp | — | นำอุปกรณ์ต้องห้ามเข้าพื้นที่ | temporary | 2026-06-30 | 2 | 2026-03-01 14:30:00 | ✅ |

</details>

### 17.2 `blocklist_check_logs` — บันทึกการตรวจสอบ Blocklist ทุกครั้ง — เก็บทุก hit (พบ) และ attempt (พยายามเข้า) สำหรับ audit

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Log (PK) |
| blocklist_id 🔗 | INT | ✗ | FK → blocklist.id รายการที่ตรง |
| matched_name | VARCHAR(200) | ✗ | ชื่อ-นามสกุลที่ตรวจแล้วตรง |
| check_channel | ENUM('kiosk','counter','line','web_staff') | ✗ | ช่องทางที่ตรวจพบ |
| action_taken | ENUM('denied','alerted','expired_allow') | ✗ | การกระทำ: ปฏิเสธ/แจ้งเตือน/หมดอายุ-อนุญาต |
| checked_at | TIMESTAMP | ✗ | วันเวลาที่ตรวจ | CURRENT_TIMESTAMP |
| checked_by 🔗 | INT | ✓ | FK → staff.id (ถ้าเป็นเจ้าหน้าที่ตรวจ) |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | blocklist_id | matched_name | check_channel | action_taken | checked_at | checked_by |
|----|----|----|----|----|----|----|
| 1 | 1 | สมศักดิ์ ปัญญาดี | kiosk | denied | 2026-03-20 09:15:00 | — |

</details>

**ความสัมพันธ์:**
- blocklist.visitor_id ──→ visitors.id (อ้างอิงผู้ถูกบล็อก — nullable)
- blocklist.added_by ──→ staff.id (ผู้เพิ่มรายการ)
- blocklist_check_logs.blocklist_id ──→ blocklist.id (log การตรวจพบ)
- ตรวจสอบด้วย first_name + last_name (partial match) — ไม่ใช้เลขบัตรเพราะระบบไม่ได้เก็บ ID
- ตรวจทุกช่องทาง: Kiosk (สแกน QR/walk-in) → Counter (เจ้าหน้าที่ตรวจ) → LINE OA (จองนัดหมาย) → Web (เจ้าหน้าที่สร้างให้)

---
## 18. รายงาน

**เมนู:** รายงาน
**Path:** `/web/reports`
**คำอธิบาย:** รายงานสถิติผู้มาติดต่อ — สรุปรายวัน/รายสัปดาห์/รายเดือน, กราฟแนวโน้ม, วิเคราะห์ตามประเภท/แผนก/ช่องทาง, ส่งออก Excel/PDF

### 18.1 `report_daily_summary` — สรุปรายวัน — aggregate view

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| date 🔒 | DATE | ✗ | วันที่ |
| total_visitors | INT | ✗ | จำนวนผู้มาติดต่อทั้งหมด | 0 |
| total_appointments | INT | ✗ | จำนวนนัดหมายทั้งหมด | 0 |
| walkin_count | INT | ✗ | จำนวน Walk-in | 0 |
| checked_in | INT | ✗ | จำนวนที่ Check-in แล้ว | 0 |
| checked_out | INT | ✗ | จำนวนที่ Check-out แล้ว | 0 |
| overstay_count | INT | ✗ | จำนวนที่อยู่เกินเวลา | 0 |
| avg_visit_duration_min | INT | ✓ | ระยะเวลาเฉลี่ยการเข้าพื้นที่ (นาที) |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สร้าง | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | date | total_visitors | total_appointments | walkin_count | checked_in | checked_out | overstay_count | avg_visit_duration_min | created_at |
|----|----|----|----|----|----|----|----|----|----|
| 1 | 2026-03-20 | 45 | 38 | 7 | 42 | 40 | 2 | 65 | 2026-03-20 23:59:00 |
| 2 | 2026-03-21 | 52 | 44 | 8 | 50 | 48 | 1 | 58 | 2026-03-21 23:59:00 |
| 3 | 2026-03-22 | 30 | 25 | 5 | 28 | 28 | 0 | 72 | 2026-03-22 23:59:00 |
| 4 | 2026-03-23 | 60 | 50 | 10 | 55 | 52 | 3 | 55 | 2026-03-23 23:59:00 |
| 5 | 2026-03-24 | 48 | 40 | 8 | 46 | 44 | 1 | 62 | 2026-03-24 23:59:00 |

</details>

### 18.2 `report_department_stats` — สถิติตามแผนก — aggregate view

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| date | DATE | ✗ | วันที่ |
| department_id 🔗 | INT | ✗ | FK → departments.id |
| department_name | VARCHAR(100) | ✗ | ชื่อแผนก (denormalized) |
| visitor_count | INT | ✗ | จำนวนผู้มาติดต่อ | 0 |
| appointment_count | INT | ✗ | จำนวนนัดหมาย | 0 |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | date | department_id | department_name | visitor_count | appointment_count |
|----|----|----|----|----|----|
| 1 | 2026-03-20 | 1 | ฝ่ายบุคคล | 12 | 10 |
| 2 | 2026-03-20 | 2 | ฝ่ายไอที | 8 | 7 |
| 3 | 2026-03-20 | 3 | ฝ่ายการเงิน | 15 | 13 |
| 4 | 2026-03-21 | 1 | ฝ่ายบุคคล | 14 | 12 |
| 5 | 2026-03-21 | 2 | ฝ่ายไอที | 10 | 9 |

</details>

### 18.3 `report_visit_type_stats` — สถิติตามประเภทการนัดหมาย — aggregate view

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัส Auto-increment (PK) |
| date | DATE | ✗ | วันที่ |
| visit_type | ENUM('general','delivery','interview','maintenance','vip','contractor') | ✗ | ประเภทการนัดหมาย |
| visitor_count | INT | ✗ | จำนวนผู้มาติดต่อ | 0 |

<details>
<summary>📦 Seed Data (5 rows)</summary>

| id | date | visit_type | visitor_count |
|----|----|----|----|
| 1 | 2026-03-20 | general | 20 |
| 2 | 2026-03-20 | delivery | 10 |
| 3 | 2026-03-20 | interview | 5 |
| 4 | 2026-03-20 | maintenance | 4 |
| 5 | 2026-03-20 | vip | 6 |

</details>

**ความสัมพันธ์:**
- report_department_stats.department_id ──→ departments.id (แผนก)
- Aggregated from appointments + visitors tables

---
## 19. ระบบผู้ใช้งาน

**เมนู:** ระบบผู้ใช้งาน
**Path:** `/web/settings/staff`
**คำอธิบาย:** จัดการบัญชีผู้ใช้งาน, สิทธิ์การเข้าถึง, Login/Register, ลืมรหัสผ่าน, ผูก/ยกเลิก LINE

API Endpoints:
• POST /api/auth/login — เข้าสู่ระบบ
• POST /api/auth/register — สมัครสมาชิก
• POST /api/auth/forgot-password — ส่ง link reset password
• POST /api/auth/reset-password — ตั้งรหัสผ่านใหม่
• GET /api/users — รายชื่อผู้ใช้ (admin only)
• PATCH /api/users/:id/role — เปลี่ยน role (admin only)
• POST /api/users/me/line/link — ผูกบัญชี LINE (ส่ง LINE access token จาก LIFF)
• DELETE /api/users/me/line/unlink — ยกเลิกการผูก LINE (user เอง)
• DELETE /api/users/:id/line/unlink — admin ยกเลิกการผูก LINE ให้ user

### 19.1 `user_accounts` — ตารางบัญชีผู้ใช้งาน — ใช้สำหรับ Login ทุกช่องทาง (Web, LINE, Counter PIN)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสบัญชี (PK, running number) |
| email 🔒 | VARCHAR(100) | ✗ | อีเมล — ใช้เป็น username สำหรับ login |
| password_hash | VARCHAR(255) | ✗ | bcrypt hash ของรหัสผ่าน |
| user_type | ENUM('visitor','staff') | ✗ | ประเภทตอนสมัคร (ใช้เป็น default role) |
| role | ENUM('visitor','staff','supervisor','security','admin') | ✗ | สิทธิ์ปัจจุบัน — admin เป็นคนเปลี่ยน |
| ref_id | INT | ✓ | FK → visitors.id (ถ้า visitor) หรือ staff.id (ถ้า staff) |
| first_name | VARCHAR(100) | ✗ | ชื่อ |
| last_name | VARCHAR(100) | ✗ | นามสกุล |
| phone | VARCHAR(20) | ✓ | เบอร์โทรศัพท์ |
| is_active | BOOLEAN | ✗ | สถานะบัญชี (active/locked) | true |
| is_email_verified | BOOLEAN | ✗ | ยืนยันอีเมลแล้วหรือยัง | false |
| line_user_id 🔒 | VARCHAR(50) | ✓ | LINE User ID — ได้จาก LINE Login/LIFF (null = ยังไม่ผูก) |
| line_display_name | VARCHAR(100) | ✓ | LINE Display Name — แสดงใน admin panel |
| line_linked_at | TIMESTAMP | ✓ | วันเวลาที่ผูกบัญชี LINE |
| reset_token | VARCHAR(255) | ✓ | Token สำหรับ reset password (null = ไม่มี request) |
| reset_token_expires | TIMESTAMP | ✓ | วันหมดอายุ token reset |
| last_login_at | TIMESTAMP | ✓ | วันเวลาที่ login ล่าสุด |
| created_at | TIMESTAMP | ✗ | วันเวลาที่สมัคร | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (6 rows)</summary>

| id | email | password_hash | user_type | role | ref_id | first_name | last_name | phone | line_user_id | line_display_name | line_linked_at | is_active | is_email_verified | last_login_at |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | admin@mots.go.th | $2b$10$xxx | staff | admin | 5 | อนันต์ | มั่นคง | 02-283-1500 | U1234567890 | อนันต์ Admin | 2025-06-10 09:00:00 | ✅ | ✅ | 2026-03-25 08:00:00 |
| 2 | somsri.r@mots.go.th | $2b$10$xxx | staff | staff | 1 | สมศรี | รักงาน | 02-283-1501 | U0987654321 | สมศรี R. | 2025-08-20 14:30:00 | ✅ | ✅ | 2026-03-25 09:15:00 |
| 3 | prawit.s@mots.go.th | $2b$10$xxx | staff | supervisor | 2 | ประเสริฐ | ศรีวิโล | 02-283-1502 | undefined | undefined | undefined | ✅ | ✅ | 2026-03-24 14:30:00 |
| 4 | somchai.p@mots.go.th | $2b$10$xxx | staff | security | 6 | สมชาย | ปลอดภัย | 02-283-1510 | undefined | undefined | undefined | ✅ | ✅ | 2026-03-25 06:45:00 |
| 5 | wichai@siamtech.co.th | $2b$10$xxx | visitor | visitor | 1 | วิชัย | สุขสำราญ | 081-234-5678 | Uabc1234567 | วิชัย S. | 2026-01-15 10:00:00 | ✅ | ✅ | 2026-03-20 10:00:00 |
| 6 | porntip@tourismthai.com | $2b$10$xxx | visitor | visitor | 2 | พรทิพย์ | มีสุข | 089-876-5432 | undefined | undefined | undefined | ✅ | ❌ | undefined |

</details>

### 19.2 `role_permissions` — ตารางสิทธิ์ตาม Role — กำหนด resource + action + scope

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัส (PK, running number) |
| role | ENUM('visitor','staff','supervisor','security','admin') | ✗ | บทบาท |
| resource | VARCHAR(50) | ✗ | ทรัพยากร เช่น dashboard, appointments, settings |
| action | ENUM('view','create','edit','delete','approve','export') | ✗ | การกระทำ |
| scope | ENUM('own','department','all') | ✗ | ขอบเขต: ตัวเอง / แผนก / ทั้งหมด | own |
| is_allowed | BOOLEAN | ✗ | อนุญาตหรือไม่ | true |

<details>
<summary>📦 Seed Data (13 rows — แสดง 10 แรก)</summary>

| id | role | resource | action | scope | is_allowed |
|----|----|----|----|----|----|
| 1 | visitor | appointments | view | own | ✅ |
| 2 | visitor | appointments | create | own | ✅ |
| 3 | staff | dashboard | view | department | ✅ |
| 4 | staff | appointments | view | department | ✅ |
| 5 | staff | appointments | create | department | ✅ |
| 6 | staff | appointments | approve | department | ✅ |
| 7 | staff | search | view | department | ✅ |
| 8 | supervisor | dashboard | view | all | ✅ |
| 9 | supervisor | appointments | view | all | ✅ |
| 10 | supervisor | blocklist | view | all | ✅ |

*(... อีก 3 rows)*
</details>

**ความสัมพันธ์:**
- user_accounts.ref_id ──→ visitors.id (ถ้า user_type = 'visitor')
- user_accounts.ref_id ──→ staff.id (ถ้า user_type = 'staff')
- role_permissions.role ──→ user_accounts.role (สิทธิ์ตาม role ของ user)
- สมัครสมาชิก: user_type = 'visitor' → role = 'visitor' / user_type = 'staff' → role = 'staff' (default)
- Admin เป็นคนเปลี่ยน role ผ่านหน้า Settings > Staff
- user_accounts.line_user_id ──→ LINE Login/LIFF (ผูกผ่าน LINE OA, user ผูก/ยกเลิกเอง หรือ admin ยกเลิกให้)
- line_user_id = null → ยังไม่ผูก LINE / line_user_id != null → ผูกแล้ว (ใช้ส่ง notification ผ่าน LINE Messaging API)

---
## 20. ตั้งค่าอีเมลระบบ

**เมนู:** ตั้งค่าอีเมลระบบ
**Path:** `/web/settings/email-system`
**คำอธิบาย:** กำหนดค่า SMTP สำหรับส่งอีเมลแจ้งเตือน, ลืมรหัสผ่าน, อนุมัติ — ไม่ hardcode ในโค้ด

API Endpoints:
• GET /api/settings/email — ดึงค่า SMTP ปัจจุบัน
• PUT /api/settings/email — บันทึกค่า SMTP
• POST /api/settings/email/test — ทดสอบส่งอีเมล

### 20.1 `email_config` — ตั้งค่า SMTP สำหรับส่งอีเมลระบบ — มีได้ 1 row (singleton)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัส (PK) |
| smtp_host | VARCHAR(100) | ✗ | SMTP Server Host เช่น smtp.gmail.com |
| smtp_port | INT | ✗ | SMTP Port เช่น 465, 587, 25 |
| encryption | ENUM('ssl','tls','none') | ✗ | ประเภทการเข้ารหัส | tls |
| smtp_username | VARCHAR(100) | ✗ | Username สำหรับ SMTP Authentication |
| smtp_password | VARCHAR(255) | ✗ | Password (encrypted ในฐานข้อมูล) |
| from_email | VARCHAR(100) | ✗ | อีเมลผู้ส่ง เช่น noreply@mots.go.th |
| from_display_name | VARCHAR(100) | ✗ | ชื่อผู้ส่งที่แสดง เช่น eVMS กระทรวงการท่องเที่ยว |
| reply_to_email | VARCHAR(100) | ✓ | Reply-To Email (ถ้าต่างจาก from_email) |
| is_active | BOOLEAN | ✗ | เปิด/ปิดระบบส่งอีเมล | true |
| last_test_at | TIMESTAMP | ✓ | วันเวลาที่ทดสอบล่าสุด |
| last_test_result | VARCHAR(255) | ✓ | ผลลัพธ์การทดสอบล่าสุด |
| updated_by 🔗 | INT | ✓ | FK → staff.id ผู้แก้ไขล่าสุด |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | smtp_host | smtp_port | encryption | smtp_username | smtp_password | from_email | from_display_name | reply_to_email | is_active | last_test_at | last_test_result | updated_by |
|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | smtp.gmail.com | 587 | tls | evms.noreply@mots.go.th | ***encrypted*** | noreply@mots.go.th | eVMS กระทรวงการท่องเที่ยวและกีฬา | support@mots.go.th | ✅ | 2026-03-20 10:00:00 | OK — ส่งสำเร็จ | 5 |

</details>

**ความสัมพันธ์:**
- email_config.updated_by ──→ staff.id (ผู้แก้ไขล่าสุด)
- ใช้ส่ง: forgot-password, approval notification, checkin welcome, overstay alert

---
## 21. ตั้งค่า LINE OA

**เมนู:** ตั้งค่า LINE OA
**Path:** `/web/settings/line-oa-config`
**คำอธิบาย:** กำหนดค่า LINE Messaging API, LIFF, Webhook, Rich Menu — ไม่ hardcode ในโค้ด

API Endpoints:
• GET /api/settings/line-oa — ดึงค่า LINE OA ปัจจุบัน
• PUT /api/settings/line-oa — บันทึกค่า LINE OA
• POST /api/settings/line-oa/test-message — ทดสอบส่งข้อความ
• POST /api/settings/line-oa/verify-webhook — ตรวจสอบ Webhook

### 21.1 `line_oa_config` — ตั้งค่า LINE Official Account — มีได้ 1 row (singleton)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัส (PK) |
| channel_id | VARCHAR(50) | ✗ | LINE Channel ID |
| channel_secret | VARCHAR(100) | ✗ | LINE Channel Secret (encrypted) |
| channel_access_token | TEXT | ✗ | Long-lived Channel Access Token (encrypted) |
| bot_basic_id | VARCHAR(50) | ✓ | Bot Basic ID เช่น @evms-mots |
| liff_app_id | VARCHAR(50) | ✓ | LIFF App ID สำหรับ LIFF integration |
| liff_endpoint_url | VARCHAR(255) | ✓ | LIFF Endpoint URL |
| webhook_url | VARCHAR(255) | ✓ | Webhook URL (auto-generated) |
| webhook_active | BOOLEAN | ✗ | Webhook เปิด/ปิด | false |
| rich_menu_visitor_id | VARCHAR(50) | ✓ | Rich Menu ID สำหรับ Visitor |
| rich_menu_officer_id | VARCHAR(50) | ✓ | Rich Menu ID สำหรับ Officer |
| is_active | BOOLEAN | ✗ | เปิด/ปิดระบบ LINE OA | true |
| last_test_at | TIMESTAMP | ✓ | วันเวลาที่ทดสอบล่าสุด |
| last_test_result | VARCHAR(255) | ✓ | ผลลัพธ์การทดสอบล่าสุด |
| updated_by 🔗 | INT | ✓ | FK → staff.id ผู้แก้ไขล่าสุด |
| updated_at | TIMESTAMP | ✗ | วันเวลาที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | channel_id | channel_secret | channel_access_token | bot_basic_id | liff_app_id | liff_endpoint_url | webhook_url | webhook_active | rich_menu_visitor_id | rich_menu_officer_id | is_active | last_test_at | last_test_result | updated_by |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | 1234567890 | ***encrypted*** | ***encrypted*** | @evms-mots | 1234567890-abcdefgh | https://evms.mots.go.th/liff | https://evms.mots.go.th/api/line/webhook | ✅ | richmenu-visitor-001 | richmenu-officer-001 | ✅ | 2026-03-20 11:00:00 | OK — ส่งข้อความทดสอบสำเร็จ | 5 |

</details>

**ความสัมพันธ์:**
- line_oa_config.updated_by ──→ staff.id (ผู้แก้ไขล่าสุด)
- ใช้กับ: LINE OA Registration (LIFF), Notification Push, Rich Menu, Webhook events

---
## 22. โปรไฟล์ของฉัน

**เมนู:** โปรไฟล์ของฉัน
**Path:** `/web/profile`
**คำอธิบาย:** ดูและแก้ไขข้อมูลส่วนตัว, ผูก/เปลี่ยน/ยกเลิกบัญชี LINE, เปลี่ยนรหัสผ่าน

API Endpoints:
• GET /api/users/me — ดึงข้อมูลโปรไฟล์ตัวเอง
• PATCH /api/users/me — แก้ไขข้อมูลส่วนตัว (ชื่อ, เบอร์โทร)
• POST /api/users/me/line/link — ผูกบัญชี LINE (ส่ง LINE access token จาก LIFF)
• DELETE /api/users/me/line/unlink — ยกเลิกการผูก LINE
• POST /api/users/me/change-password — เปลี่ยนรหัสผ่าน (ต้องส่ง old + new password)

### 22.1 `user_accounts` — ใช้ตารางเดียวกับ User Management — อ่านเฉพาะ row ของตัวเอง (WHERE id = current_user_id)

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | INT | ✗ | รหัสบัญชี (PK) |
| email 🔒 | VARCHAR(100) | ✗ | อีเมล (อ่านอย่างเดียว — เปลี่ยนไม่ได้) |
| first_name | VARCHAR(100) | ✗ | ชื่อ (แก้ไขได้) |
| last_name | VARCHAR(100) | ✗ | นามสกุล (แก้ไขได้) |
| phone | VARCHAR(20) | ✓ | เบอร์โทรศัพท์ (แก้ไขได้) |
| user_type | ENUM('visitor','staff') | ✗ | ประเภท (อ่านอย่างเดียว) |
| role | ENUM(...) | ✗ | สิทธิ์ (อ่านอย่างเดียว — Admin เปลี่ยน) |
| line_user_id 🔒 | VARCHAR(50) | ✓ | LINE User ID — null = ยังไม่ผูก |
| line_display_name | VARCHAR(100) | ✓ | LINE Display Name |
| line_linked_at | TIMESTAMP | ✓ | วันที่ผูก LINE |
| is_active | BOOLEAN | ✗ | สถานะบัญชี (อ่านอย่างเดียว — Admin เปลี่ยน) | true |
| is_email_verified | BOOLEAN | ✗ | ยืนยันอีเมลแล้วหรือยัง (อ่านอย่างเดียว) | false |
| password_hash | VARCHAR(255) | ✗ | bcrypt hash — ไม่ส่งไป frontend เด็ดขาด, เปลี่ยนผ่าน /change-password เท่านั้น |
| created_at | TIMESTAMP | ✗ | วันที่สมัคร (อ่านอย่างเดียว) | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด (auto-update) | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (1 rows)</summary>

| id | email | first_name | last_name | phone | user_type | role | line_user_id | line_display_name | line_linked_at | is_active | is_email_verified |
|----|----|----|----|----|----|----|----|----|----|----|----|
| 2 | somsri.r@mots.go.th | สมศรี | รักงาน | 02-283-1501 | staff | staff | U0987654321 | สมศรี R. | 2025-08-20 14:30:00 | ✅ | ✅ |

</details>

**ความสัมพันธ์:**
- อ่าน/แก้ไขเฉพาะ row ของตัวเอง (WHERE user_accounts.id = session.user_id)
- line_user_id — ผูก/ยกเลิกผ่าน LIFF SDK (user ดำเนินการเอง)
- password_hash — เปลี่ยนได้เฉพาะเมื่อส่ง old password ถูกต้อง (bcrypt.compare)
- email — อ่านอย่างเดียว ไม่ให้เปลี่ยนเพื่อป้องกัน account hijack
- role — อ่านอย่างเดียว ต้องให้ Admin เปลี่ยนผ่านหน้า User Management

---
## 23. LINE OA & การแจ้งเตือน

**เมนู:** LINE OA & การแจ้งเตือน
**Path:** `/web/settings/line-message-templates`
**คำอธิบาย:** ตั้งค่า LINE OA, Flex Message Templates, Email Templates และ System Settings (Approval Timeout)

### 23.1 `system_settings` — ตั้งค่าระบบ (key-value) เช่น ระยะเวลารออนุมัติ

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | PK |
| key 🔒 | VARCHAR(50) | ✗ | ชื่อ setting key |
| value | TEXT | ✗ | ค่าของ setting |
| description | VARCHAR(200) | ✓ | คำอธิบายภาษาไทย |
| updated_by 🔗 | INT | ✓ | ผู้แก้ไขล่าสุด |
| updated_at | TIMESTAMP | ✗ | แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (2 rows)</summary>

| id | key | value | description |
|----|----|----|----|
| 1 | approval_timeout_hours | 24 | ชั่วโมงที่รอการอนุมัติก่อนยกเลิกอัตโนมัติ |
| 2 | auto_cancel_on_date_passed | true | ยกเลิกอัตโนมัติเมื่อวันนัดผ่านไปแล้ว |

</details>

### 23.2 `line_flex_templates` — Flex Message template สำหรับแต่ละ state ของ LINE OA flow

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | PK |
| state_id 🔒 | VARCHAR(50) | ✗ | LINE flow state ID (e.g. visitor-registered) |
| name | VARCHAR(100) | ✗ | ชื่อ template ภาษาไทย |
| name_en | VARCHAR(100) | ✗ | ชื่อ template ภาษาอังกฤษ |
| type | ENUM('flex','text','liff') | ✗ | ประเภท: flex=Flex Message, text=ข้อความธรรมดา, liff=LIFF App |
| is_active | BOOLEAN | ✗ | เปิด/ปิดใช้งาน | true |
| header_title | VARCHAR(200) | ✓ | ข้อความหัวข้อ |
| header_subtitle | VARCHAR(200) | ✓ | ข้อความรอง |
| header_color | ENUM('primary','green','orange','red','blue') | ✗ | สี header | 'primary' |
| header_variant | VARCHAR(30) | ✗ | รูปแบบ header (standard, reminder, checkin, ...) | 'standard' |
| show_status_badge | BOOLEAN | ✗ | แสดง status badge | false |
| status_badge_text | VARCHAR(50) | ✓ | ข้อความบน badge |
| show_qr_code | BOOLEAN | ✗ | แสดง QR Code | false |
| qr_label | VARCHAR(100) | ✓ | ข้อความใต้ QR Code |
| info_box_text | TEXT | ✓ | ข้อความใน Info Box |
| info_box_color | VARCHAR(10) | ✓ | สี Info Box |
| info_box_enabled | BOOLEAN | ✗ | แสดง Info Box | false |
| updated_by 🔗 | INT | ✓ | ผู้แก้ไข |
| updated_at | TIMESTAMP | ✗ | แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (3 rows)</summary>

| id | state_id | name | type | header_title | header_color |
|----|----|----|----|----|----|
| 1 | visitor-registered | ลงทะเบียนสำเร็จ | flex | Registration Complete | green |
| 2 | visitor-booking-confirmed | ยืนยันการจอง | flex | นัดหมายใหม่ | primary |
| 3 | visitor-auto-cancelled | ยกเลิกอัตโนมัติ | flex | นัดหมายถูกยกเลิกอัตโนมัติ | orange |

</details>

### 23.3 `line_flex_template_rows` — รายการ Body Row ของ Flex Message template

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | PK |
| template_id 🔗 | INT | ✗ | FK → line_flex_templates.id |
| label | VARCHAR(100) | ✗ | ข้อความ label (ภาษาไทย) |
| variable | VARCHAR(50) | ✗ | ชื่อ variable ที่ใช้ (e.g. visitorName) |
| preview_value | VARCHAR(200) | ✓ | ค่าตัวอย่างสำหรับ preview |
| enabled | BOOLEAN | ✗ | เปิด/ปิดแสดง row นี้ | true |
| sort_order | INT | ✗ | ลำดับการแสดงผล |

<details>
<summary>📦 Seed Data (2 rows)</summary>

| id | template_id | label | variable | preview_value | sort_order |
|----|----|----|----|----|----|
| 1 | 1 | ประเภท | userType | Visitor | 1 |
| 2 | 1 | ชื่อ | visitorName | พุทธิพงษ์ คาดสนิท | 2 |

</details>

### 23.4 `line_flex_template_buttons` — ปุ่มกดของ Flex Message template

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | PK |
| template_id 🔗 | INT | ✗ | FK → line_flex_templates.id |
| label | VARCHAR(100) | ✗ | ข้อความบนปุ่ม |
| variant | ENUM('green','primary','outline','red') | ✗ | รูปแบบปุ่ม | 'primary' |
| action_url | VARCHAR(500) | ✓ | URL เมื่อกดปุ่ม (LIFF URL หรือ postback) |
| enabled | BOOLEAN | ✗ | เปิด/ปิดปุ่มนี้ | true |
| sort_order | INT | ✗ | ลำดับ |

<details>
<summary>📦 Seed Data (2 rows)</summary>

| id | template_id | label | variant | sort_order |
|----|----|----|----|----|
| 1 | 1 | สร้างรายการนัดหมาย | green | 1 |
| 2 | 1 | ข้อมูลส่วนบุคคล | outline | 2 |

</details>

### 23.5 `email_notification_templates` — เทมเพลตอีเมลแจ้งเตือนสำหรับแต่ละ event

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | PK |
| trigger_event | VARCHAR(50) | ✗ | ชื่อ event trigger |
| name | VARCHAR(100) | ✗ | ชื่อ template ภาษาไทย |
| is_active | BOOLEAN | ✗ | เปิด/ปิดใช้งาน | true |
| subject | VARCHAR(200) | ✗ | หัวข้ออีเมล (รองรับ {{variables}}) |
| body_th | TEXT | ✗ | เนื้อหาภาษาไทย |
| body_en | TEXT | ✓ | เนื้อหาภาษาอังกฤษ |
| variables | TEXT[] | ✓ | รายการ variables ที่ใช้ได้ |
| updated_at | TIMESTAMP | ✗ | แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (3 rows)</summary>

| id | trigger_event | name | subject | is_active |
|----|----|----|----|----|
| 1 | booking-confirmed | ยืนยันการจอง | ยืนยันการจอง — {{bookingCode}} | ✅ |
| 2 | booking-approved | อนุมัติแล้ว | คำขอ {{bookingCode}} อนุมัติแล้ว | ✅ |
| 3 | booking-auto-cancelled | ยกเลิกอัตโนมัติ | นัดหมาย {{bookingCode}} ถูกยกเลิก | ✅ |

</details>

**ความสัมพันธ์:**
- line_flex_template_rows.template_id → line_flex_templates.id
- line_flex_template_buttons.template_id → line_flex_templates.id
- system_settings.updated_by → user_accounts.id
- line_flex_templates.state_id — maps to LineFlowStateId in application code

---
## 24. กลุ่มนัดหมาย (Batch/Period)

**เมนู:** กลุ่มนัดหมาย (Batch/Period)
**Path:** `/web/appointments/groups`
**คำอธิบาย:** จัดการกลุ่มนัดหมาย — สร้างเป็นชุด (batch) สำหรับสัมมนา/ผู้รับเหมา, รองรับ period (หลายวัน), กำหนดเวลาแยกรายวัน, ติดตามการมาถึง (Arrival Dashboard)

### 24.1 `appointment_groups` — กลุ่มนัดหมาย — เก็บข้อมูลกลุ่มสำหรับ batch appointment + period mode

| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|
| **id** 🔑 | SERIAL | ✗ | รหัสกลุ่ม (PK) |
| name | VARCHAR(200) | ✗ | ชื่อกลุ่ม เช่น 'สัมมนา IT วันที่ 10-11 เม.ย.' |
| name_en | VARCHAR(200) | ✓ | ชื่อกลุ่ม (English) |
| description | TEXT | ✓ | รายละเอียดเพิ่มเติม |
| visit_purpose_id 🔗 | INT | ✗ | FK → visit_purposes.id |
| department_id 🔗 | INT | ✗ | FK → departments.id |
| host_staff_id 🔗 | INT | ✓ | FK → staff.id (null ถ้าไม่ต้องระบุ) |
| entry_mode | ENUM('single','period') | ✗ | โหมดการเข้า | single |
| date_start | DATE | ✗ | วันเริ่มต้น |
| date_end | DATE | ✓ | วันสิ้นสุด (เฉพาะ period) |
| time_start | TIME | ✗ | เวลาเริ่ม (default ทุกวัน) |
| time_end | TIME | ✗ | เวลาสิ้นสุด (default ทุกวัน) |
| room | VARCHAR(50) | ✓ | ห้อง |
| building | VARCHAR(100) | ✓ | อาคาร |
| floor | VARCHAR(20) | ✓ | ชั้น |
| total_expected | INT | ✗ | จำนวนผู้เข้าร่วมที่คาดหวัง | 0 |
| notify_on_checkin | BOOLEAN | ✗ | แจ้งเตือนเมื่อ check-in (ระดับกลุ่ม) | false |
| created_by_staff_id 🔗 | INT | ✗ | FK → staff.id ผู้สร้างกลุ่ม |
| status | ENUM('active','completed','cancelled') | ✗ | สถานะกลุ่ม | active |
| created_at | TIMESTAMP | ✗ | วันที่สร้าง | CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | ✗ | วันที่แก้ไขล่าสุด | CURRENT_TIMESTAMP |

<details>
<summary>📦 Seed Data (2 rows)</summary>

| id | name | visit_purpose_id | department_id | entry_mode | date_start | date_end | time_start | time_end | room | building | floor | total_expected | notify_on_checkin | created_by_staff_id | status |
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| 1 | สัมมนา IT วันที่ 10-11 เม.ย. | 2 | 1 | period | 2026-04-10 | 2026-04-11 | 09:00 | 16:00 | ห้องประชุม 601 | อาคาร กท. | 6 | 50 | ❌ | 1 | active |
| 2 | ผู้รับเหมาซ่อมแอร์ ชั้น 3 | 4 | 2 | period | 2026-04-10 | 2026-04-11 | 07:00 | 22:00 | undefined | อาคาร กท. | 3 | 5 | ✅ | 2 | active |

</details>

### 24.2 `appointment_group_day_schedules` — ตารางเวลาแยกรายวัน — ใช้เมื่อแต่ละวันมีเวลาต่างกัน (ถ้าไม่มี ใช้ default จาก group)

| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|
| **id** 🔑 | SERIAL | ✗ | PK |
| group_id 🔗 | INT | ✗ | FK → appointment_groups.id |
| date | DATE | ✗ | วันที่ (ต้อง unique ร่วมกับ group_id) |
| time_start | TIME | ✗ | เวลาเริ่มของวันนี้ |
| time_end | TIME | ✗ | เวลาสิ้นสุดของวันนี้ |
| notes | VARCHAR(200) | ✓ | หมายเหตุ เช่น 'วันสุดท้าย เลิกเร็ว' |

<details>
<summary>📦 Seed Data (2 rows)</summary>

| id | group_id | date | time_start | time_end | notes |
|----|----|----|----|----|----|
| 1 | 2 | 2026-04-10 | 07:00 | 22:00 | — |
| 2 | 2 | 2026-04-11 | 07:00 | 18:00 | วันสุดท้าย เลิกเร็ว |

</details>

**ความสัมพันธ์:**
- appointment_groups.visit_purpose_id ──→ visit_purposes.id
- appointment_groups.department_id ──→ departments.id
- appointment_groups.host_staff_id ──→ staff.id (ผู้ที่ต้องการพบ — optional)
- appointment_groups.created_by_staff_id ──→ staff.id (ผู้สร้างกลุ่ม)
- appointment_groups 1 ──→ N appointments (แต่ละ appointment ใน group)
- appointment_groups 1 ──→ N appointment_group_day_schedules (เวลาแยกรายวัน)
- appointment_group_day_schedules.group_id ──→ appointment_groups.id (onDelete: CASCADE)

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
