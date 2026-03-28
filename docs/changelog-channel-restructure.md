# Changelog: Channel Visibility Restructure

> **วันที่:** 2026-03-28
> **ผู้ดำเนินการ:** Claude Code
> **สถานะ:** ✅ เสร็จสมบูรณ์ — Build ผ่านทุกหน้า, ไม่มี TypeScript error

---

## ปัญหาเดิม

โครงสร้างเดิมตั้งค่า **channel visibility** (`showOnLine`, `showOnKiosk`) ไว้ที่ระดับ **DepartmentRule** (แผนก) ซึ่งไม่ตรงกับ flow การใช้งานจริง:

```
Flow จริง:  ผู้ใช้เลือก วัตถุประสงค์ ก่อน → แล้วค่อยเลือก แผนก
```

ปัญหา: ระบบไม่รู้ว่าควรแสดงวัตถุประสงค์ไหนบน Kiosk/LINE เพราะ channel ซ่อนอยู่ภายใน dept rule → ต้อง loop หาทุกครั้ง

นอกจากนี้ยังไม่มี `showOnCounter` และไม่มี `acceptFromCounter` ที่ระดับแผนก

---

## โครงสร้างใหม่: แยก 2 ระดับ

### ระดับ 1 — VisitPurposeConfig (ตัววัตถุประสงค์)

> ตอบคำถาม: **"วัตถุประสงค์นี้โผล่บนช่องทางไหน?"**

| Field ใหม่ | Type | Default | คำอธิบาย |
|-----------|------|---------|---------|
| `showOnLine` | `boolean` | `true` | แสดงบน LINE OA + Web App |
| `showOnKiosk` | `boolean` | `true` | แสดงบน Kiosk |
| `showOnCounter` | `boolean` | `true` | แสดงบน Counter |

### ระดับ 2 — DepartmentRule (แผนก)

> ตอบคำถาม: **"ถ้าเลือกวัตถุประสงค์นี้แล้ว แผนกไหนรับจากช่องทางไหน?"**

| Field เดิม | Field ใหม่ | คำอธิบาย |
|-----------|-----------|---------|
| `showOnLine` | `acceptFromLine` | แผนกนี้รับงานจาก LINE + Web |
| `showOnKiosk` | `acceptFromKiosk` | แผนกนี้รับงานจาก Kiosk |
| *(ไม่มี)* | `acceptFromCounter` | **ใหม่** — แผนกนี้รับงานจาก Counter |

### Flow Diagram

```
┌─── ระดับ 1: วัตถุประสงค์ ───┐     ┌─── ระดับ 2: แผนก ───────────┐
│                              │     │                              │
│  showOnKiosk = true?         │     │  acceptFromKiosk = true?     │
│  → แสดงบนหน้า Kiosk         │ ──→ │  → แผนกนี้โผล่ให้เลือก       │
│                              │     │                              │
│  showOnLine = true?          │     │  acceptFromLine = true?      │
│  → แสดงบน LINE + Web        │ ──→ │  → แผนกนี้โผล่ให้เลือก       │
│                              │     │                              │
│  showOnCounter = true?       │     │  acceptFromCounter = true?   │
│  → แสดงที่ Counter           │ ──→ │  → แผนกนี้โผล่ให้เลือก       │
└──────────────────────────────┘     └──────────────────────────────┘
```

### ตัวอย่าง: Kiosk Walk-in Flow

```
Step 1 — กรองวัตถุประสงค์
  WHERE purpose.showOnKiosk = true
    AND purpose.isActive = true
    AND purpose.id IN servicePoint.allowedPurposeIds
  → ได้รายการวัตถุประสงค์ที่แสดงบน Kiosk

Step 2 — ผู้ใช้เลือกวัตถุประสงค์ → กรองแผนก
  WHERE rule.acceptFromKiosk = true
    AND rule.isActive = true
  → ได้รายการแผนกที่รับจาก Kiosk

Step 3 — ใช้ kioskConfig (เอกสาร + ถ่ายรูป) + departmentRule (อนุมัติ, WiFi)
```

---

## ไฟล์ที่แก้ไข

### 1. Shared Enums & Types

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `shared/enums.json` | เพิ่ม enum: `entryChannel`, `servicePointType`, `servicePointStatus`, `notifyChannel`, `reportChannel` |
| `shared/api-types.ts` | เพิ่ม type: `EntryChannel`, `ServicePointType`, `ServicePointStatus`, `NotifyChannel`, `ReportChannel` |

