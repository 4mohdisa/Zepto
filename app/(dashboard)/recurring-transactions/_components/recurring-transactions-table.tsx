'use client'

import { Button } from "@/components/ui/button"
import { TransactionsTable } from "@/components/app/transactions/table"
import { RecurringTransaction, Transaction } from "@/app/types/transaction"
import { DateRange } from "react-day-picker"
import { Plus } from 'lucide-react'

interface RecurringTransactionsTableProps {
  recurringTransactions: RecurringTransaction[]
  loading: boolean
  dateRange?: DateRange
  onDelete: (id: number | string) => Promise<void>
  onBulkDelete: (ids: (number | string)[]) => Promise<void>
  onEdit: (id: number | string, data: Partial<Transaction>) => Promise<void>
  onBulkEdit: (ids: (number | string)[], changes: Partial<Transaction>) => Promise<void>
  onAddRecurring: () => void
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
  return (
    <div className="w-full space-y-4">
      {/* Toolbar Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Active recurring</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your automated payments</p>
        </div>
        
        {/* Add Button */}
        <Button 
          onClick={onAddRecurring} 
          size="sm"
          className="bg-[#635BFF] hover:bg-[#5851EA] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> 
          Add recurring
        </Button>
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        showFilters={true}
        showPagination={true}
        showRowsCount={true}
        itemsPerPage={10}
        sortBy={{ field: "start_date", order: "desc" }}
        dateRange={dateRange}
        data={recurringTransactions as any}
        loading={loading}
        onDelete={onDelete}
        onBulkDelete={onBulkDelete}
        onEdit={onEdit}
        onBulkEdit={onBulkEdit}
        type="recurring"
      />
    </div>
  )
}
