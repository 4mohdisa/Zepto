'use client'

import { TransactionsTable } from "@/components/app/transactions/table"
import { ErrorDisplay } from '@/components/ui/error-display'
import { DateRange } from "react-day-picker"
import { UpdateTransaction } from '@/app/types/transaction'

interface TransactionsContentProps {
  transactions: any[]
  loading: boolean
  error: Error | null
  dateRange?: DateRange
  onRefresh: () => void
  onDelete: (id: number) => Promise<void>
  onBulkDelete: (ids: number[]) => Promise<void>
  onEdit: (id: number, data: Partial<UpdateTransaction>) => Promise<void>
  onBulkEdit: (ids: number[], changes: Partial<UpdateTransaction>) => Promise<void>
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
}: TransactionsContentProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-border bg-card shadow-lg">
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
    <div className="space-y-4">
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
