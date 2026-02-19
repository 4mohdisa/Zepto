/**
 * Critical Path E2E Tests for Zepto Finance App
 * 
 * Run with: npx playwright test tests/critical-path.spec.ts
 * Or with Cypress: Convert to .cy.ts format
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User'
};

const BASE_URL = 'http://localhost:3000';

test.describe('Critical Path Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to home page before each test
    await page.goto(BASE_URL);
  });

  test.describe('Authentication', () => {
    
    test('AUTH-001: User can sign up', async ({ page }) => {
      await page.click('text=Get Started');
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard or verification page
      await expect(page).toHaveURL(/.*dashboard|verify.*/);
    });

    test('AUTH-006: User can sign in', async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/.*dashboard.*/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('AUTH-007: Wrong password shows error', async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });
  });

  test.describe('Transactions', () => {
    
    test.beforeEach(async ({ page }) => {
      // Sign in before transaction tests
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('TXN-001: Create Income transaction', async ({ page }) => {
      // Click Add Transaction
      await page.click('text=Add transaction');
      
      // Fill form
      await page.fill('input[name="name"]', 'Test Salary');
      await page.fill('input[name="amount"]', '5000');
      await page.selectOption('select[name="type"]', 'Income');
      await page.selectOption('select[name="account_type"]', 'Checking');
      await page.fill('input[name="date"]', '2024-01-15');
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Verify success
      await expect(page.locator('text=Transaction created')).toBeVisible();
      
      // Verify KPI updated
      await expect(page.locator('text=$5,000').first()).toBeVisible();
    });

    test('TXN-002: Create Expense transaction', async ({ page }) => {
      await page.click('text=Add transaction');
      
      await page.fill('input[name="name"]', 'Test Rent');
      await page.fill('input[name="amount"]', '1500');
      await page.selectOption('select[name="type"]', 'Expense');
      await page.selectOption('select[name="category_id"]', '1'); // Housing
      
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Transaction created')).toBeVisible();
    });

    test('TXN-003: Validation - Empty fields show errors', async ({ page }) => {
      await page.click('text=Add transaction');
      await page.click('button:has-text("Save")');
      
      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible();
    });

    test('TXN-021: Delete transaction', async ({ page }) => {
      // First create a transaction
      await page.click('text=Add transaction');
      await page.fill('input[name="name"]', 'To Delete');
      await page.fill('input[name="amount"]', '100');
      await page.click('button:has-text("Save")');
      
      // Navigate to transactions page
      await page.goto(`${BASE_URL}/transactions`);
      
      // Find and delete
      await page.click('[data-testid="delete-transaction"]:first-of-type');
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('text=Transaction deleted')).toBeVisible();
    });
  });

  test.describe('Dashboard KPIs', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('DASH-001: Income calculation is correct', async ({ page }) => {
      // Add income
      await page.click('text=Add transaction');
      await page.fill('input[name="name"]', 'Income Test 1');
      await page.fill('input[name="amount"]', '3000');
      await page.selectOption('select[name="type"]', 'Income');
      await page.click('button:has-text("Save")');
      
      // Refresh to see updated KPI
      await page.reload();
      
      // Check Income KPI
      const incomeText = await page.locator('[data-testid="income-kpi"]').textContent();
      expect(incomeText).toContain('$8,000'); // 5000 + 3000
    });

    test('DASH-003: Net balance calculation', async ({ page }) => {
      // Income should be 8000, Expense 1500
      // Net should be 6500
      const netText = await page.locator('[data-testid="net-balance-kpi"]').textContent();
      expect(netText).toContain('$6,500');
    });

    test('DASH-004: Negative net shows red', async ({ page }) => {
      // Add large expense to make net negative
      await page.click('text=Add transaction');
      await page.fill('input[name="name"]', 'Big Expense');
      await page.fill('input[name="amount"]', '20000');
      await page.selectOption('select[name="type"]', 'Expense');
      await page.click('button:has-text("Save")');
      
      await page.reload();
      
      // Check negative styling
      const netKPI = page.locator('[data-testid="net-balance-kpi"]');
      await expect(netKPI).toHaveClass(/text-red/);
    });
  });

  test.describe('Account Balances', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('BAL-001: Add Savings balance', async ({ page }) => {
      await page.click('text=Balance'); // Quick action button
      
      await page.selectOption('select[name="account_type"]', 'Savings');
      await page.fill('input[name="current_balance"]', '10000');
      await page.click('button:has-text("Save Balance")');
      
      await expect(page.locator('text=Savings balance updated')).toBeVisible();
    });

    test('BAL-002: Update existing balance', async ({ page }) => {
      await page.click('text=Balance');
      
      await page.selectOption('select[name="account_type"]', 'Savings');
      await page.fill('input[name="current_balance"]', '15000');
      await page.click('button:has-text("Save Balance")');
      
      // Switch to summary tab
      await page.click('text=Balance Summary');
      await expect(page.locator('text=$15,000')).toBeVisible();
    });

    test('BAL-013: Difference calculation', async ({ page }) => {
      // With $15000 actual and $8000 income expected
      // Difference should be +$7000
      await page.click('text=Balance');
      await page.click('text=Balance Summary');
      
      await expect(page.locator('text=+$7,000')).toBeVisible();
    });
  });

  test.describe('Security', () => {
    
    test('RLS-001: User cannot see other user data', async ({ page, browser }) => {
      // Sign in as User A
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      // Note a transaction ID
      await page.goto(`${BASE_URL}/transactions`);
      const firstTxn = await page.locator('[data-testid="transaction-row"]:first-of-type').getAttribute('data-id');
      
      // Create new browser context for User B
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();
      
      // Sign up as User B
      await pageB.goto(`${BASE_URL}/sign-up`);
      await pageB.fill('input[name="email"]', `user_b_${Date.now()}@example.com`);
      await pageB.fill('input[name="password"]', 'TestPass123!');
      await pageB.click('button[type="submit"]');
      
      // Try to access User A's transaction
      await pageB.goto(`${BASE_URL}/transactions?id=${firstTxn}`);
      
      // Should not see User A's data
      await expect(pageB.locator('text=Not found')).toBeVisible();
      
      await contextB.close();
    });
  });

  test.describe('Performance', () => {
    
    test('PERF-001: Page load under 3 seconds', async ({ page }) => {
      const start = Date.now();
      
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      const loadTime = Date.now() - start;
      expect(loadTime).toBeLessThan(3000);
    });

    test('PERF-002: Add transaction under 500ms', async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
      
      await page.click('text=Add transaction');
      await page.fill('input[name="name"]', 'Perf Test');
      await page.fill('input[name="amount"]', '100');
      
      const start = Date.now();
      await page.click('button:has-text("Save")');
      await expect(page.locator('text=Transaction created')).toBeVisible();
      const saveTime = Date.now() - start;
      
      expect(saveTime).toBeLessThan(500);
    });
  });
});

/**
 * Test Data Setup Script
 * Run this before test suite to ensure clean state
 */
export async function setupTestData(page: any) {
  // Clean up any existing test data
  await page.goto(`${BASE_URL}/transactions`);
  
  // Delete all test transactions
  while (await page.locator('[data-testid="delete-transaction"]').count() > 0) {
    await page.click('[data-testid="delete-transaction"]:first-of-type');
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(500);
  }
}

/**
 * Environment Check
 * Verify all services are running before tests
 */
export async function checkEnvironment() {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.status}`);
    }
    console.log('✅ Environment check passed');
    return true;
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    console.log('Make sure the dev server is running: npm run dev');
    return false;
  }
}
