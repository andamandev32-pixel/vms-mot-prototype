import { PrismaClient } from '../lib/generated/prisma/index.js';
const p = new PrismaClient();

async function main() {
  // 1) Appointments by status
  const byStatus = await p.appointment.groupBy({ by: ['status'], _count: true, orderBy: { status: 'asc' } });
  console.log('=== Appointments by Status ===');
  byStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`));

  // 2) By createdBy
  const byCreated = await p.appointment.groupBy({ by: ['createdBy'], _count: true });
  console.log('\n=== By CreatedBy ===');
  byCreated.forEach(s => console.log(`  ${s.createdBy}: ${s._count}`));

  // 3) Test appointments (id >= 25)
  const testAppts = await p.appointment.findMany({
    where: { id: { gte: 25 } },
    include: {
      visitor: { select: { firstName: true, lastName: true, idNumber: true } },
      companions: true,
      statusLogs: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { id: 'asc' },
  });
  console.log('\n=== Test Appointments (id >= 25) ===');
  testAppts.forEach(a => {
    console.log(`  id=${a.id} code=${a.bookingCode} visitor=${a.visitor.firstName} ${a.visitor.lastName} status=${a.status} mode=${a.entryMode} purposeId=${a.visitPurposeId} deptId=${a.departmentId} comp=${a.companions.length} logs=${a.statusLogs.length} grp=${a.groupId || '-'}`);
  });

  // 4) Companions
  const comp = await p.appointmentCompanion.findMany({ where: { appointment: { id: { gte: 25 } } } });
  console.log('\n=== Companions for Test Appointments ===');
  comp.forEach(c => console.log(`  aptId=${c.appointmentId} ${c.firstName || '(anon)'} ${c.lastName || ''}`));

  // 5) Status logs
  const logs = await p.appointmentStatusLog.findMany({
    where: { appointment: { id: { gte: 25 } } },
    include: { appointment: { select: { bookingCode: true } } },
    orderBy: { createdAt: 'asc' },
  });
  console.log('\n=== Status Logs for Test Appointments ===');
  logs.forEach(l => console.log(`  ${l.appointment.bookingCode} ${l.fromStatus || 'null'} -> ${l.toStatus} by=${l.changedBy} reason=${l.reason || '-'}`));

  // 6) Groups
  const groups = await p.appointmentGroup.findMany({
    where: { id: { gte: 6 } },
    include: { _count: { select: { appointments: true } } },
  });
  console.log('\n=== Appointment Groups (id >= 6) ===');
  groups.forEach(g => console.log(`  id=${g.id} name=${g.name.substring(0, 40)} appts=${g._count.appointments} mode=${g.entryMode}`));

  // 7) New visitors from batch
  const visitors = await p.visitor.findMany({ where: { id: { gte: 9 } } });
  console.log('\n=== New Visitors (id >= 9) ===');
  visitors.forEach(v => console.log(`  id=${v.id} ${v.firstName} ${v.lastName} idNum=${v.idNumber} phone=${v.phone || '-'}`));

  // 8) Blocklist
  const bl = await p.blocklist.findMany();
  console.log('\n=== Blocklist ===');
  bl.forEach(b => console.log(`  id=${b.id} ${b.firstName || ''} ${b.lastName || ''} company=${b.company || '-'} type=${b.expiryDate ? 'temp' : 'perm'}`));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
