import { addDays, addWeeks, addMonths, addYears, parseISO, isValid, format } from 'date-fns';
import { RecurringTransaction, Transaction } from '@/app/types/transaction';

/**
 * Predicts upcoming transactions based on recurring transactions
 * @param recurringTransactions - Array of recurring transactions
 * @param limit - Number of predictions per recurring transaction
 * @returns Array of predicted transactions
 */
export function predictUpcomingTransactions(
  recurringTransactions: RecurringTransaction[], 
  limit: number = 2
): Transaction[] {
  if (!recurringTransactions || recurringTransactions.length === 0) {
    return [];
  }

  const predictions: Transaction[] = [];
  
  // Process each recurring transaction
  recurringTransactions.forEach((rt) => {
    // Skip if no valid start date
    if (!rt.start_date) {
      return;
    }
    
    const startDate = typeof rt.start_date === 'string' ? parseISO(rt.start_date) : rt.start_date;
    
    if (!isValid(startDate)) {
      return;
    }
    const now = new Date();
    let nextDate = startDate;
    
    // If start date is in the past, find the next occurrence
    if (nextDate < now) {
      // Calculate next occurrence based on frequency
      switch (rt.frequency) {
        case 'daily':
          // Calculate days since start
          const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          nextDate = addDays(startDate, daysSinceStart + 1);
          break;
          
        case 'weekly':
          // Calculate weeks since start
          const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          nextDate = addWeeks(startDate, weeksSinceStart + 1);
          break;
          
        case 'monthly':
          // Calculate months since start (approximate)
          const monthsSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
          nextDate = addMonths(startDate, monthsSinceStart + 1);
          break;
          
        case 'yearly':
          // Calculate years since start
          const yearsSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
          nextDate = addYears(startDate, yearsSinceStart + 1);
          break;
          
        default:
          // Default to monthly if unknown frequency
          nextDate = addMonths(now, 1);
      }
    }
    
    // Generate 'limit' number of upcoming transactions
    for (let i = 0; i < limit; i++) {
      // Check if we should stop generating based on end date
      if (rt.end_date) {
        const endDate = typeof rt.end_date === 'string' ? parseISO(rt.end_date) : rt.end_date;
        if (nextDate > endDate) {
          break;
        }
      }
      
      // Create predicted transaction
      const prediction: Transaction = {
        id: -1 * (predictions.length + 1), // Use negative IDs for predicted transactions
        user_id: rt.user_id,
        date: format(nextDate, 'yyyy-MM-dd'),
        amount: rt.amount,
        name: rt.name,
        description: rt.description || '',
        type: rt.type,
        account_type: rt.account_type,
        category_id: rt.category_id,
        category_name: rt.category_name || 'Uncategorized',
        recurring_transaction_id: rt.id,
        recurring_frequency: rt.frequency,
        predicted: true, // Mark as predicted
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      predictions.push(prediction);
      
      // Calculate the next date based on frequency
      switch (rt.frequency) {
        case 'daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'yearly':
          nextDate = addYears(nextDate, 1);
          break;
        default:
          // Default to monthly if unknown
          nextDate = addMonths(nextDate, 1);
      }
    }
  });
  
  // Sort by date (ascending)
  return predictions.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}
