import { 
  Transaction, 
  RecurringTransaction, 
  UpdateTransaction, 
  UpdateRecurringTransaction,
  TransactionFormData,
  TransactionType,
  AccountType,
  FrequencyType
} from '@/app/types/transaction'
import { 
  formatDateToISO, 
  getMostRecentDueDate, 
  getNextDates 
} from '@/utils/frequency-utils'
import {
  buildTransactionData,
  buildRecurringTransactionData,
  buildTransactionFromRecurring,
  buildPredictedTransaction,
  validateTransactionInput,
} from './transaction-builders'
import { SupabaseClient } from '@supabase/supabase-js'

interface TransactionData extends Omit<Transaction, "id" | "date" | "end_date"> {
  date: string
  end_date?: string | null
}

/**
 * TransactionService - Handles all transaction-related database operations
 * 
 * IMPORTANT: This service requires an authenticated Supabase client.
 * You MUST pass a client created with useSupabaseClient() hook which
 * includes the Clerk JWT token for RLS policies to work.
 * 
 * Example usage:
 * ```typescript
 * const supabase = useSupabaseClient() // Hook with Clerk auth
 * const service = createTransactionService(supabase)
 * const result = await service.createTransaction(data)
 * ```
 */
class TransactionService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  async createTransaction(data: TransactionData & { category_name?: string | null }) {
    // Validate required fields for all transactions
    if (!data.user_id) throw new Error("User ID is required");
    if (!data.date) throw new Error("Transaction date is required");
    if (!data.name) throw new Error("Transaction name is required");
    if (typeof data.amount !== "number" || data.amount <= 0)
      throw new Error("Valid transaction amount is required");

