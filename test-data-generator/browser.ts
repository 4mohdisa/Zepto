/**
 * Browser Console Test Data Generator
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Run: window.generateTestData()
 * 
 * Or import dynamically:
 * import('@/test-data-generator/browser').then(m => m.generateTestData())
 */

import { generateIncomeTransactions, generateExpenseTransactions, generateRecurringTransactions } from './ai-data-generator';

// This will be populated when the module loads in browser context
let createTransactionFn: any = null;
let createRecurringTransactionFn: any = null;

// Try to get the hooks from window (they need to be exposed)
function getHooks() {
  if (typeof window !== 'undefined') {
    return {
      createTransaction: (window as any).__testDataHooks?.createTransaction,
      createRecurringTransaction: (window as any).__testDataHooks?.createRecurringTransaction,
    };
  }
  return null;
}

/**
 * Generate all test data
 * Call this from browser console
 */
export async function generateTestData() {
  const hooks = getHooks();
  
  if (!hooks?.createTransaction) {
    console.error('❌ Hooks not available. Make sure to expose hooks to window.__testDataHooks');
    console.log('Add this to your component:');
    console.log('useEffect(() => { (window as any).__testDataHooks = { createTransaction, createRecurringTransaction }; }, []);');
    return;
  }

  console.log('🚀 Starting test data generation...');
  
  try {
    // Generate income
    console.log('💰 Generating income transactions...');
    const incomes = await generateIncomeTransactions(8);
    for (const income of incomes) {
      await hooks.createTransaction({
        name: income.name,
        amount: income.amount,
        type: income.type,
        account_type: income.account_type,
        category_name: income.category,
        date: income.date,
        description: income.description,
      });
      console.log(`  ✅ Created: ${income.name} - $${income.amount}`);
    }
    console.log(`✅ Created ${incomes.length} income transactions\n`);

    // Generate expenses
    console.log('💸 Generating expense transactions...');
    const expenses = await generateExpenseTransactions(25);
    for (const expense of expenses) {
      await hooks.createTransaction({
        name: expense.name,
        amount: expense.amount,
        type: expense.type,
        account_type: expense.account_type,
        category_name: expense.category,
        date: expense.date,
        description: expense.description,
      });
      console.log(`  ✅ Created: ${expense.name} - $${expense.amount}`);
    }
    console.log(`✅ Created ${expenses.length} expense transactions\n`);

    // Generate recurring
    let recurringCount = 0;
    if (hooks.createRecurringTransaction) {
      console.log('🔄 Generating recurring transactions...');
      const recurrings = await generateRecurringTransactions(5);
      recurringCount = recurrings.length;
      for (const recurring of recurrings) {
        await hooks.createRecurringTransaction({
          name: recurring.name,
          amount: recurring.amount,
          type: recurring.type,
          account_type: recurring.account_type,
          category_name: recurring.category,
          frequency: recurring.frequency,
          start_date: recurring.start_date,
          end_date: recurring.end_date,
          description: recurring.description,
        });
        console.log(`  ✅ Created: ${recurring.name} - $${recurring.amount} (${recurring.frequency})`);
      }
      console.log(`✅ Created ${recurrings.length} recurring transactions\n`);
    }

    console.log('🎉 Test data generation complete!');
    console.log(`📊 Totals: ${incomes.length} income + ${expenses.length} expenses + ${recurringCount} recurring`);
    
    // Refresh the page to see all data
    console.log('🔄 Refresh your page to see all the new data!');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
}

/**
 * Generate only income transactions
 */
export async function generateIncome() {
  const hooks = getHooks();
  if (!hooks?.createTransaction) {
    console.error('❌ Hooks not available');
    return;
  }

  const incomes = await generateIncomeTransactions(5);
  for (const income of incomes) {
    await hooks.createTransaction({
      name: income.name,
      amount: income.amount,
      type: income.type,
      account_type: income.account_type,
      category_name: income.category,
      date: income.date,
      description: income.description,
    });
    console.log(`✅ Created: ${income.name} - $${income.amount}`);
  }
  console.log(`🎉 Generated ${incomes.length} income transactions!`);
}

/**
 * Generate only expense transactions
 */
export async function generateExpenses() {
  const hooks = getHooks();
  if (!hooks?.createTransaction) {
    console.error('❌ Hooks not available');
    return;
  }

  const expenses = await generateExpenseTransactions(20);
  for (const expense of expenses) {
    await hooks.createTransaction({
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      account_type: expense.account_type,
      category_name: expense.category,
      date: expense.date,
      description: expense.description,
    });
    console.log(`✅ Created: ${expense.name} - $${expense.amount}`);
  }
  console.log(`🎉 Generated ${expenses.length} expense transactions!`);
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).generateTestData = generateTestData;
  (window as any).generateIncome = generateIncome;
  (window as any).generateExpenses = generateExpenses;
  
  console.log('🧪 Test Data Generator loaded!');
  console.log('Available commands:');
  console.log('  - generateTestData() - Generate all test data');
  console.log('  - generateIncome() - Generate income only');
  console.log('  - generateExpenses() - Generate expenses only');
}
