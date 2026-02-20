/**
 * Automatic Data Population Script
 * 
 * This script automatically populates your app with test data on startup.
 * It generates 300+ transactions and 30+ recurring transactions with:
 * - Past dates (2-3 months ago)
 * - Current dates
 * - Future dates
 * - All transaction types and categories
 * 
 * Run this by importing it in your layout or page component.
 */

import { generateIncomeTransactions, generateExpenseTransactions, generateRecurringTransactions } from './ai-data-generator';

// Configuration
const CONFIG = {
  TOTAL_TRANSACTIONS: 300,
  TOTAL_RECURRING: 30,
  INCOME_RATIO: 0.15,      // 15% income (45 transactions)
  EXPENSE_RATIO: 0.85,     // 85% expenses (255 transactions)
  DATE_RANGE: {
    PAST_MONTHS: 3,        // Go back 3 months
    FUTURE_MONTHS: 2,      // Go forward 2 months
  },
  BATCH_SIZE: 10,          // Process 10 at a time to avoid overwhelming
  DELAY_BETWEEN_BATCHES: 500, // 500ms delay between batches
};

// Error tracking
interface ErrorLog {
  timestamp: string;
  type: 'income' | 'expense' | 'recurring';
  error: string;
  data?: any;
}

const errorLogs: ErrorLog[] = [];
const successLogs: { type: string; name: string; amount: number; date: string }[] = [];

function logError(type: 'income' | 'expense' | 'recurring', error: any, data?: any) {
  const errorEntry: ErrorLog = {
    timestamp: new Date().toISOString(),
    type,
    error: error instanceof Error ? error.message : String(error),
    data,
  };
  errorLogs.push(errorEntry);
  console.error(`❌ [${type.toUpperCase()}] Error:`, errorEntry.error);
  if (data) console.error('   Data:', data);
}

function logSuccess(type: string, name: string, amount: number, date: string) {
  successLogs.push({ type, name, amount, date });
  if (successLogs.length % 50 === 0) {
    console.log(`✅ Progress: ${successLogs.length} transactions created...`);
  }
}

/**
 * Generate a random date within the configured range
 */
function getRandomDateInRange(): string {
  const today = new Date();
  const pastLimit = new Date(today);
  pastLimit.setMonth(pastLimit.getMonth() - CONFIG.DATE_RANGE.PAST_MONTHS);
  
  const futureLimit = new Date(today);
  futureLimit.setMonth(futureLimit.getMonth() + CONFIG.DATE_RANGE.FUTURE_MONTHS);
  
  // Generate random date between past and future
  const randomTime = pastLimit.getTime() + Math.random() * (futureLimit.getTime() - pastLimit.getTime());
  const randomDate = new Date(randomTime);
  
  return randomDate.toISOString().split('T')[0];
}

/**
 * Generate past dates (for recurring transactions)
 */
