// =============================================================
// E2E Login Tests — ทดสอบหน้าเข้าสู่ระบบ (Playwright)
// =============================================================

import { test, expect } from '@playwright/test';

test.describe('Login Page — หน้าเข้าสู่ระบบ', () => {
  test('โหลดหน้า login — แสดงฟอร์มเข้าสู่ระบบ', async ({ page }) => {
    await page.goto('/web');
    // Should show the login title (Thai by default)
    await expect(page.locator('h2')).toContainText('เข้าสู่ระบบ');
    // Should have username and password inputs
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Should have submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('เข้าสู่ระบบสำเร็จ — redirect ไป dashboard', async ({ page }) => {
    await page.goto('/web');

    // Fill in credentials
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('admin1234');

    // Click submit
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await page.waitForURL('**/web/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('รหัสผ่านผิด — แสดง error message', async ({ page }) => {
    await page.goto('/web');

    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator('.text-error, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('ไม่กรอกข้อมูล — แสดง error message', async ({ page }) => {
    await page.goto('/web');

    // Click submit without filling any fields
    await page.locator('button[type="submit"]').click();

    // Should show client-side validation error
    await expect(page.locator('.text-error, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('protected route redirect — ไม่มี session ไป dashboard จะถูก redirect', async ({ page }) => {
    await page.goto('/web/dashboard');
    // Should redirect back to login
    await page.waitForURL('**/web', { timeout: 10000 });
  });

  test('Demo account buttons — คลิกปุ่ม demo แล้วกรอกข้อมูลอัตโนมัติ', async ({ page }) => {
    await page.goto('/web');

    // Click the first demo account button (admin)
    const demoButtons = page.locator('button').filter({ hasText: 'admin' });
    await demoButtons.first().click();

    // Input fields should now be filled
    await expect(page.locator('input[type="text"]')).toHaveValue('admin');
    await expect(page.locator('input[type="password"]')).toHaveValue('admin1234');
  });

  test('Language toggle — สลับภาษา EN/TH', async ({ page }) => {
    await page.goto('/web');

    // Default should be Thai
    await expect(page.locator('h2')).toContainText('เข้าสู่ระบบ');

    // Click language toggle button (contains "EN")
    const langToggle = page.locator('button').filter({ hasText: /^EN$/ });
    await langToggle.click();

    // Should switch to English
    await expect(page.locator('h2')).toContainText('Sign In');
  });
});
