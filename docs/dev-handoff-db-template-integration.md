# Dev Handoff: DB-Aware Flex Templates + API Doc Updates

> **Date:** 7 เมษายน 2569
> **Status:** Implementation complete, TypeScript & Build passed
> **Branch:** ยังไม่ได้ commit — กรุณา review แล้ว commit

---

## สรุปปัญหาที่แก้

Admin สามารถ customize Flex Message templates ผ่านหน้า `/web/settings/line-message-templates` ซึ่งบันทึกลง DB (`LineFlexTemplate`) **แต่เมื่อส่ง LINE message จริง ทุก factory function อ่านจาก static defaults เท่านั้น — DB ไม่เคยถูกใช้**

ตอนนี้แก้แล้ว: ทุก Flex Message factory อ่านจาก DB ก่อน แล้ว fallback เป็น static defaults ถ้า DB ไม่มีหรือ error

---

## ไฟล์ที่เปลี่ยน

### 1. Core: DB-Aware Template Loader

| File | Changes |
|------|---------|
| `lib/line-flex-template-data.ts` | เพิ่ม `getFlexTemplateFromDB()`, `dbRecordToFlexConfig()`, `invalidateTemplateCache()`, in-memory cache (60s TTL) |

**รายละเอียด:**
- `getFlexTemplateFromDB(stateId)` — async function อ่าน DB ก่อน, cache 60 วินาที, fallback เป็น static ถ้า DB error
- `dbRecordToFlexConfig()` — แปลง Prisma record → `FlexTemplateConfig` (handle flat→nested infoBox, preserve `statusBadgeType`/`availableVariables` จาก static)
- `invalidateTemplateCache(stateId?)` — ล้าง cache เฉพาะ template หรือทั้งหมด

### 2. Flex Message Factories → Async (13 ไฟล์)

| File | Changes |
|------|---------|
| `lib/flex/messages/booking-confirmed.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/checkin.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/checkout.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/auto-cancelled.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/reminder.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/wifi-credentials.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/visit-slip.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/visitor-registered.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/officer-registered.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/officer-new-request.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/officer-checkin-alert.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/officer-overstay-alert.ts` | sync→async, import `getFlexTemplateFromDB` |
| `lib/flex/messages/approval-result.ts` | sync→async, import `getFlexTemplateFromDB` |

**Pattern ที่เปลี่ยนในทุกไฟล์:**
```typescript
// Before
import { getFlexTemplate } from "@/lib/line-flex-template-data";
export function buildXxxMessage(...): LineFlexMessage {
  const template = getFlexTemplate("state-id")!;

// After
import { getFlexTemplateFromDB } from "@/lib/line-flex-template-data";
export async function buildXxxMessage(...): Promise<LineFlexMessage> {
  const template = (await getFlexTemplateFromDB("state-id"))!;
```

### 3. Callers → เพิ่ม `await`

| File | Changes |
|------|---------|
| `lib/notification-service.ts` | เพิ่ม `await` ใน 8 case branches ที่เรียก factory |
| `app/api/liff/register/route.ts` | เพิ่ม `await` ที่ `buildVisitorRegisteredMessage()` |
| `app/api/liff/register-officer/route.ts` | เพิ่ม `await` ที่ `buildOfficerRegisteredMessage()` |
| `app/api/line/webhook/route.ts` | เพิ่ม `await` ที่ `buildApprovalResultMessage()` |

### 4. Cache Invalidation

| File | Changes |
|------|---------|
| `app/api/settings/line-oa/flex-templates/route.ts` | เพิ่ม `invalidateTemplateCache()` หลัง PUT bulk save |
| `app/api/settings/line-oa/flex-templates/[stateId]/route.ts` | เพิ่ม `invalidateTemplateCache(stateId)` หลัง PATCH save |

### 5. API Documentation

| File | Changes |
|------|---------|
| `lib/api-doc-data.ts` | แก้ path ผิด, เอา "mock" notes ออก, เพิ่ม LIFF endpoints 3 ตัว |
| `lib/openapi/generate-spec.ts` | เพิ่ม `liff` tag mapping |
| `docs/line-oa-api-spec.md` | เพิ่ม LIFF API Endpoints section |

---

## Architecture: Data Flow

```
Admin แก้ template → PUT/PATCH API → DB save → invalidateTemplateCache()
                                                        ↓
User trigger (webhook/notification) → factory function (async)
                                           ↓
                                   getFlexTemplateFromDB(stateId)
                                           ↓
                                   [cache hit?] → return cached
                                           ↓ (cache miss)
                                   [DB query] → found? → dbRecordToFlexConfig() → cache & return
                                           ↓ (not found / error)
                                   [static default] → return fallback
```

---

## วิธีทดสอบ

### Test 1: TypeScript & Build
```bash
npx tsc --noEmit          # ต้อง pass ไม่มี error
npx next build            # ต้อง pass
```

### Test 2: Template Customization Flow
1. เปิด `/web/settings/line-message-templates`
2. เลือก template เช่น "ยืนยันการนัดหมาย" (visitor-booking-confirmed)
3. แก้ headerTitle, headerColor, เพิ่ม/ลบ rows
4. กด Save
5. ส่ง test message (ผ่าน test endpoint หรือ สร้าง appointment จริง)
6. **ตรวจสอบว่า Flex Message ที่ส่งไป LINE ใช้ template ที่แก้แล้ว**

