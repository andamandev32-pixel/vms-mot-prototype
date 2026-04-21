# Dev Handoff: LIFF Setup & Deployment

> **Date:** 21 เมษายน 2569
> **Status:** โค้ด LIFF พร้อมใช้งาน (production-ready) — รอตั้งค่า LIFF ID และสร้าง LIFF app ใน LINE Developers Console
> **Scope:** เอกสารนี้สำหรับ dev ที่จะ deploy LIFF ให้ใช้งานจริงบน `https://vms-mot-prototype.vercel.app`

---

## สรุปสถานะปัจจุบัน

ตรวจสอบเมื่อ 2026-04-21 พบว่า:

- ✅ **โค้ด LIFF เสร็จสมบูรณ์** (SDK, Provider, Pages, Backend APIs, DB schema)
- ❌ **ยังไม่มี `NEXT_PUBLIC_LIFF_ID`** ใน `.env` / `.env.example` / Vercel env vars
- ❌ **ยังไม่ได้สร้าง LIFF app** ใน LINE Developers Console
- ❌ **ยังไม่ได้ผูก Rich Menu กับ LIFF URL**

**ผลกระทบ:** ถ้าเปิด `/liff/register` ตอนนี้จะเจอ error `"LIFF ID ไม่ได้ตั้งค่า (NEXT_PUBLIC_LIFF_ID)"` — ดู `lib/liff/provider.tsx:71`

---

## แยกให้ชัด: `/line-oa` vs `/liff/*`

| URL | ชนิด | ใช้ LIFF SDK? | เป้าหมาย |
|---|---|---|---|
| `/line-oa` | Demo / Simulator | ❌ | นำเสนอให้ผู้บริหาร/ลูกค้าดู flow ทั้ง 18 states โดยไม่ต้องมี LINE |
| `/liff/register` | **LIFF App จริง** | ✅ | เปิดจาก Rich Menu ใน LINE เพื่อลงทะเบียน visitor/officer |
| `/liff/booking` | **LIFF App จริง** | ✅ | จองนัดหมาย |
| `/liff/approve` | **LIFF App จริง** | ✅ | officer อนุมัติคำขอ |

**สำคัญ:** ห้ามสับสนระหว่าง 2 หน้านี้ — หน้า `/line-oa` เป็นแค่ preview, ไม่ใช่ LIFF entry point

---

## สิ่งที่ต้องทำ (Checklist)

### 1. สร้าง LINE Login Channel + LIFF Apps

