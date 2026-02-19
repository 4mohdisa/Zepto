/**
 * Test script for upcoming transaction predictions
 * Run with: npx ts-node test-predictions.ts
 */

import { predictUpcomingTransactions } from './utils/predict-transactions';
import { RecurringTransaction } from './app/types/transaction';

// Create a test recurring transaction that should generate upcoming predictions
const testRecurring: RecurringTransaction[] = [{
  id: 1,
  user_id: 'test-user',
  name: 'Monthly Subscription',
  amount: 29.99,
  type: 'Expense',
  account_type: 'Checking',
  category_id: 1,
  category_name: 'Subscriptions',
  frequency: 'Monthly',
  start_date: new Date(), // Starting today
  description: 'Test recurring transaction',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}];

console.log('Test Recurring Transaction:', JSON.stringify(testRecurring, null, 2));

const predictions = predictUpcomingTransactions(testRecurring, 3);

console.log('\nGenerated Predictions:', predictions.length);
console.log(JSON.stringify(predictions, null, 2));

// Test with start date in the past
const testRecurringPast: RecurringTransaction[] = [{
  id: 2,
  user_id: 'test-user',
  name: 'Past Subscription',
  amount: 19.99,
  type: 'Expense',
  account_type: 'Checking',
  category_id: 1,
  category_name: 'Subscriptions',
  frequency: 'Monthly',
  start_date: '2024-01-01', // Started in the past
  description: 'Test recurring transaction with past start date',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}];

console.log('\n\nTest Recurring Transaction (Past Start):', JSON.stringify(testRecurringPast, null, 2));

const predictionsPast = predictUpcomingTransactions(testRecurringPast, 3);

console.log('\nGenerated Predictions (Past Start):', predictionsPast.length);
console.log(JSON.stringify(predictionsPast, null, 2));
