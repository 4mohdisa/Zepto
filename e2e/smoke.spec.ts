/**
 * Smoke Tests - Critical Path
 * Quick tests to verify core functionality works
 * 
 * Run: npx playwright test e2e/smoke.spec.ts --headed
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `smoke_test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

test.describe('Smoke Tests', () => {
  
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Zepto/);
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation elements exist
    await expect(page.locator('nav, header')).toBeVisible();
    
    // Can navigate to sign-in
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test('sign-in page renders', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('dashboard requires auth', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

});

test.describe('Authenticated Flows', () => {
  
  // Note: These tests require manual sign-in or test credentials
  // For full automation, you'd need to:
  // 1. Programmatically create a test user via Clerk API
  // 2. Or use existing test account
  
  test.skip('user can sign up', async ({ page }) => {
    await page.goto('/sign-up');
    
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or verification
    await page.waitForURL(/.*dashboard|verify.*/, { timeout: 10000 });
  });

  test.skip('dashboard loads for authenticated user', async ({ page }) => {
    // TODO: Implement programmatic login
    // For now, manually sign in before running this test
    
    await page.goto('/dashboard');
    
    // Check dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Income')).toBeVisible();
    await expect(page.locator('text=Expenses')).toBeVisible();
  });

  test.skip('can add transaction', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click add transaction
    await page.click('text=Add transaction');
    
    // Fill form
    await page.fill('input[name="name"]', 'Test Transaction');
    await page.fill('input[name="amount"]', '100');
    await page.selectOption('select[name="type"]', 'Expense');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify success message
    await expect(page.locator('text=Transaction created')).toBeVisible();
  });

});
