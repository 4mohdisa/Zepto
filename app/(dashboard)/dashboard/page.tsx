'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, Plus, Menu, CreditCard, PieChart } from 'lucide-react'
import { MetricsCards } from "@/components/app/metrics-cards"
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartSkeleton, PageSkeleton } from "@/components/ui/loading-skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Dynamic imports for charts to improve performance
import dynamic from 'next/dynamic'

import { DateRange } from "react-day-picker"
import { startOfMonth, endOfMonth, format, isFirstDayOfMonth } from "date-fns"

// Enhanced chart loading placeholder component
function ChartPlaceholder() {
  return (
    <div className="h-[300px] w-full">
      <ChartSkeleton />
    </div>
  )
}

// Dynamic chart imports with loading states
const SpendingChart = dynamic(() => import('@/components/app/charts/bar-chart-multiple').then(mod => ({ default: mod.SpendingChart })), {
  loading: () => <ChartPlaceholder />,
  ssr: false
})

const PieDonutChart = dynamic(() => import('@/components/app/charts/pie-donut-chart').then(mod => ({ default: mod.PieDonutChart })), {
  loading: () => <ChartPlaceholder />,
  ssr: false
})

const TransactionChart = dynamic(() => import('@/components/app/charts/bar-chart-interactive').then(mod => ({ default: mod.TransactionChart })), {
  loading: () => <ChartPlaceholder />,
  ssr: false
})

const NetBalanceChart = dynamic(() => import('@/components/app/charts/line-chart').then(mod => ({ default: mod.NetBalanceChart })), {
  loading: () => <ChartPlaceholder />,
  ssr: false
})
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Transaction, UpdateTransaction } from '@/app/types/transaction'
import { BalanceDialog } from "@/components/app/balance-dialog"
import { TransactionDialog } from "@/components/app/transaction-dialogs/transactions/transaction-dialog"
import { UploadDialog } from "@/components/app/upload-dialog"
import { transactionService } from '@/app/services/transaction-services'
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MonthPicker } from '@/components/app/month-picker'
import { useTransactions } from '@/hooks/use-transactions'

