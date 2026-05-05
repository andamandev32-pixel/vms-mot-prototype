import { prisma } from "../lib/prisma";

const BASE = "http://localhost:3000";

async function callCounter(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/counter/walkin/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function callKiosk(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/kiosk/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function main() {
  const sp = await prisma.servicePoint.findFirst();
  const visitor = await prisma.visitor.findFirst({ where: { isBlocked: false } });
  const staff = await prisma.staff.findFirst();
  if (!sp || !visitor || !staff) {
    console.error("Missing seed data");
    process.exit(1);
  }
  const token = `kvms_prototype_${sp.id}_test`;

  // Find a (purpose, dept) where requirePersonName=TRUE and one where FALSE
  const ruleRequired = await prisma.visitPurposeDepartmentRule.findFirst({
    where: { requirePersonName: true, isActive: true },
  });
  const ruleOptional = await prisma.visitPurposeDepartmentRule.findFirst({
    where: { requirePersonName: false, isActive: true },
  });
  if (!ruleRequired || !ruleOptional) {
    console.error("Need at least one rule with requirePersonName=true and one with =false");
    process.exit(1);
  }

  console.log("Rule REQUIRED   :", `purpose=${ruleRequired.visitPurposeId} dept=${ruleRequired.departmentId}`);
  console.log("Rule OPTIONAL   :", `purpose=${ruleOptional.visitPurposeId} dept=${ruleOptional.departmentId}`);

  // cleanup before
  await prisma.visitEntry.deleteMany({ where: { visitorId: visitor.id, status: "checked-in" } });

  const created: number[] = [];
  let pass = 0, fail = 0;
  const expect = (label: string, cond: boolean) => {
    if (cond) { pass++; console.log(`  PASS: ${label}`); }
    else { fail++; console.log(`  FAIL: ${label}`); }
  };

  // ===== Counter API =====
  console.log("\n=== Counter /api/counter/walkin/checkin ===");

  // C1: required rule + missing hostStaffId → 400
  console.log("\n-- C1: required rule, no hostStaffId → expect 400 --");
  const c1 = await callCounter(token, {
    visitorId: visitor.id, servicePointId: sp.id,
    visitPurposeId: ruleRequired.visitPurposeId, departmentId: ruleRequired.departmentId,
  });
  console.log(`  status=${c1.status} error=${c1.body.error}`);
  expect("rejected with 400 + requirePersonName message", c1.status === 400 && /requirePersonName|hostStaffId/i.test(c1.body.error || ""));

  // C2: required rule + hostStaffId provided → 200
  console.log("\n-- C2: required rule + hostStaffId → expect 200 --");
  const c2 = await callCounter(token, {
    visitorId: visitor.id, servicePointId: sp.id,
    visitPurposeId: ruleRequired.visitPurposeId, departmentId: ruleRequired.departmentId,
    hostStaffId: staff.id,
  });
  console.log(`  status=${c2.status} hostStaffId=${c2.body.entry?.hostStaffId}`);
  expect("created with hostStaffId saved", c2.status === 200 && c2.body.entry?.hostStaffId === staff.id);
  if (c2.body.entry?.id) created.push(c2.body.entry.id);

  // C3: optional rule + no hostStaffId → 200, host=null
  console.log("\n-- C3: optional rule, no hostStaffId → expect 200, null --");
  const c3 = await callCounter(token, {
    visitorId: visitor.id, servicePointId: sp.id,
    visitPurposeId: ruleOptional.visitPurposeId, departmentId: ruleOptional.departmentId,
  });
  console.log(`  status=${c3.status} hostStaffId=${c3.body.entry?.hostStaffId}`);
  expect("created with hostStaffId=null", c3.status === 200 && c3.body.entry?.hostStaffId === null);
  if (c3.body.entry?.id) created.push(c3.body.entry.id);

  // ===== Kiosk API =====
  console.log("\n=== Kiosk /api/kiosk/checkin ===");

  // K1: required rule + missing hostStaffId → 400
  console.log("\n-- K1: required rule, no hostStaffId → expect 400 --");
  const k1 = await callKiosk(token, {
    type: "walkin", visitorId: visitor.id, servicePointId: sp.id,
    visitPurposeId: ruleRequired.visitPurposeId, departmentId: ruleRequired.departmentId,
    idMethod: "thai-id-card",
  });
  console.log(`  status=${k1.status} error=${k1.body.error?.message || k1.body.error}`);
  expect("rejected with 400", k1.status === 400);

  // K2: optional rule, no hostStaffId → 200
  console.log("\n-- K2: optional rule, no hostStaffId → expect 200, null --");
  const k2 = await callKiosk(token, {
    type: "walkin", visitorId: visitor.id, servicePointId: sp.id,
    visitPurposeId: ruleOptional.visitPurposeId, departmentId: ruleOptional.departmentId,
    idMethod: "thai-id-card",
  });
  console.log(`  status=${k2.status}`);
  if (k2.status === 200 && k2.body.success) {
    const id = k2.body.data?.entry?.entryId;
    if (id) {
      created.push(id);
      const dbEntry = await prisma.visitEntry.findUnique({ where: { id } });
      console.log(`  DB hostStaffId=${dbEntry?.hostStaffId}`);
      expect("kiosk created with null host", dbEntry?.hostStaffId === null);
    }
  } else {
    expect("kiosk created", false);
  }

  // cleanup
  if (created.length > 0) {
    await prisma.visitEntry.deleteMany({ where: { id: { in: created } } });
    console.log(`\nCleanup: removed ${created.length} test entries`);
  }

  console.log(`\n=== Result: ${pass} pass, ${fail} fail ===`);
  await prisma.$disconnect();
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
