"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Receipt, Repeat, TrendingUp, Wallet } from 'lucide-react'
import { formatCurrency } from "@/utils/format"

interface Transaction {
  amount: number
  type: string | null
  [key: string]: any
}

interface QuickStatsProps {
  transactions?: Transaction[]
}

export function QuickStats({ transactions = [] }: QuickStatsProps) {
  const stats = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalTransactions: 0,
        avgTransaction: 0,
        largestExpense: 0,
        savingsRate: 0
      }
    }

    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenseAmounts = transactions
      .filter(t => t.type === 'Expense')
      .map(t => t.amount)

    return {
      totalTransactions: transactions.length,
      avgTransaction: expenses > 0 ? expenses / expenseAmounts.length : 0,
      largestExpense: expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
    }
  }, [transactions])

  const quickStats = [
    {
      label: "Transactions",
      value: stats.totalTransactions.toString(),
      icon: Receipt,
      color: "text-blue-600"
    },
    {
      label: "Avg. expense",
      value: formatCurrency(stats.avgTransaction),
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      label: "Largest expense",
      value: formatCurrency(stats.largestExpense),
      icon: Wallet,
      color: "text-orange-600"
    },
    {
      label: "Savings rate",
      value: `${stats.savingsRate.toFixed(1)}%`,
      icon: Repeat,
      color: "text-green-600"
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {quickStats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">{stat.label}</span>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-xl font-semibold text-gray-900 tabular-nums">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

