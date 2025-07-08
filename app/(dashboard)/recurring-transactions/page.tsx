"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Menu } from 'lucide-react';
import { toast } from "sonner";

import { DateRangePickerWithRange } from '@/components/app/date-range-picker';
import { RecurringTransactionDialog } from '@/components/app/transaction-dialogs/recurring-transactions/recurring-transaction-dialog';
import { TransactionsTable } from '@/components/app/tables/transactions-table';
import { DateRange } from "react-day-picker";
import { Transaction, RecurringTransaction } from "@/app/types/transaction";

// Import upcoming transactions table
import { UpcomingTransactionsTable } from '@/components/app/upcoming-transactions/upcoming-transactions-table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use hooks instead of Redux
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';
import { useCache } from '@/context/cache-context';

export default function RecurringTransactionsPage() {
  // Use custom hooks for data
  const {
    recurringTransactions,
    loading,
    refresh,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    bulkDeleteRecurringTransactions,
    bulkUpdateRecurringTransactions
  } = useRecurringTransactions();

  // Use cache context for UI state
  const { state, setDateRange } = useCache();
  
  // Local state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditRecurringTransactionOpen, setIsEditRecurringTransactionOpen] = useState(false);
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null);

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true);
  }, []);

  // Listen for header events
  useEffect(() => {
    // Handle add recurring transaction button click from header
    const handleHeaderAddRecurringTransaction = () => {
      setIsAddTransactionOpen(true);
    };

    // Add event listeners
    window.addEventListener('header:addrecurringtransaction', handleHeaderAddRecurringTransaction);

    // Clean up event listeners
    return () => {
      window.removeEventListener('header:addrecurringtransaction', handleHeaderAddRecurringTransaction);
    };
  }, []);

  const handleAddSuccess = useCallback(async (formData: any) => {
    try {
      // The dialog handles creation via transactionService
      // We just need to refresh the list and close dialog
      setIsAddTransactionOpen(false);
      // Force refresh of the hook data
      await refresh();
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  }, [refresh]);

  // Edit success is now handled directly by the dialog component
  
  const handleDeleteRecurringTransaction = useCallback(async (id: number) => {
    try {
      await deleteRecurringTransaction(id);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }, [deleteRecurringTransaction]);

  // Handle bulk delete for recurring transactions
  const handleBulkDelete = useCallback(async (ids: number[]) => {
    try {
      await bulkDeleteRecurringTransactions(ids);
    } catch (error) {
      console.error('Error deleting recurring transactions:', error);
    }
  }, [bulkDeleteRecurringTransactions]);

  // Handle bulk edit for recurring transactions
  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<Transaction>) => {
    try {
      await bulkUpdateRecurringTransactions(ids, changes);
    } catch (error) {
      console.error('Error updating recurring transactions:', error);
    }
  }, [bulkUpdateRecurringTransactions]);

  // Handle direct table edit for recurring transactions
  const handleTableEdit = useCallback(async (id: number, formData: Partial<Transaction>) => {
    try {
      await updateRecurringTransaction(id, formData);
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
    }
  }, [updateRecurringTransaction]);

  // Handle opening edit dialog for more complex edits
  const handleOpenEditDialog = useCallback((id: number, data: Partial<Transaction>) => {
    // Find the recurring transaction
    const recurringTransaction = recurringTransactions.find((rt: any) => rt.id === id);
    
    if (recurringTransaction) {
      // Open the edit dialog with the transaction data
      setEditingRecurringTransaction(recurringTransaction);
      setIsEditRecurringTransactionOpen(true);
    } else {
      toast.error("Could not find the recurring transaction");
    }
  }, [recurringTransactions]);

  return (
    <div className="h-full flex flex-col">
      <div className="container h-full flex flex-col mx-auto px-4 py-8 space-y-8">
        {/* Spacer for layout consistency */}
        <div className="mb-4"></div>
        {/* Recurring Transactions Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Recurring Transactions</h2>
            <TransactionsTable
              loading={loading}
              data={recurringTransactions.map((rt: any) => ({
                id: rt.id?.toString() || '', // Convert ID to string and handle undefined case
                user_id: rt.user_id?.toString() || '', // Also convert user_id to string
                date: rt.start_date, // Map start_date to date for filtering
                start_date: rt.start_date, // Include start_date for recurring transactions
                end_date: rt.end_date,
                amount: rt.amount,
                name: rt.name,
                description: rt.description,
                type: rt.type,
                account_type: rt.account_type,
                category_id: rt.category_id,
                category_name: rt.category_name,
                recurring_frequency: rt.frequency, // Use frequency from RecurringTransaction
                created_at: rt.created_at,
                updated_at: rt.updated_at
              }) as any)}
              showFilters={true}
              showPagination={true}
              showRowsCount={true}  
              itemsPerPage={10}
              sortBy={{
                field: "date",
                order: "desc"
              }}
              className="h-full"
              dateRange={state.dateRange as DateRange | undefined}
              type="recurring"
              onDelete={handleDeleteRecurringTransaction}
              onBulkDelete={handleBulkDelete}
              onEdit={handleTableEdit}
              onBulkEdit={handleBulkEdit}
            />
        </div>

        {/* Upcoming Transactions Section */}
        <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Transactions</h2> 
            <UpcomingTransactionsTable limit={10} />
        </div>
      </div>

      <RecurringTransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleAddSuccess}
        onRefresh={refresh}
        mode="create"
      />

      {/* Edit Recurring Transaction Dialog */}
      <RecurringTransactionDialog
        isOpen={isEditRecurringTransactionOpen}
        onClose={() => {
          setIsEditRecurringTransactionOpen(false);
          setEditingRecurringTransaction(null);
        }}
        onRefresh={refresh}
        initialData={editingRecurringTransaction as any}
        mode="edit"
      />
    </div>
  )
}