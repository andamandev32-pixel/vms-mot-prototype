# VMS Prototype SRS Prompt
## Visitor Management System — UI Prototype Specification (Full Edition)

> **วัตถุประสงค์:** เอกสารนี้ใช้เป็น Prompt / SRS สำหรับสร้าง UI Prototype ของระบบ VMS  
> ครอบคลุม 4 ส่วน: Mobile App · Web App · Kiosk · Counter (รปภ.)  
> **ธีม:** Navy Blue + Yellow (trip.com style)  
> **เวอร์ชัน:** 2.0 Full Edition

---

## 🎨 GLOBAL DESIGN SYSTEM

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#003580` | Header, Nav, Primary Button |
| `--color-primary-dark` | `#002147` | Active State, Footer |
| `--color-primary-light` | `#E8F0FF` | Hover, Selected Row |
| `--color-accent` | `#FFB700` | CTA Button, Badge, Highlight |
| `--color-accent-hover` | `#E6A500` | Button Hover |
| `--color-accent-light` | `#FFF8E1` | Alert Background |
| `--color-white` | `#FFFFFF` | Card, Modal Background |
| `--color-bg` | `#F5F7FA` | Page Background |
| `--color-border` | `#E2E8F0` | Divider, Input Border |
| `--color-text-primary` | `#1A202C` | Body Text |
| `--color-text-secondary` | `#4A5568` | Label, Caption |
| `--color-text-muted` | `#9DA8B7` | Placeholder |
| `--color-success` | `#10B981` | Success State |
| `--color-warning` | `#F59E0B` | Warning State |
| `--color-error` | `#EF4444` | Error State |
| `--color-info` | `#3B82F6` | Info State |

### Typography

```
Font Family  : "Inter", "Noto Sans Thai", sans-serif
H1           : 28px / Bold    / #1A202C
H2           : 22px / SemiBold / #1A202C
H3           : 18px / SemiBold / #003580
Body         : 14px / Regular  / #1A202C
Caption      : 12px / Regular  / #4A5568
Label        : 12px / Medium   / #4A5568  UPPERCASE
Button       : 14px / SemiBold
Kiosk Body   : 18px minimum
Kiosk Button : 24px minimum
```

### Component Rules

```
Border Radius  : Button=8px, Card=12px, Input=8px, Badge=20px, Modal=16px, Kiosk Card=20px
Shadow Card    : 0 2px 8px rgba(0,0,0,0.08)
Shadow Popup   : 0 8px 32px rgba(0,0,0,0.16)
Shadow Kiosk   : 0 4px 24px rgba(0,0,0,0.12)
Input Height   : 44px (Mobile), 40px (Web), 64px (Kiosk)
Button Height  : 48px (Primary/Mobile), 40px (Secondary/Web), 80px (Kiosk)
Nav Height     : 56px (Mobile), 64px (Web)
Spacing        : 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)
Touch Target   : 44×44px minimum (Mobile/Web), 80×80px minimum (Kiosk)
```

### Status Badge Reference

| Status | Background | Text | Border |
|---|---|---|---|
| Pending | `#FFF8E1` | `#E6A500` | `#FFB700` |
| Approved | `#ECFDF5` | `#059669` | `#10B981` |
| Rejected | `#FEF2F2` | `#DC2626` | `#EF4444` |
| Confirmed | `#EFF6FF` | `#1D4ED8` | `#3B82F6` |
| Checked-In | `#F0FDF4` | `#15803D` | `#22C55E` |
| Checked-Out | `#F3F4F6` | `#4B5563` | `#9CA3AF` |
| Auto-Checkout | `#FEF3C7` | `#92400E` | `#F59E0B` |
| Overstay | `#FFF7ED` | `#C2410C` | `#EA580C` |
| Blocked | `#FEF2F2` | `#991B1B` | `#DC2626` |

### Form Validation States

```
Default Input:
  border: 1px solid #E2E8F0
  background: #FFFFFF
  label color: #4A5568

Focus:
  border: 2px solid #003580
  box-shadow: 0 0 0 3px rgba(0,53,128,0.15)
  label color: #003580

Valid / Success:
  border: 2px solid #10B981
  trailing icon: ✓ green
  helper text: "ข้อมูลถูกต้อง" — #10B981, 12px

Error:
  border: 2px solid #EF4444
  background: #FEF2F2
  trailing icon: ⚠ red
  helper text: "[ข้อความ error]" — #EF4444, 12px
  label color: #EF4444

Loading / Validating:
  border: 2px solid #FFB700
  trailing icon: spinner (animated, Navy)
  helper text: "กำลังตรวจสอบ..." — #4A5568, 12px

Disabled:
  border: 1px solid #E2E8F0
  background: #F5F7FA
  text color: #9DA8B7
  cursor: not-allowed
```

### Animation & Transition Spec

```
Page Transition     : fade + slide-up 200ms ease-out
Modal Open          : scale 0.95→1 + fade 180ms ease-out
Modal Close         : scale 1→0.95 + fade 120ms ease-in
Button Press        : scale 0.97, 80ms
Card Hover (Web)    : translateY -2px + shadow increase, 150ms
Success Animation   : checkmark draw SVG 400ms + scale bounce 200ms
Error Shake         : translateX ±8px × 3, 300ms total
Loading Spinner     : rotate 360deg 800ms linear infinite
Skeleton Pulse      : opacity 0.6→1→0.6, 1.5s ease-in-out infinite
Status Badge Update : color crossfade 300ms
QR Code Appear      : scale 0.8→1 + fade, 300ms ease-out
Kiosk Idle Return   : fade to Welcome, 500ms after countdown ends
Kiosk Button Press  : ripple from touch point, Navy color, 300ms
Counter Row Alert   : flash yellow background 3× then hold, 1s each
```

---

---

# PART 1 — MOBILE APP

## System Context

```
Platform     : iOS + Android (React Native / Flutter)
Users        : ผู้มาติดต่อ (Visitor)
Primary Flow : จองล่วงหน้า → รอ QR Code → แสดงตนที่ Kiosk
Auth         : Social Login (Google / LINE) + ThaiD App
Language     : ภาษาไทย (default) + English toggle
Min OS       : iOS 15+ / Android 10+
```

---

### Screen M1: Splash & Login

**Layout:** Full Navy background + bottom white sheet card (border-radius 24px top)

**Top (Navy full height):**
- White shield logo 80px centered at 35% from top
- "VMS" 32px Bold white
- "ระบบลงทะเบียนผู้มาติดต่อ" 14px `#B0C4DE`

**Bottom Sheet (white, rounded top 24px):**
- "เข้าสู่ระบบ" 22px Bold, margin-bottom 24px
- `[G] เข้าสู่ระบบด้วย Google` — white, border `#E2E8F0`, Google brand colors, 48px
- `[LINE] เข้าสู่ระบบด้วย LINE` — `#06C755` bg, white, 48px, gap 12px
- Divider row: line `#E2E8F0` + "หรือ" label muted center
- `[🪪] ยืนยันตัวตนด้วย ThaiD` — Navy bg, Yellow icon left, white text, 48px
- Footer 10px muted: "เวอร์ชัน 1.0.0 | กระทรวงการท่องเที่ยวและกีฬา"

