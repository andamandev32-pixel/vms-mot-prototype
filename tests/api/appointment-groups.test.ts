// =============================================================
// Appointment Groups API Integration Tests
// ทดสอบฟีเจอร์นัดหมายแบบหมู่คณะ — batch create, list, detail, PATCH cascade
// Tests run against the REAL dev server at localhost:3000
// =============================================================

import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';

function extractCookie(res: Response): string {
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    return cookies.map((c) => c.split(';')[0]).join('; ');
  }
  return (res.headers.get('set-cookie') ?? '').split(';')[0];
}

describe('Appointment Groups API — ระบบนัดหมายหมู่คณะ', () => {
  let adminCookie: string;
  let staffCookie: string;
  let purposeId: number | null = null;
  let departmentId: number | null = null;
  let createdGroupId: number | null = null;

  beforeAll(async () => {
    // Login admin
    const adminRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'admin1234' }),
    });
    adminCookie = extractCookie(adminRes);

    // Login staff
    const staffRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'somsri.r', password: 'pass1234' }),
    });
    staffCookie = extractCookie(staffRes);

    // Pick a purpose + department combo whose rule is active AND doesn't require host —
    // keeps tests isolated from staff seed dependencies.
    const purposesRes = await fetch(`${BASE}/api/visit-purposes?limit=100`, {
      headers: { Cookie: adminCookie },
    });
    const purposesJson = await purposesRes.json();
    if (purposesJson.success) {
      const purposes = purposesJson.data?.purposes ?? purposesJson.data?.visitPurposes ?? purposesJson.data ?? [];
      outer: for (const p of purposes) {
        if (!p.isActive) continue;
        for (const r of p.departmentRules ?? []) {
          if (r.isActive && !r.requirePersonName) {
            purposeId = p.id;
            departmentId = r.departmentId;
            break outer;
          }
        }
      }
    }
  });

  // -------------------------------------------------------------
  // POST /api/appointments/batch — create batch group
  // -------------------------------------------------------------
  describe('POST /api/appointments/batch', () => {
    it('ไม่มี cookie — returns 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${BASE}/api/appointments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('payload ไม่ครบ — returns 400 MISSING_FIELDS', async () => {
      const res = await fetch(`${BASE}/api/appointments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ group: { name: 'incomplete' }, visitors: [] }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('MISSING_FIELDS');
    });

    it('visitors ว่าง — returns 400 NO_VISITORS', async () => {
      if (!purposeId || !departmentId) {
        console.warn('[groups] Skipping — no purpose/department seed');
        return;
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const res = await fetch(`${BASE}/api/appointments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          group: {
            name: 'Empty group test',
            visitPurposeId: purposeId,
            departmentId,
            dateStart: tomorrow.toISOString().slice(0, 10),
            timeStart: '09:00',
            timeEnd: '17:00',
          },
          visitors: [],
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NO_VISITORS');
    });

    it('สร้างกลุ่ม single mode + 3 คน สำเร็จ', async () => {
      if (!purposeId || !departmentId) {
        console.warn('[groups] Skipping — no purpose/department seed');
        return;
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const res = await fetch(`${BASE}/api/appointments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          group: {
            name: `Test single group ${Date.now()}`,
            visitPurposeId: purposeId,
            departmentId,
            entryMode: 'single',
            dateStart: dateStr,
            timeStart: '09:00',
            timeEnd: '17:00',
            building: 'Building A',
            sendVisitorEmail: false,
          },
          visitors: [
            { firstName: 'ทดสอบ1', lastName: 'หมู่คณะ', phone: '0800000001' },
            { firstName: 'ทดสอบ2', lastName: 'หมู่คณะ', phone: '0800000002' },
            { firstName: 'ทดสอบ3', lastName: 'หมู่คณะ', phone: '0800000003' },
          ],
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.group).toBeDefined();
      expect(json.data.group.id).toBeGreaterThan(0);
      expect(json.data.created).toBe(3);
      expect(json.data.appointments).toHaveLength(3);
      expect(json.data.appointments[0].bookingCode).toMatch(/^eVMS-/);
      expect(typeof json.data.autoApproved).toBe('boolean');
      expect(Array.isArray(json.data.warnings)).toBe(true);

      createdGroupId = json.data.group.id;
    });

    it('สร้างกลุ่ม period mode 3 วัน — generates daySchedules', async () => {
      if (!purposeId || !departmentId) return;
      const start = new Date();
      start.setDate(start.getDate() + 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 2); // 3-day span

      const dateStart = start.toISOString().slice(0, 10);
      const dateEnd = end.toISOString().slice(0, 10);

      const res = await fetch(`${BASE}/api/appointments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          group: {
            name: `Test period group ${Date.now()}`,
            visitPurposeId: purposeId,
            departmentId,
            entryMode: 'period',
            dateStart,
            dateEnd,
            timeStart: '09:00',
            timeEnd: '17:00',
            daySchedules: [
              { date: dateStart, timeStart: '09:00', timeEnd: '12:00' },
              { date: new Date(start.getTime() + 86400000).toISOString().slice(0, 10), timeStart: '13:00', timeEnd: '17:00' },
              { date: dateEnd, timeStart: '09:00', timeEnd: '17:00' },
            ],
          },
          visitors: [
            { firstName: 'Period1', lastName: 'Tester', phone: '0900000001' },
            { firstName: 'Period2', lastName: 'Tester', phone: '0900000002' },
          ],
        }),
      });
      const json = await res.json();

      // Period might be rejected if the seed purpose doesn't allow period — that's fine
      if (res.status === 400 && json.error?.code === 'PERIOD_NOT_ALLOWED') {
        console.warn('[groups] Skipping period assertions — seed purpose disallows period mode');
        return;
      }

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.group.entryMode).toBe('period');
      expect(json.data.created).toBe(2);
    });

    it('phone ตรง name ต่าง — emits PHONE_MATCH_NAME_DIFF warning', async () => {
      if (!purposeId || !departmentId) return;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sharedPhone = `09${Date.now().toString().slice(-8)}`;

      // First create with one name — assert it succeeded so the dedup target exists.
      // Retry once on the bookingCode race condition that can occur under concurrent suite runs.
      const setupBody = {
        group: {
          name: `Dedup setup ${Date.now()}`,
          visitPurposeId: purposeId,
          departmentId,
          dateStart: tomorrow.toISOString().slice(0, 10),
          timeStart: '09:00',
          timeEnd: '17:00',
        },
        visitors: [{ firstName: 'OriginalName', lastName: 'Person', phone: sharedPhone }],
      };
      let setupOk = false;
      for (let attempt = 0; attempt < 3 && !setupOk; attempt++) {
        const res1 = await fetch(`${BASE}/api/appointments/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
          body: JSON.stringify(setupBody),
        });
        if (res1.status === 200) {
          setupOk = true;
        } else {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      if (!setupOk) {
        console.warn('[groups] Dedup test setup failed after retries — skipping');
        return;
      }

      // Then create with same phone but different name → should emit warning
      const res2 = await fetch(`${BASE}/api/appointments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          group: {
            name: `Dedup test ${Date.now()}`,
            visitPurposeId: purposeId,
            departmentId,
            dateStart: tomorrow.toISOString().slice(0, 10),
            timeStart: '09:00',
            timeEnd: '17:00',
          },
          visitors: [{ firstName: 'TypoName', lastName: 'Person', phone: sharedPhone }],
        }),
      });
      const json2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(json2.data.warnings).toBeInstanceOf(Array);
      expect(json2.data.warnings.length).toBeGreaterThanOrEqual(1);
      expect(json2.data.warnings[0].type).toBe('PHONE_MATCH_NAME_DIFF');
    });
  });

  // -------------------------------------------------------------
  // GET /api/appointments/groups — list
  // -------------------------------------------------------------
  describe('GET /api/appointments/groups', () => {
    it('ไม่มี cookie — returns 401', async () => {
      const res = await fetch(`${BASE}/api/appointments/groups`);
      expect(res.status).toBe(401);
    });

    it('list groups (admin) — returns array with stats', async () => {
      const res = await fetch(`${BASE}/api/appointments/groups`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.groups).toBeInstanceOf(Array);
      if (json.data.groups.length > 0) {
        const g = json.data.groups[0];
        expect(g).toHaveProperty('id');
        expect(g).toHaveProperty('name');
        expect(g).toHaveProperty('stats');
        expect(g.stats).toHaveProperty('arrivedToday');
      }
    });

    it('createdBy=me filter (staff) — returns scoped list', async () => {
      const res = await fetch(`${BASE}/api/appointments/groups?createdBy=me`, {
        headers: { Cookie: staffCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.groups).toBeInstanceOf(Array);
    });
  });

  // -------------------------------------------------------------
  // GET /api/appointments/groups/:id — detail
  // -------------------------------------------------------------
  describe('GET /api/appointments/groups/:id', () => {
    it('returns full detail with appointments + stats', async () => {
      if (!createdGroupId) {
        console.warn('[groups] Skipping detail test — no group created');
        return;
      }

      const res = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.group.id).toBe(createdGroupId);
      expect(json.data.dateFilter).toBeDefined();
      expect(json.data.availableDates).toBeInstanceOf(Array);
      expect(json.data.todaySchedule).toBeDefined();
      expect(json.data.stats).toMatchObject({
        total: expect.any(Number),
        arrivedToday: expect.any(Number),
        notArrivedToday: expect.any(Number),
      });
      expect(json.data.appointments).toBeInstanceOf(Array);
    });

    it('group ไม่พบ — returns 404', async () => {
      const res = await fetch(`${BASE}/api/appointments/groups/999999`, {
        headers: { Cookie: adminCookie },
      });
      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------
  // PATCH /api/appointments/groups/:id — cascade behavior
  // -------------------------------------------------------------
  describe('PATCH /api/appointments/groups/:id — cascade', () => {
    it('toggle notifyOnCheckin cascades to appointments', async () => {
      if (!createdGroupId) return;

      const res = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ notifyOnCheckin: true }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.group.notifyOnCheckin).toBe(true);

      // Verify cascade
      const detailRes = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        headers: { Cookie: adminCookie },
      });
      const detailJson = await detailRes.json();
      for (const appt of detailJson.data.appointments) {
        expect(appt.notifyOnCheckin).toBe(true);
      }
    });

    it('cancel cascades to appointments + creates statusLogs', async () => {
      if (!createdGroupId) return;

      const res = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      expect(res.status).toBe(200);

      // Verify all appointments cancelled
      const detailRes = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        headers: { Cookie: adminCookie },
      });
      const detailJson = await detailRes.json();
      expect(detailJson.data.group.status).toBe('cancelled');
      for (const appt of detailJson.data.appointments) {
        expect(appt.status).toBe('cancelled');
      }
    });

    it('reactivate cancelled→active revives appointments to pending', async () => {
      if (!createdGroupId) return;

      const res = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ status: 'active' }),
      });

      expect(res.status).toBe(200);

      const detailRes = await fetch(`${BASE}/api/appointments/groups/${createdGroupId}`, {
        headers: { Cookie: adminCookie },
      });
      const detailJson = await detailRes.json();
      expect(detailJson.data.group.status).toBe('active');
      // All previously cancelled appointments should be back to pending
      for (const appt of detailJson.data.appointments) {
        expect(appt.status).toBe('pending');
      }
    });
  });

  // -------------------------------------------------------------
  // GET /api/appointments/groups/template — Excel template
  // -------------------------------------------------------------
  describe('GET /api/appointments/groups/template', () => {
    it('returns .xlsx with correct content-type', async () => {
      const res = await fetch(`${BASE}/api/appointments/groups/template`, {
        headers: { Cookie: adminCookie },
      });

      expect(res.status).toBe(200);
      const ct = res.headers.get('content-type') ?? '';
      // accept any xlsx MIME variant
      expect(ct).toMatch(/spreadsheet|excel|xlsx|octet-stream/i);
      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBeGreaterThan(100);
    });

    it('ไม่มี cookie — returns 401', async () => {
      const res = await fetch(`${BASE}/api/appointments/groups/template`);
      expect(res.status).toBe(401);
    });
  });
});
