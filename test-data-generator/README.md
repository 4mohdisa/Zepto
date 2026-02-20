# AI Test Data Generator

This module generates realistic test data using OpenAI and populates your app with transactions.

## What It Does

1. Uses OpenAI GPT to generate realistic transaction names, amounts, and categories
2. Calls your actual `createTransaction` and `createRecurringTransaction` functions
3. Populates your database with test data for manual testing

## Usage

### Option 1: Via Debug Panel (Recommended)
1. Open your app
2. Open browser console
3. Run: `window.generateTestData()`

### Option 2: Via Script
```bash
npx ts-node test-data-generator/run.ts
```

### Option 3: Via Component
Add `<TestDataGenerator />` to any page (dev only)

## Configuration

Set your OpenAI API key in `.env.local`:
```
OPENAI_API_KEY=your_api_key_here
```

## Data Generated

| Type | Count | Examples |
|------|-------|----------|
| Income | 5-10 | Salary, Freelance, Dividends |
| Expenses | 20-30 | Rent, Groceries, Entertainment |
| Recurring | 3-5 | Monthly rent, subscriptions |

All data is realistic with appropriate amounts and dates.