function getPastDate(monthsAgo: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Sleep helper for batching
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create income transactions
 */
async function createIncomeTransactions(
  count: number,
  createTransaction: (data: any) => Promise<any>
): Promise<number> {
  console.log(`💰 Generating ${count} income transactions...`);
  let created = 0;
  
  // Generate in batches
  const batches = Math.ceil(count / CONFIG.BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchCount = Math.min(CONFIG.BATCH_SIZE, count - (batch * CONFIG.BATCH_SIZE));
    const incomes = await generateIncomeTransactions(batchCount);
    
    for (const income of incomes) {
      try {
        const randomDate = getRandomDateInRange();
        await createTransaction({
          name: income.name,
          amount: income.amount,
          type: 'Income',
          account_type: income.account_type,
          category_name: income.category,
          date: randomDate,
          description: income.description || `${income.name} income`,
        });
        logSuccess('income', income.name, income.amount, randomDate);
        created++;
      } catch (error) {
        logError('income', error, income);
      }
    }
    
    if (batch < batches - 1) await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
  }
  
  return created;
}

/**
 * Create expense transactions
 */
async function createExpenseTransactions(
  count: number,
  createTransaction: (data: any) => Promise<any>
): Promise<number> {
  console.log(`💸 Generating ${count} expense transactions...`);
  let created = 0;
  
  const batches = Math.ceil(count / CONFIG.BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchCount = Math.min(CONFIG.BATCH_SIZE, count - (batch * CONFIG.BATCH_SIZE));
    const expenses = await generateExpenseTransactions(batchCount);
    
    for (const expense of expenses) {
      try {
        const randomDate = getRandomDateInRange();
        await createTransaction({
          name: expense.name,
          amount: expense.amount,
          type: 'Expense',
          account_type: expense.account_type,
          category_name: expense.category,
          date: randomDate,
          description: expense.description || `${expense.name} purchase`,
        });
        logSuccess('expense', expense.name, expense.amount, randomDate);
        created++;
      } catch (error) {
        logError('expense', error, expense);
      }
    }
    
    if (batch < batches - 1) await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
  }
  
  return created;
}

/**
 * Create recurring transactions with past start dates
 */
async function createRecurringTransactions(
  count: number,
  createRecurringTransaction: (data: any) => Promise<any>
): Promise<number> {
  console.log(`🔄 Generating ${count} recurring transactions...`);
  let created = 0;
  
  const recurrings = await generateRecurringTransactions(count);
  
  for (let i = 0; i < recurrings.length; i++) {
    const recurring = recurrings[i];
    try {
      // Set start date to 2-3 months ago
      const monthsAgo = 2 + Math.floor(Math.random() * 2); // 2-3 months
      const startDate = getPastDate(monthsAgo);
      
      // Some have end dates, some don't
      const hasEndDate = Math.random() > 0.5;
      const endDate = hasEndDate ? getRandomDateInRange() : undefined;
      
      await createRecurringTransaction({
        name: recurring.name,
        amount: recurring.amount,
        type: recurring.type,
        account_type: recurring.account_type,
        category_name: recurring.category,
        frequency: recurring.frequency,
        start_date: startDate,
        end_date: endDate,
        description: recurring.description || `${recurring.name} recurring`,
      });
      logSuccess('recurring', recurring.name, recurring.amount, startDate);
      created++;
      
      if (i < recurrings.length - 1) await sleep(200);
    } catch (error) {
      logError('recurring', error, recurring);
    }
  }
  
  return created;
}

/**
 * Create specific back-dated transactions
 * These are "special" transactions that should exist in the past
 */
async function createBackDatedTransactions(
  createTransaction: (data: any) => Promise<any>
): Promise<number> {
  console.log('📅 Creating specific back-dated transactions...');
  let created = 0;
  
  const backDatedTransactions = [
    // Regular weekly expense - 3 months ago
    { name: 'Weekly Groceries - Week 1', amount: 156.50, type: 'Expense', category: 'Food', account_type: 'Credit Card', monthsAgo: 3 },
    { name: 'Weekly Groceries - Week 2', amount: 142.30, type: 'Expense', category: 'Food', account_type: 'Credit Card', monthsAgo: 2.75 },
    { name: 'Weekly Groceries - Week 3', amount: 178.90, type: 'Expense', category: 'Food', account_type: 'Credit Card', monthsAgo: 2.5 },
    { name: 'Weekly Groceries - Week 4', amount: 134.20, type: 'Expense', category: 'Food', account_type: 'Credit Card', monthsAgo: 2.25 },
    
    // Monthly salary - 3 months back
    { name: 'Monthly Salary - November', amount: 8500, type: 'Income', category: 'Salary', account_type: 'Checking', monthsAgo: 3 },
    { name: 'Monthly Salary - December', amount: 8500, type: 'Income', category: 'Salary', account_type: 'Checking', monthsAgo: 2 },
    { name: 'Monthly Salary - January', amount: 9200, type: 'Income', category: 'Salary', account_type: 'Checking', monthsAgo: 1 },
    
    // Rent payments - 3 months back
    { name: 'Monthly Rent - November', amount: 2200, type: 'Expense', category: 'Housing', account_type: 'Checking', monthsAgo: 3 },
    { name: 'Monthly Rent - December', amount: 2200, type: 'Expense', category: 'Housing', account_type: 'Checking', monthsAgo: 2 },
    { name: 'Monthly Rent - January', amount: 2200, type: 'Expense', category: 'Housing', account_type: 'Checking', monthsAgo: 1 },
    
    // Utilities - 3 months back
    { name: 'Electric Bill - November', amount: 145.67, type: 'Expense', category: 'Utilities', account_type: 'Checking', monthsAgo: 3 },
    { name: 'Electric Bill - December', amount: 189.45, type: 'Expense', category: 'Utilities', account_type: 'Checking', monthsAgo: 2 },
    { name: 'Electric Bill - January', amount: 134.22, type: 'Expense', category: 'Utilities', account_type: 'Checking', monthsAgo: 1 },
    
    // Internet - 3 months back
    { name: 'Internet Bill - November', amount: 79.99, type: 'Expense', category: 'Utilities', account_type: 'Checking', monthsAgo: 3 },
    { name: 'Internet Bill - December', amount: 79.99, type: 'Expense', category: 'Utilities', account_type: 'Checking', monthsAgo: 2 },
    { name: 'Internet Bill - January', amount: 79.99, type: 'Expense', category: 'Utilities', account_type: 'Checking', monthsAgo: 1 },
    
    // Subscriptions
    { name: 'Netflix - November', amount: 15.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 3 },
    { name: 'Netflix - December', amount: 15.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 2 },
    { name: 'Netflix - January', amount: 15.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 1 },
    
    { name: 'Spotify - November', amount: 9.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 3 },
    { name: 'Spotify - December', amount: 9.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 2 },
    { name: 'Spotify - January', amount: 9.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 1 },
    
    // Gym membership
    { name: 'Gym Membership - November', amount: 49.99, type: 'Expense', category: 'Health', account_type: 'Credit Card', monthsAgo: 3 },
    { name: 'Gym Membership - December', amount: 49.99, type: 'Expense', category: 'Health', account_type: 'Credit Card', monthsAgo: 2 },
    { name: 'Gym Membership - January', amount: 49.99, type: 'Expense', category: 'Health', account_type: 'Credit Card', monthsAgo: 1 },
    
    // Random past expenses
    { name: 'Black Friday Shopping', amount: 456.78, type: 'Expense', category: 'Shopping', account_type: 'Credit Card', monthsAgo: 2.8 },
    { name: 'Holiday Gifts', amount: 234.56, type: 'Expense', category: 'Shopping', account_type: 'Credit Card', monthsAgo: 2.2 },
    { name: 'New Year Party', amount: 89.99, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsAgo: 1.5 },
    { name: 'Car Service', amount: 320.00, type: 'Expense', category: 'Transport', account_type: 'Credit Card', monthsAgo: 2.5 },
    { name: 'Dental Checkup', amount: 150.00, type: 'Expense', category: 'Health', account_type: 'Cash', monthsAgo: 2 },
    { name: 'Online Course', amount: 199.00, type: 'Expense', category: 'Education', account_type: 'Credit Card', monthsAgo: 1.8 },
  ];
  
  for (const txn of backDatedTransactions) {
    try {
      const date = new Date();
      date.setMonth(date.getMonth() - txn.monthsAgo);
      const dateStr = date.toISOString().split('T')[0];
      
      await createTransaction({
        name: txn.name,
        amount: txn.amount,
        type: txn.type as 'Income' | 'Expense',
        account_type: txn.account_type as any,
        category_name: txn.category,
        date: dateStr,
        description: `${txn.name} transaction`,
      });
      logSuccess('backdated', txn.name, txn.amount, dateStr);
      created++;
      await sleep(100);
    } catch (error) {
      logError('expense', error, txn);
    }
  }
  
  return created;
}

/**
 * Create future-dated transactions
 */
async function createFutureTransactions(
  createTransaction: (data: any) => Promise<any>
): Promise<number> {
  console.log('🔮 Creating future transactions...');
  let created = 0;
  
  const futureTransactions = [
    // Upcoming expenses
    { name: 'Upcoming Rent - March', amount: 2200, type: 'Expense', category: 'Housing', account_type: 'Checking', monthsFuture: 0.5 },
    { name: 'Upcoming Rent - April', amount: 2200, type: 'Expense', category: 'Housing', account_type: 'Checking', monthsFuture: 1.5 },
    { name: 'Expected Tax Refund', amount: 2500, type: 'Income', category: 'Other', account_type: 'Savings', monthsFuture: 1 },
    { name: 'Planned Vacation', amount: 1500, type: 'Expense', category: 'Entertainment', account_type: 'Credit Card', monthsFuture: 1.2 },
    { name: 'Car Insurance Renewal', amount: 650, type: 'Expense', category: 'Transport', account_type: 'Checking', monthsFuture: 0.8 },
    { name: 'Birthday Gift Budget', amount: 200, type: 'Expense', category: 'Shopping', account_type: 'Credit Card', monthsFuture: 0.3 },
    { name: 'Expected Freelance Payment', amount: 3000, type: 'Income', category: 'Freelance', account_type: 'Checking', monthsFuture: 0.6 },
    { name: 'Conference Registration', amount: 450, type: 'Expense', category: 'Education', account_type: 'Credit Card', monthsFuture: 0.4 },
  ];
  
  for (const txn of futureTransactions) {
    try {
      const date = new Date();
      date.setMonth(date.getMonth() + txn.monthsFuture);
      const dateStr = date.toISOString().split('T')[0];
      
      await createTransaction({
        name: txn.name,
        amount: txn.amount,
        type: txn.type as 'Income' | 'Expense',
        account_type: txn.account_type as any,
        category_name: txn.category,
        date: dateStr,
        description: `${txn.name} (planned)`,
      });
      logSuccess('future', txn.name, txn.amount, dateStr);
      created++;
      await sleep(100);
    } catch (error) {
      logError(txn.type === 'Income' ? 'income' : 'expense', error, txn);
    }
  }
  
  return created;
}

/**
 * Main population function
 */
export async function autoPopulateData(
  createTransaction: (data: any) => Promise<any>,
  createRecurringTransaction: (data: any) => Promise<any>
): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 AUTO POPULATE DATA STARTING');
  console.log('═══════════════════════════════════════════');
  console.log(`Configuration:`);
  console.log(`  - Total Transactions: ${CONFIG.TOTAL_TRANSACTIONS}`);
  console.log(`  - Total Recurring: ${CONFIG.TOTAL_RECURRING}`);
  console.log(`  - Date Range: ${CONFIG.DATE_RANGE.PAST_MONTHS} months past to ${CONFIG.DATE_RANGE.FUTURE_MONTHS} months future`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Create back-dated transactions (historical data)
    const backDatedCount = await createBackDatedTransactions(createTransaction);
    console.log(`✅ Created ${backDatedCount} back-dated transactions\n`);
    await sleep(1000);
    
    // Step 2: Create future transactions
    const futureCount = await createFutureTransactions(createTransaction);
    console.log(`✅ Created ${futureCount} future transactions\n`);
    await sleep(1000);
    
    // Step 3: Create income transactions
    const incomeCount = Math.floor(CONFIG.TOTAL_TRANSACTIONS * CONFIG.INCOME_RATIO);
    const incomeCreated = await createIncomeTransactions(incomeCount, createTransaction);
    console.log(`✅ Created ${incomeCreated} income transactions\n`);
    await sleep(1000);
    
    // Step 4: Create expense transactions
    const expenseCount = Math.floor(CONFIG.TOTAL_TRANSACTIONS * CONFIG.EXPENSE_RATIO);
    const expenseCreated = await createExpenseTransactions(expenseCount, createTransaction);
    console.log(`✅ Created ${expenseCreated} expense transactions\n`);
    await sleep(1000);
    
    // Step 5: Create recurring transactions
    const recurringCreated = await createRecurringTransactions(CONFIG.TOTAL_RECURRING, createRecurringTransaction);
    console.log(`✅ Created ${recurringCreated} recurring transactions\n`);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalCreated = backDatedCount + futureCount + incomeCreated + expenseCreated + recurringCreated;
    
    console.log('═══════════════════════════════════════════');
    console.log('📊 POPULATION COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`Total Transactions Created: ${totalCreated}`);
    console.log(`  - Back-dated: ${backDatedCount}`);
    console.log(`  - Future: ${futureCount}`);
    console.log(`  - Income: ${incomeCreated}`);
    console.log(`  - Expenses: ${expenseCreated}`);
    console.log(`  - Recurring: ${recurringCreated}`);
    console.log(`Duration: ${duration} seconds`);
    console.log('');
    
    // Error Report
    if (errorLogs.length > 0) {
      console.log('═══════════════════════════════════════════');
      console.log('⚠️  ERROR REPORT');
      console.log('═══════════════════════════════════════════');
      console.log(`Total Errors: ${errorLogs.length}`);
      console.log('');
      
      const errorByType = errorLogs.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Errors by Type:');
      Object.entries(errorByType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
      console.log('');
      
      console.log('Detailed Errors (first 10):');
      errorLogs.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.type}] ${err.error}`);
      });
      if (errorLogs.length > 10) {
        console.log(`  ... and ${errorLogs.length - 10} more errors`);
      }
      console.log('');
    } else {
      console.log('✅ No errors encountered!');
      console.log('');
    }
    
    console.log('🎉 All data has been populated successfully!');
    console.log('🔄 Refresh your page to see all transactions.');
    console.log('═══════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ FATAL ERROR during population:', error);
    logError('income', error);
  }
}

// Export logs for debugging
export function getErrorLogs(): ErrorLog[] {
  return errorLogs;
}

export function getSuccessLogs() {
  return successLogs;
}

export function clearLogs(): void {
  errorLogs.length = 0;
  successLogs.length = 0;
}

// Configuration export
export { CONFIG };
