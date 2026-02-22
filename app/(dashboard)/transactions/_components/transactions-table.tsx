'use client'

import { useEffect, useRef } from 'react'
import { formatCurrency } from '@/utils/format'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface Transaction {
  id: number
  date: string
  name: string
  description: string | null
  amount: number
  type: 'Income' | 'Expense'
  account_type: string
  categories: { id: number; name: string } | null
}

interface TransactionsTableProps {
  transactions: Transaction[]
  loading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  selectedIds: Set<number>
  onToggleSelection: (id: number) => void
  onSelectAll: () => void
  allSelected: boolean
  someSelected: boolean
}

export function TransactionsTable({
  transactions,
  loading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  allSelected,
  someSelected,
}: TransactionsTableProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  // Empty states
  if (!loading && transactions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or add a new transaction
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLInputElement).indeterminate = someSelected && !allSelected
                    }
                  }}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(transaction.id)}
                    onCheckedChange={() => onToggleSelection(transaction.id)}
                  />
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[200px]">
                    <p className="text-sm font-medium truncate" title={transaction.name}>
                      {transaction.name}
                    </p>
                    {transaction.description && (
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={transaction.description}
                      >
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {transaction.categories?.name || 'Uncategorized'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'Income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    transaction.type === 'Income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading indicator / Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {!hasNextPage && transactions.length > 0 && (
          <span className="text-sm text-muted-foreground">No more transactions</span>
        )}
      </div>
    </div>
  )
}
