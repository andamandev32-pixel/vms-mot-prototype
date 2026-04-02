# eVMS Test Cases — ชุดทดสอบระบบจัดการผู้มาติดต่อ

> เอกสารนี้รวบรวม Test Case ทั้งหมดสำหรับทดสอบ module ต่างๆ ของระบบ eVMS
> แบ่งตาม module + use case เพื่อทดสอบการทำงานตามที่ออกแบบไว้

## สารบัญ Test Modules

| # | Module | File | จำนวน Cases | สถานะ |
|---|--------|------|------------|-------|
| 1 | การสร้างนัดหมาย | [appointment-creation.md](appointment-creation.md) | 10 | 📝 |
| 2 | Auto-Approve | [auto-approve.md](auto-approve.md) | 8 | 📝 |
| 3 | Period Mode | [period-mode.md](period-mode.md) | 10 | 📝 |
| 4 | Batch/Group | [batch-group.md](batch-group.md) | 8 | 📝 |
| 5 | Notification | [notification.md](notification.md) | 10 | 📝 |
| 6 | Kiosk Check-in | [kiosk-checkin.md](kiosk-checkin.md) | 12 | 📝 |
| 7 | Counter Check-in | [counter-checkin.md](counter-checkin.md) | 10 | 📝 |
| 8 | LINE OA Flow | [line-oa-flow.md](line-oa-flow.md) | 10 | 📝 |
| 9 | Arrival Dashboard | [arrival-dashboard.md](arrival-dashboard.md) | 8 | 📝 |
| 10 | Overstay & Auto-Expire | [overstay-expire.md](overstay-expire.md) | 8 | 📝 |

## สัญลักษณ์สถานะ

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| 📝 | ร่างแล้ว รอ review |
| ✅ | ผ่านการ review แล้ว |
| 🔄 | อยู่ระหว่างแก้ไข |
| ❌ | พบปัญหา ต้องแก้ไข |

## วิธีใช้งาน

1. เลือก module ที่ต้องการทดสอบจากตารางด้านบน
2. เปิดไฟล์ test case ที่เกี่ยวข้อง
3. ดำเนินการตาม Steps ในแต่ละ test case
4. ตรวจสอบผลลัพธ์ตาม Expected Result
5. บันทึกผลการทดสอบ และอัปเดตสถานะในตารางนี้