### Test 3: Fallback Behavior
1. ลบ record `LineFlexTemplate` ของ state ใดสักตัวออกจาก DB
2. ส่ง message ที่ใช้ state นั้น
3. **ต้องยังส่งได้ปกติ** (ใช้ static default)

### Test 4: Cache Invalidation
1. แก้ template ในหน้า settings
2. ส่ง test message ทันที (ไม่ต้องรอ 60 วินาที)
3. **ต้องเห็น template ใหม่** (cache ถูก invalidate ตอน save)

### Test 5: Swagger / OpenAPI
1. เปิด `/swagger`
2. ตรวจสอบว่ามี tag `liff` พร้อม 3 endpoints
3. ตรวจสอบว่า flex-templates paths ถูกต้อง (`/api/settings/line-oa/flex-templates`)

### Test 6: LIFF Pages (ต้อง setup LINE ก่อน)
1. ตั้ง `NEXT_PUBLIC_LIFF_ID` ใน `.env`
2. เปิด LIFF URL ใน LINE App
3. ลงทะเบียน visitor → ต้องได้ Flex Message ที่อ่านจาก DB template

---

## งานที่เหลือ (ยังไม่ได้ทำ)

### ต้องทำก่อน deploy

| Task | Priority | Notes |
|------|----------|-------|
| ตั้ง `NEXT_PUBLIC_LIFF_ID` ใน `.env` | สูง | ได้จาก LINE Developers Console → LIFF app |
| สร้าง Rich Menu จริงใน LINE OA Manager | สูง | ตั้ง link ไปหน้า LIFF register/appointment |
| ตั้ง Webhook URL ที่ LINE Developers Console | สูง | `https://<domain>/api/line/webhook` |
| ตั้ง `LINE_CHANNEL_SECRET` + `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env` | สูง | หรือบันทึกผ่านหน้า settings LINE OA Config |

### ควรทำเพิ่ม

| Task | Priority | Notes |
|------|----------|-------|
| Implement cron: reminder (ก่อนนัด 24 ชม.) | กลาง | ใช้ `buildReminderMessage()` |
| Implement cron: auto-cancel (นัดหมดอายุ) | กลาง | ใช้ `buildAutoCancelledMessage()` |
| Implement cron: overstay check | กลาง | ใช้ `buildOfficerOverstayAlertMessage()` |
| Implement email sending ใน notification-service | กลาง | ตอนนี้ log เฉยๆ ยังไม่ส่งจริง |
| Wi-Fi credentials integration | ต่ำ | ใช้ `buildWifiCredentialsMessage()` |
| Visit slip QR code generation | ต่ำ | ใช้ `buildVisitSlipMessage()` |

---

## โครงสร้าง Flex Message Pipeline

```
lib/
├── line-flex-template-data.ts      ← Template config (static + DB loader)
├── flex/
│   ├── types.ts                    ← LINE Flex Message types
│   ├── builder.ts                  ← buildFlexMessage() — template → JSON
│   └── messages/
│       ├── welcome.ts              ← Plain text (ไม่ใช้ template)
│       ├── booking-confirmed.ts    ← async, DB-aware
│       ├── checkin.ts              ← async, DB-aware
│       ├── checkout.ts             ← async, DB-aware
│       ├── auto-cancelled.ts       ← async, DB-aware
│       ├── reminder.ts             ← async, DB-aware
│       ├── wifi-credentials.ts     ← async, DB-aware
│       ├── visit-slip.ts           ← async, DB-aware
│       ├── visitor-registered.ts   ← async, DB-aware
│       ├── officer-registered.ts   ← async, DB-aware
│       ├── officer-new-request.ts  ← async, DB-aware
│       ├── officer-checkin-alert.ts← async, DB-aware
│       ├── officer-overstay-alert.ts← async, DB-aware
│       └── approval-result.ts      ← async, DB-aware (+ rejection override)
├── notification-service.ts         ← Dispatch: type → factory → LINE push
```

---

## DB Schema (Prisma)

```prisma
model LineFlexTemplate {
  id              Int       @id @default(autoincrement())
  stateId         String    @unique    // e.g. "visitor-booking-confirmed"
  name            String               // ชื่อภาษาไทย
  nameEn          String               // English name
  type            String    @default("flex")
  isActive        Boolean   @default(true)
  headerTitle     String    @default("")
  headerSubtitle  String?
  headerColor     String    @default("primary")
  headerVariant   String    @default("standard")
  showStatusBadge Boolean   @default(false)
  statusBadgeText String?
  showQrCode      Boolean   @default(false)
  qrLabel         String?
  infoBoxText     String?
  infoBoxColor    String?
  infoBoxEnabled  Boolean   @default(false)
  updatedBy       Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  rows            LineFlexTemplateRow[]
  buttons         LineFlexTemplateButton[]
}
```

---

## คำถามที่อาจเจอ

**Q: ถ้า DB ล่ม จะยังส่ง LINE message ได้ไหม?**
A: ได้ — `getFlexTemplateFromDB()` จะ catch error แล้ว fallback ไป static defaults

**Q: Cache 60 วินาทีหมายความว่าแก้แล้วต้องรอ 1 นาทีหรือ?**
A: ไม่ — เมื่อ admin save ผ่าน API จะเรียก `invalidateTemplateCache()` ทันที cache จะถูกล้าง

**Q: `statusBadgeType` กับ `availableVariables` ไม่อยู่ใน DB?**
A: ใช่ — 2 fields นี้ดึงจาก static defaults เสมอ เพราะเป็น metadata ที่ frontend ใช้แสดง UI ไม่ใช่ค่าที่ admin ต้องแก้
