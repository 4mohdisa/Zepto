'use client'

import { Button } from "@/components/ui/button"
import { TransactionsTable } from "@/components/app/transactions/table"
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import { UpdateTransaction } from '@/app/types/transaction'
import Link from 'next/link'

interface Transaction {
  id: string
  user_id: string
  name: string
  amount: number
  type: 'Income' | 'Expense'
  date: string
  category_name: string | null
  category_id: number | null
  description: string | null
  account_type: string | null
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  isLoading: boolean
  onDelete: (id: number) => Promise<void>
  onBulkDelete: (ids: number[]) => Promise<void>
  onEdit: (id: number, data: Partial<UpdateTransaction>) => Promise<void>
  onBulkEdit: (ids: number[], changes: Partial<UpdateTransaction>) => Promise<void>
}

export function RecentTransactions({
  transactions,
  isLoading,
  onDelete,
  onBulkDelete,
  onEdit,
  onBulkEdit,
}: RecentTransactionsProps) {
  return (
    <section className="space-y-4 md:space-y-6 w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Recent Transactions</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Your latest financial activity</p>
        </div>
        <Button 
          variant="outline" 
          asChild
          size="default"
          className="border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow transition-all whitespace-nowrap"
        >
          <Link href="/transactions">View All Transactions</Link>
        </Button>
      </div>
      
      {/* Transactions Table */}
      <div className="w-full">
        <ErrorBoundaryWrapper>
          <TransactionsTable
            data={transactions as any}
            loading={isLoading}
            showFilters={false}
            showPagination={false}
            showRowsCount={false}
            itemsPerPage={7}
            sortBy={{
              field: "date",
              order: "desc"
            }}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
            onEdit={onEdit}
            onBulkEdit={onBulkEdit}
          />
        </ErrorBoundaryWrapper>
      </div>
    </section>
  )
}
