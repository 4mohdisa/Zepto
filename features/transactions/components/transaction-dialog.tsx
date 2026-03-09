'use client'

import { useEffect, useCallback, useState } from 'react'
import { invalidateMerchantsCache } from '@/hooks/use-merchants'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { dialogContent } from "@/lib/styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { transactionTypes } from "@/constants/transactiontypes"
import { useCategories } from "@/hooks/use-categories"
import { accountTypes } from "@/constants/account-types"
import { useAuth } from '@/providers'
import { useSupabaseClient } from '@/lib/supabase/client'
import { debugLogger } from '@/lib/utils/debug-logger'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { primaryButton, secondaryButton } from '@/lib/styles'
import { trackEvent, EVENT_TRANSACTION_CREATED, EVENT_TRANSACTION_UPDATED } from '@/lib/analytics'

// Simplified schema without recurring
const transactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['Income', 'Expense']),
  account_type: z.string().min(1, 'Account is required'),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  initialData?: Partial<TransactionFormValues> & { id?: number }
  onSuccess?: () => void
}

export function TransactionDialog({
  isOpen,
  onClose,
  mode = 'create',
  initialData,
  onSuccess,
}: TransactionDialogProps) {
  const { user } = useAuth()
  const supabase = useSupabaseClient()
  const { categories, loading: categoriesLoading } = useCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Expense',
      account_type: 'Checking',
      category_id: '',
      description: '',
    },
  })

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        form.reset({
          name: initialData.name || '',
          amount: initialData.amount || 0,
          date: initialData.date || format(new Date(), 'yyyy-MM-dd'),
          type: initialData.type || 'Expense',
          account_type: initialData.account_type || 'Checking',
          category_id: initialData.category_id?.toString() || '',
          description: initialData.description || '',
        })
      } else {
        form.reset({
          name: '',
          amount: 0,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'Expense',
          account_type: 'Checking',
          category_id: '',
          description: '',
        })
      }
    }
  }, [isOpen, initialData, mode, form])

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!user?.id) {
      toast.error('Please sign in')
      return
    }

    setIsSubmitting(true)

    try {
      const categoryId = Number(values.category_id)
      const selectedCategory = categories?.find(c => c.id === categoryId)

      if (!selectedCategory) {
        throw new Error('Please select a valid category')
      }

      const payload = {
        user_id: user.id,
        name: values.name,
        amount: values.amount,
        type: values.type,
        account_type: values.account_type,
        category_id: categoryId,
        category_name: selectedCategory.name,
        date: values.date,
        description: values.description || '',
        recurring_frequency: 'Never',
      }

      if (mode === 'edit' && initialData?.id) {
        // Update existing transaction
        debugLogger.info('transaction', 'Updating transaction', { id: initialData.id })
        
        const { error } = await supabase
          .from('transactions')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id)
          .eq('user_id', user.id)

        if (error) throw error
        
        // Track transaction updated
        trackEvent(EVENT_TRANSACTION_UPDATED, {
          transaction_id: initialData.id,
          type: values.type,
          has_category: !!values.category_id,
        })
        
        toast.success('Transaction updated')
      } else {
        // Create new transaction
        debugLogger.info('transaction', 'Creating transaction', { name: values.name })
        
        const { error } = await supabase
          .from('transactions')
          .insert(payload)

        if (error) throw error
        
        // Track transaction created
        trackEvent(EVENT_TRANSACTION_CREATED, {
          type: values.type,
          has_category: !!values.category_id,
          source: 'manual',
        })
        
        toast.success('Transaction created')
      }

      // Invalidate merchants cache so merchant data updates after mutation
      invalidateMerchantsCache(user.id)
      
      onSuccess?.()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast.error(mode === 'edit' ? 'Failed to update' : 'Failed to create', {
        description: message,
      })
      debugLogger.error('transaction', mode === 'edit' ? 'Update failed' : 'Create failed', { error: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${dialogContent} p-0 gap-0 overflow-hidden`}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Add Transaction' : 'Edit Transaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
          {/* Row 1: Name + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Grocery"
                {...form.register('name')}
                className="h-9 text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
                className="h-9 text-sm"
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Date + Type + Account */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                {...form.register('date')}
                className="h-9 text-sm"
              />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-medium">Type</Label>
              <Select 
                value={form.watch('type')} 
                onValueChange={(v) => form.setValue('type', v as 'Income' | 'Expense')}
              >
                <SelectTrigger id="type" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="account" className="text-xs font-medium">Account</Label>
              <Select 
                value={form.watch('account_type')} 
                onValueChange={(v) => form.setValue('account_type', v)}
              >
                <SelectTrigger id="account" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-medium">Category</Label>
            <Select 
              value={form.watch('category_id')} 
              onValueChange={(v) => form.setValue('category_id', v)}
              disabled={categoriesLoading}
            >
              <SelectTrigger id="category" className="h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-red-500">{errors.category_id.message}</p>
            )}
          </div>

          {/* Row 4: Description (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="description"
              placeholder="Add notes..."
              {...form.register('description')}
              className="h-9 text-sm"
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className={secondaryButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className={primaryButton}
              disabled={isSubmitting || categoriesLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionDialog;