**Validation:** ถ้า login failed → shake animation + error banner เหนือปุ่ม (Red bg, white text, icon ⚠)

---

### Screen M2: Home Dashboard

**Top Nav (Navy 56px):**
- "VMS" logo white left
- Center: "สวัสดี, [ชื่อ]" 16px white
- Right: 🔔 bell (badge count if unread) + avatar 36px circle

**Hero Card (Navy gradient, 16px radius, padding 20px, shadow):**
- "การนัดหมายถัดไป" 12px label uppercase yellow
- วันที่ + เวลา 18px SemiBold white
- Status badge: `Approved`
- ผู้พบ + หน่วยงาน 14px `#B0C4DE`
- `[ดู QR Code →]` Yellow full-width 48px

**Quick Actions (2×2 grid, white cards, 12px radius, shadow):**
- 📅 จองนัดหมาย | 🗂️ ประวัติการเยือน
- 🔔 การแจ้งเตือน | 👤 โปรไฟล์ของฉัน
- Each: icon 32px Navy circle bg + label 13px below

**Recent Visits (horizontal scroll):**
- Card 160×100px: ชื่อสถานที่ 13px Bold + วันที่ 11px muted + status badge

**Bottom Tab Bar (white, shadow top):**
- 🏠 หลัก | 📅 จอง | 📋 ประวัติ | 🔔 แจ้งเตือน | 👤 โปรไฟล์
- Active: icon filled Yellow + label Navy 11px
- Inactive: icon outline `#9DA8B7` + label muted

---

### Screen M3–M6: New Booking Flow (4 Steps)

**Persistent elements across all steps:**
- Header: back arrow + title + "ขั้นตอน X / 4"
- Progress bar: 4 segments, completed = Navy fill, current = Yellow, upcoming = `#E2E8F0`

**Step 1 — เลือกประเภทการเข้าพบ:**
- Radio card list (full-width, 64px, white, border `#E2E8F0`, 8px radius):
  - Icon 24px left (in Navy circle 40px) + title 15px Bold + description 12px muted right side
  - Selected: border 2px `#003580` + bg `#E8F0FF` + checkmark Yellow right
- Options: ติดต่อราชการ · ประชุม · รับ-ส่งเอกสาร · ผู้รับเหมา · อื่นๆ
- `[ถัดไป →]` Yellow 48px (disabled gray until selected)

**Step 2 — วันเวลา:**
- Calendar inline (7-column grid, 40px per cell):
  - Today: Yellow dot below date
  - Selected: Navy fill circle + white text
  - Unavailable: strikethrough muted
- เวลาเริ่ม / สิ้นสุด: scroll-drum picker (iOS style) or dropdown
- Toggle pill: `เข้าครั้งเดียว` ↔ `กำหนดช่วงวัน`
  - Range mode: date-range highlight Navy→Navy with teal fill between
- ค้นหาผู้พบ: search input + autocomplete list (max 5 items shown, tap to select)

**Step 3 — รายละเอียด:**
- จำนวนผู้ติดตาม: stepper `[ − ] 0 [ + ]` (40px buttons)
- หมายเลขโทรศัพท์: tel input with validation (10 digits, format 0XX-XXXX-XXXX)
- อีเมล: email input + validation
- วัตถุประสงค์เพิ่มเติม: textarea 4 rows, char counter bottom-right
- ยานพาหนะ (collapsible card with toggle):
  - ทะเบียน / ประเภท / สี inputs
- อุปกรณ์ที่นำเข้า: tag input — type + enter → chip, tap chip × to remove

**Step 4 — ยืนยัน:**
- Summary card (Navy left border 4px, white bg, 12px radius):
  - All fields listed 2-column, label muted + value Bold
- Checkbox: "ข้าพเจ้ายืนยันว่าข้อมูลถูกต้อง" (required to enable submit)
- `[ยืนยันและส่งคำขอ]` Yellow 48px (disabled until checkbox checked)
- `[แก้ไขข้อมูล]` Navy outline 40px

---

### Screen M7: Pending Status

**Centered layout:**
- Animated clock SVG (Navy outer ring, Yellow second hand sweep, 80px)
- "คำขออยู่ระหว่างการพิจารณา" 20px Bold Navy
- Status badge: `Pending` (large, 48px width)
- รหัสคำขอ: `VMS-20250120-0042` monospace 14px + copy icon
- Info card `#FFF8E1`: "คุณจะได้รับการแจ้งเตือนเมื่อได้รับอนุมัติ" + bell icon

---

### Screen M8: QR Code Screen

**Header Navy:** ← back + "QR Code เข้าพื้นที่" + share icon right

**Status badge:** `Approved` centered below header

**QR Code card (white, 12px radius, shadow, padding 20px):**
- QR image 220×220px centered
- Navy border 2px around QR
- "วันหมดอายุ: 20 ม.ค. 2568 18:00 น." 12px muted below
- Brightness auto-increase when screen displays QR

**Visit info list (icon + label + value rows):**
- 📅 วันที่: จ. 20 ม.ค. 2568 · 10:00–16:00 น.
- 👤 พบ: คุณสมชาย · สำนักนโยบาย
- 📍 พื้นที่: ชั้น 3 อาคาร A
- 🔢 รหัสอ้างอิง: VMS-0042

**Warning banner (Yellow bg `#FFF8E1`, border-left 4px `#FFB700`):**
- ⚠ "QR Code นี้ใช้ได้ 1 ครั้ง · หมดอายุ 20 ม.ค. 2568 18:00 น."

**Action row:** `[💾 บันทึกรูป]` Navy outline · `[📤 แชร์]` Navy outline (equal width)

---

### Screen M9: Notification Center

**Header:** "การแจ้งเตือน" + "ทำเครื่องหมายว่าอ่านแล้วทั้งหมด" link right

**Filter tabs (scrollable):** ทั้งหมด · การอนุมัติ · แจ้งเตือนระบบ · ยังไม่อ่าน

**Notification List Item (72px, white, border-bottom `#E2E8F0`):**
- Unread: left dot 8px Navy + bg `#F0F4FF`
- Read: no dot, white bg
- Icon circle 44px (color by type: Green=approved, Red=rejected, Navy=info, Yellow=reminder)
- Title 14px Bold + body 13px muted 1 line truncated
- Timestamp 11px muted right
- Swipe left → "ลบ" Red action

**Notification Types & Content:**

*Approved:*
- Icon: ✓ Green circle
- Title: "การนัดหมายได้รับอนุมัติ"
- Body: "20 ม.ค. 2568 เวลา 10:00 น. — คุณสมชาย"
- CTA tap: → QR Code screen

*Rejected:*
- Icon: ✗ Red circle
- Title: "การนัดหมายไม่ได้รับอนุมัติ"
- Body: "[เหตุผล]" + "วันว่าง: 22 ม.ค., 24 ม.ค."
- CTA tap: → Booking flow (pre-filled)

*Reminder (1 hour before):*
- Icon: 🔔 Yellow circle
- Title: "อีก 1 ชั่วโมงก่อนถึงเวลานัด"
- Body: "เตรียม QR Code และเอกสารให้พร้อม"
- CTA tap: → QR Code screen

