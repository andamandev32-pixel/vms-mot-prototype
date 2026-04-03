// =============================================================
// Appointments API Integration Tests — ทดสอบ endpoint การนัดหมาย
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

describe('Appointments API — ระบบจัดการนัดหมาย', () => {
  let adminCookie: string;
  let staffCookie: string;
  let createdAppointmentId: number | null = null;

  beforeAll(async () => {
    // Login as admin
    const adminRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'admin1234' }),
    });
    adminCookie = extractCookie(adminRes);

    // Login as staff
    const staffRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'somsri.r', password: 'pass1234' }),
    });
    staffCookie = extractCookie(staffRes);
  });

  // ----------------------------------------------------------
  // GET /api/appointments — list
  // ----------------------------------------------------------
  describe('GET /api/appointments', () => {
    it('ดึงรายการนัดหมาย (admin) — returns list with pagination', async () => {
      const res = await fetch(`${BASE}/api/appointments`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.appointments).toBeInstanceOf(Array);
      expect(json.data.pagination).toBeDefined();
      expect(json.data.pagination).toHaveProperty('page');
      expect(json.data.pagination).toHaveProperty('limit');
      expect(json.data.pagination).toHaveProperty('total');
      expect(json.data.pagination).toHaveProperty('totalPages');
    });

    it('ดึงรายการนัดหมาย (staff) — returns scoped list', async () => {
      const res = await fetch(`${BASE}/api/appointments`, {
        headers: { Cookie: staffCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.appointments).toBeInstanceOf(Array);
    });

    it('ไม่มี cookie — returns 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${BASE}/api/appointments`);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('กรอง status=pending — returns filtered list', async () => {
      const res = await fetch(`${BASE}/api/appointments?status=pending`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // All returned appointments should have status=pending
      for (const appt of json.data.appointments) {
        expect(appt.status).toBe('pending');
      }
    });

    it('pagination — page=1&limit=5', async () => {
      const res = await fetch(`${BASE}/api/appointments?page=1&limit=5`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.appointments.length).toBeLessThanOrEqual(5);
      expect(json.data.pagination.page).toBe(1);
      expect(json.data.pagination.limit).toBe(5);
    });
  });

  // ----------------------------------------------------------
  // POST /api/appointments — create
  // ----------------------------------------------------------
  describe('POST /api/appointments', () => {
    it('สร้างนัดหมายใหม่สำเร็จ', async () => {
      // First, get a visitor and staff from the system
      const visitorsRes = await fetch(`${BASE}/api/search/visitors?q=wichai`, {
        headers: { Cookie: adminCookie },
      });
      const visitorsJson = await visitorsRes.json();

      const staffRes = await fetch(`${BASE}/api/staff`, {
        headers: { Cookie: adminCookie },
      });
      const staffJson = await staffRes.json();

      const purposesRes = await fetch(`${BASE}/api/visit-purposes`, {
        headers: { Cookie: adminCookie },
      });
      const purposesJson = await purposesRes.json();

      // Skip if we don't have required seed data
      if (
        !visitorsJson.success || !visitorsJson.data?.visitors?.length ||
        !staffJson.success || !staffJson.data?.staff?.length ||
        !purposesJson.success || !purposesJson.data?.visitPurposes?.length
      ) {
        console.warn('[appointments] Skipping create test — missing seed data');
        return;
      }

      const visitor = visitorsJson.data.visitors[0];
      const staff = staffJson.data.staff[0];
      const purpose = purposesJson.data.visitPurposes[0];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const res = await fetch(`${BASE}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          visitorId: visitor.id,
          hostStaffId: staff.id,
          visitPurposeId: purpose.id,
          departmentId: staff.departmentId,
          type: 'walk-in',
          date: dateStr,
          timeStart: '09:00',
          timeEnd: '10:00',
          purpose: 'นัดหมายทดสอบ (integration test)',
        }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.appointment).toBeDefined();
      expect(json.data.appointment.bookingCode).toMatch(/^eVMS-/);
      expect(json.data.appointment.status).toBe('pending');

      // Store for subsequent tests
      createdAppointmentId = json.data.appointment.id;
    });

    it('ไม่กรอกข้อมูลที่จำเป็น — returns 400 MISSING_FIELDS', async () => {
      const res = await fetch(`${BASE}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({ type: 'walk-in' }), // Missing required fields
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('MISSING_FIELDS');
    });

    it('ไม่มี cookie — returns 401', async () => {
      const res = await fetch(`${BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'walk-in' }),
      });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // POST /api/appointments/:id/approve — approve
  // ----------------------------------------------------------
  describe('POST /api/appointments/:id/approve', () => {
    it('อนุมัตินัดหมายสำเร็จ (admin)', async () => {
      if (!createdAppointmentId) {
        console.warn('[appointments] Skipping approve test — no appointment was created');
        return;
      }

      const res = await fetch(`${BASE}/api/appointments/${createdAppointmentId}/approve`, {
        method: 'POST',
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.appointment.status).toBe('approved');
    });

    it('อนุมัตินัดหมายที่ไม่ใช่ pending — returns error INVALID_STATUS', async () => {
      if (!createdAppointmentId) {
        console.warn('[appointments] Skipping test — no appointment');
        return;
      }

      // Try to approve again (already approved)
      const res = await fetch(`${BASE}/api/appointments/${createdAppointmentId}/approve`, {
        method: 'POST',
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_STATUS');
    });

    it('นัดหมายไม่พบ — returns 404 NOT_FOUND', async () => {
      const res = await fetch(`${BASE}/api/appointments/999999/approve`, {
        method: 'POST',
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });
});
