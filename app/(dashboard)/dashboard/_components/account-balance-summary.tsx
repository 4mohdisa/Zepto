"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { formatCurrency } from "@/utils/format"
import { cn } from "@/lib/utils"
import { useAccountBalances } from "@/hooks/use-account-balances"
import { Badge } from "@/components/ui/badge"

interface AccountBalanceSummaryProps {
  className?: string
}

export function AccountBalanceSummary({ className }: AccountBalanceSummaryProps) {
  const { currentBalanceSummary, totals, loading } = useAccountBalances()

  if (loading) {
    return (
      <Card className={cn("border-gray-200 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Account Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (currentBalanceSummary.length === 0) {
    return (
      <Card className={cn("border-gray-200 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Account Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No account balances recorded yet. Add your balances to track against expected amounts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-gray-200 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Account Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {currentBalanceSummary.map((summary) => {
            return (
              <div 
                key={summary.account_type} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{summary.account_type}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    From {new Date(summary.effective_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{formatCurrency(summary.income_after)}
                    </span>
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      -{formatCurrency(summary.expenses_after)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-semibold text-sm",
                    summary.current_balance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(summary.current_balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started: {formatCurrency(summary.starting_balance)}
                  </p>
                </div>
              </div>
            )
          })}
          
          {/* Total */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Total Current Balance</span>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(totals.totalCurrentBalance)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
              <div>
                <span className="text-green-600">+{formatCurrency(totals.totalIncome)}</span> income
              </div>
              <div>
                <span className="text-red-600">-{formatCurrency(totals.totalExpenses)}</span> expenses
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
