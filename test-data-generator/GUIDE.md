# AI Test Data Generator - Complete Guide

## Overview
This module generates realistic test data using OpenAI GPT and creates transactions by calling your actual app functions.

---

## 🚀 Quick Start (3 Options)

### Option 1: Use the Component (Easiest)

Add the component to your dashboard:

```tsx
// app/(dashboard)/dashboard/page.tsx
import { TestDataGenerator } from '@/test-data-generator';

// In your JSX, add this anywhere:
<TestDataGenerator />
```

You'll see a card with buttons to generate data.

---

### Option 2: Browser Console (No UI)

1. Add the HookBridge to your dashboard:

```tsx
// app/(dashboard)/dashboard/page.tsx
import { HookBridge } from '@/test-data-generator/hook-bridge';

// In your JSX:
<HookBridge />
```

2. Open browser console (F12)
3. Run one of these commands:

```javascript
generateTestData()    // Generate all data
generateIncome()      // Generate income only
generateExpenses()    // Generate expenses only
```

---

### Option 3: Programmatic Import

```typescript
import { 
  generateIncomeTransactions,
  generateExpenseTransactions,
  generateRecurringTransactions 
} from '@/test-data-generator';
import { useTransactions } from '@/hooks/use-transactions';

function MyComponent() {
  const { createTransaction } = useTransactions();
  
  const addTestData = async () => {
    const incomes = await generateIncomeTransactions(5);
    
    for (const income of incomes) {
      await createTransaction({
        name: income.name,
        amount: income.amount,
        type: income.type,
        account_type: income.account_type,
        category_name: income.category,
        date: income.date,
        description: income.description,
      });
    }
  };
  
  return <button onClick={addTestData}>Add Test Data</button>;
}
```

---

## ⚙️ Configuration

### 1. Add OpenAI API Key

Edit `.env.local`:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
```

Get your key from: https://platform.openai.com/api-keys

### 2. No API Key? No Problem!

If you don't add an API key, the generator uses **fallback data** that is still realistic and useful for testing.

---

## 📊 What Data Gets Generated?

### Income Transactions (5-8)
- Monthly Salary ($5000-$15000)
- Freelance Projects ($500-$5000)
- Stock Dividends ($100-$1000)
- Consulting Fees ($1000-$3000)
- Side Business Income

### Expense Transactions (20-25)
- 🏠 Housing: Rent, utilities
- 🍔 Food: Groceries, restaurants, coffee
- 🚗 Transport: Gas, Uber, public transit
- 🎬 Entertainment: Netflix, movies, subscriptions
- 🛍️ Shopping: Amazon, Target, clothes
- 💊 Health: Pharmacy, gym
- 🔌 Utilities: Electric, internet, phone

### Recurring Transactions (3-5)
- Monthly Rent
- Netflix/Spotify subscriptions
- Gym membership
- Bi-weekly salary
- Utility bills

All transactions have:
- ✅ Realistic names ("Whole Foods Market", "Shell Gas Station")
- ✅ Appropriate amounts for the category
- ✅ Dates spread across last 3 months
- ✅ Various account types (Checking, Credit Card, Cash, Savings)

---

## 💡 Usage Examples

### Example 1: Generate Everything
```javascript
// In browser console
generateTestData()

// Output:
// 🚀 Starting test data generation...
// 💰 Generating income transactions...
//   ✅ Created: Monthly Salary - $8500
//   ✅ Created: Freelance Project - $2500
//   ...
// 🎉 Test data generation complete!
// 📊 Totals: 8 income + 25 expenses + 5 recurring
```

### Example 2: Add Just Income (to test KPIs)
```javascript
generateIncome()

// This will populate your Income KPI so you can see
// how the dashboard looks with real income data
```

### Example 3: Add Expenses Only
```javascript
generateExpenses()

// Good for testing expense tracking and category breakdown
```

---

## 🔒 Safety Features

1. **Only works in development** - Component won't render in production
2. **No duplicate data** - Each run creates new unique transactions
3. **Realistic data** - AI generates believable transactions, not random numbers
4. **Uses actual functions** - Tests your real createTransaction hooks
5. **Fallback data** - Works even without OpenAI API key

---

## 🧪 Testing the Test Generator

To verify the generator works:

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console (F12)

# 3. Check if commands are available
console.log(window.generateTestData)  // Should be a function

# 4. Run the generator
generateTestData()

# 5. Wait for completion (30-60 seconds)
# 6. Refresh the page
# 7. Check dashboard - should have new transactions!
```

---

## 📁 File Structure

```
test-data-generator/
├── README.md                      # This file
├── GUIDE.md                       # Detailed usage guide
├── index.ts                       # Main exports
├── ai-data-generator.ts           # OpenAI integration
├── test-data-generator-component.tsx  # UI Component
├── browser.ts                     # Browser console support
├── hook-bridge.tsx                # Hook exposure for console
└── run.ts                         # CLI script (optional)
```

---

## 🐛 Troubleshooting

### "Hooks not available" Error
**Problem:** Browser console can't access the hooks
**Solution:** Add `<HookBridge />` to your dashboard component

### "OpenAI API error"
**Problem:** API key missing or invalid
**Solution:** 
- Add key to `.env.local`
- Or ignore it - fallback data will be used automatically

### "Nothing happens when I run generateTestData()"
**Problem:** Function not exposed to window
**Solution:** 
```javascript
// Import the browser module first
import('@/test-data-generator/browser').then(m => m.generateTestData())
```

### Transactions not appearing
**Problem:** Need to refresh to see new data
**Solution:** Refresh the page after generation completes

---

## 💰 OpenAI Costs

Each test generation uses:
- ~3 API calls to GPT-3.5-turbo
- ~1000-2000 tokens total
- Cost: ~$0.002 per generation (basically free)

GPT-3.5 is very cheap for this use case. Even with heavy testing, you'll spend less than $1/month.

---

## 🎯 When to Use This

✅ **Great for:**
- Manual UI testing
- Screenshot demos
- Testing calculations
- Checking chart displays
- Verifying filter functionality

❌ **Not for:**
- Automated CI testing (use static fixtures instead)
- Load testing (too slow)
- Production data seeding

---

## 📞 Getting Help

If you need help:
1. Check browser console for error messages
2. Verify OpenAI API key is correct
3. Make sure you're in development mode
4. Check that hooks are properly exposed

---

## 📝 Next Steps

1. **Add your OpenAI API key** to `.env.local`
2. **Add `<HookBridge />`** to your dashboard
3. **Open browser console** and run `generateTestData()`
4. **Watch the magic happen!** ✨

Happy testing! 🚀
