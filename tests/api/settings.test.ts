// =============================================================
// Settings & Reference Data API Tests — ทดสอบข้อมูลอ้างอิง
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

describe('Settings & Reference Data API — ข้อมูลอ้างอิงและตั้งค่า', () => {
  let adminCookie: string;
  let staffCookie: string;

  beforeAll(async () => {
    const adminRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'admin1234' }),
    });
    adminCookie = extractCookie(adminRes);

    const staffRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'somsri.r', password: 'pass1234' }),
    });
    staffCookie = extractCookie(staffRes);
  });

  // ----------------------------------------------------------
  // GET /api/document-types
  // ----------------------------------------------------------
  describe('GET /api/document-types — ประเภทเอกสาร', () => {
    it('ดึงรายการประเภทเอกสาร — returns list', async () => {
      const res = await fetch(`${BASE}/api/document-types`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.documentTypes).toBeInstanceOf(Array);
    });

    it('ไม่มี cookie — returns 401', async () => {
      const res = await fetch(`${BASE}/api/document-types`);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // GET /api/visit-purposes
  // ----------------------------------------------------------
  describe('GET /api/visit-purposes — วัตถุประสงค์การเยี่ยมชม', () => {
    it('ดึงรายการวัตถุประสงค์ — returns list', async () => {
      const res = await fetch(`${BASE}/api/visit-purposes`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.visitPurposes).toBeInstanceOf(Array);
    });

    it('staff สามารถดึงได้ — returns list', async () => {
      const res = await fetch(`${BASE}/api/visit-purposes`, {
        headers: { Cookie: staffCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // GET /api/staff
  // ----------------------------------------------------------
  describe('GET /api/staff — รายชื่อพนักงาน', () => {
    it('ดึงรายชื่อพนักงาน — returns list', async () => {
      const res = await fetch(`${BASE}/api/staff`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.staff).toBeInstanceOf(Array);
      expect(json.data.staff.length).toBeGreaterThan(0);
    });

    it('ข้อมูลพนักงานมีฟิลด์ที่จำเป็น', async () => {
      const res = await fetch(`${BASE}/api/staff`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      if (json.data.staff.length > 0) {
        const first = json.data.staff[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('name');
        expect(first).toHaveProperty('employeeId');
      }
    });
  });

  // ----------------------------------------------------------
  // GET /api/dashboard/kpis
  // ----------------------------------------------------------
  describe('GET /api/dashboard/kpis — ข้อมูล KPI', () => {
    it('ดึง KPI data — returns kpi object', async () => {
      const res = await fetch(`${BASE}/api/dashboard/kpis`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('ไม่มี cookie — returns 401', async () => {
      const res = await fetch(`${BASE}/api/dashboard/kpis`);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // GET /api/blocklist
  // ----------------------------------------------------------
  describe('GET /api/blocklist — บัญชีดำ (admin/supervisor only)', () => {
    it('admin ดึงรายการได้ — returns list', async () => {
      const res = await fetch(`${BASE}/api/blocklist`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('staff ไม่มีสิทธิ์ — returns 403 FORBIDDEN', async () => {
      const res = await fetch(`${BASE}/api/blocklist`, {
        headers: { Cookie: staffCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('ไม่มี cookie — returns 401', async () => {
      const res = await fetch(`${BASE}/api/blocklist`);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // GET /api/locations/buildings
  // ----------------------------------------------------------
  describe('GET /api/locations/buildings — อาคาร', () => {
    it('ดึงรายการอาคาร — returns list', async () => {
      const res = await fetch(`${BASE}/api/locations/buildings`, {
        headers: { Cookie: adminCookie },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
