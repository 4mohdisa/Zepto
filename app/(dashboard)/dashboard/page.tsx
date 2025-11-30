'use client'

import { useState, useCallback } from 'react'
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth } from "date-fns"

// Context & Hooks
import { useAuth } from '@/context/auth-context'
import { useTransactions } from '@/hooks/use-transactions'
import { useDashboardData, useDashboardActions } from './_hooks'

// Components
import { PageSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import { MetricsCards } from "@/components/app/dashboard/metrics-cards"
import { BalanceDialog } from "@/components/app/dialogs/balance-dialog"
import { TransactionDialog } from "@/components/app/transactions/transaction-dialog"
import { UploadDialog } from "@/components/app/dialogs/upload-dialog"

// Local Components
import { 
  DashboardHeader, 
  DashboardCharts, 
  RecentTransactions, 
  EmptyState 
} from './_components'

const DEFAULT_DATE_RANGE = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
}

export default function DashboardPage() {
  const { user } = useAuth()
  
  // Dialog states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  
  // Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange | undefined>(DEFAULT_DATE_RANGE)
  
  // Fetch transactions
  const { 
    transactions: transactionsList, 
    loading: isLoading, 
    refresh: refreshTransactions,
    deleteTransaction,
    updateTransaction,
    bulkDeleteTransactions,
    bulkUpdateTransactions
  } = useTransactions(dateRange)

  // Transform data for components
  const { chartTransactions, recentTransactions, hasTransactions } = useDashboardData(transactionsList)

  // Action handlers
  const {
    handleTransactionSubmit,
    handleDeleteTransaction,
    handleBulkDelete,
    handleEditTransaction,
    handleBulkEdit
  } = useDashboardActions({
    user,
    refreshTransactions,
    deleteTransaction,
    bulkDeleteTransactions,
    updateTransaction,
    bulkUpdateTransactions
  })

  // Date change handler
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
    setDateRange({
      from: startOfMonth(date),
      to: endOfMonth(date)
    })
  }, [])

  // Dialog handlers
  const openAddTransaction = useCallback(() => setIsAddTransactionOpen(true), [])
  const openUploadFile = useCallback(() => setIsUploadFileOpen(true), [])
  const openBalanceDialog = useCallback(() => setIsBalanceDialogOpen(true), [])

  // Get user display name
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  // Show loading skeleton on initial load
  if (isLoading && !hasTransactions) {
    return <PageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader
          userName={userName}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onAddTransaction={openAddTransaction}
          onUploadFile={openUploadFile}
          onAddBalance={openBalanceDialog}
        />

        <div className="space-y-8">
          {/* KPI Cards */}
          <section>
            <ErrorBoundaryWrapper>
              <MetricsCards 
                transactions={chartTransactions}
                isLoading={isLoading}
              />
            </ErrorBoundaryWrapper>
          </section>

          {/* Charts or Empty State */}
          {hasTransactions ? (
            <DashboardCharts transactions={chartTransactions} />
          ) : (
            <EmptyState onAddTransaction={openAddTransaction} />
          )}

          {/* Recent Transactions */}
          {hasTransactions && (
            <RecentTransactions
              transactions={recentTransactions}
              isLoading={isLoading}
              onDelete={handleDeleteTransaction}
              onBulkDelete={handleBulkDelete}
              onEdit={handleEditTransaction}
              onBulkEdit={handleBulkEdit}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <BalanceDialog
        open={isBalanceDialogOpen}
        onOpenChange={setIsBalanceDialogOpen}
      />

      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create"
      />

      <UploadDialog
        open={isUploadFileOpen}
        onOpenChange={setIsUploadFileOpen}
      />
    </div>
  )
}