*Check-in Confirmed (from Kiosk):*
- Icon: 🏢 Navy circle
- Title: "เข้าพื้นที่สำเร็จ"
- Body: "Check-in 20 ม.ค. 2568 10:05 น. · สำนักงานปลัด"

*Wi-Fi Credentials:*
- Icon: 📶 Teal circle
- Title: "ข้อมูล Wi-Fi ของคุณ"
- Body: "SSID: MOTS-Visitor · แตะเพื่อดูรหัสผ่าน"
- CTA tap: → inline expand showing Username + Password + copy buttons

**Push Alert Modal (overlay):**
- Full-width top banner slides down from status bar
- Navy bg, white text, icon left, dismiss × right
- Tap → open relevant screen

---

### Screen M10: History & Detail

**Header:** "ประวัติการเยือน"

**Filter tabs:** ทั้งหมด · รอดำเนินการ · อนุมัติ · ปฏิเสธ · เสร็จสิ้น

**List item (88px, white card, 8px radius, shadow-sm, margin 8px):**
- Left: colored dot by status (12px) + building icon 40px Navy bg
- Center: ชื่อหน่วยงาน 14px Bold + ประเภท + วันที่ 12px muted
- Right: status badge + chevron

**Detail Screen (tap → push):**
- Hero: status badge full-width banner + icon (96px) + ชื่อสถานที่
- Info card: all booking details
- Timeline section:
  - ○── จองนัดหมาย [date]
  - ○── ส่งคำขอ [date]
  - ○── [อนุมัติ/ปฏิเสธ] [date]
  - ○── Check-in [date]
  - ○── Check-out [date]
  - Line connecting dots Navy, completed = filled dot, upcoming = outline
- QR Code section (if Approved): collapsed by default, expand button
- Actions: `[จองใหม่แบบเดิม]` Navy outline · `[ยกเลิกการจอง]` Red ghost (if pending)

---

---

# PART 2 — WEB APP (Staff & Admin)

## System Context

```
Platform  : Responsive Web (Desktop 1280px+, Tablet 768px+)
Users     : เจ้าหน้าที่หน่วยงาน, ผู้ดูแลระบบ
Layout    : Fixed sidebar 240px + Top bar 64px + Content area
```

---

### Page W1: Login

**Split screen:** Navy 40% left · White 60% right

**Left (Navy `#003580`):**
- White logo 56px + "Visitor Management System" 24px Bold white
- "สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา" 14px `#B0C4DE`
- Subtle dot-grid pattern (white 4% opacity)

**Right (white, centered content 400px wide):**
- "เข้าสู่ระบบ" 28px Bold margin-bottom 32px
- ชื่อผู้ใช้: label + input 40px (icon: 👤 left, validation right)
- รหัสผ่าน: label + input (icon: 🔒 left, show/hide toggle right)
- `[เข้าสู่ระบบ]` Yellow 48px full-width, SemiBold
- "ลืมรหัสผ่าน?" link right-aligned 13px Navy
- Error state: Red banner above button with error message + shake animation
- Loading state: button spinner, disabled

---

### Page W2: Dashboard

**Sidebar (240px fixed, Navy `#003580`):**
- Logo + "VMS" 20px Bold white, padding 24px
- Nav items (52px height each):
  - Active: Yellow left-bar 4px + white text + icon filled
  - Hover: bg `rgba(255,255,255,0.08)` + `#B0C4DE` text
  - Inactive: `#8CA6C5` icon + `#8CA6C5` text
- Items: 📊 ภาพรวม · 📅 การนัดหมาย · 🚶 Walk-in · 🔍 ค้นหา · 🚫 Blocklist · 📋 รายงาน · ⚙️ ตั้งค่า
- Divider line `rgba(255,255,255,0.12)` before ตั้งค่า
- Bottom: avatar 36px + ชื่อ 13px Bold white + กะ 11px muted + logout icon

**Top Bar (64px, white, border-bottom, shadow-sm):**
- Breadcrumb left: ภาพรวม (current page title)
- Center: วันอังคาร 21 มกราคม 2568 14:30 น. (auto-update live)
- Right: 🔔 bell (badge) + search icon + user avatar dropdown

**KPI Cards (4 columns, white, 12px radius, shadow, padding 24px):**
- Visitors Today: large number 48px Bold Navy + delta badge vs. yesterday
- รอเข้าพื้นที่: Yellow number + Yellow dot pulse animation
- Check-in แล้ว: Green number
- ออกแล้ว: Gray number
- Each card: sparkline mini chart bottom (last 7 days)

**Real-time Visitor Table:**
- Columns: รูป(40px) · ชื่อ · ประเภท · เวลาเข้า · พบ · พื้นที่ · สถานะ · Action
- Overstay row (> 2hrs): Yellow bg `#FFF8E1` + clock icon orange
- Blocklist row: Red bg `#FEF2F2` — should not appear normally (safeguard)
- Row hover: bg `#F5F7FA`
- Action cell: `[Check-out]` red-text button · `[ดู]` Navy icon button
- Auto-refresh every 30s with "อัปเดตเมื่อ X วินาทีที่แล้ว" footer

**Right Sidebar Panel (280px):**
- `[+ ลงทะเบียน Walk-in]` Yellow 40px full-width
- `[+ สร้างนัดหมาย]` Navy outline 40px full-width
- Section: "นัดหมายที่กำลังจะมาถึง" — list 3 items (ชื่อ + เวลา + status dot)
- Section: "แจ้งเตือนระบบ" — list alerts (overstay, auto-checkout)

---

### Page W3: การนัดหมาย

**Header bar:** "การนัดหมาย" H2 + `[+ สร้างนัดหมายใหม่]` Yellow 40px right

**Filter Bar (white card, padding 16px, border-radius 12px, shadow-sm):**
- Date range picker (inline or popover calendar)
- ประเภท dropdown · สถานะ dropdown
- ค้นหา input (placeholder: "ชื่อ / เลขบัตร / บริษัท")
- `[ค้นหา]` Navy 40px · `[ล้างตัวกรอง]` ghost

**Table (white card):**
- Columns: # · รูป(40px) · ชื่อ-สกุล · เลขบัตร · ประเภท · วันนัด · เวลา · สถานะ · ผู้อนุมัติ · Action
- Action: `[✓ อนุมัติ]` green text · `[✗ ปฏิเสธ]` red text · `[👁 ดู]` navy icon
- Pagination: 20/page, page number pills, first/last buttons

**Approve Modal (560px, 16px radius):**
- Header: "อนุมัติการนัดหมาย" Navy bg
- Visitor summary card (photo + name + type + date)
- ห้องประชุม input (optional, autocomplete list)
- ผู้รับรอง input (optional, staff search)
- หมายเหตุ textarea (optional)
- Footer: `[อนุมัติ]` Yellow · `[ปฏิเสธ]` Red outline · `[ยกเลิก]` ghost

