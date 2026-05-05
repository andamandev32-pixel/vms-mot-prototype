import { prisma } from "../lib/prisma";

const BASE = "http://localhost:3000";

async function call(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/counter/walkin/checkin`, {
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
  // 1) หา test data
  const sp = await prisma.servicePoint.findFirst();
  const visitor = await prisma.visitor.findFirst({ where: { isBlocked: false } });
  const purposes = await prisma.visitPurpose.findMany({ take: 2 });
  const departments = await prisma.department.findMany({ take: 2 });
  const staff = await prisma.staff.findFirst();

  if (!sp || !visitor || purposes.length < 2 || departments.length < 2 || !staff) {
    console.error("Missing seed data:", {
      sp: !!sp,
      visitor: !!visitor,
      purposes: purposes.length,
      departments: departments.length,
      staff: !!staff,
    });
    process.exit(1);
  }

  console.log("Test data:");
  console.log("  servicePointId =", sp.id);
  console.log("  visitorId      =", visitor.id, `(${visitor.name})`);
  console.log("  purpose A      =", purposes[0].id, `(${purposes[0].name})`);
  console.log("  purpose B      =", purposes[1].id, `(${purposes[1].name})`);
  console.log("  dept A         =", departments[0].id, `(${departments[0].name})`);
  console.log("  dept B         =", departments[1].id, `(${departments[1].name})`);
  console.log("  hostStaffId    =", staff.id, `(${staff.name})`);

  const token = `kvms_prototype_${sp.id}_test`;

  // 2) cleanup: ลบ active entries ของ visitor นี้ทั้งหมด (test isolation)
  const cleaned = await prisma.visitEntry.deleteMany({
    where: { visitorId: visitor.id, status: "checked-in" },
  });
  console.log(`\nCleanup: removed ${cleaned.count} stale active entries\n`);

  const created: number[] = [];

  // ===== Test 1: checkin ครั้งแรก purposeA + deptA + hostStaffId =====
  console.log("--- Test 1: first checkin (purposeA + deptA, with hostStaffId) ---");
  const r1 = await call(token, {
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[0].id,
    departmentId: departments[0].id,
    hostStaffId: staff.id,
  });
  console.log("status:", r1.status);
  if (r1.status === 200) {
    console.log("entryCode    :", r1.body.entry?.entryCode);
    console.log("hostStaffId  :", r1.body.entry?.hostStaffId);
    created.push(r1.body.entry.id);
    if (r1.body.entry?.hostStaffId === staff.id) {
      console.log("PASS: hostStaffId saved correctly");
    } else {
      console.log(`FAIL: expected hostStaffId=${staff.id}, got ${r1.body.entry?.hostStaffId}`);
    }
  } else {
    console.log("FAIL:", r1.body);
  }

  // ===== Test 2: same dept, different purpose → should SUCCEED (new behavior) =====
  console.log("\n--- Test 2: same dept, different purpose (purposeB + deptA) ---");
  const r2 = await call(token, {
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[1].id,
    departmentId: departments[0].id,
    hostStaffId: staff.id,
  });
  console.log("status:", r2.status);
  if (r2.status === 200) {
    created.push(r2.body.entry.id);
    console.log("PASS: created when purpose differs (was previously blocked)");
  } else {
    console.log("FAIL: should have allowed →", r2.body);
  }

  // ===== Test 3: same purpose, different dept → should SUCCEED =====
  console.log("\n--- Test 3: same purpose, different dept (purposeA + deptB) ---");
  const r3 = await call(token, {
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[0].id,
    departmentId: departments[1].id,
    hostStaffId: staff.id,
  });
  console.log("status:", r3.status);
  if (r3.status === 200) {
    created.push(r3.body.entry.id);
    console.log("PASS: created when department differs");
  } else {
    console.log("FAIL: should have allowed →", r3.body);
  }

  // ===== Test 4: same purpose + same dept → should FAIL (guard still works) =====
  console.log("\n--- Test 4: duplicate (purposeA + deptA) → expect block ---");
  const r4 = await call(token, {
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[0].id,
    departmentId: departments[0].id,
    hostStaffId: staff.id,
  });
  console.log("status:", r4.status);
  console.log("error :", r4.body.error);
  if (r4.status === 400 && /active entry/i.test(r4.body.error || "")) {
    console.log("PASS: duplicate guard still blocks same purpose+dept");
  } else {
    console.log("FAIL: should have been blocked");
  }

  // ===== Test 5: checkin โดยไม่ส่ง hostStaffId → expect null =====
  console.log("\n--- Test 5: checkin without hostStaffId (purposeB + deptB) ---");
  const r5 = await call(token, {
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[1].id,
    departmentId: departments[1].id,
  });
  console.log("status:", r5.status);
  if (r5.status === 200) {
    console.log("hostStaffId  :", r5.body.entry?.hostStaffId);
    created.push(r5.body.entry.id);
    if (r5.body.entry?.hostStaffId === null) {
      console.log("PASS: hostStaffId defaults to null when not provided");
    } else {
      console.log(`FAIL: expected null, got ${r5.body.entry?.hostStaffId}`);
    }
  } else {
    console.log("FAIL:", r5.body);
  }

  // ===== Test 6: checkin with invalid hostStaffId → expect 404 =====
  console.log("\n--- Test 6: checkin with invalid hostStaffId → expect 404 ---");
  const r6 = await call(token, {
    visitorId: visitor.id,
    servicePointId: sp.id,
    visitPurposeId: purposes[0].id,
    departmentId: departments[1].id,
    hostStaffId: 999999,
  });
  console.log("status:", r6.status);
  console.log("error :", r6.body.error);
  if (r6.status === 404 && /host staff/i.test(r6.body.error || "")) {
    console.log("PASS: invalid hostStaffId rejected with 404");
  } else {
    console.log("FAIL: should have been rejected with 404");
    if (r6.status === 200 && r6.body.entry?.id) created.push(r6.body.entry.id);
  }

  // ===== cleanup =====
  if (created.length > 0) {
    await prisma.visitEntry.deleteMany({ where: { id: { in: created } } });
    console.log(`\nCleanup: removed ${created.length} test entries`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
