/**
 * Test Data Generator - Entry Point
 * 
 * Usage:
 * 
 * 1. In Component:
 *    import { TestDataGenerator } from '@/test-data-generator';
 *    <TestDataGenerator />
 * 
 * 2. In Browser Console:
 *    import('@/test-data-generator/browser').then(m => m.generateTestData())
 * 
 * 3. In Script:
 *    npx ts-node test-data-generator/run.ts
 */

export { TestDataGenerator } from './test-data-generator-component';
export { 
  generateIncomeTransactions,
  generateExpenseTransactions,
  generateRecurringTransactions,
  type GeneratedTransaction,
  type GeneratedRecurringTransaction,
} from './ai-data-generator';