**Reject Modal (480px):**
- Header Red: "แจ้งเหตุผลการปฏิเสธ"
- เหตุผล textarea required (min 10 chars, char counter)
- วันว่างแนะนำ: date chips (click to add, max 5)
- `[ส่งการแจ้งเตือน]` Red · `[ยกเลิก]` ghost

---

### Page W4: Walk-in Registration

**Header:** "ลงทะเบียน Walk-in" + breadcrumb

**2-column layout (60% form / 40% preview):**

**Left — Form (white card, padding 32px):**

*ข้อมูลผู้มาติดต่อ section:*
- `[🪪 เสียบบัตรประชาชน]` Navy outline 40px full-width → hardware trigger
- Auto-fill indicator: fields filled = lock icon + "อ่านจากบัตรอัตโนมัติ" yellow badge
- ชื่อ (input, validation) · นามสกุล · เลขบัตรประชาชน / Passport (format mask)
- สัญชาติ dropdown · บริษัท / หน่วยงาน · หมายเลขโทรศัพท์ · อีเมล
- All inputs: 40px height, label above, validation states per spec

*รายละเอียดการเยือน section:*
- ประเภทการมาติดต่อ — select dropdown
- ผู้พบ — search autocomplete (staff directory)
- วัตถุประสงค์ — preset chips + text input
- วัน/เวลาเริ่ม · เวลาสิ้นสุด — datetime pickers
- พื้นที่ — multi-select chip input
- จำนวนผู้ติดตาม — number stepper

*อุปกรณ์ / ยานพาหนะ (collapsible accordion):*
- ยานพาหนะ toggle: ทะเบียน · ประเภท · สี
- อุปกรณ์: tag input

**Right — Preview Card (sticky top):**
- "ตัวอย่าง Visit Slip" label Navy 13px uppercase
- Live preview slip layout (updates as form is filled):
  - Placeholder dashes for empty fields
  - QR placeholder gray grid
- รูปถ่าย section: empty circle 100px → `[📷 ถ่ายรูป]` Navy → Webcam modal
  - Webcam modal: 640×480 preview + `[📸 ถ่าย]` Yellow + `[ถ่ายใหม่]` outline
  - Thumbnail after capture: 100px circle, `[เปลี่ยนรูป]` link below

**Footer:** `[ยกเลิก]` ghost · `[Check-in และพิมพ์ Slip]` Yellow 48px (validates all required fields)

---

### Page W5: ค้นหาผู้มาติดต่อ

**Search Hero (white card, padding 24px, shadow):**
- Large search input 48px full-width (placeholder: "ชื่อ / เลขบัตรประชาชน / บริษัท / รหัสอ้างอิง")
- Right of input: `[🔍 ค้นหา]` Navy 48px + `[📷 สแกน QR]` icon button

**Advanced Filter (collapsible, `▼ ตัวกรองเพิ่มเติม` toggle):**
- ช่วงวันที่ · ประเภท · สถานะ · ผู้พบ · พื้นที่ — in 3-column grid

**Results Table:**
- Columns: รูป · ชื่อ · เลขบัตร · บริษัท · ครั้งล่าสุด · สถานะ · Action
- Row click → Right Detail Drawer (480px, slides in from right)

**Detail Drawer:**
- Header: ชื่อผู้มาติดต่อ + close ×
- Photo 80px circle + ชื่อ 20px Bold + เลขบัตร + บริษัท
- Status badge current
- Blocklist alert if blocked: Red banner full-width
- Tabs: ข้อมูลทั่วไป · ประวัติการเยือน
  - ข้อมูลทั่วไป: full profile fields
  - ประวัติการเยือน: timeline list (date + type + status + duration)
- Action buttons (full-width, stacked):
  - `[← Check-out]` Red (if checked-in)
  - `[🖨 พิมพ์ Slip ซ้ำ]` Navy outline
  - `[🚫 เพิ่ม Blocklist]` dark gray outline
  - `[📋 ดูประวัติทั้งหมด]` ghost

---

### Page W6: Blocklist Management

**Header:** "จัดการ Blocklist" + `[+ เพิ่มรายการ]` Red button right

**Stats bar (3 cards):** รายการทั้งหมด · บล็อกถาวร · บล็อกชั่วคราว (with expiry soon badge)

**Table:**
- Columns: รูป(40px) · ชื่อ-สกุล · เลขบัตร · เหตุผล · ประเภท · วันหมดอายุ · เพิ่มโดย · วันที่ · Action
- ประเภท badge: ถาวร (Red) / ชั่วคราว (Orange)
- Expiry soon (< 7 days): Yellow warning icon
- Action: `[แก้ไข]` Navy text · `[ลบออก]` Red text (confirm modal)

**Add/Edit Modal (560px):**
- ค้นหาบุคคล: search existing visitor or fill new info
- เหตุผลการบล็อก textarea required
- ประเภท radio: ถาวร / ชั่วคราว
- If ชั่วคราว: date picker วันหมดอายุ
- `[บันทึก]` Red · `[ยกเลิก]` ghost

---

### Page W7: รายงาน (Reports)

**Sub-nav tabs:** รายงานประจำวัน · รายสัปดาห์ · รายเดือน · Audit Log · ส่งออกข้อมูล

**Report Filter Bar:**
- Date range · ประเภทผู้มาติดต่อ · สถานะ · ผู้พบ
- `[สร้างรายงาน]` Navy · `[ส่งออก Excel]` Green · `[พิมพ์]` outline

**Charts Section (2-column grid):**
- Bar chart: จำนวนผู้เยือนรายวัน — Navy bars, Yellow highlight today
- Pie chart: สัดส่วนประเภทผู้มาติดต่อ — 5 colors (Navy palette)
- Line chart: แนวโน้ม Check-in/out — dual line Navy + Yellow
- Heatmap: ช่วงเวลาที่มีผู้มาติดต่อมากสุด (7 days × 24 hours grid)

**Audit Log Table:**
- Columns: Timestamp · ผู้ดำเนินการ · Action Type · รายละเอียด · IP Address · สถานะ
- Action Type badge color-coded (Create/Update/Delete/Login)
- Filter by Action Type dropdown

---

### Page W8: User & Permission Management

**Header:** "จัดการผู้ใช้และสิทธิ์" + `[+ เพิ่มผู้ใช้]` Yellow right

**User Table:**
- Columns: รูป · ชื่อ-สกุล · ตำแหน่ง · Role · สถานะ · กะ · เข้าสู่ระบบล่าสุด · Action
- Role badge: Admin (Navy) · Supervisor (Teal) · Officer (Blue) · Read-Only (Gray)
- สถานะ: Active (Green dot) / Inactive (Gray dot) / Locked (Red dot)
- Action: `[แก้ไข]` · `[รีเซ็ตรหัสผ่าน]` · `[ปิดใช้งาน]`

**Add/Edit User Modal (600px):**
- Section: ข้อมูลส่วนตัว — ชื่อ · นามสกุล · รหัสพนักงาน · อีเมล · หมายเลขโทรศัพท์
- Section: การเข้าสู่ระบบ — ชื่อผู้ใช้ · รหัสผ่าน (auto-generate toggle)
- Section: สิทธิ์และบทบาท:
  - Role dropdown: Admin / Supervisor / Officer / Read-Only
  - Permission matrix (table): rows = modules, cols = Read/Write/Delete checkboxes
    - Modules: นัดหมาย · Walk-in · Blocklist · รายงาน · ผู้ใช้ · ตั้งค่า
  - กะ: checkboxes เช้า / บ่าย / ดึก
