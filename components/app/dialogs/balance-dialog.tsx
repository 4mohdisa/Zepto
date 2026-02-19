'use client'

import { useState, useEffect } from 'react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { InputField, SelectField } from '../shared/form-fields'
import { LoadingButton } from '../shared/loading-button'
import { useAccountBalances } from '@/hooks'
import { accountTypes, type AccountType } from '@/data/account-types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formSchema = z.object({
  account_type: z.string().min(1, "Please select an account type"),
  current_balance: z.coerce.number().min(0, "Balance must be a positive number")
})

type FormValues = z.infer<typeof formSchema>

interface BalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BalanceDialog({ open, onOpenChange }: BalanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('add')
  
  const { 
    balances, 
    balanceSummary, 
    upsertBalance, 
    totals,
    loading 
  } = useAccountBalances()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      account_type: '',
      current_balance: 0 
    }
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        account_type: '',
        current_balance: 0
      })
    }
  }, [open, form])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await upsertBalance({
        account_type: values.account_type as AccountType,
        current_balance: values.current_balance
      })
      form.reset()
      // Don't close dialog so user can see updated summary
    } catch (error) {
      console.error('Failed to add balance:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (difference < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return "text-green-600 bg-green-50 border-green-200"
    if (difference < 0) return "text-red-600 bg-red-50 border-red-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Account Balances
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track your actual bank balances and compare with expected amounts.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add/Update Balance</TabsTrigger>
            <TabsTrigger value="summary">Balance Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <SelectField
                  control={form.control}
                  name="account_type"
                  label="Account Type"
                  placeholder="Select account type"
                  options={accountTypes.map(at => ({ 
                    value: at.value, 
                    label: at.label 
                  }))}
                />
                
                <InputField
                  control={form.control}
                  name="current_balance"
                  label="Current Balance"
                  placeholder="0.00"
                  type="number"
                />

                {/* Show existing balance for selected account type */}
                {form.watch('account_type') && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Current recorded balance:
                    </p>
                    {(() => {
                      const existingBalance = balances.find(
                        b => b.account_type === form.watch('account_type')
                      )
                      const summary = balanceSummary.find(
                        s => s.account_type === form.watch('account_type')
                      )
                      
                      if (existingBalance) {
                        return (
                          <div className="space-y-1">
                            <p className="text-lg font-semibold">
                              {formatCurrency(Number(existingBalance.current_balance))}
                            </p>
                            {summary && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  Expected: {formatCurrency(Number(summary.expected_balance))}
                                </span>
                                <Badge variant="outline" className={cn("text-xs", getDifferenceColor(Number(summary.difference)))}>
                                  {getDifferenceIcon(Number(summary.difference))}
                                  <span className="ml-1">
                                    {Number(summary.difference) > 0 ? '+' : ''}
                                    {formatCurrency(Number(summary.difference))}
                                  </span>
                                </Badge>
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      if (summary) {
                        return (
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Not recorded yet</p>
                            <p className="text-sm text-muted-foreground">
                              Expected from transactions: {formatCurrency(Number(summary.expected_balance))}
                            </p>
                          </div>
                        )
                      }
                      
                      return (
                        <p className="text-muted-foreground">
                          No transactions recorded for this account type
                        </p>
                      )
                    })()}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)} 
                    className="border-border hover:bg-hover-surface transition-colors"
                  >
                    Close
                  </Button>
                  <LoadingButton 
                    type="submit" 
                    isLoading={isSubmitting || loading} 
                    loadingText="Saving..." 
                    className="gradient-primary hover:gradient-primary-hover shadow-lg transition-all"
                  >
                    Save Balance
                  </LoadingButton>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4 mt-4">
            {balanceSummary.length > 0 ? (
              <div className="space-y-3">
                {balanceSummary.map((summary) => {
                  const balance = balances.find(b => b.account_type === summary.account_type)
                  const difference = Number(summary.difference)
                  
                  return (
                    <Card key={summary.account_type} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{summary.account_type}</h4>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Expected: {formatCurrency(Number(summary.expected_balance))}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Actual: {formatCurrency(Number(summary.actual_balance))}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={cn("text-sm px-3 py-1", getDifferenceColor(difference))}>
                              {getDifferenceIcon(difference)}
                              <span className="ml-1">
                                {difference > 0 ? '+' : ''}
                                {formatCurrency(difference)}
                              </span>
                            </Badge>
                            {balance && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Updated: {new Date(balance.last_updated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {/* Total Summary */}
                <Card className="border-border bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Expected</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(totals.totalExpected)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Actual</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(totals.totalActual)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Difference</p>
                        <p className={cn(
                          "text-lg font-semibold",
                          totals.totalDifference > 0 ? "text-green-600" : 
                          totals.totalDifference < 0 ? "text-red-600" : "text-gray-600"
                        )}>
                          {totals.totalDifference > 0 ? '+' : ''}
                          {formatCurrency(totals.totalDifference)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No account balances recorded yet.</p>
                <p className="text-sm">Add your first balance in the "Add/Update Balance" tab.</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="border-border hover:bg-hover-surface transition-colors"
              >
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