// Define default date range outside the component
const defaultDateRange = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [isEditingBalance, setIsEditingBalance] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange)
  const { 
    transactions: transactionsList, 
    loading: isLoading, 
    error, 
    refresh: refreshTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    bulkUpdateTransactions
  } = useTransactions(dateRange)
  const [processingDueTransactions, setProcessingDueTransactions] = useState(false)

  const handleAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(true)
  }, [])

  const handleUploadFile = useCallback(() => {
    setIsUploadFileOpen(true)
  }, [])

  const handleAddBalance = useCallback(() => {
    setIsBalanceDialogOpen(true)
  }, [])

  const handleDateRangeChange = useCallback((newDateRange: DateRange | undefined) => {
    if (newDateRange?.from && newDateRange?.to) {
      const from = startOfMonth(newDateRange.from)
      const to = endOfMonth(newDateRange.from)
      setDateRange({ from, to })
    }
  }, [])

  // Process any due recurring transactions and convert them to actual transactions
  useEffect(() => {
    const generateDueTransactions = async () => {
      if (!user) return;
      
      try {
        setProcessingDueTransactions(true);
        
        // Generate transactions from any due recurring transactions
        const generatedTransactions = await transactionService.generateDueTransactions(user.id);
        
        if (generatedTransactions && generatedTransactions.length > 0) {
          toast.success(`${generatedTransactions.length} transaction(s) generated from recurring schedules`);
          
          // Refresh the transactions list to include the newly created transactions
          refreshTransactions();
        }
      } catch (error) {
        console.error('Error generating due transactions:', error);
        toast.error('Failed to process recurring transactions');
      } finally {
        setProcessingDueTransactions(false);
      }
    };
    
    generateDueTransactions();
  }, [user, refreshTransactions]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
    // Update the date range to filter transactions for the selected month
    const newDateRange = {
      from: startOfMonth(date),
      to: endOfMonth(date)
    }
    setDateRange(newDateRange)
  }, [])

  const isAddBalanceVisible = isFirstDayOfMonth(new Date()) // This is a simplified check. You might want to implement more sophisticated logic.

  const handleTransactionSubmit = async (data: any) => {
    try {
      if (!user) {
        return;
      }

      if (data.transactionType === "regular") {
        // Prepare the transaction data with user_id
        const transactionData = {
          ...data,
          user_id: user.id
        };
        await transactionService.createTransaction(transactionData);
      } else {
        // Use the createCombinedTransaction method which takes userId as a separate parameter
        await transactionService.createCombinedTransaction(data, user.id);
      }

    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  }

  const handleDeleteTransaction = useCallback(async (id: number) => {
    try {
      await deleteTransaction(id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }, [deleteTransaction])

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    try {
      await bulkDeleteTransactions(ids)
    } catch (error) {
      console.error('Error deleting transactions:', error)
    }
  }, [bulkDeleteTransactions])

  const handleEditTransaction = useCallback(async (id: number, formData: Partial<UpdateTransaction>) => {
    try {
      // Format the date if it's a Date object
      const formattedData = {
        ...formData,
        date: formData.date instanceof Date ? format(formData.date, 'yyyy-MM-dd') : formData.date
      };
      
      await updateTransaction(id, formattedData)
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }, [updateTransaction])

  const handleBulkEdit = useCallback(async (ids: number[], changes: Partial<UpdateTransaction>) => {
    try {
      // Format dates in the changes object if needed
      const formattedChanges = {
        ...changes,
        date: changes.date instanceof Date ? format(changes.date, 'yyyy-MM-dd') : changes.date
      };
      
      await bulkUpdateTransactions(ids, formattedChanges)
    } catch (error) {
      console.error('Error updating transactions:', error)
    }
  }, [bulkUpdateTransactions])

  const dateRangeValue = useMemo(() => dateRange ?? defaultDateRange, [dateRange])

  // Show full page loading when initially loading
  if (isLoading && (!transactionsList || transactionsList.length === 0)) {
    return <PageSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Hi {user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'}</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s your financial overview.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <MonthPicker
              date={selectedDate}
              onDateChange={handleDateChange} 
            />
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <div className="md:hidden w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="w-full">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsAddTransactionOpen(true)}>
                      Add Transaction
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleUploadFile}>
                      Upload File
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleAddBalance}>
                      Add Balance
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="hidden md:flex gap-3">
                <Button 
                  onClick={() => setIsAddTransactionOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
                <Button onClick={handleUploadFile} variant="outline" className="shadow-sm">
                  <Upload className="mr-2 h-4 w-4" /> 
                  Upload File
                </Button>
                <Button onClick={handleAddBalance} variant="secondary" className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" /> 
                  Add Balance
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* KPI Cards Section */}
          <section>
            <ErrorBoundaryWrapper>
              <MetricsCards 
                transactions={transactionsList?.map(t => ({
                  amount: Number(t.amount),
                  type: t.type,
                  category_name: t.category_name,
                  date: t.date
                })) || []}
                isLoading={isLoading}
              />
            </ErrorBoundaryWrapper>
          </section>

          {/* Charts Section */}
          {!transactionsList || transactionsList.length === 0 ? (
            <section className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-lg">
                <PieChart className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">No Transactions Yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Start by adding your first transaction to see beautiful charts and insights about your finances.
              </p>
              <Button 
                onClick={() => setIsAddTransactionOpen(true)}
                size="lg"
                className="shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Transaction
              </Button>
            </section>
          ) : (
            <>
              {/* Primary Charts */}
              <section className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Main Transaction Chart */}
                  <div className="xl:col-span-2">
                    <ErrorBoundaryWrapper>
                      <Suspense fallback={<ChartSkeleton />}>
                        <TransactionChart 
                          transactions={transactionsList?.map(t => ({
                            date: typeof t.date === 'string' ? t.date : format(t.date, 'yyyy-MM-dd'),
                            amount: Number(t.amount),
                            type: t.type,
                            category_name: t.category_name
                          })) || []}
                          metrics={[
                            { key: "Income", label: "Income", color: "hsl(var(--chart-1))" },
                            { key: "Expense", label: "Expense", color: "hsl(var(--chart-2))" }
                          ]}
                        />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>

                  {/* Category Breakdown */}
                  <div>
                    <ErrorBoundaryWrapper>
                      <Suspense fallback={<ChartSkeleton />}>
                        <PieDonutChart 
                          transactions={transactionsList?.map(t => ({
                            category_name: t.category_name,
                            amount: Number(t.amount),
                            type: t.type
                          })) || []}
                        />
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </div>
                </div>

                {/* Secondary Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ErrorBoundaryWrapper>
                    <Suspense fallback={<ChartSkeleton />}>
                      <NetBalanceChart 
                        transactions={transactionsList?.map(t => ({
                          date: typeof t.date === 'string' ? t.date : format(t.date, 'yyyy-MM-dd'),
                          amount: Number(t.amount),
                          type: t.type
                        })) || []}
                      />
                    </Suspense>
                  </ErrorBoundaryWrapper>

                  <ErrorBoundaryWrapper>
                    <Suspense fallback={<ChartSkeleton />}>
                      <SpendingChart 
                        transactions={transactionsList?.map(t => ({
                          date: typeof t.date === 'string' ? t.date : format(t.date, 'yyyy-MM-dd'),
                          amount: Number(t.amount),
                          type: t.type
                        })) || []}
                      />
                    </Suspense>
                  </ErrorBoundaryWrapper>
                </div>
              </section>
            </>
          )}

          {/* Recent Transactions Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Recent Transactions</h2>
                <p className="text-muted-foreground mt-1">Your latest financial activity</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/transactions'}
                className="shadow-sm"
              >
                View All Transactions
              </Button>
            </div>
            
            <ErrorBoundaryWrapper>
              <TransactionsTable
                data={transactionsList?.slice(0, 7).map(t => ({
                  ...t,
                  id: t.id?.toString() || '',
                  user_id: t.user_id?.toString() || '',
                  date: typeof t.date === 'string' ? t.date : (t.date ? format(t.date, 'yyyy-MM-dd') : ''),
                  type: t.type === 'Income' ? 'Income' : 'Expense'
                })) as any}
                loading={isLoading}
                showFilters={false}
                showPagination={false}
                showRowsCount={false}
                itemsPerPage={7}
                sortBy={{
                  field: "date",
                  order: "desc"
                }}
                onDelete={handleDeleteTransaction}
                onBulkDelete={handleBulkDelete}
                onEdit={handleEditTransaction}
                onBulkEdit={handleBulkEdit}
              />
            </ErrorBoundaryWrapper>
          </section>
        </div>
      </div>

      <BalanceDialog
        open={isBalanceDialogOpen}
        onOpenChange={setIsBalanceDialogOpen} />

      <TransactionDialog
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSubmit={handleTransactionSubmit}
        mode="create" />

      <UploadDialog
        open={isUploadFileOpen}
        onOpenChange={setIsUploadFileOpen} />
    </div>
  )
}

