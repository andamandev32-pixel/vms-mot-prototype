import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const code = 'eVMS-APT-20260528-001';

const rows = await p.appointment.findMany({
  where: { bookingCode: { contains: code } },
  select: { id: true, bookingCode: true, status: true, dateStart: true },
});

if (rows.length === 0) {
  console.log(`❌ ไม่พบ booking_code ที่มี "${code}" ในฐานข้อมูล`);
} else {
  console.log(`✅ พบ ${rows.length} record:`);
  console.log(JSON.stringify(rows, null, 2));
}

await p.$disconnect();