    try {
      // Handle category - either by ID or by name
      let categoryId = data.category_id ? Number(data.category_id) : null;
      
      // If category_name is provided but not category_id, look up or create category
      if (!categoryId && data.category_name) {
        console.log(`[TransactionService] Looking up category: ${data.category_name}`);
        
        // Try to find existing category - use maybeSingle() instead of single() to avoid errors
        const { data: existingCategories, error: lookupError } = await this.supabase
          .from("categories")
          .select("id, name")
          .ilike("name", data.category_name)
          .limit(1);
        
        if (lookupError) {
          console.error(`[TransactionService] Category lookup error:`, lookupError);
        }
        
        if (existingCategories && existingCategories.length > 0) {
          categoryId = existingCategories[0].id;
          console.log(`[TransactionService] Found existing category: ${data.category_name} = ID ${categoryId}`);
        } else {
          // Create new category
          console.log(`[TransactionService] Creating new category: ${data.category_name}`);
          const { data: newCategory, error: createError } = await this.supabase
            .from("categories")
            .insert({ name: data.category_name })
            .select("id")
            .single();
          
          if (createError) {
            console.error(`[TransactionService] Failed to create category:`, createError);
          }
          
          if (newCategory) {
            categoryId = newCategory.id;
            console.log(`[TransactionService] Created new category: ${data.category_name} = ID ${categoryId}`);
          }
        }
      }
      
      // Default to category 1 if still no category
      if (!categoryId) {
        console.log(`[TransactionService] No category found, defaulting to ID 1 (Housing)`);
        categoryId = 1;
      }

      // Prepare transaction data for the transactions table (without end_date)
      const transactionData = {
        user_id: data.user_id,
        name: data.name,
        amount: data.amount,
        date: formatDateToISO(data.date),
        description: data.description || null,
        type: (data.type || "Expense") as TransactionType,
        account_type: (data.account_type || "Cash") as AccountType,
        category_id: categoryId,
        recurring_frequency: (data.recurring_frequency || "Never") as FrequencyType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Store common data for potential recurring transaction
      const recurringFrequency = (data.recurring_frequency || "Never") as FrequencyType;

      // Step 1: Always create a regular transaction
      const { data: transaction, error: transactionError } = await this.supabase
        .from("transactions")
        .insert(transactionData)
        .select(`
          *,
          categories (
            name
          )
        `)
        .single();

      if (transactionError) {
        if (transactionError.code === "23503") {
          throw new Error("Invalid category selected");
        }
        throw new Error(`Transaction creation failed: ${transactionError.message}`);
      }

      // Step 2: If recurring_frequency is not "Never", create a recurring transaction
      let recurringTransaction = null;
      if (recurringFrequency !== "Never") {
        // Create recurring transaction
        const { data: recurring, error: recurringError } = await this.supabase
          .from("recurring_transactions")
          .insert({
            user_id: data.user_id,
            name: data.name,
            amount: data.amount,
            type: (data.type || "Expense") as TransactionType,
            account_type: (data.account_type || "Cash") as AccountType,
            category_id: categoryId,
            description: data.description || null,
            frequency: recurringFrequency,
            start_date: formatDateToISO(data.date),
            end_date: null, // Set end_date to null since we removed it from the form
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (recurringError) {
          throw new Error(`Recurring transaction creation failed: ${recurringError.message}`);
        }

        recurringTransaction = recurring;
      }

      return { transaction, recurringTransaction };
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async createRecurringTransaction(data: RecurringTransaction | Omit<RecurringTransaction, 'id'>) {
    // Check if this is form data (which won't have user_id) or direct data
    const isFormData = !('user_id' in data);

    let userId: string;
    let type = data.type;
    let accountType = data.account_type;
    let frequency = (data as any).frequency || (data as any).schedule_type;

    if (isFormData) {
      // User ID must be provided - Clerk handles authentication at the component level
      throw new Error('User ID is required. This method should be called with user_id already set.');
    } else {
      userId = (data as RecurringTransaction).user_id;
    }

    // Destructure to remove id field and create a new object without it
    const { id, ...dataWithoutId } = data as any;

    const recurringData = {
      ...dataWithoutId,
      user_id: userId,
      type: type,
      account_type: accountType,
      frequency: frequency,
      category_id: typeof data.category_id === 'string' ? parseInt(data.category_id) : (data.category_id || 1),
      start_date: formatDateToISO(data.start_date),
      end_date: data.end_date ? formatDateToISO(data.end_date) : null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };

    const { data: recurringTransaction, error } = await this.supabase
      .from('recurring_transactions')
      .insert(recurringData)
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring transaction:', error);
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Invalid category selected');
      }
      throw error;
    }

    return recurringTransaction;
  }

  async createCombinedTransaction(formData: TransactionFormData, userId: string) {
    try {
      // Create the basic transaction data
      const transactionData: TransactionData = {
        user_id: userId,
        name: formData.name,
        amount: formData.amount,
        type: formData.type,
        account_type: formData.account_type,
        category_id: formData.category_id,
        description: formData.description,
        date: formatDateToISO(formData.date),
        recurring_frequency: formData.schedule_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create the transaction
      const transaction = await this.createTransaction(transactionData);

      // If it's a recurring transaction (not one-time), also create a recurring transaction entry
      if (formData.schedule_type !== 'Never') {
        const recurringData: Omit<RecurringTransaction, 'id'> = {
          user_id: userId,
          name: formData.name,
          amount: formData.amount,
          type: formData.type,
          account_type: formData.account_type,
          category_id: formData.category_id,
          description: formData.description,
          frequency: formData.schedule_type,
          start_date: formatDateToISO(formData.start_date || formData.date),
          end_date: formData.end_date ? formatDateToISO(formData.end_date) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const recurringTransaction = await this.createRecurringTransaction(recurringData);
        
        return {
          transaction,
          recurringTransaction
        };
      }

      return { transaction };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create transaction');
    }
  }

  async updateTransaction(id: number, data: UpdateTransaction) {
    if (!id) throw new Error("Transaction ID is required");

    // Format dates if present
    const formattedData = {
      ...data,
      date: data.date ? formatDateToISO(data.date) : undefined,
      updated_at: new Date().toISOString()
    };

    const { data: transaction, error } = await this.supabase
      .from("transactions")
      .update(formattedData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return transaction;
  }

  async updateRecurringTransaction(id: number, data: UpdateRecurringTransaction, userId: string | number) {
    // Format date fields to ensure they're strings
    const formattedData: Record<string, any> = { ...data };
    
    // Format start_date if present
    if (formattedData.start_date !== undefined) {
      formattedData.start_date = formatDateToISO(formattedData.start_date);
    }
    
    // Format end_date if present and not null
    if (formattedData.end_date !== undefined && formattedData.end_date !== null) {
      formattedData.end_date = formatDateToISO(formattedData.end_date);
    }
    
    const { data: recurringTransaction, error } = await this.supabase
      .from('recurring_transactions')
      .update(formattedData)
      .eq('id', id)
      .eq('user_id', userId.toString())
      .select()
      .single();

    if (error) throw error;
    
    // No need to regenerate upcoming transactions as they're now calculated on-demand
    
    return recurringTransaction;
  }

  async deleteTransaction(id: number, userId: string) {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async deleteRecurringTransaction(id: number, userId: string | number) {
    const { error } = await this.supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId.toString())

    if (error) throw error
  }

  async getTransactions(userId: string, dateRange?: { from: Date; to: Date }) {
    let query = this.supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getRecurringTransactions(userId: string | number) {
    const userIdAsString = userId.toString();
    
    // Use proper parameterized query to prevent SQL injection
    // Try string first (for proper UUID format), then fallback to number if needed for backward compatibility
    const { data, error } = await this.supabase
      .from('recurring_transactions')
      .select('*, categories(name)')
      .eq('user_id', userIdAsString)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Generates actual transactions from recurring transactions that are due (today or past)
   */
  async generateDueTransactions(
    userId: string | number, 
    recurringTransactions?: RecurringTransaction[]
  ): Promise<Transaction[]> {
    if (!userId) {
      console.error('Cannot generate due transactions: userId is null or undefined')
      return []
    }

    try {
      const transactions = recurringTransactions || await this.getRecurringTransactions(userId)
      if (!transactions?.length) return []
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const createdTransactions: Transaction[] = []
      
      for (const rt of transactions) {
        const startDate = new Date(rt.start_date)
        const endDate = rt.end_date ? new Date(rt.end_date) : undefined
        
        if (startDate > today) continue
        if (endDate && endDate < today) continue
        
        const dueDate = getMostRecentDueDate(startDate, rt.frequency, today)
        if (!dueDate || dueDate > today) continue
        
        const dateStr = formatDateToISO(dueDate)
        
        // Check if transaction already exists
        const { data: existing, error: checkError } = await this.supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId.toString())
          .eq('date', dateStr)
          .eq('name', rt.name)
          .eq('amount', rt.amount)
          .limit(1)
          
        if (checkError) {
          console.error('Error checking for existing transaction:', checkError)
          continue
        }
        
        if (existing?.length) continue
        
        const transactionData = buildTransactionFromRecurring(rt, dueDate, userId.toString())
        
        const { data: newTransaction, error: insertError } = await this.supabase
          .from('transactions')
          .insert(transactionData)
          .select()
          .single()
          
        if (insertError) {
          console.error('Error creating transaction from recurring:', insertError)
          continue
        }
        
        if (newTransaction) {
          createdTransactions.push(newTransaction as Transaction)
        }
      }
      
      return createdTransactions
    } catch (error) {
      console.error('Error generating due transactions:', error)
      throw error
    }
  }

  /**
   * Predicts upcoming transactions based on recurring transactions
   */
  async predictUpcomingTransactions(
    userId: string | number, 
    recurringTransactions?: RecurringTransaction[], 
    count: number = 2
  ) {
    if (!userId) {
      console.error('Cannot predict upcoming transactions: userId is null or undefined')
      return []
    }

    try {
      const transactions = recurringTransactions || await this.getRecurringTransactions(userId)
      if (!transactions?.length) return []
      
      const predictedTransactions: ReturnType<typeof buildPredictedTransaction>[] = []
      
      for (const rt of transactions) {
        const startDate = new Date(rt.start_date)
        const endDate = rt.end_date ? new Date(rt.end_date) : undefined
        
        const nextDates = getNextDates(startDate, rt.frequency, count, endDate)
        
        nextDates.forEach((date, index) => {
          predictedTransactions.push(buildPredictedTransaction(rt, date, index))
        })
      }
      
      return predictedTransactions.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    } catch (error) {
      console.error('Error predicting upcoming transactions:', error)
      throw error
    }
  }
}

/**
 * Factory function to create a TransactionService instance
 * 
 * Usage:
 * ```typescript
 * const supabase = useSupabaseClient() // From '@utils/supabase/client'
 * const service = createTransactionService(supabase)
 * ```
 */
export const createTransactionService = (supabaseClient: SupabaseClient) => {
  return new TransactionService(supabaseClient);
}

/**
 * @deprecated Use createTransactionService with authenticated client instead
 * This singleton uses an unauthenticated client and will fail with RLS policies
 */
const transactionService = null;

export { transactionService };
export default TransactionService;
