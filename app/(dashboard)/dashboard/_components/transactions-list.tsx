"use client"

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from 'lucide-react'
import { formatCurrency } from "@/utils/format"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  name: string
  amount: number
  type: 'Income' | 'Expense'
  date: string
  category_name: string | null
}

interface TransactionsListProps {
  transactions: Transaction[]
  isLoading: boolean
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === 'Income'
  
  return (
    <div className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 rounded-md transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{transaction.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(transaction.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
            })}
            {transaction.category_name && ` · ${transaction.category_name}`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <span className={`text-sm font-medium tabular-nums ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  )
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-200" />
          <Skeleton className="h-3 w-48 bg-gray-200" />
        </div>
      </div>
      <Skeleton className="h-4 w-20 bg-gray-200" />
    </div>
  )
}

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  const displayTransactions = transactions.slice(0, 6)
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-gray-600 hover:text-gray-900 hover:bg-transparent -mr-2"
        >
          <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium">
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className="px-6 py-2">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        ) : displayTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
