// Global test setup for eVMS integration tests
import { beforeAll, afterAll } from 'vitest';

// Verify server is reachable before running tests
beforeAll(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/me');
    if (!res.ok && res.status !== 401) {
      console.warn(`[setup] Server responded with unexpected status: ${res.status}`);
    }
  } catch {
    console.error('[setup] Cannot reach http://localhost:3000 — make sure dev server is running (npm run dev)');
    throw new Error('Dev server is not running. Start it with: npm run dev');
  }
});

afterAll(() => {
  // Cleanup if needed
});