### 2. Core Data Model

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `vms-prototype/lib/mock-data.ts` | - เพิ่ม `EntryChannel` type<br>- เพิ่ม `showOnLine/showOnKiosk/showOnCounter` ใน `VisitPurposeConfig`<br>- เปลี่ยน `showOnLine/showOnKiosk` → `acceptFromLine/acceptFromKiosk` + เพิ่ม `acceptFromCounter` ใน `DepartmentRule`<br>- อัปเดต mock data ทั้ง 8 วัตถุประสงค์ + 25 department rules |

### 3. Database Schema

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `vms-prototype/lib/database-schema.ts` | - ตาราง `visit_purposes`: เพิ่มคอลัมน์ `show_on_line`, `show_on_kiosk`, `show_on_counter`<br>- ตาราง `visit_purpose_department_rules`: เปลี่ยน `show_on_line` → `accept_from_line`, `show_on_kiosk` → `accept_from_kiosk`, เพิ่ม `accept_from_counter`<br>- อัปเดต seed data ครบทุก row |

### 4. Kiosk Config Resolver

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `vms-prototype/lib/kiosk/kiosk-config-resolver.ts` | - กรองวัตถุประสงค์: เช็ค `config.showOnKiosk` ก่อน (ระดับวัตถุประสงค์)<br>- กรองแผนก: เช็ค `rule.acceptFromKiosk` (ระดับแผนก)<br>- อัปเดต configSource comments |

### 5. Visit Purposes Settings Page

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `vms-prototype/app/web/(app)/settings/visit-purposes/page.tsx` | - **Summary stats**: นับจาก purpose-level `showOn*` แทน dept rule<br>- **PurposeCard**: เพิ่ม channel badges (LINE, Kiosk, Counter)<br>- **Table header**: เพิ่มคอลัมน์ "รับจาก Counter"<br>- **DeptRuleRow**: ใช้ `acceptFromLine/acceptFromKiosk/acceptFromCounter` + เพิ่มคอลัมน์ Counter<br>- **PurposeDrawer**: เพิ่มหัวข้อ "ช่องทางที่แสดงวัตถุประสงค์นี้" (3 toggles)<br>- **DeptRuleDrawer**: เปลี่ยนเป็น "แผนกรับงานจากช่องทาง" (3 toggles) |

### 6. Fix Hardcoded Lists → Render จาก Enum/Data

| ไฟล์ | ของเดิม | แก้เป็น |
|------|--------|--------|
| `vms-prototype/app/mobile/(app)/booking/page.tsx` | `visitTypes` hardcoded 5 items | Render จาก `visitPurposeConfigs` กรอง `showOnLine` |
| `vms-prototype/app/web/(app)/reports/page.tsx` | `channelBreakdown` hardcoded 4 items | Render จาก `reportChannelEnum` config object |
| `vms-prototype/app/web/(app)/settings/approver-groups/page.tsx` | `["line","email","web-app"]` hardcoded 2 จุด | ใช้ `Object.keys(channelConfig)` |
| `vms-prototype/app/web/(app)/settings/service-points/page.tsx` | type/status filter hardcoded inline | ใช้ label config array |

---

## ข้อมูล Channel ที่ตั้งค่าใหม่ (ตาม Mock Data)

### Purpose-Level Channel Visibility

| # | วัตถุประสงค์ | LINE+Web | Kiosk | Counter |
|---|------------|----------|-------|---------|
| 1 | ติดต่อราชการ | ✅ | ✅ | ✅ |
| 2 | ประชุม / สัมมนา | ✅ | ✅ | ✅ |
| 3 | ส่งเอกสาร / พัสดุ | ✅ | ✅ | ✅ |
| 4 | ผู้รับเหมา / ซ่อมบำรุง | ❌ | ✅ | ✅ |
| 5 | สมัครงาน / สัมภาษณ์ | ✅ | ✅ | ✅ |
| 6 | เยี่ยมชม / ศึกษาดูงาน | ✅ | ❌ | ✅ |
| 7 | รับ-ส่งสินค้า | ❌ | ✅ | ✅ |
| 8 | อื่นๆ (inactive) | ✅ | ✅ | ✅ |

