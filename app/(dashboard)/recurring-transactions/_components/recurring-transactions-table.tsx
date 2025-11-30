'use client'

import { useMemo } from 'react'
import { TransactionsTable } from '@/components/app/transactions/table'
import { Button } from '@/components/ui/button'
import { DateRange } from "react-day-picker"
import { Transaction, RecurringTransaction } from "@/app/types/transaction"
import { Plus } from 'lucide-react'

interface RecurringTransactionsTableProps {
  recurringTransactions: RecurringTransaction[]
  loading: boolean
  dateRange?: DateRange
  onDelete: (id: number) => Promise<void>
  onBulkDelete: (ids: number[]) => Promise<void>
  onEdit: (id: number, data: Partial<Transaction>) => Promise<void>
  onBulkEdit: (ids: number[], changes: Partial<Transaction>) => Promise<void>
  onAddRecurring?: () => void
}

export function RecurringTransactionsTable({
  recurringTransactions,
  loading,
  dateRange,
  onDelete,
  onBulkDelete,
  onEdit,
  onBulkEdit,
  onAddRecurring,
}: RecurringTransactionsTableProps) {
  // Transform recurring transactions to table format
  const tableData = useMemo(() => {
    return recurringTransactions.map((rt) => ({
      id: rt.id?.toString() || '',
      user_id: rt.user_id?.toString() || '',
      date: rt.start_date,
      start_date: rt.start_date,
      end_date: rt.end_date,
      amount: rt.amount,
      name: rt.name,
      description: rt.description,
      type: rt.type,
      account_type: rt.account_type,
      category_id: rt.category_id,
      category_name: rt.category_name,
      recurring_frequency: rt.frequency,
      created_at: rt.created_at,
      updated_at: rt.updated_at
    }))
  }, [recurringTransactions])

  return (
    <section className="space-y-4 md:space-y-6 w-full">
      {/* Section Header with Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-blue-600">
            Active Recurring Transactions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your recurring income and expenses
          </p>
        </div>
        
        {/* Add Recurring Transaction Button */}
        {onAddRecurring && (
          <Button 
            onClick={onAddRecurring} 
            size="default"
            className="bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap self-end sm:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> 
            Add Recurring
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="w-full">
        <TransactionsTable
          loading={loading}
          data={tableData as any}
          showFilters={true}
          showPagination={true}
          showRowsCount={true}
          itemsPerPage={10}
          sortBy={{
            field: "date",
            order: "desc"
          }}
          className="h-full"
          dateRange={dateRange}
          type="recurring"
          onDelete={onDelete}
          onBulkDelete={onBulkDelete}
          onEdit={onEdit}
          onBulkEdit={onBulkEdit}
        />
      </div>
    </section>
  )
}