- `[บันทึก]` Yellow · `[ยกเลิก]` ghost

---

---

# PART 3 — KIOSK (Self-Service Touch Screen)

## System Context

```
Device          : Touch screen 32" Full HD 1920×1080, landscape
Min Touch Target: 80×80px
Min Font Size   : 18px body, 32px heading, 24px button label
Idle Timeout    : 60 seconds → countdown bar → auto-return Welcome
Input Devices   : Touch · Smart Card Reader · Camera · QR Scanner · Passport MRZ
```

---

### Screen K1: Welcome / Idle

**Top Bar (120px, Navy):**
- Logo white left 48px + "Visitor Management System" center 22px white
- Live clock right: "14:30:25 น." 28px white monospace + date below 16px `#B0C4DE`

**Center (white bg, 720px wide center column):**
- Illustration 200px (building + people abstract, Navy tones)
- "ยินดีต้อนรับ" 56px Bold Navy
- "กรุณาเลือกรายการ / Please select an option" 22px muted
- Gap 48px

**2 Option Cards (side by side, 480×280px each, 20px radius, shadow):**

Left card (Navy gradient `#003580` → `#001F4E`):
- 📅 icon 80px white above center
- "มีนัดล่วงหน้า" 32px Bold white
- "Pre-Registration Check-in" 18px `#B0C4DE`
- Press animation: scale 0.97 + ripple

Right card (Yellow `#FFB700`):
- 🚶 icon 80px Navy above center
- "ลงทะเบียนหน้างาน" 32px Bold Navy
- "Walk-in Registration" 18px `#665500`

**Bottom Bar (80px, Navy):**
- QR icon white left + "สแกน QR Code จากอีเมล / App เพื่อ Check-in โดยตรง" 18px white center
- Tap entire bar → QR scan overlay

**Idle Animation:** Cards pulse (shadow grows) every 8s alternating · Screen dim to 60% after 45s

---

### Screen K2A: เลือกวิธียืนยันตัวตน (Pre-registered)

**Header (Navy 100px):**
- Back button (80×80px, ← icon 36px white) left
- "มีนัดล่วงหน้า" 28px Bold white center + "Pre-Registered Check-in" 16px `#B0C4DE`

**Option Cards (stacked, full-width 1600px, 120px height, 16px radius, shadow, gap 16px):**

Card 1: เสียบบัตรประชาชน
- 🪪 icon circle 72px Navy bg · "เสียบบัตรประชาชน" 24px Bold · "กรุณาเสียบบัตรที่ช่องอ่านบัตรด้านล่าง" 18px muted
- Right: animated card-insert arrow (blinking, Navy → Yellow)

Card 2: ThaiD App
- 📱 icon circle 72px · "แสดง ThaiD App" 24px Bold · "กรุณาให้เจ้าหน้าที่สแกน QR จาก ThaiD"
- Right: QR viewfinder animation

Card 3: QR Code จากอีเมล / App
- 🔲 icon circle 72px · "สแกน QR Code" 24px Bold · "กรุณากดเพื่อเปิดกล้องสแกน QR"
- Right: scan beam animation

Card 4: หนังสือเดินทาง / ใบขับขี่
- 📖 icon circle 72px · "หนังสือเดินทาง / ใบขับขี่" 24px Bold · "กรุณาวางเอกสารที่เครื่องอ่าน MRZ"
- Right: document scan animation

Selected card: Yellow border 4px + bg `#FFF8E1` + checkmark badge top-right

**Bottom:** `[ถัดไป →]` Yellow 80px height full-width (disabled until selected)

---

### Screen K2B: กำลังอ่านบัตร / สแกน

**Center (white):**
- Animation 200px (card slot illustration, card sliding in loop, Navy + Yellow)
- "กำลังอ่านบัตร..." 36px Bold Navy
- "Please insert your ID card" 22px muted
- Progress bar (Navy fill, 80% width, animated shimmer)
- `[ยกเลิก]` ghost button 80px height, 300px width, centered

**Timeout:** If no card after 30s → "ไม่พบข้อมูล กรุณาลองอีกครั้ง" error state + retry/cancel buttons

---

### Screen K2C: Passport / MRZ Scan Flow

**Header:** "วางหนังสือเดินทาง / วางใบขับขี่"

**Center:**
- Camera viewfinder rectangle (800×500px, dashed border Navy 3px, corner markers Yellow)
- "วางเอกสารในกรอบที่กำหนด" 28px Bold center
- "Place your document within the frame" 20px muted
- Live MRZ detection indicator:
  - Scanning: "กำลังสแกน..." Yellow pulse dots
  - MRZ detected: "พบ MRZ ✓" Green + flash green border frame
  - Reading: progress bar
  - Complete: brief green overlay + checkmark
- Supported documents row (icon chips): 🛂 Passport · 🚗 Thai Driver License
- `[ยกเลิก]` Navy outline 80px height

**After successful scan → transition to K3A with auto-filled data**

---

### Screen K3A: ยืนยันข้อมูล (Pre-registered)

**Header:** "ตรวจสอบข้อมูลการนัดหมาย / Verify Your Appointment"

**2-column layout:**

Left 600px — ข้อมูลผู้มาติดต่อ:
- รูปถ่าย 140px circle, Navy border 3px (from บัตร or camera)
- ชื่อ-นามสกุล 32px Bold Navy
- เลขบัตรประชาชน 20px muted (masked: X-XXXX-XXXXX-XX-X)
- บริษัท / หน่วยงาน 20px
- Blocklist status: ✅ icon Green "ผ่านการตรวจสอบ" OR ⛔ Red banner (→ K-Blocked)

Right 960px — รายละเอียดนัดหมาย (card, Yellow left border 8px, 20px radius):
- Status badge `Approved` 48px height
- 📅 วันที่ 28px · ⏰ เวลา 28px · 👤 ผู้พบ 24px · 🏢 หน่วยงาน 22px · 📍 พื้นที่ 22px

**Editable section (large inputs):**
- จำนวนผู้ติดตาม: `[−]` 80px · number 48px · `[+]` 80px (Navy buttons)
- ทะเบียนยานพาหนะ: large input 64px height + numpad if focus

**Footer (120px, shadow top):**
- `[ยกเลิก]` Navy outline 80px · gap · `[✓ ยืนยันเข้าพื้นที่]` Yellow 80px (70% width)
- Countdown bar: 60s → return to Welcome if no action

---

### Screen K3B: เลือกประเภท Walk-in

**Header:** "เลือกประเภทการเข้าพบ / Select Visit Type"

**Card grid (2×3, 480×180px each, 20px radius, Navy, shadow):**
- 🏢 ติดต่อราชการ | 📋 เข้าร่วมประชุม
- 📦 รับ-ส่งสินค้า | 🔧 ซ่อมบำรุง / ผู้รับเหมา
- 👥 Visitor ทั่วไป (Yellow card) | ➕ อื่นๆ (outline)
- Each: icon 64px + label 24px Bold + sublabel 16px muted
- Selected: Yellow border 6px + Yellow checkmark badge 40px top-right

