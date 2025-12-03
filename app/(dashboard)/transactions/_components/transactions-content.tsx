'use client'

import { TransactionsTable } from "@/components/app/transactions/table"
import { ErrorDisplay } from '@/components/ui/error-display'
import { DateRange } from "react-day-picker"
import { UpdateTransaction } from '@/app/types/transaction'
import { Button } from '@/components/ui/button'
import { DateRangePickerWithRange } from '@/components/app/shared/date-range-picker'
import { Plus } from 'lucide-react'

interface TransactionsContentProps {
  transactions: any[]
  loading: boolean
  error: Error | null
  dateRange?: DateRange
  onRefresh: () => void
  onDelete: (id: number | string) => Promise<void>
  onBulkDelete: (ids: (number | string)[]) => Promise<void>
  onEdit: (id: number | string, data: Partial<UpdateTransaction>) => Promise<void>
  onBulkEdit: (ids: (number | string)[], changes: Partial<UpdateTransaction>) => Promise<void>
  onDateRangeChange?: (range: DateRange | undefined) => void
  onAddTransaction?: () => void
}

export function TransactionsContent({
  transactions,
  loading,
  error,
  dateRange,
  onRefresh,
  onDelete,
  onBulkDelete,
  onEdit,
  onBulkEdit,
  onDateRangeChange,
  onAddTransaction,
}: TransactionsContentProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-gray-200 bg-white shadow-lg">
        <ErrorDisplay 
          title="Failed to load transactions" 
          description="We couldn't load your transactions. Please try refreshing the page." 
          onRefresh={onRefresh}
          mode="inline"
        />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Date Range Picker */}
          {onDateRangeChange && (
            <DateRangePickerWithRange 
              dateRange={dateRange || undefined} 
              onDateRangeChange={onDateRangeChange} 
            />
          )}
        </div>
        
        {/* Add Transaction Button */}
        {onAddTransaction && (
          <Button 
            onClick={onAddTransaction} 
            size="default"
            className="bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> 
            Add Transaction
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        showFilters={true}
        showPagination={true}
        showRowsCount={true}
        itemsPerPage={10}
        sortBy={{ field: "date", order: "desc" }}
        dateRange={dateRange}
        data={transactions}
        loading={loading}
        onDelete={onDelete}
        onBulkDelete={onBulkDelete}
        onEdit={onEdit}
        onBulkEdit={onBulkEdit}
      />
    </div>
  )
}
