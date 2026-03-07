import { parseISO, isValid } from 'date-fns';
import { RecurringTransaction, Transaction } from '@/types/transaction';
import { 
  normalizeDate, 
  formatDateToISO, 
  advanceDateByFrequency, 
  getMostRecentDueDate 
} from './frequency-utils';
import { getCurrentTimestamp } from './format';

/**
 * Predicts the next upcoming transaction for each recurring transaction
 * @param recurringTransactions - Array of recurring transactions
 * @returns Array of predicted next occurrences (max 1 per recurring item), sorted by date ascending
 */
export function predictUpcomingTransactions(
  recurringTransactions: RecurringTransaction[]
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
    
    // Determine next occurrence
    let nextDate: Date;
    
    // If start_date is in the future, next occurrence is the start_date
    if (startDate > now) {
      nextDate = normalizeDate(startDate);
    } else {
      // Calculate next occurrence after today based on frequency
      const mostRecent = getMostRecentDueDate(startDate, rt.frequency, now);
      nextDate = mostRecent ? advanceDateByFrequency(mostRecent, rt.frequency) : normalizeDate(startDate);
    }
    
    // Skip if past end_date
    if (endDate && nextDate > endDate) {
      return;
    }
    
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
  });
  
  // Sort by upcoming date ascending
  return predictions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
