/**
 * AI-Powered Test Data Generator
 * 
 * Uses OpenAI to generate realistic transaction data
 * Then calls actual app functions to create them
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for test data generation
});

export interface GeneratedTransaction {
  name: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  account_type: 'Cash' | 'Savings' | 'Checking' | 'Credit Card' | 'Investment' | 'Other';
  date: string;
  description?: string;
}

export interface GeneratedRecurringTransaction {
  name: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  account_type: 'Cash' | 'Savings' | 'Checking' | 'Credit Card' | 'Investment' | 'Other';
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Annually';
  start_date: string;
  end_date?: string;
  description?: string;
}

/**
 * Generate income transactions using AI
 */
export async function generateIncomeTransactions(count: number = 5): Promise<GeneratedTransaction[]> {
  const prompt = `Generate ${count} realistic income transactions for a personal finance app.
  
Return ONLY a JSON array with this exact format:
[
  {
    "name": "Transaction name (e.g., Monthly Salary, Freelance Project)",
    "amount": 5000,
    "category": "Income category (e.g., Salary, Freelance, Investments, Gifts)",
    "account_type": "Checking or Savings",
    "date": "2024-01-15",
    "description": "Brief description"
  }
]

Requirements:
- Mix of salary, freelance, side hustle, investment income
- Amounts between $500 and $15000
- Dates spread across last 3 months (Nov 2025 - Feb 2026)
- Realistic transaction names
- Valid JSON format only`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    
    return data.map((item: any) => ({
      ...item,
      type: 'Income' as const,
      amount: Math.abs(Number(item.amount)),
    }));
  } catch (error) {
    console.error('Error generating income transactions:', error);
    return getFallbackIncomeData(count);
  }
}

/**
 * Generate expense transactions using AI
 */
export async function generateExpenseTransactions(count: number = 25): Promise<GeneratedTransaction[]> {
  const prompt = `Generate ${count} realistic expense transactions for a personal finance app.
  
Return ONLY a JSON array with this exact format:
[
  {
    "name": "Transaction name (e.g., Whole Foods Market, Netflix Subscription)",
    "amount": 85.50,
    "category": "Expense category (e.g., Food, Housing, Entertainment, Transport, Shopping, Utilities, Health)",
    "account_type": "Credit Card or Checking or Cash",
    "date": "2024-01-10",
    "description": "Brief description"
  }
]

Requirements:
- Mix of: groceries, dining out, rent/mortgage, utilities, entertainment, transport, shopping, subscriptions, health
- Amounts between $5 and $2000
- Dates spread across last 3 months (Nov 2025 - Feb 2026)
- Include both small daily purchases and larger monthly bills
- Realistic merchant/transaction names
- Valid JSON format only`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    
    return data.map((item: any) => ({
      ...item,
      type: 'Expense' as const,
      amount: Math.abs(Number(item.amount)),
    }));
  } catch (error) {
    console.error('Error generating expense transactions:', error);
    return getFallbackExpenseData(count);
  }
}

/**
 * Generate recurring transactions using AI
 */
export async function generateRecurringTransactions(count: number = 5): Promise<GeneratedRecurringTransaction[]> {
  const prompt = `Generate ${count} realistic recurring transactions for a personal finance app.
  
Return ONLY a JSON array with this exact format:
[
  {
    "name": "Recurring name (e.g., Monthly Rent, Netflix Subscription)",
    "amount": 1500.00,
    "type": "Expense or Income",
    "category": "Category (e.g., Housing, Entertainment, Salary)",
    "account_type": "Checking or Credit Card",
    "frequency": "Monthly",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "description": "Brief description"
  }
]

Requirements:
- Mix of: rent, subscriptions (Netflix, Spotify, gym), salary, utilities
- Appropriate frequencies (Monthly for rent, Monthly for subscriptions, Bi-Weekly for salary)
- Amounts appropriate for the type
- Start dates in the past, some with end dates, some ongoing
- Valid JSON format only`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    
    return data.map((item: any) => ({
      ...item,
      amount: Math.abs(Number(item.amount)),
    }));
  } catch (error) {
    console.error('Error generating recurring transactions:', error);
    return getFallbackRecurringData(count);
  }
}

