'use client'

import { useMemo } from 'react'
import { TransactionsTable } from '@/components/app/transactions/table'
import { DateRange } from "react-day-picker"
import { Transaction, RecurringTransaction } from "@/app/types/transaction"

interface RecurringTransactionsTableProps {
  recurringTransactions: RecurringTransaction[]
  loading: boolean
  dateRange?: DateRange
  onDelete: (id: number) => Promise<void>
  onBulkDelete: (ids: number[]) => Promise<void>
  onEdit: (id: number, data: Partial<Transaction>) => Promise<void>
  onBulkEdit: (ids: number[], changes: Partial<Transaction>) => Promise<void>
}

export function RecurringTransactionsTable({
  recurringTransactions,
  loading,
  dateRange,
  onDelete,
  onBulkDelete,
  onEdit,
  onBulkEdit,
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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Active Recurring Transactions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your recurring income and expenses
          </p>
        </div>
      </div>
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
    </section>
  )
}