**Footer:** `[ถัดไป →]` Yellow 80px (disabled until selected)

---

### Screen K4: Walk-in — ยืนยันตัวตน

**Header:** "ยืนยันตัวตน / Identity Verification"

**Method tabs (3 tabs, 80px height, full-width):**
- Active tab: Navy bg white text · Inactive: white Navy text border
- เสียบบัตร · ThaiD / QR · กรอกเอง

**If "กรอกเอง":**
- Form with on-screen keyboard (slide up from bottom 400px, Thai + EN layout):
  - ชื่อ input 64px height · นามสกุล input
  - เลขบัตร 13 หลัก (numpad layout: 3×3 + 0)
  - บริษัท / หน่วยงาน
- Keyboard rows (each key 80px wide × 64px tall, Navy border, white bg, Navy text):
  - Row 1: ๆ ไ ำ พ ะ ั ี ร น ย บ ล
  - Row 2: ฟ ห ก ด เ ้ ่ า ส ว ง
  - Row 3: ผ ป แ อ ิ ื ท ม ใ ฝ
  - Special keys: 80px wide × 64px tall: Shift · Backspace · Space · ↵ Enter
  - EN mode toggle: Navy pill bottom left

**Numpad (for เลขบัตร):**
- 3-column grid: 1 2 3 / 4 5 6 / 7 8 9 / ← 0 ✓
- Each key: 160×96px, Navy border, 36px number, rounded

**Additional required fields (after identity):**
- ผู้ต้องการพบ: search input 64px height + autocomplete dropdown (large items 64px)
- วัตถุประสงค์: preset chips (80px height each, 3-column) + "อื่นๆ" → text input

---

### Screen K5: ถ่ายรูป

**Center:**
- Oval face guide 500×620px (dashed Navy outline, transparent center)
- Camera live preview fills background
- "หันหน้าตรงและมองที่กล้อง" 32px Bold white (text-shadow Navy)
- Face detection status (below oval):
  - ⬤ "กำลังจับใบหน้า..." Yellow pulse
  - ✓ "พบใบหน้าแล้ว — กำลังถ่าย" Green + border flash Green
- Auto-capture countdown ring (SVG circle, Navy stroke, depleting, 3px stroke 200px diameter):
  - 3 → 2 → 1 → ชัตเตอร์ flash
- Anti-spoofing indicator: small badge top-right "Face Liveness ✓" after detection

**Manual controls:**
- `[📸 ถ่ายรูปเดี๋ยวนี้]` Yellow 80px · (after capture) `[🔄 ถ่ายใหม่]` Navy outline 80px

---

### Screen K6: Blocklist Alert

**Overlay (rgba 0,0,0 0.7 fullscreen):**

**Center card (white, 800×480px, 24px radius, shadow):**
- Red top bar 80px: ⛔ "ไม่สามารถดำเนินการได้" 28px Bold white
- Icon 96px Red circle ⛔ centered
- "บุคคลนี้ไม่สามารถเข้าพื้นที่ได้" 32px Bold Navy
- "Your entry has been denied. Please contact security." 20px muted
- Info: "กรุณาติดต่อเจ้าหน้าที่รักษาความปลอดภัยโดยตรง" 22px
- `[กลับหน้าหลัก]` Navy 80px centered (auto-trigger after 10s countdown bar)

---

### Screen K7: Check-in Success + Visit Slip Preview

**Background:** Navy gradient full-screen

**Center card (white, 1200×680px, 24px radius, shadow-lg):**

Left 480px:
- ✅ SVG checkmark animation (Navy circle, Yellow check drawing 400ms + bounce)
- "Check-in สำเร็จ!" 40px Bold Navy
- "Registration Successful" 22px muted
- Divider
- รูปถ่ายผู้มาติดต่อ 80px circle
- ชื่อ 24px Bold · เวลาเข้า 20px · ผู้พบ 18px muted

Right 720px — "Visit Slip Preview":
- Border Navy 2px, 12px radius, padding 24px
- Header: Logo + "VISIT SLIP" centered
- Fields in 2-column grid (label muted 12px + value 14px Bold)
- QR Code 160px centered
- Wi-Fi box (Yellow bg `#FFF8E1`, Navy border-left 4px):
  - 📶 SSID: MOTS-Visitor
  - 👤 Username: visitor_XXXXXX
  - 🔑 Password: XXXXXXXX

**Bottom bar (80px, Navy):**
- 🖨 "กำลังพิมพ์ Visit Slip..." animated dots (auto-print on arrival)
- "กรุณารับ Visit Slip ด้านล่างเครื่อง" 18px white center
- Auto-return countdown bar (15s, Yellow fill depleting full-width)

---

### Screen K8: Check-out

**K8.1 — เลือกวิธี Check-out:**
- Same as K2A but header: "Check-out ออกพื้นที่ / Check-out"
- Options: เสียบบัตร · ThaiD · สแกน QR จาก Slip

**K8.2 — ยืนยัน Check-out:**
- รูปถ่าย 120px + ชื่อ 32px Bold + เลขบัตร masked 20px
- Summary card (Navy left border): เวลาเข้า · ระยะเวลา · พื้นที่ · ผู้พบ
- QR Code preview (small 120px, faded) with "จะถูกยกเลิกทันทีหลัง Check-out" caption
- Wi-Fi preview: "บัญชีจะถูกระงับอัตโนมัติ"
- `[ยกเลิก]` Navy outline 80px · `[✓ ยืนยันออกพื้นที่]` Red 80px

**K8.3 — Check-out Success:**
- Green checkmark animation
- "Check-out สำเร็จ · ขอบคุณที่มาเยือน"
- "Check-out Successful · Thank you for visiting"
- QR Code displayed with large ✕ Red overlay: "ยกเลิกแล้ว"
- Wi-Fi: "บัญชีถูกระงับแล้ว" Red badge
- Auto-return 10s countdown bar

---

### Kiosk Thermal Print Layout — Visit Slip (80mm)

```
Print width   : 576px (80mm at 203dpi)
Font          : Thai system font + EN fallback
Margins       : 8px left/right

┌─────────────────────────────────┐
│  [Logo 40px] VISIT SLIP         │ ← 48px height, Navy bg, white text
│  สำนักงานปลัด กระทรวงฯ         │ ← 12px, centered
├─────────────────────────────────┤
│  ชื่อ: [ชื่อ-นามสกุล]           │ ← 14px Bold
│  บัตร: X-XXXX-XXXXX-XX-X       │ ← 12px
│  บริษัท: [company]              │ ← 12px
├─── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──│ ← dashed separator
│  ประเภท: [type]                 │ ← 12px
│  พบ:     [name/dept]            │ ← 12px
│  วันที่:  [date]                 │ ← 12px
│  เวลา:   [time-in] – [time-out] │ ← 12px
│  พื้นที่: [area]                 │ ← 12px
├─── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──│
│         [QR Code 200×200px]     │ ← centered
│    รหัส: VMS-20250120-0042      │ ← 11px, centered
├─── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──│
│  ═══ Wi-Fi Access ═══           │ ← 12px Bold centered
│  SSID:  MOTS-Visitor            │ ← 11px
│  User:  visitor_XXXXXX          │ ← 11px monospace
│  Pass:  XXXXXXXX                │ ← 11px monospace Bold
│  หมดอายุ: [datetime]            │ ← 10px muted
└─────────────────────────────────┘
  print: @page { size: 80mm auto; margin: 0 }
  font-size: minimum 11px for readability
```