> **หมายเหตุ:**
> - "ผู้รับเหมา" ปิด LINE เพราะต้องมาลงทะเบียนที่ Kiosk/Counter เท่านั้น
> - "เยี่ยมชม" ปิด Kiosk เพราะต้องนัดล่วงหน้าผ่าน LINE/Web
> - "รับ-ส่งสินค้า" ปิด LINE เพราะ walk-in อย่างเดียว

---

## Migration Guide (สำหรับ Backend)

```sql
-- 1. เพิ่มคอลัมน์ใน visit_purposes
ALTER TABLE visit_purposes
  ADD COLUMN show_on_line    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN show_on_kiosk   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN show_on_counter BOOLEAN NOT NULL DEFAULT true;

-- 2. เปลี่ยนชื่อคอลัมน์ใน visit_purpose_department_rules
ALTER TABLE visit_purpose_department_rules
  RENAME COLUMN show_on_line  TO accept_from_line;
ALTER TABLE visit_purpose_department_rules
  RENAME COLUMN show_on_kiosk TO accept_from_kiosk;
ALTER TABLE visit_purpose_department_rules
  ADD COLUMN accept_from_counter BOOLEAN NOT NULL DEFAULT true;

-- 3. Backfill: ย้ายค่า channel จาก dept rules → purpose level
-- (logic: ถ้า dept rule ใด showOn* = true → purpose ก็ควร showOn* = true)
UPDATE visit_purposes vp SET
  show_on_line = EXISTS (
    SELECT 1 FROM visit_purpose_department_rules r
    WHERE r.visit_purpose_id = vp.id AND r.accept_from_line = true AND r.is_active = true
  ),
  show_on_kiosk = EXISTS (
    SELECT 1 FROM visit_purpose_department_rules r
    WHERE r.visit_purpose_id = vp.id AND r.accept_from_kiosk = true AND r.is_active = true
  ),
  show_on_counter = true;  -- Counter เปิดทุกวัตถุประสงค์เป็นค่าเริ่มต้น
```

---

## Shared Enums ที่เพิ่ม (ใน `shared/enums.json`)

```json
{
  "entryChannel": {
    "line":    { "th": "LINE OA + Web App", "en": "LINE OA + Web App",  "icon": "📱", "color": "green"  },
    "kiosk":   { "th": "Kiosk",             "en": "Kiosk",              "icon": "🖥️", "color": "blue"   },
    "counter": { "th": "Counter",           "en": "Counter",            "icon": "🏢", "color": "amber"  }
  },
  "servicePointType": {
    "kiosk":   { "th": "ตู้ Kiosk",   "en": "Kiosk" },
    "counter": { "th": "เคาน์เตอร์",  "en": "Counter" }
  },
  "servicePointStatus": {
    "online":      { "th": "ออนไลน์",     "en": "Online" },
    "offline":     { "th": "ออฟไลน์",     "en": "Offline" },
    "maintenance": { "th": "ปิดปรับปรุง",  "en": "Maintenance" }
  },
  "notifyChannel": {
    "line":    { "th": "LINE",     "en": "LINE" },
    "email":   { "th": "อีเมล",    "en": "Email" },
    "web-app": { "th": "Web App",  "en": "Web App" }
  },
  "reportChannel": {
    "kiosk":   { "th": "Kiosk",      "en": "Kiosk",      "color": "bg-blue-500" },
    "line":    { "th": "LINE OA",    "en": "LINE OA",    "color": "bg-green-500" },
    "counter": { "th": "Counter",    "en": "Counter",    "color": "bg-purple-500" },
    "walkin":  { "th": "Walk-in",    "en": "Walk-in",    "color": "bg-amber-500" }
  }
}
```

---

## Testing Checklist

- [x] TypeScript `tsc --noEmit` — ไม่มี error
- [x] `next build` — build สำเร็จทุกหน้า
- [ ] หน้า `/web/settings/visit-purposes` — ตรวจ channel toggles ทั้ง 2 ระดับ
- [ ] หน้า `/kiosk/walkin` — วัตถุประสงค์กรองตาม `showOnKiosk` + `acceptFromKiosk`
- [ ] หน้า `/mobile/booking` — visit types render จาก config กรอง `showOnLine`
- [ ] หน้า `/web/reports` — channel breakdown render จาก enum
- [ ] หน้า `/web/settings/approver-groups` — notification channels render จาก config
- [ ] หน้า `/web/settings/service-points` — filters render จาก config
