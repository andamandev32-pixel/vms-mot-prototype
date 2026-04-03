/**
 * Appointment Workflow E2E Test Script (v2 — fixed)
 * Tests: creation (single/batch), approval, rejection
 * Verifies: /web/appointments, /web/search, /web/blocklist data
 * Run: node scripts/test-appointments.mjs
 */

const BASE = "http://localhost:3000";
let COOKIE = "";

// ─── Helpers ───────────────────────────────────────────────
async function login() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrEmail: "admin", password: "admin1234" }),
  });
  const cookies = r.headers.getSetCookie();
  COOKIE = cookies[0]?.split(";")[0] || "";
  const d = await r.json();
  if (!d.success) throw new Error("Login failed: " + JSON.stringify(d));
  console.log(`✅ Logged in as ${d.data.user.name} (${d.data.user.role})`);
}

async function api(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Cookie: COOKIE,
      ...(opts.headers || {}),
    },
  });
  const d = await r.json();
  return { status: r.status, ...d };
}

async function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}

function today() {
  return new Date().toISOString().split("T")[0];
}
function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

let results = [];
function log(testId, pass, msg) {
  const icon = pass ? "✅" : "❌";
  console.log(`  ${icon} ${testId}: ${msg}`);
  results.push({ testId, pass, msg });
}

/*
 * PURPOSE + DEPARTMENT combos that accept web channel:
 *
 * NO APPROVAL, accepts web:
 *   P1+D5 (Official+Tourism Dept)  reqPerson:true  modes:single,period
 *   P1+D8 (Official+Policy)        reqPerson:false modes:single,period
 *   P2+D4 (Meeting+Tourism)        reqPerson:true  modes:single,period
 *   P3+D1 (Document+Permanent Sec) reqPerson:false modes:single
 *   P3+D2 (Document+General Admin) reqPerson:false modes:single
 *   P5+D2 (Job App+General Admin)  reqPerson:true  modes:single
 *
 * REQUIRES APPROVAL, accepts web:
 *   P1+D1 (Official+Permanent Sec) reqPerson:true  modes:single,period
 *   P1+D2 (Official+General Admin) reqPerson:true  modes:single,period
 *   P2+D1 (Meeting+Permanent Sec)  reqPerson:true  modes:single,period
 *   P6+D7 (Tour+Sports Authority)  reqPerson:false modes:single,period
 *   P8+D1 (Other+Permanent Sec)    reqPerson:false modes:single
 */