---

---

# PART 4 — COUNTER (รปภ.) WEB APP

## System Context

```
Platform    : Web App Desktop 1920×1080 (counter monitor)
Users       : เจ้าหน้าที่รักษาความปลอดภัย
Layout      : 3-column fixed (no sidebar nav — space maximized)
Hardware    : Smart Card Reader · Webcam · Thermal Printer
```

---

### Page C1: Counter Login

**Full Navy background:**
- White card 400×500px centered, 16px radius, shadow-lg
- Logo 56px + "เจ้าหน้าที่รักษาความปลอดภัย" 14px label Navy
- "เข้าสู่ระบบ" 28px Bold
- ชื่อผู้ใช้ + รหัสผ่าน inputs 40px
- กะ radio: ⬤ เช้า 08:00–16:00 · ⬤ บ่าย 16:00–24:00 · ⬤ ดึก 00:00–08:00
- `[เข้าสู่ระบบ]` Yellow 48px

---

### Page C2: Counter Main Dashboard

**Top Bar (56px, Navy):**
- "VMS Counter" logo white left
- Center: live clock 20px white Bold monospace (updates every second)
- "ผู้อยู่ในอาคาร:" + Yellow badge `28` 18px Bold
- Right: 🔔 bell (badge count for alerts) · ชื่อเจ้าหน้าที่ + กะ · Logout

**Overstay Alert Banner (appears dynamically, Orange bg `#FEF3C7`, full-width below top bar):**
- ⏰ "มีผู้มาติดต่ออยู่เกินเวลา 3 ราย — กรุณาตรวจสอบ" + `[ดูรายการ]` Navy text link
- Dismiss × right

**3-Column Main Layout:**

---

**Column 1 (380px, border-right) — ค้นหาและรับผู้มาติดต่อ:**

Search box (full-width, 48px, autofocus):
- Placeholder: "ชื่อ / เลขบัตร / รหัส VMS"
- Right icon: 🔍 + 📷 scan button

`[🪪 เสียบบัตรประชาชน]` Yellow 48px full-width (hardware trigger)

Filter pills (toggle): ทั้งหมด · มีนัด · Walk-in · รอเข้า · Check-in แล้ว

**Upcoming Today** (list, 64px items):
- เวลา (large, Navy) · ชื่อ · ประเภท · สถานะ dot
- Sorted by เวลานัด ascending

---

**Column 2 (700px, border-right) — รายการผู้มาติดต่อวันนี้:**

Table header: # · รูป(40px) · ชื่อ · ประเภท · เวลาเข้า · นานแค่ไหน · พบ · สถานะ · Action

Row (56px height):
- Normal: white
- Selected/active: Yellow left border 4px + bg `#FFFBEB`
- Overstay: Orange bg `#FFF7ED` + clock icon orange
- New arrival (flash 3s): brief Green highlight

Duration cell: "2 ชม. 15 น." — turns Orange if > 2hrs, Red if > 4hrs

Action cell: compact icon buttons 36px each:
- ✓ Check-out (Red icon) · 🖨 Print · 👁 View

Auto-refresh indicator: "🔄 อัปเดตอัตโนมัติ" + last-updated timestamp (footer)

Pagination: 20/page or infinite scroll option

---

**Column 3 (840px) — รายละเอียด + Action Panel:**

**Default (no selection):**
- "🔍 เลือกรายการจากตาราง หรือค้นหาผู้มาติดต่อ" centered muted
- Stats summary widget:
  - จำนวนผู้เข้าวันนี้: `42` large Navy
  - รอเข้า: `7` Yellow · Check-in: `28` Green · ออกแล้ว: `14` Gray

**After card read / row selection:**

**Visitor Identity Card (top, white, 12px radius, shadow, padding 20px):**
- Left: รูปถ่าย 100px circle (from บัตร or database)
- Right:
  - ชื่อ-นามสกุล 22px Bold Navy
  - เลขบัตร 14px muted masked
  - บริษัท 14px
  - Status badge 40px height
  - Blocklist: ✅ "ผ่าน Blocklist" Green small · OR ⛔ Red banner full-width

**Booking Info Card (if pre-registered, Yellow left border 4px):**
- ประเภท · วันนัด · เวลา · ผู้พบ · พื้นที่ · ผู้อนุมัติ
- All fields: label 11px uppercase muted + value 14px

**Action Buttons (stacked, full-width, gap 8px):**

Primary actions:
- If pre-registered + Approved: `[✓ Check-in]` Yellow 48px + `[✗ ปฏิเสธ]` Red outline 40px
- If checked-in: `[← Check-out]` Red 48px
- If walk-in: `[+ Walk-in ลงทะเบียน]` Yellow 48px → expand inline form below

Secondary actions (40px, outline):
- `[🖨 พิมพ์ Slip ซ้ำ]` Navy outline
- `[🚫 เพิ่ม Blocklist]` Dark gray outline
- `[📋 ประวัติทั้งหมด]` ghost link

---

### Page C3: Walk-in Inline Form (Counter)

Expands within Column 3, replaces detail panel:

**Tabs (40px):** รายบุคคล · กลุ่ม / Batch

**รายบุคคล tab:**

*อ่านข้อมูล:*
- `[🪪 เสียบบัตร]` Yellow trigger → auto-fill below
- Auto-filled fields: lock icon badge "อ่านจากบัตรอัตโนมัติ" Yellow

*Form fields (compact 40px height):*
- ชื่อ · นามสกุล · เลขบัตร · บริษัท (2-column grid)
- ประเภทการมาติดต่อ dropdown · ผู้พบ search
- วัตถุประสงค์ chips · เวลาสิ้นสุด picker
- จำนวนผู้ติดตาม stepper

*ถ่ายรูป:*
- `[📷 เปิดกล้อง]` Navy → inline webcam strip (480×270px, above buttons)
- `[📸 ถ่าย]` Yellow · `[ถ่ายใหม่]` outline · thumbnail 60px after capture

*Actions:*
- `[ยกเลิก]` ghost · `[Check-in + พิมพ์ Slip]` Yellow 48px full-width

**กลุ่ม / Batch tab:**
- Drag-drop zone: dashed border `#E2E8F0`, 150px height, icon + "ลาก Excel ที่นี่ หรือคลิกเพื่อเลือกไฟล์"
- After upload: preview table (compact 36px rows): # · ชื่อ · เลขบัตร · ✓/✗ valid
- Error rows highlighted Red with inline error message
- `[นำเข้าและ Check-in ทั้งกลุ่ม]` Yellow · `[ดาวน์โหลด Template]` ghost

---

### Page C4: Overstay Alert Dashboard Widget

