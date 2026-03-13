'use client'

import { useEffect, useRef, useCallback, memo } from 'react'
import { formatCurrency } from '@/lib/utils/format'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Transaction {
  id: number
  date: string
  name: string
  description: string | null
  amount: number
  type: 'Income' | 'Expense'
  account_type: string
  categories: { id: number; name: string } | null
  category_id: number | null
  category_name?: string | null
  merchant_id: string | null
  merchants: { id: string; merchant_name: string } | null
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
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}

// Category badge component with consistent styling
// Uses joined category data first, falls back to category_name field, then 'Uncategorized'
function CategoryBadge({ 
  category,
  categoryName 
}: { 
  category: { id: number; name: string } | null | undefined
  categoryName?: string | null
}) {
  // Priority: 1. Joined category name, 2. Denormalized category_name field, 3. Uncategorized
  const name = category?.name || categoryName || 'Uncategorized'
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium rounded-md px-2 py-1 max-w-full",
        "bg-gray-50 text-gray-700 border-gray-200",
        "hover:bg-gray-100 transition-colors"
      )}
      title={name}
    >
      <span className="truncate max-w-[100px] inline-block">{name}</span>
    </Badge>
  )
}

// Merchant badge component with consistent styling
function MerchantBadge({ merchant }: { merchant: { id: string; merchant_name: string } | null | undefined }) {
  const name = merchant?.merchant_name
  
  if (!name) {
    return (
      <span className="text-xs text-gray-400 italic">-</span>
    )
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium rounded-md px-2 py-1 max-w-full",
        "bg-blue-50 text-blue-700 border-blue-200",
        "hover:bg-blue-100 transition-colors"
      )}
      title={name}
    >
      <span className="truncate max-w-[100px] inline-block">{name}</span>
    </Badge>
  )
}

// Type badge component
function TypeBadge({ type }: { type: 'Income' | 'Expense' }) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "text-xs font-medium rounded-full px-2 py-0.5",
        type === 'Income' 
          ? "bg-green-100 text-green-700 border-green-200" 
          : "bg-red-100 text-red-700 border-red-200"
      )}
    >
      {type === 'Income' ? 'In' : 'Ex'}
    </Badge>
  )
}

// Memoized table row component to prevent unnecessary re-renders
const TransactionRow = memo(function TransactionRow({
  transaction,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
}: {
  transaction: Transaction
  isSelected: boolean
  onToggleSelection: (id: number) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}) {
  const handleEdit = useCallback(() => {
    onEdit?.(transaction)
  }, [onEdit, transaction])

  const handleDelete = useCallback(() => {
    onDelete?.(transaction)
  }, [onDelete, transaction])

  // Handle row click - open edit dialog, but not when clicking checkbox or actions
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger edit if clicking checkbox, action button, or dropdown
    const target = e.target as HTMLElement
    if (
      target.closest('button') || 
      target.closest('[role="checkbox"]') || 
      target.closest('[data-dropdown]')
    ) {
      return
    }
    onEdit?.(transaction)
  }, [onEdit, transaction])

  return (
    <tr 
      onClick={handleRowClick}
      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer"
    >
      <td className="px-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(transaction.id)}
          aria-label={`Select transaction ${transaction.name}`}
        />
      </td>
      <td className="px-3 py-3 text-sm whitespace-nowrap w-28 text-gray-600">
        {format(new Date(transaction.date), 'MMM d, yyyy')}
      </td>
      <td className="px-3 py-3 w-[35%] min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-gray-900" title={transaction.name}>
            {transaction.name}
          </p>
          {transaction.description && (
            <p
              className="text-xs text-gray-500 truncate hidden sm:block"
              title={transaction.description}
            >
              {transaction.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-3 py-3 w-28">
        <CategoryBadge 
          category={transaction.categories} 
          categoryName={transaction.category_name}
        />
      </td>
      <td className="px-3 py-3 w-28">
        <MerchantBadge merchant={transaction.merchants} />
      </td>
      <td className={cn(
        "px-3 py-3 text-sm text-right font-medium whitespace-nowrap w-28 font-mono",
        transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
      )}>
        {transaction.type === 'Income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </td>
      <td className="px-3 py-3 text-center w-16">
        <TypeBadge type={transaction.type} />
      </td>
      <td className="px-3 py-3 text-right w-14" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Open actions menu"
              data-dropdown
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
})

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
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Only trigger if element is intersecting, has next page, and not already fetching
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  // Show skeleton while loading initial data - prevent empty flash
  if (loading && transactions.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-10 px-3 py-3"><Skeleton className="h-4 w-4" /></th>
              <th className="px-3 py-3 w-28"><Skeleton className="h-4 w-16" /></th>
              <th className="px-3 py-3 w-[35%]"><Skeleton className="h-4 w-20" /></th>
              <th className="px-3 py-3 w-28"><Skeleton className="h-4 w-16" /></th>
              <th className="px-3 py-3 w-28"><Skeleton className="h-4 w-16" /></th>
              <th className="px-3 py-3 w-28"><Skeleton className="h-4 w-16" /></th>
              <th className="px-3 py-3 w-16"><Skeleton className="h-4 w-12" /></th>
              <th className="px-3 py-3 w-14"><Skeleton className="h-4 w-8" /></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-8" /></td>
                <td className="px-3 py-3"><Skeleton className="h-4 w-8" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Empty state - only show when not loading and no data
  if (!loading && transactions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or add a new transaction
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white animate-fade-in">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="w-10 px-3 py-3">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLInputElement).indeterminate = someSelected && !allSelected
                  }
                }}
                onCheckedChange={onSelectAll}
                aria-label="Select all transactions"
              />
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-28">Date</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-[35%]">Name</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-28">Category</th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 w-28">Merchant</th>
            <th className="px-3 py-3 text-right text-sm font-medium text-gray-700 w-28">Amount</th>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 w-16">Type</th>
            <th className="px-3 py-3 text-right text-sm font-medium text-gray-700 w-14">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedIds.has(transaction.id)}
              onToggleSelection={onToggleSelection}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>

      {/* Load more trigger - only render if there's potentially more data */}
      <div ref={loadMoreRef} className="py-4 text-center border-t">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        ) : !hasNextPage && transactions.length > 0 ? (
          <span className="text-sm text-muted-foreground">No more transactions</span>
        ) : null}
      </div>
    </div>
  )
}