// Fallback data if AI fails
function getFallbackIncomeData(count: number): GeneratedTransaction[] {
  const incomes = [
    { name: 'Monthly Salary', amount: 8500, category: 'Salary', account_type: 'Checking' as const },
    { name: 'Freelance Project', amount: 2500, category: 'Freelance', account_type: 'Savings' as const },
    { name: 'Stock Dividend', amount: 350, category: 'Investments', account_type: 'Investment' as const },
    { name: 'Consulting Fee', amount: 1200, category: 'Freelance', account_type: 'Checking' as const },
    { name: 'Tax Refund', amount: 1800, category: 'Other', account_type: 'Savings' as const },
    { name: 'Side Business', amount: 800, category: 'Freelance', account_type: 'Checking' as const },
    { name: 'Investment Return', amount: 600, category: 'Investments', account_type: 'Investment' as const },
    { name: 'Bonus', amount: 3000, category: 'Salary', account_type: 'Savings' as const },
  ];
  
  return incomes.slice(0, count).map((item, i) => ({
    ...item,
    type: 'Income' as const,
    date: getRandomDate(i),
    description: `${item.name} transaction`,
  }));
}

function getFallbackExpenseData(count: number): GeneratedTransaction[] {
  const expenses = [
    { name: 'Whole Foods Market', amount: 156.78, category: 'Food', account_type: 'Credit Card' as const },
    { name: 'Monthly Rent', amount: 2200, category: 'Housing', account_type: 'Checking' as const },
    { name: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', account_type: 'Credit Card' as const },
    { name: 'Shell Gas Station', amount: 65.43, category: 'Transport', account_type: 'Credit Card' as const },
    { name: 'Target', amount: 89.56, category: 'Shopping', account_type: 'Credit Card' as const },
    { name: 'Electric Bill', amount: 145.67, category: 'Utilities', account_type: 'Checking' as const },
    { name: 'Starbucks', amount: 7.85, category: 'Food', account_type: 'Credit Card' as const },
    { name: 'Uber Ride', amount: 24.50, category: 'Transport', account_type: 'Credit Card' as const },
    { name: 'Gym Membership', amount: 49.99, category: 'Health', account_type: 'Credit Card' as const },
    { name: 'Amazon', amount: 134.22, category: 'Shopping', account_type: 'Credit Card' as const },
    { name: 'Restaurant', amount: 78.90, category: 'Food', account_type: 'Credit Card' as const },
    { name: 'Pharmacy', amount: 32.45, category: 'Health', account_type: 'Cash' as const },
    { name: 'Internet Bill', amount: 79.99, category: 'Utilities', account_type: 'Checking' as const },
    { name: 'Spotify', amount: 9.99, category: 'Entertainment', account_type: 'Credit Card' as const },
    { name: 'Coffee Shop', amount: 5.50, category: 'Food', account_type: 'Cash' as const },
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    const expense = expenses[i % expenses.length];
    result.push({
      ...expense,
      name: i >= expenses.length ? `${expense.name} ${Math.floor(i / expenses.length) + 1}` : expense.name,
      type: 'Expense' as const,
      date: getRandomDate(i),
      description: `${expense.name} purchase`,
    });
  }
  return result;
}

function getFallbackRecurringData(count: number): GeneratedRecurringTransaction[] {
  const recurrings = [
    { 
      name: 'Monthly Rent', 
      amount: 2200, 
      type: 'Expense' as const,
      category: 'Housing', 
      account_type: 'Checking' as const,
      frequency: 'Monthly' as const,
      start_date: '2024-01-01',
    },
    { 
      name: 'Netflix Subscription', 
      amount: 15.99, 
      type: 'Expense' as const,
      category: 'Entertainment', 
      account_type: 'Credit Card' as const,
      frequency: 'Monthly' as const,
      start_date: '2024-01-01',
    },
    { 
      name: 'Gym Membership', 
      amount: 49.99, 
      type: 'Expense' as const,
      category: 'Health', 
      account_type: 'Credit Card' as const,
      frequency: 'Monthly' as const,
      start_date: '2024-01-01',
    },
    { 
      name: 'Bi-weekly Salary', 
      amount: 4250, 
      type: 'Income' as const,
      category: 'Salary', 
      account_type: 'Checking' as const,
      frequency: 'Bi-Weekly' as const,
      start_date: '2024-01-01',
    },
    { 
      name: 'Spotify Premium', 
      amount: 9.99, 
      type: 'Expense' as const,
      category: 'Entertainment', 
      account_type: 'Credit Card' as const,
      frequency: 'Monthly' as const,
      start_date: '2024-01-01',
    },
  ];
  
  return recurrings.slice(0, count).map((item) => ({
    ...item,
    description: `${item.name} recurring transaction`,
  }));
}

function getRandomDate(offset: number): string {
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 90) + offset; // Last 3 months
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}
