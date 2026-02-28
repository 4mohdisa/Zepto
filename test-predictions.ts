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

// New API: predictUpcomingTransactions only returns 1 prediction per recurring item
const predictions = predictUpcomingTransactions(testRecurring);

console.log('\nGenerated Predictions (max 1 per recurring item):', predictions.length);
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

const predictionsPast = predictUpcomingTransactions(testRecurringPast);

console.log('\nGenerated Predictions (Past Start, max 1 per item):', predictionsPast.length);
console.log(JSON.stringify(predictionsPast, null, 2));

// Test with end date
const testRecurringEnded: RecurringTransaction[] = [{
  id: 3,
  user_id: 'test-user',
  name: 'Ended Subscription',
  amount: 15.00,
  type: 'Expense',
  account_type: 'Checking',
  category_id: 1,
  category_name: 'Subscriptions',
  frequency: 'Monthly',
  start_date: '2024-01-01',
  end_date: '2024-06-01', // Ended in the past
  description: 'Test recurring transaction that has ended',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}];

console.log('\n\nTest Recurring Transaction (Ended):', JSON.stringify(testRecurringEnded, null, 2));

const predictionsEnded = predictUpcomingTransactions(testRecurringEnded);

console.log('\nGenerated Predictions (Ended subscription should return 0):', predictionsEnded.length);
console.log(JSON.stringify(predictionsEnded, null, 2));
