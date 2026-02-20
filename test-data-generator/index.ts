/**
 * Test Data Generator - Entry Point
 * 
 * AUTO-POPULATION (Recommended):
 * Add this to your dashboard and data will populate automatically on load:
 *    import { AutoRunDataPopulation } from '@/test-data-generator';
 *    <AutoRunDataPopulation />
 * 
 * MANUAL METHODS:
 * 1. UI Component:
 *    import { TestDataGenerator } from '@/test-data-generator';
 *    <TestDataGenerator />
 * 
 * 2. Browser Console:
 *    import('@/test-data-generator/browser').then(m => m.generateTestData())
 * 
 * 3. Programmatic:
 *    import { autoPopulateData } from '@/test-data-generator/auto-populate';
 *    await autoPopulateData(createTransaction, createRecurringTransaction);
 */

// Auto-population (runs immediately)
export { AutoRunDataPopulation, runAutoPopulation } from './auto-run';
export { autoPopulateData, getErrorLogs, getSuccessLogs, clearLogs } from './auto-populate';

// UI Components
export { TestDataGenerator } from './test-data-generator-component';
export { HookBridge } from './hook-bridge';
export { RealisticDataButton } from './realistic-data-button';

// Realistic Data Generator
export { generateRealisticData } from './realistic-data-populator';
export { populateRealisticData } from './browser-realistic';

// AI Generators
export { 
  generateIncomeTransactions,
  generateExpenseTransactions,
  generateRecurringTransactions,
  type GeneratedTransaction,
  type GeneratedRecurringTransaction,
} from './ai-data-generator';
