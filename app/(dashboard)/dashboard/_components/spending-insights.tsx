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
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-900">Top spending categories</CardTitle>
          <TrendingDown className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{insight.category}</span>
                <span className="font-semibold text-gray-900 tabular-nums">{formatCurrency(insight.amount)}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#635BFF] rounded-full transition-all"
                  style={{ width: `${insight.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

