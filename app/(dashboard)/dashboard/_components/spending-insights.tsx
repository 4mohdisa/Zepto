"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown } from 'lucide-react'
import { formatCurrency } from "@/utils/format"

interface Transaction {
  amount: number
  type: string | null
  category_name?: string | null
  date?: string | Date
  [key: string]: any
}

interface SpendingInsightsProps {
  transactions?: Transaction[]
}

export function SpendingInsights({ transactions = [] }: SpendingInsightsProps) {
  const insights = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return []
    }

    // Calculate category spending
    const categoryMap: Record<string, number> = {}
    transactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        const category = t.category_name || 'Uncategorized'
        categoryMap[category] = (categoryMap[category] || 0) + (parseFloat(String(t.amount)) || 0)
      })

    // Sort and get top 5
    const sortedCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const totalExpenses = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0)

    return sortedCategories.map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
  }, [transactions])

  if (insights.length === 0) {
    return null
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Top Spending</CardTitle>
          <div className="p-1.5 rounded-md bg-red-50">
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{insight.category}</span>
                <span className="font-semibold text-gray-900 tabular-nums">{formatCurrency(insight.amount)}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#635BFF] to-[#8B85FF] rounded-full transition-all duration-500"
                  style={{ width: `${insight.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">{insight.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