ที่ [LINE Developers Console](https://developers.line.biz/console/):

1. เลือก / สร้าง **Provider** (เช่น "VMS MOT")
2. สร้าง **Messaging API Channel** (ถ้ายังไม่มี) — เก็บ:
   - `Channel ID`
   - `Channel Secret`
   - `Channel Access Token` (long-lived)
3. สร้าง **LINE Login Channel** ในชุด provider เดียวกัน (LIFF ต้องใช้ Login Channel ไม่ใช่ Messaging)
4. ในแท็บ **LIFF** ของ Login Channel → Add LIFF app 3 ตัว:

   | LIFF App | Endpoint URL | Size | Scope |
   |---|---|---|---|
   | Register | `https://vms-mot-prototype.vercel.app/liff/register` | Tall | `profile`, `openid` |
   | Booking | `https://vms-mot-prototype.vercel.app/liff/booking` | Full | `profile`, `openid` |
   | Approve | `https://vms-mot-prototype.vercel.app/liff/approve` | Full | `profile`, `openid` |

5. เก็บ `LIFF ID` ของแต่ละอัน (format: `1234567890-abcdefgh`)

> **หมายเหตุ:** ปัจจุบันโค้ดใช้ LIFF ID ตัวเดียวสำหรับทุก page (`NEXT_PUBLIC_LIFF_ID`) ถ้าต้องการแยก LIFF ID ตาม page ต้อง refactor `app/liff/layout.tsx` ให้ส่ง `liffId` prop ไป `<LiffProvider>` ตาม route — ดูหัวข้อ "Future: Multi-LIFF-ID" ท้ายเอกสาร

### 2. ตั้งค่า Environment Variables

#### 2.1 อัปเดต `.env.example`

เพิ่มบรรทัดท้ายไฟล์ [`.env.example`](../.env.example):

```bash
# ===== LINE LIFF =====
# LIFF ID จาก LINE Developers Console (Login Channel → LIFF tab)
# Format: 1234567890-abcdefgh
NEXT_PUBLIC_LIFF_ID=""
```

#### 2.2 ตั้งค่าใน Vercel

Vercel Dashboard → Project `vms-mot-prototype` → Settings → Environment Variables:

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_LIFF_ID` | `<LIFF ID ของหน้า register>` | Production, Preview, Development |

> `NEXT_PUBLIC_*` ต้องตั้งก่อน build — หลังเพิ่มแล้วต้อง **Redeploy**

#### 2.3 ตั้งค่าใน local `.env` (สำหรับ dev)

```bash
NEXT_PUBLIC_LIFF_ID="1234567890-abcdefgh"
```

### 3. ตั้งค่า LINE OA Config ใน DB

เข้าหน้า admin `/web/settings/line-oa` (หรือ call API `PUT /api/settings/line-oa`) เพื่อบันทึก:

- `channelId`
- `channelSecret`
- `channelAccessToken`
- `liffAppId` — ใส่ LIFF ID (ใช้ร่วมกับ env หรือ override เฉพาะ runtime)
- `liffEndpointUrl` — `https://vms-mot-prototype.vercel.app/liff/register`
- `webhookUrl` — `https://vms-mot-prototype.vercel.app/api/line/webhook`

Schema: `prisma/schema.prisma` → model `LineOaConfig`

### 4. ตั้ง Webhook URL ใน LINE Console

Messaging API Channel → Webhook settings:
- **Webhook URL:** `https://vms-mot-prototype.vercel.app/api/line/webhook`
- **Use webhook:** Enabled
- กด **Verify** → ต้องได้ 200 OK
- เปิด **Auto-reply messages:** Disabled (ให้ webhook จัดการเอง)

### 5. สร้างและผูก Rich Menu

1. สร้าง Rich Menu ผ่าน LINE Official Account Manager หรือ Messaging API
2. ปุ่มในเมนูให้ใช้ action type `uri` ชี้ไปที่:
   - ลงทะเบียน → `https://liff.line.me/<LIFF_ID_REGISTER>`
   - จองนัด → `https://liff.line.me/<LIFF_ID_BOOKING>`
   - อนุมัติ → `https://liff.line.me/<LIFF_ID_APPROVE>`
3. ผูก Rich Menu กับผู้ใช้ผ่าน `POST /api/line/richmenu/assign`

---

## โครงสร้างโค้ด LIFF (Reference)

### Frontend

| File | หน้าที่ |
|---|---|
| `app/liff/layout.tsx` | Layout ห่อ `<LiffProvider>` — ทุก page ภายใต้ `/liff/*` ได้ context อัตโนมัติ |
| `app/liff/register/page.tsx` | หน้าลงทะเบียน visitor + officer (พร้อม pre-fill จาก LINE profile) |
| `app/liff/booking/page.tsx` | หน้าจองนัด |
| `app/liff/approve/page.tsx` | หน้าอนุมัติคำขอสำหรับ officer |
| `lib/liff/provider.tsx` | React Context ห่อ `liff.init`, `liff.login`, `liff.getProfile`, `liff.getAccessToken` |
| `lib/liff/use-liff.ts` | `useLiff()` hook |

**LIFF lifecycle** (ดู `lib/liff/provider.tsx`):
1. `liff.init({ liffId })` → ถ้า fail แสดง error
2. `liff.isInClient()` → detect ว่าเปิดใน LINE หรือ browser
3. ถ้ายังไม่ login + อยู่ใน LINE → `liff.login()` (auto)
4. ถ้ายังไม่ login + อยู่นอก LINE → ให้ page จัดการ (แสดงปุ่ม "Login with LINE")
5. หลัง login → ดึง `accessToken` + `profile`

### Backend

| Endpoint | หน้าที่ |
|---|---|
| `POST /api/liff/auth` | รับ `accessToken` → verify กับ LINE API → สร้าง session cookie |
| `POST /api/liff/register` | ลงทะเบียน visitor + ผูก `lineUserId` กับ user account |
| `POST /api/liff/register-officer` | ค้นหา staff record + ผูก LINE |
| `POST /api/line/webhook` | รับ event จาก LINE (verify HMAC-SHA256 signature) |
| `POST /api/line/push-message` | ส่ง push message ไปยัง userId |
| `POST /api/line/richmenu/assign` | ผูก Rich Menu กับ user |
| `GET/PUT /api/settings/line-oa` | อ่าน/แก้ `LineOaConfig` ใน DB |

---

## Verification Steps

หลังตั้งค่าเสร็จ ทดสอบตามลำดับ:

### ขั้นที่ 1: ทดสอบ local บน browser (ยังไม่ได้เปิดจาก LINE)

```bash
npm run dev
# เปิด http://localhost:3000/liff/register
```

**สิ่งที่ควรเห็น:**
- ถ้ายังไม่ตั้ง `NEXT_PUBLIC_LIFF_ID` → error `"LIFF ID ไม่ได้ตั้งค่า"` ✅ (แปลว่า guard ทำงาน)
- ถ้าตั้ง LIFF ID แล้ว → หน้าโหลด, แสดงปุ่ม `"Login with LINE"` (เพราะอยู่นอก LINE)

### ขั้นที่ 2: ทดสอบ LIFF URL บน mobile

เปิดมือถือ → scan QR / tap LIFF URL `https://liff.line.me/<LIFF_ID>`:
- ควร redirect เข้า LINE app
- Auto-login สำเร็จ
- เห็น `displayName` ในหน้าเลือกประเภท (visitor/officer)
- submit form → ได้ 200 จาก `/api/liff/register` → แสดง success → ปิดหน้าต่างอัตโนมัติ

### ขั้นที่ 3: ทดสอบ webhook

ใน LINE Console → Messaging Channel → Webhook → กด **Verify**
- ต้องได้ 200 OK
- Log ฝั่ง server ต้องเห็น event

ส่งข้อความ "myid" ไปหา OA → ควรได้ reply เป็น `lineUserId`

### ขั้นที่ 4: ทดสอบ Rich Menu

1. ผูก Rich Menu กับ user test
2. กดปุ่มในเมนู → LIFF เปิดใน LINE → flow ทำงานครบ

---

## Troubleshooting

| อาการ | สาเหตุน่าสงสัย | แก้ |
|---|---|---|
| `"LIFF ID ไม่ได้ตั้งค่า"` | `NEXT_PUBLIC_LIFF_ID` ไม่ถูก bundle | ตั้งใน Vercel แล้ว **Redeploy** (ไม่ใช่แค่ restart) |
| LIFF init error `400` | LIFF app endpoint URL ไม่ตรงกับ URL ที่เปิดจริง | แก้ endpoint URL ใน LINE Console ให้ตรงกับ domain ปัจจุบัน |
| `getProfile()` คืน error | ยังไม่ approve scope `profile` | เพิ่ม scope ใน Login Channel |
| Webhook `401` / Verify fail | `Channel Secret` ใน DB ไม่ตรงกับ Console | อัปเดตผ่าน `/api/settings/line-oa` |
| เปิดบน browser แล้ว auto-login ไม่ทำงาน | Design — auto-login ทำงานเฉพาะ `liff.isInClient()` เท่านั้น | ให้ user กดปุ่ม "Login with LINE" ใน browser |

---

## Future: Multi-LIFF-ID (optional refactor)

ตอนนี้ทุก `/liff/*` page ใช้ `NEXT_PUBLIC_LIFF_ID` ตัวเดียว ถ้าต้องการแยก LIFF ID ตาม page (เช่น register/booking/approve ต่างกัน) ทำได้โดย:

1. เพิ่ม env vars:
   ```bash
   NEXT_PUBLIC_LIFF_ID_REGISTER=...
   NEXT_PUBLIC_LIFF_ID_BOOKING=...
   NEXT_PUBLIC_LIFF_ID_APPROVE=...
   ```
2. ย้าย `<LiffProvider>` จาก `app/liff/layout.tsx` ไปไว้ใน layout ย่อยของแต่ละ route (`app/liff/register/layout.tsx` ฯลฯ) แล้วส่ง `liffId` prop ตามนั้น
3. `LiffProvider` รองรับ `liffId` prop อยู่แล้ว (ดู `lib/liff/provider.tsx:56`)

**ข้อดี:** ถ้า LIFF app ไหนมีปัญหาจะไม่กระทบอันอื่น + กำหนด scope/size ต่างกันได้
**ข้อเสีย:** ต้องดูแล 3 LIFF app + 3 env vars

แนะนำ: เริ่มด้วย LIFF ID เดียวก่อน (config ปัจจุบัน) — refactor ทีหลังถ้าจำเป็น

---

## เอกสารที่เกี่ยวข้อง

- `docs/line-oa-api-spec.md` — API spec ครบ 18 flow states
- `docs/test-cases/line-oa-flow.md` — test scenarios
- `docs/channel-integration-spec.md` — LINE channel config
- `docs/notification-system-spec.md` — push message / flex templates
