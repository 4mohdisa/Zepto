/**
 * Realistic Data Populator - Based on User's Actual Transaction Patterns
 * Generates transactions matching the user's described financial behavior
 */

import { generateIncomeTransactions, generateExpenseTransactions } from './ai-data-generator';

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generate dates for a specific day of the week between start and end dates
function getDatesForDayOfWeek(startDate: Date, endDate: Date, dayOfWeek: number, frequency: 'weekly' | 'biweekly'): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);
  
  // Find first occurrence of the day of week
  while (getDayOfWeek(current) !== dayOfWeek) {
    current = addDays(current, 1);
  }
  
  // Add all occurrences
  while (current <= endDate) {
    dates.push(new Date(current));
    current = addDays(current, frequency === 'weekly' ? 7 : 14);
  }
  
  return dates;
}

// Get random dates within a range
function getRandomDates(startDate: Date, endDate: Date, count: number): Date[] {
  const dates: Date[] = [];
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i < count; i++) {
    const randomDay = randomInt(0, totalDays);
    const date = addDays(startDate, randomDay);
    dates.push(date);
  }
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

interface TransactionData {
  name: string;
  amount: number;
  type: 'Income' | 'Expense';
  account_type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash';
  category: string;
  date: string;
  description?: string;
}

export async function generateRealisticData(
  createTransaction: (data: any) => Promise<any>,
  createRecurringTransaction?: (data: any) => Promise<any>
): Promise<{ income: number; expenses: number }> {
  console.log('🏦 Generating realistic personal finance data...');
  
  const transactions: TransactionData[] = [];
  const recurringTransactions: any[] = [];
  
  // Date range: July 2025 to current (Feb 2026)
  const startDate = new Date('2025-07-01');
  const endDate = new Date('2026-02-28');
  const today = new Date();
  
  // ============================================
  // INCOME - RECURRING
  // ============================================
  
  // 1. Employer Payrun - Weekly on Thursday
  console.log('💰 Generating employer payrun...');
  const payrunDates = getDatesForDayOfWeek(startDate, endDate, 4, 'weekly'); // Thursday = 4
  payrunDates.forEach(date => {
    transactions.push({
      name: 'Employer Payrun',
      amount: randomBetween(1700, 1950),
      type: 'Income',
      account_type: 'Checking',
      category: 'Salary',
      date: formatDate(date),
      description: 'Weekly salary payment'
    });
  });
  
  // 2. Previous Salary - Weekly on Thursday until 17/02/2026
  console.log('💰 Generating previous salary...');
  const oldSalaryEnd = new Date('2026-02-17');
  const oldSalaryDates = getDatesForDayOfWeek(new Date('2025-07-01'), oldSalaryEnd, 4, 'weekly');
  oldSalaryDates.forEach(date => {
    transactions.push({
      name: 'Previous Salary (Old Pay Level)',
      amount: 850,
      type: 'Income',
      account_type: 'Checking',
      category: 'Salary',
      date: formatDate(date),
      description: 'Previous salary level'
    });
  });
  
  // 3. Side Income - 2-4 times per month, random weekdays
  console.log('💰 Generating side income...');
  let currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const count = randomInt(2, 4);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'Side Income - Friends / Small Work',
        amount: randomBetween(300, 500),
        type: 'Income',
        account_type: 'Checking',
        category: 'Freelance',
        date: formatDate(date),
        description: 'Side work payment'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // 4. Larger One Off Transfers - 1-2 times per month
  console.log('💰 Generating larger transfers...');
  currentMonth = new Date(new Date('2025-08-01'));
  while (currentMonth <= endDate) {
    const count = randomInt(1, 2);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'Large Transfer',
        amount: randomBetween(600, 1200),
        type: 'Income',
        account_type: 'Checking',
        category: 'Other Income',
        date: formatDate(date),
        description: 'One-off transfer'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // ============================================
  // SAVINGS
  // ============================================
  
  // Weekly Savings Transfer - Mondays
  console.log('💳 Generating savings transfers...');
  const savingsDates = getDatesForDayOfWeek(startDate, endDate, 1, 'weekly'); // Monday = 1
  savingsDates.forEach(date => {
    transactions.push({
      name: 'Transfer to NetBank SAVINGS',
      amount: 200,
      type: 'Expense',
      account_type: 'Checking',
      category: 'Savings',
      date: formatDate(date),
      description: 'Weekly savings transfer'
    });
  });
  
  // ============================================
  // SUBSCRIPTIONS - MONTHLY
  // ============================================
  
  const subscriptions = [
    { name: 'OpenAI ChatGPT', min: 28, max: 31, day: 10 },
    { name: 'GitHub', min: 5.50, max: 6.20, day: 15 },
    { name: 'Apple Services', min: 2.99, max: 22.99, day: 5 },
    { name: 'JB HiFi Mobile', min: 89, max: 89, day: 20 },
    { name: 'Bupa Insurance', min: 99.88, max: 99.88, day: 15 },
    { name: 'Resume.io', min: 3.95, max: 32.95, day: 20 },
    { name: 'Coursera', min: 73, max: 73, day: 1, startMonth: 8 }, // September
    { name: 'Moonshot AI', min: 57, max: 57, day: 1, startMonth: 9 }, // October
  ];
  
  console.log('📱 Generating subscriptions...');
  subscriptions.forEach(sub => {
    const subStart = sub.startMonth ? new Date(2025, sub.startMonth, 1) : startDate;
    let subDate = new Date(subStart.getFullYear(), subStart.getMonth(), sub.day);
    
    while (subDate <= endDate) {
      transactions.push({
        name: sub.name,
        amount: randomBetween(sub.min, sub.max),
        type: 'Expense',
        account_type: 'Credit Card',
        category: 'Subscriptions',
        date: formatDate(subDate),
        description: 'Monthly subscription'
      });
      subDate = new Date(subDate.getFullYear(), subDate.getMonth() + 1, sub.day);
    }
  });
  
  // ============================================
  // BUY NOW PAY LATER
  // ============================================
  
  console.log('💸 Generating StepPay repayments...');
  currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const count = randomInt(4, 8);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'StepPay Repayment',
        amount: randomBetween(2, 30),
        type: 'Expense',
        account_type: 'Checking',
        category: 'Debt Repayment',
        date: formatDate(date),
        description: 'Buy Now Pay Later repayment'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // ============================================
  // LIFESTYLE - HIGH FREQUENCY
  // ============================================
  
  // Shisha Lounge - Every 3 days (reduced from every 2 days)
  console.log('🌿 Generating sh lounge expenses...');
  const shishaMerchants = ['Sheesha Lounge', 'Boss of Shisha', 'Layali Lounge'];
  let shishaDate = new Date('2025-07-10');
  while (shishaDate <= endDate) {
    transactions.push({
      name: shishaMerchants[randomInt(0, shishaMerchants.length - 1)],
      amount: randomBetween(35, 48),
      type: 'Expense',
      account_type: 'Credit Card',
      category: 'Entertainment',
      date: formatDate(shishaDate),
      description: 'Shisha session'
    });
    shishaDate = addDays(shishaDate, 3); // Every 3 days instead of 2
  }
  
  // Eating Out - Lunch - Every 3 days (reduced from every 2 days)
  console.log('🍽️ Generating lunch expenses...');
  const lunchMerchants = ['Al Sultan', 'Mezza', 'McDonalds', 'Hungry Jacks', 'Subway', 'Byblos'];
  let lunchDate = new Date('2025-07-05');
  while (lunchDate <= endDate) {
    transactions.push({
      name: lunchMerchants[randomInt(0, lunchMerchants.length - 1)],
      amount: randomBetween(12, 30),
      type: 'Expense',
      account_type: 'Credit Card',
      category: 'Food',
      date: formatDate(lunchDate),
      description: 'Lunch'
    });
    lunchDate = addDays(lunchDate, 3); // Every 3 days instead of 2
  }
  
  // OTR Convenience / Fuel - 2-3 times per week (reduced from 4-6)
  console.log('⛽ Generating OTR expenses...');
  currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const weeksInMonth = 4;
    const totalOTR = weeksInMonth * randomInt(2, 3); // Reduced from 4-6 to 2-3
    const otrDates = getRandomDates(currentMonth, monthEnd, totalOTR);
    otrDates.forEach(date => {
      transactions.push({
        name: 'OTR Convenience',
        amount: randomBetween(4, 25),
        type: 'Expense',
        account_type: 'Credit Card',
        category: 'Transport',
        date: formatDate(date),
        description: 'Fuel or convenience items'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // Coffee / Small Café - 2-3 times per week (reduced from 3-5)
  console.log('☕ Generating coffee expenses...');
  currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const weeksInMonth = 4;
    const totalCoffee = weeksInMonth * randomInt(2, 3); // Reduced from 3-5 to 2-3
    const coffeeDates = getRandomDates(currentMonth, monthEnd, totalCoffee);
    coffeeDates.forEach(date => {
      transactions.push({
        name: 'Coffee Shop',
        amount: randomBetween(5, 15),
        type: 'Expense',
        account_type: 'Credit Card',
        category: 'Food',
        date: formatDate(date),
        description: 'Coffee'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // Grocery Small Shops - Weekly
  console.log('🛒 Generating grocery expenses...');
  let groceryDate = new Date(startDate);
  while (groceryDate <= endDate) {
    transactions.push({
      name: 'Grocery Shop',
      amount: randomBetween(20, 60),
      type: 'Expense',
      account_type: 'Credit Card',
      category: 'Food',
      date: formatDate(groceryDate),
      description: 'Weekly groceries'
    });
    groceryDate = addDays(groceryDate, 7);
  }
  
  // Donations - 2-3 times per month
  console.log('🤲 Generating donations...');
  currentMonth = new Date(new Date('2025-08-01'));
  while (currentMonth <= endDate) {
    const count = randomInt(2, 3);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'Donation - Sadaqa Welfare Fund',
        amount: 20,
        type: 'Expense',
        account_type: 'Checking',
        category: 'Charity',
        date: formatDate(date),
        description: 'Charity donation'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // Laundry - 2 times per month
  console.log('🧺 Generating laundry expenses...');
  currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, 2);
    dates.forEach(date => {
      transactions.push({
        name: 'Laundry',
        amount: randomBetween(6, 12),
        type: 'Expense',
        account_type: 'Cash',
        category: 'Services',
        date: formatDate(date),
        description: 'Laundry service'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // ============================================
  // TRANSPORT / PARKING
  // ============================================
  
  // Parking - 2-4 times per month
  console.log('🅿️ Generating parking expenses...');
  currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const count = randomInt(2, 4);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'Parking',
        amount: randomBetween(5, 25),
        type: 'Expense',
        account_type: 'Credit Card',
        category: 'Transport',
        date: formatDate(date),
        description: 'Parking fee'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // Uber - 1-3 times per month
  console.log('🚗 Generating Uber expenses...');
  currentMonth = new Date(new Date('2025-08-01'));
  while (currentMonth <= endDate) {
    const count = randomInt(1, 3);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'Uber',
        amount: randomBetween(10, 30),
        type: 'Expense',
        account_type: 'Credit Card',
        category: 'Transport',
        date: formatDate(date),
        description: 'Uber ride'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // ============================================
  // RETAIL / CLOTHING
  // ============================================
  
  // Clothing - 1-2 times per month
  console.log('👕 Generating clothing expenses...');
  currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const count = randomInt(1, 2);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const dates = getRandomDates(currentMonth, monthEnd, count);
    dates.forEach(date => {
      transactions.push({
        name: 'Clothing Purchase',
        amount: randomBetween(50, 150),
        type: 'Expense',
        account_type: 'Credit Card',
        category: 'Shopping',
        date: formatDate(date),
        description: 'Clothing'
      });
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // Electronics / Repairs - Every 4-6 weeks
  console.log('📱 Generating electronics expenses...');
  let electronicsDate = new Date('2025-08-01');
  while (electronicsDate <= endDate) {
    transactions.push({
      name: 'Electronics / Repair',
      amount: randomBetween(100, 300),
      type: 'Expense',
      account_type: 'Credit Card',
      category: 'Shopping',
      date: formatDate(electronicsDate),
      description: 'Electronics or repair'
    });
    electronicsDate = addDays(electronicsDate, randomBetween(28, 42));
  }
  
  // ============================================
  // CREATE TRANSACTIONS
  // ============================================
  
  console.log(`📊 Total transactions to create: ${transactions.length}`);
  
  // Sort by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let createdCount = 0;
  let errorCount = 0;
  
  // Create in batches to avoid overwhelming the database
  const batchSize = 5; // Smaller batches
  const maxErrors = 20; // Stop if too many errors
  
  for (let i = 0; i < transactions.length; i += batchSize) {
    // Stop if too many errors
    if (errorCount >= maxErrors) {
      console.error(`❌ Stopped due to too many errors (${errorCount}). Database may be overloaded.`);
      break;
    }
    
    const batch = transactions.slice(i, i + batchSize);
    
    for (const txn of batch) {
      try {
        await createTransaction({
          name: txn.name,
          amount: txn.amount,
          type: txn.type,
          account_type: txn.account_type,
          category_name: txn.category,
          date: txn.date,
          description: txn.description,
        });
        createdCount++;
      } catch (error: any) {
        errorCount++;
        // Only log first few errors to avoid console spam
        if (errorCount <= 3) {
          console.error(`Failed to create transaction: ${txn.name}`, error.message || error);
        } else if (errorCount === 4) {
          console.error('... more errors (suppressing output)');
        }
      }
    }
    
    // Longer delay between batches to prevent database overload
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Progress update
    if (createdCount % 25 === 0) {
      console.log(`✅ Created ${createdCount}/${transactions.length} transactions...`);
    }
  }
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  console.log('═══════════════════════════════════════════');
  console.log('📊 REALISTIC DATA POPULATION COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`Total Transactions: ${createdCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log(`Total Income: $${totalIncome.toFixed(2)}`);
  console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
  console.log(`Net: $${(totalIncome - totalExpenses).toFixed(2)}`);
  console.log('═══════════════════════════════════════════');
  
  return { income: totalIncome, expenses: totalExpenses };
}

// Export for use
export { formatDate, randomBetween, randomInt };
