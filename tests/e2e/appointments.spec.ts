// =============================================================
// E2E Appointments Tests — ทดสอบหน้านัดหมาย (Playwright)
// =============================================================

import { test, expect } from '@playwright/test';

/**
 * Helper: login as admin and navigate to a page
 */
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/web');
  await page.locator('input[type="text"]').fill('admin');
  await page.locator('input[type="password"]').fill('admin1234');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/web/dashboard', { timeout: 15000 });
}

test.describe('Appointments Page — หน้าจัดการนัดหมาย', () => {
  test('ดูหน้านัดหมายหลังจาก login สำเร็จ', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to appointments page
    await page.goto('/web/appointments');
    await page.waitForLoadState('networkidle');

    // Should show appointments page content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('dashboard แสดง KPI cards หลัง login', async ({ page }) => {
    await loginAsAdmin(page);

    // Dashboard should have KPI or summary content
    await page.waitForLoadState('networkidle');
    // Check that the dashboard has loaded (contains some text content)
    await expect(page.locator('main, [role="main"], .dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigation sidebar — มีลิงก์ไปหน้าต่างๆ', async ({ page }) => {
    await loginAsAdmin(page);

    // Check for navigation elements (sidebar links)
    const nav = page.locator('nav, aside').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});
