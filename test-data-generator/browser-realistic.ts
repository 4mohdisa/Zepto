/**
 * Browser Console Script for Realistic Data Population
 * Run this in browser console to populate with your actual transaction patterns
 */

import { generateRealisticData } from './realistic-data-populator';

// This will be populated when the module loads in browser context
let createTransactionFn: any = null;

// Try to get the hooks from window
function getHooks() {
  if (typeof window !== 'undefined') {
    return {
      createTransaction: (window as any).__testDataHooks?.createTransaction,
    };
  }
  return null;
}

/**
 * Generate realistic data based on user's actual transaction patterns
 * Call this from browser console
 */
export async function populateRealisticData() {
  const hooks = getHooks();
  
  if (!hooks?.createTransaction) {
    console.error('❌ Hooks not available. Make sure to expose hooks to window.__testDataHooks');
    console.log('Add this to your dashboard component:');
    console.log('useEffect(() => { (window as any).__testDataHooks = { createTransaction }; }, []);');
    return;
  }

  console.log('🏦 Starting realistic data population...');
  console.log('This will generate transactions matching your actual spending patterns.');
  
  try {
    const result = await generateRealisticData(hooks.createTransaction);
    
    console.log('🎉 Realistic data population complete!');
    console.log(`💰 Total Income: $${result.income.toFixed(2)}`);
    console.log(`💸 Total Expenses: $${result.expenses.toFixed(2)}`);
    console.log('🔄 Refresh your page to see all transactions!');
    
    // Alert user
    setTimeout(() => {
      alert(`✅ Data population complete!\n\nIncome: $${result.income.toFixed(2)}\nExpenses: $${result.expenses.toFixed(2)}\n\nRefresh the page to see all transactions.`);
    }, 100);
    
  } catch (error) {
    console.error('❌ Error generating realistic data:', error);
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).populateRealisticData = populateRealisticData;
  
  console.log('🏦 Realistic Data Generator ready!');
  console.log('Run: populateRealisticData()');
  console.log('');
  console.log('This will generate:');
  console.log('  • Weekly income (~$1,700-$1,950)');
  console.log('  • Previous salary ($850) until Feb 17');
  console.log('  • Side income (2-4x/month, $300-$500)');
  console.log('  • Large transfers (1-2x/month, $600-$1,200)');
  console.log('  • Weekly savings ($200)');
  console.log('  • 8 subscriptions (ChatGPT, GitHub, Apple, etc.)');
  console.log('  • StepPay repayments (4-8x/month)');
  console.log('  • Shisha every 2 days ($35-$48)');
  console.log('  • Lunch every 2 days ($12-$30)');
  console.log('  • OTR 4-6x/week ($4-$25)');
  console.log('  • Coffee 3-5x/week ($5-$15)');
  console.log('  • Groceries weekly ($20-$60)');
  console.log('  • Donations, laundry, parking, Uber');
  console.log('  • Clothing & electronics purchases');
}
