"use client"

import * as React from "react"
import { ArrowUpCircle, ArrowDownCircle, DollarSign, PieChart, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format"
import { cn } from "@/lib/utils"

interface Transaction {
  amount: number;
  type: string | null;
  category_name?: string | null;
  date?: string | Date;
  [key: string]: any;
}

interface MetricsCardsProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

interface MetricData {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

// Loading skeleton component
const MetricCardSkeleton = () => (
  <Card className="relative overflow-hidden border border-gray-200 bg-white shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20 bg-gray-200" />
          <Skeleton className="h-8 w-28 bg-gray-200" />
          <Skeleton className="h-3 w-24 bg-gray-200" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
      </div>
      {/* Mini chart skeleton */}
      <div className="mt-4 flex items-end space-x-1">
        {[...Array(12)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="bg-gray-200" 
            style={{ 
              height: `${Math.random() * 24 + 8}px`, 
              width: '3px' 
            }} 
          />
        ))}
      </div>
    </CardContent>
  </Card>
)

// Enhanced metric card component
const MetricCard = React.memo(({ 
  title, 
  value, 
  change, 
  changeType,
  icon: Icon, 
  color, 
  bgColor 
}: MetricData) => {
  const isPositive = changeType === 'increase'
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <Card className="relative overflow-hidden border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#635BFF]/30 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              {typeof value === 'number' && title !== 'Top Category' ? formatCurrency(value) : value}
            </p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center space-x-1 text-xs font-semibold",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                <ChangeIcon className="h-3.5 w-3.5" />
                <span>
                  {isPositive ? '+' : ''}{Math.abs(change).toFixed(1)}% from last month
                </span>
              </div>
            )}
          </div>
          
          {/* Icon with background */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-110",
            bgColor
          )}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
        </div>
        
        {/* Mini trend chart area */}
        <div className="h-10 flex items-end justify-between space-x-0.5">
          {[...Array(12)].map((_, i) => {
            const height = Math.random() * 32 + 8
            return (
              <div
                key={i}
                className="bg-gray-200 rounded-t transition-all duration-300 group-hover:bg-gray-300 flex-1"
                style={{ height: `${height}px` }}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})

MetricCard.displayName = 'MetricCard'

export const MetricsCards = React.memo(function MetricsCards({ 
  transactions = [], 
  isLoading = false 
}: MetricsCardsProps) {
  
  // Calculate real metrics from transaction data with trend analysis
  const metrics = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        topCategory: "None",
        incomeChange: 0,
        expensesChange: 0,
        balanceChange: 0,
      }
    }
    
    // Sort transactions by date for trend calculation
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date || '').getTime() - new Date(b.date || '').getTime()
    )
    
    // Current period calculations
    const income = transactions
      .filter((t: Transaction) => t.type === 'Income')
      .reduce((sum: number, t: Transaction) => sum + (parseFloat(String(t.amount)) || 0), 0)
      
    const expenses = transactions
      .filter((t: Transaction) => t.type === 'Expense')
      .reduce((sum: number, t: Transaction) => sum + (parseFloat(String(t.amount)) || 0), 0)
    
    // Calculate top category
    const categoryMap: Record<string, number> = {}
    transactions
      .filter((t: Transaction) => t.type === 'Expense')
      .forEach((t: Transaction) => {
        const category = t.category_name || 'Uncategorized'
        if (!categoryMap[category]) {
          categoryMap[category] = 0
        }
        categoryMap[category] += parseFloat(String(t.amount)) || 0
      })
    
    let topCategory = "None"
    let maxAmount = 0
    Object.entries(categoryMap).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount
        topCategory = category
      }
    })
    
    // Calculate actual percentage changes based on current vs previous period
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Get previous month's data for comparison
    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || '')
      const transactionMonth = transactionDate.getMonth()
      const transactionYear = transactionDate.getFullYear()
      
      if (currentMonth === 0) {
        // If current month is January, compare with December of previous year
        return transactionMonth === 11 && transactionYear === currentYear - 1
      } else {
        // Compare with previous month of same year
        return transactionMonth === currentMonth - 1 && transactionYear === currentYear
      }
    })
    
    const prevIncome = previousMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
      
    const prevExpenses = previousMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0)
    
    const prevBalance = prevIncome - prevExpenses
    
    // Calculate percentage changes (handle division by zero)
    const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : (income > 0 ? 100 : 0)
    const expensesChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : (expenses > 0 ? 100 : 0)
    const balanceChange = prevBalance !== 0 ? ((income - expenses - prevBalance) / Math.abs(prevBalance)) * 100 : 
                         (income - expenses > 0 ? 100 : (income - expenses < 0 ? -100 : 0))
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      topCategory,
      incomeChange,
      expensesChange,
      balanceChange,
    }
  }, [transactions])

  const cards: MetricData[] = React.useMemo(() => [
    { 
      title: "Total Income", 
      value: metrics.totalIncome, 
      change: metrics.incomeChange,
      changeType: metrics.incomeChange >= 0 ? 'increase' : 'decrease',
      icon: ArrowUpCircle, 
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      title: "Total Expenses", 
      value: metrics.totalExpenses, 
      change: metrics.expensesChange,
      changeType: metrics.expensesChange >= 0 ? 'increase' : 'decrease',
      icon: ArrowDownCircle, 
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    { 
      title: "Net Balance", 
      value: metrics.netBalance, 
      change: metrics.balanceChange,
      changeType: metrics.balanceChange >= 0 ? 'increase' : 'decrease',
      icon: DollarSign, 
      color: "text-[#635BFF]",
      bgColor: "bg-purple-50"
    },
    { 
      title: "Top Category", 
      value: metrics.topCategory, 
      icon: PieChart, 
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
  ], [metrics])

  // Show loading skeletons when in loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  )
})