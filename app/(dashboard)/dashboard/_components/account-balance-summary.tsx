"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from "@/utils/format"
import { cn } from "@/lib/utils"
import { useAccountBalances } from "@/hooks/use-account-balances"
import { Badge } from "@/components/ui/badge"

interface AccountBalanceSummaryProps {
  className?: string
}

export function AccountBalanceSummary({ className }: AccountBalanceSummaryProps) {
  const { balanceSummary, totals, loading } = useAccountBalances()

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

  if (balanceSummary.length === 0) {
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

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (difference < 0) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-500" />
  }

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return "text-green-600 bg-green-50 border-green-200"
    if (difference < 0) return "text-red-600 bg-red-50 border-red-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
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
          {balanceSummary.map((summary) => {
            const difference = Number(summary.difference)
            return (
              <div 
                key={summary.account_type} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{summary.account_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Expected: {formatCurrency(Number(summary.expected_balance))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(Number(summary.actual_balance))}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs mt-1", getDifferenceColor(difference))}
                  >
                    {getDifferenceIcon(difference)}
                    <span className="ml-1">
                      {difference > 0 ? '+' : ''}
                      {formatCurrency(difference)}
                    </span>
                  </Badge>
                </div>
              </div>
            )
          })}
          
          {/* Total */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Total Actual</span>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(totals.totalActual)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Total Expected (from transactions)</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totals.totalExpected)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
