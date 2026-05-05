import { prisma } from "../lib/prisma";

const BASE = "http://localhost:3000";

async function call(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/kiosk/checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

async function main() {
  const sp = await prisma.servicePoint.findFirst();
  const visitor = await prisma.visitor.findFirst({ where: { isBlocked: false } });
  const purposes = await prisma.visitPurpose.findMany({ take: 2 });
  const departments = await prisma.department.findMany({ take: 2 });
  const staff = await prisma.staff.findFirst();

  if (!sp || !visitor || purposes.length < 2 || departments.length < 2 || !staff) {
    console.error("Missing seed data");
    process.exit(1);
  }

  const token = `kvms_prototype_${sp.id}_test`;

  console.log("Kiosk Test data:");
  console.log("  hostStaffId =", staff.id, `(${staff.name})`);

  const created: number[] = [];

  // Test K1: kiosk checkin with hostStaffId
  console.log("\n--- Test K1: kiosk checkin with hostStaffId ---");
  const r1 = await call(token, {
    type: "walkin",
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[0].id,
    departmentId: departments[0].id,
    hostStaffId: staff.id,
    idMethod: "thai-id-card",
  });
  console.log("status:", r1.status);
  if (r1.status === 200 && r1.body.success) {
    const entryId = r1.body.data?.entry?.entryId;
    console.log("entryCode:", r1.body.data?.entry?.entryCode);
    if (entryId) {
      created.push(entryId);
      const dbEntry = await prisma.visitEntry.findUnique({ where: { id: entryId } });
      console.log("DB hostStaffId:", dbEntry?.hostStaffId);
      if (dbEntry?.hostStaffId === staff.id) {
        console.log("PASS: kiosk endpoint saved hostStaffId");
      } else {
        console.log(`FAIL: expected ${staff.id}, got ${dbEntry?.hostStaffId}`);
      }
    }
  } else {
    console.log("FAIL:", r1.body);
  }

  // Test K2: kiosk checkin without hostStaffId
  console.log("\n--- Test K2: kiosk checkin without hostStaffId → expect null ---");
  const r2 = await call(token, {
    type: "walkin",
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[1].id,
    departmentId: departments[1].id,
    idMethod: "thai-id-card",
  });
  console.log("status:", r2.status);
  if (r2.status === 200 && r2.body.success) {
    const entryId = r2.body.data?.entry?.entryId;
    if (entryId) {
      created.push(entryId);
      const dbEntry = await prisma.visitEntry.findUnique({ where: { id: entryId } });
      console.log("DB hostStaffId:", dbEntry?.hostStaffId);
      if (dbEntry?.hostStaffId === null) {
        console.log("PASS: kiosk endpoint defaults hostStaffId to null");
      } else {
        console.log(`FAIL: expected null, got ${dbEntry?.hostStaffId}`);
      }
    }
  } else {
    console.log("FAIL:", r2.body);
  }

  // Test K3: invalid hostStaffId → 404
  console.log("\n--- Test K3: kiosk checkin with invalid hostStaffId → expect 404 ---");
  const r3 = await call(token, {
    type: "walkin",
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[0].id,
    departmentId: departments[1].id,
    hostStaffId: 999999,
    idMethod: "thai-id-card",
  });
  console.log("status:", r3.status);
  console.log("error :", r3.body.error?.message || r3.body.error);
  if (r3.status === 404) {
    console.log("PASS: invalid hostStaffId rejected");
  } else {
    console.log("FAIL: should have been 404");
    if (r3.body.data?.entry?.entryId) created.push(r3.body.data.entry.entryId);
  }

  // cleanup
  if (created.length > 0) {
    await prisma.visitEntry.deleteMany({ where: { id: { in: created } } });
    console.log(`\nCleanup: removed ${created.length} test entries`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