**Appears as:** Persistent alert section within Column 1 bottom (or full Column 3 when filtered)

**Widget header (Orange bg `#FEF3C7`, border `#F59E0B`):**
- ⏰ "ผู้มาติดต่อที่อยู่เกินเวลา" + count badge Orange

**List (each row 64px, white, border-bottom Orange-light):**
- รูป 36px circle · ชื่อ 14px Bold · "อยู่มา X ชม. Y น." Orange Bold · `[Check-out]` Red outline 32px

**Auto-sound alert:** ding notification when new overstay detected (system sound)

**Auto-checkout countdown:** if no action within N minutes → system auto-checkout + log "ไม่มีการตอบสนอง"

---

### Page C5: Blocklist Alert Modal

**Triggered automatically on card read / QR scan of blocked visitor:**

**Modal (560×420px, 16px radius, shadow-xl):**
- Header bar Red 80px: ⛔ "ตรวจพบรายชื่อ Blocklist" 24px Bold white
- Body:
  - รูป 80px circle (from record) + ชื่อ 20px Bold + เลขบัตร
  - Blocklist reason card (Red bg `#FEF2F2`): "เหตุผล: [reason]"
  - "บันทึกโดย: [staff name] · วันที่: [date]"
  - "บุคคลนี้ไม่สามารถเข้าพื้นที่ได้ในทุกกรณี" 18px Bold Red
- Footer: `[รับทราบและปิด]` Red 48px · `[ดู Blocklist]` ghost

**Auto-log:** System records attempt + timestamp + card number in Audit Log

---

### Page C6: End of Shift Summary

**Triggered on Logout or via menu:**

**Modal / Full page (white, 800px wide):**
- Header: "สรุปการทำงาน — [กะ] · [วันที่] · [ชื่อเจ้าหน้าที่]"

**Stats grid (2×3 cards):**
- ผู้ผ่านเข้าทั้งหมด (large Navy) · Walk-in · มีนัด
- Check-out เรียบร้อย · Auto-checkout · คงเหลือในอาคาร (if > 0 → Yellow)

**Overstay list (if any still inside):**
- Table: ชื่อ · เวลาเข้า · ผ่านมา · สถานะ
- `[Force Check-out ทั้งหมด]` Red outline

**Actions:**
- `[🖨 พิมพ์รายงานกะ]` Navy · `[📥 ส่งออก Excel]` Green
- `[ออกจากระบบ]` Red outline (final logout)

---

---

# SHARED COMPONENT LIBRARY

## Components (ใช้ร่วมกันทุก Module)

| Component | Props | Notes |
|---|---|---|
| `StatusBadge` | status, size | Auto color/label from status string |
| `VisitorCard` | photo, name, id, company, status | Horizontal layout |
| `QRCodeDisplay` | code, expiry, size | Shows expiry warning if < 2hrs |
| `WifiCredentials` | ssid, username, password | Password reveal toggle |
| `BookingTimeline` | events[] | Check-in → events → check-out line |
| `BlocklistBanner` | reason, addedBy, date | Full-width Red alert |
| `SmartCardReader` | onRead, status | Hardware trigger button + status |
| `ThaiDateTimePicker` | value, onChange, mode | BE/CE toggle, Thai locale |
| `VisitSlipPreview` | visitData | Printable layout, 80mm compatible |
| `FaceCapture` | onCapture, antiSpoof | Camera + liveness detection overlay |
| `NumberStepper` | value, min, max, onChange | Large for Kiosk, compact for Web |
| `AutocompleteSearch` | query, results, onSelect | Debounced, async |
| `ValidationInput` | type, rules, value | All validation states |
| `ConfirmModal` | title, message, onConfirm | Danger / Warning / Info variants |

---

## API Integration Points

```
Auth
POST   /api/auth/login                  เข้าสู่ระบบ (staff)
POST   /api/auth/social                 Mobile social login
POST   /api/auth/thaid                  ThaiD verification
POST   /api/auth/logout

Bookings
GET    /api/bookings                    List with filters
POST   /api/bookings                    สร้างการจอง
GET    /api/bookings/:id
PUT    /api/bookings/:id/approve        อนุมัติ
PUT    /api/bookings/:id/reject         ปฏิเสธ
DELETE /api/bookings/:id                ยกเลิก

Visitors
POST   /api/checkin                     Check-in → สร้าง QR + Wi-Fi
POST   /api/checkout                    Check-out → ยกเลิก QR + ระงับ Wi-Fi
GET    /api/visitors/search             ค้นหา
GET    /api/visitors/:id/history        ประวัติ
POST   /api/visitors/batch              Batch check-in

Blocklist
GET    /api/blocklist                   รายการ
POST   /api/blocklist                   เพิ่ม
PUT    /api/blocklist/:id               แก้ไข
DELETE /api/blocklist/:id               ลบ
GET    /api/blocklist/check/:idNumber   ตรวจสอบ (real-time)

Wi-Fi
POST   /api/wifi/create                 สร้าง account (→ agency API)
DELETE /api/wifi/:username              ระงับ (→ agency API)
GET    /api/wifi/:username/status       สถานะ

Reports
GET    /api/reports/daily
GET    /api/reports/monthly
GET    /api/reports/audit-log
GET    /api/reports/export              Excel download

Hardware (Kiosk/Counter)
POST   /api/hardware/card-read          Smart card data
POST   /api/hardware/mrz-read          Passport MRZ data
POST   /api/hardware/print             Print Visit Slip
```

---

## Tech Stack Recommendations

| Module | Primary | Alternative |
|---|---|---|
| Mobile App | React Native + Expo | Flutter |
| Web App | Next.js + Tailwind CSS | React + Vite |
| Kiosk | Electron.js + React (kiosk mode) | Vue.js + Tauri |
| Counter Web | Same codebase as Web App (layout variant) | — |
| State Management | Zustand / Redux Toolkit | TanStack Query |
| Forms | React Hook Form + Zod | Formik |
| Charts | Recharts / Chart.js | Nivo |
| QR Code | react-qr-code / qrcode.react | — |
| Camera | react-webcam / expo-camera | — |
| Print | react-to-print / electron-print | — |

---

## Accessibility & UX Requirements

```
Color Contrast     : WCAG AA minimum — 4.5:1 text, 3:1 UI components
Touch Targets      : 44×44px min (Mobile/Web), 80×80px min (Kiosk)
Loading States     : Skeleton screens (not spinners alone) for data
Error States       : Inline validation + banner + field highlight
Empty States       : Illustration + helper text + CTA
Offline States     : Cached data banner + sync indicator
Kiosk Idle         : Auto-reset 60s, large font, no small targets
Kiosk Timeout bar  : Yellow depleting bar always visible at bottom
Print              : @media print stylesheet, 80mm thermal compatible
Language           : Thai primary, English sub-labels throughout
Buddhist Era       : BE (พ.ศ.) default in all date display
Date Format        : วันจันทร์ที่ 20 มกราคม 2568 (Thai full format)
Time Format        : 14:30 น. (24-hour, Thai suffix)
```

---

*VMS Prototype SRS Prompt — v2.0 Full Edition*  
*สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา*
