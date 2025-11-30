import { 
  Transaction, 
  RecurringTransaction,
  TransactionType,
  AccountType,
  FrequencyType
} from '@/app/types/transaction'
import { formatDateToISO } from '@/utils/frequency-utils'

interface BaseTransactionInput {
  user_id: string
  name: string
  amount: number
  type?: TransactionType
  account_type?: AccountType
  category_id?: number | string
  description?: string | null
}

interface TransactionInput extends BaseTransactionInput {
  date: string | Date
  recurring_frequency?: FrequencyType
}

interface RecurringTransactionInput extends BaseTransactionInput {
  frequency: FrequencyType
  start_date: string | Date
  end_date?: string | Date | null
}

interface TransactionInsertData {
  user_id: string
  name: string
  amount: number
  date: string
  description: string | null
  type: TransactionType
  account_type: AccountType
  category_id: number
  recurring_frequency: FrequencyType
  created_at: string
  updated_at: string
}

interface RecurringTransactionInsertData {
  user_id: string
  name: string
  amount: number
  type: TransactionType
  account_type: AccountType
  category_id: number
  description: string | null
  frequency: FrequencyType
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Builds transaction data for database insertion
 */
export function buildTransactionData(input: TransactionInput): TransactionInsertData {
  const now = new Date().toISOString()
  
  return {
    user_id: input.user_id,
    name: input.name,
    amount: input.amount,
    date: formatDateToISO(input.date),
    description: input.description || null,
    type: input.type || 'Expense',
    account_type: input.account_type || 'Cash',
    category_id: parseCategoryId(input.category_id),
    recurring_frequency: input.recurring_frequency || 'Never',
    created_at: now,
    updated_at: now,
  }
}

/**
 * Builds recurring transaction data for database insertion
 */
export function buildRecurringTransactionData(input: RecurringTransactionInput): RecurringTransactionInsertData {
  const now = new Date().toISOString()
  
  return {
    user_id: input.user_id,
    name: input.name,
    amount: input.amount,
    type: input.type || 'Expense',
    account_type: input.account_type || 'Cash',
    category_id: parseCategoryId(input.category_id),
    description: input.description || null,
    frequency: input.frequency,
    start_date: formatDateToISO(input.start_date),
    end_date: input.end_date ? formatDateToISO(input.end_date) : null,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Builds a predicted upcoming transaction object (not for database insertion)
 */
export function buildPredictedTransaction(
  recurringTransaction: RecurringTransaction,
  date: Date,
  index: number
): Transaction & { predicted: true; _recurring_transaction_id: number } {
  const dateStr = formatDateToISO(date)
  
  return {
    id: `${recurringTransaction.id}-${dateStr}` as unknown as number,
    user_id: recurringTransaction.user_id,
    date: dateStr,
    amount: recurringTransaction.amount,
    name: recurringTransaction.name,
    type: recurringTransaction.type,
    account_type: recurringTransaction.account_type,
    category_id: recurringTransaction.category_id,
    category_name: recurringTransaction.category_name || 'Uncategorized',
    description: recurringTransaction.description 
      ? `${recurringTransaction.description} (Upcoming)` 
      : 'Upcoming transaction',
    recurring_frequency: recurringTransaction.frequency,
    predicted: true,
    _recurring_transaction_id: recurringTransaction.id as number,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Builds a transaction from a recurring transaction for auto-generation
 */
export function buildTransactionFromRecurring(
  recurringTransaction: RecurringTransaction,
  date: Date,
  userId: string
): TransactionInsertData {
  const dateStr = formatDateToISO(date)
  const now = new Date().toISOString()
  
  return {
    user_id: userId,
    name: recurringTransaction.name,
    amount: recurringTransaction.amount,
    date: dateStr,
    description: recurringTransaction.description 
      ? `${recurringTransaction.description} (From recurring transaction)` 
      : 'From recurring transaction',
    type: recurringTransaction.type as TransactionType,
    account_type: recurringTransaction.account_type as AccountType,
    category_id: recurringTransaction.category_id,
    recurring_frequency: recurringTransaction.frequency as FrequencyType,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Parses category_id to ensure it's a number
 */
function parseCategoryId(categoryId: number | string | undefined): number {
  if (typeof categoryId === 'string') {
    const parsed = parseInt(categoryId, 10)
    return isNaN(parsed) ? 1 : parsed
  }
  return categoryId || 1
}

/**
 * Validates required transaction fields
 */
export function validateTransactionInput(input: TransactionInput): void {
  if (!input.user_id) throw new Error('User ID is required')
  if (!input.date) throw new Error('Transaction date is required')
  if (!input.name) throw new Error('Transaction name is required')
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    throw new Error('Valid transaction amount is required')
  }
}

/**
 * Validates required recurring transaction fields
 */
export function validateRecurringTransactionInput(input: RecurringTransactionInput): void {
  if (!input.user_id) throw new Error('User ID is required')
  if (!input.start_date) throw new Error('Start date is required')
  if (!input.name) throw new Error('Transaction name is required')
  if (typeof input.amount !== 'number' || input.amount <= 0) {
    throw new Error('Valid transaction amount is required')
  }
  if (!input.frequency || input.frequency === 'Never') {
    throw new Error('Valid frequency is required for recurring transactions')
  }
}