// ─── Phase 1: Single Appointments (Staff-created) ─────────
async function testSingleAppointments() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 1: Single Appointments (Staff-Created)");
  console.log("══════════════════════════════════════════");

  // T1: Single-day, no approval — P1+D8 (no personnel req)
  {
    const res = await post("/api/appointments", {
      visitorId: 1,
      visitPurposeId: 1,
      departmentId: 8,
      type: "official",
      date: today(),
      timeStart: "09:00",
      timeEnd: "11:00",
      purpose: "T1: Staff สร้าง 1 คน 1 วัน ไม่ต้องอนุมัติ (Official+PolicyDept8)",
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "approved";
    log("T1", pass, `Single-day, no approval → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}, code=${res.data?.appointment?.bookingCode || "N/A"}`);
    if (res.data?.appointment) globalThis.T1 = res.data.appointment;
  }

  // T2: Single-day, requires approval — P1+D1 (requires person)
  {
    const res = await post("/api/appointments", {
      visitorId: 2,
      visitPurposeId: 1,
      departmentId: 1,
      type: "official",
      date: today(),
      timeStart: "10:00",
      timeEnd: "12:00",
      purpose: "T2: Staff สร้าง 1 คน 1 วัน ต้องรออนุมัติ (Official+Dept1)",
      hostStaffId: 1,
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "pending";
    log("T2", pass, `Single-day, requires approval → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}, code=${res.data?.appointment?.bookingCode || "N/A"}`);
    if (res.data?.appointment) globalThis.T2 = res.data.appointment;
  }

  // T3: Multi-day (period), no approval — P1+D5 (reqPerson, supports period)
  {
    const res = await post("/api/appointments", {
      visitorId: 3,
      visitPurposeId: 1,
      departmentId: 5,
      type: "official",
      entryMode: "period",
      date: today(),
      dateEnd: futureDate(3),
      timeStart: "08:30",
      timeEnd: "16:30",
      purpose: "T3: Staff สร้าง 1 คน หลายวัน ไม่ต้องอนุมัติ (Official+Dept5 period)",
      hostStaffId: 1,
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "approved" && res.data?.appointment?.entryMode === "period";
    log("T3", pass, `Period, no approval → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}, mode=${res.data?.appointment?.entryMode || "N/A"}, dateEnd=${res.data?.appointment?.dateEnd || "N/A"}`);
    if (res.data?.appointment) globalThis.T3 = res.data.appointment;
  }

  // T4: Multi-day (period), requires approval — P1+D2 (reqPerson, supports period)
  {
    const res = await post("/api/appointments", {
      visitorId: 4,
      visitPurposeId: 1,
      departmentId: 2,
      type: "official",
      entryMode: "period",
      date: today(),
      dateEnd: futureDate(5),
      timeStart: "08:00",
      timeEnd: "17:00",
      purpose: "T4: Staff สร้าง 1 คน หลายวัน ต้องรออนุมัติ (Official+Dept2 period)",
      hostStaffId: 2,
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "pending" && res.data?.appointment?.entryMode === "period";
    log("T4", pass, `Period, requires approval → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}, mode=${res.data?.appointment?.entryMode || "N/A"}`);
    if (res.data?.appointment) globalThis.T4 = res.data.appointment;
  }

  // T5: With companions (count only) — P2+D1 (requires approval & person)
  {
    const res = await post("/api/appointments", {
      visitorId: 5,
      visitPurposeId: 2,
      departmentId: 1,
      type: "meeting",
      date: futureDate(1),
      timeStart: "13:00",
      timeEnd: "15:00",
      purpose: "T5: Staff สร้าง + ผู้ติดตาม 3 คน (count only) (Meeting+Dept1)",
      hostStaffId: 2,
      companions: 3,
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.companionsCount >= 3;
    log("T5", pass, `Companions count-only → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}, companionsCount=${res.data?.appointment?.companionsCount || 0}`);
    if (res.data?.appointment) globalThis.T5 = res.data.appointment;
  }

  // T6: With companions (by names) — P3+D1 (no approval, no person)
  {
    const res = await post("/api/appointments", {
      visitorId: 7,
      visitPurposeId: 3,
      departmentId: 1,
      type: "delivery",
      date: futureDate(1),
      timeStart: "10:00",
      timeEnd: "11:30",
      purpose: "T6: Staff สร้าง + ผู้ติดตาม 2 คน (ระบุชื่อ) (Document+Dept1)",
      companions: 2,
      companionNames: [
        { firstName: "ผู้ติดตาม1", lastName: "ทดสอบ", company: "บริษัท ก", phone: "0811111111" },
        { firstName: "ผู้ติดตาม2", lastName: "ทดสอบ", company: "บริษัท ข", phone: "0822222222" },
      ],
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "approved";
    log("T6", pass, `Companions by-name → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}, companionsCount=${res.data?.appointment?.companionsCount || 0}`);
    if (res.data?.appointment) globalThis.T6 = res.data.appointment;
  }
}

// ─── Phase 2: Visitor-Created Appointments via API ─────────
async function testVisitorAppointments() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 2: Visitor-Created Appointments (API)");
  console.log("══════════════════════════════════════════");

  // T7: No approval — P1+D8
  {
    const res = await post("/api/appointments", {
      visitorId: 8,
      visitPurposeId: 1,
      departmentId: 8,
      type: "official",
      date: futureDate(2),
      timeStart: "09:00",
      timeEnd: "10:00",
      purpose: "T7: Visitor สร้าง ไม่ต้องอนุมัติ (Official+PolicyDept8)",
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "approved";
    log("T7", pass, `No approval → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}`);
    if (res.data?.appointment) globalThis.T7 = res.data.appointment;
  }

  // T8: Requires approval — P1+D1
  {
    const res = await post("/api/appointments", {
      visitorId: 7,
      visitPurposeId: 1,
      departmentId: 1,
      type: "official",
      date: futureDate(2),
      timeStart: "13:00",
      timeEnd: "16:00",
      purpose: "T8: Visitor สร้าง ต้องรออนุมัติ (Official+Dept1)",
      hostStaffId: 1,
      channel: "web",
    });
    const pass = res.success && res.data?.appointment?.status === "pending";
    log("T8", pass, `Requires approval → status=${res.data?.appointment?.status || "ERR:" + JSON.stringify(res.error)}`);
    if (res.data?.appointment) globalThis.T8 = res.data.appointment;
  }
}

// ─── Phase 3: Batch/Group Appointments ─────────────────────
async function testBatchAppointments() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 3: Batch/Group Appointments (API)");
  console.log("══════════════════════════════════════════");

  // T9: Batch 3 visitors, single-day, no approval — P3+D2
  {
    const res = await post("/api/appointments/batch", {
      group: {
        name: "T9: กลุ่มส่งเอกสาร 1 วัน (ไม่ต้องอนุมัติ)",
        visitPurposeId: 3,
        departmentId: 2,
        entryMode: "single",
        dateStart: futureDate(1),
        timeStart: "09:00",
        timeEnd: "12:00",
      },
      visitors: [
        { firstName: "ทดสอบ1", lastName: "กลุ่มT9", phone: "0900000901", company: "บริษัท T9" },
        { firstName: "ทดสอบ2", lastName: "กลุ่มT9", phone: "0900000902", company: "บริษัท T9" },
        { firstName: "ทดสอบ3", lastName: "กลุ่มT9", phone: "0900000903", company: "บริษัท T9" },
      ],
    });
    const created = res.data?.created ?? 0;
    const statuses = res.data?.appointments?.map(a => a.status) || [];
    const pass = res.success && created === 3;
    log("T9", pass, `Batch 3, single, no-approval → created=${created || "ERR:" + JSON.stringify(res.error)}, statuses=[${statuses}], groupId=${res.data?.group?.id || "N/A"}`);
    if (res.data?.group) globalThis.T9group = res.data.group;
    if (res.data?.appointments) globalThis.T9appts = res.data.appointments;
  }

  // T10: Batch 2 visitors, single-day, requires approval — P1+D1
  {
    const res = await post("/api/appointments/batch", {
      group: {
        name: "T10: กลุ่มติดต่อราชการ 1 วัน (ต้องอนุมัติ)",
        visitPurposeId: 1,
        departmentId: 1,
        hostStaffId: 1,
        entryMode: "single",
        dateStart: futureDate(1),
        timeStart: "10:00",
        timeEnd: "15:00",
      },
      visitors: [
        { firstName: "ทดสอบA", lastName: "รออนุมัติT10", phone: "0900001001", company: "รอ อนุมัติ Co" },
        { firstName: "ทดสอบB", lastName: "รออนุมัติT10", phone: "0900001002", company: "รอ อนุมัติ Co" },
      ],
    });
    const created = res.data?.created ?? 0;
    const statuses = res.data?.appointments?.map(a => a.status) || [];
    const pass = res.success && created === 2;
    log("T10", pass, `Batch 2, single, approval → created=${created || "ERR:" + JSON.stringify(res.error)}, statuses=[${statuses}], groupId=${res.data?.group?.id || "N/A"}`);
    if (res.data?.group) globalThis.T10group = res.data.group;
    if (res.data?.appointments) globalThis.T10appts = res.data.appointments;
  }

  // T11: Batch 2, multi-day (period), no approval — P1+D8
  {
    const res = await post("/api/appointments/batch", {
      group: {
        name: "T11: กลุ่มติดต่อราชการ หลายวัน (ไม่ต้องอนุมัติ)",
        visitPurposeId: 1,
        departmentId: 8,
        entryMode: "period",
        dateStart: futureDate(1),
        dateEnd: futureDate(4),
        timeStart: "08:30",
        timeEnd: "16:30",
      },
      visitors: [
        { firstName: "ทดสอบX", lastName: "หลายวันT11", phone: "0900001101", company: "หลายวัน Co" },
        { firstName: "ทดสอบY", lastName: "หลายวันT11", phone: "0900001102", company: "หลายวัน Co" },
      ],
    });
    const created = res.data?.created ?? 0;
    const statuses = res.data?.appointments?.map(a => a.status) || [];
    const pass = res.success && created === 2;
    log("T11", pass, `Batch 2, period, no-approval → created=${created || "ERR:" + JSON.stringify(res.error)}, statuses=[${statuses}], groupId=${res.data?.group?.id || "N/A"}`);
    if (res.data?.group) globalThis.T11group = res.data.group;
    if (res.data?.appointments) globalThis.T11appts = res.data.appointments;
  }

  // T12: Batch 3, multi-day (period), requires approval — P1+D2
  {
    const res = await post("/api/appointments/batch", {
      group: {
        name: "T12: กลุ่มติดต่อราชการ หลายวัน (ต้องอนุมัติ)",
        visitPurposeId: 1,
        departmentId: 2,
        hostStaffId: 2,
        entryMode: "period",
        dateStart: futureDate(1),
        dateEnd: futureDate(6),
        timeStart: "08:00",
        timeEnd: "17:00",
      },
      visitors: [
        { firstName: "ช่างA", lastName: "ทดสอบT12", phone: "0900001201", company: "ช่างผู้รับเหมา Co" },
        { firstName: "ช่างB", lastName: "ทดสอบT12", phone: "0900001202", company: "ช่างผู้รับเหมา Co" },
        { firstName: "ช่างC", lastName: "ทดสอบT12", phone: "0900001203", company: "ช่างผู้รับเหมา Co" },
      ],
    });
    const created = res.data?.created ?? 0;
    const statuses = res.data?.appointments?.map(a => a.status) || [];
    const pass = res.success && created === 3;
    log("T12", pass, `Batch 3, period, approval → created=${created || "ERR:" + JSON.stringify(res.error)}, statuses=[${statuses}], groupId=${res.data?.group?.id || "N/A"}`);
    if (res.data?.group) globalThis.T12group = res.data.group;
    if (res.data?.appointments) globalThis.T12appts = res.data.appointments;
  }
}

// ─── Phase 4: Approve & Reject ─────────────────────────────
async function testApproveReject() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 4: Approve & Reject");
  console.log("══════════════════════════════════════════");

  // T13: Approve T2 (single pending)
  if (globalThis.T2) {
    const res = await post(`/api/appointments/${globalThis.T2.id}/approve`, {});
    const check = await api(`/api/appointments/${globalThis.T2.id}`);
    const s = check.data?.appointment;
    log("T13", res.success && s?.status === "approved" && s?.approvedBy != null,
      `Approve T2 (id=${globalThis.T2.id}) → status=${s?.status}, approvedBy=${s?.approvedBy}`);
  } else {
    log("T13", false, "SKIP — T2 not created");
  }

  // T14: Approve all in T10 group
  if (globalThis.T10appts) {
    let allOk = true;
    for (const apt of globalThis.T10appts) {
      const r = await post(`/api/appointments/${apt.id}/approve`, {});
      if (!r.success) allOk = false;
    }
    let verified = true;
    for (const apt of globalThis.T10appts) {
      const c = await api(`/api/appointments/${apt.id}`);
      if (c.data?.appointment?.status !== "approved") verified = false;
    }
    log("T14", allOk && verified, `Approve T10 group (${globalThis.T10appts.length} appts) → allApproved=${verified}`);
  } else {
    log("T14", false, "SKIP — T10 batch not created");
  }

  // T15: Reject T4 with reason
  if (globalThis.T4) {
    const res = await post(`/api/appointments/${globalThis.T4.id}/reject`, {
      reason: "ทดสอบ: ไม่อนุมัติ เนื่องจากไม่มีเอกสารเพียงพอ",
    });
    const check = await api(`/api/appointments/${globalThis.T4.id}`);
    const s = check.data?.appointment;
    log("T15", res.success && s?.status === "rejected" && s?.rejectedReason != null,
      `Reject T4 (id=${globalThis.T4.id}) → status=${s?.status}, reason="${s?.rejectedReason?.substring(0, 40)}"`);
  } else {
    log("T15", false, "SKIP — T4 not created");
  }

  // T16: Mixed — reject 1, approve 2 from T12 group
  if (globalThis.T12appts && globalThis.T12appts.length >= 3) {
    const [a1, a2, a3] = globalThis.T12appts;
    await post(`/api/appointments/${a1.id}/reject`, { reason: "ทดสอบ: ไม่อนุมัติช่างA เอกสารไม่ครบ" });
    await post(`/api/appointments/${a2.id}/approve`, {});
    await post(`/api/appointments/${a3.id}/approve`, {});
    const c1 = await api(`/api/appointments/${a1.id}`);
    const c2 = await api(`/api/appointments/${a2.id}`);
    const c3 = await api(`/api/appointments/${a3.id}`);
    const pass = c1.data?.appointment?.status === "rejected" && c2.data?.appointment?.status === "approved" && c3.data?.appointment?.status === "approved";
    log("T16", pass, `Mixed: reject(${a1.id})=${c1.data?.appointment?.status}, approve(${a2.id})=${c2.data?.appointment?.status}, approve(${a3.id})=${c3.data?.appointment?.status}`);
  } else {
    log("T16", false, "SKIP — T12 batch <3 appts");
  }
}

// ─── Phase 5a: Verify Appointments Page ────────────────────
async function verifyAppointmentsPage() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 5a: Verify /web/appointments");
  console.log("══════════════════════════════════════════");

  const res = await api("/api/appointments?limit=100");
  if (!res.success) { log("V1-list", false, `Failed: ${JSON.stringify(res.error)}`); return; }
  const appts = res.data?.appointments || [];
  console.log(`  Total appointments: ${appts.length}`);

  const byStatus = {};
  appts.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
  console.log(`  By status: ${JSON.stringify(byStatus)}`);

  const byCreated = {};
  appts.forEach(a => { byCreated[a.createdBy] = (byCreated[a.createdBy] || 0) + 1; });
  console.log(`  By createdBy: ${JSON.stringify(byCreated)}`);

  // Check individual appointments
  const checks = [
    { name: "T1", obj: globalThis.T1, expect: "approved" },
    { name: "T2→T13", obj: globalThis.T2, expect: "approved" },
    { name: "T3", obj: globalThis.T3, expect: "approved" },
    { name: "T4→T15", obj: globalThis.T4, expect: "rejected" },
    { name: "T5", obj: globalThis.T5, expect: "pending" },
    { name: "T6", obj: globalThis.T6, expect: "approved" },
    { name: "T7", obj: globalThis.T7, expect: "approved" },
    { name: "T8", obj: globalThis.T8, expect: "pending" },
  ];
  for (const t of checks) {
    if (!t.obj) { log(`V1-${t.name}`, false, "SKIP — not created"); continue; }
    const found = appts.find(a => a.id === t.obj.id);
    log(`V1-${t.name}`, found?.status === t.expect, `id=${t.obj.id} status=${found?.status || "NOT_FOUND"} (expect=${t.expect})`);
  }

  // Check batch appointments
  const batchChecks = [
    { name: "T9", appts: globalThis.T9appts, expect: "approved" },
    { name: "T10→T14", appts: globalThis.T10appts, expect: "approved" },
    { name: "T11", appts: globalThis.T11appts, expect: "approved" },
    { name: "T12→T16", appts: globalThis.T12appts, expectArr: ["rejected", "approved", "approved"] },
  ];
  for (const bt of batchChecks) {
    if (!bt.appts) { log(`V1-${bt.name}`, false, "SKIP — batch not created"); continue; }
    const statuses = bt.appts.map(a => appts.find(x => x.id === a.id)?.status || "NOT_FOUND");
    const pass = bt.expectArr ? JSON.stringify(statuses) === JSON.stringify(bt.expectArr) : statuses.every(s => s === bt.expect);
    log(`V1-${bt.name}`, pass, `${bt.appts.length} appts statuses=[${statuses}]`);
  }

  // Companions
  if (globalThis.T5) {
    const d = await api(`/api/appointments/${globalThis.T5.id}`);
    log("V1-T5-comp", d.data?.appointment?.companionsCount >= 3, `companionsCount=${d.data?.appointment?.companionsCount}`);
  }
  if (globalThis.T6) {
    const d = await api(`/api/appointments/${globalThis.T6.id}`);
    log("V1-T6-comp", d.data?.appointment?.companionsCount >= 2 && (d.data?.appointment?.companions?.length || 0) >= 2,
      `companionsCount=${d.data?.appointment?.companionsCount}, records=${d.data?.appointment?.companions?.length || 0}`);
  }

  // Period mode
  if (globalThis.T3) {
    const d = await api(`/api/appointments/${globalThis.T3.id}`);
    log("V1-T3-period", d.data?.appointment?.entryMode === "period" && d.data?.appointment?.dateEnd != null,
      `mode=${d.data?.appointment?.entryMode}, dateEnd=${d.data?.appointment?.dateEnd}`);
  }

  // Approval metadata
  if (globalThis.T2) {
    const d = await api(`/api/appointments/${globalThis.T2.id}`);
    const a = d.data?.appointment;
    log("V1-T13-meta", a?.approvedBy != null && a?.approvedAt != null,
      `approvedBy=${a?.approvedBy}, at=${a?.approvedAt?.substring(0, 19)}`);
  }
  if (globalThis.T4) {
    const d = await api(`/api/appointments/${globalThis.T4.id}`);
    const a = d.data?.appointment;
    log("V1-T15-meta", a?.rejectedReason != null && a?.rejectedAt != null,
      `reason="${a?.rejectedReason?.substring(0, 30)}", at=${a?.rejectedAt?.substring(0, 19)}`);
  }

  // Audit trail
  if (globalThis.T2) {
    const d = await api(`/api/appointments/${globalThis.T2.id}`);
    const logs = d.data?.appointment?.statusLogs || [];
    log("V1-audit", logs.length >= 1, `T2 statusLogs=${logs.length}: ${logs.map(l => (l.fromStatus || "null") + "→" + l.toStatus).join(", ")}`);
  }
}

// ─── Phase 5b: Verify Search Page ─────────────────────────
async function verifySearchPage() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 5b: Verify /web/search");
  console.log("══════════════════════════════════════════");

  const res = await api("/api/appointments?limit=100");
  log("V2-appts", (res.data?.appointments?.length || 0) > 0, `Total appointments: ${res.data?.appointments?.length || 0}`);

  const entries = await api("/api/entries?limit=100");
  const entryList = entries.data?.entries || [];
  log("V2-entries", entries.success, `Total entries: ${entryList.length}`);

  // Search visitors by name
  const s1 = await api("/api/search/visitors?q=%E0%B8%97%E0%B8%94%E0%B8%AA%E0%B8%AD%E0%B8%9A&limit=20");
  const foundVisitors = s1.data?.visitors?.length || 0;
  log("V2-search-visitors", foundVisitors > 0, `Search visitors 'ทดสอบ' → ${foundVisitors} found`);

  // Search by booking code
  if (globalThis.T1) {
    const code = globalThis.T1.bookingCode;
    const s2 = await api(`/api/appointments?search=${encodeURIComponent(code)}&limit=10`);
    const found = s2.data?.appointments?.some(a => a.bookingCode === code);
    log("V2-search-code", found, `Search bookingCode '${code}' → found=${found}`);
  }

  // Filter by status
  for (const st of ["pending", "approved", "rejected"]) {
    const r = await api(`/api/appointments?status=${st}&limit=100`);
    log(`V2-filter-${st}`, r.success, `Filter ${st} → ${r.data?.appointments?.length || 0}`);
  }

  // Filter by today
  const todayR = await api(`/api/appointments?date=${today()}&limit=100`);
  log("V2-filter-today", todayR.success, `Filter today → ${todayR.data?.appointments?.length || 0}`);
}

// ─── Phase 5c: Verify Blocklist Page ──────────────────────
async function verifyBlocklistPage() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 5c: Verify /web/blocklist");
  console.log("══════════════════════════════════════════");

  const res = await api("/api/blocklist?limit=100");
  if (!res.success) { log("V3-list", false, `Failed: ${JSON.stringify(res.error)}`); return; }
  const items = res.data?.entries || res.data?.blocklist || [];
  const total = res.data?.pagination?.total || items.length;
  console.log(`  Total blocklist: ${total}`);

  const byType = {};
  items.forEach(i => { const t = i.expiryDate ? "temporary" : "permanent"; byType[t] = (byType[t] || 0) + 1; });
  console.log(`  By type: ${JSON.stringify(byType)}`);

  log("V3-list", total >= 3, `Blocklist count=${total} (expect >= 3 from seed)`);

  const chk1 = await post("/api/blocklist/check", { firstName: "สุรศักดิ์", lastName: "อันตราย" });
  log("V3-check-blocked", chk1.data?.isBlocked === true, `Check blocked person → isBlocked=${chk1.data?.isBlocked}, reason=${chk1.data?.blockReason || "none"}`);

  const chk2 = await post("/api/blocklist/check", { firstName: "วิชัย", lastName: "มั่นคง" });
  log("V3-check-clean", !chk2.data?.isBlocked, `Check clean person → isBlocked=${chk2.data?.isBlocked}`);

  const s1 = await api("/api/blocklist?search=%E0%B8%AD%E0%B8%B1%E0%B8%99%E0%B8%95%E0%B8%A3%E0%B8%B2%E0%B8%A2");
  const sc = s1.data?.entries?.length || s1.data?.blocklist?.length || 0;
  log("V3-search", sc > 0, `Search 'อันตราย' → ${sc} found`);
}

// ─── Phase 5d: Verify Groups Page ─────────────────────────
async function verifyGroupsPage() {
  console.log("\n══════════════════════════════════════════");
  console.log("Phase 5d: Verify /web/appointments/groups");
  console.log("══════════════════════════════════════════");

  const res = await api("/api/appointments/groups");
  if (!res.success) { log("V4-groups", false, `Failed: ${JSON.stringify(res.error)}`); return; }
  const groups = res.data?.groups || [];
  console.log(`  Total groups: ${groups.length}`);

  const testGroupIds = [globalThis.T9group?.id, globalThis.T10group?.id, globalThis.T11group?.id, globalThis.T12group?.id].filter(Boolean);
  let found = 0;
  for (const gid of testGroupIds) {
    const g = groups.find(g => g.id === gid);
    if (g) {
      found++;
      console.log(`    Group ${g.id}: "${g.name?.substring(0, 40)}" — ${g._count?.appointments || "?"} appts, status=${g.status}`);
    }
  }
  log("V4-groups", found === testGroupIds.length, `Test groups found: ${found}/${testGroupIds.length}`);
}

// ─── Summary ───────────────────────────────────────────────
function printSummary() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║         APPOINTMENT TEST SUMMARY                  ║");
  console.log("╚══════════════════════════════════════════════════╝");

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.log(`\nTotal: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log("── ❌ Failed Tests ──");
    results.filter(r => !r.pass).forEach(r => console.log(`  ${r.testId}: ${r.msg}`));
    console.log();
  }

  console.log("── Created Appointment IDs ──");
  const ids = {
    "T1 (Single/NoApproval)": globalThis.T1,
    "T2→T13 (Single/Approved)": globalThis.T2,
    "T3 (Period/NoApproval)": globalThis.T3,
    "T4→T15 (Period/Rejected)": globalThis.T4,
    "T5 (Companions-Count)": globalThis.T5,
    "T6 (Companions-Names)": globalThis.T6,
    "T7 (NoApproval)": globalThis.T7,
    "T8 (Pending)": globalThis.T8,
  };
  for (const [k, v] of Object.entries(ids)) {
    console.log(`  ${k}: id=${v?.id || "N/A"} code=${v?.bookingCode || "N/A"} status=${v?.status || "N/A"}`);
  }

  console.log("\n── Created Group IDs ──");
  const gids = {
    "T9 (Batch3/Single/NoApproval)": globalThis.T9group,
    "T10→T14 (Batch2/Single/Approved)": globalThis.T10group,
    "T11 (Batch2/Period/NoApproval)": globalThis.T11group,
    "T12→T16 (Batch3/Period/Mixed)": globalThis.T12group,
  };
  for (const [k, v] of Object.entries(gids)) {
    console.log(`  ${k}: groupId=${v?.id || "N/A"}`);
  }
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  VMS Appointment Workflow E2E Test v2             ║");
  console.log("║  Date: " + today() + "                                ║");
  console.log("╚══════════════════════════════════════════════════╝");

  await login();
  await testSingleAppointments();
  await testVisitorAppointments();
  await testBatchAppointments();
  await testApproveReject();
  await verifyAppointmentsPage();
  await verifySearchPage();
  await verifyBlocklistPage();
  await verifyGroupsPage();
  printSummary();
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
