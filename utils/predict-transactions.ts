import { parseISO, isValid } from 'date-fns';
import { RecurringTransaction, Transaction } from '@/app/types/transaction';
import { 
  normalizeDate, 
  formatDateToISO, 
  advanceDateByFrequency, 
  getMostRecentDueDate 
} from './frequency-utils';
import { getCurrentTimestamp } from './format';

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
  const now = normalizeDate(new Date());
  const timestamp = getCurrentTimestamp();
  
  recurringTransactions.forEach((rt) => {
    if (!rt.start_date) return;
    
    const startDate = typeof rt.start_date === 'string' ? parseISO(rt.start_date) : rt.start_date;
    if (!isValid(startDate)) return;
    
    const endDate = rt.end_date 
      ? (typeof rt.end_date === 'string' ? parseISO(rt.end_date) : rt.end_date)
      : undefined;
    
    // Find the starting point for predictions
    let nextDate = normalizeDate(startDate);
    
    // If start date is in the past, find the next future occurrence
    if (nextDate < now) {
      const mostRecent = getMostRecentDueDate(startDate, rt.frequency, now);
      nextDate = mostRecent ? advanceDateByFrequency(mostRecent, rt.frequency) : nextDate;
    }
    
    // Generate predictions
    for (let i = 0; i < limit; i++) {
      // Stop if past end date
      if (endDate && nextDate > endDate) break;
      
      // Only include future dates
      if (nextDate >= now) {
        predictions.push({
          id: -1 * (predictions.length + 1),
          user_id: rt.user_id,
          date: formatDateToISO(nextDate),
          amount: rt.amount,
          name: rt.name,
          description: rt.description || '',
          type: rt.type,
          account_type: rt.account_type,
          category_id: rt.category_id,
          category_name: rt.category_name || 'Uncategorized',
          recurring_transaction_id: rt.id,
          recurring_frequency: rt.frequency,
          predicted: true,
          created_at: timestamp,
          updated_at: timestamp
        });
      }
      
      nextDate = advanceDateByFrequency(nextDate, rt.frequency);
    }
  });
  
  return predictions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
